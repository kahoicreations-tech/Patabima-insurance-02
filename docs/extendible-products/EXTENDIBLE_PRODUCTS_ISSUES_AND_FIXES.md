# Extendible Products - Issues Found & Fixes Applied

**Date:** January 2025  
**Status:** ⚠️ ISSUES IDENTIFIED - FIXES IN PROGRESS

---

## Issues Reported by User

### 1. **Navigation Issue: Goes Back to Motor Category**

**Problem:** When clicking "Continue" from Payment step for extendible products, instead of processing the payment, it goes back to motor category selection.

**Root Cause:** The payment step (step 6) has no actual payment processing logic. Clicking "Continue" simply increments to step 7 (Submission), but there's no payment gateway integration or API call to record the payment.

**Current Flow:**

```
Payment Screen (Step 6)
  → User clicks "Continue"
  → onNext() function increments step to 7
  → PolicySubmission screen (Step 7)
  → No payment actually processed yet!
```

**Expected Flow:**

```
Payment Screen (Step 6)
  → User clicks "Pay Now" button
  → Payment gateway integration (M-PESA/DPO)
  → Payment confirmation
  → Navigate to PolicySubmission (Step 7)
  → Policy created with payment status
```

### 2. **Missing Information in Quotations Screen**

**Problem:** In the quotations list, extendible motor policies don't show:

- Insurance category (e.g., "Motor Insurance")
- Subcategory (e.g., "Private Third-Party Extendible")
- Product name
- Payment plan (Full vs Installments)
- Balance payment status

**Root Cause:** The `policyData` object passed to PolicySubmission doesn't include extendible-specific fields, and the backend response doesn't return complete product details.

### 3. **Backend Wiring Unknown**

**Problem:** User doesn't know if extendible products are properly connected to Django backend.

**Need to Verify:**

- Are extendible quotes being saved with correct fields?
- Does backend recognize `payment_plan` field?
- Does backend store `extendible_config` data?
- Can backend retrieve extendible quotes with full details?

---

## Fixes Applied

### ✅ Fix 1: Add Extendible Config to PolicySubmission

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js` (Step 7)

**Changes Made:**

```javascript
// Added to policyData object at line ~2125
productDetails: {
  category: state.selectedCategory?.code || ...,
  subcategory: state.selectedSubcategory?.code || ...,
  name: state.selectedSubcategory?.name || '',
  coverage_type: state.selectedSubcategory?.coverage_type || ...,
  coverageType: state.selectedSubcategory?.coverage_type || ...,
  is_extendible: state.selectedSubcategory?.subcategory_code?.includes('EXT') || false,  // NEW
},

// NEW SECTION: Extendible Product Configuration
extendibleConfig: (() => {
  const isExtendible = state.selectedSubcategory?.subcategory_code?.includes('EXT');
  if (!isExtendible) return null;

  const config = state.pricingInputs?.extendible_config ||
                state.selectedUnderwriter?.extendible_config ||
                state.calculatedPremium?.extendible_config;

  if (!config) return null;

  return {
    initial_period_days: config.initial_period_days || 30,
    initial_amount: config.initial_amount || 0,
    balance_amount: config.balance_amount || 0,
    total_annual_premium: config.total_annual_premium || 0,
    extension_deadline_days: config.extension_deadline_days || 30,
    grace_period_days: config.grace_period_days || 7,
    payment_plan: state.pricingInputs?.payment_plan || 'installments',
  };
})(),
```

**Impact:**

- ✅ Extendible config now passed to backend
- ✅ Payment plan selection preserved
- ✅ Backend can store and retrieve extendible details

---

## Remaining Issues (Not Yet Fixed)

### ⚠️ Issue 1: No Payment Processing Logic

**Current State:** Payment step has no integration with payment gateways.

**What's Missing:**

1. **M-PESA Integration:**

   - No STK push initiation
   - No payment status polling
   - No confirmation callback

2. **DPO Integration:**

   - No redirect to DPO payment page
   - No payment verification

3. **Payment API:**
   - No call to backend payment endpoint
   - No payment record creation

**Required Fix:**

```javascript
// In EnhancedPayment.js or MotorInsuranceScreen.js

