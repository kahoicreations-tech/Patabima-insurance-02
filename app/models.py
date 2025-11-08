import uuid
from decimal import Decimal, ROUND_HALF_UP
from django.db import models
from django.contrib.auth.models import AbstractBaseUser
from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone


GENDER = [
    ('MALE', 'Male'),
    ('FEMALE', 'Female'),
    ('OTHERS', 'Others'),
]


ROLES = [
    ('ADMIN', 'Admin'),
    ('AGENT', 'Agent'),
    ('CUSTOMER', 'Customer'),
]


OTPFOR = [
    ('LOGIN', 'Login'),
    ('CREATE_ACCOUNT', 'Create_Account'),
    ('RESET_PASSWORD', 'Reset_Password'),
    ('VERIFY', 'Verify')
]




class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    date_created = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    date_updated = models.DateTimeField(auto_now=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)


    class Meta:
        abstract = True
        ordering = ("-date_created",)




class UserManager(BaseUserManager):
    def create_user(self, phonenumber, password=None, email=None, **extra_fields):
        """
        Create and save a User with the given phone number (10 digits with leading 0).
        The phonenumber should be in Kenyan format: 0712345678
        If 9 digits provided, automatically add leading 0.
        """
        if not phonenumber:
            raise ValueError("The phone number must be set")

        # Normalize: Add leading 0 if 9 digits provided
        cleaned_phone = ''.join(filter(str.isdigit, str(phonenumber)))
        if len(cleaned_phone) == 9 and not cleaned_phone.startswith('0'):
            phonenumber = '0' + cleaned_phone
        elif len(cleaned_phone) == 10 and cleaned_phone.startswith('0'):
            phonenumber = cleaned_phone
        else:
            # Keep as-is and let validation catch errors
            phonenumber = cleaned_phone

        user = self.model(phonenumber=phonenumber, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user


    def create_superuser(self, phonenumber, password, email=None, **extra_fields):
        user = self.create_user(phonenumber=phonenumber, password=password, email=email, **extra_fields)
        user.is_admin = True
        user.is_staff = True
        user.is_active = True
        user.save(using=self._db)
        return user




class User(AbstractBaseUser, BaseModel):
    email = models.CharField(max_length=255, unique=True, null=True, blank=True)
    # Store 10 digits WITH leading 0, e.g. 0712345678 (Kenyan format)
    phonenumber = models.CharField(max_length=10, unique=True)
    role = models.CharField(max_length=20, choices=ROLES, default='CUSTOMER')
    nationality = models.CharField(max_length=100, default='KENYAN')
    country_code = models.CharField(max_length=10, default='+254')
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    created_by = models.CharField(max_length=100, default='SYSTEM')
    is_default_password = models.BooleanField(default=False)


    objects = UserManager()


    USERNAME_FIELD = "phonenumber"
    REQUIRED_FIELDS = []


    def __str__(self):
        return str(self.id)


    def has_perm(self, perm, obj=None):
        return True


    def has_module_perms(self, app_label):
        return True




class Profile(BaseModel):
    idnum = models.CharField(max_length=15, blank=True, null=True, unique=True)
    full_names = models.CharField(max_length=50, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    physical_address = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=10, null=True, blank=True, choices=GENDER)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    class Meta:
        abstract = True


# ==============================
# Claims Management
# ==============================

CLAIM_STATUS = [
    ("DRAFT", "Draft"),
    ("SUBMITTED", "Submitted"),
    ("UNDER_REVIEW", "Under Review"),
    ("APPROVED", "Approved"),
    ("REJECTED", "Rejected"),
    ("CLOSED", "Closed"),
]


class Claim(BaseModel):
    """Insurance claim submitted by a user against a policy."""
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='claims')
    policy_number = models.CharField(max_length=64)
    product = models.CharField(max_length=32, default='MOTOR')
    loss_date = models.DateTimeField()
    loss_location = models.CharField(max_length=255)
    loss_description = models.TextField()
    status = models.CharField(max_length=20, choices=CLAIM_STATUS, default='SUBMITTED')

    def __str__(self):
        return f"{self.policy_number} - {self.status}"


class ClaimDocument(BaseModel):
    """Documents attached to a Claim stored in S3."""
    claim = models.ForeignKey('Claim', on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=64)
    s3_key = models.CharField(max_length=512)
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)
    content_type = models.CharField(max_length=128, blank=True, null=True)

    def __str__(self):
        return f"{self.doc_type}: {self.file_name}"





class StaffUserProfile(Profile):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="staff_user_profile",
        blank=True,
        null=True,
    )
    agent_code = models.IntegerField(unique=True)
    agent_prefix = models.CharField(max_length=5, default='AGT')




class PublicUserProfile(Profile):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="public_user_profile",
        blank=True,
        null=True,
    )
    registration_number = models.CharField(max_length=20, unique=True)


    def __str__(self):
        return str(self.registration_number)




class OTPModel(models.Model):
    otp_for = models.CharField(max_length=50, choices=OTPFOR)
    code = models.CharField(max_length=10, default='INVALID')
    expiry_time = models.DateTimeField(blank=True, null=True)
    # keep storing user as string (UUID) to match the project's history and avoid FK migration complexity
    user = models.CharField(max_length=50)
    date_created = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    date_updated = models.DateTimeField(auto_now=True)




class MessagesModels(models.Model):
    id = models.AutoField(primary_key=True)
    message_for = models.CharField(max_length=100)
    message = models.TextField()
    variables = models.JSONField()
    is_active = models.BooleanField(default=True)


# ==============================
# Manual (Non-Motor) Quotes Persistence
# ==============================

MANUAL_QUOTE_STATUS = [
    ("PENDING_ADMIN_REVIEW", "Pending Admin Review"),
    ("IN_PROGRESS", "In Progress"),
    ("COMPLETED", "Completed"),
    ("REJECTED", "Rejected"),
]


class ManualQuote(models.Model):
    # Keep schema aligned with applied migration 0038
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    """Persisted simplified quotation for non-motor lines (travel, last expense, etc.).

    Stores original raw form payload so frontend can evolve without schema migrations.
    Future enhancements can add indexing on selected JSON attributes if needed.
    """
    # BaseModel-like audit flags added by 0038
    date_created = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    date_updated = models.DateTimeField(auto_now=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    reference = models.CharField(max_length=40, unique=True, db_index=True)
    line_key = models.CharField(max_length=40, db_index=True)
    agent = models.ForeignKey('User', on_delete=models.CASCADE, related_name='manual_quotes')
    payload = models.JSONField()
    preferred_underwriters = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=30, choices=MANUAL_QUOTE_STATUS, default='PENDING_ADMIN_REVIEW', db_index=True)
    computed_premium = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    levies_breakdown = models.JSONField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} ({self.line_key})"

    @staticmethod
    def generate_reference(line_key: str):
        return f"MNL-{(line_key or 'GEN').upper()}-{uuid.uuid4().hex[:8].upper()}"


