# Motor 2 Source of Truth Analysis - Extension Eligibility

## Executive Summary

**FINDING**: The source of truth for Motor 2 policies is **MotorSubcategory.product_type**, NOT "cover_type". The system already has a robust extension framework with `ExtendiblePricing` model and admin configuration.

## Database Schema Analysis

### 1. MotorSubcategory Model (SOURCE OF TRUTH)

**File**: `insurance-app/app/models.py` (lines 433-460)

```python
class MotorSubcategory(BaseModel):
    category = models.ForeignKey('MotorCategory', on_delete=models.CASCADE)
    subcategory_code = models.CharField(max_length=50, unique=True)
    subcategory_name = models.CharField(max_length=100)
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPES)  # ← SOURCE OF TRUTH
    pricing_model = models.CharField(max_length=20, choices=PRICING_MODELS)
    is_complex = models.BooleanField(default=False)
    additional_fields = models.JSONField(default=list)
    pricing_requirements = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
```

**PRODUCT_TYPES** (lines 288-296):
```python
PRODUCT_TYPES = [
    ('TOR', 'Time on Risk'),
    ('THIRD_PARTY', 'Third Party'),
    ('THIRD_PARTY_EXT', 'Third Party with Extensions'),  # ← EXTENDIBLE TYPE
    ('COMPREHENSIVE', 'Comprehensive'),
]
```

### 2. ExtendiblePricing Model (ADMIN-CONFIGURED EXTENSIONS)

**File**: `insurance-app/app/models.py` (lines 687-708)

```python
class ExtendiblePricing(BaseModel):
    subcategory = models.ForeignKey(MotorSubcategory, on_delete=models.CASCADE)
    underwriter = models.ForeignKey(InsuranceProvider, on_delete=models.CASCADE)

    # Extension configuration (ADMIN-SET VALUES)
    initial_period_days = models.PositiveIntegerField(default=30)
    initial_amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_annual_premium = models.DecimalField(max_digits=10, decimal_places=2)
    extension_deadline_days = models.PositiveIntegerField(default=30)  # ← GRACE PERIOD
    grace_period_days = models.PositiveIntegerField(default=7)
    
    # Late fees (ADMIN-SET)
    penalty_for_late_extension = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    allow_partial_extension = models.BooleanField(default=False)
    
    # Document templates
    cover_note_template = models.TextField(blank=True)
    full_certificate_template = models.TextField(blank=True)
    extension_reminder_template = models.TextField(blank=True)
    auto_reminder_schedule = models.JSONField(default=list)

    class Meta:
        unique_together = ('subcategory', 'underwriter')
```

**KEY INSIGHT**: Extensions are configured per subcategory + underwriter by admin, NOT hardcoded by product_type.

### 3. PolicyExtension Model (EXTENSION TRACKING)

**File**: `insurance-app/app/models.py` (lines 713-763)

```python
class PolicyExtension(BaseModel):
    policy_number = models.CharField(max_length=50, unique=True)
    underwriter = models.ForeignKey(InsuranceProvider, on_delete=models.CASCADE)
    
    # Initial policy details
    initial_premium_paid = models.DecimalField(max_digits=10, decimal_places=2)
    initial_start_date = models.DateField()
    initial_expiry_date = models.DateField()
    balance_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Extension status tracking
    extension_status = models.CharField(max_length=20, choices=EXTENSION_STATUS_CHOICES, default='pending')
    reminder_count = models.PositiveIntegerField(default=0)
    last_reminder_sent = models.DateTimeField(null=True, blank=True)
    
    # Extension completion
    extension_payment_date = models.DateTimeField(null=True, blank=True)
    extension_amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    full_certificate_issued = models.BooleanField(default=False)
    final_expiry_date = models.DateField(null=True, blank=True)
```

## Current Implementation Issues

### Issue 1: Hardcoded is_extendible Flag
**File**: `insurance-app/app/views/policy_management.py` (line 485)

```python
is_extendible = product_details.get('is_extendible', False)  # ← WRONG: Comes from frontend
```

**PROBLEM**: Frontend passes `is_extendible` flag, but this should be determined by:
1. Does ExtendiblePricing exist for this subcategory + underwriter?
2. Is policy expired within grace period?

### Issue 2: No Validation Against ExtendiblePricing
Current extension logic doesn't check:
- Does admin have ExtendiblePricing configured for this subcategory?
- What is the configured grace period for this subcategory + underwriter?
- What penalty/late fee applies?

## Correct Implementation Approach

### Step 1: Determine Extension Eligibility

