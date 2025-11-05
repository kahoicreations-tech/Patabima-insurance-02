# DMVIC Backend - Critical Fixes Required

**Date**: November 3, 2025  
**Status**: ❌ CERTIFICATE ISSUANCE WILL FAIL  
**Priority**: 🔴 CRITICAL - Production Blocker

---

## TL;DR - What's Broken

Our DMVIC certificate issuance (Type A/B) will **fail validation** because:

1. ❌ Missing 4 mandatory fields (`TypeOfCertificate`, `TypeofCover`, `Bodytype`, `Licensedbodycty`)
2. ❌ Wrong date format (`YYYY-MM-DD` instead of `DD/MM/YYYY`)  
3. ❌ Missing `ClientID` header in API requests
4. ❌ Sending 12+ fields that DMVIC doesn't expect (will be ignored or cause errors)
5. ⚠️ 6 field name mismatches (wrong casing/naming)

---

## Comparison: What DMVIC Expects vs What We Send

### Type A Certificate Issuance

#### Headers Required
```http
Authorization: Bearer <token from login>
ClientID: 097C69C262EF4350B89E6163E1CEB397
```

#### Payload DMVIC Expects (21 fields):
```json
{
  "IntermediaryIRANumber": "IRA/05/012016",      // Our code: ❌ Missing
  "TypeOfCertificate": 7,                         // Our code: ❌ MISSING (CRITICAL)
  "TypeofCover": 200,                             // Our code: ❌ MISSING (CRITICAL - 100=COMP, 200=TPO, 300=TPTF)
  "Policyholder": "SA",                           // Our code: ✅ "insuredName"
  "policynumber": "SAPCL123",                     // Our code: ✅ "policyNumber"
  "CommencingDate": "01/01/2016",                 // Our code: ⚠️ "2016-01-01" (WRONG FORMAT)
  "ExpiringDate": "03/03/2016",                   // Our code: ⚠️ "2016-03-03" (WRONG FORMAT)
  "RegistrationNumber": "KPL140W",                // Our code: ✅ "registrationNumber"
  "Chassisnumber": "JIT123DFBEW12123",            // Our code: ⚠️ "chassisNumber" (wrong casing)
  "Phonenumber": "759789789",                     // Our code: ⚠️ "insuredPhoneNumber" (wrong name)
  "Bodytype": "BT",                               // Our code: ❌ MISSING (CRITICAL)
  "Licensedbodycty": 8,                           // Our code: ❌ MISSING (CRITICAL - tonnage/capacity)
  "Vehiclemake": "AUDI",                          // Our code: ⚠️ "make" (wrong name)
  "Vehiclemodel": "AUDI",                         // Our code: ⚠️ "model" (wrong name)
  "Vehicleregistration": null,                    // Our code: ❌ Missing
  "Enginenumber": "ENG123",                       // Our code: ❌ Missing
  "Email": "xxxxx@dmvic.info",                    // Our code: ✅ "insuredEmail"
  "Suminsured": 100000,                           // Our code: ❌ N/A for Type A (correct)
  "InsuredPIN": "A1234567BBA",                    // Our code: ⚠️ "insuredKraPin" (wrong name)
  "YearofManufacture": 2016,                      // Our code: ✅ "yearOfManufacture"
  "HudumNumber": "1234567890123"                  // Our code: ❌ MISSING (NEW in v1.8.0)
}
```

