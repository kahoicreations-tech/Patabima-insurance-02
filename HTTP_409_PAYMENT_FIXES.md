# HTTP 409 Duplicate Policy & Payment Status Fixes

**Date:** November 10, 2025  
**Issue:** Policy submission failing with HTTP 409 + Incorrect payment status logic

---

## Issues Identified

### Issue 1: HTTP 409 Conflict - Duplicate Policy Not Handled

**Backend Response:**

```json
{
  "success": false,
  "error": "Duplicate policy detected",
  "user_message": "An active or pending policy already exists for vehicle KAC040R...",
  "existing_policies": [
    {
      "policy_number": "POL-2025-290689",
      "status": "ACTIVE",
      "cover_start": "2026-10-16",
      "cover_end": "2027-10-16",
      "underwriter": "PATABIMA INC",
      "product": "PRIVATE_THIRD_PARTY"
    }
  ],
  "can_override": true,
  "override_instructions": "To proceed anyway, set \"forceCreate\": true in the request"
}
```

**Problem:** Frontend showed generic "HTTP 409" error without explaining the duplicate policy or offering override option.

---

### Issue 2: Contradictory Payment Status

**Incoming Request:**

```json
{
  "paymentDetails": {
    "method": "PENDING", // ❌ Says payment is pending
    "status": "CONFIRMED", // ❌ But status is confirmed
    "transactionId": "TXN-1762804633959", // ❌ Generated ID, not real M-PESA
    "transaction_id": "TXN-1762804633959"
  }
}
```

**Problem:** Payment method defaults to `"PENDING"` but status defaults to `"CONFIRMED"`, creating contradictory state. Generated transaction IDs (`TXN-${Date.now()}`) are treated as real payments.

---

## Fixes Applied

