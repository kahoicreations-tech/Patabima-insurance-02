# Motor 2 Insurance Flow Paths

Complete documentation of all flow paths in the Motor 2 insurance system, including Third Party, Comprehensive, and other product types.

## Flow Architecture

The Motor 2 system uses a **dynamic step-based flow** managed by `MotorInsuranceContainer.js` that adapts based on the selected subcategory's coverage type.

### Container: `MotorInsuranceFlow/MotorInsuranceContainer.js`

- **Main orchestrator** for all Motor 2 flows
- Dynamically generates step sequence based on coverage type
- Handles step validation and navigation
- Manages DMVIC integration and verification

---

## Flow Paths by Coverage Type

### 1. **THIRD PARTY / TOR Flow** (8 Steps)

**Coverage Types**: Third Party, Time on Risk (TOR)  
**Pricing Model**: FIXED pricing (no vehicle value needed)  
**Underwriter Selection**: Happens in Policy Details step (Step 3)

#### Step Sequence:

```
1. Category Selection       → Select vehicle category (PRIVATE, COMMERCIAL, PSV, etc.)
2. Subcategory Selection   → Select Third Party or TOR
3. Policy Details          → Vehicle info + Underwriter comparison (auto-loaded)
4. KYC                     → DMVIC verification drawer appears here
5. Documents               → Upload logbook, ID, KRA PIN
6. Client Details          → Full client form with validation
7. Payment                 → M-PESA/DPO Pay integration
8. Submission              → Final policy generation
```

#### Step Scripts:

- **Steps 1-2**: `steps/CategorySelectionStep.js`
  - Handles both category and subcategory selection
  - Groups subcategories: Third Party vs Comprehensive sections
- **Step 3**: `steps/PolicyDetailsStep.js` + `VehicleDetails/DynamicVehicleForm.js`
  - Renders `DynamicVehicleForm` which auto-loads underwriter comparison
  - For Third Party: Comparison triggers immediately (fixed pricing)
  - No sum_insured field required
  - User selects underwriter from comparison cards
- **Step 4**: `steps/KYCStep.js`
  - DMVIC drawer integration
  - Shows existing cover data if found
  - OCR/Textract for document extraction
- **Step 5**: `steps/DocumentsStep.js`
  - Upload logbook, ID copy, KRA PIN certificate
  - AWS S3 integration
  - Textract OCR extraction
  - Data mismatch detection (logbook vs DMVIC)
- **Step 6**: `steps/ClientDetailsStep.js`
  - Full client form: name, phone, email, KRA PIN, ID number
  - Kenyan phone validation (07XX, 01XX, +254)
  - Email format validation
- **Step 7**: `steps/PaymentProcessingStep.js`
  - Payment gateway integration (M-PESA, DPO Pay)
  - Real-time payment status tracking
- **Step 8**: `steps/SubmissionStep.js`
  - Final policy submission to backend
  - Policy number generation
  - PDF quote generation
  - Success screen navigation

#### Key Features:

- **Auto-comparison**: Underwriter comparison loads automatically in Step 3
- **DMVIC Integration**: Appears in KYC step with drawer UI
- **Fixed Pricing**: KSh 2,975 - KSh 3,920 depending on underwriter
- **Mandatory Levies**: ITL (0.25%), PCF (0.25%), Stamp Duty (KSh 40)

---

### 2. **COMPREHENSIVE Flow** (7 Steps)

**Coverage Type**: Comprehensive  
**Pricing Model**: BRACKET pricing (requires sum_insured)  
**Underwriter Selection**: Separate step after Policy Details (Step 4)

#### Step Sequence:

```
1. Category Selection       → Select vehicle category (PRIVATE, COMMERCIAL, PSV, etc.)
2. Subcategory Selection   → Select Comprehensive
3. Policy Details          → Vehicle info + sum_insured (NO underwriter comparison here)
4. Underwriters            → Dedicated underwriter comparison step
5. Add-ons                 → Optional coverages (windscreen, radio, accessories)
6. Client Details          → Full client form with validation
7. Submission              → Final policy generation
```

#### Step Scripts:

- **Steps 1-2**: `steps/CategorySelectionStep.js`
  - Same as Third Party flow
- **Step 3**: `steps/PolicyDetailsStep.js` + `VehicleDetails/DynamicVehicleForm.js`
  - Renders `DynamicVehicleForm`
  - **Critical**: Includes `sum_insured` field (vehicle value)
  - **No underwriter comparison** in this step (deferred to Step 4)
  - Validation: sum_insured required, min KSh 50,000, max KSh 50,000,000
