"""
Quick AWS SES Email Test
Sends a real test email via AWS SES
"""

import os
import sys
import django

# Setup Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("\n" + "="*60)
print("AWS SES - REAL EMAIL TEST")
print("="*60)
print(f"Backend: {settings.EMAIL_BACKEND}")
print(f"From: {settings.DEFAULT_FROM_EMAIL}")
print(f"Region: {settings.AWS_SES_REGION_NAME}")
print("="*60)

try:
    print("\n📧 Sending test email via AWS SES...")
    
    send_mail(
        subject='🎉 PataBima AWS SES - Test Email',
        message='Hello! This is a test email from PataBima Insurance System using AWS SES.\n\nIf you received this, AWS SES is working correctly!',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['kahoikreations@gmail.com'],
        fail_silently=False,
    )
    
    print("✅ Email sent successfully via AWS SES!")
    print(f"   Check your inbox: kahoikreations@gmail.com")
    print(f"   Sender: {settings.DEFAULT_FROM_EMAIL}")
    print("\n⚠️  Note: If sender email is not verified, check for verification email first!")
    
except Exception as e:
    print(f"❌ Error sending email: {e}")
    print("\nCommon issues:")
    print("1. Sender email not verified - Check inbox for verification email")
    print("2. Recipient email not verified (if in SES sandbox mode)")
    print("3. AWS credentials not configured")
    print(f"\nRun: aws ses get-identity-verification-attributes --identities {settings.DEFAULT_FROM_EMAIL} --region {settings.AWS_SES_REGION_NAME}")
