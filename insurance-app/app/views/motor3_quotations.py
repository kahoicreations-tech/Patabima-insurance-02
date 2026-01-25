from datetime import datetime
import base64
import random

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from app.models import Motor3Quotation
from app.serializers import MotorPolicySubmissionSerializer


def _generate_motor3_quote_number() -> str:
    # Example: M3Q-2026-123456
    return f"M3Q-{datetime.now().year}-{random.randint(100000, 999999)}"


def _create_motor3_quotation(request, coverage_type: str):
    # Validate payload using the same schema as policy creation
    serializer = MotorPolicySubmissionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'error': 'Validation error',
            'details': serializer.errors,
        }, status=400)

    validated_data = serializer.validated_data

    quote_number = _generate_motor3_quote_number()

    quotation = Motor3Quotation.objects.create(
        quote_number=quote_number,
        user=request.user,
        status='DRAFT',
        coverage_type=coverage_type,
        payload=request.data,
        normalized_payload=validated_data,
        registration_number=(validated_data.get('vehicleDetails') or {}).get('registration')
            or (validated_data.get('vehicleDetails') or {}).get('registrationNumber')
            or (validated_data.get('vehicleDetails') or {}).get('registration_number')
            or None,
        proposed_cover_start_date=(validated_data.get('vehicleDetails') or {}).get('coverStartDate')
            or (validated_data.get('vehicleDetails') or {}).get('cover_start_date')
            or None,
        transaction_id=(validated_data.get('paymentDetails') or {}).get('transaction_id')
            or (validated_data.get('paymentDetails') or {}).get('transactionId')
            or None,
    )

    return Response({
        'success': True,
        'quote_number': quotation.quote_number,
        'quotation': {
            'id': str(quotation.id),
            'quote_number': quotation.quote_number,
            'status': quotation.status,
            'policy_number': quotation.policy_number,
            'coverage_type': quotation.coverage_type,
            'registration_number': quotation.registration_number,
            'transaction_id': quotation.transaction_id,
            'created_at': quotation.date_created.isoformat() if quotation.date_created else None,
        }
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_motor3_third_party_quotation(request):
    return _create_motor3_quotation(request, coverage_type='THIRD_PARTY')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_motor3_comprehensive_quotation(request):
    return _create_motor3_quotation(request, coverage_type='COMPREHENSIVE')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_motor3_tor_quotation(request):
    """
    Create a Motor3 TOR (Temporary On Road) quotation.
    TOR policies are short-term coverage (30, 60, or 90 days) for vehicles in transit.
    """
    # Validate duration_days (TOR specific requirement)
    duration_days = request.data.get('duration_days') or request.data.get('productDetails', {}).get('duration_days')
    valid_durations = [30, 60, 90]
    
    if not duration_days or int(duration_days) not in valid_durations:
        return Response({
            'error': f'Invalid duration_days. Must be one of {valid_durations}',
            'code': 'INVALID_TOR_DURATION'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    return _create_motor3_quotation(request, coverage_type='TOR')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_motor3_quotations(request):
    qs = Motor3Quotation.objects.filter(user=request.user).order_by('-date_created')

    status_filter = request.GET.get('status')
    if status_filter:
        qs = qs.filter(status=str(status_filter).upper())

    reg = request.GET.get('registration_number') or request.GET.get('registration')
    if reg:
        qs = qs.filter(registration_number__iexact=str(reg).strip())

    items = []
    for q in qs[:200]:
        items.append({
            'id': str(q.id),
            'quote_number': q.quote_number,
            'status': q.status,
            'policy_number': q.policy_number,
            'coverage_type': q.coverage_type,
            'registration_number': q.registration_number,
            'transaction_id': q.transaction_id,
            'created_at': q.date_created.isoformat() if q.date_created else None,
        })

    return Response({
        'success': True,
        'count': qs.count(),
        'results': items,
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_motor3_quotation(request, quotation_id):
    try:
        q = Motor3Quotation.objects.get(id=quotation_id, user=request.user)
    except Motor3Quotation.DoesNotExist:
        return Response({'success': False, 'error': 'Quotation not found'}, status=404)

    return Response({
        'success': True,
        'quotation': {
            'id': str(q.id),
            'quote_number': q.quote_number,
            'status': q.status,
            'policy_number': q.policy_number,
            'coverage_type': q.coverage_type,
            'registration_number': q.registration_number,
            'transaction_id': q.transaction_id,
            'created_at': q.date_created.isoformat() if q.date_created else None,
            'payload': q.payload,
        }
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_motor3_quotation_pdf(request, quotation_id):
    """Return Motor3 quotation PDF as base64 for mobile download/share."""
    try:
        q = Motor3Quotation.objects.get(id=quotation_id, user=request.user)
    except Motor3Quotation.DoesNotExist:
        return Response({'success': False, 'error': 'Quotation not found'}, status=404)

    payload = q.payload if isinstance(q.payload, dict) else {}
    client = payload.get('clientDetails') or {}
    vehicle = payload.get('vehicleDetails') or {}
    underwriter = payload.get('underwriterDetails') or {}
    premium = payload.get('premiumBreakdown') or {}

    try:
        from io import BytesIO
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas

        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        y = height - 60
        c.setFont('Helvetica-Bold', 16)
        c.drawString(40, y, 'PataBima Insurance Agency')
        y -= 22
        c.setFont('Helvetica-Bold', 13)
        c.drawString(40, y, 'MOTOR INSURANCE QUOTATION')

        y -= 28
        c.setFont('Helvetica', 10)
        c.drawString(40, y, f"Quote Number: {q.quote_number}")
        y -= 16
        c.drawString(40, y, f"Coverage Type: {q.coverage_type}")
        y -= 16
        c.drawString(40, y, f"Status: {q.status}")
        y -= 16
        if q.date_created:
            c.drawString(40, y, f"Created At: {q.date_created.strftime('%d/%m/%Y %H:%M')}")

        y -= 26
        c.setFont('Helvetica-Bold', 11)
        c.drawString(40, y, 'Client Details')
        y -= 16
        c.setFont('Helvetica', 10)
        client_name = client.get('fullName') or 'N/A'
        c.drawString(40, y, f"Name: {client_name}")
        y -= 14
        c.drawString(40, y, f"Phone: {client.get('phone') or 'N/A'}")
        y -= 14
        c.drawString(40, y, f"Email: {client.get('email') or 'N/A'}")
        y -= 14
        c.drawString(40, y, f"ID Number: {client.get('idNumber') or 'N/A'}")

        y -= 26
        c.setFont('Helvetica-Bold', 11)
        c.drawString(40, y, 'Vehicle Details')
        y -= 16
        c.setFont('Helvetica', 10)
        reg = vehicle.get('registration') or vehicle.get('registrationNumber') or q.registration_number or 'N/A'
        c.drawString(40, y, f"Registration: {reg}")
        y -= 14
        c.drawString(40, y, f"Make/Model: {(vehicle.get('make') or '')} {(vehicle.get('model') or '')}".strip() or 'N/A')
        y -= 14
        c.drawString(40, y, f"Year: {vehicle.get('year') or 'N/A'}")

        y -= 26
        c.setFont('Helvetica-Bold', 11)
        c.drawString(40, y, 'Underwriter')
        y -= 16
        c.setFont('Helvetica', 10)
        c.drawString(40, y, f"Name: {underwriter.get('name') or 'N/A'}")
        y -= 14
        c.drawString(40, y, f"Code: {underwriter.get('code') or 'N/A'}")

        y -= 26
        c.setFont('Helvetica-Bold', 11)
        c.drawString(40, y, 'Premium Breakdown (KES)')
        y -= 16
        c.setFont('Helvetica', 10)

        def _num(val, default=0):
            try:
                return float(val)
            except Exception:
                return float(default)

        base_premium = _num(premium.get('base_premium'))
        itl = _num(premium.get('training_levy'))
        pcf = _num(premium.get('pcf_levy'))
        stamp = _num(premium.get('stamp_duty'), 40)
        total = _num(premium.get('total_amount'), base_premium + itl + pcf + stamp)

        c.drawString(40, y, f"Base Premium: {base_premium:,.2f}")
        y -= 14
        c.drawString(40, y, f"ITL (0.25%): {itl:,.2f}")
        y -= 14
        c.drawString(40, y, f"PCF (0.25%): {pcf:,.2f}")
        y -= 14
        c.drawString(40, y, f"Stamp Duty: {stamp:,.2f}")
        y -= 16
        c.setFont('Helvetica-Bold', 10)
        c.drawString(40, y, f"TOTAL: {total:,.2f}")

        c.showPage()
        c.save()

        pdf_bytes = buffer.getvalue()
        buffer.close()

        encoded = base64.b64encode(pdf_bytes).decode('utf-8')
        filename = f"{q.quote_number}_quote.pdf"
        return Response({
            'success': True,
            'quotationId': str(q.id),
            'quote_number': q.quote_number,
            'filename': filename,
            'mimeType': 'application/pdf',
            'pdf_data': encoded,
        }, status=200)
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to generate quotation PDF',
            'details': str(e),
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_motor3_quotation_to_policy(request, quotation_id):
    """Convert a stored Motor3 quotation into a MotorPolicy, then activate.

    This bridges the Motor3 quotation lifecycle (Option 1) to the existing
    create/activate motor policy flow to preserve business rules (DMVIC gating,
    idempotency by transaction_id, document generation).
    """
    try:
        q = Motor3Quotation.objects.get(id=quotation_id, user=request.user)
    except Motor3Quotation.DoesNotExist:
        return Response({'success': False, 'error': 'Quotation not found'}, status=404)

    # Idempotency for already-converted quotations
    if q.status == 'CONVERTED' and q.policy_number:
        return Response({
            'success': True,
            'message': 'Quotation already converted',
            'quotation': {
                'id': str(q.id),
                'quote_number': q.quote_number,
                'status': q.status,
                'policy_number': q.policy_number,
            },
            'policyNumber': q.policy_number,
            'idempotent': True,
        }, status=200)

    base_payload = q.normalized_payload or q.payload
    if not isinstance(base_payload, dict):
        return Response({'success': False, 'error': 'Quotation payload missing'}, status=400)

    payload = {**base_payload}

    # Ensure quoteId is present for traceability
    if not payload.get('quoteId'):
        payload['quoteId'] = q.quote_number

    # Merge payment overrides if provided
    payment_details = {**(payload.get('paymentDetails') or {})}
    req_payment = request.data.get('paymentDetails') if isinstance(request.data, dict) else None
    if isinstance(req_payment, dict):
        payment_details.update(req_payment)

    # Support top-level overrides too
    top_txn = None
    if isinstance(request.data, dict):
        top_txn = request.data.get('transaction_id') or request.data.get('transactionId')
        if top_txn:
            payment_details['transaction_id'] = top_txn
        top_method = request.data.get('payment_method') or request.data.get('method')
        if top_method:
            payment_details['method'] = top_method
        top_status = request.data.get('payment_status') or request.data.get('status')
        if top_status:
            payment_details['status'] = top_status

    payload['paymentDetails'] = payment_details
    
    # Pass through forceCreate flag to bypass duplicate policy checks
    if isinstance(request.data, dict) and request.data.get('forceCreate'):
        payload['forceCreate'] = True

    # Revalidate to ensure we don't persist broken payloads
    serializer = MotorPolicySubmissionSerializer(data=payload)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'error': 'Validation error',
            'details': serializer.errors,
        }, status=400)

    from rest_framework.test import APIRequestFactory, force_authenticate
    from app.views.policy_management import create_motor_policy, activate_motor_policy

    factory = APIRequestFactory()

    # Mark as submitted before conversion
    if q.status == 'DRAFT':
        q.status = 'SUBMITTED'
        q.save(update_fields=['status'])

    create_req = factory.post('/api/v1/policies/motor/create/', payload, format='json')
    force_authenticate(create_req, user=request.user)
    created = create_motor_policy(create_req)
    created_data = getattr(created, 'data', None) or {}
    if not created_data.get('success'):
        return created

    policy_number = created_data.get('policyNumber') or created_data.get('policy_number')
    if not policy_number:
        return Response({'success': False, 'error': 'Policy creation failed (missing policyNumber)'}, status=500)

    q.policy_number = policy_number
    q.status = 'PENDING_PAYMENT'
    q.transaction_id = (
        payment_details.get('transaction_id')
        or payment_details.get('transactionId')
        or q.transaction_id
    )
    q.save(update_fields=['policy_number', 'status', 'transaction_id'])

    activation_payload = {
        'transaction_id': payment_details.get('transaction_id') or payment_details.get('transactionId'),
        'payment_method': payment_details.get('method') or payment_details.get('payment_method') or 'MPESA',
        'status': payment_details.get('status') or payment_details.get('payment_status') or 'SUCCESS',
    }
    activate_req = factory.post(f'/api/v1/policies/motor/{policy_number}/activate/', activation_payload, format='json')
    force_authenticate(activate_req, user=request.user)
    activated = activate_motor_policy(activate_req, policy_number)
    activated_data = getattr(activated, 'data', None) or {}

    if not activated_data.get('success'):
        return activated

    q.status = 'CONVERTED'
    q.save(update_fields=['status'])

    return Response({
        'success': True,
        'message': 'Quotation converted to policy',
        'quotation': {
            'id': str(q.id),
            'quote_number': q.quote_number,
            'status': q.status,
            'policy_number': q.policy_number,
            'transaction_id': q.transaction_id,
        },
        'created': created_data,
        'activated': activated_data,
        'policyNumber': policy_number,
        'documents': activated_data.get('documents'),
    }, status=200)
