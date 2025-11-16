import random
import string
from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db import transaction

from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from . import serializers, models, utils


class BaseViewset(viewsets.ViewSet):
    def return_headers(self):
        headers = {
            'Authorization': self.request.headers.get('Authorization'),
        }
        return headers


class LoginViewSet(BaseViewset):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['POST'])
    def signup(self, request):
        serializer = serializers.RegisterPublicUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            phonenumber = serializer.validated_data['phonenumber']  # 9 digits
            email = serializer.validated_data.get('email', None)
            role = serializer.validated_data['user_role']
            full_names = serializer.validated_data['full_names']
            password = serializer.validated_data['password']

            # create user using manager
            user_inst = models.User.objects.create_user(
                phonenumber=phonenumber,
                password=password,
                email=email,
                role=role
            )

            if role == 'CUSTOMER':
                models.PublicUserProfile.objects.create(
                    user=user_inst,
                    registration_number=utils.generate_registration_number(model_inst=models.User, account_type='P'),
                    full_names=full_names
                )
            else:
                # generate unique agent_code
                agent_code = random.randint(10000, 99999)
                # ensure uniqueness
                while models.StaffUserProfile.objects.filter(agent_code=agent_code).exists():
                    agent_code = random.randint(10000, 99999)
                models.StaffUserProfile.objects.create(
                    user=user_inst,
                    agent_code=agent_code,
                    full_names=full_names
                )

            # create OTP entries: store user as string UUID to match model
            models.OTPModel.objects.bulk_create(
                [
                    models.OTPModel(
                        otp_for='CREATE_ACCOUNT',
                        user=str(user_inst.id),
                    ),
                    models.OTPModel(
                        otp_for='LOGIN',
                        user=str(user_inst.id),
                    )
                ]
            )

            return Response({'detail': 'user created successfully.', 'user_id': user_inst.id}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def auth_login(self, request):
        serializer = serializers.AuthLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ph = serializer.validated_data['phonenumber']
        password = serializer.validated_data['password']
        code = serializer.validated_data['code']

        # authenticate (username uses USERNAME_FIELD = phonenumber)
        user_ = authenticate(username=ph, password=password)
        if user_ is None:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        otp_inst = models.OTPModel.objects.filter(user=str(user_.id), otp_for='LOGIN').first()
        if not otp_inst:
            return Response({'detail': 'No OTP instance found.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_inst.expiry_time and otp_inst.expiry_time < timezone.now():
            return Response({'detail': 'OTP code is already expired.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_inst.code != code:
            return Response({'detail': 'OTP code is Invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_inst.is_verified = True
        otp_inst.save()

        # generate token
        refresh = RefreshToken.for_user(user_)
        resp = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'expires_at': (timezone.now() + timedelta(hours=2)).timestamp(),
            'user_role': user_.role
        }

        return Response(resp, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def login(self, request):
        serializer = serializers.LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ph = serializer.validated_data['phonenumber']
        password = serializer.validated_data['password']

        user_ = authenticate(username=ph, password=password)
        if user_ is None:
            return Response({'detail': 'User does not exist or invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        # send login OTP (dev: we return code)
        otp_inst = models.OTPModel.objects.filter(user=str(user_.id), otp_for='LOGIN').first()
        if not otp_inst:
            # create if missing
            otp_inst = models.OTPModel.objects.create(user=str(user_.id), otp_for='LOGIN')

        # generate code
        otp_inst.code = ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(6))
        otp_inst.expiry_time = timezone.now() + timedelta(minutes=5)
        otp_inst.is_verified = False
        otp_inst.save()

        # prepare message (if any)
        phonenumber = user_.phonenumber
        get_msg_func = getattr(utils, 'get_msg', None)
        msg = get_msg_func('OTP', locals()) if callable(get_msg_func) else False
        if msg:
            # For dev we're printing; in prod you'd send SMS/email
            print(msg)

        return Response({'detail': 'OTP sent successfully.', 'otp_code': otp_inst.code}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def reset_password_self(self, request):
        serializer = serializers.ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # find logged in user id from headers using utils (existing project util)
        user_id = utils.get_logged_in_user(headers=self.return_headers())
        if not user_id:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        user_ = models.User.objects.get(id=user_id)

        # check old password
        old_pw = serializer.validated_data.get('old_password', None)
        if old_pw and not user_.check_password(old_pw):
            return Response({"detail": "Invalid old password provided."}, status=status.HTTP_400_BAD_REQUEST)

        # ensure new password different
        if user_.check_password(serializer.validated_data['password']):
            return Response({"detail": "New password cannot be same as old password."}, status=status.HTTP_400_BAD_REQUEST)

        user_.password = make_password(serializer.validated_data['password'])
        user_.save()

        return Response({'detail': 'Password reset successfully.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def validate_phone(self, request):
        """Check if phone number is available for registration"""
        try:
            phonenumber = request.data.get('phonenumber', '').strip()

            if not phonenumber:
                return Response({'detail': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Validate phone format (9 digits)
            if len(phonenumber) != 9 or not phonenumber.isdigit():
                return Response({
                    'detail': 'Phone number must be exactly 9 digits (no leading 0). Example: 712345678'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if phone number already exists
            if models.User.objects.filter(phonenumber=phonenumber).exists():
                return Response({
                    'detail': 'User with this phone number already exists.'
                }, status=status.HTTP_400_BAD_REQUEST)

            return Response({'detail': 'Phone number is available'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def get_current_user(self, request):
        """Get current authenticated user profile"""
        try:
            user_ = request.user
            serializer = serializers.UserSerializer(user_)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
