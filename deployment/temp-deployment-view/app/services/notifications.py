"""
Notification Service for Insurance Policies

Sends SMS and email notifications to clients for policy confirmations,
renewals, and other important events.
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def send_policy_sms(phone_number, policy_number, cover_start_date=None):
    """
    Send SMS notification to client confirming policy activation.
    
    Args:
        phone_number (str): Client phone number (format: 254XXXXXXXXX or +254XXXXXXXXX)
        policy_number (str): Policy number
        cover_start_date (date, optional): Policy start date
    
    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    try:
        # Format phone number to Kenya standard
        phone = format_kenya_phone(phone_number)
        
        if not phone:
            logger.error(f"Invalid phone number: {phone_number}")
            return False
        
        # Compose message
        if cover_start_date:
            start_date_str = cover_start_date.strftime('%d/%m/%Y')
            message = (
                f"PataBima: Your insurance policy {policy_number} is now ACTIVE. "
                f"Coverage starts {start_date_str}. Thank you for choosing PataBima Insurance."
            )
        else:
            message = (
                f"PataBima: Your insurance policy {policy_number} is now ACTIVE. "
                f"Thank you for choosing PataBima Insurance."
            )
        
        logger.info(f"Sending SMS to {phone}: {message}")
        
        # TODO: Integrate with actual SMS gateway (Africa's Talking, Twilio, etc.)
        # For now, just log the message
        logger.info(f"SMS sent successfully to {phone}")
        
        # Example integration with Africa's Talking:
        # from .sms_gateway import send_africas_talking_sms
        # return send_africas_talking_sms(phone, message)
        
        return True
    
    except Exception as e:
        logger.error(f"Error sending SMS to {phone_number}: {e}")
        return False


