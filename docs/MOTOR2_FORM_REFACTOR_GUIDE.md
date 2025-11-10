# Motor2 Form Fields Refactoring Guide

## Objective

Completely rebuild all Motor2 input fields using React best practices to eliminate keyboard dismissal, field blinking, and excessive re-renders while preserving all business logic, validation, and integrations.

## Core Principles

### 1. **Stable References Over State Dependencies**

```javascript
❌ BAD: Function recreated on every render
const handleChange = (value) => {
  setFormData({ ...formData, field: value });
  onDataChange({ ...formData, field: value });
};

✅ GOOD: Stable reference with useCallback and refs
const handleChange = useCallback((value) => {
  latestFormRef.current = { ...latestFormRef.current, field: value };
  setFormData(latestFormRef.current);
  debouncedNotifyParent(latestFormRef.current);
}, []); // Empty deps - never recreates
```

### 2. **Debounced State Updates for Text Inputs**

```javascript
❌ BAD: State updates on every keystroke
<TextInput
  value={formData.registration}
  onChangeText={(val) => setFormData({...formData, registration: val})}
/>

✅ GOOD: Ref updates instantly, state debounced
const handleRegistrationChange = useCallback((value) => {
  // Instant: Update ref for latest value access
  latestFormRef.current.registration = value;

  // Debounced: Update state after 400ms
  if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  debounceTimeout.current = setTimeout(() => {
    setFormData(latestFormRef.current);
  }, 400);
}, []);
```

### 3. **Controlled Components with Memoization**

```javascript
❌ BAD: Component recreated on parent re-render
const TextInput = ({ value, onChange }) => (
  <TextInput value={value} onChangeText={onChange} />
);

✅ GOOD: Memoized with custom comparison
const ControlledTextInput = memo(({ value, onChange, ...props }) => (
  <TextInput value={value} onChangeText={onChange} {...props} />
), (prev, next) => {
  // Only re-render if value or error state changes
  return prev.value === next.value && prev.error === next.error;
});
```

### 4. **Single Source of Truth with Refs**

```javascript
❌ BAD: Multiple state variables creating race conditions
const [formData, setFormData] = useState({});
const [registration, setRegistration] = useState('');
const [errors, setErrors] = useState({});

✅ GOOD: Single ref as source of truth
const formRef = useRef({});
const [renderTrigger, setRenderTrigger] = useState(0);

const updateField = (key, value) => {
  formRef.current[key] = value;
  setRenderTrigger(prev => prev + 1); // Only when UI needs update
};
```

## Implementation Pattern

### Step 1: Create Controlled Input Components

**File**: `frontend/components/forms/ControlledTextInput.js`

```javascript
import React, { memo, useRef, useCallback } from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";

const ControlledTextInput = memo(
  ({
    value,
    onChangeText,
    onValidate,
    error,
    label,
    required = false,
    debounceMs = 0,
    ...textInputProps
  }) => {
    const debounceTimeout = useRef(null);

    const handleChange = useCallback(
      (text) => {
        // Clear existing timeout
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }

        if (debounceMs > 0) {
          // Debounced update
          debounceTimeout.current = setTimeout(() => {
            onChangeText(text);
            if (onValidate) onValidate(text);
          }, debounceMs);
        } else {
          // Immediate update
          onChangeText(text);
          if (onValidate) onValidate(text);
        }
      },
      [onChangeText, onValidate, debounceMs]
    );

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
        )}
        <TextInput
          {...textInputProps}
          value={value}
          onChangeText={handleChange}
          style={[styles.input, error && styles.inputError]}
          blurOnSubmit={false}
          returnKeyType="next"
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if these specific props change
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.label === nextProps.label &&
      prevProps.required === nextProps.required
    );
  }
);

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" },
  required: { color: "#DC2626" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  inputError: { borderColor: "#DC2626" },
  errorText: { color: "#DC2626", fontSize: 12, marginTop: 4 },
});

export default ControlledTextInput;
```

### Step 2: Create Form Field Hook

**File**: `frontend/hooks/useMotorFormField.js`

```javascript
import { useState, useRef, useCallback } from "react";

/**
 * Custom hook for managing Motor2 form fields with stable handlers
 *
 * @param {Object} config
 * @param {string} config.name - Field name
 * @param {any} config.initialValue - Initial field value
 * @param {Function} config.validate - Validation function (value) => error string | null
 * @param {Function} config.onNotify - Parent notification callback
 * @param {number} config.debounceMs - Debounce delay for parent notifications (default: 250ms)
 * @returns {Object} { value, error, handleChange, resetError }
 */
export const useMotorFormField = ({
  name,
  initialValue = "",
  validate = null,
  onNotify = null,
  debounceMs = 250,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const latestValueRef = useRef(initialValue);
  const notifyTimeoutRef = useRef(null);

  const handleChange = useCallback(
    (newValue) => {
      // Update ref immediately (synchronous)
      latestValueRef.current = newValue;

      // Update state (triggers re-render)
      setValue(newValue);

      // Validate if validator provided
      if (validate) {
        const validationError = validate(newValue);
        setError(validationError);
      }

      // Notify parent with debounce
      if (onNotify) {
        if (notifyTimeoutRef.current) {
          clearTimeout(notifyTimeoutRef.current);
        }

        notifyTimeoutRef.current = setTimeout(() => {
          onNotify(name, newValue);
        }, debounceMs);
      }
    },
    [name, validate, onNotify, debounceMs]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    value,
    error,
    handleChange,
    resetError,
    latestValue: latestValueRef.current,
  };
};
```

