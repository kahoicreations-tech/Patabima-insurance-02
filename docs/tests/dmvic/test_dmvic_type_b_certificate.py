"""
Test DMVIC Type B Certificate Issuance (Comprehensive)
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
║                    DMVIC TYPE B CERTIFICATE TEST                             ║
╚==============================================================================╝
"""


def print_section(title: str):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def create_test_policy():
    print_section("STEP 1: Creating Test Motor Policy (Comprehensive)")
    year = datetime.now().year
    policy_number = f"POL-{year}-TESTB01"

    policy_data = {
        'policy_number': policy_number,
        'status': 'ACTIVE',
        'cover_start_date': datetime.now().date(),
        'cover_end_date': (datetime.now() + timedelta(days=365)).date(),
        'client_details': {
            'fullName': 'JANE DOE MWANGI',
            'email': 'jane.doe@example.com',
            'phone': '0712345678',
            'kra_pin': 'A123456789Z',
            'huduma_number': '123456789012',
        },
        'vehicle_details': {
            'registration': 'KCB234BTEST',
            'chassis_number': 'TESTBCHASSIS987654',
            'make': 'TOYOTA',
            'model': 'RAV4',
            'engine_number': 'ENGB123456',
            'body_type': 'SUV',
            'year': 2019,
            'sum_insured': 1500000,
            'tonnage': 0,
            'passenger_capacity': 5,
        },
        'product_details': {
            'coverage_type': 'COMPREHENSIVE'
        },
        'premium_breakdown': {
            'base_premium': 50000,
            'itl': 125,
            'pcf': 125,
            'stamp_duty': 40,
            'total_premium': 50290
        },
        'payment_details': {
            'method': 'MPESA',
            'transaction_id': 'TESTMPESA-B-123',
            'status': 'CONFIRMED'
        }
    }

    policy = MotorPolicy.objects.create(**policy_data)
    print(f"✅ Policy created: {policy.policy_number}")
    print(f"   Vehicle: {policy.vehicle_details['make']} {policy.vehicle_details['model']}")
    print(f"   Registration: {policy.vehicle_details['registration']}")
    print(f"   Client: {policy.client_details['fullName']}")
    print(f"   Cover Type: Comprehensive (Type B)")
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
    payload = mapper.map_to_type_b_payload(policy_dict)
    print("\n📤 DMVIC Type B Payload:")
    print(json.dumps(payload, indent=2))

    required_fields = [
        'TypeOfCertificate','Typeofcover','Policyholder','policynumber',
        'Commencingdate','Expiringdate','Registrationnumber','Chassisnumber',
        'Phonenumber','Bodytype','Licensedtocarry','Vehiclemake','Vehiclemodel',
        'Enginenumber','Email','InsuredPIN','Yearofmanufacture','SumInsured'
    ]
    missing = [f for f in required_fields if f not in payload or payload.get(f) in (None, "")]
    if missing:
        print(f"\n❌ Missing required fields: {missing}")
        return None
    print("\n✅ All required fields present!")
    return payload


def test_issue(policy, payload):
    print_section("STEP 3: Issuing Type B Certificate to DMVIC (LIVE API)")
    svc = get_dmvic_service()
    print("\n🔐 Authenticating with DMVIC...")
    print(f"   Base URL: {svc.base_url}")
    print("   Endpoint: /api/v5/Integration/IssuanceTypeBCertificate")
    print("   Version: 1.8.0")

    print("\n📤 Sending certificate request...")
    print(f"   Policy Number: {payload['policynumber']}")
    print(f"   Vehicle: {payload['Registrationnumber']}")

    try:
        res = svc.issue_type_b_certificate(payload)
        print("\n✅ Certificate issued successfully!")
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
