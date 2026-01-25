# DMVIC Intermediary Integration - Motor3 Policy Certificate Issuance

## Context
PataBima is a multi-insurer insurance platform. We have successfully tested DMVIC Intermediary endpoints in UAT and need to integrate certificate preview and issuance into the Motor3 policy workflow.

## Working DMVIC Endpoints (Tested & Verified)

### 1. Authentication ✅
- **Endpoint**: `POST /api/V1/Account/Login`
- **Status**: Working
- **Credentials**: From `.env` (DMVIC_USERNAME, DMVIC_PASSWORD, DMVIC_CLIENT_ID)
- **Returns**: Bearer token + optional APIM subscription key
- **Token Expiry**: ~5 years (UAT)

### 2. Vehicle Search ✅
- **Endpoint**: `POST /api/v5/Integration/VehicleSearch`
- **Status**: Working
- **Returns**: Vehicle details + policy history from DMVIC database
- **Note**: Returns 2-digit years (e.g., "93" = 1993), chassis with hyphens

### 3. Validate Type A Certificate (Intermediary) ✅
- **Endpoint**: `POST /api/v6/IntermediaryIntegration/ValidateTypeACertificate`
- **Status**: Working (returns ER006 due to no inventory)
- **Member Company ID**: 97218 (numeric format, NOT "DC0097218")
- **Authorized Certificate Types**: Type 8 (PSV/Taxi) only
- **Note**: Types 7 (Private) and 9 (Commercial) return ER001

### 4. Preview Type A Certificate (Intermediary) ✅✅
- **Endpoint**: `POST /api/v6/IntermediaryIntegration/PreviewTypeACertificate`
- **Status**: FULLY WORKING
- **Returns**: Azure Blob Storage URL with SAS token (valid ~13 hours)
- **No Inventory Required**: Preview works even without sticker allocation
- **Response Structure**:
```json
{
  "success": true,
  "callbackObj": {
    "previewCertificateURL": "https://insurancedevelopment.blob.core.windows.net/..."
  },
  "APIRequestNumber": "UAT-OJY3179"
}
```

### 5. Issue Type A Certificate (Intermediary) ⚠️
- **Endpoint**: `POST /api/v6/IntermediaryIntegration/IssuanceTypeACertificate`
- **Status**: Not tested (requires inventory allocation from DMVIC)
- **Expected**: Same as Preview but consumes a certificate sticker
- **Note**: Will work once DMVIC allocates PSV certificate inventory

## Mandatory Payload Fields (From DMVIC Documentation)

### Required Fields
```python
{
    "Membercompanyid": 97218,           # Integer - Our DMVIC Member ID
    "TypeOfCertificate": 8,             # Integer - 7=Private, 8=PSV, 9=Commercial
    "Typeofcover": 100,                 # Integer - 100=Comp, 200=TPO, 300=TPTF
    "Policyholder": "Client Name",      # String - Required
    "policynumber": "POL123",           # String - Required
    "Commencingdate": "02/01/2026",     # String - DD/MM/YYYY format
    "Expiringdate": "02/01/2027",       # String - DD/MM/YYYY format
    "Registrationnumber": "KBZ123A",    # String - Optional for some types
    "Chassisnumber": "ABC123",          # String - Required (4-20 chars, alphanumeric)
    "Phonenumber": "712345678",         # String - Required (9 digits)
    "Bodytype": "SALOON",               # String - Required
    "Licensedtocarry": 5,               # Integer - Required
    "Vehiclemake": "TOYOTA",            # String - Optional
    "Vehiclemodel": "VITZ",             # String - Optional
    "Yearofregistration": 2007,         # Integer - YYYY format
    "Enginenumber": "ENG123",           # String - Optional
    "Email": "test@example.com",        # String - Required (valid email)
    "SumInsured": 500000,               # Integer - Required for Comp/TPTF
    "InsuredPIN": "A123456789A",        # String - Required (max 11 chars)
    "Yearofmanufacture": 2007,          # Integer - YYYY format
    "HudumaNumber": "123456789012"      # String - Optional (12 digits)
}
```

