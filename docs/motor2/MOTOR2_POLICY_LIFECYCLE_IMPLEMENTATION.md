# Motor 2 Policy Lifecycle - Complete Implementation Guide

## Executive Summary

This document provides a comprehensive implementation plan for Motor 2 policy lifecycle management in PataBima, following Kenyan insurance industry best practices for renewals and extensions.

**Date**: October 17, 2025  
**Status**: Implementation Ready  
**Scope**: Backend + Frontend integration for Motor 2 renewals and extensions

---

## Current State Analysis

### Backend (Django)

**MotorPolicy Model** (`insurance-app/app/models.py` lines 974-1080):
- ✅ Has `status` field with ACTIVE, EXPIRED, DRAFT, PENDING_PAYMENT, CANCELLED, SUSPENDED
- ✅ Has `cover_start_date` and `cover_end_date` fields
- ✅ Has renewal tracking: `original_policy`, `renewal_count`, `is_renewal`, `renewed_at`
- ✅ Has extension tracking: `extension_count`, `last_extension_date`, `total_extensions_amount`
- ❌ Missing: `renewal_due_date` computed property
- ❌ Missing: `is_renewable` and `is_extendable` computed properties (based on ExtendiblePricing)
- ❌ Missing: `extension_grace_end` computed property

**ExtendiblePricing Model** (lines 687-708):
- ✅ ADMIN-CONFIGURED extension eligibility per subcategory + underwriter
- ✅ Has `extension_deadline_days` (grace period configured by admin)
- ✅ Has `penalty_for_late_extension` (late fee percentage)
- ✅ Has `balance_amount`, `initial_amount`, `total_annual_premium`
- ✅ Has `allow_partial_extension` flag
- ✅ Unique constraint: (subcategory, underwriter)
- ⚠️ **KEY INSIGHT**: Extension eligibility is ADMIN-CONFIGURED, not hardcoded by product_type

**PolicyExtension Model** (lines 713-763):
- ✅ Tracks extension status (pending, reminded, extended, expired, grace_period)
- ✅ Has balance amounts and extension periods
- ✅ Has reminder tracking (reminder_count, last_reminder_sent)
- ⚠️ Current implementation: treats extensions as balance-based (not expiry-based)
- ❌ Needs refactor: query ExtendiblePricing for grace period and late fees

**API Endpoints** (`insurance-app/app/views/policy_management.py`):
- ✅ `/api/motor2/upcoming-renewals/` - Returns active policies in renewal window (lines 404-456)
- ✅ `/api/motor2/upcoming-extensions/` - Returns extendible policies (lines 460-544)
- ⚠️ Renewal window: currently -7 to +30 days (should be 0 to +90 days)
- ⚠️ Extension logic: uses hardcoded `is_extendible` flag (should query ExtendiblePricing model)
- ❌ Missing: Query ExtendiblePricing to determine which subcategories are extendible
- ❌ Missing: Use ExtendiblePricing.extension_deadline_days for grace period (not hardcoded)
- ❌ Missing: `POST /api/motor2/policies/{id}/renew/` endpoint
- ❌ Missing: `POST /api/motor2/policies/{id}/extend/` endpoint with ExtendiblePricing-based pricing
- ❌ Missing: Eligibility check endpoints

### Frontend (React Native)

**UpcomingScreen.js** (`frontend/screens/main/UpcomingScreen.js`):
- ✅ Has tabs for Renewals, Extensions, Claims
- ✅ Shows overview counts
- ✅ Has search functionality
- ❌ Currently shows empty states (no API integration)
- ❌ Needs: API calls to `/api/motor2/upcoming-renewals/` and `/api/motor2/upcoming-extensions/`
- ❌ Needs: Renew/Extend action handlers

**QuotationsScreenNew.js**:
- ✅ Successfully displays Motor 2 policies with insurer-standard layout
- ⚠️ Shows policy_number but doesn't distinguish active vs expired
- ❌ Needs: Visual indicators for renewal eligibility (e.g., badge "Due in 15 days")

---

## ⚠️ CRITICAL: Admin-Configured Extension Model

### Extension Eligibility is NOT Hardcoded

**IMPORTANT**: Extension eligibility is determined by the `ExtendiblePricing` model, which is configured by admins per subcategory + underwriter combination. This means:

1. **Not all Third-Party policies are extendible** - only those with ExtendiblePricing configured
2. **Grace periods vary** - configured via `ExtendiblePricing.extension_deadline_days` (not hardcoded 90/60 days)
3. **Late fees vary** - configured via `ExtendiblePricing.penalty_for_late_extension` (not hardcoded percentages)
4. **Pricing is admin-set** - uses `ExtendiblePricing.balance_amount`, not calculated from premium

### How It Works

