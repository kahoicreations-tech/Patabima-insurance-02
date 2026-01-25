# Motor3 Backend Architecture Analysis

**Date**: January 18, 2026  
**Purpose**: Comprehensive backend review to prevent code duplication and ensure best architecture practices

---

## 🎯 Executive Summary

**GOOD NEWS**: Motor3 quotation system is **ALREADY IMPLEMENTED** with solid architecture!

### What EXISTS:

- ✅ `Motor3Quotation` model (lines 1449-1480 in models.py)
- ✅ 6 view functions in `motor3_quotations.py`
- ✅ PDF generation with PataBima branding
- ✅ Quotation-to-Policy conversion logic
- ✅ Uses shared `MotorPolicySubmissionSerializer`

### What's MISSING:

- ❌ URL routes not registered in urls.py
- ❌ TOR (Third-Party Only Road) specific endpoint
- ❌ Motor3-specific validation for extendible policies
- ❌ Smoke test for end-to-end quotation flow

---

## 📊 Database Architecture

### Existing Models (No Duplication Needed)

#### 1. **Motor3Quotation Model** ✅

**Location**: `insurance-app/app/models.py` (lines 1449-1480)

```python
class Motor3Quotation(BaseModel):
    # Identification
    quote_number = CharField(max_length=50, unique=True, db_index=True)  # M3Q-2026-123456
    user = ForeignKey(User, related_name='motor3_quotations')

    # Quotation Details
    coverage_type = CharField(max_length=20, default='THIRD_PARTY')  # THIRD_PARTY, TOR, COMPREHENSIVE
    status = CharField(max_length=20, default='DRAFT')  # DRAFT, SUBMITTED, PENDING_PAYMENT, PAID, CONVERTED, CANCELLED

    # Vehicle Info (for quick filtering)
    registration_number = CharField(max_length=20, null=True, db_index=True)
    proposed_cover_start_date = CharField(max_length=32, null=True)

    # Payment Tracking
    transaction_id = CharField(max_length=128, null=True, db_index=True)
    policy_number = CharField(max_length=50, null=True, db_index=True)  # Set after conversion

    # Complete Data Storage (JSON)
    payload = JSONField()  # Raw request from frontend
    normalized_payload = JSONField(null=True)  # Validated/normalized data
```

**Status Flow**:

```
DRAFT → SUBMITTED → PENDING_PAYMENT → PAID → CONVERTED
                          ↓
                      CANCELLED (if payment fails/user cancels)
```

**Why This Works**:

- ✅ Flexible JSON storage avoids rigid schema changes
- ✅ Indexed fields (registration_number, status, transaction_id) for fast queries
- ✅ Tracks conversion to MotorPolicy via policy_number
- ✅ Idempotency via quote_number uniqueness

#### 2. **MotorPolicy Model** ✅

**Location**: `insurance-app/app/models.py` (lines 888-1100)

```python
class MotorPolicy(BaseModel):
    # This is the FINAL policy record (after quotation conversion)
    policy_number = CharField(max_length=50, unique=True, db_index=True)  # POL-2026-123456
    quote_id = CharField(max_length=100, null=True)  # Links back to quote_number

    # Same JSON structure as Motor3Quotation
    client_details = JSONField()
    vehicle_details = JSONField()
    product_details = JSONField()
    underwriter_details = JSONField()
    premium_breakdown = JSONField()
    payment_details = JSONField()
    addons = JSONField(default=list)
    documents = JSONField(default=list)

    # Policy lifecycle
    status = CharField(choices=POLICY_STATUS_CHOICES, default='PENDING_PAYMENT')
    cover_start_date = DateField()
    cover_end_date = DateField()

    # DMVIC integration
    dmvic_certificate_number = CharField(null=True, db_index=True)
    dmvic_status = CharField(choices=DMVIC_STATUS_CHOICES, null=True)
    dmvic_certificate_preview_url = URLField(null=True)

    # Lifecycle tracking
    original_policy = ForeignKey('self', null=True)  # For renewals
    renewal_count = IntegerField(default=0)
    extension_count = IntegerField(default=0)
```

**Key Difference from Motor3Quotation**:

- `Motor3Quotation` = Pre-payment quotation (DRAFT/SUBMITTED)
- `MotorPolicy` = Post-payment policy (ACTIVE/EXPIRED)

