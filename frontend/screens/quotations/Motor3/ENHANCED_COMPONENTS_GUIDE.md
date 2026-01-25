# Motor3 Enhanced Form Components - Usage Guide

## Overview

Motor3 now includes **production-grade form components** that improve upon Motor2's implementation with better UX, performance, and validation. These components follow React Native best practices and PataBima's design system.

---

## 🎯 Key Improvements Over Motor2

### 1. **DropdownSelect** (vs basic TouchableOpacity)

- ✅ Built-in search functionality
- ✅ Auto-closes on selection (better keyboard handling)
- ✅ Empty states with helpful messages
- ✅ Loading states
- ✅ Searchable for long lists (makes, models, years)
- ✅ Max height with scroll
- ✅ Visual hierarchy (selected items highlighted)

### 2. **EnhancedCurrencyInput** (vs basic TextInput)

- ✅ Real-time thousand separators (KSh 1,000,000)
- ✅ Decimal support (optional)
- ✅ Min/max validation with clear messages
- ✅ Quick select chips for common amounts
- ✅ Visual validation feedback (✓ checkmark)
- ✅ Copy-paste handling

### 3. **Vehicle Selectors** (Make, Model, Year)

- ✅ VehicleMakeSelector: Uses catalog, shows popular makes
- ✅ VehicleModelSelector: Dynamic models based on make
- ✅ VehicleYearSelector: Smart year range (last 30 years)
- ✅ All searchable for quick selection

### 4. **Enhanced Validation**

- ✅ Kenyan-specific validators (phone, ID, KRA PIN, plates)
- ✅ Detailed error messages with examples
- ✅ Real-time validation
- ✅ Field-specific rules (tonnage max, sum insured range)

---

## 📚 Component Reference

### DropdownSelect

```javascript
import { DropdownSelect } from "../components";

<DropdownSelect
  label="Vehicle Type"
  value={formData.bodyType}
  options={[
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "truck", label: "Truck" },
    // ... more options
  ]}
  onValueChange={(value) => updateField("bodyType", value)}
  placeholder="Select vehicle type"
  required
  searchable // Enable search for long lists
  helpText="Choose the body type of the vehicle"
  error={errors.bodyType}
/>;
```

**Props:**

- `label` (string): Field label
- `value` (string): Selected value
- `options` (array): Array of strings or `{ value, label }` objects
- `onValueChange` (function): Callback when selection changes
- `placeholder` (string): Placeholder text
- `required` (boolean): Shows asterisk
- `searchable` (boolean): Enable search bar
- `loading` (boolean): Show loading spinner
- `disabled` (boolean): Disable interaction
- `helpText` (string): Help text below field
- `error` (string): Error message

---

### EnhancedCurrencyInput

```javascript
import { EnhancedCurrencyInput } from "../components";

<EnhancedCurrencyInput
  label="Sum Insured"
  value={formData.sum_insured}
  onValueChange={(value) => updateField("sum_insured", value)}
  placeholder="Enter vehicle value"
  required
  minValue={50000}
  maxValue={50000000}
  suggestedAmounts={[500000, 1000000, 2000000, 5000000]} // Quick select chips
  helpText="Market value of the vehicle"
  error={errors.sum_insured}
/>;
```

**Props:**

- `label` (string): Field label
- `value` (number): Current value
- `onValueChange` (function): Callback with parsed number
- `placeholder` (string): Placeholder text
- `required` (boolean): Shows asterisk
- `minValue` (number): Minimum allowed value
- `maxValue` (number): Maximum allowed value
- `allowDecimals` (boolean): Allow decimal input
- `suggestedAmounts` (array): Quick select chips
- `prefix` (string): Currency prefix (default: "KSh ")
- `helpText` (string): Help text
- `error` (string): Error message

---

### VehicleMakeSelector

```javascript
import { VehicleMakeSelector } from "../components";

<VehicleMakeSelector
  value={formData.make}
  onValueChange={(value) => {
    updateField("make", value);
    updateField("model", ""); // Reset model when make changes
  }}
  required
  error={errors.make}
/>;
```

**Features:**

- Uses `VEHICLE_MAKES` catalog
- Searchable dropdown
- Shows popular makes in help text
- Includes "Other" option for manual entry

---

### VehicleModelSelector

```javascript
import { VehicleModelSelector } from "../components";

<VehicleModelSelector
  value={formData.model}
  selectedMake={formData.make} // Required: filters models by make
  onValueChange={(value) => updateField("model", value)}
  required
  error={errors.model}
/>;
```

**Features:**

- Dynamic models based on `selectedMake`
- Disabled until make is selected
- Uses `getModelsForMake()` from catalog
- Searchable for long model lists

---

### VehicleYearSelector

```javascript
import { VehicleYearSelector } from "../components";

<VehicleYearSelector
  value={formData.year}
  onValueChange={(value) => updateField("year", value)}
  required
  minYear={1990} // Optional: custom range
  maxYear={2025}
  error={errors.year}
/>;
```

**Features:**

- Generates last 30 years by default
- Searchable dropdown
- Shows recent years in help text

---

## 🔧 Validation Usage

### Example: Validate Registration Number

```javascript
import { validateKenyanRegistration } from "../utils/enhancedValidation";

const handleRegistrationChange = (value) => {
  updateField("registrationNumber", value);

  // Validate
  const result = validateKenyanRegistration(value);

  if (!result.valid) {
    setErrors({ registrationNumber: result.message });
  } else {
    clearError("registrationNumber");
  }
};
```

