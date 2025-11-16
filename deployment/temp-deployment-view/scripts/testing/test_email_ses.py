"""
Test Email Configuration
Run this script to test AWS SES email integration.

Usage:
    cd insurance-app
    .\venv\Scripts\Activate.ps1
    python test_email_ses.py
"""

import os
import sys
import django

# Add the project directory to the Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.template.loader import render_to_string


def test_basic_email():
    """Test basic email sending"""
    print("\n" + "="*60)
    print("TEST 1: Basic Email")
    print("="*60)
    
    try:
        send_mail(
            subject='PataBima Test Email',
            message='This is a test email from PataBima Insurance System.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['kahoikreations@gmail.com'],  # Replace with your email
            fail_silently=False,
        )
        print("✅ Basic email sent successfully!")
        print(f"   From: {settings.DEFAULT_FROM_EMAIL}")
        print(f"   Backend: {settings.EMAIL_BACKEND}")
        return True
    except Exception as e:
        print(f"❌ Error sending basic email: {e}")
        return False


def test_html_email():
    """Test HTML email with template"""
    print("\n" + "="*60)
    print("TEST 2: HTML Email with Template")
    print("="*60)
    
    try:
        # Mock policy data
        context = {
            'client_name': 'John Doe',
            'policy_number': 'POL-TEST-001',
            'insurance_type': 'Motor Insurance - Comprehensive',
            'cover_start_date': '01 January 2025',
            'cover_end_date': '31 December 2025',
            'vehicle_details': True,
            'vehicle_registration': 'KBZ 123X',
            'vehicle_make_model': 'Toyota Corolla',
            'base_premium': '25,000.00',
            'itl_levy': '62.50',
            'pcf_levy': '62.50',
            'stamp_duty': '40.00',
            'total_premium': '25,165.00',
            'underwriter_name': 'Test Underwriter Ltd',
            'underwriter_contact': '+254 700 000 000',
            'support_email': settings.ADMIN_EMAIL,
            'support_phone': '+254 700 000 000',
        }
        
        # Render template
        html_content = render_to_string('emails/policy_confirmation.html', context)
        
        # Create email
        email = EmailMessage(
            subject='Test: Policy Activated - POL-TEST-001',
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=['kahoikreations@gmail.com'],  # Replace with your email
        )
        email.content_subtype = 'html'
        
        # Send
        email.send(fail_silently=False)
        
        print("✅ HTML email sent successfully!")
        print(f"   Template: emails/policy_confirmation.html")
        print(f"   Policy Number: POL-TEST-001")
        return True
    except Exception as e:
        print(f"❌ Error sending HTML email: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_email_with_attachment():
    """Test email with PDF attachment"""
    print("\n" + "="*60)
    print("TEST 3: Email with Attachment")
    print("="*60)
    
    try:
        # Create a simple test PDF
        from io import BytesIO
        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF"
        
        email = EmailMessage(
            subject='Test: Email with PDF Attachment',
            body='This email has a test PDF attached.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=['kahoikreations@gmail.com'],  # Replace with your email
        )
        
        # Attach PDF
        email.attach('test_policy.pdf', pdf_content, 'application/pdf')
        
        # Send
        email.send(fail_silently=False)
        
        print("✅ Email with attachment sent successfully!")
        print(f"   Attachment: test_policy.pdf")
        return True
    except Exception as e:
        print(f"❌ Error sending email with attachment: {e}")
        return False


def display_configuration():
    """Display current email configuration"""
    print("\n" + "="*60)
    print("CURRENT EMAIL CONFIGURATION")
    print("="*60)
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"SERVER_EMAIL: {settings.SERVER_EMAIL}")
    
    if hasattr(settings, 'AWS_SES_REGION_NAME'):
        print(f"AWS_SES_REGION_NAME: {settings.AWS_SES_REGION_NAME}")
    
    if hasattr(settings, 'AWS_SES_AUTO_THROTTLE'):
        print(f"AWS_SES_AUTO_THROTTLE: {settings.AWS_SES_AUTO_THROTTLE}")
    
    if hasattr(settings, 'ADMIN_EMAIL'):
        print(f"ADMIN_EMAIL: {settings.ADMIN_EMAIL}")
    
    print("\nNote: If using console backend, emails will print to console.")
    print("      For AWS SES, set EMAIL_BACKEND=django_ses.SESBackend in .env")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("PATABIMA EMAIL CONFIGURATION TEST")
    print("="*60)
    
    display_configuration()
    
    print("\n" + "="*60)
    print("IMPORTANT: Update recipient email address before running!")
    print("="*60)
    print("Replace 'test@example.com' with your actual email address")
    print("in the test functions above.")
    
    response = input("\nContinue with tests? (y/n): ")
    if response.lower() != 'y':
        print("Tests cancelled.")
        return
    
    results = []
    
    # Run tests
    results.append(("Basic Email", test_basic_email()))
    results.append(("HTML Email", test_html_email()))
    results.append(("Email with Attachment", test_email_with_attachment()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST RESULTS SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        print("\n" + "="*60)
        print("CONSOLE BACKEND DETECTED")
        print("="*60)
        print("Emails are being printed to console (development mode).")
        print("\nTo use AWS SES in production:")
        print("1. Follow docs/AWS_SES_EMAIL_SETUP.md")
        print("2. Set EMAIL_BACKEND=django_ses.SESBackend in .env")
        print("3. Configure AWS credentials")


if __name__ == '__main__':
    main()
