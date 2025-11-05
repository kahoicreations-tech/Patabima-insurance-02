# Motor2 Flow: Frontend Selection → Backend Processing

## Overview
This document explains the complete flow of how a user creates a motor insurance policy through the PataBima app, from initial category selection to DMVIC certificate issuance.

---

## 🎯 Complete User Journey

### **Phase 1: Product Selection**
**Frontend Screens:** Category Selection → Subcategory Selection

#### User Actions:
1. User taps "Motor Insurance" on dashboard
2. Sees 6 category cards: **Private, Commercial, PSV, Motorcycle, TukTuk, Special**
3. Selects category (e.g., "Private")
4. Sees subcategory options (e.g., "Saloon", "Station Wagon", "SUV")
5. Selects subcategory and cover type (Comprehensive, Third Party, TOR)

#### Backend Action:
```javascript
// Frontend calls
GET /api/motor2/categories/
GET /api/motor2/subcategories/?category=PRIVATE

// Backend returns
{
  categories: [
    { code: 'PRIVATE', name: 'Private Vehicles', icon: '🚗' },
    { code: 'COMMERCIAL', name: 'Commercial Vehicles', icon: '🚚' },
    { code: 'PSV', name: 'Public Service Vehicles', icon: '🚌' },
    // ...
  ],
  subcategories: [
    { 
      code: 'PRIV_SALOON_COMP',
      name: 'Private Saloon - Comprehensive',
      category: 'PRIVATE',
      product_type: 'COMPREHENSIVE',
      pricing_model: 'BRACKET'
    },
    // ...
  ]
}
```

**Backend Cache:** 7 days (categories/subcategories are static)

---

### **Phase 2: Vehicle Details**
**Frontend Screens:** Vehicle Search → Vehicle Information Form

#### User Actions:
1. **Option A:** Enter registration number → Auto-fill from NTSA/DMVIC
   - Frontend calls: `POST /api/dmvic/search-vehicle/`
   - Backend calls DMVIC API, returns vehicle data
   - Form auto-fills: Make, Model, Year, Chassis, Engine Number

2. **Option B:** Manual entry (for new/unregistered vehicles)
   - User manually enters all vehicle details

3. Enter additional details:
   - Sum Insured / Vehicle Value
   - Tonnage (Commercial vehicles)
   - Passenger Capacity (PSV)
   - Engine Capacity (Motorcycles)
   - Year of Manufacture
   - Color, Body Type

#### Backend Action:
```python
# DMVIC Vehicle Search (Optional)
POST /api/dmvic/search-vehicle/
{
  "registration_number": "KCA123A"
}

# Backend calls DMVICService
dmvic_service = DMVICService()
vehicle_data = dmvic_service.search_vehicle("KCA123A")

# Returns NTSA data
{
  "success": true,
  "vehicle": {
    "RegistrationNumber": "KCA123A",
    "ChassisNumber": "ZNE10-0371893",
    "VehicleMake": "TOYOTA",
    "VehicleModel": "COROLLA",
    "YearOfManufacture": "2005",
    "EngineNumber": "1NZFE-0123456",
    "Color": "SILVER"
  }
}
```

**Real-time Validation:**
- VIN/Chassis format validation
- Year range validation (1980-2026)
- Sum insured minimum/maximum checks

---

### **Phase 3: Premium Calculation & Underwriter Comparison**
**Frontend Screens:** Pricing Calculation → Underwriter Comparison

#### User Actions:
1. System auto-calculates premium as user enters sum insured
2. Shows "Comparing underwriters..." loading state
3. Displays comparison table with 3-5 underwriters:
   - Underwriter name + logo
   - Base premium
   - Levies breakdown (ITL, PCF, Stamp Duty)
   - Total premium
4. User selects preferred underwriter

#### Backend Action:
```python
# Auto-triggered on form field changes (debounced 1 second)
POST /api/motor2/compare-pricing/
{
  "subcategory_code": "PRIV_SALOON_COMP",
  "sum_insured": 1500000,
  "year": 2018,
  "category": "PRIVATE",
  "product_type": "COMPREHENSIVE"
}

# Backend process:
1. Check cache (key: "UW_SUBCAT|PRIV_SALOON_COMP|1500000|0|0")
2. If not cached, call MotorInsurancePricingService
3. Determine pricing model (bracket-based for Comprehensive)
4. Query multiple underwriters from database
5. Calculate base premium for each underwriter
6. Add mandatory levies:
   - ITL: base_premium * 0.0025
   - PCF: base_premium * 0.0025
   - Stamp Duty: KSh 40 (fixed)
7. Sort by total premium (lowest first)
8. Cache for 12 hours
9. Return comparison

# Response
{
  "comparisons": [
    {
      "underwriter_code": "UW001",
      "underwriter_name": "Britam Insurance",
      "base_premium": 45000.00,
      "total_premium": 45152.50,
      "breakdown": {
        "base": 45000.00,
        "itl": 112.50,
        "pcf": 112.50,
        "stamp_duty": 40.00
      }
    },
    // ... more underwriters
  ]
}
```