#### Payload We Currently Send (Extra fields DMVIC doesn't want):
```python
# Lines 518-542 in dmvic_service.py
payload = {
    "registrationNumber": ...,        # ✅ Correct
    "chassisNumber": ...,             # ⚠️ Wrong casing (should be "Chassisnumber")
    "policyNumber": ...,              # ✅ Correct  
    "insuredName": ...,               # ⚠️ Wrong name (should be "Policyholder")
    "insuredIdNumber": ...,           # ❌ NOT IN DMVIC SPEC - remove this
    "insuredKraPin": ...,             # ⚠️ Wrong name (should be "InsuredPIN")
    "insuredPhoneNumber": ...,        # ⚠️ Wrong name (should be "Phonenumber")
    "insuredEmail": ...,              # ✅ Correct
    
    # ❌ THESE FIELDS ARE NOT IN DMVIC SPEC - Remove them:
    "premiumAmount": ...,
    "itlLevy": ...,
    "pcfLevy": ...,
    "stampDuty": ...,
    "totalPremium": ...,
    "insurerCode": ...,
    "insurerName": ...,
    "agentCode": ...,
    "agentName": ...,
    "vehicleColor": ...,
    "engineCapacity": ...,
    
    "coverStartDate": "2025-11-03",   # ⚠️ WRONG FORMAT (should be "03/11/2025")
    "coverEndDate": "2026-11-03",     # ⚠️ WRONG FORMAT (should be "03/11/2026")
    "make": ...,                      # ⚠️ Wrong name (should be "Vehiclemake")
    "model": ...,                     # ⚠️ Wrong name (should be "Vehiclemodel")
    "yearOfManufacture": ...,         # ✅ Correct
    
    # ❌ MISSING CRITICAL FIELDS:
    # "TypeOfCertificate": 7,
    # "TypeofCover": 200,
    # "Bodytype": "...",
    # "Licensedbodycty": ...,
    # "IntermediaryIRANumber": "...",
    # "HudumNumber": "..."
}
```

---

## Critical Fixes Needed

### Fix 1: Add ClientID Header ❌ CRITICAL

**File**: `insurance-app/app/services/dmvic_service.py`  
**Line**: ~272 (`_make_authenticated_request` method)

**Current Code**:
```python
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {self.access_token}"
}
```

**Fixed Code**:
```python
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {self.access_token}",
    "ClientID": self.client_id  # ← ADD THIS
}
```

---

### Fix 2: Complete Rewrite of Type A Certificate Payload ❌ CRITICAL

**File**: `insurance-app/app/services/dmvic_service.py`  
**Lines**: 518-542

**Replace entire payload with**:
```python
def issue_type_a_certificate(self, policy_data: Dict[str, Any]) -> Dict[str, Any]:
    """Type A = Third-Party Only"""
    
    # Map PataBima vehicle category to DMVIC VehicleType enum
    vehicle_type_map = {
        'PRIVATE': 1,           # Motor Private
        'COMMERCIAL': 2,        # Motor Commercial
        'PSV': 3,              # Motor PSV
        'MOTORCYCLE': 4,        # Motor Cycle
        'TUKTUK': 5,           # Tuk Tuk
        'SPECIAL': 6           # Special Vehicles
    }
    
    # Map PataBima product to DMVIC TypeofCover enum  
    # Type A = Third-Party Only, so always 200
    type_of_cover = 200  # 100=Comprehensive, 200=Third-party, 300=TPTF
    
    # Build EXACT payload matching DMVIC API spec
    payload = {
        # Certificate identification
        "TypeOfCertificate": 7,  # Fixed value for Type A
        
        # Cover type
        "TypeofCover": type_of_cover,  # 200 = Third-Party Only
        
        # Optional intermediary
        "IntermediaryIRANumber": policy_data.get('intermediary_ira_number', ''),
        
        # Policy details (use EXACT field names from DMVIC)
        "Policyholder": policy_data['client_name'],
        "policynumber": policy_data['policy_number'],
        "CommencingDate": policy_data['cover_start'].strftime('%d/%m/%Y'),  # DD/MM/YYYY!
        "ExpiringDate": policy_data['cover_end'].strftime('%d/%m/%Y'),      # DD/MM/YYYY!
        
        # Vehicle identification
        "RegistrationNumber": policy_data['vehicle_registration'].replace(' ', '').upper(),
        "Chassisnumber": policy_data.get('chassis_number', ''),  # Lowercase 'n'!
        
        # Vehicle details
        "Bodytype": policy_data.get('body_type', 'SD'),  # e.g., "SD" = Sedan, "BT" = Bus
        "Licensedbodycty": int(policy_data.get('licensed_capacity', 0)),  # Tonnage or passenger capacity
        "Vehiclemake": policy_data.get('vehicle_make', ''),
        "Vehiclemodel": policy_data.get('vehicle_model', ''),
        "YearofManufacture": int(policy_data.get('vehicle_year', datetime.now().year)),
        "Enginenumber": policy_data.get('engine_number', ''),
        "Vehicleregistration": policy_data.get('vehicle_registration_type', ''),
        
        # Contact information
        "Phonenumber": policy_data['client_phone'],  # NOT "insuredPhoneNumber"
        "Email": policy_data.get('client_email', ''),
        
        # Tax compliance
        "InsuredPIN": policy_data.get('kra_pin', ''),  # NOT "insuredKraPin"
        
        # New field in v1.8.0
        "HudumNumber": policy_data.get('hudumanumber', ''),  # Kenyan ID service number
        
        # Sum insured (NOT used for Type A, but field exists)
        "Suminsured": 0  # Type A = Third-Party, no sum insured
    }
    
    # Remove empty/null fields (optional)
    payload = {k: v for k, v in payload.items() if v not in [None, '', []]}
    
    try:
        response = self._make_authenticated_request(
            endpoint='/api/v4/Integration/IssueTypeACertificate',
            method='POST',
            data=payload
        )
        
        return {
            "certificate_number": response.get("certificateNumber"),
            "pdf_url": response.get("pdfUrl"),
            "success": response.get("Success", False)
        }
    except DMVICAPIError as e:
        logger.error(f"Type A certificate issuance failed: {str(e)}")
        raise
```

