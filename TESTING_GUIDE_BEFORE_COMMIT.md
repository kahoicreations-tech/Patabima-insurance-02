# Motor2 - Quick Testing Guide Before Commit

## PRE-COMMIT TESTING CHECKLIST

**CRITICAL**: Test these scenarios before committing to ensure keyboard fixes are working.

---

## Test 1: Third Party Flow - Keyboard Persistence ⚡ PRIORITY

**Time**: 2-3 minutes  
**Goal**: Verify keyboard never dismisses and underwriters don't blink

### Steps:

1. **Start the app**:

   ```bash
   # Terminal 1: Start backend (if not running)
   cd insurance-app
   python manage.py runserver

   # Terminal 2: Start Expo
   npm start
   ```

2. **Open app on device/emulator**:

   - Press `a` for Android emulator
   - Or scan QR code on physical device

3. **Navigate to Third Party**:

   - Tap "Motor Insurance" on Dashboard
   - Select "Private" category
   - Select "Third Party"

4. **CRITICAL TEST - Type registration slowly**:

   - Tap "Vehicle Registration" field
   - ✅ Keyboard should appear
   - Type: **K** (pause 1 second)
   - ✅ Keyboard should STAY visible
   - Type: **D** (pause 1 second)
   - ✅ Keyboard should STAY visible
   - Type: **A** (pause 1 second)
   - ✅ Keyboard should STAY visible
   - Type: **space** (pause 1 second)
   - ✅ Keyboard should STAY visible
   - Type: **1 2 3 A** (quickly)
   - ✅ Keyboard should STAY visible throughout

5. **CRITICAL TEST - Underwriters don't blink**:

   - ✅ Underwriters should load ONCE (immediately after screen loads)
   - ✅ While typing registration, underwriter list should NOT refresh
   - ✅ No loading spinner should appear while typing
   - ✅ Underwriter cards should NOT flash/blink

6. **Check console logs** (if using React Native Debugger):
   - ❌ Should NOT see emoji logs (🔑/🔍/⌨️/🔄/🛡️/✅/⏭️/⏱️)
   - ✅ Console should be clean (only API logs if any)

### Expected Results:

- ✅ Keyboard visible throughout typing (NO flicker, NO dismissal)
- ✅ Underwriters load once on mount
- ✅ NO re-fetch while typing registration
- ✅ NO list blinking/flashing
- ✅ Clean console (no emoji debug logs)

### If Test FAILS:

**STOP** - Do NOT commit. Report the issue.

---

## Test 2: Comprehensive Flow - Sum Insured Field ⚡ PRIORITY

**Time**: 2-3 minutes  
**Goal**: Verify keyboard persistence with sum_insured field

### Steps:

1. **Navigate to Comprehensive**:

   - Motor Insurance → Private → Comprehensive

2. **Test registration field** (same as Test 1):

   - Type "KDA 123A" letter-by-letter
   - ✅ Keyboard should stay visible

3. **Test sum_insured field**:

   - Tap "Sum Insured" field
   - ✅ Keyboard should appear (numeric)
   - Type: **1 5 0 0 0 0 0** (slowly)
   - ✅ Keyboard should STAY visible
   - ✅ Should see currency formatting: "1 500 000"

4. **Verify NO underwriters on this screen**:
   - ✅ Should NOT see underwriter list on Vehicle Details screen
   - ✅ Underwriter comparison happens on dedicated Underwriter screen (next step)

### Expected Results:

- ✅ Keyboard visible throughout typing
- ✅ Currency formatting works (spaces every 3 digits)
- ✅ NO underwriters on Vehicle Details screen

### If Test FAILS:

**STOP** - Do NOT commit. Report the issue.

---

## Test 3: Quick Foundation Components Test 🔧 OPTIONAL

**Time**: 1 minute  
**Goal**: Verify new foundation components can be imported

### Quick Import Test:

1. Create a temporary test file:

   ```bash
   # PowerShell
   New-Item -Path "frontend/screens/quotations/Motor 2/TestFoundation.js" -Force
   ```

2. Add this code:

   ```javascript
   import ControlledTextInput from "../../../components/forms/ControlledTextInput";
   import ControlledRadioGroup from "../../../components/forms/ControlledRadioGroup";
   import ControlledSelect from "../../../components/forms/ControlledSelect";
   import ControlledDatePicker from "../../../components/forms/ControlledDatePicker";
   import { useMotorFormField } from "../../../hooks/useMotorFormField";
   import { validateKenyanRegistration } from "../../../utils/motorFormValidation";

   console.log("✅ All foundation components imported successfully!");

   export default function TestFoundation() {
     return null;
   }
   ```

3. Check for import errors in terminal:

   ```bash
   # Should NOT see any import errors
   # Metro bundler should bundle successfully
   ```

4. Delete test file:
   ```bash
   Remove-Item "frontend/screens/quotations/Motor 2/TestFoundation.js"
   ```

### Expected Results:

- ✅ No import errors
- ✅ Metro bundler successful

---

## PASS/FAIL Decision

### ✅ PASS - Safe to Commit:

- [ ] Test 1 passed (Third Party keyboard + no blinking)
- [ ] Test 2 passed (Comprehensive keyboard + sum_insured)
- [ ] Console is clean (no emoji debug logs)

### ❌ FAIL - Do NOT Commit:

- [ ] Keyboard dismisses while typing
- [ ] Underwriters blink/refresh while typing
- [ ] Console shows emoji debug logs
- [ ] Import errors for foundation components

---

## Quick Commands Reference

### Start Everything:

```bash
# Terminal 1 (Backend)
cd insurance-app
python manage.py runserver

# Terminal 2 (Frontend)
npm start
# Then press 'a' for Android or scan QR for device
```

### Check Console (React Native Debugger):

1. Shake device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
2. Select "Debug"
3. Open Chrome DevTools
4. Check Console tab - should be clean

### Quick Test Route:

```
Dashboard
  → Motor Insurance
    → Private
      → Third Party
        → Type "KDA 123A" slowly
          → Watch keyboard (stays visible?)
          → Watch underwriters (no blinking?)
```

---

## After Testing

### If ALL Tests PASS:

✅ Safe to commit:

```bash
git add .
git commit -m "feat: Motor2 foundation components + keyboard persistence fixes

- Add ControlledTextInput, ControlledRadioGroup, ControlledSelect, ControlledDatePicker
- Add useMotorFormField hook for field state management
- Add motorFormValidation.js with 12+ validators
- Remove debug console.log statements (clean production code)
- Update copilot-instructions.md with form handling patterns

TESTED:
- Third Party: keyboard persistence ✅, no underwriter blinking ✅
- Comprehensive: sum_insured formatting ✅, keyboard persistence ✅
- Console: clean (no debug logs) ✅

Ready for production testing."

git push insurance02 main
```

### If ANY Test FAILS:

❌ Report issue, investigate, fix, then re-test.

---

## Estimated Testing Time

- Test 1 (Third Party): **2-3 minutes**
- Test 2 (Comprehensive): **2-3 minutes**
- Test 3 (Imports): **1 minute** (optional)

**Total**: **5-7 minutes** before commit

---

## Need Help?

**Keyboard dismisses?**

- Check `DynamicVehicleForm.js` line 24: `blurOnSubmit={false}`
- Check `returnKeyType="next"`

**Underwriters blinking?**

- Check guards in effect (lines 520-540)
- Check `hasComparisonsRef.current` is preventing re-fetch

**Debug logs still showing?**

- Re-run debug log removal (I already did this)
- Search: `console.log.*[🔑🔍⌨️🔄🛡️✅⏭️⏱️]`

---

**REMEMBER**: Testing takes 5-7 minutes. Fixing broken production code takes hours. Test now! 🚀
