# Motor3 Rebuild Guide: Clean Architecture Without Re-render Issues

**Status**: Planning Phase  
**Date**: December 1, 2025  
**Purpose**: Rebuild Motor insurance flow with separate paths for Third Party and Comprehensive, eliminating the performance issues in Motor2

---

## Executive Summary

Motor2 has a critical performance issue: **radio button selections and text input trigger 4+ full re-renders**, causing keyboard dismissal and poor UX. The root cause is a monolithic `DynamicVehicleForm` (2092 lines) that tries to handle all insurance types with complex state synchronization.

**Motor3 Solution**: Separate form components for Third Party and Comprehensive with dedicated state management.

---

## Problem Analysis: Why Motor2 Has Re-render Issues

### Current Motor2 Architecture Issues

```
┌─────────────────────────────────────────────────────────────────┐
│ PolicyDetailsStep.js                                            │
│ - Creates initialData via useMemo with 9+ dependencies         │
│ - Every field change recreates initialData object               │
│ - Passes initialData to DynamicVehicleForm                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ DynamicVehicleForm.js (2092 lines - TOO COMPLEX)               │
│ - Wrapped in React.memo with custom comparator                 │
│ - Comparator fails because initialData changes identity         │
│ - Re-renders on EVERY parent update                            │
│ - useEffect triggers underwriter comparison                     │
│ - Sets hasComparisonsRef AFTER render (timing issue)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────────────────────────┐
         │ User selects radio button (Yes/No)     │
         │ Field updates → initialData recreated  │
         │ → DynamicVehicleForm re-renders        │
         │ → useEffect runs → Comparison triggers │
         │ → 2 more renders → Keyboard dismissed  │
         └────────────────────────────────────────┘
```

### Specific Issues

1. **Unstable initialData Prop**:

   ```javascript
   // PolicyDetailsStep.js - PROBLEM
   const initialData = useMemo(
     () => ({
       ...state.sharedVehicleData,
       ...currentPricingData,
     }),
     [
       state.sharedVehicleData?.financialInterest, // ❌ Changes on radio toggle
       state.sharedVehicleData?.identificationType, // ❌ Changes on radio toggle
       // ... 7 more dependencies
     ]
   );
   ```

2. **Comparison Re-triggering**:

   ```javascript
   // DynamicVehicleForm.js - PROBLEM
   useEffect(() => {
     if (!hasComparisonsRef.current) {
       triggerUnderwriterComparison(); // ❌ Runs on every re-render
     }
   }, [comparisonKey]); // ❌ comparisonKey changes on field updates
   ```

3. **Race Condition with Refs**:
   ```javascript
   // hasComparisonsRef set AFTER render completes
   // But radio button clicks happen DURING render
   // Result: ref not updated in time, comparison triggers again
   ```

---

## Motor3 Architecture: Separation of Concerns

### Core Design Principles

1. **Separate Forms**: Third Party and Comprehensive get dedicated form components
2. **Stable Props**: Forms receive stable configuration objects, not volatile data
3. **Internal State**: Forms manage their own state, parent only receives final data
4. **No Prop Drilling**: Use Context selectively, refs for non-visual state
5. **Memoization**: Only memoize expensive computations, not every object
6. **React Native Best Practices**: Follow official React Native Performance guidelines
7. **Product Feedback Integration**: All 60+ motor products from CSV feedback included

### Directory Structure

```
frontend/screens/quotations/Motor3/
├── index.js                          # Export barrel
├── MotorInsuranceContainer.js        # Main orchestrator (simplified)
├── QuoteSuccessScreen.js             # Success screen (unchanged)
│
├── shared/                           # Shared components across flows
│   ├── CategorySelection/
│   │   ├── MotorCategoryGrid.js     # Category cards (PRIVATE, COMMERCIAL, etc.)
│   │   └── MotorSubcategoryList.js  # Subcategory selector
│   ├── ClientDetails/
│   │   └── EnhancedClientForm.js    # Client info form (KYC + contact)
│   ├── DocumentsUpload/
│   │   └── DocumentsUpload.js       # Logbook/receipt uploads
│   ├── Payment/
│   │   ├── PaymentOptions.js        # M-PESA, DPO Pay, etc.
│   │   └── PaymentSummary.js        # Final premium display
│   ├── Submission/
│   │   └── PolicySubmission.js      # Final submission step
│   └── UnderwriterComparison/
│       ├── UnderwriterCard.js       # Individual underwriter pricing card
│       └── UnderwriterList.js       # Scrollable list of underwriters
│
├── third-party/                      # Third Party specific flow
│   ├── ThirdPartyFlow.js            # Step orchestrator for Third Party
│   ├── steps/
│   │   ├── TPCategorySelectionStep.js
│   │   ├── TPVehicleDetailsStep.js  # Registration, cover date, financial interest
│   │   ├── TPUnderwriterSelectionStep.js  # Select from auto-loaded underwriters
│   │   ├── TPKYCStep.js             # ID upload + DMVIC verification
│   │   ├── TPDocumentsStep.js       # Logbook/receipt (optional)
│   │   ├── TPClientDetailsStep.js   # Client info confirmation
│   │   ├── TPPaymentStep.js         # Payment processing
│   │   └── TPSubmissionStep.js      # Final submission
│   ├── components/
│   │   ├── TPVehicleForm.js         # Dedicated Third Party form (< 400 lines)
│   │   ├── TPFieldLocks.js          # Auto-fill locks for DMVIC data
│   │   └── TPUnderwriterSelector.js # Underwriter cards with instant load
│   └── hooks/
│       ├── useThirdPartyForm.js     # Form state management
│       └── useTPUnderwriters.js     # Auto-load underwriters on mount
│
├── comprehensive/                    # Comprehensive specific flow
│   ├── ComprehensiveFlow.js         # Step orchestrator for Comprehensive
│   ├── steps/
│   │   ├── CompCategorySelectionStep.js
│   │   ├── CompVehicleDetailsStep.js  # Full vehicle details + sum insured
│   │   ├── CompUnderwriterSelectionStep.js  # Select after sum insured entered
│   │   ├── CompAddonsStep.js        # Optional add-ons
│   │   ├── CompClientDetailsStep.js # Client info
│   │   ├── CompPaymentStep.js       # Payment processing
│   │   └── CompSubmissionStep.js    # Final submission
│   ├── components/
│   │   ├── CompVehicleForm.js       # Dedicated Comprehensive form (< 500 lines)
│   │   ├── SumInsuredInput.js       # Currency input with formatting
│   │   ├── VehicleMakeModelSelector.js  # Cascading dropdowns
│   │   └── CompUnderwriterSelector.js   # Underwriter cards (debounced load)
│   └── hooks/
│       ├── useComprehensiveForm.js  # Form state management
│       └── useCompUnderwriters.js   # Debounced underwriter comparison
│
├── contexts/
│   ├── Motor3Context.js             # Lightweight context for flow state
│   ├── ThirdPartyContext.js         # Third Party specific state
│   └── ComprehensiveContext.js      # Comprehensive specific state
│
└── utils/
    ├── motor3Validation.js          # Validation rules
    ├── premiumCalculations.js       # Levy calculations
    └── fieldClassification.js       # Shared vs pricing fields

```

---

## React Native Best Practices Integration

### Official React Native Performance Guidelines Applied

