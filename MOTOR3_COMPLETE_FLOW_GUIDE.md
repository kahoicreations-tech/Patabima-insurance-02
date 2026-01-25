# Motor3 Insurance Flow - Complete Guide

**PataBima Insurance Application**  
_Updated: January 18, 2026_

---

## 📊 Overview

The Motor3 flow handles all motor insurance quotations from initial selection through policy creation. It supports two main product types:

1. **Third-Party Insurance** (Fixed Pricing) - 9 Steps
2. **Comprehensive Insurance** (Bracket Pricing) - 9 Steps

---

## 🏗️ Architecture

### Entry Point

**File**: `frontend/screens/quotations/Motor3/Motor3Container.js`

The container:

- Wraps everything in `Motor3Provider` context
- Clears cache on mount for fresh start
- Routes to appropriate flow based on product type
- Handles error boundaries

### Flow Routing Logic

```
Product Selection → getFlowType() → ThirdPartyFlow OR ComprehensiveFlow
```

---

## 🔄 Complete Third-Party Insurance Flow

**File**: `frontend/screens/quotations/Motor3/third-party/ThirdPartyFlow.js`

### Step 1: Category Selection

**File**: `third-party/steps/Step1_CategorySelection.js`

- **Purpose**: Select main vehicle category
- **Categories**: Private, Commercial, PSV, Motorcycle, Special Types
- **Optional DMVIC Check**: Quick registration verification
- **Data Stored**: `selectedCategory`
- **Navigation**: → Step 2 (Subcategory)

### Step 2: Subcategory Selection

**File**: `third-party/steps/Step1b_SubcategorySelection.js`

- **Purpose**: Select specific insurance product
- **Products**: Third-Party Only, Third-Party + TOR (Theft of Robbery), Extendible products
- **Data Stored**: `selectedSubcategory`, `selectedProduct`
- **Navigation**: → Step 3 (Vehicle Details)

### Step 3: Vehicle Details

**File**: `third-party/steps/Step2_VehicleDetails.js`

- **Purpose**: Capture complete vehicle information
- **Key Features**:
  - Registration number input
  - Identification type (Registration or Chassis)
  - Cover start date selection
  - **DMVIC Verification** (60-second timeout)
    - Checks for existing active cover
    - Validates registration in NTSA database
    - Auto-fills vehicle details (make, model, year)
    - Shows VehicleVerificationDrawer if existing cover found
  - Financial interest selection
  - Additional fields (tonnage, capacity, engine CC) based on category
- **Component**: `TPVehicleForm.js`
- **Validation**: Registration format, date validation, DMVIC compliance
- **Data Stored**: Full vehicle details, DMVIC verification result
- **Navigation**: → Step 4 (Underwriter Selection)

### Step 4: Underwriter Selection

**File**: `third-party/steps/Step3_UnderwriterSelection.js`

- **Purpose**: Compare and select insurance underwriter
- **Features**:
  - Fetches available underwriters for selected product
  - Displays premium comparison (auto-calculated)
  - Shows underwriter details (commission, features)
  - Filters based on vehicle category compatibility
- **Hook**: `useTPUnderwriters.js`
- **Data Stored**: Selected underwriter, calculated premium
- **Navigation**: → Step 5 (Client Details)

### Step 5: Client Details

**File**: `third-party/steps/Step4_ClientDetails.js`

- **Purpose**: Capture client/policyholder information
- **Fields**:
  - Full name
  - Email address
  - Phone number
  - ID number
  - Physical address
  - City
  - Postal code
- **Component**: Reusable `shared/ClientDetails/EnhancedClientForm.js`
- **Validation**: Email format, phone format, ID number
- **Data Stored**: Complete client details
- **Navigation**: → Step 6 (Document Upload)

### Step 6: Document Upload

**File**: `third-party/steps/Step5_DocumentUpload.js`

- **Purpose**: Upload required documents
- **Required Documents**:
  - Vehicle logbook (front & back)
  - ID/Passport (front & back)
  - KRA PIN Certificate
  - Previous insurance certificate (if renewal)
- **Features**:
  - Camera capture or gallery selection
  - Image compression
  - Preview before upload
  - OCR extraction (backend)
- **Component**: Reusable `shared/DocumentsUpload/DocumentsUpload.js`
- **Data Stored**: Document URIs and metadata
- **Navigation**: → Step 7 (Review)

### Step 7: Review & Confirm

**File**: `third-party/steps/Step6_Review.js`

- **Purpose**: Final review before payment
- **Displays**:
  - Selected product summary
  - Vehicle details
  - Client information
  - Premium breakdown (base + levies + total)
  - Underwriter details
  - Document list
