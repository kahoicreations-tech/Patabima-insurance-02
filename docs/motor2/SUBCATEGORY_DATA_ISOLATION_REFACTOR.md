# Motor 2 Subcategory Data Isolation Refactor

## Executive Summary

**Problem**: Form data bleeding between Third Party and Comprehensive insurance products causes incorrect field persistence, unnecessary re-renders, and confusing user experience when switching between subcategories.

**Root Cause**: Single `vehicleDetails` object in `MotorInsuranceContext` stores all form data without isolating by subcategory, causing fields from one product (e.g., `sum_insured` from Comprehensive) to persist when switching to another product (e.g., Third Party).

**Solution**: Implement **architectural separation** between:

1. **Shared Vehicle Fields** - Universal data that persists across ALL products (registration, dates, etc.)
2. **Pricing-Specific Fields** - Isolated data unique to each pricing model (sum_insured, tonnage, capacity)
3. **Underwriter Selection** - Separate state that resets on subcategory change

**Impact**:

- ✅ Eliminates data bleeding between products
- ✅ Reduces unnecessary re-renders (eliminates "blinking")
- ✅ Improves code maintainability
- ✅ Enables proper form validation per product type
- ✅ Provides clean separation of concerns

---

## Table of Contents

1. [Problem Analysis](#problem-analysis)
2. [Current Architecture Issues](#current-architecture-issues)
3. [Proposed Architecture](#proposed-architecture)
4. [Implementation Plan](#implementation-plan)
5. [Migration Strategy](#migration-strategy)
6. [Testing Requirements](#testing-requirements)
7. [Performance Considerations](#performance-considerations)
8. [Future Enhancements](#future-enhancements)

---

## Problem Analysis

### Scenario: User Flow - Third Party → Comprehensive

#### Current Behavior (Broken)

```javascript
// Step 1: User fills Third Party form
State: {
  selectedSubcategory: { subcategory_code: 'PRIVATE_THIRD_PARTY', pricing_model: 'FIXED' },
  vehicleDetails: {
    registrationNumber: 'KDA 123A',
    cover_start_date: '2025-12-01',
    identificationType: 'Vehicle Registration',
    financialInterest: 'Yes',
    underwriter: 'Madison Insurance'  // ← Third Party underwriter
  }
}

// Step 2: User switches to Comprehensive
// ❌ PROBLEM: vehicleDetails object is NOT cleared or isolated
State: {
  selectedSubcategory: { subcategory_code: 'PRIVATE_COMPREHENSIVE', pricing_model: 'BRACKET' },
  vehicleDetails: {
    registrationNumber: 'KDA 123A',        // ✅ Should persist (shared field)
    cover_start_date: '2025-12-01',        // ✅ Should persist (shared field)
    identificationType: 'Vehicle Registration', // ✅ Should persist (shared field)
    financialInterest: 'Yes',              // ✅ Should persist (shared field)
    underwriter: 'Madison Insurance',      // ❌ WRONG! Third Party underwriter in Comprehensive
    // ❌ Missing: sum_insured (required for Comprehensive)
  }
}

// Step 3: Form renders with bleeding data
Comprehensive Form displays:
  - Registration: 'KDA 123A' ✅ Correct (shared field)
  - Cover Date: '2025-12-01' ✅ Correct (shared field)
  - Underwriter: 'Madison Insurance' ❌ WRONG! (Third Party selection, not Comprehensive)
  - Sum Insured: undefined ❌ Missing required field

Result:
  - Auto-comparison tries to load with missing sum_insured → fails or shows empty list
  - User sees Madison underwriter pre-selected (from Third Party) → confusion
  - Form validation fails (missing sum_insured)
  - Multiple re-renders triggered by comparison attempts → "blinking"
```

#### Expected Behavior (Fixed)

```javascript
// Step 1: User fills Third Party form
State: {
  selectedSubcategory: { subcategory_code: 'PRIVATE_THIRD_PARTY', pricing_model: 'FIXED' },
  sharedVehicleData: {
    registrationNumber: 'KDA 123A',
    cover_start_date: '2025-12-01',
    identificationType: 'Vehicle Registration',
    financialInterest: 'Yes'
  },
  pricingData: {
    'PRIVATE_THIRD_PARTY': {
      // No pricing fields - FIXED model
    }
  },
  selectedUnderwriter: {
    name: 'Madison Insurance',
    code: 'MADISON',
    total_premium: 3029.88
  }
}

// Step 2: User switches to Comprehensive
// ✅ SOLUTION: Shared fields persist, pricing/underwriter reset
State: {
  selectedSubcategory: { subcategory_code: 'PRIVATE_COMPREHENSIVE', pricing_model: 'BRACKET' },
  sharedVehicleData: {
    registrationNumber: 'KDA 123A',        // ✅ Persisted (shared)
    cover_start_date: '2025-12-01',        // ✅ Persisted (shared)
    identificationType: 'Vehicle Registration', // ✅ Persisted (shared)
    financialInterest: 'Yes'               // ✅ Persisted (shared)
  },
  pricingData: {
    'PRIVATE_THIRD_PARTY': {
      // Saved for later
    },
    'PRIVATE_COMPREHENSIVE': {
      sum_insured: null  // ✅ Fresh state for Comprehensive
    }
  },
  selectedUnderwriter: null  // ✅ Reset - forces user to select for new product
}

// Step 3: Form renders with clean state
Comprehensive Form displays:
  - Registration: 'KDA 123A' ✅ Correct (from sharedVehicleData)
  - Cover Date: '2025-12-01' ✅ Correct (from sharedVehicleData)
  - Sum Insured: empty field ✅ Correct (ready for user input)
  - Underwriter: null ✅ Correct (awaiting selection)

Result:
  - No bleeding from Third Party
  - Form waits for user to enter sum_insured before loading underwriters
  - No confusion from pre-selected underwriters
  - No unnecessary re-renders
```

---

## Current Architecture Issues

### Issue 1: Single `vehicleDetails` Object

**Location**: `frontend/contexts/MotorInsuranceContext.js`

```javascript
// Current problematic structure
const initialState = {
  selectedCategory: null,
  selectedSubcategory: null,
  vehicleDetails: {}, // ❌ Single object stores ALL data
  pricingInputs: {}, // ❌ Separate but still not isolated by subcategory
  clientDetails: {},
  selectedUnderwriter: null,
  // ...
};
```

**Problems**:

1. **No field categorization**: All fields mixed together (registration + sum_insured + tonnage + capacity)
2. **No isolation**: Switching subcategories doesn't clear product-specific fields
3. **Underwriter persistence**: Underwriter selection bleeds across products
4. **Validation complexity**: Hard to validate because field requirements vary per product

### Issue 2: Subcategory Switch Logic

**Location**: `reducer()` → `'SET_CATEGORY_SELECTION'` case

```javascript
case 'SET_CATEGORY_SELECTION':
  // Current logic saves entire vehicleDetails to subcategoryFormData
  if (currentSubcategoryCode) {
    updatedSubcategoryFormData[currentSubcategoryCode] = {
      vehicleDetails: state.vehicleDetails,  // ❌ Saves everything including wrong fields
      pricingInputs: state.pricingInputs
    };
  }

  // Restores saved data (which may contain bleeding fields)
  const savedFormData = newSubcategoryCode ? updatedSubcategoryFormData[newSubcategoryCode] : null;

  return {
    ...state,
    vehicleDetails: savedFormData?.vehicleDetails || {},  // ❌ Restores everything
    pricingInputs: savedFormData?.pricingInputs || {},
    // ❌ selectedUnderwriter NOT reset - bleeds across products
  };
```

**Problems**:

1. Saves **entire** `vehicleDetails` object without filtering
2. Restores **entire** saved object without validation
3. Doesn't reset `selectedUnderwriter` when switching
4. No distinction between shared vs pricing-specific fields

### Issue 3: DynamicVehicleForm Data Loading

**Location**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`

```javascript
// Current initialization
const [formData, setFormData] = useState(initialData || values || {});

// Problems:
// 1. initialData comes from parent's vehicleDetails (contains bleeding data)
// 2. No filtering of fields based on pricing_model
// 3. Underwriter field treated as string, not object
```

**Impact**:

- Form renders with incorrect fields
- Validation rules don't match product requirements
- Underwriter comparison triggers with wrong parameters

---

## Proposed Architecture

### Core Principle: Separation of Concerns

```
┌─────────────────────────────────────────────────────────────────┐
│                    Motor Insurance Context                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ sharedVehicleData (Universal - Persists Everywhere)      │   │
│  │ - registrationNumber                                      │   │
│  │ - identificationType                                      │   │
│  │ - cover_start_date                                        │   │
│  │ - financialInterest                                       │   │
│  │ - logbookNumber, chasisNumber, engineNumber              │   │
│  │ - make, model, year (vehicle catalog fields)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ pricingData (Isolated Per Subcategory)                   │   │
│  │ {                                                         │   │
│  │   'PRIVATE_THIRD_PARTY': {},                            │   │
│  │   'PRIVATE_COMPREHENSIVE': { sum_insured: 500000 },     │   │
│  │   'COMMERCIAL_UPTO_3_TONS': { tonnage: 2.5 },           │   │
│  │   'PSV_14_SEATER': { capacity: 14 }                     │   │
│  │ }                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ underwriterState (Separate, Resets on Subcategory Change)│   │
│  │ - selectedUnderwriter: { name, code, premium, ... }      │   │
│  │ - underwriterComparisons: [...]                          │   │
│  │ - isLoadingComparisons: false                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Field Classification

#### Shared Vehicle Fields (Universal)

**Definition**: Fields required by ALL insurance products regardless of pricing model.

**List**:

```javascript
const SHARED_VEHICLE_FIELDS = [
  "registrationNumber",
  "identificationType", // 'Vehicle Registration' | 'Logbook Number'
  "cover_start_date",
  "financialInterest", // 'Yes' | 'No'
  "logbookNumber",
  "chasisNumber",
  "engineNumber",
  "make", // Vehicle make (Toyota, Nissan, etc.)
  "model", // Vehicle model (Corolla, Patrol, etc.)
  "year", // Year of manufacture
  "color",
  "bodyType", // Sedan, SUV, Pickup, etc.
  "purpose", // Private use, Commercial, etc.
];
```

**Characteristics**:

- ✅ Must persist when switching between subcategories
- ✅ Required for all products (validated universally)
- ✅ Populated from DMVIC/Logbook extraction
- ✅ Used in all underwriter comparisons

#### Pricing-Specific Fields (Isolated)

**Definition**: Fields that determine premium calculation, unique to each pricing model.

**By Pricing Model**:

```javascript
const PRICING_MODEL_FIELDS = {
  FIXED: {
    // Third Party, Time on Risk
    fields: [], // No additional pricing fields
    description: "Fixed premium regardless of vehicle value",
  },

  BRACKET: {
    // Comprehensive
    fields: ["sum_insured"],
    description: "Premium based on sum insured bracket ranges",
    validation: {
      sum_insured: {
        required: true,
        min: 50000,
        max: 50000000,
        step: 50000, // Rounded to nearest 50k for cache bucketing
      },
    },
  },

  TONNAGE: {
    // Commercial vehicles
    fields: ["tonnage", "is_prime_mover", "is_over_limit"],
    description: "Premium based on vehicle tonnage capacity",
    validation: {
      tonnage: {
        required: true,
        min: 0.5,
        max: 50,
        step: 0.5,
      },
    },
  },

  PASSENGER: {
    // PSV, TukTuk
    fields: ["capacity", "is_commercial_institutional"],
    description: "Premium based on passenger seating capacity",
    validation: {
      capacity: {
        required: true,
        min: 1,
        max: 100,
        step: 1,
      },
    },
  },
};
```

**Characteristics**:

- ✅ Isolated per subcategory in `pricingData` object
- ✅ Cleared/reset when switching to different pricing model
- ✅ Used to determine when to trigger underwriter comparison
- ✅ Validated based on pricing model requirements

#### Underwriter Selection (Separate State)

**Definition**: Underwriter selection and comparison results, managed independently.

```javascript
const UNDERWRITER_STATE = {
  selectedUnderwriter: {
    // Full underwriter object (not just string)
    id: "uuid-...",
    name: "Madison Insurance",
    code: "MADISON",
    underwriter_code: "MADISON",
    total_premium: 3029.88,
    base_premium: 2975.0,
    breakdown: {
      base: 2975.0,
      itl: 7.44,
      pcf: 7.44,
      stamp_duty: 40,
    },
    pricing_model: "FIXED",
    subcategory_code: "PRIVATE_THIRD_PARTY",
  },

  underwriterComparisons: [
    // Array of comparison objects (all available underwriters)
  ],

  isLoadingComparisons: false,
  comparisonError: null,
  lastComparisonTimestamp: null,
};
```

**Characteristics**:

- ✅ Reset to `null` when switching subcategories
- ✅ Forces user to select underwriter for each product
- ✅ Stores full object (not degraded to string)
- ✅ Linked to specific subcategory_code

---

### Add-ons (Isolated Per Subcategory)

Add-ons must never bleed across products. Store them inside `pricingData[subcategory_code].addons` instead of a global array. This keeps selections and addon amounts strictly scoped to the active product.

```javascript
// Example per-subcategory state
pricingData: {
  'PRIVATE_COMPREHENSIVE': {
    sum_insured: 800000,
    addons: {
      excess_protector: true,
      pvt: false,
      loss_of_use: true,
      windscreen_value: 25000,     // Validation caps apply
      radio_cassette_value: 30000, // Validation thresholds apply
    }
  },
  'PRIVATE_THIRD_PARTY': {
    // FIXED pricing → no pricing fields
    addons: {
      // Optional add-ons supported by TP (if any) stay local here
      pvt: false,
    }
  }
}
```

Guidelines:

- Persist add-ons per subcategory only.
- Derived premiums for add-ons should not be kept globally; compute on demand from `pricingData[code].addons` alongside base premium and levies.
- UI should render only add-ons applicable to the current subcategory (see CSV-aligned rules below).

## Implementation Plan

### Phase 1: Update MotorInsuranceContext State Structure

**File**: `frontend/contexts/MotorInsuranceContext.js`

#### 1.1 Update Initial State

```javascript
const initialState = {
  // Category/Subcategory Selection
  selectedCategory: null,
  selectedSubcategory: null,
  productType: null,

  // ✅ NEW: Shared vehicle data (persists across all subcategories)
  sharedVehicleData: {
    registrationNumber: "",
    identificationType: "",
    cover_start_date: "",
    financialInterest: "",
    logbookNumber: "",
    chasisNumber: "",
    engineNumber: "",
    make: "",
    model: "",
    year: "",
    color: "",
    bodyType: "",
    purpose: "",
  },

  // ✅ NEW: Pricing data isolated per subcategory
  pricingData: {
    // Structure: { [subcategory_code]: { pricing_specific_fields } }
    // Example:
    // 'PRIVATE_THIRD_PARTY': {},
    // 'PRIVATE_COMPREHENSIVE': { sum_insured: 500000 },
    // 'COMMERCIAL_UPTO_3_TONS': { tonnage: 2.5 },
  },

  // ✅ MODIFIED: Underwriter state (separate, resets on subcategory change)
  selectedUnderwriter: null, // Full object, not string
  underwriterComparisons: [],
  isLoadingComparisons: false,
  comparisonError: null,

  // Client & Documents
  clientDetails: {},
  extractedDocuments: {},
  uploadedDocuments: {},
  clientDataSource: "logbook",

  // Add-ons
  // ⚠️ Deprecated: move add-ons into pricingData[code].addons
  // kept temporarily for backward compatibility
  selectedAddons: [],
  addonsPremium: 0,
  addonsBreakdown: [],

  // DMVIC Integration
  dmvicCache: {},
  dmvicCacheTTL: 30 * 60 * 1000,
  minCoverStartDate: null,
  existingCoverData: null,
  showVerificationScreen: false,
  dmvicProcessedRegMap: {},

  // Flow Control
  currentStep: 0,
  isLoading: false,
  errors: {},
  formValidation: {},

  // History (Undo/Redo)
  past: [],
  future: [],

  // ⚠️ DEPRECATED: Remove after migration
  // vehicleDetails: {},
  // pricingInputs: {},
  // subcategoryFormData: {},
};
```

#### 1.2 Update Reducer Actions

**Action 1: `SET_CATEGORY_SELECTION` (Subcategory Switch)**

```javascript
case 'SET_CATEGORY_SELECTION': {
  const newSubcategoryCode = action.payload.subcategory?.subcategory_code;
  const currentSubcategoryCode = state.selectedSubcategory?.subcategory_code;

  // Save current pricing data before switching
  let updatedPricingData = { ...state.pricingData };
  if (currentSubcategoryCode) {
    // Extract current pricing fields from wherever they are
    const currentPricingModel = state.selectedSubcategory?.pricing_model;
    const currentPricingFields = extractPricingFieldsForModel(
      state,
      currentPricingModel
    );

    updatedPricingData[currentSubcategoryCode] = currentPricingFields;

    console.log(`[Context] Saved pricing data for ${currentSubcategoryCode}:`, currentPricingFields);
  }

  // Load saved pricing data for new subcategory (if exists)
  const newPricingModel = action.payload.subcategory?.pricing_model;
  const restoredPricingData = updatedPricingData[newSubcategoryCode] ||
                               getDefaultPricingForModel(newPricingModel);

  console.log(`[Context] Switching to ${newSubcategoryCode}, restored pricing:`, restoredPricingData);

  return saveForHistory(state, {
    ...state,
    selectedCategory: action.payload.category,
    selectedSubcategory: action.payload.subcategory,
    productType: action.payload.productType || state.productType,

    // Update pricing data storage
    pricingData: {
      ...updatedPricingData,
      [newSubcategoryCode]: restoredPricingData
    },

    // ✅ CRITICAL: Reset underwriter state (force re-selection for new product)
    selectedUnderwriter: null,
    underwriterComparisons: [],
    isLoadingComparisons: false,
    comparisonError: null,
    lastComparisonTimestamp: null,

    // sharedVehicleData persists (not modified)

    // Clear DMVIC state when switching categories
    existingCoverData: null,
    minCoverStartDate: null,
    showVerificationScreen: false,
  });
}

// Helper functions
function extractPricingFieldsForModel(state, pricingModel) {
  const fields = PRICING_MODEL_FIELDS[pricingModel]?.fields || [];
  const extracted = {};

  // Try to extract from both vehicleDetails and pricingInputs (legacy support)
  fields.forEach(field => {
    extracted[field] = state.vehicleDetails?.[field] ||
                      state.pricingInputs?.[field] ||
                      null;
  });

  return extracted;
}

function getDefaultPricingForModel(pricingModel) {
  const fields = PRICING_MODEL_FIELDS[pricingModel]?.fields || [];
  const defaults = {};

  fields.forEach(field => {
    defaults[field] = null;  // Start with null, user will populate
  });

  return defaults;
}
```

**Action 2: `UPDATE_SHARED_VEHICLE_DATA` (New)**

```javascript
case 'UPDATE_SHARED_VEHICLE_DATA': {
  return saveForHistory(state, {
    ...state,
    sharedVehicleData: {
      ...state.sharedVehicleData,
      ...action.payload
    }
  });
}
```

**Action 3: `UPDATE_PRICING_DATA` (New)**

```javascript
case 'UPDATE_PRICING_DATA': {
  const currentSubcategoryCode = state.selectedSubcategory?.subcategory_code;

  if (!currentSubcategoryCode) {
    console.warn('[Context] Cannot update pricing data: No subcategory selected');
    return state;
  }

  const currentPricingData = state.pricingData[currentSubcategoryCode] || {};

  return saveForHistory(state, {
    ...state,
    pricingData: {
      ...state.pricingData,
      [currentSubcategoryCode]: {
        ...currentPricingData,
        ...action.payload
      }
    }
  });
}
```

Whitelist enforcement for pricing updates (prevents cross-model pollution):

```javascript
// Enforce that only fields valid for the current pricing model are written
function sanitizePricingUpdates(pricingModel, updates) {
  const allowed = new Set((PRICING_MODEL_FIELDS[pricingModel]?.fields || []).concat(['addons']));
  const clean = {};
  Object.keys(updates || {}).forEach((k) => {
    if (allowed.has(k)) clean[k] = updates[k];
  });
  return clean;
}

case 'UPDATE_PRICING_DATA': {
  const code = state.selectedSubcategory?.subcategory_code;
  if (!code) return state;
  const model = state.selectedSubcategory?.pricing_model;
  const current = state.pricingData[code] || {};
  const safeUpdates = sanitizePricingUpdates(model, action.payload);
  return saveForHistory(state, {
    ...state,
    pricingData: {
      ...state.pricingData,
      [code]: { ...current, ...safeUpdates },
    },
  });
}
```

**Action 4: `SET_SELECTED_UNDERWRITER` (Enhanced)**

```javascript
case 'SET_SELECTED_UNDERWRITER': {
  const incoming = action.payload;

  // Validate incoming underwriter object
  if (incoming && typeof incoming !== 'object') {
    console.error('[Context] Underwriter must be object, received:', typeof incoming);
    return state;
  }

  // Deduplication: Check if same underwriter already selected
  const existing = state.selectedUnderwriter;
  if (existing && incoming) {
    const isSame = (
      existing.code === incoming.code &&
      existing.name === incoming.name &&
      existing.total_premium === incoming.total_premium
    );

    if (isSame) {
      console.log('[Context] Ignoring duplicate underwriter selection');
      return state;  // Skip state update
    }
  }

  // Store full underwriter object with subcategory link
  const enhancedUnderwriter = incoming ? {
    ...incoming,
    subcategory_code: state.selectedSubcategory?.subcategory_code,
    selected_at: Date.now()
  } : null;

  return {
    ...state,
    selectedUnderwriter: enhancedUnderwriter
  };
}
```

#### 1.3 Add Context Actions (Exported)

```javascript
export const MotorInsuranceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(
    () => ({
      // Category/Subcategory Selection
      setCategorySelection: useCallback(
        (category, subcategory, productType) => {
          dispatch({
            type: "SET_CATEGORY_SELECTION",
            payload: { category, subcategory, productType },
          });
        },
        []
      ),

      // ✅ NEW: Shared vehicle data actions
      updateSharedVehicleData: useCallback((updates) => {
        dispatch({
          type: "UPDATE_SHARED_VEHICLE_DATA",
          payload: updates,
        });
      }, []),

      // ✅ NEW: Pricing data actions
      updatePricingData: useCallback((updates) => {
        dispatch({
          type: "UPDATE_PRICING_DATA",
          payload: updates,
        });
      }, []),

      // Underwriter actions
      setSelectedUnderwriter: useCallback((underwriter) => {
        dispatch({
          type: "SET_SELECTED_UNDERWRITER",
          payload: underwriter,
        });
      }, []),

      setUnderwriterComparisons: useCallback((comparisons) => {
        dispatch({
          type: "SET_PRICING_COMPARISON",
          payload: comparisons,
        });
      }, []),

      // ... other actions
    }),
    []
  );

  const value = useMemo(
    () => ({
      ...state,
      ...actions,
    }),
    [state, actions]
  );

  return (
    <MotorInsuranceContext.Provider value={value}>
      {children}
    </MotorInsuranceContext.Provider>
  );
};
```

---

### Phase 2: Update DynamicVehicleForm Component

**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`

#### 2.1 Update Component Props and State

```javascript
const DynamicVehicleForm = ({
  selectedProduct,
  onUnderwriterSelection,
  minCoverStartDate,
  dmvicLoading,
  dmvicError,
  existingCoverData,
}) => {
  // Get context data
  const {
    sharedVehicleData,
    pricingData,
    selectedUnderwriter,
    underwriterComparisons,
    isLoadingComparisons,
    updateSharedVehicleData,
    updatePricingData,
    setSelectedUnderwriter,
  } = useMotorInsurance();

  const subcategoryCode = selectedProduct.subcategory_code;
  const pricingModel = selectedProduct.pricing_model;

  // Get pricing data for current subcategory
  const currentPricingData = pricingData[subcategoryCode] || {};

  // Local form state (combines shared + pricing for display)
  const [localFormState, setLocalFormState] = useState({
    ...sharedVehicleData,
    ...currentPricingData,
  });

  // Sync local state when context updates
  useEffect(() => {
    setLocalFormState({
      ...sharedVehicleData,
      ...currentPricingData,
    });
  }, [sharedVehicleData, currentPricingData, subcategoryCode]);

  // ... rest of component
};
```

#### 2.2 Separate Field Handlers

```javascript
/**
 * Handle shared field changes (registration, cover date, etc.)
 * These fields persist across ALL subcategories
 */
const handleSharedFieldChange = useCallback(
  (field, value) => {
    console.log(`[Form] Shared field changed: ${field} = ${value}`);

    // Update local state immediately (smooth UI)
    setLocalFormState((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Debounced update to context (avoid re-renders)
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateSharedVehicleData({ [field]: value });
    }, 400);
  },
  [updateSharedVehicleData]
);

/**
 * Handle pricing field changes (sum_insured, tonnage, capacity)
 * These fields are isolated per subcategory
 */
const handlePricingFieldChange = useCallback(
  (field, value) => {
    console.log(`[Form] Pricing field changed: ${field} = ${value}`);

    // Update local state immediately
    setLocalFormState((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Update context pricing data
    const newPricingData = {
      ...currentPricingData,
      [field]: value,
    };
    updatePricingData(newPricingData);

    // Trigger underwriter comparison after pricing changes
    debouncedComparisonTrigger(newPricingData);
  },
  [currentPricingData, updatePricingData]
);

/**
 * Handle underwriter selection
 */
const handleUnderwriterSelect = useCallback(
  (underwriter) => {
    console.log("[Form] Underwriter selected:", underwriter.name);

    // Update context with full underwriter object
    setSelectedUnderwriter(underwriter);

    // Notify parent (for backward compatibility)
    onUnderwriterSelection?.(underwriter);

    // Mark as selected (prevents auto-re-fetch)
    underwriterSelectedRef.current = true;
  },
  [setSelectedUnderwriter, onUnderwriterSelection]
);
```

#### 2.3 Render Fields Based on Pricing Model

```javascript
/**
 * Render shared fields (always visible)
 */
const renderSharedFields = useMemo(
  () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vehicle Information</Text>

      <MemoizedTextInput
        fieldKey="registrationNumber"
        value={localFormState.registrationNumber || ""}
        onChangeText={(val) =>
          handleSharedFieldChange("registrationNumber", val)
        }
        placeholder="e.g., KDA 123A"
        autoCapitalize="characters"
        hasError={Boolean(errors.registrationNumber)}
      />

      <DatePicker
        label="Cover Start Date"
        value={localFormState.cover_start_date}
        onChange={(date) => handleSharedFieldChange("cover_start_date", date)}
        minimumDate={minCoverStartDate}
      />

      {/* ... other shared fields ... */}
    </View>
  ),
  [localFormState, handleSharedFieldChange, minCoverStartDate, errors]
);

/**
 * Render pricing fields (conditional on pricing model)
 */
const renderPricingFields = useMemo(() => {
  switch (pricingModel) {
    case "FIXED":
      // Third Party, TOR - no pricing fields
      return null;

    case "BRACKET":
      // Comprehensive - sum_insured
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coverage Amount</Text>

          <MemoizedTextInput
            fieldKey="sum_insured"
            value={formatCurrency(localFormState.sum_insured || 0)}
            onChangeText={(val) =>
              handlePricingFieldChange("sum_insured", parseCurrency(val))
            }
            placeholder="e.g., 500,000"
            keyboardType="numeric"
            hasError={Boolean(errors.sum_insured)}
          />

          <Text style={styles.hint}>
            Enter the current market value of your vehicle
          </Text>
        </View>
      );

    case "TONNAGE":
      // Commercial - tonnage
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Capacity</Text>

          <MemoizedTextInput
            fieldKey="tonnage"
            value={String(localFormState.tonnage || "")}
            onChangeText={(val) =>
              handlePricingFieldChange("tonnage", parseFloat(val))
            }
            placeholder="e.g., 2.5"
            keyboardType="numeric"
            hasError={Boolean(errors.tonnage)}
          />

          <Text style={styles.hint}>
            Enter vehicle tonnage capacity (e.g., 2.5 tons)
          </Text>
        </View>
      );

    case "PASSENGER":
      // PSV, TukTuk - capacity
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passenger Capacity</Text>

          <MemoizedTextInput
            fieldKey="capacity"
            value={String(localFormState.capacity || "")}
            onChangeText={(val) =>
              handlePricingFieldChange("capacity", parseInt(val))
            }
            placeholder="e.g., 14"
            keyboardType="numeric"
            hasError={Boolean(errors.capacity)}
          />

          <Text style={styles.hint}>Enter number of passenger seats</Text>
        </View>
      );

    default:
      return null;
  }
}, [pricingModel, localFormState, handlePricingFieldChange, errors]);

/**
 * Render underwriter comparison section
 */
const renderUnderwriterSection = useMemo(
  () => (
    <View style={styles.section} ref={underwriterSectionRef}>
      <Text style={styles.sectionTitle}>Select Insurance Provider</Text>

      {isLoadingComparisons ? (
        <LoadingIndicator text="Loading underwriter prices..." />
      ) : underwriterComparisons.length > 0 ? (
        <UnderwriterComparisonList
          comparisons={underwriterComparisons}
          selectedUnderwriter={selectedUnderwriter}
          onSelect={handleUnderwriterSelect}
        />
      ) : pricingModel !== "FIXED" ? (
        <Text style={styles.hint}>
          Enter required fields above to see underwriter prices
        </Text>
      ) : (
        <Text style={styles.hint}>Loading underwriter prices...</Text>
      )}
    </View>
  ),
  [
    isLoadingComparisons,
    underwriterComparisons,
    selectedUnderwriter,
    handleUnderwriterSelect,
    pricingModel,
  ]
);

// Main render
return (
  <ScrollView ref={scrollViewRef} style={styles.container}>
    {renderSharedFields}
    {renderPricingFields}
    {renderUnderwriterSection}
  </ScrollView>
);
```

---

### Phase 3: Update PolicyDetailsStep Parent Component

**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/PolicyDetails/PolicyDetailsStep.js`

#### 3.1 Simplified Parent Logic

```javascript
const PolicyDetailsStep = ({ navigation }) => {
  const {
    selectedSubcategory,
    sharedVehicleData,
    pricingData,
    selectedUnderwriter,
    minCoverStartDate,
    existingCoverData,
    dmvicLoading,
    dmvicError,
  } = useMotorInsurance();

  const subcategoryCode = selectedSubcategory?.subcategory_code;
  const currentPricingData = pricingData[subcategoryCode] || {};

  // Validate form before allowing next step
  const canProceed = useMemo(() => {
    // Check shared fields
    const hasRegistration = Boolean(sharedVehicleData.registrationNumber);
    const hasCoverDate = Boolean(sharedVehicleData.cover_start_date);

    // Check pricing fields (if required)
    const pricingModel = selectedSubcategory?.pricing_model;
    let hasPricingFields = true;

    if (pricingModel === "BRACKET") {
      hasPricingFields = Boolean(currentPricingData.sum_insured);
    } else if (pricingModel === "TONNAGE") {
      hasPricingFields = Boolean(currentPricingData.tonnage);
    } else if (pricingModel === "PASSENGER") {
      hasPricingFields = Boolean(currentPricingData.capacity);
    }

    // Check underwriter selection
    const hasUnderwriter = Boolean(selectedUnderwriter);

    return (
      hasRegistration && hasCoverDate && hasPricingFields && hasUnderwriter
    );
  }, [
    sharedVehicleData,
    currentPricingData,
    selectedUnderwriter,
    selectedSubcategory,
  ]);

  const handleNext = () => {
    if (!canProceed) {
      Alert.alert(
        "Incomplete Form",
        "Please fill all required fields and select an underwriter"
      );
      return;
    }

    navigation.navigate("ClientDetails");
  };

  return (
    <View style={styles.container}>
      <DynamicVehicleForm
        selectedProduct={selectedSubcategory}
        minCoverStartDate={minCoverStartDate}
        dmvicLoading={dmvicLoading}
        dmvicError={dmvicError}
        existingCoverData={existingCoverData}
      />

      <View style={styles.footer}>
        <Button
          title="Next: Client Details"
          onPress={handleNext}
          disabled={!canProceed}
          style={[styles.button, !canProceed && styles.buttonDisabled]}
        />
      </View>
    </View>
  );
};
```

---

## Migration Strategy

### Step 1: Backward Compatibility Layer (Temporary)

Add compatibility shims to prevent breaking existing code during migration:

```javascript
// frontend/contexts/MotorInsuranceContext.js

// Computed properties for backward compatibility
const contextValue = useMemo(() => {
  const subcategoryCode = state.selectedSubcategory?.subcategory_code;
  const currentPricingData = state.pricingData[subcategoryCode] || {};

  return {
    // New architecture
    ...state,
    ...actions,

    // ⚠️ DEPRECATED: Compatibility shims (remove after migration)
    vehicleDetails: {
      ...state.sharedVehicleData,
      ...currentPricingData,
      // Underwriter as string for legacy components
      underwriter: state.selectedUnderwriter?.name || "",
    },

    pricingInputs: {
      ...currentPricingData,
    },
  };
}, [state, actions]);
```

### Step 2: Gradual Migration Plan

**Week 1: Context Layer**

- ✅ Update `MotorInsuranceContext` with new state structure
- ✅ Add backward compatibility shims
- ✅ Add new actions (`updateSharedVehicleData`, `updatePricingData`)
- ✅ Test that existing code still works

**Week 2: DynamicVehicleForm**

- ✅ Update `DynamicVehicleForm` to use new context structure
- ✅ Separate field handlers (shared vs pricing)
- ✅ Update field rendering logic
- ✅ Test all 4 pricing models (FIXED, BRACKET, TONNAGE, PASSENGER)

**Week 3: Parent Components**

- ✅ Update `PolicyDetailsStep` to use new structure
- ✅ Update `SubcategorySelectionStep` to reset properly
- ✅ Update `MotorInsuranceContainer` orchestration
- ✅ Test subcategory switching flows

**Week 4: Remove Deprecated Code**

- ✅ Remove `vehicleDetails` compatibility shim
- ✅ Remove `pricingInputs` compatibility shim
- ✅ Remove `subcategoryFormData` (replaced by `pricingData`)
- ✅ Update all references in codebase
- ✅ Final integration testing

### Step 3: Testing Checklist

**Unit Tests**:

- [ ] Context reducer handles `UPDATE_SHARED_VEHICLE_DATA`
- [ ] Context reducer handles `UPDATE_PRICING_DATA`
- [ ] Context reducer handles `SET_CATEGORY_SELECTION` (saves/restores pricing data)
- [ ] Context reducer resets `selectedUnderwriter` on subcategory change
- [ ] Field classification helpers work correctly

**Integration Tests**:

- [ ] Switch Third Party → Comprehensive: shared fields persist, pricing resets
- [ ] Switch Comprehensive → Commercial: pricing fields isolated
- [ ] Switch PSV → TukTuk: both use PASSENGER model, data persists
- [ ] Underwriter selection resets when switching subcategories
- [ ] Form validation matches pricing model requirements

**Manual Tests**:

- [ ] Fill Third Party form, switch to Comprehensive, verify no bleeding
- [ ] Fill Comprehensive form (sum_insured=500k), switch to Third Party, verify sum_insured not visible
- [ ] Select underwriter in Third Party, switch to Comprehensive, verify underwriter reset
- [ ] Enter registration in Third Party, switch to Comprehensive, verify registration persists
- [ ] No "blinking" or excessive re-renders when typing
- [ ] Keyboard stays visible when typing (no dismissal)

---

## Performance Considerations

### 1. Memoization Strategy

```javascript
// Memoize expensive computations
const canProceed = useMemo(() => {
  // Validation logic
}, [sharedVehicleData, currentPricingData, selectedUnderwriter]);

const renderPricingFields = useMemo(() => {
  // Conditional rendering logic
}, [pricingModel, localFormState, errors]);
```

### 2. Debounced Updates

```javascript
// Debounce context updates (400ms for text input, 100ms for radio/select)
const handleSharedFieldChange = useCallback(
  (field, value) => {
    setLocalFormState((prev) => ({ ...prev, [field]: value }));

    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateSharedVehicleData({ [field]: value });
    }, 400);
  },
  [updateSharedVehicleData]
);
```

### 3. Refs for Performance-Critical Flags

```javascript
// Use refs instead of state for flags that trigger logic but don't need re-renders
const underwriterSelectedRef = useRef(false);
const hasComparisonsRef = useRef(false);

// Set refs directly (no re-render)
underwriterSelectedRef.current = true;

// Read refs in handlers (no dependency array issues)
if (!underwriterSelectedRef.current) {
  triggerComparison();
}
```

### 4. Cache Key Optimization

```javascript
// Bucket sum_insured to reduce cache misses
const cacheKey = makeKey([
  "UW_SUBCAT",
  subcategoryCode,
  Math.floor(sumInsured / 50000) * 50000, // Round to 50k
  tonnage || 0,
  capacity || 0,
]);
```

Notes:

- Always include `subcategoryCode` in cache keys so comparison results cannot be reused across different products.
- When add-ons affect premium display (e.g., windscreen add-on), compute add-on premium separately from cached base comparison to keep cache stable and avoid invalidation noise.

---

## CSV Feedback Alignment (Operational Rules)

This section aligns the separation model with the product requirements captured in the stakeholder CSV (PATA BIMA APP DEVELOPMENT MOTOR INSURANCE FEEDBACK).

Key mappings by pricing model:

- BRACKET (Comprehensive):

  - Require `sum_insured >= 500,000`.
  - Enforce valuation flow: initial cover capped at 30 days pending valuation; store `pricingData[code].initial_cover_days = 30`.
  - Add-ons:
    - `windscreen_value` allowed with cap: `≤ 300,000` (apply validation and cap in UI).
    - `radio_cassette_value` threshold: `≥ 30,000` to be considered.
    - `excess_protector`, `pvt`, `loss_of_use` optional, rendered only for comprehensive subclasses.

- FIXED (Third Party/TOR):

  - No `sum_insured` or valuation required.
  - Add-ons limited per subcategory policy (typically none, or only PVT if allowed). Keep them in `pricingData[code].addons` to avoid cross-bleed.

- TONNAGE (Commercial):

  - Require `tonnage` and support flags `is_prime_mover`, `is_over_limit`.
  - CSV constraint: “Tonnage <= 31 tons” – validate and gate inputs accordingly.
  - Comprehensive variants of commercial also follow valuation and add-on policies similar to BRACKET.

- PASSENGER (PSV/TukTuk):
  - Require `capacity` and capture passenger type (Student/Adult) where applicable:
    - Represent as `pricingData[code].passenger_type = 'Student' | 'Adult'` or map to `is_commercial_institutional` when aligned with backend model.
  - PLL pricing remains separate (if applicable) and should not bleed; store any PLL inputs under the same `pricingData[code]` scope.

UI gating based on CSV:

- Hide valuation/sum insured fields for TPO/TOR.
- Show add-on controls only when permitted by subcategory; use a per-subcategory add-on registry in metadata.
- Display validation hints for valuation (30-day initial cover), windscreen cap, and radio cassette threshold when add-ons are toggled.

Data placement summary:

- Shared, always-on fields → `sharedVehicleData.*`.
- Pricing-critical fields by model → `pricingData[code].*` (whitelisted).
- Add-ons → `pricingData[code].addons.*` only.
- Underwriter state → separate, reset on subcategory change.

---

## Future Enhancements

### 1. Form Draft Persistence

Save drafts to AsyncStorage for resuming later:

```javascript
// Save draft when user exits
const saveDraft = async () => {
  const draft = {
    selectedSubcategory: state.selectedSubcategory,
    sharedVehicleData: state.sharedVehicleData,
    pricingData: state.pricingData,
    timestamp: Date.now(),
  };

  await AsyncStorage.setItem("motor2_draft", JSON.stringify(draft));
};

// Load draft on mount
const loadDraft = async () => {
  const draft = await AsyncStorage.getItem("motor2_draft");
  if (draft) {
    const parsed = JSON.parse(draft);
    // Restore state...
  }
};
```

### 2. Multi-Product Comparison

Allow users to compare quotes across multiple subcategories:

```javascript
const comparisons = {
  PRIVATE_THIRD_PARTY: { premium: 3029.88, underwriter: "Madison" },
  PRIVATE_COMPREHENSIVE: { premium: 45800, underwriter: "Jubilee" },
};

// Show side-by-side comparison table
```

### 3. Smart Field Pre-filling

Use ML to predict likely values based on vehicle make/model:

```javascript
const predictedSumInsured = await mlService.predictSumInsured({
  make: "Toyota",
  model: "Prado",
  year: 2020,
});

// Pre-fill sum_insured field with prediction
```

### 4. Pricing Model Migration Helpers

Auto-migrate user from Third Party → Comprehensive when vehicle value justifies it:

```javascript
if (pricingModel === "FIXED" && vehicleValue > 1000000) {
  Alert.alert(
    "Consider Comprehensive Cover",
    "Your vehicle value suggests comprehensive cover may be beneficial",
    [
      { text: "Stay with Third Party" },
      {
        text: "Switch to Comprehensive",
        onPress: () => switchToComprehensive(),
      },
    ]
  );
}
```

---

## Conclusion

This refactor achieves:

✅ **Clean Separation**: Shared fields vs pricing fields vs underwriter state  
✅ **No Data Bleeding**: Subcategories fully isolated  
✅ **Performance**: Reduced re-renders, optimized memoization  
✅ **Maintainability**: Clear field classification, easy to extend  
✅ **Testability**: Unit testable state management  
✅ **User Experience**: Smooth transitions, no confusion

**Estimated Effort**: 3-4 weeks (with testing and migration)  
**Risk Level**: Medium (backward compatibility layer mitigates risk)  
**Priority**: High (fixes critical UX issue affecting all Motor 2 flows)

---

## Appendix: Field Classification Reference

### Shared Fields (17 total)

```
registrationNumber, identificationType, cover_start_date, financialInterest,
logbookNumber, chasisNumber, engineNumber, make, model, year, color, bodyType,
purpose, engineSize, fuelType, transmissionType, mileage
```

### Pricing Fields by Model

**FIXED** (0 fields): `[]`

**BRACKET** (1 field): `['sum_insured']`

**TONNAGE** (3 fields): `['tonnage', 'is_prime_mover', 'is_over_limit']`

**PASSENGER** (2 fields): `['capacity', 'is_commercial_institutional']`

### Underwriter State (5 properties)

```
selectedUnderwriter (object), underwriterComparisons (array),
isLoadingComparisons (boolean), comparisonError (object), lastComparisonTimestamp (number)
```

---

**Document Version**: 1.0  
**Last Updated**: November 30, 2025  
**Author**: GitHub Copilot (Senior Full-Stack Developer)  
**Status**: Ready for Implementation