```python
# Admin creates ExtendiblePricing for "Private Third Party" + CIC
ExtendiblePricing.objects.create(
    subcategory=MotorSubcategory.objects.get(subcategory_code='PRIVATE_THIRD_PARTY'),
    underwriter=InsuranceProvider.objects.get(company_code='CIC'),
    initial_period_days=30,           # Initial cover note period
    initial_amount=5000.00,           # 30-day premium
    balance_amount=15000.00,          # Remaining 11 months
    total_annual_premium=20000.00,
    extension_deadline_days=90,       # ← GRACE PERIOD (admin-configured)
    penalty_for_late_extension=5.00,  # ← LATE FEE % (admin-configured)
    allow_partial_extension=True
)
```

**Without ExtendiblePricing record**: Policy is NOT extendible, even if product_type is THIRD_PARTY.

### Implementation Impact

1. **Backend**: Must query `ExtendiblePricing.objects.filter(subcategory=...)` to check eligibility
2. **Frontend**: Cannot hardcode "Third-Party = extendible", must ask backend
3. **Business Rules**: Admin controls which products/underwriters support extensions
4. **Grace Periods**: Use `ExtendiblePricing.extension_deadline_days`, not hardcoded values
5. **Late Fees**: Use `ExtendiblePricing.penalty_for_late_extension`, not hardcoded percentages

### Source of Truth

- **Product Classification**: `MotorSubcategory.product_type` (TOR, THIRD_PARTY, THIRD_PARTY_EXT, COMPREHENSIVE)
- **Extension Eligibility**: Existence of `ExtendiblePricing` record for subcategory + underwriter
- **Grace Period**: `ExtendiblePricing.extension_deadline_days` (NOT hardcoded)
- **Late Fees**: `ExtendiblePricing.penalty_for_late_extension` (NOT hardcoded)
- **Pricing**: `ExtendiblePricing.balance_amount` (admin-set, not calculated)

**See `MOTOR2_SOURCE_OF_TRUTH_ANALYSIS.md` for complete database schema analysis.**

---

## Policy Lifecycle State Machine

### State Definitions

```
DRAFT → PENDING_PAYMENT → ACTIVE → EXPIRED → (RENEWED or EXTENDED)
                                  ↓
                           RENEWAL_DUE (computed)
```

### State Transitions

| From State | To State | Trigger | Business Rule |
|------------|----------|---------|---------------|
| DRAFT | PENDING_PAYMENT | Form submission | Quote created, awaiting payment |
| PENDING_PAYMENT | ACTIVE | Payment confirmed | Policy activated, cover starts |
| ACTIVE | RENEWAL_DUE | System cron (90 days before expiry) | Computed state, policy remains ACTIVE |
| ACTIVE | EXPIRED | cover_end_date reached | Policy no longer provides coverage |
| ACTIVE | RENEWED | Agent initiates renewal + payment | New policy created, original stays ACTIVE until expiry |
| EXPIRED | EXTENDED | Agent initiates extension + payment | Only if cover_type in [TOR, Third-Party] and within grace |
| EXPIRED | (Dead) | Grace period ends | Cannot be renewed or extended |

### Computed Properties (Backend)

Add to `MotorPolicy` model:

```python
from django.utils import timezone
from datetime import timedelta

@property
def renewal_due_date(self):
    """30 days before cover_end_date"""
    if self.cover_end_date:
        return self.cover_end_date - timedelta(days=30)
    return None

@property
def is_renewable(self):
    """Check if policy can be renewed (within 90 days of expiry)"""
    if self.status != 'ACTIVE' or not self.cover_end_date:
        return False
    today = timezone.now().date()
    days_until_expiry = (self.cover_end_date - today).days
    return -7 <= days_until_expiry <= 90  # 7 days past to 90 days before

@property
def is_extendable(self):
    """
    Check if expired policy can be extended.
    Extension eligibility is determined by ExtendiblePricing configuration.
    """
    if self.status != 'EXPIRED' or not self.cover_end_date:
        return False
    
    # Get subcategory from product_details
    subcategory_code = self.product_details.get('subcategory_code') or \
                      self.product_details.get('subcategory', {}).get('code')
    
    if not subcategory_code:
        return False
    
    # Check if ExtendiblePricing exists for this subcategory + underwriter
    from app.models import MotorSubcategory, ExtendiblePricing
    
    try:
        subcategory = MotorSubcategory.objects.get(subcategory_code=subcategory_code)
    except MotorSubcategory.DoesNotExist:
        return False
    
    underwriter_id = self.underwriter_details.get('id') if self.underwriter_details else None
    
    try:
        extendible_pricing = ExtendiblePricing.objects.get(
            subcategory=subcategory,
            underwriter_id=underwriter_id
        )
    except ExtendiblePricing.DoesNotExist:
        return False  # No extension config = not extendible
    
    # Check if within grace period
    today = timezone.now().date()
    days_since_expiry = (today - self.cover_end_date).days
    
    return 0 <= days_since_expiry <= extendible_pricing.extension_deadline_days

@property
def extension_grace_end(self):
    """
    Calculate when extension grace period ends.
    Uses ExtendiblePricing.extension_deadline_days (admin-configured).
    """
    if not self.cover_end_date:
        return None
    
    # Get ExtendiblePricing config
    subcategory_code = self.product_details.get('subcategory_code') or \
                      self.product_details.get('subcategory', {}).get('code')
    
    if not subcategory_code:
        return self.cover_end_date
    
    from app.models import MotorSubcategory, ExtendiblePricing
    
    try:
        subcategory = MotorSubcategory.objects.get(subcategory_code=subcategory_code)
        underwriter_id = self.underwriter_details.get('id') if self.underwriter_details else None
        
        extendible_pricing = ExtendiblePricing.objects.get(
            subcategory=subcategory,
            underwriter_id=underwriter_id
        )
        
        # Use admin-configured grace period
        return self.cover_end_date + timedelta(days=extendible_pricing.extension_deadline_days)
        
    except (MotorSubcategory.DoesNotExist, ExtendiblePricing.DoesNotExist):
        return self.cover_end_date  # No grace period if not extendible

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
```

