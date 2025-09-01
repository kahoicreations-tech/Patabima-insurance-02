import random
import string
from rest_framework.response import Response
from rest_framework import status, viewsets,filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db import transaction

from datetime import timedelta,datetime, time


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
        serializer = serializers.RegisterPublicUserSerializer(
            data = self.request.data
        )

        if not serializer.is_valid(raise_exception=True):
            return Response({'detail': 'Failed to register User.'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            #create user
            user_inst = models.User.objects.create(
                email = serializer.validated_data['email'],
                phonenumber = serializer.validated_data['phonenumber'],
                role = serializer.valdated_data['role']
            )

            if serializer.valdated_data['role'] == 'PUBLICUSER':
                #create profile
                models.PublicUserProfile.objects.create(
                    user = user_inst,
                    registration_number = utils.generate_registration_number(model_inst=models.User,account_type='P')
                )
            else:
                #create staff profile
                models.StaffUserProfile.objects.create(
                    user = user_inst,
                    registration_number = utils.generate_registration_number(model_inst=models.User,account_type='S')
                )
            
            #create OTP Instance
            models.OTPModel.objects.bulk_create(
                [
                    models.OTPModel(
                        otp_for = 'CREATE_ACCOUNT',
                        user = user_inst,
                    ),
                    models.OTPModel(
                        otp_for = 'LOGIN',
                        user = user_inst,
                    )
                
                ]
            )

            return Response({'detail':'user created successfully.','user_id':user_inst.id}, status=status.HTTP_200_OK)
            


    @action(detail=False, methods=['POST'])
    def auth_login(self,request):
        serializer = serializers.AuthLoginSerializer(
            data = self.request.data
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_ = authenticate(phonenumber=self.request.data['phonenumber'],password=self.request.data['password'])

        if user_ in ['',None]:

            return Response({'detail': 'User does not exists'}, status=status.HTTP_400_BAD_REQUEST)  

        otp_inst = models.OTPModel.objects.filter(user=user_,otp_for='LOGIN').first()

        if otp_inst in ['',None]:
            return Response({'detail': 'No OTP instance found.'}, status=status.HTTP_400_BAD_REQUEST)  

        if not otp_inst.expiry_time >= timezone.now():
            return Response({'detail': 'OTP code is already expired.'}, status=status.HTTP_400_BAD_REQUEST)
        

        elif otp_inst.code != self.request.data['code']:
            return Response({'detail': 'OTP code is Invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_inst.is_verified=True
        otp_inst.save()

        #generate token
        refresh = RefreshToken.for_user(user_)

        resp= {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'expires_at': utils.decode_jwt(str(refresh.access_token))['exp'],
            'user_role' : user_.role
        }

        return Response(resp, status.HTTP_200_OK)
    
    @action(detail=False, methods=['POST'])
    def login(self, request):
        serializer = serializers.LoginSerializer(
            data = self.request.data
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_ = authenticate(phonenumber=self.request.data['phonenumber'],password=self.request.data['password'])

        

        if user_ in ['',None]:
            return Response({'detail': 'User does not exists'}, status=status.HTTP_400_BAD_REQUEST)


        #send login OTP
        otp_inst = models.OTPModel.objects.get(user=user_,otp_for='LOGIN')
        otp_inst.code = ''.join(random.choice(string.digits+string.ascii_uppercase) for _ in range(6))
        otp_inst.expiry_time = timezone.now() + timedelta(minutes=5)
        otp_inst.is_verified = False
        otp_inst.save()

        #send sms to user/ user threading
        
        phonenumber = user_.phonenumber
       
        msg=utils.get_msg('OTP',locals())
        if msg:
            print(msg)
            # #send sms
            # threading.Thread(
            #     target=utils.send_sms,
            #     args=(
            #         phonenumber, 
            #         msg,
            #     )
            # ).start()
            # #send email
            # threading.Thread(
            #     target=utils.send_email,
            #     args=(
            #         email, 
            #         msg,
            #     )
            # ).start()
           
            del msg

        return Response({'detail':'OTP sent successfully.','otp_code':otp_inst.code}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'],permission_classes = [IsAuthenticated])
    def reset_password_self(self,request):

        serializer= serializers.ResetPassword(
             data = self.request.data
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_ = models.User.objects.get(id=utils.get_logged_in_user(headers=self.return_headers()))

        #check if new password is not equal to old password
        user = authenticate(username=user_.username,password=serializer.validated_data['password'])

        if not user in ['',None]:
            return Response({"detail":"New password cannot be same as old password."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=user_.username,password=serializer.validated_data['old_password'])

        if user in ['',None]:
            return Response({"detail":"Invalid password provided."}, status=status.HTTP_400_BAD_REQUEST)

        #update the password
        user_.password = make_password(serializer.validated_data['password'])
        user_.save()


        return Response({'detail':'Password reset successfully.'}, status=status.HTTP_200_OK)