"""
Email Preview Generator
Saves rendered email HTML to a file you can open in your browser.

Usage:
    cd insurance-app
    .\venv\Scripts\Activate.ps1
    python preview_email.py
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

from django.template.loader import render_to_string
from django.conf import settings
from datetime import datetime


def generate_policy_confirmation_preview():
    """Generate a preview of the policy confirmation email"""
    
    print("\n" + "="*60)
    print("GENERATING EMAIL PREVIEW")
    print("="*60)
    
    # Mock policy data
    context = {
        'client_name': 'John Doe',
        'policy_number': 'POL-2025-000123',
        'insurance_type': 'Motor Insurance - Comprehensive',
        'cover_start_date': '01 January 2025',
        'cover_end_date': '31 December 2025',
        'vehicle_details': True,
        'vehicle_registration': 'KBZ 123X',
        'vehicle_make_model': 'Toyota Corolla 2020',
        'base_premium': '25,000.00',
        'itl_levy': '62.50',
        'pcf_levy': '62.50',
        'stamp_duty': '40.00',
        'total_premium': '25,165.00',
        'underwriter_name': 'ABC Insurance Company Ltd',
        'underwriter_contact': '+254 700 123 456',
        'support_email': settings.ADMIN_EMAIL,
        'support_phone': '+254 700 000 000',
    }
    
    # Render template
    html_content = render_to_string('emails/policy_confirmation.html', context)
    
    # Save to file
    output_file = os.path.join(BASE_DIR, 'email_preview.html')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"\n✅ Email preview generated successfully!")
    print(f"📄 File: {output_file}")
    print(f"\n📧 Email Details:")
    print(f"   To: client@example.com")
    print(f"   From: {settings.DEFAULT_FROM_EMAIL}")
    print(f"   Subject: Policy Activated - POL-2025-000123")
    print(f"   Type: HTML Email with PataBima Branding")
    print(f"\n🌐 Open the file in your browser to preview:")
    print(f"   {output_file}")
    print("\n" + "="*60)
    
    return output_file


def generate_renewal_reminder_preview():
    """Generate a preview of a renewal reminder email"""
    
    print("\n" + "="*60)
    print("RENEWAL REMINDER EMAIL (Simple Text)")
    print("="*60)
    
    policy_number = 'POL-2025-000123'
    days_until_expiry = 30
    expiry_date = '01 February 2025'
    
    message = f"""
Dear Valued Customer,

Your insurance policy {policy_number} will expire in {days_until_expiry} days ({expiry_date}).

To avoid any coverage gaps, please contact us to renew your policy.

Contact Information:
- Email: {settings.ADMIN_EMAIL}
- Phone: +254 700 000 000

Thank you for choosing PataBima Insurance.

Best regards,
PataBima Insurance Team
    """.strip()
    
    print("\n📧 EMAIL CONTENT:")
    print("-" * 60)
    print(f"To: client@example.com")
    print(f"From: {settings.DEFAULT_FROM_EMAIL}")
    print(f"Subject: Policy Renewal Reminder - {policy_number}")
    print("-" * 60)
    print(message)
    print("-" * 60)


def main():
    """Generate email previews"""
    
    print("\n" + "="*60)
    print("PATABIMA EMAIL PREVIEW GENERATOR")
    print("="*60)
    print(f"Current Email Backend: {settings.EMAIL_BACKEND}")
    print(f"Default From Email: {settings.DEFAULT_FROM_EMAIL}")
    
    # Generate previews
    html_file = generate_policy_confirmation_preview()
    generate_renewal_reminder_preview()
    
    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)
    print(f"1. Open email_preview.html in your browser")
    print(f"2. Review the email design and content")
    print(f"3. Check that PataBima branding looks correct")
    print(f"4. Verify all policy details display properly")
    print(f"\n💡 TIP: With console backend, emails print to terminal.")
    print(f"   For REAL emails, switch to AWS SES backend.")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()
