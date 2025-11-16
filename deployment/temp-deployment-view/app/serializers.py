import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.validators import RegexValidator


from . import models


# password: at least one letter, one digit and one special char
password_validator = RegexValidator(
    regex=r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).+$',
    message="Password must contain at least one letter, one number, and one special character."
)


phone_digits_validator = RegexValidator(
    regex=r'^0\d{9}$',
    message='Phone number must be 10 digits with leading 0. Example: 0712345678'
)




class AuthLoginSerializer(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=10)
    password = serializers.CharField(max_length=128)
    code = serializers.CharField(max_length=6)
    
    def validate_phonenumber(self, value):
        """Normalize phone number to 10-digit Kenyan format with leading 0"""
        clean_phone = ''.join(filter(str.isdigit, value))
        
        # Add leading 0 if 9 digits provided (for backward compatibility)
        if len(clean_phone) == 9 and not clean_phone.startswith('0'):
            return '0' + clean_phone
        
        # Accept 10 digits with leading 0
        if len(clean_phone) == 10 and clean_phone.startswith('0'):
            return clean_phone
        
        raise serializers.ValidationError(
            'Phone number must be 10 digits with leading 0. Enter as 0712345678'
        )




class LoginSerializer(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=10)
    password = serializers.CharField(max_length=128)
    
    def validate_phonenumber(self, value):
        """Normalize phone number to 10-digit Kenyan format with leading 0"""
        clean_phone = ''.join(filter(str.isdigit, value))
        
        # Add leading 0 if 9 digits provided (for backward compatibility)
        if len(clean_phone) == 9 and not clean_phone.startswith('0'):
            return '0' + clean_phone
        
        # Accept 10 digits with leading 0
        if len(clean_phone) == 10 and clean_phone.startswith('0'):
            return clean_phone
        
        raise serializers.ValidationError(
            'Phone number must be 10 digits with leading 0. Enter as 0712345678'
        )




class ResetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50, required=False)
    old_password = serializers.CharField(max_length=128, min_length=6, write_only=True, required=False)
    password = serializers.CharField(max_length=128, min_length=6, write_only=True, validators=[password_validator])
    confirm_password = serializers.CharField(max_length=128, min_length=6, write_only=True)
    code = serializers.CharField(max_length=6, required=False)


    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match.")
        return attrs




class RegisterPublicUserSerializer(serializers.Serializer):
    phonenumber = serializers.CharField(max_length=10, min_length=9)  # Accept 9 or 10 digits
    full_names = serializers.CharField(max_length=50)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    user_role = serializers.ChoiceField(choices=models.ROLES)
    password = serializers.CharField(max_length=128, min_length=6, write_only=True, validators=[password_validator])
    confirm_password = serializers.CharField(max_length=128, min_length=6, write_only=True)


    def validate_email(self, value):
        if value in [None, ""]:
            return value
        if models.User.objects.filter(email=value).exists():
            raise serializers.ValidationError('User with this email already exists.')
        return value


    def validate_phonenumber(self, value):
        """Normalize and validate phone number to 10-digit Kenyan format
        Accepts: 9 digits (712345678) or 10 digits with leading 0 (0712345678)
        Stores: Always 10 digits WITH leading 0 (0712345678)
        """
        # Remove non-digit characters
        clean_phone = ''.join(filter(str.isdigit, value))
        
        # Normalize: Add leading 0 if 9 digits, keep if already 10
        if len(clean_phone) == 9 and not clean_phone.startswith('0'):
            normalized_phone = '0' + clean_phone
        elif len(clean_phone) == 10 and clean_phone.startswith('0'):
            normalized_phone = clean_phone
        else:
            raise serializers.ValidationError(
                'Phone number must be 10 digits with leading 0. Enter as 0712345678'
            )
        
        # Check if exists (both formats should match same user)
        # Check with 0 prefix and without (for backward compatibility during migration)
        phone_without_0 = normalized_phone[1:] if normalized_phone.startswith('0') else normalized_phone
        
        if models.User.objects.filter(phonenumber=normalized_phone).exists():
            raise serializers.ValidationError('User with this phone number already exists.')
        
        # Also check old 9-digit format during transition period
        if models.User.objects.filter(phonenumber=phone_without_0).exists():
            raise serializers.ValidationError('User with this phone number already exists.')
        
        return normalized_phone  # Return normalized 10-digit format with 0


    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError('Passwords do not match.')
        return attrs




