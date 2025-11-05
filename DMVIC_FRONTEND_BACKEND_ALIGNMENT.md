# Frontend-Backend Alignment Analysis
**PataBima Motor Insurance Flow with DMVIC Integration**  
*Date: November 3, 2025*

---

## Executive Summary

This document maps the **10-step frontend flow** against the **existing backend implementation** to identify:
1. ✅ **What's Already Implemented** and working
2. ⚠️ **What Needs Adjustment** to align with DMVIC requirements
3. ❌ **What's Missing** and needs to be built

---

## Frontend Flow (Agent-Initiated via App)

### Step 1: Vehicle Type Selection Screen

**Frontend**: User chooses: Private / Commercial / PSV / Motorcycle / TukTuk

**Backend Status**: ✅ **FULLY IMPLEMENTED**

| Component | File | Status |
|-----------|------|--------|
| **Model** | `MotorCategory` | ✅ Complete (6 categories) |
| **API Endpoint** | `GET /api/v1/public_app/insurance/motor_categories/` | ✅ Working |
| **Handler** | `motor_flow.py::get_motor_categories()` | ✅ Returns all active categories |

**Notes**: No changes needed for DMVIC.

---

### Step 2: Select Insurance Type (Product/Subcategory)

**Frontend**: Agent selects TOR / Comprehensive / Third Party + Subcategory

**Backend Status**: ✅ **FULLY IMPLEMENTED**

| Component | File | Status |
|-----------|------|--------|
| **Model** | `MotorSubcategory` | ✅ Complete (60+ products) |
| **API Endpoint** | `GET /api/v1/public_app/insurance/subcategories/?category=PRIVATE` | ✅ Working |
| **Handler** | `motor_flow.py::get_subcategories()` | ✅ Returns filtered subcategories |
| **Pricing** | `MotorPricing`, `CommercialTonnagePricing` models | ✅ Complete |

**Notes**: No changes needed for DMVIC.

---

### Step 3: AKI/DMVIC Vehicle Verification

**Frontend**: 
- User inputs: Registration number + Chassis number
- Backend calls DMVIC/AKI API
- Returns: Vehicle details + insurance status

**Backend Status**: ⚠️ **PARTIALLY IMPLEMENTED** - Needs Enhancement

| Component | File | Status | DMVIC Alignment |
|-----------|------|--------|-----------------|
| **DMVIC Service** | `dmvic_service.py` | ✅ Exists | ⚠️ Needs fixes (see Critical Fixes doc) |
| **Vehicle Search** | `dmvic_service.py::search_vehicle()` | ✅ Implemented | ⚠️ Field mapping needs verification |
| **Double Insurance Check** | `dmvic_service.py::validate_double_insurance()` | ✅ Implemented | ⚠️ Response structure unknown |
| **Cache Model** | `DMVICVehicleSearch` | ✅ NEW - Just added | ✅ 24-hour TTL cache |
| **API Endpoint** | `POST /api/v1/integrations/vehicle_check` | ❌ **MISSING** | Need to create |

**Required Changes**:

```python
# NEW API Endpoint Needed
# File: insurance-app/app/views/motor_flow.py

@api_view(['POST'])
@permission_classes([AllowAny])  # Or IsAuthenticated
def verify_vehicle_with_dmvic(request):
    """
    Step 3: DMVIC Vehicle Verification
    
    Frontend sends:
    {
        "registration_number": "KCA123A",
        "chassis_number": "JTFSH3P26J3012345"  # Optional for validation
    }
    
    Returns:
    {
        "success": true,
        "vehicle": {
            "registration": "KCA123A",
            "chassis_number": "JTFSH3P26J3012345",
            "make": "Toyota",
            "model": "Fielder",
            "year": 2015,
            "engine_capacity": 1500,
            "body_type": "SD",  # NEW - for DMVIC
            "color": "SILVER"
        },
        "existing_cover": {
            "exists": true/false,
            "policy": {
                "certificate_number": "CHB432123",
                "insurer": "CIC Insurance",
                "cover_start": "2025-01-01",
                "cover_end": "2026-01-01"
            } or null
        },
        "cached": true  # Indicates data from cache
    }
    """
    registration = request.data.get('registration_number', '').strip().upper()
    chassis = request.data.get('chassis_number', '').strip().upper()
    
    if not registration:
        return Response({'error': 'Registration number required'}, status=400)
    
    # Check cache first (24-hour TTL)
    from app.models import DMVICVehicleSearch
    from datetime import timedelta
    
    cache_entry = DMVICVehicleSearch.objects.filter(
        registration_number=registration
    ).order_by('-search_timestamp').first()
    
    if cache_entry and cache_entry.is_cache_valid:
        # Return cached data
        return Response({
            'success': True,
            'vehicle': cache_entry.vehicle_data,
            'existing_cover': {
                'exists': cache_entry.has_existing_cover,
                'policy': cache_entry.existing_cover_details
            },
            'cached': True,
            'cached_at': cache_entry.search_timestamp.isoformat()
        })
    
    # Cache miss - call DMVIC
    from app.services.dmvic_service import get_dmvic_service
    dmvic = get_dmvic_service()
    
    try:
        # Search vehicle
        vehicle_data = dmvic.search_vehicle(registration)
        
        # Validate double insurance
        double_insurance = dmvic.validate_double_insurance(registration)
        
        # Optionally validate chassis number
        if chassis and vehicle_data.get('chassis_number') != chassis:
            return Response({
                'error': 'Chassis number mismatch',
                'expected': vehicle_data.get('chassis_number'),
                'provided': chassis
            }, status=400)
        
        # Cache the result
        DMVICVehicleSearch.objects.create(
            registration_number=registration,
            vehicle_data=vehicle_data,
            searched_by=request.user if request.user.is_authenticated else None,
            cache_expires_at=timezone.now() + timedelta(hours=24),
            has_existing_cover=double_insurance.get('exists', False),
            existing_cover_details=double_insurance.get('policy')
        )
        
        return Response({
            'success': True,
            'vehicle': vehicle_data,
            'existing_cover': double_insurance,
            'cached': False
        })
        
    except Exception as e:
        logger.error(f"DMVIC verification failed: {str(e)}")
        return Response({
            'error': str(e),
            'message': 'Vehicle verification failed. Please try again.'
        }, status=500)
```

**Frontend Integration**:
```javascript
// frontend/services/DjangoAPIService.js

async verifyVehicleWithDMVIC({ registration_number, chassis_number }) {
  const response = await this.makeRequest(
    '/api/v1/integrations/vehicle_check',
    {
      method: 'POST',
      body: JSON.stringify({ registration_number, chassis_number })
    }
  );
  
  return response.data;
}
```

---

### Step 4: Client and Policy Details Screen

**Frontend**: 
- Client name, ID, phone, email
- Policy start date, cover duration
- System auto-calculates premium

**Backend Status**: ✅ **FULLY IMPLEMENTED**

| Component | File | Status |
|-----------|------|--------|
| **MotorPolicy Model** | `models.py::MotorPolicy` | ✅ Stores all client details in `client_details` JSON |
| **Premium Calculation** | `motor_pricing_engine.py` | ✅ Complete with levies |
| **Pricing API** | `POST /api/v1/public_app/insurance/calculate_motor_premium/` | ✅ Working |
| **Comparison API** | `POST /api/v1/public_app/insurance/compare_motor_pricing/` | ✅ Working (multi-underwriter) |

**Notes**: No changes needed for DMVIC.

---

### Step 5: KYC Upload Screen

**Frontend**: 
- Upload documents: ID / KRA / Logbook / Certificate of Inspection
- Backend stores files in AWS S3 bucket
- KYC validation (manual or automated)