```python
def is_policy_extendible(policy):
    """
    Check if policy is eligible for extension based on:
    1. Subcategory has ExtendiblePricing configured
    2. Policy is expired within grace period
    """
    # Extract subcategory from product_details
    subcategory_code = policy.product_details.get('subcategory_code') or \
                      policy.product_details.get('subcategory', {}).get('code')
    
    if not subcategory_code:
        return False, None
    
    # Get subcategory
    from app.models import MotorSubcategory, ExtendiblePricing
    try:
        subcategory = MotorSubcategory.objects.get(subcategory_code=subcategory_code)
    except MotorSubcategory.DoesNotExist:
        return False, None
    
    # Check if ExtendiblePricing exists for this subcategory + underwriter
    underwriter_id = policy.underwriter_details.get('id') if policy.underwriter_details else None
    
    try:
        extendible_pricing = ExtendiblePricing.objects.get(
            subcategory=subcategory,
            underwriter_id=underwriter_id
        )
    except ExtendiblePricing.DoesNotExist:
        return False, None
    
    # Check if within grace period
    if not policy.cover_end_date:
        return False, None
    
    from django.utils import timezone
    today = timezone.now().date()
    days_since_expiry = (today - policy.cover_end_date).days
    
    # Grace period = extension_deadline_days
    if days_since_expiry < 0:
        # Not expired yet - should renew instead
        return False, None
    
    if days_since_expiry > extendible_pricing.extension_deadline_days:
        # Grace period expired
        return False, None
    
    return True, extendible_pricing
```

### Step 2: Calculate Extension Pricing

```python
def calculate_extension_amount(policy, extendible_pricing, months_to_extend):
    """
    Calculate extension premium based on admin-configured pricing.
    """
    from django.utils import timezone
    
    # Base calculation: balance_amount / remaining_months
    days_since_expiry = (timezone.now().date() - policy.cover_end_date).days
    
    # Calculate prorated amount
    if extendible_pricing.allow_partial_extension:
        # Prorated based on days
        days_to_extend = months_to_extend * 30
        prorated_amount = (extendible_pricing.balance_amount / 365) * days_to_extend
    else:
        # Fixed balance amount
        prorated_amount = extendible_pricing.balance_amount
    
    # Apply late fee penalty
    late_fee_percentage = extendible_pricing.penalty_for_late_extension
    late_fee = prorated_amount * (late_fee_percentage / 100)
    
    # Add mandatory levies (ITL 0.25%, PCF 0.25%, Stamp Duty KSh 40)
    base_with_late_fee = prorated_amount + late_fee
    itl = base_with_late_fee * 0.0025
    pcf = base_with_late_fee * 0.0025
    stamp_duty = 40.00
    
    total_amount = base_with_late_fee + itl + pcf + stamp_duty
    
    return {
        'prorated_amount': prorated_amount,
        'late_fee': late_fee,
        'late_fee_percentage': late_fee_percentage,
        'itl': itl,
        'pcf': pcf,
        'stamp_duty': stamp_duty,
        'total_amount': total_amount,
        'days_since_expiry': days_since_expiry,
        'grace_period_remaining': extendible_pricing.extension_deadline_days - days_since_expiry
    }
```

## Renewals vs Extensions - Business Logic

### Renewals (ALL Product Types)
- **When**: Policy is active and approaching expiry (90 days before to 7 days after)
- **Who**: ALL policies (TOR, THIRD_PARTY, THIRD_PARTY_EXT, COMPREHENSIVE)
- **Process**: Create NEW policy with NEW policy number, reprice at current rates
- **Admin Config**: Not required (automatic for all policies)

### Extensions (Admin-Configured Only)
- **When**: Policy is expired but within grace period
- **Who**: Only subcategories with ExtendiblePricing configured
- **Process**: Extend existing policy, use configured balance_amount + late fees
- **Admin Config**: REQUIRED via ExtendiblePricing model

**KEY INSIGHT**: Not all Third-Party policies are extendible - only those with ExtendiblePricing configured!

## Admin's Role in Extension Eligibility

### Admin Must Configure Per Product:
1. **Which subcategories** are extendible (via ExtendiblePricing existence)
2. **Which underwriters** support extensions for each subcategory
3. **Grace period** (extension_deadline_days, typically 30-90 days)
4. **Pricing structure** (initial_amount, balance_amount)
5. **Late fees** (penalty_for_late_extension percentage)
6. **Partial extensions** (allow_partial_extension boolean)
7. **Reminder schedules** (auto_reminder_schedule JSON)

