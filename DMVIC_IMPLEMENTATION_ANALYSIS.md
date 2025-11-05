# DMVIC Integration Implementation Analysis
**PataBima Motor Insurance System**  
*Analysis Date: November 3, 2025*

---

## Executive Summary

This document provides a comprehensive analysis of the current DMVIC (Department of Motor Vehicle Insurance Coordinator) integration within the PataBima insurance platform, comparing it against the official DMVIC API specification and providing actionable recommendations for achieving full compliance and operational readiness.

### Current Status: ⚠️ **INCOMPLETE IMPLEMENTATION**

- **Frontend**: Simulation-only mode (no real DMVIC API calls)
- **Backend**: Mock/simulation endpoints only
- **Credentials**: UAT certificate present but unused
- **API Integration**: Not implemented
- **DMVIC Endpoints**: Missing critical vehicle search and certificate issuance flows

---

## 1. DMVIC Official API Structure

Based on the official DMVIC API documentation provided, the system should support:

### 1.1 Core API Sections

#### **Authentication & Security**
- **4.1 DMVIC Login API** - OAuth/Token-based authentication
- Certificate-based authentication using `.pfx` client certificates
- Username/Password authentication for member company portals

#### **Vehicle Search & Verification**
- **4.2.1 Vehicle Search - Member Company** - Primary vehicle lookup by registration

#### **Certificate Operations**

**Type A Certificates (Third-Party Only)**
- **4.4.1** For Type A certificates - Member Company (Issue)
- **4.4.9** Preview Type A certificates - Member Company
- **4.9.1** Validate Type A certificates - Member Company

**Type B Certificates (Comprehensive)**
- **4.4.2** For Type B certificates - Member Company (Issue)
- **4.4.10** Preview Type B certificates - Member Company
- **4.9.2** Validate Type B certificates - Member Company

**Type C Certificates (Third-Party + PLL/Passenger Legal Liability)**
- **4.4.3** For Type C certificates - Member Company (Issue)
- **4.4.11** Preview Type C certificates - Member Company
- **4.9.3** Validate Type C certificates - Member Company

**Type D Certificates (Comprehensive + PLL)**
- **4.4.4** For Type D certificates - Member Company (Issue)
- **4.4.12** Preview Type D certificates - Member Company
- **4.9.4** Validate Type D certificates - Member Company

**Bulk Operations**
- **4.4.5** For Type A Bulk Issuance - Member Company
- **4.4.6** For Type B Bulk Issuance - Member Company
- **4.4.7** For Type C Bulk Issuance - Member Company
- **4.4.8** For Type D Bulk Issuance - Member Company

**Aviation Certificates**
- **4.4.13** Preview Aviation Certificate - Member Company
- **4.4.14** Issue Aviation Certificate - Member Company
- **4.9.5** Validate Aviation certificates - Member Company

