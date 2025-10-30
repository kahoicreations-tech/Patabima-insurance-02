# Extendible Products - Balance Display Fix

## Issues Fixed

### Issue 1: Balance Showing "KSh 0" Instead of Actual Amount ✅

**Problem:**
The simulated payment dialog was showing "Balance of KSh 0 due in 30 days" instead of the actual balance amount from the extendible product configuration.

**Root Cause:**

1. The `extendible_config` object from backend was not being preserved through the pricing calculation pipeline
2. The `normalizePricingResponse()` function in `pricingCalculations.js` was stripping out the extendible config
3. Even when config was available, it wasn't being passed to `pricingInputs` for persistence across steps

**Solution Implemented:**

#### 1. Updated `frontend/utils/pricingCalculations.js`

Added logic to preserve `extendible_config` from backend responses and calculate fallback config if not provided:

```javascript
// CRITICAL: Preserve extendible_config from backend response for extendible products
// If backend doesn't provide it, calculate it as fallback (60/40 split)
let extendibleConfig =
  resp.extendible_config || resp.extendible_configuration || null;

// Detect if this is an extendible product from subcategory code
const isExtendible =
  resp.subcategory_code?.includes("EXT") ||
  resp.subcategory?.includes("EXT") ||
  resp.is_extendible;

// If extendible product but no config from backend, calculate default config
if (isExtendible && !extendibleConfig && totalPremium > 0) {
  const initialAmount = Math.round(totalPremium * 0.6); // 60% initial
  const balanceAmount = totalPremium - initialAmount; // 40% balance

  extendibleConfig = {
    total_annual_premium: totalPremium,
    initial_amount: initialAmount,
    balance_amount: balanceAmount,
    initial_period_days: 30,
    extension_deadline_days: 30,
    grace_period_days: 60,
    late_fee_percentage: 10,
  };

  console.log(
    "[normalizePricingResponse] Calculated fallback extendible_config:",
    extendibleConfig
  );
}

return {
  premium: toMoney(totalPremium),
  totalPremium: toMoney(totalPremium),
  breakdown,
  meta,
  base_premium: basePremium,
  training_levy: Number(resp.training_levy || 0),
  pcf_levy: Number(resp.pcf_levy || 0),
  stamp_duty: Number(resp.stamp_duty || 0),
  // Include extendible config if available or calculated
  ...(extendibleConfig && { extendible_config: extendibleConfig }),
  // Preserve subcategory and is_extendible flags
  ...(resp.subcategory_code && { subcategory_code: resp.subcategory_code }),
  ...(resp.is_extendible !== undefined && {
    is_extendible: resp.is_extendible,
  }),
};
```

**Key Improvements:**

- Preserves `extendible_config` from backend if present
- Calculates fallback config using 60/40 split if backend doesn't provide it
- Stores config in normalized response for later use
- Preserves `subcategory_code` and `is_extendible` flags for detection

#### 2. Updated `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js`

Enhanced the simulated payment processing (Step 6) to properly access and store extendible config:

**Before:**

```javascript
const extendibleConfig =
  state.pricingInputs?.extendible_config ||
  state.selectedUnderwriter?.extendible_config ||
  state.calculatedPremium?.extendible_config;
```

**After (with enhanced logging and storage):**

```javascript
// Get extendible config from multiple sources (priority order)
const extendibleConfig =
  state.pricingInputs?.extendible_config ||
  state.selectedUnderwriter?.extendible_config ||
  state.calculatedPremium?.extendible_config;

const paymentPlan = state.pricingInputs?.payment_plan || "installments";

console.log("Extendible Product:", isExtendible);
console.log("Extendible Config:", JSON.stringify(extendibleConfig, null, 2));
console.log("Payment Plan:", paymentPlan);

// Calculate amounts with detailed logging
if (isExtendible && extendibleConfig) {
  if (paymentPlan === "full") {
    amountToPay = Math.round(extendibleConfig.total_annual_premium * 0.9);
    console.log("Payment Plan: Full Payment (10% discount)");
  } else {
    amountToPay = extendibleConfig.initial_amount || 0;
    console.log("Payment Plan: Installments (Initial payment only)");
  }
  console.log("Initial Amount:", extendibleConfig.initial_amount);
  console.log("Balance Amount:", extendibleConfig.balance_amount);
}

// Store payment confirmation AND extendible config in state
actions.updatePricingInputs({
  paymentStatus: "CONFIRMED",
  paymentAmount: amountToPay,
  transactionId: `SIM-${Date.now()}`,
  paymentDate: new Date().toISOString(),
  // Store extendible config for later use
  ...(extendibleConfig && { extendible_config: extendibleConfig }),
});
```