- **Actions**:
  - Edit any section (jumps back to that step)
  - Confirm accuracy checkbox
- **Navigation**: → Step 8 (Payment)

### Step 8: Payment

**File**: `third-party/steps/Step7_Payment.js`

- **Purpose**: Process payment
- **Payment Methods**:
  - M-PESA (Lipa Na M-PESA)
  - DPO Pay (Card payments)
  - USSD (for offline payments)
- **Features**:
  - Payment amount display
  - Payment method selection
  - Phone number input (for M-PESA)
  - Payment status tracking
  - Retry on failure
- **Component**: Reusable `shared/Payment/PaymentScreen.js`
- **Important**: For **Extendible products**, only initial amount is paid here
- **Data Stored**: Payment method, transaction ID, payment status
- **Navigation**: → Step 9 (Submission)

### Step 9: Policy Submission

**File**: `third-party/steps/Step8_Submission.js`

- **Purpose**: Submit policy to backend and issue certificate
- **Process**:
  1. **Double-Insurance Check** (DMVIC - 60-second timeout)
     - Validates no active cover exists
     - BLOCKS submission if active cover found
     - Shows detailed warning with existing policy info
  2. **Data Validation**
     - Validates all required fields
     - Sanitizes data (removes null bytes)
     - Validates extendible config (if applicable)
  3. **Policy Creation** (Backend API)
     - Submits complete policy data
     - Creates motor policy record
     - Associates payment
     - Stores documents
  4. **DMVIC Certificate Issuance** (60-second timeout)
     - Requests certificate from DMVIC
     - Receives certificate number
     - Stores certificate reference
- **Component**: `shared/Submission/PolicySubmission.js`
- **Critical Validations**:
  - Payment confirmation required
  - DMVIC double-insurance check (MANDATORY)
  - Extendible config validation (if product is extendible)
  - Document sanitization (PostgreSQL compatibility)
- **Error Handling**:
  - DMVIC timeout errors (with retry)
  - Payment verification failures
  - Network errors
  - Backend validation errors
- **Navigation**: → Policy Success Screen

---

## 🎉 Success Screen

**File**: `shared/Success/PolicySuccess.js`

### Displayed Information:

- ✅ Success message
- Policy number
- Certificate number (if issued)
- Underwriter details
- Premium paid
- Coverage period
- Vehicle details

### Available Actions:

1. **Download Certificate** (PDF)
   - Fetches DMVIC certificate
   - Saves to device
   - Shares via system share sheet
2. **Issue DMVIC Certificate** (if not auto-issued)
   - Manual trigger for certificate issuance (60-second timeout)
   - Shows certificate number on success
3. **View Policy Details**
   - Navigate to policy details screen
4. **Done**
   - Returns to quotations list
   - Clears flow cache

---

## 🔄 Comprehensive Insurance Flow

**File**: `frontend/screens/quotations/Motor3/comprehensive/ComprehensiveFlow.js`

### Differences from Third-Party:

**Step 1-2**: Uses same Category/Subcategory selection (from ThirdPartyFlow)

**Step 3: Vehicle Details**
**File**: `comprehensive/steps/Step2_VehicleDetails.js`

- Same as Third-Party but with additional fields
- Includes value-based fields for comprehensive coverage

**Step 4: Pricing Inputs** _(NEW - Comprehensive Only)_
**File**: `comprehensive/steps/Step3_PricingInputs.js`

- **Purpose**: Capture pricing bracket information
- **Fields**:
  - Vehicle value (sum insured)
  - Excess amount selection
  - Additional covers (windscreen, radio, etc.)
  - Driver age and experience
- **Features**:
  - Real-time premium calculation
  - Bracket-based pricing tiers
  - Optional covers toggle
- **Data Stored**: Pricing inputs, calculated premium
- **Navigation**: → Step 5 (Underwriter Selection)

**Step 5-9**: Same as Third-Party flow

- Underwriter Selection
- Client Details
- Document Upload
- Review & Confirm
- Payment
- Submission

---

## 🔧 Shared Components

### Context Providers

1. **Motor3Context** (`contexts/Motor3Context.js`)
   - Global state for entire Motor3 flow
   - Manages category/subcategory selection
   - DMVIC search results cache
   - Flow navigation state

2. **ThirdPartyContext** (`contexts/ThirdPartyContext.js`)
   - Third-Party flow-specific state
   - Form data management
   - Validation errors
   - DMVIC data locking

3. **ComprehensiveContext** (`contexts/ComprehensiveContext.js`)
   - Comprehensive flow-specific state
   - Pricing bracket data
   - Additional covers

### Reusable Components

Located in `shared/` directory:

1. **CategorySelection** - Vehicle type selection grid
2. **ClientDetails** - Enhanced client form
3. **DocumentsUpload** - Document capture/upload
4. **Payment** - Payment processing screens
5. **Submission** - Policy submission logic
6. **Success** - Success confirmation screen
7. **UnderwriterComparison** - Underwriter comparison cards

### Form Components

Located in `components/` directory:

- `StableTextInput.js` - Text input with debouncing
- `DatePicker.js` - Date selection
- `DropdownSelect.js` - Dropdown picker
- `RadioGroup.js` - Radio button group
- `CheckboxGroup.js` - Checkbox group
- `CurrencyInput.js` - Currency formatting input
- `VehicleMakeSelector.js` - Make selection with search
- `VehicleModelSelector.js` - Model selection based on make
- `VehicleYearSelector.js` - Year picker
- `TonnageSelector.js` - Tonnage input
- `PassengerCapacityInput.js` - Capacity selector
- `Motor3Stepper.js` - Progress stepper

---

## 🔐 DMVIC Integration Points

### 1. Vehicle Verification (Optional - Step 1)

- **Endpoint**: `/api/insurance/dmvic/search-vehicle/`
- **Timeout**: 60 seconds
- **Purpose**: Quick check during category selection
- **Non-blocking**: User can proceed even if DMVIC is unavailable

### 2. Vehicle Details Verification (Required - Step 3)

- **Endpoint**: `/api/insurance/dmvic/search-vehicle/`
- **Timeout**: 60 seconds
- **Purpose**:
  - Verify registration in NTSA database
  - Check for existing active cover
  - Auto-fill vehicle details
- **Blocking**: Must complete or user acknowledges warning
- **Data Retrieved**:
  - Make, Model, Year
  - Chassis number
  - Engine number
  - Logbook number
  - Color
  - Current policy status
  - Policy history

### 3. Double-Insurance Validation (Critical - Step 9)

- **Endpoint**: `/api/insurance/dmvic/validate-double-insurance/`
- **Timeout**: 60 seconds
- **Purpose**: Regulatory compliance check
- **MANDATORY**: BLOCKS submission if active cover exists
- **Authority**: DMVIC decision is FINAL
- **Error Handling**: Retry on timeout, strict validation

### 4. Certificate Issuance (Step 9 / Success Screen)

- **Endpoint**: `/api/insurance/dmvic/issue-certificate/`
- **Timeout**: 60 seconds
- **Purpose**: Issue official DMVIC certificate
- **Process**:
  - Submit policy details to DMVIC
  - Receive certificate number
  - Store certificate reference
- **Fallback**: Manual issuance from success screen

### 5. Certificate PDF Download (Success Screen)

- **Endpoint**: `/api/insurance/dmvic/get-certificate-pdf/`
- **Timeout**: 60 seconds
- **Purpose**: Download PDF certificate
- **Features**:
  - Save to device
  - Share via system share sheet
  - View in PDF viewer

---

## ⏱️ Timeout Configuration

**All DMVIC endpoints now use 60-second timeout** (updated January 18, 2026):

**Reason**: DMVIC external API can be slow, and the default 30-second timeout was causing premature failures.

**Files Updated**:

- `DjangoAPIService.js` - All DMVIC methods
- `Step1_CategorySelection.js` - Vehicle search
- `Step2_VehicleDetails.js` - Vehicle verification
- `PolicyDetailsStep.js` (Motor2) - Vehicle search
- `PolicySubmission.js` - Double-insurance check (via service)
- `PolicySuccess.js` - Certificate operations

---

## 💾 Data Storage

### AsyncStorage Keys:

- `MOTOR3_FLOW_STATE` - Current flow state
- `MOTOR3_VEHICLE_DETAILS` - Vehicle form data
- `MOTOR3_CLIENT_DETAILS` - Client form data
- `MOTOR3_UNDERWRITER_SELECTION` - Selected underwriter
- `MOTOR3_DOCUMENTS` - Uploaded documents
- `MOTOR3_CATEGORY_SELECTION` - Category selection
- `MOTOR3_SUBCATEGORY_SELECTION` - Subcategory selection
- `DMVIC_CACHE` - DMVIC verification results

**Cache Clearing**: All cache is cleared on Motor3Container mount for fresh start.

---

## 🛠️ Error Handling

### Step-Level Validation

Each step validates its data before allowing navigation:

- **validateStep()** in `utils/stepValidation.js`
- Returns `{ canProceed: boolean, validationMessage: string }`
- Prevents progression with incomplete data

### DMVIC Error Handling

