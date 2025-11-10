# Motor2 Foundation Components - Implementation Guide

## Quick Start: Using Controlled Components

### Example 1: Registration Field with Real-time Validation

```javascript
import ControlledTextInput from "../../../../components/forms/ControlledTextInput";
import { useMotorFormField } from "../../../../hooks/useMotorFormField";
import { validateKenyanRegistration } from "../../../../utils/motorFormValidation";

function VehicleDetailsScreen() {
  const registration = useMotorFormField({
    name: "registrationNumber",
    initialValue: "",
    validate: validateKenyanRegistration,
    onNotify: (fieldName, fieldValue) => {
      // Parent callback fires after 400ms debounce
      console.log(`Registration updated: ${fieldValue}`);
      parentFormState.registrationNumber = fieldValue;
    },
    debounceMs: 400, // Longer debounce for typing
  });

  return (
    <ControlledTextInput
      value={registration.value}
      onChangeText={registration.handleChange}
      label="Vehicle Registration"
      required
      error={registration.error}
      placeholder="e.g., KDA 123A"
      autoCapitalize="characters"
    />
  );
}
```

**Result**:

- ✅ Keyboard never dismisses while typing
- ✅ Real-time validation with error display
- ✅ Debounced parent notification (prevents excessive re-renders)
- ✅ Max 2 renders per keystroke (TextInput + parent)

---

### Example 2: Financial Interest Radio Group

```javascript
import ControlledRadioGroup from "../../../../components/forms/ControlledRadioGroup";
import { useMotorFormField } from "../../../../hooks/useMotorFormField";
import { validateRequired } from "../../../../utils/motorFormValidation";

function PolicyDetailsScreen() {
  const financialInterest = useMotorFormField({
    name: "financialInterest",
    initialValue: "",
    validate: validateRequired("Financial Interest"),
    onNotify: updateParentForm,
    debounceMs: 100, // Shorter for radio (immediate feedback)
  });

  return (
    <ControlledRadioGroup
      value={financialInterest.value}
      onSelect={financialInterest.handleChange}
      label="Financial Interest"
      required
      error={financialInterest.error}
      options={["Yes", "No"]}
    />
  );
}
```

**Result**:

- ✅ Stable handlers prevent re-renders
- ✅ Selection highlights immediately
- ✅ Parent notified after 100ms (almost instant)

---

### Example 3: Vehicle Make Dropdown with Dependency

```javascript
import ControlledSelect from "../../../../components/forms/ControlledSelect";
import { useMotorFormField } from "../../../../hooks/useMotorFormField";
import {
  VEHICLE_MAKES,
  getModelsForMake,
} from "../../../../constants/vehicleCatalog";

function VehicleDetailsScreen() {
  const make = useMotorFormField({
    name: "make",
    initialValue: "",
    validate: validateRequired("Vehicle Make"),
    onNotify: updateParentForm,
    debounceMs: 100,
  });

  const model = useMotorFormField({
    name: "model",
    initialValue: "",
    validate: validateRequired("Vehicle Model"),
    onNotify: updateParentForm,
    debounceMs: 100,
  });

  // Reset model when make changes
  useEffect(() => {
    if (make.value && model.value) {
      const allowedModels = getModelsForMake(make.value);
      if (!allowedModels.includes(model.value)) {
        model.setValue(""); // Reset model
      }
    }
  }, [make.value]);

  const modelOptions = make.value ? getModelsForMake(make.value) : [];

  return (
    <>
      <ControlledSelect
        value={make.value}
        onSelect={make.handleChange}
        label="Vehicle Make"
        required
        error={make.error}
        options={[...VEHICLE_MAKES, "Others"]}
        placeholder="Select make"
      />

      {make.value === "Others" && (
        <ControlledTextInput
          value={makeOther}
          onChangeText={(val) => setMakeOther(val)}
          label="Specify Vehicle Make"
          required
          placeholder="Enter vehicle make"
        />
      )}

      {modelOptions.length > 0 && (
        <ControlledSelect
          value={model.value}
          onSelect={model.handleChange}
          label="Vehicle Model"
          required
          error={model.error}
          options={[...modelOptions, "Others"]}
          placeholder="Select model"
        />
      )}
    </>
  );
}
```

**Result**:

- ✅ Accordion-style dropdowns (collapsed/expanded)
- ✅ Auto-collapse after selection
- ✅ Model resets when make changes
- ✅ "Others" option shows text input

---

### Example 4: Cover Start Date with DMVIC Constraint

