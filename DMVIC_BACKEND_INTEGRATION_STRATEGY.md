# DMVIC Backend Integration Strategy
**PataBima Insurance Platform**  
*Integration Design Document*  
*Date: November 3, 2025*  
*API Version: DMVIC v1.8.0*

---

## Executive Summary

This document outlines the **best practice architecture** for integrating DMVIC certificate issuance with PataBima's existing Motor 2 policy creation flow while maintaining:

1. ✅ **Separation of Concerns**: DMVIC handles regulatory compliance, PataBima handles business logic
2. ✅ **Data Integrity**: Both systems store what they need independently
3. ✅ **Regulatory Compliance**: Policy activation BLOCKS until DMVIC certificate is issued (MANDATORY)
4. ✅ **Auditability**: Complete audit trail of DMVIC interactions
5. ✅ **Retry Resilience**: Automatic retries with exponential backoff for transient DMVIC failures

---

## Architecture Principles

### 1. **Payment-First, Certificate-Blocking Activation Pattern**

```
Phase 1: Create Policy (PENDING_PAYMENT status)
   ↓
Phase 2: Payment Confirmation (M-PESA/DPO webhook)
   ↓
Phase 3: Issue DMVIC Certificate (BLOCKING - retries up to 3 times)
   ↓
Phase 4: Activate Policy (ACTIVE status) - ONLY if certificate issued
```

**Rationale**: 
- **DMVIC certificate is MANDATORY** by Kenyan insurance regulation (not optional)
- Policy can be created in PENDING_PAYMENT state (no certificate needed yet)
- Payment must be confirmed BEFORE certificate issuance (DMVIC requires active cover)
- Certificate issuance BLOCKS policy activation (status stays PENDING_PAYMENT if DMVIC fails)
- Agent/client cannot receive active policy without valid DMVIC certificate
- Automatic retries (3 attempts with exponential backoff) handle transient failures
- If all retries fail, admin is alerted for manual intervention

---

### 2. **Field Mapping Strategy**

| Data Category | Stored in PataBima | Sent to DMVIC | Notes |
|---------------|-------------------|---------------|-------|
| **Premium Breakdown** | ✅ Full breakdown (base, levies, addons) | ❌ Not required | DMVIC doesn't need financial details |
| **Client Details** | ✅ Full KYC (ID, KRA, email, address) | ✅ Minimal (name, phone, email, PIN) | DMVIC needs identity only |
| **Vehicle Details** | ✅ Complete (color, engine, value, mileage) | ✅ Regulatory (reg, chassis, make, model, year, body type, capacity) | DMVIC needs identification + safety |
| **Policy Dates** | ✅ Cover start/end, issued date, renewal dates | ✅ Cover start/end only | DMVIC tracks coverage period |
| **Underwriter** | ✅ Full details (code, name, contact, commission) | ❌ Not required | DMVIC knows us as "PATABIMA" |
| **Payment Info** | ✅ Method, transaction ID, amount, status | ❌ Not required | DMVIC doesn't handle payments |
| **Documents** | ✅ Logbook, ID, KRA cert URLs | ❌ Not required | DMVIC doesn't store documents |
| **Addons** | ✅ All addon details (windscreen, PLL, etc.) | ⚠️ PLL only (for Type C/D) | DMVIC only cares about passenger liability |
| **Commission** | ✅ Agent code, commission %, amount | ❌ Not required | Internal PataBima calculation |

---

### 3. **Database Schema Design**

#### A. Existing `MotorPolicy` Model (Keep As-Is)

```python
class MotorPolicy(BaseModel):
    """PataBima's complete motor insurance policy"""
    
    # Policy identification
    policy_number = models.CharField(max_length=50, unique=True)  # POL-2025-123456
    quote_id = models.CharField(max_length=100)
    
    # Client, Vehicle, Product, Underwriter (JSON fields)
    client_details = models.JSONField()      # Full KYC data
    vehicle_details = models.JSONField()     # Complete vehicle info
    product_details = models.JSONField()     # Category, subcategory, coverage type
    underwriter_details = models.JSONField() # Selected underwriter with commission
    premium_breakdown = models.JSONField()   # Base + levies + addons
    payment_details = models.JSONField()     # Payment method, transaction ID
    addons = models.JSONField(default=list)  # Selected addons
    documents = models.JSONField(default=list) # Uploaded docs (logbook, ID, etc.)
    
    # Status and dates
    status = models.CharField()  # DRAFT, PENDING_PAYMENT, ACTIVE, EXPIRED
    cover_start_date = models.DateField()
    cover_end_date = models.DateField()
    
    # Generated documents
    policy_document_url = models.CharField()   # PataBima policy schedule PDF
    receipt_url = models.CharField()           # Payment receipt PDF
    certificate_url = models.CharField()       # DMVIC certificate PDF (NEW)
    
    # Renewals, extensions, metadata...
```

**Changes Needed**: ❌ **NONE** - Model is complete

---

#### B. NEW `DMVICCertificate` Model (Add This)

