# Motor2 → DMVIC Certificate Type Mapping

## Overview

This document maps PataBima Motor2 insurance categories and product types to DMVIC certificate types (A, B, C, D). This ensures proper certificate issuance based on vehicle class and cover type.

## DMVIC Certificate Types

### Type A - PSV Certificates (Public Service Vehicles)
**DMVIC Endpoint:** `/api/V1/TypeACertificate/PreviewTypeACertificate` or `/api/V1/TypeACertificate/IssueTypeACertificate`

**Coverage:** Public Service Vehicles (Matatus, Buses, Taxis)

**Required Additional Field:** `TypeOfCertificate` (integer code)

### Type B - Private/Commercial Comprehensive
**DMVIC Endpoint:** `/api/v1/TypeBCertificate/PreviewTypeBCertificate` or `/api/v1/TypeBCertificate/IssueTypeBCertificate`

**Coverage:** Private and Commercial vehicles with Comprehensive or TPTF cover

**Key Characteristics:** Full coverage including own damage, third party, fire & theft

### Type C - Third Party Only
**DMVIC Endpoint:** `/api/v1/TypeCCertificate/PreviewTypeCCertificate` or `/api/v1/TypeCCertificate/IssueTypeCCertificate`

**Coverage:** Third party liability only (minimum legal requirement)

**Key Characteristics:** Does not cover own vehicle damage, fire, or theft

### Type D - Special Classes
**DMVIC Endpoint:** `/api/v1/TypeDCertificate/IssueTypeDCertificate`

**Coverage:** Special vehicles (agricultural, construction, institutional)

**Key Characteristics:** Specialty vehicles not fitting A/B/C categories

---

## Motor2 Category Mapping

### 1. PSV Category → Type A
**Motor2 Category:** `PSV`

**DMVIC Certificate:** Type A

**TypeOfCertificate Codes:**
- `1` = Class A PSV Unmarked
- `6` = Type A Bus
- `7` = Type A Matatu
- `8` = Type A Taxi

**Subcategories:**
- PSV Matatu (14-seater, 25-seater, 33-seater) → `TypeOfCertificate: 7`
- PSV Bus (51-seater, 62-seater) → `TypeOfCertificate: 6`
- PSV Taxi → `TypeOfCertificate: 8`

**Product Types:** All PSV products use Type A regardless of cover type

**Business Logic:**
```javascript
if (category === 'PSV') {
  certificateType = 'A';
  
  // Determine TypeOfCertificate code
  if (subcategory.includes('MATATU')) {
    payload.TypeOfCertificate = 7;
  } else if (subcategory.includes('BUS')) {
    payload.TypeOfCertificate = 6;
  } else if (subcategory.includes('TAXI')) {
    payload.TypeOfCertificate = 8;
  } else {
    payload.TypeOfCertificate = 1; // Default unmarked PSV
  }
}
```

---

### 2. PRIVATE Category → Type B or C

**Motor2 Category:** `PRIVATE`

**DMVIC Certificate:**
- **Type B** = Comprehensive or TPTF (Third Party Fire & Theft)
- **Type C** = Third Party Only

**Product Type Mapping:**

| Product Type | Cover Type | DMVIC Certificate | Notes |
|-------------|-----------|------------------|-------|
| `COMPREHENSIVE` | Comprehensive | Type B | Full coverage |
| `TOR` (Third Party Fire & Theft) | Time on Risk | Type B | Uses `Typeofcover: 300` |
| `THIRD_PARTY` | Third Party Only | Type C | Minimum cover |
| `THIRD_PARTY_EXT` | Third Party Extended | Type C | Third party + extras |

**Business Logic:**
```javascript
if (category === 'PRIVATE') {
  if (product_type === 'COMPREHENSIVE' || product_type === 'TOR') {
    certificateType = 'B';
    
    // TOR requires special Typeofcover code
    if (product_type === 'TOR') {
      payload.Typeofcover = 300; // Third Party Fire & Theft
    }
  } else if (product_type === 'THIRD_PARTY' || product_type === 'THIRD_PARTY_EXT') {
    certificateType = 'C';
  }
}
```

**Examples:**
- Private Saloon (Comprehensive) → Type B
- Private Saloon (Third Party Only) → Type C
- Private Station Wagon (TOR/TPTF) → Type B with `Typeofcover: 300`

---

### 3. COMMERCIAL Category → Type B or C

**Motor2 Category:** `COMMERCIAL`

**DMVIC Certificate:**
- **Type B** = Comprehensive or TPTF
- **Type C** = Third Party Only

**Product Type Mapping:**

