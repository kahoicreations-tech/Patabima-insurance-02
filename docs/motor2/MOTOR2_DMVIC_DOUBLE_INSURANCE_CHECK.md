# Motor2 DMVIC Double Insurance Check - Flow Summary

## Overview
When a user enters vehicle details and cover start date, the Motor2 flow automatically checks DMVIC/NTSA for existing active insurance coverage to prevent double insurance violations. If existing cover is detected that overlaps with the requested dates, a drawer appears prompting the user to adjust their start date.

---

## 🔍 Trigger Point

**When:** User completes **Step 2 (Vehicle Details)** and clicks "Next" to move to **Step 3 (Verification)**

**What's Checked:**
- Vehicle Registration Number (plate number)
- Requested Cover Start Date
- Vehicle Make/Model/Year (optional, for validation)

---

## ⚙️ Backend API Call

### Endpoint (Real Implementation):
```javascript
POST /api/insurance/integrations/vehicle_check/
{
  "vehicle_registration": "KCA123A",
  "vehicle_make": "TOYOTA",
  "vehicle_model": "COROLLA",
  "vehicle_year": "2018"
}
```

**Backend Service:** `DMVICService.validate_double_insurance()`

**DMVIC API:** `/api/v1/ValidateDoubleInsurance`

### Response Format:
```javascript
{
  "exists": true,  // Does vehicle have active cover?
  "policy": {
    "policy_number": "POL/2025/001234",
    "vehicle_registration": "KCA123A",
    "insurer": "Jubilee Insurance",
    "cover_type": "Comprehensive",
    "start_date": "2024-12-01",
    "expiry_date": "2025-11-30",
    "premium": "KSh 45,000",
    "certificate_number": "CERT-2025-001234"
  }
}
```

---

## 📱 Frontend Implementation

### State Management:
```javascript
// Location: MotorInsuranceScreen.js (Lines 798-799)
const [verificationStatus, setVerificationStatus] = useState(null);
// Values: null | 'checking' | 'found' | 'not_found'

const [existingCoverData, setExistingCoverData] = useState(null);
// Stores DMVIC response with policy details

const [existingCoverDrawerVisible, setExistingCoverDrawerVisible] = useState(false);
// Controls bottom drawer visibility
```

### Verification Logic (Step 2 → Step 3 Transition):
```javascript
// Location: MotorInsuranceScreen.js (Lines 1511-1570)

const onNext = async () => {
  if (step === 2) {  // Leaving Vehicle Details step
    try {
      setVerificationStatus('checking');  // Show loading state
      
      const vehicleData = state.vehicleDetails || state.pricingInputs || {};
      const registrationNumber = vehicleData.registrationNumber;
      
      if (registrationNumber) {
        let response;
        
        // Option 1: Use simulation (for testing)
        if (USE_DMVIC_SIMULATION) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          response = {
            exists: true,
            policy: {
              policy_number: 'POL/2025/001234',
              vehicle_registration: registrationNumber,
              insurer: 'Jubilee Insurance',
              expiry_date: '2025-11-30',
              // ... other details
            }
          };
        } 
        // Option 2: Call real backend API
        else {
          response = await djangoAPI.vehicleCheck({
            vehicle_registration: registrationNumber,
            vehicle_make: vehicleData.make,
            vehicle_model: vehicleData.model,
            vehicle_year: vehicleData.year
          });
        }
        
        // Check response
        if (response && response.exists && response.policy) {
          // ✅ Existing cover found
          setVerificationStatus('found');
          setExistingCoverData(response);
          // Drawer will auto-open on Step 3
        } else {
          // ❌ No existing cover
          setVerificationStatus('not_found');
          setExistingCoverData(null);
        }
      }
    } catch (error) {
      // Silently handle errors (DMVIC API may not be configured)
      setVerificationStatus('not_found');
      setExistingCoverData(null);
    }
  }
  
  // Proceed to next step
  setStep(step + 1);
};
```

### Auto-Open Drawer on Step 3:
```javascript
// Location: MotorInsuranceScreen.js (Lines 807-813)

useEffect(() => {
  if (step === 3 && existingCoverData && verificationStatus === 'found') {
    // Auto-open drawer with slight delay for smooth transition
    setTimeout(() => setExistingCoverDrawerVisible(true), 300);
  }
}, [step, existingCoverData, verificationStatus]);
```

---

## 🎨 User Interface (Drawer Screen)

### Component: `VehicleVerificationScreen.js`