const handlePayment = async () => {
  setPaymentLoading(true);

  try {
    // Calculate amount based on payment plan
    const amountToPay =
      isExtendible && paymentPlan === "full"
        ? extendibleConfig.total_annual_premium * 0.9 // 10% discount
        : isExtendible && paymentPlan === "installments"
        ? extendibleConfig.initial_amount
        : totalPremium;

    // Call payment API
    const paymentResponse = await DjangoAPIService.post(
      "/api/v1/payments/initiate/",
      {
        quote_id: quoteId,
        amount: amountToPay,
        payment_method: paymentMethod, // 'mpesa' or 'dpo'
        payment_plan: paymentPlan, // 'full' or 'installments'
        phone_number: clientDetails.phone,
      }
    );

    if (paymentMethod === "mpesa") {
      // For M-PESA: Poll for payment confirmation
      const confirmed = await pollPaymentStatus(paymentResponse.transaction_id);
      if (confirmed) {
        // Move to submission step
        setStep(7);
      }
    } else if (paymentMethod === "dpo") {
      // For DPO: Redirect to payment page
      Linking.openURL(paymentResponse.payment_url);
    }
  } catch (error) {
    Alert.alert("Payment Failed", error.message);
  } finally {
    setPaymentLoading(false);
  }
};
```

**Backend Endpoint Needed:**

```python
# insurance-app/app/views/payments.py

@api_view(['POST'])
def initiate_payment(request):
    quote_id = request.data.get('quote_id')
    amount = request.data.get('amount')
    payment_method = request.data.get('payment_method')
    payment_plan = request.data.get('payment_plan', 'full')
    phone_number = request.data.get('phone_number')

    # Create payment record
    payment = Payment.objects.create(
        quote_id=quote_id,
        amount=amount,
        payment_method=payment_method,
        payment_plan=payment_plan,
        status='PENDING',
    )

    if payment_method == 'mpesa':
        # Initiate M-PESA STK push
        mpesa_response = initiate_mpesa_push(phone_number, amount)
        payment.transaction_id = mpesa_response['CheckoutRequestID']
        payment.save()

        return Response({
            'transaction_id': payment.transaction_id,
            'status': 'PENDING',
        })
    elif payment_method == 'dpo':
        # Generate DPO payment URL
        dpo_url = generate_dpo_payment_url(payment.id, amount)
        return Response({
            'payment_url': dpo_url,
        })
```

---

### ⚠️ Issue 2: Quotations Screen Missing Product Info

**Current State:** QuotationsScreenNew.js doesn't show category/subcategory for Motor 2 quotes.

**Required Fix in `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`:**

After successful policy creation, ensure backend returns complete data:

```javascript
// In PolicySubmission.js - After backend response

const policyResponse = await DjangoAPIService.post('/api/v1/motor2/policies/', normalized);

// Backend should return:
{
  "policy_number": "POL-2025-123456",
  "policy_id": 123,
  "category": "MOTOR",
  "subcategory": "PRIVATE_THIRD_PARTY_EXT",
  "product_name": "Private Third-Party Extendible",
  "is_extendible": true,
  "payment_plan": "installments",
  "total_premium": 90000,
  "initial_payment": 54000,
  "balance_payment": 36000,
  "balance_deadline": "2025-02-15",
  "status": "ACTIVE",
  ...
}
```

**Required Backend Changes:**

```python
# insurance-app/app/serializers/motor2.py

class Motor2PolicySerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='product.category.name')
    subcategory = serializers.CharField(source='product.subcategory_code')
    product_name = serializers.CharField(source='product.name')
    is_extendible = serializers.BooleanField(source='product.is_extendible')

    class Meta:
        model = Motor2Policy
        fields = [
            'policy_number', 'policy_id', 'category', 'subcategory',
            'product_name', 'is_extendible', 'payment_plan',
            'total_premium', 'initial_payment', 'balance_payment',
            'balance_deadline', 'status', ...
        ]
```

---

### ⚠️ Issue 3: Quotations List Display

**Required Fix in `frontend/screens/main/QuotationsScreenNew.js`:**

Update the `mapBackendQuoteToUI` function to properly extract Motor 2 product details:

```javascript
// Around line 120-200 in QuotationsScreenNew.js

