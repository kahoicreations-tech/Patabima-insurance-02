"""
Test email with tracking and alternative recipient
"""
import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.core.mail import EmailMessage
from django.conf import settings
import time

print("\n" + "="*60)
print("DETAILED EMAIL TEST WITH TRACKING")
print("="*60)

# Test 1: Send to self
print("\nTest 1: Sending email from kahoikreations@gmail.com to kahoikreations@gmail.com")
print("This might be filtered by Gmail as it sees the same sender/recipient from non-Gmail server")

try:
    msg = EmailMessage(
        subject=f'PataBima Test - {int(time.time())}',  # Unique subject
        body=f'''
        Test email sent at {time.strftime("%Y-%m-%d %H:%M:%S")}
        
        This is a test from PataBima Insurance AWS SES integration.
        
        If you receive this, AWS SES is working correctly!
        
        Message ID: {int(time.time())}
        ''',
        from_email='kahoikreations@gmail.com',
        to=['kahoikreations@gmail.com'],
        reply_to=['kahoikreations@gmail.com'],
    )
    
    result = msg.send(fail_silently=False)
    print(f"✅ Django send result: {result} message(s) sent")
    print(f"   Message ID would be in AWS SES logs")
    
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*60)
print("IMPORTANT GMAIL NOTES:")
print("="*60)
print("""
Gmail may filter emails sent from @gmail.com addresses via third-party
SMTP servers (like AWS SES) because they fail DMARC/SPF checks.

Solutions:
1. Check Gmail SPAM folder
2. Check Gmail "All Mail" folder  
3. Search Gmail for: from:kahoikreations@gmail.com
4. Use a custom domain email (noreply@patabima.co.ke) instead
5. Check AWS SES > Email sending > Suppression list

Try searching Gmail for recent emails with this timestamp: {}
""".format(int(time.time())))

print("\n" + "="*60)
print("RECOMMENDATION")
print("="*60)
print("Use noreply@patabima.co.ke as sender instead of Gmail address")
print("Gmail addresses via AWS SES often get filtered/rejected by Gmail")