```javascript
import ControlledDatePicker from "../../../../components/forms/ControlledDatePicker";
import { useMotorFormField } from "../../../../hooks/useMotorFormField";
import { validateCoverStartDate } from "../../../../utils/motorFormValidation";

function PolicyDetailsScreen({ minCoverStartDate, existingCoverData }) {
  const coverStartDate = useMotorFormField({
    name: "cover_start_date",
    initialValue: new Date().toISOString().split("T")[0],
    validate: (value) => validateCoverStartDate(value, minCoverStartDate),
    onNotify: updateParentForm,
    debounceMs: 100,
  });

  // Calculate minimum date from DMVIC response
  const minimumDate = minCoverStartDate
    ? new Date(minCoverStartDate)
    : new Date();

  // Build helper text
  const helperText = minCoverStartDate
    ? `⚠️ Minimum date: ${minimumDate.toLocaleDateString()} (existing cover expires ${new Date(
        minimumDate.getTime() - 24 * 60 * 60 * 1000
      ).toLocaleDateString()})`
    : null;

  return (
    <ControlledDatePicker
      value={coverStartDate.value}
      onChange={coverStartDate.handleChange}
      label="Cover Start Date"
      required
      error={coverStartDate.error}
      minDate={minimumDate}
      helperText={helperText}
      placeholder="Select date"
    />
  );
}
```

**Result**:

- ✅ Native date picker (iOS/Android)
- ✅ Min date validation (DMVIC constraint)
- ✅ Helper text explains restriction
- ✅ Alert on invalid selection

---

### Example 5: Sum Insured with Currency Formatting

```javascript
import ControlledTextInput from "../../../../components/forms/ControlledTextInput";
import { useMotorFormField } from "../../../../hooks/useMotorFormField";
import {
  validateSumInsured,
  formatCurrency,
  parseCurrency,
} from "../../../../utils/motorFormValidation";

function ComprehensivePricingScreen() {
  const sumInsured = useMotorFormField({
    name: "sum_insured",
    initialValue: "",
    validate: validateSumInsured,
    onNotify: (fieldName, fieldValue) => {
      // Send raw number to parent, not formatted string
      const numericValue = parseCurrency(fieldValue);
      updateParentForm(fieldName, numericValue);
    },
    debounceMs: 400, // Longer for typing
  });

  // Format for display: 1500000 → "1 500 000"
  const displayValue = sumInsured.value ? formatCurrency(sumInsured.value) : "";

  // Handle change: remove formatting before saving
  const handleChange = (formattedValue) => {
    const numericValue = parseCurrency(formattedValue);
    sumInsured.handleChange(numericValue);
  };

  return (
    <ControlledTextInput
      value={displayValue}
      onChangeText={handleChange}
      label="Sum Insured (Vehicle Value)"
      required
      error={sumInsured.error}
      placeholder="e.g., 1 500 000"
      keyboardType="numeric"
      helperText="Enter the current market value of your vehicle (KSh 50,000 - KSh 50,000,000)"
    />
  );
}
```

**Result**:

- ✅ Real-time currency formatting (spaces every 3 digits)
- ✅ Validation: 50k to 50M range
- ✅ Parent receives raw number, not string
- ✅ Keyboard persistence during typing

---

## Advanced Pattern: Multiple Fields with Shared Parent Notification

```javascript
function VehicleDetailsForm({ onFormChange }) {
  // Ref holds latest values without triggering re-renders
  const formDataRef = useRef({});

  // Stable parent notification callback
  const notifyParent = useStableCallback((fieldName, fieldValue) => {
    formDataRef.current = {
      ...formDataRef.current,
      [fieldName]: fieldValue,
    };

    // Notify parent with complete form data
    onFormChange(formDataRef.current);
  });

  // Individual fields
  const registration = useMotorFormField({
    name: "registrationNumber",
    initialValue: "",
    validate: validateKenyanRegistration,
    onNotify: notifyParent,
    debounceMs: 400,
  });

  const year = useMotorFormField({
    name: "year",
    initialValue: "",
    validate: validateYear,
    onNotify: notifyParent,
    debounceMs: 300,
  });

  const sumInsured = useMotorFormField({
    name: "sum_insured",
    initialValue: "",
    validate: validateSumInsured,
    onNotify: notifyParent,
    debounceMs: 400,
  });

  return (
    <>
      <ControlledTextInput
        value={registration.value}
        onChangeText={registration.handleChange}
        label="Vehicle Registration"
        required
        error={registration.error}
      />

      <ControlledTextInput
        value={year.value}
        onChangeText={year.handleChange}
        label="Year of Manufacture"
        required
        error={year.error}
        keyboardType="numeric"
      />

      <ControlledTextInput
        value={sumInsured.value}
        onChangeText={sumInsured.handleChange}
        label="Sum Insured"
        required
        error={sumInsured.error}
        keyboardType="numeric"
      />
    </>
  );
}
```