**Pricing Models:**
- **Bracket-based:** Sum insured ranges (Comprehensive)
- **Fixed:** Flat rate (TOR, Third Party)
- **Tonnage-based:** Weight tiers (Commercial)
- **Capacity-based:** Passenger count (PSV)

**Cache Strategy:**
- Key: Subcategory + Sum Insured (bucketed to 50k) + Tonnage/Capacity
- TTL: 12 hours
- Invalidation: Manual or on pricing updates

---

### **Phase 4: Client Details**
**Frontend Screens:** Client Information Form

#### User Actions:
1. Enter client details:
   - Full Name
   - ID Number / Passport
   - Phone Number
   - Email
   - KRA PIN (optional but recommended)
   - Physical Address
2. Upload documents (optional):
   - Copy of ID
   - Logbook (for comprehensive)
   - KRA PIN certificate

#### Backend Action:
```python
# No backend call yet - stored in frontend state
# Validation happens on frontend:
- ID number format (8 digits)
- Phone number format (Kenyan 07XX or 01XX)
- Email format
- KRA PIN format (AXXXXXXXXX)
```

**Storage:** Context API state (not persisted until payment)

---

### **Phase 5: Add-ons & Extras (Optional)**
**Frontend Screens:** Add-ons Selection

#### User Actions:
1. View available add-ons:
   - Windscreen cover
   - Radio/Entertainment system
   - Passenger Personal Accident (PPA)
   - Political Violence & Terrorism (PVT)
   - Excess Protector
2. Select desired add-ons
3. See updated total premium

#### Backend Action:
```python
# Add-ons pricing (if implemented)
GET /api/motor2/addons/?subcategory=PRIV_SALOON_COMP

# Returns available add-ons with pricing
{
  "addons": [
    {
      "code": "WINDSCREEN",
      "name": "Windscreen Cover",
      "premium": 2500.00,
      "description": "Covers windscreen damage/replacement"
    },
    // ...
  ]
}
```

**Premium Recalculation:** Frontend adds add-on premiums to base total

---

### **Phase 6: Payment**
**Frontend Screens:** Payment Method Selection → Payment Confirmation

#### User Actions:
1. Review policy summary (all details + premium breakdown)
2. Select payment method:
   - M-PESA (STK Push)
   - Card Payment (DPO Pay)
   - Bank Transfer
3. Initiate payment
4. Complete payment (enter M-PESA PIN or card details)
5. Wait for payment confirmation

#### Backend Action:
```python
# Step 1: Create quote/policy (DRAFT status)
POST /api/motor2/quotes/
{
  "client_details": {...},
  "vehicle_details": {...},
  "product_details": {
    "category": "PRIVATE",
    "subcategory": "PRIV_SALOON_COMP",
    "product_type": "COMPREHENSIVE"
  },
  "underwriter_details": {...},
  "premium_breakdown": {...},
  "addons": [...]
}

# Backend creates MotorPolicy
policy = MotorPolicy.objects.create(
    policy_number="POL-2025-123456",  # Auto-generated
    user=request.user,
    client_details=request.data['client_details'],
    vehicle_details=request.data['vehicle_details'],
    product_details=request.data['product_details'],
    underwriter_details=request.data['underwriter_details'],
    premium_breakdown=request.data['premium_breakdown'],
    addons=request.data['addons'],
    status='DRAFT',  # Initial status
    cover_start_date=None,  # Set after payment
    cover_end_date=None
)

# Returns policy_id for payment

# Step 2: Initiate payment
POST /api/payments/mpesa/stk-push/
{
  "policy_id": 123,
  "phone_number": "254712345678",
  "amount": 45152.50
}

# Backend integrates with M-PESA Daraja API
# Returns transaction reference

# Step 3: Payment callback (from M-PESA)
POST /api/payments/mpesa/callback/
{
  "transaction_id": "QFX12345",
  "policy_id": 123,
  "status": "SUCCESS",
  "amount": 45152.50
}

# Backend updates policy
policy.payment_details = {
    "method": "MPESA",
    "transaction_id": "QFX12345",
    "amount": 45152.50,
    "status": "CONFIRMED",
    "paid_at": timezone.now()
}
policy.status = 'PENDING_PAYMENT'  # Until DMVIC cert issued
policy.cover_start_date = timezone.now().date()
policy.cover_end_date = timezone.now().date() + timedelta(days=365)
policy.save()
```