**Backend Status**: ✅ **FULLY IMPLEMENTED** (but needs DMVIC alignment)

| Component | File | Status | DMVIC Alignment |
|-----------|------|--------|-----------------|
| **DocumentUpload Model** | `models.py::DocumentUpload` | ✅ Complete with S3 support | ⚠️ Missing link to MotorPolicy |
| **Document Presign API** | `POST /api/v1/public_app/docs/presign` | ✅ Working (S3 presigned URLs) | ✅ OK |
| **Document Submit API** | `POST /api/v1/public_app/docs/submit` | ✅ Working (triggers Textract OCR) | ✅ OK |
| **OCR Status API** | `GET /api/v1/public_app/docs/status/{jobId}` | ✅ Working | ✅ OK |
| **OCR Result API** | `GET /api/v1/public_app/docs/result/{jobId}` | ✅ Working | ✅ OK |

**DMVIC Requirements**:

DMVIC doesn't need the actual document files, BUT it needs specific fields extracted from them:

| Document Type | Fields DMVIC Needs | Current OCR Status |
|---------------|-------------------|-------------------|
| **Logbook** | Chassis number, Engine number, Vehicle make/model | ✅ Textract extracts these |
| **National ID** | ID number, Full name | ✅ Textract extracts these |
| **KRA PIN** | KRA PIN number | ✅ Textract extracts this |

**Recommendation**: ✅ **No changes needed** - Current document pipeline extracts all required fields for DMVIC payload.

**Enhancement Needed**: Link `DocumentUpload` to `MotorPolicy`:

```python
# File: insurance-app/app/models.py

class DocumentUpload(BaseModel):
    quotation = models.ForeignKey(InsuranceQuotation, ...)  # Existing
    motor_policy = models.ForeignKey(  # NEW - Add this
        'MotorPolicy', 
        on_delete=models.CASCADE, 
        related_name='uploaded_documents',
        null=True,
        blank=True,
        help_text="Link to Motor 2 policy if applicable"
    )
    # ... rest of fields
```

---

### Step 6: Summary Screen

**Frontend**: 
- Shows full summary: Client, Vehicle, Cover period, Premium
- Confirmation button → "Proceed to Payment"

**Backend Status**: ✅ **FULLY IMPLEMENTED**

| Component | File | Status |
|-----------|------|--------|
| **MotorPolicy Model** | All data stored in JSON fields | ✅ Complete |
| **Policy Creation API** | `POST /api/v1/policies/motor/create/` | ✅ Working |

**DMVIC Alignment**: ✅ No changes needed. Summary screen is frontend-only display.

---

### Step 7: Payment Screen

**Frontend**: 
- M-PESA STK push / DPO / Card / PayPal
- On success: Generate receipt + Trigger DMVIC registration

**Backend Status**: ✅ **FULLY IMPLEMENTED** (needs DMVIC integration)

| Component | File | Status | DMVIC Alignment |
|-----------|------|--------|-----------------|
| **Payment Initiation** | `POST /api/v1/public_app/payments/initiate/` | ✅ Working | ✅ OK |
| **M-PESA Callback** | `POST /api/v1/payments/callback/mpesa/` | ✅ Working | ⚠️ **NEEDS DMVIC CALL** |
| **DPO Callback** | `POST /api/v1/payments/callback/dpo/` | ✅ Working | ⚠️ **NEEDS DMVIC CALL** |
| **Policy Activation** | `MotorPolicy.activate_policy()` | ✅ Working | ⚠️ **MUST BLOCK UNTIL DMVIC CERT** |

**CRITICAL CHANGE REQUIRED**:

```python
# File: insurance-app/app/views/payment_gateway.py

@api_view(['POST'])
@csrf_exempt
def mpesa_callback(request):
    """M-PESA payment callback - now includes DMVIC certificate issuance"""
    
    # ... existing payment validation code ...
    
    # Find policy
    policy = MotorPolicy.objects.get(policy_number=bill_ref_number)
    
    # Update payment details
    policy.payment_details['transaction_id'] = transaction_id
    policy.payment_details['status'] = 'CONFIRMED'
    policy.payment_details['confirmed_at'] = timezone.now().isoformat()
    policy.save()
    
    # ⚠️ DO NOT ACTIVATE POLICY YET - DMVIC FIRST
    
    # Issue DMVIC Certificate (BLOCKING with 3 retries)
    from app.services.dmvic_certificate_manager import DMVICCertificateManager
    
    try:
        dmvic_cert = DMVICCertificateManager.issue_certificate(policy)
        # ✅ SUCCESS - Certificate issued
        
        # NOW activate policy (status → ACTIVE)
        policy.activate_policy(
            transaction_id=transaction_id,
            dmvic_certificate=dmvic_cert
        )
        
        logger.info(f"✅ Policy {policy.policy_number} activated with DMVIC cert {dmvic_cert.certificate_number}")
        
    except DMVICAPIError as e:
        # ❌ DMVIC failed after 3 retries
        logger.error(f"DMVIC certificate issuance failed for {policy.policy_number}: {str(e)}")
        
        # Policy stays PENDING_PAYMENT (payment confirmed but not active)
        # Send "processing" email to client
        send_payment_confirmed_email(policy, pending_certificate=True)
        
        # Alert admin for manual retry
        send_admin_alert(
            subject=f"DMVIC Certificate Failed - {policy.policy_number}",
            message=f"Payment confirmed but certificate issuance failed. Manual retry required."
        )
    
    return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})
```

**Key Change**: Policy activation is **BLOCKED** until DMVIC certificate is issued.

---

### Step 8: Policy Issuance (Backend Automation)

**Frontend Expectation**: 
- Backend sends verified data to DMVIC API
- DMVIC returns: Policy number, Certificate URL, QR code

**Backend Status**: ⚠️ **NEEDS CRITICAL FIXES**

| Component | File | Status | DMVIC Alignment |
|-----------|------|--------|-----------------|
| **DMVIC Service** | `dmvic_service.py` | ✅ Exists | ❌ **CRITICAL BUGS** (see below) |
| **Type A Certificate** | `dmvic_service.py::issue_type_a_certificate()` | ✅ Implemented | ❌ Wrong payload structure |
| **Type B Certificate** | `dmvic_service.py::issue_type_b_certificate()` | ✅ Implemented | ❌ Wrong payload structure |
| **Type C Certificate** | N/A | ❌ **NOT IMPLEMENTED** | Third-Party + PLL |
| **Type D Certificate** | N/A | ❌ **NOT IMPLEMENTED** | Comprehensive + PLL |
| **Field Mapper** | `dmvic_field_mapper.py` | ✅ NEW - Just created | ✅ Correct mapping |
| **Certificate Manager** | `dmvic_certificate_manager.py` | ✅ NEW - Just created | ✅ BLOCKING issuance with retries |

**CRITICAL FIXES REQUIRED** (from `DMVIC_CRITICAL_FIXES_REQUIRED.md`):

1. ❌ **Missing ClientID Header**:
   ```python
   # Current (WRONG):
   headers = {"Authorization": f"Bearer {token}"}
   
   # Required:
   headers = {
       "Authorization": f"Bearer {token}",
       "ClientID": self.client_id  # ← ADD THIS
   }
   ```

2. ❌ **Wrong Date Format**:
   ```python
   # Current (WRONG):
   "coverStartDate": "2025-11-03"  # YYYY-MM-DD
   
   # Required:
   "CommencingDate": "03/11/2025"  # DD/MM/YYYY
   ```

