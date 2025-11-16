# views/policy_management.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from datetime import datetime, timedelta, date
import uuid
import json
import random
from ..models import MotorPolicy
from ..serializers import MotorPolicySubmissionSerializer, MotorPolicySerializer

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
def generate_receipt(request, policy_number):
    """
    Generate payment receipt with insurer branding
    """
    # Mock receipt data
    receipt_data = {
        'receipt_number': f"RCP{datetime.now().strftime('%Y%m%d')}{random.randint(1000, 9999)}",
        'policy_number': policy_number,
        'issue_date': datetime.now().strftime('%Y-%m-%d'),
        'insurer': {
            'name': 'CIC Insurance Group',
            'logo_url': 'https://example.com/cic-logo.png',
            'address': 'CIC Plaza, Mara Road, Upper Hill',
            'phone': '+254 20 2828000'
        },
        'customer': {
            'name': 'John Doe',
            'phone': '254708374149',
            'email': 'john.doe@example.com'
        },
        'vehicle': {
            'registration': 'KDD123A',
            'make': 'Toyota',
            'model': 'Hiace'
        },
        'payment': {
            'method': 'M-PESA',
            'reference': 'OGK12345678',
            'amount': 3540.00,
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        },
        'premium_breakdown': {
            'base_premium': 3000.00,
            'training_levy': 7.50,
            'pcf_levy': 7.50,
            'stamp_duty': 40.00,
            'total': 3540.00
        }
    }
    
    return Response({
        'success': True,
        'receipt': receipt_data
    })


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
        # Check with DMVIC if vehicle already has active cover
        # =================================================================
        allow_proceed = request.data.get('allowProceed', False)
        
        if registration and not allow_proceed:
            try:
                from app.services.dmvic_service import DMVICService
                
                dmvic_service = DMVICService()
                double_insurance_result = dmvic_service.validate_double_insurance(registration)
                
                if double_insurance_result and double_insurance_result.get('has_active_cover'):
                    # Vehicle has active cover in DMVIC database
                    current_policy = double_insurance_result.get('current_policy', {})
                    
                    return Response({
                        'success': False,
                        'error': 'Vehicle has existing cover in DMVIC',
                        'user_message': f'Vehicle {registration} already has active insurance coverage registered with DMVIC. Creating a new policy may result in double insurance.',
                        'dmvic_policy': {
                            'policy_number': current_policy.get('policy_number'),
                            'underwriter': current_policy.get('member_company'),
                            'cover_type': current_policy.get('certificate_type'),
                            'expiry_date': current_policy.get('cover_end_date')
                        },
                        'can_override': True,
                        'override_instructions': 'To proceed anyway, set "allowProceed": true in the request',
                        'warning': 'Creating duplicate coverage may violate insurance regulations'
                    }, status=409)
                    
            except Exception as dmvic_error:
                # DMVIC check failed - log warning but don't block policy creation
                print(f"⚠️  DMVIC double-insurance check failed: {str(dmvic_error)}")
                print("   Proceeding with policy creation (DMVIC validation will be marked as pending)")
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
        
        # Check if this is an extendible product (contains 'EXT' in subcategory code)
        is_extendible = subcategory_code and 'EXT' in subcategory_code.upper()
        product_details['is_extendible'] = is_extendible
        product_details['subcategory_code'] = subcategory_code
        
        # If extendible, get configuration from premiumBreakdown.extendible_config
        # (This comes from the frontend which gets it from InsuranceProvider.features.pricing)
        if is_extendible:
            premium_breakdown = validated_data.get('premiumBreakdown', {})
            extendible_config = premium_breakdown.get('extendible_config')
            
            if extendible_config:
                # Add extendible configuration to product details
                product_details['extendible_config'] = extendible_config
                product_details['payment_plan'] = 'EXTENDIBLE'
                print(f"✅ Added extendible_config for {subcategory_code} from pricing features")
            else:
                print(f"⚠️ No extendible_config in premiumBreakdown for {subcategory_code}")
                product_details['payment_plan'] = 'FULL_PAYMENT'
        else:
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
        
        # Log documents for debugging
        documents_count = len(policy.documents)
        print(f"📎 Documents attached to policy: {documents_count}")
        if documents_count > 0:
            for idx, doc in enumerate(policy.documents):
                doc_type = doc.get('document_type', 'unknown')
                doc_id = doc.get('document_id', 'N/A')
                print(f"  [{idx+1}] {doc_type} - ID: {doc_id}")
        
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
        payment_method = validated_data['paymentDetails'].get('method', '').lower()
        payment_status = validated_data['paymentDetails'].get('status', '').upper()
        
        # Third-Party products (including TOR and extendible): 
        # Auto-activate in simulation mode (status='CONFIRMED' or simulated transaction)
        if 'THIRD_PARTY' in coverage_type or 'TOR' in coverage_type:
            # Check if this is simulation mode (status already CONFIRMED or simulated TXN)
            is_simulation = (
                payment_status == 'CONFIRMED' or 
                payment_method == 'pending' or 
                'TXN-' in str(_pd.get('transaction_id', ''))
            )
            
            if is_simulation or payment_status == 'CONFIRMED':
                # Auto-activate Third Party policies for simulation/confirmed payments
                # Use activate_policy() method to ensure proper validation
                if not policy.cover_start_date:
                    policy.cover_start_date = datetime.now().date()
                if not policy.cover_end_date:
                    policy.cover_end_date = policy.cover_start_date + timedelta(days=365)
                
                policy.status = 'ACTIVE'
                print(f"✅ Third-Party policy AUTO-ACTIVATED (simulation): {policy.policy_number}")
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
        
        # Auto-issue DMVIC certificate for ACTIVE Third-Party/TOR policies
        dmvic_certificate_details = None
        if policy.status == 'ACTIVE' and ('THIRD_PARTY' in coverage_type or 'TOR' in coverage_type):
            try:
                from app.services.dmvic_service import DMVICService
                from app.services.dmvic_field_mapper import get_dmvic_field_mapper
                
                dmvic_service = DMVICService()
                mapper = get_dmvic_field_mapper()
                
                # Build policy data dict for mapper
                policy_data = {
                    'client_details': policy.client_details,
                    'vehicle_details': policy.vehicle_details,
                    'product_details': policy.product_details,
                    'underwriter_details': policy.underwriter_details,
                    'premium_breakdown': policy.premium_breakdown,
                    'addons': policy.addons,
                    'cover_start_date': policy.cover_start_date,
                    'cover_end_date': policy.cover_end_date,
                    'policy_number': policy.policy_number
                }
                
                # Determine certificate type (A/B/C/D)
                cert_type = mapper.determine_certificate_type(policy_data)
                
                # Build appropriate payload
                if cert_type == 'A':
                    dmvic_payload = mapper.map_to_type_a_payload(policy_data)
                    cert_result = dmvic_service.issue_type_a_certificate(dmvic_payload)
                elif cert_type == 'B':
                    dmvic_payload = mapper.map_to_type_b_payload(policy_data)
                    cert_result = dmvic_service.issue_type_b_certificate(dmvic_payload)
                elif cert_type == 'C':
                    dmvic_payload = mapper.map_to_type_c_payload(policy_data)
                    cert_result = dmvic_service.issue_type_c_certificate(dmvic_payload)
                else:  # cert_type == 'D'
                    dmvic_payload = mapper.map_to_type_d_payload(policy_data)
                    cert_result = dmvic_service.issue_type_d_certificate(dmvic_payload)
                
                # Update policy with DMVIC certificate details
                if cert_result:
                    policy.dmvic_certificate_number = cert_result.get('certificate_number')
                    policy.dmvic_transaction_no = cert_result.get('transaction_no')
                    policy.dmvic_api_request_number = cert_result.get('api_request_number')
                    policy.dmvic_issuance_request_id = cert_result.get('issuance_request_id')
                    policy.dmvic_certificate_type = cert_type
                    policy.dmvic_issued_at = timezone.now()
                    policy.save(update_fields=[
                        'dmvic_certificate_number', 'dmvic_transaction_no',
                        'dmvic_api_request_number', 'dmvic_issuance_request_id',
                        'dmvic_certificate_type', 'dmvic_issued_at'
                    ])
                    
                    dmvic_certificate_details = {
                        'certificateNumber': cert_result.get('certificate_number'),
                        'transactionNo': cert_result.get('transaction_no'),
                        'certificateType': cert_type,
                        'issuedAt': policy.dmvic_issued_at.isoformat(),
                        'status': cert_result.get('status', 'ACTIVE')
                    }
                    
                    print(f"✅ DMVIC Type {cert_type} certificate issued: {cert_result.get('certificate_number')}")
                    
            except Exception as dmvic_error:
                # Log but don't block policy creation
                print(f"⚠️ DMVIC certificate issuance failed: {str(dmvic_error)}")
                import traceback
                traceback.print_exc()
                
                # Add warning to product details
                if 'creation_warnings' not in policy.product_details:
                    policy.product_details['creation_warnings'] = []
                policy.product_details['creation_warnings'].append(
                    f'DMVIC certificate issuance pending: {str(dmvic_error)[:100]}'
                )
                policy.save(update_fields=['product_details'])
                
                # Include partial info in response for user awareness
                dmvic_certificate_details = {
                    'status': 'PENDING',
                    'error': 'Certificate issuance will be retried. Policy is active.',
                    'action_required': 'Contact support if certificate not received within 24 hours'
                }
        
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
        extendible_config = policy.product_details.get('extendible_config')
        
        if not extendible_config:
            return Response({
                'success': False,
                'error': 'Policy not eligible for extension',
                'reason': 'Policy does not have extendible configuration'
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
