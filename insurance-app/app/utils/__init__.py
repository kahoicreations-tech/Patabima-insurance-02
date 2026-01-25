"""Utilities package.

Bridges legacy module-level utilities in ``app/utils.py`` so imports like
``app.utils.custom_exception_handler`` keep working, while allowing
submodules like ``app.utils.image_validation`` to exist.
"""

# Re-export legacy functions from the old module-based utils, or fallback
custom_exception_handler = None
decode_jwt = None
get_logged_in_user = None
random_string_gen = None
get_msg = None
generate_registration_number = None

try:
	# Prefer sibling module 'app/utils.py'
	from .. import utils as _legacy_utils  # type: ignore
	custom_exception_handler = getattr(_legacy_utils, 'custom_exception_handler', None)
	decode_jwt = getattr(_legacy_utils, 'decode_jwt', None)  # noqa: F401
	get_logged_in_user = getattr(_legacy_utils, 'get_logged_in_user', None)  # noqa: F401
	random_string_gen = getattr(_legacy_utils, 'random_string_gen', None)  # noqa: F401
	get_msg = getattr(_legacy_utils, 'get_msg', None)  # noqa: F401
	generate_registration_number = getattr(_legacy_utils, 'generate_registration_number', None)  # noqa: F401
except Exception:
	# Ignore import errors; we'll define a local fallback below
	pass

if custom_exception_handler is None:
	# Local fallback to avoid import failures if sibling module not found
	from rest_framework.views import exception_handler as _drf_exception_handler
	from rest_framework.response import Response  # type: ignore
	from rest_framework import status  # type: ignore
	from django.conf import settings  # type: ignore

	def custom_exception_handler(exc, context):  # type: ignore
		resp = _drf_exception_handler(exc, context)
		if resp is not None:
			resp.data = {"details": resp.data}
			return resp
		detail = str(exc) if getattr(settings, 'DEBUG', False) else "Server error"
		return Response({"detail": detail}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Define commonly used helpers if not provided by legacy module
import string as _string
import random as _random
from django.conf import settings as _settings  # type: ignore
from .. import models as _models  # type: ignore

if decode_jwt is None:
	import jwt as _jwt  # type: ignore

	def decode_jwt(jwt_code):  # type: ignore
		try:
			return _jwt.decode(jwt_code, _settings.SECRET_KEY, ["HS256"])  # nosec - internal token decoding
		except Exception:
			return None

if get_logged_in_user is None:
	def get_logged_in_user(headers):  # type: ignore
		try:
			auth = headers.get('Authorization') or headers.get('authorization') or ''
			token = (auth.split(' ')[1] if ' ' in auth else auth).strip()
			data = decode_jwt(token) if token else None
			return data.get('user_id') if isinstance(data, dict) else ''
		except Exception:
			return ''

if random_string_gen is None:
	def random_string_gen(size=8, chars=_string.ascii_uppercase + _string.digits):  # type: ignore
		return ''.join(_random.choice(chars) for _ in range(size))

if get_msg is None:
	def get_msg(msg_for, local_vars):  # type: ignore
		try:
			qs = _models.MessagesModels.objects.filter(message_for=msg_for, is_active=True)
			if not qs.exists():
				return False
			msg_obj = qs.first()
			variables = {}
			raw_vars = msg_obj.variables if isinstance(msg_obj.variables, dict) else {}
			for key, value in raw_vars.items():
				try:
					if isinstance(value, str) and value.isidentifier() and value in local_vars:
						variables[key] = local_vars[value]
					else:
						variables[key] = eval(str(value), {**{k: local_vars.get(k) for k in local_vars if not k.startswith('__')}})  # nosec
				except Exception:
					variables[key] = ''
			try:
				return str(msg_obj.message).format(**variables)
			except Exception:
				return False
		except Exception:
			return False

if generate_registration_number is None:
	def generate_registration_number(model_inst=None, account_type=None):  # type: ignore
		user_ = model_inst
		if account_type == 'S':
			max_account_id = max(list(_models.StaffUserProfile.objects.values_list('agent_code', flat=True)) + [0])
			reg_num = max_account_id + 1
			qs = None
		else:
			reg_num = account_type + ''.join(_random.choice(_string.digits) for _ in range(10))
			qs = user_.objects.filter(public_user_profile__registration_number=reg_num).exists() if user_ else False
		if qs:
			return generate_registration_number(model_inst=model_inst, account_type=account_type)
		return reg_num