3. ❌ **Missing 4 Mandatory Fields**:
   - `TypeOfCertificate`: 7 (Type A) or 8 (Type B)
   - `TypeofCover`: 100 (COMP) / 200 (TPO) / 300 (TPTF)
   - `Bodytype`: Vehicle body type code (e.g., "SD", "BT")
   - `Licensedbodycty`: Tonnage or passenger capacity

4. ❌ **6+ Field Name Mismatches**:
   - We send `chassisNumber` → DMVIC expects `Chassisnumber`
   - We send `insuredPhoneNumber` → DMVIC expects `Phonenumber`
   - We send `insuredKraPin` → DMVIC expects `InsuredPIN`
   - etc.

5. ❌ **Sending 12+ Extra Fields** DMVIC doesn't want (premiumAmount, itlLevy, etc.)

**Solution**: Use the new `DMVICFieldMapper` service (already created) which handles all these fixes.

---

### Step 9: Certificate & Notification

**Frontend Expectation**: 
- App shows success notification
- Certificate downloadable (PDF with QR)
- Email + SMS to client

**Backend Status**: ⚠️ **PARTIALLY IMPLEMENTED**

| Component | File | Status | DMVIC Alignment |
|-----------|------|--------|-----------------|
| **DMVICCertificate Model** | `models.py::DMVICCertificate` | ✅ NEW - Just added | ✅ Stores cert number, PDF URL, QR |
| **Email Service** | `email_service.py` | ✅ Exists | ⚠️ Needs DMVIC cert attachment |
| **SMS Service** | ❌ **NOT IMPLEMENTED** | Need to add | AfricasTalking or similar |
| **Push Notifications** | ❌ **NOT IMPLEMENTED** | Optional | Expo Push Notifications |

**Required Changes**:

```python
# File: insurance-app/app/services/email_service.py

def send_policy_activation_email(policy: MotorPolicy, dmvic_cert: DMVICCertificate):
    """
    Send policy activation email with DMVIC certificate attachment
    """
    client_email = policy.client_details.get('email')
    
    context = {
        'client_name': policy.client_details.get('fullName'),
        'policy_number': policy.policy_number,
        'certificate_number': dmvic_cert.certificate_number,
        'cover_start': policy.cover_start_date,
        'cover_end': policy.cover_end_date,
        'vehicle_registration': policy.vehicle_details.get('registration'),
        'certificate_url': dmvic_cert.dmvic_pdf_url,
        'qr_code_url': dmvic_cert.qr_code_url
    }
    
    # Render email template
    html_content = render_to_string('emails/policy_activation.html', context)
    
    # Download DMVIC certificate PDF
    cert_pdf = download_pdf_from_url(dmvic_cert.dmvic_pdf_url)
    
    # Send email with attachment
    send_mail(
        subject=f'Your Motor Insurance Policy is Active - {policy.policy_number}',
        message='',
        html_message=html_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[client_email],
        attachments=[
            ('DMVIC_Certificate.pdf', cert_pdf, 'application/pdf')
        ]
    )
```

**SMS Integration** (NEW - needs implementation):

```python
# File: insurance-app/app/services/sms_service.py

import requests
from django.conf import settings

def send_policy_activation_sms(policy: MotorPolicy, dmvic_cert: DMVICCertificate):
    """
    Send SMS notification via Africa's Talking or similar
    """
    phone = policy.client_details.get('phone')  # +254712345678
    
    message = (
        f"Your motor insurance policy {policy.policy_number} is now active! "
        f"DMVIC Certificate: {dmvic_cert.certificate_number}. "
        f"Download certificate: {settings.FRONTEND_URL}/certificate/{dmvic_cert.id}"
    )
    
    # TODO: Integrate with SMS provider (AfricasTalking, Twilio, etc.)
    # For now, just log
    logger.info(f"SMS to {phone}: {message}")
```

---

### Step 10: Receipt & Dashboard

**Frontend Expectation**: 
- View active policies
- Download certificate
- View receipts and expiry reminders