# Insurance Models - Enhanced for Motor Insurance System
INSURANCE_TYPES = [
    ('MOTOR_PRIVATE', 'Motor Private'),
    ('MOTOR_COMMERCIAL', 'Motor Commercial'),
    ('MOTOR_PSV', 'Motor PSV'),
    ('MOTOR_MOTORCYCLE', 'Motor Motorcycle'),
    ('MOTOR_TUKTUK', 'Motor TukTuk'),
    ('MOTOR_SPECIAL', 'Motor Special Classes'),
    ('MEDICAL', 'Medical'),
]

MOTOR_CATEGORIES = [
    ('PRIVATE', 'Private Vehicles'),
    ('COMMERCIAL', 'Commercial Vehicles'),
    ('PSV', 'Public Service Vehicles'),
    ('MOTORCYCLE', 'Motorcycles'),
    ('TUKTUK', 'TukTuk'),
    ('SPECIAL', 'Special Classes'),
]

PRODUCT_TYPES = [
    ('TOR', 'Time on Risk'),
    ('THIRD_PARTY', 'Third Party'),
    ('THIRD_PARTY_EXT', 'Third Party with Extensions'),
    ('COMPREHENSIVE', 'Comprehensive'),
]

PRICING_MODELS = [
    ('FIXED', 'Fixed Amount'),
    ('BRACKET', 'Bracket Based'),
    ('TONNAGE', 'Tonnage Based'),
    ('PASSENGER', 'Passenger Based'),
    ('ENGINE_CC', 'Engine CC Based'),
]

# COVER_TYPES removed - using subcategories instead

QUOTATION_STATUS = [
    ('DRAFT', 'Draft'),
    ('SUBMITTED', 'Submitted'),
    ('PENDING', 'Pending'),
    ('APPROVED', 'Approved'),
    ('DECLINED', 'Declined'),
    ('CONVERTED', 'Converted to Policy'),
]


class InsuranceQuotation(BaseModel):
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quotations')
    insurance_type = models.CharField(max_length=20, choices=INSURANCE_TYPES)
    quotation_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=QUOTATION_STATUS, default='DRAFT')
    
    # Form data stored as JSON
    form_data = models.JSONField()
    
    # Pricing information
    base_premium = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    training_levy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stamp_duty = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_premium = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Service processing data
    dmvic_data = models.JSONField(null=True, blank=True)
    textract_data = models.JSONField(null=True, blank=True)
    
    # Underwriter information
    selected_underwriter = models.CharField(max_length=100, null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.quotation_number:
            self.quotation_number = self.generate_quotation_number()
        super().save(*args, **kwargs)
    
    def generate_quotation_number(self):
        import random
        import string
        prefix = 'QUO'
        suffix = ''.join(random.choice(string.digits) for _ in range(6))
        return f"{prefix}{suffix}"
    
    def __str__(self):
        return f"{self.quotation_number} - {self.insurance_type}"


class MotorInsuranceDetails(BaseModel):
    quotation = models.OneToOneField(InsuranceQuotation, on_delete=models.CASCADE, related_name='motor_details')
    
    # Vehicle Information
    vehicle_make = models.CharField(max_length=50)
    vehicle_model = models.CharField(max_length=50)
    vehicle_year = models.IntegerField()
    vehicle_registration = models.CharField(max_length=20)
    chassis_number = models.CharField(max_length=50, null=True, blank=True)
    engine_number = models.CharField(max_length=50, null=True, blank=True)
    subcategory = models.ForeignKey('MotorSubcategory', on_delete=models.PROTECT, related_name='insurance_details', null=True, blank=True)
    
    # Owner Information
    owner_name = models.CharField(max_length=100)
    owner_id_number = models.CharField(max_length=15)
    owner_kra_pin = models.CharField(max_length=15, null=True, blank=True)
    owner_phone = models.CharField(max_length=15)
    owner_email = models.EmailField(null=True, blank=True)
    
    # Policy Dates
    cover_start_date = models.DateField()
    cover_end_date = models.DateField()
    
    # Additional Information
    vehicle_usage = models.CharField(max_length=50, null=True, blank=True)
    vehicle_color = models.CharField(max_length=30, null=True, blank=True)
    seating_capacity = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.vehicle_registration} - {self.vehicle_make} {self.vehicle_model}"


class DocumentUpload(BaseModel):
    quotation = models.ForeignKey(InsuranceQuotation, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    motor_policy = models.ForeignKey(
        'MotorPolicy',
        on_delete=models.CASCADE,
        related_name='uploaded_documents',
        null=True,
        blank=True,
        help_text="Link to Motor 2 policy if applicable (for KYC documents)"
    )
    document_type = models.CharField(max_length=50)  # 'logbook', 'national_id', 'kra_pin', 'inspection_cert'
    file_path = models.CharField(max_length=500)
    original_filename = models.CharField(max_length=255)
    extracted_data = models.JSONField(null=True, blank=True)
    extraction_confidence = models.FloatField(null=True, blank=True)
    processing_status = models.CharField(max_length=20, default='UPLOADED')
    
    # Additional fields from migration 0028
    document_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    policy_id = models.CharField(max_length=100, null=True, blank=True)
    agent_id = models.CharField(max_length=100, null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    
    UPLOAD_METHOD_CHOICES = [
        ('Django', 'Django Backend'),
        ('S3', 'AWS S3'),
    ]
    upload_method = models.CharField(max_length=20, default='Django', choices=UPLOAD_METHOD_CHOICES)
    
    ENVIRONMENT_CHOICES = [
        ('development', 'Development'),
        ('staging', 'Staging'),
        ('production', 'Production'),
    ]
    environment = models.CharField(max_length=20, default='development', choices=ENVIRONMENT_CHOICES)
    
    def __str__(self):
        return f"{self.document_type} - {self.original_filename}"


class ServiceProcessingLog(BaseModel):
    quotation = models.ForeignKey(InsuranceQuotation, on_delete=models.CASCADE, related_name='service_logs')
    service_type = models.CharField(max_length=50)  # 'DMVIC', 'TEXTRACT', 'PRICING'
    request_data = models.JSONField()
    response_data = models.JSONField(null=True, blank=True)
    processing_time = models.IntegerField(null=True, blank=True)  # in milliseconds
    success = models.BooleanField(default=False)
    error_message = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.service_type} - {self.quotation.quotation_number}"


class MotorSubcategory(BaseModel):
    # Forward reference to the new MotorCategory defined later in the file
    category = models.ForeignKey('MotorCategory', on_delete=models.CASCADE, related_name='subcategories')
    subcategory_code = models.CharField(max_length=50, unique=True)
    subcategory_name = models.CharField(max_length=100)
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPES)
    pricing_model = models.CharField(max_length=20, choices=PRICING_MODELS)
    is_complex = models.BooleanField(default=False)
    additional_fields = models.JSONField(default=list)  # Required additional fields
    pricing_requirements = models.JSONField(default=dict)  # Field validation rules
    is_active = models.BooleanField(default=True)
    # Public catalog visibility controls
    show_in_public = models.BooleanField(default=False)
    public_sort_order = models.IntegerField(default=0)
    public_label = models.CharField(max_length=120, null=True, blank=True)
    
    class Meta:
        verbose_name_plural = "Motor Subcategories"
        ordering = ['category', 'subcategory_name']
    
    def __str__(self):
        # Use the new MotorCategory fields
        try:
            return f"{self.category.name} - {self.subcategory_name}"
        except Exception:
            # Fallback to avoid admin crashes if migrations pending
            return f"{self.subcategory_name}"


