# Motor2 Validation Fixes - November 10, 2025

## Issue Summary

User reported: **"why is it saying premium not calculated, yet i have already selected [underwriter]"**

### Root Cause Analysis

The validation system had multiple issues preventing proper underwriter and premium detection:

1. **Container Validation Issue** (`MotorInsuranceContainer.js` line 171):

   - Checked `state.calculatedPremium > 0` which **doesn't exist** in the context
   - Premium is actually stored in `state.selectedUnderwriter.total_premium`
   - Always returned `false`, blocking navigation

2. **Preflight Validation Issue** (`PolicySubmission.js` line 557):

   - Only checked `underwriterDetails.name`
   - Didn't fallback to `vehicleDetails.underwriter` or `selectedUnderwriter.name`
   - Failed when underwriter stored in different field structure

3. **Context Enrichment Issue** (`PolicySubmission.js` line 475):
   - Didn't check `company` field from underwriter object
   - Didn't persist underwriter to `vehicleDetails` for backend compatibility

---

## Fixes Applied

### Fix 1: MotorInsuranceContainer.js - Premium Validation

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceContainer.js`  
**Line:** 171

**Before:**

```javascript
const hasPremium = state.calculatedPremium > 0;
```

**After:**

```javascript
// Check premium from selected underwriter object (not state.calculatedPremium which doesn't exist)
const hasPremium = !!(
  selectedUnderwriter?.total_premium > 0 ||
  selectedUnderwriter?.totalPremium > 0
);
```

**Impact:** Now correctly detects premium from the actual underwriter selection.

---

### Fix 2: PolicySubmission.js - Enhanced Preflight Validation

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`  
**Lines:** 548-596

**Before:**

```javascript
if (
  !sanitizedPolicyData?.premiumBreakdown?.totalAmount ||
  sanitizedPolicyData.premiumBreakdown.totalAmount <= 0
) {
  missing.push("premiumBreakdown.totalAmount (must be > 0)");
}
if (!sanitizedPolicyData?.underwriterDetails?.name) {
  missing.push("underwriterDetails.name");
}
```

**After:**

```javascript
// Check premium from premiumBreakdown with fallback
const premiumAmount =
  sanitizedPolicyData?.premiumBreakdown?.totalAmount ||
  sanitizedPolicyData?.premiumBreakdown?.total_amount ||
  0;
if (!premiumAmount || premiumAmount <= 0) {
  missing.push("premiumBreakdown.totalAmount (must be > 0)");
}

// Check underwriter name from underwriterDetails or fallback to vehicleDetails
const underwriterName =
  sanitizedPolicyData?.underwriterDetails?.name ||
  sanitizedPolicyData?.vehicleDetails?.underwriter ||
  sanitizedPolicyData?.vehicleDetails?.selectedUnderwriter?.name;
if (!underwriterName) {
  missing.push("underwriterDetails.name");
}
```

**Impact:**

- More robust premium detection (checks both camelCase and snake_case)
- Falls back to multiple underwriter storage locations
- Added full policy data dump to console on validation failure for debugging

---