---

## 🏗️ View Architecture

### Existing Views in `motor3_quotations.py` ✅

#### 1. **Helper Function: `_generate_motor3_quote_number()`**

```python
def _generate_motor3_quote_number() -> str:
    return f"M3Q-{datetime.now().year}-{random.randint(100000, 999999)}"
```

**Purpose**: Consistent quote number generation (M3Q-2026-123456)

#### 2. **Core Function: `_create_motor3_quotation(request, coverage_type)`**

**Lines**: 17-61

**What it does**:

1. Validates payload using `MotorPolicySubmissionSerializer`
2. Generates unique quote_number
3. Extracts key fields (registration_number, cover_start_date) from nested JSON
4. Creates Motor3Quotation record with status='DRAFT'
5. Returns quotation summary

**Reusability**: ✅ All coverage types use this helper

#### 3. **View: `create_motor3_third_party_quotation`** ✅

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_motor3_third_party_quotation(request):
    return _create_motor3_quotation(request, coverage_type='THIRD_PARTY')
```

#### 4. **View: `create_motor3_comprehensive_quotation`** ✅

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_motor3_comprehensive_quotation(request):
    return _create_motor3_quotation(request, coverage_type='COMPREHENSIVE')
```

#### 5. **View: `list_motor3_quotations`** ✅

**Lines**: 79-107

**Features**:

- Filters by user (security)
- Optional filters: status, registration_number
- Returns first 200 records (pagination todo)
- Lightweight response (no full payload)

#### 6. **View: `get_motor3_quotation`** ✅

**Lines**: 110-128

**Features**:

- Single quotation retrieval
- Includes full payload
- User authorization check

#### 7. **View: `get_motor3_quotation_pdf`** ✅

**Lines**: 131-270

**Features**:

- PDF generation using ReportLab
- PataBima branding
- Returns base64-encoded PDF for mobile
- Includes: client details, vehicle details, premium breakdown

#### 8. **View: `convert_motor3_quotation_to_policy`** ✅

**Lines**: 273-396

**Critical Business Logic**:

```python
# Idempotency check
if q.status == 'CONVERTED' and q.policy_number:
    return already_converted_response

# Merge payment overrides
payload = {**q.normalized_payload}
payload['paymentDetails'].update(request.data.get('paymentDetails', {}))

# Revalidate before policy creation
serializer = MotorPolicySubmissionSerializer(data=payload)

# Call existing policy creation flow
from app.views.policy_management import create_motor_policy, activate_motor_policy

# 1. Create MotorPolicy (DRAFT)
create_motor_policy(payload) → returns policy_number

# 2. Activate MotorPolicy (payment confirmation)
activate_motor_policy(policy_number, payment_details)

# 3. Update quotation status
q.status = 'CONVERTED'
q.policy_number = policy_number
q.save()
```

**Why This Design is Excellent**:

- ✅ Reuses existing policy creation logic (no duplication)
- ✅ Maintains business rules (DMVIC gating, document generation)
- ✅ Idempotent (can be called multiple times safely)
- ✅ Payment details can be overridden during conversion

---

## 🔗 Serializer Architecture

### Shared Serializer: `MotorPolicySubmissionSerializer` ✅

**Location**: `insurance-app/app/serializers.py` (line 554+)

**Structure** (Motor2 and Motor3 compatible):

```json
{
  "quoteId": "string (optional)",
  "clientDetails": {
    "fullName": "string (required)",
    "email": "string (required)",
    "phone": "string (required)",
    "idNumber": "string (required)",
    "kraPin": "string (optional)"
  },
  "vehicleDetails": {
    "registration": "string (required)",
    "make": "string (required)",
    "model": "string (required)",
    "year": "integer (required)",
    "chassisNumber": "string (optional)",
    "coverStartDate": "date (required)"
  },
  "productDetails": {
    "category": "string (required)",
    "subcategory": "string (required)",
    "coverageType": "string (required)"
  },
  "underwriterDetails": {
    "name": "string (required)",
    "code": "string (required)",
    "id": "integer (required)"
  },
  "premiumBreakdown": {
    "basePremium": "decimal (required)",
    "totalAmount": "decimal (required)",
    "levies": "object (optional)"
  },
  "paymentDetails": {
    "method": "string (required)",
    "transaction_id": "string (optional)",
    "status": "string (optional)"
  }
}
```