class UserSerializer(serializers.ModelSerializer):
    full_names = serializers.SerializerMethodField()
    agent_code = serializers.SerializerMethodField()
    next_commission_date = serializers.SerializerMethodField()
    phonenumber = serializers.CharField(read_only=True)
    last_login = serializers.DateTimeField(read_only=True)


    class Meta:
        model = models.User
        fields = [
            'email',
            'role',
            'full_names',
            'agent_code',
            'phonenumber',
            'last_login',
            'next_commission_date'
        ]


    def get_full_names(self, obj):
        if obj.role == 'CUSTOMER':
            if hasattr(obj, 'public_user_profile') and obj.public_user_profile:
                return obj.public_user_profile.full_names
            return None
        else:
            if hasattr(obj, 'staff_user_profile') and obj.staff_user_profile:
                return obj.staff_user_profile.full_names
            return None

    def get_agent_code(self, obj):
        if obj.role == 'CUSTOMER':
            return None
        else:
            if hasattr(obj, 'staff_user_profile') and obj.staff_user_profile:
                return f"{obj.staff_user_profile.agent_prefix}{obj.staff_user_profile.agent_code}"
            return None

    def get_next_commission_date(self, obj):
        """
        Calculate next commission payout date.
        Commissions are typically paid on the 15th of each month.
        """
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        if obj.role == 'CUSTOMER':
            return None
            
        now = timezone.now()
        current_day = now.day
        
        # If today is before the 15th, next payout is this month's 15th
        if current_day < 15:
            next_date = now.replace(day=15, hour=0, minute=0, second=0, microsecond=0)
        else:
            # Otherwise, next payout is next month's 15th
            # Handle month/year transition
            if now.month == 12:
                next_date = now.replace(year=now.year + 1, month=1, day=15, hour=0, minute=0, second=0, microsecond=0)
            else:
                next_date = now.replace(month=now.month + 1, day=15, hour=0, minute=0, second=0, microsecond=0)
        
        return next_date.isoformat()


# ==============================
# Claims Serializers
# ==============================

class ClaimDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ClaimDocument
        fields = [
            'id', 'doc_type', 's3_key', 'file_name', 'file_size', 'content_type',
            'date_created'
        ]
        read_only_fields = ['id', 'date_created']


class ClaimSerializer(serializers.ModelSerializer):
    documents = ClaimDocumentSerializer(many=True, required=False)

    class Meta:
        model = models.Claim
        fields = [
            'id', 'policy_number', 'product', 'loss_date', 'loss_location',
            'loss_description', 'status', 'date_created', 'date_updated',
            'documents'
        ]
        read_only_fields = ['id', 'status', 'date_created', 'date_updated']

    def validate(self, attrs):
        # product enum constraint (extensible)
        product = attrs.get('product')
        if product not in ['MOTOR']:
            raise serializers.ValidationError({'product': 'Unsupported product'})
        # date of loss can't be in the future
        from django.utils.timezone import now
        if attrs.get('loss_date') and attrs['loss_date'] > now():
            raise serializers.ValidationError({'loss_date': 'Loss date cannot be in the future'})
        if not attrs.get('loss_description') or len(attrs['loss_description']) < 10:
            raise serializers.ValidationError({'loss_description': 'Please provide more details (min 10 chars)'})
        return attrs


    # Note: agent_code is not a field of Claim; removing stray method to avoid confusion


# Insurance Serializers
class MotorInsuranceDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MotorInsuranceDetails
        exclude = ['id', 'date_created', 'date_updated', 'is_active']


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.DocumentUpload
        exclude = ['id', 'date_created', 'date_updated', 'is_active']


class ServiceProcessingLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ServiceProcessingLog
        exclude = ['id', 'date_created', 'date_updated', 'is_active']