### Example: Batch Validation

```javascript
import {
  validateFields,
  validateKenyanRegistration,
  validateCoverStartDate,
} from "../utils/enhancedValidation";

const validateForm = () => {
  const { isValid, errors } = validateFields({
    registrationNumber: {
      value: formData.registrationNumber,
      validator: validateKenyanRegistration,
    },
    cover_start_date: {
      value: formData.cover_start_date,
      validator: validateCoverStartDate,
    },
    sum_insured: {
      value: formData.sum_insured,
      validator: validateSumInsured,
      minValue: 50000,
      maxValue: 50000000,
    },
  });

  if (!isValid) {
    setErrors(errors);
    return false;
  }

  return true;
};
```

---

## 🎨 Complete Form Example

```javascript
import React, { useCallback } from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import {
  StableTextInput,
  RadioGroup,
  DatePicker,
  DropdownSelect,
  EnhancedCurrencyInput,
  VehicleMakeSelector,
  VehicleModelSelector,
  VehicleYearSelector,
} from "../components";
import { validateKenyanRegistration } from "../utils/enhancedValidation";

const EnhancedVehicleForm = () => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }, []);

  const clearError = useCallback((field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Section 1: Vehicle Identification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Identification</Text>

        <RadioGroup
          label="Identification Type"
          options={[
            { value: "registration", label: "Vehicle Registration" },
            { value: "logbook", label: "Logbook Number" },
          ]}
          value={formData.identificationType}
          onValueChange={(value) => updateField("identificationType", value)}
          required
          horizontal
        />

        <StableTextInput
          label="Registration Number"
          value={formData.registrationNumber}
          onChangeText={(value) => {
            updateField("registrationNumber", value);
            const result = validateKenyanRegistration(value);
            if (!result.valid) {
              setErrors({ registrationNumber: result.message });
            }
          }}
          placeholder="e.g., KDA 123A"
          autoCapitalize="characters"
          required
          error={errors.registrationNumber}
        />
      </View>

      {/* Section 2: Vehicle Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>

        <VehicleMakeSelector
          value={formData.make}
          onValueChange={(value) => {
            updateField("make", value);
            updateField("model", ""); // Reset model
          }}
          required
          error={errors.make}
        />

        <VehicleModelSelector
          value={formData.model}
          selectedMake={formData.make}
          onValueChange={(value) => updateField("model", value)}
          required
          error={errors.model}
        />

        <VehicleYearSelector
          value={formData.year}
          onValueChange={(value) => updateField("year", value)}
          required
          error={errors.year}
        />

        <DropdownSelect
          label="Body Type"
          value={formData.bodyType}
          options={["Sedan", "SUV", "Truck", "Van", "Coupe", "Hatchback"]}
          onValueChange={(value) => updateField("bodyType", value)}
          required
          searchable
          error={errors.bodyType}
        />
      </View>

      {/* Section 3: Cover Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cover Details</Text>

        <DatePicker
          label="Cover Start Date"
          value={formData.cover_start_date}
          onValueChange={(value) => updateField("cover_start_date", value)}
          required
          minDate={new Date()}
          error={errors.cover_start_date}
        />

        <EnhancedCurrencyInput
          label="Sum Insured"
          value={formData.sum_insured}
          onValueChange={(value) => updateField("sum_insured", value)}
          required
          minValue={50000}
          maxValue={50000000}
          suggestedAmounts={[500000, 1000000, 2000000, 5000000]}
          helpText="Market value of the vehicle"
          error={errors.sum_insured}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  section: {
    backgroundColor: "#FFF",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 16,
  },
});

export default EnhancedVehicleForm;
```

---

## 🚀 Migration Path (Motor2 → Motor3)

### Before (Motor2):

```javascript
// Basic TextInput with manual formatting
<TextInput
  value={formData.sum_insured}
  onChangeText={(text) => {
    const cleaned = text.replace(/,/g, "");
    handleChange("sum_insured", cleaned);
  }}
  placeholder="Enter sum insured"
  keyboardType="numeric"
/>
```

### After (Motor3):

```javascript
// EnhancedCurrencyInput with automatic formatting
<EnhancedCurrencyInput
  label="Sum Insured"
  value={formData.sum_insured}
  onValueChange={(value) => updateField("sum_insured", value)}
  minValue={50000}
  maxValue={50000000}
  suggestedAmounts={[500000, 1000000, 2000000]}
  required
  error={errors.sum_insured}
/>
```

---

## 📋 Best Practices

1. **Always use debouncing for text inputs** (handled by `StableTextInput`)
2. **Validate on blur, not on every keystroke** (better UX)
3. **Show helpful error messages with examples** (enhancedValidation.js)
4. **Use searchable dropdowns for lists > 10 items**
5. **Provide quick select options for common values** (currency, tonnage)
6. **Group related fields in sections** (better visual hierarchy)
7. **Clear dependent fields when parent changes** (model when make changes)
8. **Use React.memo with custom comparators** (prevent re-renders)

---

## 🎯 Result

Motor3 now has **production-ready form components** that:

- ✅ Provide better UX than Motor2
- ✅ Follow PataBima design system
- ✅ Handle edge cases (copy-paste, invalid input)
- ✅ Include Kenyan-specific validation
- ✅ Are fully reusable across all Motor3 flows
- ✅ Maintain Motor2's logic but with better implementation