**Why Shared Serializer Works**:

- ✅ Motor2 and Motor3 use identical data structure
- ✅ Nested field naming consistent (camelCase)
- ✅ Frontend already sends this format
- ✅ No duplication of validation logic

**Recommendation**: Keep shared serializer, add optional Motor3-specific validators if needed

---

## 🚫 What NOT to Duplicate

### ❌ Don't Create Separate Models

**Reason**: Motor3Quotation and MotorPolicy already handle all use cases

### ❌ Don't Create Separate Serializers

**Reason**: MotorPolicySubmissionSerializer validates both Motor2 and Motor3 payloads

### ❌ Don't Rewrite Policy Creation Logic

**Reason**: `create_motor_policy()` and `activate_motor_policy()` handle:

- Policy number generation
- Payment processing
- Document generation
- DMVIC integration
- Commission calculation

### ❌ Don't Create New Premium Calculation

**Reason**: Existing pricing service handles all categories:

- `/api/v1/public_app/insurance/calculate_motor_premium`
- Supports PRIVATE_THIRD_PARTY, PRIVATE_TOR, PRIVATE_COMPREHENSIVE, etc.

---

## ✅ What NEEDS to be Done

### 1. **Register URL Routes** (CRITICAL)

**File**: `insurance-app/app/urls.py`

```python
# Import motor3 views
from .views import motor3_quotations

urlpatterns = [
    # ... existing routes ...

    # Motor3 Quotation Endpoints
    path('motor3/quotations/third-party/',
         motor3_quotations.create_motor3_third_party_quotation,
         name='motor3-quotation-third-party'),
    path('motor3/quotations/comprehensive/',
         motor3_quotations.create_motor3_comprehensive_quotation,
         name='motor3-quotation-comprehensive'),
    path('motor3/quotations/tor/',
         motor3_quotations.create_motor3_tor_quotation,  # TODO: Create this view
         name='motor3-quotation-tor'),
    path('motor3/quotations/',
         motor3_quotations.list_motor3_quotations,
         name='motor3-quotations-list'),
    path('motor3/quotations/<uuid:quotation_id>/',
         motor3_quotations.get_motor3_quotation,
         name='motor3-quotation-detail'),
    path('motor3/quotations/<uuid:quotation_id>/pdf/',
         motor3_quotations.get_motor3_quotation_pdf,
         name='motor3-quotation-pdf'),
    path('motor3/quotations/<uuid:quotation_id>/convert/',
         motor3_quotations.convert_motor3_quotation_to_policy,
         name='motor3-quotation-convert'),
]
```

### 2. **Add TOR Endpoint** (NEW)

**File**: `insurance-app/app/views/motor3_quotations.py`

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_motor3_tor_quotation(request):
    """
    Create Third-Party Only Road (TOR) quotation
    Validates duration_days and extendible flag
    """
    # Validate TOR-specific fields
    duration_days = request.data.get('duration_days') or \
                   request.data.get('productDetails', {}).get('duration_days')

    if duration_days and duration_days not in [30, 60, 90]:
        return Response({
            'success': False,
            'error': 'Invalid duration_days for TOR. Must be 30, 60, or 90.'
        }, status=400)

    return _create_motor3_quotation(request, coverage_type='TOR')