### Fix 3: PolicySubmission.js - Enhanced Context Enrichment

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`  
**Lines:** 475-492

**Before:**

```javascript
if (!composed.underwriterDetails) {
  composed.underwriterDetails = {
    name:
      ctxUnderwriter.name ||
      ctxUnderwriter.underwriter_name ||
      ctxVehicle.selectedUnderwriter ||
      ctxVehicle.underwriter ||
      "",
    code:
      ctxUnderwriter.code ||
      ctxUnderwriter.underwriter_code ||
      ctxUnderwriter.company_code ||
      "",
    id: ctxUnderwriter.id || ctxUnderwriter.underwriter_id || "",
  };
}
```

**After:**

```javascript
if (!composed.underwriterDetails || !composed.underwriterDetails.name) {
  composed.underwriterDetails = {
    name:
      ctxUnderwriter.name ||
      ctxUnderwriter.underwriter_name ||
      ctxUnderwriter.company || // NEW: Add 'company' field as fallback
      ctxVehicle.selectedUnderwriter?.name ||
      ctxVehicle.underwriter ||
      "",
    code:
      ctxUnderwriter.code ||
      ctxUnderwriter.underwriter_code ||
      ctxUnderwriter.company_code ||
      "",
    id: ctxUnderwriter.id || ctxUnderwriter.underwriter_id || "",
  };

  // NEW: Also store in vehicleDetails for backend compatibility
  if (
    !composed.vehicleDetails.underwriter &&
    composed.underwriterDetails.name
  ) {
    composed.vehicleDetails.underwriter = composed.underwriterDetails.name;
  }
  if (!composed.vehicleDetails.selectedUnderwriter && ctxUnderwriter.name) {
    composed.vehicleDetails.selectedUnderwriter = ctxUnderwriter;
  }
}
```

**Impact:**

- Checks `company` field from underwriter object
- Dual-write: Stores underwriter in both `underwriterDetails` AND `vehicleDetails`
- Ensures backend receives underwriter data regardless of frontend field structure

---

## Cache Clearing Implementation

**Previously Completed (Same Session):**

### MotorInsuranceContainer.js - Cache Clearing on Mount

Added comprehensive cache clearing on component mount to ensure fresh start:

```javascript
useEffect(() => {
  const clearMotor2Cache = async () => {
    try {
      console.log(
        "[MotorInsuranceContainer] 🗑️ Clearing Motor2 cached data on mount..."
      );

      // Clear module-level underwriter cache
      clearUnderwriterCache();

      // Clear AsyncStorage Motor2 flow data
      const keysToRemove = [
        "policy_submission_guard",
        "MOTOR_FLOW_STATE",
        "MOTOR_FLOW_VEHICLE_DETAILS",
        "MOTOR_FLOW_CLIENT_DETAILS",
        "MOTOR_FLOW_PRICING",
        "MOTOR_FLOW_UNDERWRITER",
        "MOTOR_FLOW_DOCUMENTS",
        "DMVIC_CACHE",
        "MOTOR_CATEGORY_SELECTION",
        "MOTOR_SUBCATEGORY_SELECTION",
      ];

      await Promise.all(
        keysToRemove.map((key) =>
          AsyncStorage.removeItem(key).catch((e) =>
            console.warn(`Failed to remove ${key}:`, e)
          )
        )
      );

      console.log(
        "[MotorInsuranceContainer] ✅ Motor2 cache cleared - starting fresh"
      );
    } catch (error) {
      console.warn("[MotorInsuranceContainer] Cache clear warning:", error);
    }
  };

  clearMotor2Cache();
}, []);
```

**Cache Layers Cleared:**

1. **Module-level Map**: `UnderwriterLocalCache.clear()`
2. **AsyncStorage**: 10 Motor2-related keys
3. **Fresh underwriter comparisons**: No stale pricing data

---

## Testing Checklist

- [x] Cache clearing logs appear on mount
- [x] Underwriter comparisons load fresh (from backend)
- [x] Selecting underwriter populates `state.selectedUnderwriter`
- [ ] Premium validation passes when underwriter selected
- [ ] "Next" button enables after underwriter selection
- [ ] Preflight validation passes with complete data
- [ ] Policy submission succeeds with all required fields

---

## Expected Behavior After Fixes

### User Flow:

1. **Open Motor2 Flow** → Cache cleared, fresh start
2. **Select Category** (Private) → ✅ Allowed
3. **Select Subcategory** (Third Party) → ✅ Allowed
4. **Fill Vehicle Details** (KCY 345F) → ✅ Allowed
5. **Select Underwriter** (Madison/PATABIMA/Jubilee) → ✅ `selectedUnderwriter` populated with full object
6. **Click "Next"** → ✅ Premium validation checks `selectedUnderwriter.total_premium > 0`
7. **Navigate to KYC** → ✅ Allowed (underwriter + premium validated)
8. **Complete Flow** → ✅ Preflight validation passes
9. **Submit Policy** → ✅ Underwriter data enriched from context

### Console Logs (Expected):

```
[MotorInsuranceContainer] 🗑️ Clearing Motor2 cached data on mount...
[DynamicVehicleForm] 🗑️ Clearing underwriter cache
[MotorInsuranceContainer] ✅ Motor2 cache cleared - starting fresh
[CACHE] compareUnderwritersBySubcategory hit → UW_SUBCAT|PRIVATE_THIRD_PARTY|0|0|0
[COMPARISONS LOADED] hasComparisonsRef.current set to TRUE, count: 4
[PolicyDetailsStep] Underwriter selected: Madison Insurance
[Context] Full underwriter object received: Madison Insurance
[MotorContainer] ✅ Navigation allowed to next step  <-- NOW WORKS!
```

---

## Error Scenarios Handled

### Scenario 1: No Underwriter Selected

- **Container Validation**: Blocks with message "Select an underwriter from the pricing comparison"
- **Preflight Validation**: Adds `underwriterDetails.name` to missing fields
- **User Sees**: Alert with "Please select an underwriter"

### Scenario 2: Premium Not Calculated

- **Container Validation**: Checks `selectedUnderwriter.total_premium > 0`
- **If 0 or missing**: Blocks with "Premium not calculated - please wait for pricing to load"
- **User Sees**: Cannot proceed until comparison loads

### Scenario 3: Validation Failure with Data Dump

- **New Feature**: Full policy data dump logged to console
- **Helps Debug**: Shows exactly what data is missing/malformed
- **Console Output**:
  ```javascript
  [PolicySubmission] Preflight validation failed: Missing required fields:
  - premiumBreakdown.totalAmount
  [PolicySubmission] Policy data dump: { clientDetails: {...}, vehicleDetails: {...} }
  ```

---

## Files Modified

1. ✅ `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceContainer.js`

   - Fixed premium validation (line 171)
   - Added cache clearing on mount (lines 47-77)
   - Imported `clearUnderwriterCache` (line 23)

2. ✅ `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`

   - Exported `clearUnderwriterCache()` function (lines 13-16)

3. ✅ `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`
   - Enhanced preflight validation (lines 548-596)
   - Enhanced context enrichment (lines 475-492)
   - Added policy data dump on validation failure

---

## Related Documentation

- **Motor2 Implementation Status**: `MOTOR2_IMPLEMENTATION_STATUS.md`
- **Copilot Instructions**: `.github/copilot-instructions.md` (Premium calculation patterns)
- **Backend Guide**: `insurance-app/app/views/policy_management.py` (create_motor_policy)

---

## Next Steps

1. **Test the fixes** with real user flow:

   - Select Third Party product
   - Choose any underwriter (Madison, PATABIMA, Jubilee, APA)
   - Verify "Next" button enables
   - Complete submission

2. **Monitor console logs** for:

   - Cache clearing confirmation
   - Underwriter selection logs
   - Premium validation success
   - Preflight validation passing

3. **If still issues**, check:
   - `state.selectedUnderwriter` structure in console
   - Premium breakdown fields (`total_premium` vs `totalPremium`)
   - Context state snapshot after underwriter selection

---

**Status:** ✅ FIXES APPLIED - READY FOR TESTING  
**Generated:** November 10, 2025 22:47 UTC  
**Issue:** Premium validation blocking navigation despite valid underwriter selection  
**Resolution:** Fixed validation to check actual `selectedUnderwriter` object instead of non-existent `calculatedPremium`
