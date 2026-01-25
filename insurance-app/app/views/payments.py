import logging
import random
import string

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


logger = logging.getLogger(__name__)


class PaymentsViewSet(viewsets.ViewSet):
	"""Public app payments endpoints.

	Frontend expects:
	- POST /api/v1/public_app/payments/initiate
	- GET  /api/v1/public_app/payments/status?reference=...
	- POST /api/v1/public_app/payments/webhook
	"""

	permission_classes = [IsAuthenticated]

	@action(detail=False, methods=['POST'])
	def initiate(self, request):
		amount = request.data.get('amount')
		method = (request.data.get('method') or 'MPESA').upper()
		phone = request.data.get('phone') or request.data.get('phone_number')

		policy_reference = request.data.get('policy_reference')
		account_reference = request.data.get('account_reference') or policy_reference

		try:
			amount_float = float(amount)
			if amount_float <= 0:
				raise ValueError('Amount must be greater than 0')
		except Exception:
			return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

		if method != 'MPESA':
			reference = 'PAY' + ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(8))
			return Response(
				{'reference': reference, 'amount': amount_float, 'method': method, 'status': 'PENDING'},
				status=status.HTTP_200_OK,
			)

		if not phone:
			return Response({'error': 'phone is required for MPESA payments'}, status=status.HTTP_400_BAD_REQUEST)

		if not account_reference:
			account_reference = 'PB' + ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(10))

		try:
			from app.services.mpesa_daraja import DarajaClient

			client = DarajaClient.from_env()
			res = client.stk_push(
				phone=phone,
				amount=amount_float,
				account_reference=str(account_reference),
				transaction_desc=f'PataBima Insurance Payment - {account_reference}',
			)

			checkout_request_id = res.get('CheckoutRequestID')
			merchant_request_id = res.get('MerchantRequestID')

			return Response(
				{
					'success': True,
					'provider': 'MPESA',
					'reference': checkout_request_id or merchant_request_id,
					'checkout_request_id': checkout_request_id,
					'merchant_request_id': merchant_request_id,
					'response_code': res.get('ResponseCode'),
					'response_description': res.get('ResponseDescription'),
					'customer_message': res.get('CustomerMessage'),
					'account_reference': account_reference,
					'amount': amount_float,
					'status': 'PENDING',
				},
				status=status.HTTP_200_OK,
			)
		except Exception as e:
			return Response(
				{'success': False, 'provider': 'MPESA', 'error': str(e)},
				status=status.HTTP_502_BAD_GATEWAY,
			)

	@action(detail=False, methods=['GET'])
	def status(self, request):
		reference = request.query_params.get('reference')
		if not reference:
			return Response({'error': 'reference is required'}, status=status.HTTP_400_BAD_REQUEST)

		# If initiate() returned a non-MPESA placeholder reference (PAYXXXXXXXX),
		# do not query Daraja. This supports safe local/staging smoke tests.
		try:
			import re
			if re.fullmatch(r'PAY[A-Z0-9]{8}', str(reference)):
				return Response(
					{
						'provider': 'NON_MPESA',
						'reference': reference,
						'status': 'PENDING',
						'raw': None,
					},
					status=status.HTTP_200_OK,
				)
		except Exception:
			pass

		try:
			from app.services.mpesa_daraja import DarajaClient

			client = DarajaClient.from_env()
			res = client.stk_query(checkout_request_id=reference)

			result_code = str(res.get('ResultCode', ''))
			mapped_status = 'SUCCESS' if result_code == '0' else 'PENDING'

			return Response(
				{
					'provider': 'MPESA',
					'reference': reference,
					'status': mapped_status,
					'result_code': result_code,
					'result_desc': res.get('ResultDesc'),
					'raw': res,
				},
				status=status.HTTP_200_OK,
			)
		except Exception as e:
			return Response(
				{'provider': 'MPESA', 'reference': reference, 'status': 'ERROR', 'error': str(e)},
				status=status.HTTP_502_BAD_GATEWAY,
			)

	@action(detail=False, methods=['POST'], permission_classes=[AllowAny])
	def webhook(self, request):
		"""Safaricom Daraja callback target (no auth)."""
		logger.info('Payment webhook received')

		from .payment_gateway import process_payment_callback

		return process_payment_callback(request)