class Underwriter(BaseModel):
    company_name = models.CharField(max_length=100, unique=True)
    company_code = models.CharField(max_length=20, unique=True)
    contact_email = models.EmailField(null=True, blank=True)
    contact_phone = models.CharField(max_length=15, null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    is_active = models.BooleanField(default=True)
    supported_categories = models.JSONField(default=list)  # Categories this underwriter supports
    
    class Meta:
        ordering = ['-rating', 'company_name']
    
    def __str__(self):
        return self.company_name


class MotorPricing(BaseModel):
    subcategory = models.ForeignKey(MotorSubcategory, on_delete=models.CASCADE, related_name='pricing')
    underwriter = models.ForeignKey('InsuranceProvider', on_delete=models.CASCADE, related_name='motor_pricing')
    
    # Base pricing information
    base_premium = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_premium = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    maximum_premium = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Bracket-based pricing (for comprehensive products)
    bracket_pricing = models.JSONField(null=True, blank=True)  # Sum insured brackets
    
    # Additional pricing factors
    pricing_factors = models.JSONField(default=dict)  # Vehicle age, usage factors, etc.
    
    # Effective dates
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['subcategory', 'underwriter', 'effective_from']
        ordering = ['-effective_from']
    
    def __str__(self):
        return f"{self.subcategory} - {self.underwriter} - KSh {self.base_premium}"


class CommercialTonnagePricing(BaseModel):
    subcategory = models.ForeignKey(MotorSubcategory, on_delete=models.CASCADE, related_name='tonnage_pricing')
    underwriter = models.ForeignKey('InsuranceProvider', on_delete=models.CASCADE, related_name='tonnage_pricing')
    
    tonnage_from = models.DecimalField(max_digits=5, decimal_places=1)  # e.g., 0.0 for "Upto 3 Tons"
    tonnage_to = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)    # e.g., 3.0 for "Upto 3 Tons"; may be null for open-ended ranges
    tonnage_description = models.CharField(max_length=50)  # "Upto 3 Tons", "3.5 to 8 Tons", etc.
    base_premium = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Special cases
    is_prime_mover = models.BooleanField(default=False)
    is_over_limit = models.BooleanField(default=False)  # For "Over 20 Tons"
    
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['subcategory', 'underwriter', 'tonnage_from', 'tonnage_to', 'effective_from']
        ordering = ['tonnage_from']
    
    def __str__(self):
        return f"{self.tonnage_description} - KSh {self.base_premium}"


class PSVPLLPricing(BaseModel):
    subcategory = models.ForeignKey(MotorSubcategory, on_delete=models.CASCADE, related_name='pll_pricing')
    underwriter = models.ForeignKey('InsuranceProvider', on_delete=models.CASCADE, related_name='pll_pricing')
    
    pll_amount = models.DecimalField(max_digits=10, decimal_places=2)  # 500 or 250
    rate_per_person = models.DecimalField(max_digits=10, decimal_places=2)
    is_commercial_institutional = models.BooleanField(default=False)
    
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['subcategory', 'underwriter', 'pll_amount', 'effective_from']
        ordering = ['-pll_amount']
    
    def __str__(self):
        return f"PLL {self.pll_amount} - KSh {self.rate_per_person} per person"


class VehicleAdjustmentFactor(BaseModel):
    factor_type = models.CharField(max_length=50)  # 'vehicle_age', 'usage_type', etc.
    factor_key = models.CharField(max_length=50)   # '0-1', '1-3', 'private', 'commercial'
    factor_value = models.DecimalField(max_digits=5, decimal_places=4)  # Multiplier
    description = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['factor_type', 'factor_key']
        ordering = ['factor_type', 'factor_key']
    
    def __str__(self):
        return f"{self.factor_type}: {self.factor_key} - {self.factor_value}"


class MandatoryLevy(BaseModel):
    levy_name = models.CharField(max_length=100, unique=True)
    levy_code = models.CharField(max_length=20, unique=True)
    levy_type = models.CharField(max_length=20, choices=[
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount')
    ])
    levy_rate = models.DecimalField(max_digits=10, decimal_places=4)  # 0.0025 for 0.25%
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Mandatory Levies"
        ordering = ['levy_name']
    
    def __str__(self):
        if self.levy_type == 'PERCENTAGE':
            return f"{self.levy_name} - {self.levy_rate * 100}%"
        else:
            return f"{self.levy_name} - KSh {self.levy_rate}"


class AdditionalCoverage(BaseModel):
    coverage_name = models.CharField(max_length=100)
    coverage_code = models.CharField(max_length=20, unique=True)
    description = models.TextField(null=True, blank=True)
    pricing_type = models.CharField(max_length=20, choices=[
        ('PERCENTAGE', 'Percentage of Sum Insured'),
        ('FIXED', 'Fixed Amount'),
        ('RATE', 'Rate per Unit')
    ])
    default_rate = models.DecimalField(max_digits=10, decimal_places=4)
    is_optional = models.BooleanField(default=True)
    applicable_to = models.JSONField(default=list)  # Which product types this applies to
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['coverage_name']
    
    def __str__(self):
        return self.coverage_name


# =========================
# Motor Insurance Schema
# =========================

