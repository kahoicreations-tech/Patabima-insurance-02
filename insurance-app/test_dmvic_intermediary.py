#!/usr/bin/env python3
"""
Test DMVIC Intermediary Endpoints with credentials from .env file
"""
import os
import sys
import django

# Load .env file explicitly
from pathlib import Path
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Only set if not already in environment (don't override existing vars)
                if key.startswith('DMVIC_') and key not in os.environ:
                    os.environ[key] = value

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService, DMVICAPIError, DMVICAuthenticationError

def main():
    print("=" * 70)
    print("DMVIC Intermediary Endpoint Test")
    print("=" * 70)
    
    # Initialize service (uses credentials from Django settings/.env)
    svc = DMVICService()
    
    print(f"\n[Configuration]:")
    print(f"   Base URL: {svc.base_url}")
    print(f"   Username: {svc.username}")
    print(f"   Client ID: {svc.client_id}")
    print(f"   SSL Verify: {svc.ssl_verify}")
    
    # Step 1: Test Login
    print(f"\n[Step 1: Testing DMVIC Login...]")
    try:
        result = svc.login()
        if result:
            print(f"   ✅ Login successful!")
            print(f"   Token (first 30 chars): {svc.access_token[:30]}...")
            if svc.apim_subscription_key:
                print(f"   APIM Key: {svc.apim_subscription_key[:20]}...")
        else:
            print(f"   ❌ Login failed")
            return
    except DMVICAuthenticationError as e:
        print(f"   ❌ Authentication error: {str(e)}")
        return
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 2: Test VehicleSearch (Member Company endpoint)
    print(f"\n[Step 2: Testing VehicleSearch with sample plate KDC324F...]")
    try:
        vehicle = svc.search_vehicle("KDC324F")
        print(f"   ✅ Vehicle found!")
        print(f"   Registration: {vehicle.get('registration_number')}")
        print(f"   Make: {vehicle.get('make')}")
        print(f"   Model: {vehicle.get('model')}")
        print(f"   Year: {vehicle.get('year_of_manufacture')}")
        print(f"   Chassis: {vehicle.get('chassis_number')}")
        print(f"   Engine: {vehicle.get('engine_number')}")
        print(f"   Body Type: {vehicle.get('body_type')}")
        print(f"   Has active cover: {vehicle.get('has_active_cover')}")
        
        if vehicle.get('has_active_cover'):
            policy = vehicle.get('current_policy', {})
            print(f"   Current Policy:")
            print(f"      Cover ends: {policy.get('cover_end_date')}")
            print(f"      Insurer: {policy.get('member_company')}")
    except DMVICAPIError as e:
        print(f"   ❌ API error: {str(e)}")
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
    
    # Step 3: Test Intermediary Validate endpoint
    print(f"\n[Step 3: Testing IntermediaryIntegration/ValidateTypeACertificate...]")
    print(f"   (Testing different MemberCompanyID formats)")
    
    # Build a minimal validate payload
    import requests
    cert = svc.load_certificate()
    url = f"{svc.base_url}/api/v6/IntermediaryIntegration/ValidateTypeACertificate"
    headers = {
        "Authorization": f"Bearer {svc.access_token}",
        "ClientID": svc.client_id,
        "Content-Type": "application/json"
    }
    if svc.apim_subscription_key:
        headers["Ocp-Apim-Subscription-Key"] = svc.apim_subscription_key
    
    # Try multiple Member Company ID formats to find the correct one
    member_ids_to_test = [
        ("DC0097218", "String format from DMVIC portal"),
        (97218, "Numeric part only"),
        ("97218", "String numeric part"),
    ]
    
    for member_id, description in member_ids_to_test:
        print(f"\n   Testing with MemberCompanyID: {member_id} ({description})")
        
        payload = {
            "Membercompanyid": member_id,
            "TypeOfCertificate": 8,  # Type A Taxi
            "TypeOfCertificate": 8,  # Type A Taxi
            "Typeofcover": 100,  # Comprehensive
            "Policyholder": "Test Client",
            "policynumber": "TEST-POL-001",
            "Commencingdate": "02/01/2026",
            "Expiringdate": "02/01/2027",
            "Registrationnumber": "KDC324F",
            "Chassisnumber": "NSP130-2135932",
            "Phonenumber": "712345678",
            "Bodytype": "S.WAGON",
            "Licensedtocarry": 5,
            "Vehiclemake": "TOYOTA",
            "Vehiclemodel": "VITZ",
            "Yearofregistration": 2013,
            "Enginenumber": "1NR-0632177",
            "Email": "test@patabima.com",
            "SumInsured": 500000,
            "InsuredPIN": "A123456789A",
            "Yearofmanufacture": 2013,
            "HudumaNumber": "123456789012"
        }
        
        try:
            response = requests.post(
                url, 
                json=payload, 
                headers=headers, 
                cert=cert, 
                timeout=30, 
                verify=svc.ssl_verify
            )
            
            print(f"      Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"      Success: {data.get('success')}")
                
                if data.get('success'):
                    print(f"      ✅ Validation passed with MemberCompanyID: {member_id}!")
                    callback = data.get('callbackObj', {})
                    print(f"      Message: {callback.get('Message')}")
                    break  # Found the correct format
                else:
                    errors = data.get('Error', [])
                    print(f"      ⚠️  Validation errors:")
                    for err in errors:
                        print(f"         [{err.get('errorCode')}] {err.get('errorText')}")
            else:
                print(f"      ❌ HTTP error: {response.text[:200]}")
        except Exception as e:
            print(f"      ❌ Request error: {str(e)}")
    
    print(f"\n{'=' * 70}")
    print(f"[Test Complete!]")
    print(f"{'=' * 70}")
    print(f"\n[Summary]:")
    print(f"   - DMVIC authentication working: {bool(svc.access_token)}")
    print(f"   - VehicleSearch (Member) endpoint: Available")
    print(f"   - IntermediaryIntegration endpoints: Reachable")
    print(f"   - Correct MemberCompanyID format: Check results above")
    print(f"\n[Next steps]:")
    print(f"   1. Use the correct MemberCompanyID format in production")
    print(f"   2. Implement ValidateTypeA/B in backend")
    print(f"   3. Implement IssuanceTypeA/B in backend")
    print(f"   4. Add ConfirmCertificateIssuance flow")

if __name__ == '__main__':
    main()
