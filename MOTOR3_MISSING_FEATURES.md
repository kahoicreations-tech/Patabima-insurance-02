# Motor3 Missing Features - Comparison with Motor2

## Executive Summary

Motor3 is **functionally simplified** but missing **critical production features** from Motor2:

| Feature            | Motor2                              | Motor3                        | Status       |
| ------------------ | ----------------------------------- | ----------------------------- | ------------ |
| Error Boundary     | ✅ StepErrorBoundary class          | ❌ None                       | **CRITICAL** |
| Cache Clearing     | ✅ 10 AsyncStorage keys on mount    | ❌ None                       | **CRITICAL** |
| Step Validation    | ✅ Per-step with helpful messages   | ❌ None                       | **CRITICAL** |
| DMVIC Integration  | ✅ Auto-check + verification screen | ❌ Not implemented            | **HIGH**     |
| Safe Area Insets   | ✅ useSafeAreaInsets                | ❌ None                       | **MEDIUM**   |
| Document Upload    | ✅ Required docs validation         | ⚠️ Step exists, no validation | **HIGH**     |
| Client Validation  | ✅ Phone/Email/KRA/ID regex         | ⚠️ Basic fields only          | **HIGH**     |
| Payment Validation | ✅ Premium > 0 check                | ⚠️ Unknown                    | **MEDIUM**   |
| Navigation Guards  | ✅ canProceed logic                 | ❌ None                       | **CRITICAL** |
| Loading States     | ✅ Per-step loading indicators      | ❌ Unknown                    | **MEDIUM**   |

---

## 1. Error Boundary (CRITICAL)

### Motor2 Implementation:

```javascript
class StepErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    console.error("[MotorInsuranceContainer] Step render error:", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 16 }}>
          <Text>Something went wrong. Please go back and try again.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Usage in renderStep():
<StepErrorBoundary>{CurrentStepComponent}</StepErrorBoundary>;
```

### Motor3 Implementation:

**❌ NONE** - App will crash on step render errors

### Fix Required:

Add same ErrorBoundary to Motor3Container and ThirdPartyFlow/ComprehensiveFlow

---

## 2. Cache Clearing on Mount (CRITICAL)

### Motor2 Implementation:

```javascript
const clearMotor2Cache = async () => {
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
  await Promise.all(keysToRemove.map((key) => AsyncStorage.removeItem(key)));
  console.log("[MotorInsuranceContainer] ✅ Cleared Motor2 cache");
};

useEffect(() => {
  clearMotor2Cache();
}, []);
```

### Motor3 Implementation:

**❌ NONE** - Old data persists between sessions

### Fix Required:

Add cache clearing on mount for Motor3-specific keys:

- `MOTOR3_FLOW_STATE`
- `MOTOR3_VEHICLE_DETAILS`
- `MOTOR3_CLIENT_DETAILS`
- `MOTOR3_UNDERWRITER_SELECTION`
- `MOTOR3_DOCUMENTS`
- `DMVIC_CACHE` (if using same DMVIC service)

---

## 3. Step Validation with Helpful Messages (CRITICAL)

### Motor2 Implementation:

```javascript
const { canProceed, validationMessage } = useMemo(() => {
  const step = steps[currentStep] || "";

  switch (step) {
    case "Category": {
      const ok = !!state.selectedCategory;
      return {
        canProceed: ok,
        validationMessage: ok ? "" : "Select a vehicle category to continue",
      };
    }

    case "Subcategory": {
      const ok = !!state.selectedSubcategory;
      return {
        canProceed: ok,
        validationMessage: ok ? "" : "Select a cover type to continue",
      };
    }

    case "Policy Details": {
      const hasReg = !!registration;
      const hasIdType = !!identificationType;
      const hasCover = !!coverStart;
      const hasUnderwriter = isComprehensive ? true : !!selectedUnderwriter;
      const hasPremium = isComprehensive
        ? true
        : !!(selectedUnderwriter?.total_premium > 0);
      const sumInsured = Number(vehicle.sum_insured || 0);
      const hasSumInsured = isComprehensive ? sumInsured > 0 : true;

      const ok =
        hasReg &&
        hasIdType &&
        hasCover &&
        hasUnderwriter &&
        hasPremium &&
        hasSumInsured;

      let msg = "";
      if (!ok) {
        if (!hasReg) msg = "Enter vehicle registration";
        else if (!hasIdType) msg = "Select identification type";
        else if (!hasCover) msg = "Select cover start date";
        else if (!hasSumInsured) msg = "Enter sum insured (vehicle value)";
        else if (!hasUnderwriter)
          msg = "Select an underwriter from the pricing comparison";
        else if (!hasPremium)
          msg = "Premium not calculated - please wait for pricing to load";
      }

      return { canProceed: ok, validationMessage: msg };
    }

    case "Documents": {
      const uploadedDocs = state.uploadedDocuments || {};
      const requiredDocs = ["logbook", "id_copy", "kra_pin"];
      const missingDocs = requiredDocs.filter((doc) => !uploadedDocs[doc]);

      const allUploaded = missingDocs.length === 0;
      let msg = "";
      if (!allUploaded) {
        msg = `Please upload: ${missingDocs
          .map((d) => {
            switch (d) {
              case "logbook":
                return "Vehicle Logbook";
              case "id_copy":
                return "National ID";
              case "kra_pin":
                return "KRA PIN Certificate";
              default:
                return d;
            }
          })
          .join(", ")}`;
      }
      return { canProceed: allUploaded, validationMessage: msg };
    }

    case "Client Details": {
      const fullName = str(client.fullName || client.name);
      const phone = str(client.phone || client.phoneNumber);
      const email = str(client.email);

      if (!fullName) {
        return {
          canProceed: false,
          validationMessage: "Enter client full name",
        };
      }
      if (!phone) {
        return {
          canProceed: false,
          validationMessage: "Enter client phone number",
        };
      }
      if (!email) {
        return {
          canProceed: false,
          validationMessage: "Enter client email address",
        };
      }

      // Phone validation (Kenyan format)
      const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
      if (!phoneRegex.test(phone.replace(/[\s\-]/g, ""))) {
        return {
          canProceed: false,
          validationMessage:
            "Enter valid Kenyan phone number (e.g., 0712345678)",
        };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          canProceed: false,
          validationMessage: "Enter valid email address",
        };
      }

      // KRA PIN validation (format: A000000000X)
      const kraPin = str(client.kra_pin || client.kraPin);
      if (kraPin) {
        const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/;
        if (!kraPinRegex.test(kraPin.replace(/[\s\-]/g, ""))) {
          return {
            canProceed: false,
            validationMessage: "Enter valid KRA PIN (e.g., A000000000X)",
          };
        }
      }

      // ID Number validation (7+ digits)
      const idNumber = str(client.id_number || client.idNumber);
      if (idNumber && idNumber.length < 7) {
        return {
          canProceed: false,
          validationMessage: "Enter valid ID number (minimum 7 digits)",
        };
      }

      return { canProceed: true, validationMessage: "" };
    }

    case "Payment": {
      const ok = premiumTotal > 0;
      return {
        canProceed: ok,
        validationMessage: ok ? "" : "Premium not calculated yet",
      };
    }

    default:
      return { canProceed: true, validationMessage: "" };
  }
}, [steps, currentStep, state]);

// Display validation message to user
{
  validationMessage && (
    <Text style={styles.validationError}>{validationMessage}</Text>
  );
}

// Disable Next button if validation fails
<Button title="Next" onPress={goNext} disabled={!canProceed} />;
```

### Motor3 Implementation:

**❌ NONE** - No step validation logic at all

### Fix Required:

1. Add validation helpers to Motor3Context:
   - `validateCurrentStep(stepNumber)` → returns `{canProceed, validationMessage}`
2. Implement per-step validation in ThirdPartyFlow and ComprehensiveFlow
3. Display validation messages in UI
4. Disable Next button when validation fails

---

## 4. DMVIC Integration (HIGH PRIORITY)

### Motor2 Implementation:

```javascript
// Reference to DMVIC check function from PolicyDetailsStep
const dmvicCheckRef = useRef(null);

const goNext = useCallback(async () => {
  const currentStepName = steps[currentStep];

  // If on Policy Details step, trigger DMVIC check before proceeding to KYC
  if (currentStepName === "Policy Details" && dmvicCheckRef.current) {
    console.log(
      "[MotorContainer] Triggering DMVIC check before proceeding to KYC"
    );

    const regNumber =
      state.vehicleDetails?.registrationNumber ||
      state.vehicleDetails?.registration_number;

    const coverDate = state.vehicleDetails?.cover_start_date;

    if (regNumber && regNumber.length >= 6) {
      const alreadyProcessed = actions.hasDMVICProcessed?.(regNumber);

      if (!alreadyProcessed) {
        console.log("[MotorContainer] Performing DMVIC check for:", regNumber);
        try {
          await dmvicCheckRef.current.current(regNumber, coverDate);
          actions.markDMVICProcessed?.(regNumber);
        } catch (error) {
          console.warn(
            "[MotorContainer] DMVIC check failed (non-blocking):",
            error?.message
          );
          // Don't block navigation on DMVIC errors
        }
      }
    }
  }

  // Proceed to next step
  setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
}, [steps, currentStep, state.vehicleDetails, actions]);

// Handler for verification screen actions
const handleAdjustStartDate = useCallback(() => {
  console.log("📅 [DMVIC] User chose to adjust start date");
  actions.setShowVerificationScreen(false);

  const currentStepName = steps[currentStep];
  if (currentStepName === "KYC") {
    console.log(
      "[DMVIC] Navigating back to Policy Details from KYC to adjust date"
    );
    const policyDetailsIndex = steps.indexOf("Policy Details");
    if (policyDetailsIndex >= 0) {
      setCurrentStep(policyDetailsIndex);
    }
  }
}, [actions, steps, currentStep]);

const handleSubmitDebitNote = useCallback(() => {
  console.log("📝 [DMVIC] User chose to submit debit note");
  actions.setShowVerificationScreen(false);

  Alert.alert(
    "Debit Note Submission",
    "This feature will allow you to request cancellation of the existing policy. Coming soon!",
    [{ text: "OK" }]
  );
}, []);

// Render verification screen if active
{
  state.showVerificationScreen && (
    <VehicleVerificationScreen
      registrationNumber={state.vehicleDetails?.registrationNumber}
      onAdjustStartDate={handleAdjustStartDate}
      onSubmitDebitNote={handleSubmitDebitNote}
      onClose={() => actions.setShowVerificationScreen(false)}
    />
  );
}
```