### Data Transformation Notes
1. **Chassis Number**: Remove hyphens/spaces before sending to DMVIC
2. **Year Fields**: Convert 2-digit to 4-digit (93 → 1993: add 1900 if ≥50, else add 2000)
3. **Date Format**: Must be DD/MM/YYYY (not YYYY-MM-DD or ISO format)
4. **Cover Type Mapping**:
   - COMPREHENSIVE → 100
   - THIRD_PARTY → 200
   - THIRD_PARTY_FIRE_THEFT → 300
5. **Certificate Type**: Determine from vehicle body type or policy type
   - VAN/TRUCK/LORRY → 9 (Commercial)
   - BUS/MATATU → 8 (PSV)
   - Default → 7 (Private) [Currently not authorized for our account]

## Current Motor3 Flow

### Motor3 Quotation → Policy Conversion
1. User creates Motor3 quotation (`POST /api/v1/motor3/quotations/create/`)
2. Quotation stored with status: DRAFT → SUBMITTED → PENDING_PAYMENT
3. User converts to policy (`POST /api/v1/motor3/quotations/{id}/convert-to-policy/`)
4. Backend calls `create_motor_policy()` → `activate_motor_policy()`
5. Policy activation generates documents (schedule, receipt, etc.)

### Current Document Generation (app/views/policy_management.py)
- Uses AWS S3 presigned URLs for uploads
- Generates PDF documents via template rendering
- Documents: policy schedule, receipt, renewal notice, etc.

## Integration Requirements

### Phase 1: Add DMVIC Methods to Backend

**File**: `insurance-app/app/services/dmvic_service.py`

Add these methods:

```python
def preview_type_a_certificate_intermediary(
    self,
    member_company_id: int,
    vehicle_data: Dict[str, Any],
    policy_data: Dict[str, Any],
    policyholder_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Preview Type A certificate for intermediary before issuance.
    Returns Azure Blob Storage URL for certificate PDF preview.
    
    Args:
        member_company_id: DMVIC Member Company ID (97218)
        vehicle_data: Dict with registration, chassis, make, model, year, etc.
        policy_data: Dict with policy_number, cover_type, start_date, end_date, sum_insured
        policyholder_data: Dict with name, phone, email, pin, huduma_number
    
    Returns:
        Dict with success status and previewCertificateURL or error details
    """
    # Build payload from parameters
    # Call /api/v6/IntermediaryIntegration/PreviewTypeACertificate
    # Return response with previewCertificateURL
    pass

def issue_type_a_certificate_intermediary(
    self,
    member_company_id: int,
    vehicle_data: Dict[str, Any],
    policy_data: Dict[str, Any],
    policyholder_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Issue actual Type A certificate (consumes inventory).
    
    Same parameters as preview method.
    
    Returns:
        Dict with certificate number, PDF data/URL, and DMVIC reference
    """
    # Build payload from parameters
    # Call /api/v6/IntermediaryIntegration/IssuanceTypeACertificate
    # Return response with certificate details
    pass

def validate_type_a_certificate_intermediary(
    self,
    member_company_id: int,
    vehicle_data: Dict[str, Any],
    policy_data: Dict[str, Any],
    policyholder_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validate certificate data before issuance.
    Returns validation errors or success.
    """
    # Build payload from parameters
    # Call /api/v6/IntermediaryIntegration/ValidateTypeACertificate
    # Return validation result
    pass
```

**Helper Functions Needed**:
```python
def _prepare_dmvic_payload(
    vehicle_data: Dict,
    policy_data: Dict,
    policyholder_data: Dict,
    member_company_id: int = 97218
) -> Dict[str, Any]:
    """
    Transform Motor3/MotorPolicy data to DMVIC payload format.
    
    Handles:
    - Chassis number cleaning (remove hyphens/spaces)
    - Year conversion (2-digit to 4-digit)
    - Date formatting (YYYY-MM-DD to DD/MM/YYYY)
    - Cover type mapping (COMPREHENSIVE → 100)
    - Certificate type determination
    """
    pass

def _determine_certificate_type(body_type: str, coverage_type: str) -> int:
    """
    Determine DMVIC certificate type from vehicle body type.
    
    Returns:
        8 for PSV/Taxi (currently authorized)
        7 for Private (not yet authorized)
        9 for Commercial (not yet authorized)
    """
    pass
```