---

## Backend Implementation Tasks

### Task 1: Update MotorPolicy Model

**File**: `insurance-app/app/models.py`

Add computed properties above to the `MotorPolicy` class.

### Task 2: Refactor API Endpoints

**File**: `insurance-app/app/views/policy_management.py`

**Update `/api/motor2/upcoming-renewals/`** (line 404):
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_upcoming_renewals(request):
    """
    Get Motor 2 policies eligible for renewal (90 days before to 7 days after expiry)
    """
    from django.utils import timezone
    from datetime import timedelta
    
    today = timezone.now().date()
    renewal_window_start = today - timedelta(days=7)  # Allow 7 days overdue
    renewal_window_end = today + timedelta(days=90)   # 90 days early bird
    
    policies = MotorPolicy.objects.filter(
        user=request.user,
        status='ACTIVE',
        cover_end_date__range=[renewal_window_start, renewal_window_end]
    ).order_by('cover_end_date')
    
    renewals = []
    for policy in policies:
        if policy.cover_end_date:
            days_until_expiry = (policy.cover_end_date - today).days
            
            # Categorize urgency
            if days_until_expiry < 0:
                renewal_type = 'overdue'
                status = 'Overdue'
                badge_color = 'error'
            elif days_until_expiry <= 7:
                renewal_type = 'urgent'
                status = 'Due Soon'
                badge_color = 'warning'
            elif days_until_expiry <= 30:
                renewal_type = 'standard'
                status = 'Due This Month'
                badge_color = 'info'
            else:
                renewal_type = 'early_bird'
                status = 'Early Renewal Available'
                badge_color = 'success'
            
            renewals.append({
                'id': str(policy.id),
                'policyNo': policy.policy_number,
                'vehicleReg': (policy.vehicle_details.get('registration') or 
                              policy.vehicle_details.get('registration_number') or 'N/A'),
                'vehicleMake': policy.vehicle_details.get('make', 'N/A'),
                'vehicleModel': policy.vehicle_details.get('model', 'N/A'),
                'clientName': policy.client_details.get('fullName', 'N/A'),
                'expiryDate': policy.cover_end_date.isoformat(),
                'daysLeft': max(0, days_until_expiry),
                'daysUntilExpiry': days_until_expiry,  # Can be negative
                'status': status,
                'renewalType': renewal_type,
                'badgeColor': badge_color,
                'category': policy.product_details.get('category', 'MOTOR'),
                'coverType': (policy.product_details.get('subcategory') or 
                             policy.product_details.get('coverType', 'UNKNOWN')),
                'currentPremium': (policy.premium_breakdown.get('total_premium') or 
                                  policy.premium_breakdown.get('total_amount') or 0),
                'underwriter': (policy.underwriter_details.get('name', 'N/A') 
                               if policy.underwriter_details else 'N/A'),
                'canRenew': True  # All in this list are renewable
            })
    
    return Response({
        'success': True,
        'count': len(renewals),
        'renewals': renewals
    })