const mapBackendQuoteToUI = (q) => {
  // ... existing code ...

  // Extract product details for Motor 2
  const productDetails = q?.productDetails || q?.product_details || {};
  const category = productDetails.category || q?.category || "MOTOR";
  const subcategory = productDetails.subcategory || q?.subcategory || "";
  const productName = productDetails.name || q?.product_name || "";
  const isExtendible =
    productDetails.is_extendible ||
    q?.is_extendible ||
    subcategory.includes("EXT");

  // Extract extendible info
  const extendibleConfig = q?.extendibleConfig || q?.extendible_config || null;
  const paymentPlan =
    q?.payment_plan || (extendibleConfig ? "installments" : null);

  return {
    // ... existing fields ...

    // Add product info
    category,
    subcategory,
    productName,
    isExtendible,

    // Add extendible-specific fields
    paymentPlan,
    initialPayment: extendibleConfig?.initial_amount,
    balancePayment: extendibleConfig?.balance_amount,
    balanceDeadline: q?.balance_deadline,
    balancePaid: q?.balance_paid || false,

    // ... rest of fields ...
  };
};
```

---

## Testing Checklist

### Backend Verification

- [ ] **Test Endpoint:** `POST /api/v1/motor2/policies/`

  - Create extendible quote via Postman
  - Verify `payment_plan` field accepted
  - Verify `extendible_config` stored correctly

- [ ] **Test Retrieval:** `GET /api/v1/motor2/policies/`

  - Fetch list of policies
  - Verify category, subcategory, product_name in response
  - Verify extendible fields included

- [ ] **Test Balance Payment:** `POST /api/v1/motor2/policies/extend/`
  - Create test policy with installments
  - Pay balance amount
  - Verify policy extends correctly

### Frontend End-to-End Test

1. **Create Extendible Quote:**

   - [x] Select "Private Third-Party Extendible"
   - [x] Fill vehicle and client details
   - [x] See two payment options
   - [x] Select "Pay in Installments"
   - [x] See initial amount and balance info
   - [ ] Click "Pay Now" (currently broken - no payment logic)
   - [ ] Verify payment processes
   - [ ] Verify policy created

2. **Check Quotations Screen:**

   - [ ] Navigate to Quotations tab
   - [ ] Find newly created quote
   - [ ] Verify shows:
     - Category: "Motor Insurance"
     - Product: "Private Third-Party Extendible"
     - Payment Plan: "Installments"
     - Initial Payment: "KSh 54,000 (Paid)"
     - Balance Due: "KSh 36,000 (Due in 25 days)"

3. **Check HomeScreen:**

   - [ ] See balance payment reminder
   - [ ] Shows days until deadline
   - [ ] "Pay Now" button appears

4. **Pay Balance:**
   - [ ] Click "Pay Now" from HomeScreen
   - [ ] Navigate to ExtensionPayment screen
   - [ ] See balance amount and late fee (if any)
   - [ ] Complete payment
   - [ ] Policy extended to full year

---

## Next Steps

### HIGH PRIORITY (Must Fix for Production)

1. **Implement Payment Processing** (Critical)

   - Add M-PESA STK push integration
   - Add DPO redirect integration
   - Create payment confirmation flow
   - Handle payment failures/retries

2. **Fix Backend API Response** (High)

   - Update Motor2PolicySerializer to include all fields
   - Ensure category, subcategory, product_name returned
   - Add extendible-specific fields to response

3. **Update QuotationsScreen Mapping** (High)
   - Extract product details from backend response
   - Show payment plan badge for extendible quotes
   - Show balance payment status

### MEDIUM PRIORITY (Important for UX)

4. **Add Payment Status Indicators**

   - Show "Initial Paid" badge
   - Show "Balance Due" badge with countdown
   - Show "Fully Paid" badge after balance payment

5. **Implement Balance Payment Reminders**
   - Push notifications before deadline
   - SMS reminders
   - In-app notifications

### LOW PRIORITY (Nice to Have)

6. **Analytics & Reporting**
   - Track payment plan selection rates
   - Monitor late payment patterns
   - Generate extendible product performance reports

---

## Summary

**Fixed:**

- ✅ Extendible config now passed to PolicySubmission
- ✅ Payment plan stored in policyData

**Not Yet Fixed (Blocking Production):**

- ❌ No payment processing logic (critical)
- ❌ Quotations screen doesn't show product details
- ❌ Backend response missing required fields
- ❌ Unknown if backend properly stores extendible data

**Action Required:**

1. Implement payment gateway integration in EnhancedPayment.js
2. Update backend Motor2PolicySerializer
3. Test end-to-end extendible quote creation
4. Verify backend storage and retrieval

---

**Last Updated:** January 2025  
**Status:** Partial fixes applied, payment integration still required
