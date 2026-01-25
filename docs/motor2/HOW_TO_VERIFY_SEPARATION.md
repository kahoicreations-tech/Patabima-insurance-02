# How to Verify Motor2 Data Separation is Working

## Quick Visual Tests (No Code Required)

### Test 1: Fill Third Party → Switch to Comprehensive (No Bleeding)

**Steps:**

1. Open Motor Insurance flow
2. Select **Private** category
3. Select **Third Party** subcategory
4. Fill form:
   - Registration: `KDA 123A`
   - Cover Date: `11/30/2025`
   - Select underwriter: **Madison Insurance**
5. **Go back** to subcategory selection (tap back arrow)
6. Select **Comprehensive** subcategory

**Expected Results:**
✅ Registration `KDA 123A` should persist (shared field)  
✅ Cover Date `11/30/2025` should persist (shared field)  
✅ **Sum Insured field should be EMPTY** (no bleeding from Third Party)  
✅ **Underwriter should be RESET** (no Madison showing)  
✅ Underwriter list should load fresh for Comprehensive

**What This Proves:**

- Shared fields (registration, date) correctly persist across subcategories
- Pricing fields (sum_insured) are isolated per subcategory
- Underwriter selection resets when switching products

---

### Test 2: Fill Comprehensive → Switch to Third Party (Reverse Test)

**Steps:**

1. Start Motor Insurance flow
2. Select **Private** → **Comprehensive**
3. Fill form:
   - Registration: `KBZ 456C`
   - Cover Date: `12/01/2025`
   - Sum Insured: `500,000`
   - Select underwriter: **Jubilee**
4. **Go back** to subcategory selection
5. Select **Third Party**