```python
class DMVICCertificate(BaseModel):
    """
    DMVIC certificate issuance tracking.
    Links PataBima policy to DMVIC regulatory certificate.
    """
    
    # Link to PataBima policy
    motor_policy = models.ForeignKey(
        MotorPolicy, 
        on_delete=models.PROTECT, 
        related_name='dmvic_certificates'
    )
    
    # DMVIC certificate details
    certificate_number = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True,
        help_text="DMVIC-assigned certificate number (e.g., CHB432123)"
    )
    certificate_type = models.CharField(
        max_length=1, 
        choices=[
            ('A', 'Type A - Third-Party'),
            ('B', 'Type B - Comprehensive'),
            ('C', 'Type C - Third-Party + PLL'),
            ('D', 'Type D - Comprehensive + PLL')
        ],
        help_text="Determined by product coverage type"
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
        db_index=True
    )
    
    # DMVIC API interaction tracking
    request_payload = models.JSONField(
        help_text="Exact payload sent to DMVIC API"
    )
    response_data = models.JSONField(
        null=True, 
        blank=True,
        help_text="DMVIC API response (success or error)"
    )
    
    # Certificate PDF
    dmvic_pdf_url = models.CharField(
        max_length=500, 
        null=True, 
        blank=True,
        help_text="URL to DMVIC-generated certificate PDF"
    )
    
    # QR code for verification
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
    cancelled_at = models.DateTimeField(
        null=True, 
        blank=True
    )
    cancellation_reason = models.TextField(blank=True)
    
    # Retry tracking for failed issuances
    retry_count = models.IntegerField(default=0)
    last_retry_at = models.DateTimeField(null=True, blank=True)
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
```

**Why Separate Model?**
1. ✅ **Clear separation**: PataBima business logic ≠ DMVIC compliance
2. ✅ **Audit trail**: Track all DMVIC API interactions independently
3. ✅ **Retry logic**: Can retry failed issuances without touching policy
4. ✅ **Multiple certificates**: One policy can have multiple certificates (renewal, replacement)
5. ✅ **Query efficiency**: Index on certificate_number for fast lookups

---

#### C. NEW `DMVICVehicleSearch` Model (Add This - Cache DMVIC Data)

```python
class DMVICVehicleSearch(BaseModel):
    """
    Cache DMVIC vehicle search results.
    Reduces API calls and stores vehicle verification history.
    """
    
    # Search criteria
    registration_number = models.CharField(
        max_length=20, 
        db_index=True,
        help_text="Vehicle registration number (e.g., KCA123A)"
    )
    
    # DMVIC response data
    vehicle_data = models.JSONField(
        help_text="Complete vehicle details from DMVIC"
    )
    
    # Search metadata
    searched_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='dmvic_searches'
    )
    search_timestamp = models.DateTimeField(auto_now_add=True)
    
    # Cache validity
    cache_expires_at = models.DateTimeField(
        help_text="When this cache entry expires (24 hours from search)"
    )
    
    # Double insurance check result
    has_existing_cover = models.BooleanField(
        default=False,
        help_text="True if DMVIC found existing active cover"
    )
    existing_cover_details = models.JSONField(
        null=True, 
        blank=True,
        help_text="Details of existing cover if found"
    )
    
    class Meta:
        ordering = ['-search_timestamp']
        verbose_name = 'DMVIC Vehicle Search'
        verbose_name_plural = 'DMVIC Vehicle Searches'
        indexes = [
            models.Index(fields=['registration_number', '-search_timestamp']),
        ]
    
    def __str__(self):
        return f"{self.registration_number} - {self.search_timestamp}"
    
    @property
    def is_cache_valid(self):
        """Check if cached data is still valid"""
### Flow 1: Motor 2 Policy Creation (Quote Stage - No DMVIC Yet)

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: PolicySubmission.js                                   │
│                                                                  │
│ 1. User completes Motor 2 flow (category, vehicle, pricing)     │
│ 2. User clicks "Submit Application"                             │
│ 3. Frontend calls: createMotorPolicy(policyData)                │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: create_motor_policy() API View                         │
│                                                                  │
│ 1. Validate request data                                        │
│ 2. Check authentication                                         │
│ 3. Generate policy number (POL-2025-XXXXXX)                     │
│ 4. Create MotorPolicy object                                    │
│    - Save client, vehicle, product, underwriter details         │
│    - Save premium breakdown                                     │
│    - Set status = PENDING_PAYMENT ⚠️                             │
│ 5. Save to database ✅                                           │
│ 6. Return success to frontend                                   │
│    - Policy number                                              │
│    - Payment reference (for M-PESA/DPO)                         │
│    - Amount to pay                                              │
│                                                                  │
│ ❌ NO DMVIC CERTIFICATE YET - Policy not active                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Key Points**:
- ✅ Policy created in PENDING_PAYMENT state (like a quote/application)
- ✅ No DMVIC certificate needed at this stage
- ✅ User receives payment instructions
- ⚠️ Policy is NOT active yet (no cover starts until payment + DMVIC cert)
```

**Key Design Decisions**:

1. ✅ **Policy creation NEVER fails due to DMVIC** - Policy is created first, certificate issued async
2. ✅ **Retry mechanism** - 3 retries with exponential backoff (5min, 15min, 1hr)
3. ✅ **Admin visibility** - Failed certificates appear in Django admin for manual review
4. ✅ **Client experience** - Client gets policy confirmation immediately, certificate email follows

---

### Flow 2: Payment Webhook → Policy Activation → DMVIC Issuance

```
┌─────────────────────────────────────────────────────────────────┐
│ PAYMENT GATEWAY: M-PESA / DPO Webhook Callback                  │
│                                                                  │
│ POST /api/v1/payments/callback/mpesa/                           │
│ {                                                               │
│   "ResultCode": "0",                                            │
│   "TransactionID": "QGH123XYZ",                                 │
│   "BillRefNumber": "POL-2025-123456"                            │
│ }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: payment_callback() View                                │
│                                                                  │
│ 1. Validate payment success (ResultCode == '0')                 │
│ 2. Extract transaction_id and policy_number                     │
│ 3. Find MotorPolicy by policy_number or quote_id                │
│ 4. Call policy.activate_policy(transaction_id)                  │
│    ↓                                                            │
│    MotorPolicy.activate_policy():                               │
│    - Change status: PENDING_PAYMENT → ACTIVE                    │
│    - Set cover_start_date (today or future date)                │
│    - Set cover_end_date (start + 365 days)                      │
│    - Update payment_details with transaction_id                 │
│    - Set approved_at = now()                                    │
│    - _generate_policy_document() → PDF                          │
│    - _send_confirmation_notifications() → Email                 │
│    - _create_commission_record() → Agent commission             │
│    ↓                                                            │
│ 5. Queue DMVIC certificate issuance (NOW - payment confirmed)   │
│    - issue_dmvic_certificate_task.delay(policy.id)              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
### Flow 2: Payment Webhook → DMVIC Issuance (BLOCKING) → Policy Activation

```
┌─────────────────────────────────────────────────────────────────┐
│ PAYMENT GATEWAY: M-PESA / DPO Webhook Callback                  │
│                                                                  │
│ POST /api/v1/payments/callback/mpesa/                           │
│ {                                                               │
│   "ResultCode": "0",                                            │
│   "TransactionID": "QGH123XYZ",                                 │
│   "BillRefNumber": "POL-2025-123456"                            │
│ }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: payment_callback() View (SYNCHRONOUS DMVIC CALL)       │
│                                                                  │
│ 1. Validate payment success (ResultCode == '0')                 │
│ 2. Extract transaction_id and policy_number                     │
│ 3. Find MotorPolicy by policy_number or quote_id                │
│ 4. Update payment_details with transaction_id                   │
│    - payment_details['transaction_id'] = transaction_id         │
│    - payment_details['status'] = 'CONFIRMED'                    │
│    - payment_details['confirmed_at'] = now()                    │
│    ⚠️ DO NOT ACTIVATE YET - Need DMVIC certificate first        │
│                                                                  │
│ 5. Issue DMVIC Certificate (BLOCKING CALL - CRITICAL)           │
│    ↓                                                            │
│    from app.services.dmvic_certificate_manager import ...       │
│    try:                                                         │
│        cert = DMVICCertificateManager.issue_certificate(policy) │
│        # ⏳ Waits for DMVIC API response (with 3 retries)       │
│        # Retry delays: 5 seconds, 15 seconds, 30 seconds        │
│        ✅ SUCCESS: cert.status = 'ISSUED'                        │
│           → Proceed to step 6                                   │
│    except DMVICAPIError as e:                                   │
│        ❌ ALL RETRIES FAILED:                                    │
│           - Log error to database                               │
│           - Send admin alert email                              │
│           - Return to frontend: status = 'PAYMENT_CONFIRMED'    │
│           - Frontend shows: "Payment received. Certificate      │
│             issuance pending. You'll receive email when ready." │
│           ⚠️ Policy stays in PENDING_PAYMENT (NOT ACTIVE)        │
│           - Admin must manually retry from Django admin         │
│                                                                  │
│ 6. Activate Policy (ONLY if DMVIC certificate issued)           │
│    ↓                                                            │
│    policy.activate_policy(transaction_id, dmvic_cert):          │
│    - Change status: PENDING_PAYMENT → ACTIVE ✅                  │
│    - Set cover_start_date (today or future date)                │
│    - Set cover_end_date (start + 365 days)                      │
│    - Link certificate: policy.certificate_url = cert.pdf_url    │
│    - Set approved_at = now()                                    │
│    - _generate_policy_document() → PataBima PDF                 │
│    - _send_confirmation_email() → Client + DMVIC cert attached  │
│    - _create_commission_record() → Agent commission             │
│                                                                  │
│ 7. Return webhook response to payment gateway                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**CRITICAL BUSINESS RULES**:

