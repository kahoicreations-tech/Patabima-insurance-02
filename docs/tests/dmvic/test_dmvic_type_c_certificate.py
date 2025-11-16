"""
Test DMVIC Type C Certificate Issuance (v5 - IssuanceTypeCCertificate)

This mirrors the Type B test but uses the Type C spec from 4.4.3 (screenshot v1.8.0):
- No TypeOfCertificate field in payload
- Registrationnumber optional
- SumInsured required only for Typeofcover=100 (COMP) or 300 (TPTF)
"""
import os
import sys
import django
import json
from datetime import datetime, timedelta

# Django setup
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy
from app.services.dmvic_service import get_dmvic_service
from app.services.dmvic_field_mapper import get_dmvic_field_mapper

BANNER = """
╔==============================================================================╗
║                    DMVIC TYPE C CERTIFICATE TEST                             ║
╚==============================================================================╝
"""


def print_section(title: str):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def create_test_policy():
    print_section("STEP 1: Creating Test Motor Policy (Type C)")
    year = datetime.now().year
    policy_number = f"POL-{year}-TESTC01"

    policy_data = {
        'policy_number': policy_number,
        'status': 'ACTIVE',
        'cover_start_date': datetime.now().date(),
        'cover_end_date': (datetime.now() + timedelta(days=365)).date(),
        'client_details': {
            'fullName': 'JOHN DOE MWANGI',
            'email': 'john.doe@example.com',
            'phone': '0711222333',
            'kra_pin': 'A123456789Z',
            'huduma_number': '123456789012',
        },
        'vehicle_details': {
            'registration': 'KCC345CTEST',
            'chassis_number': 'TESTCCHASSIS123456',
            'make': 'TOYOTA',
            'model': 'PREMIO',
            'engine_number': 'ENGC123456',
            'body_type': 'SEDAN',
            'year': 2019,
            # Sum insured omitted intentionally because Typeofcover=200 (TPO)
            'tonnage': 0,
            'passenger_capacity': 5,
        },
        'product_details': {
            'coverage_type': 'THIRD_PARTY'  # → Typeofcover = 200
        },
        'premium_breakdown': {
            'base_premium': 9000,
            'itl': 22.5,
            'pcf': 22.5,
            'stamp_duty': 40,
            'total_premium': 9085
        },
        'payment_details': {
            'method': 'MPESA',
            'transaction_id': 'TESTMPESA-C-123',
            'status': 'CONFIRMED'
        }
    }

    policy = MotorPolicy.objects.create(**policy_data)
    print(f"✅ Policy created: {policy.policy_number}")
    print(f"   Vehicle: {policy.vehicle_details['make']} {policy.vehicle_details['model']}")
    print(f"   Registration: {policy.vehicle_details['registration']}")
    print(f"   Client: {policy.client_details['fullName']}")
    print(f"   Cover Type: TPO (Type C endpoint)")
    print(f"   Cover Period: {policy.cover_start_date} to {policy.cover_end_date}")
    return policy


def test_field_mapping(policy):
    print_section("STEP 2: Testing Field Mapper (Policy → DMVIC Payload)")
    mapper = get_dmvic_field_mapper()
    policy_dict = {
        'policy_number': policy.policy_number,
        'cover_start_date': policy.cover_start_date,
        'cover_end_date': policy.cover_end_date,
        'vehicle_details': policy.vehicle_details,
        'client_details': policy.client_details,
        'product_details': policy.product_details,
        'premium_breakdown': policy.premium_breakdown
    }
    payload = mapper.map_to_type_c_payload(policy_dict)
    print("\n📤 DMVIC Type C Payload:")
    print(json.dumps(payload, indent=2))

    # Minimal required fields for Type C (per our validator)
    required_fields = [
        'Typeofcover','Policyholder','policynumber','Commencingdate','Expiringdate',
        'Chassisnumber','Phonenumber','Bodytype','Vehiclemake','Vehiclemodel','Email','InsuredPIN'
    ]
    missing = [f for f in required_fields if f not in payload or payload.get(f) in (None, "")] \
        + ([f for f in ['SumInsured'] if payload.get('Typeofcover') in (100, 300) and not payload.get('SumInsured')])

    if missing:
        print(f"\n❌ Missing required fields: {missing}")
        return None
    print("\n✅ All required fields present!")
    return payload


def test_issue(policy, payload):
    print_section("STEP 3: Issuing Type C Certificate to DMVIC (LIVE API)")
    svc = get_dmvic_service()
    print("\n🔐 Authenticating with DMVIC...")
    print(f"   Base URL: {svc.base_url}")
    print("   Endpoint: /api/v5/Integration/IssuanceTypeCCertificate")
    print("   Version: 1.8.0")

    print("\n📤 Sending certificate request...")
    print(f"   Policy Number: {payload['policynumber']}")
    reg = payload.get('Registrationnumber') or '<not provided>'
    print(f"   Vehicle: {reg}")

    try:
        res = svc.issue_type_c_certificate(payload)
        print("\n✅ API responded")
        print(json.dumps(res, indent=2))
        return res
    except Exception as e:
        print(f"\n❌ DMVIC API Error: {e}")
        return None


def main():
    print(BANNER)
    policy = create_test_policy()
    payload = test_field_mapping(policy)
    if not payload:
        print("\nAborting due to payload errors.")
        policy.delete()
        return
    _ = test_issue(policy, payload)
    print_section("CLEANUP")
    print("\n🧹 Cleaning up test data...")
    policy.delete()
    print("✅ Test data cleaned up")

if __name__ == '__main__':
    main()