- **Timeout errors**: Show retry option
- **Vehicle not found**: Allow manual entry or retry
- **Active cover detected**: BLOCK with detailed warning
- **Network errors**: Show error message with retry

### Payment Error Handling

- **Payment failed**: Retry payment
- **Payment pending**: Poll for status
- **Timeout**: Show manual verification option

### Submission Error Handling

- **Validation errors**: Show field-specific errors
- **Backend errors**: Display user-friendly message
- **Network errors**: Retry with exponential backoff
- **DMVIC blocking**: Cannot proceed, must resolve

---

## 📱 Navigation Flow Map

```
Motor3Container
  ↓
Motor3Provider
  ↓
[Category Selected] → ThirdPartyFlow OR ComprehensiveFlow
  ↓
╔════════════════ THIRD-PARTY FLOW ════════════════╗
║                                                   ║
║  Step 1: Category Selection                      ║
║           ↓                                       ║
║  Step 2: Subcategory Selection                   ║
║           ↓                                       ║
║  Step 3: Vehicle Details                         ║
║           ├─→ DMVIC Verification (60s timeout)   ║
║           └─→ VehicleVerificationDrawer (if needed)
║           ↓                                       ║
║  Step 4: Underwriter Selection                   ║
║           ├─→ Fetch Underwriters                 ║
║           └─→ Calculate Premiums                 ║
║           ↓                                       ║
║  Step 5: Client Details                          ║
║           ↓                                       ║
║  Step 6: Document Upload                         ║
║           ├─→ Camera Capture                     ║
║           └─→ Gallery Selection                  ║
║           ↓                                       ║
║  Step 7: Review & Confirm                        ║
║           ↓                                       ║
║  Step 8: Payment                                 ║
║           ├─→ M-PESA                             ║
║           ├─→ DPO Pay                            ║
║           └─→ USSD                               ║
║           ↓                                       ║
║  Step 9: Policy Submission                       ║
║           ├─→ Double-Insurance Check (60s)       ║
║           ├─→ Create Policy (Backend)            ║
║           └─→ Issue Certificate (60s)            ║
║           ↓                                       ║
║  ✅ Success Screen                                ║
║      ├─→ Download Certificate                    ║
║      ├─→ View Policy                             ║
║      └─→ Done (Back to Quotations)               ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

╔════════════════ COMPREHENSIVE FLOW ══════════════╗
║                                                   ║
║  Step 1-2: [Same Category/Subcategory Selection] ║
║           ↓                                       ║
║  Step 3: Vehicle Details (with value fields)     ║
║           ↓                                       ║
║  Step 4: Pricing Inputs (Bracket-based)          ║
║           ↓                                       ║
║  Step 5-9: [Same as Third-Party Steps 4-8]       ║
║           ↓                                       ║
║  ✅ Success Screen                                ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 🎯 Key Features

### ✅ What's Working

- Complete step-by-step flow with validation
- DMVIC integration with proper timeouts
- Real-time premium calculation
- Multiple payment methods
- Document upload with OCR
- Double-insurance prevention (regulatory compliance)
- Extendible product support
- Error boundaries and resilient rendering
- Cache management

### 🔄 Recent Fixes (January 18, 2026)

- ✅ Extended DMVIC timeouts to 60 seconds
- ✅ Added timeout to all DMVIC certificate operations
- ✅ Improved error messages for timeout scenarios

### 📋 To Test

1. Complete Third-Party flow with valid registration
2. Test DMVIC verification with existing cover
3. Test extendible product payment flow
4. Test comprehensive bracket pricing
5. Verify certificate issuance
6. Test timeout handling with slow DMVIC responses

---

## 🔗 Related Files

### Core Flow Files

- `Motor3Container.js` - Main container
- `third-party/ThirdPartyFlow.js` - TP orchestrator
- `comprehensive/ComprehensiveFlow.js` - Comp orchestrator

### Context Files

- `contexts/Motor3Context.js`
- `contexts/ThirdPartyContext.js`
- `contexts/ComprehensiveContext.js`

### Utility Files

- `utils/stepValidation.js` - Step validation logic
- `utils/productFieldConfig.js` - Product configuration
- `utils/premiumCalculations.js` - Premium calculations
- `utils/enhancedValidation.js` - Form validation

### Service Files

- `services/DjangoAPIService.js` - API communication
- `services/StoragePurge.js` - Cache management

---

## 📞 Support

For questions or issues:

1. Check console logs for detailed error messages
2. Review DMVIC error codes in `DMVIC_ERROR_CODES_QUICK_REF.md`
3. Check backend logs in `insurance-app/logs/`
4. Use `deployment/ec2-ssh.ps1` to access EC2 instance

---

**End of Flow Guide** ✅