1. 🔴 **DMVIC certificate issuance is BLOCKING** - Webhook waits for DMVIC response
2. 🔴 **Policy activation REQUIRES valid DMVIC certificate** - No active policy without it
3. 🟡 **Retry mechanism**: 3 attempts with short delays (5s, 15s, 30s) for transient failures
4. 🟡 **If all retries fail**: 
   - Policy stays PENDING_PAYMENT (payment confirmed but not active)
   - Admin alerted for manual intervention
   - Client receives "Processing" email (not "Active" email)
5. ✅ **Manual retry available**: Admin can retry from Django admin panel
6. ✅ **Client protection**: Client NEVER receives active policy without DMVIC compliance
│        "chassis": "JTFSH3P26J3012345",                          │
│        "body_type": "SD" // From DMVIC                          │
│      },                                                         │
│      "existing_cover": {                                        │
│        "exists": false,                                         │
│        "policy": null                                           │
│      }                                                          │
│    }                                                            │
│ 6. Frontend auto-fills form fields with DMVIC data              │
│    - Make, Model, Year (locked - read-only)                     │
│    - Chassis number (locked - from logbook)                     │
│    - Body type (pre-selected dropdown)                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Cache Strategy**:
- ✅ **24-hour TTL**: Vehicle data doesn't change frequently
- ✅ **Per-registration caching**: Each vehicle cached independently
- ✅ **Query optimization**: Indexed on `registration_number`

---

## Service Layer Architecture

### 1. **DMVICFieldMapper** Service (NEW)

**Purpose**: Map PataBima policy data to DMVIC-compliant payload

**File**: `insurance-app/app/services/dmvic_field_mapper.py`

```python
class DMVICFieldMapper:
    """
    Maps PataBima MotorPolicy data to DMVIC API payload format.
    Handles field name conversions, date formatting, and enum mappings.
    """
    
    # Enum mappings
    TYPE_OF_CERTIFICATE = {
        'A': 7,  # Third-Party
        'B': 8,  # Comprehensive
        'C': 7,  # Third-Party + PLL (still Type A cert)
        'D': 8,  # Comprehensive + PLL (still Type B cert)
    }
    
    TYPE_OF_COVER = {
        'THIRD_PARTY': 200,
        'COMPREHENSIVE': 100,
        'TPTF': 300,  # Third-Party, Theft & Fire
    }
    
    VEHICLE_TYPE = {
        'PRIVATE': 1,
        'COMMERCIAL': 2,
        'PSV': 3,
        'MOTORCYCLE': 4,
        'TUKTUK': 5,
        'SPECIAL': 6,
    }
    
    @classmethod
    def map_to_dmvic_payload(cls, policy: MotorPolicy, cert_type: str) -> dict:
        """
        Convert MotorPolicy to DMVIC certificate payload.
        
        Args:
            policy: MotorPolicy instance
            cert_type: 'A', 'B', 'C', or 'D'
        
        Returns:
            dict: DMVIC-compliant payload
        """
        client = policy.client_details
        vehicle = policy.vehicle_details
        product = policy.product_details
        
        # Determine cover type from product details
        coverage_type = product.get('coverageType', '').upper()
        if 'COMPREHENSIVE' in coverage_type or 'COMP' in coverage_type:
            type_of_cover = cls.TYPE_OF_COVER['COMPREHENSIVE']
        elif 'TPTF' in coverage_type:
            type_of_cover = cls.TYPE_OF_COVER['TPTF']
        else:
            type_of_cover = cls.TYPE_OF_COVER['THIRD_PARTY']
        
        # Base payload (all certificate types)
        payload = {
            # Certificate metadata
            "TypeOfCertificate": cls.TYPE_OF_CERTIFICATE[cert_type],
            "TypeofCover": type_of_cover,
            
            # Policy holder
            "Policyholder": client.get('fullName', ''),
            "policynumber": policy.policy_number,
            "Phonenumber": cls._clean_phone(client.get('phone', '')),
            "Email": client.get('email', ''),
            "InsuredPIN": client.get('kraPin', ''),
            
            # Vehicle identification
            "RegistrationNumber": cls._clean_registration(vehicle.get('registration', '')),
            "Chassisnumber": vehicle.get('chassisNumber', ''),
            "Vehiclemake": vehicle.get('make', ''),
            "Vehiclemodel": vehicle.get('model', ''),
            "YearofManufacture": int(vehicle.get('year', 0)),
            "Enginenumber": vehicle.get('engineNumber', ''),
            
            # Vehicle classification
            "Bodytype": vehicle.get('bodyType', 'SD'),  # NEW FIELD
            "Licensedbodycty": int(vehicle.get('licensedCapacity', 0)),  # NEW FIELD
            
            # Cover period (DD/MM/YYYY format!)
            "CommencingDate": policy.cover_start_date.strftime('%d/%m/%Y'),
            "ExpiringDate": policy.cover_end_date.strftime('%d/%m/%Y'),
            
            # Optional fields
            "HudumNumber": client.get('hudumanumber', ''),
            "IntermediaryIRANumber": "",  # PataBima IRA number (if applicable)
        }
        
        # Add sum insured for Comprehensive (Type B/D)
        if cert_type in ['B', 'D']:
            payload["Suminsured"] = int(vehicle.get('value', 0))
        
        # Remove empty fields (DMVIC may reject nulls)
        return {k: v for k, v in payload.items() if v not in [None, '', 0]}
    
    @staticmethod
    def _clean_phone(phone: str) -> str:
        """Convert +254712345678 to 712345678"""
        digits = ''.join(filter(str.isdigit, phone))
        if digits.startswith('254'):
            return digits[3:]  # Remove country code
        if digits.startswith('0'):
            return digits[1:]  # Remove leading 0
        return digits
    
    @staticmethod
    def _clean_registration(reg: str) -> str:
        """KCA 123A → KCA123A"""
        return reg.replace(' ', '').upper()
```

