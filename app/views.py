import random
import string
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db import transaction

from datetime import timedelta

from . import serializers, models, utils


class BaseViewset(viewsets.ViewSet):
    def return_headers(self):
        headers = {
            'Authorization': self.request.headers.get('Authorization'),
        }
        return headers


class LoginViewSet(BaseViewset):
    @action(detail=False, methods=['POST'])
    def signup(self, request):
        serializer = serializers.RegisterPublicUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user_inst = serializer.save()

        return Response(
            {'detail': 'User created successfully.', 'user_id': str(user_inst.id)},
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['POST'])
    def auth_login(self, request):
        serializer = serializers.AuthLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phonenumber = serializer.validated_data.get('phonenumber')
        password = serializer.validated_data.get('password')
        code = serializer.validated_data.get('code')

        user_ = authenticate(phonenumber=phonenumber, password=password)

        if user_ is None:
            return Response({'detail': 'User does not exist or invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        otp_inst = models.OTPModel.objects.filter(user=user_, otp_for='LOGIN').first()
        if otp_inst is None:
            return Response({'detail': 'No OTP instance found.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_inst.expiry_time and otp_inst.expiry_time < timezone.now():
            return Response({'detail': 'OTP code is already expired.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_inst.code != code:
            return Response({'detail': 'OTP code is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_inst.is_verified = True
        otp_inst.save()

        # generate token
        refresh = RefreshToken.for_user(user_)
        resp = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'expires_at': utils.decode_jwt(str(refresh.access_token))['exp'] if hasattr(utils, 'decode_jwt') else None,
            'user_role': user_.role
        }

        return Response(resp, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def login(self, request):
        serializer = serializers.LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phonenumber = serializer.validated_data.get('phonenumber')
        password = serializer.validated_data.get('password')

        user_ = authenticate(phonenumber=phonenumber, password=password)
        if user_ is None:
            return Response({'detail': 'User does not exist or invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        # send login OTP
        otp_inst, _ = models.OTPModel.objects.get_or_create(user=user_, otp_for='LOGIN')
        otp_inst.code = ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(6))
        otp_inst.expiry_time = timezone.now() + timedelta(minutes=5)
        otp_inst.is_verified = False
        otp_inst.save()

        # optionally send SMS/email
        msg = utils.get_msg('OTP', locals()) if hasattr(utils, 'get_msg') else None
        if msg:
            print(msg)
            # threading.Thread(target=utils.send_sms, args=(phonenumber, msg)).start()

        return Response({'detail': 'OTP sent successfully.', 'otp_code': otp_inst.code}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def reset_password(self, request):
        """
        Unified reset password flow:
        - User provides phone + email
        - If 'code' is not provided, system sends OTP
        - If 'code' is provided, system verifies OTP and resets password
        """
        serializer = serializers.ResetPassword(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_ = models.User.objects.get(
                phonenumber=serializer.validated_data['phonenumber'],
                email=serializer.validated_data['email']
            )
        except models.User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

        # If OTP code provided, verify and reset password
        if serializer.validated_data.get('code'):
            otp_inst = models.OTPModel.objects.filter(user=user_, otp_for='RESET_PASSWORD').first()
            if not otp_inst:
                raise ValidationError('Request for OTP first before validating.')

            if otp_inst.expiry_time < timezone.now():
                return Response({'detail': 'OTP code is already expired.'}, status=status.HTTP_400_BAD_REQUEST)

            if otp_inst.code != serializer.validated_data['code']:
                return Response({'detail': 'OTP code is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

            otp_inst.is_verified = True
            otp_inst.save()

            # ensure new password isn't same as old
            if user_.check_password(serializer.validated_data['password']):
                return Response({"detail": "New password cannot be same as old password."}, status=status.HTTP_400_BAD_REQUEST)

            # update password
            user_.password = make_password(serializer.validated_data['password'])
            user_.save()

            return Response({'detail': 'Password reset successfully. Proceed to login.'}, status=status.HTTP_200_OK)

        # If no OTP code, send one
        otp_inst, _ = models.OTPModel.objects.get_or_create(user=user_, otp_for='RESET_PASSWORD')
        otp_inst.code = ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(6))
        otp_inst.expiry_time = timezone.now() + timedelta(minutes=5)
        otp_inst.is_verified = False
        otp_inst.save()

        return Response(
            {'detail': 'OTP code for reset password has been sent.', 'otp_code': otp_inst.code},
            status=status.HTTP_200_OK
        )


class UserViewset(BaseViewset):
    @action(detail=False, methods=['GET'])
    def get_user(self, request):
        user_id = self.request.query_params.get('user_id')
        if not user_id:
            return Response({'detail': 'user id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_ = models.User.objects.get(id=user_id)
        except models.User.DoesNotExist:
            return Response({'detail': 'user does not exist'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializers.UserSerializer(user_)
        return Response(serializer.data, status=status.HTTP_200_OK)