---

### Fix 3: Type B Certificate Payload ❌ CRITICAL

**Same as Type A, but**:
```python
"TypeOfCertificate": 8,  # Type B = Comprehensive
"TypeofCover": 100,      # 100 = Comprehensive (not 200)
"Suminsured": int(policy_data.get('sum_insured', 0)),  # NOW REQUIRED
```

---

### Fix 4: Add Missing Fields to Motor 2 Form ⚠️ REQUIRED

**File**: `frontend/screens/Motor 2/.../VehicleDetailsForm.js`

**Add these input fields**:
1. **Body Type** dropdown:
   - Options: Sedan (SD), Station Wagon (SW), Bus (BT), Truck (TR), etc.
   - DMVIC expects 2-letter codes

2. **Licensed Capacity** number input:
   - For Commercial/PSV: Tonnage (e.g., 3, 5, 10, 20 tons)
   - For PSV: Passenger capacity (e.g., 14, 33, 51 seats)
   - For Private: Usually 0 or passenger count

3. **Hudumanumber** (optional):
   - New Kenya government ID service number
   - Length: 13 digits

---

## Enum Values Reference

### TypeOfCertificate
```python
TYPE_OF_CERTIFICATE = {
    7: "Type A - Third-Party Only",
    8: "Type B - Comprehensive",
    # Type C/D not documented in screenshots
}
```

### TypeofCover
```python
TYPE_OF_COVER = {
    100: "Comprehensive (COMP)",
    200: "Third-party (TPO)",
    300: "Third-party, Theft & Fire (TPTF)"
}
```

### VehicleType (from DMVIC left menu)
```python
VEHICLE_TYPE = {
    1: "MOTOR PRIVATE",
    2: "MOTOR COMMERCIAL",
    3: "MOTOR PSV",
    4: "MOTOR CYCLE",
    5: "TUK TUK",
    6: "MOTOR SPECIAL VEHICLES"
}
```

---

## Testing Checklist

After fixing:

- [ ] Add `ClientID` header to all authenticated requests
- [ ] Fix date format to DD/MM/YYYY
- [ ] Add `TypeOfCertificate`, `TypeofCover`, `Bodytype`, `Licensedbodycty` fields
- [ ] Remove extra fields not in DMVIC spec
- [ ] Fix field name casing (`Chassisnumber`, `Phonenumber`, `InsuredPIN`, `Vehiclemake`, `Vehiclemodel`)
- [ ] Test Type A certificate issuance with real DMVIC UAT
- [ ] Verify PDF download works
- [ ] Test Type B with sum_insured field
- [ ] Add Motor 2 form fields for body_type, licensed_capacity, hudumanumber

---

## Estimated Fix Time

- **Fix 1** (ClientID header): 10 minutes
- **Fix 2** (Type A payload): 2 hours (includes enum mapping logic)
- **Fix 3** (Type B payload): 30 minutes (similar to Type A)
- **Fix 4** (Frontend form fields): 1 hour

**Total**: ~4 hours to production-ready state

---

## Priority Order

1. 🔴 **FIX 1** - Add ClientID header (blocks everything)
2. 🔴 **FIX 2** - Rewrite Type A payload (90% of use cases)
3. 🟠 **FIX 3** - Rewrite Type B payload (10% of use cases)
4. 🟡 **FIX 4** - Add frontend form fields (data collection)

---

*End of Critical Fixes Document*