### Admin Configuration Example:
```python
# Admin creates ExtendiblePricing for "Private Third Party" + CIC
ExtendiblePricing.objects.create(
    subcategory=MotorSubcategory.objects.get(subcategory_code='PRIVATE_THIRD_PARTY'),
    underwriter=InsuranceProvider.objects.get(company_code='CIC'),
    initial_period_days=30,
    initial_amount=5000.00,  # 30-day cover note
    balance_amount=15000.00,  # Remaining 11 months
    total_annual_premium=20000.00,
    extension_deadline_days=90,  # 90-day grace period
    grace_period_days=7,
    penalty_for_late_extension=5.00,  # 5% late fee
    allow_partial_extension=True
)
```

**Without this configuration, the subcategory is NOT extendible, even if product_type is THIRD_PARTY!**

## Recommended Implementation Changes

### Backend Changes Required:

1. **Update get_upcoming_extensions()** (policy_management.py line 460)
   - Query ExtendiblePricing to find extendible subcategories
   - Check grace period dynamically from ExtendiblePricing.extension_deadline_days
   - Remove hardcoded is_extendible flag check

2. **Update extend_policy()** (policy_management.py line 617)
   - Validate against ExtendiblePricing configuration
   - Use ExtendiblePricing.balance_amount for pricing
   - Apply ExtendiblePricing.penalty_for_late_extension
   - Respect allow_partial_extension setting

3. **Add computed properties to MotorPolicy**
   ```python
   @property
   def extendible_pricing_config(self):
       """Get ExtendiblePricing config if available"""
       # Implementation as shown above
   
   @property
   def is_extendible(self):
       """Check if policy can be extended"""
       is_extendible, _ = is_policy_extendible(self)
       return is_extendible
   
   @property
   def extension_grace_remaining_days(self):
       """Days remaining in extension grace period"""
       # Implementation based on ExtendiblePricing.extension_deadline_days
   ```

### Frontend Changes Required:

1. **Remove hardcoded is_extendible logic**
   - Don't send `is_extendible: true` from frontend
   - Let backend determine eligibility based on ExtendiblePricing

2. **Query extension eligibility from backend**
   ```javascript
   // GET /api/motor2/policies/{id}/extension-eligibility/
   {
     "is_extendible": true,
     "grace_period_days": 90,
     "days_since_expiry": 15,
     "days_remaining": 75,
     "balance_amount": 15000.00,
     "late_fee_percentage": 5.00,
     "allow_partial_extension": true
   }
   ```

3. **UpcomingScreen - Extensions Tab**
   - Fetch only policies with `is_extendible: true` from backend
   - Display admin-configured grace period
   - Show calculated late fees based on days since expiry

## Migration Path

### Phase 1: Data Audit (1 day)
- Query all existing Motor2 policies
- Identify which subcategories are currently in use
- Check which have ExtendiblePricing configured
- Create missing ExtendiblePricing records for intended extendible products

### Phase 2: Backend Refactoring (2-3 days)
- Implement `is_policy_extendible()` helper
- Update `get_upcoming_extensions()` to use ExtendiblePricing
- Update `extend_policy()` to use ExtendiblePricing pricing
- Add computed properties to MotorPolicy

### Phase 3: API Changes (1 day)
- Create `GET /api/motor2/policies/{id}/extension-eligibility/` endpoint
- Update extension response to include ExtendiblePricing details

### Phase 4: Frontend Updates (2 days)
- Remove hardcoded is_extendible flags
- Update UpcomingScreen to query extension eligibility
- Show admin-configured grace periods and late fees

### Phase 5: Testing (2 days)
- Test with admin-configured extendible subcategories
- Test with non-extendible subcategories (should not show in extensions)
- Test grace period expiry
- Test late fee calculations

## Summary

### Key Findings:
1. **Source of Truth**: `MotorSubcategory.product_type` (not cover_type)
2. **Extension Eligibility**: Determined by `ExtendiblePricing` existence (admin-configured)
3. **Not All Third-Party Extendible**: Only those with ExtendiblePricing configured
4. **Admin Controls**: Grace period, late fees, balance amounts via ExtendiblePricing
5. **Current Issue**: System uses hardcoded is_extendible flag instead of checking ExtendiblePricing

### Recommended Approach:
- Use ExtendiblePricing as authoritative source for extension eligibility
- Remove hardcoded product_type checks
- Let admin configure which subcategories + underwriters support extensions
- Calculate grace periods, late fees, and pricing from ExtendiblePricing model

This approach is more flexible, follows insurance industry practices, and gives admins full control over extension policies per product and underwriter.
