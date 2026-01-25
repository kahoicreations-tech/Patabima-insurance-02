"""
Send test email with distinctive subject
"""
import os, sys, django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
import time

timestamp = int(time.time())
subject = f'🚨 TEST EMAIL {timestamp} - PataBima Insurance'

print(f"\nSending DISTINCTIVE test email...")
print(f"From: {settings.DEFAULT_FROM_EMAIL}")
print(f"To: kahoikreations@gmail.com")
print(f"Subject: {subject}")
print(f"\nSearch Gmail for: {timestamp}")

try:
    send_mail(
        subject=subject,
        message=f'''
PATABIMA INSURANCE TEST EMAIL
=============================

Timestamp: {timestamp}
Time: {time.strftime("%Y-%m-%d %H:%M:%S")}

If you see this email, AWS SES is working perfectly!

This is sent from: {settings.DEFAULT_FROM_EMAIL}
Backend: {settings.EMAIL_BACKEND}

Search Gmail for the number: {timestamp}
        ''',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['kahoikreations@gmail.com'],
    )
    print(f"\n✅ Email sent successfully!")
    print(f"\n📧 SEARCH GMAIL FOR: {timestamp}")
    print(f"   OR search for: 🚨 TEST EMAIL")
    
except Exception as e:
    print(f"❌ Error: {e}")