**Usage**:
```python
# In background task
from app.services.dmvic_field_mapper import DMVICFieldMapper

policy = MotorPolicy.objects.get(pk=policy_id)
cert_type = 'A'  # Determined by coverage type

payload = DMVICFieldMapper.map_to_dmvic_payload(policy, cert_type)
dmvic_service.issue_type_a_certificate(payload)
```

---

### 2. **DMVICCertificateManager** Service (NEW)

**Purpose**: Handle certificate issuance, retries, and cancellation

**File**: `insurance-app/app/services/dmvic_certificate_manager.py`

```python
import logging
from typing import Optional, Dict, Any
from django.utils import timezone
from datetime import timedelta
from app.models import MotorPolicy, DMVICCertificate
from app.services.dmvic_service import get_dmvic_service, DMVICAPIError
from app.services.dmvic_field_mapper import DMVICFieldMapper

logger = logging.getLogger(__name__)


class DMVICCertificateManager:
    """
    Manages DMVIC certificate lifecycle: issuance, retries, cancellation.
    """
    
    @classmethod
    def determine_certificate_type(cls, policy: MotorPolicy) -> str:
        """
        Determine DMVIC certificate type from policy coverage.
        
        Returns:
            'A': Third-Party
            'B': Comprehensive
            'C': Third-Party + PLL
            'D': Comprehensive + PLL
        """
        product = policy.product_details
        coverage_type = product.get('coverageType', '').upper()
        addons = policy.addons
        
        # Check for PLL addon
        has_pll = any(
            addon.get('code') == 'PLL' or 'PASSENGER' in addon.get('name', '').upper()
            for addon in addons
        )
        
        # Determine base type
        if 'COMPREHENSIVE' in coverage_type or 'COMP' in coverage_type:
            return 'D' if has_pll else 'B'
        else:
            return 'C' if has_pll else 'A'
    
    @classmethod
    def issue_certificate(cls, policy: MotorPolicy, force_retry: bool = False) -> DMVICCertificate:
        """
        Issue DMVIC certificate for a motor policy.
        
        Args:
            policy: MotorPolicy instance
            force_retry: If True, retry even if previous attempt failed
        
        Returns:
            DMVICCertificate instance
        """
        logger.info(f"Issuing DMVIC certificate for policy {policy.policy_number}")
        
        # Check if certificate already exists
        existing_cert = DMVICCertificate.objects.filter(
            motor_policy=policy,
            status='ISSUED'
        ).first()
        
        if existing_cert and not force_retry:
            logger.info(f"Certificate already exists: {existing_cert.certificate_number}")
            return existing_cert
        
        # Determine certificate type
        cert_type = cls.determine_certificate_type(policy)
        logger.info(f"Certificate type: Type {cert_type}")
        
        # Map policy data to DMVIC payload
        payload = DMVICFieldMapper.map_to_dmvic_payload(policy, cert_type)
        
        # Create DMVICCertificate record
        dmvic_cert = DMVICCertificate.objects.create(
            motor_policy=policy,
            certificate_type=cert_type,
            status='PENDING',
            request_payload=payload
        )
        
        # Call DMVIC API
        dmvic_service = get_dmvic_service()
        
        try:
            # Call appropriate certificate issuance method
            if cert_type == 'A':
                response = dmvic_service.issue_type_a_certificate(payload)
            elif cert_type == 'B':
                response = dmvic_service.issue_type_b_certificate(payload)
            elif cert_type == 'C':
                # TODO: Implement Type C
                raise NotImplementedError("Type C certificates not yet implemented")
            elif cert_type == 'D':
                # TODO: Implement Type D
                raise NotImplementedError("Type D certificates not yet implemented")
            else:
                raise ValueError(f"Invalid certificate type: {cert_type}")
            
            # Update certificate record with success
            dmvic_cert.status = 'ISSUED'
            dmvic_cert.certificate_number = response.get('certificate_number')
            dmvic_cert.dmvic_pdf_url = response.get('pdf_url')
            dmvic_cert.qr_code_url = response.get('qr_code_url')
            dmvic_cert.response_data = response
            dmvic_cert.issued_at = timezone.now()
            dmvic_cert.save()
            
            # Update policy certificate URL
            policy.certificate_url = response.get('pdf_url')
            policy.save(update_fields=['certificate_url'])
            
            logger.info(f"✅ Certificate issued: {dmvic_cert.certificate_number}")
            
            # Send email to client with certificate
            cls._send_certificate_email(policy, dmvic_cert)
            
            return dmvic_cert
            
        except DMVICAPIError as e:
            # DMVIC API error - mark for retry
            logger.error(f"❌ DMVIC API error: {str(e)}")
            
            dmvic_cert.status = 'FAILED'
            dmvic_cert.error_message = str(e)
            dmvic_cert.retry_count += 1
            dmvic_cert.last_retry_at = timezone.now()
            dmvic_cert.response_data = {'error': str(e)}
            dmvic_cert.save()
            
            # Schedule retry if under limit
            if dmvic_cert.retry_count < 3:
                retry_delay = cls._calculate_retry_delay(dmvic_cert.retry_count)
                logger.info(f"Scheduling retry in {retry_delay} seconds")
                # TODO: Queue background task for retry
                # retry_dmvic_certificate.apply_async(
                #     args=[dmvic_cert.id], 
                #     countdown=retry_delay
                # )
            else:
                logger.error(f"Max retries reached for policy {policy.policy_number}")
                # TODO: Alert admin
            
            raise
        
        except Exception as e:
            # Unexpected error
            logger.exception(f"Unexpected error issuing certificate: {str(e)}")
            
            dmvic_cert.status = 'FAILED'
            dmvic_cert.error_message = f"Unexpected error: {str(e)}"
            dmvic_cert.save()
            
            raise
    
    @classmethod
    def cancel_certificate(cls, dmvic_cert: DMVICCertificate, reason: str) -> bool:
        """
        Cancel a DMVIC certificate.
        
        Args:
            dmvic_cert: DMVICCertificate instance
            reason: Cancellation reason
        
        Returns:
            bool: True if successful
        """
        if dmvic_cert.status != 'ISSUED':
            raise ValueError("Can only cancel issued certificates")
        
        dmvic_service = get_dmvic_service()
        
        try:
            response = dmvic_service.cancel_certificate(
                dmvic_cert.certificate_number,
                reason
            )
            
            dmvic_cert.status = 'CANCELLED'
            dmvic_cert.cancelled_at = timezone.now()
            dmvic_cert.cancellation_reason = reason
            dmvic_cert.save()
            
            logger.info(f"Certificate cancelled: {dmvic_cert.certificate_number}")
            return True
            
        except DMVICAPIError as e:
            logger.error(f"Failed to cancel certificate: {str(e)}")
            raise
    
    @staticmethod
    def _calculate_retry_delay(retry_count: int) -> int:
        """
        Calculate exponential backoff delay.
        
        Returns:
            int: Delay in seconds
        """
        delays = {
            1: 5 * 60,    # 5 minutes
            2: 15 * 60,   # 15 minutes
            3: 60 * 60,   # 1 hour
        }
        return delays.get(retry_count, 60 * 60)
    
    @staticmethod
    def _send_certificate_email(policy: MotorPolicy, dmvic_cert: DMVICCertificate):
        """Send certificate to client via email"""
        # TODO: Implement email sending
        logger.info(f"Sending certificate email to {policy.client_details.get('email')}")
        pass
```

