"""
Test DMVIC Vehicle Search with Raw Response Logging
Test vehicle registration: KCA 234H
"""
import os
import sys
import django
import logging

# Setup Django
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

def test_raw_response():
    """Test DMVIC and show raw API response"""
    
    print("\n" + "="*80)
    print("DMVIC RAW RESPONSE TEST")
    print("="*80)
    
    registration = "KCA234H"  # No space
    
    try:
        dmvic = DMVICService()
        
        print(f"\n🔍 Searching for: {registration}")
        print(f"   API Endpoint: {dmvic.base_url}/api/v5/Integration/VehicleSearch")
        print(f"   Authenticating...")
        
        # Call the internal method to see raw response
        response = dmvic._make_authenticated_request(
            endpoint='/api/v5/Integration/VehicleSearch',
            method='POST',
            data={"registration_number": registration}
        )
        
        print("\n📊 RAW API RESPONSE:")
        print("="*80)
        import json
        print(json.dumps(response, indent=2))
        print("="*80)
        
        # Now test the public method
        print("\n\n📋 PROCESSED VEHICLE DATA:")
        print("="*80)
        vehicle_data = dmvic.search_vehicle(registration)
        print(json.dumps(vehicle_data, indent=2))
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_raw_response()