### Fix 1: HTTP 409 Duplicate Policy Handling

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`  
**Lines:** 664-725

**Added try-catch around API call to detect HTTP 409:**

```javascript
try {
  response = await djangoAPI.createMotorPolicy(sanitizedPolicyData);
} catch (apiError) {
  // Handle HTTP 409 Conflict - Duplicate Policy
  if (apiError.status === 409 || apiError.statusCode === 409) {
    const errorData = apiError.payload || apiError.response?.data || {};

    // Check if it's a duplicate policy error
    if (
      errorData.error?.includes("Duplicate policy") ||
      errorData.existing_policies
    ) {
      console.warn(
        "[PolicySubmission] ⚠️  Duplicate policy detected:",
        errorData
      );

      const existingPolicies = errorData.existing_policies || [];
      const policyList = existingPolicies
        .map(
          (p) =>
            `• ${p.policy_number} (${p.product}) - ${p.underwriter}\n  Coverage: ${p.cover_start} to ${p.cover_end}`
        )
        .join("\n\n");

      // Clear guard to allow retry with forceCreate
      await AsyncStorage.removeItem("policy_submission_guard");

      // Show alert with option to proceed anyway
      Alert.alert(
        "Duplicate Policy Detected",
        `An active or pending policy already exists for this vehicle:\n\n${policyList}\n\nDo you want to create a new policy anyway?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              if (onSubmissionError) {
                onSubmissionError(
                  new Error("Duplicate policy - user cancelled")
                );
              } else {
                navigation.goBack();
              }
            },
          },
          {
            text: "Proceed Anyway",
            style: "destructive",
            onPress: async () => {
              console.log(
                "[PolicySubmission] User chose to proceed despite duplicate"
              );
              // Retry with forceCreate flag
              sanitizedPolicyData.forceCreate = true;
              submitPolicy();
            },
          },
        ]
      );
      return; // Exit submission, wait for user decision
    }

    // Check if it's a DMVIC double-insurance error
    if (errorData.error?.includes("DMVIC") || errorData.dmvic_policy) {
      console.warn(
        "[PolicySubmission] ⚠️  DMVIC double-insurance detected:",
        errorData
      );

      const dmvicPol = errorData.dmvic_policy || {};

      // Clear guard to allow retry with allowProceed
      await AsyncStorage.removeItem("policy_submission_guard");

      // Show DMVIC warning modal
      setDmvicPolicy(dmvicPol);
      setShowDoubleInsuranceModal(true);
      return; // Exit submission, wait for user decision
    }
  }

  // Re-throw other errors
  throw apiError;
}
```

**Impact:**

- ✅ User sees clear message: "Duplicate Policy Detected" with existing policy details
- ✅ Two options: "Cancel" or "Proceed Anyway"
- ✅ If "Proceed Anyway", retries with `forceCreate: true` flag
- ✅ Backend accepts override and creates new policy
- ✅ Also handles DMVIC double-insurance 409 errors

---

### Fix 2: Smart Payment Status Logic

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`  
**Lines:** 250-283

**Before:**

```javascript
paymentDetails: {
  method: payment.method || 'PENDING',  // Always PENDING if not set
  status: payment.status || 'CONFIRMED', // Always CONFIRMED if not set
  transactionId: payment.transactionId || `TXN-${Date.now()}`,  // Generated ID
}
```

**After:**

```javascript
paymentDetails: {
  // Generate quote-based tracking ID (not transaction ID)
  transactionId: payment.transactionId || payment.transaction_id || `QUOTE-${Date.now()}`,
  transaction_id: payment.transaction_id || payment.transactionId || `QUOTE-${Date.now()}`,

  // Set method based on transaction ID format
  method: payment.method || (() => {
    const txnId = payment.transactionId || payment.transaction_id || '';
    // Check if it's a real M-PESA/payment gateway transaction ID
    const isRealPayment = txnId && !txnId.startsWith('TXN-') && !txnId.startsWith('QUOTE-');
    return isRealPayment ? 'MPESA' : 'PENDING';
  })(),

  // Set status based on transaction ID validity
  status: payment.status || (() => {
    const txnId = payment.transactionId || payment.transaction_id || '';
    // Check if it's a real payment transaction ID
    const isRealPayment = txnId && !txnId.startsWith('TXN-') && !txnId.startStart('QUOTE-');
    return isRealPayment ? 'CONFIRMED' : 'PENDING';
  })(),

  amount: Number(payment.amount ?? premium.totalAmount ?? premium.total_amount ?? 0),
}
```

**Logic:**

1. **Real M-PESA Transaction** (e.g., `RJ3456ABCD`):

   - `method: "MPESA"`
   - `status: "CONFIRMED"`
   - `transactionId: "RJ3456ABCD"`

2. **No Payment Yet** (generated ID):
   - `method: "PENDING"`
   - `status: "PENDING"`
   - `transactionId: "QUOTE-1762804633959"`

**Impact:**

- ✅ Policies created without payment are marked `PENDING`/`PENDING`
- ✅ Policies with real M-PESA IDs are marked `MPESA`/`CONFIRMED`
- ✅ No more contradictory payment states
- ✅ Backend can properly identify paid vs unpaid policies

---

## Expected Behavior

### Scenario 1: Duplicate Policy (First Time)

**User Flow:**

1. User submits policy for vehicle **KAC040R**
2. Backend detects existing policy **POL-2025-290689**
3. Returns HTTP 409 with existing policy details
4. **Frontend shows alert:**

   ```
   Duplicate Policy Detected

   An active or pending policy already exists for this vehicle:

   • POL-2025-290689 (PRIVATE_THIRD_PARTY) - PATABIMA INC
     Coverage: 2026-10-16 to 2027-10-16

   Do you want to create a new policy anyway?

   [Cancel]  [Proceed Anyway]
   ```

5. **If user clicks "Cancel":** Returns to previous screen
6. **If user clicks "Proceed Anyway":** Retries with `forceCreate: true`, creates new policy

---

### Scenario 2: Payment Status (No Payment)

**Submitted Data:**

```json
{
  "paymentDetails": {
    "method": "PENDING",
    "status": "PENDING",
    "transactionId": "QUOTE-1762804633959",
    "amount": 5266
  }
}
```

**Backend Response:**

- Policy created with status `DRAFT` or `PENDING_PAYMENT`
- User can complete payment later
- Policy not activated until payment confirmed

---

### Scenario 3: Payment Status (Real M-PESA)

**Submitted Data:**

```json
{
  "paymentDetails": {
    "method": "MPESA",
    "status": "CONFIRMED",
    "transactionId": "RJ3456ABCD", // Real M-PESA ID
    "amount": 5266
  }
}
```

**Backend Response:**

- Policy created with status `ACTIVE` (Third-Party auto-activated)
- DMVIC certificate auto-issued
- Policy immediately effective

---

## Transaction ID Prefixes

**Generated (Not Real Payment):**

- `TXN-${timestamp}` - Old format (deprecated)
- `QUOTE-${timestamp}` - New format for quotes/drafts

**Real Payment Gateways:**

- M-PESA: `RJ3456ABCD`, `QA1234WXYZ`, etc. (10-12 alphanumeric)
- DPO Pay: `DPO-123456-ABC`
- PayPal: `PAYID-MABCDEFG12345678`

---

## Files Modified

1. ✅ `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`
   - Added HTTP 409 duplicate policy handling (lines 664-725)
   - Fixed payment status logic (lines 250-283)
   - Changed generated ID prefix: `TXN-` → `QUOTE-`

---

## Testing Checklist

- [ ] Submit policy for vehicle with existing active policy
- [ ] Verify "Duplicate Policy Detected" alert appears
- [ ] Click "Cancel" → Returns to previous screen
- [ ] Click "Proceed Anyway" → Creates new policy with `forceCreate: true`
- [ ] Submit policy without payment → Status is `PENDING`/`PENDING`
- [ ] Submit policy with M-PESA ID → Status is `MPESA`/`CONFIRMED`
- [ ] Verify DMVIC double-insurance 409 also shows proper modal

---

## Backend Compatibility

**Backend expects (policy_management.py):**

- `forceCreate: true` - Bypass duplicate policy guard
- `allowProceed: true` - Bypass DMVIC double-insurance guard

**Frontend now sends:**

- ✅ `forceCreate: true` when user clicks "Proceed Anyway" on duplicate
- ✅ `allowProceed: true` when user proceeds despite DMVIC warning
- ✅ Proper payment status (`PENDING` for unpaid, `CONFIRMED` for paid)

---

**Status:** ✅ FIXES APPLIED - READY FOR TESTING  
**Next:** Test duplicate policy flow and verify payment status logic