---

## API Endpoint Changes

### 1. Add DMVIC Fields to Motor Policy Creation

**File**: `insurance-app/app/views/policy_management.py`

**Current**: `create_motor_policy()` accepts policy data, creates MotorPolicy

**Changes Needed**:

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_motor_policy(request):
    """
    Create a new motor insurance policy (PENDING_PAYMENT status).
    DMVIC certificate will be issued AFTER payment confirmation.
    """
    # ... existing validation ...
    
    # Create MotorPolicy (PENDING_PAYMENT status)
    policy = MotorPolicy.objects.create(
        policy_number=policy_number,
        user=request.user,
        client_details=client_details,
        vehicle_details=vehicle_details,
        status='PENDING_PAYMENT',  # ⚠️ NOT ACTIVE yet
        # ... rest of fields ...
    )
    
    # ❌ DO NOT issue DMVIC certificate here
    # Certificate will be issued in payment_callback() after payment confirmed
    
    # Return success with payment instructions
    return Response({
        'success': True,
        'policyNumber': policy.policy_number,
        'policyId': str(policy.id),
        'status': 'PENDING_PAYMENT',
        'paymentRequired': True,
        'amount': policy.premium_breakdown.get('total_amount'),
        'message': 'Policy created. Please complete payment to activate.'
    }, status=201)
---

### 2. NEW API Endpoint: Retry DMVIC Certificate

**Purpose**: Allow admins to manually retry failed certificate issuances

**Endpoint**: `POST /api/v1/dmvic/certificates/{certificate_id}/retry/`

