# views/policy_management.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta, date
import uuid
import json
import random
import base64
import logging
from urllib.parse import urlparse
from ..models import MotorPolicy
from ..serializers import MotorPolicySubmissionSerializer, MotorPolicySerializer

logger = logging.getLogger(__name__)

try:
    # Reuse calculation helpers for consistent premium logic
    from .motor_flow import _compute_base_premium_simple, _apply_mandatory_levies
except Exception:
    _compute_base_premium_simple = None
    _apply_mandatory_levies = None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_policy_quote(request):
    """
    Create a new policy quote with all collected information
    """
    quote_data = request.data
    
    # Generate unique policy reference
    policy_reference = f"PB{datetime.now().strftime('%Y%m%d')}{random.randint(1000, 9999)}"
    
    # Calculate policy details
    base_premium = float(quote_data.get('base_premium', 0))
    
    # Calculate mandatory levies
    training_levy = base_premium * 0.0025  # 0.25%
    pcf_levy = base_premium * 0.0025       # 0.25%
    stamp_duty = 40.0                      # Fixed KSh 40
    
    total_levies = training_levy + pcf_levy + stamp_duty
    total_premium = base_premium + total_levies
    
    policy_quote = {
        'policy_reference': policy_reference,
        'quote_status': 'DRAFT',
        'customer_info': quote_data.get('customer_info', {}),
        'vehicle_info': quote_data.get('vehicle_info', {}),
        'cover_details': {
            'category': quote_data.get('category'),
            'cover_type': quote_data.get('cover_type'),
            'underwriter': quote_data.get('underwriter'),
            'cover_start_date': quote_data.get('cover_start_date'),
            'cover_end_date': (datetime.strptime(quote_data.get('cover_start_date'), '%Y-%m-%d') + timedelta(days=365)).strftime('%Y-%m-%d'),
            'sum_insured': quote_data.get('sum_insured')
        },
        'premium_calculation': {
            'base_premium': base_premium,
            'training_levy': round(training_levy, 2),
            'pcf_levy': round(pcf_levy, 2),
            'stamp_duty': stamp_duty,
            'total_levies': round(total_levies, 2),
            'total_premium': round(total_premium, 2)
        },
        'created_at': datetime.now().isoformat(),
        'valid_until': (datetime.now() + timedelta(days=30)).isoformat()
    }
    
    return Response({
        'success': True,
        'policy_quote': policy_quote
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalize_policy(request):
    """
    Finalize policy after successful payment
    """
    policy_reference = request.data.get('policy_reference')
    payment_reference = request.data.get('payment_reference')
    
    if not all([policy_reference, payment_reference]):
        return Response({
            'error': 'policy_reference and payment_reference required'
        }, status=400)
    
    # Generate policy number
    policy_number = f"POL/{datetime.now().year}/{random.randint(100000, 999999)}"
    
    return Response({
        'success': True,
        'policy': {
            'policy_number': policy_number,
            'policy_reference': policy_reference,
            'status': 'ACTIVE',
            'payment_reference': payment_reference,
            'activation_timestamp': datetime.now().isoformat(),
            'certificate_url': f'/api/v1/motor/policy/{policy_number}/certificate',
            'receipt_url': f'/api/v1/motor/policy/{policy_number}/receipt'
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_receipt(request, policy_id):
    """Generate (or retrieve) a PDF receipt URL for a policy.

    Note: This endpoint historically returned mock JSON. It now generates a real
    PDF receipt, uploads to S3 (if configured), persists `receipt_url` on the
    policy, and returns the URL.
    """
    try:
        # Accept either policy UUID (id) or policy_number in the same param
        policy = None
        try:
            policy = MotorPolicy.objects.get(id=policy_id, user=request.user)
        except Exception:
            policy = MotorPolicy.objects.get(policy_number=policy_id, user=request.user)

        # Return existing receipt URL when present
        if policy.receipt_url:
            try:
                from app.services.pdf_generator import generate_presigned_url
                url = policy.receipt_url
                if isinstance(url, str) and 'amazonaws.com' in url and 'X-Amz-Signature' not in url:
                    url = generate_presigned_url(url)
                return Response({'success': True, 'policyNumber': policy.policy_number, 'receiptUrl': url})
            except Exception:
                return Response({'success': True, 'policyNumber': policy.policy_number, 'receiptUrl': policy.receipt_url})

        from app.services.pdf_generator import generate_motor_receipt_pdf

        receipt_url = generate_motor_receipt_pdf(policy)
        if receipt_url:
            policy.receipt_url = receipt_url
            policy.save(update_fields=['receipt_url'])

        # Return a presigned URL for private S3 objects
        try:
            from app.services.pdf_generator import generate_presigned_url
            url = receipt_url
            if isinstance(url, str) and 'amazonaws.com' in url and 'X-Amz-Signature' not in url:
                url = generate_presigned_url(url)
            receipt_url = url
        except Exception:
            pass

        return Response({
            'success': True,
            'policyNumber': policy.policy_number,
            'receiptUrl': receipt_url,
        })

    except MotorPolicy.DoesNotExist:
        return Response({'success': False, 'error': 'Policy not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': 'Failed to generate receipt', 'details': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_motor_policy(request, policy_number):
    """Activate a motor policy after payment confirmation.

    This is the app-driven activation path (used when sandbox payments do not
    call back reliably). It is idempotent: calling it for an already ACTIVE
    policy returns the current state.

    Expected body (minimal):
    {
      "transaction_id": "...",          # optional if already stored
      "payment_method": "MPESA|DPO|MANUAL",
      "payment_status": "CONFIRMED"     # optional; treated as CONFIRMED if truthy
    }
    """
    try:
        policy = MotorPolicy.objects.get(policy_number=policy_number, user=request.user)

        def _presign_if_needed(url: str | None):
            if not isinstance(url, str) or not url:
                return None
            # Only presign plain S3 object URLs; leave already-presigned URLs intact
            if 'amazonaws.com' not in url or 'X-Amz-Signature' in url:
                return url
            try:
                from app.services.pdf_generator import generate_presigned_url
                return generate_presigned_url(url)
            except Exception:
                return url

        # If already active, just return current document links.
        if policy.status == 'ACTIVE':
            serializer = MotorPolicySerializer(policy)
            return Response({
                'success': True,
                'message': 'Policy already active',
                'policy': serializer.data,
                'documents': {
                    'policyPdfUrl': _presign_if_needed(policy.policy_document_url),
                    'receiptUrl': _presign_if_needed(policy.receipt_url),
                    'certificateUrl': policy.certificate_url,
                    'dmvicCertificatePdfUrl': _presign_if_needed(getattr(policy, 'dmvic_certificate_pdf_url', None)),
                    'dmvicCertificatePreviewUrl': getattr(policy, 'dmvic_certificate_preview_url', None),
                }
            }, status=200)

        # Normalize payment details from request
        payment_method = (request.data.get('payment_method') or request.data.get('method') or 'MPESA').upper()
        transaction_id = request.data.get('transaction_id') or request.data.get('transactionId')
        payment_status = (request.data.get('payment_status') or request.data.get('status') or '').upper()

        if not policy.payment_details:
            policy.payment_details = {}

        if transaction_id:
            policy.payment_details['transaction_id'] = transaction_id

        # Use any previously stored transaction_id as fallback
        stored_txn = policy.payment_details.get('transaction_id') or policy.payment_details.get('transactionId')
        effective_txn = transaction_id or stored_txn

        # Treat SUCCESS as CONFIRMED for sandbox/manual flows
        if payment_status in ['SUCCESS', 'COMPLETED']:
            payment_status = 'CONFIRMED'

        # Reject clearly failed payment statuses
        if payment_status in ['FAILED', 'CANCELLED', 'REJECTED', 'ERROR']:
            return Response({
                'success': False,
                'error': 'Payment not confirmed',
                'user_message': 'Payment status indicates failure. Cannot activate policy.',
            }, status=400)

        # Require transaction_id for electronic payments (keeps MANUAL working)
        if payment_method in ['MPESA', 'DPO', 'CARD'] and not effective_txn:
            return Response({
                'success': False,
                'error': 'Missing transaction_id',
                'user_message': 'transaction_id is required to activate this policy for electronic payments.',
            }, status=400)

        if payment_status:
            policy.payment_details['status'] = payment_status
        else:
            # Default to CONFIRMED when activating explicitly
            # (used for MANUAL flows / sandbox paths)
            policy.payment_details['status'] = 'CONFIRMED'

        policy.payment_details['method'] = payment_method
        policy.payment_details['payment_confirmed_at'] = timezone.now().isoformat()
        policy.save(update_fields=['payment_details'])

        # ===================================================================
        # DMVIC CERTIFICATE PREVIEW GENERATION (Intermediary Integration)
        # ===================================================================
        # Generate preview immediately after payment verification
        if not policy.dmvic_certificate_preview_url and not policy.dmvic_status:
            try:
                from app.services.dmvic_service import get_dmvic_service
                
                dmvic_service = get_dmvic_service()
                
                # Build policy_data dictionary from policy object
                policy_data = {
                    'registration_number': policy.registration_number,
                    'chassis_number': policy.chassis_number or '',
                    'engine_number': policy.engine_number or '',
                    'year_of_manufacture': policy.year_of_manufacture,
                    'make': policy.vehicle_make or '',
                    'model': policy.vehicle_model or '',
                    'body_type': policy.body_type or '',
                    'color': policy.color or '',
                    'seating_capacity': policy.seating_capacity or 0,
                    'cover_type': policy.coverage_type or 'THIRD_PARTY',
                    'policy_number': policy.policy_number,
                    'start_date': policy.start_date,
                    'end_date': policy.end_date,
                    'sum_insured': policy.sum_insured or 0,
                    'premium': policy.total_premium or 0,
                    'customer_name': f"{policy.policyholder_first_name} {policy.policyholder_last_name}".strip(),
                    'id_number': policy.policyholder_id_number or '',
                    'phone_number': policy.policyholder_phone or '',
                    'email': policy.policyholder_email or '',
                    'postal_address': policy.policyholder_address or '',
                }
                
                # Generate preview
                preview_result = dmvic_service.preview_type_a_certificate_intermediary(policy_data)
                
                if preview_result['success']:
                    policy.dmvic_certificate_preview_url = preview_result['preview_url']
                    policy.dmvic_status = 'PREVIEW_GENERATED'
                    policy.dmvic_certificate_type = str(preview_result['certificate_type'])
                    policy.save(update_fields=[
                        'dmvic_certificate_preview_url',
                        'dmvic_status',
                        'dmvic_certificate_type'
                    ])
                    logger.info(f"DMVIC preview generated for {policy.policy_number}: {preview_result['preview_url']}")
                else:
                    policy.dmvic_status = 'FAILED'
                    policy.save(update_fields=['dmvic_status'])
                    logger.warning(f"DMVIC preview failed for {policy.policy_number}: {preview_result['errors']}")
                    
            except Exception as e:
                policy.dmvic_status = 'FAILED'
                policy.save(update_fields=['dmvic_status'])
                logger.error(f"DMVIC preview exception for {policy.policy_number}: {str(e)}")

        # DMVIC certificate issuance - MANDATORY in production, graceful fallback in UAT/test
        from app.services.dmvic_certificate_manager import DMVICCertificateManager
        from app.services.dmvic_service import DMVICAPIError

        dmvic_cert = None
        is_test_mode = settings.DEBUG  # Use DEBUG flag to determine test mode
        test_mode_fallback = False
        dmvic_error_message = None
        
        try:
            dmvic_cert = DMVICCertificateManager.issue_certificate(policy)
            logger.info(f"✅ DMVIC certificate issued: {dmvic_cert.certificate_number}")
        except DMVICAPIError as e:
            error_msg = str(e)
            logger.error(f"❌ DMVIC certificate issuance failed: {error_msg}")
            
            # PRODUCTION MODE: DMVIC is source of truth - failure blocks policy creation
            if not settings.DEBUG:
                # Mark policy as failed
                policy.dmvic_status = 'FAILED'
                policy.status = 'DRAFT'
                policy.save(update_fields=['dmvic_status', 'status'])
                
                # Use DMVIC's actual error message, not generated ones
                return Response({
                    'success': False,
                    'error': 'DMVIC certificate issuance failed',
                    'message': error_msg,  # Direct DMVIC error message
                    'dmvicError': error_msg,
                    'errorCode': 'DMVIC_CERTIFICATE_FAILED',
                    'policyNumber': policy.policy_number,
                    'support': {
                        'phone': '0700 123 456',
                        'email': 'support@patabima.com',
                        'hours': 'Mon-Fri 8AM-6PM, Sat 9AM-1PM'
                    }
                }, status=400)
            
            # DEV/TEST MODE: no mock fallbacks. DMVIC failure still blocks creation.
            else:
                policy.dmvic_status = 'FAILED'
                policy.status = 'DRAFT'
                policy.save(update_fields=['dmvic_status', 'status'])

                return Response({
                    'success': False,
                    'error': 'DMVIC certificate issuance failed',
                    'message': error_msg,
                    'dmvicError': error_msg,
                    'errorCode': 'DMVIC_CERTIFICATE_FAILED',
                    'policyNumber': policy.policy_number,
                }, status=400)
                    
        except Exception as e:
            # Handle unexpected errors
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"❌ Unexpected DMVIC error: {error_msg}")
            
            # Production: fail policy creation
            if not settings.DEBUG:
                policy.dmvic_status = 'FAILED'
                policy.status = 'DRAFT'
                policy.save(update_fields=['dmvic_status', 'status'])
                
                return Response({
                    'success': False,
                    'error': 'Certificate issuance failed',
                    'message': error_msg,  # Direct error message, not generated
                    'dmvicError': error_msg,
                    'errorCode': 'DMVIC_UNEXPECTED_ERROR',
                    'policyNumber': policy.policy_number,
                    'support': {
                        'phone': '0700 123 456',
                        'email': 'support@patabima.com',
                        'hours': 'Mon-Fri 8AM-6PM, Sat 9AM-1PM'
                    }
                }, status=500)
            
            # Test mode: continue with warning
            else:
                logger.warning(f"⚠️ TEST MODE: Continuing despite unexpected error: {error_msg}")
                is_test_mode = True
                test_mode_fallback = True
                dmvic_error_message = error_msg
                policy.dmvic_status = 'TEST_MODE_ERROR'
                policy.save(update_fields=['dmvic_status'])

        # DMVIC certificate issued successfully - proceed with policy activation
        # Fetch DMVIC certificate PDF and store URL on policy (best-effort)
        try:
            cert_no = getattr(dmvic_cert, 'certificate_number', None) or policy.dmvic_certificate_number
            if cert_no and not getattr(policy, 'dmvic_certificate_pdf_url', None):
                from app.services.dmvic_service import DMVICService
                from app.services.pdf_generator import upload_pdf_to_s3

                pdf_bytes = DMVICService().get_certificate_pdf(cert_no)
                if pdf_bytes:
                    key = f"policies/{policy.policy_number}/{policy.policy_number}_dmvic_certificate.pdf"
                    s3_url = upload_pdf_to_s3(pdf_bytes, policy.policy_number, file_key=key)
                    if s3_url:
                        policy.dmvic_certificate_pdf_url = s3_url
                        policy.save(update_fields=['dmvic_certificate_pdf_url'])
        except Exception:
            pass

        # Activate policy (skip notifications/commission for now)
        result = policy.activate_policy(
            transaction_id=effective_txn,
            payment_date=timezone.now(),
            payment_method=payment_method,
            run_post_tasks=False,
        )

        # Generate receipt PDF after activation
        try:
            from app.services.pdf_generator import generate_motor_receipt_pdf

            if not policy.receipt_url:
                receipt_url = generate_motor_receipt_pdf(policy)
                if receipt_url:
                    policy.receipt_url = receipt_url
                    policy.save(update_fields=['receipt_url'])
        except Exception:
            pass

        policy.refresh_from_db()
        serializer = MotorPolicySerializer(policy)

        response_data = {
            'success': True,
            'message': 'Policy activated successfully',
            'activation': result,
            'dmvicCertificate': {
                'certificateNumber': getattr(dmvic_cert, 'certificate_number', None) if dmvic_cert else None,
                'certificateType': getattr(dmvic_cert, 'certificate_type', None) if dmvic_cert else None,
                'status': getattr(dmvic_cert, 'status', None) if dmvic_cert else None,
                'previewUrl': getattr(policy, 'dmvic_certificate_preview_url', None),
                'dmvicStatus': getattr(policy, 'dmvic_status', None),
                'response_data': getattr(dmvic_cert, 'response_data', None) if dmvic_cert else None,
            },
            'documents': {
                'policyPdfUrl': _presign_if_needed(policy.policy_document_url),
                'receiptUrl': _presign_if_needed(policy.receipt_url),
                'certificateUrl': policy.certificate_url,
                'dmvicCertificatePdfUrl': _presign_if_needed(getattr(dmvic_cert, 'dmvic_pdf_url', None) if dmvic_cert else policy.certificate_url),
                'dmvicCertificatePreviewUrl': getattr(policy, 'dmvic_certificate_preview_url', None),
            },
            'policy': serializer.data,
            'policyNumber': policy.policy_number,
            'policy_number': policy.policy_number,
        }
        
        return Response(response_data, status=200)

    except MotorPolicy.DoesNotExist:
        return Response({'success': False, 'error': 'Policy not found'}, status=404)
    except Exception as e:
        logger.error(f"Policy activation failed: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Activation failed',
            'details': str(e),
            'user_message': (
                "We encountered an issue activating your policy. Please contact support "
                "with your policy number for assistance."
            )
        }, status=500)


def _parse_s3_url(s3_url: str):
    """Parse common S3 URL formats into (bucket, key).

    Supports:
      - https://{bucket}.s3.amazonaws.com/{key}
      - https://s3.amazonaws.com/{bucket}/{key}
      - https://s3.{region}.amazonaws.com/{bucket}/{key}
      - https://{bucket}.s3.{region}.amazonaws.com/{key}
    """
    parsed = urlparse(s3_url)
    host = (parsed.netloc or '').split(':')[0]
    path = (parsed.path or '').lstrip('/')

    if not host or 'amazonaws.com' not in host:
        return (None, None)

    parts = host.split('.')
    # Virtual-hosted style: {bucket}.s3[.{region}].amazonaws.com
    if len(parts) >= 3 and parts[1] == 's3':
        bucket = parts[0]
        key = path
        return (bucket, key)

    # Path style: s3[.{region}].amazonaws.com/{bucket}/{key}
    if parts[0] == 's3':
        if '/' not in path:
            return (None, None)
        bucket, key = path.split('/', 1)
        return (bucket, key)

    return (None, None)


def _s3_client():
    try:
        import boto3
    except Exception:
        return None

    region = (
        getattr(settings, 'AWS_S3_REGION_NAME', None)
        or getattr(settings, 'AWS_REGION', None)
        or 'us-east-1'
    )

    return boto3.client(
        's3',
        aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        region_name=region,
    )


def _download_s3_bytes_from_url(s3_url: str):
    bucket, key = _parse_s3_url(s3_url)
    if not bucket or not key:
        raise ValueError('Unsupported S3 URL format')

    client = _s3_client()
    if not client:
        raise RuntimeError('boto3 is not available on server')

    obj = client.get_object(Bucket=bucket, Key=key)
    body = obj.get('Body')
    if not body:
        return None
    return body.read()


def _pdf_base64_response(policy: MotorPolicy, s3_url: str, filename: str):
    pdf_bytes = _download_s3_bytes_from_url(s3_url)
    if not pdf_bytes:
        return Response({'success': False, 'error': 'PDF not available'}, status=502)
    encoded = base64.b64encode(pdf_bytes).decode('utf-8')
    return Response({
        'success': True,
        'policyNumber': policy.policy_number,
        'filename': filename,
        'mimeType': 'application/pdf',
        'pdf_data': encoded,
    }, status=200)


def _pdf_bytes_base64_response(policy: MotorPolicy, pdf_bytes: bytes, filename: str):
    if not pdf_bytes:
        return Response({'success': False, 'error': 'PDF not available'}, status=200)
    encoded = base64.b64encode(pdf_bytes).decode('utf-8')
    return Response({
        'success': True,
        'policyNumber': policy.policy_number,
        'filename': filename,
        'mimeType': 'application/pdf',
        'pdf_data': encoded,
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def proxy_download_policy_pdf(request, policy_number):
    """Authenticated proxy: returns policy PDF as base64."""
    try:
        policy = MotorPolicy.objects.get(policy_number=policy_number, user=request.user)
        filename = f"{policy.policy_number}_policy.pdf"

        url = getattr(policy, 'policy_document_url', None)
        if url:
            return _pdf_base64_response(policy, url, filename)

        # On-demand generation fallback (works even when S3 isn't configured)
        try:
            from app.services.pdf_generator import generate_motor_policy_pdf
            s3_url = generate_motor_policy_pdf(policy)
            if s3_url:
                policy.policy_document_url = s3_url
                policy.save(update_fields=['policy_document_url'])
                return _pdf_base64_response(policy, s3_url, filename)
        except Exception:
            pass

        # If we couldn't upload (e.g., no S3), try generating bytes and returning directly
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.enums import TA_CENTER
            from io import BytesIO

            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, title=f"Policy {policy.policy_number}")
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#D5222B'), alignment=TA_CENTER)
            story = [
                Paragraph('PataBima Insurance Agency', title_style),
                Spacer(1, 0.2 * inch),
                Paragraph('MOTOR INSURANCE POLICY', styles['Heading2']),
                Spacer(1, 0.3 * inch),
            ]
            data = [
                ['Policy Number', policy.policy_number],
                ['Status', policy.status],
                ['Cover Start', str(getattr(policy, 'cover_start_date', '') or '')],
                ['Cover End', str(getattr(policy, 'cover_end_date', '') or '')],
            ]
            tbl = Table(data, colWidths=[2.0*inch, 4.0*inch])
            tbl.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(tbl)
            doc.build(story)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            return _pdf_bytes_base64_response(policy, pdf_bytes, filename)
        except Exception:
            return Response({'success': False, 'error': 'Policy PDF not available'}, status=200)
    except MotorPolicy.DoesNotExist:
        return Response({'success': False, 'error': 'Policy not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': 'Failed to download policy PDF', 'details': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def proxy_download_receipt_pdf(request, policy_number):
    """Authenticated proxy: returns receipt PDF as base64."""
    try:
        policy = MotorPolicy.objects.get(policy_number=policy_number, user=request.user)
        filename = f"{policy.policy_number}_receipt.pdf"

        url = getattr(policy, 'receipt_url', None)
        if url:
            return _pdf_base64_response(policy, url, filename)

        # On-demand generation
        try:
            from app.services.pdf_generator import generate_motor_receipt_pdf
            s3_url = generate_motor_receipt_pdf(policy)
            if s3_url:
                policy.receipt_url = s3_url
                policy.save(update_fields=['receipt_url'])
                return _pdf_base64_response(policy, s3_url, filename)
        except Exception:
            pass

        # If no S3, attempt to generate bytes by calling receipt generator then returning via S3-less fallback isn't available here
        return Response({'success': False, 'error': 'Receipt PDF not available'}, status=200)
    except MotorPolicy.DoesNotExist:
        return Response({'success': False, 'error': 'Policy not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': 'Failed to download receipt PDF', 'details': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def proxy_download_dmvic_certificate_pdf(request, policy_number):
    """Authenticated proxy: returns DMVIC certificate PDF as base64."""
    try:
        policy = MotorPolicy.objects.get(policy_number=policy_number, user=request.user)
        url = getattr(policy, 'dmvic_certificate_pdf_url', None)
        filename = f"{policy.policy_number}_dmvic_certificate.pdf"

        if url:
            return _pdf_base64_response(policy, url, filename)

        # On-demand fetch from DMVIC when we have a certificate number (best-effort)
        try:
            cert_no = getattr(policy, 'dmvic_certificate_number', None)
            if cert_no:
                from app.services.dmvic_service import DMVICService
                from app.services.pdf_generator import upload_pdf_to_s3

                pdf_bytes = DMVICService().get_certificate_pdf(cert_no)
                if pdf_bytes:
                    # Try to persist to S3 if configured
                    try:
                        key = f"policies/{policy.policy_number}/{policy.policy_number}_dmvic_certificate.pdf"
                        s3_url = upload_pdf_to_s3(pdf_bytes, policy.policy_number, file_key=key)
                        if s3_url:
                            policy.dmvic_certificate_pdf_url = s3_url
                            policy.save(update_fields=['dmvic_certificate_pdf_url'])
                            return _pdf_base64_response(policy, s3_url, filename)
                    except Exception:
                        pass
                    # Return directly even if we couldn't upload
                    return _pdf_bytes_base64_response(policy, pdf_bytes, filename)
        except Exception:
            pass

        return Response({'success': False, 'error': 'DMVIC certificate PDF not available'}, status=200)
    except MotorPolicy.DoesNotExist:
        return Response({'success': False, 'error': 'Policy not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': 'Failed to download DMVIC certificate PDF', 'details': str(e)}, status=500)


# =========================
# Public quotation endpoints (no auth)
# =========================

@api_view(['POST'])
@permission_classes([AllowAny])
def submit_motor_quotation(request):
    """
    Public endpoint to submit a motor quotation from the app without requiring auth.
    Does not persist to DB in this minimal version; returns a normalized quotation payload.
    """
    data = request.data or {}
    # Basic fields we expect
    category = data.get('category') or data.get('category_code')
    cover_type = data.get('cover_type') or data.get('subcategory_code')
    underwriter = data.get('underwriter') or data.get('underwriter_code')
    start_date = data.get('cover_start_date') or data.get('start_date')
    # Compute pricing if helpers available
    pricing = None
    if _compute_base_premium_simple and _apply_mandatory_levies and category and cover_type:
        base = _compute_base_premium_simple(category, cover_type, data)
        pricing = _apply_mandatory_levies(base)
    quote_id = f"PUB-QUO-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000,9999)}"
    payload = {
        'quote_id': quote_id,
        'status': 'SUBMITTED',
        'category': category,
        'cover_type': cover_type,
        'underwriter': underwriter,
        'cover_start_date': start_date,
        'vehicle_info': data.get('vehicle_info') or {
            'registration_number': data.get('registration_number') or data.get('vehicle_registration'),
            'make': data.get('vehicle_make'),
            'model': data.get('vehicle_model'),
            'year': data.get('vehicle_year') or data.get('year_of_manufacture'),
        },
        'customer_info': data.get('customer_info') or {
            'name': data.get('customer_name'),
            'phone': data.get('phone') or data.get('phone_number'),
            'email': data.get('email'),
        },
        'submitted_at': datetime.now().isoformat(),
    }
    if pricing:
        payload['premium_breakdown'] = pricing
    return Response({ 'success': True, 'quotation': payload })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_quotations(request):
    """
    Public endpoint to retrieve submitted quotations (stateless demo).
    Returns an empty list or a small mock when "demo=true" is provided.
    Optional filter: phone or phone_number
    """
    demo = str(request.GET.get('demo', '')).lower() == 'true'
    phone = request.GET.get('phone') or request.GET.get('phone_number')
    if not demo:
        return Response({ 'results': [], 'count': 0 })
    sample = [
        {
            'quote_id': 'PUB-QUO-EXAMPLE-1234',
            'status': 'SUBMITTED',
            'category': 'PRIVATE',
            'cover_type': 'THIRD_PARTY',
            'underwriter': 'CIC',
            'cover_start_date': datetime.now().strftime('%Y-%m-%d'),
            'customer_info': { 'name': 'John Demo', 'phone': phone or '254700000001' },
            'premium_breakdown': { 'base_premium': 3500, 'training_levy': 8.75, 'pcf_levy': 8.75, 'stamp_duty': 40.0, 'total_levies': 57.5, 'total_premium': 3557.5 },
        }
    ]
    return Response({ 'results': sample, 'count': len(sample) })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_motor_policy(request):
    """
    Create a new motor insurance policy from Motor 2 flow.
    
    Expected payload from frontend:
    {
        "quoteId": "QUOTE-1234567890",
        "clientDetails": {...},
        "vehicleDetails": {...},
        "productDetails": {...},
        "underwriterDetails": {...} or null,
        "premiumBreakdown": {...},
        "paymentDetails": {...},
        "addons": [],
        "documents": []
    }
    
    Returns:
    {
        "success": true,
        "policyNumber": "POL-2024-123456",
        "policyId": "uuid",
        "pdfUrl": null,
        "message": "Policy created successfully"
    }
    """
    # Debug: Print incoming data to see what frontend sends
    print("\n" + "="*80)
    print("MOTOR2 POLICY CREATION - Incoming Request Data:")
    print("="*80)
    import json
    print(json.dumps(request.data, indent=2, default=str))
    print("="*80 + "\n")
    
    # Validate incoming data
    serializer = MotorPolicySubmissionSerializer(data=request.data)
    
    if not serializer.is_valid():
        print("\n" + "="*80)
        print("VALIDATION ERRORS:")
        print(json.dumps(serializer.errors, indent=2, default=str))
        print("="*80 + "\n")
        return Response({
            'success': False,
            'error': 'Validation error',
            'details': serializer.errors
        }, status=400)
    
    validated_data = serializer.validated_data
    
    try:
        # =================================================================
        # IDEMPOTENCY GUARD (transaction_id)
        # If the user retries submission (e.g., frontend timeout), we should
        # return the existing policy for the same payment transaction instead
        # of raising duplicate/overlap conflicts.
        # =================================================================
        try:
            incoming_pd = (validated_data.get('paymentDetails') or {}).copy()
            txn = (
                incoming_pd.get('transaction_id') or
                incoming_pd.get('transactionId') or
                (request.data.get('paymentDetails', {}) or {}).get('transaction_id') or
                (request.data.get('paymentDetails', {}) or {}).get('transactionId')
            )
            if txn:
                existing_policy = (
                    MotorPolicy.objects.filter(user=request.user)
                    .filter(Q(payment_details__transaction_id=txn) | Q(payment_details__transactionId=txn))
                    .order_by('-submitted_at')
                    .first()
                )
                if existing_policy:
                    return Response({
                        'success': True,
                        'policyNumber': existing_policy.policy_number,
                        'policyId': str(existing_policy.id),
                        'pdfUrl': getattr(existing_policy, 'policy_document_url', None),
                        'message': 'Policy already exists for this transaction',
                        'status': existing_policy.status,
                        'submittedAt': existing_policy.submitted_at.isoformat() if getattr(existing_policy, 'submitted_at', None) else None,
                        'idempotent': True,
                    }, status=200)
        except Exception as _idemp_err:
            # Never block creation because the idempotency guard failed
            print(f"⚠️  Idempotency check skipped due to error: {str(_idemp_err)}")

        # =================================================================
        # DUPLICATE POLICY GUARD
        # Check for existing active/pending policies for same vehicle
        # =================================================================
        vehicle_details = validated_data['vehicleDetails']
        registration = (
            vehicle_details.get('registration') or 
            vehicle_details.get('registration_number') or 
            vehicle_details.get('registrationNumber')
        )
        
        # Get cover dates from request
        cover_start_str = vehicle_details.get('coverStartDate') or vehicle_details.get('cover_start_date')
        if cover_start_str:
            try:
                proposed_start = datetime.strptime(cover_start_str, '%Y-%m-%d').date()
                proposed_end = proposed_start + timedelta(days=365)
            except (ValueError, TypeError):
                proposed_start = datetime.now().date()
                proposed_end = proposed_start + timedelta(days=365)
        else:
            proposed_start = datetime.now().date()
            proposed_end = proposed_start + timedelta(days=365)
        
        # Check for overlapping policies unless forceCreate flag is set
        force_create = request.data.get('forceCreate', False)
        
        if registration and not force_create:
            # Normalize registration for comparison
            reg_normalized = registration.strip().upper().replace(' ', '')
            
            # Find policies with same registration that overlap in coverage dates
            overlapping_policies = MotorPolicy.objects.filter(
                user=request.user,
                status__in=['ACTIVE', 'PENDING_PAYMENT']
            ).exclude(
                # Exclude policies that end before our start or start after our end
                cover_end_date__lt=proposed_start
            ).exclude(
                cover_start_date__gt=proposed_end
            )
            
            # Check registration match (normalize for comparison)
            duplicates = []
            for existing_policy in overlapping_policies:
                existing_reg = (
                    existing_policy.vehicle_details.get('registration') or
                    existing_policy.vehicle_details.get('registration_number') or
                    existing_policy.vehicle_details.get('registrationNumber') or
                    ''
                )
                existing_reg_normalized = existing_reg.strip().upper().replace(' ', '')
                
                if existing_reg_normalized == reg_normalized:
                    duplicates.append(existing_policy)
            
            if duplicates:
                # Found duplicate policies
                duplicate_info = []
                for dup in duplicates:
                    duplicate_info.append({
                        'policy_number': dup.policy_number,
                        'status': dup.status,
                        'cover_start': dup.cover_start_date.isoformat() if dup.cover_start_date else None,
                        'cover_end': dup.cover_end_date.isoformat() if dup.cover_end_date else None,
                        'underwriter': dup.underwriter_details.get('name') if dup.underwriter_details else 'N/A',
                        'product': dup.product_details.get('subcategory') if dup.product_details else 'N/A'
                    })
                
                return Response({
                    'success': False,
                    'error': 'Duplicate policy detected',
                    'user_message': f'An active or pending policy already exists for vehicle {registration}. Please review existing policies or use "Proceed Anyway" to create a new policy.',
                    'existing_policies': duplicate_info,
                    'can_override': True,
                    'override_instructions': 'To proceed anyway, set "forceCreate": true in the request'
                }, status=409)
        
        # =================================================================
        # DMVIC DOUBLE-INSURANCE VALIDATION
        # Check with DMVIC if vehicle already has active cover.
        # IMPORTANT: enforce the Motor3 drawer rule server-side too:
        # selectedStart must be >= (expiry + 1 day).
        # Also persist a small audit record into policy.product_details.
        # =================================================================
        allow_proceed = request.data.get('allowProceed', False)

        dmvic_double_insurance_audit = {
            'checked': False,
            'registration': registration,
            'proposed_start_date': proposed_start.isoformat() if proposed_start else None,
            'decision': None,
        }

        def _parse_dmvic_date(value):
            if not value:
                return None
            if isinstance(value, (date, datetime)):
                return value.date() if isinstance(value, datetime) else value
            if not isinstance(value, str):
                return None
            v = value.strip()
            if not v:
                return None
            # DMVIC commonly returns DD/MM/YYYY. We also accept YYYY-MM-DD.
            try:
                if '/' in v:
                    day, month, year = v.split('/')
                    return date(int(year), int(month), int(day))
                return datetime.strptime(v.split('T')[0], '%Y-%m-%d').date()
            except Exception:
                return None

        if not registration:
            dmvic_double_insurance_audit['decision'] = 'skipped_no_registration'
        elif allow_proceed:
            dmvic_double_insurance_audit['decision'] = 'bypassed_by_user'
            dmvic_double_insurance_audit['checked'] = False
        else:
            try:
                from app.services.dmvic_service import DMVICService

                dmvic_service = DMVICService()
                # DMVICService.validate_double_insurance returns:
                # { "exists": bool, "policy": { cover_end_date, ... } | None }
                dmvic_double_insurance_audit['checked'] = True
                double_insurance_result = dmvic_service.validate_double_insurance(registration)

                exists = bool(double_insurance_result and double_insurance_result.get('exists'))
                policy_info = (double_insurance_result or {}).get('policy') or {}

                expiry_raw = policy_info.get('cover_end_date')
                expiry_date = _parse_dmvic_date(expiry_raw)
                min_start_date = (expiry_date + timedelta(days=1)) if expiry_date else None

                dmvic_double_insurance_audit.update({
                    'exists': exists,
                    'policy': policy_info,
                    'expiry_raw': expiry_raw,
                    'expiry_date': expiry_date.isoformat() if expiry_date else None,
                    'min_start_date': min_start_date.isoformat() if min_start_date else None,
                })

                if exists:

                    # Enforce collision gating when we have an expiry.
                    # selectedStart is compliant iff selectedStart >= (expiry + 1 day)
                    if min_start_date and proposed_start < min_start_date:
                        dmvic_double_insurance_audit['decision'] = 'blocked_collision'
                        return Response({
                            'success': False,
                            'error': 'Vehicle has existing cover in DMVIC',
                            'user_message': (
                                f'Vehicle {registration} has existing cover in DMVIC until '
                                f'{expiry_date.isoformat()}. Cover start date must be {min_start_date.isoformat()} or later.'
                            ),
                            'dmvic_policy': {
                                'policy_number': policy_info.get('policy_number') or policy_info.get('policy'),
                                'underwriter': policy_info.get('insurer') or policy_info.get('underwriter'),
                                'cover_type': policy_info.get('policy_type') or policy_info.get('cover_type'),
                                'expiry_date': expiry_raw,
                            },
                            'existing_cover_expiry': expiry_date.isoformat(),
                            'min_start_date': min_start_date.isoformat(),
                            'can_override': True,
                            'override_instructions': 'To proceed anyway, set "allowProceed": true in the request',
                            'warning': 'Creating duplicate coverage may violate insurance regulations'
                        }, status=409)

                    # If DMVIC says there is an active cover but we cannot parse expiry,
                    # block by default (override allowed). This prevents silent double-insurance.
                    if not min_start_date:
                        dmvic_double_insurance_audit['decision'] = 'blocked_unparseable_expiry'
                        return Response({
                            'success': False,
                            'error': 'Vehicle has existing cover in DMVIC',
                            'user_message': (
                                f'Vehicle {registration} appears to have existing cover in DMVIC. '
                                'Expiry date could not be validated, so policy creation is blocked by default.'
                            ),
                            'dmvic_policy': {
                                'policy_number': policy_info.get('policy_number') or policy_info.get('policy'),
                                'underwriter': policy_info.get('insurer') or policy_info.get('underwriter'),
                                'cover_type': policy_info.get('policy_type') or policy_info.get('cover_type'),
                                'expiry_date': expiry_raw,
                            },
                            'existing_cover_expiry': expiry_raw,
                            'min_start_date': None,
                            'can_override': True,
                            'override_instructions': 'To proceed anyway, set "allowProceed": true in the request',
                            'warning': 'Creating duplicate coverage may violate insurance regulations'
                        }, status=409)

                    dmvic_double_insurance_audit['decision'] = 'allowed_existing_cover_no_collision'

                else:
                    dmvic_double_insurance_audit['decision'] = 'allowed_no_existing_cover'

            except Exception as dmvic_error:
                # DMVIC check failed - log warning but don't block policy creation
                print(f"⚠️  DMVIC double-insurance check failed: {str(dmvic_error)}")
                print("   Proceeding with policy creation (DMVIC validation will be marked as pending)")
                dmvic_double_insurance_audit['checked'] = True
                dmvic_double_insurance_audit['decision'] = 'error_proceeded'
                dmvic_double_insurance_audit['error'] = str(dmvic_error)
                # Will add warning flag to policy below
        
        # =================================================================
        # Create new policy instance
        # =================================================================
        policy = MotorPolicy()
        
        # Generate unique policy number
        policy.policy_number = policy.generate_policy_number()
        
        # Set user (if authenticated)
        policy.user = request.user
        
        # Extract agent code if available from user profile
        if hasattr(request.user, 'agent_code'):
            policy.agent_code = request.user.agent_code
        
        # Set quote ID
        policy.quote_id = validated_data.get('quoteId') or f"QUOTE-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Store all the JSON fields
        policy.client_details = validated_data['clientDetails']
        policy.vehicle_details = validated_data['vehicleDetails']
        
        # Enhanced product details handling for extendible products
        product_details = validated_data['productDetails'].copy()
        subcategory_code = product_details.get('subcategory') or product_details.get('subcategory_code')
        
        # Add warning flags if checks were bypassed
        if force_create:
            product_details['duplicate_check_bypassed'] = True
            product_details['creation_warnings'] = product_details.get('creation_warnings', [])
            product_details['creation_warnings'].append('Duplicate policy guard bypassed by user')
        
        if allow_proceed:
            product_details['double_insurance_check_bypassed'] = True
            product_details['creation_warnings'] = product_details.get('creation_warnings', [])
            product_details['creation_warnings'].append('DMVIC double-insurance check bypassed by user')

        # Persist DMVIC validation audit (non-breaking: stored inside product_details JSON)
        try:
            product_details['dmvic_double_insurance_check'] = dmvic_double_insurance_audit
            if dmvic_double_insurance_audit.get('decision') == 'error_proceeded':
                product_details['creation_warnings'] = product_details.get('creation_warnings', [])
                product_details['creation_warnings'].append('DMVIC double-insurance validation failed; policy created without DMVIC confirmation')
        except Exception:
            pass
        
        # Determine extendible products.
        # Primary signal: premiumBreakdown.extendible_config (works for Motor3 conversions too).
        # Secondary signal: subcategory contains 'EXT'.
        premium_breakdown = validated_data.get('premiumBreakdown', {})
        extendible_config = premium_breakdown.get('extendible_config')

        is_extendible = bool(extendible_config) or (subcategory_code and 'EXT' in str(subcategory_code).upper())
        product_details['is_extendible'] = is_extendible
        product_details['subcategory_code'] = subcategory_code

        if is_extendible and extendible_config:
            # Add extendible configuration to product details
            product_details['extendible_config'] = extendible_config
            product_details['payment_plan'] = 'EXTENDIBLE'
            print(f"✅ Added extendible_config for {subcategory_code or 'UNKNOWN'} from pricing features")
        else:
            # Not extendible or missing config
            product_details['payment_plan'] = 'FULL_PAYMENT'
        
        policy.product_details = product_details
        policy.underwriter_details = validated_data.get('underwriterDetails')
        policy.premium_breakdown = validated_data['premiumBreakdown']

        # Normalize payment details to ensure transaction_id is present (accept both camelCase and snake_case)
        _pd = (validated_data.get('paymentDetails') or {}).copy()
        try:
            txn = _pd.get('transaction_id') or _pd.get('transactionId')
            if txn:
                _pd['transaction_id'] = txn
            # Default status to CONFIRMED if explicitly provided as truthy
            if not _pd.get('status') and _pd.get('payment_status'):
                _pd['status'] = str(_pd.get('payment_status')).upper()
        except Exception:
            pass
        policy.payment_details = _pd
        policy.addons = validated_data.get('addons', [])
        policy.documents = validated_data.get('documents', [])
        
        # Avoid printing potentially sensitive payload details to stdout.
        # Use structured logging at call sites if needed.
        
        # Extract cover dates if available
        if 'coverStartDate' in validated_data['vehicleDetails']:
            try:
                policy.cover_start_date = datetime.strptime(
                    validated_data['vehicleDetails']['coverStartDate'], 
                    '%Y-%m-%d'
                ).date()
            except (ValueError, TypeError):
                pass
        
        # Calculate cover end date (1 year from start)
        if policy.cover_start_date:
            policy.cover_end_date = policy.cover_start_date + timedelta(days=365)
        
        # Set status based on coverage type and payment
        coverage_type = product_details.get('coverageType', '').upper()
        payment_method = (validated_data['paymentDetails'].get('method', '') or '').lower()
        payment_status = (validated_data['paymentDetails'].get('status', '') or '').upper()
        if payment_status in ['SUCCESS', 'COMPLETED']:
            payment_status = 'CONFIRMED'
        
        # Third-Party products (including TOR and extendible):
        # Do NOT set ACTIVE directly here. If payment is confirmed, leave as
        # PENDING_PAYMENT and let the activation pipeline issue DMVIC + activate.
        if 'THIRD_PARTY' in coverage_type or 'TOR' in coverage_type:
            if payment_status == 'CONFIRMED':
                # Payment confirmed: keep as pending, activation endpoint will finalize.
                if not policy.cover_start_date:
                    policy.cover_start_date = datetime.now().date()
                if not policy.cover_end_date:
                    policy.cover_end_date = policy.cover_start_date + timedelta(days=365)

                policy.status = 'PENDING_PAYMENT'
                # Ensure payment_details is marked CONFIRMED for downstream eligibility
                try:
                    if not policy.payment_details:
                        policy.payment_details = {}
                    policy.payment_details['status'] = 'CONFIRMED'
                except Exception:
                    pass
            elif payment_method in ['mpesa', 'dpo', 'card']:
                policy.status = 'PENDING_PAYMENT'
            else:
                policy.status = 'DRAFT'
        
        # Comprehensive products: Needs underwriter approval -> DRAFT even after payment
        elif 'COMPREHENSIVE' in coverage_type:
            policy.status = 'DRAFT'
            print(f"📋 Comprehensive policy created as DRAFT: {policy.policy_number}")
        
        # Default fallback
        else:
            if payment_method in ['mpesa', 'dpo', 'card']:
                policy.status = 'PENDING_PAYMENT'
            else:
                policy.status = 'DRAFT'
        
        # Save the policy
        policy.save()
        
        # DMVIC issuance and final activation are performed by the activation pipeline.
        dmvic_certificate_details = None
        
        # Prepare response
        response_data = {
            'success': True,
            'policyNumber': policy.policy_number,
            'policyId': str(policy.id),
            'pdfUrl': policy.policy_document_url,  # Will be null initially
            'message': 'Policy created successfully',
            'status': policy.status,
            'submittedAt': policy.submitted_at.isoformat(),
            'paymentPlan': product_details.get('payment_plan'),
            'isExtendible': is_extendible
        }
        
        # Add DMVIC certificate details to response if available
        if dmvic_certificate_details:
            response_data['dmvicCertificate'] = dmvic_certificate_details
        
        # Add extendible-specific fields to response
        if is_extendible and 'extendible_config' in product_details:
            ext_config = product_details['extendible_config']
            response_data['extendibleDetails'] = {
                'initialAmount': ext_config['initial_amount'],
                'balanceAmount': ext_config['balance_amount'],
                'initialPeriodDays': ext_config['initial_period_days'],
                'balanceDeadlineDays': ext_config['extension_deadline_days'],
                'balanceDeadline': (policy.cover_start_date + timedelta(days=ext_config['initial_period_days'] + ext_config['extension_deadline_days'])).isoformat() if policy.cover_start_date else None
            }
        
        return Response(response_data, status=201)
        
    except Exception as e:
        # Log the error (in production, use proper logging)
        print(f"Error creating motor policy: {str(e)}")
        
        return Response({
            'success': False,
            'error': 'Failed to create policy',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_motor_policy(request, policy_number):
    """
    Retrieve a specific motor policy by policy number
    """
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        serializer = MotorPolicySerializer(policy)
        
        return Response({
            'success': True,
            'policy': serializer.data
        })
        
    except MotorPolicy.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Policy not found'
        }, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_motor_policies(request):
    """
    List all motor policies for the authenticated user
    """
    policies = MotorPolicy.objects.filter(user=request.user)
    
    # Optional filtering by status
    status = request.GET.get('status')
    if status:
        policies = policies.filter(status=status.upper())
    
    serializer = MotorPolicySerializer(policies, many=True)
    data = serializer.data
    # Non-breaking alias for simpler consumers
    return Response({
        'success': True,
        'count': len(data),
        'policies': data,
        'items': data  # alias
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def retry_policy_payment(request, policy_number):
    """
    Retry payment for a PENDING_PAYMENT policy.
    
    This endpoint allows agents to initiate a new payment attempt for policies
    that failed payment processing or were created without immediate payment.
    
    Returns:
    {
        "success": true,
        "policy_number": "POL-2025-123456",
        "amount": 15000.00,
        "phone": "254712345678",
        "retry_count": 2,
        "message": "Payment retry initiated"
    }
    """
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        # Attempt payment retry
        result = policy.retry_payment()
        
        return Response(result, status=200)
    
    except MotorPolicy.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Policy not found'
        }, status=404)
    
    except ValueError as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=400)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to retry payment',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_upcoming_renewals(request):
    """
    Get Motor 2 policies eligible for renewal (90 days before to 7 days after expiry).
    Uses MotorPolicy.is_renewable computed property.
    """
    from django.utils import timezone
    from datetime import timedelta
    
    today = timezone.now().date()
    renewal_window_start = today - timedelta(days=7)   # 7 days past expiry
    renewal_window_end = today + timedelta(days=90)    # 90 days before expiry
    
    policies = MotorPolicy.objects.filter(
        user=request.user,
        status='ACTIVE',
        cover_end_date__range=[renewal_window_start, renewal_window_end]
    ).order_by('cover_end_date')
    
    renewals = []
    for policy in policies:
        # Use computed property to verify renewability
        if not policy.is_renewable:
            continue
            
        if policy.cover_end_date:
            days_until_expiry = policy.days_until_expiry or 0
            urgency = policy.renewal_urgency
            
            # Map urgency to badge color and status text
            urgency_map = {
                'OVERDUE': {'status': 'Overdue', 'badge_color': '#DC2626'},  # red
                'URGENT': {'status': 'Due Soon', 'badge_color': '#F59E0B'},  # orange
                'STANDARD': {'status': 'Upcoming', 'badge_color': '#3B82F6'},  # blue
                'EARLY_BIRD': {'status': 'Early Renewal', 'badge_color': '#10B981'},  # green
            }
            
            urgency_info = urgency_map.get(urgency, {'status': 'Upcoming', 'badge_color': '#3B82F6'})
            
            renewals.append({
                'id': str(policy.id),
                'policyNo': policy.policy_number,
                'vehicleReg': (policy.vehicle_details.get('registration') or policy.vehicle_details.get('registration_number') or 'N/A'),
                'vehicleMake': policy.vehicle_details.get('make', 'N/A'),
                'vehicleModel': policy.vehicle_details.get('model', 'N/A'),
                'clientName': policy.client_details.get('fullName', 'N/A'),
                'dueDate': policy.cover_end_date.isoformat(),
                'daysLeft': max(0, days_until_expiry),
                'status': urgency_info['status'],
                'urgency': urgency,
                'badgeColor': urgency_info['badge_color'],
                'category': policy.product_details.get('category', 'MOTOR'),
                'coverType': policy.product_details.get('coverType') or policy.product_details.get('subcategory', 'UNKNOWN'),
                'currentPremium': (policy.premium_breakdown.get('total_premium') or policy.premium_breakdown.get('total_amount') or 0),
                'underwriter': policy.underwriter_details.get('name', 'N/A') if policy.underwriter_details else 'N/A'
            })
    
    return Response({
        'success': True,
        'count': len(renewals),
        'renewals': renewals
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_upcoming_extensions(request):
    """
    Get Motor 2 extendible policies showing extension timeline.
    Returns ACTIVE extendible policies with balance payment timeline.
    """
    from django.utils import timezone
    from ..utils.product_labels import get_product_label
    import logging
    logger = logging.getLogger(__name__)
    
    today = timezone.now().date()
    
    # Get ACTIVE extendible policies
    active_policies = MotorPolicy.objects.filter(
        user=request.user,
        status='ACTIVE'
    ).order_by('cover_start_date')
    
    logger.info(f"[get_upcoming_extensions] Found {active_policies.count()} ACTIVE policies for user {request.user.id}")
    
    extensions = []
    for policy in active_policies:
        # Check if policy is extendible
        is_extendible = policy.product_details.get('is_extendible', False)
        logger.info(f"[get_upcoming_extensions] Policy {policy.policy_number}: is_extendible={is_extendible}")
        
        if not is_extendible:
            continue
        
        # Skip policies that have already paid their balance
        has_been_extended = policy.product_details.get('has_been_extended', False)
        if has_been_extended:
            logger.info(f"[get_upcoming_extensions] Policy {policy.policy_number} already extended - skipping")
            continue
        
        # Get extendible config from product_details
        extendible_config = policy.product_details.get('extendible_config') or policy.product_details.get('extendibleConfig')
        
        if not extendible_config:
            logger.warning(f"[get_upcoming_extensions] Policy {policy.policy_number} is extendible but has no config!")
            continue
        
        logger.info(f"[get_upcoming_extensions] Policy {policy.policy_number} has extendible config: {extendible_config}")

        # ---------------------------------------------------------------------
        # Manual valuation gating (primarily Comprehensive)
        # ---------------------------------------------------------------------
        cover_type_raw = (
            policy.product_details.get('coverType')
            or policy.product_details.get('cover_type')
            or policy.product_details.get('subcategory')
            or ''
        )
        cover_type_upper = str(cover_type_raw).upper()

        requires_valuation = bool(policy.product_details.get('requires_valuation')) or ('COMPREHENSIVE' in cover_type_upper)
        valuation_status = getattr(policy, 'valuation_status', None) or 'PENDING'

        can_extend = True
        cta_label = 'Extend Policy'
        extension_block_reason = None
        if requires_valuation and valuation_status != 'VALUED':
            can_extend = False
            if valuation_status == 'REJECTED':
                cta_label = 'Valuation Rejected'
                extension_block_reason = 'Valuation was rejected.'
            else:
                cta_label = 'Pending Valuation'
                extension_block_reason = 'Waiting for valuation approval.'
        
        # Extract timeline parameters
        initial_period_days = extendible_config.get('initial_period_days', 30)
        extension_deadline_days = extendible_config.get('extension_deadline_days', 60)
        initial_amount = float(extendible_config.get('initial_amount', 0))
        balance_amount = float(extendible_config.get('balance_amount', 0))
        
        # Calculate timeline dates
        cover_start = policy.cover_start_date
        if not cover_start:
            logger.warning(f"[get_upcoming_extensions] Policy {policy.policy_number} has no cover_start_date!")
            continue
            
        from datetime import timedelta
        initial_period_end = cover_start + timedelta(days=initial_period_days)
        balance_deadline = initial_period_end + timedelta(days=extension_deadline_days)
        
        # Calculate days remaining
        days_to_initial_end = (initial_period_end - today).days
        days_to_balance_deadline = (balance_deadline - today).days
        
        # Determine extension status
        if days_to_balance_deadline <= 7:
            extension_status = 'Balance Due Soon'
            badge_color = '#DC2626'  # red
        elif days_to_initial_end <= 7:
            extension_status = 'Initial Period Ending'
            badge_color = '#F59E0B'  # orange
        elif days_to_initial_end <= 0:
            extension_status = 'Balance Payment Period'
            badge_color = '#F59E0B'  # orange
        else:
            extension_status = 'Active Period'
            badge_color = '#10B981'  # green
        
        # Format product name for display
        raw_product_name = policy.product_details.get('subcategory') or policy.product_details.get('coverType') or 'EXTENDIBLE'
        formatted_product_name = get_product_label(raw_product_name, include_extendible_suffix=True)
        
        # Extract payment transaction details
        payment_details = policy.payment_details or {}
        transaction_id = payment_details.get('transactionId') or payment_details.get('transaction_id') or 'N/A'
        payment_method = payment_details.get('method', 'N/A')
        payment_amount = payment_details.get('amount', 0)
        payment_status = payment_details.get('status', 'PENDING')
        
        # Extract underwriter details
        underwriter_name = 'Not Selected'
        if policy.underwriter_details:
            underwriter_name = policy.underwriter_details.get('name') or \
                             policy.underwriter_details.get('company') or \
                             policy.underwriter_details.get('company_name') or \
                             'Selected'
        elif policy.product_details.get('is_extendible'):
            underwriter_name = 'Pending (Balance Payment)'
        
        try:
            certificates_issued = policy.dmvic_certificates.count()
        except Exception:
            certificates_issued = 0

        extensions.append({
            'id': str(policy.id),
            'policyNo': policy.policy_number,
            'policy_number': policy.policy_number,
            'vehicleReg': (policy.vehicle_details.get('registration') or policy.vehicle_details.get('registration_number') or 'N/A'),
            'vehicle_reg': (policy.vehicle_details.get('registration') or policy.vehicle_details.get('registration_number') or 'N/A'),
            'vehicleMake': policy.vehicle_details.get('make', 'N/A'),
            'vehicleModel': policy.vehicle_details.get('model', 'N/A'),
            'productName': formatted_product_name,
            'product_name': formatted_product_name,
            'clientName': policy.client_details.get('fullName', 'N/A'),
            'status': extension_status,
            'badgeColor': badge_color,
            'certificatesIssued': certificates_issued,
            'certificates_issued': certificates_issued,
            # Timeline information
            'initialPeriodEnd': initial_period_end.isoformat(),
            'initial_period_end': initial_period_end.isoformat(),
            'balanceDeadline': balance_deadline.isoformat(),
            'balance_deadline': balance_deadline.isoformat(),
            'daysToInitialEnd': days_to_initial_end,
            'daysToBalanceDeadline': days_to_balance_deadline,
            # Payment information from extendible_config
            'initialAmount': initial_amount,
            'initial_amount': initial_amount,
            'balanceAmount': balance_amount,
            'balance_amount': balance_amount,
            'totalAnnualPremium': initial_amount + balance_amount,
            # Actual payment transaction details
            'transactionId': transaction_id,
            'transaction_id': transaction_id,
            'paymentMethod': payment_method,
            'payment_method': payment_method,
            'paidAmount': payment_amount,
            'paid_amount': payment_amount,
            'paymentStatus': payment_status,
            'payment_status': payment_status,
            # Underwriter info
            'underwriterName': underwriter_name,
            'underwriter_name': underwriter_name,
            # Valuation gating
            'requiresValuation': requires_valuation,
            'requires_valuation': requires_valuation,
            'valuationStatus': valuation_status,
            'valuation_status': valuation_status,
            'canExtend': can_extend,
            'can_extend': can_extend,
            'ctaLabel': cta_label,
            'cta_label': cta_label,
            'extensionBlockReason': extension_block_reason,
            'extension_block_reason': extension_block_reason,
            # Config
            'initial_period_days': initial_period_days,
            'grace_total_days': extension_deadline_days,
            'lateFeePercentage': 0,  # No late fee during active period
            'cover_end': policy.cover_end_date.isoformat() if policy.cover_end_date else None,
            'category': policy.product_details.get('category', 'MOTOR'),
            'coverType': policy.product_details.get('coverType') or policy.product_details.get('subcategory', 'UNKNOWN'),
        })
    
    # Sort by balance deadline urgency
    extensions.sort(key=lambda x: x['daysToBalanceDeadline'])
    
    logger.info(f"[get_upcoming_extensions] Returning {len(extensions)} extensions")
    
    return Response({
        'success': True,
        'count': len(extensions),
        'extensions': extensions
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_renewal_eligibility(request, policy_number):
    """
    Check if a policy is eligible for renewal
    """
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        today = timezone.now().date()
        
        # Check basic eligibility
        is_active = policy.status == 'ACTIVE'
        has_end_date = policy.cover_end_date is not None
        
        if not has_end_date:
            return Response({
                'eligible': False,
                'reason': 'Policy does not have an end date'
            })
        
        days_until_expiry = (policy.cover_end_date - today).days
        
        # Renewal window: 30 days before to 7 days after expiry
        in_renewal_window = -7 <= days_until_expiry <= 30
        
        # Determine renewal type
        if days_until_expiry < 0:
            renewal_type = 'late'
        elif days_until_expiry <= 7:
            renewal_type = 'urgent'
        else:
            renewal_type = 'standard'
        
        eligible = is_active and in_renewal_window
        
        return Response({
            'eligible': eligible,
            'daysUntilExpiry': days_until_expiry,
            'renewalType': renewal_type,
            'currentStatus': policy.status,
            'expiryDate': policy.cover_end_date.isoformat() if policy.cover_end_date else None,
            'reason': None if eligible else 'Policy is not in renewal window or not active'
        })
        
    except MotorPolicy.DoesNotExist:
        return Response({
            'eligible': False,
            'reason': 'Policy not found'
        }, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_extension_eligibility(request, policy_number):
    """
    Check if a policy is eligible for extension (extendible products only)
    """
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        # Check if product is extendible
        is_extendible = policy.product_details.get('is_extendible', False)
        
        if not is_extendible:
            return Response({
                'eligible': False,
                'reason': 'This product is not extendible'
            })
        
        # Check policy status
        is_active = policy.status == 'ACTIVE'
        
        if not is_active:
            return Response({
                'eligible': False,
                'reason': 'Policy is not active'
            })
        
        # Extension status is tracked in product_details.extendible_config, not separate table
        # Check if policy has already been extended by looking at product_details
        extended_flag = policy.product_details.get('has_been_extended', False)
        if extended_flag:
            return Response({
                'eligible': False,
                'reason': 'Policy has already been extended'
            })
        
        today = timezone.now().date()
        grace_period = today + timedelta(days=30)  # 30-day grace period
        
        # Check if within extension window
        in_extension_window = policy.cover_end_date and policy.cover_end_date <= grace_period
        
        return Response({
            'eligible': in_extension_window,
            'expiryDate': policy.cover_end_date.isoformat() if policy.cover_end_date else None,
            'gracePeriodEnd': grace_period.isoformat(),
            'reason': None if in_extension_window else 'Policy is not within extension window'
        })
        
    except MotorPolicy.DoesNotExist:
        return Response({
            'eligible': False,
            'reason': 'Policy not found'
        }, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renew_motor_policy(request, policy_number):
    """
    Renew a Motor 2 policy with updated information and pricing
    """
    try:
        original_policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        # Validate renewal eligibility first
        renewal_check = check_renewal_eligibility(request, policy_number)
        if not renewal_check.data.get('eligible'):
            return Response({
                'success': False,
                'error': 'Policy not eligible for renewal',
                'details': renewal_check.data
            }, status=400)
        
        # Get updated data from request
        updated_data = request.data
        
        # Create new policy as renewal
        renewed_policy = MotorPolicy()
        renewed_policy.policy_number = renewed_policy.generate_policy_number()
        renewed_policy.user = request.user
        renewed_policy.agent_code = original_policy.agent_code
        
        # Mark as renewal
        renewed_policy.is_renewal = True
        renewed_policy.original_policy_id = original_policy.id
        renewed_policy.renewal_count = (original_policy.renewal_count or 0) + 1
        
        # Update client details with any changes
        renewed_policy.client_details = {
            **original_policy.client_details,
            **updated_data.get('clientDetails', {})
        }
        
        # Update vehicle details with any changes
        renewed_policy.vehicle_details = {
            **original_policy.vehicle_details,
            **updated_data.get('vehicleDetails', {})
        }
        
        # Keep product details (can be updated if needed)
        renewed_policy.product_details = {
            **original_policy.product_details,
            **updated_data.get('productDetails', {})
        }
        
        # Update underwriter if changed
        renewed_policy.underwriter_details = updated_data.get('underwriterDetails') or original_policy.underwriter_details
        
        # Recalculate premium if provided, otherwise use original
        renewed_policy.premium_breakdown = updated_data.get('premiumBreakdown') or original_policy.premium_breakdown
        
        # Set payment details
        renewed_policy.payment_details = updated_data.get('paymentDetails', {})
        
        # Set new cover dates
        from datetime import datetime, timedelta
        start_date = datetime.strptime(updated_data.get('coverStartDate', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        end_date = start_date + timedelta(days=365)
        
        renewed_policy.cover_start_date = start_date
        renewed_policy.cover_end_date = end_date
        
        # Set status
        renewed_policy.status = 'PENDING_PAYMENT'
        
        # Copy addons and documents
        renewed_policy.addons = updated_data.get('addons', original_policy.addons)
        renewed_policy.documents = updated_data.get('documents', original_policy.documents)
        
        # Save the renewed policy
        renewed_policy.save()
        
        # Update original policy status
        original_policy.status = 'EXPIRED'
        original_policy.save()
        
        return Response({
            'success': True,
            'renewedPolicyNumber': renewed_policy.policy_number,
            'renewedPolicyId': str(renewed_policy.id),
            'originalPolicyNumber': original_policy.policy_number,
            'message': 'Policy renewed successfully'
        }, status=201)
        
    except MotorPolicy.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Original policy not found'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to renew policy',
            'details': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extend_motor_policy(request, policy_number):
    """
    Extend a Motor 2 policy using extendible_config from product_details.
    Only works for policies with extendible_config configured.
    """
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        # Get extendible_config from product_details
        extendible_config = policy.product_details.get('extendible_config') or policy.product_details.get('extendibleConfig')
        
        if not extendible_config:
            return Response({
                'success': False,
                'error': 'Policy not eligible for extension',
                'reason': 'Policy does not have extendible configuration'
            }, status=400)

        # Manual valuation gating (primarily Comprehensive)
        cover_type_raw = (
            policy.product_details.get('coverType')
            or policy.product_details.get('cover_type')
            or policy.product_details.get('subcategory')
            or ''
        )
        cover_type_upper = str(cover_type_raw).upper()
        requires_valuation = bool(policy.product_details.get('requires_valuation')) or ('COMPREHENSIVE' in cover_type_upper)

        if requires_valuation and getattr(policy, 'valuation_status', 'PENDING') != 'VALUED':
            return Response({
                'success': False,
                'error': 'Pending valuation',
                'reason': 'Policy requires valuation approval before extension can be processed',
                'valuation_status': getattr(policy, 'valuation_status', 'PENDING'),
            }, status=400)
        
        # For extendible policies, "extension" means paying the balance amount
        # Policy can be ACTIVE (during initial period) or EXPIRED (within grace period)
        # Check if policy is eligible for balance payment
        today = timezone.now().date()
        
        # Calculate timeline from extendible config
        initial_period_days = extendible_config.get('initial_period_days', 30)
        extension_deadline_days = extendible_config.get('extension_deadline_days', 60)
        
        if not policy.cover_start_date:
            return Response({
                'success': False,
                'error': 'Policy not eligible for extension',
                'reason': 'Policy does not have a cover start date'
            }, status=400)
        
        initial_period_end = policy.cover_start_date + timedelta(days=initial_period_days)
        balance_deadline = initial_period_end + timedelta(days=extension_deadline_days)
        
        # Check if within balance payment window
        if today > balance_deadline:
            return Response({
                'success': False,
                'error': 'Extension deadline passed',
                'reason': f'Balance payment deadline was {balance_deadline.isoformat()}'
            }, status=400)
        
        # Check if already extended
        if policy.product_details.get('has_been_extended'):
            return Response({
                'success': False,
                'error': 'Policy already extended',
                'reason': 'Balance amount has already been paid'
            }, status=400)
        
        # Get extension parameters
        months_to_extend = request.data.get('months', 11)  # Default full balance period
        payment_details = request.data.get('paymentDetails', {})
        
        # Calculate extension amount
        today = timezone.now().date()
        balance_amount = float(extendible_config.get('balance_amount', 0))
        allow_partial_extension = extendible_config.get('allow_partial_extension', False)
        penalty_percentage = float(extendible_config.get('penalty_for_late_extension', 0))
        extension_deadline_days = extendible_config.get('extension_deadline_days', 90)
        
        # Determine if this is balance payment (ACTIVE) or late extension (EXPIRED)
        is_balance_payment = policy.status == 'ACTIVE'
        days_since_expiry = 0 if is_balance_payment else (today - policy.cover_end_date).days
        
        # Prorated amount based on balance
        if allow_partial_extension:
            # Calculate prorated amount for requested months
            days_to_extend = months_to_extend * 30
            prorated_amount = (balance_amount / 365) * days_to_extend
        else:
            # Full balance amount
            prorated_amount = balance_amount
        
        # Apply late fee ONLY if policy is expired (not for balance payments during initial period)
        if is_balance_payment:
            late_fee = 0.0  # No late fee during initial period
        else:
            late_fee = prorated_amount * (penalty_percentage / 100)
        
        # Calculate mandatory levies on base amount + late fee
        base_with_late_fee = prorated_amount + late_fee
        itl = base_with_late_fee * 0.0025  # 0.25%
        pcf = base_with_late_fee * 0.0025  # 0.25%
        stamp_duty = 40.00
        
        total_amount = base_with_late_fee + itl + pcf + stamp_duty
        
        # Calculate new expiry date
        if is_balance_payment:
            # For balance payment during initial period, extend to 1 year from original cover start
            new_expiry = policy.cover_start_date + timedelta(days=365)
        elif allow_partial_extension:
            # For late extension with partial months
            new_expiry = policy.cover_end_date + timedelta(days=months_to_extend * 30)
        else:
            # For late extension with full year
            new_expiry = policy.cover_end_date + timedelta(days=365)
        
        # Create extension record (response payload for frontend)
        extension_data = {
            'policyNumber': policy_number,
            'extensionQuote': {
                'prorated_amount': round(prorated_amount, 2),
                'late_fee': round(late_fee, 2),
                'late_fee_percentage': penalty_percentage,
                'days_since_expiry': days_since_expiry,
                'itl': round(itl, 2),
                'pcf': round(pcf, 2),
                'stamp_duty': stamp_duty,
                'total_amount': round(total_amount, 2)
            },
            'currentExpiryDate': policy.cover_end_date.isoformat(),
            'newExpiryDate': new_expiry.isoformat(),
            'extensionPeriodDays': (new_expiry - policy.cover_end_date).days,
            'graceRemainingDays': extension_deadline_days - days_since_expiry,
            'message': 'Extension quote generated. Proceed to payment to activate extension.'
        }
        
        # Check if payment details are provided (payment confirmation)
        if payment_details and payment_details.get('status') == 'CONFIRMED':
            # Payment confirmed - activate the extension
            import logging
            logger = logging.getLogger(__name__)
            
            logger.info(f"[extend_motor_policy] Processing payment for extension: {policy_number}")
            logger.info(f"[extend_motor_policy] Payment details: {payment_details}")
            
            # Update policy with extension
            policy.cover_end_date = new_expiry
            policy.status = 'ACTIVE'  # Keep policy active after extension
            
            # Mark as extended
            policy.product_details['has_been_extended'] = True
            policy.product_details['extension_history'] = policy.product_details.get('extension_history', [])
            policy.product_details['extension_history'].append({
                'extended_on': today.isoformat(),
                'old_expiry': extension_data['currentExpiryDate'],
                'new_expiry': new_expiry.isoformat(),
                'amount_paid': round(total_amount, 2),
                'payment_method': payment_details.get('method', 'unknown'),
                'transaction_id': payment_details.get('transactionId') or payment_details.get('transaction_id'),
                'late_fee': round(late_fee, 2),
                'days_since_expiry': days_since_expiry
            })
            
            # Update payment details in policy
            if not policy.payment_details:
                policy.payment_details = {}
            
            policy.payment_details['extension_payment'] = {
                'amount': round(total_amount, 2),
                'method': payment_details.get('method', 'unknown'),
                'transaction_id': payment_details.get('transactionId') or payment_details.get('transaction_id'),
                'status': 'CONFIRMED',
                'timestamp': payment_details.get('timestamp') or timezone.now().isoformat(),
                'breakdown': {
                    'base_amount': round(prorated_amount, 2),
                    'late_fee': round(late_fee, 2),
                    'itl': round(itl, 2),
                    'pcf': round(pcf, 2),
                    'stamp_duty': stamp_duty
                }
            }
            
            # Clear pending extension
            if 'pending_extension' in policy.product_details:
                del policy.product_details['pending_extension']
            
            policy.save()
            
            logger.info(f"[extend_motor_policy] Extension payment processed successfully for {policy_number}")
            logger.info(f"[extend_motor_policy] New expiry date: {new_expiry}")
            
            return Response({
                'success': True,
                'message': 'Extension payment processed successfully',
                'policyNumber': policy_number,
                'newExpiryDate': new_expiry.isoformat(),
                'amountPaid': round(total_amount, 2),
                'transactionId': payment_details.get('transactionId') or payment_details.get('transaction_id'),
                'status': 'ACTIVE'
            }, status=200)
        
        # No payment confirmation - just return quote
        # Store extension data in policy for payment processing
        if not policy.product_details.get('pending_extension'):
            policy.product_details['pending_extension'] = extension_data
            policy.save()
        
        return Response({
            'success': True,
            **extension_data
        }, status=200)
        
    except MotorPolicy.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Policy not found'
        }, status=404)
    except Exception as e:
        import traceback
        print(f"Extension error: {traceback.format_exc()}")
        return Response({
            'success': False,
            'error': 'Failed to generate extension quote',
            'details': str(e)

        }, status=500)


# =========================================================================
# DMVIC CERTIFICATE MANAGEMENT ENDPOINTS (Intermediary Integration)
# =========================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_certificate_preview(request, policy_number):
    """
    Get or generate DMVIC certificate preview for a motor policy.
    
    GET /api/v1/policies/motor/<policy_number>/certificate/preview/
    
    Returns existing preview URL or generates a new one if not available.
    Preview works WITHOUT inventory allocation.
    """
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        # If preview already exists and status is PREVIEW_GENERATED, return it
        if policy.dmvic_certificate_preview_url and policy.dmvic_status == 'PREVIEW_GENERATED':
            return Response({
                'success': True,
                'preview_url': policy.dmvic_certificate_preview_url,
                'status': policy.dmvic_status,
                'certificate_type': policy.dmvic_certificate_type,
                'cached': True,
            }, status=200)
        
        # Generate new preview
        from app.services.dmvic_service import get_dmvic_service
        
        dmvic_service = get_dmvic_service()
        
        # Build policy_data dictionary
        policy_data = {
            'registration_number': policy.registration_number,
            'chassis_number': policy.chassis_number or '',
            'engine_number': policy.engine_number or '',
            'year_of_manufacture': policy.year_of_manufacture,
            'make': policy.vehicle_make or '',
            'model': policy.vehicle_model or '',
            'body_type': policy.body_type or '',
            'color': policy.color or '',
            'seating_capacity': policy.seating_capacity or 0,
            'cover_type': policy.coverage_type or 'THIRD_PARTY',
            'policy_number': policy.policy_number,
            'start_date': policy.start_date,
            'end_date': policy.end_date,
            'sum_insured': policy.sum_insured or 0,
            'premium': policy.total_premium or 0,
            'customer_name': f"{policy.policyholder_first_name} {policy.policyholder_last_name}".strip(),
            'id_number': policy.policyholder_id_number or '',
            'phone_number': policy.policyholder_phone or '',
            'email': policy.policyholder_email or '',
            'postal_address': policy.policyholder_address or '',
        }
        
        # Generate preview
        preview_result = dmvic_service.preview_type_a_certificate_intermediary(policy_data)
        
        if preview_result['success']:
            # Update policy
            policy.dmvic_certificate_preview_url = preview_result['preview_url']
            policy.dmvic_status = 'PREVIEW_GENERATED'
            policy.dmvic_certificate_type = str(preview_result['certificate_type'])
            policy.save(update_fields=[
                'dmvic_certificate_preview_url',
                'dmvic_status',
                'dmvic_certificate_type'
            ])
            
            return Response({
                'success': True,
                'preview_url': preview_result['preview_url'],
                'status': 'PREVIEW_GENERATED',
                'certificate_type': preview_result['certificate_type'],
                'cached': False,
            }, status=200)
        else:
            # Update status to FAILED
            policy.dmvic_status = 'FAILED'
            policy.save(update_fields=['dmvic_status'])
            
            return Response({
                'success': False,
                'error': 'Preview generation failed',
                'errors': preview_result['errors'],
                'status': 'FAILED',
            }, status=400)
            
    except MotorPolicy.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Policy not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Certificate preview error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to generate preview',
            'details': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def issue_certificate(request, policy_number):
    """
    Issue actual DMVIC certificate for a motor policy.
    
    POST /api/v1/policies/motor/<policy_number>/certificate/issue/
    
    **NOTE: Will fail with ER006 until DMVIC allocates PSV sticker inventory.**
    Currently only Type 8 (PSV/Taxi) certificates are authorized for account 97218.
    """
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        # Check if certificate already issued
        if policy.dmvic_certificate_number and policy.dmvic_status == 'ISSUED':
            return Response({
                'success': True,
                'message': 'Certificate already issued',
                'certificate_number': policy.dmvic_certificate_number,
                'certificate_pdf_url': policy.dmvic_certificate_pdf_url,
                'status': 'ISSUED',
                'cached': True,
            }, status=200)
        
        # Issue certificate
        from app.services.dmvic_service import get_dmvic_service
        
        dmvic_service = get_dmvic_service()
        
        # Build policy_data dictionary
        policy_data = {
            'registration_number': policy.registration_number,
            'chassis_number': policy.chassis_number or '',
            'engine_number': policy.engine_number or '',
            'year_of_manufacture': policy.year_of_manufacture,
            'make': policy.vehicle_make or '',
            'model': policy.vehicle_model or '',
            'body_type': policy.body_type or '',
            'color': policy.color or '',
            'seating_capacity': policy.seating_capacity or 0,
            'cover_type': policy.coverage_type or 'THIRD_PARTY',
            'policy_number': policy.policy_number,
            'start_date': policy.start_date,
            'end_date': policy.end_date,
            'sum_insured': policy.sum_insured or 0,
            'premium': policy.total_premium or 0,
            'customer_name': f"{policy.policyholder_first_name} {policy.policyholder_last_name}".strip(),
            'id_number': policy.policyholder_id_number or '',
            'phone_number': policy.policyholder_phone or '',
            'email': policy.policyholder_email or '',
            'postal_address': policy.policyholder_address or '',
        }
        
        # Issue certificate
        issue_result = dmvic_service.issue_type_a_certificate_intermediary(policy_data)
        
        if issue_result['success']:
            # Update policy with certificate details
            policy.dmvic_certificate_number = issue_result['certificate_number']
            policy.dmvic_transaction_no = issue_result['transaction_no']
            policy.dmvic_ref_no = issue_result['ref_no']
            policy.dmvic_certificate_pdf_url = issue_result['certificate_pdf_url']
            policy.dmvic_status = 'ISSUED'
            policy.dmvic_issued_at = timezone.now()
            policy.save(update_fields=[
                'dmvic_certificate_number',
                'dmvic_transaction_no',
                'dmvic_ref_no',
                'dmvic_certificate_pdf_url',
                'dmvic_status',
                'dmvic_issued_at',
            ])
            
            return Response({
                'success': True,
                'message': 'Certificate issued successfully',
                'certificate_number': issue_result['certificate_number'],
                'transaction_no': issue_result['transaction_no'],
                'ref_no': issue_result['ref_no'],
                'certificate_pdf_url': issue_result['certificate_pdf_url'],
                'status': 'ISSUED',
            }, status=200)
        else:
            # Check for ER006 (no inventory)
            has_er006 = any(
                err.get('ErrorCode') == 'ER006' 
                for err in issue_result['errors']
            )
            
            if has_er006:
                policy.dmvic_status = 'NO_INVENTORY'
                policy.save(update_fields=['dmvic_status'])
                
                return Response({
                    'success': False,
                    'error': 'No inventory allocated',
                    'user_message': 'DMVIC certificate issuance requires sticker inventory allocation. Please contact DMVIC.',
                    'errors': issue_result['errors'],
                    'status': 'NO_INVENTORY',
                }, status=400)
            else:
                policy.dmvic_status = 'FAILED'
                policy.save(update_fields=['dmvic_status'])
                
                return Response({
                    'success': False,
                    'error': 'Certificate issuance failed',
                    'errors': issue_result['errors'],
                    'status': 'FAILED',
                }, status=400)
            
    except MotorPolicy.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Policy not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Certificate issuance error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to issue certificate',
            'details': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_certificate_status(request, policy_number):
    """
    Get DMVIC certificate status for a motor policy.
    
    GET /api/v1/policies/motor/<policy_number>/certificate/status/
    
    Returns:
    - PENDING: Not yet generated
    - PREVIEW_GENERATED: Preview available
    - ISSUED: Certificate issued
    - FAILED: Generation/issuance failed
    - NO_INVENTORY: Issuance blocked due to no inventory
    """
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        return Response({
            'success': True,
            'policy_number': policy.policy_number,
            'dmvic_status': policy.dmvic_status or 'PENDING',
            'certificate_number': policy.dmvic_certificate_number,
            'certificate_type': policy.dmvic_certificate_type,
            'preview_url': policy.dmvic_certificate_preview_url,
            'certificate_pdf_url': policy.dmvic_certificate_pdf_url,
            'issued_at': policy.dmvic_issued_at,
            'transaction_no': policy.dmvic_transaction_no,
            'ref_no': policy.dmvic_ref_no,
        }, status=200)
        
    except MotorPolicy.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Policy not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Certificate status error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to get certificate status',
            'details': str(e)
        }, status=500)