| Product Type | Cover Type | DMVIC Certificate | Tonnage-Based Pricing |
|-------------|-----------|------------------|---------------------|
| `COMPREHENSIVE` | Comprehensive | Type B | Yes (Upto 3 Tons - Over 20 Tons) |
| `TOR` | Third Party Fire & Theft | Type B | Yes |
| `THIRD_PARTY` | Third Party Only | Type C | Yes |

**Business Logic:**
```javascript
if (category === 'COMMERCIAL') {
  if (product_type === 'COMPREHENSIVE' || product_type === 'TOR') {
    certificateType = 'B';
    
    // Include tonnage in payload
    payload.Tonnage = vehicle_details.tonnage; // e.g., "3", "5", "10", "20+"
    
    if (product_type === 'TOR') {
      payload.Typeofcover = 300;
    }
  } else if (product_type === 'THIRD_PARTY') {
    certificateType = 'C';
    payload.Tonnage = vehicle_details.tonnage;
  }
}
```

**Examples:**
- Commercial Pick-up 3 Tons (Comprehensive) → Type B
- Commercial Lorry 10 Tons (Third Party) → Type C
- Commercial Truck Over 20 Tons (TOR) → Type B with `Typeofcover: 300`

---

### 4. MOTORCYCLE Category → Type C (or Type B for Comprehensive)

**Motor2 Category:** `MOTORCYCLE`

**DMVIC Certificate:**
- **Type C** = Third Party Only (most common)
- **Type B** = Comprehensive (rare but supported)

**Product Type Mapping:**

| Product Type | Cover Type | DMVIC Certificate | Engine Capacity Based |
|-------------|-----------|------------------|---------------------|
| `THIRD_PARTY` | Third Party Only | Type C | Yes (50cc - 1000cc+) |
| `COMPREHENSIVE` | Comprehensive | Type B | Yes |

**Business Logic:**
```javascript
if (category === 'MOTORCYCLE') {
  if (product_type === 'COMPREHENSIVE') {
    certificateType = 'B';
  } else {
    certificateType = 'C'; // Third Party
  }
  
  // Include engine capacity
  payload.EngineCapacity = vehicle_details.engine_capacity; // e.g., "150cc", "250cc"
}
```

**Examples:**
- Motorcycle 150cc (Third Party) → Type C
- Motorcycle 500cc (Comprehensive) → Type B

---

### 5. TUKTUK Category → Type C (or Type B)

**Motor2 Category:** `TUKTUK`

**DMVIC Certificate:**
- **Type C** = Third Party Only (most common)
- **Type B** = Comprehensive (if offered)

**Product Type Mapping:**

| Product Type | Cover Type | DMVIC Certificate | Capacity Based |
|-------------|-----------|------------------|----------------|
| `THIRD_PARTY` | Third Party Only | Type C | Yes (2-seater, 3-seater, 6-seater) |
| `COMPREHENSIVE` | Comprehensive | Type B | Yes |

**Business Logic:**
```javascript
if (category === 'TUKTUK') {
  if (product_type === 'COMPREHENSIVE') {
    certificateType = 'B';
  } else {
    certificateType = 'C';
  }
  
  // Include seating capacity
  payload.SeatingCapacity = vehicle_details.capacity; // e.g., "3", "6"
}
```

**Examples:**
- TukTuk 3-seater (Third Party) → Type C
- TukTuk 6-seater (Comprehensive) → Type B

---

### 6. SPECIAL Category → Type D

**Motor2 Category:** `SPECIAL`

**DMVIC Certificate:** Type D

**Subcategories:**
- Agricultural Tractors
- Trailers
- Graders
- Institutional Vehicles
- Other specialized machinery

**Product Type Mapping:**

| Product Type | Cover Type | DMVIC Certificate | Notes |
|-------------|-----------|------------------|-------|
| `COMPREHENSIVE` | Comprehensive | Type D | Full coverage |
| `THIRD_PARTY` | Third Party Only | Type D | Minimum cover |

**Business Logic:**
```javascript
if (category === 'SPECIAL') {
  certificateType = 'D'; // Always Type D for special vehicles
  
  // Include special vehicle details
  payload.VehicleType = subcategory; // e.g., "TRACTOR", "TRAILER", "GRADER"
}
```

**Examples:**
- Agricultural Tractor (Comprehensive) → Type D
- Trailer (Third Party) → Type D
- Grader (Comprehensive) → Type D

---

## Decision Matrix

### Quick Reference Table