class InsuranceProvider(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=50, unique=True)
    contact_email = models.EmailField(null=True, blank=True)
    contact_phone = models.CharField(max_length=30, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    supported_categories = models.JSONField(default=list, blank=True)
    supported_payment_methods = models.JSONField(default=list, blank=True)
    features = models.JSONField(default=dict, blank=True)
    
    # Day 11: NET/GROSS display configuration
    DISPLAY_MODE_CHOICES = [
        ('NET', 'NET - Base Premium Only'),
        ('GROSS', 'GROSS - Premium with Levies'),
    ]
    display_mode = models.CharField(
        max_length=10,
        choices=DISPLAY_MODE_CHOICES,
        default='GROSS',
        help_text='Display NET (base premium) or GROSS (with levies) in underwriter comparison'
    )

    def __str__(self):
        return self.name
    
    def get_display_premium(self, base_premium, levies=None):
        """
        Calculate display premium based on display_mode.
        
        Args:
            base_premium: Base insurance premium (Decimal or float)
            levies: Dict with levy amounts (ITL, PCF, stamp_duty) or None
        
        Returns:
            Decimal: Premium to display based on mode
        """
        from decimal import Decimal
        
        base = Decimal(str(base_premium))
        
        if self.display_mode == 'NET':
            return base
        
        # GROSS mode - add all levies
        if not levies:
            return base
            
        itl = Decimal(str(levies.get('ITL', 0)))
        pcf = Decimal(str(levies.get('PCF', 0)))
        stamp = Decimal(str(levies.get('stamp_duty', 0)))
        
        return base + itl + pcf + stamp







class AdditionalFieldPricing(BaseModel):
    subcategory = models.ForeignKey(MotorSubcategory, on_delete=models.CASCADE, related_name='additional_pricing')
    field_code = models.CharField(max_length=50)
    pricing_data = models.JSONField(default=dict)
    effective_from = models.DateField(default=timezone.now)
    effective_to = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('subcategory', 'field_code', 'effective_from')


# =========================
# Extendible Product Models
# =========================
# ExtendiblePricing, PolicyExtension, ExtensionReminder models removed
# Using InsuranceProvider.features.pricing and MotorPolicy.product_details.extendible_config instead


# =========================
# Campaign Management Models
# =========================

class Campaign(BaseModel):
    CAMPAIGN_STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    CAMPAIGN_TYPE_CHOICES = [
        ('PROMOTIONAL', 'Promotional'),
        ('EDUCATIONAL', 'Educational'),
        ('SEASONAL', 'Seasonal'),
        ('PRODUCT_LAUNCH', 'Product Launch'),
        ('RETENTION', 'Customer Retention'),
        ('ACQUISITION', 'Customer Acquisition'),
    ]

    TARGET_ROLE_CHOICES = [
        ('ALL', 'All Users'),
        ('AGENT', 'Agents Only'),
        ('CUSTOMER', 'Customers Only'),
        ('NEW_USERS', 'New Users'),
        ('ACTIVE_AGENTS', 'Active Agents'),
        ('INACTIVE_AGENTS', 'Inactive Agents'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    campaign_type = models.CharField(max_length=20, choices=CAMPAIGN_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=CAMPAIGN_STATUS_CHOICES, default='DRAFT')

    # Targeting
    target_roles = models.CharField(max_length=20, choices=TARGET_ROLE_CHOICES, default='ALL')
    target_regions = models.JSONField(default=list, blank=True)
    target_age_min = models.IntegerField(null=True, blank=True)
    target_age_max = models.IntegerField(null=True, blank=True)

    # Content (banner-based)
    title = models.CharField(max_length=150)
    message = models.TextField()
    image_url = models.URLField(blank=True)
    # New: uploaded banner image (preferred over image_url when present)
    banner_image = models.ImageField(upload_to='campaign_banners/', blank=True, null=True)
    call_to_action = models.CharField(max_length=100)
    action_url = models.URLField(blank=True)

    # Scheduling
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()

    # Budget and Goals
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    target_impressions = models.IntegerField(null=True, blank=True)
    target_clicks = models.IntegerField(null=True, blank=True)
    target_conversions = models.IntegerField(null=True, blank=True)

    # Performance Tracking
    total_impressions = models.IntegerField(default=0)
    total_clicks = models.IntegerField(default=0)
    total_conversions = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_by = models.ForeignKey('User', on_delete=models.PROTECT, related_name='created_campaigns')

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Campaign'
        verbose_name_plural = 'Campaigns'

    def __str__(self):
        return f"{self.name} ({self.status})"

    @property
    def banner_url(self):
        try:
            if self.banner_image and hasattr(self.banner_image, 'url'):
                return self.banner_image.url
        except Exception:
            pass
        return self.image_url


class CampaignInteraction(BaseModel):
    INTERACTION_TYPE_CHOICES = [
        ('IMPRESSION', 'Impression'),
        ('CLICK', 'Click'),
        ('CONVERSION', 'Conversion'),
        ('DISMISS', 'Dismiss'),
    ]

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='interactions')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='campaign_interactions')
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPE_CHOICES)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)

    class Meta:
        ordering = ['-date_created']

    def __str__(self):
        return f"{self.user.phonenumber} - {self.campaign.name} - {self.interaction_type}"


class CampaignSchedule(BaseModel):
    FREQUENCY_CHOICES = [
        ('ONCE', 'Once'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    ]

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='schedules')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='ONCE')
    days_of_week = models.JSONField(default=list, blank=True)
    day_of_month = models.IntegerField(null=True, blank=True)
    time_of_day = models.TimeField()
    timezone = models.CharField(max_length=50, default='Africa/Nairobi')

    is_active = models.BooleanField(default=True)
    last_sent = models.DateTimeField(null=True, blank=True)
    next_send = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['next_send']

    def __str__(self):
        return f"{self.campaign.name} - {self.frequency}"


# Motor Insurance Models

class MotorCategory(BaseModel):
    """
    Motor vehicle categories for insurance products
    """
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    icon = models.CharField(max_length=10, null=True, blank=True)  # Emoji icon
    pricing_type = models.CharField(max_length=50, default='dynamic')  # Pricing calculation type
    sort_order = models.IntegerField(default=0)
    
    # Business rules and field requirements
    requires_tonnage = models.BooleanField(default=False)
    requires_engine_capacity = models.BooleanField(default=False)
    requires_passenger_count = models.BooleanField(default=False)
    requires_passenger_type = models.BooleanField(default=False)  # adults/students
    requires_carrying_capacity = models.BooleanField(default=False)
    supports_time_period_variants = models.BooleanField(default=False)  # 1 week, 2 weeks, 1 month, 6 months
    
    # Validation rules
    min_vehicle_age = models.IntegerField(default=0)
    max_vehicle_age = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name = 'Motor Category'
        verbose_name_plural = 'Motor Categories'
        
    def __str__(self):
        return f"{self.name} ({self.code})"


"""
Legacy model MotorCoverType has been removed in favor of MotorSubcategory as the sole source of truth.
The database table will be dropped via migration; keep historical migrations intact.
"""