### Phase 2: Integrate with Motor Policy Activation

**File**: `insurance-app/app/views/policy_management.py`

**Function**: `activate_motor_policy(request, policy_number)`

**Integration Points**:

1. **After payment verification** (around line ~1100):
```python
# Existing code validates payment...
policy.payment_status = 'PAID'
policy.save()

# NEW: Generate DMVIC certificate preview
dmvic_service = DMVICService()
try:
    # Prepare vehicle data from policy
    vehicle_data = {
        'registration_number': policy.registration_number,
        'chassis_number': policy.chassis_number,
        'make': policy.vehicle_make,
        'model': policy.vehicle_model,
        'year_of_manufacture': policy.year_of_manufacture,
        'engine_number': policy.engine_number,
        'body_type': policy.body_type,
    }
    
    # Prepare policy data
    policy_data = {
        'policy_number': policy.policy_number,
        'coverage_type': policy.coverage_type,
        'start_date': policy.start_date,
        'end_date': policy.end_date,
        'sum_insured': policy.sum_insured,
    }
    
    # Prepare policyholder data
    policyholder_data = {
        'name': policy.policyholder_name,
        'phone': policy.policyholder_phone,
        'email': policy.policyholder_email or request.user.email,
        'pin': policy.policyholder_pin,
        'huduma_number': policy.huduma_number,
    }
    
    # Generate certificate preview
    preview_result = dmvic_service.preview_type_a_certificate_intermediary(
        member_company_id=97218,
        vehicle_data=vehicle_data,
        policy_data=policy_data,
        policyholder_data=policyholder_data
    )
    
    if preview_result.get('success'):
        # Store preview URL in policy
        policy.dmvic_certificate_preview_url = preview_result['callbackObj']['previewCertificateURL']
        policy.dmvic_api_request_number = preview_result.get('APIRequestNumber')
        policy.save()
    else:
        # Log error but don't block policy activation
        logger.error(f"DMVIC preview failed for {policy_number}: {preview_result.get('Error')}")
        
except Exception as e:
    logger.error(f"DMVIC integration error for {policy_number}: {str(e)}")
    # Continue with policy activation even if DMVIC fails
```

2. **Add to response documents** (around line ~1200):
```python
documents = {
    'policySchedule': schedule_url,
    'receipt': receipt_url,
    # NEW: Add certificate preview
    'certificatePreview': policy.dmvic_certificate_preview_url if hasattr(policy, 'dmvic_certificate_preview_url') else None,
}
```

### Phase 3: Add Database Fields

**File**: `insurance-app/app/models.py`

**Model**: `MotorPolicy`

Add these fields:
```python
# DMVIC Certificate Integration
dmvic_certificate_preview_url = models.URLField(max_length=1000, null=True, blank=True)
dmvic_certificate_number = models.CharField(max_length=100, null=True, blank=True, db_index=True)
dmvic_certificate_pdf_url = models.URLField(max_length=1000, null=True, blank=True)
dmvic_api_request_number = models.CharField(max_length=100, null=True, blank=True)
dmvic_issue_date = models.DateTimeField(null=True, blank=True)
dmvic_status = models.CharField(
    max_length=20,
    choices=[
        ('PENDING', 'Pending'),
        ('PREVIEW_GENERATED', 'Preview Generated'),
        ('ISSUED', 'Certificate Issued'),
        ('FAILED', 'Issuance Failed'),
        ('NO_INVENTORY', 'No Inventory'),
    ],
    default='PENDING',
    null=True,
    blank=True
)
```

**Migration Required**: Yes

### Phase 4: Add API Endpoints

**File**: `insurance-app/app/urls.py`

Add routes:
```python
# DMVIC Certificate Management
path('policies/motor/<str:policy_number>/certificate/preview/', views.get_dmvic_certificate_preview, name='dmvic_certificate_preview'),
path('policies/motor/<str:policy_number>/certificate/issue/', views.issue_dmvic_certificate, name='dmvic_certificate_issue'),
path('policies/motor/<str:policy_number>/certificate/status/', views.get_dmvic_certificate_status, name='dmvic_certificate_status'),
```

