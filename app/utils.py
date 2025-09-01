import jwt
import string
import random
from django.conf import settings
from rest_framework.views import exception_handler

from . import models


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {"details": response.data}  # Wrap errors in "details"
    return response


def decode_jwt(jwt_code):
    try:
        response = jwt.decode(jwt_code, settings.SECRET_KEY, ["HS256"])

        return response
    except Exception as e:
        return None

def get_logged_in_user(headers):
    auth_user = headers.get('Authorization').split(' ')[1]
    try:
        user = decode_jwt(auth_user)['user_id']
        return user
    except Exception as e:
        return ''

def random_string_gen(size=8,chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))


def get_msg(msg_for,local_vars):
    msg_=models.MessagesModels.objects.filter(message_for=msg_for, is_active=True)
    if msg_.exists():
        msg__ = msg_.first()
        #get variables
        variables={}
        for key,value in msg__.variables.items():
            new_val=eval(value,local_vars)
            variables.setdefault(key,new_val)

        msg=msg__.message.format(**variables)

        return msg
    else:
        return False

def generate_registration_number(model_inst=None,account_type=None):
    user_=model_inst
    if account_type=='S':
        max_account_id = max(list(models.StaffUserProfile.objects.values_list('agent_code',flat=True))+[0])

        reg_num = max_account_id + 1

        qs = None
    else:
        reg_num = account_type+''.join(random.choice(string.digits) for _ in range(10))

        qs = user_.objects.filter(public_user_profile__registration_number = reg_num).exists()

    if qs:
        return generate_registration_number(model_inst=model_inst,account_type=account_type)
    return reg_num