def send_policy_email(email_address, policy):
    """
    Send email notification to client with policy details and PDF attachment.
    
    Args:
        email_address (str): Client email address
        policy: MotorPolicy instance
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        from django.core.mail import EmailMessage
        from django.conf import settings
        from django.template.loader import render_to_string
        import requests
        from io import BytesIO
        
        logger.info(f"Sending policy email to {email_address}")
        
        # Get client details
        client = policy.client_details or {}
        client_name = client.get('fullName') or f"{client.get('firstName', '')} {client.get('lastName', '')}".strip() or "Valued Customer"
        
        # Get vehicle details
        vehicle = policy.vehicle_details or {}
        vehicle_registration = vehicle.get('registrationNumber', 'N/A')
        vehicle_make = vehicle.get('make', '')
        vehicle_model = vehicle.get('model', '')
        vehicle_make_model = f"{vehicle_make} {vehicle_model}".strip() or 'N/A'
        
        # Get premium breakdown
        premium_breakdown = policy.premium_breakdown or {}
        base_premium = premium_breakdown.get('base_premium', 0)
        itl_levy = premium_breakdown.get('itl_levy', 0)
        pcf_levy = premium_breakdown.get('pcf_levy', 0)
        stamp_duty = premium_breakdown.get('stamp_duty', 0)
        total_premium = policy.total_premium or 0
        
        # Get underwriter details
        underwriter = policy.underwriter_details or {}
        underwriter_name = underwriter.get('name', 'N/A')
        underwriter_contact = underwriter.get('contact', '')
        
        # Format dates
        cover_start_date = policy.cover_start_date.strftime('%d %B %Y') if policy.cover_start_date else 'N/A'
        cover_end_date = policy.cover_end_date.strftime('%d %B %Y') if policy.cover_end_date else 'N/A'
        
        # Prepare template context
        context = {
            'client_name': client_name,
            'policy_number': policy.policy_number,
            'insurance_type': f"Motor Insurance - {policy.product_name or 'Comprehensive'}",
            'cover_start_date': cover_start_date,
            'cover_end_date': cover_end_date,
            'vehicle_details': bool(vehicle_registration != 'N/A'),
            'vehicle_registration': vehicle_registration,
            'vehicle_make_model': vehicle_make_model,
            'base_premium': f"{base_premium:,.2f}",
            'itl_levy': f"{itl_levy:,.2f}" if itl_levy else None,
            'pcf_levy': f"{pcf_levy:,.2f}" if pcf_levy else None,
            'stamp_duty': f"{stamp_duty:,.2f}" if stamp_duty else None,
            'total_premium': f"{total_premium:,.2f}",
            'underwriter_name': underwriter_name,
            'underwriter_contact': underwriter_contact if underwriter_contact else None,
            'support_email': settings.ADMIN_EMAIL,
            'support_phone': '+254 700 000 000',  # TODO: Add to settings
        }
        
        # Render HTML template
        html_content = render_to_string('emails/policy_confirmation.html', context)
        
        # Email subject
        subject = f"Policy Activated - {policy.policy_number}"
        
        # Create email
        email = EmailMessage(
            subject=subject,
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_address],
        )
        email.content_subtype = 'html'
        
        # Attach PDF certificate if available
        if policy.policy_document_url:
            try:
                # Download PDF from S3
                logger.info(f"Downloading PDF from {policy.policy_document_url}")
                
                # If it's a pre-signed URL or direct S3 URL, download it
                if policy.policy_document_url.startswith('http'):
                    response = requests.get(policy.policy_document_url, timeout=30)
                    if response.status_code == 200:
                        pdf_content = BytesIO(response.content)
                        filename = f"Policy_{policy.policy_number}_Certificate.pdf"
                        email.attach(filename, pdf_content.getvalue(), 'application/pdf')
                        logger.info(f"PDF attachment added: {filename}")
                    else:
                        logger.warning(f"Failed to download PDF: HTTP {response.status_code}")
                else:
                    logger.warning(f"Invalid PDF URL format: {policy.policy_document_url}")
            except Exception as e:
                logger.error(f"Error attaching PDF: {e}")
                # Continue sending email without attachment
        
        # Send email
        email.send(fail_silently=False)
        logger.info(f"Policy confirmation email sent successfully to {email_address}")
        return True
    
    except Exception as e:
        logger.error(f"Error sending email to {email_address}: {e}")
        return False


def send_renewal_reminder(policy, days_until_expiry):
    """
    Send renewal reminder SMS and email to client.
    
    Args:
        policy: MotorPolicy instance
        days_until_expiry (int): Number of days until policy expires
    
    Returns:
        dict: Status of SMS and email sending
    """
    try:
        client = policy.client_details or {}
        phone = client.get('phone') or client.get('phoneNumber')
        email = client.get('email')
        
        # Compose renewal message
        expiry_date = policy.cover_end_date.strftime('%d/%m/%Y')
        sms_message = (
            f"PataBima: Your insurance policy {policy.policy_number} expires in {days_until_expiry} days "
            f"({expiry_date}). Renew now to avoid coverage gaps. Contact us for renewal."
        )
        
        sms_sent = False
        email_sent = False
        
        # Send SMS
        if phone:
            formatted_phone = format_kenya_phone(phone)
            if formatted_phone:
                logger.info(f"Sending renewal SMS to {formatted_phone}: {sms_message}")
                # TODO: Integrate with SMS gateway
                sms_sent = True
        
        # Send Email
        if email:
            from django.core.mail import send_mail
            from django.conf import settings
            
            client_name = client.get('fullName') or "Valued Customer"
            
            email_subject = f"PataBima Insurance - Policy Renewal Reminder"
            email_body = f"""
            Dear {client_name},
            
            This is a friendly reminder that your motor insurance policy will expire soon.
            
            Policy Number: {policy.policy_number}
            Expiry Date: {expiry_date}
            Days Remaining: {days_until_expiry}
            
            To ensure continuous coverage, please contact us to renew your policy.
            
            Best regards,
            PataBima Insurance Team
            """
            
            send_mail(
                email_subject,
                email_body,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@patabima.co.ke'),
                [email],
                fail_silently=True
            )
            
            email_sent = True
            logger.info(f"Renewal reminder email sent to {email}")
        
        return {
            'sms_sent': sms_sent,
            'email_sent': email_sent
        }
    
    except Exception as e:
        logger.error(f"Error sending renewal reminder: {e}")
        return {
            'sms_sent': False,
            'email_sent': False,
            'error': str(e)
        }


def format_kenya_phone(phone_number):
    """
    Format phone number to Kenya standard (254XXXXXXXXX) for SMS/API.
    
    Args:
        phone_number (str): Phone number in various formats
    
    Returns:
        str: Formatted phone number (254XXXXXXXXX) or None if invalid
    """
    if not phone_number:
        return None
    
    # Remove all non-digit characters
    phone = ''.join(filter(str.isdigit, str(phone_number)))
    
    # Handle different formats
    if phone.startswith('254'):
        # Already in correct format (254XXXXXXXXX)
        return phone if len(phone) == 12 else None
    elif phone.startswith('0') and len(phone) == 10:
        # Kenyan format with leading 0: 0712345678 -> 254712345678
        return '254' + phone[1:]
    elif len(phone) == 9:
        # Old 9-digit format without 0: 712345678 -> 254712345678
        return '254' + phone
    else:
        # Invalid format
        return None