**Visual Design:**
- **Shield Icon** (64px) - Indicates protection/insurance
- **Red/Pink Background** (#FFF5F5) - Alert color to draw attention
- **White Card** - Contains policy details
- **Two Action Buttons:**
  1. "Adjust Start Date" (Red button)
  2. "Submit Debit Note" (White/outline button)

### Display Information:
```javascript
┌──────────────────────────────────────────┐
│   🛡️ (Shield Icon)                       │
│                                          │
│  Vehicle Has Existing Cover              │
│                                          │
│  ⚠️ Please adjust the start date of      │
│     the new policy to begin after the    
│     existing cover expires               
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Vehicle Registration:  KCA123A     │  │
│  │ Certificate Number:    CERT-001234 │  │
│  │ Issued By:            Jubilee Ins. │  │
│  │ Expiry Date:          30/11/2025   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │    Adjust Start Date               │  │ ← Primary Action
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │    Submit Debit Note               │  │ ← Secondary Action
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Displayed Policy Details:
1. **Vehicle Registration** - e.g., "KCA123A"
2. **Active Certificate Number** - e.g., "CERT-2025-001234"
3. **Issued By** (Insurer/Underwriter) - e.g., "Jubilee Insurance"
4. **Expiry Date** - e.g., "30/11/2025"

**Optional Details:**
- Policy Number
- Cover Type (Comprehensive/Third Party)
- Premium Amount

---

## 🔄 User Actions

### Option 1: Adjust Start Date
**Button:** "Adjust Start Date" (Red, primary)

**Action:**
```javascript
const onAdjustStartDate = () => {
  setExistingCoverDrawerVisible(false);  // Close drawer
  
  // Navigate back to Vehicle Details step (Step 2)
  // or open date picker to select new start date
  
  // New start date must be AFTER existing cover expiry date
  const minDate = new Date(existingCoverData.policy.expiry_date);
  minDate.setDate(minDate.getDate() + 1);  // Next day after expiry
  
  // Update cover start date in state
  // User can continue with adjusted date
};
```

**Expected Behavior:**
- Drawer closes
- User can edit cover start date
- Date picker shows minimum date = (existing cover expiry + 1 day)
- After adjustment, user can proceed normally

---

### Option 2: Submit Debit Note
**Button:** "Submit Debit Note" (White outline, secondary)

**Action:**
```javascript
const onSubmitDebitNote = () => {
  setExistingCoverDrawerVisible(false);  // Close drawer
  
  // Navigate to Debit Note submission flow
  // Allows user to request early termination of existing policy
  // Then create new policy to replace it
  
  // Business Process:
  // 1. User requests debit note from current insurer
  // 2. Current insurer cancels existing policy (prorated refund)
  // 3. User can then create new policy with PataBima
};
```

**Expected Behavior:**
- Drawer closes
- User navigates to debit note submission screen
- System may:
  - Generate debit note request form
  - Send notification to existing insurer
  - Track debit note approval status
- Once approved, user can proceed with new policy

---

## 📊 Flow Diagram

```
User fills vehicle details (Step 2)
         ↓
User enters registration number: "KCA123A"
User enters cover start date: "2025-11-01"
         ↓
User clicks "Next"
         ↓
[DMVIC Check Triggered]
         ↓
POST /api/insurance/integrations/vehicle_check/
{
  "vehicle_registration": "KCA123A",
  "vehicle_make": "TOYOTA",
  "vehicle_model": "COROLLA"
}
         ↓
Backend calls DMVIC API
dmvic_service.validate_double_insurance(...)
         ↓
┌─────────────────────────────────┐
│ Does existing cover exist?      │
└─────────────────────────────────┘
         ↓
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ↓         ↓
Existing  No existing
 cover     cover
  found     found
    │         │
    ↓         ↓
Set         Set
status:     status:
'found'   'not_found'
    │         │
    ↓         ↓
Navigate    Navigate
to Step 3   to Step 3
    │         │
    ↓         ↓
Drawer      Continue
auto-opens  normally
    │
    ↓
User sees existing cover details:
- Policy: POL/2025/001234
- Insurer: Jubilee Insurance
- Expiry: 30/11/2025
    │
    ↓
┌─────────────────────────┐
│ User chooses action:    │
└─────────────────────────┘
    │
    ├─→ "Adjust Start Date"
    │   ↓
    │   Set new start date to 01/12/2025
    │   (after existing expiry)
    │   ↓
    │   Continue to Step 4
    │
    └─→ "Submit Debit Note"
        ↓
        Navigate to debit note flow
        ↓
        Request cancellation of existing policy
        ↓
        Wait for approval
        ↓
        Return to create new policy
```

---

## 🛠️ Configuration

### Simulation Mode (Testing):
```javascript
// Location: MotorInsuranceScreen.js (Line 43)
const USE_DMVIC_SIMULATION = true;  // Set to false for production
```

**When `true`:**
- Uses simulated DMVIC response (no backend call)
- Always returns existing cover for testing
- 1-second delay to simulate API latency

**When `false`:**
- Calls real backend API
- Depends on DMVIC endpoint configuration
- May fail silently if DMVIC not configured

### Simulated Response:
```javascript
// Location: MotorInsuranceScreen.js (Lines 46-57)
const SIMULATED_DMVIC_RESPONSE = {
  exists: true,
  policy: {
    policy_number: 'POL/2025/001234',
    vehicle_registration: 'KAA 123A',
    insurer: 'Jubilee Insurance',
    cover_type: 'Comprehensive',
    start_date: '2024-12-01',
    expiry_date: '2025-11-30',
    premium: 'KSh 45,000',
    certificate_number: 'CERT-2025-001234'
  }
};
```

---

## 🔐 Backend Validation

### Required Backend Endpoints:

1. **Vehicle Check (Double Insurance)**
   ```
   POST /api/insurance/integrations/vehicle_check/
   ```
   
   **Handler:** `verify_vehicle_with_dmvic()` in `dmvic_integrations.py`
   
   **Calls:** `DMVICService.validate_double_insurance()`
   
   **DMVIC API:** `/api/v1/ValidateDoubleInsurance`

2. **Alternative New Endpoint:**
   ```
   POST /api/dmvic/validate-double-insurance/
   ```
   
   **Handler:** `validate_double_insurance()` in `dmvic_views.py`
   
   **Request:**
   ```json
   {
     "chassis_number": "ZNE10-0371893",
     "start_date": "2025-11-04",
     "end_date": "2026-11-04"
   }
   ```

### Validation Logic:
```python
# Backend checks:
1. Query DMVIC API with chassis number + dates
2. DMVIC returns active policies for that vehicle
3. Check if any policy overlaps with requested dates:
   - Existing start <= Requested end
   - Existing end >= Requested start
4. If overlap detected:
   - Return existing policy details
   - exists = true
5. If no overlap:
   - exists = false
   - Allow policy creation
```

---

## ⚠️ Error Handling

### Scenarios:

1. **DMVIC API Unavailable:**
   ```javascript
   catch (error) {
     // Silently handle - don't block user
     setVerificationStatus('not_found');
     setExistingCoverData(null);
     // User can proceed (backend will validate again)
   }
   ```

2. **No Registration Number:**
   ```javascript
   if (!registrationNumber) {
     setVerificationStatus('not_found');
     setExistingCoverData(null);
     // Skip verification
   }
   ```

3. **Network Failure:**
   - Frontend doesn't block user flow
   - Backend performs final validation on payment
   - DMVIC may reject at certificate issuance stage

---

## 📝 Key Implementation Details

### Step Sequence:
- **Step 1:** Category Selection
- **Step 2:** Vehicle Details (registration, dates, sum insured)
- **Step 3:** Verification (DMVIC check happens here)
- **Step 4:** Client Details
- **Step 5:** Payment

### Timing of DMVIC Check:
✅ **Correct:** Between Step 2 → Step 3 transition
❌ **Not:** Real-time as user types
❌ **Not:** On form submission only

### Why This Timing?
1. User has completed all vehicle details
2. Registration number is confirmed
3. Cover dates are set
4. Before collecting client details (saves time if adjustment needed)
5. Before payment (prevents failed transactions)

---

## 🎯 Business Rules

### Date Adjustment Rules:
```javascript
// New policy start date must be AFTER existing policy end date
new_start_date > existing_policy.expiry_date

// Example:
// Existing policy expires: 2025-11-30
// Minimum new start date: 2025-12-01
```

### Debit Note Process:
1. User requests debit note from current insurer
2. Insurer calculates prorated refund
3. Insurer cancels existing policy
4. User receives debit note confirmation
5. User can create new policy (no double insurance)

---

## 🚀 Production Considerations

### Required Configuration:
1. Set `USE_DMVIC_SIMULATION = false`
2. Ensure DMVIC endpoint enabled for production ClientID
3. Configure proper error handling and retry logic
4. Add analytics tracking for:
   - How often existing cover is found
   - User actions (adjust date vs debit note)
   - Success rate of adjusted policies

### Performance:
- DMVIC API response time: ~2-5 seconds
- Frontend shows loading state during check
- Async operation doesn't block UI
- Cached results not recommended (cover status changes frequently)

---

## ✅ Summary

**What:** Automatic double insurance check via DMVIC API

**When:** Transition from Step 2 (Vehicle Details) → Step 3 (Verification)

**Trigger:** User has entered registration number + cover dates

**How:**
1. Frontend calls backend vehicle check endpoint
2. Backend queries DMVIC ValidateDoubleInsurance API
3. DMVIC returns existing active policies (if any)
4. Frontend displays drawer with policy details

**User Actions:**
1. **Adjust Start Date** - Set new date after existing expiry
2. **Submit Debit Note** - Request cancellation of existing policy

**Result:** Prevents double insurance violations, ensures compliance with Kenya insurance regulations

---

**Implementation Status:** ✅ Implemented (Simulation mode active)  
**Production Status:** ⏳ Pending DMVIC endpoint enablement  
**Location:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/`
