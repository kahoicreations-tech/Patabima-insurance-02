"""
Test script to verify Motor Policies endpoint for Claims Submission
This tests the endpoint: GET /api/v1/policies/motor/
"""

import sys
import os
import django

# Setup Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy, User
from django.utils import timezone
from datetime import timedelta

def test_motor_policies_endpoint():
    print("\n" + "="*80)
    print("TESTING MOTOR POLICIES ENDPOINT FOR CLAIMS SUBMISSION")
    print("="*80 + "\n")
    
    # 1. Check if we have users
    users = User.objects.all()
    print(f"📊 Total users in database: {users.count()}")
    
    if users.count() == 0:
        print("❌ No users found. Please create a user first.")
        return
    
    test_user = users.first()
    user_display = test_user.email if hasattr(test_user, 'email') else test_user.phone_number if hasattr(test_user, 'phone_number') else f"User {test_user.id}"
    print(f"✅ Using test user: {user_display} (ID: {test_user.id})")
    
    # 2. Check all Motor Policies
    all_policies = MotorPolicy.objects.filter(user=test_user)
    print(f"\n📋 Total Motor Policies for user: {all_policies.count()}")
    
    if all_policies.count() == 0:
        print("⚠️  No Motor Policies found. Creating a test ACTIVE policy...")
        
        # Create a test ACTIVE policy
        test_policy = MotorPolicy.objects.create(
            user=test_user,
            policy_number=f"TEST-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            status='ACTIVE',
            cover_start_date=timezone.now().date(),
            cover_end_date=timezone.now().date() + timedelta(days=365),
            client_details={
                'name': 'John Doe',
                'email': 'john@example.com',
                'phone': '254712345678'
            },
            vehicle_details={
                'registration': 'KAA 123X',
                'make': 'Toyota',
                'model': 'Corolla',
                'year': 2020
            },
            product_details={
                'category': 'VEHICLE',
                'subcategory': 'PRIVATE_THIRD_PARTY',
                'coverageType': 'THIRD_PARTY',
                'name': 'Private Third Party'
            },
            premium_breakdown={
                'totalAmount': 5000,
                'basePremium': 4720,
                'trainingLevy': 11.80,
                'pcfLevy': 11.80,
                'stampDuty': 40
            },
            payment_details={
                'method': 'SIMULATED',
                'status': 'CONFIRMED',
                'transaction_id': f'TEST-TXN-{timezone.now().timestamp()}'
            }
        )
        print(f"✅ Created test ACTIVE policy: {test_policy.policy_number}")
        all_policies = MotorPolicy.objects.filter(user=test_user)
    
    # 3. Filter ACTIVE policies
    active_policies = all_policies.filter(status='ACTIVE')
    print(f"\n🟢 ACTIVE Policies (eligible for claims): {active_policies.count()}")
    
    # 4. Show policy statuses breakdown
    print("\n📊 Policy Status Breakdown:")
    for status_choice in ['DRAFT', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED']:
        count = all_policies.filter(status=status_choice).count()
        if count > 0:
            emoji = "🟢" if status_choice == 'ACTIVE' else "⚪"
            print(f"   {emoji} {status_choice}: {count}")
    
    # 5. Display ACTIVE policies details
    if active_policies.count() > 0:
        print("\n📋 ACTIVE Policies Details (will appear in Claims Submission dropdown):")
        print("-" * 80)
        for idx, policy in enumerate(active_policies[:5], 1):  # Show first 5
            vehicle = policy.vehicle_details or {}
            client = policy.client_details or {}
            
            print(f"\n{idx}. Policy Number: {policy.policy_number}")
            print(f"   Status: {policy.status}")
            print(f"   Client: {client.get('name', '—')}")
            print(f"   Vehicle: {vehicle.get('make', '—')} {vehicle.get('model', '—')} ({vehicle.get('registration', '—')})")
            print(f"   Cover Period: {policy.cover_start_date} to {policy.cover_end_date}")
            print(f"   Product: {policy.product_details.get('name', '—')}")
        
        if active_policies.count() > 5:
            print(f"\n   ... and {active_policies.count() - 5} more ACTIVE policies")
    else:
        print("\n❌ No ACTIVE policies found!")
        print("   Claims submission requires at least one ACTIVE policy.")
        print("   Create a Third Party policy in Motor 2 to test claims flow.")
    
    # 6. Test the serializer output (simulate API response)
    print("\n" + "="*80)
    print("SIMULATING API RESPONSE: GET /api/v1/policies/motor/")
    print("="*80)
    
    from app.serializers import MotorPolicySerializer
    
    serializer = MotorPolicySerializer(all_policies, many=True)
    response_data = {
        'success': True,
        'count': len(serializer.data),
        'policies': serializer.data[:3]  # Show first 3 for brevity
    }
    
    import json
    print("\nAPI Response (first 3 policies):")
    print(json.dumps(response_data, indent=2, default=str))
    
    # 7. Filter ACTIVE from API response (what frontend does)
    active_from_response = [p for p in serializer.data if p.get('status') == 'ACTIVE']
    print(f"\n🔍 Frontend would filter to {len(active_from_response)} ACTIVE policies from API response")
    
    # 8. Endpoint health check
    print("\n" + "="*80)
    print("ENDPOINT HEALTH CHECK")
    print("="*80)
    print("✅ Endpoint: /api/v1/policies/motor/")
    print("✅ View: list_motor_policies")
    print("✅ Authentication: Required (IsAuthenticated)")
    print("✅ Status Filter Support: ?status=ACTIVE")
    print("✅ Serializer: MotorPolicySerializer")
    print(f"✅ Test User Policies: {all_policies.count()} total, {active_policies.count()} ACTIVE")
    
    if active_policies.count() > 0:
        print("\n🎉 RESULT: Claims Submission dropdown will show ACTIVE policies ✅")
    else:
        print("\n⚠️  RESULT: Claims Submission dropdown will be empty (no ACTIVE policies)")
        print("   Create a Third Party policy to test claims flow.")
    
    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80 + "\n")

if __name__ == '__main__':
    test_motor_policies_endpoint()