```python
@api_view(['POST'])
@permission_classes([IsAdminUser])
def retry_dmvic_certificate(request, certificate_id):
    """
    Manually retry a failed DMVIC certificate issuance.
    Admin-only endpoint for troubleshooting.
    """
    try:
        dmvic_cert = DMVICCertificate.objects.get(pk=certificate_id)
        
        if dmvic_cert.status == 'ISSUED':
            return Response({
                'error': 'Certificate already issued'
            }, status=400)
        
        # Reset retry count and attempt issuance
        dmvic_cert.retry_count = 0
        dmvic_cert.save()
        
        from app.services.dmvic_certificate_manager import DMVICCertificateManager
        updated_cert = DMVICCertificateManager.issue_certificate(
            dmvic_cert.motor_policy,
            force_retry=True
        )
        
        return Response({
            'success': True,
            'certificate_number': updated_cert.certificate_number,
            'status': updated_cert.status
        })
        
    except DMVICCertificate.DoesNotExist:
        return Response({'error': 'Certificate not found'}, status=404)
    except Exception as e:
        logger.exception(f"Retry failed: {str(e)}")
        return Response({
            'error': str(e)
        }, status=500)
```

---

### 3. NEW API Endpoint: Get DMVIC Certificate Status

**Purpose**: Check certificate issuance status from frontend

**Endpoint**: `GET /api/v1/dmvic/certificates/policy/{policy_number}/`

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_policy_dmvic_certificate(request, policy_number):
    """
    Get DMVIC certificate status for a policy.
    Used by frontend to show certificate availability.
    """
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        dmvic_cert = DMVICCertificate.objects.filter(
            motor_policy=policy
        ).order_by('-date_created').first()
        
        if not dmvic_cert:
            return Response({
                'exists': False,
                'message': 'Certificate not yet issued'
            })
        
        return Response({
            'exists': True,
            'certificate_number': dmvic_cert.certificate_number,
            'status': dmvic_cert.status,
            'type': dmvic_cert.certificate_type,
            'pdf_url': dmvic_cert.dmvic_pdf_url,
            'issued_at': dmvic_cert.issued_at,
            'error_message': dmvic_cert.error_message if dmvic_cert.status == 'FAILED' else None
        })
        
    except MotorPolicy.DoesNotExist:
        return Response({'error': 'Policy not found'}, status=404)
```

---

## Frontend Integration Points

### 1. VehicleDetailsForm.js - Add DMVIC Fields

**NEW Fields to Add**:

```jsx
// Body Type Dropdown
<Picker
  selectedValue={formData.bodyType}
  onValueChange={(value) => handleFieldChange('bodyType', value)}
>
  <Picker.Item label="Sedan" value="SD" />
  <Picker.Item label="Station Wagon" value="SW" />
  <Picker.Item label="Bus" value="BT" />
  <Picker.Item label="Truck" value="TR" />
  <Picker.Item label="Pickup" value="PU" />
  <Picker.Item label="Van" value="VN" />
  <Picker.Item label="Motorcycle" value="MC" />
</Picker>

// Licensed Capacity (Tonnage or Passenger Count)
<TextInput
  label="Licensed Capacity"
  placeholder={isCommercial ? "Tonnage (tons)" : "Passenger Capacity"}
  keyboardType="numeric"
  value={formData.licensedCapacity}
  onChangeText={(value) => handleFieldChange('licensedCapacity', value)}
/>

// Huduma Number (Optional)
<TextInput
  label="Huduma Number (Optional)"
  placeholder="13-digit Huduma number"
  maxLength={13}
  keyboardType="numeric"
  value={formData.hudumanumber}
  onChangeText={(value) => handleFieldChange('hudumanumber', value)}
/>
```

---

### 2. PolicySubmission.js - Show Certificate Status

**Display DMVIC certificate status after policy creation**:

```jsx
const [certificateStatus, setCertificateStatus] = useState(null);