class MotorPolicy(BaseModel):
    """
    Motor 2 Policy model for storing complete motor insurance policies
    """
    # Policy identification
    policy_number = models.CharField(max_length=50, unique=True, db_index=True)
    quote_id = models.CharField(max_length=100, null=True, blank=True)
    
    # User relationship
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='motor_policies', null=True, blank=True)
    
    # Client Details (stored as JSON for flexibility)
    client_details = models.JSONField(help_text="Client information including name, email, phone, ID, KRA PIN, etc.")
    
    # Vehicle Details
    vehicle_details = models.JSONField(help_text="Vehicle information including registration, make, model, year, value, etc.")
    
    # Product Details
    product_details = models.JSONField(help_text="Insurance product details including category, subcategory, coverage type")
    
    # Underwriter Details
    underwriter_details = models.JSONField(null=True, blank=True, help_text="Selected underwriter information")
    
    # Premium Breakdown
    premium_breakdown = models.JSONField(help_text="Complete premium calculation with base premium, levies, and total")
    
    # Payment Details
    payment_details = models.JSONField(help_text="Payment method, amount, reference, status")
    
    # Add-ons
    addons = models.JSONField(default=list, blank=True, help_text="Selected additional coverage options")
    
    # Documents
    documents = models.JSONField(default=list, blank=True, help_text="Uploaded document references")
    
    # Policy Status
    POLICY_STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING_PAYMENT', 'Pending Payment'),
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
        ('SUSPENDED', 'Suspended'),
    ]
    status = models.CharField(max_length=20, choices=POLICY_STATUS_CHOICES, default='PENDING_PAYMENT', db_index=True)
    
    # Policy Dates
    cover_start_date = models.DateField(null=True, blank=True)
    cover_end_date = models.DateField(null=True, blank=True)
    
    # Document URLs (for generated PDFs)
    policy_document_url = models.CharField(max_length=500, null=True, blank=True)
    receipt_url = models.CharField(max_length=500, null=True, blank=True)
    certificate_url = models.CharField(max_length=500, null=True, blank=True)
    
    # Metadata
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_policies')
    
    # Renewal tracking fields
    original_policy = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='renewals')
    renewal_count = models.IntegerField(default=0)
    is_renewal = models.BooleanField(default=False)
    renewed_at = models.DateTimeField(null=True, blank=True)
    
    # Extension tracking fields
    extension_count = models.IntegerField(default=0)
    last_extension_date = models.DateTimeField(null=True, blank=True)
    total_extensions_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Additional metadata
    notes = models.TextField(blank=True)
    agent_code = models.CharField(max_length=50, null=True, blank=True, help_text="Sales agent code")
    
    # DMVIC Certificate Fields
    dmvic_certificate_number = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        db_index=True,
        help_text="DMVIC Certificate Number (e.g., A1020701)"
    )
    dmvic_transaction_no = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="DMVIC Transaction Number"
    )
    dmvic_api_request_number = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="DMVIC API Request Number"
    )
    dmvic_ref_no = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="DMVIC Reference Number"
    )
    dmvic_issuance_request_id = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="DMVIC Issuance Request ID (e.g., AF-AA0012)"
    )
    dmvic_certificate_type = models.CharField(
        max_length=1, 
        choices=[
            ('A', 'Type A - PSV'), 
            ('B', 'Type B - Comprehensive'), 
            ('C', 'Type C - Third Party'), 
            ('D', 'Type D - Special')
        ],
        blank=True, 
        null=True,
        help_text="DMVIC Certificate Type"
    )
    dmvic_certificate_pdf_url = models.URLField(
        max_length=500, 
        blank=True, 
        null=True,
        help_text="URL to DMVIC Certificate PDF"
    )
    dmvic_issued_at = models.DateTimeField(
        blank=True, 
        null=True,
        help_text="Timestamp when DMVIC certificate was issued"
    )
    dmvic_confirmed_at = models.DateTimeField(
        blank=True, 
        null=True,
        help_text="Timestamp when DMVIC issuance was confirmed (post-logbook verification)"
    )
    
    class Meta:
        ordering = ['-submitted_at']
        verbose_name = 'Motor Policy'
        verbose_name_plural = 'Motor Policies'
        indexes = [
            models.Index(fields=['policy_number']),
            models.Index(fields=['status', '-submitted_at']),
            models.Index(fields=['user', '-submitted_at']),
        ]
    
    def __str__(self):
        return f"{self.policy_number} - {self.status}"
    
    def generate_policy_number(self):
        """Generate unique policy number in format POL-YYYY-NNNNNN"""
        import random
        year = timezone.now().year
        while True:
            number = f"POL-{year}-{random.randint(100000, 999999)}"
            if not MotorPolicy.objects.filter(policy_number=number).exists():
                return number
    
    def save(self, *args, **kwargs):
        """
        Override save to enforce business rule: ACTIVE status requires payment confirmation
        """
        if self.status == 'ACTIVE':
            # Validate payment confirmation exists
            if not self.payment_details or not self.payment_details.get('transaction_id'):
                from django.core.exceptions import ValidationError
                raise ValidationError(
                    "Cannot set policy to ACTIVE without payment confirmation (transaction_id required)"
                )
            
            # Validate cover dates are set
            if not self.cover_start_date or not self.cover_end_date:
                from django.core.exceptions import ValidationError
                raise ValidationError(
                    "Cannot set policy to ACTIVE without cover dates (cover_start_date and cover_end_date required)"
                )
        
        super().save(*args, **kwargs)
    
    def activate_policy(self, transaction_id, payment_date=None, payment_method='MPESA'):
        """
        Activate policy after successful payment confirmation.
        
        This method should be called by payment webhook handlers after verifying payment.
        
        Args:
            transaction_id (str): Confirmed payment transaction ID from M-PESA/DPO
            payment_date (datetime, optional): Payment confirmation timestamp. Defaults to now.
            payment_method (str, optional): Payment method used. Defaults to 'MPESA'.
        
        Raises:
            ValueError: If policy cannot be activated (wrong status, already active, etc.)
        
        Returns:
            dict: Activation result with status and details
        """
        from datetime import timedelta
        import logging
        logger = logging.getLogger(__name__)
        
        # Validation: Check current status
        if self.status not in ['PENDING_PAYMENT', 'DRAFT']:
            raise ValueError(
                f"Cannot activate policy in {self.status} status. "
                f"Only PENDING_PAYMENT or DRAFT policies can be activated."
            )
        
        # Validation: Check transaction ID
        if not transaction_id:
            raise ValueError("Transaction ID is required to activate policy")
        
        logger.info(f"Activating policy {self.policy_number} with transaction {transaction_id}")
        
        # Update status
        old_status = self.status
        self.status = 'ACTIVE'
        
        # Set cover dates if not already set
        if not self.cover_start_date:
            self.cover_start_date = timezone.now().date()
            logger.info(f"Set cover_start_date to {self.cover_start_date}")
        
        if not self.cover_end_date:
            # Default to 1 year coverage (365 days)
            # TODO: Make this configurable per product type
            self.cover_end_date = self.cover_start_date + timedelta(days=365)
            logger.info(f"Set cover_end_date to {self.cover_end_date}")
        
        # Update payment details
        if not self.payment_details:
            self.payment_details = {}
        
        self.payment_details['transaction_id'] = transaction_id
        self.payment_details['payment_date'] = (payment_date or timezone.now()).isoformat()
        self.payment_details['payment_confirmed_at'] = timezone.now().isoformat()
        self.payment_details['status'] = 'CONFIRMED'
        self.payment_details['method'] = payment_method
        
        # Set approval timestamp
        self.approved_at = timezone.now()
        
        # Save the policy (will trigger validation in save() method)
        self.save()
        
        logger.info(f"Policy {self.policy_number} status changed from {old_status} to ACTIVE")
        
        # Post-activation tasks (run asynchronously in production)
        try:
            self._generate_policy_document()
        except Exception as e:
            logger.error(f"Failed to generate policy document for {self.policy_number}: {e}")
        
        try:
            self._send_confirmation_notifications()
        except Exception as e:
            logger.error(f"Failed to send notifications for {self.policy_number}: {e}")
        
        try:
            self._create_commission_record()
        except Exception as e:
            logger.error(f"Failed to create commission for {self.policy_number}: {e}")
        
        return {
            'success': True,
            'policy_number': self.policy_number,
            'status': self.status,
            'cover_start_date': self.cover_start_date.isoformat() if self.cover_start_date else None,
            'cover_end_date': self.cover_end_date.isoformat() if self.cover_end_date else None,
            'transaction_id': transaction_id
        }
    
    def _generate_policy_document(self):
        """Generate PDF certificate and policy schedule"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Import PDF generator service
            from .services.pdf_generator import generate_motor_policy_pdf
            
            # Generate PDF and get S3 URL
            pdf_url = generate_motor_policy_pdf(self)
            
            if pdf_url:
                self.policy_document_url = pdf_url
                self.save(update_fields=['policy_document_url'])
                logger.info(f"Generated policy document for {self.policy_number}: {pdf_url}")
            else:
                logger.warning(f"PDF generation returned None for {self.policy_number}")
        
        except ImportError:
            logger.warning(f"PDF generator service not available - skipping document generation")
        except Exception as e:
            logger.error(f"Error generating policy document: {e}")
            # Don't raise - document generation failure shouldn't block activation
    
    def _send_confirmation_notifications(self):
        """Send SMS and email confirmation to client"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Import notification service
            from .services.notifications import send_policy_sms, send_policy_email
            
            client_phone = self.client_details.get('phone') or self.client_details.get('phoneNumber')
            client_email = self.client_details.get('email')
            
            # Send SMS notification
            if client_phone:
                try:
                    send_policy_sms(client_phone, self.policy_number, self.cover_start_date)
                    logger.info(f"Sent SMS confirmation to {client_phone} for {self.policy_number}")
                except Exception as e:
                    logger.error(f"Failed to send SMS: {e}")
            
            # Send email notification
            if client_email:
                try:
                    send_policy_email(client_email, self)
                    logger.info(f"Sent email confirmation to {client_email} for {self.policy_number}")
                except Exception as e:
                    logger.error(f"Failed to send email: {e}")
        
        except ImportError:
            logger.warning(f"Notification service not available - skipping notifications")
        except Exception as e:
            logger.error(f"Error sending notifications: {e}")
            # Don't raise - notification failure shouldn't block activation
    
    def _create_commission_record(self):
        """Create commission record for agent"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Import commissioning service
            from .services.commissioning import create_commission_for_policy
            
            commission = create_commission_for_policy(self)
            
            if commission:
                logger.info(f"Created commission record for {self.policy_number}: KSh {commission.commission_amount}")
            else:
                logger.warning(f"Commission creation returned None for {self.policy_number}")
        
        except ImportError:
            logger.warning(f"Commissioning service not available - skipping commission creation")
        except Exception as e:
            logger.error(f"Error creating commission: {e}")
            # Don't raise - commission failure shouldn't block activation
    
    def retry_payment(self):
        """
        Generate a new payment request for a PENDING_PAYMENT policy.
        
        This method allows agents to retry payment for policies that failed
        payment processing or were created without immediate payment.
        
        Returns:
            dict: Payment initiation details with transaction reference
        
        Raises:
            ValueError: If policy is not in PENDING_PAYMENT status
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Validation: Only PENDING_PAYMENT policies can retry
        if self.status != 'PENDING_PAYMENT':
            raise ValueError(
                f"Cannot retry payment for policy in {self.status} status. "
                f"Only PENDING_PAYMENT policies can retry payment."
            )
        
        # Get payment amount from premium breakdown
        total_amount = (
            self.premium_breakdown.get('totalAmount') or
            self.premium_breakdown.get('total_amount') or
            0
        )
        
        if total_amount <= 0:
            raise ValueError("Invalid premium amount - cannot initiate payment")
        
        # Get client phone for payment
        client = self.client_details or {}
        client_phone = client.get('phone') or client.get('phoneNumber')
        
        if not client_phone:
            raise ValueError("Client phone number is required for payment retry")
        
        logger.info(f"Retrying payment for policy {self.policy_number}: KSh {total_amount}")
        
        # Update payment details with new attempt
        if not self.payment_details:
            self.payment_details = {}
        
        # Track retry attempts
        retry_count = self.payment_details.get('retry_count', 0) + 1
        self.payment_details['retry_count'] = retry_count
        self.payment_details['last_retry_at'] = timezone.now().isoformat()
        self.payment_details['status'] = 'RETRY_PENDING'
        
        self.save(update_fields=['payment_details'])
        
        logger.info(f"Payment retry #{retry_count} initiated for {self.policy_number}")
        
        return {
            'success': True,
            'policy_number': self.policy_number,
            'policy_id': str(self.id),
            'amount': total_amount,
            'phone': client_phone,
            'retry_count': retry_count,
            'message': 'Payment retry initiated. Proceed with payment gateway.'
        }
    
    # =========================================================================
    # COMPUTED PROPERTIES - Policy Lifecycle Management
    # =========================================================================
    
    @property
    def renewal_due_date(self):
        """Calculate when renewal is due (30 days before expiry)"""
        if not self.cover_end_date:
            return None
        from datetime import timedelta
        return self.cover_end_date - timedelta(days=30)
    
    @property
    def is_renewable(self):
        """Check if active policy can be renewed (90 days before to 7 days after expiry)"""
        if self.status != 'ACTIVE' or not self.cover_end_date:
            return False
        today = timezone.now().date()
        days_until_expiry = (self.cover_end_date - today).days
        return -7 <= days_until_expiry <= 90  # 7 days past to 90 days before
    
    @property
    def is_extendable(self):
        """
        Check if expired policy can be extended.
        Extension eligibility is determined by extendible_config in product_details.
        """
        if self.status != 'EXPIRED' or not self.cover_end_date:
            return False
        
        # Check if policy has extendible configuration
        extendible_config = self.product_details.get('extendible_config')
        if not extendible_config:
            return False  # No extension config = not extendible
        
        # Check if within grace period
        today = timezone.now().date()
        days_since_expiry = (today - self.cover_end_date).days
        extension_deadline_days = extendible_config.get('extension_deadline_days', 90)
        
        return 0 <= days_since_expiry <= extension_deadline_days
    
    @property
    def extension_grace_end(self):
        """
        Calculate when extension grace period ends.
        Uses extendible_config.extension_deadline_days from product_details.
        """
        if not self.cover_end_date:
            return None
        
        # Get extendible_config from product_details
        extendible_config = self.product_details.get('extendible_config')
        
        if not extendible_config:
            return self.cover_end_date  # No grace period if not extendible
        
        # Use configured grace period
        from datetime import timedelta
        extension_deadline_days = extendible_config.get('extension_deadline_days', 90)
        return self.cover_end_date + timedelta(days=extension_deadline_days)
    
    @property
    def days_until_expiry(self):
        """Calculate days remaining (negative if expired)"""
        if not self.cover_end_date:
            return None
        today = timezone.now().date()
        return (self.cover_end_date - today).days
    
    @property
    def renewal_urgency(self):
        """Categorize renewal urgency"""
        days = self.days_until_expiry
        if days is None:
            return None
        
        if days < 0:
            return 'OVERDUE'
        elif days <= 7:
            return 'URGENT'
        elif days <= 30:
            return 'STANDARD'
        else:
            return 'EARLY_BIRD'


