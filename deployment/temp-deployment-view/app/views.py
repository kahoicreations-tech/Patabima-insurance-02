import random
import string
from rest_framework.response import Response
from rest_framework import status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db import transaction

from datetime import timedelta, datetime, time

from . import serializers, models, utils
from django.conf import settings
import requests
from .services.motor_pricing_engine import MotorPricingEngine, PricingInput


class BaseViewset(viewsets.ViewSet):
    def return_headers(self):
        headers = {
            'Authorization': self.request.headers.get('Authorization'),
        }
        return headers


class LoginViewSet(BaseViewset):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['POST'])
    def signup(self, request):
        serializer = serializers.RegisterPublicUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            phonenumber = serializer.validated_data['phonenumber']  # 9 digits
            email = serializer.validated_data.get('email', None)
            role = serializer.validated_data['user_role']
            full_names = serializer.validated_data['full_names']
            password = serializer.validated_data['password']

            # create user using manager
            user_inst = models.User.objects.create_user(
                phonenumber=phonenumber,
                password=password,
                email=email,
                role=role
            )

            if role == 'CUSTOMER':
                models.PublicUserProfile.objects.create(
                    user=user_inst,
                    registration_number=utils.generate_registration_number(model_inst=models.User, account_type='P'),
                    full_names=full_names
                )
            else:
                # generate unique agent_code
                agent_code = random.randint(10000, 99999)
                # ensure uniqueness
                while models.StaffUserProfile.objects.filter(agent_code=agent_code).exists():
                    agent_code = random.randint(10000, 99999)
                models.StaffUserProfile.objects.create(
                    user=user_inst,
                    agent_code=agent_code,
                    full_names=full_names
                )

            # create OTP entries: store user as string UUID to match model
            models.OTPModel.objects.bulk_create(
                [
                    models.OTPModel(
                        otp_for='CREATE_ACCOUNT',
                        user=str(user_inst.id),
                    ),
                    models.OTPModel(
                        otp_for='LOGIN',
                        user=str(user_inst.id),
                    )
                ]
            )

            return Response({'detail': 'user created successfully.', 'user_id': user_inst.id}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def auth_login(self, request):
        serializer = serializers.AuthLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ph = serializer.validated_data['phonenumber']
        password = serializer.validated_data['password']
        code = serializer.validated_data['code']

        # authenticate (username uses USERNAME_FIELD = phonenumber)
        user_ = authenticate(username=ph, password=password)
        if user_ is None:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        otp_inst = models.OTPModel.objects.filter(user=str(user_.id), otp_for='LOGIN').first()
        if not otp_inst:
            return Response({'detail': 'No OTP instance found.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_inst.expiry_time and otp_inst.expiry_time < timezone.now():
            return Response({'detail': 'OTP code is already expired.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_inst.code != code:
            return Response({'detail': 'OTP code is Invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_inst.is_verified = True
        otp_inst.save()

        # generate token
        refresh = RefreshToken.for_user(user_)
        resp = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'expires_at': (timezone.now() + timedelta(hours=2)).timestamp(),
            'user_role': user_.role
        }

        return Response(resp, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def login(self, request):
        serializer = serializers.LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ph = serializer.validated_data['phonenumber']
        password = serializer.validated_data['password']

        user_ = authenticate(username=ph, password=password)
        if user_ is None:
            return Response({'detail': 'User does not exist or invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        # send login OTP (dev: we return code)
        otp_inst = models.OTPModel.objects.filter(user=str(user_.id), otp_for='LOGIN').first()
        if not otp_inst:
            # create if missing
            otp_inst = models.OTPModel.objects.create(user=str(user_.id), otp_for='LOGIN')

        # generate code
        otp_inst.code = ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(6))
        otp_inst.expiry_time = timezone.now() + timedelta(minutes=5)
        otp_inst.is_verified = False
        otp_inst.save()

        # prepare message (if any)
        phonenumber = user_.phonenumber
        msg = utils.get_msg('OTP', locals())
        if msg:
            # For dev we're printing; in prod you'd send SMS/email
            print(msg)

        return Response({'detail': 'OTP sent successfully.', 'otp_code': otp_inst.code}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def reset_password_self(self, request):
        serializer = serializers.ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # find logged in user id from headers using utils (existing project util)
        user_id = utils.get_logged_in_user(headers=self.return_headers())
        if not user_id:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        user_ = models.User.objects.get(id=user_id)

        # check old password
        old_pw = serializer.validated_data.get('old_password', None)
        if old_pw and not user_.check_password(old_pw):
            return Response({"detail": "Invalid old password provided."}, status=status.HTTP_400_BAD_REQUEST)

        # ensure new password different
        if user_.check_password(serializer.validated_data['password']):
            return Response({"detail": "New password cannot be same as old password."}, status=status.HTTP_400_BAD_REQUEST)

        user_.password = make_password(serializer.validated_data['password'])
        user_.save()

        return Response({'detail': 'Password reset successfully.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def validate_phone(self, request):
        """Check if phone number is available for registration
        Accepts both 9-digit (712345678) and 10-digit with leading 0 (0712345678) formats
        """
        try:
            phonenumber = request.data.get('phonenumber', '').strip()
            
            if not phonenumber:
                return Response({'detail': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Remove non-digit characters
            clean_phone = ''.join(filter(str.isdigit, phonenumber))
            
            # Normalize: Strip leading 0 if 10 digits
            if clean_phone.startswith('0') and len(clean_phone) == 10:
                normalized_phone = clean_phone[1:]  # Strip leading 0
            else:
                normalized_phone = clean_phone
            
            # Validate normalized phone format (must be 9 digits)
            if len(normalized_phone) != 9 or not normalized_phone.isdigit():
                return Response({
                    'detail': 'Phone number must be 9 digits. Enter as 712345678 or 0712345678'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if phone number already exists (using normalized format)
            if models.User.objects.filter(phonenumber=normalized_phone).exists():
                return Response({
                    'detail': 'User with this phone number already exists.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({'detail': 'Phone number is available'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserViewset(BaseViewset):
    @action(detail=False, methods=['GET'])
    def get_user(self, request):
        user_id = self.request.query_params.get('user_id')
        if not user_id:
            return Response({'detail': 'user id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_ = models.User.objects.get(id=user_id)
        except models.User.DoesNotExist:
            return Response({'detail': 'user does not exist'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializers.UserSerializer(user_)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def get_current_user(self, request):
        """Get current authenticated user profile"""
        try:
            user_ = request.user
            serializer = serializers.UserSerializer(user_)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    # CommissionsViewset moved to commissions_views.py to avoid import clashes


class InsuranceViewset(BaseViewset):
    permission_classes = [IsAuthenticated]

    # --- Proxy Endpoints to services backend ---
    @action(detail=False, methods=['GET'], url_path='insurance/motor_categories', permission_classes=[AllowAny])
    def motor_categories(self, request):
        cats = models.MotorCategory.objects.all().order_by('category_name')
        data = []
        for c in cats:
            # Select only columns guaranteed in DB to avoid migration mismatch errors
            subs = c.subcategories.all().values(
                'id', 'subcategory_code', 'subcategory_name', 'product_type', 'additional_fields', 'pricing_requirements'
            )
            data.append({
                'id': str(c.id),
                'category_code': c.category_code,
                'category_name': c.category_name,
                'description': c.description or '',
                'subcategories': list(subs),
            })
        return Response({'categories': data}, status=status.HTTP_200_OK)

    # Public calculator to support per-underwriter quotes from mobile without forcing auth
    @action(detail=False, methods=['POST'], url_path='insurance/calculate_motor_premium', permission_classes=[AllowAny])
    def calculate_motor_premium(self, request):
        s = serializers.MotorPricingRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        eng = MotorPricingEngine()
        pi = PricingInput(**s.validated_data)
        try:
            result = eng.calculate_premium(pi)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': True, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['GET'], url_path='insurance/underwriters', permission_classes=[IsAuthenticated])
    def underwriters(self, request):
        qs = models.InsuranceProvider.objects.filter(is_active=True).values('id', 'name', 'code', 'supported_categories')
        data = [
            {
                'id': str(x['id']),
                'name': x['name'],
                'code': x['code'],
                'features': x.get('supported_categories', []),
            }
            for x in qs
        ]
        return Response({'underwriters': data}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['GET'], url_path='insurance/pricing_factors', permission_classes=[IsAuthenticated])
    def pricing_factors(self, request):
        # For now return simple factors; can be expanded to query AdditionalFieldPricing/VehicleAdjustmentFactor
        return Response({
            'factors': {
                'vehicle_age': True,
                'passenger_capacity': True,
                'tonnage': True,
                'windscreen_value': True,
                'radio_value': True
            }
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'], url_path='insurance/compare_motor_pricing', permission_classes=[IsAuthenticated])
from django.core.cache import cache

# ... existing imports ...

# Cache TTL for pricing comparisons (e.g., 6 hours)
PRICING_CACHE_TTL = 60 * 60 * 6 # 6 hours

# ... existing class definition ...

    def compare_motor_pricing(self, request):
        s = serializers.MotorPricingCompareSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        
        # Generate a cache key based on validated data
        cache_key_data = {
            "subcategory_code": s.validated_data['subcategory_code'],
            "sum_insured": str(s.validated_data.get('sum_insured', 0)),
            "tonnage": str(s.validated_data.get('tonnage', 0)),
            "passenger_count": str(s.validated_data.get('passenger_count', 0)),
            "add_ons": str(s.validated_data.get('add_ons', {})),
            # Assuming cover_start_date is also a critical pricing factor
            "cover_start_date": str(s.validated_data.get('cover_start_date', '')),
        }
        # Sort keys to ensure consistent cache key generation
        sorted_cache_key_data = sorted(cache_key_data.items())
        cache_key = f"motor_pricing_compare:{hash(frozenset(sorted_cache_key_data))}"

        # Check cache first
        cached_results = cache.get(cache_key)
        if cached_results:
            logger.info(f"Motor pricing cache hit for key: {cache_key}")
            return Response({'comparisons': cached_results}, status=status.HTTP_200_OK)

        logger.info(f"Motor pricing cache miss for key: {cache_key}. Calculating...")

        eng = MotorPricingEngine()
        underwriter_codes = s.validated_data.get('underwriter_codes') or list(models.InsuranceProvider.objects.values_list('code', flat=True))
        results = []
        for code in underwriter_codes:
            try:
                pi_dict = dict(s.validated_data)
                pi_dict['underwriter_code'] = code
                pi_dict.pop('underwriter_codes', None)
                res = eng.calculate_premium(PricingInput(**pi_dict))
                results.append({'underwriter_code': code, 'result': res})
            except Exception as e:
                results.append({'underwriter_code': code, 'error': str(e)})
        
        # Store results in cache
        cache.set(cache_key, results, PRICING_CACHE_TTL)
        logger.info(f"Motor pricing results cached for key: {cache_key}")

        return Response({'comparisons': results}, status=status.HTTP_200_OK)

        # DEPRECATED: submit_manual_quote legacy action replaced by persistent ManualQuote API
        # @action(detail=False, methods=['POST'], url_path='insurance/submit_manual_quote', permission_classes=[IsAuthenticated])
        # def submit_manual_quote(self, request):
        #     """Deprecated. Use /manual_quotes (agent) endpoint for creation."""
        #     return Response({'detail': 'Deprecated. Use /manual_quotes endpoint.'}, status=status.HTTP_410_GONE)

    @action(detail=False, methods=['POST'])
    def submit_motor_quotation(self, request):
        """Submit a motor insurance quotation"""
        try:
            # Get authenticated user
            user_id = utils.get_logged_in_user(headers=self.return_headers())
            if not user_id:
                return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            agent = models.User.objects.get(id=user_id)
            
            # Validate form data
            serializer = serializers.MotorInsuranceSubmissionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            validated_data = serializer.validated_data
            
            # Convert dates to strings for JSON serialization
            form_data_for_json = validated_data.copy()
            form_data_for_json['cover_start_date'] = str(validated_data['cover_start_date'])
            form_data_for_json['cover_end_date'] = str(validated_data['cover_end_date'])
            
            with transaction.atomic():
                # Create quotation
                quotation = models.InsuranceQuotation.objects.create(
                    agent=agent,
                    insurance_type='MOTOR_PRIVATE',  # Can be dynamic based on request
                    form_data=form_data_for_json,
                    dmvic_data=validated_data.get('dmvic_data'),
                    textract_data=validated_data.get('textract_data'),
                )
                
                # Create motor insurance details
                motor_details_data = {
                    'quotation': quotation,
                    'vehicle_make': validated_data['vehicle_make'],
                    'vehicle_model': validated_data['vehicle_model'],
                    'vehicle_year': validated_data['vehicle_year'],
                    'vehicle_registration': validated_data['vehicle_registration'],
                    'chassis_number': validated_data.get('chassis_number', ''),
                    'engine_number': validated_data.get('engine_number', ''),
                    'cover_type': validated_data['cover_type'],
                    'owner_name': validated_data['owner_name'],
                    'owner_id_number': validated_data['owner_id_number'],
                    'owner_kra_pin': validated_data.get('owner_kra_pin', ''),
                    'owner_phone': validated_data['owner_phone'],
                    'owner_email': validated_data.get('owner_email', ''),
                    'cover_start_date': validated_data['cover_start_date'],
                    'cover_end_date': validated_data['cover_end_date'],
                    'vehicle_usage': validated_data.get('vehicle_usage', ''),
                    'vehicle_color': validated_data.get('vehicle_color', ''),
                    'seating_capacity': validated_data.get('seating_capacity'),
                }
                
                models.MotorInsuranceDetails.objects.create(**motor_details_data)
                
                # Update quotation status
                quotation.status = 'SUBMITTED'
                quotation.save()
                
                # Return simplified quotation data to avoid JSON serialization issues
                return Response({
                    'detail': 'Motor insurance quotation submitted successfully',
                    'quotation': {
                        'id': str(quotation.id),
                        'quotation_number': quotation.quotation_number,
                        'insurance_type': quotation.insurance_type,
                        'status': quotation.status,
                        'agent_id': str(quotation.agent.id),
                        'date_created': quotation.date_created.isoformat() if quotation.date_created else None,
                    }
                }, status=status.HTTP_201_CREATED)
                
        except models.User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['GET'])
    def get_quotations(self, request):
        """Get all quotations for the authenticated agent"""
        try:
            user_id = utils.get_logged_in_user(headers=self.return_headers())
            if not user_id:
                return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            quotations = models.InsuranceQuotation.objects.filter(agent_id=user_id)
            serializer = serializers.InsuranceQuotationSerializer(quotations, many=True)
            
            return Response({
                'quotations': serializer.data,
                'count': quotations.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['GET'])
    def get_quotation_detail(self, request):
        """Get detailed information about a specific quotation"""
        try:
            quotation_id = request.query_params.get('quotation_id')
            if not quotation_id:
                return Response({'detail': 'quotation_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = utils.get_logged_in_user(headers=self.return_headers())
            if not user_id:
                return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            quotation = models.InsuranceQuotation.objects.get(
                id=quotation_id,
                agent_id=user_id
            )
            
            serializer = serializers.InsuranceQuotationSerializer(quotation)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except models.InsuranceQuotation.DoesNotExist:
            return Response({'detail': 'Quotation not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['POST'])
    def calculate_premium(self, request):
        """Calculate premium for insurance quotation"""
        try:
            # Basic premium calculation logic
            vehicle_year = request.data.get('vehicle_year', 0)
            cover_type = request.data.get('cover_type', 'THIRD_PARTY')
            vehicle_make = request.data.get('vehicle_make', '')
            
            # Simple premium calculation (replace with actual underwriter logic)
            base_premium = 3000
            
            # Adjust based on vehicle age
            current_year = datetime.now().year
            vehicle_age = current_year - vehicle_year
            if vehicle_age > 10:
                base_premium += 500
            elif vehicle_age > 5:
                base_premium += 200
            
            # Adjust based on cover type
            if cover_type == 'COMPREHENSIVE':
                base_premium *= 1.5
            
            # Calculate levies and duties
            training_levy = int(base_premium * 0.002)
            stamp_duty = 40
            total_premium = base_premium + training_levy + stamp_duty
            
            return Response({
                'base_premium': base_premium,
                'training_levy': training_levy,
                'stamp_duty': stamp_duty,
                'total_premium': total_premium,
                'premium_breakdown': [
                    {'label': 'Base Premium', 'amount': base_premium},
                    {'label': 'Training Levy', 'amount': training_levy},
                    {'label': 'Stamp Duty', 'amount': stamp_duty},
                ]
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['GET'], permission_classes=[AllowAny])
    def get_underwriters(self, request):
        """Get available underwriters (DB-backed) with optional filters.
        Filters:
          - category_code: limit underwriters that have any pricing linked to a subcategory in this category
          - subcategory_code: limit underwriters that have pricing for this subcategory
        """
        category_code = request.query_params.get('category_code')
        subcategory_code = request.query_params.get('subcategory_code')

        qs = models.InsuranceProvider.objects.filter(is_active=True)
        # Use supported_categories JSON for coarse filtering to avoid ORM joins across legacy models
        if category_code:
            try:
                # Postgres JSON contains: list contains the provided value
                qs = qs.filter(supported_categories__contains=[category_code])
            except Exception:
                # If DB backend doesn't support __contains on JSON, ignore filter gracefully
                pass
        # Note: subcategory_code filtering requires explicit pricing joins; skipped until models align

        data = []
        for u in qs:
            # InsuranceProvider does not have a rating field in the schema here; default to 0.0
            rating = 0.0
            data.append({
                'id': str(u.id),
                'name': u.name,
                'code': u.code,
                'features': getattr(u, 'supported_categories', []) or [],
                'rating': rating,
            })
        return Response({'underwriters': data}, status=status.HTTP_200_OK)


class ConfigViewSet(BaseViewset):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['GET'])
    def cover_options(self, request):
        data = {
            'cover_types': [
                {'code': 'THIRD_PARTY', 'label': 'Third Party'},
                {'code': 'THIRD_PARTY_FIRE_THEFT', 'label': 'Third Party Fire & Theft'},
                {'code': 'COMPREHENSIVE', 'label': 'Comprehensive'}
            ],
            'vehicle_usage': [
                {'code': 'PRIVATE', 'label': 'Private'},
                {'code': 'COMMERCIAL', 'label': 'Commercial'}
            ],
            'colors': ['WHITE', 'BLACK', 'SILVER', 'BLUE', 'RED']
        }
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['GET'])
    def underwriters(self, request):
        """Public DB-backed underwriters list for config endpoints, mirrors InsuranceViewset.get_underwriters.
        Supports same optional filters via query params: category_code, subcategory_code.
        """
        category_code = request.query_params.get('category_code')
        subcategory_code = request.query_params.get('subcategory_code')

        qs = models.InsuranceProvider.objects.filter(is_active=True)
        if category_code:
            try:
                qs = qs.filter(supported_categories__contains=[category_code])
            except Exception:
                pass
        # subcategory_code filter skipped; see note above

        data = []
        for u in qs:
            rating = 0.0
            data.append({
                'id': str(u.id),
                'name': u.name,
                'code': u.code,
                'rating': rating,
            })
        return Response({'underwriters': data}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['GET'])
    def motor_categories(self, request):
        """Public motor categories endpoint that mirrors InsuranceViewset.motor_categories"""
        cats = models.MotorCategory.objects.all().order_by('category_name')
        data = []
        for c in cats:
            # Select only columns guaranteed in DB to avoid migration mismatch errors
            subs = c.subcategories.all().values(
                'id', 'subcategory_code', 'subcategory_name', 'product_type', 'additional_fields', 'pricing_requirements'
            )
            data.append({
                'id': str(c.id),
                'category_code': c.category_code,
                'category_name': c.category_name,
                'description': c.description or '',
                'subcategories': list(subs),
            })
        return Response({'categories': data}, status=status.HTTP_200_OK)


class IntegrationsViewSet(BaseViewset):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['POST'])
    def vehicle_check(self, request):
        """
        Combined DMVIC + existing cover lookup.
        
        Uses real DMVIC API if DMVIC_ENABLED=true, otherwise falls back to mock.
        
        Request Body:
            - vehicle_registration: Vehicle registration number (required)
            - vehicle_make: Vehicle make (optional)
            - vehicle_model: Vehicle model (optional)
            - vehicle_year: Vehicle year (optional)
        
        Response:
            {
                "exists": boolean,  // True if existing cover found
                "vehicle_details": {...},  // Vehicle information from DMVIC
                "policy": {...} or null  // Existing policy details if found
            }
        """
        from django.conf import settings
        from app.services.dmvic_service import get_dmvic_service, DMVICAPIError
        
        reg = request.data.get('vehicle_registration', '').upper().strip()
        
        # Check if DMVIC integration is enabled
        dmvic_enabled = getattr(settings, 'DMVIC_ENABLED', False)
        
        if dmvic_enabled:
            # Use real DMVIC API
            try:
                dmvic = get_dmvic_service()
                
                # Step 1: Search for vehicle in DMVIC database
                try:
                    vehicle_data = dmvic.search_vehicle(reg)
                except DMVICAPIError as e:
                    # Vehicle not found in DMVIC
                    if 'not found' in str(e).lower() or '404' in str(e):
                        return Response({
                            'success': False,
                            'error': f'Vehicle {reg} not found in DMVIC database',
                            'vehicle_details': None,
                            'exists': False,
                            'policy': None
                        }, status=status.HTTP_404_NOT_FOUND)
                    else:
                        # Other API error
                        raise
                
                # Step 2: Check for existing cover (double insurance validation)
                try:
                    double_insurance_check = dmvic.validate_double_insurance(reg)
                    has_existing_cover = double_insurance_check.get('exists', False)
                    existing_policy = double_insurance_check.get('policy')
                except DMVICAPIError as e:
                    # If double insurance check fails, continue without it
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Double insurance check failed for {reg}: {str(e)}")
                    has_existing_cover = False
                    existing_policy = None
                
                # Build response
                resp = {
                    'success': True,
                    'exists': has_existing_cover,
                    'vehicle_details': {
                        'registration': vehicle_data.get('registration_number', reg),
                        'chassis_number': vehicle_data.get('chassis_number'),
                        'make': vehicle_data.get('make') or request.data.get('vehicle_make', ''),
                        'model': vehicle_data.get('model') or request.data.get('vehicle_model', ''),
                        'year': vehicle_data.get('year_of_manufacture') or request.data.get('vehicle_year', ''),
                        'engine_capacity': vehicle_data.get('engine_capacity'),
                        'vehicle_type': vehicle_data.get('vehicle_type'),
                        'color': vehicle_data.get('color'),
                        'tonnage': vehicle_data.get('tonnage'),
                        'passenger_capacity': vehicle_data.get('passenger_capacity'),
                        'owner_name': vehicle_data.get('owner_name'),
                        'owner_id': vehicle_data.get('owner_id'),
                        'source': 'DMVIC_PRODUCTION'
                    },
                    'policy': None,
                }
                
                if has_existing_cover and existing_policy:
                    resp['policy'] = {
                        'certificate_number': existing_policy.get('certificate_number'),
                        'insurer': existing_policy.get('insurer'),
                        'insurer_code': existing_policy.get('insurer_code'),
                        'expiry_date': existing_policy.get('cover_end_date'),
                        'cover_start_date': existing_policy.get('cover_start_date'),
                        'policy_type': existing_policy.get('policy_type'),
                    }
                
                return Response(resp, status=status.HTTP_200_OK)
                
            except DMVICAPIError as e:
                # DMVIC API error - return error response
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"DMVIC API error for {reg}: {str(e)}")
                
                return Response({
                    'success': False,
                    'error': f'DMVIC API error: {str(e)}',
                    'vehicle_details': None,
                    'exists': False,
                    'policy': None
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except Exception as e:
                # Unexpected error
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Unexpected error in vehicle_check for {reg}: {str(e)}")
                
                return Response({
                    'success': False,
                    'error': f'Unexpected error: {str(e)}',
                    'vehicle_details': None,
                    'exists': False,
                    'policy': None
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        else:
            # DMVIC disabled - use mock data (legacy behavior)
            is_insured = '234' in reg
            resp = {
                'success': True,
                'exists': is_insured,
                'vehicle_details': {
                    'registration': reg,
                    'make': request.data.get('vehicle_make', ''),
                    'model': request.data.get('vehicle_model', ''),
                    'year': request.data.get('vehicle_year', ''),
                    'source': 'MOCK_SIMULATION'
                },
                'policy': None,
            }
            if is_insured:
                resp['policy'] = {
                    'policy_number': 'POL' + ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(6)),
                    'insurer': 'APA Insurance',
                    'expiry_date': (timezone.now() + timedelta(days=90)).date().isoformat(),
                }
            return Response(resp, status=status.HTTP_200_OK)


class DocumentViewSet(BaseViewset):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['POST'])
    def upload(self, request):
        """Accepts file or payload and returns OCR data (mock)."""
        # For mock: just return structured OCR
        data = {
            'upload_id': 'DOC' + ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(6)),
            'document_type': request.data.get('document_type', 'UNKNOWN'),
            'ocr_results': {
                'confidence': 95,
                'extracted_data': {
                    'owner_name': request.data.get('owner_name', ''),
                    'registration_number': request.data.get('vehicle_registration', ''),
                    'vehicle_make': request.data.get('vehicle_make', ''),
                    'vehicle_model': request.data.get('vehicle_model', ''),
                },
            }
        }
        return Response(data, status=status.HTTP_200_OK)


class PaymentsViewSet(BaseViewset):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['POST'])
    def initiate(self, request):
        amount = request.data.get('amount')
        method = request.data.get('method', 'MPESA')
        reference = 'PAY' + ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(8))
        return Response({'reference': reference, 'amount': amount, 'method': method, 'status': 'PENDING'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['GET'])
    def status(self, request):
        reference = request.query_params.get('reference')
        # Mock: alternate between PENDING and SUCCESS
        status_str = 'SUCCESS' if reference and reference[-1] in '02468' else 'PENDING'
        return Response({'reference': reference, 'status': status_str}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def webhook(self, request):
        return Response({'detail': 'received'}, status=status.HTTP_200_OK)


class PoliciesViewSet(BaseViewset):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['POST'])
    def issue(self, request):
        quotation_id = request.data.get('quotation_id')
        policy_number = 'POL' + ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(9))
        return Response({'quotation_id': quotation_id, 'policy_number': policy_number, 'status': 'ISSUED'}, status=status.HTTP_200_OK)


class NotificationsViewSet(BaseViewset):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['GET'], url_path='list')
    def fetch(self, request):
        items = [
            {'id': 1, 'title': 'Transaction pending', 'body': 'We are completing the process.'}
        ]
        return Response({'notifications': items}, status=status.HTTP_200_OK)