useEffect(() => {
  if (policyNumber) {
    // Poll for certificate status
    const checkCertificate = async () => {
      const status = await djangoAPI.getPolicyDMVICCertificate(policyNumber);
      setCertificateStatus(status);
    };
    
    const interval = setInterval(checkCertificate, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }
}, [policyNumber]);

// In render:
{certificateStatus?.exists && (
  <View style={styles.certificateCard}>
    {certificateStatus.status === 'ISSUED' ? (
      <>
        <Text style={styles.success}>✅ DMVIC Certificate Issued</Text>
        <Text>Certificate Number: {certificateStatus.certificate_number}</Text>
        <Button 
          title="Download Certificate" 
          onPress={() => downloadCertificate(certificateStatus.pdf_url)}
        />
      </>
    ) : certificateStatus.status === 'PENDING' ? (
      <Text style={styles.pending}>⏳ Certificate issuance in progress...</Text>
    ) : (
      <Text style={styles.error}>❌ Certificate issuance failed. Our team is working on it.</Text>
    )}
  </View>
)}
```

---

## Migration Plan

### Phase 1: Database Schema (Week 1)

1. ✅ Create Django migration for `DMVICCertificate` model
2. ✅ Create Django migration for `DMVICVehicleSearch` model
3. ✅ Run migrations on dev environment
4. ✅ Test model creation and relationships

```bash
cd insurance-app
python manage.py makemigrations
python manage.py migrate
```

---

### Phase 2: Service Layer (Week 1-2)

1. ✅ Create `dmvic_field_mapper.py` service
2. ✅ Create `dmvic_certificate_manager.py` service
3. ✅ Update `dmvic_service.py` with fixes from `DMVIC_CRITICAL_FIXES_REQUIRED.md`:
   - Add `ClientID` header
   - Fix Type A/B payloads
   - Fix date format
4. ✅ Write unit tests for field mapping
5. ✅ Test certificate issuance end-to-end

---

### Phase 3: API Endpoints (Week 2)

1. ✅ Add DMVIC certificate issuance to `create_motor_policy()`
2. ✅ Create `retry_dmvic_certificate()` endpoint
3. ✅ Create `get_policy_dmvic_certificate()` endpoint
4. ✅ Update API documentation

---

### Phase 4: Frontend Integration (Week 3)

1. ✅ Add DMVIC fields to `VehicleDetailsForm.js`
2. ✅ Update `PolicySubmission.js` to show certificate status
3. ✅ Add certificate download functionality
4. ✅ Test full Motor 2 flow with DMVIC

---

### Phase 5: Background Tasks (Week 4)

1. ✅ Set up Celery/Django-Q for async tasks
2. ✅ Create `issue_dmvic_certificate_task` background task
3. ✅ Create `retry_failed_certificates` periodic task
4. ✅ Configure retry logic and monitoring

---

## Testing Strategy

### Unit Tests

```python
# tests/test_dmvic_field_mapper.py
def test_map_third_party_policy():
    policy = MotorPolicyFactory(coverage_type='THIRD_PARTY')
    payload = DMVICFieldMapper.map_to_dmvic_payload(policy, 'A')
    
    assert payload['TypeOfCertificate'] == 7
    assert payload['TypeofCover'] == 200
    assert payload['CommencingDate'] == '03/11/2025'  # DD/MM/YYYY
    assert 'Suminsured' not in payload  # Not for Type A

def test_map_comprehensive_policy():
    policy = MotorPolicyFactory(coverage_type='COMPREHENSIVE', sum_insured=500000)
    payload = DMVICFieldMapper.map_to_dmvic_payload(policy, 'B')
    
    assert payload['TypeOfCertificate'] == 8
    assert payload['TypeofCover'] == 100
    assert payload['Suminsured'] == 500000
```

### Integration Tests

```python
# tests/test_dmvic_integration.py
def test_full_certificate_issuance():
    # Create active policy
    policy = MotorPolicy.objects.create(...)
    policy.status = 'ACTIVE'
    policy.save()
    
    # Issue certificate
    cert = DMVICCertificateManager.issue_certificate(policy)
    
    assert cert.status == 'ISSUED'
    assert cert.certificate_number is not None
    assert policy.certificate_url is not None
## Summary of Best Practices

1. ✅ **Separation of Concerns**: PataBima business logic ≠ DMVIC compliance
2. 🔴 **Regulatory Compliance**: DMVIC certificate REQUIRED before policy activation (BLOCKING)
3. ✅ **Payment-First Flow**: Policy created → Payment confirmed → DMVIC cert → Activation
4. ✅ **Retry Logic**: 3 attempts with short delays (5s, 15s, 30s) for transient DMVIC failures
5. ✅ **Audit Trail**: Complete history of DMVIC interactions in DMVICCertificate model
6. ✅ **Cache Strategy**: 24-hour vehicle search cache (DMVICVehicleSearch model)
7. ✅ **Field Mapping Service**: Centralized data transformation (DMVICFieldMapper)
8. ✅ **Type Safety**: TypeScript/Python type hints throughout
9. ✅ **Admin Visibility**: Django admin for manual retry of failed certificates
10. ✅ **Monitoring**: Track certificate issuance success rates and failures
11. 🔴 **Client Protection**: No active policy without valid DMVIC certificate (regulatory requirement)
    list_display = ['certificate_number', 'motor_policy', 'status', 'retry_count', 'issued_at']
    list_filter = ['status', 'certificate_type', 'date_created']
    search_fields = ['certificate_number', 'motor_policy__policy_number']
    readonly_fields = ['request_payload', 'response_data']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Highlight failed certificates
        return qs.select_related('motor_policy')
```

### Metrics to Track

1. **Certificate Issuance Success Rate**: `ISSUED / (ISSUED + FAILED)`
2. **Average Issuance Time**: Time from policy creation to certificate issued
3. **Retry Count Distribution**: How many certificates need 1, 2, 3 retries
4. **DMVIC API Uptime**: Track API availability

---

## Summary of Best Practices

1. ✅ **Separation of Concerns**: PataBima business logic ≠ DMVIC compliance
2. ✅ **Fault Tolerance**: Policy creation succeeds even if DMVIC is down
3. ✅ **Async Processing**: Certificate issuance happens in background
4. ✅ **Retry Logic**: 3 retries with exponential backoff
5. ✅ **Audit Trail**: Complete history of DMVIC interactions
6. ✅ **Cache Strategy**: 24-hour vehicle search cache
7. ✅ **Field Mapping Service**: Centralized data transformation
8. ✅ **Type Safety**: TypeScript/Python type hints throughout
9. ✅ **Admin Visibility**: Django admin for troubleshooting
10. ✅ **Monitoring**: Track success rates and failures

---

*End of Integration Strategy Document*
