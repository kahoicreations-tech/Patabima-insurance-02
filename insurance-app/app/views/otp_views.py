"""
OTP API Views for PataBima Insurance App
Dedicated endpoints for OTP sending, verification, and resending
"""
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework import serializers as drf_serializers

from app.services.otp_service import OTPService


# Serializers
class SendOTPSerializer(drf_serializers.Serializer):
    """Serializer for sending OTP"""
    phone_number = drf_serializers.CharField(
        max_length=15,
        required=True,
        help_text="Phone number in format: 0712345678, 712345678, or +254712345678"
    )
    purpose = drf_serializers.ChoiceField(
        choices=['LOGIN', 'CREATE_ACCOUNT', 'RESET_PASSWORD', 'VERIFY'],
        required=True,
        help_text="Purpose of OTP"
    )
    user_id = drf_serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        help_text="Optional user ID (UUID string)"
    )


class VerifyOTPSerializer(drf_serializers.Serializer):
    """Serializer for verifying OTP"""
    phone_number = drf_serializers.CharField(
        max_length=15,
        required=True,
        help_text="Phone number in format: 0712345678, 712345678, or +254712345678"
    )
    code = drf_serializers.CharField(
        max_length=10,
        required=True,
        help_text="OTP code received"
    )
    purpose = drf_serializers.ChoiceField(
        choices=['LOGIN', 'CREATE_ACCOUNT', 'RESET_PASSWORD', 'VERIFY'],
        required=True,
        help_text="Purpose of OTP (must match what was sent)"
    )
    user_id = drf_serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        help_text="Optional user ID (UUID string)"
    )


class ResendOTPSerializer(drf_serializers.Serializer):
    """Serializer for resending OTP"""
    phone_number = drf_serializers.CharField(
        max_length=15,
        required=True,
        help_text="Phone number in format: 0712345678, 712345678, or +254712345678"
    )
    purpose = drf_serializers.ChoiceField(
        choices=['LOGIN', 'CREATE_ACCOUNT', 'RESET_PASSWORD', 'VERIFY'],
        required=True,
        help_text="Purpose of OTP"
    )
    user_id = drf_serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        help_text="Optional user ID (UUID string)"
    )


# ViewSet
class OTPViewSet(viewsets.ViewSet):
    """
    ViewSet for OTP operations
    
    Endpoints:
    - POST /api/auth/otp/send/ - Send OTP to phone number
    - POST /api/auth/otp/verify/ - Verify OTP code
    - POST /api/auth/otp/resend/ - Resend OTP (invalidates previous)
    """
    permission_classes = [AllowAny]  # OTP endpoints are public
    
    @action(detail=False, methods=['POST'])
    def send(self, request):
        """
        Send OTP to phone number
        
        Request Body:
        {
            "phone_number": "0712345678",
            "purpose": "LOGIN",
            "user_id": "optional-uuid-string"
        }
        
        Response:
        {
            "success": true,
            "message": "OTP sent successfully",
            "expires_in_minutes": 5,
            "otp_code": "123456"  // Only in dev mode
        }
        """
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone_number = serializer.validated_data['phone_number']
        purpose = serializer.validated_data['purpose']
        user_id = serializer.validated_data.get('user_id')
        
        result = OTPService.send_otp(phone_number, purpose, user_id)
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response({
                'detail': result.get('error', 'Failed to send OTP')
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['POST'])
    def verify(self, request):
        """
        Verify OTP code
        
        Request Body:
        {
            "phone_number": "0712345678",
            "code": "123456",
            "purpose": "LOGIN",
            "user_id": "optional-uuid-string"
        }
        
        Response:
        {
            "success": true,
            "message": "OTP verified successfully"
        }
        """
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone_number = serializer.validated_data['phone_number']
        code = serializer.validated_data['code']
        purpose = serializer.validated_data['purpose']
        user_id = serializer.validated_data.get('user_id')
        
        result = OTPService.verify_otp(phone_number, code, purpose, user_id)
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response({
                'detail': result.get('error', 'OTP verification failed')
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['POST'])
    def resend(self, request):
        """
        Resend OTP (invalidates previous OTP)
        
        Request Body:
        {
            "phone_number": "0712345678",
            "purpose": "LOGIN",
            "user_id": "optional-uuid-string"
        }
        
        Response:
        {
            "success": true,
            "message": "OTP sent successfully",
            "expires_in_minutes": 5,
            "otp_code": "654321"  // Only in dev mode
        }
        """
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone_number = serializer.validated_data['phone_number']
        purpose = serializer.validated_data['purpose']
        user_id = serializer.validated_data.get('user_id')
        
        result = OTPService.resend_otp(phone_number, purpose, user_id)
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response({
                'detail': result.get('error', 'Failed to resend OTP')
            }, status=status.HTTP_400_BAD_REQUEST)
