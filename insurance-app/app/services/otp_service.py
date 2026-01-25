"""
OTP Service for PataBima Insurance App
Handles OTP generation, sending, verification, and validation
Production version with AWS SNS SMS delivery and PostgreSQL storage
"""
import random
import string
import logging
from datetime import timedelta
from typing import Optional, Dict, Any

from django.utils import timezone
from django.conf import settings
import phonenumbers
from phonenumbers import NumberParseException

# AWS SDK imports (only imported when ENABLE_SMS=True)
try:
    import boto3
    from botocore.exceptions import ClientError
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False
    boto3 = None
    ClientError = Exception

from app import models

logger = logging.getLogger(__name__)


class OTPService:
    """
    Centralized OTP service with AWS SNS SMS delivery and PostgreSQL storage
    """
    
    # Configuration (can be overridden in settings.py)
    OTP_LENGTH = getattr(settings, 'OTP_LENGTH', 6)
    OTP_EXPIRY_MINUTES = getattr(settings, 'OTP_EXPIRY_MINUTES', 5)
    OTP_MAX_ATTEMPTS = getattr(settings, 'OTP_MAX_ATTEMPTS', 3)
    OTP_RATE_LIMIT_WINDOW = getattr(settings, 'OTP_RATE_LIMIT_WINDOW', 5)  # minutes
    ENABLE_SMS = getattr(settings, 'ENABLE_SMS', False)  # False for local dev
    AWS_REGION = getattr(settings, 'AWS_REGION', 'us-east-1')
    
    # AWS clients (initialized on first use)
    _sns_client = None
    
    @classmethod
    def get_sns_client(cls):
        """Get or create SNS client for SMS sending"""
        if cls._sns_client is None and AWS_AVAILABLE and cls.ENABLE_SMS:
            cls._sns_client = boto3.client('sns', region_name=cls.AWS_REGION)
        return cls._sns_client
    
    @staticmethod
    def validate_kenyan_phone(phone_number: str) -> Dict[str, Any]:
        """
        Validate and normalize Kenyan phone number
        
        Args:
            phone_number: Phone number in various formats (0712345678, 712345678, +254712345678)
            
        Returns:
            dict with 'valid', 'normalized', 'international', 'error' keys
        """
        try:
            # Clean input
            cleaned = ''.join(filter(str.isdigit, str(phone_number)))
            
            # Handle different formats
            if cleaned.startswith('254'):
                # Already has country code
                international = '+' + cleaned
            elif cleaned.startswith('0') and len(cleaned) == 10:
                # 0712345678 → +254712345678
                international = '+254' + cleaned[1:]
            elif len(cleaned) == 9:
                # 712345678 → +254712345678
                international = '+254' + cleaned
            else:
                return {
                    'valid': False,
                    'error': 'Invalid phone number format. Use 0712345678 or 712345678'
                }
            
            # Validate with phonenumbers library
            parsed = phonenumbers.parse(international, 'KE')
            if not phonenumbers.is_valid_number(parsed):
                return {
                    'valid': False,
                    'error': 'Invalid Kenyan phone number'
                }
            
            # Return normalized formats
            return {
                'valid': True,
                'normalized': cleaned if cleaned.startswith('0') else '0' + cleaned,  # 0712345678
                'international': international,  # +254712345678
                'error': None
            }
            
        except NumberParseException as e:
            logger.error(f"Phone validation error: {e}")
            return {
                'valid': False,
                'error': f'Phone number parsing failed: {str(e)}'
            }
    
    @staticmethod
    def generate_otp(length: int = None) -> str:
        """
        Generate random OTP code
        
        Args:
            length: OTP length (default from settings)
            
        Returns:
            OTP code string (digits only for better UX)
        """
        length = length or OTPService.OTP_LENGTH
        return ''.join(random.choice(string.digits) for _ in range(length))
    
    @staticmethod
    def send_otp(phone_number: str, purpose: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Send OTP to phone number
        
        Args:
            phone_number: Phone number to send OTP to
            purpose: Purpose of OTP (LOGIN, CREATE_ACCOUNT, RESET_PASSWORD, VERIFY)
            user_id: Optional user ID (UUID as string)
            
        Returns:
            dict with 'success', 'message', 'otp_code' (dev only), 'error' keys
        """
        # Validate phone number
        phone_validation = OTPService.validate_kenyan_phone(phone_number)
        if not phone_validation['valid']:
            return {
                'success': False,
                'error': phone_validation['error']
            }
        
        normalized_phone = phone_validation['normalized']
        
        # Check rate limiting (max 3 OTPs per phone in last 5 minutes)
        recent_otps = models.OTPModel.objects.filter(
            user=user_id or normalized_phone,
            otp_for=purpose,
            date_created__gte=timezone.now() - timedelta(minutes=OTPService.OTP_RATE_LIMIT_WINDOW)
        ).count()
        
        if recent_otps >= OTPService.OTP_MAX_ATTEMPTS:
            return {
                'success': False,
                'error': f'Too many OTP requests. Please wait {OTPService.OTP_RATE_LIMIT_WINDOW} minutes.'
            }
        
        # Find or create OTP instance
        otp_inst, created = models.OTPModel.objects.get_or_create(
            user=user_id or normalized_phone,
            otp_for=purpose,
            defaults={
                'code': OTPService.generate_otp(),
                'expiry_time': timezone.now() + timedelta(minutes=OTPService.OTP_EXPIRY_MINUTES),
                'is_verified': False
            }
        )
        
        # If not created (already exists), update with new code
        if not created:
            otp_inst.code = OTPService.generate_otp()
            otp_inst.expiry_time = timezone.now() + timedelta(minutes=OTPService.OTP_EXPIRY_MINUTES)
            otp_inst.is_verified = False
            otp_inst.save()
        
        # Send OTP via AWS SNS or console (dev mode)
        if OTPService.ENABLE_SMS:
            # Production: AWS SNS SMS delivery (using PostgreSQL for storage, not DynamoDB)
            try:
                sns = OTPService.get_sns_client()
                
                if not sns:
                    raise Exception("AWS SNS client not available. Check boto3 installation and ENABLE_SMS setting.")
                
                # Send SMS via SNS
                message = f"Your PataBima verification code: {otp_inst.code}\n\nValid for {OTPService.OTP_EXPIRY_MINUTES} minutes.\n\nDo not share this code."
                
                response = sns.publish(
                    PhoneNumber=phone_validation['international'],
                    Message=message,
                    MessageAttributes={
                        'AWS.SNS.SMS.SenderID': {
                            'DataType': 'String',
                            'StringValue': 'PataBima'
                        },
                        'AWS.SNS.SMS.SMSType': {
                            'DataType': 'String',
                            'StringValue': 'Transactional'
                        }
                    }
                )
                
                # OTP already stored in PostgreSQL via Django OTPModel
                # No need for DynamoDB - we use RDS PostgreSQL
                
                logger.info(f"✅ SMS sent to {phone_validation['international']} via SNS (MessageId: {response.get('MessageId')})")
                
            except ClientError as e:
                error_code = e.response['Error']['Code']
                error_msg = e.response['Error']['Message']
                logger.error(f"❌ AWS SNS error sending OTP: {error_code} - {error_msg}")
                
                return {
                    'success': False,
                    'error': f'SMS delivery failed. Please try again or contact support.'
                }
            except Exception as e:
                logger.error(f"❌ Unexpected error sending OTP: {str(e)}")
                return {
                    'success': False,
                    'error': 'Failed to send OTP. Please try again.'
                }
        else:
            # Local development: print to console
            logger.info(f"\n{'='*60}")
            logger.info(f"📱 OTP for {normalized_phone} ({purpose})")
            logger.info(f"🔢 CODE: {otp_inst.code}")
            logger.info(f"⏰ Expires: {otp_inst.expiry_time.strftime('%H:%M:%S')}")
            logger.info(f"{'='*60}\n")
            print(f"\n🔐 OTP CODE: {otp_inst.code} (expires in {OTPService.OTP_EXPIRY_MINUTES} min)\n")
        
        response = {
            'success': True,
            'message': 'OTP sent successfully',
            'expires_in_minutes': OTPService.OTP_EXPIRY_MINUTES
        }
        
        # Include OTP code in dev mode for testing (NEVER in production!)
        if not OTPService.ENABLE_SMS:
            response['otp_code'] = otp_inst.code  # Only for local testing!
        
        return response
    
    @staticmethod
    def verify_otp(phone_number: str, code: str, purpose: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Verify OTP code
        
        Args:
            phone_number: Phone number to verify
            code: OTP code to verify
            purpose: Purpose of OTP (must match)
            user_id: Optional user ID (UUID as string)
            
        Returns:
            dict with 'success', 'message', 'error' keys
        """
        # Validate phone number
        phone_validation = OTPService.validate_kenyan_phone(phone_number)
        if not phone_validation['valid']:
            return {
                'success': False,
                'error': phone_validation['error']
            }
        
        normalized_phone = phone_validation['normalized']
        
        # Find OTP instance
        try:
            otp_inst = models.OTPModel.objects.get(
                user=user_id or normalized_phone,
                otp_for=purpose
            )
        except models.OTPModel.DoesNotExist:
            return {
                'success': False,
                'error': 'No OTP found. Please request a new one.'
            }
        
        # Check if already verified
        if otp_inst.is_verified:
            return {
                'success': False,
                'error': 'OTP already used. Please request a new one.'
            }
        
        # Check expiry
        if otp_inst.expiry_time and otp_inst.expiry_time < timezone.now():
            return {
                'success': False,
                'error': 'OTP expired. Please request a new one.'
            }
        
        # Verify code
        if otp_inst.code != code:
            return {
                'success': False,
                'error': 'Invalid OTP code. Please try again.'
            }
        
        # Mark as verified
        otp_inst.is_verified = True
        otp_inst.save()
        
        logger.info(f"✅ OTP verified successfully for {normalized_phone} ({purpose})")
        
        return {
            'success': True,
            'message': 'OTP verified successfully'
        }
    
    @staticmethod
    def resend_otp(phone_number: str, purpose: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Resend OTP (invalidates previous and generates new)
        
        Args:
            phone_number: Phone number to resend OTP to
            purpose: Purpose of OTP
            user_id: Optional user ID (UUID as string)
            
        Returns:
            dict with 'success', 'message', 'otp_code' (dev only), 'error' keys
        """
        # Validate phone number
        phone_validation = OTPService.validate_kenyan_phone(phone_number)
        if not phone_validation['valid']:
            return {
                'success': False,
                'error': phone_validation['error']
            }
        
        normalized_phone = phone_validation['normalized']
        
        # Check rate limiting
        recent_otps = models.OTPModel.objects.filter(
            user=user_id or normalized_phone,
            otp_for=purpose,
            date_created__gte=timezone.now() - timedelta(minutes=OTPService.OTP_RATE_LIMIT_WINDOW)
        ).count()
        
        if recent_otps >= OTPService.OTP_MAX_ATTEMPTS:
            return {
                'success': False,
                'error': f'Too many resend attempts. Please wait {OTPService.OTP_RATE_LIMIT_WINDOW} minutes.'
            }
        
        # Delete existing OTP and create new
        models.OTPModel.objects.filter(
            user=user_id or normalized_phone,
            otp_for=purpose
        ).delete()
        
        # Send new OTP
        return OTPService.send_otp(phone_number, purpose, user_id)