**File**: `insurance-app/app/views/policy_management.py` or new file `insurance-app/app/views/dmvic_views.py`

Add views:
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dmvic_certificate_preview(request, policy_number):
    """
    Get DMVIC certificate preview URL for a policy.
    If preview doesn't exist, generate it.
    """
    pass

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def issue_dmvic_certificate(request, policy_number):
    """
    Issue actual DMVIC certificate (consumes inventory).
    Should only be called after payment confirmation and policy activation.
    """
    pass

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dmvic_certificate_status(request, policy_number):
    """
    Check DMVIC certificate issuance status for a policy.
    Returns: PENDING, PREVIEW_GENERATED, ISSUED, FAILED, NO_INVENTORY
    """
    pass
```

### Phase 5: Frontend Integration (Motor3 Dashboard)

**Location**: Frontend screens showing policy details after payment

**Integration**:
1. After policy activation success, show certificate preview button
2. Display preview URL in modal/iframe or open in new tab
3. Show certificate status badge (Pending, Preview Available, Issued)
4. Add "Issue Certificate" button (for testing, will fail with ER006 until inventory allocated)

**API Calls**:
```javascript
// After policy activation
const response = await api.get(`/api/v1/policies/motor/${policyNumber}/certificate/status/`);
if (response.data.status === 'PREVIEW_GENERATED') {
  // Show preview button with URL
  showCertificatePreview(response.data.previewUrl);
}

// Manual certificate preview
const preview = await api.get(`/api/v1/policies/motor/${policyNumber}/certificate/preview/`);
window.open(preview.data.previewUrl, '_blank');