Motor3 implements all critical performance optimizations from [React Native Performance docs](https://reactnative.dev/docs/performance):

#### 1. **Remove Console Logs in Production**

```javascript
// utils/logger.js
const isDevelopment = __DEV__;

export const log = isDevelopment ? console.log : () => {};
export const warn = isDevelopment ? console.warn : () => {};
export const error = console.error; // Always log errors

// Usage in components
import { log } from "@utils/logger";
log("[TPVehicleForm] Render triggered"); // Only in dev
```

#### 2. **Use `React.memo` Correctly**

```javascript
// ✅ CORRECT: Shallow comparison with custom comparator
const RadioGroup = memo(
  ({ options, selected, onSelect }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Only re-render if selected value changes
    return prevProps.selected === nextProps.selected;
    // ❌ DON'T compare: options, onSelect (stable references)
  }
);

// ❌ WRONG: Comparing all props (causes unnecessary re-renders)
const BadComponent = memo(Component); // Default shallow comparison fails on functions
```

#### 3. **useCallback for Event Handlers**

```javascript
// ✅ CORRECT: Stable function reference
const handlePress = useCallback(
  (value) => {
    dispatch({
      type: "UPDATE_FIELD",
      payload: { field: "financialInterest", value },
    });
  },
  [dispatch]
); // dispatch is stable from useReducer

// ❌ WRONG: Inline arrow function (new reference every render)
<TouchableOpacity onPress={() => updateField(value)} />; // Re-renders child every time
```

#### 4. **useMemo for Expensive Computations**

```javascript
// ✅ CORRECT: Memoize expensive operations
const sortedUnderwriters = useMemo(() => {
  return underwriters
    .sort((a, b) => a.total_premium - b.total_premium)
    .slice(0, 10); // Top 10 only
}, [underwriters]);

// ❌ WRONG: Computing on every render
const sortedUnderwriters = underwriters.sort(...); // Re-sorts every render
```

#### 5. **FlatList Optimization**

```javascript
// ✅ CORRECT: All optimization props
<FlatList
  data={underwriters}
  renderItem={renderUnderwriter}
  keyExtractor={(item) => item.id}
  initialNumToRender={5}           // Render 5 items initially
  maxToRenderPerBatch={5}          // Render 5 more per scroll
  windowSize={10}                  // Keep 10 screens worth in memory
  removeClippedSubviews={true}     // Unmount off-screen views (Android performance boost)
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>

// ❌ WRONG: No optimization
<FlatList data={data} renderItem={renderItem} /> // Renders all items at once
```

#### 6. **Avoid Inline Styles**

```javascript
// ✅ CORRECT: StyleSheet.create (optimized)
const styles = StyleSheet.create({
  container: { padding: 16 },
  text: { fontSize: 14 },
});

// ❌ WRONG: Inline objects (new reference every render)
<View style={{ padding: 16 }} />; // Forces re-render
```

#### 7. **InteractionManager for Heavy Operations**

```javascript
// ✅ CORRECT: Defer heavy work after animations
import { InteractionManager } from "react-native";

useEffect(() => {
  const task = InteractionManager.runAfterInteractions(() => {
    // Heavy computation here (e.g., load 100+ underwriters)
    loadUnderwritersFromCache();
  });

  return () => task.cancel();
}, []);

// ❌ WRONG: Blocking main thread during animation
useEffect(() => {
  loadUnderwriters(); // Causes animation jank
}, []);
```

#### 8. **Keyboard Handling (Critical for Forms)**

```javascript
// ✅ CORRECT: Keep keyboard open during typing
<TextInput
  value={value}
  onChangeText={onChange}
  blurOnSubmit={false} // Don't dismiss keyboard on submit
  returnKeyType="next" // Show "Next" button
  onSubmitEditing={focusNext} // Move to next field
/>

// ❌ WRONG: Keyboard dismisses on state update
// This happens when parent re-renders with new initialData prop
```

#### 9. **Use Native Driver for Animations**

```javascript
// ✅ CORRECT: Native driver (runs on UI thread)
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅ GPU-accelerated
}).start();

// ❌ WRONG: JS driver (runs on JS thread, blocks UI)
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: false, // ❌ Causes jank
}).start();
```

#### 10. **Debounce User Input**

```javascript
// ✅ CORRECT: Debounce expensive operations
const [localValue, setLocalValue] = useState("");

const handleChange = useCallback(
  (value) => {
    setLocalValue(value); // Update local state immediately (smooth typing)

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      dispatch({ type: "UPDATE", payload: value }); // Update context after 400ms
    }, 400);
  },
  [dispatch]
);

// ❌ WRONG: Update parent state on every keystroke
const handleChange = (value) => {
  dispatch({ type: "UPDATE", payload: value }); // Causes re-renders
};
```

---

## CSV Feedback Integration: All 60+ Motor Products

### Product Coverage from PATA BIMA APP FEEDBACK.xlsx

Motor3 architecture supports **ALL 60+ motor insurance products** from stakeholder feedback:

#### **Private Motor (5 products)**

| Product                   | Financial Interest | Registration | Valuation     | Year          | Make          | Model         | Add-ons                             | Notes                     |
| ------------------------- | ------------------ | ------------ | ------------- | ------------- | ------------- | ------------- | ----------------------------------- | ------------------------- |
| Private TOR               | YES/NO             | YES          | N/A           | N/A           | N/A           | N/A           | N/A                                 | FIXED pricing             |
| Private TPO               | YES/NO             | YES          | N/A           | N/A           | N/A           | N/A           | N/A                                 | FIXED pricing             |
| Private TPO Extendible    | YES/NO             | YES          | N/A           | N/A           | N/A           | N/A           | N/A                                 | Can extend within 90 days |
| Private Motor Cycle TPO   | YES/NO             | YES          | N/A           | N/A           | N/A           | N/A           | N/A                                 | Motorcycle specific       |
| **Private Comprehensive** | YES/NO             | YES          | **YES ≥500K** | **Mandatory** | **Mandatory** | **Mandatory** | Windscreen, Radio, PVT, Loss of Use | **BRACKET pricing**       |

**Comprehensive Requirements**:

- Sum Insured: Minimum KSh 500,000
- Mandatory fields: Year, Make, Model, Windscreen Value, Radio Cassette Value, No. of Passengers
- Optional add-ons: Excess Protector, PVT (Political Violence & Terrorism), Loss of Use
- Windscreen Premium: If value ≤ KSh 30,000
- Radio Cassette Premium: If value ≥ KSh 30,000
- **Initial Cover**: Strictly 30 days pending valuation for sum insured adjustment
- **Rare Models**: Pure EVs, Jaguar, Chevrolet, Ford, Cherry, Bentley, Audi attract higher premiums (cash-in-lieu claims only)
- **Exhaustive Models**: Sienta, Wish, Probox, Succeed, Ractis, Noah, VOXY, Honda, Suzuki (user declaration form required)
- **Financial Interest**: If YES, cover jointly issued to both parties (dual ownership)
- **Premium Instalments**: 3 instalments (40%, 30%, 30%) or 4 instalments (25%, 25%, 25%, 25%)

#### **PSV Motor (12 products)**

| Product                        | Financial Interest | Registration | Tonnage | Passengers    | Type | Add-ons                             | Notes                       |
| ------------------------------ | ------------------ | ------------ | ------- | ------------- | ---- | ----------------------------------- | --------------------------- |
| PSV Uber TOR                   | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | FIXED pricing               |
| PSV Uber TPO                   | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | FIXED pricing               |
| PSV Uber TPO Extendible        | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | Extendible                  |
| PSV Tuk Tuk TPO                | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | PASSENGER pricing           |
| PSV Tuk Tuk TPO Extendible     | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | Extendible                  |
| PSV Matatu TPO 1 month         | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | Short-term cover            |
| PSV Matatu TPO 2 Weeks         | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | Short-term cover            |
| PSV Plain TPO                  | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | FIXED pricing               |
| PSV Tour Van TPO               | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | FIXED pricing               |
| PSV Tour Van TPO Extendible    | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | N/A                                 | Extendible                  |
| **PSV UBER Comprehensive**     | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | Windscreen, Radio, PVT, Loss of Use | BRACKET + PASSENGER pricing |
| **PSV Tour Van Comprehensive** | YES/NO             | YES          | N/A     | **Mandatory** | N/A  | Windscreen, Radio, PVT, Loss of Use | BRACKET + PASSENGER pricing |

**PSV Requirements**:

- Passenger capacity: Mandatory for ALL PSV products
- Comprehensive: Sum Insured ≥ KSh 500,000 + all add-ons available

#### **Commercial Motor (10 products)**

| Product                                               | Financial Interest | Registration | Tonnage                | Add-ons                             | Notes                     |
| ----------------------------------------------------- | ------------------ | ------------ | ---------------------- | ----------------------------------- | ------------------------- |
| Commercial TOR                                        | YES/NO             | YES          | **Mandatory ≤31 tons** | N/A                                 | TONNAGE pricing           |
| Commercial Own Goods TPO                              | YES/NO             | YES          | **Mandatory ≤31 tons** | N/A                                 | TONNAGE pricing           |
| Commercial Own Goods TPO Extendible                   | YES/NO             | YES          | **Mandatory ≤31 tons** | N/A                                 | Extendible                |
| Commercial General Cartage TPO                        | YES/NO             | YES          | **Mandatory ≤31 tons** | N/A                                 | TONNAGE pricing           |
| Commercial General Cartage TPO Extendible             | YES/NO             | YES          | **Mandatory ≤31 tons** | N/A                                 | Extendible                |
| Commercial Tuk Tuk TPO                                | YES/NO             | YES          | **Mandatory ≤31 tons** | N/A                                 | TONNAGE pricing           |
| Commercial Tuk Tuk TPO Extendible                     | YES/NO             | YES          | **Mandatory ≤31 tons** | N/A                                 | Extendible                |
| Commercial General Cartage TPO Prime Mover            | YES/NO             | YES          | **Mandatory ≤31 tons** | N/A                                 | Prime mover flag          |
| Commercial General Cartage TPO Prime Mover Extendible | YES/NO             | YES          | **Mandatory ≤31 tons** | N/A                                 | Prime mover + extendible  |
| **Commercial Comprehensive (3 types)**                | YES/NO             | YES          | **Mandatory ≤31 tons** | Windscreen, Radio, PVT, Loss of Use | TONNAGE + BRACKET pricing |

**Commercial Comprehensive Types**:

1. Commercial Tuk Tuk Comprehensive (Tonnage + Valuation)
2. General Cartage Comprehensive (Tonnage + Valuation)
3. Own Goods Comprehensive (Tonnage + Valuation)

**Commercial Requirements**:

- Tonnage: Mandatory for ALL commercial products (≤31 tons)
- Prime Mover: Special flag for trailer-pulling trucks

#### **Motor Special Classes (11 products)**

| Product                                    | Financial Interest | Registration | Tonnage       | Passengers    | Type              | Add-ons                             | Notes                         |
| ------------------------------------------ | ------------------ | ------------ | ------------- | ------------- | ----------------- | ----------------------------------- | ----------------------------- |
| Agricultural Tractor TPO                   | YES/NO             | YES          | **Mandatory** | N/A           | N/A               | N/A                                 | TONNAGE pricing               |
| Commercial Institutional TPO               | YES/NO             | YES          | N/A           | **Mandatory** | **Student/Adult** | N/A                                 | PASSENGER pricing             |
| Commercial Institutional TPO Extendible    | YES/NO             | YES          | **Mandatory** | **Mandatory** | **Student/Adult** | N/A                                 | Extendible                    |
| KG Plate TPO                               | YES/NO             | YES          | N/A           | N/A           | N/A               | N/A                                 | Government plates             |
| Driving School TPO                         | YES/NO             | YES          | **Mandatory** | **Mandatory** | N/A               | N/A                                 | TONNAGE + PASSENGER           |
| **Agricultural Tractor Comprehensive**     | YES/NO             | YES          | **Mandatory** | N/A           | N/A               | Windscreen, Radio, PVT, Loss of Use | TONNAGE + BRACKET             |
| **Commercial Institutional Comprehensive** | YES/NO             | YES          | **Mandatory** | N/A           | N/A               | Windscreen, Radio, PVT, Loss of Use | TONNAGE + BRACKET             |
| **Driving School Comprehensive**           | YES/NO             | YES          | **Mandatory** | **Mandatory** | N/A               | Windscreen, Radio, PVT, Loss of Use | TONNAGE + PASSENGER + BRACKET |
| **Fuel Tanker Comprehensive**              | YES/NO             | YES          | **Mandatory** | N/A           | N/A               | Windscreen, Radio, PVT, Loss of Use | TONNAGE + BRACKET             |
| **Commercial Ambulance Comprehensive**     | YES/NO             | YES          | N/A           | N/A           | N/A               | Windscreen, Radio, PVT, Loss of Use | BRACKET only                  |

**Special Class Notes**:

- Logo replacement: Use Tanker/Ambulance/Tractor icons instead of car
- Commercial Institutional: Student vs Adult passenger type affects pricing
- KG Plate: Government vehicle special category

#### **Tuk Tuk (6 products) - Duplicate Category**

_Note: Already covered in PSV and Commercial categories above_

| Product                           | Category   | Passengers    | Tonnage       | Notes               |
| --------------------------------- | ---------- | ------------- | ------------- | ------------------- |
| PSV Tuk Tuk TPO                   | PSV        | **Mandatory** | N/A           | PASSENGER pricing   |
| PSV Tuk Tuk TPO Extendible        | PSV        | **Mandatory** | N/A           | Extendible          |
| Commercial Tuk Tuk TPO            | Commercial | N/A           | **Mandatory** | TONNAGE pricing     |
| Commercial Tuk Tuk TPO Extendible | Commercial | N/A           | **Mandatory** | Extendible          |
| Commercial Tuk Tuk Comprehensive  | Commercial | N/A           | **Mandatory** | TONNAGE + BRACKET   |
| PSV Tuk Tuk Comprehensive         | PSV        | **Mandatory** | N/A           | PASSENGER + BRACKET |

**Optional Add-ons for Tuk Tuk**:

- Excess Protector (Optional)
- PVT (Optional)
- Loss of Use (Optional)

#### **Motor Cycle (6 products)**

| Product                               | Financial Interest | Registration | Passengers    | Add-ons                                       | Notes                    |
| ------------------------------------- | ------------------ | ------------ | ------------- | --------------------------------------------- | ------------------------ |
| Private Motor Cycle TPO               | YES/NO             | YES          | N/A           | Excess Protector, PVT, Loss of Use (Optional) | FIXED pricing            |
| PSV Motor Cycle TPO (Annual)          | YES/NO             | YES          | **Mandatory** | Excess Protector, PVT, Loss of Use (Optional) | PASSENGER pricing        |
| PSV Motor Cycle TPO (6 Months)        | YES/NO             | YES          | **Mandatory** | Excess Protector, PVT, Loss of Use (Optional) | Short-term cover         |
| **Private Motor Cycle Comprehensive** | YES/NO             | YES          | N/A           | Excess Protector, PVT, Loss of Use (Optional) | BRACKET pricing          |
| **PSV Motor Cycle Comprehensive**     | YES/NO             | YES          | **Mandatory** | Excess Protector, PVT, Loss of Use (Optional) | PASSENGER + BRACKET      |
| **PSV Motor Cycle (6 Months)**        | YES/NO             | YES          | **Mandatory** | Excess Protector, PVT, Loss of Use (Optional) | Short-term comprehensive |

---

## Motor3 Product Implementation Strategy

### Form Field Configuration by Product Type

Motor3 uses **dynamic form generation** based on product metadata:

```javascript
// utils/productFieldConfig.js

export const PRODUCT_FIELD_CONFIG = {
  // FIXED Pricing Products (Third Party Flow)
  FIXED: {
    requiredFields: [
      "registrationNumber",
      "identificationType",
      "cover_start_date",
      "financialInterest",
    ],
    optionalFields: [],
    pricingFields: [], // No pricing inputs needed
    addons: [],
    autoLoadUnderwriters: true, // Load immediately on mount
  },

  // BRACKET Pricing Products (Comprehensive Flow)
  BRACKET: {
    requiredFields: [
      "registrationNumber",
      "year",
      "make",
      "model",
      "sum_insured", // Minimum 500,000
      "windscreen_value",
      "radio_cassette_value",
      "cover_start_date",
      "financialInterest",
    ],
    optionalFields: [
      "engineNumber",
      "chasisNumber",
      "color",
      "bodyType",
      "purpose",
    ],
    pricingFields: ["sum_insured"],
    addons: [
      {
        id: "windscreen",
        label: "Windscreen Cover",
        condition: "value <= 30000",
      },
      {
        id: "radio_cassette",
        label: "Radio Cassette Cover",
        condition: "value >= 30000",
      },
      {
        id: "excess_protector",
        label: "Excess Protector",
        condition: "optional",
      },
      {
        id: "pvt",
        label: "Political Violence & Terrorism (PVT)",
        condition: "optional",
      },
      { id: "loss_of_use", label: "Loss of Use", condition: "optional" },
    ],
    autoLoadUnderwriters: false, // Load after sum_insured entered
    validationRules: {
      sum_insured: {
        min: 500000,
        message: "Minimum sum insured is KSh 500,000",
      },
      initial_cover_period: {
        days: 30,
        message: "Initial cover strictly 30 days pending valuation",
      },
    },
  },

  // TONNAGE Pricing Products (Commercial Flow)
  TONNAGE: {
    requiredFields: [
      "registrationNumber",
      "tonnage", // ≤31 tons
      "cover_start_date",
      "financialInterest",
    ],
    optionalFields: [
      "is_prime_mover", // Prime mover flag
    ],
    pricingFields: ["tonnage", "is_prime_mover"],
    addons: [],
    autoLoadUnderwriters: false, // Load after tonnage entered
    validationRules: {
      tonnage: { max: 31, message: "Maximum tonnage is 31 tons" },
    },
  },

  // PASSENGER Pricing Products (PSV Flow)
  PASSENGER: {
    requiredFields: [
      "registrationNumber",
      "capacity", // Passenger capacity
      "passenger_type", // Student/Adult (for institutional)
      "cover_start_date",
      "financialInterest",
    ],
    optionalFields: [],
    pricingFields: [
      "capacity",
      "is_commercial_institutional",
      "passenger_type",
    ],
    addons: [],
    autoLoadUnderwriters: false, // Load after capacity entered
    validationRules: {
      capacity: { min: 1, message: "Minimum 1 passenger" },
    },
  },

  // HYBRID Products (e.g., Driving School Comprehensive)
  TONNAGE_PASSENGER_BRACKET: {
    requiredFields: [
      "registrationNumber",
      "tonnage",
      "capacity",
      "sum_insured",
      "year",
      "make",
      "model",
      "cover_start_date",
      "financialInterest",
    ],
    optionalFields: [],
    pricingFields: ["tonnage", "capacity", "sum_insured"],
    addons: [
      { id: "windscreen", label: "Windscreen Cover" },
      { id: "radio_cassette", label: "Radio Cassette Cover" },
      { id: "excess_protector", label: "Excess Protector" },
      { id: "pvt", label: "PVT" },
      { id: "loss_of_use", label: "Loss of Use" },
    ],
    autoLoadUnderwriters: false,
  },
};

// Product to pricing model mapping
export const PRODUCT_PRICING_MODEL = {
  // Private
  PRIVATE_TOR: "FIXED",
  PRIVATE_THIRD_PARTY: "FIXED",
  PRIVATE_THIRD_PARTY_EXTENDIBLE: "FIXED",
  PRIVATE_MOTORCYCLE_TPO: "FIXED",
  PRIVATE_COMPREHENSIVE: "BRACKET",

  // PSV
  PSV_UBER_TOR: "FIXED",
  PSV_UBER_TPO: "FIXED",
  PSV_UBER_TPO_EXTENDIBLE: "FIXED",
  PSV_TUKTUK_TPO: "PASSENGER",
  PSV_TUKTUK_TPO_EXTENDIBLE: "PASSENGER",
  PSV_MATATU_TPO_1MONTH: "PASSENGER",
  PSV_MATATU_TPO_2WEEKS: "PASSENGER",
  PSV_PLAIN_TPO: "PASSENGER",
  PSV_TOURVAN_TPO: "PASSENGER",
  PSV_TOURVAN_TPO_EXTENDIBLE: "PASSENGER",
  PSV_UBER_COMPREHENSIVE: "BRACKET",
  PSV_TOURVAN_COMPREHENSIVE: "BRACKET",

  // Commercial
  COMMERCIAL_TOR: "TONNAGE",
  COMMERCIAL_OWN_GOODS_TPO: "TONNAGE",
  COMMERCIAL_OWN_GOODS_TPO_EXTENDIBLE: "TONNAGE",
  COMMERCIAL_GENERAL_CARTAGE_TPO: "TONNAGE",
  COMMERCIAL_GENERAL_CARTAGE_TPO_EXTENDIBLE: "TONNAGE",
  COMMERCIAL_TUKTUK_TPO: "TONNAGE",
  COMMERCIAL_TUKTUK_TPO_EXTENDIBLE: "TONNAGE",
  COMMERCIAL_GENERAL_CARTAGE_TPO_PRIME_MOVER: "TONNAGE",
  COMMERCIAL_GENERAL_CARTAGE_TPO_PRIME_MOVER_EXTENDIBLE: "TONNAGE",
  COMMERCIAL_TUKTUK_COMPREHENSIVE: "TONNAGE",
  COMMERCIAL_GENERAL_CARTAGE_COMPREHENSIVE: "TONNAGE",
  COMMERCIAL_OWN_GOODS_COMPREHENSIVE: "TONNAGE",

  // Special Classes
  SPECIAL_AGRICULTURAL_TRACTOR_TPO: "TONNAGE",
  SPECIAL_COMMERCIAL_INSTITUTIONAL_TPO: "PASSENGER",
  SPECIAL_COMMERCIAL_INSTITUTIONAL_TPO_EXTENDIBLE: "PASSENGER",
  SPECIAL_KG_PLATE_TPO: "FIXED",
  SPECIAL_DRIVING_SCHOOL_TPO: "TONNAGE_PASSENGER",
  SPECIAL_AGRICULTURAL_TRACTOR_COMPREHENSIVE: "TONNAGE",
  SPECIAL_COMMERCIAL_INSTITUTIONAL_COMPREHENSIVE: "TONNAGE",
  SPECIAL_DRIVING_SCHOOL_COMPREHENSIVE: "TONNAGE_PASSENGER_BRACKET",
  SPECIAL_FUEL_TANKER_COMPREHENSIVE: "TONNAGE",
  SPECIAL_COMMERCIAL_AMBULANCE_COMPREHENSIVE: "BRACKET",

  // Motorcycles
  MOTORCYCLE_PRIVATE_TPO: "FIXED",
  MOTORCYCLE_PSV_TPO_ANNUAL: "PASSENGER",
  MOTORCYCLE_PSV_TPO_6MONTHS: "PASSENGER",
  MOTORCYCLE_PRIVATE_COMPREHENSIVE: "BRACKET",
  MOTORCYCLE_PSV_COMPREHENSIVE: "PASSENGER",
  MOTORCYCLE_PSV_COMPREHENSIVE_6MONTHS: "PASSENGER",
};

// Get field configuration for a product
export function getProductFieldConfig(productCode) {
  const pricingModel = PRODUCT_PRICING_MODEL[productCode];
  return PRODUCT_FIELD_CONFIG[pricingModel] || PRODUCT_FIELD_CONFIG.FIXED;
}
```

### Dynamic Form Rendering

```javascript
// third-party/components/DynamicProductForm.js

import React from "react";
import { View } from "react-native";
import { getProductFieldConfig } from "@utils/productFieldConfig";
import StableTextInput from "@components/common/StableTextInput";
import RadioGroup from "@components/common/RadioGroup";
import CurrencyInput from "@components/common/CurrencyInput";
import TonnageSelector from "@components/common/TonnageSelector";
import PassengerCapacityInput from "@components/common/PassengerCapacityInput";

export default function DynamicProductForm({ productCode, state, dispatch }) {
  const config = getProductFieldConfig(productCode);

  return (
    <View>
      {/* Always render common fields */}
      <StableTextInput
        label="Vehicle Registration *"
        value={state.registrationNumber}
        onChangeText={(value) =>
          dispatch({
            type: "UPDATE_FIELD",
            payload: { field: "registrationNumber", value },
          })
        }
      />

      {/* Conditionally render pricing fields */}
      {config.pricingFields.includes("sum_insured") && (
        <CurrencyInput
          label="Sum Insured *"
          value={state.sum_insured}
          onChangeText={(value) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { field: "sum_insured", value },
            })
          }
          helperText={config.validationRules?.sum_insured?.message}
        />
      )}

      {config.pricingFields.includes("tonnage") && (
        <TonnageSelector
          label="Vehicle Tonnage *"
          value={state.tonnage}
          onChange={(value) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { field: "tonnage", value },
            })
          }
          max={config.validationRules?.tonnage?.max}
        />
      )}

      {config.pricingFields.includes("capacity") && (
        <PassengerCapacityInput
          label="Passenger Capacity *"
          value={state.capacity}
          onChange={(value) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { field: "capacity", value },
            })
          }
        />
      )}

      {config.pricingFields.includes("is_prime_mover") && (
        <RadioGroup
          label="Is Prime Mover?"
          options={[
            { label: "Yes", value: true },
            { label: "No", value: false },
          ]}
          selected={state.is_prime_mover}
          onSelect={(value) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { field: "is_prime_mover", value },
            })
          }
        />
      )}

      {config.pricingFields.includes("passenger_type") && (
        <RadioGroup
          label="Passenger Type *"
          options={[
            { label: "Student", value: "STUDENT" },
            { label: "Adult", value: "ADULT" },
          ]}
          selected={state.passenger_type}
          onSelect={(value) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { field: "passenger_type", value },
            })
          }
        />
      )}

      {/* Render add-ons if available */}
      {config.addons.length > 0 && (
        <AddonSelector
          addons={config.addons}
          selected={state.selectedAddons}
          onToggle={(addonId) =>
            dispatch({ type: "TOGGLE_ADDON", payload: addonId })
          }
        />
      )}
    </View>
  );
}
```

---

### Lightweight Parent Context

```javascript
// contexts/Motor3Context.js

const Motor3Context = createContext();

const initialState = {
  // Flow routing
  selectedCategory: null, // { code: 'PRIVATE', name: 'Private' }
  selectedSubcategory: null, // { code: 'PRIVATE_THIRD_PARTY', pricing_model: 'FIXED' }
  flowType: null, // 'THIRD_PARTY' | 'COMPREHENSIVE'

  // Global flow state
  currentStep: 0,
  completedSteps: [],

  // Client details (shared across all flows)
  clientDetails: {
    id_number: "",
    phone: "",
    email: "",
    address: "",
  },

  // Documents (shared)
  uploadedDocuments: [],

  // Payment
  paymentDetails: null,

  // Submission result
  policyNumber: null,
  quotationId: null,
};

function motor3Reducer(state, action) {
  switch (action.type) {
    case "SET_FLOW_TYPE":
      return {
        ...state,
        flowType: action.payload,
        currentStep: 0,
      };

    case "SET_CATEGORY_SELECTION":
      return {
        ...state,
        selectedCategory: action.payload.category,
        selectedSubcategory: action.payload.subcategory,
        flowType: action.payload.flowType,
      };

    case "UPDATE_CLIENT_DETAILS":
      return {
        ...state,
        clientDetails: {
          ...state.clientDetails,
          ...action.payload,
        },
      };

    case "SET_CURRENT_STEP":
      return {
        ...state,
        currentStep: action.payload,
        completedSteps: [
          ...new Set([...state.completedSteps, state.currentStep]),
        ],
      };

    case "RESET_FLOW":
      return initialState;

    default:
      return state;
  }
}

export function Motor3Provider({ children }) {
  const [state, dispatch] = useReducer(motor3Reducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <Motor3Context.Provider value={value}>{children}</Motor3Context.Provider>
  );
}

export const useMotor3 = () => {
  const context = useContext(Motor3Context);
  if (!context) throw new Error("useMotor3 must be used within Motor3Provider");
  return context;
};
```

### Third Party Specific Context

```javascript
// contexts/ThirdPartyContext.js

const ThirdPartyContext = createContext();

const initialState = {
  // Vehicle identification
  registrationNumber: "",
  identificationType: "Vehicle Registration", // or 'Chassis Number'
  chasisNumber: "",

  // Cover details
  cover_start_date: "",
  financialInterest: "No",

  // DMVIC data (auto-filled, locked)
  dmvicData: null,
  isDataLocked: false,

  // Underwriter selection
  availableUnderwriters: [],
  selectedUnderwriter: null,

  // Validation
  errors: {},
};

function thirdPartyReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.payload.field]: action.payload.value,
        errors: {
          ...state.errors,
          [action.payload.field]: null, // Clear error on change
        },
      };

    case "LOCK_DMVIC_DATA":
      return {
        ...state,
        dmvicData: action.payload,
        isDataLocked: true,
        // Auto-fill fields from DMVIC
        make: action.payload.make,
        model: action.payload.model,
        year: action.payload.year,
        color: action.payload.color,
      };

    case "SET_UNDERWRITERS":
      return {
        ...state,
        availableUnderwriters: action.payload,
      };

    case "SELECT_UNDERWRITER":
      return {
        ...state,
        selectedUnderwriter: action.payload,
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.payload,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function ThirdPartyProvider({ children }) {
  const [state, dispatch] = useReducer(thirdPartyReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <ThirdPartyContext.Provider value={value}>
      {children}
    </ThirdPartyContext.Provider>
  );
}

export const useThirdParty = () => {
  const context = useContext(ThirdPartyContext);
  if (!context)
    throw new Error("useThirdParty must be used within ThirdPartyProvider");
  return context;
};
```

### Comprehensive Specific Context

```javascript
// contexts/ComprehensiveContext.js

const ComprehensiveContext = createContext();

const initialState = {
  // Full vehicle details
  registrationNumber: "",
  make: "",
  model: "",
  year: "",
  color: "",
  bodyType: "",
  engineNumber: "",
  chasisNumber: "",

  // Pricing inputs
  sum_insured: null,

  // Cover details
  cover_start_date: "",
  financialInterest: "No",
  purpose: "PRIVATE_USE",

  // Underwriter selection (loaded after sum_insured entered)
  availableUnderwriters: [],
  selectedUnderwriter: null,
  comparingUnderwriters: false,

  // Add-ons
  selectedAddons: [],

  // Validation
  errors: {},
};

function comprehensiveReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.payload.field]: action.payload.value,
        errors: {
          ...state.errors,
          [action.payload.field]: null,
        },
      };

    case "SET_UNDERWRITERS":
      return {
        ...state,
        availableUnderwriters: action.payload,
        comparingUnderwriters: false,
      };

    case "SELECT_UNDERWRITER":
      return {
        ...state,
        selectedUnderwriter: action.payload,
      };

    case "TOGGLE_ADDON":
      const addonId = action.payload;
      const isSelected = state.selectedAddons.includes(addonId);
      return {
        ...state,
        selectedAddons: isSelected
          ? state.selectedAddons.filter((id) => id !== addonId)
          : [...state.selectedAddons, addonId],
      };

    case "SET_COMPARING":
      return {
        ...state,
        comparingUnderwriters: action.payload,
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.payload,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function ComprehensiveProvider({ children }) {
  const [state, dispatch] = useReducer(comprehensiveReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <ComprehensiveContext.Provider value={value}>
      {children}
    </ComprehensiveContext.Provider>
  );
}

export const useComprehensive = () => {
  const context = useContext(ComprehensiveContext);
  if (!context)
    throw new Error(
      "useComprehensive must be used within ComprehensiveProvider"
    );
  return context;
};
```

---

## Third Party Form: Eliminating Re-renders

### Clean Form Component

```javascript
// third-party/components/TPVehicleForm.js

import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThirdParty } from "../../contexts/ThirdPartyContext";
import StableTextInput from "@components/common/StableTextInput";
import RadioGroup from "@components/common/RadioGroup";
import DatePicker from "@components/common/DatePicker";

export default function TPVehicleForm() {
  const { state, dispatch } = useThirdParty();

  // ✅ LOCAL state for controlled inputs (no parent re-renders)
  const [localRegistration, setLocalRegistration] = useState(
    state.registrationNumber
  );
  const [localChasis, setLocalChasis] = useState(state.chasisNumber);

  // ✅ STABLE handlers using useCallback
  const updateField = useCallback(
    (field, value) => {
      dispatch({ type: "UPDATE_FIELD", payload: { field, value } });
    },
    [dispatch]
  );

  // ✅ Debounced registration update (only notify parent after 400ms pause)
  const handleRegistrationChange = useCallback(
    (value) => {
      setLocalRegistration(value); // Update local state immediately (smooth typing)

      // Debounce parent update
      clearTimeout(window.__regTimeout);
      window.__regTimeout = setTimeout(() => {
        updateField("registrationNumber", value);
      }, 400);
    },
    [updateField]
  );

  // ✅ Radio options are STATIC (never recreated)
  const financialInterestOptions = useMemo(
    () => [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    []
  );

  const identificationOptions = useMemo(
    () => [
      { label: "Vehicle Registration", value: "Vehicle Registration" },
      { label: "Chassis Number", value: "Chassis Number" },
    ],
    []
  );

  return (
    <View style={styles.container}>
      {/* Financial Interest - NO re-render on parent */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Financial Interest *</Text>
        <RadioGroup
          options={financialInterestOptions}
          selected={state.financialInterest}
          onSelect={(value) => updateField("financialInterest", value)}
        />
      </View>

      {/* Vehicle Identification Type - NO re-render on parent */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Vehicle Identification Type *</Text>
        <RadioGroup
          options={identificationOptions}
          selected={state.identificationType}
          onSelect={(value) => updateField("identificationType", value)}
        />
      </View>

      {/* Conditional input based on identification type */}
      {state.identificationType === "Vehicle Registration" ? (
        <StableTextInput
          label="Vehicle Registration *"
          value={localRegistration}
          onChangeText={handleRegistrationChange}
          placeholder="e.g., KDA 123A"
          autoCapitalize="characters"
          editable={!state.isDataLocked}
          error={state.errors.registrationNumber}
        />
      ) : (
        <StableTextInput
          label="Chassis Number *"
          value={localChasis}
          onChangeText={(value) => {
            setLocalChasis(value);
            clearTimeout(window.__chassisTimeout);
            window.__chassisTimeout = setTimeout(() => {
              updateField("chasisNumber", value);
            }, 400);
          }}
          placeholder="Enter chassis number"
          autoCapitalize="characters"
          editable={!state.isDataLocked}
          error={state.errors.chasisNumber}
        />
      )}

      {/* Cover Start Date */}
      <DatePicker
        label="Cover Start Date *"
        value={state.cover_start_date}
        onChange={(date) => updateField("cover_start_date", date)}
        minimumDate={new Date()}
        error={state.errors.cover_start_date}
      />

      {/* DMVIC locked fields (if data exists) */}
      {state.isDataLocked && state.dmvicData && (
        <View style={styles.lockedSection}>
          <Text style={styles.lockedLabel}>
            ✓ Vehicle details verified from DMVIC
          </Text>
          <Text style={styles.lockedField}>Make: {state.make}</Text>
          <Text style={styles.lockedField}>Model: {state.model}</Text>
          <Text style={styles.lockedField}>Year: {state.year}</Text>
          <Text style={styles.lockedField}>Color: {state.color}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  lockedSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  lockedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 8,
  },
  lockedField: {
    fontSize: 13,
    color: "#1e3a8a",
    marginBottom: 4,
  },
});
```

### Key Improvements Over Motor2

1. **No initialData Prop**:

   - Form reads directly from context
   - No prop identity changes = no unnecessary re-renders

2. **Local State for Text Inputs**:

   - Typing updates local state immediately (smooth UX)
   - Parent context updated only after 400ms pause (debounced)
   - No parent re-renders while typing

3. **Static Radio Options**:

   - `useMemo` with empty dependencies = never recreated
   - Radio selection updates context directly
   - No cascading re-renders

4. **Stable Callbacks**:
   - `useCallback` with stable dependencies
   - Same function reference across renders
   - Child components don't re-render

---

## Third Party Underwriter Auto-Load

### Dedicated Hook

```javascript
// third-party/hooks/useTPUnderwriters.js

import { useEffect, useCallback, useRef } from "react";
import { useThirdParty } from "../../contexts/ThirdPartyContext";
import motorPricingService from "@services/MotorInsurancePricingService";

export function useTPUnderwriters(subcategoryCode) {
  const { state, dispatch } = useThirdParty();
  const loadedRef = useRef(false);

  const loadUnderwriters = useCallback(async () => {
    if (loadedRef.current) return; // Prevent duplicate loads

    try {
      console.log("[TP Underwriters] Auto-loading for:", subcategoryCode);

      // Third Party has FIXED pricing, no form inputs needed
      const comparisons =
        await motorPricingService.compareUnderwritersBySubcategory(
          subcategoryCode,
          { cover_start_date: new Date().toISOString().split("T")[0] }
        );

      dispatch({ type: "SET_UNDERWRITERS", payload: comparisons });
      loadedRef.current = true;

      console.log(
        "[TP Underwriters] Loaded:",
        comparisons.length,
        "underwriters"
      );
    } catch (error) {
      console.error("[TP Underwriters] Load error:", error);
    }
  }, [subcategoryCode, dispatch]);

  useEffect(() => {
    loadUnderwriters();
  }, [loadUnderwriters]);

  return {
    underwriters: state.availableUnderwriters,
    loading: state.availableUnderwriters.length === 0 && !loadedRef.current,
  };
}
```

### Usage in Step Component

```javascript
// third-party/steps/TPVehicleDetailsStep.js

import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useMotor3 } from "../../contexts/Motor3Context";
import TPVehicleForm from "../components/TPVehicleForm";
import TPUnderwriterSelector from "../components/TPUnderwriterSelector";
import { useTPUnderwriters } from "../hooks/useTPUnderwriters";

export default function TPVehicleDetailsStep() {
  const { state } = useMotor3();
  const { underwriters, loading } = useTPUnderwriters(
    state.selectedSubcategory?.subcategory_code
  );

  return (
    <ScrollView style={styles.container}>
      {/* Vehicle Form - NO re-renders on radio toggles */}
      <TPVehicleForm />

      {/* Underwriters - Auto-loaded on mount */}
      <TPUnderwriterSelector underwriters={underwriters} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
```

---

## Comprehensive Form: Debounced Underwriter Loading

### Form with Sum Insured Input

```javascript
// comprehensive/components/CompVehicleForm.js

import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useComprehensive } from "../../contexts/ComprehensiveContext";
import StableTextInput from "@components/common/StableTextInput";
import CurrencyInput from "@components/common/CurrencyInput";
import MakeModelSelector from "./VehicleMakeModelSelector";

export default function CompVehicleForm() {
  const { state, dispatch } = useComprehensive();

  // Local state for inputs
  const [localRegistration, setLocalRegistration] = useState(
    state.registrationNumber
  );
  const [localSumInsured, setLocalSumInsured] = useState(
    state.sum_insured || ""
  );

  const updateField = useCallback(
    (field, value) => {
      dispatch({ type: "UPDATE_FIELD", payload: { field, value } });
    },
    [dispatch]
  );

  // Debounced sum insured update (triggers underwriter comparison)
  const handleSumInsuredChange = useCallback(
    (value) => {
      setLocalSumInsured(value);

      clearTimeout(window.__sumInsuredTimeout);
      window.__sumInsuredTimeout = setTimeout(() => {
        const numericValue = parseFloat(value.replace(/[^0-9.]/g, ""));
        if (!isNaN(numericValue) && numericValue >= 50000) {
          updateField("sum_insured", numericValue);
        }
      }, 800); // 800ms debounce for sum insured (user finishes typing)
    },
    [updateField]
  );

  return (
    <View style={styles.container}>
      <StableTextInput
        label="Vehicle Registration *"
        value={localRegistration}
        onChangeText={(value) => {
          setLocalRegistration(value);
          clearTimeout(window.__regTimeout);
          window.__regTimeout = setTimeout(() => {
            updateField("registrationNumber", value);
          }, 400);
        }}
        placeholder="e.g., KDA 123A"
        autoCapitalize="characters"
        error={state.errors.registrationNumber}
      />

      <MakeModelSelector
        selectedMake={state.make}
        selectedModel={state.model}
        onMakeChange={(make) => updateField("make", make)}
        onModelChange={(model) => updateField("model", model)}
      />

      <StableTextInput
        label="Year of Manufacture *"
        value={state.year}
        onChangeText={(value) => updateField("year", value)}
        placeholder="e.g., 2020"
        keyboardType="numeric"
        maxLength={4}
        error={state.errors.year}
      />

      <CurrencyInput
        label="Sum Insured *"
        value={localSumInsured}
        onChangeText={handleSumInsuredChange}
        placeholder="e.g., KSh 500,000"
        error={state.errors.sum_insured}
        helperText="Minimum KSh 50,000"
      />

      {/* More fields... */}
    </View>
  );
}
```

### Debounced Underwriter Hook

```javascript
// comprehensive/hooks/useCompUnderwriters.js

import { useEffect, useCallback, useRef } from "react";
import { useComprehensive } from "../../contexts/ComprehensiveContext";
import motorPricingService from "@services/MotorInsurancePricingService";

export function useCompUnderwriters(subcategoryCode) {
  const { state, dispatch } = useComprehensive();
  const loadTimeoutRef = useRef(null);
  const lastSumInsuredRef = useRef(null);

  const loadUnderwriters = useCallback(
    async (sumInsured) => {
      if (!sumInsured || sumInsured < 50000) {
        dispatch({ type: "SET_UNDERWRITERS", payload: [] });
        return;
      }

      // Don't reload if sum insured hasn't changed significantly
      if (Math.abs((lastSumInsuredRef.current || 0) - sumInsured) < 10000) {
        return;
      }

      try {
        console.log("[Comp Underwriters] Loading for sum insured:", sumInsured);
        dispatch({ type: "SET_COMPARING", payload: true });

        const comparisons =
          await motorPricingService.compareUnderwritersBySubcategory(
            subcategoryCode,
            {
              sum_insured: sumInsured,
              cover_start_date:
                state.cover_start_date ||
                new Date().toISOString().split("T")[0],
            }
          );

        dispatch({ type: "SET_UNDERWRITERS", payload: comparisons });
        lastSumInsuredRef.current = sumInsured;

        console.log(
          "[Comp Underwriters] Loaded:",
          comparisons.length,
          "underwriters"
        );
      } catch (error) {
        console.error("[Comp Underwriters] Load error:", error);
        dispatch({ type: "SET_COMPARING", payload: false });
      }
    },
    [subcategoryCode, state.cover_start_date, dispatch]
  );

  // Debounced effect: only trigger when sum_insured changes
  useEffect(() => {
    clearTimeout(loadTimeoutRef.current);

    if (state.sum_insured && state.sum_insured >= 50000) {
      loadTimeoutRef.current = setTimeout(() => {
        loadUnderwriters(state.sum_insured);
      }, 1000); // 1 second delay after user stops typing
    }

    return () => clearTimeout(loadTimeoutRef.current);
  }, [state.sum_insured, loadUnderwriters]);

  return {
    underwriters: state.availableUnderwriters,
    loading: state.comparingUnderwriters,
  };
}
```

---

## Reusable Components

### StableTextInput

```javascript
// components/common/StableTextInput.js

import React, { memo } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

const StableTextInput = memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    helperText,
    editable = true,
    ...props
  }) => {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            !editable && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          editable={editable}
          blurOnSubmit={false} // ✅ Keep keyboard open
          returnKeyType="next" // ✅ Show "Next" button
          {...props}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        {helperText && !error && (
          <Text style={styles.helperText}>{helperText}</Text>
        )}
      </View>
    );
  },
  (prev, next) => {
    // ✅ Only re-render if value or error changes
    return prev.value === next.value && prev.error === next.error;
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});

export default StableTextInput;
```

### RadioGroup

```javascript
// components/common/RadioGroup.js

import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RadioGroup = memo(
  ({ options, selected, onSelect, horizontal = true }) => {
    const handleSelect = useCallback(
      (value) => {
        if (value !== selected) {
          onSelect(value);
        }
      },
      [selected, onSelect]
    );

    return (
      <View style={[styles.container, horizontal && styles.horizontal]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              horizontal && styles.optionHorizontal,
              option.value === selected && styles.optionSelected,
            ]}
            onPress={() => handleSelect(option.value)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radio,
                option.value === selected && styles.radioSelected,
              ]}
            >
              {option.value === selected && <View style={styles.radioInner} />}
            </View>
            <Text
              style={[
                styles.label,
                option.value === selected && styles.labelSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
  (prev, next) => {
    // ✅ Only re-render if selected value changes
    return prev.selected === next.selected;
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
  },
  horizontal: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  optionHorizontal: {
    marginRight: 24,
    marginBottom: 0,
  },
  optionSelected: {
    // No visual change, handled by radio button
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: "#D5222B",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D5222B",
  },
  label: {
    fontSize: 14,
    color: "#333",
  },
  labelSelected: {
    fontWeight: "600",
    color: "#D5222B",
  },
});

export default RadioGroup;
```

---

## Implementation Plan

### Phase 1: Foundation (Days 1-2)

1. **Create Motor3 Directory Structure**:

   ```powershell
   cd frontend/screens/quotations
   mkdir Motor3
   cd Motor3
   mkdir -p shared/CategorySelection shared/ClientDetails shared/DocumentsUpload shared/Payment shared/Submission shared/UnderwriterComparison
   mkdir -p third-party/steps third-party/components third-party/hooks
   mkdir -p comprehensive/steps comprehensive/components comprehensive/hooks
   mkdir contexts utils
   ```

2. **Copy Reusable Components from Motor2**:

   - `CategorySelection/` → `shared/CategorySelection/`
   - `ClientDetails/EnhancedClientForm.js` → `shared/ClientDetails/`
   - `DocumentsUpload/` → `shared/DocumentsUpload/`
   - `Payment/` → `shared/Payment/`

3. **Create Contexts**:
   - `contexts/Motor3Context.js` (parent flow state)
   - `contexts/ThirdPartyContext.js` (Third Party specific)
   - `contexts/ComprehensiveContext.js` (Comprehensive specific)

### Phase 2: Third Party Flow (Days 3-5)

1. **Build Components**:

   - `third-party/components/TPVehicleForm.js` (simplified, < 400 lines)
   - `third-party/components/TPUnderwriterSelector.js`
   - `third-party/components/TPFieldLocks.js` (DMVIC auto-fill)

2. **Build Hooks**:

   - `third-party/hooks/useThirdPartyForm.js`
   - `third-party/hooks/useTPUnderwriters.js` (auto-load on mount)

3. **Build Steps**:

   - `steps/TPCategorySelectionStep.js`
   - `steps/TPVehicleDetailsStep.js`
   - `steps/TPUnderwriterSelectionStep.js`
   - `steps/TPKYCStep.js` (with DMVIC integration)
   - `steps/TPDocumentsStep.js`
   - `steps/TPClientDetailsStep.js`
   - `steps/TPPaymentStep.js`
   - `steps/TPSubmissionStep.js`

4. **Build Flow Orchestrator**:
   - `third-party/ThirdPartyFlow.js`

### Phase 3: Comprehensive Flow (Days 6-8)

1. **Build Components**:

   - `comprehensive/components/CompVehicleForm.js` (full details, < 500 lines)
   - `comprehensive/components/SumInsuredInput.js`
   - `comprehensive/components/VehicleMakeModelSelector.js`
   - `comprehensive/components/CompUnderwriterSelector.js`

2. **Build Hooks**:

   - `comprehensive/hooks/useComprehensiveForm.js`
   - `comprehensive/hooks/useCompUnderwriters.js` (debounced load)

3. **Build Steps**:

   - `steps/CompCategorySelectionStep.js`
   - `steps/CompVehicleDetailsStep.js`
   - `steps/CompUnderwriterSelectionStep.js`
   - `steps/CompAddonsStep.js`
   - `steps/CompClientDetailsStep.js`
   - `steps/CompPaymentStep.js`
   - `steps/CompSubmissionStep.js`

4. **Build Flow Orchestrator**:
   - `comprehensive/ComprehensiveFlow.js`

### Phase 4: Main Container & Routing (Day 9)

1. **Build Main Container**:

   ```javascript
   // MotorInsuranceContainer.js

   export default function MotorInsuranceContainer() {
     const { state } = useMotor3();

     // Route to correct flow based on product type
     if (state.flowType === "THIRD_PARTY") {
       return (
         <ThirdPartyProvider>
           <ThirdPartyFlow />
         </ThirdPartyProvider>
       );
     }

     if (state.flowType === "COMPREHENSIVE") {
       return (
         <ComprehensiveProvider>
           <ComprehensiveFlow />
         </ComprehensiveProvider>
       );
     }

     // Default: Show category selection
     return <CategorySelectionStep />;
   }
   ```

2. **Wire Up Navigation**:
   - Update `QuotationsStack` in `App.js` to point to Motor3
   - Add Motor3 to bottom tab navigation

### Phase 5: Testing & Refinement (Days 10-12)

1. **Performance Testing**:

   - Test radio button toggles (should be 1 render only)
   - Test text input (smooth typing, no keyboard dismissal)
   - Test underwriter loading (Third Party: instant, Comprehensive: debounced)

2. **Flow Testing**:

   - Complete Third Party quote from start to finish
   - Complete Comprehensive quote with add-ons
   - Test DMVIC integration in Third Party flow
   - Test form validation and error handling

3. **Edge Cases**:
   - Test offline mode
   - Test with expired session
   - Test with invalid vehicle data
   - Test payment failures

### Phase 6: Deployment (Day 13)

1. **Feature Flag**:

   - Add `USE_MOTOR3` flag in config
   - Allow toggling between Motor2 and Motor3

2. **Gradual Rollout**:

   - Week 1: 10% of users
   - Week 2: 50% of users
   - Week 3: 100% of users

3. **Monitoring**:
   - Track render counts per interaction
   - Track completion rates
   - Track user feedback

---

## Success Metrics

### Performance Improvements

| Metric                        | Motor2 (Current) | Motor3 (Target)  | Improvement    |
| ----------------------------- | ---------------- | ---------------- | -------------- |
| Radio toggle renders          | 4+ renders       | 1 render         | 75% reduction  |
| Text input renders/keystroke  | 4 renders        | 1 render         | 75% reduction  |
| Keyboard dismissals           | Frequent         | None             | 100% reduction |
| Initial underwriter load (TP) | 2-3 seconds      | < 1 second       | 66% faster     |
| Form component size           | 2092 lines       | < 400 lines (TP) | 80% smaller    |

### User Experience Improvements

- ✅ Smooth typing without interruptions
- ✅ Radio buttons respond instantly
- ✅ Underwriters load in background (no blocking)
- ✅ Clear separation between Third Party and Comprehensive flows
- ✅ DMVIC data auto-fill without form resets

---

## Migration Strategy

### Coexistence Period

Motor2 and Motor3 will coexist for **2-4 weeks** during rollout:

```javascript
// App.js - Feature flag routing

import Motor2Container from "@screens/quotations/Motor 2/MotorInsuranceContainer";
import Motor3Container from "@screens/quotations/Motor3/MotorInsuranceContainer";

const USE_MOTOR3 = AsyncStorage.getItem("feature_motor3") === "true";

function QuotationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MotorInsurance"
        component={USE_MOTOR3 ? Motor3Container : Motor2Container}
      />
    </Stack.Navigator>
  );
}
```

### Rollback Plan

If critical issues arise, rollback to Motor2 by:

1. Set `feature_motor3` flag to `false`
2. Restart Metro bundler
3. Redeploy app (or push OTA update if using EAS)

### Data Compatibility

Motor3 contexts are backward-compatible with Motor2 AsyncStorage keys:

- `MOTOR_FLOW_STATE` → Maps to Motor3Context
- `MOTOR_FLOW_VEHICLE_DETAILS` → Maps to ThirdParty/ComprehensiveContext
- `MOTOR_FLOW_CLIENT_DETAILS` → Maps to Motor3Context.clientDetails

---

## Maintenance Guidelines

### Adding New Insurance Product

1. **Determine Flow Type**:

   - Fixed pricing (e.g., TOR) → Third Party flow
   - Bracket pricing → Comprehensive flow
   - Tonnage/Passenger → Create dedicated flow (future)

2. **Update Context**:

   - Add product-specific fields to appropriate context
   - Add validation rules in `utils/motor3Validation.js`

3. **Update Form Component**:

   - Add conditional fields based on product type
   - Update field classification in form component

4. **Test**:
   - Verify no re-render regressions
   - Test complete flow end-to-end

### Debugging Re-render Issues

1. **Enable React DevTools Profiler**:

   ```javascript
   // Add to component
   console.log("[Component] Render triggered");
   console.log("[Props] changed:" /* list props */);
   ```

2. **Check Prop Identity**:

   ```javascript
   useEffect(() => {
     console.log(
       "[Prop Identity] onSelect changed:",
       onSelect === prevOnSelect
     );
   }, [onSelect]);
   ```

3. **Verify Memoization**:
   - Ensure `useMemo` dependencies are minimal
   - Ensure `useCallback` dependencies are stable
   - Check `React.memo` custom comparator

---

## Next Steps

### Priority Action Items

1. **Review CSV Feedback**: Confirm all 60+ products are correctly mapped
2. **Review React Native Best Practices**: Ensure all patterns align with official docs
3. **Approve Architecture**: Sign off on separation of Third Party/Comprehensive flows
4. **Estimate Effort**: Confirm 13-day timeline (can be adjusted based on team capacity)
5. **Assign Resources**: Assign developers to each phase
6. **Create Tickets**: Break down phases into Jira/GitHub issues
7. **Start Phase 1**: Begin foundation setup

### Before Starting Implementation

**Checklist**:

- [ ] All 60+ motor products from CSV feedback accounted for
- [ ] React Native performance guidelines integrated
- [ ] FlatList optimization patterns confirmed
- [ ] Keyboard handling strategy approved
- [ ] Context architecture reviewed by senior developers
- [ ] Testing strategy defined (unit tests, integration tests, E2E tests)
- [ ] Rollback plan documented and approved
- [ ] Feature flag mechanism in place

**Once approved, proceed with**:

```powershell
# Create Motor3 directory structure
cd frontend/screens/quotations
mkdir Motor3
cd Motor3

# Create subdirectories
mkdir -p shared/CategorySelection shared/ClientDetails shared/DocumentsUpload shared/Payment shared/Submission shared/UnderwriterComparison
mkdir -p third-party/steps third-party/components third-party/hooks
mkdir -p comprehensive/steps comprehensive/components comprehensive/hooks
mkdir contexts utils

# Verify structure
tree /F
```

---

**Document Version**: 2.0  
**Last Updated**: December 1, 2025  
**Author**: Senior Full-Stack Developer (Copilot)  
**Changes**:

- Added React Native best practices section (10 critical patterns)
- Integrated all 60+ motor products from CSV feedback
- Added dynamic form configuration for all pricing models
- Enhanced product field mapping and validation rules
- Added comprehensive product implementation strategy
  **Status**: Ready for Implementation