### Motor3 Implementation:

**❌ NOT IMPLEMENTED** - No DMVIC integration at all

### Fix Required:

1. Add DMVIC check logic to Step2_VehicleDetails
2. Add verification screen state to ThirdPartyContext
3. Implement VehicleVerificationScreen component
4. Add "Adjust Start Date" and "Submit Debit Note" handlers
5. Trigger DMVIC check on registration blur or before navigation to next step

---

## 5. Safe Area Insets (MEDIUM)

### Motor2 Implementation:

```javascript
import { useSafeAreaInsets } from "react-native-safe-area-context";

const insets = useSafeAreaInsets();

<View
  style={[
    styles.container,
    {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
  ]}
>
  {/* Content */}
</View>;
```

### Motor3 Implementation:

**❌ NONE**

### Fix Required:

Add `useSafeAreaInsets` to Motor3Container, ThirdPartyFlow, and ComprehensiveFlow

---

## 6. Document Upload Validation (HIGH)

### Motor2 Implementation:

- Requires 3 documents: logbook, id_copy, kra_pin
- Shows missing documents in validation message
- Blocks navigation until all uploaded

### Motor3 Implementation:

- Step5_DocumentUpload exists but validation status unknown

### Fix Required:

Verify Step5_DocumentUpload has same validation logic as Motor2

---

## 7. Client Details Validation (HIGH)

### Motor2 Regex Patterns:

```javascript
// Phone: Kenyan format (07XXXXXXXX or 01XXXXXXXX or +2547XXXXXXXX)
const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;

// Email: Standard email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// KRA PIN: Format A000000000X
const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/;

// ID Number: Minimum 7 digits
const idMinLength = 7;
```

### Motor3 Implementation:

Unknown - needs verification in Step4_ClientDetails

### Fix Required:

Add same regex validation to Step4_ClientDetails

---

## Implementation Priority

### Phase 1: CRITICAL (Must-Have for Production)

1. ✅ Add Error Boundary to Motor3Container
2. ✅ Add cache clearing on mount
3. ✅ Implement step validation with helpful messages
4. ✅ Add navigation guards (canProceed logic)

### Phase 2: HIGH (Important for UX)

5. ⚠️ Implement DMVIC integration
6. ⚠️ Add document upload validation
7. ⚠️ Add client details regex validation
8. ⚠️ Add payment validation

### Phase 3: MEDIUM (Nice-to-Have)

9. Add safe area insets
10. Add loading states per step
11. Add deep link support for payment
12. Add debit note submission flow

---

## Files to Modify

1. **Motor3Container.js** - Add error boundary, cache clearing
2. **ThirdPartyFlow.js** - Add step validation, navigation guards
3. **ComprehensiveFlow.js** - Same as ThirdPartyFlow
4. **Motor3Context.js** - Add validation helpers, DMVIC state
5. **ThirdPartyContext.js** - Add DMVIC state
6. **Step2_VehicleDetails.js** - Add DMVIC integration
7. **Step4_ClientDetails.js** - Add regex validation
8. **Step5_DocumentUpload.js** - Verify validation exists
9. **Step7_Payment.js** - Add premium validation

---

## Next Steps

1. Read Motor2 remaining lines (400-786) to find:

   - Add-ons selection logic
   - Payment processing integration
   - Submission API structure
   - Success screen handling

2. Implement Phase 1 (CRITICAL) fixes immediately

3. Test end-to-end flow with validation

4. Implement Phase 2 (HIGH) features

5. Polish UI/UX to match Motor2 appearance