**Backend Status**: ✅ **FULLY IMPLEMENTED**

| Component | File | Status |
|-----------|------|--------|
| **List Policies API** | `GET /api/v1/policies/motor/` | ✅ Working |
| **Get Policy API** | `GET /api/v1/policies/motor/{policy_number}/` | ✅ Working |
| **Renewals API** | `GET /api/v1/policies/motor/upcoming-renewals/` | ✅ Working |
| **Extensions API** | `GET /api/v1/policies/motor/upcoming-extensions/` | ✅ Working |

**DMVIC Enhancement Needed**:

```python
# File: insurance-app/app/views/policy_management.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_motor_policy(request, policy_number):
    """
    Get policy details (now includes DMVIC certificate info)
    """
    policy = MotorPolicy.objects.get(
        policy_number=policy_number,
        user=request.user
    )
    
    # Get DMVIC certificate
    dmvic_cert = DMVICCertificate.objects.filter(
        motor_policy=policy,
        status='ISSUED'
    ).first()
    
    response_data = {
        'policy_number': policy.policy_number,
        'client_details': policy.client_details,
        'vehicle_details': policy.vehicle_details,
        'status': policy.status,
        'cover_start_date': policy.cover_start_date,
        'cover_end_date': policy.cover_end_date,
        # ... rest of policy data ...
        
        # DMVIC certificate info (NEW)
        'dmvic_certificate': {
            'certificate_number': dmvic_cert.certificate_number,
            'pdf_url': dmvic_cert.dmvic_pdf_url,
            'qr_code_url': dmvic_cert.qr_code_url,
            'issued_at': dmvic_cert.issued_at,
            'type': dmvic_cert.certificate_type
        } if dmvic_cert else None
    }
    
    return Response(response_data)
```

---

## Missing Components Summary

### 🔴 CRITICAL (Must Fix for DMVIC)

1. **Fix DMVIC Service**:
   - File: `insurance-app/app/services/dmvic_service.py`
   - Add `ClientID` header to all authenticated requests
   - Fix Type A/B certificate payloads (use `DMVICFieldMapper`)
   - Fix date format (DD/MM/YYYY)
   - Remove extra fields

2. **Update Payment Callback**:
   - File: `insurance-app/app/views/payment_gateway.py`
   - Add DMVIC certificate issuance BEFORE policy activation
   - Block activation if DMVIC fails
   - Send appropriate emails based on success/failure

3. **Create Vehicle Verification Endpoint**:
   - File: `insurance-app/app/views/motor_flow.py`
   - New endpoint: `POST /api/v1/integrations/vehicle_check`
   - Returns vehicle data + existing cover status from DMVIC

### 🟡 HIGH PRIORITY (Needed Soon)

4. **Add SMS Notification Service**:
   - File: `insurance-app/app/services/sms_service.py` (NEW)
   - Integrate AfricasTalking or similar
   - Send SMS on policy activation

5. **Enhance Email Service**:
   - File: `insurance-app/app/services/email_service.py`
   - Add DMVIC certificate PDF attachment
   - Update email templates with certificate links

6. **Link DocumentUpload to MotorPolicy**:
   - File: `insurance-app/app/models.py`
   - Add `motor_policy` ForeignKey to `DocumentUpload` model
   - Migration needed

### 🟢 MEDIUM PRIORITY (Future Enhancement)

7. **Implement Type C/D Certificates**:
   - File: `insurance-app/app/services/dmvic_service.py`
   - Add `issue_type_c_certificate()` (Third-Party + PLL)
   - Add `issue_type_d_certificate()` (Comprehensive + PLL)

8. **Add Push Notifications**:
   - Expo Push Notifications for policy activation
   - In-app notification center

---

## Migration Plan

### Phase 1: Critical Fixes (Week 1 - Days 1-3)

