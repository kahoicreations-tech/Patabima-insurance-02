import string
from rest_framework import serializers 
from django.contrib.auth import authenticate
from django.core.validators import RegexValidator
from rest_framework.exceptions import ValidationError

from . import models

special_chars = string.punctuation

password_validator = RegexValidator(
    regex=f"^(?=.*[a-zA-Z])(?=.*\d)(?=.*[{special_chars}]).+$",
    message="Password must contain at least one letter, one number, and one special character."
)

class AuthLoginSerializer(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=50)
    password = serializers.CharField(max_length=50)
    code = serializers.CharField(max_length=6)


class LoginSerializer(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=50)
    password = serializers.CharField(max_length=50)


class ResetPassword(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=10,min_length=9)
    email = serializers.EmailField()
    password = serializers.CharField(max_length=20, min_length=8,write_only=True, validators = [password_validator])
    confirm_password = serializers.CharField(max_length=20,min_length=8,write_only=True, validators = [password_validator])
    code = serializers.CharField(max_length=6, required=False)

    def validate(self, attrs):
        if attrs.get('phonenumber'):
            try:
                models.User.objects.get(phonenumber = attrs['phonenumber'] , email=attrs['email'])
            except models.User.DoesNotExist:
                raise ValidationError('User does not exists.')

        if attrs['password'] != attrs['confirm_password']:
            raise ValidationError('Passwords do not match.')
            
        return attrs
    
class RegisterPublicUserSerializer(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=9, min_length=9)
    full_names = serializers.CharField(max_length=50)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    user_role = serializers.ChoiceField(choices=models.ROLES)
    password = serializers.CharField(max_length=20, min_length=6, write_only=True, validators = [password_validator])
    confirm_password = serializers.CharField(max_length=20, min_length=6, write_only=True, validators = [password_validator])


    def validate_email(self, value):
        #check if user with emial already exists
        if models.User.objects.filter(email =  value).exists():
            raise ValidationError('User already exists.')
        return value
    
    def validate_phonenumber(self, value):
        if models.User.objects.filter(phonenumber =  value).exists():
            raise ValidationError('User already exists.')
        return value
    
    def validate(self, attrs):
        #validate passwords

        if attrs['password'] != attrs['confirm_password']:
            raise ValidationError('Password do not match.')
        
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
        if obj.role == 'PUBLICUSER':
            return obj.public_user_profile.full_names
        else:
            return obj.staff_user_profile.full_names
        
    def get_agent_code(self, obj):
        if obj.role == 'PUBLICUSER':
            return None
        else:
            return f'{obj.staff_user_profile.agent_prefix}{obj.staff_user_profile.agent_code}'