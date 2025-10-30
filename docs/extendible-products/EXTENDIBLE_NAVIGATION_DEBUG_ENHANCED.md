# Extendible Products - Navigation Issue Debug Enhancement

## Changes Made (Timestamp: 2025-01-24)

### Problem Summary

User reported that when clicking "Next" on the Payment screen (Step 6), the app navigates back to the category selection screen instead of showing the payment simulation dialog or proceeding to the PolicySuccess screen.

### Root Cause Analysis

**Step Numbering:**

- **UI Display**: Shows "7 Payment" (1-indexed for user display)
- **Internal State**: Step 6 (0-indexed in code)
- **Steps Array**: `['Category', 'Subcategory', 'Vehicle Details', 'Vehicle Verification', 'Documents', 'Client Details', 'Payment', 'Submission']`

**Payment Flow:**

1. Step 6 (Payment): User clicks "Next"
2. `onNext()` handler checks `if (step === 6)`
3. Should show `Alert.alert` payment simulation dialog
4. User clicks "Simulate Success"
5. `setStep(7)` advances to Submission step
6. PolicySubmission component auto-submits
7. On success, calls `onSubmissionComplete(result)`
8. Should navigate to `PolicySuccess` screen
9. **BUT**: User sees category screen instead

**Possible Causes:**

1. Alert dialog not showing (unlikely - terminal logs confirm it runs)
2. PolicySubmission succeeds but navigation fails
3. Error in navigation causes fallback to category screen
4. Storage purge or context reset triggers unexpected navigation

### Enhancements Applied

#### 1. Enhanced Logging in MotorInsuranceScreen.js

**Location**: Lines 1267-1350 (onNext handler - Step 6 payment simulation)

**Added Comprehensive Console Logs:**

```javascript
console.log("💳 SIMULATED PAYMENT PROCESSING - onNext called at Step 6");
console.log("🚨 SHOWING ALERT DIALOG - User must confirm payment simulation");
console.log("⏸️  onNext handler paused - waiting for Alert dialog response");

// In "Simulate Success" callback:
console.log("✅ Payment simulation: SUCCESS");
console.log("Updating state with payment confirmation...");
console.log("Advancing to Step 7 (Submission)...");

// In "Cancel" callback:
console.log("❌ User cancelled payment simulation");
console.log("Staying at Step 6 (Payment)");
```

**Purpose:**

- Track when onNext is called at Step 6
- Confirm Alert dialog is displayed
- Show which button user clicked (Success vs Cancel)
- Log state transitions clearly

#### 2. Enhanced Error Handling in onSubmissionComplete

**Location**: Lines 2330-2365 (PolicySubmission component callback)

**Added Try-Catch with Fallback:**

```javascript
onSubmissionComplete={(result) => {
  console.log('🎉 PolicySubmission SUCCESS - Navigating to PolicySuccess screen');
  console.log('Result:', JSON.stringify(result, null, 2));

  try {
    navigation.navigate('PolicySuccess', {
      policyNumber: result.policyNumber,
      policyId: result.policyId,
      pdfUrl: result.pdfUrl,
      amount: state.calculatedPremium?.total_amount,
    });
    console.log('✅ Navigation to PolicySuccess completed');
  } catch (navError) {
    console.error('❌ Navigation to PolicySuccess FAILED:', navError);

    // Fallback: Show Alert with manual navigation options
    Alert.alert(
      'Policy Created Successfully',
      `Policy Number: ${result.policyNumber}\n\nNavigation error occurred. Please check your policies in the Quotations tab.`,
      [
        {
          text: 'Go to Quotations',
          onPress: () => navigation.navigate('MainTabs', { screen: 'Quotations' })
        },
        {
          text: 'Go Home',
          onPress: () => navigation.navigate('MainTabs', { screen: 'Home' })
        }
      ]
    );
  }
}}
```

**Purpose:**

- Catch navigation errors that might be silent
- Provide fallback navigation if PolicySuccess fails
- Inform user that policy was created successfully even if navigation fails
- Give user manual options to navigate to correct screen

#### 3. Enhanced Logging in PolicySubmission.js

**Location**: Lines 195-230 (onSubmissionComplete callback and purge)

**Added Detailed Console Logs:**

```javascript
console.log("✅ Policy created successfully!");
console.log("Policy Number:", result.policyNumber);
console.log("Policy ID:", result.policyId);

console.log("[PolicySubmission] Calling onSubmissionComplete callback");
onSubmissionComplete(result);
console.log("[PolicySubmission] onSubmissionComplete callback returned");

console.log("[PolicySubmission] Running post-success storage purge...");
await StoragePurge.purgeAfterPolicySubmission({ vehicleRegistration: reg });
console.log("[PolicySubmission] Storage purge completed successfully");

console.log("[PolicySubmission] All post-submission tasks completed");
```

**Purpose:**

- Track when policy is created successfully
- Log when callback is called and when it returns
- Monitor storage purge execution
- Identify if error occurs between callback call and return

#### 4. Added onSubmissionError Handler

**Location**: Lines 2360-2364 (PolicySubmission error callback)

**Added:**

```javascript
onSubmissionError={(error) => {
  console.error('❌ PolicySubmission FAILED:', error);
  // Error is handled inside PolicySubmission component
  // Just log here for debugging
}}
```

**Purpose:**

- Catch and log submission errors
- Provide visibility into failure scenarios

### Testing Instructions

1. **Start Fresh Flow:**

   - Navigate to Motor 2 insurance
   - Select "Private" category
   - Select "Private Third Party Extended" subcategory
   - Fill in vehicle details
   - Upload documents
   - Fill in client details
   - Proceed to payment step

