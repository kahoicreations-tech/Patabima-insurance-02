import uuid

from django.db import models
from django.contrib.auth.models import AbstractBaseUser
from django.contrib.auth.base_user import BaseUserManager

GENDER = [
    ('MALE','Male'),
    ('FEMALE','Female'),
    ('OTHERS','Others'),
]

ROLES = [
    ('ADMIN','Admin'),
    ('AGENT','agent'),
    ('PUBLICUSER','PublicUser'),
]

OTPFOR = [
    ('LOGIN','Login'),
    ('CREATE_ACCOUNT','Create_Account'),
    ('RESET_PASSWORD','Reset_Password'),
    ('VERIFY','Verify')
]

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    date_created = models.DateTimeField(auto_now_add=True,null=True, blank=True)
    date_updated = models.DateTimeField(auto_now=True,null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering =("-date_created",)

#inherit from basemanager
class UserManager(BaseUserManager):
    def create_user(self,email, password,**extra_fields):
        """
        Create and save a User with the given email and password and role
        """
        if not email:
            raise ValueError('The Email must be set')

        user = self.model(
            eamil=email,
            is_staff=True,
        )
        user.set_password(password)
        user.save(using=self.db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        create and save a SuperUser with the given email and password.
        """
        user = self.create_user(
            email=email,
            is_staff=True,
            password=password,
        )

        user.is_admin = True
        user.is_active = True
        user.save(using=self._db)
        return user

#user abstract
class User(AbstractBaseUser,BaseModel):
    email = models.CharField(max_length=255, unique=True)
    phonenumber = models.CharField(max_length= 10, unique=True)   
    role = models.CharField(max_length=50,choices=ROLES, default='PUBLICUSER')
    nationality = models.CharField(max_length=100, default='KENYAN')
    country_code = models.CharField(max_length=100, default='+254')
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    created_by = models.CharField(max_length=100,default='SYSTEM')
   
    is_default_password = models.BooleanField(default=False)


    objects = UserManager()

    USERNAME_FIELD = "phonenumber"

    def __str__(self):
        return str(self.id)

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    


class Profile(BaseModel):
    
    idnum = models.CharField(max_length=15, blank=True, null=True,unique=True)
    full_names = models.CharField(max_length=25,blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    physical_address = models.CharField(max_length = 100, blank=True, null=True)
    gender = models.CharField(max_length=10, null=True, blank=True, choices=GENDER)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    class Meta:
        abstract = True


class StaffUserProfile(Profile):
    user_id = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="staff_user_profile",
        blank=True,
        null=True,
    )
    agent_code = models.IntegerField(unique=True)
    agent_prefix = models.CharField(max_length=5,default='AGT')


class PublicUserProfile(Profile):
    user_id = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="public_user_profile",
        blank=True,
        null=True,
    )
    registration_number = models.CharField(max_length=20,unique=True)


    def __str__(self):
        return str(self.registration_number)
    

class OTPModel(models.Model):
    otp_for = models.CharField(max_length=50,choices=OTPFOR)
    code = models.CharField(max_length=10, default='INVALID')
    expiry_time = models.DateTimeField(blank=True, null=True)
    user = models.CharField(max_length=50)
    date_created = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    date_updated = models.DateTimeField(auto_now=True)


class MessagesModels(models.Model):
    id = models.AutoField(primary_key=True)
    message_for = models.CharField(max_length=100)
    message = models.TextField()
    variables = models.JSONField()
    is_active = models.BooleanField(default=True)
