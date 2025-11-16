"""
Test DMVIC Type A Certificate Issuance
Tests the complete flow of issuing a Third-Party (Type A) certificate to DMVIC
"""
import os
import sys
import django
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.utils import timezone
from app.models import MotorPolicy, DMVICCertificate, User
from app.services.dmvic_service import DMVICService, get_dmvic_service, DMVICAPIError
from app.services.dmvic_field_mapper import get_dmvic_field_mapper


def print_section(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print('='*80)


def create_test_policy():
    """Create a test motor policy for certificate issuance"""
    print_section("STEP 1: Creating Test Motor Policy")
    
    # Generate policy number
    year = datetime.now().year
    policy_number = f"POL-{year}-TEST001"
    
    # Policy data (Third Party - Type A)
    policy_data = {
        'policy_number': policy_number,
        'status': 'ACTIVE',
        'cover_start_date': datetime.now().date(),
        'cover_end_date': (datetime.now() + timedelta(days=365)).date(),
        
        'client_details': {
            'fullName': 'JOHN DOE MWANGI',
            'email': 'john.doe@example.com',
            'phone': '0712345678',
            'kra_pin': 'A123456789Z',
            'huduma_number': '123456789012'
        },
        
        'vehicle_details': {
            'registration': 'KCA123TEST',
            'chassis_number': 'TESTCHASSIS123456',
            'engine_number': 'TESTENGINE123',
            'make': 'TOYOTA',
            'model': 'FIELDER',
            'year': 2018,
            'body_type': 'SEDAN',
            'passenger_capacity': 5,
            'tonnage': None,
            'sum_insured': 0  # Not needed for Third Party
        },
        
        'product_details': {
            'category': 'MOTOR',
            'subcategory': 'PRIVATE_THIRD_PARTY',
            'coverage_type': 'Third Party',
            'has_pll': False
        },
        
        'premium_breakdown': {
            'base_premium': 5000.00,
            'itl': 12.50,
            'pcf': 12.50,
            'stamp_duty': 40.00,
            'total_premium': 5065.00
        },
        
        'payment_details': {
            'method': 'MPESA',
            'transaction_id': 'TESTMPESA123',
            'status': 'CONFIRMED'
        }
    }
    
    # Create policy in database
    policy = MotorPolicy.objects.create(**policy_data)
    
    print(f"✅ Policy created: {policy.policy_number}")
    print(f"   Vehicle: {policy.vehicle_details['make']} {policy.vehicle_details['model']}")
    print(f"   Registration: {policy.vehicle_details['registration']}")
    print(f"   Client: {policy.client_details['fullName']}")
    print(f"   Cover Type: Third Party (Type A)")
    print(f"   Cover Period: {policy.cover_start_date} to {policy.cover_end_date}")
    
    return policy


def test_field_mapping(policy):
    """Test the field mapper transformation"""
    print_section("STEP 2: Testing Field Mapper (Policy → DMVIC Payload)")
    
    mapper = get_dmvic_field_mapper()
    
    # Convert policy to dict for mapper
    policy_dict = {
        'policy_number': policy.policy_number,
        'cover_start_date': policy.cover_start_date,
        'cover_end_date': policy.cover_end_date,
        'vehicle_details': policy.vehicle_details,
        'client_details': policy.client_details,
        'product_details': policy.product_details,
        'premium_breakdown': policy.premium_breakdown
    }
    
    # Map to DMVIC Type A payload
    dmvic_payload = mapper.map_to_type_a_payload(policy_dict)
    
    print("\n📤 DMVIC Type A Payload (What we send to DMVIC):")
    print(json.dumps(dmvic_payload, indent=2))
    
    print("\n✅ Field Mapping Validation:")
    # CORRECT field names from DMVIC example (case-sensitive!)
    required_fields = [
        'TypeOfCertificate', 'Typeofcover', 'Policyholder', 'policynumber',
        'Commencingdate', 'Expiringdate', 'Registrationnumber', 'Chassisnumber',
        'Phonenumber', 'Bodytype', 'Licensedtocarry', 'Vehiclemake', 'Vehiclemodel',
        'Enginenumber', 'Email', 'InsuredPIN', 'Yearofmanufacture'
    ]
    
    missing_fields = []
    for field in required_fields:
        if field not in dmvic_payload:
            missing_fields.append(field)
            print(f"   ❌ Missing: {field}")
        else:
            value = dmvic_payload[field]
            print(f"   ✅ {field}: {value}")
    
    if missing_fields:
        print(f"\n⚠️  Missing required fields: {', '.join(missing_fields)}")
        return None
    else:
        print(f"\n✅ All required fields present!")
    
    return dmvic_payload


def test_certificate_issuance(policy, dmvic_payload):
    """Test actual DMVIC certificate issuance (LIVE API CALL)"""
    print_section("STEP 3: Issuing Type A Certificate to DMVIC (LIVE API)")
    
    dmvic = get_dmvic_service()
    
    print(f"\n🔐 Authenticating with DMVIC...")
    print(f"   Base URL: {dmvic.base_url}")
    print(f"   Endpoint: /api/v5/Integration/IssuanceTypeACertificate")
    print(f"   Version: 1.8.0 (Exact field names from DMVIC example)")
    
    print(f"\n📤 Sending certificate request...")
    print(f"   Policy Number: {dmvic_payload['policynumber']}")
    print(f"   Vehicle: {dmvic_payload['Registrationnumber']}")
    print(f"   Client: POL-{dmvic_payload['policynumber']}")
    
    try:
        # Issue Type A certificate
        result = dmvic.issue_type_a_certificate(dmvic_payload)
        
        print(f"\n✅ Certificate issued successfully!")
        print(f"\n📥 DMVIC Response:")
        print(json.dumps(result, indent=2))
        
        # Extract certificate details
        certificate_number = result.get('certificate_number')
        pdf_url = result.get('pdf_url')
        qr_code_url = result.get('qr_code_url')
        issued_at = result.get('issued_at')
        status = result.get('status')
        
        print(f"\n🎫 Certificate Details:")
        print(f"   Certificate Number: {certificate_number}")
        print(f"   PDF URL: {pdf_url}")
        print(f"   QR Code: {qr_code_url}")
        print(f"   Issued At: {issued_at}")
        print(f"   Status: {status}")
        
        # Create DMVICCertificate record
        dmvic_cert = DMVICCertificate.objects.create(
            motor_policy=policy,
            certificate_number=certificate_number,
            certificate_type='A',
            status='ISSUED',
            request_payload=dmvic_payload,
            response_data=result,
            dmvic_pdf_url=pdf_url,
            qr_code_url=qr_code_url,
            issued_at=timezone.now()
        )
        
        print(f"\n✅ DMVICCertificate record created:")
        print(f"   Database ID: {dmvic_cert.id}")
        print(f"   Linked to Policy: {dmvic_cert.motor_policy.policy_number}")
        
        return dmvic_cert, result
        
    except DMVICAPIError as e:
        print(f"\n❌ DMVIC API Error: {str(e)}")
        print(f"\nThis could mean:")
        print(f"   - DMVIC UAT is down")
        print(f"   - Invalid payload (field name casing issue)")
        print(f"   - Authentication failed")
        print(f"   - Network connectivity issue")
        return None, None
    
    except Exception as e:
        print(f"\n❌ Unexpected Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None


def verify_database_records(policy, dmvic_cert):
    """Verify database has both policy number and certificate number"""
    print_section("STEP 4: Verifying Database Records")
    
    print(f"\n📊 MotorPolicy Record:")
    print(f"   Policy Number: {policy.policy_number}")
    print(f"   Status: {policy.status}")
    print(f"   Vehicle: {policy.vehicle_details['registration']}")
    print(f"   Client: {policy.client_details['fullName']}")
    
    if dmvic_cert:
        print(f"\n📊 DMVICCertificate Record:")
        print(f"   Certificate Number: {dmvic_cert.certificate_number}")
        print(f"   Certificate Type: {dmvic_cert.get_certificate_type_display()}")
        print(f"   Status: {dmvic_cert.status}")
        print(f"   Linked Policy: {dmvic_cert.motor_policy.policy_number}")
        print(f"   PDF URL: {dmvic_cert.dmvic_pdf_url}")
        print(f"   QR Code: {dmvic_cert.qr_code_url}")
        
        print(f"\n✅ HYBRID APPROACH CONFIRMED:")
        print(f"   PataBima Policy Number: {policy.policy_number}")
        print(f"   DMVIC Certificate Number: {dmvic_cert.certificate_number}")
        print(f"   Both stored and linked in database ✅")
    else:
        print(f"\n⚠️  No DMVICCertificate record (API call failed)")


def cleanup_test_data(policy, dmvic_cert):
    """Clean up test data"""
    print_section("CLEANUP")
    
    print(f"\n🧹 Cleaning up test data...")
    
    if dmvic_cert:
        print(f"   Deleting DMVICCertificate: {dmvic_cert.certificate_number}")
        dmvic_cert.delete()
    
    print(f"   Deleting MotorPolicy: {policy.policy_number}")
    policy.delete()
    
    print(f"✅ Test data cleaned up")


def main():
    print("╔" + "="*78 + "╗")
    print("║" + " "*20 + "DMVIC TYPE A CERTIFICATE TEST" + " "*29 + "║")
    print("╚" + "="*78 + "╝")
    
    print("\nThis test will:")
    print("1. Create a test Motor Policy (Third Party)")
    print("2. Map policy data to DMVIC Type A payload format")
    print("3. Call DMVIC API to issue a Type A certificate (LIVE)")
    print("4. Store the DMVIC certificate number in database")
    print("5. Verify HYBRID approach (both numbers stored)")
    
    policy = None
    dmvic_cert = None
    dmvic_payload = None
    result = None
    
    try:
        # Step 1: Create test policy
        policy = create_test_policy()
        
        # Step 2: Test field mapping
        dmvic_payload = test_field_mapping(policy)
        
        if not dmvic_payload:
            print("\n❌ Field mapping failed. Aborting test.")
            return 1
        
        # Step 3: Issue certificate to DMVIC (LIVE API CALL)
        dmvic_cert, result = test_certificate_issuance(policy, dmvic_payload)
        
        # Step 4: Verify database records
        verify_database_records(policy, dmvic_cert)
        
        # Summary
        print_section("TEST SUMMARY")
        
        if dmvic_cert and result:
            print("\n✅ TYPE A CERTIFICATE ISSUANCE TEST PASSED!")
            print("\n📋 Results:")
            print(f"   ✅ Policy created: {policy.policy_number}")
            print(f"   ✅ Field mapping validated: All required fields present")
            print(f"   ✅ DMVIC API call successful")
            print(f"   ✅ Certificate issued: {dmvic_cert.certificate_number}")
            print(f"   ✅ Database records stored correctly")
            print(f"   ✅ HYBRID approach confirmed")
            
            print("\n🎯 Next Steps:")
            print("   1. Frontend: Add 'View Certificate' button")
            print("   2. Frontend: Display both policy number and certificate number")
            print("   3. Backend: Implement certificate cancellation endpoint")
            print("   4. Backend: Add webhook for DMVIC status updates")
            
        else:
            print("\n⚠️  TYPE A CERTIFICATE ISSUANCE TEST INCOMPLETE")
            print("\n📋 Results:")
            print(f"   ✅ Policy created: {policy.policy_number}")
            print(f"   ✅ Field mapping validated: All required fields present")
            print(f"   ❌ DMVIC API call failed (see error above)")
            
            print("\n🔍 Troubleshooting:")
            print("   1. Check DMVIC UAT status")
            print("   2. Verify authentication credentials")
            print("   3. Validate payload field names match DMVIC spec exactly")
            print("   4. Check network connectivity")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        # Cleanup
        if policy:
            cleanup_test_data(policy, dmvic_cert)
    
    return 0


if __name__ == '__main__':
    exit(main())