```

**Update `/api/motor2/upcoming-extensions/`** (line 460):
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_upcoming_extensions(request):
    """
    Get Motor 2 EXPIRED policies eligible for extension (TOR/Third-Party only)
    """
    from django.utils import timezone
    from datetime import timedelta
    
    today = timezone.now().date()
    
    # Get EXPIRED policies only
    expired_policies = MotorPolicy.objects.filter(
        user=request.user,
        status='EXPIRED'
    ).order_by('-cover_end_date')  # Most recently expired first
    
    extensions = []
    for policy in expired_policies:
        if not policy.cover_end_date:
            continue
        
        days_since_expiry = (today - policy.cover_end_date).days
        
        # Check cover type eligibility
        cover_type = (policy.product_details.get('subcategory') or '').upper()
        
        # Third-Party: 90 days grace
        if 'THIRD' in cover_type or 'TP' in cover_type:
            max_grace_days = 90
            is_extendable = 0 <= days_since_expiry <= 90
        # TOR: 60 days grace
        elif 'TOR' in cover_type or 'TIME ON RISK' in cover_type:
            max_grace_days = 60
            is_extendable = 0 <= days_since_expiry <= 60
        # Comprehensive: not extendable
        else:
            continue  # Skip non-extendable types
        
        if not is_extendable:
            continue  # Outside grace period
        
        days_remaining_in_grace = max_grace_days - days_since_expiry
        
        # Calculate prorated premium + late fee
        base_premium = (policy.premium_breakdown.get('total_premium') or 
                       policy.premium_breakdown.get('total_amount') or 0)
        
        # Late fee tiers
        if days_since_expiry <= 30:
            late_fee_percent = 5
        elif days_since_expiry <= 60:
            late_fee_percent = 10
        else:
            late_fee_percent = 15
        
        # Prorated for 3 months extension (configurable)
        extension_months = 3
        prorated_premium = (base_premium / 12) * extension_months
        late_fee = prorated_premium * (late_fee_percent / 100)
        total_extension_cost = prorated_premium + late_fee
        
        # Determine urgency
        if days_remaining_in_grace <= 7:
            urgency = 'urgent'
            badge_color = 'error'
        elif days_remaining_in_grace <= 14:
            urgency = 'warning'
            badge_color = 'warning'
        else:
            urgency = 'standard'
            badge_color = 'info'
        
        extensions.append({
            'id': str(policy.id),
            'policyNo': policy.policy_number,
            'vehicleReg': (policy.vehicle_details.get('registration') or 
                          policy.vehicle_details.get('registration_number') or 'N/A'),
            'vehicleMake': policy.vehicle_details.get('make', 'N/A'),
            'vehicleModel': policy.vehicle_details.get('model', 'N/A'),
            'clientName': policy.client_details.get('fullName', 'N/A'),
            'expiredDate': policy.cover_end_date.isoformat(),
            'daysSinceExpiry': days_since_expiry,
            'daysRemainingInGrace': days_remaining_in_grace,
            'graceEndDate': (policy.cover_end_date + timedelta(days=max_grace_days)).isoformat(),
            'status': f'Expired {days_since_expiry} days ago',
            'urgency': urgency,
            'badgeColor': badge_color,
            'category': policy.product_details.get('category', 'MOTOR'),
            'coverType': cover_type,
            'extensionMonths': extension_months,
            'proratedPremium': round(prorated_premium, 2),
            'lateFeePercent': late_fee_percent,
            'lateFee': round(late_fee, 2),
            'totalCost': round(total_extension_cost, 2),
            'canExtend': True  # All in this list are extendable
        })
    
    return Response({
        'success': True,
        'count': len(extensions),
        'extensions': extensions
    })
```

### Task 3: Create Renewal Endpoint

**File**: `insurance-app/app/views/policy_management.py`

Add new endpoint:

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renew_policy(request, policy_id):
    """
    Initiate policy renewal - creates a new Motor 2 quote prefilled with existing policy data
    Agent can update vehicle/client details before final submission
    """
    try:
        policy = MotorPolicy.objects.get(id=policy_id, user=request.user, status='ACTIVE')
    except MotorPolicy.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Policy not found or not eligible for renewal'
        }, status=404)
    
    # Check renewal eligibility
    if not policy.is_renewable:
        return Response({
            'success': False,
            'error': 'Policy is not within renewal window (90 days before to 7 days after expiry)'
        }, status=400)
    
    from django.utils import timezone
    from datetime import timedelta
    
    # Create renewal quote (new policy in DRAFT state)
    renewal_policy = MotorPolicy()
    renewal_policy.user = request.user
    renewal_policy.status = 'DRAFT'
    renewal_policy.is_renewal = True
    renewal_policy.original_policy = policy
    renewal_policy.renewal_count = (policy.renewal_count or 0) + 1
    
    # Copy vehicle details (agent can update)
    renewal_policy.vehicle_details = policy.vehicle_details.copy()
    
    # Copy client details (agent can update)
    renewal_policy.client_details = policy.client_details.copy()
    
    # Copy product details
    renewal_policy.product_details = policy.product_details.copy()
    
    # Copy underwriter (agent can change during comparison)
    renewal_policy.underwriter_details = policy.underwriter_details.copy() if policy.underwriter_details else {}
    
    # Recalculate premium with CURRENT YEAR pricing
    # Note: Frontend will handle full repricing via Motor 2 flow
    # For now, copy structure but flag for repricing
    renewal_policy.premium_breakdown = policy.premium_breakdown.copy()
    renewal_policy.premium_breakdown['needs_repricing'] = True
    renewal_policy.premium_breakdown['renewal_from_policy'] = policy.policy_number
    
    # Set new cover dates (12 months from renewal date)
    today = timezone.now().date()
    renewal_policy.cover_start_date = max(today, policy.cover_end_date + timedelta(days=1))
    renewal_policy.cover_end_date = renewal_policy.cover_start_date + timedelta(days=365)
    
    # Initialize empty payment/documents
    renewal_policy.payment_details = {'status': 'PENDING'}
    renewal_policy.documents = []
    renewal_policy.addons = policy.addons.copy()
    
    renewal_policy.save()
    
    serializer = MotorPolicySerializer(renewal_policy)
    
    return Response({
        'success': True,
        'message': 'Renewal quote created successfully',
        'renewalPolicy': serializer.data,
        'originalPolicy': {
            'policyNumber': policy.policy_number,
            'expiryDate': policy.cover_end_date.isoformat(),
        },
        'nextStep': 'REPRICE_AND_COMPARE'  # Signal to frontend
    })
