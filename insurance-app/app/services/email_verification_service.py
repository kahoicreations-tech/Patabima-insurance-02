"""
AWS SES Email Verification Service
Handles sending and verifying email verification codes via AWS SES.
"""
import logging
import random
import string
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailVerificationService:
    """Service for handling email verification via AWS SES"""
    
    @staticmethod
    def generate_verification_code(length=6):
        """Generate a random verification code"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def send_verification_email(user, code, expiry_minutes=15):
        """
        Send verification email via AWS SES
        
        Args:
            user: User object
            code: Verification code
            expiry_minutes: Code expiry time in minutes
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            # Get user profile
            if hasattr(user, 'staff_user_profile'):
                profile = user.staff_user_profile
                user_name = profile.full_names or user.username
            elif hasattr(user, 'public_user_profile'):
                profile = user.public_user_profile
                user_name = profile.full_names or user.username
            else:
                user_name = user.username
            
            # Email context
            context = {
                'user_name': user_name,
                'code': code,
                'expiry_minutes': expiry_minutes,
                'support_email': settings.ADMIN_EMAIL,
            }
            
            # Render email templates
            subject = f'{settings.EMAIL_SUBJECT_PREFIX}Verify Your Email Address'
            
            # HTML email body
            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #e53935 0%, #c62828 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">PataBima</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Insurance Made Simple</p>
    </div>
    
    <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
        
        <p>Hi {user_name},</p>
        
        <p>Thank you for registering with PataBima! Please use the verification code below to verify your email address:</p>
        
        <div style="background: #f3f4f6; border-left: 4px solid #e53935; padding: 20px; margin: 30px 0; text-align: center;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Your Verification Code</div>
            <div style="font-size: 36px; font-weight: bold; color: #1f2937; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                {code}
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                Valid for {expiry_minutes} minutes
            </div>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
            <strong>Important:</strong> This code will expire in {expiry_minutes} minutes. If you didn't request this verification, please ignore this email or contact our support team.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
            This is an automated email from PataBima. Please do not reply to this email.<br>
            For support, contact us at <a href="mailto:{settings.ADMIN_EMAIL}" style="color: #e53935;">{settings.ADMIN_EMAIL}</a>
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; 2026 PataBima. All rights reserved.</p>
    </div>
</body>
</html>
            """
            
            # Plain text fallback
            plain_message = f"""
Hi {user_name},

Thank you for registering with PataBima! Please use the verification code below to verify your email address:

Your Verification Code: {code}

This code is valid for {expiry_minutes} minutes.

If you didn't request this verification, please ignore this email or contact our support team at {settings.ADMIN_EMAIL}.

---
This is an automated email from PataBima. Please do not reply.
© 2026 PataBima. All rights reserved.
            """
            
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Verification email sent successfully to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def verify_and_mark_email_verified(user):
        """
        Mark user's email as verified in their profile
        
        Args:
            user: User object
            
        Returns:
            bool: True if successfully marked as verified
        """
        try:
            if hasattr(user, 'staff_user_profile'):
                profile = user.staff_user_profile
                profile.is_email_verified = True
                profile.save(update_fields=['is_email_verified'])
                logger.info(f"Staff user {user.email} email marked as verified")
                return True
            elif hasattr(user, 'public_user_profile'):
                profile = user.public_user_profile
                profile.is_email_verified = True
                profile.save(update_fields=['is_email_verified'])
                logger.info(f"Public user {user.email} email marked as verified")
                return True
            else:
                logger.warning(f"User {user.email} has no profile to mark as verified")
                return False
        except Exception as e:
            logger.error(f"Failed to mark email as verified for {user.email}: {str(e)}")
            return False


def get_email_verification_service():
    """Factory function to get EmailVerificationService instance"""
    return EmailVerificationService()
