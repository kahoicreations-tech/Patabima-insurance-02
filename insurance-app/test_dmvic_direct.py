"""
Direct DMVIC API testing with proper error handling
"""
import os
import requests
from pathlib import Path
from cryptography.hazmat.primitives.serialization import pkcs12

# Environment setup
DMVIC_BASE_URL = "https://uat-api.dmvic.com"
DMVIC_USERNAME = "patabimaagencyapi@dmvic.info"
DMVIC_PASSWORD = "6te224oIUP3l"
DMVIC_CLIENT_ID = "097C69C262EF4350B89E6163E1CEB397"
MEMBER_COMPANY_ID = 97218

# Certificate path
cert_path = Path(__file__).parent / 'dmvic_credentials' / 'PatabimaAgencyUAT.pfx'

print(f"\nCertificate path: {cert_path}")
print(f"Certificate exists: {cert_path.exists()}\n")

# Load certificate
with open(cert_path, 'rb') as f:
    cert_data = f.read()

private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
    cert_data,
    password=b''  # Empty password
)
print("✅ Certificate loaded\n")

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
print(f"Response: {response.text[:500]}")

if response.status_code == 200:
    data = response.json()
    if 'token' in data:
        token = data['token']
        print(f"\n✅ Login successful!")
        print(f"Token (first 50 chars): {token[:50]}...")
        
        # Test vehicle search
        print("\n" + "="*80)
        print("TESTING VEHICLE SEARCH")
        print("="*80)
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        test_vehicles = ['KDC324F', 'KBZ123A', 'KAC040R']
        
        for reg_no in test_vehicles:
            print(f"\nSearching: {reg_no}")
            search_payload = {"RegNo": reg_no}
            
            search_response = requests.post(
                f"{DMVIC_BASE_URL}/api/V1/IntermediaryIntegration/VehicleSearch",
                json=search_payload,
                headers=headers,
                verify=False
            )
            
            print(f"Status: {search_response.status_code}")
            if search_response.status_code == 200:
                result = search_response.json()
                if result.get('success'):
                    vehicle = result.get('callbackObj', {}).get('Vehicle', {})
                    print(f"✅ {vehicle.get('Make')} {vehicle.get('Model')} - {vehicle.get('BodyType')}")
                else:
                    print(f"❌ {result.get('errorMessage', 'Unknown error')}")
            else:
                print(f"❌ HTTP Error: {search_response.text[:200]}")
        
        # Test certificate preview
        print("\n" + "="*80)
        print("TESTING CERTIFICATE PREVIEW")
        print("="*80)
        
        # Test PSV (Type 8) - should work
        print("\n1. PSV Vehicle (Type 8) - SHOULD WORK")
        psv_payload = {
            "PreviousInsurerReferenceNumber": "",
            "TypeACertificateType": 8,
            "TypeACoverType": 200,  # Third Party
            "MemberCompanyId": MEMBER_COMPANY_ID,
            "AgentId": 0,
            "InsurerPolicyNumber": "TEST-PSV-001",
            "CustomerName": "Test PSV Customer",
            "CustomerIdNo": "12345678",
            "CustomerPhoneNumber": "0712345678",
            "CustomerEmailAddress": "test@example.com",
            "CustomerPostalAddress": "P.O. Box 12345, Nairobi",
            "RegNo": "KBZ123A",
            "YearOfManufacture": 2015,
            "ChassisNumber": "ABC123456789",
            "EngineNumber": "ENG12345",
            "Make": "TOYOTA",
            "Model": "HIACE",
            "BodyType": "MINIBUS",
            "Colour": "WHITE",
            "TonnageCC": 2500,
            "SeatingCapacity": 14,
            "CoverStartDate": "2026-01-02T00:00:00",
            "CoverEndDate": "2027-01-02T00:00:00",
            "BasicPremium": 15000.0,
            "SumInsured": 0.0,
            "TPFTLimit": 3000000.0
        }
        
        preview_response = requests.post(
            f"{DMVIC_BASE_URL}/api/V1/IntermediaryIntegration/PreviewTypeACertificate",
            json=psv_payload,
            headers=headers,
            verify=False
        )
        
        print(f"Status: {preview_response.status_code}")
        if preview_response.status_code == 200:
            result = preview_response.json()
            if result.get('success'):
                print(f"✅ Preview generated!")
                print(f"URL: {result.get('callbackObj', {}).get('TypeACertificatePreviewURL', 'N/A')[:80]}...")
            else:
                errors = result.get('callbackObj', {}).get('Result', {}).get('ErrorList', [])
                print(f"❌ Preview failed:")
                for err in errors:
                    print(f"   - {err.get('ErrorCode')}: {err.get('ErrorMessage')}")
        else:
            print(f"❌ HTTP Error: {preview_response.text[:200]}")
        
        # Test Private (Type 7) - should fail with ER001
        print("\n2. Private Vehicle (Type 7) - EXPECT ER001")
        private_payload = psv_payload.copy()
        private_payload.update({
            "TypeACertificateType": 7,
            "TypeACoverType": 100,  # Comprehensive
            "RegNo": "KDC324F",
            "BodyType": "SALOON",
            "SeatingCapacity": 5,
            "InsurerPolicyNumber": "TEST-PRIVATE-001",
            "SumInsured": 1000000.0
        })
        
        preview_response = requests.post(
            f"{DMVIC_BASE_URL}/api/V1/IntermediaryIntegration/PreviewTypeACertificate",
            json=private_payload,
            headers=headers,
            verify=False
        )
        
        print(f"Status: {preview_response.status_code}")
        if preview_response.status_code == 200:
            result = preview_response.json()
            if result.get('success'):
                print(f"✅ Preview generated!")
            else:
                errors = result.get('callbackObj', {}).get('Result', {}).get('ErrorList', [])
                print(f"❌ Preview failed:")
                for err in errors:
                    print(f"   - {err.get('ErrorCode')}: {err.get('ErrorMessage')}")
        else:
            print(f"❌ HTTP Error: {preview_response.text[:200]}")
        
        # Test Commercial (Type 9) - should fail with ER001
        print("\n3. Commercial Vehicle (Type 9) - EXPECT ER001")
        commercial_payload = psv_payload.copy()
        commercial_payload.update({
            "TypeACertificateType": 9,
            "TypeACoverType": 200,  # Third Party
            "RegNo": "KBX890E",
            "BodyType": "LORRY",
            "SeatingCapacity": 3,
            "InsurerPolicyNumber": "TEST-COMMERCIAL-001"
        })
        
        preview_response = requests.post(
            f"{DMVIC_BASE_URL}/api/V1/IntermediaryIntegration/PreviewTypeACertificate",
            json=commercial_payload,
            headers=headers,
            verify=False
        )
        
        print(f"Status: {preview_response.status_code}")
        if preview_response.status_code == 200:
            result = preview_response.json()
            if result.get('success'):
                print(f"✅ Preview generated!")
            else:
                errors = result.get('callbackObj', {}).get('Result', {}).get('ErrorList', [])
                print(f"❌ Preview failed:")
                for err in errors:
                    print(f"   - {err.get('ErrorCode')}: {err.get('ErrorMessage')}")
        else:
            print(f"❌ HTTP Error: {preview_response.text[:200]}")
        
    else:
        print(f"\n❌ No token in response")
        print(f"Response data: {data}")
else:
    print(f"\n❌ Login failed: {response.text}")

print("\n" + "="*80)
print("TESTING COMPLETE")
print("="*80 + "\n")