```

### Task 4: Create Extension Endpoint

**File**: `insurance-app/app/views/policy_management.py`

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extend_policy(request, policy_id):
    """
    Extend an expired extendible policy (Third-Party/TOR only)
    Calculates prorated premium + late fee
    """
    try:
        policy = MotorPolicy.objects.get(id=policy_id, user=request.user, status='EXPIRED')
    except MotorPolicy.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Policy not found or not expired'
        }, status=404)
    
    # Check extension eligibility
    if not policy.is_extendable:
        cover_type = policy.product_details.get('subcategory', 'UNKNOWN')
        return Response({
            'success': False,
            'error': f'Policy cover type ({cover_type}) is not extendable or outside grace period'
        }, status=400)
    
    from django.utils import timezone
    from datetime import timedelta
    
    today = timezone.now().date()
    days_since_expiry = (today - policy.cover_end_date).days
    
    # Get extension period from request (default 3 months)
    extension_months = int(request.data.get('extension_months', 3))
    if extension_months < 1 or extension_months > 12:
        return Response({
            'success': False,
            'error': 'Extension period must be 1-12 months'
        }, status=400)
    
    # Calculate costs
    base_premium = policy.premium_breakdown.get('total_premium', 0)
    prorated_premium = (base_premium / 12) * extension_months
    
    # Late fee calculation
    if days_since_expiry <= 30:
        late_fee_percent = 5
    elif days_since_expiry <= 60:
        late_fee_percent = 10
    else:
        late_fee_percent = 15
    
    late_fee = prorated_premium * (late_fee_percent / 100)
    total_cost = prorated_premium + late_fee
    
    # Create extension quote (new policy in DRAFT state)
    extension_policy = MotorPolicy()
    extension_policy.user = request.user
    extension_policy.status = 'DRAFT'
    extension_policy.is_renewal = False
    extension_policy.original_policy = policy
    extension_policy.extension_count = (policy.extension_count or 0) + 1
    
    # Preserve policy number with extension suffix
    extension_suffix = f"-EXT{extension_policy.extension_count}"
    extension_policy.policy_number = policy.policy_number + extension_suffix
    
    # Copy all details from original
    extension_policy.vehicle_details = policy.vehicle_details.copy()
    extension_policy.client_details = policy.client_details.copy()
    extension_policy.product_details = policy.product_details.copy()
    extension_policy.product_details['is_extension'] = True
    extension_policy.underwriter_details = policy.underwriter_details.copy() if policy.underwriter_details else {}
    
    # Set extension premium
    extension_policy.premium_breakdown = {
        'base_premium': round(prorated_premium, 2),
        'late_fee': round(late_fee, 2),
        'late_fee_percent': late_fee_percent,
        'total_premium': round(total_cost, 2),
        'extension_months': extension_months,
        'days_since_expiry': days_since_expiry,
        'extended_from_policy': policy.policy_number
    }
    
    # Set extension cover dates
    extension_policy.cover_start_date = today
    extension_policy.cover_end_date = today + timedelta(days=30 * extension_months)  # Approximate months
    
    extension_policy.payment_details = {'status': 'PENDING'}
    extension_policy.documents = []
    extension_policy.addons = []
    
    extension_policy.save()
    
    serializer = MotorPolicySerializer(extension_policy)
    
    return Response({
        'success': True,
        'message': 'Extension quote created successfully',
        'extensionPolicy': serializer.data,
        'originalPolicy': {
            'policyNumber': policy.policy_number,
            'expiredDate': policy.cover_end_date.isoformat(),
        },
        'pricing': {
            'proratedPremium': round(prorated_premium, 2),
            'lateFee': round(late_fee, 2),
            'lateFeePercent': late_fee_percent,
            'totalCost': round(total_cost, 2),
            'extensionMonths': extension_months
        },
        'nextStep': 'PROCEED_TO_PAYMENT'
    })
```

