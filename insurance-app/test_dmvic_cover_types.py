"""
Test DMVIC Intermediary Integration with different cover types and vehicles
Tests Private (Type 7), PSV (Type 8), and Commercial (Type 9) certificates
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import get_dmvic_service
from datetime import datetime, timedelta

def test_vehicle_with_cover_type(reg_no, cover_type, body_type, vehicle_type):
    """Test vehicle with specific cover type"""
    print(f"\n{'='*80}")
    print(f"Testing: {reg_no} - {body_type} - {cover_type}")
    print(f"{'='*80}")
    
    dmvic = get_dmvic_service()
    
    # Search vehicle first
    print(f"\n1. Searching vehicle {reg_no}...")
    try:
        vehicle_result = dmvic.search_vehicle(reg_no)
        if vehicle_result.get('success'):
            vehicle = vehicle_result.get('callbackObj', {}).get('Vehicle', {})
            print(f"   ✅ Found: {vehicle.get('Make')} {vehicle.get('Model')} ({vehicle.get('YearOfManufacture')})")
            print(f"   Chassis: {vehicle.get('ChassisNumber')}")
            print(f"   Body Type: {vehicle.get('BodyType')}")
        else:
            print(f"   ❌ Vehicle not found")
            return
    except Exception as e:
        print(f"   ❌ Search failed: {str(e)}")
        return
    
    # Prepare policy data
    today = datetime.now()
    policy_data = {
        'registration_number': reg_no,
        'chassis_number': vehicle.get('ChassisNumber', 'TEST12345').replace('-', ''),
        'engine_number': vehicle.get('EngineNumber', 'ENG12345'),
        'year_of_manufacture': vehicle.get('YearOfManufacture', 2015),
        'make': vehicle.get('Make', 'TOYOTA'),
        'model': vehicle.get('Model', 'VITZ'),
        'body_type': body_type,
        'color': vehicle.get('Colour', 'WHITE'),
        'seating_capacity': vehicle.get('SeatingCapacity', 5),
        'cover_type': cover_type,
        'policy_number': f'TEST-{reg_no}-{datetime.now().strftime("%Y%m%d%H%M%S")}',
        'start_date': today,
        'end_date': today + timedelta(days=365),
        'sum_insured': 1000000 if cover_type == 'COMPREHENSIVE' else 0,
        'premium': 15000,
        'customer_name': 'Test Customer',
        'id_number': '12345678',
        'phone_number': '0712345678',
        'email': 'test@example.com',
        'postal_address': 'P.O. Box 12345, Nairobi',
    }
    
    # Determine expected certificate type
    dmvic_service = get_dmvic_service()
    cert_type = dmvic_service._determine_certificate_type(body_type, cover_type)
    cert_type_name = {7: 'Private', 8: 'PSV/Taxi', 9: 'Commercial'}
    print(f"\n2. Certificate Type: {cert_type} ({cert_type_name.get(cert_type)})")
    
    # Test Preview
    print(f"\n3. Testing Preview Generation...")
    try:
        preview_result = dmvic.preview_type_a_certificate_intermediary(policy_data)
        if preview_result['success']:
            print(f"   ✅ Preview generated successfully!")
            print(f"   Preview URL: {preview_result['preview_url'][:80]}...")
            print(f"   Certificate Type: {preview_result['certificate_type']}")
        else:
            print(f"   ❌ Preview failed:")
            for err in preview_result['errors']:
                error_code = err.get('ErrorCode', 'N/A')
                error_msg = err.get('ErrorMessage', str(err))
                print(f"      - {error_code}: {error_msg}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test Validation
    print(f"\n4. Testing Validation...")
    try:
        validate_result = dmvic.validate_type_a_certificate_intermediary(policy_data)
        if validate_result['is_valid']:
            print(f"   ✅ Validation passed")
            if validate_result['warnings']:
                print(f"   ⚠️  Warnings:")
                for warn in validate_result['warnings']:
                    print(f"      - {warn.get('ErrorCode')}: {warn.get('ErrorMessage')}")
        else:
            print(f"   ❌ Validation failed:")
            for err in validate_result['errors']:
                error_code = err.get('ErrorCode', 'N/A')
                error_msg = err.get('ErrorMessage', str(err))
                print(f"      - {error_code}: {error_msg}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    print(f"\n{'='*80}\n")

def main():
    print("\n" + "="*80)
    print("DMVIC INTERMEDIARY INTEGRATION - COVER TYPE TESTING")
    print("="*80)
    
    # Test cases from DMVIC documentation
    test_cases = [
        # Private vehicles (Type 7)
        ('KDC324F', 'COMPREHENSIVE', 'SALOON', 'Private Car'),
        ('KDC324F', 'THIRD_PARTY', 'SALOON', 'Private Car'),
        ('KAC040R', 'COMPREHENSIVE', 'PICKUP', 'Private Pickup'),
        
        # PSV vehicles (Type 8)
        ('KBZ123A', 'THIRD_PARTY', 'MINIBUS', 'PSV Matatu'),
        ('KCA567D', 'COMPREHENSIVE', 'TAXI', 'PSV Taxi'),
        
        # Commercial vehicles (Type 9)
        ('KBX890E', 'THIRD_PARTY', 'LORRY', 'Commercial Lorry'),
        ('KCE234F', 'COMPREHENSIVE', 'VAN', 'Commercial Van'),
    ]
    
    for reg_no, cover_type, body_type, vehicle_type in test_cases:
        test_vehicle_with_cover_type(reg_no, cover_type, body_type, vehicle_type)
    
    print("\n" + "="*80)
    print("TESTING COMPLETE")
    print("="*80)

if __name__ == '__main__':
    main()
