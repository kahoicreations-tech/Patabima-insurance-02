# DMVIC Flow Test Plan - KAC040R

## Test Date: November 9, 2025

## Expected Flow for Vehicle: KAC040R (ISUZU TFR54 1993)

### Backend Setup ✅

- DMVIC Integration: **ENABLED**
- Vehicle has existing cover: **YES**
- Existing cover expires: **October 15, 2026**
- Minimum cover start date: **October 16, 2026**

---

## Step-by-Step Test Procedure

### STEP 1: Category Selection

1. **Navigate to**: Motor 2 Flow → Select PRIVATE
2. **Select subcategory**: THIRD_PARTY or THIRD_PARTY_EXT
3. **Expected**: Move to PolicyDetailsStep

---

### STEP 2: PolicyDetailsStep - Enter Registration

#### Option A: Enter registration in PolicyDetailsStep

1. **Enter registration**: KAC040R
2. **Select cover start date**: 11/9/2025 (or any date before 10/16/2026)
3. **Expected logs**:
   ```
   [DynamicVehicleForm] Registration changed, triggering DMVIC check: KAC040R
   [DMVIC PolicyDetails] Registration changed: KAC040R
   [DMVIC PolicyDetails] Triggering debounced DMVIC check...
   [DMVIC PolicyDetails] Starting check for: KAC040R Cover date: 2025-11-09
   ```

#### Option B: Registration pre-filled (from previous step)

1. **Expected logs on mount**:
   ```
   [DMVIC PolicyDetails] 🔥 MOUNT: Found existing registration: KAC040R
   [DMVIC PolicyDetails] 🔥 MOUNT: Triggering DMVIC check immediately
   [DMVIC PolicyDetails] Starting check for: KAC040R
   ```

---

### STEP 3: DMVIC Backend Response Processing

**Expected API Response** (from backend test):

```json
{
  "success": true,
  "has_existing_cover": true,
  "existing_cover_expiry": "2026-10-15",
  "vehicle": {
    "registration_number": "KAC040R",
    "make": "ISUZU",
    "model": "TFR54",
    "year_of_manufacture": "1993",
    "engine_number": "582859",
    "chassis_number": "TFR54-7108165",
    "has_active_cover": true,
    "current_policy": {
      "policy_number": "YK/M/046/02/2011034",
      "member_company": "Madison General Business Confidential",
      "cover_start_date": "16/10/2025",
      "cover_end_date": "15/10/2026",
      "certificate_type": "Type A Cover"
    }
  }
}
```

**Expected Frontend Processing**:

1. **Auto-fill vehicle data**:

   ```
   [DMVIC PolicyDetails] Auto-filled make: ISUZU
   [DMVIC PolicyDetails] Auto-filled model: TFR54
   [DMVIC PolicyDetails] Auto-filled engine number: 582859
   [DMVIC PolicyDetails] Auto-filled chassis number: TFR54-7108165
   [DMVIC PolicyDetails] Auto-filled year: 1993
   ```

2. **Process existing cover**:

   ```
   [DMVIC PolicyDetails] Existing cover detected
   [DMVIC PolicyDetails] Existing cover expires: 2026-10-15
   [DMVIC PolicyDetails] Minimum date calculated: 2026-10-16T00:00:00.000Z
   ```

3. **Set context state**:

   ```
   [DMVIC PolicyDetails] 🔥 ABOUT TO SET EXISTING COVER DATA: {
     "hasExistingCover": true,
     "expiryDate": "2026-10-15",
     "policy": {
       "vehicle_registration": "KAC040R",
       "policy_number": "YK/M/046/02/2011034",
       "insurer": "Madison General Business Confidential",
       "cover_type": "Type A Cover",
       "expiry_date": "2026-10-15",
       "certificate_number": "YK/M/046/02/2011034"
     }
   }

   [MotorContext] 🔥 setExistingCoverData CALLED with: {...}
   [MotorReducer] 🔥 SET_EXISTING_COVER_DATA received, payload: {...}
   [MotorReducer] ✅ New existingCoverData: {...}

   [DMVIC PolicyDetails] 🔥 ABOUT TO SET MIN COVER START DATE: 2026-10-16T00:00:00.000Z
   [MotorContext] 🔥 setMinCoverStartDate CALLED with: 2026-10-16T00:00:00.000Z
   [MotorReducer] 🔥 SET_MIN_COVER_START_DATE received, payload: 2026-10-16T00:00:00.000Z
   [MotorReducer] ✅ New minCoverStartDate: 2026-10-16T00:00:00.000Z
   ```

---

### STEP 4: Navigate to KYCStep

