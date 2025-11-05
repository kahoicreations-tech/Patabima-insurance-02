# Motor 2 Flow - Diagnostic Report & Fixes Applied

**Date:** November 5, 2025  
**Reported Issues:**

1. Kenyan plate number validation not working
2. DMVIC verification not displaying

---

## 🔍 Diagnostic Findings

### Issue 1: Plate Number Validation ❌ FOUND & FIXED

**Problem:**

- Current validation only checks for alphanumeric characters
- Does NOT validate proper Kenyan plate format (KXX 123X)
- Users could enter invalid formats like "ABC 999Z" or "12345"

**Expected Kenyan Plate Format:**

```
Format: KXX 123X
- K: Always starts with 'K'
- XX: Two letters (series code, e.g., AA, BZ, etc.)
- [space]: Optional space
- 123: Three digits
- X: One check letter

Examples:
✅ KAA 123A
✅ KAA123A (without space)
✅ KBZ 456C
✅ kaa 123a (case-insensitive)

❌ ABC 123X (doesn't start with K)
❌ KAA 12A (only 2 digits)
❌ KAA 1234A (4 digits)
❌ KAA 123 (missing check letter)
```

**Fix Applied:**

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`

**Line:** ~652-676 (validation logic)

**Before:**

```javascript
if (identificationType === "Vehicle Registration") {
  if (!/^[A-Z0-9\s]+$/i.test(value)) {
    return "Registration number contains invalid characters";
  }
}
```

**After:**

```javascript
if (identificationType === "Vehicle Registration") {
  // Kenyan vehicle registration format validation
  // Format: KXX 123X or KXX123X (e.g., KAA 123A, KBZ456C)
  const kenyanPlatePattern = /^K[A-Z]{2}\s*\d{3}[A-Z]$/i;
  const cleanedValue = value.trim().toUpperCase();

  // First check for basic invalid characters
  if (!/^[A-Z0-9\s]+$/i.test(value)) {
    return "Registration number contains invalid characters";
  }

  // Then validate Kenyan plate format
  if (!kenyanPlatePattern.test(cleanedValue)) {
    return "Invalid Kenyan plate format. Expected: KXX 123X (e.g., KAA 123A)";
  }
}
```

**Regex Pattern Breakdown:**

```
^K            - Must start with 'K'
[A-Z]{2}      - Exactly 2 letters (series code)
\s*           - Optional whitespace (0 or more spaces)
\d{3}         - Exactly 3 digits
[A-Z]         - Exactly 1 letter (check letter)
$             - End of string
/i            - Case-insensitive flag
```

**Testing:**
Run diagnostic tool: `node frontend/screens/quotations/Motor\ 2/test_dmvic_integration.js`

---

### Issue 2: DMVIC Verification Not Displaying ⚠️ NEEDS INVESTIGATION

**Current Implementation Status:** ✅ CODE EXISTS, ❓ MAY NOT BE TRIGGERING

**What's Already Implemented:**

1. **PolicyDetailsStep.js** (Lines 1-223):

   - ✅ `performDMVICCheck` function implemented
   - ✅ Debounced check (500ms) when registration changes
   - ✅ API call to `/api/insurance/dmvic/search-vehicle/`
   - ✅ Processes response and updates context
   - ✅ Shows VehicleVerificationScreen modal when existing cover found

2. **DynamicVehicleForm.js** (Lines 580-582):

   - ✅ Triggers `onRegistrationChange` callback when registration field changes
   - ✅ Displays inline loading indicator
   - ✅ Shows checkmark when no existing cover
   - ✅ Shows error indicator on API failure

3. **MotorInsuranceContainer.js** (Lines 385-420):

   - ✅ Modal configured to show VehicleVerificationScreen
   - ✅ Controlled by `state.showVerificationScreen` flag

4. **VehicleVerificationScreen.js** (Lines 1-396):
   - ✅ Displays existing policy details
   - ✅ "Adjust Start Date" button auto-updates cover start date
   - ✅ "Submit Debit Note" button for overlapping policies

**Possible Reasons DMVIC Might Not Show:**

### A. Backend Endpoint Not Accessible

```
Check: Is backend running?
  cd insurance-app
  python manage.py runserver

