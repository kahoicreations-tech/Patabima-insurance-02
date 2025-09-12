import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.validators import RegexValidator


from . import models


# password: at least one letter, one digit and one special char
password_validator = RegexValidator(
    regex=r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).+$',
    message="Password must contain at least one letter, one number, and one special character."
)


phone_digits_validator = RegexValidator(
    regex=r'^\d{9}$',
    message='Phone number must be exactly 9 digits (no leading 0). Example: 712345678'
)




class AuthLoginSerializer(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=9, validators=[phone_digits_validator])
    password = serializers.CharField(max_length=128)
    code = serializers.CharField(max_length=6)




class LoginSerializer(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=9, validators=[phone_digits_validator])
    password = serializers.CharField(max_length=128)




class ResetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50, required=False)
    old_password = serializers.CharField(max_length=128, min_length=6, write_only=True, required=False)
    password = serializers.CharField(max_length=128, min_length=6, write_only=True, validators=[password_validator])
    confirm_password = serializers.CharField(max_length=128, min_length=6, write_only=True)
    code = serializers.CharField(max_length=6, required=False)


    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match.")
        return attrs




class RegisterPublicUserSerializer(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=9, min_length=9, validators=[phone_digits_validator])
    full_names = serializers.CharField(max_length=50)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    user_role = serializers.ChoiceField(choices=models.ROLES)
    password = serializers.CharField(max_length=128, min_length=6, write_only=True, validators=[password_validator])
    confirm_password = serializers.CharField(max_length=128, min_length=6, write_only=True)


    def validate_email(self, value):
        if value in [None, ""]:
            return value
        if models.User.objects.filter(email=value).exists():
            raise serializers.ValidationError('User with this email already exists.')
        return value


    def validate_phonenumber(self, value):
        if models.User.objects.filter(phonenumber=value).exists():
            raise serializers.ValidationError('User with this phone number already exists.')
        return value


    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError('Passwords do not match.')
        return attrs




class UserSerializer(serializers.ModelSerializer):
    full_names = serializers.SerializerMethodField()
    agent_code = serializers.SerializerMethodField()


    class Meta:
        model = models.User
        fields = [
            'email',
            'role',
            'full_names',
            'agent_code'
        ]


    def get_full_names(self, obj):
        if obj.role == 'CUSTOMER':
            if hasattr(obj, 'public_user_profile') and obj.public_user_profile:
                return obj.public_user_profile.full_names
            return None
        else:
            if hasattr(obj, 'staff_user_profile') and obj.staff_user_profile:
                return obj.staff_user_profile.full_names
            return None


    def get_agent_code(self, obj):
        if obj.role == 'CUSTOMER':
            return None
        else:
            if hasattr(obj, 'staff_user_profile') and obj.staff_user_profile:
                return f'{obj.staff_user_profile.agent_prefix}{obj.staff_user_profile.agent_code}'
            return None


