"""
Email Verification Views
Handles sending and verifying email verification codes via AWS SES.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from app.models import EmailVerificationCode
from app.services.email_verification_service import get_email_verification_service
import logging

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Extract client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_email_verification(request):
    """
    Send email verification code to authenticated user
    
    POST /api/auth/email/send-verification/
    
    Returns:
        200: Verification code sent successfully
        400: Invalid request (no email, rate limit exceeded)
        500: Failed to send email
    """
    user = request.user
    
    # Check if user has an email
    if not user.email:
        return Response({
            "success": False,
            "error": "No email address associated with this account"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email is already verified
    if hasattr(user, 'staff_user_profile') and user.staff_user_profile.is_email_verified:
        return Response({
            "success": False,
            "error": "Email is already verified"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if hasattr(user, 'public_user_profile') and user.public_user_profile.is_email_verified:
        return Response({
            "success": False,
            "error": "Email is already verified"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Rate limiting: Check if user requested a code in the last 60 seconds (10 seconds in DEBUG)
    from django.conf import settings
    cooldown_seconds = 10 if settings.DEBUG else 60
    
    recent_code = EmailVerificationCode.objects.filter(
        user=user,
        date_created__gte=timezone.now() - timedelta(seconds=cooldown_seconds)
    ).first()
    
    if recent_code:
        return Response({
            "success": False,
            "error": f"Please wait {cooldown_seconds} seconds before requesting another verification code",
            "retry_after": cooldown_seconds
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    try:
        # Generate verification code
        email_service = get_email_verification_service()
        code = email_service.generate_verification_code()
        
        # Set expiry time (15 minutes)
        expires_at = timezone.now() + timedelta(minutes=15)
        
        # Save verification code
        verification = EmailVerificationCode.objects.create(
            user=user,
            code=code,
            expires_at=expires_at,
            ip_address=get_client_ip(request)
        )
        
        # Send email via AWS SES
        email_sent = email_service.send_verification_email(
            user=user,
            code=code,
            expiry_minutes=15
        )
        
        if email_sent:
            logger.info(f"Verification code sent to {user.email}")
            return Response({
                "success": True,
                "message": f"Verification code sent to {user.email}",
                "expires_in_minutes": 15
            }, status=status.HTTP_200_OK)
        else:
            # Delete verification record if email failed
            verification.delete()
            return Response({
                "success": False,
                "error": "Failed to send verification email. Please try again later."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Error sending verification email: {str(e)}")
        return Response({
            "success": False,
            "error": "An unexpected error occurred. Please try again later."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_email_code(request):
    """
    Verify email with the code sent via email
    
    POST /api/auth/email/verify-code/
    {
        "code": "123456"
    }
    
    Returns:
        200: Email verified successfully
        400: Invalid or expired code
        404: No verification code found
    """
    user = request.user
    code = request.data.get('code', '').strip()
    
    if not code:
        return Response({
            "success": False,
            "error": "Verification code is required"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find the most recent non-verified code for this user
        verification = EmailVerificationCode.objects.filter(
            user=user,
            code=code,
            is_verified=False
        ).order_by('-date_created').first()
        
        if not verification:
            return Response({
                "success": False,
                "error": "Invalid verification code"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if code is expired
        if verification.is_expired():
            return Response({
                "success": False,
                "error": "Verification code has expired. Please request a new one."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark code as verified
        verification.mark_as_verified()
        
        # Mark user's email as verified in profile
        email_service = get_email_verification_service()
        email_service.verify_and_mark_email_verified(user)
        
        logger.info(f"Email verified successfully for {user.email}")
        
        return Response({
            "success": True,
            "message": "Email verified successfully",
            "is_email_verified": True
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error verifying email code: {str(e)}")
        return Response({
            "success": False,
            "error": "An unexpected error occurred. Please try again later."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_email_verification(request):
    """
    Resend email verification code (convenience endpoint, wraps send_email_verification)
    
    POST /api/auth/email/resend-verification/
    
    Returns:
        Same as send_email_verification
    """
    return send_email_verification(request)