Check: Is endpoint accessible?
  curl -X POST http://127.0.0.1:8000/api/insurance/dmvic/search-vehicle/ \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{
      "registration_number": "KAA123A",
      "proposed_cover_start_date": "2025-11-10"
    }'

Expected Response:
  {
    "success": true,
    "has_existing_cover": false,
    "vehicle": null,
    "message": "No existing cover found"
  }
```

### B. API Call Failing Silently

```
Check Console Logs:
  [DMVIC PolicyDetails] Registration changed: KAA 123A
  [DMVIC PolicyDetails] Starting check for: KAA123A
  [DMVIC PolicyDetails] Fetching fresh data
  [DMVIC PolicyDetails] API Response: {...}

If Missing:
  - Debounce not triggering (check 500ms delay)
  - Registration too short (< 6 characters)
  - onRegistrationChange not being called
```

### C. Response Format Mismatch

```
Backend Returns:
  {
    "success": true,
    "has_existing_cover": true,
    "existing_cover_expiry": "2025-12-15",
    "vehicle": {
      "registration_number": "KAA123A",
      "policy_number": "POL-2025-123456",
      "member_company": "Madison Insurance",
      "class_of_insurance": "Comprehensive",
      "cover_end_date": "2025-12-15"
    }
  }

Frontend Expects:
  - result.success === true
  - result.has_existing_cover === true (boolean)
  - result.existing_cover_expiry (ISO date string)
  - result.vehicle (object with policy details)

Check ProcessDMVICResult (Line 38-98):
  - Logs: [DMVIC PolicyDetails] Processing result: {...}
  - Logs: [DMVIC PolicyDetails] Existing cover detected
  - Should call: actions.setShowVerificationScreen(true)
```

### D. Context State Not Updating

```
Check MotorInsuranceContext.js:
  - setShowVerificationScreen action exists? ✅ (Line 691)
  - Modal visible={state.showVerificationScreen}? ✅ (Line 388)

Debug Steps:
  1. Add console.log in PolicyDetailsStep after API call
  2. Check if actions.setShowVerificationScreen(true) is called
  3. Check if state.showVerificationScreen updates in context
  4. Verify modal renders when state.showVerificationScreen === true
```

---

## 🛠️ How to Debug DMVIC

### Step 1: Run Diagnostic Tool

```bash
cd frontend/screens/quotations/Motor\ 2
node test_dmvic_integration.js
```

This will test:

- ✅ DMVIC endpoint accessibility
- ✅ Kenyan plate validation regex
- ⚠️ Integration checklist

### Step 2: Enable Debug Logging

Add to `PolicyDetailsStep.js` (before line 104):

```javascript
const performDMVICCheck = useCallback(
  async (regNumber, coverDate) => {
    console.log("🔍 [DEBUG] performDMVICCheck called");
    console.log("🔍 [DEBUG] regNumber:", regNumber);
    console.log("🔍 [DEBUG] regNumber.length:", regNumber?.length);
    console.log("🔍 [DEBUG] coverDate:", coverDate);

    if (!regNumber || regNumber.length < 6) {
      console.log("🔍 [DEBUG] SKIPPING - Registration too short");
      return;
    }

    // ... rest of function
  },
  [actions, processDMVICResult]
);
```

### Step 3: Test in App

1. Start backend:

   ```bash
   cd insurance-app
   python manage.py runserver
   ```

2. Start frontend:

   ```bash
   cd frontend
   npm start
   ```

3. Open Motor 2 flow
4. Enter registration: **KAA 123A**
5. Watch console logs:

   ```
   [DynamicVehicleForm] Registration changed, triggering DMVIC check: KAA 123A
   🔍 [DEBUG] performDMVICCheck called
   🔍 [DEBUG] regNumber: KAA 123A
   🔍 [DEBUG] regNumber.length: 9
   🔍 [DEBUG] coverDate: 2025-11-10
   [DMVIC PolicyDetails] Starting check for: KAA123A
   [DMVIC PolicyDetails] Fetching fresh data for: KAA123A
   [DMVIC PolicyDetails] Request payload: { ... }
   [DMVIC PolicyDetails] API Response: { ... }
   [DMVIC PolicyDetails] Processing result: { ... }
   ```

6. If existing cover found:

   ```
   [DMVIC PolicyDetails] Existing cover detected
   [DMVIC PolicyDetails] Existing cover found, showing verification screen
   ```

7. Modal should appear with existing policy details

---

## 📋 Files Modified

### 1. DynamicVehicleForm.js

**Location:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`