**Result**:

- ✅ All fields share same parent callback
- ✅ formDataRef holds latest values (no re-renders)
- ✅ Each field has independent debounce timing
- ✅ Parent receives complete form data on each change

---

## Anti-Patterns to Avoid ❌

### ❌ Don't Include formData in useCallback Dependencies

```javascript
// BAD - causes function recreation on every keystroke
const handleChange = useCallback(
  (value) => {
    setFormData({ ...formData, field: value });
  },
  [formData]
); // ❌ Function recreates on every formData change

// GOOD - use ref to read current data
const formDataRef = useRef(formData);
const handleChange = useCallback((value) => {
  formDataRef.current = { ...formDataRef.current, field: value };
  setFormData(formDataRef.current);
}, []); // ✅ Function stable across renders
```

### ❌ Don't Put Field Values in useMemo Dependencies

```javascript
// BAD - memo recalculates on every keystroke
const comparisonKey = useMemo(() => {
  return JSON.stringify({ registration: formData.registration });
}, [formData.registration]); // ❌ Recalculates constantly

// GOOD - use refs to read without dependency
const comparisonKey = useMemo(() => {
  return JSON.stringify({ registration: latestFormRef.current.registration });
}, [selectedProduct.id]); // ✅ Only recalculates when product changes
```

### ❌ Don't Set blurOnSubmit=true

```javascript
// BAD - keyboard dismisses on submit
<TextInput blurOnSubmit={true} /> // ❌

// GOOD - keyboard stays visible
<TextInput blurOnSubmit={false} returnKeyType="next" /> // ✅
```

### ❌ Don't Include Function Props in React.memo Comparison

```javascript
// BAD - re-renders on every parent render
export default React.memo(Component, (prev, next) => {
  return prev.onChangeText === next.onChangeText; // ❌ Functions always different
});

// GOOD - exclude function props
export default React.memo(Component, (prev, next) => {
  return prev.value === next.value && prev.error === next.error;
  // ✅ Exclude onChangeText from comparison
});
```

---

## Migration Checklist

When migrating an existing field to foundation components:

- [ ] Import `useMotorFormField` hook
- [ ] Import appropriate controlled component
- [ ] Import validator from `motorFormValidation.js`
- [ ] Replace useState with useMotorFormField
- [ ] Replace TextInput/RadioGroup/etc with Controlled version
- [ ] Verify keyboard persistence (blurOnSubmit=false)
- [ ] Test real-time validation
- [ ] Verify parent notification timing (debounce)
- [ ] Check React DevTools Profiler (max 2 renders)
- [ ] Remove old implementation

---

## Testing New Implementations

1. **Keyboard Persistence Test**:

   ```
   - Tap field, keyboard appears
   - Type entire value without lifting finger
   - Keyboard should NEVER flicker or dismiss
   - TextInput should maintain focus throughout
   ```

2. **Validation Test**:

   ```
   - Type invalid value (e.g., "ABC" for registration)
   - Error should appear immediately
   - Type valid value (e.g., "KDA 123A")
   - Error should clear immediately
   ```

3. **Parent Notification Test**:

   ```
   - Type value, stop typing
   - Wait for debounce period (400ms)
   - Parent callback should fire exactly once
   - Console log to verify timing
   ```

4. **Re-render Test**:
   ```
   - Open React DevTools Profiler
   - Start recording
   - Type 5 characters
   - Stop recording
   - Verify: 5 renders of parent, 0 renders of TextInput (memo working)
   ```

---

## File Locations Reference

```
frontend/
├── components/forms/
│   ├── ControlledTextInput.js       # Text input with memoization
│   ├── ControlledRadioGroup.js      # Radio buttons with stable handlers
│   ├── ControlledSelect.js          # Accordion dropdown
│   └── ControlledDatePicker.js      # Native date picker
├── hooks/
│   └── useMotorFormField.js         # Field state management hook
└── utils/
    └── motorFormValidation.js       # All validation functions
```

---

## Summary

**Foundation components are production-ready**. Use them in new screens or incrementally migrate existing implementations. All patterns preserve business logic while eliminating keyboard dismissal and excessive re-renders.

**Key Principle**: Refs for reading, state for rendering, memoization for performance.
