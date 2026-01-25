#!/usr/bin/env python
"""
Test real SMS OTP delivery via AWS SNS
Run this to test with your actual phone number
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

# IMPORTANT: Enable SMS mode temporarily
os.environ['ENABLE_SMS'] = 'true'
os.environ['AWS_REGION'] = 'us-east-1'

django.setup()

from app.services.otp_service import OTPService

print("\n" + "="*70)
print("PataBima Real SMS OTP Test (AWS SNS)")
print("="*70)

# Get phone number from user
phone = input("\n📱 Enter your Kenyan phone number (e.g., 0712345678): ").strip()

if not phone:
    print("❌ Phone number required!")
    sys.exit(1)

print(f"\n🔄 Sending OTP to {phone} via AWS SNS...")
print("⏳ This will send a real SMS message to your phone.")

# Send OTP
result = OTPService.send_otp(phone, 'LOGIN')

if result['success']:
    print(f"\n✅ {result['message']}")
    print(f"⏰ OTP expires in {result['expires_in_minutes']} minutes")
    print(f"\n📱 Check your phone for the SMS!")
    
    # Get OTP code from user
    print("\n" + "-"*70)
    code = input("🔢 Enter the OTP code you received: ").strip()
    
    if code:
        # Verify OTP
        verify_result = OTPService.verify_otp(phone, code, 'LOGIN')
        
        if verify_result['success']:
            print(f"\n✅ {verify_result['message']}")
            print("🎉 SMS OTP system is working!")
        else:
            print(f"\n❌ Verification failed: {verify_result.get('error')}")
    else:
        print("\n⚠️  No code entered. Skipping verification.")
else:
    print(f"\n❌ Failed to send OTP: {result.get('error')}")
    print("\n🔍 Troubleshooting:")
    print("   1. Check AWS credentials are configured")
    print("   2. Verify SNS has permission to send SMS")
    print("   3. Check if phone number format is correct")
    print("   4. View logs for detailed error")

print("\n" + "="*70)