---

### **Phase 7: DMVIC Certificate Issuance (Automatic)**
**Backend Process:** Triggered immediately after payment confirmation

#### Backend Action:
```python
# Auto-triggered by payment callback
# No user action required

# Step 1: Determine certificate type
certificate_type = determine_certificate_type(policy)
# Returns: 'A', 'B', 'C', or 'D' based on category/product_type

# Step 2: Map policy to DMVIC payload
mapper = DMVICFieldMapper()
dmvic_payload = mapper.map_policy_to_dmvic(
    policy, 
    certificate_type=certificate_type
)

# Step 3: Validate payload
is_valid, errors = mapper.validate_payload(
    dmvic_payload, 
    certificate_type=certificate_type
)

# Step 4: Issue certificate via DMVIC API
dmvic_service = DMVICService()

if certificate_type == 'A':
    result = dmvic_service.issue_type_a_certificate(dmvic_payload)
elif certificate_type == 'B':
    result = dmvic_service.issue_type_b_certificate(dmvic_payload)
elif certificate_type == 'C':
    result = dmvic_service.issue_type_c_certificate(dmvic_payload)
elif certificate_type == 'D':
    result = dmvic_service.issue_type_d_certificate(dmvic_payload)

# Step 5: Update policy with certificate details
policy.dmvic_certificate_number = result['certificate_number']
policy.dmvic_transaction_no = result['transaction_no']
policy.dmvic_certificate_type = certificate_type
policy.dmvic_issued_at = timezone.now()
policy.status = 'ACTIVE'  # Policy now fully active
policy.save()

# Step 6: Generate policy documents (PDF)
# - Policy Schedule
# - Payment Receipt
# - DMVIC Certificate

# Step 7: Send notifications
# - SMS to client with policy number and certificate number
# - Email with PDF attachments
# - Push notification to app
```

**Certificate Type Mapping:**
- **PSV** → Type A (with TypeOfCertificate code)
- **Private Comprehensive/TOR** → Type B
- **Private Third Party** → Type C
- **Commercial Comprehensive/TOR** → Type B
- **Commercial Third Party** → Type C
- **Motorcycle/TukTuk Comprehensive** → Type B
- **Motorcycle/TukTuk Third Party** → Type C
- **Special** → Type D

---

### **Phase 8: Confirmation & Policy Delivery**
**Frontend Screens:** Payment Success → Policy Details

#### User Actions:
1. See success screen:
   - Policy number (POL-2025-123456)
   - DMVIC certificate number (e.g., B1234567)
   - Cover dates
2. Download documents:
   - Policy Schedule PDF
   - Payment Receipt PDF
   - DMVIC Certificate PDF
3. Share certificate via WhatsApp/Email
4. View policy in "My Policies" section

#### Backend Action:
```python
# Get policy details
GET /api/motor2/policies/{policy_id}/

# Returns complete policy with DMVIC details
{
  "policy_number": "POL-2025-123456",
  "status": "ACTIVE",
  "client_details": {...},
  "vehicle_details": {...},
  "product_details": {...},
  "premium_breakdown": {...},
  "cover_start_date": "2025-11-04",
  "cover_end_date": "2026-11-04",
  "dmvic_certificate_number": "B1234567",
  "dmvic_certificate_type": "B",
  "dmvic_issued_at": "2025-11-04T10:30:00Z",
  "policy_document_url": "https://s3.../POL-2025-123456.pdf",
  "certificate_url": "https://s3.../DMVIC_B1234567.pdf"
}

# Download DMVIC certificate
POST /api/dmvic/get-certificate-pdf/
{
  "policy_id": 123
}

# Returns base64-encoded PDF for download
```

---

## 📊 Data Flow Summary

```
User Selection → Frontend State → Backend API → Database/DMVIC
     ↓              ↓                ↓              ↓
  Category      Context API      REST Views      MotorPolicy
     ↓              ↓                ↓              ↓
Subcategory    Form Data     Pricing Service   DMVIC API
     ↓              ↓                ↓              ↓
  Vehicle      Validation    Underwriter DB    Certificate
     ↓              ↓                ↓              ↓
  Client       Cache Check   Payment Gateway   Notification
     ↓              ↓                ↓              ↓
 Payment      Policy Create     M-PESA API      SMS/Email
     ↓              ↓                ↓              ↓
  Success     Status Update   DMVIC Issuance    PDF Storage
```

---

## 🔄 State Management Flow

