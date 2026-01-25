#!/usr/bin/env python3
"""
Test DMVIC Intermediary Preview Endpoint
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
    print("DMVIC Intermediary Preview Endpoint Test")
    print("=" * 70)
    
    svc = DMVICService()
    
    # Login
    print("\n[Step 1: Login...]")
    svc.login()
    print("   Logged in successfully")
    
    # Test plate
    plate = "KBZ123A"
    print(f"\n[Step 2: Search Vehicle {plate}...]")
    
    vehicle = svc.search_vehicle(plate)
    print(f"   Vehicle: {vehicle.get('make')} {vehicle.get('model')} {vehicle.get('year_of_manufacture')}")
    
    # Prepare payload for Type A PSV certificate (Type 8)
    today = datetime.now().strftime("%d/%m/%Y")
    one_year_later = (datetime.now() + timedelta(days=365)).strftime("%d/%m/%Y")
    
    year = vehicle.get('year_of_manufacture', 2007)
    chassis = vehicle.get('chassis_number', '').replace('-', '').replace(' ', '')
    
    payload = {
        "Membercompanyid": 97218,
        "TypeOfCertificate": 8,  # PSV/Taxi (the only type that passed validation)
        "Typeofcover": 100,
        "Policyholder": "Test Client",
        "policynumber": f"TEST-PREVIEW-{plate}",
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
    
    print(f"\n[Step 3: Preview Type A Certificate...]")
    print(f"   Certificate Type: 8 (PSV/Taxi)")
    print(f"   Cover: {today} to {one_year_later}")
    
    try:
        cert = svc.load_certificate()
        url = f"{svc.base_url}/api/v6/IntermediaryIntegration/PreviewTypeACertificate"
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
        
        print(f"\n   HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success')}")
            
            if data.get('success'):
                print(f"\n   *** PREVIEW SUCCESS! ***")
                callback = data.get('callbackObj', {})
                
                # Check if we got certificate data
                cert_number = callback.get('CertificateNumber')
                cert_pdf = callback.get('CertificatePDF')
                
                if cert_number:
                    print(f"   Certificate Number: {cert_number}")
                if cert_pdf:
                    print(f"   PDF Data Length: {len(cert_pdf)} bytes")
                    print(f"   PDF Preview: {cert_pdf[:100]}...")
                
                print(f"\n   Full Response:")
                import json
                print(json.dumps(data, indent=2))
                
            else:
                errors = data.get('Error', [])
                print(f"\n   Preview failed with errors:")
                for err in errors:
                    print(f"      [{err.get('errorCode')}] {err.get('errorText')}")
        else:
            print(f"   HTTP error: {response.text[:500]}")
    except Exception as e:
        print(f"   Request error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print(f"\n{'=' * 70}")
    print("[Test Complete]")
    print("=" * 70)

if __name__ == '__main__':
    main()