class CommissionSettings(models.Model):
    default_commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('15.00'),
        help_text='Percentage value, e.g. 15.00 for 15%'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Commission Settings'
        verbose_name_plural = 'Commission Settings'

    def __str__(self):
        return f"Commission Settings (Default {self.default_commission_rate}%)"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class AgentCommission(BaseModel):
    """Track commissions earned by agents on paid policies only."""
    
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commissions')
    
    # Link to the paid policy (only paid policies are eligible)
    policy = models.ForeignKey(
        'MotorPolicy', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='commissions',
        help_text="Motor policy associated with this commission"
    )
    # For future non-motor policies
    # manual_policy = models.ForeignKey('ManualPolicy', null=True, blank=True, on_delete=models.SET_NULL)
    
    # Commission details
    premium_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        help_text="Total premium from the paid policy"
    )
    commission_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        help_text="Commission percentage (e.g., 15.00 for 15%)"
    )
    commission_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        help_text="Calculated commission amount"
    )
    
    # Payment tracking
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
        ('DISPUTED', 'Disputed'),
    ]
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='PENDING',
        db_index=True
    )
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-date_created']
        verbose_name = 'Agent Commission'
        verbose_name_plural = 'Agent Commissions'
        indexes = [
            models.Index(fields=['agent', 'date_created']),
            models.Index(fields=['payment_status', 'date_created']),
        ]
    
    def __str__(self):
        policy_num = self.policy.policy_number if self.policy else '-'
        agent_email = self.agent.email or self.agent.phonenumber
        return f"{agent_email} - KSh {self.commission_amount} (Policy: {policy_num})"
    
    def recalculate_amount(self):
        try:
            if self.premium_amount is not None and self.commission_rate is not None:
                self.commission_amount = (
                    Decimal(self.premium_amount) * Decimal(self.commission_rate) / Decimal('100')
                ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        except Exception:
            pass

    def save(self, *args, **kwargs):
        # Auto-calculate commission amount
        self.recalculate_amount()
        super().save(*args, **kwargs)


class AgentPerformance(BaseModel):
    """Track agent performance metrics and targets (paid policies only)."""
    
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_records')
    
    # Period tracking
    period = models.CharField(
        max_length=20, 
        help_text="e.g., '2025-Q1', '2025-01', '2025'",
        db_index=True
    )
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Targets
    target_policies = models.IntegerField(
        default=0, 
        help_text="Target number of paid policies"
    )
    target_premium = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        help_text="Target total premium (paid policies)"
    )
    
    # Achievements (count only paid policies)
    achieved_policies = models.IntegerField(default=0)
    achieved_premium = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    
    # Calculated fields
    achievement_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    
    class Meta:
        ordering = ['-period_start']
        unique_together = ('agent', 'period')
        verbose_name = 'Agent Performance'
        verbose_name_plural = 'Agent Performance Records'
        indexes = [
            models.Index(fields=['agent', '-period_start']),
            models.Index(fields=['period']),
        ]
    
    def __str__(self):
        agent_email = self.agent.email or self.agent.phonenumber
        return f"{agent_email} - {self.period}"
    
    def save(self, *args, **kwargs):
        # Calculate achievement percentage based on paid policies only
        if self.target_premium and self.target_premium > 0:
            self.achievement_percentage = (self.achieved_premium / self.target_premium) * Decimal('100')
        else:
            self.achievement_percentage = Decimal('0.00')
        super().save(*args, **kwargs)
    
    def update_achievements(self):
        """Update achievements from actual paid policy data."""
        from django.db.models import Sum, Count, Q
        
        # Count only ACTIVE policies (paid) within the period
        policies = MotorPolicy.objects.filter(
            Q(user=self.agent) | Q(agent_code__isnull=False),
            status='ACTIVE',
            submitted_at__range=(self.period_start, self.period_end)
        )
        
        # Calculate achievements
        self.achieved_policies = policies.count()
        
        # Sum premium from paid policies
        total_premium = Decimal('0.00')
        for policy in policies:
            try:
                premium_breakdown = policy.premium_breakdown
                if isinstance(premium_breakdown, dict):
                    total_premium += Decimal(str(premium_breakdown.get('total_premium', 0)))
            except (TypeError, ValueError, KeyError):
                pass
        
        self.achieved_premium = total_premium
        self.save()