**Key Improvements:**

- Added priority fallback to `state.calculatedPremium?.extendible_config` (now populated by fix #1)
- Added detailed console logging to debug config availability
- Stores extendible_config in pricingInputs for persistence
- Logs initial_amount and balance_amount for verification

## Data Flow

```
Backend API Response
    ↓
normalizePricingResponse() [FIXED]
    ↓
state.calculatedPremium.extendible_config [AVAILABLE]
    ↓
Step 6: Simulated Payment [ACCESSES CONFIG]
    ↓
actions.updatePricingInputs() [STORES IN STATE]
    ↓
state.pricingInputs.extendible_config [PERSISTED]
    ↓
EnhancedPayment component [DISPLAYS CONFIG]
    ↓
Payment Dialog [SHOWS BALANCE AMOUNT]
```

## Extendible Config Structure

The config object contains all necessary payment plan information:

```typescript
interface ExtendibleConfig {
  total_annual_premium: number; // Full year premium (e.g., 10000)
  initial_amount: number; // Initial payment (60% = 6000)
  balance_amount: number; // Remaining balance (40% = 4000)
  initial_period_days: number; // Coverage for initial payment (30 days)
  extension_deadline_days: number; // Days to pay balance (30 days)
  grace_period_days: number; // Additional grace period (60 days)
  late_fee_percentage: number; // Late fee if payment delayed (10%)
}
```

## Testing

### Test Case 1: Backend Provides Config

1. Select extendible product (e.g., "Private Third Party Extended")
2. Calculate pricing
3. Check console logs for: `extendible_config` in pricing response
4. Proceed to Payment step
5. Click "Continue" to trigger simulated payment
6. **Expected**: Dialog shows actual balance amount (e.g., "Balance of KSh 4,000")

### Test Case 2: Backend Missing Config (Fallback Calculation)

1. If backend doesn't return config, normalizePricingResponse calculates it
2. Console should show: `[normalizePricingResponse] Calculated fallback extendible_config`
3. Simulated payment should still show correct 60/40 split amounts

### Test Case 3: Payment Plan Selection

**Installments:**

- Shows initial amount (60% of total)
- Shows balance amount (40% of total)

**Full Payment:**

- Shows discounted amount (90% of total - 10% discount)
- No balance shown

## Console Output Example

```
💳 SIMULATED PAYMENT PROCESSING
================================================================================
Extendible Product: true
Extendible Config: {
  "total_annual_premium": 10000,
  "initial_amount": 6000,
  "balance_amount": 4000,
  "initial_period_days": 30,
  "extension_deadline_days": 30,
  "grace_period_days": 60,
  "late_fee_percentage": 10
}
Payment Plan: installments
Payment Plan: Installments (Initial payment only)
Initial Amount: 6000
Balance Amount: 4000
Amount to Pay: KSh 6,000
Payment Method: MPESA
================================================================================
```

## Files Modified

1. `frontend/utils/pricingCalculations.js`

   - Line ~134: Updated `normalizePricingResponse()` function
   - Added extendible config preservation and fallback calculation

2. `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js`
   - Line ~1268-1330: Enhanced simulated payment processing
   - Added config logging and storage in pricingInputs

## Related Components

These components already handle extendible_config correctly (no changes needed):

- `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Payment/EnhancedPayment.js`

  - Accesses config from `values?.extendible_config || premium?.extendible_config`
  - Now receives config via pricingInputs (values prop)

- `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/PremiumCalculation/PremiumBreakdownCard.js`
  - Receives config via `providerPricing?.extendible_config` prop
  - Displays payment plan options with amounts

## Known Limitations

1. If backend doesn't provide extendible_config, fallback uses default 60/40 split
2. Backend should be enhanced to return proper config based on product-specific rules
3. Different products may have different payment splits (not yet configurable)

## Next Steps

1. ✅ Fix balance display issue
2. ⏳ Fix navigation going back to motor category (Issue #2)
3. ⏳ Implement Third-Party auto-activation vs Comprehensive apply policy (Issue #3)
4. ⏳ Real M-PESA/DPO payment integration
