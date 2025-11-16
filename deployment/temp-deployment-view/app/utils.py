import jwt
import string
import random
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging
import traceback

from . import models


def custom_exception_handler(exc, context):
    """Consistent JSON errors for DRF and unexpected exceptions.

    - Wraps standard DRF errors under {"details": ...}
    - For non-DRF exceptions (response is None), return JSON instead of HTML debug page
    """
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {"details": response.data}
        return response

    # Fallback for unhandled exceptions
    # Log full traceback for debugging
    try:
        logger = logging.getLogger('django.request')
        logger.error("Unhandled exception in API: %s\n%s", str(exc), traceback.format_exc())
    except Exception:
        pass

    detail = f"{exc.__class__.__name__}: {exc}" if settings.DEBUG else "Server error"
    payload = {"detail": detail}
    if settings.DEBUG:
        payload["exception_type"] = exc.__class__.__name__
        payload["trace"] = traceback.format_exc()
    return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


def get_msg(msg_for, local_vars):
    """Safely render a templated message with optional variables.

    The MessagesModels.variables field may contain expressions intended to be evaluated
    against local_vars. To avoid runtime 500s (and reduce risk), we evaluate each entry
    defensively and fall back to empty strings when evaluation fails. If formatting the
    final message fails, return False instead of raising.
    """
    try:
        qs = models.MessagesModels.objects.filter(message_for=msg_for, is_active=True)
        if not qs.exists():
            return False

        msg_obj = qs.first()
        variables = {}

        # Ensure variables is a dict; otherwise ignore
        raw_vars = msg_obj.variables if isinstance(msg_obj.variables, dict) else {}
        for key, value in raw_vars.items():
            try:
                # Only allow simple names from local_vars; avoid executing arbitrary code
                if isinstance(value, str) and value.isidentifier() and value in local_vars:
                    variables[key] = local_vars[value]
                else:
                    # Best-effort eval in a restricted namespace; fall back on failure
                    variables[key] = eval(str(value), {**{k: local_vars.get(k) for k in local_vars if not k.startswith('__')}})  # nosec
            except Exception:
                variables[key] = ''

        try:
            return str(msg_obj.message).format(**variables)
        except Exception:
            return False
    except Exception:
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