class MonthlyAgentBonus(BaseModel):
    """Track monthly bonuses for agents based on total sales (0.3% of monthly premium)."""
    
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='monthly_bonuses')
    
    # Period
    month = models.IntegerField(help_text="Month (1-12)")
    year = models.IntegerField(help_text="Year (e.g., 2025)")
    period = models.CharField(max_length=20, help_text="e.g., '2025-10'", db_index=True)
    
    # Sales Summary
    total_policies = models.IntegerField(default=0, help_text="Number of ACTIVE policies in this period")
    total_premium = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Total premium from all ACTIVE policies"
    )
    
    # Bonus Calculation
    bonus_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('0.30'),
        help_text="Bonus percentage (e.g., 0.30 for 0.3%)"
    )
    bonus_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=0,
        help_text="Calculated bonus amount"
    )
    
    # Payment Tracking
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
    ]
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='PENDING',
        db_index=True
    )
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-year', '-month']
        unique_together = ['agent', 'period']
        verbose_name = 'Monthly Agent Bonus'
        verbose_name_plural = 'Monthly Agent Bonuses'
        indexes = [
            models.Index(fields=['agent', '-year', '-month']),
            models.Index(fields=['payment_status', '-year', '-month']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-calculate bonus amount
        self.bonus_amount = (self.total_premium * self.bonus_rate) / Decimal('100')
        # Auto-set period
        self.period = f"{self.year}-{self.month:02d}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        if hasattr(self.agent, 'staff_user_profile') and self.agent.staff_user_profile:
            agent_name = f"{self.agent.staff_user_profile.full_names} ({self.agent.staff_user_profile.agent_code})"
        else:
            agent_name = self.agent.email or self.agent.phonenumber
        return f"{agent_name} - {self.period} - KSh {self.bonus_amount}"
    
    def update_from_sales(self):
        """Recalculate bonus from actual ACTIVE policy sales in the period."""
        import json
        from datetime import datetime
        
        # Calculate date range
        start_date = datetime(self.year, self.month, 1).date()
        if self.month == 12:
            end_date = datetime(self.year + 1, 1, 1).date()
        else:
            end_date = datetime(self.year, self.month + 1, 1).date()
        
        # Get all ACTIVE policies for this agent in this period
        policies = MotorPolicy.objects.filter(
            user=self.agent,
            status='ACTIVE',
            cover_start_date__gte=start_date,
            cover_start_date__lt=end_date
        )
        
        # Calculate total premium
        total_premium = Decimal('0.00')
        for policy in policies:
            if policy.premium_breakdown:
                try:
                    breakdown = json.loads(policy.premium_breakdown) if isinstance(policy.premium_breakdown, str) else policy.premium_breakdown
                    total_premium += Decimal(str(breakdown.get('total_payable', 0)))
                except (json.JSONDecodeError, ValueError, TypeError, KeyError):
                    continue
        
        # Update fields
        self.total_policies = policies.count()
        self.total_premium = total_premium
        self.save()  # Auto-calculates bonus_amount




class CommissionRule(BaseModel):
    """Flexible commission rules per motor subcategory, underwriter, or non-motor line.

    Priority: lower number wins when multiple rules apply. Effective dates are optional.
    """
    name = models.CharField(max_length=100, blank=True)
    rate = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage value, e.g. 12.50 for 12.5%")
    priority = models.IntegerField(default=100, help_text="Lower number has higher priority")
    is_active = models.BooleanField(default=True)

    # Targeting
    subcategory = models.ForeignKey('MotorSubcategory', on_delete=models.SET_NULL, null=True, blank=True)
    underwriter = models.ForeignKey('InsuranceProvider', on_delete=models.SET_NULL, null=True, blank=True)
    line_key = models.CharField(max_length=50, null=True, blank=True, help_text="For non-motor lines e.g., MEDICAL, TRAVEL")

    # Time-bounded campaigns
    effective_start = models.DateField(null=True, blank=True)
    effective_end = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['priority', '-date_created']
        indexes = [
            models.Index(fields=['priority']),
            models.Index(fields=['is_active']),
            models.Index(fields=['line_key']),
        ]
        verbose_name = 'Commission Rule'
        verbose_name_plural = 'Commission Rules'

    def __str__(self):
        parts = []
        if self.subcategory:
            parts.append(self.subcategory.subcategory_code)
        if self.underwriter:
            parts.append(self.underwriter.code or self.underwriter.name)
        if self.line_key:
            parts.append(self.line_key)
        label = ' · '.join(parts) or 'Global'
        return f"{label} → {self.rate}% (prio {self.priority})"

    def is_within_effective_dates(self, today=None):
        today = today or timezone.now().date()
        if self.effective_start and today < self.effective_start:
            return False
        if self.effective_end and today > self.effective_end:
            return False
        return True

    @classmethod
    def resolve_rate_for_policy(cls, policy: 'MotorPolicy', default_rate: 'Decimal'):
        """Pick the best rule for a MotorPolicy, falling back to default_rate.

        Matching criteria (all optional, higher specificity first by priority):
        - subcategory: matches policy.product_details.subcategory_code
        - underwriter: matches policy.underwriter_details.code (or name)
        - line_key: for future non-motor policies
        - active and within effective dates
        """
        try:
            product = policy.product_details or {}
            sub_code = (product.get('subcategory_code') or product.get('subcategory') or '').strip()
            uw = policy.underwriter_details or {}
            uw_code = (uw.get('code') or '').strip()
            uw_name = (uw.get('name') or '').strip()
        except Exception:
            sub_code = ''
            uw_code = ''
            uw_name = ''

        # Preload rules that are active and date-valid
        candidates = [r for r in cls.objects.filter(is_active=True).order_by('priority') if r.is_within_effective_dates()]

        def score(rule: 'CommissionRule'):
            s = 0
            if rule.subcategory and sub_code and rule.subcategory.subcategory_code == sub_code:
                s += 4
            if rule.underwriter and ((uw_code and rule.underwriter.code == uw_code) or (uw_name and rule.underwriter.name == uw_name)):
                s += 2
            if rule.line_key:
                # MotorPolicy has no line_key; keep for future manual policies
                s += 0
            return s

        best = None
        best_score = -1
        for r in candidates:
            sc = score(r)
            if sc > best_score:
                best = r
                best_score = sc

        return best.rate if best and best_score > 0 else default_rate


# ============================================================
# DMVIC Integration Models
# ============================================================


class DMVICCertificate(BaseModel):
    """
    DMVIC certificate issuance tracking.
    Links PataBima policy to DMVIC regulatory certificate.
    
    Purpose:
    - Track all DMVIC certificate issuances for motor policies
    - Maintain audit trail of API interactions
    - Enable retry logic for failed issuances
    - Support multiple certificates per policy (renewals, replacements)
    """
    
    # Link to PataBima policy
    motor_policy = models.ForeignKey(
        MotorPolicy, 
        on_delete=models.PROTECT, 
        related_name='dmvic_certificates',
        help_text="PataBima motor policy this certificate belongs to"
    )
    
    # DMVIC certificate details
    certificate_number = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True,
        db_index=True,
        help_text="DMVIC-assigned certificate number (e.g., CHB432123)"
    )
    
    CERTIFICATE_TYPES = [
        ('A', 'Type A - Third-Party'),
        ('B', 'Type B - Comprehensive'),
        ('C', 'Type C - Third-Party + PLL'),
        ('D', 'Type D - Comprehensive + PLL')
    ]
    certificate_type = models.CharField(
        max_length=1, 
        choices=CERTIFICATE_TYPES,
        help_text="Certificate type determined by product coverage"
    )
    
    # Issuance status tracking
    ISSUANCE_STATUS = [
        ('PENDING', 'Pending Issuance'),
        ('ISSUED', 'Successfully Issued'),
        ('FAILED', 'Issuance Failed'),
        ('CANCELLED', 'Certificate Cancelled'),
    ]
    status = models.CharField(
        max_length=20, 
        choices=ISSUANCE_STATUS, 
        default='PENDING',
        db_index=True,
        help_text="Current status of certificate issuance"
    )
    
    # DMVIC API interaction tracking
    request_payload = models.JSONField(
        help_text="Exact payload sent to DMVIC API (for debugging)"
    )
    response_data = models.JSONField(
        null=True, 
        blank=True,
        help_text="DMVIC API response (success or error details)"
    )
    
    # Certificate URLs
    dmvic_pdf_url = models.CharField(
        max_length=500, 
        null=True, 
        blank=True,
        help_text="URL to DMVIC-generated certificate PDF"
    )
    qr_code_url = models.CharField(
        max_length=500, 
        null=True, 
        blank=True,
        help_text="DMVIC QR code for certificate verification"
    )
    
    # Timestamps
    issued_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When DMVIC successfully issued the certificate"
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    # Retry tracking for failed issuances
    retry_count = models.IntegerField(
        default=0,
        help_text="Number of retry attempts (max 3)"
    )
    last_retry_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Timestamp of last retry attempt"
    )
    error_message = models.TextField(
        blank=True,
        help_text="Error details from DMVIC API (for debugging)"
    )
    
    class Meta:
        ordering = ['-date_created']
        verbose_name = 'DMVIC Certificate'
        verbose_name_plural = 'DMVIC Certificates'
        indexes = [
            models.Index(fields=['certificate_number']),
            models.Index(fields=['status', '-date_created']),
            models.Index(fields=['motor_policy', '-date_created']),
        ]
    
    def __str__(self):
        cert_num = self.certificate_number or 'PENDING'
        return f"{cert_num} - {self.motor_policy.policy_number}"


class DMVICVehicleSearch(BaseModel):
    """
    Caches DMVIC search results for a given registration number.
    """
    registration_number = models.CharField(max_length=20, unique=True, db_index=True)
    search_data = models.JSONField(help_text="Raw JSON response from DMVIC search-vehicle API")
    has_existing_cover = models.BooleanField(default=False)
    existing_cover_expiry = models.DateField(null=True, blank=True)
    cached_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "DMVIC Vehicle Search Cache"
        verbose_name_plural = "DMVIC Vehicle Search Caches"

    def __str__(self):
        return f"{self.registration_number} - Cached at {self.cached_at.strftime('%Y-%m-%d %H:%M')}"




