"""
Test DMVIC Preview Type A with EXACT payload from spec
"""
import os
import sys
import django

# Django setup
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService

def test_exact_payload():
    """Test with exact payload from DMVIC spec"""
    print("=" * 80)
    print("DMVIC Preview Type A - Exact Payload Test")
    print("=" * 80)
    
    # Exact payload from DMVIC spec (4.4.9.1.1)
    exact_payload = {
        "IntermediaryIRANumber": "IRA/06/051/2019",
        "TypeOfCertificate": 7,
        "Typeofcover": 100,
        "Policyholder": "SA",
        "policynumber": "SAPOL123",
        "Commencingdate": "01/01/2019",
        "Expiringdate": "08/08/2019",
        "Registrationnumber": "KPL343W",
        "Chassisnumber": "JIT123DFREW12123",
        "Phonenumber": "789789789",
        "Bodytype": "BT",
        "Licensedtocarry": 9,
        "Vehiclemake": "AUDI",
        "Vehiclemodel": "AUDI",
        "Enginenumber": "ENG123",
        "Email": "xxxxx@dmvic.info",
        "SumInsured": 100000,
        "InsuredPIN": "A123456789A",
        "Yearofmanufacture": 2019,
        "HudumaNumber": "123456789012"
    }
    
    print("\nPayload (from DMVIC spec):")
    import json
    print(json.dumps(exact_payload, indent=2))
    
    print("\n" + "=" * 80)
    print("Calling DMVIC API...")
    print("=" * 80)
    
    dmvic_service = DMVICService()
    print(f"Base URL: {dmvic_service.base_url}")
    
    try:
        result = dmvic_service.preview_type_a_certificate(exact_payload)
        
        print("\n" + "=" * 80)
        print("SUCCESS!")
        print("=" * 80)
        print(f"Preview URL: {result.get('preview_url')}")
        print(f"API Request Number: {result.get('api_request_number')}")
        print(f"Expires In: {result.get('expires_in')}")
        
    except Exception as e:
        print("\n" + "=" * 80)
        print("FAILURE")
        print("=" * 80)
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_exact_payload()