class InsuranceQuotationSerializer(serializers.ModelSerializer):
    motor_details = MotorInsuranceDetailsSerializer(read_only=True)
    documents = DocumentUploadSerializer(many=True, read_only=True)
    service_logs = ServiceProcessingLogSerializer(many=True, read_only=True)
    agent_name = serializers.SerializerMethodField()

    class Meta:
        model = models.InsuranceQuotation
        fields = '__all__'

class MotorPricingRequestSerializer(serializers.Serializer):
    subcategory_code = serializers.CharField(required=True)  # Now required - primary identifier
    underwriter_code = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    sum_insured = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)
    tonnage = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    passenger_count = serializers.IntegerField(required=False)
    vehicle_age = serializers.IntegerField(required=False)
    add_ons = serializers.DictField(required=False)

    def validate(self, attrs):
        # Subcategory validation handled by API endpoints
        return attrs


class MotorPricingCompareSerializer(serializers.Serializer):
    subcategory_code = serializers.CharField(required=True)  # Now required - primary identifier
    underwriter_codes = serializers.ListField(child=serializers.CharField(), required=False)
    sum_insured = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)
    tonnage = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    passenger_count = serializers.IntegerField(required=False)
    add_ons = serializers.DictField(required=False)

    def validate(self, attrs):
        # Subcategory validation handled by API endpoints
        return attrs


class MotorCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MotorCategory
        fields = ('id', 'category_code', 'category_name')


class MotorSubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MotorSubcategory
        fields = ('id', 'subcategory_code', 'subcategory_name', 'product_type', 'additional_fields', 'pricing_requirements')


class InsuranceProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Underwriter
        fields = ('id', 'company_name', 'company_code', 'supported_categories')

    def get_agent_name(self, obj):
        if obj.agent.role == 'AGENT' and hasattr(obj.agent, 'staff_user_profile'):
            return obj.agent.staff_user_profile.full_names
        return None


class MotorInsuranceSubmissionSerializer(serializers.Serializer):
    # Vehicle Information
    vehicle_make = serializers.CharField(max_length=50)
    vehicle_model = serializers.CharField(max_length=50)
    vehicle_year = serializers.IntegerField()
    vehicle_registration = serializers.CharField(max_length=20)
    chassis_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    engine_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    subcategory = serializers.CharField(max_length=50)  # Using subcategory code instead of cover_type
    
    # Owner Information
    owner_name = serializers.CharField(max_length=100)
    owner_id_number = serializers.CharField(max_length=15)
    owner_kra_pin = serializers.CharField(max_length=15, required=False, allow_blank=True)
    owner_phone = serializers.CharField(max_length=15)
    owner_email = serializers.EmailField(required=False, allow_blank=True)
    
    # Policy Dates
    cover_start_date = serializers.DateField()
    cover_end_date = serializers.DateField()
    
    # Additional Information
    vehicle_usage = serializers.CharField(max_length=50, required=False, allow_blank=True)
    vehicle_color = serializers.CharField(max_length=30, required=False, allow_blank=True)
    seating_capacity = serializers.IntegerField(required=False, allow_null=True)
    
    # Service Data (will be populated by background services)
    dmvic_data = serializers.JSONField(required=False)
    textract_data = serializers.JSONField(required=False)
    
    def validate_vehicle_year(self, value):
        from datetime import datetime
        current_year = datetime.now().year
        if value < 1950 or value > current_year + 1:
            raise serializers.ValidationError(f'Vehicle year must be between 1950 and {current_year + 1}')
        return value
    
    def validate(self, attrs):
        cover_start = attrs.get('cover_start_date')
        cover_end = attrs.get('cover_end_date')
        
        if cover_start and cover_end and cover_end <= cover_start:
            raise serializers.ValidationError('Cover end date must be after cover start date')
        
        return attrs


# ==============================
# Commission Serializers
# ==============================

class AgentCommissionSerializer(serializers.ModelSerializer):
    policy_number = serializers.SerializerMethodField()

    class Meta:
        model = models.AgentCommission
        fields = [
            'id', 'premium_amount', 'commission_rate', 'commission_amount',
            'payment_status', 'payment_date', 'payment_reference', 'notes',
            'date_created', 'policy_number'
        ]

    def get_policy_number(self, obj):
        try:
            return obj.policy.policy_number if obj.policy else None
        except Exception:
            return None


class MonthlyAgentBonusSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MonthlyAgentBonus
        fields = [
            'id', 'period', 'total_policies', 'total_premium', 'bonus_rate', 'bonus_amount',
            'payment_status', 'payment_date', 'payment_reference', 'notes', 'date_created'
        ]


class CommissionSummarySerializer(serializers.Serializer):
    total_commission = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_commission = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_commission = serializers.DecimalField(max_digits=12, decimal_places=2)
    unpaid_count = serializers.IntegerField()
    paid_count = serializers.IntegerField()
    month_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    month_period = serializers.CharField()


# Motor Categories Serializers

class MotorCategorySerializer(serializers.ModelSerializer):
    field_requirements = serializers.SerializerMethodField()
    
    class Meta:
        model = models.MotorCategory
        fields = [
            'id', 'code', 'name', 'description', 'icon',
            'requires_tonnage', 'requires_engine_capacity', 
            'requires_passenger_count', 'requires_passenger_type',
            'requires_carrying_capacity', 'supports_time_period_variants',
            'min_vehicle_age', 'max_vehicle_age', 'field_requirements',
            'sort_order', 'is_active'
        ]
    
    def get_field_requirements(self, obj):
        """Return dynamic field requirements for frontend form generation"""
        requirements = {
            'core_fields': [
                'financial_interest', 'vehicle_identification_method',
                'registration_number', 'vehicle_make', 'vehicle_model',
                'year_of_manufacture', 'cover_start_date', 'kyc_documents'
            ]
        }
        
        if obj.requires_tonnage:
            requirements['tonnage'] = {'type': 'number', 'max': 31, 'required': True}
        if obj.requires_engine_capacity:
            requirements['engine_capacity'] = {'type': 'number', 'unit': 'cc', 'required': True}
        if obj.requires_passenger_count:
            requirements['passenger_count'] = {'type': 'number', 'min': 1, 'required': True}
        if obj.requires_passenger_type:
            requirements['passenger_type'] = {
                'type': 'select', 
                'options': ['ADULTS', 'STUDENTS', 'MIXED'], 
                'required': True
            }
            
        return requirements


## Deprecated: MotorCoverTypeSerializer removed with MotorCoverType model


class MotorPolicySerializer(serializers.ModelSerializer):
    """Serializer for MotorPolicy model"""
    # Non-breaking, derived fields to make frontend consumption easier
    source = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    subcategory = serializers.SerializerMethodField()
    coverType = serializers.SerializerMethodField()
    vehicleRegistration = serializers.SerializerMethodField()
    vehicleMake = serializers.SerializerMethodField()
    vehicleModel = serializers.SerializerMethodField()
    vehicleYear = serializers.SerializerMethodField()
    totalPremium = serializers.SerializerMethodField()
    daysUntilExpiry = serializers.SerializerMethodField()
    isExtendible = serializers.SerializerMethodField()
    
    class Meta:
        model = models.MotorPolicy
        fields = [
            'id', 'policy_number', 'quote_id', 'client_details', 'vehicle_details',
            'product_details', 'underwriter_details', 'premium_breakdown',
            'payment_details', 'addons', 'documents', 'status',
            'cover_start_date', 'cover_end_date', 'policy_document_url',
            'receipt_url', 'certificate_url', 'submitted_at', 'notes',
            # derived helpers
            'source', 'category', 'subcategory', 'coverType',
            'vehicleRegistration', 'vehicleMake', 'vehicleModel', 'vehicleYear',
            'totalPremium', 'daysUntilExpiry', 'isExtendible'
        ]
        read_only_fields = ['id', 'policy_number', 'submitted_at']

    # ----- Derived fields -----
    def get_source(self, obj):
        return 'motor2'

    def get_category(self, obj):
        data = obj.product_details or {}
        return data.get('category') or 'MOTOR'

    def get_subcategory(self, obj):
        data = obj.product_details or {}
        return data.get('subcategory') or data.get('coverType') or None

    def get_coverType(self, obj):
        data = obj.product_details or {}
        return data.get('coverType') or data.get('subcategory') or None

    def get_vehicleRegistration(self, obj):
        v = obj.vehicle_details or {}
        return v.get('registration') or v.get('registration_number') or v.get('plate') or None

    def get_vehicleMake(self, obj):
        v = obj.vehicle_details or {}
        return v.get('make') or None

    def get_vehicleModel(self, obj):
        v = obj.vehicle_details or {}
        return v.get('model') or None

    def get_vehicleYear(self, obj):
        v = obj.vehicle_details or {}
        return v.get('year') or v.get('year_of_manufacture') or None

    def get_totalPremium(self, obj):
        p = obj.premium_breakdown or {}
        # support multiple key conventions
        return (
            p.get('total_premium')
            or p.get('totalPremium')
            or p.get('total_amount')
            or p.get('totalAmount')
            or 0
        )

    def get_daysUntilExpiry(self, obj):
        try:
            from django.utils import timezone
            if obj.cover_end_date:
                return (obj.cover_end_date - timezone.now().date()).days
        except Exception:
            pass
        return None

    def get_isExtendible(self, obj):
        d = obj.product_details or {}
        return bool(d.get('is_extendible', False))


