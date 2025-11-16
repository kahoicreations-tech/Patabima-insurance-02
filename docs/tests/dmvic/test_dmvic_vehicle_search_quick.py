"""
Quick test of DMVIC Vehicle Search API
"""
import os
import sys
import django

# Django setup
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService

def test_vehicle_search():
    """Test DMVIC vehicle search"""
    print("=" * 80)
    print("DMVIC Vehicle Search Test")
    print("=" * 80)
    
    # Test registration number
    test_reg = "KCA123A"
    
    print(f"\n1. Testing vehicle search for: {test_reg}")
    
    try:
        dmvic_service = DMVICService()
        print(f"  Base URL: {dmvic_service.base_url}")
        
        result = dmvic_service.search_vehicle(test_reg)
        
        print("\n" + "=" * 80)
        print("SUCCESS - Vehicle Found")
        print("=" * 80)
        print(f"Registration: {result.get('registration_number')}")
        print(f"Chassis: {result.get('chassis_number')}")
        print(f"Make: {result.get('make')}")
        print(f"Model: {result.get('model')}")
        print(f"Year: {result.get('year_of_manufacture')}")
        print(f"Type: {result.get('vehicle_type')}")
        print(f"Color: {result.get('color')}")
        print(f"Owner: {result.get('owner_name')}")
        
    except Exception as e:
        print("\n" + "=" * 80)
        print("FAILURE - Vehicle Search Failed")
        print("=" * 80)
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_vehicle_search()
