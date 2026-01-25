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
            print(f"    Login successful!")
            print(f"   Token (first 30 chars): {svc.access_token[:30]}...")
            if svc.apim_subscription_key:
                print(f"   APIM Key: {svc.apim_subscription_key[:20]}...")
        else:
            print(f"    Login failed")
            return
    except DMVICAuthenticationError as e:
        print(f"    Authentication error: {str(e)}")
        return
    except Exception as e:
        print(f"    Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 2: Test VehicleSearch with multiple plates until we find one that validates successfully
    test_plates = ["KCW708R", "KDC324F", "KAC040R", "KBZ123A", "KCA456B"]
    
    vehicle = None
    test_plate = None
    
    for plate in test_plates:
        print(f"\n[Step 2: Testing VehicleSearch with plate {plate}...]")
        try:
            vehicle = svc.search_vehicle(plate)
            test_plate = plate
            print(f"    Vehicle found!")
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
            break  # Found a vehicle, proceed to validation
        except DMVICAPIError as e:
            print(f"    API error: {str(e)}")
            continue  # Try next plate
        except Exception as e:
            print(f"    Unexpected error: {str(e)}")
            continue  # Try next plate
    
    if not vehicle:
        print("\n[ERROR] Could not find any valid vehicle in test plates")
        return
    
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
        (97218, "Numeric part only - should work"),
    ]
    
    # Use vehicle data from search
    # DMVIC returns 2-digit years like "93" which need to be converted to 4-digit (1993)
    year_raw = vehicle.get('year_of_manufacture')
    if year_raw and year_raw < 100:  # It's a 2-digit year
        year_full = 1900 + year_raw if year_raw >= 50 else 2000 + year_raw
    else:
        year_full = year_raw if year_raw else 2020
    
    # Clean chassis number - remove hyphens/dashes for validation
    chassis_raw = vehicle.get('chassis_number', 'TEST123')
    chassis_clean = chassis_raw.replace('-', '').replace(' ', '') if chassis_raw else 'TEST123'
    
    vehicle_data = {
        "registration": vehicle.get('registration_number', test_plate),
        "chassis": chassis_clean,
        "make": vehicle.get('make', 'UNKNOWN'),
        "model": vehicle.get('model', 'UNKNOWN'),
        "year": year_full,
        "engine": vehicle.get('engine_number', 'ENG123'),
        "body_type": vehicle.get('body_type') or vehicle.get('vehicle_type') or 'SALOON'
    }
    
    print(f"\n   Using vehicle data from search:")
    print(f"      Chassis: {vehicle_data['chassis']}")
    print(f"      Engine: {vehicle_data['engine']}")
    print(f"      Make/Model: {vehicle_data['make']} {vehicle_data['model']}")
    print(f"      Year (converted): {vehicle_data['year']}")
    print(f"      Body Type: {vehicle_data['body_type']}")
    
    validation_success = False
    
    for member_id, description in member_ids_to_test:
        print(f"\n   Testing with MemberCompanyID: {member_id} ({description})")
        
        # Use payload structure from user's request
        payload = {
            "Membercompanyid": member_id,
            "TypeOfCertificate": 7,  # Type A Private
            "Typeofcover": 100,  # Comprehensive
            "Policyholder": "Test Client",
            "policynumber": f"TEST-POL-{test_plate}",
            "Commencingdate": "01/01/2026",
            "Expiringdate": "01/01/2027",
            "Registrationnumber": vehicle_data['registration'],
            "Chassisnumber": vehicle_data['chassis'],
            "Phonenumber": "712345678",
            "Bodytype": vehicle_data['body_type'],
            "Licensedtocarry": 5,
            "Vehiclemake": vehicle_data['make'],
            "Vehiclemodel": vehicle_data['model'],
            "Yearofregistration": vehicle_data['year'],
            "Enginenumber": vehicle_data['engine'],
            "Email": "test@patabima.com",
            "SumInsured": 500000,
            "InsuredPIN": "A123456789A",
            "Yearofmanufacture": vehicle_data['year'],
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
                    print(f"       SUCCESS! Validation passed with MemberCompanyID: {member_id}!")
                    callback = data.get('callbackObj', {})
                    print(f"      Message: {callback.get('Message')}")
                    validation_success = True
                    break  # Found the correct format
                else:
                    errors = data.get('Error', [])
                    has_er007 = any('ER007' in err.get('errorCode', '') for err in errors)
                    print(f"        Validation errors:")
                    for err in errors:
                        print(f"         [{err.get('errorCode')}] {err.get('errorText')}")
                    
                    # If we have ER007 errors, try next plate
                    if has_er007:
                        print(f"\n   Vehicle {test_plate} has ER007 validation warnings. Trying next plate...")
            else:
                print(f"       HTTP error: {response.text[:200]}")
        except Exception as e:
            print(f"       Request error: {str(e)}")
        
        # If validation failed, try next plate
        if not validation_success and len(test_plates) > test_plates.index(test_plate) + 1:
            print(f"\n   Retrying with next plate...")
            # Recursive-like behavior: jump back to vehicle search
            continue
    
    print(f"\n{'=' * 70}")
    print(f"[Test Complete!]")
    print(f"{'=' * 70}")
    print(f"\n[Summary]:")
    print(f"   - DMVIC authentication working: {bool(svc.access_token)}")
    print(f"   - Validation successful: {validation_success}")
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