- **Step 4**: `Comprehensive/UnderwriterSelectionStep.js`
  - **Dedicated underwriter selection screen**
  - Fetches pricing from backend using sum_insured
  - Displays underwriter cards with:
    - Base premium (% of sum_insured)
    - Total premium (base + levies)
    - Rating/features
    - Market position (Budget, Competitive, Premium)
  - Sorting options: price_asc, price_desc, name_asc, name_desc
  - Minimum premium enforcement
- **Step 5**: `AddonsSelection/AddonSelectionStep.js`
  - Optional coverages:
    - Windscreen protection
    - Radio/cassette cover
    - Vehicle accessories
  - Each addon adds to base premium
- **Step 6**: `steps/ClientDetailsStep.js`
  - Same as Third Party flow
- **Step 7**: `steps/SubmissionStep.js`
  - Same as Third Party flow

#### Key Features:

- **Bracket Pricing**: Base premium = sum_insured × rate (varies by underwriter)
- **Minimum Premiums**: Backend enforces minimum base premium per underwriter
- **No DMVIC Step**: Comprehensive flow skips KYC/DMVIC verification
- **No Documents Step**: Comprehensive flow skips document upload
- **Add-ons Available**: Windscreen, radio, accessories optional coverages

---

## Shared Components

### 1. **DynamicVehicleForm** (`VehicleDetails/DynamicVehicleForm.js`)

**Purpose**: Universal vehicle details form with smart underwriter comparison

**Key Features**:

- Dynamic field rendering based on product requirements
- Auto-detects pricing dependencies (sum_insured, tonnage, capacity)
- Triggers underwriter comparison when pricing fields complete
- Handles Third Party auto-comparison (no dependencies)
- Blocks comprehensive comparison (deferred to Step 4)
- DMVIC inline indicators (Phase 1.3)
- Keyboard persistence optimizations
- Memoized rendering to prevent dismissals

**Fields by Product Type**:

```javascript
// ALL Products:
- registrationNumber (Kenya format: KDA 123A)
- identificationType (Vehicle Registration, Logbook Number, Chassis Number)
- cover_start_date (min: tomorrow)
- financialInterest (Yes/No)

// COMPREHENSIVE Products:
+ sum_insured (vehicle value, KSh 50k - 50M)
+ windscreen_value (optional)
+ radio_cassette_value (optional)
+ vehicle_accessories_value (optional)

// COMMERCIAL Products:
+ tonnage (Upto 3 Tons → Over 20 Tons)
+ is_prime_mover (Yes/No)
+ is_over_limit (Yes/No)

// PSV/TUKTUK Products:
+ passengerCapacity (number of passengers)
+ is_commercial_institutional (Yes/No for PSV)
+ passenger_type (PUBLIC_ROUTE, TOUR_SCHOOL_HIRE for PSV)
```

**Underwriter Comparison Logic**:

```javascript
// Fixed Pricing (Third Party/TOR):
- Comparison triggers immediately on mount
- No dependencies on form fields
- Uses stable comparison key to prevent re-triggers

// Variable Pricing (Comprehensive/Commercial/PSV):
- Comparison waits for pricing fields (sum_insured, tonnage, capacity)
- Debounced 1-second delay after last field change
- Uses memoized comparison key (includes pricing values)
- Comprehensive: Comparison DISABLED in Policy Details (Step 3)
```

### 2. **CategorySelectionStep** (`steps/CategorySelectionStep.js`)

**Purpose**: Unified category and subcategory selection

**Features**:

- Displays 6 motor categories with icons
- Subcategories grouped by coverage type:
  - **Third Party Section**: TOR, Third Party products
  - **Comprehensive Section**: Comprehensive products
- Horizontal category slider
- Vertical subcategory list with descriptions
- Auto-navigation to next step on selection

### 3. **UnderwriterSelectionStep** (Two Versions)

#### Version 1: General (`steps/UnderwriterSelectionStep.js`)

- Used by Third Party flow (embedded in Policy Details)
- Simplified comparison display
- Quick selection interface

#### Version 2: Comprehensive (`Comprehensive/UnderwriterSelectionStep.js`)

- **950 lines** - Full-featured underwriter comparison
- Advanced features:
  - Base rate percentage display
  - Minimum premium enforcement
  - Sorting and filtering
  - Market position badges
  - Detailed premium breakdown
  - Addon rate discovery
- Validates sum_insured before loading
- Displays error if sum_insured missing

---

## State Management

### Context: `MotorInsuranceContext`

**File**: `contexts/MotorInsuranceContext.js`

**State Structure**:

```javascript
{
  // Selection State
  selectedCategory: { code: 'PRIVATE', name: 'Private', ... },
  selectedSubcategory: {
    subcategory_code: 'PRIVATE_THIRD_PARTY',
    coverage_type: 'THIRD_PARTY',
    pricing_model: 'FIXED',
    ...
  },

  // Vehicle Data (Phase 2: Separated)
  sharedVehicleData: {
    registrationNumber: 'KDA 123A',
    identificationType: 'Vehicle Registration',
    cover_start_date: '2025-12-15',
    make: 'TOYOTA',
    model: 'COROLLA',
    year: 2020,
    ...
  },

  // Pricing Data (Per Subcategory)
  pricingData: {
    'PRIVATE_THIRD_PARTY': {},
    'PRIVATE_COMPREHENSIVE': {
      sum_insured: 1500000,
      windscreen_value: 50000,
      ...
    },
    ...
  },

  // Underwriter Selection (Per Subcategory)
  selectedUnderwriters: {
    'PRIVATE_THIRD_PARTY': {
      name: 'Madison Insurance',
      code: 'MADISON',
      total_premium: 3029.88,
      base_premium: 2975,
      breakdown: { itl: 7.44, pcf: 7.44, stamp_duty: 40 },
      ...
    },
    'PRIVATE_COMPREHENSIVE': { ... },
  },

  // Unified selectedUnderwriter (computed from selectedUnderwriters)
  selectedUnderwriter: { ... }, // Current subcategory's underwriter

  // DMVIC Integration (Phase 1.3)
  existingCoverData: {
    policyNumber: 'POL-2024-123456',
    insurer: 'Madison Insurance',
    expiryDate: '2025-06-15',
    ...
  },
  showVerificationScreen: false,

  // Client & Documents
  clientDetails: { fullName, phone, email, id_number, kra_pin, ... },
  uploadedDocuments: { logbook: {...}, id_copy: {...}, kra_pin: {...} },
  extractedDocuments: { all: {...}, logbook: {...}, id_copy: {...} },

  // Payment
  paymentDetails: { method: 'MPESA', transaction_id, status, ... },

  // Flow Control
  currentStep: 3,
  completedSteps: [0, 1, 2],
  validationErrors: {},
}
```

**Key Actions**:

- `setCategorySelection(category, subcategory)` - Set category and subcategory
- `updateSharedVehicleData(data)` - Update shared vehicle fields
- `updatePricingData(data)` - Update pricing fields (per subcategory)
- `setSelectedUnderwriter(underwriter, subcategoryCode)` - Set underwriter for subcategory
- `updateClientDetails(data)` - Update client information
- `updateExistingCoverData(data)` - Set DMVIC cover data
- `setShowVerificationScreen(show)` - Toggle DMVIC drawer
- `resetFlow()` - Clear all state (new quote)

---

## Flow Validation Rules

### Policy Details Step (Step 3)

**Third Party/TOR**:

- ✅ registrationNumber (required)
- ✅ identificationType (required)
- ✅ cover_start_date (required, min: tomorrow)
- ✅ selectedUnderwriter (required - must select from comparison)
- ✅ total_premium > 0 (required - calculated from underwriter)

**Comprehensive**:

- ✅ registrationNumber (required)
- ✅ identificationType (required)
- ✅ cover_start_date (required, min: tomorrow)
- ✅ sum_insured (required, min: KSh 50,000, max: KSh 50,000,000)
- ⏭️ selectedUnderwriter (NOT required - selected in next step)

### Underwriters Step (Step 4 - Comprehensive Only)

- ✅ selectedUnderwriter (required)
- ✅ total_premium > 0 (required)

### Documents Step (Step 5 - Third Party Only)

- ✅ logbook (required - uploaded to S3)
- ✅ id_copy (required - uploaded to S3)
- ✅ kra_pin (required - uploaded to S3)

### Client Details Step (Step 6)

- ✅ fullName (required)
- ✅ phone (required, Kenyan format: 07XX or +2547XX)
- ✅ email (required, valid email format)
- ✅ id_number (required)
- ✅ kra_pin (required)

---

## Backend Integration

### API Endpoints

**Pricing Comparison**:

- `POST /api/motor2/pricing/compare-by-subcategory/`
  - Params: `subcategory_code`, `cover_start_date`, `sum_insured` (if comprehensive)
  - Returns: Array of underwriter comparisons with base_premium, total_premium, breakdown

**DMVIC Verification**:

- `POST /api/motor2/dmvic/verify-vehicle/`
  - Params: `registration_number`
  - Returns: Existing cover data (if found)

**Document Upload**:

- `POST /api/motor2/documents/upload/`
  - Params: `file`, `document_type`, `quotation_id`
  - Returns: S3 URL, Textract extracted data

**Quotation Submission**:

- `POST /api/motor2/quotations/`
  - Params: Complete quotation data (vehicle, client, underwriter, payment)
  - Returns: `quote_number`, `policy_number`, `pdf_url`

---

## Performance Optimizations

### 1. **Caching Strategy**

