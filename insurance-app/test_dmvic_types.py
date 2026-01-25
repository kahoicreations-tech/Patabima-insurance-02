"""
Simplified DMVIC API testing without certificate dependency
"""
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Environment setup
DMVIC_BASE_URL = "https://uat-api.dmvic.com"
DMVIC_USERNAME = "patabimaagencyapi@dmvic.info"
DMVIC_PASSWORD = "6te224oIUP3l"
DMVIC_CLIENT_ID = "097C69C262EF4350B89E6163E1CEB397"
MEMBER_COMPANY_ID = 97218

# Login
print("="*80)
print("TESTING DMVIC LOGIN")
print("="*80)

login_payload = {
    "UserName": DMVIC_USERNAME,
    "Password": DMVIC_PASSWORD,
    "ClientId": DMVIC_CLIENT_ID
}

response = requests.post(
    f"{DMVIC_BASE_URL}/api/V1/Account/Login",
    json=login_payload,
    verify=False
)

print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    if 'token' in data:
        token = data['token']
        print(f"✅ Login successful!")
        print(f"Token (first 50 chars): {token[:50]}...")
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Test certificate preview with different types
        print("\n" + "="*80)
        print("TESTING CERTIFICATE TYPES")
        print("="*80)
        
        test_cases = [
            {
                "name": "PSV Vehicle (Type 8 - AUTHORIZED)",
                "type": 8,
                "cover": 200,
                "reg_no": "KBZ123A",
                "body": "MINIBUS",
                "seats": 14
            },
            {
                "name": "Private Vehicle Comprehensive (Type 7 - EXPECT ER001)",
                "type": 7,
                "cover": 100,
                "reg_no": "KDC324F",
                "body": "SALOON",
                "seats": 5
            },
            {
                "name": "Private Vehicle Third Party (Type 7 - EXPECT ER001)",
                "type": 7,
                "cover": 200,
                "reg_no": "KAC040R",
                "body": "PICKUP",
                "seats": 5
            },
            {
                "name": "Commercial Vehicle (Type 9 - EXPECT ER001)",
                "type": 9,
                "cover": 200,
                "reg_no": "KBX890E",
                "body": "LORRY",
                "seats": 3
            }
        ]
        
        for idx, test in enumerate(test_cases, 1):
            print(f"\n{idx}. {test['name']}")
            print("-" * 60)
            
            payload = {
                "PreviousInsurerReferenceNumber": "",
                "TypeACertificateType": test['type'],
                "TypeACoverType": test['cover'],
                "MemberCompanyId": MEMBER_COMPANY_ID,
                "AgentId": 0,
                "InsurerPolicyNumber": f"TEST-{test['reg_no']}-001",
                "CustomerName": "Test Customer",
                "CustomerIdNo": "12345678",
                "CustomerPhoneNumber": "0712345678",
                "CustomerEmailAddress": "test@example.com",
                "CustomerPostalAddress": "P.O. Box 12345, Nairobi",
                "RegNo": test['reg_no'],
                "YearOfManufacture": 2015,
                "ChassisNumber": "ABC123456789",
                "EngineNumber": "ENG12345",
                "Make": "TOYOTA",
                "Model": "TEST",
                "BodyType": test['body'],
                "Colour": "WHITE",
                "TonnageCC": 2500,
                "SeatingCapacity": test['seats'],
                "CoverStartDate": "2026-01-02T00:00:00",
                "CoverEndDate": "2027-01-02T00:00:00",
                "BasicPremium": 15000.0,
                "SumInsured": 1000000.0 if test['cover'] == 100 else 0.0,
                "TPFTLimit": 3000000.0
            }
            
            print(f"Certificate Type: {test['type']}")
            print(f"Cover Type: {test['cover']} ({'Comprehensive' if test['cover'] == 100 else 'Third Party'})")
            print(f"Vehicle: {test['reg_no']} ({test['body']})")
            
            preview_response = requests.post(
                f"{DMVIC_BASE_URL}/api/V1/IntermediaryIntegration/PreviewTypeACertificate",
                json=payload,
                headers=headers,
                verify=False
            )
            
            print(f"\nResponse Status: {preview_response.status_code}")
            
            if preview_response.status_code == 200:
                result = preview_response.json()
                if result.get('success'):
                    print(f"✅ PREVIEW GENERATED!")
                    url = result.get('callbackObj', {}).get('TypeACertificatePreviewURL', 'N/A')
                    print(f"Preview URL: {url[:80]}...")
                else:
                    errors = result.get('callbackObj', {}).get('Result', {}).get('ErrorList', [])
                    if errors:
                        print(f"❌ PREVIEW FAILED:")
                        for err in errors:
                            code = err.get('ErrorCode', 'N/A')
                            msg = err.get('ErrorMessage', 'Unknown error')
                            print(f"   • {code}: {msg}")
                    else:
                        print(f"❌ UNKNOWN ERROR: {result}")
            else:
                print(f"❌ HTTP ERROR: {preview_response.text[:200]}")
        
        # Summary
        print("\n" + "="*80)
        print("SUMMARY")
        print("="*80)
        print("""
Expected Results:
✅ Type 8 (PSV) - Should work (account authorized)
❌ Type 7 (Private) - Should fail with ER001 (not authorized)
❌ Type 9 (Commercial) - Should fail with ER001 (not authorized)

All types may show ER006 (no inventory) but preview should still generate.
        """)
        
    else:
        print(f"❌ No token in response")
        print(f"Response: {response.text}")
else:
    print(f"❌ Login failed: {response.text}")

print("\n" + "="*80)
print("TESTING COMPLETE")
print("="*80 + "\n")