#### **Certificate Management**
- **4.5** Get Certificate PDF (Download issued certificates)
- **4.6** Verification of certificates (Validate authenticity)
- **4.7** Cancel a Certificate (Debit note processing)
- **4.8** Certificates Inventory - Member Company (View all issued certs)
  - **4.8.1** Member company Stock (Company's own certificates)
  - **4.8.2** Intermediary Stock (Agent/broker certificates)
- **4.10** Bulk Issuance Status (Track bulk operations)
- **4.11** Validate Double Insurance (Check for existing cover)
- **4.12** Sticker Certificates - Intermediary (Physical sticker management)
  - **4.12.1** For Type A certificates-Intermediary
  - **4.12.2** For Type B certificates-Intermediary
  - **4.12.3** For Type C certificates-Intermediary
  - **4.12.4** For Type D certificates-Intermediary
  - **4.12.5** For Type A Bulk Issuance-Intermediary

#### **Data Synchronization**
- **4.3** Data Feed From DMVIC to Member Companies (Batch updates)

---

## 2. Current Implementation Analysis

### 2.1 Backend Implementation (`insurance-app`)

#### **File Structure**
```
insurance-app/
├── dmvic_credentials/
│   ├── PatabimaAgencyUAT.pfx      ✅ Present (UAT certificate)
│   ├── Password.txt                ✅ Present (Certificate password)
│   └── README.md                   ✅ Present (Setup documentation)
├── app/
│   ├── models.py
│   │   └── dmvic_data field        ⚠️ Generic JSONField (not structured)
│   ├── views/
│   │   └── vehicle_validation.py  ❌ SIMULATION ONLY (Mock data)
│   └── urls_motor.py
│       └── /vehicle/validate-*     ⚠️ Routes to simulation, not DMVIC
└── app/services/                   ❌ MISSING (No DMVIC service module)
```

#### **Current Backend Endpoints**

| Endpoint | Purpose | Implementation Status |
|----------|---------|----------------------|
| `/vehicle/validate-registration/` | Validate vehicle by reg number | ❌ Simulation only (mock data) |
| `/vehicle/validate-chassis/` | Validate vehicle by chassis | ❌ Simulation only (mock data) |

**`vehicle_validation.py` Analysis:**
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_vehicle_registration(request):
    """
    Simulate AKI/NTSA vehicle validation service
    """
    registration = request.data.get('registration_number', '').upper()
    
    # ❌ ISSUE: Returns mock data, not real DMVIC API call
    mock_vehicles = {
        'KDD123A': { ... },
        'KCA456B': { ... }
    }
    
    # ❌ ISSUE: Simulates network delay with time.sleep(1)
    # ❌ ISSUE: Returns 'AKI_SIMULATION' source tag
```

**Critical Gaps:**
1. **No DMVIC API client implementation** - No service layer to call real DMVIC endpoints
2. **No certificate authentication** - `.pfx` file is unused
3. **No DMVIC login** - No token acquisition workflow
4. **No double insurance check** - Missing endpoint 4.11 (Validate Double Insurance)
5. **No certificate issuance** - Missing Type A/B/C/D certificate creation

---

### 2.2 Frontend Implementation (`frontend`)

#### **File Structure**
```
frontend/
├── screens/quotations/Motor 2/MotorInsuranceFlow/
│   ├── VehicleVerification/
│   │   └── VehicleVerificationScreen.js  ⚠️ UI only (no API integration)
│   └── MotorInsuranceScreen.js          ⚠️ DMVIC simulation enabled
├── services/
│   ├── DMVICServicesAPI.js              ❌ Incomplete (placeholder methods)
│   └── DjangoAPIService.js              ⚠️ No DMVIC-specific methods
```

#### **Current Frontend Integration**

**`MotorInsuranceScreen.js` Analysis:**
```javascript
// ❌ ISSUE: Simulation mode is hardcoded to TRUE
const USE_DMVIC_SIMULATION = true; // Toggle this to enable/disable simulation

// ❌ ISSUE: Simulated response returns fake data
const SIMULATED_DMVIC_RESPONSE = {
  exists: false,  // Always returns "no existing cover"
  policy: {
    vehicle_registration: 'KDN 423IA',
    certificate_number: 'CHB432123',
    insurer: 'CIC',
    expiry_date: '13/04/2026'
  }
};

// ❌ ISSUE: Conditional check never calls real API
if (USE_DMVIC_SIMULATION) {
  const response = { ...SIMULATED_DMVIC_RESPONSE };  // Always simulated
  setExistingCoverData(response);
} else {
  // This block is NEVER executed
  const vehicleCheckData = await djangoAPI.vehicleCheck({
    registration_number: vehicleDetails.registration
  });
}
```

**`DMVICServicesAPI.js` Analysis:**
```javascript
class DMVICServicesAPI {
  constructor() {
    // ❌ ISSUE: Hardcoded to Android emulator URL
    this.baseURL = 'http://10.0.2.2:8000/api'; // Should use environment variable
  }

  // ⚠️ PARTIAL: Has methods for certificate retrieval
  async getCertificates(filters = {}) { ... }  // Calls /dmvic/certificates/
  
  // ❌ MISSING: No vehicle search method
  // ❌ MISSING: No certificate issuance methods (Type A/B/C/D)
  // ❌ MISSING: No double insurance validation
  // ❌ MISSING: No certificate PDF download
  // ❌ MISSING: No certificate cancellation (debit note)
}
```

**Critical Gaps:**
1. **Simulation mode permanently enabled** - No production DMVIC integration
2. **No vehicle search API call** - Missing DMVIC endpoint 4.2.1
3. **No certificate issuance flow** - Missing Type A/B/C/D workflows
4. **No double insurance check** - Cannot validate existing cover from DMVIC
5. **UI components disconnected** - `VehicleVerificationScreen.js` displays mock data

---

## 3. Gap Analysis: Required vs. Implemented

### 3.1 DMVIC API Compliance Matrix

| DMVIC Feature | Required | Implemented | Status | Priority |
|---------------|----------|-------------|--------|----------|
| **Authentication** |
| 4.1 DMVIC Login API | ✅ Yes | ❌ No | Not implemented | 🔴 CRITICAL |
| Certificate-based auth (.pfx) | ✅ Yes | ❌ No | Certificate unused | 🔴 CRITICAL |
| Token management | ✅ Yes | ❌ No | No token storage | 🔴 CRITICAL |
| **Vehicle Search** |
| 4.2.1 Vehicle Search - Member Company | ✅ Yes | ❌ No | Simulation only | 🔴 CRITICAL |
| **Certificate Issuance** |
| 4.4.1 Type A (Third-Party) | ✅ Yes | ❌ No | Not implemented | 🔴 CRITICAL |
| 4.4.2 Type B (Comprehensive) | ✅ Yes | ❌ No | Not implemented | 🔴 CRITICAL |
| 4.4.3 Type C (TP + PLL) | ⚠️ Optional | ❌ No | Not implemented | 🟡 MEDIUM |
| 4.4.4 Type D (Comp + PLL) | ⚠️ Optional | ❌ No | Not implemented | 🟡 MEDIUM |
| 4.4.5-8 Bulk Issuance (A/B/C/D) | ⚠️ Optional | ❌ No | Not implemented | 🟢 LOW |
| **Certificate Management** |
| 4.5 Get Certificate PDF | ✅ Yes | ⚠️ Partial | Placeholder method | 🔴 CRITICAL |
| 4.6 Verification of certificates | ✅ Yes | ❌ No | Not implemented | 🔴 CRITICAL |
| 4.7 Cancel a Certificate | ✅ Yes | ❌ No | Debit note missing | 🟠 HIGH |
| 4.8 Certificates Inventory | ✅ Yes | ⚠️ Partial | Backend method exists | 🟠 HIGH |
| **Validation** |
| 4.9.1 Validate Type A | ✅ Yes | ❌ No | Not implemented | 🔴 CRITICAL |
| 4.9.2 Validate Type B | ✅ Yes | ❌ No | Not implemented | 🔴 CRITICAL |
| 4.11 Validate Double Insurance | ✅ Yes | ❌ No | MISSING - blocks issuance | 🔴 CRITICAL |
| **Preview (Pre-issuance)** |
| 4.4.9 Preview Type A | ⚠️ Optional | ❌ No | Not implemented | 🟡 MEDIUM |
| 4.4.10 Preview Type B | ⚠️ Optional | ❌ No | Not implemented | 🟡 MEDIUM |
| **Data Synchronization** |
| 4.3 Data Feed From DMVIC | ⚠️ Optional | ❌ No | Not implemented | 🟢 LOW |
| **Bulk Operations** |
| 4.10 Bulk Issuance Status | ⚠️ Optional | ❌ No | Not implemented | 🟢 LOW |

### 3.2 Compliance Score

**Overall DMVIC Compliance: 12% (3/25 features partially implemented)**

- ✅ **Fully Implemented**: 0/25 (0%)
- ⚠️ **Partially Implemented**: 3/25 (12%) - Certificate retrieval placeholders only
- ❌ **Not Implemented**: 22/25 (88%)

**Critical Path Missing Features** (Blocking Production):
1. DMVIC Login & Authentication (4.1)
2. Vehicle Search API (4.2.1)
3. Double Insurance Validation (4.11)
4. Type A Certificate Issuance (4.4.1)
5. Type B Certificate Issuance (4.4.2)
6. Certificate PDF Download (4.5)
7. Certificate Verification (4.6)

---

## 4. Kenyan Motor Insurance Certificate Requirements

### 4.1 Certificate Types Mapping

Based on Kenyan insurance regulations and DMVIC structure:

| DMVIC Type | Kenyan Term | PataBima Products | Use Case |
|------------|-------------|-------------------|----------|
| **Type A** | Third-Party Only | Private Third-Party, Commercial Third-Party, PSV Third-Party | Minimum legal requirement (Act Only) |
| **Type B** | Comprehensive | Private Comprehensive, Commercial Comprehensive | Full cover (own damage + third-party) |
| **Type C** | Third-Party + PLL | PSV with Passenger Legal Liability | Public transport with passenger cover |
| **Type D** | Comprehensive + PLL | PSV Comprehensive + PLL | Full PSV cover with passenger liability |

### 4.2 Mandatory Certificate Fields (Kenyan Requirements)

Per IRA (Insurance Regulatory Authority) Kenya standards:

**Vehicle Details:**
- Registration Number (e.g., `KCA 123A`)
- Chassis/VIN Number
- Make & Model
- Year of Manufacture
- Engine Capacity (cc)
- Vehicle Color
- Tonnage (for commercial)
- Passenger Capacity (for PSV)

**Policy Details:**
- Certificate Number (DMVIC-generated unique ID)
- Policy Number (Insurer's policy reference)
- Cover Type (Third-Party / Comprehensive)
- Cover Start Date
- Cover End Date (12 months standard)
- Premium Amount
- Levies:
  - Insurance Training Levy (ITL): 0.25% of premium
  - Policyholders Compensation Fund (PCF): 0.25% of premium
  - Stamp Duty: KSh 40 (fixed)

**Insured Details:**
- Full Name / Company Name
- ID/Passport Number or Company Registration Number
- KRA PIN (Tax Identification Number)
- Physical Address
- Phone Number

**Insurer Details:**
- Insurance Company Name (Registered with IRA)
- Company Code (DMVIC member code)
- Postal Address
- Telephone
- Authorized Signature

### 4.3 Third-Party vs. Comprehensive Workflow Differences

#### **Third-Party (Type A) Flow:**
```
1. Agent enters vehicle registration
2. System calls DMVIC Vehicle Search (4.2.1) → Get vehicle details
3. System calls DMVIC Validate Double Insurance (4.11) → Check existing cover
   ├── If existing cover found:
   │   ├── Display expiry date
   │   ├── Agent adjusts start date to after expiry OR
   │   └── Agent submits debit note to cancel previous policy
   └── If no existing cover:
       └── Proceed to issuance
4. Agent enters client details (Name, ID, KRA PIN, Phone)
5. Agent uploads documents:
   - KRA PIN Certificate (mandatory)
   - Logbook/Ownership Certificate (optional for verification)
6. System calculates premium:
   - Base Premium: Fixed rate per subcategory (e.g., KSh 3,000 for Private TP)
   - ITL: Premium × 0.0025
   - PCF: Premium × 0.0025
   - Stamp Duty: KSh 40
   - Total Premium = Base + ITL + PCF + Stamp Duty
7. Agent selects payment method:
   - M-PESA (Kenya mobile money)
   - DPO Pay (card payments)
   - Bank Transfer
8. Payment confirmed → System calls DMVIC Issue Type A Certificate (4.4.1)
9. DMVIC returns Certificate Number + PDF
10. System stores certificate:
    - Saves certificate number in MotorPolicy model
    - Downloads PDF from DMVIC (4.5 Get Certificate PDF)
    - Stores PDF in S3/media storage
11. Agent sends certificate to client via:
    - SMS (certificate number + download link)
    - Email (PDF attachment)
    - WhatsApp (PDF share)
12. System syncs to DMVIC inventory (4.8.1 Member company Stock)
```

#### **Comprehensive (Type B) Flow:**
```
1. Agent enters vehicle registration
2. System calls DMVIC Vehicle Search (4.2.1) → Get vehicle details
3. System calls DMVIC Validate Double Insurance (4.11) → Check existing cover
   ├── If existing cover found:
   │   ├── Display expiry date
   │   ├── Agent adjusts start date to after expiry OR
   │   └── Agent submits debit note to cancel previous policy
   └── If no existing cover:
       └── Proceed to issuance
4. Agent enters client details (Name, ID, KRA PIN, Phone)
5. Agent uploads documents:
   - KRA PIN Certificate (mandatory)
   - Logbook/Ownership Certificate (mandatory for Comprehensive)
   - Valuation Report (required if vehicle value > KSh 2M)
6. Agent enters **Sum Insured** (vehicle market value):
   - System shows recommended value based on make/model/year
   - Agent can adjust (subject to valuation report)
7. System calculates premium (bracket-based):
   - Example bracket structure:
     | Sum Insured Range | Premium Rate |
     |-------------------|--------------|
     | 0 - 500,000 | 4.5% |
     | 500,001 - 1,000,000 | 4.0% |
     | 1,000,001 - 2,000,000 | 3.5% |
     | 2,000,001 - 5,000,000 | 3.0% |
     | > 5,000,000 | 2.5% |
   - Base Premium = Sum Insured × Rate
   - Excess: KSh 5,000 - 50,000 (higher sum insured = higher excess)
   - Add-ons (optional):
     - Windscreen cover: +KSh 5,000
     - Radio/accessories: +KSh 2,000
     - Passenger Personal Accident: +KSh 1,500/seat
     - Political Violence & Terrorism (PVT): +KSh 3,000
   - Levies:
     - ITL: (Base + Add-ons) × 0.0025
     - PCF: (Base + Add-ons) × 0.0025
     - Stamp Duty: KSh 40
   - Total Premium = Base + Add-ons + ITL + PCF + Stamp Duty
8. Agent selects payment method (same as Third-Party)
9. Payment confirmed → System calls DMVIC Issue Type B Certificate (4.4.2)
10. DMVIC returns Certificate Number + PDF
11. System stores certificate (same as Third-Party)
12. Agent sends certificate to client
13. System syncs to DMVIC inventory
```

### 4.4 Key Differences: Third-Party vs. Comprehensive

| Aspect | Third-Party (Type A) | Comprehensive (Type B) |
|--------|---------------------|------------------------|
| **Coverage** | Third-party liability only | Third-party + Own Damage |
| **Sum Insured** | Not required | Required (vehicle market value) |
| **Premium Calculation** | Fixed amount per category | Percentage of sum insured (bracket-based) |
| **Logbook Upload** | Optional (for verification) | Mandatory (ownership proof) |
| **Valuation Report** | Not required | Required if value > KSh 2M |
| **Excess** | Not applicable | KSh 5,000 - 50,000 |
| **Add-ons** | Not available | Windscreen, Radio, PAB, PVT |
| **Document Requirements** | Lighter (KRA PIN only) | Heavier (KRA PIN + Logbook + Valuation) |
| **Typical Premium** | KSh 3,000 - 10,000 | KSh 20,000 - 150,000 |
| **Use Case** | Minimum legal requirement | Full protection for valuable vehicles |
| **DMVIC Certificate Type** | Type A | Type B |
| **DMVIC Issuance Endpoint** | 4.4.1 | 4.4.2 |

---

## 5. Recommended Implementation Plan

### Phase 1: Critical Foundation (Weeks 1-2) 🔴

**Goal:** Establish basic DMVIC connectivity and authentication

#### **Tasks:**

1. **Create DMVIC Service Module (`insurance-app/app/services/dmvic_service.py`)**
   ```python
   import requests
   from OpenSSL import crypto
   from django.conf import settings
   
   class DMVICService:
       def __init__(self):
           self.base_url = settings.DMVIC_BASE_URL
           self.username = settings.DMVIC_USERNAME
           self.password = settings.DMVIC_PASSWORD
           self.client_id = settings.DMVIC_CLIENT_ID
           self.pfx_path = settings.DMVIC_PFX_PATH
           self.passphrase = settings.DMVIC_PASSPHRASE
           self.access_token = None
           
       def load_certificate(self):
           """Load .pfx certificate for client authentication"""
           with open(self.pfx_path, 'rb') as f:
               pfx_data = f.read()
           p12 = crypto.load_pkcs12(pfx_data, self.passphrase.encode())
           return p12.get_certificate(), p12.get_privatekey()
       
       def login(self):
           """4.1 DMVIC Login API - Get access token"""
           # Implementation per DMVIC spec
       
       def search_vehicle(self, registration_number):
           """4.2.1 Vehicle Search - Member Company"""
           # Implementation per DMVIC spec
       
       def validate_double_insurance(self, registration_number):
           """4.11 Validate Double Insurance"""
           # Implementation per DMVIC spec
   ```

2. **Update Backend Environment Variables**
   - Add to `insurance-app/.env`:
     ```bash
     DMVIC_BASE_URL=https://uat.dmvic.com
     DMVIC_USERNAME=patabima_uat
     DMVIC_PASSWORD=your_password_here
     DMVIC_CLIENT_ID=patabima_client_id
     DMVIC_PFX_PATH=dmvic_credentials/PatabimaAgencyUAT.pfx
     DMVIC_PASSPHRASE=your_pfx_password_here
     ```

3. **Replace Simulation Endpoints**
   - Update `vehicle_validation.py`:
     ```python
     from app.services.dmvic_service import DMVICService
     
     @api_view(['POST'])
     @permission_classes([IsAuthenticated])
     def validate_vehicle_registration(request):
         registration = request.data.get('registration_number', '').upper()
         
         dmvic = DMVICService()
         
         # Real DMVIC API call
         vehicle_data = dmvic.search_vehicle(registration)
         
         # Check for existing cover
         double_insurance_check = dmvic.validate_double_insurance(registration)
         
         return Response({
             'success': True,
             'vehicle': vehicle_data,
             'existing_cover': double_insurance_check,
             'source': 'DMVIC_PRODUCTION'
         })
     ```

4. **Frontend: Disable Simulation Mode**
   - Update `MotorInsuranceScreen.js`:
     ```javascript
     const USE_DMVIC_SIMULATION = false; // ✅ Disable simulation
     ```
   - Remove hardcoded `SIMULATED_DMVIC_RESPONSE`

5. **Install Python Dependencies**
   ```bash
   pip install pyOpenSSL requests
   ```

**Deliverables:**
- ✅ DMVIC service module with certificate authentication
- ✅ Real API calls for vehicle search (4.2.1)
- ✅ Real API calls for double insurance check (4.11)
- ✅ Frontend connected to backend DMVIC endpoints
- ✅ UAT testing with real DMVIC data

---

### Phase 2: Certificate Issuance (Weeks 3-4) 🔴

**Goal:** Implement Type A and Type B certificate issuance

#### **Tasks:**

1. **Extend DMVIC Service (`dmvic_service.py`)**
   ```python
   def issue_type_a_certificate(self, policy_data):
       """4.4.1 For Type A certificates - Member Company"""
       payload = {
           "registration_number": policy_data['vehicle_registration'],
           "chassis_number": policy_data['chassis_number'],
           "policy_number": policy_data['policy_number'],
           "insured_name": policy_data['client_name'],
           "insured_id": policy_data['client_id'],
           "insured_phone": policy_data['client_phone'],
           "premium_amount": policy_data['base_premium'],
           "itl": policy_data['itl'],
           "pcf": policy_data['pcf'],
           "stamp_duty": policy_data['stamp_duty'],
           "total_premium": policy_data['total_premium'],
           "cover_start_date": policy_data['cover_start'].isoformat(),
           "cover_end_date": policy_data['cover_end'].isoformat(),
           "insurer_code": settings.DMVIC_MEMBER_CODE
       }
       
       response = requests.post(
           f"{self.base_url}/api/certificates/type-a/issue",
           json=payload,
           headers={"Authorization": f"Bearer {self.access_token}"},
           cert=self.load_certificate()
       )
       
       return response.json()  # Returns certificate_number, pdf_url
   
   def issue_type_b_certificate(self, policy_data):
       """4.4.2 For Type B certificates - Member Company"""
       # Similar to Type A, with sum_insured field
   
   def get_certificate_pdf(self, certificate_number):
       """4.5 Get Certificate PDF"""
       # Download PDF from DMVIC
   
   def validate_certificate(self, certificate_number, certificate_type):
       """4.9.1/4.9.2 Validate Type A/B certificates"""
       # Verify certificate authenticity
   ```

2. **Update `policy_management.py`**
   - Modify `save_motor_policy_after_payment()` to call DMVIC issuance:
     ```python
     from app.services.dmvic_service import DMVICService
     
     def save_motor_policy_after_payment(quote_data, payment_data):
         # ... existing policy creation ...
         
         dmvic = DMVICService()
         
         # Determine certificate type
         cover_type = quote_data.get('cover_type')
         if cover_type in ['third_party', 'third_party_extendible']:
             cert_response = dmvic.issue_type_a_certificate(policy_data)
         elif cover_type == 'comprehensive':
             cert_response = dmvic.issue_type_b_certificate(policy_data)
         
         # Save certificate number to policy
         motor_policy.certificate_number = cert_response['certificate_number']
         motor_policy.certificate_pdf_url = cert_response['pdf_url']
         motor_policy.save()
         
         # Download and store PDF
         pdf_content = dmvic.get_certificate_pdf(cert_response['certificate_number'])
         # Save to S3 or media storage
     ```

3. **Add Certificate Storage**
   - Update `MotorPolicy` model:
     ```python
     class MotorPolicy(models.Model):
         # ... existing fields ...
         certificate_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
         certificate_type = models.CharField(max_length=10, choices=[
             ('TYPE_A', 'Third-Party'),
             ('TYPE_B', 'Comprehensive'),
             ('TYPE_C', 'Third-Party + PLL'),
             ('TYPE_D', 'Comprehensive + PLL'),
         ])
         certificate_pdf_url = models.URLField(null=True, blank=True)
         certificate_issued_at = models.DateTimeField(null=True, blank=True)
         dmvic_response = models.JSONField(null=True, blank=True)
     ```

4. **Frontend: Display Certificate**
   - After payment success, show certificate number and download link
   - Add "View Certificate" button in policy details screen

**Deliverables:**
- ✅ Type A certificate issuance (Third-Party)
- ✅ Type B certificate issuance (Comprehensive)
- ✅ Certificate PDF download and storage
- ✅ Certificate number saved to policy
- ✅ Frontend displays certificate after payment

---

### Phase 3: Certificate Management (Weeks 5-6) 🟠

**Goal:** Implement certificate verification, cancellation, and inventory

#### **Tasks:**

1. **Certificate Verification**
   - Add endpoint to verify certificates:
     ```python
     @api_view(['POST'])
     def verify_certificate(request):
         cert_number = request.data.get('certificate_number')
         cert_type = request.data.get('certificate_type')
         
         dmvic = DMVICService()
         verification = dmvic.validate_certificate(cert_number, cert_type)
         
         return Response(verification)
     ```

2. **Debit Note / Certificate Cancellation**
   - Implement cancellation flow when double insurance detected:
     ```python
     @api_view(['POST'])
     def cancel_certificate(request, certificate_number):
         reason = request.data.get('reason')
         
         dmvic = DMVICService()
         result = dmvic.cancel_certificate(certificate_number, reason)
         
         # Update policy status
         policy = MotorPolicy.objects.get(certificate_number=certificate_number)
         policy.status = 'CANCELLED'
         policy.cancellation_reason = reason
         policy.save()
         
         return Response(result)
     ```

3. **Certificate Inventory**
   - Create admin view to display all issued certificates:
     ```python
     @login_required
     def certificate_inventory(request):
         dmvic = DMVICService()
         inventory = dmvic.get_certificates_inventory()
         
         return render(request, 'admin/certificate_inventory.html', {
             'certificates': inventory
         })
     ```

4. **Bulk Issuance (Optional)**
   - For agents processing multiple policies at once
   - Implement Type A/B bulk issuance endpoints (4.4.5, 4.4.6)

**Deliverables:**
- ✅ Certificate verification endpoint
- ✅ Debit note / cancellation workflow
- ✅ Certificate inventory admin view
- ⚠️ Bulk issuance (optional, low priority)

---

### Phase 4: Production Deployment (Week 7) 🟢

**Goal:** Transition from UAT to Production DMVIC

#### **Tasks:**

1. **Obtain Production Credentials**
   - Contact DMVIC support to get production `.pfx` certificate
   - Update environment variables:
     ```bash
     DMVIC_BASE_URL=https://prod.dmvic.com
     DMVIC_PFX_PATH=dmvic_credentials/PatabimaAgencyPROD.pfx
     ```

2. **Production Testing**
   - Test all flows with real DMVIC production data
   - Verify certificate issuance works end-to-end
   - Validate double insurance checks with actual policies

3. **Error Handling & Logging**
   - Add comprehensive error handling for DMVIC API failures
   - Log all DMVIC transactions for audit trail
   - Implement retry logic for network failures

4. **Monitoring & Alerts**
   - Set up alerts for DMVIC API downtime
   - Monitor certificate issuance success rate
   - Track API response times

**Deliverables:**
- ✅ Production DMVIC credentials configured
- ✅ Full end-to-end testing complete
- ✅ Error handling and logging implemented
- ✅ Monitoring and alerts configured

---

## 6. Technical Implementation Details

### 6.1 DMVIC Authentication Flow

```python
# insurance-app/app/services/dmvic_service.py

class DMVICService:
    def login(self):
        """
        4.1 DMVIC Login API
        Authenticates with DMVIC using username/password + client certificate
        Returns access token for subsequent API calls
        """
        cert, key = self.load_certificate()
        
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={
                "username": self.username,
                "password": self.password,
                "client_id": self.client_id
            },
            cert=(cert, key)
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data['access_token']
            self.token_expiry = datetime.now() + timedelta(seconds=data['expires_in'])
            return True
        else:
            raise Exception(f"DMVIC login failed: {response.text}")
    
    def ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if not self.access_token or datetime.now() >= self.token_expiry:
            self.login()
```

### 6.2 Vehicle Search Implementation

```python
def search_vehicle(self, registration_number):
    """
    4.2.1 Vehicle Search - Member Company
    Searches DMVIC database for vehicle by registration number
    Returns vehicle details (make, model, year, chassis, etc.)
    """
    self.ensure_authenticated()
    
    response = requests.post(
        f"{self.base_url}/api/vehicles/search",
        json={"registration_number": registration_number},
        headers={"Authorization": f"Bearer {self.access_token}"},
        cert=self.load_certificate()
    )
    
    if response.status_code == 200:
        data = response.json()
        return {
            "registration_number": data.get("registrationNumber"),
            "chassis_number": data.get("chassisNumber"),
            "make": data.get("make"),
            "model": data.get("model"),
            "year_of_manufacture": data.get("yearOfManufacture"),
            "engine_capacity": data.get("engineCapacity"),
            "vehicle_type": data.get("vehicleType"),
            "color": data.get("color"),
            "tonnage": data.get("tonnage"),
            "passenger_capacity": data.get("passengerCapacity"),
            "owner_name": data.get("ownerName"),
            "owner_id": data.get("ownerIdNumber")
        }
    elif response.status_code == 404:
        raise Exception("Vehicle not found in DMVIC database")
    else:
        raise Exception(f"DMVIC vehicle search failed: {response.text}")
```

### 6.3 Double Insurance Validation

```python
def validate_double_insurance(self, registration_number):
    """
    4.11 Validate Double Insurance
    Checks if vehicle already has active cover from another insurer
    CRITICAL: Must be called before issuing any certificate
    """
    self.ensure_authenticated()
    
    response = requests.post(
        f"{self.base_url}/api/certificates/validate-double-insurance",
        json={"registration_number": registration_number},
        headers={"Authorization": f"Bearer {self.access_token}"},
        cert=self.load_certificate()
    )
    
    if response.status_code == 200:
        data = response.json()
        
        if data.get("hasActiveCover"):
            return {
                "exists": True,
                "policy": {
                    "certificate_number": data.get("certificateNumber"),
                    "insurer": data.get("insurerName"),
                    "insurer_code": data.get("insurerCode"),
                    "cover_start_date": data.get("coverStartDate"),
                    "cover_end_date": data.get("coverEndDate"),
                    "policy_type": data.get("policyType")
                }
            }
        else:
            return {"exists": False}
    else:
        raise Exception(f"DMVIC double insurance check failed: {response.text}")
```

### 6.4 Type A Certificate Issuance

```python
def issue_type_a_certificate(self, policy_data):
    """
    4.4.1 For Type A certificates - Member Company
    Issues Third-Party certificate to DMVIC
    """
    self.ensure_authenticated()
    
    payload = {
        "registrationNumber": policy_data['vehicle_registration'],
        "chassisNumber": policy_data['chassis_number'],
        "policyNumber": policy_data['policy_number'],
        "insuredName": policy_data['client_name'],
        "insuredIdNumber": policy_data['client_id'],
        "insuredKraPin": policy_data['kra_pin'],
        "insuredPhoneNumber": policy_data['client_phone'],
        "insuredEmail": policy_data.get('client_email'),
        "premiumAmount": float(policy_data['base_premium']),
        "itlLevy": float(policy_data['itl']),
        "pcfLevy": float(policy_data['pcf']),
        "stampDuty": float(policy_data['stamp_duty']),
        "totalPremium": float(policy_data['total_premium']),
        "coverStartDate": policy_data['cover_start'].strftime('%Y-%m-%d'),
        "coverEndDate": policy_data['cover_end'].strftime('%Y-%m-%d'),
        "insurerCode": settings.DMVIC_MEMBER_CODE,
        "insurerName": "Patabima Insurance Agency",
        "agentCode": policy_data.get('agent_code'),
        "agentName": policy_data.get('agent_name'),
        "make": policy_data['vehicle_make'],
        "model": policy_data['vehicle_model'],
        "yearOfManufacture": policy_data['vehicle_year'],
        "vehicleColor": policy_data.get('vehicle_color'),
        "engineCapacity": policy_data.get('engine_capacity')
    }
    
    response = requests.post(
        f"{self.base_url}/api/certificates/type-a/issue",
        json=payload,
        headers={"Authorization": f"Bearer {self.access_token}"},
        cert=self.load_certificate()
    )
    
    if response.status_code == 201:
        data = response.json()
        return {
            "certificate_number": data.get("certificateNumber"),
            "pdf_url": data.get("pdfDownloadUrl"),
            "qr_code_url": data.get("qrCodeUrl"),
            "issued_at": data.get("issuedAt"),
            "status": data.get("status")
        }
    else:
        raise Exception(f"DMVIC Type A issuance failed: {response.text}")
```

### 6.5 Type B Certificate Issuance

```python
def issue_type_b_certificate(self, policy_data):
    """
    4.4.2 For Type B certificates - Member Company
    Issues Comprehensive certificate to DMVIC
    """
    self.ensure_authenticated()
    
    payload = {
        # All fields from Type A, PLUS:
        "sumInsured": float(policy_data['sum_insured']),
        "excessAmount": float(policy_data.get('excess', 5000)),
        "windscreenCover": policy_data.get('windscreen_cover', False),
        "windscreenLimit": float(policy_data.get('windscreen_limit', 0)),
        "radioAccessoriesCover": policy_data.get('radio_cover', False),
        "radioAccessoriesLimit": float(policy_data.get('radio_limit', 0)),
        "passengerPab": policy_data.get('passenger_pab', False),
        "passengerPabSeats": int(policy_data.get('pab_seats', 0)),
        "pvtCover": policy_data.get('pvt_cover', False)
    }
    
    response = requests.post(
        f"{self.base_url}/api/certificates/type-b/issue",
        json=payload,
        headers={"Authorization": f"Bearer {self.access_token}"},
        cert=self.load_certificate()
    )
    
    if response.status_code == 201:
        data = response.json()
        return {
            "certificate_number": data.get("certificateNumber"),
            "pdf_url": data.get("pdfDownloadUrl"),
            "qr_code_url": data.get("qrCodeUrl"),
            "issued_at": data.get("issuedAt"),
            "status": data.get("status")
        }
    else:
        raise Exception(f"DMVIC Type B issuance failed: {response.text}")
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

Create comprehensive unit tests for DMVIC service:

```python
# insurance-app/app/tests/test_dmvic_service.py

import pytest
from app.services.dmvic_service import DMVICService

@pytest.mark.django_db
class TestDMVICService:
    
    def test_login_success(self):
        """Test successful DMVIC login"""
        service = DMVICService()
        result = service.login()
        assert result is True
        assert service.access_token is not None
    
    def test_vehicle_search_found(self):
        """Test vehicle search with existing registration"""
        service = DMVICService()
        service.login()
        
        result = service.search_vehicle("KCA456B")
        assert result['registration_number'] == "KCA456B"
        assert 'make' in result
        assert 'model' in result
    
    def test_vehicle_search_not_found(self):
        """Test vehicle search with non-existent registration"""
        service = DMVICService()
        service.login()
        
        with pytest.raises(Exception, match="Vehicle not found"):
            service.search_vehicle("INVALID123")
    
    def test_double_insurance_exists(self):
        """Test double insurance check with active cover"""
        service = DMVICService()
        service.login()
        
        result = service.validate_double_insurance("KDD123A")
        assert result['exists'] is True
        assert 'policy' in result
    
    def test_double_insurance_not_exists(self):
        """Test double insurance check with no active cover"""
        service = DMVICService()
        service.login()
        
        result = service.validate_double_insurance("KCA999Z")
        assert result['exists'] is False
    
    def test_issue_type_a_certificate(self):
        """Test Type A certificate issuance"""
        service = DMVICService()
        service.login()
        
        policy_data = {
            'vehicle_registration': 'KCA123A',
            'chassis_number': 'JTFSH3P26J3012345',
            # ... all required fields ...
        }
        
        result = service.issue_type_a_certificate(policy_data)
        assert 'certificate_number' in result
        assert 'pdf_url' in result
```

### 7.2 Integration Tests

Test full end-to-end flows:

```python
# insurance-app/app/tests/test_motor_flow_dmvic.py

from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

class MotorFlowDMVICTests(APITestCase):
    
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='agent01',
            password='testpass'
        )
        self.client.force_authenticate(self.user)
    
    def test_vehicle_validation_with_dmvic(self):
        """Test vehicle validation calls real DMVIC API"""
        response = self.client.post('/api/v1/vehicle/validate-registration/', {
            'registration_number': 'KCA456B'
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['source'] == 'DMVIC_PRODUCTION'  # Not simulation
        assert 'vehicle' in data
    
    def test_policy_creation_with_dmvic_issuance(self):
        """Test policy creation issues DMVIC certificate"""
        # Create policy with payment data
        response = self.client.post('/api/v1/policies/motor/create/', {
            'vehicle_registration': 'KCA456B',
            'cover_type': 'third_party',
            # ... all policy fields ...
            'payment_data': {
                'transactionId': 'SIM-123456',
                'amount': 3642,
                'method': 'mpesa'
            }
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data['certificate_number'] is not None  # DMVIC issued
        assert data['certificate_pdf_url'] is not None
```

### 7.3 UAT Testing Checklist

Before production deployment, test with UAT DMVIC environment:

**Vehicle Search:**
- [ ] Test with known registration number (should return vehicle details)
- [ ] Test with invalid registration (should return 404 error)
- [ ] Test with non-Kenyan registration format (should return validation error)

**Double Insurance Check:**
- [ ] Test with vehicle that has active cover (should return existing policy)
- [ ] Test with vehicle without active cover (should return empty)
- [ ] Test edge case: Cover expiring today (should still show as active)

**Type A Certificate Issuance:**
- [ ] Issue Third-Party certificate for Private vehicle
- [ ] Issue Third-Party certificate for Commercial vehicle
- [ ] Issue Third-Party certificate for PSV vehicle
- [ ] Verify certificate number is returned
- [ ] Verify PDF can be downloaded
- [ ] Verify certificate appears in DMVIC inventory

**Type B Certificate Issuance:**
- [ ] Issue Comprehensive certificate with sum insured KSh 500,000
- [ ] Issue Comprehensive certificate with sum insured KSh 5,000,000
- [ ] Add optional add-ons (windscreen, radio, PAB, PVT)
- [ ] Verify premium calculation includes add-ons
- [ ] Verify certificate appears in DMVIC inventory

**Certificate Verification:**
- [ ] Verify valid certificate number (should return certificate details)
- [ ] Verify invalid certificate number (should return not found)
- [ ] Verify expired certificate (should show status)

**Certificate Cancellation:**
- [ ] Cancel certificate with valid reason (double insurance)
- [ ] Verify certificate status changes to CANCELLED in DMVIC
- [ ] Verify debit note is issued

---

## 8. Risk Assessment & Mitigation

### 8.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| **DMVIC API Downtime** | Medium | High | Implement retry logic with exponential backoff; queue certificate issuance requests; show user-friendly error messages |
| **Certificate Mismatch** | Low | Critical | Validate all policy data before calling DMVIC; log all requests/responses; implement rollback mechanism |
| **Authentication Failure** | Low | High | Store backup refresh tokens; implement automatic token renewal; alert admin on auth failures |
| **Network Latency** | Medium | Medium | Implement async certificate issuance; show loading states to users; cache DMVIC responses where possible |
| **Data Sync Issues** | Low | High | Implement daily reconciliation job; compare DMVIC inventory with local database; flag discrepancies |

### 8.2 Compliance Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| **Double Insurance Issuance** | Low | Critical | Always call 4.11 Validate Double Insurance before issuance; block issuance if active cover found; require agent override with justification |
| **Invalid Certificate Data** | Low | High | Implement strict input validation; use DMVIC field specifications exactly; test with sample data from DMVIC |
| **Missing Mandatory Levies** | Low | Critical | Hardcode ITL/PCF/Stamp Duty calculations; validate totals match backend; prevent policy creation if mismatch |
| **Incorrect Cover Dates** | Medium | Medium | Validate cover start date >= today + existing cover expiry; prevent backdating without approval |

### 8.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| **Agent Training Gap** | High | Medium | Create step-by-step DMVIC workflow guide; provide sandbox environment for practice; conduct training sessions |
| **Certificate Delivery Failure** | Medium | Medium | Implement SMS/Email/WhatsApp multi-channel delivery; retry failed deliveries; allow manual resend |
| **Inventory Reconciliation** | Medium | High | Automate daily inventory sync with DMVIC; alert on mismatches; provide admin dashboard for manual fixes |

---

## 9. Success Criteria

### 9.1 Technical Success Metrics

- [ ] **100% DMVIC API Coverage** - All critical endpoints (4.1, 4.2.1, 4.4.1, 4.4.2, 4.5, 4.6, 4.11) implemented
- [ ] **Zero Simulation Dependency** - Frontend calls real backend DMVIC endpoints (not mock data)
- [ ] **Certificate Issuance Success Rate > 95%** - Measured over 100 policies
- [ ] **API Response Time < 3 seconds** - For vehicle search and certificate issuance
- [ ] **Certificate PDF Download Success Rate > 98%** - No broken PDF links
- [ ] **Daily Inventory Reconciliation** - Automated job syncs DMVIC data daily

### 9.2 Compliance Success Metrics

- [ ] **Zero Double Insurance Incidents** - No certificates issued when active cover exists
- [ ] **100% Levy Accuracy** - All policies have correct ITL, PCF, Stamp Duty
- [ ] **100% Certificate Number Validity** - All issued certificates can be verified in DMVIC
- [ ] **Audit Trail Coverage** - All DMVIC transactions logged with timestamps and user details

### 9.3 User Experience Success Metrics

- [ ] **Agent Satisfaction > 80%** - Post-training survey
- [ ] **Average Policy Issuance Time < 5 minutes** - From vehicle entry to certificate delivery
- [ ] **Error Rate < 2%** - Failed certificate issuance attempts
- [ ] **Certificate Delivery Success > 95%** - Clients receive certificates via SMS/Email/WhatsApp

---

## 10. Recommended Next Steps

### Immediate Actions (This Week)

1. **Obtain DMVIC UAT API Documentation**
   - Contact DMVIC support to get detailed API spec
   - Request sample requests/responses for all endpoints
   - Clarify any ambiguities in authentication or certificate issuance

2. **Install Python Dependencies**
   ```bash
   cd insurance-app
   pip install pyOpenSSL requests
   pip freeze > requirements.txt
   ```

3. **Create DMVIC Service Skeleton**
   - Create `insurance-app/app/services/dmvic_service.py`
   - Implement basic authentication (4.1)
   - Test login with UAT credentials

4. **Disable Frontend Simulation**
   - Update `MotorInsuranceScreen.js`: `USE_DMVIC_SIMULATION = false`
   - Point frontend to real backend vehicle validation endpoint

### Short-Term Actions (Next 2 Weeks)

5. **Implement Critical Endpoints**
   - Vehicle Search (4.2.1)
   - Double Insurance Validation (4.11)
   - Type A Certificate Issuance (4.4.1)
   - Certificate PDF Download (4.5)

6. **Update Backend Views**
   - Replace simulation in `vehicle_validation.py`
   - Integrate DMVIC service in `policy_management.py`

7. **End-to-End UAT Testing**
   - Test full Third-Party policy flow with real DMVIC
   - Issue 10 test certificates in UAT
   - Verify certificates appear in DMVIC inventory

### Medium-Term Actions (Next 4 Weeks)

8. **Comprehensive Coverage**
   - Type B Certificate Issuance (4.4.2)
   - Certificate Verification (4.6)
   - Certificate Cancellation (4.7)

9. **Production Deployment**
   - Obtain production DMVIC credentials
   - Configure production environment variables
   - Perform smoke tests in production

10. **Training & Documentation**
    - Create agent training materials
    - Document DMVIC troubleshooting procedures
    - Set up monitoring and alerts

---

## 11. Conclusion

The current DMVIC integration in PataBima is **non-functional** - all vehicle verification and certificate operations are simulations. To achieve production readiness, the system requires:

1. **Complete DMVIC service layer implementation** (authentication, vehicle search, certificate issuance)
2. **Backend endpoint replacement** (remove simulations, call real DMVIC APIs)
3. **Frontend integration update** (disable simulation mode, handle real DMVIC responses)
4. **Production deployment** (UAT testing → Production credentials → Go-live)

**Estimated Implementation Time:** 6-7 weeks  
**Development Effort:** 1 backend developer + 1 frontend developer  
**Priority:** 🔴 **CRITICAL** - Blocks real policy issuance

**Key Success Factor:** Early engagement with DMVIC support to clarify API specifications and obtain UAT credentials.

---

**Document Version:** 1.0  
**Last Updated:** November 3, 2025  
**Author:** AI Development Assistant  
**Review Status:** Draft - Awaiting stakeholder review