**Expected Results:**
✅ Registration `KBZ 456C` should persist  
✅ Cover Date `12/01/2025` should persist  
✅ **Sum Insured field should NOT appear** (Third Party doesn't have it)  
✅ **Underwriter should be RESET** (no Jubilee showing)  
✅ Third Party underwriters load fresh

**What This Proves:**

- Comprehensive pricing data (sum_insured) doesn't pollute Third Party
- Form fields adapt correctly to pricing model (FIXED vs BRACKET)
- Data isolation prevents cross-contamination

---

### Test 3: Round-Trip Test (Comprehensive → Third Party → Back to Comprehensive)

**Steps:**

1. Select **Comprehensive**
2. Fill:
   - Registration: `KDA 789D`
   - Sum Insured: `800,000`
   - Select: **UAP**
3. Switch to **Third Party**
4. Verify Third Party has no sum_insured
5. **Switch back to Comprehensive**

**Expected Results:**
✅ Registration `KDA 789D` persists throughout  
✅ **Sum Insured `800,000` is SAVED and restored** when returning to Comprehensive  
✅ **UAP selection is RESET** (needs re-selection)  
✅ Form shows sum_insured field again (BRACKET model)

**What This Proves:**

- Per-subcategory pricing data is saved and restored correctly
- `pricingData[PRIVATE_COMPREHENSIVE]` stores sum_insured separately
- `pricingData[PRIVATE_THIRD_PARTY]` remains empty (FIXED model)
- Switching doesn't lose entered data

---

## Console Log Verification

### What to Look For in Metro/Console:

**When opening PolicyDetailsStep:**

```
🔷 [PolicyDetailsStep] Render - subcategory: PRIVATE_THIRD_PARTY
🔷 [PolicyDetailsStep] sharedVehicleData: {registrationNumber: 'KDA 123A', cover_start_date: '2025-11-30', ...}
🔷 [PolicyDetailsStep] currentPricingData: {} (FIXED model has no fields)
🔷 [PolicyDetailsStep] selectedUnderwriter: null
```

**When typing in registration field:**

```
📥 [PolicyDetailsStep] handleDataChange received data: ['registrationNumber', 'cover_start_date', ...]
📤 [PolicyDetailsStep] Updating sharedVehicleData: {registrationNumber: 'KDA 123A'}
```

**When switching to Comprehensive:**

```
🔷 [PolicyDetailsStep] Render - subcategory: PRIVATE_COMPREHENSIVE
🔷 [PolicyDetailsStep] sharedVehicleData: {registrationNumber: 'KDA 123A', ...} (PERSISTED)
🔷 [PolicyDetailsStep] currentPricingData: {} (empty, ready for sum_insured)
🔷 [PolicyDetailsStep] selectedUnderwriter: null (RESET)
```

**When entering sum_insured in Comprehensive:**

```
📥 [PolicyDetailsStep] handleDataChange received data: ['sum_insured', ...]
📤 [PolicyDetailsStep] Updating pricingData: {sum_insured: 500000}
```

---

## Using the State Debugger Component

### How to Add Debug View:

**Option 1: Add to MotorInsuranceContainer:**

```javascript
import StateDebugger from "./debug/StateDebugger";

// Inside render, add at bottom:
{
  __DEV__ && <StateDebugger />;
}
```

**Option 2: Temporary Full-Screen View:**
Replace PolicyDetailsStep content temporarily:

```javascript
import StateDebugger from "../debug/StateDebugger";
return <StateDebugger />;
```

### What the Debugger Shows:

1. **Current Subcategory**: Active product (PRIVATE_THIRD_PARTY, etc.)
2. **sharedVehicleData**: Universal fields (registration, dates, vehicle catalog)
3. **pricingData[code]**: Isolated pricing fields for current subcategory
4. **All pricingData**: Full object showing all subcategories' data
5. **selectedUnderwriter**: Current selection with subcategory link
6. **vehicleDetails (Legacy)**: Merged view for backward compatibility
7. **Verification Tests**: Pass/fail checks

---

## Success Criteria

### ✅ Separation is Working If:

1. **Shared Fields Persist:**

   - Registration number visible in both Third Party and Comprehensive
   - Cover date persists across all subcategories
   - Vehicle make/model/year persist (once entered)

2. **Pricing Fields Isolated:**

   - `sum_insured` only appears in Comprehensive (BRACKET model)
   - `tonnage` only appears in Commercial (TONNAGE model)
   - `capacity` only appears in PSV/TukTuk (PASSENGER model)
   - Third Party (FIXED model) shows NO pricing fields

3. **Underwriter Reset:**

   - Selecting underwriter in Third Party
   - Switching to Comprehensive shows NO pre-selected underwriter
   - Must select fresh underwriter for each product

4. **Data Restoration:**

   - Fill Comprehensive with sum_insured=500k
   - Switch to Third Party (sum_insured disappears)
   - Switch back to Comprehensive (sum_insured=500k restored)

5. **Console Logs Show Routing:**
   - `Updating sharedVehicleData` for registration, dates, vehicle info
   - `Updating pricingData` for sum_insured, tonnage, capacity
   - Field classification working correctly

---

## Troubleshooting

### ❌ Problem: Sum Insured Appears in Third Party

**Cause:** Backward compatibility shim bleeding data  
**Fix:** Check `vehicleDetails` merge logic in Context  
**Verify:** `pricingData['PRIVATE_THIRD_PARTY']` should be empty `{}`

### ❌ Problem: Registration Number Doesn't Persist

**Cause:** Not routing to `sharedVehicleData`  
**Fix:** Check `handleDataChange` field classification in PolicyDetailsStep  
**Verify:** Console should show `Updating sharedVehicleData`

### ❌ Problem: Underwriter Persists Across Products

**Cause:** `SET_CATEGORY_SELECTION` not resetting underwriter  
**Fix:** Check reducer resets `selectedUnderwriter: null`  
**Verify:** `state.selectedUnderwriter` should be null after subcategory switch

### ❌ Problem: Data Lost When Switching

**Cause:** Not saving to `pricingData[code]` before switch  
**Fix:** Check `SET_CATEGORY_SELECTION` calls `extractPricingFieldsForModel()`  
**Verify:** `pricingData` object contains keys for visited subcategories

---

## Advanced: Inspect Redux DevTools (Optional)

If you have Redux DevTools installed:

1. Look for `state.sharedVehicleData` object
2. Look for `state.pricingData` object structure:
   ```json
   {
     "PRIVATE_THIRD_PARTY": {},
     "PRIVATE_COMPREHENSIVE": { "sum_insured": 500000 },
     "COMMERCIAL_UPTO_3_TONS": { "tonnage": 2.5 }
   }
   ```
3. Watch actions: `UPDATE_SHARED_VEHICLE_DATA`, `UPDATE_PRICING_DATA`

---

## Summary

**Quick Test:** Fill Third Party → Switch to Comprehensive → Check if sum_insured is empty  
**Pass:** ✅ No bleeding, separation working  
**Fail:** ❌ Sum insured appears in Comprehensive, check compatibility shim

**Documentation Updated:** November 30, 2025  
**Architecture:** Motor2 Subcategory Data Isolation (Phase 2)