| Motor2 Category | Product Type | DMVIC Certificate | Special Fields |
|----------------|-------------|------------------|----------------|
| **PSV** | Any | **Type A** | `TypeOfCertificate` (1/6/7/8) |
| **PRIVATE** | COMPREHENSIVE | **Type B** | None |
| **PRIVATE** | TOR (TPTF) | **Type B** | `Typeofcover: 300` |
| **PRIVATE** | THIRD_PARTY | **Type C** | None |
| **PRIVATE** | THIRD_PARTY_EXT | **Type C** | None |
| **COMMERCIAL** | COMPREHENSIVE | **Type B** | `Tonnage` |
| **COMMERCIAL** | TOR | **Type B** | `Tonnage`, `Typeofcover: 300` |
| **COMMERCIAL** | THIRD_PARTY | **Type C** | `Tonnage` |
| **MOTORCYCLE** | COMPREHENSIVE | **Type B** | `EngineCapacity` |
| **MOTORCYCLE** | THIRD_PARTY | **Type C** | `EngineCapacity` |
| **TUKTUK** | COMPREHENSIVE | **Type B** | `SeatingCapacity` |
| **TUKTUK** | THIRD_PARTY | **Type C** | `SeatingCapacity` |
| **SPECIAL** | Any | **Type D** | `VehicleType` |

---

## Implementation Code

### Backend (Python/Django)

```python
def determine_certificate_type(policy: MotorPolicy) -> str:
    """
    Determine DMVIC certificate type from Motor2 policy
    
    Returns: 'A', 'B', 'C', or 'D'
    """
    product_details = policy.product_details
    category = product_details.get('category', '').upper()
    product_type = product_details.get('product_type', '').upper()
    
    # Type A: PSV
    if category == 'PSV':
        return 'A'
    
    # Type D: Special vehicles
    if category == 'SPECIAL':
        return 'D'
    
    # Type B or C: Private/Commercial/Motorcycle/TukTuk
    if category in ['PRIVATE', 'COMMERCIAL', 'MOTORCYCLE', 'TUKTUK']:
        # Type B: Comprehensive or TOR (TPTF)
        if product_type in ['COMPREHENSIVE', 'TOR']:
            return 'B'
        # Type C: Third Party
        else:
            return 'C'
    
    # Default to C (safest)
    return 'C'


def get_type_of_certificate_code(subcategory: str) -> int:
    """
    Get TypeOfCertificate code for PSV vehicles
    
    Returns: 1, 6, 7, or 8
    """
    subcategory_upper = subcategory.upper()
    
    if 'MATATU' in subcategory_upper:
        return 7  # Type A Matatu
    elif 'BUS' in subcategory_upper:
        return 6  # Type A Bus
    elif 'TAXI' in subcategory_upper:
        return 8  # Type A Taxi
    else:
        return 1  # Class A PSV Unmarked (default)
```

### Frontend (JavaScript/React Native)

```javascript
// frontend/services/MotorInsurancePricingService.js

export const determineCertificateType = (productDetails) => {
  const category = productDetails.category?.toUpperCase();
  const productType = productDetails.product_type?.toUpperCase();
  
  // PSV → Type A
  if (category === 'PSV') {
    return 'A';
  }
  
  // Special → Type D
  if (category === 'SPECIAL') {
    return 'D';
  }
  
  // Private/Commercial/Motorcycle/TukTuk → Type B or C
  if (['PRIVATE', 'COMMERCIAL', 'MOTORCYCLE', 'TUKTUK'].includes(category)) {
    // Comprehensive or TOR → Type B
    if (['COMPREHENSIVE', 'TOR'].includes(productType)) {
      return 'B';
    }
    // Third Party → Type C
    else {
      return 'C';
    }
  }
  
  // Default to C
  return 'C';
};

export const getTypeOfCertificateCode = (subcategory) => {
  const sub = subcategory.toUpperCase();
  
  if (sub.includes('MATATU')) return 7;
  if (sub.includes('BUS')) return 6;
  if (sub.includes('TAXI')) return 8;
  return 1; // Default
};
```

---

## Database Schema Requirements

### MotorPolicy Model Updates

Add these fields to `MotorPolicy` model:

```python
# insurance-app/app/models.py

class MotorPolicy(models.Model):
    # ... existing fields ...
    
    # DMVIC Certificate Fields
    dmvic_certificate_number = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
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
        choices=[('A', 'Type A - PSV'), ('B', 'Type B - Comprehensive'), ('C', 'Type C - Third Party'), ('D', 'Type D - Special')],
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
```

### Migration Command

```bash
cd insurance-app
python manage.py makemigrations
python manage.py migrate
```

---

## URL Configuration

Add DMVIC endpoints to `insurance-app/app/urls.py`:

```python
from app.views import dmvic_views

urlpatterns = [
    # ... existing patterns ...
    
    # DMVIC Endpoints
    path('dmvic/search-vehicle/', dmvic_views.search_vehicle, name='dmvic_search_vehicle'),
    path('dmvic/validate-double-insurance/', dmvic_views.validate_double_insurance, name='dmvic_validate_double_insurance'),
    path('dmvic/preview-certificate/', dmvic_views.preview_certificate, name='dmvic_preview_certificate'),
    path('dmvic/issue-certificate/', dmvic_views.issue_certificate, name='dmvic_issue_certificate'),
    path('dmvic/confirm-issuance/', dmvic_views.confirm_certificate_issuance, name='dmvic_confirm_issuance'),
    path('dmvic/get-certificate-pdf/', dmvic_views.get_certificate_pdf, name='dmvic_get_certificate_pdf'),
]
```

---

## Testing Checklist

### Per Category Testing

- [ ] **PSV Matatu** → Type A with `TypeOfCertificate: 7`
- [ ] **PSV Bus** → Type A with `TypeOfCertificate: 6`
- [ ] **PSV Taxi** → Type A with `TypeOfCertificate: 8`
- [ ] **Private Comprehensive** → Type B
- [ ] **Private TOR** → Type B with `Typeofcover: 300`
- [ ] **Private Third Party** → Type C
- [ ] **Commercial 3 Tons Comprehensive** → Type B with tonnage
- [ ] **Commercial 10 Tons Third Party** → Type C with tonnage
- [ ] **Motorcycle 150cc Third Party** → Type C
- [ ] **Motorcycle 500cc Comprehensive** → Type B
- [ ] **TukTuk 3-seater Third Party** → Type C
- [ ] **Special Tractor** → Type D

### Endpoint Testing

- [ ] Vehicle search returns valid NTSA data
- [ ] Preview generates temporary PDF URL (24h validity)
- [ ] Issuance returns certificate number and transaction number
- [ ] Confirmation updates policy status
- [ ] PDF download works with certificate number

---

## Error Scenarios

### Common Issues

| Error Code | Meaning | Solution |
|-----------|---------|----------|
| ER001 | Invalid JSON format or missing required fields | Validate payload with `DMVICFieldMapper.validate_payload()` |
| ER002 | Authentication failed | Check token expiry, refresh if needed |
| ER003 | Double insurance detected | Use `validate_double_insurance()` before issuance |
| ER004 | Vehicle not found in NTSA | Verify registration number format |
| ER005 | Endpoint not enabled for client | Contact DMVIC to enable endpoint access |

### Validation Checklist

Before calling DMVIC APIs:

1. ✅ Policy payment confirmed
2. ✅ Vehicle details complete (registration, chassis, make, model, year)
3. ✅ Client details verified (name, ID number, phone)
4. ✅ Cover start/end dates valid
5. ✅ Certificate type correctly determined
6. ✅ No double insurance (if required)

---

## Frontend Integration Points

### Motor2 Payment Success Flow

```javascript
// frontend/screens/Motor 2/Payment/PaymentSuccessScreen.js

const handlePaymentSuccess = async (policy) => {
  try {
    // 1. Issue DMVIC certificate automatically
    const dmvicResult = await DjangoAPIService.makeRequest(
      'dmvic/issue-certificate/',
      {
        method: 'POST',
        body: JSON.stringify({ policy_id: policy.id })
      }
    );
    
    if (dmvicResult.success) {
      console.log('DMVIC Certificate:', dmvicResult.certificate_number);
      
      // 2. Show certificate details to user
      Alert.alert(
        'Certificate Issued',
        `DMVIC Certificate ${dmvicResult.certificate_number} issued successfully!`,
        [
          {
            text: 'Download Certificate',
            onPress: () => downloadCertificate(dmvicResult.certificate_number)
          }
        ]
      );
    }
  } catch (error) {
    console.error('DMVIC issuance failed:', error);
    // Policy still valid, certificate can be issued later
  }
};
```

---

## Notes

- **Type A (PSV)** certificates require the additional `TypeOfCertificate` field
- **Type B (Comprehensive/TOR)** supports private, commercial, motorcycle, and tuktuks
- **Type C (Third Party)** is the minimum legal requirement in Kenya
- **Type D (Special)** covers agricultural and specialized vehicles
- **TOR (Time on Risk/TPTF)** products use Type B with `Typeofcover: 300`
- DMVIC endpoints may require specific permissions enabled on the client account
- Preview PDFs expire after 24 hours
- Certificate issuance is irreversible - validate thoroughly before calling

---

## References

- DMVIC API Specification v1.8.0
- PataBima Motor2 Product Catalog (60+ products)
- Kenya Motor Insurance Act (Chapter 405)
- Insurance Regulatory Authority (IRA) Guidelines