```

### 3. **Enhanced Smoke Test**

**File**: `scripts/test-motor3-smoke.ps1`

```powershell
# Test Motor3 Quotation Creation
Test-Endpoint "Create Third-Party Quotation" {
    $response = Invoke-ApiCall -Method POST -Path "/api/motor3/quotations/third-party/" -Body @{
        clientDetails = @{
            fullName = "Test User"
            email = "test@example.com"
            phone = "+254712345678"
            idNumber = "12345678"
        }
        vehicleDetails = @{
            registration = $RegistrationNumber
            make = $vehicleData.vehicle.make
            model = $vehicleData.vehicle.model
            year = $vehicleData.vehicle.year_of_manufacture
            chassisNumber = $vehicleData.vehicle.chassis_number
            coverStartDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
        }
        productDetails = @{
            category = "PRIVATE"
            subcategory = "PRIVATE_THIRD_PARTY"
            coverageType = "THIRD_PARTY"
        }
        underwriterDetails = @{
            name = "APA Insurance"
            code = "APA"
            id = 1
        }
        premiumBreakdown = @{
            basePremium = $premiumData.base_premium
            totalAmount = $premiumData.total_premium
        }
        paymentDetails = @{
            method = "MPESA"
            status = "PENDING"
        }
    } -RequiresAuth

    if (-not $response.quote_number) {
        throw "No quote number returned"
    }

    Write-Info "Quote Number: $($response.quote_number)"
    return $response
}
```

---

## 🎨 Architecture Best Practices Applied

### 1. **Single Responsibility Principle** ✅

- `Motor3Quotation` = Quotation lifecycle
- `MotorPolicy` = Policy lifecycle
- Separate concerns, shared serializer

### 2. **Don't Repeat Yourself (DRY)** ✅

- `_create_motor3_quotation()` helper reused by all coverage types
- Shared `MotorPolicySubmissionSerializer`
- Reuses `create_motor_policy()` and `activate_motor_policy()`

### 3. **Open/Closed Principle** ✅

- Adding new coverage type = 3 lines of code:
  ```python
  @api_view(['POST'])
  def create_motor3_new_type(request):
      return _create_motor3_quotation(request, coverage_type='NEW_TYPE')
  ```

### 4. **Dependency Inversion** ✅

- Views depend on serializer abstraction
- Policy conversion depends on policy management interface

### 5. **Idempotency** ✅

- Quotation conversion checks `if status == 'CONVERTED'`
- Policy creation checks `if transaction_id already exists`

### 6. **Separation of Concerns** ✅

- Models = Data structure
- Serializers = Validation
- Views = Business logic
- Services = External integrations (DMVIC)

---

## 📈 Performance Considerations

### Database Indexes ✅

```python
class Motor3Quotation:
    quote_number = CharField(db_index=True)  # Fast lookup
    status = CharField(db_index=True)  # Filter by status
    registration_number = CharField(db_index=True)  # Search by reg
    transaction_id = CharField(db_index=True)  # Payment tracking

    class Meta:
        indexes = [
            Index(fields=['user', '-date_created']),  # User's quotations (newest first)
            Index(fields=['status', '-date_created']),  # Status filtering
        ]
```

### Query Optimization

```python
# ✅ GOOD: Filters before ordering
Motor3Quotation.objects.filter(user=request.user, status='DRAFT').order_by('-date_created')[:200]

# ❌ BAD: Would fetch all, then filter
Motor3Quotation.objects.all().filter(...)  # Don't do this
```

---

## 🔒 Security Considerations

### 1. **Authorization** ✅

```python
@permission_classes([IsAuthenticated])  # User must be logged in
```

### 2. **Data Isolation** ✅

```python
Motor3Quotation.objects.filter(user=request.user)  # User can only see own quotations
```

### 3. **Input Validation** ✅

```python
serializer = MotorPolicySubmissionSerializer(data=request.data)
if not serializer.is_valid():
    return Response(serializer.errors, status=400)
```

### 4. **Idempotency** ✅

Prevents duplicate policy creation on double-submit

---

## 🚀 Deployment Checklist

- [ ] Register Motor3 routes in urls.py
- [ ] Add `create_motor3_tor_quotation` view
- [ ] Run migrations (if any schema changes)
- [ ] Update smoke test script
- [ ] Update MOTOR_ENDPOINTS_WORKING.md
- [ ] Test end-to-end quotation flow
- [ ] Test quotation-to-policy conversion
- [ ] Test PDF generation
- [ ] Verify DMVIC integration works after conversion

---

## 📝 Summary

### What We Have ✅

- Complete Motor3 quotation system already implemented
- Excellent architecture with no code duplication
- Reuses existing serializers, policy creation, and payment flows
- PDF generation with professional formatting
- Idempotent quotation-to-policy conversion

### What We Need ✨

- Register 7 URL routes
- Add 1 new view for TOR quotations
- Update smoke test to validate quotation flow
- Document API endpoints

### Estimated Effort

- **URL Registration**: 5 minutes
- **TOR Endpoint**: 15 minutes
- **Smoke Test Update**: 30 minutes
- **Documentation**: 20 minutes
- **Total**: ~70 minutes

---

**Last Updated**: January 18, 2026  
**Reviewed By**: Backend Architecture Team  
**Status**: Ready for Implementation ✅
