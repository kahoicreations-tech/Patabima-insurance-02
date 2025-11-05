"""
Test DMVIC Preview Type A Certificate API
Tests the PreviewTypeACertificate endpoint with proper payload structure
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService
from app.services.dmvic_field_mapper import DMVICFieldMapper
from app.models import MotorPolicy
from datetime import datetime, timedelta
from decimal import Decimal

def test_preview_type_a_certificate():
    """Test preview Type A certificate with proper payload"""
    print("=" * 80)
    print("DMVIC Preview Type A Certificate Test")
    print("=" * 80)
    
    # Create test policy data
    print("\n1. Creating test policy data...")
    policy_number = f"TEST-PREVIEW-A-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    test_policy = MotorPolicy.objects.create(
        policy_number=policy_number,
        
        # Client details as JSON
        client_details={
            "name": "Preview Test Client Ltd",
            "id_number": "A012345678B",
            "phone": "0712345678",
            "email": "preview.test@example.com",
            "kra_pin": "A012345678B",
        },
        
        # Vehicle details as JSON
        vehicle_details={
            "registration": "KDQ789P",
            "registration_number": "KDQ789P",  # Include both for compatibility
            "chassis_number": "TESTPREVIEW123456",
            "make": "TOYOTA",
            "model": "HIACE",
            "year_of_manufacture": 2020,
            "year_of_registration": 2020,
            "engine_number": "ENGPREVIEW001",
            "body_type": "VAN",
            "passenger_capacity": 14,
        },
        
        # Product details as JSON
        product_details={
            "category": "PSV",
            "subcategory": "Type A Matatu",
            "product_name": "Type A Matatu",
            "cover_type": "Comprehensive",
        },
        
        # Underwriter details
        underwriter_details={
            "code": "UW001",
            "name": "Test Underwriter",
            "intermediary_ira_number": "IRA/06/357/2019",
        },
        
        # Premium breakdown as JSON
        premium_breakdown={
            "sum_insured": 2500000.00,
            "base_premium": 75000.00,
            "itl": 187.50,
            "pcf": 187.50,
            "stamp_duty": 40.00,
            "total_premium": 75415.00,
        },
        
        # Payment details
        payment_details={
            "method": "test",
            "status": "pending",
        },
        
        # Coverage dates
        cover_start_date=datetime.now().date(),
        cover_end_date=(datetime.now() + timedelta(days=365)).date(),
        
        status="DRAFT"
    )
    
    print(f"✓ Created test policy: {test_policy.policy_number}")
    print(f"  - Vehicle: {test_policy.vehicle_details.get('registration_number')}")
    print(f"  - Chassis: {test_policy.vehicle_details.get('chassis_number')}")
    print(f"  - Product: {test_policy.product_details.get('product_name')}")
    print(f"  - Cover: {test_policy.product_details.get('cover_type')}")
    print(f"  - Sum Insured: KSh {test_policy.premium_breakdown.get('sum_insured'):,.2f}")
    
    # Map to DMVIC payload
    print("\n2. Mapping policy to DMVIC payload...")
    mapper = DMVICFieldMapper()
    
    try:
        dmvic_payload = mapper.map_policy_to_dmvic(test_policy, certificate_type="A")
        print("✓ Payload created successfully")
        print("\nPayload structure:")
        for key, value in dmvic_payload.items():
            print(f"  {key}: {value}")
        
        # Validate payload
        print("\n3. Validating payload...")
        is_valid, errors = mapper.validate_payload(dmvic_payload, certificate_type="A")
        
        if is_valid:
            print("✓ Payload validation passed")
        else:
            print("✗ Payload validation failed:")
            for error in errors:
                print(f"  - {error}")
            return
        
        # Call DMVIC Preview API
        print("\n4. Calling DMVIC Preview Type A Certificate API...")
        dmvic_service = DMVICService()
        
        # Show authentication details
        print(f"  Base URL: {dmvic_service.base_url}")
        print(f"  Endpoint: /api/v5/Integration/PreviewTypeACertificate")
        print(f"  Method: POST")
        
        result = dmvic_service.preview_type_a_certificate(dmvic_payload)
        
        print("\n" + "=" * 80)
        print("SUCCESS - Preview Certificate Generated")
        print("=" * 80)
        print(f"Preview URL: {result.get('preview_url')}")
        print(f"API Request Number: {result.get('api_request_number')}")
        print(f"Expires In: {result.get('expires_in')}")
        print("\nYou can download the preview PDF from the URL above (valid for 24 hours)")
        
    except Exception as e:
        print("\n" + "=" * 80)
        print("FAILURE - Preview Request Failed")
        print("=" * 80)
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        print("\n5. Cleaning up test data...")
        test_policy.delete()
        print("✓ Test policy deleted")
        print("\nTest completed.")

if __name__ == "__main__":
    test_preview_type_a_certificate()