1. **Select underwriter**: Madison Insurance (KSh 3,029.88)
2. **Click Next** to navigate to KYCStep
3. **Expected logs on KYCStep mount**:

   ```
   [KYCStep] 🔥 COMPONENT RENDER
   [KYCStep] 🔥 state.existingCoverData: {
     "hasExistingCover": true,
     "expiryDate": "2026-10-15",
     "policy": {
       "vehicle_registration": "KAC040R",
       "policy_number": "YK/M/046/02/2011034",
       "insurer": "Madison General Business Confidential",
       "cover_type": "Type A Cover",
       "expiry_date": "2026-10-15",
       "certificate_number": "YK/M/046/02/2011034"
     }
   }
   [KYCStep] 🔥 state.minCoverStartDate: 2026-10-16T00:00:00.000Z
   [KYCStep] 🔥 state.showVerificationScreen: false

   [KYCStep] Mount check - Collision: true HasExistingCover: true
   [KYCStep] Selected date: 2025-11-09 Min date: 2026-10-16T00:00:00.000Z
   [KYCStep] ✅ Auto-opening verification modal for existing cover

   [MotorContext] 🔥 setShowVerificationScreen CALLED with: true
   [MotorReducer] 🔥 SET_SHOW_VERIFICATION_SCREEN received, payload: true
   ```

---

### STEP 5: VehicleVerificationScreen Modal Appears

**Expected Modal Content**:

- ✅ Title: "Existing Cover Detected"
- ✅ Icon: Shield icon
- ✅ Policy Details Card:
  - Registration: KAC040R
  - Insurer: Madison General Business Confidential
  - Cover Type: Type A Cover
  - Expires: October 15, 2026
  - Certificate: YK/M/046/02/2011034

**Expected Buttons**:

1. **"Adjust Start Date"** (Primary - Red button)
   - Updates cover_start_date to 2026-10-16
   - Closes modal
   - Allows user to proceed
2. **"Submit Debit Note"** (Secondary - White button with red border)
   - Creates debit note for overlapping period
   - Backend calculates prorated refund
   - Allows user to proceed with original date

---

### STEP 6: User Action - Adjust Start Date

1. **User clicks**: "Adjust Start Date"
2. **Expected**:
   - Cover start date updates to **October 16, 2026**
   - Modal closes
   - VehicleVerificationScreen.showVerificationScreen = false
   - User can proceed to next step

---

## Common Issues & Fixes

### Issue 1: Blinking Screen ❌

**Cause**: useEffect infinite loop (calling setState inside useEffect without proper guards)

**Fix Applied**:

- Added `hasCheckedOnMount` ref in PolicyDetailsStep
- Added `hasShownModal` ref in KYCStep
- Prevents useEffect from running multiple times

---

### Issue 2: DMVIC Check Not Triggered ❌

**Cause**: Registration entered before reaching PolicyDetailsStep

**Fix Applied**:

- Added useEffect on mount in PolicyDetailsStep
- Checks for existing registration and triggers DMVIC check immediately
- Uses `hasCheckedOnMount` ref to prevent infinite loops

---

### Issue 3: Context State Not Persisting ❌

**Cause**: State being set in PolicyDetailsStep but not visible in KYCStep

**Expected Root Cause** (if still happening):

- Check if MotorInsuranceProvider wraps both steps
- Check if navigation is clearing state
- Check if another action is overwriting DMVIC state

**Debugging Steps**:

1. Look for logs: `[MotorContext] 🔥 setExistingCoverData CALLED`
2. Look for logs: `[MotorReducer] 🔥 SET_EXISTING_COVER_DATA received`
3. If both present but KYCStep shows empty state → navigation issue
4. If logs missing → actions not being called

---

## Success Criteria ✅

- [ ] Registration entry triggers DMVIC API call
- [ ] Backend returns has_existing_cover: true
- [ ] Frontend auto-fills vehicle data (make, model, year, engine, chassis)
- [ ] Frontend sets existingCoverData in context
- [ ] Frontend sets minCoverStartDate in context (expiry + 1 day)
- [ ] KYCStep reads correct existingCoverData from context
- [ ] KYCStep detects collision (selected date < min date)
- [ ] VehicleVerificationScreen modal appears automatically
- [ ] Modal shows correct policy details
- [ ] "Adjust Start Date" button updates cover_start_date to min date
- [ ] Modal closes after adjustment
- [ ] User can proceed to next step
- [ ] No blinking/infinite re-renders

---

## Test Vehicles

| Registration | Make   | Model   | Year | Has Cover | Expiry Date | Expected Behavior     |
| ------------ | ------ | ------- | ---- | --------- | ----------- | --------------------- |
| KAC040R      | ISUZU  | TFR54   | 1993 | ✅ Yes    | 15/10/2026  | Modal should show     |
| KDA123A      | SUBARU | IMPREZA | 2013 | ✅ Yes    | 01/11/2026  | Modal should show     |
| KBZ999X      | TOYOTA | COROLLA | 2020 | ❌ No     | N/A         | Modal should NOT show |

---

## Notes

- Current date: November 9, 2025
- All dates should be validated against this date
- Collision detection: selected_date < min_cover_start_date
- Min cover start date: existing_cover_expiry + 1 day