// Issue certificate (will fail with ER006 until DMVIC allocates inventory)
const issue = await api.post(`/api/v1/policies/motor/${policyNumber}/certificate/issue/`);
```

## Data Mapping: Motor3 → DMVIC

### Motor3Quotation.payload / MotorPolicy Fields → DMVIC Payload

```python
DMVIC_MAPPING = {
    # Policy & Policyholder
    'Membercompanyid': 97218,  # Hardcoded - our DMVIC account
    'policynumber': 'policy.policy_number',
    'Policyholder': 'policy.policyholder_name or payload.personalInfo.fullName',
    'InsuredPIN': 'policy.policyholder_pin or payload.personalInfo.idNumber',
    'Email': 'policy.policyholder_email or user.email',
    'Phonenumber': 'policy.policyholder_phone or payload.personalInfo.phoneNumber',
    'HudumaNumber': 'policy.huduma_number or payload.personalInfo.hudumaNumber',
    
    # Vehicle Details
    'Registrationnumber': 'policy.registration_number or payload.vehicleInfo.registrationNumber',
    'Chassisnumber': 'CLEAN(policy.chassis_number or payload.vehicleInfo.chassisNumber)',
    'Vehiclemake': 'policy.vehicle_make or payload.vehicleInfo.make',
    'Vehiclemodel': 'policy.vehicle_model or payload.vehicleInfo.model',
    'Yearofregistration': 'CONVERT_YEAR(policy.year_of_manufacture or payload.vehicleInfo.year)',
    'Yearofmanufacture': 'CONVERT_YEAR(policy.year_of_manufacture or payload.vehicleInfo.year)',
    'Enginenumber': 'policy.engine_number or payload.vehicleInfo.engineNumber',
    'Bodytype': 'policy.body_type or payload.vehicleInfo.bodyType',
    'Licensedtocarry': 'policy.seating_capacity or payload.vehicleInfo.seatingCapacity or 5',
    
    # Cover Details
    'TypeOfCertificate': 'DETERMINE_CERT_TYPE(body_type, coverage_type)',
    'Typeofcover': 'MAP_COVER_TYPE(policy.coverage_type)',  # COMPREHENSIVE→100, THIRD_PARTY→200
    'Commencingdate': 'FORMAT_DATE(policy.start_date)',  # YYYY-MM-DD → DD/MM/YYYY
    'Expiringdate': 'FORMAT_DATE(policy.end_date)',
    'SumInsured': 'policy.sum_insured or payload.premiumBreakdown.sumInsured',
}
```

## Testing Checklist

### Backend Testing
- [ ] DMVIC service methods return correct payload structure
- [ ] Vehicle data transformation (chassis cleaning, year conversion)
- [ ] Date formatting (YYYY-MM-DD → DD/MM/YYYY)
- [ ] Cover type mapping (COMPREHENSIVE → 100)
- [ ] Certificate type determination logic
- [ ] Error handling for DMVIC API failures
- [ ] Policy continues to activate even if DMVIC fails

### Integration Testing
- [ ] Create Motor3 quotation
- [ ] Convert to policy with payment
- [ ] Verify policy activation includes DMVIC preview generation
- [ ] Check database fields populated (dmvic_certificate_preview_url, etc.)
- [ ] Preview URL accessible and shows certificate PDF
- [ ] Preview URL expires after ~13 hours (expected behavior)

### API Endpoint Testing
- [ ] `GET /api/v1/policies/motor/{policy_number}/certificate/preview/` returns preview URL
- [ ] `GET /api/v1/policies/motor/{policy_number}/certificate/status/` returns correct status
- [ ] `POST /api/v1/policies/motor/{policy_number}/certificate/issue/` handles ER006 gracefully

### Frontend Testing
- [ ] Certificate preview button appears after policy activation
- [ ] Clicking preview opens PDF in new tab/iframe
- [ ] Certificate status badge displays correctly
- [ ] Error messages shown gracefully if DMVIC fails

## Known Limitations & Next Steps

### Current Limitations
1. **No Certificate Inventory**: Account has no PSV sticker inventory allocated
   - Preview works ✅
   - Validation passes (except ER006) ✅
   - Actual issuance will fail with ER006 until DMVIC allocates inventory ❌

2. **Certificate Type Authorization**: Only Type 8 (PSV/Taxi) authorized
   - Type 7 (Private) returns ER001 ❌
   - Type 9 (Commercial) returns ER001 ❌
   - Need to request DMVIC to enable other certificate types

3. **Preview URL Expiry**: Preview URLs expire after ~13 hours
   - Need to regenerate preview if accessed after expiry
   - Consider storing certificate PDF locally after issuance

### Action Items for DMVIC
1. **Request Certificate Inventory**:
   - Contact: DMVIC support
   - Request: Allocate PSV (Type 8) certificate stickers to Member ID 97218
   - Quantity: TBD based on expected volume

2. **Request Certificate Type Authorization**:
   - Enable Type 7 (Private) for private vehicles
   - Enable Type 9 (Commercial) for commercial vehicles
   - Current: Only Type 8 (PSV/Taxi) works

3. **Production Environment Setup**:
   - Production credentials
   - Production X509 certificate
   - SSL certificate verification (set DMVIC_SSL_VERIFY=true in production)

## Success Criteria

✅ **Phase 1 Complete**: DMVIC methods added to backend service
✅ **Phase 2 Complete**: Motor policy activation generates certificate preview
✅ **Phase 3 Complete**: Database fields added and migration applied
✅ **Phase 4 Complete**: API endpoints functional
✅ **Phase 5 Complete**: Frontend displays certificate preview after policy activation

## References

- DMVIC Documentation: `.github/dmvic documentation.txt`
- Test Scripts: `insurance-app/test_dmvic_*.py`
- DMVIC Service: `insurance-app/app/services/dmvic_service.py`
- Motor3 Flow: `insurance-app/app/views/motor3_quotations.py`
- Policy Management: `insurance-app/app/views/policy_management.py`

## Implementation Order

1. Add database fields to MotorPolicy model → Run migration
2. Implement DMVIC service methods (preview, issue, validate)
3. Add helper functions (_prepare_dmvic_payload, etc.)
4. Integrate preview generation in activate_motor_policy
5. Add API endpoints for certificate management
6. Update frontend to display preview button/link
7. Test end-to-end flow with Motor3 policy creation
8. Document ER006 limitation and next steps

---

**Status**: Ready for implementation
**Priority**: High - Required for production certificate issuance
**Blocked By**: DMVIC inventory allocation (for actual issuance, preview works now)
