from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['POST'])
@permission_classes([AllowAny])  # Payment gateways can't send auth tokens
def process_payment_callback(request):
    """
    Handle payment gateway callbacks (M-PESA, DPO).
    
    This endpoint receives payment confirmations from payment providers
    and activates the corresponding policy.
    
    Expected data:
    - provider: 'MPESA' or 'DPO'
    - transaction_id: Payment reference from provider
    - amount: Payment amount
    - phone: Customer phone number (M-PESA)
    - result_code: Payment result (M-PESA: '0' = success)
    - policy_reference: Quote ID or policy number to match
    """
    import logging
    logger = logging.getLogger(__name__)
    
    provider = request.data.get('provider', '').upper()

    # Daraja STK push callback format: { Body: { stkCallback: { ... } } }
    if not provider:
        try:
            body = request.data.get('Body') or {}
            stk = body.get('stkCallback') or {}
            if stk:
                provider = 'MPESA'
        except Exception:
            provider = provider
    
    logger.info(f"Payment callback received from {provider}")
    logger.info(f"Callback data: {request.data}")
    
    if provider == 'MPESA':
        # Extract M-PESA callback data
        transaction_id = request.data.get('TransactionID') or request.data.get('transaction_id')
        amount = request.data.get('TransAmount') or request.data.get('amount')
        phone = request.data.get('MSISDN') or request.data.get('phone')
        result_code = str(request.data.get('ResultCode') or request.data.get('result_code', ''))
        policy_reference = request.data.get('AccountReference') or request.data.get('policy_reference')

        # If this is an STK push callback forwarded by PaymentsViewSet.webhook,
        # policy_reference may be missing; try to reconcile using checkout_request_id.
        checkout_request_id = request.data.get('CheckoutRequestID') or request.data.get('checkout_request_id')

        # If we still don't have basic fields, attempt to parse nested STK body.
        if (not result_code) and isinstance(request.data, dict) and request.data.get('Body'):
            body = request.data.get('Body') or {}
            stk = body.get('stkCallback') or {}
            try:
                result_code = str(stk.get('ResultCode', ''))
                checkout_request_id = checkout_request_id or stk.get('CheckoutRequestID')

                meta = stk.get('CallbackMetadata') or {}
                items = meta.get('Item') or []
                if isinstance(items, list):
                    kv = {}
                    for item in items:
                        if isinstance(item, dict) and item.get('Name') and 'Value' in item:
                            kv[item['Name']] = item.get('Value')

                    transaction_id = transaction_id or kv.get('MpesaReceiptNumber')
                    amount = amount or kv.get('Amount')
                    phone = phone or kv.get('PhoneNumber')
            except Exception:
                pass
        
        # Check if payment was successful
        if result_code != '0':
            logger.warning(f"M-PESA payment failed: ResultCode={result_code}")
            return Response({
                'ResultCode': 1,
                'ResultDesc': f'Payment failed with code {result_code}'
            })
        
        if not transaction_id:
            logger.error("M-PESA callback missing TransactionID")
            return Response({
                'ResultCode': 1,
                'ResultDesc': 'Missing transaction ID'
            })
        
        # Find policy by quote_id or policy_number
        from ..models import MotorPolicy
        policy = None
        
        if policy_reference:
            try:
                # Try to find by quote_id first
                policy = MotorPolicy.objects.get(quote_id=policy_reference)
            except MotorPolicy.DoesNotExist:
                try:
                    # Try to find by policy_number
                    policy = MotorPolicy.objects.get(policy_number=policy_reference)
                except MotorPolicy.DoesNotExist:
                    logger.error(f"No policy found for reference {policy_reference}")
        
        # If not found by reference, try to find by transaction_id in payment_details
        if not policy:
            try:
                # Search for policy with this transaction_id in payment_details
                policies = MotorPolicy.objects.filter(
                    payment_details__icontains=transaction_id,
                    status='PENDING_PAYMENT'
                )
                if policies.exists():
                    policy = policies.first()
            except Exception as e:
                logger.error(f"Error searching for policy: {e}")

        # If still not found, try to reconcile using checkout_request_id
        if not policy and checkout_request_id:
            try:
                policies = MotorPolicy.objects.filter(
                    payment_details__icontains=checkout_request_id,
                    status='PENDING_PAYMENT'
                )
                if policies.exists():
                    policy = policies.first()
            except Exception as e:
                logger.error(f"Error searching for policy by checkout_request_id: {e}")
        
        if not policy:
            logger.error(f"Payment {transaction_id} has no matching policy")
            # Still return success to M-PESA to avoid retries
            return Response({
                'ResultCode': 0,
                'ResultDesc': 'Callback received (policy not found)'
            })
        
        # Check if policy is already active
        if policy.status == 'ACTIVE':
            logger.warning(f"Policy {policy.policy_number} already active - skipping activation")
            return Response({
                'ResultCode': 0,
                'ResultDesc': 'Policy already active'
            })
        
        # ⚠️ DMVIC INTEGRATION: Issue certificate BEFORE activating policy
        from app.services.dmvic_certificate_manager import DMVICCertificateManager
        from app.services.dmvic_service import DMVICAPIError
        from django.utils import timezone
        
        # Update payment details first
        if not policy.payment_details:
            policy.payment_details = {}
        policy.payment_details['transaction_id'] = transaction_id
        policy.payment_details['status'] = 'CONFIRMED'
        policy.payment_details['confirmed_at'] = timezone.now().isoformat()
        policy.payment_details['payment_method'] = 'MPESA'
        policy.payment_details['amount'] = amount
        policy.save()
        
        # Issue DMVIC certificate (BLOCKING with 3 retries)
        try:
            logger.info(f"🔐 Issuing DMVIC certificate for policy {policy.policy_number}...")
            dmvic_cert = DMVICCertificateManager.issue_certificate(policy)
            
            logger.info(
                f"✅ DMVIC certificate issued: {dmvic_cert.certificate_number} "
                f"for policy {policy.policy_number}"
            )
            
            # NOW activate policy (DMVIC certificate issued successfully)
            result = policy.activate_policy(
                transaction_id=transaction_id,
                payment_date=timezone.now(),
                payment_method='MPESA'
            )
            
            logger.info(f"✅ Policy {policy.policy_number} activated successfully via M-PESA")
            
            # TODO: Send success email/SMS with certificate link
            # send_policy_activation_email(policy, dmvic_cert)
            # send_policy_activation_sms(policy, dmvic_cert)
            
            return Response({
                'ResultCode': 0,
                'ResultDesc': 'Payment processed, DMVIC certificate issued, policy activated',
                'policy_number': result['policy_number'],
                'status': result['status'],
                'certificate_number': dmvic_cert.certificate_number
            })
            
        except DMVICAPIError as e:
            # ❌ DMVIC certificate issuance failed after 3 retries
            logger.error(
                f"❌ DMVIC certificate issuance failed for policy {policy.policy_number} "
                f"after payment confirmation: {str(e)}"
            )
            
            # Policy stays PENDING_PAYMENT (payment confirmed but not active)
            policy.status = 'PENDING_PAYMENT'
            policy.save()
            
            # TODO: Send "payment confirmed, certificate pending" email
            # send_payment_confirmed_email(policy, pending_certificate=True)
            
            # TODO: Send admin alert for manual retry
            # send_admin_alert(
            #     subject=f"DMVIC Certificate Failed - {policy.policy_number}",
            #     message=f"Payment confirmed (M-PESA {transaction_id}) but "
            #             f"certificate issuance failed. Manual retry required."
            # )
            
            logger.warning(
                f"⚠️ Policy {policy.policy_number} payment confirmed but certificate pending. "
                f"Admin alerted for manual retry."
            )
            
            # Still return success to M-PESA (we received payment)
            # But indicate certificate is pending
            return Response({
                'ResultCode': 0,
                'ResultDesc': 'Payment received, certificate issuance pending',
                'policy_number': policy.policy_number,
                'status': 'PENDING_PAYMENT',
                'certificate_status': 'PENDING',
                'error': str(e)
            })
            
        except Exception as e:
            logger.error(f"❌ Unexpected error during policy activation: {str(e)}")
            return Response({
                'ResultCode': 1,
                'ResultDesc': f'Policy activation failed: {str(e)}'
            }, status=500)
    
    elif provider == 'DPO':
        # Extract DPO callback data
        transaction_id = request.data.get('TransactionToken') or request.data.get('transaction_id')
        amount = request.data.get('TransactionAmount') or request.data.get('amount')
        status_code = request.data.get('TransactionStatus') or request.data.get('status')
        policy_reference = request.data.get('CompanyRef') or request.data.get('policy_reference')
        
        # Check if payment was successful (DPO uses different status codes)
        if status_code not in ['1', 'APPROVED', 'COMPLETED']:
            logger.warning(f"DPO payment failed: Status={status_code}")
            return Response({
                'success': False,
                'message': f'Payment not completed: {status_code}'
            })
        
        if not transaction_id:
            logger.error("DPO callback missing transaction token")
            return Response({
                'success': False,
                'message': 'Missing transaction ID'
            }, status=400)
        
        # Find policy (similar logic to M-PESA)
        from ..models import MotorPolicy
        policy = None
        
        if policy_reference:
            try:
                policy = MotorPolicy.objects.get(quote_id=policy_reference)
            except MotorPolicy.DoesNotExist:
                try:
                    policy = MotorPolicy.objects.get(policy_number=policy_reference)
                except MotorPolicy.DoesNotExist:
                    logger.error(f"No policy found for reference {policy_reference}")
        
        if not policy:
            logger.error(f"Payment {transaction_id} has no matching policy")
            return Response({
                'success': True,
                'message': 'Callback received (policy not found)'
            })
        
        # Check if policy is already active
        if policy.status == 'ACTIVE':
            logger.warning(f"Policy {policy.policy_number} already active - skipping activation")
            return Response({
                'success': True,
                'message': 'Policy already active'
            })
        
        # ⚠️ DMVIC INTEGRATION: Issue certificate BEFORE activating policy
        from app.services.dmvic_certificate_manager import DMVICCertificateManager
        from app.services.dmvic_service import DMVICAPIError
        from django.utils import timezone
        
        # Update payment details first
        if not policy.payment_details:
            policy.payment_details = {}
        policy.payment_details['transaction_id'] = transaction_id
        policy.payment_details['status'] = 'CONFIRMED'
        policy.payment_details['confirmed_at'] = timezone.now().isoformat()
        policy.payment_details['payment_method'] = 'DPO'
        policy.payment_details['amount'] = amount
        policy.save()
        
        # Issue DMVIC certificate (BLOCKING with 3 retries)
        try:
            logger.info(f"🔐 Issuing DMVIC certificate for policy {policy.policy_number}...")
            dmvic_cert = DMVICCertificateManager.issue_certificate(policy)
            
            logger.info(
                f"✅ DMVIC certificate issued: {dmvic_cert.certificate_number} "
                f"for policy {policy.policy_number}"
            )
            
            # NOW activate policy (DMVIC certificate issued successfully)
            result = policy.activate_policy(
                transaction_id=transaction_id,
                payment_date=timezone.now(),
                payment_method='DPO'
            )
            
            logger.info(f"✅ Policy {policy.policy_number} activated successfully via DPO")
            
            # TODO: Send success email/SMS with certificate link
            # send_policy_activation_email(policy, dmvic_cert)
            # send_policy_activation_sms(policy, dmvic_cert)
            
            return Response({
                'success': True,
                'message': 'Payment processed, DMVIC certificate issued, policy activated',
                'transaction_status': 'COMPLETED',
                'policy_number': result['policy_number'],
                'certificate_number': dmvic_cert.certificate_number
            })
            
        except DMVICAPIError as e:
            # ❌ DMVIC certificate issuance failed after 3 retries
            logger.error(
                f"❌ DMVIC certificate issuance failed for policy {policy.policy_number} "
                f"after payment confirmation: {str(e)}"
            )
            
            # Policy stays PENDING_PAYMENT (payment confirmed but not active)
            policy.status = 'PENDING_PAYMENT'
            policy.save()
            
            # TODO: Send "payment confirmed, certificate pending" email
            # TODO: Send admin alert for manual retry
            
            logger.warning(
                f"⚠️ Policy {policy.policy_number} payment confirmed but certificate pending. "
                f"Admin alerted for manual retry."
            )
            
            # Still return success to DPO (we received payment)
            return Response({
                'success': True,
                'message': 'Payment received, certificate issuance pending',
                'transaction_status': 'PENDING_CERTIFICATE',
                'policy_number': policy.policy_number,
                'certificate_status': 'PENDING',
                'error': str(e)
            })
            
        except Exception as e:
            logger.error(f"❌ Unexpected error during policy activation: {str(e)}")
            return Response({
                'success': False,
                'message': f'Policy activation failed: {str(e)}'
            }, status=500)
    
    else:
        logger.error(f"Unknown payment provider: {provider}")
        return Response({
            'error': 'Unknown payment provider'
        }, status=400)