class MotorPolicySubmissionSerializer(serializers.Serializer):
    """Serializer for validating Motor 2 policy submission from frontend"""
    
    # Required fields
    quoteId = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    
    # Client details
    clientDetails = serializers.JSONField(required=True)
    
    # Vehicle details
    vehicleDetails = serializers.JSONField(required=True)
    
    # Product details
    productDetails = serializers.JSONField(required=True)
    
    # Optional fields
    underwriterDetails = serializers.JSONField(required=False, allow_null=True)
    premiumBreakdown = serializers.JSONField(required=True)
    paymentDetails = serializers.JSONField(required=True)
    addons = serializers.ListField(required=False, default=list)
    documents = serializers.ListField(required=False, default=list)
    
    def validate(self, data):
        """Cross-field validation"""
        # Check if this is a comprehensive product
        product_details = data.get('productDetails', {})
        coverage_type = product_details.get('coverage_type', '').upper()
        subcategory = product_details.get('subcategory', '').upper()
        
        is_comprehensive = 'COMP' in coverage_type or 'COMP' in subcategory
        
        # For comprehensive products, fullName and phone are optional in clientDetails
        # For other products, they are required
        client_details = data.get('clientDetails', {})
        
        if not is_comprehensive:
            # Non-comprehensive: fullName and phone are required
            required_client_fields = ['fullName', 'phone']
            missing = [f for f in required_client_fields if not client_details.get(f)]
            if missing:
                raise serializers.ValidationError({
                    'clientDetails': f"Missing required fields for non-comprehensive products: {', '.join(missing)}"
                })
        
        return data
    
    def validate_clientDetails(self, value):
        """Validate client details has required fields"""
        # Email is always required regardless of product type
        if not value.get('email'):
            raise serializers.ValidationError("Email is required")
        return value
    
    def validate_vehicleDetails(self, value):
        """Validate vehicle details has required fields"""
        required_fields = ['registration', 'make', 'model', 'year']
        missing = [f for f in required_fields if not value.get(f)]
        if missing:
            raise serializers.ValidationError(
                f"Missing required vehicle fields: {', '.join(missing)}"
            )
        return value
    
    def validate_productDetails(self, value):
        """Validate product details has required fields"""
        required_fields = ['category', 'subcategory']
        missing = [f for f in required_fields if not value.get(f)]
        if missing:
            raise serializers.ValidationError(
                f"Missing required product fields: {', '.join(missing)}"
            )
        return value
    
    def validate_premiumBreakdown(self, value):
        """Validate premium breakdown has total_amount"""
        if 'total_amount' not in value and 'totalAmount' not in value:
            raise serializers.ValidationError(
                "Premium breakdown must include total_amount"
            )
        return value
    
    def validate_paymentDetails(self, value):
        """Validate payment details has required fields"""
        required_fields = ['method', 'amount']
        missing = [f for f in required_fields if not value.get(f)]
        if missing:
            raise serializers.ValidationError(
                f"Missing required payment fields: {', '.join(missing)}"
            )
        return value

    def validate_documents(self, value):
        """Validate documents array structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Documents must be a list")
        
        # Documents are optional, but if provided, validate structure
        for i, doc in enumerate(value):
            if not isinstance(doc, dict):
                raise serializers.ValidationError(
                    f"Document at index {i} must be an object"
                )
            # Optional: Validate document has required fields
            # Common fields: document_type, s3_key, s3_url, document_id
            if doc.get('s3_key') and not doc.get('document_type'):
                raise serializers.ValidationError(
                    f"Document at index {i} has s3_key but missing document_type"
                )
        
        return value


# ==============================
# ManualQuote Serializers
# ==============================

class ManualQuoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ManualQuote
        fields = [
            'reference', 'line_key', 'payload', 'preferred_underwriters'
        ]
        read_only_fields = ['reference']

    def create(self, validated_data):
        user = self.context['request'].user
        ref = models.ManualQuote.generate_reference(validated_data.get('line_key'))
        return models.ManualQuote.objects.create(
            reference=ref,
            agent=user,
            status='PENDING_ADMIN_REVIEW',
            **validated_data
        )


class ManualQuoteSerializer(serializers.ModelSerializer):
    agent_code = serializers.SerializerMethodField()

    class Meta:
        model = models.ManualQuote
        fields = [
            'reference', 'line_key', 'agent_code', 'status', 'payload',
            'preferred_underwriters', 'computed_premium', 'levies_breakdown',
            'admin_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'reference', 'agent_code', 'computed_premium', 'levies_breakdown',
            'admin_notes', 'created_at', 'updated_at'
        ]

    def get_agent_code(self, obj):
        if hasattr(obj.agent, 'staff_user_profile') and obj.agent.staff_user_profile:
            return f"{obj.agent.staff_user_profile.agent_prefix}{obj.agent.staff_user_profile.agent_code}"
        return None


class ManualQuoteAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ManualQuote
        fields = [
            'status', 'computed_premium', 'levies_breakdown', 'admin_notes'
        ]
        read_only_fields = []

    def validate_status(self, value):
        if value not in [s[0] for s in models.MANUAL_QUOTE_STATUS]:
            raise serializers.ValidationError('Invalid status value')
        return value


# ============================================================================
# CAMPAIGN SERIALIZERS
# ============================================================================

class CampaignSerializer(serializers.ModelSerializer):
    """Public campaign serializer for poster-only banners."""
    is_active_now = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = models.Campaign
        fields = [
            'id', 'image_url', 'is_active_now'
        ]
        read_only_fields = fields
    
    def get_is_active_now(self, obj):
        from django.utils import timezone
        now = timezone.now()
        return (
            obj.status == 'ACTIVE' and
            obj.start_date <= now <= obj.end_date
        )

    def get_image_url(self, obj):
        request = self.context.get('request')
        
        def _normalize_url(url: str) -> str:
            """Ensure URL is absolute (when possible), maps local hosts to request host, and percent-encodes path."""
            if not url:
                return url
            try:
                from urllib.parse import urlparse, urlunparse, quote
                parsed = urlparse(url)
                # If relative, make absolute using request
                if request and not parsed.scheme:
                    abs_url = request.build_absolute_uri(url)
                    parsed = urlparse(abs_url)
                # Swap local-only hosts with request host
                local_hosts = {'localhost', '127.0.0.1', '0.0.0.0'}
                if request and parsed.hostname in local_hosts:
                    # rebuild using request scheme/host but preserve path/query
                    req_parsed = urlparse(request.build_absolute_uri('/'))
                    parsed = parsed._replace(scheme=req_parsed.scheme, netloc=req_parsed.netloc)
                # Percent-encode path to handle spaces and unsafe characters
                encoded_path = quote(parsed.path or '', safe='/:')
                # Rebuild URL
                rebuilt = urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    encoded_path,
                    parsed.params,
                    parsed.query,
                    parsed.fragment,
                ))
                return rebuilt
            except Exception:
                return url
        # Prefer uploaded banner if present
        if getattr(obj, 'banner_image', None):
            try:
                url = obj.banner_url  # property returns file url or fallback
                return _normalize_url(url)
            except Exception:
                pass
        # Fallback to stored image_url; handle relative and local-only hosts
        return _normalize_url(obj.image_url)


class CampaignInteractionSerializer(serializers.ModelSerializer):
    """Track campaign interactions (impressions, clicks, conversions)."""
    
    class Meta:
        model = models.CampaignInteraction
        fields = ['campaign', 'interaction_type', 'ip_address', 'user_agent']
        read_only_fields = ['user']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CampaignAdminSerializer(serializers.ModelSerializer):
    """Full campaign details for admin endpoints."""
    performance = serializers.SerializerMethodField()
    
    class Meta:
        model = models.Campaign
        fields = '__all__'
        read_only_fields = ['total_impressions', 'total_clicks', 'total_conversions', 'total_spent']
    
    def get_performance(self, obj):
        ctr = (obj.total_clicks / obj.total_impressions * 100) if obj.total_impressions else 0
        cvr = (obj.total_conversions / obj.total_clicks * 100) if obj.total_clicks else 0
        return {
            'impressions': obj.total_impressions,
            'clicks': obj.total_clicks,
            'conversions': obj.total_conversions,
            'ctr': round(ctr, 2),
            'cvr': round(cvr, 2),
            'spent': float(obj.total_spent)
        }


class CampaignAdminWriteSerializer(serializers.ModelSerializer):
    """Simplified admin serializer for create/update with essential fields only."""
    class Meta:
        model = models.Campaign
        fields = [
            'name', 'campaign_type', 'status', 'target_roles',
            'banner_image', 'image_url',
            'start_date', 'end_date',
        ]
        read_only_fields = []

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'End date must be after start date'})
        # Require either uploaded image or image_url
        image_url = attrs.get('image_url')
        banner_image = attrs.get('banner_image')
        if self.instance is not None:
            image_url = image_url if image_url not in (None, '') else getattr(self.instance, 'image_url', None)
            banner_image = banner_image or getattr(self.instance, 'banner_image', None)
        if not banner_image and not image_url:
            raise serializers.ValidationError({'image': 'Provide a banner by uploading an image or entering an Image URL'})
        # Validate uploaded image if present (no auto-fix)
        from .utils.image_validation import validate_banner_image_file
        if banner_image is not None:
            try:
                validate_banner_image_file(banner_image)
            except ValueError as e:
                raise serializers.ValidationError({'banner_image': f'{e} Please resize/crop to ~16:9 (e.g. 1200x675) using an online image resizer, then re-upload.'})
        return attrs


class DMVICSearchVehicleSerializer(serializers.Serializer):
    registration_number = serializers.CharField(max_length=20, required=True)
    proposed_cover_start_date = serializers.DateField(required=False, allow_null=True)

class DMVICValidateDoubleInsuranceSerializer(serializers.Serializer):
    registration_number = serializers.CharField(max_length=20, required=True)
    chassis_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)

class DMVICPolicyIdSerializer(serializers.Serializer):
    policy_id = serializers.UUIDField(required=True) # Assuming policy_id is a UUID

class DMVICConfirmIssuanceSerializer(serializers.Serializer):
    issuance_request_id = serializers.CharField(max_length=100, required=True)
    is_approved = serializers.BooleanField(required=False, default=True)
    is_logbook_verified = serializers.BooleanField(required=False, default=True)
    is_vehicle_inspected = serializers.BooleanField(required=False, default=True)
    comments = serializers.CharField(required=False, allow_blank=True, max_length=500)
    username = serializers.EmailField(required=False, allow_blank=True)

class DMVICGetCertificatePdfSerializer(serializers.Serializer):
    certificate_number = serializers.CharField(max_length=100, required=False)
    policy_id = serializers.UUIDField(required=False)

    def validate(self, data):
        if not data.get('certificate_number') and not data.get('policy_id'):
            raise serializers.ValidationError("Either certificate_number or policy_id is required.")
        return data