- Motor categories: **7 days TTL** (static data)
- Pricing comparisons: **12 hours TTL** (semi-dynamic)
- Underwriter lists: **6 hours TTL**
- Two-tier cache: Memory Map + AsyncStorage

### 2. **Keyboard Persistence**

- `blurOnSubmit={false}` on all TextInputs
- `keyboardShouldPersistTaps="always"` on ScrollViews
- Debounced state updates (400ms for text, 100ms for select)
- Refs for stable handlers (`latestFormRef`)

### 3. **Re-render Prevention**

- `React.memo` with custom comparators
- Exclude function props from comparison
- Stable refs for flags (`underwriterSelectedRef`, `hasComparisonsRef`)
- Memoized comparison keys

### 4. **Underwriter Comparison Guards**

- Module-level cache prevents duplicate API calls
- Stable comparison key for fixed pricing (Third Party)
- Ref flags prevent infinite loops
- Debounced triggers for variable pricing

---

## File Structure Summary

```
Motor 2/MotorInsuranceFlow/
├── MotorInsuranceContainer.js          # Main orchestrator (786 lines)
├── steps/
│   ├── CategorySelectionStep.js        # Steps 1-2: Category & Subcategory
│   ├── PolicyDetailsStep.js            # Step 3: Vehicle Details (wrapper)
│   ├── KYCStep.js                      # Step 4: DMVIC verification (Third Party)
│   ├── DocumentsStep.js                # Step 5: Document upload (Third Party)
│   ├── ClientDetailsStep.js            # Step 6: Client form
│   ├── PaymentProcessingStep.js        # Step 7: Payment (Third Party)
│   ├── SubmissionStep.js               # Step 8: Final submission
│   └── UnderwriterSelectionStep.js     # General underwriter selection
├── VehicleDetails/
│   └── DynamicVehicleForm.js           # Universal vehicle form (2092 lines)
├── Comprehensive/
│   ├── PolicyDetailsStep.js            # Comprehensive-specific details (338 lines)
│   └── UnderwriterSelectionStep.js     # Comprehensive underwriter step (950 lines)
├── AddonsSelection/
│   └── AddonSelectionStep.js           # Optional coverages (Comprehensive)
├── CategorySelection/
│   ├── MotorCategoryGrid.js            # Category display
│   └── MotorSubcategoryList.js         # Subcategory display
├── VehicleVerification/
│   └── VehicleVerificationScreen.js    # DMVIC verification UI
└── Success/
    └── PolicySuccess.js                # Success screen
```

---

## Testing Recommendations

### Third Party Flow Test

1. Select PRIVATE → Third Party
2. Enter registration: KDA 123A
3. Select cover date: Tomorrow
4. Verify underwriter comparison auto-loads
5. Select cheapest underwriter (Madison: KSh 3,029.88)
6. Proceed to KYC → Check DMVIC drawer
7. Upload documents (logbook, ID, KRA PIN)
8. Fill client details
9. Process payment (M-PESA)
10. Verify policy generation

### Comprehensive Flow Test

1. Select PRIVATE → Comprehensive
2. Enter registration: KDA 123A
3. Enter sum_insured: KSh 1,500,000
4. Select cover date: Tomorrow
5. Proceed to Underwriters step
6. Verify underwriter comparison loads with bracket pricing
7. Select underwriter
8. Select add-ons (optional)
9. Fill client details
10. Submit quotation

---

## Known Issues & Future Enhancements

### Current Issues

1. Keyboard dismissal intermittent despite optimizations
2. `initialData` ref comparison may cause unnecessary re-renders
3. DMVIC integration only in Third Party flow (not Comprehensive)

### Planned Enhancements

1. Auto-select cheapest underwriter for Third Party (optional flag)
2. Deep-compare `initialData` to prevent ref change re-renders
3. Extend DMVIC to Comprehensive flow
4. Add policy renewal flow
5. Add policy extension flow (grace period)

---

## Developer Notes

### Adding a New Coverage Type

1. Add pricing model to database (`MotorSubcategory.pricing_model`)
2. Update `DynamicVehicleForm` field requirements
3. Add step sequence to `MotorInsuranceContainer` steps logic
4. Create dedicated step components if needed
5. Update validation rules
6. Add backend pricing endpoint support

### Debugging Tips

1. Check console logs: `[PolicyDetailsStep]`, `[DynamicVehicleForm]`, `[MotorInsuranceContainer]`
2. Verify context state: `state.selectedSubcategory`, `state.selectedUnderwriter`
3. Check pricing cache: `SimpleCache` logs
4. Inspect backend payload: API request logs
5. Test underwriter comparison: Check `motorPricingService` logs

---

**Last Updated**: December 1, 2025  
**Version**: Motor 2 Flow v3.2 (Phase 3 - Separated State)
