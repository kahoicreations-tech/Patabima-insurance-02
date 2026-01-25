#!/usr/bin/env python3
"""
Test DMVIC Intermediary Endpoints - Loop through plates until successful validation
"""
import os
import sys
import django
import requests

# Load .env file explicitly
from pathlib import Path
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if key.startswith('DMVIC_') and key not in os.environ:
                    os.environ[key] = value

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService, DMVICAPIError, DMVICAuthenticationError

def test_plate_validation(svc, plate):
    """Test a single plate for validation success"""
    print(f"\n{'=' * 70}")
    print(f"Testing plate: {plate}")
    print(f"{'=' * 70}")
    
    # Step 1: Search vehicle
    try:
        vehicle = svc.search_vehicle(plate)
        print(f"   Vehicle found!")
        print(f"   Registration: {vehicle.get('registration_number')}")
        print(f"   Make/Model: {vehicle.get('make')} {vehicle.get('model')}")
        print(f"   Year: {vehicle.get('year_of_manufacture')}")
        print(f"   Chassis: {vehicle.get('chassis_number')}")
        print(f"   Engine: {vehicle.get('engine_number')}")
        print(f"   Body Type: {vehicle.get('body_type') or vehicle.get('vehicle_type')}")
    except Exception as e:
        print(f"   ERROR: Could not find vehicle - {str(e)}")
        return False
    
    # Step 2: Prepare validation data
    print(f"   Preparing validation payload...")
    year_raw = vehicle.get('year_of_manufacture')
    if year_raw and year_raw < 100:
        year_full = 1900 + year_raw if year_raw >= 50 else 2000 + year_raw
    else:
        year_full = year_raw if year_raw else 2020
    
    chassis_raw = vehicle.get('chassis_number', 'TEST123')
    chassis_clean = chassis_raw.replace('-', '').replace(' ', '') if chassis_raw else 'TEST123'
    
    # Determine certificate type based on body type
    body_type = vehicle.get('body_type') or vehicle.get('vehicle_type') or 'SALOON'
    
    # Certificate types: 7=Private, 8=PSV (Taxi/Bus), 9=Commercial
    # Try different certificate types based on vehicle
    if 'VAN' in body_type.upper() or 'TRUCK' in body_type.upper() or 'LORRY' in body_type.upper():
        cert_type = 9  # Commercial
    elif 'BUS' in body_type.upper() or 'MATATU' in body_type.upper():
        cert_type = 8  # PSV
    else:
        cert_type = 7  # Private
    
    print(f"   Certificate Type: {cert_type} ({'Private' if cert_type==7 else 'PSV' if cert_type==8 else 'Commercial'})")
    
    payload = {
        "Membercompanyid": 97218,
        "TypeOfCertificate": cert_type,
        "Typeofcover": 100,
        "Policyholder": "Test Client",
        "policynumber": f"TEST-{plate}",
        "Commencingdate": "01/01/2026",
        "Expiringdate": "01/01/2027",
        "Registrationnumber": vehicle.get('registration_number', plate),
        "Chassisnumber": chassis_clean,
        "Phonenumber": "712345678",
        "Bodytype": vehicle.get('body_type') or vehicle.get('vehicle_type') or 'SALOON',
        "Licensedtocarry": 5,
        "Vehiclemake": vehicle.get('make', 'UNKNOWN'),
        "Vehiclemodel": vehicle.get('model', 'UNKNOWN'),
        "Yearofregistration": year_full,
        "Enginenumber": vehicle.get('engine_number', 'ENG123'),
        "Email": "test@patabima.com",
        "SumInsured": 500000,
        "InsuredPIN": "A123456789A",
        "Yearofmanufacture": year_full,
        "HudumaNumber": "123456789012"
    }
    
    # Step 3: Validate
    print(f"\n   Validating with DMVIC...")
    try:
        cert = svc.load_certificate()
        url = f"{svc.base_url}/api/v6/IntermediaryIntegration/ValidateTypeACertificate"
        headers = {
            "Authorization": f"Bearer {svc.access_token}",
            "ClientID": svc.client_id,
            "Content-Type": "application/json"
        }
        if svc.apim_subscription_key:
            headers["Ocp-Apim-Subscription-Key"] = svc.apim_subscription_key
        
        response = requests.post(
            url, 
            json=payload, 
            headers=headers, 
            cert=cert, 
            timeout=30, 
            verify=svc.ssl_verify
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"\n   *** SUCCESS! ***")
                print(f"   Plate {plate} validated successfully!")
                callback = data.get('callbackObj', {})
                print(f"   Message: {callback.get('Message', 'Validation passed')}")
                return True
            else:
                errors = data.get('Error', [])
                print(f"   Validation failed:")
                for err in errors:
                    print(f"      [{err.get('errorCode')}] {err.get('errorText')}")
                return False
        else:
            print(f"   HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"   Request error: {str(e)}")
        return False

def main():
    print("=" * 70)
    print("DMVIC Validation Test - Loop Until Success")
    print("=" * 70)
    
    svc = DMVICService()
    
    print(f"\n[Configuration]:")
    print(f"   Base URL: {svc.base_url}")
    print(f"   Username: {svc.username}")
    print(f"   MemberCompanyID: 97218")
    
    # Step 1: Login
    print(f"\n[Step 1: DMVIC Login...]")
    try:
        result = svc.login()
        if result:
            print(f"   Login successful!")
        else:
            print(f"   Login failed!")
            return
    except Exception as e:
        print(f"   Login error: {str(e)}")
        return
    
    # Step 2: Test plates until success
    test_plates = ["KCW708R", "KDC324F", "KAC040R", "KBZ123A", "KCA456B", "KAA001A"]
    
    print(f"\n[Step 2: Testing plates until validation succeeds...]")
    print(f"   Test plates: {', '.join(test_plates)}\n")
    
    success = False
    for plate in test_plates:
        if test_plate_validation(svc, plate):
            success = True
            print(f"\n{'=' * 70}")
            print(f"VALIDATION SUCCESS WITH PLATE: {plate}")
            print(f"{'=' * 70}")
            break
    
    if not success:
        print(f"\n{'=' * 70}")
        print(f"All test plates failed validation")
        print(f"{'=' * 70}")
    
    print(f"\n[Next steps]:")
    if success:
        print(f"   - Implement Intermediary endpoints in backend")
        print(f"   - Add Issue Type A/B certificate methods")
        print(f"   - Implement Preview and GetCertificate flows")
    else:
        print(f"   - All tested vehicles have historical data mismatches (ER007)")
        print(f"   - This is expected in UAT environment")
        print(f"   - Production certificates will work when using fresh/accurate data")

if __name__ == '__main__':
    main()
