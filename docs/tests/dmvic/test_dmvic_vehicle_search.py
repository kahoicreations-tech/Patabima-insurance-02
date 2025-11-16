"""
Test DMVIC Vehicle Search Endpoint
Test vehicle registration: KCA 234H
"""
import os
import sys
import django
import requests
from datetime import datetime

# Setup Django
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService, DMVICAPIError, DMVICAuthenticationError

def test_vehicle_search():
    """Test DMVIC vehicle search for KCA 234H"""
    
    print("\n" + "="*80)
    print("DMVIC VEHICLE SEARCH TEST")
    print("="*80)
    
    registration = "KCA 234H"  # Testing original vehicle
    print(f"\n🔍 Searching for vehicle: {registration}")
    print("-" * 80)
    
    try:
        # Initialize DMVIC service
        dmvic = DMVICService()
        
        # Test 1: Check if service is configured
        print("\n📋 Test 1: Service Configuration")
        print(f"   API Base URL: {dmvic.base_url}")
        print(f"   Username: {dmvic.username if dmvic.username else '❌ Not set'}")
        print(f"   Client ID: {dmvic.client_id if dmvic.client_id else '❌ Not set'}")
        print(f"   Member Code: {dmvic.member_code}")
        print(f"   PFX Certificate: {dmvic.pfx_path if dmvic.pfx_path else '❌ Not set'}")
        
        # Check if all required configs are present
        required_configs = [
            ('username', dmvic.username),
            ('password', dmvic.password),
            ('client_id', dmvic.client_id),
            ('pfx_path', dmvic.pfx_path),
            ('passphrase', dmvic.passphrase)
        ]
        
        missing_configs = [name for name, value in required_configs if not value]
        
        if missing_configs:
            print(f"\n❌ ERROR: Missing required configurations: {', '.join(missing_configs)}")
            print("   DMVIC integration cannot work without these settings.")
            print("\n   Required Django settings:")
            print("   - DMVIC_USERNAME")
            print("   - DMVIC_PASSWORD")
            print("   - DMVIC_CLIENT_ID")
            print("   - DMVIC_PFX_PATH (path to .pfx certificate)")
            print("   - DMVIC_PASSPHRASE (certificate password)")
            return
        
        # Test 2: Search for vehicle
        print(f"\n📋 Test 2: Vehicle Search for {registration}")
        print("   Making API request...")
        
        vehicle_data = dmvic.search_vehicle(registration)
        
        print("\n✅ Vehicle found successfully!")
        print("-" * 80)
        
        # Display all basic vehicle fields
        print("\n📊 Vehicle Data:")
        basic_fields = ['registration_number', 'chassis_number', 'make', 'model', 
                       'year_of_manufacture', 'engine_capacity', 'vehicle_type', 
                       'color', 'tonnage', 'passenger_capacity', 'owner_name', 
                       'owner_id', 'engine_number']
        
        for key in basic_fields:
            value = vehicle_data.get(key)
            print(f"   {key:.<30} {value}")
        
        # Display current cover information
        print("\n🛡️  Current Insurance Cover:")
        has_cover = vehicle_data.get('has_active_cover', False)
        if has_cover:
            current = vehicle_data.get('current_policy', {})
            print(f"   ⚠️  VEHICLE HAS ACTIVE COVER")
            print(f"   Insurer................... {current.get('member_company')}")
            print(f"   Policy Number............. {current.get('policy_number')}")
            print(f"   Cover Type................ {current.get('certificate_type')}")
            print(f"   Cover Start............... {current.get('cover_start_date')}")
            print(f"   Cover End................. {current.get('cover_end_date')}")
            print(f"   ⚠️  CHECK FOR DOUBLE INSURANCE BEFORE ISSUING NEW COVER!")
        else:
            print(f"   ✅ No active cover found - safe to issue new policy")
        
        # Display policy history
        policy_history = vehicle_data.get('policy_history', [])
        if policy_history:
            print(f"\n📜 Policy History ({len(policy_history)} records):")
            for idx, policy in enumerate(policy_history[:3], 1):  # Show latest 3
                print(f"   {idx}. {policy.get('MemberCompany')} - {policy.get('TypeOfCover')}")
                print(f"      {policy.get('CoverStartDate')} to {policy.get('CoverEndDate')}")
        
        # Test 3: Verify required fields
        print("\n📋 Test 3: Required Fields Validation")
        required_fields = [
            'registration_number',
            'make',
            'model',
            'year_of_manufacture',
            'chassis_number',
            'vehicle_type',
            'color',
            'engine_capacity'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field in vehicle_data and vehicle_data[field]:
                print(f"   ✅ {field}: {vehicle_data[field]}")
            else:
                print(f"   ❌ {field}: MISSING")
                missing_fields.append(field)
        
        if missing_fields:
            print(f"\n⚠️  Missing fields: {', '.join(missing_fields)}")
        else:
            print("\n✅ All required fields present!")
        
        # Test 4: Check field mapping
        print("\n📋 Test 4: Field Mapping to Motor 2 Format")
        mapped_data = {
            'registration': vehicle_data.get('registration_number'),
            'make': vehicle_data.get('make'),
            'model': vehicle_data.get('model'),
            'year': vehicle_data.get('year_of_manufacture'),
            'chassisNo': vehicle_data.get('chassis_number'),
            'bodyType': vehicle_data.get('vehicle_type'),
            'color': vehicle_data.get('color'),
            'engineCapacity': vehicle_data.get('engine_capacity'),
            'seatingCapacity': vehicle_data.get('passenger_capacity'),
            'tonnage': vehicle_data.get('tonnage'),
            'ownerName': vehicle_data.get('owner_name'),
            'ownerId': vehicle_data.get('owner_id'),
        }
        
        print("\n   Mapped fields for Motor 2:")
        for key, value in mapped_data.items():
            status = "✅" if value else "⚠️ "
            print(f"   {status} {key:.<25} {value}")
        
        # Test 5: Double Insurance Check
        print("\n📋 Test 5: Double Insurance Risk")
        if has_cover:
            current = vehicle_data.get('current_policy', {})
            cover_end = current.get('cover_end_date', '')
            from datetime import datetime
            try:
                end_date = datetime.strptime(cover_end, '%d/%m/%Y')
                if end_date > datetime.now():
                    print(f"   ❌ ACTIVE COVER EXISTS - DO NOT ISSUE NEW CERTIFICATE")
                    print(f"   Current cover valid until: {cover_end}")
                else:
                    print(f"   ✅ Previous cover expired on: {cover_end}")
                    print(f"   Safe to issue new cover")
            except:
                print(f"   ⚠️  Cannot parse cover end date: {cover_end}")
        else:
            print(f"   ✅ No double insurance risk - proceed with quote")
        
        # Test 6: API response time
        print("\n📋 Test 6: API Performance")
        import time
        start = time.time()
        dmvic.search_vehicle(registration)
        end = time.time()
        response_time = (end - start) * 1000
        
        print(f"   Response time: {response_time:.2f}ms")
        if response_time < 1000:
            print("   ✅ Performance: Excellent (<1s)")
        elif response_time < 3000:
            print("   ⚠️  Performance: Acceptable (1-3s)")
        else:
            print("   ❌ Performance: Slow (>3s)")
    
    except DMVICAuthenticationError as e:
        print("\n❌ AUTHENTICATION ERROR!")
        print(f"   Failed to authenticate with DMVIC API")
        print(f"   Error: {str(e)}")
        print("\n   Possible causes:")
        print("   1. Invalid username/password")
        print("   2. Invalid client_id")
        print("   3. Certificate (.pfx) not found or invalid")
        print("   4. Certificate passphrase incorrect")
    
    except DMVICAPIError as e:
        print("\n❌ DMVIC API ERROR!")
        print(f"   Error: {str(e)}")
        print("\n   Possible causes:")
        print("   1. Vehicle not found in DMVIC database")
        print("   2. Invalid registration number format")
        print("   3. DMVIC API endpoint changed")
        print("   4. Network connectivity issues")
        
    except requests.exceptions.ConnectionError as e:
        print("\n❌ CONNECTION ERROR!")
        print(f"   Cannot connect to DMVIC API: {dmvic.base_url}")
        print(f"   Error: {str(e)}")
        print("\n   Possible causes:")
        print("   1. DMVIC API is down")
        print("   2. No internet connection")
        print("   3. Firewall blocking requests")
        print("   4. Incorrect API base URL")
        
    except requests.exceptions.Timeout as e:
        print("\n❌ TIMEOUT ERROR!")
        print(f"   DMVIC API did not respond in time")
        print(f"   Error: {str(e)}")
        
    except Exception as e:
        print("\n❌ UNEXPECTED ERROR!")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        import traceback
        print("\n   Stack trace:")
        traceback.print_exc()
    
    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80 + "\n")

if __name__ == '__main__':
    test_vehicle_search()
