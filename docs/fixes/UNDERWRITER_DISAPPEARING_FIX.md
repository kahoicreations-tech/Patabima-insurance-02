# Fix: Underwriter Cards Disappear After Selection

## Problem

When a user selected an underwriter card, the entire list of underwriter cards would disappear from the UI.

## Root Cause

A **race condition** in the auto-comparison effect:

1. User taps underwriter → `underwriterSelectedRef.current = true` is set
2. BUT the effect hook (line 720+) still scheduled a `setTimeout` to call `triggerUnderwriterComparison()`
3. Even though `underwriterSelectedRef` was true, the check was INSIDE the function
4. The timeout would fire and could trigger comparison logic
5. This would clear `underwriterComparisons` state → FlatList data becomes empty → cards disappear

## Solutions Implemented

### 1. Early Exit Check (Line 703-710)

```javascript
// ✅ CRITICAL: If underwriter has been selected, NEVER trigger auto-comparison
if (underwriterSelectedRef.current) {
  console.log("⏭️  Skipping comparison - underwriter already selected by user");
  if (comparisonTimeoutRef.current) {
    clearTimeout(comparisonTimeoutRef.current);
    comparisonTimeoutRef.current = null;
  }
  return; // ← Exit BEFORE setting timeout
}
```

**Impact**: Prevents timeout from being scheduled when underwriter already selected

### 2. Double-Check Inside Timeout (Line 733-738)

```javascript
comparisonTimeoutRef.current = setTimeout(() => {
  if (!underwriterSelectedRef.current) {
    // ← Check again
    triggerUnderwriterComparison();
  }
}, 1000);
```

**Impact**: If somehow a timeout was scheduled before selection, it won't execute

### 3. Function-Level Safety Check (Line 575-582)

```javascript
const triggerUnderwriterComparison = useCallback(async () => {
  if (underwriterSelectedRef.current) {
    console.log(
      "⏭️  Skipping comparison - underwriter already selected by user"
    );
    return; // ← Triple safety net
  }
  // ... rest of function
});
```

**Impact**: Even if comparison function is called, it will exit early

### 4. Fallback Cache in FlatList (Line 1326-1347)

```javascript
// ✅ CRITICAL: Use lastComparisonsRef as primary fallback
const source =
  (underwriterComparisons.length > 0
    ? underwriterComparisons
    : lastComparisonsRef.current) || [];

// ✅ If we have a selected underwriter, show it even if comparisons are empty
if (displayComparisons.length === 0 && selectedUnderwriter) {
  return [selectedUnderwriter];
}
```

**Impact**: Even if state is cleared, cached comparisons are shown; selected card stays visible

### 5. Improved onPress Handler (Line 1413+)

```javascript
onPress={() => {
  // ✅ Set flag IMMEDIATELY
  underwriterSelectedRef.current = true;

  // Cancel any pending timeout
  if (comparisonTimeoutRef.current) {
    clearTimeout(comparisonTimeoutRef.current);
    comparisonTimeoutRef.current = null;
  }

  // Perform selection...
}}
```

**Impact**: Selection flag is set before any async operations

## Expected Result

✅ User taps underwriter card
✅ Card is immediately highlighted with checkmark (✓)
✅ List of cards remains visible
✅ User can see their selection
✅ User can change selection by tapping another card
✅ Selected underwriter is saved to context
✅ No cards disappear from UI

## Debug Logs

You should see these logs in the console:

```
[DynamicVehicleForm] 🎯 Underwriter card TAPPED: Madison Insurance
[DynamicVehicleForm] 🎯 Cleared pending comparison timeout
[DynamicVehicleForm] 🎯 Performing selection (inside RAF)
[DynamicVehicleForm] ✅ Calling onUnderwriterSelection callback
[DynamicVehicleForm] ✅ onUnderwriterSelection callback completed
[DynamicVehicleForm] 📌 No comparisons but selected underwriter exists - showing selection only
```

## Files Changed

- `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`
  - Lines 703-710: Early exit check
  - Lines 733-738: Double-check in timeout
  - Lines 575-582: Function-level check
  - Lines 1326-1347: Fallback cache logic
  - Line 1413+: onPress improvements

## Testing

- [ ] Select Madison Insurance → checkmark appears, cards stay visible
- [ ] Select PATABIMA INC → Madison loses checkmark, PATABIMA gets checkmark
- [ ] Cards remain visible the entire time
- [ ] Proceed to next step → underwriter in context is correct
- [ ] Console shows proper logs (no errors)
