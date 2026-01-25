#!/usr/bin/env python3
"""
Test DMVIC Certificate Type Validation - Try all types on vehicle without policy history
"""
import os
import sys
import django
import requests

# Load .env file
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

from app.services.dmvic_service import DMVICService
from datetime import datetime, timedelta

def main():
    print("=" * 70)
    print("DMVIC Certificate Type Testing")
    print("=" * 70)
    
    svc = DMVICService()
    
    # Login
    print("\n[Login...]")
    svc.login()
    print("   Logged in successfully")
    
    # Test plate without policy history
    plate = "KBZ123A"
    print(f"\n[Testing plate: {plate}]")
    print("   (This vehicle has NO policy history, should accept any cert type)")
    
    vehicle = svc.search_vehicle(plate)
    print(f"   Vehicle: {vehicle.get('make')} {vehicle.get('model')} {vehicle.get('year_of_manufacture')}")
    print(f"   Policy History: {len(vehicle.get('policy_history', []))} records")
    
    # Prepare base payload
    today = datetime.now().strftime("%d/%m/%Y")
    one_year_later = (datetime.now() + timedelta(days=365)).strftime("%d/%m/%Y")
    
    year = vehicle.get('year_of_manufacture', 2007)
    chassis = vehicle.get('chassis_number', '').replace('-', '').replace(' ', '')
    
    base_payload = {
        "Membercompanyid": 97218,
        "Typeofcover": 100,
        "Policyholder": "Test Client",
        "policynumber": f"TEST-{plate}",
        "Commencingdate": today,
        "Expiringdate": one_year_later,
        "Registrationnumber": vehicle.get('registration_number', plate),
        "Chassisnumber": chassis,
        "Phonenumber": "712345678",
        "Bodytype": vehicle.get('body_type') or 'S.WAGON',
        "Licensedtocarry": 5,
        "Vehiclemake": vehicle.get('make', 'TOYOTA'),
        "Vehiclemodel": vehicle.get('model', 'NA'),
        "Yearofregistration": year,
        "Enginenumber": vehicle.get('engine_number', ''),
        "Email": "test@patabima.com",
        "SumInsured": 500000,
        "InsuredPIN": "A123456789A",
        "Yearofmanufacture": year,
        "HudumaNumber": "123456789012"
    }
    
    # Try all certificate types
    cert_types = [
        (7, "Private"),
        (8, "PSV/Taxi"),
        (9, "Commercial")
    ]
    
    cert = svc.load_certificate()
    url = f"{svc.base_url}/api/v6/IntermediaryIntegration/ValidateTypeACertificate"
    headers = {
        "Authorization": f"Bearer {svc.access_token}",
        "ClientID": svc.client_id,
        "Content-Type": "application/json"
    }
    
    print(f"\n[Testing Certificate Types...]")
    for cert_type, cert_name in cert_types:
        payload = {**base_payload, "TypeOfCertificate": cert_type}
        
        try:
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
                    print(f"\n   *** SUCCESS with Type {cert_type} ({cert_name})! ***")
                    callback = data.get('callbackObj', {})
                    print(f"   Message: {callback.get('Message', 'Validation passed')}")
                    return True
                else:
                    errors = data.get('Error', [])
                    print(f"\n   Type {cert_type} ({cert_name}): FAILED")
                    for err in errors:
                        print(f"      [{err.get('errorCode')}] {err.get('errorText')}")
            else:
                print(f"\n   Type {cert_type} ({cert_name}): HTTP {response.status_code}")
        except Exception as e:
            print(f"\n   Type {cert_type} ({cert_name}): ERROR - {str(e)}")
    
    print(f"\n{'=' * 70}")
    print("All certificate types failed for vehicle without policy history")
    print("This suggests ER001 is a UAT environment configuration issue")
    print("=" * 70)

if __name__ == '__main__':
    main()