### Task 5: Update URL Routing

**File**: `insurance-app/app/urls.py`

Add routes:
```python
path('motor2/policies/<uuid:policy_id>/renew/', views.renew_policy, name='renew_motor_policy'),
path('motor2/policies/<uuid:policy_id>/extend/', views.extend_policy, name='extend_motor_policy'),
```

---

## Frontend Implementation Tasks

### Task 1: Update UpcomingScreen API Integration

**File**: `frontend/screens/main/UpcomingScreen.js`

Current status: Empty states with no API calls.

**Changes needed**:

1. Add API service methods to `DjangoAPIService`:

```javascript
// In frontend/services/DjangoAPIService.js

async getUpcomingRenewals() {
  try {
    const response = await this.get('/motor2/upcoming-renewals/');
    return response.renewals || [];
  } catch (error) {
    console.error('[DjangoAPIService] Error fetching renewals:', error);
    throw error;
  }
}

async getUpcomingExtensions() {
  try {
    const response = await this.get('/motor2/upcoming-extensions/');
    return response.extensions || [];
  } catch (error) {
    console.error('[DjangoAPIService] Error fetching extensions:', error);
    throw error;
  }
}

async renewPolicy(policyId) {
  try {
    const response = await this.post(`/motor2/policies/${policyId}/renew/`);
    return response;
  } catch (error) {
    console.error('[DjangoAPIService] Error renewing policy:', error);
    throw error;
  }
}

async extendPolicy(policyId, extensionMonths = 3) {
  try {
    const response = await this.post(`/motor2/policies/${policyId}/extend/`, {
      extension_months: extensionMonths
    });
    return response;
  } catch (error) {
    console.error('[DjangoAPIService] Error extending policy:', error);
    throw error;
  }
}
```

2. Update UpcomingScreen to fetch and display data:

```javascript
// In frontend/screens/main/UpcomingScreen.js

import DjangoAPIService from '../../services/DjangoAPIService';

// Add state
const [renewals, setRenewals] = useState([]);
const [extensions, setExtensions] = useState([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);

// Fetch data on mount
useEffect(() => {
  fetchUpcomingData();
}, []);

const fetchUpcomingData = async () => {
  try {
    setLoading(true);
    const [renewalsData, extensionsData] = await Promise.all([
      DjangoAPIService.getUpcomingRenewals(),
      DjangoAPIService.getUpcomingExtensions()
    ]);
    setRenewals(renewalsData);
    setExtensions(extensionsData);
  } catch (error) {
    console.error('Error fetching upcoming data:', error);
    Alert.alert('Error', 'Failed to load upcoming renewals and extensions');
  } finally {
    setLoading(false);
  }
};

const handleRefresh = async () => {
  setRefreshing(true);
  await fetchUpcomingData();
  setRefreshing(false);
};

const handleRenewPolicy = async (policyId) => {
  try {
    const response = await DjangoAPIService.renewPolicy(policyId);
    if (response.success) {
      Alert.alert('Success', 'Renewal quote created. Proceeding to pricing...');
      // Navigate to Motor 2 flow with prefilled data
      navigation.navigate('Motor2Flow', {
        mode: 'renewal',
        renewalData: response.renewalPolicy,
        originalPolicy: response.originalPolicy
      });
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to initiate renewal');
  }
};

const handleExtendPolicy = async (policyId) => {
  // Show extension period picker
  Alert.alert(
    'Extend Policy',
    'Select extension period:',
    [
      { text: '3 Months', onPress: () => processExtension(policyId, 3) },
      { text: '6 Months', onPress: () => processExtension(policyId, 6) },
      { text: '12 Months', onPress: () => processExtension(policyId, 12) },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};

const processExtension = async (policyId, months) => {
  try {
    const response = await DjangoAPIService.extendPolicy(policyId, months);
    if (response.success) {
      Alert.alert(
        'Extension Quote Ready',
        `Total Cost: KSh ${response.pricing.totalCost.toLocaleString()}\n` +
        `Prorated Premium: KSh ${response.pricing.proratedPremium.toLocaleString()}\n` +
        `Late Fee (${response.pricing.lateFeePercent}%): KSh ${response.pricing.lateFee.toLocaleString()}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed to Payment',
            onPress: () => {
              // Navigate to payment screen with extension data
              navigation.navigate('PaymentScreen', {
                mode: 'extension',
                extensionData: response.extensionPolicy,
                pricing: response.pricing
              });
            }
          }
        ]
      );
    }
  } catch (error) {
    Alert.alert('Error', error.message || 'Failed to create extension quote');
  }
};
```

3. Update the Overview section to show actual counts:

```javascript
<View style={styles.overviewGrid}>
  <View style={styles.overviewCard}>
    <Text style={styles.overviewCount}>{renewals.length}</Text>
    <Text style={styles.overviewLabel}>Renewals</Text>
  </View>
  <View style={styles.overviewCard}>
    <Text style={styles.overviewCount}>{extensions.length}</Text>
    <Text style={styles.overviewLabel}>Extensions</Text>
  </View>
  <View style={styles.overviewCard}>
    <Text style={styles.overviewCount}>{claims.length}</Text>
    <Text style={styles.overviewLabel}>Claims</Text>
  </View>
  <View style={styles.overviewCard}>
    <Text style={styles.overviewCount}>
      {renewals.filter(r => r.renewalType === 'overdue' || r.renewalType === 'urgent').length +
       extensions.filter(e => e.urgency === 'urgent').length}
    </Text>
    <Text style={styles.overviewLabel}>Pending</Text>
  </View>
