"""
Quick test with new sender email
"""
import os, sys, django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print(f"\nSending test email...")
print(f"From: {settings.DEFAULT_FROM_EMAIL}")
print(f"To: kahoikreations@gmail.com")

try:
    send_mail(
        subject='PataBima Test - From Custom Domain',
        message='This email is from admin@besteverdesigns.co.ke via AWS SES.\n\nThis should NOT go to spam!',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['kahoikreations@gmail.com'],
    )
    print("✅ Email sent! Check your inbox (should be in Primary, not Spam)")
except Exception as e:
    print(f"❌ Error: {e}")
    print("Make sure to verify admin@besteverdesigns.co.ke first!")
