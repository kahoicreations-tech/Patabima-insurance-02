#!/usr/bin/env python
"""
Create or update test user for Motor 2 integration tests
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import User, StaffUserProfile

# Test user details
PHONE = "712345678"
PASSWORD = "testpassword123"
FULL_NAMES = "Test Agent"
AGENT_CODE = "TEST001"

# Check if user exists
user = User.objects.filter(phonenumber=PHONE).first()

if user:
    print(f"✓ User found: {user.phonenumber}")
    print(f"  Role: {user.role}")
    print(f"  Has password: {user.has_usable_password()}")
    
    # Update password if needed
    if not user.check_password(PASSWORD):
        user.set_password(PASSWORD)
        user.save()
        print(f"✓ Password updated")
    else:
        print(f"✓ Password already correct")
    
    # Ensure user is an agent
    if user.role != 'AGENT':
        user.role = 'AGENT'
        user.save()
        print(f"✓ Role updated to AGENT")
    
    # Check if StaffUserProfile exists
    profile = StaffUserProfile.objects.filter(user=user).first()
    if not profile:
        profile = StaffUserProfile.objects.create(
            user=user,
            agent_code=AGENT_CODE,
            full_names=FULL_NAMES
        )
        print(f"✓ Staff profile created with agent code: {AGENT_CODE}")
    else:
        print(f"✓ Staff profile exists with agent code: {profile.agent_code}")
    
    print(f"\n✅ Test user ready: {PHONE} / {PASSWORD}")
    
else:
    print(f"Creating new test user...")
    
    # Create user
    user = User.objects.create_user(
        phonenumber=PHONE,
        password=PASSWORD,
        role='AGENT',
        is_active=True
    )
    print(f"✓ User created: {user.phonenumber}")
    
    # Create staff profile
    profile = StaffUserProfile.objects.create(
        user=user,
        agent_code=AGENT_CODE,
        full_names=FULL_NAMES
    )
    print(f"✓ Staff profile created with agent code: {AGENT_CODE}")
    
    # Create OTP entries
    from app.models import OTPModel
    OTPModel.objects.get_or_create(
        user=str(user.id),
        otp_for='LOGIN'
    )
    print(f"✓ OTP entry created")
    
    print(f"\n✅ Test user created: {PHONE} / {PASSWORD}")

print(f"\nYou can now run the integration tests:")
print(f"  python tests/motor2_flow_integration_test.py")