### Frontend Context State:
```javascript
MotorInsuranceContext {
  selectedCategory: 'PRIVATE',
  selectedSubcategory: {
    code: 'PRIV_SALOON_COMP',
    product_type: 'COMPREHENSIVE'
  },
  vehicleDetails: {
    registration_number: 'KCA123A',
    make: 'TOYOTA',
    model: 'COROLLA',
    year: 2018,
    sum_insured: 1500000,
    chassis_number: 'ZNE10-0371893'
  },
  pricingComparison: [
    { underwriter: 'Britam', premium: 45152.50 },
    { underwriter: 'APA', premium: 46000.00 }
  ],
  selectedUnderwriter: { code: 'UW001', name: 'Britam' },
  clientDetails: {
    name: 'John Doe',
    id_number: '12345678',
    phone: '0712345678',
    email: 'john@example.com'
  },
  calculatedPremium: {
    base: 45000.00,
    itl: 112.50,
    pcf: 112.50,
    stamp_duty: 40.00,
    total: 45152.50
  },
  currentStep: 5  // Payment step
}
```

### Backend Database State:
```python
MotorPolicy {
    id: 123,
    policy_number: 'POL-2025-123456',
    user_id: 456,
    status: 'ACTIVE',  # DRAFT → PENDING_PAYMENT → ACTIVE
    
    # JSON fields
    client_details: {...},
    vehicle_details: {...},
    product_details: {...},
    underwriter_details: {...},
    premium_breakdown: {...},
    payment_details: {...},
    
    # DMVIC fields
    dmvic_certificate_number: 'B1234567',
    dmvic_transaction_no: 'TXN-2025-001',
    dmvic_certificate_type: 'B',
    dmvic_issued_at: datetime(2025, 11, 4, 10, 30),
    
    # Dates
    cover_start_date: date(2025, 11, 4),
    cover_end_date: date(2026, 11, 4),
    submitted_at: datetime(2025, 11, 4, 10, 25)
}
```

---

## ⚡ Performance Optimizations

### Frontend:
- **Category/Subcategory:** Cached 7 days in SimpleCache
- **Pricing Comparison:** Debounced 1 second, cached 12 hours
- **Underwriter List:** Cached 6 hours per category
- **Form State:** Refs for flags to prevent re-render loops
- **Memoized Components:** TextInput, calculation functions

### Backend:
- **Database Queries:** Indexed on policy_number, status, user_id
- **API Calls:** Request deduplication via _inflight Map
- **DMVIC Authentication:** Token cached, auto-refresh on 401
- **Pricing Calculations:** Pre-computed brackets, cached results

---

## 🔒 Security & Validation

### Frontend Validation:
- Real-time field validation (ID format, phone, email)
- Sum insured range checks (min/max per category)
- Required field enforcement
- Duplicate submission prevention

### Backend Validation:
- User authentication (JWT token required)
- Policy ownership verification (user owns policy)
- Payment confirmation before status change
- DMVIC payload validation before API calls
- Database constraints (unique policy_number)

---

## 📱 API Endpoints Used (Complete Flow)

```
1. GET  /api/motor2/categories/
2. GET  /api/motor2/subcategories/?category=PRIVATE
3. POST /api/dmvic/search-vehicle/                    # Optional
4. POST /api/motor2/compare-pricing/
5. POST /api/motor2/quotes/                            # Create policy
6. POST /api/payments/mpesa/stk-push/
7. POST /api/payments/mpesa/callback/                  # Webhook
8. POST /api/dmvic/issue-certificate/                  # Auto-triggered
9. GET  /api/motor2/policies/{id}/
10. POST /api/dmvic/get-certificate-pdf/
```

---

## 🎯 Success Criteria

**Policy Created Successfully When:**
1. ✅ Payment confirmed (transaction_id present)
2. ✅ DMVIC certificate issued (certificate_number present)
3. ✅ Cover dates set (start and end dates)
4. ✅ Status = ACTIVE
5. ✅ All required fields populated
6. ✅ Documents generated (PDF URLs)

**Typical Processing Time:**
- Category selection → Quote creation: 2-3 minutes
- Payment confirmation: 10-30 seconds (M-PESA)
- DMVIC certificate issuance: 5-10 seconds
- **Total:** ~3 minutes from start to finish

---

## 📝 Notes

- **DMVIC Integration:** Fully automatic after payment
- **Certificate Types:** Auto-detected from product selection
- **Error Handling:** Graceful fallbacks, retry logic
- **Offline Support:** Form data persisted in AsyncStorage
- **Real-time Updates:** WebSocket for payment status (optional)

**Implementation Date:** November 4, 2025  
**Version:** 1.0.0