**Day 1**: Fix DMVIC Service
- Apply fixes from `DMVIC_CRITICAL_FIXES_REQUIRED.md`
- Test Type A/B certificate issuance with DMVIC UAT
- Verify certificate PDFs download correctly

**Day 2**: Update Payment Flow
- Modify payment callback to include DMVIC issuance
- Test payment → DMVIC → activation flow
- Handle failure scenarios (DMVIC down, retry exhausted)

**Day 3**: Create Vehicle Verification Endpoint
- Build `/api/v1/integrations/vehicle_check` endpoint
- Test with DMVIC vehicle search
- Implement 24-hour caching

### Phase 2: Notifications & Polish (Week 1 - Days 4-5)

**Day 4**: Email Enhancements
- Update policy activation email template
- Add DMVIC certificate PDF attachment
- Test email delivery

**Day 5**: SMS Integration
- Set up AfricasTalking account
- Implement SMS sending service
- Test SMS delivery

### Phase 3: Testing & Deployment (Week 2)

**Day 6-7**: End-to-End Testing
- Test complete Motor 2 flow (Steps 1-10)
- Verify DMVIC integration at each step
- Load testing with multiple concurrent requests

**Day 8-9**: Bug Fixes & Refinements
- Address issues found in testing
- Performance optimization
- Error handling improvements

**Day 10**: Production Deployment
- Deploy to EC2
- Monitor DMVIC API calls
- Verify certificate issuance in production

---

## Database Migrations Required

```bash
cd insurance-app

# 1. Add new DMVIC models
python manage.py makemigrations --name add_dmvic_models

# 2. Link DocumentUpload to MotorPolicy
python manage.py makemigrations --name link_documents_to_motor_policy

# 3. Run migrations
python manage.py migrate

# 4. Verify
python manage.py dbshell
> SELECT * FROM app_dmviccertificate LIMIT 1;
> SELECT * FROM app_dmvicvehiclesearch LIMIT 1;
```

---

## Testing Checklist

### Pre-DMVIC (Existing Flow)
- [ ] Create policy with category selection
- [ ] Calculate premium correctly
- [ ] Upload documents (S3 + Textract)
- [ ] Process payment (M-PESA)
- [ ] Activate policy

### Post-DMVIC (New Flow)
- [ ] Verify vehicle with DMVIC
- [ ] Check for existing cover
- [ ] Issue DMVIC certificate on payment
- [ ] Block policy activation if DMVIC fails
- [ ] Retry mechanism works (3 attempts)
- [ ] Admin alert sent on failure
- [ ] Certificate PDF downloadable
- [ ] Email sent with certificate
- [ ] SMS sent with policy number
- [ ] Dashboard shows certificate info

---

## Alignment Summary

| Frontend Step | Backend Status | DMVIC Alignment | Action Required |
|--------------|---------------|-----------------|-----------------|
| 1. Vehicle Type Selection | ✅ Complete | ✅ N/A | None |
| 2. Select Insurance Type | ✅ Complete | ✅ N/A | None |
| 3. DMVIC Verification | ⚠️ Partial | ⚠️ Needs endpoint | **Create API endpoint** |
| 4. Client & Policy Details | ✅ Complete | ✅ OK | None |
| 5. KYC Upload | ✅ Complete | ✅ OK | Optional: Link docs to policy |
| 6. Summary Screen | ✅ Complete | ✅ N/A | None |
| 7. Payment | ✅ Complete | ❌ Missing DMVIC | **Update callback** |
| 8. Policy Issuance | ⚠️ Exists | ❌ Critical bugs | **Fix DMVIC service** |
| 9. Certificate & Notification | ⚠️ Partial | ⚠️ Missing SMS | **Add SMS service** |
| 10. Dashboard | ✅ Complete | ⚠️ Needs cert info | **Enhance API response** |

**Overall Alignment**: **65% Complete** - Need critical fixes (35% work remaining)

---

*End of Frontend-Backend Alignment Analysis*