**Changes:**

- Line ~652-676: Added Kenyan plate format validation
- Added regex pattern: `/^K[A-Z]{2}\s*\d{3}[A-Z]$/i`
- Improved error message: "Invalid Kenyan plate format. Expected: KXX 123X (e.g., KAA 123A)"

**Impact:**

- ✅ Users can only submit valid Kenyan plates
- ✅ Clear error message guides users to correct format
- ✅ Case-insensitive (kaa 123a works)
- ✅ Space-flexible (KAA123A and KAA 123A both work)

### 2. test_dmvic_integration.js (NEW)

**Location:** `frontend/screens/quotations/Motor 2/test_dmvic_integration.js`

**Purpose:**

- Diagnostic tool to test DMVIC integration
- Tests backend endpoint accessibility
- Validates plate regex patterns
- Provides integration checklist

**Usage:**

```bash
node test_dmvic_integration.js
```

---

## ✅ Summary of Fixes

| Issue                | Status         | Fix Applied                         |
| -------------------- | -------------- | ----------------------------------- |
| **Plate Validation** | ✅ FIXED       | Added Kenyan plate regex validation |
| **DMVIC Display**    | ⚠️ INVESTIGATE | Code exists, needs debugging        |

---

## 🎯 Next Steps

### For User:

1. **Test Plate Validation:**

   - Open Motor 2 flow
   - Try entering: `ABC 123X` → Should show error
   - Try entering: `KAA 123A` → Should accept

2. **Debug DMVIC:**

   - Run diagnostic tool: `node test_dmvic_integration.js`
   - Check if backend endpoint is accessible
   - Enable debug logging as shown above
   - Test with real vehicle registration
   - Check console logs for errors

3. **Report Findings:**
   - Share console logs showing DMVIC API call
   - Confirm if modal appears with existing cover
   - Share any error messages

### For Developer:

1. **Verify Backend:**

   - Check DMVIC endpoint logs
   - Confirm response format matches frontend expectations
   - Test with Postman/curl

2. **Add Error Tracking:**

   - Implement Sentry/logging for API failures
   - Track DMVIC check success/failure rate
   - Monitor cache hit rate

3. **Future Enhancements:**
   - Add retry logic for failed DMVIC calls
   - Implement offline fallback
   - Add manual verification option
   - Cache DMVIC results for 24 hours

---

## 📚 Related Documentation

- `DMVIC_BACKEND_IMPLEMENTATION_COMPLETE.md` - Backend DMVIC integration
- `DMVIC_BACKEND_VERIFICATION.md` - Backend testing guide
- `MOTOR2_STEP3_STEP4_STREAMLINING_PLAN.md` - Phase 1 implementation plan
- `PataBima_Motor2_Flow_Simulation_and_Improvements.md` - Flow overview

---

## 🔗 Quick Reference

### Kenyan Plate Validation Regex

```javascript
/^K[A-Z]{2}\s*\d{3}[A-Z]$/i;
```

### DMVIC API Endpoint

```
POST /api/insurance/dmvic/search-vehicle/
```

### Key Files

```
frontend/screens/quotations/Motor 2/MotorInsuranceFlow/
├── steps/PolicyDetailsStep.js              (DMVIC trigger)
├── VehicleDetails/DynamicVehicleForm.js    (Plate validation)
├── VehicleVerification/VehicleVerificationScreen.js (Modal)
└── MotorInsuranceContainer.js              (Modal renderer)

frontend/contexts/MotorInsuranceContext.js  (State management)
```

---

**Document Status:** DRAFT - Pending DMVIC debugging results  
**Last Updated:** November 5, 2025  
**Next Update:** After DMVIC debugging complete
