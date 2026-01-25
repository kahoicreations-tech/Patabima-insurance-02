# Motor3 Manual Testing Checklist

## Testing Environment

- **Expo Server**: Running on port 8082 (http://localhost:8082)
- **Backend**: Django at http://10.0.2.2:8000 (Android emulator) or http://localhost:8000
- **Test Date**: ${new Date().toISOString().split('T')[0]}

## Pre-Test Setup

- [ ] Expo dev server running (`npx expo start --clear`)
- [ ] Django backend running (`python manage.py runserver 0.0.0.0:8000`)
- [ ] Test account logged in
- [ ] Backend has Motor3 pricing data populated

---

## Test Suite 1: Third Party Flow Navigation (9 Steps)

### Step 1: Category Selection

**Path**: Motor3 → Third Party Flow → Category Selection

- [ ] Screen loads without crashes
- [ ] All 6 categories display: PRIVATE, COMMERCIAL, PSV, MOTORCYCLE, TUKTUK, SPECIAL
- [ ] Each category card shows icon and name
- [ ] Tapping a category highlights it
- [ ] "Next" button enabled after selection
- [ ] "Next" navigates to Step 2

**Test Data**: Select "PRIVATE" category

---

### Step 2: Subcategory Selection

**Path**: Step 1 → Step 2

- [ ] Screen loads with PRIVATE subcategories
- [ ] Shows: Third Party, Third Party Extension, Time on Risk
- [ ] Each subcategory shows pricing model badge
- [ ] Tapping subcategory highlights it
- [ ] "Back" returns to Step 1
- [ ] "Next" navigates to Step 3

**Test Data**: Select "Third Party" (PRIVATE_THIRD_PARTY)

---

### Step 3: Vehicle Details

**Path**: Step 2 → Step 3

**Form Fields to Test**:

- [ ] Registration Number input appears
- [ ] Cover Start Date picker appears
- [ ] Financial Interest radio buttons appear (Yes/No)
- [ ] **Category-Specific Fields**:
  - [ ] PRIVATE/MOTORCYCLE: No additional fields
  - [ ] COMMERCIAL: Tonnage selector appears
  - [ ] PSV/TUKTUK: Passenger capacity input appears
  - [ ] MOTORCYCLE (ENGINE_CC model): Engine CC input appears

**Validation Tests**:

- [ ] Registration: Accepts Kenyan format (KXX 123X)
- [ ] Cover Date: Must be today or future date
- [ ] Financial Interest: Requires selection

**Underwriter Auto-Load**:

- [ ] For Third Party: Underwriters load automatically (no vehicle details needed)
- [ ] For TOR: Underwriters load automatically
- [ ] For Third Party Extension: Underwriters load after vehicle details
- [ ] Loading indicator shows while fetching
- [ ] 7 underwriters appear in Step 4 preview

**Navigation**:

- [ ] "Back" returns to Step 2
- [ ] "Next" validates and navigates to Step 4

**Test Data**:

- Registration: KDA 123A
- Cover Date: Tomorrow's date
- Financial Interest: Yes

---

### Step 4: Underwriter Selection

**Path**: Step 3 → Step 4

**Underwriter Cards**:

- [ ] All 7 underwriters display:
  - Madison Insurance
  - PATABIMA INC
  - Jubilee Insurance
  - UAP Insurance
  - APA Insurance
  - Britam Insurance
  - CIC Insurance
- [ ] Each card shows:
  - [ ] Underwriter name
  - [ ] Total premium (KSh format)
  - [ ] Breakdown: Base Premium, ITL (0.25%), PCF (0.25%), Stamp Duty (KSh 40)
- [ ] Cards sorted by price (lowest first)
- [ ] Tapping card selects it (checkmark appears)
- [ ] Only one underwriter selectable at a time

**Price Verification** (Third Party Expected):

- [ ] Madison/PATABIMA/Jubilee: ~KSh 3,030 (Base: 2,975)
- [ ] UAP/APA: ~KSh 3,558 (Base: 3,500)
- [ ] Britam/CIC: ~KSh 3,970 (Base: 3,920)

**Navigation**:

- [ ] "Back" returns to Step 3
- [ ] "Next" requires underwriter selection
- [ ] "Next" navigates to Step 5

**Test Data**: Select "Madison Insurance"

---

### Step 5: Client Details

**Path**: Step 4 → Step 5

**Form Fields**:

- [ ] ID Number/Passport input
- [ ] Phone Number input (Kenyan format)
- [ ] Email input
- [ ] Physical Address input
- [ ] Pin Number (optional for individuals)

**Validation Tests**:

- [ ] ID Number: 7-8 digits for Kenyan ID
- [ ] Phone: Accepts 0712345678 or +254712345678
- [ ] Email: Valid email format
- [ ] All required fields marked with \*

**Navigation**:

- [ ] "Back" returns to Step 4
- [ ] "Next" validates and navigates to Step 6

**Test Data**:

- ID: 12345678
- Phone: 0712345678
- Email: test@example.com
- Address: Nairobi, Kenya

---

### Step 6: Document Upload

**Path**: Step 5 → Step 6

**Document Types**:

- [ ] ID/Passport upload (required)
- [ ] Logbook upload (required for non-TP)
- [ ] Other documents (optional)

**Upload Tests**:

- [ ] "Choose File" button works
- [ ] Camera option available
- [ ] Gallery option available
- [ ] Selected file shows preview
- [ ] File size validation (max 5MB)
- [ ] File type validation (PDF, JPG, PNG)
- [ ] Delete uploaded document works

**DMVIC Integration** (if logbook uploaded):

- [ ] Loading indicator during OCR processing
- [ ] Success badge if vehicle details match
- [ ] Warning if details mismatch
- [ ] Error handling for OCR failures

**Navigation**:

- [ ] "Back" returns to Step 5
- [ ] "Next" requires required documents
- [ ] "Next" navigates to Step 7

---

### Step 7: Review & Confirm

**Path**: Step 6 → Step 7

**Review Sections**:

- [ ] **Category & Product**: Shows selected category, subcategory, coverage type
- [ ] **Vehicle Details**:
  - [ ] Registration number
  - [ ] Cover start date
  - [ ] Financial interest
  - [ ] (Category-specific: tonnage/capacity/engine_cc if applicable)
- [ ] **Selected Underwriter**:
  - [ ] Underwriter name
  - [ ] Total premium
  - [ ] Payment breakdown
- [ ] **Client Details**:
  - [ ] Full name (from ID)
  - [ ] ID/Passport number
  - [ ] Phone number
  - [ ] Email
  - [ ] Address
- [ ] **Uploaded Documents**: List with file names

**Editing**:

- [ ] "Edit" buttons present for each section
- [ ] Tapping "Edit" returns to relevant step
- [ ] Changes persist when returning to review

**Navigation**:

- [ ] "Back" returns to Step 6
- [ ] "Proceed to Payment" navigates to Step 8

---

### Step 8: Payment

**Path**: Step 7 → Step 8

**Payment Summary**:

- [ ] Shows final premium amount
- [ ] Shows underwriter name
- [ ] Shows policy number (if generated)

**Payment Methods**:

- [ ] M-PESA option available
- [ ] DPO Pay option available
- [ ] Bank transfer option available
- [ ] Card payment option available

**M-PESA Payment Test**:

- [ ] Phone number pre-filled from client details
- [ ] "Pay with M-PESA" button triggers STK push
- [ ] Loading indicator during payment processing
- [ ] Success message on payment confirmation
- [ ] Error message on payment failure
- [ ] Transaction ID displayed on success

**Navigation**:

- [ ] "Back" returns to Step 7
- [ ] Payment success navigates to Step 9

---

### Step 9: Submission

**Path**: Step 8 → Step 9

**Success Screen**:

- [ ] Success icon/animation displays
- [ ] Quote number shown (QT-2025-XXXXXX format)
- [ ] Policy number shown (POL-2025-XXXXXX format)
- [ ] Premium amount displayed
- [ ] Underwriter name displayed

**Actions**:

- [ ] "Download PDF" button generates quote PDF
- [ ] "Email Quote" sends email to client
- [ ] "SMS Client" sends SMS with policy number
- [ ] "Share" opens share sheet
- [ ] "New Quote" returns to Motor3 home
- [ ] "View My Quotes" navigates to quotations list

**Verification**:

- [ ] Quote appears in "My Quotations" list
- [ ] PDF downloads successfully
- [ ] Email received by client
- [ ] SMS received by client

---

## Test Suite 2: Comprehensive Flow Navigation (9 Steps)

### Step 1: Category Selection

_Same as Third Party Step 1_

**Test Data**: Select "PRIVATE" category

---

### Step 2: Subcategory Selection

**Path**: Step 1 → Step 2

- [ ] Shows Comprehensive subcategory
- [ ] Pricing model shows "BRACKET" badge
- [ ] "Next" navigates to Step 3

**Test Data**: Select "Comprehensive" (PRIVATE_COMPREHENSIVE)

---

### Step 3: Vehicle Details (Extended Form)

**Path**: Step 2 → Step 3

**Form Fields** (More extensive than Third Party):

- [ ] Registration Number
- [ ] Cover Start Date
- [ ] Financial Interest
- [ ] **Extended Vehicle Details**:
  - [ ] Vehicle Make (dropdown with search)
  - [ ] Vehicle Model (dependent on make)
  - [ ] Year of Manufacture (1980-2025)
  - [ ] Vehicle Color
  - [ ] Body Type (Saloon, SUV, Pickup, etc.)
  - [ ] Engine Number
  - [ ] Chasis Number
  - [ ] Logbook Number

**Validation Tests**:

- [ ] Make: Required, dropdown shows popular makes
- [ ] Model: Dependent on make selection
- [ ] Year: Must be 1980-2025
- [ ] Engine/Chasis: Alphanumeric format

**Navigation**:

- [ ] "Back" returns to Step 2
- [ ] "Next" validates and navigates to Step 4 (Pricing Inputs)

**Test Data**:

- Registration: KCB 456Z
- Make: Toyota
- Model: Vitz
- Year: 2018
- Color: Silver
- Body: Hatchback

---

### Step 4: Pricing Inputs

**Path**: Step 3 → Step 4

**Form Fields**:

- [ ] **Sum Insured** (Required):
  - [ ] Currency input (KSh)
  - [ ] Min: KSh 100,000
  - [ ] Max: KSh 10,000,000
  - [ ] Formatting with commas
- [ ] **Windscreen Cover** (Optional):
  - [ ] Checkbox to enable
  - [ ] Max KSh 30,000
  - [ ] Defaults to 10% of sum insured
- [ ] **Radio/Cassette** (Optional):
  - [ ] Checkbox to enable
  - [ ] Min KSh 30,000
  - [ ] Custom amount input
- [ ] **Add-ons**:
  - [ ] Excess Protector checkbox
  - [ ] PVT (Political Violence & Terrorism) checkbox
  - [ ] Loss of Use checkbox
- [ ] **Payment Plan**:
  - [ ] Annual (full payment)
  - [ ] Semi-Annual (2 instalments)
  - [ ] Quarterly (4 instalments)

**Underwriter Trigger**:

- [ ] Underwriters load after sum_insured entered
- [ ] Debounced loading (1 second delay)
- [ ] Shows 7 underwriters in preview

**Validation Tests**:

- [ ] Sum Insured required
- [ ] Windscreen max KSh 30k enforced
- [ ] Radio/Cassette min KSh 30k enforced
- [ ] Premium recalculates when add-ons change

**Navigation**:

- [ ] "Back" returns to Step 3
- [ ] "Next" requires sum_insured
- [ ] "Next" navigates to Step 5 (Underwriter Selection)

**Test Data**:

- Sum Insured: KSh 1,200,000
- Windscreen: Yes (KSh 20,000)
- Radio: No
- Excess Protector: Yes
- PVT: Yes
- Payment: Annual

---

### Step 5: Underwriter Selection

**Path**: Step 4 → Step 5

**Price Verification** (Comprehensive):

- [ ] Premiums vary by sum_insured bracket
- [ ] For KSh 1.2M sum insured:
  - [ ] Madison/PATABIMA/Jubilee: ~KSh 48,000 base
  - [ ] UAP/APA: ~KSh 56,640 (18% higher)
  - [ ] Britam/CIC: ~KSh 63,360 (32% higher)
- [ ] Levies applied (ITL, PCF, Stamp Duty)
- [ ] Add-ons reflected in premium

_Rest same as Third Party Step 4_

---

### Steps 6-9: Same as Third Party Flow

- Step 6: Client Details
- Step 7: Document Upload
- Step 8: Review & Confirm
- Step 9: Payment
- Step 10: Submission (Note: Comprehensive has 10 steps total)

---

## Test Suite 3: Category-Specific Field Testing

### Commercial Products (TONNAGE Model)

**Test Product**: COMMERCIAL_BELOW_3_TONS

**Step 3 Fields**:

- [ ] Tonnage Selector appears
- [ ] Shows range: Below 3 Tons, 3-6 Tons, 6-12 Tons, 12-20 Tons, Over 20 Tons
- [ ] Selected tonnage highlighted
- [ ] Underwriters load after tonnage selection

**Pricing Verification**:

- [ ] Below 3 Tons: Base ~KSh 18,000
- [ ] 3-6 Tons: Base ~KSh 30,000
- [ ] Price increases with tonnage

---

### PSV Products (PASSENGER Model)

**Test Product**: PSV_14_SEATER

**Step 3 Fields**:

- [ ] Passenger Capacity input appears
- [ ] Accepts numeric input (1-100)
- [ ] Validation: Min 14, Max 14 (for this product)
- [ ] Underwriters load after capacity entered

**Pricing Verification**:

- [ ] 14 passengers: Base ~KSh 45,000
- [ ] Includes mandatory PLL (Passenger Legal Liability)
- [ ] PLL rate: ~KSh 50 per passenger seat

---

### Motorcycle Products (ENGINE_CC Model)

**Test Product**: MOTORCYCLE_UPTO_250CC

**Step 3 Fields**:

- [ ] Engine CC input appears
- [ ] Accepts numeric input
- [ ] Validation: Max 250cc for this product
- [ ] Underwriters load after engine_cc entered

**Pricing Verification**:

- [ ] Up to 250cc: Base ~KSh 5,000
- [ ] 251-500cc: Base ~KSh 8,000
- [ ] Different pricing per engine capacity range

---

### TukTuk Products (PASSENGER Model)

**Test Product**: TUKTUK_3_SEATER

**Step 3 Fields**:

- [ ] Passenger Capacity input appears
- [ ] Validation: Max 3 for TukTuk
- [ ] Underwriters load after capacity entered

**Pricing Verification**:

- [ ] 3 passengers: Base ~KSh 15,000

---

## Test Suite 4: Context State Management

### ThirdPartyContext Tests

**State Persistence**:

- [ ] Select category → back → forward: category still selected
- [ ] Enter vehicle details → back → forward: details persist
- [ ] Select underwriter → back → forward: selection persists

**State Reset**:

- [ ] "Cancel" clears all Third Party state
- [ ] Starting new quote resets context

**Console Verification**:

```javascript
// Check console logs
console.log("[ThirdPartyContext] State:", state);
console.log("[ThirdPartyContext] Selected product:", selectedProduct);
```

---

### ComprehensiveContext Tests

**State Persistence**:

- [ ] Vehicle details → back → forward: details persist
- [ ] Pricing inputs → back → forward: sum_insured, add-ons persist
- [ ] Underwriter selection → back → forward: selection persists

**Subcategory Isolation**:

- [ ] Switch from Comprehensive → Third Party: states don't bleed
- [ ] Data stored per subcategory_code

---

## Test Suite 5: Underwriter Integration

### useTPUnderwriters Hook

**Test Cases**:

1. **PRIVATE_THIRD_PARTY** (FIXED pricing):

   - [ ] Hook triggers immediately (no dependencies)
   - [ ] Returns 7 underwriters
   - [ ] Each has base_premium, total_premium, breakdown
   - [ ] Sorted by price

2. **COMMERCIAL_BELOW_3_TONS** (TONNAGE pricing):

   - [ ] Hook waits for tonnage selection
   - [ ] Passes `{ tonnage: 3 }` to API
   - [ ] Returns 7 underwriters with tonnage-based pricing

3. **MOTORCYCLE_UPTO_250CC** (ENGINE_CC pricing):
   - [ ] Hook waits for engine_cc input
   - [ ] Passes `{ engine_cc: 150 }` to API
   - [ ] Returns 7 underwriters with cc-based pricing

**Console Verification**:

```javascript
console.log(
  "[useTPUnderwriters] Called with:",
  subcategoryCode,
  coverDate,
  pricingInputs
);
console.log("[useTPUnderwriters] Result:", underwriters);
```

---

### useCompUnderwriters Hook

**Test Cases**:

1. **PRIVATE_COMPREHENSIVE** (BRACKET pricing):

   - [ ] Hook waits for sum_insured input
   - [ ] Debounced (1 second delay)
   - [ ] Passes `{ sum_insured: 1200000 }` to API
   - [ ] Returns 7 underwriters with bracket-based pricing

2. **Price Bucketing**:
   - [ ] Sum insured KSh 1,200,000 → buckets to 1,200,000
   - [ ] Sum insured KSh 1,234,567 → buckets to 1,200,000 (nearest 50k)
   - [ ] Cache hit on similar amounts

---

## Test Suite 6: Product Type Detection

### isThirdPartyLike Detection

**True Cases** (TP products):

- [ ] PRIVATE_THIRD_PARTY: `coverage_type === 'THIRD_PARTY'`
- [ ] PRIVATE_TOR: `coverage_type === 'TOR'`
- [ ] COMMERCIAL_THIRD_PARTY: `subcategory_code.includes('THIRD_PARTY')`

**False Cases** (Non-TP products):

- [ ] PRIVATE_COMPREHENSIVE: `coverage_type === 'COMPREHENSIVE'`
- [ ] COMMERCIAL_COMPREHENSIVE: Shows extended form

**UI Behavior**:

- [ ] TP products: Hide vehicle details (make, model, year, etc.)
- [ ] Non-TP: Show full vehicle details

---

## Test Suite 7: Edge Cases & Error Handling

### Network Errors

- [ ] Backend offline: Shows error message
- [ ] Slow network: Shows loading indicator
- [ ] Retry mechanism works

### Validation Edge Cases

- [ ] Empty fields: Shows validation errors
- [ ] Invalid registration: Rejects non-Kenyan format
- [ ] Future cover date: Accepts
- [ ] Past cover date: Rejects

### Payment Failures

- [ ] M-PESA timeout: Shows retry option
- [ ] Insufficient funds: Shows error message
- [ ] Transaction cancelled: Returns to payment step

---

## Success Criteria

**All Tests Pass** means:

- ✅ All 9 Third Party steps navigate correctly
- ✅ All 9 Comprehensive steps navigate correctly
- ✅ Category-specific fields appear for Commercial, PSV, Motorcycle, TukTuk
- ✅ Underwriter hooks load 7 underwriters with correct pricing
- ✅ Context state persists across navigation
- ✅ Product type detection works correctly
- ✅ All validations enforce business rules
- ✅ Payment flow completes successfully
- ✅ Quote/policy generated with correct data

**After all tests pass**: Proceed to Task 12 - Implement subcategory-specific pricing logic for all 60+ products using MOTOR_INSURANCE_USER_FLOW_BY_PRODUCT_TYPE.md

---

## Testing Log

### Test Run 1 - Date: ****\_\_\_****

**Tester**: ****\_\_\_****
**Environment**: ****\_\_\_****

**Results**:

- Third Party Flow: ⬜ Pass / ⬜ Fail
- Comprehensive Flow: ⬜ Pass / ⬜ Fail
- Category-Specific Fields: ⬜ Pass / ⬜ Fail
- Context State Management: ⬜ Pass / ⬜ Fail
- Underwriter Integration: ⬜ Pass / ⬜ Fail
- Product Type Detection: ⬜ Pass / ⬜ Fail

**Issues Found**:

1. ***
2. ***
3. ***

**Next Steps**:

---

---

## Appendix: Console Debugging Commands

### Enable Verbose Logging

```javascript
// Add to App.js or Motor3Context.js
global.MOTOR3_DEBUG = true;
```

### Check Context State

```javascript
// In React DevTools Console
$r.context; // View current context
JSON.stringify($r.context, null, 2); // Pretty print
```

### Check AsyncStorage

```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

// View all keys
AsyncStorage.getAllKeys().then(console.log);

// View Motor3 cache
AsyncStorage.getItem("MOTOR3_CACHE").then(console.log);
```

### API Request Logging

```javascript
// In DjangoAPIService.js
console.log("[API Request]", endpoint, options);
console.log("[API Response]", response);
```