### Step 3: Refactor DynamicVehicleForm

**Target File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`

#### Before (Current - Problematic):

```javascript
const DynamicPolicyForm = ({ selectedProduct, onDataChange, initialData }) => {
  const [formData, setFormData] = useState(initialData);

  const handleInputChange = useCallback(
    (key, value) => {
      const newFormData = { ...formData, [key]: value }; // ❌ Depends on formData state
      setFormData(newFormData);
      onDataChange(newFormData); // ❌ Triggers parent re-render immediately
    },
    [formData, onDataChange]
  ); // ❌ Recreated on every formData change

  return (
    <TextInput
      value={formData.registrationNumber}
      onChangeText={(val) => handleInputChange("registrationNumber", val)}
    />
  );
};
```

#### After (Refactored - Stable):

```javascript
import ControlledTextInput from "../../../../components/forms/ControlledTextInput";
import { useMotorFormField } from "../../../../hooks/useMotorFormField";

const DynamicPolicyForm = ({ selectedProduct, onDataChange, initialData }) => {
  const formDataRef = useRef(initialData);
  const [, forceUpdate] = useState(0);

  // Stable parent notifier
  const notifyParent = useCallback(
    (fieldName, fieldValue) => {
      formDataRef.current[fieldName] = fieldValue;
      onDataChange(formDataRef.current);
    },
    [onDataChange]
  );

  // Registration field with validation
  const registration = useMotorFormField({
    name: "registrationNumber",
    initialValue: initialData.registrationNumber || "",
    validate: (val) => {
      if (!val || val.trim() === "") return "Registration number is required";
      const kenyanPlatePattern = /^K[A-Z]{2}\s?\d{3}[A-Z]$/i;
      if (!kenyanPlatePattern.test(val))
        return "Invalid Kenyan plate format (e.g., KAA 123A)";
      return null;
    },
    onNotify: notifyParent,
    debounceMs: 400, // Longer debounce for registration (user typing)
  });

  return (
    <ControlledTextInput
      label="Vehicle Registration"
      required
      value={registration.value}
      onChangeText={registration.handleChange}
      error={registration.error}
      placeholder="e.g., KDA 123A"
      autoCapitalize="characters"
      debounceMs={0} // No debounce in component (hook handles it)
    />
  );
};
```

### Step 4: Refactor Radio Groups

**Component**: `frontend/components/forms/ControlledRadioGroup.js`

```javascript
import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const ControlledRadioGroup = memo(
  ({ label, required = false, options = [], value, onChange, error }) => {
    const handleOptionPress = useCallback(
      (option) => {
        onChange(option);
      },
      [onChange]
    );

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
        )}
        <View style={styles.radioContainer}>
          {options.map((option) => {
            const isSelected = value === option;
            return (
              <TouchableOpacity
                key={String(option)}
                style={styles.radioOption}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text
                  style={[
                    styles.radioText,
                    isSelected && styles.radioTextSelected,
                  ]}
                >
                  {String(option)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.value === next.value &&
      prev.error === next.error &&
      prev.options.length === next.options.length
    );
  }
);

// ... styles

export default ControlledRadioGroup;
```

## Validation Patterns

### Registration Number Validator

```javascript
const validateKenyanRegistration = (value) => {
  if (!value || value.trim() === "") {
    return "Registration number is required";
  }

  const cleaned = value.trim().toUpperCase();
  const pattern = /^K[A-Z]{2}\s?\d{3}[A-Z]$/;

  if (!/^[A-Z0-9\s]+$/i.test(value)) {
    return "Registration contains invalid characters";
  }

  if (!pattern.test(cleaned)) {
    return "Invalid format. Expected: KXX 123X (e.g., KAA 123A)";
  }

  return null;
};
```

### Sum Insured Validator

```javascript
const validateSumInsured = (value) => {
  if (!value || value.toString().trim() === "") {
    return "Vehicle value is required";
  }

  const numValue = Number(value.toString().replace(/[^0-9]/g, ""));

  if (isNaN(numValue) || numValue <= 0) {
    return "Enter a valid positive amount";
  }

  if (numValue < 50000) {
    return "Minimum vehicle value is KSh 50,000";
  }

  if (numValue > 50000000) {
    return "Maximum vehicle value is KSh 50,000,000";
  }

  return null;
};
```

## Migration Strategy

### Phase 1: Core Components (Days 1-2)

- Create `ControlledTextInput` component
- Create `ControlledRadioGroup` component
- Create `ControlledSelect` component
- Create `useMotorFormField` hook
- Create validation utilities

### Phase 2: DynamicVehicleForm (Days 3-4)

- Refactor registration field (highest priority - keyboard issue)
- Refactor all text fields (chassisNumber, make_other, model_other, year, sum_insured)
- Refactor radio groups (financialInterest, identificationType)
- Refactor selects (make, model)
- Refactor date picker (cover_start_date)

### Phase 3: Other Motor2 Steps (Days 5-6)

- PolicyDetailsStep
- KYCStep
- ClientDetailsStep
- PaymentStep (if applicable)

### Phase 4: Testing & Cleanup (Days 7-8)

- Remove all debug logs
- Performance profiling
- End-to-end testing (Third Party, Comprehensive, Commercial, PSV)
- Documentation updates

## Testing Checklist

### Keyboard Persistence Test

- [ ] Open Third Party product
- [ ] Tap registration field
- [ ] Type "K" → Keyboard stays visible
- [ ] Type "KD" → Keyboard stays visible
- [ ] Type "KDA" → Keyboard stays visible
- [ ] Complete "KDA 123A" → Keyboard stays visible
- [ ] Field validates correctly
- [ ] No visual flickering or blinking

### Re-render Test (Use React DevTools Profiler)

- [ ] Type one character in registration field
- [ ] Maximum 2 components re-render:
  - ControlledTextInput itself
  - Parent component (debounced notification)
- [ ] Underwriter list does NOT re-render
- [ ] Other fields do NOT re-render

### Underwriter Selection Test

- [ ] Underwriters load once on mount for Third Party
- [ ] Typing in registration does NOT trigger re-fetch
- [ ] Clicking underwriter card does NOT dismiss keyboard
- [ ] Selection persists correctly
- [ ] No console errors

### Cross-Product Test

- [ ] Third Party: No form fields affect pricing ✓
- [ ] TOR: No form fields affect pricing ✓
- [ ] Comprehensive: Sum insured triggers comparison on Underwriter screen ✓
- [ ] Commercial: Tonnage field works correctly ✓
- [ ] PSV: Capacity field works correctly ✓

## Anti-Patterns to Avoid

### ❌ NEVER: Include form state in dependency arrays

```javascript
// BAD - Recreates on every keystroke
const handleChange = useCallback(
  (value) => {
    setFormData({ ...formData, field: value });
  },
  [formData]
); // ❌ formData changes = function recreates
```

### ❌ NEVER: Update state synchronously in onChangeText

```javascript
// BAD - Causes keyboard dismissal
<TextInput
  value={formData.registration}
  onChangeText={(val) => {
    setFormData({ ...formData, registration: val }); // ❌ Immediate state update
    onDataChange({ ...formData, registration: val }); // ❌ Triggers parent re-render
  }}
/>
```

### ❌ NEVER: Pass inline functions to memoized components

```javascript
// BAD - Breaks memoization
const MemoizedInput = memo(TextInput);
return (
  <MemoizedInput
    onChange={(val) => handleChange(val)} // ❌ New function every render
  />
);
```

### ✅ ALWAYS: Use refs for latest values without dependencies

```javascript
// GOOD
const latestFormRef = useRef(formData);

useEffect(() => {
  latestFormRef.current = formData;
}, [formData]);

const handleChange = useCallback((value) => {
  const latest = latestFormRef.current; // ✓ No dependency needed
  // ... use latest
}, []); // ✓ Empty deps
```

### ✅ ALWAYS: Debounce parent notifications

```javascript
// GOOD
const notifyParent = useCallback(
  (data) => {
    if (notifyTimeout.current) clearTimeout(notifyTimeout.current);
    notifyTimeout.current = setTimeout(() => {
      onDataChange(data);
    }, 250);
  },
  [onDataChange]
);
```

## Success Criteria

### Performance Metrics

- **Render Count**: Max 2 renders per keystroke (input + parent)
- **Keyboard Persistence**: 100% - never dismisses during typing
- **Comparison Triggers**: Fixed-pricing products = 1 API call per product selection
- **Memory Leaks**: 0 - all timeouts cleaned up on unmount

### User Experience

- **No Visual Glitches**: No flickering, blinking, or jumping
- **Smooth Typing**: No lag between keystroke and character appearance
- **Instant Validation**: Errors show immediately (not debounced)
- **Preserved Behavior**: All existing features work identically

### Code Quality

- **No Debug Logs**: All emoji-prefixed console.logs removed
- **Consistent Patterns**: All inputs use same component/hook structure
- **Type Safety**: Props validated with PropTypes or TypeScript
- **Documented**: Inline comments explain complex logic

## Resources

- React Native Performance: https://reactnative.dev/docs/performance
- React Hooks Rules: https://react.dev/reference/rules/rules-of-hooks
- Memoization Guide: https://react.dev/reference/react/memo
- Debouncing Patterns: https://www.freecodecamp.org/news/javascript-debounce-example/

---

**Last Updated**: November 10, 2025  
**Status**: Ready for Implementation  
**Estimated Effort**: 8 days (1 developer)