2. **At Payment Step (Step 6 - UI shows "7 Payment"):**

   - **Before clicking "Next"**: Note the step number
   - Click "Next" button
   - **Check terminal logs** for:
     ```
     💳 SIMULATED PAYMENT PROCESSING - onNext called at Step 6
     🚨 SHOWING ALERT DIALOG - User must confirm payment simulation
     ⏸️  onNext handler paused - waiting for Alert dialog response
     ```

3. **Alert Dialog Should Appear:**

   - Check if dialog appears with "Simulated Payment" title
   - Should show amount and payment method
   - Two buttons: "Cancel" and "Simulate Success"

4. **Click "Simulate Success":**

   - **Check terminal logs** for:
     ```
     ✅ Payment simulation: SUCCESS
     Transaction ID: SIM-[timestamp]
     Updating state with payment confirmation...
     Advancing to Step 7 (Submission)...
     ```

5. **PolicySubmission Auto-Executes:**

   - **Check terminal logs** for:
     ```
     ✅ Policy created successfully!
     Policy Number: POL-[number]
     [PolicySubmission] Calling onSubmissionComplete callback
     [PolicySubmission] onSubmissionComplete callback returned
     [PolicySubmission] Storage purge completed successfully
     ```

6. **Navigation Should Occur:**
   - **Check terminal logs** for:
     ```
     🎉 PolicySubmission SUCCESS - Navigating to PolicySuccess screen
     ✅ Navigation to PolicySuccess completed
     ```
   - **OR** if navigation fails:
     ```
     ❌ Navigation to PolicySuccess FAILED: [error message]
     ```
   - If failed, Alert dialog should show with manual navigation options

### Expected Log Sequence (Happy Path)

```
💳 SIMULATED PAYMENT PROCESSING - onNext called at Step 6
🚨 SHOWING ALERT DIALOG - User must confirm payment simulation
⏸️  onNext handler paused - waiting for Alert dialog response

[User clicks "Simulate Success"]

✅ Payment simulation: SUCCESS
Transaction ID: SIM-1234567890
Updating state with payment confirmation...
Advancing to Step 7 (Submission)...

PolicySubmission - Normalized Payload BEING SENT:
{ ... }

✅ Policy created successfully!
Policy Number: POL-2025-123456
Policy ID: 789

[PolicySubmission] Calling onSubmissionComplete callback
🎉 PolicySubmission SUCCESS - Navigating to PolicySuccess screen
Result: { "policyNumber": "POL-2025-123456", ... }
✅ Navigation to PolicySuccess completed
[PolicySubmission] onSubmissionComplete callback returned

[PolicySubmission] Running post-success storage purge...
[StoragePurge] purgeAfterPolicySubmission cleared 4 items
[PolicySubmission] Storage purge completed successfully
[PolicySubmission] All post-submission tasks completed
```

### Troubleshooting Guide

**Scenario 1: Dialog Doesn't Appear**

- **Check logs**: If no "🚨 SHOWING ALERT DIALOG" message appears
- **Possible cause**: onNext handler not reaching step === 6 check
- **Solution**: Check step state value in logs

**Scenario 2: Dialog Appears but Navigates to Category Anyway**

- **Check logs**: Look for "❌ Navigation to PolicySuccess FAILED"
- **Possible cause**: Navigation object is invalid or PolicySuccess screen not registered
- **Solution**: Check AppNavigator.js for PolicySuccess registration

**Scenario 3: Policy Created but Navigation Fails**

- **Check logs**: Look for "✅ Policy created" but "❌ Navigation FAILED"
- **Expected behavior**: Alert dialog should show with manual navigation options
- **User action**: Click "Go to Quotations" or "Go Home" in the Alert

**Scenario 4: Logs Show Success but Screen is Category**

- **Check logs**: All success messages but wrong screen displayed
- **Possible cause**: Navigation is being overridden somewhere else
- **Next step**: Search for navigation.navigate or navigation.reset calls after purge
- **Check**: MotorInsuranceContext for any resetFlow calls

### Files Modified

1. **frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js**

   - Lines 1267-1350: Enhanced step 6 payment simulation logging
   - Lines 2330-2365: Enhanced onSubmissionComplete with error handling

2. **frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js**
   - Lines 195-230: Enhanced logging for submission flow and callbacks

### Next Steps

1. **Test the flow** with the enhanced logging
2. **Copy all terminal logs** from the test session
3. **Report findings**:
   - Did Alert dialog appear?
   - Which button was clicked?
   - Did navigation error occur?
   - What was the exact error message?
4. **Analyze log sequence** to identify where the flow diverges

### Potential Fixes (Based on Log Analysis)

**If Alert doesn't show:**

- Check React Native Alert permissions
- Verify no overlay components blocking dialog
- Check if Alert.alert is being imported correctly

**If navigation fails:**

- Verify PolicySuccess screen exists and is registered
- Check navigation stack configuration
- Ensure navigation object is valid at callback time

**If random navigation to category:**

- Check for navigation reset in context
- Look for error boundaries triggering fallback
- Verify no unmount/remount causing navigation reset

### Known Issues Being Investigated

1. **Backend extendible_config**: Still returning `undefined` (fallback calculation works)
2. **Payment plan UI**: Successfully added, needs backend integration
3. **Navigation reliability**: Current investigation focus

### Related Files

- `frontend/navigation/AppNavigator.js` - PolicySuccess registration
- `frontend/contexts/MotorInsuranceContext.js` - State management and resetFlow
- `frontend/services/StoragePurge.js` - Post-submission cleanup
- `frontend/utils/pricingCalculations.js` - Extendible config normalization

---

**Status**: Enhanced logging and error handling deployed, awaiting test results.