</View>
```

4. Render renewal/extension cards:

```javascript
const renderRenewalCard = ({ item }) => (
  <EnhancedCard style={styles.itemCard}>
    <View style={styles.topRow}>
      <Text style={styles.policyNumber}>Policy: {item.policyNo}</Text>
      <View style={[styles.statusBadge, { backgroundColor: getBadgeColor(item.badgeColor) }]}>
        <Text style={styles.statusBadgeText}>{item.status}</Text>
      </View>
    </View>
    
    <View style={styles.titleBlock}>
      <Text style={styles.vehicleInfo}>
        {item.vehicleMake} {item.vehicleModel}
      </Text>
      <View style={styles.regPill}>
        <Text style={styles.regPillText}>{item.vehicleReg}</Text>
      </View>
    </View>
    
    <View style={styles.factsRow}>
      <View style={styles.factItem}>
        <Text style={styles.factLabel}>Client</Text>
        <Text style={styles.factValue}>{item.clientName}</Text>
      </View>
      <View style={styles.factItem}>
        <Text style={styles.factLabel}>Expires In</Text>
        <Text style={[styles.factValue, item.daysUntilExpiry < 0 && styles.overdueText]}>
          {item.daysUntilExpiry >= 0 ? `${item.daysLeft} days` : `${Math.abs(item.daysUntilExpiry)} days ago`}
        </Text>
      </View>
    </View>
    
    <View style={styles.premiumRow}>
      <Text style={styles.premiumLabel}>Current Premium</Text>
      <Text style={styles.premiumAmount}>
        KSh {item.currentPremium.toLocaleString()}
      </Text>
    </View>
    
    <TouchableOpacity
      style={styles.renewButton}
      onPress={() => handleRenewPolicy(item.id)}
    >
      <Text style={styles.renewButtonText}>🔄 Renew Now</Text>
    </TouchableOpacity>
  </EnhancedCard>
);

const renderExtensionCard = ({ item }) => (
  <EnhancedCard style={styles.itemCard}>
    <View style={styles.topRow}>
      <Text style={styles.policyNumber}>Policy: {item.policyNo}</Text>
      <View style={[styles.statusBadge, { backgroundColor: getBadgeColor(item.badgeColor) }]}>
        <Text style={styles.statusBadgeText}>{item.status}</Text>
      </View>
    </View>
    
    <View style={styles.titleBlock}>
      <Text style={styles.vehicleInfo}>
        {item.vehicleMake} {item.vehicleModel}
      </Text>
      <View style={styles.regPill}>
        <Text style={styles.regPillText}>{item.vehicleReg}</Text>
      </View>
      <Text style={styles.coverTypeText}>{item.coverType}</Text>
    </View>
    
    <View style={styles.factsRow}>
      <View style={styles.factItem}>
        <Text style={styles.factLabel}>Expired</Text>
        <Text style={styles.factValue}>{item.daysSinceExpiry} days ago</Text>
      </View>
      <View style={styles.factItem}>
        <Text style={styles.factLabel}>Grace Ends</Text>
        <Text style={styles.factValue}>{item.daysRemainingInGrace} days</Text>
      </View>
    </View>
    
    <View style={styles.extensionPricingRow}>
      <View>
        <Text style={styles.extensionLabel}>Extension Cost ({item.extensionMonths} months)</Text>
        <Text style={styles.extensionBreakdown}>
          Prorated: KSh {item.proratedPremium.toLocaleString()} + Late Fee ({item.lateFeePercent}%): KSh {item.lateFee.toLocaleString()}
        </Text>
      </View>
      <Text style={styles.extensionTotal}>KSh {item.totalCost.toLocaleString()}</Text>
    </View>
    
    <TouchableOpacity
      style={[styles.extendButton, item.urgency === 'urgent' && styles.urgentButton]}
      onPress={() => handleExtendPolicy(item.id)}
    >
      <Text style={styles.extendButtonText}>⏱️ Extend Policy</Text>
    </TouchableOpacity>
  </EnhancedCard>
);
```

### Task 2: Add Renewal/Extension Indicators to QuotationsScreen

**File**: `frontend/screens/main/QuotationsScreenNew.js`

Add a small badge for policies approaching expiry:

```javascript
// In renderQuoteCard, add after StatusBadge:

{quote.isMotor && quote.policyNumber && quote.coverageDetails?.endDate && (
  <>
    {(() => {
      const today = new Date();
      const endDate = new Date(quote.coverageDetails.endDate);
      const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
        return (
          <View style={styles.renewalBadge}>
            <Text style={styles.renewalBadgeText}>Renew in {daysUntilExpiry}d</Text>
          </View>
        );
      }
      return null;
    })()}
  </>
)}
```

Add styles:
```javascript
renewalBadge: {
  backgroundColor: '#FFA500',
  borderRadius: 12,
  paddingHorizontal: 8,
  paddingVertical: 4,
  marginLeft: 8,
},
renewalBadgeText: {
  fontSize: 11,
  fontFamily: Typography.fontFamily.semiBold,
  color: '#FFFFFF',
},
```

---

## Testing Plan

### Unit Tests (Backend)

1. **Model Property Tests** (`insurance-app/app/tests/test_motor_policy.py`):
   - Test `is_renewable` for active policies at various days before/after expiry
   - Test `is_extendable` for Third-Party, TOR, Comprehensive types
   - Test `extension_grace_end` calculation
   - Test `renewal_urgency` categorization

2. **API Endpoint Tests**:
   - Test `/api/motor2/upcoming-renewals/` returns correct policies
   - Test `/api/motor2/upcoming-extensions/` filters by cover type
   - Test `/api/motor2/policies/{id}/renew/` creates proper renewal quote
   - Test `/api/motor2/policies/{id}/extend/` calculates late fees correctly

### Integration Tests (Frontend)

1. **UpcomingScreen Tests**:
   - Verify API calls on mount
   - Test renewal button navigation
   - Test extension period picker
   - Test search/filter functionality

2. **End-to-End Flow Tests**:
   - Active policy → Renew → Motor 2 flow → Payment → New policy created
   - Expired TOR → Extend → Payment → Extension applied
   - Verify original policy status preserved until expiry

---

## Deployment Checklist

### Backend

- [ ] Add computed properties to MotorPolicy model
- [ ] Update get_upcoming_renewals view (90-day window)
- [ ] Update get_upcoming_extensions view (cover-type based)
- [ ] Create renew_policy endpoint
- [ ] Create extend_policy endpoint
- [ ] Update URL routing
- [ ] Run migrations (if model changes)
- [ ] Write unit tests
- [ ] Update API documentation

### Frontend

- [ ] Add API methods to DjangoAPIService
- [ ] Update UpcomingScreen with data fetching
- [ ] Implement renewal flow (navigate to Motor 2)
- [ ] Implement extension flow (show pricing, navigate to payment)
- [ ] Add renewal indicators to QuotationsScreen
- [ ] Add extension grace warnings
- [ ] Write integration tests
- [ ] Update user guide/help section

### Documentation

- [x] Update `.github/copilot-instructions.md` with lifecycle rules
- [ ] Create agent training materials (renewal vs extension)
- [ ] Update API documentation with new endpoints
- [ ] Create troubleshooting guide for common scenarios

---

## Success Metrics

1. **Operational**:
   - Renewal rate: Track % of expiring policies renewed
   - Extension usage: Track % of expired TOR/TP policies extended vs lapsed
   - Average time from renewal reminder to payment

2. **Technical**:
   - API response time < 500ms for upcoming lists
   - Zero errors in renewal/extension calculations
   - 100% test coverage for policy lifecycle logic

3. **User Experience**:
   - Agent satisfaction with renewal workflow
   - Reduction in manual policy re-entry
   - Reduction in support tickets for "how to renew"

---

## Next Steps

1. **Immediate** (This Week):
   - Implement backend computed properties
   - Update API endpoints for 90-day window
   - Test with sample policies

2. **Short-term** (Next 2 Weeks):
   - Complete frontend integration
   - Add renewal/extension flows
   - User acceptance testing with agents

3. **Long-term** (Next Month):
   - Automated renewal reminders (push notifications)
   - Bulk renewal processing for fleet policies
   - Analytics dashboard for renewal pipeline

---

**Document Version**: 1.0  
**Last Updated**: October 17, 2025  
**Status**: Ready for Implementation
