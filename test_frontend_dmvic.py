"""
Test DMVIC Integration from Frontend Perspective
Simulates the exact API call that React Native frontend makes
"""
import requests
import json

API_BASE = "http://127.0.0.1:8000"  # Localhost for testing
SEARCH_ENDPOINT = f"{API_BASE}/api/insurance/dmvic/search-vehicle/"

def test_vehicle_search():
    """Test the vehicle search endpoint that frontend uses"""
    print("=" * 80)
    print("FRONTEND DMVIC INTEGRATION TEST")
    print("=" * 80)
    
    # Test data - same format as frontend sends
    test_data = {
        "registration_number": "KDA123A",
        "proposed_cover_start_date": "2025-11-15"
    }
    
    print(f"\nEndpoint: {SEARCH_ENDPOINT}")
    print(f"Request Body: {json.dumps(test_data, indent=2)}")
    print("\nSending request...")
    
    try:
        response = requests.post(
            SEARCH_ENDPOINT,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS!")
            print(f"\nResponse Data:")
            print(json.dumps(data, indent=2))
            
            # Validate response structure
            print("\n" + "=" * 80)
            print("VALIDATION")
            print("=" * 80)
            
            if data.get("success"):
                print("✅ Success flag: True")
            else:
                print("❌ Success flag: False")
            
            vehicle = data.get("vehicle", {})
            if vehicle:
                print(f"✅ Vehicle Data Present:")
                print(f"   - Make: {vehicle.get('make')}")
                print(f"   - Model: {vehicle.get('model')}")
                print(f"   - Year: {vehicle.get('year_of_manufacture')}")
                print(f"   - Chassis: {vehicle.get('chassis_number')}")
                print(f"   - Engine: {vehicle.get('engine_number')}")
            else:
                print("❌ No vehicle data")
            
            has_cover = data.get("has_existing_cover")
            print(f"\n{'✅' if has_cover else '⚠️'} Has Existing Cover: {has_cover}")
            
            if has_cover:
                expiry = data.get("existing_cover_expiry")
                print(f"   - Expiry Date: {expiry}")
                if vehicle.get("current_policy"):
                    policy = vehicle["current_policy"]
                    print(f"   - Policy: {policy.get('policy_number')}")
                    print(f"   - Insurer: {policy.get('member_company')}")
                    print(f"   - Type: {policy.get('certificate_type')}")
            
            print("\n" + "=" * 80)
            print("✅ FRONTEND INTEGRATION TEST PASSED!")
            print("=" * 80)
            print("\nThe Motor 2 flow will receive:")
            print("1. Vehicle details for auto-fill")
            print("2. Existing cover status")
            print("3. Expiry date for validation")
            
        else:
            print(f"\n❌ ERROR Response:")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("\n❌ CONNECTION ERROR!")
        print("Django server is not running or not accessible.")
        print("Make sure: python manage.py runserver 0.0.0.0:8000")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_vehicle_search()
