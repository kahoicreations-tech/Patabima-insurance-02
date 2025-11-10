# Motor2 Form Components Audit

## Date: November 10, 2025

## Status: Foundation components created ✅

---

## 1. DynamicVehicleForm Fields Inventory

### Core Fields (Always Present)

1. **financialInterest** (radio)

   - Options: ['Yes', 'No']
   - Required: Yes
   - Type: radio

2. **identificationType** (radio)

   - Options: ['Vehicle Registration', 'Chassis Number']
   - Required: Yes
   - Type: radio

3. **registrationNumber** / **chassisNumber** (text)

   - Label: Dynamic based on identificationType
   - Required: Yes
   - Type: text
   - Validation: Kenyan plate format or chassis number
   - **CRITICAL**: Keyboard dismissal issue - highest priority

4. **cover_start_date** (date)
   - Required: Yes
   - Type: date
   - Validation: minCoverStartDate from DMVIC
   - Default: Today's date

### Conditional Fields (Non-Third Party Products)

5. **make** (select/dropdown)

   - Required: Yes (for non-Third Party)
   - Type: select
   - Options: VEHICLE_MAKES array + 'Others'
   - Triggers: model field dependency

6. **make_other** (text)

   - Shown when: make === 'Others'
   - Required: Yes (conditional)
   - Type: text

7. **model** (select/text)

   - Required: Yes (for non-Third Party)
   - Type: select OR text (depends on make selection)
   - Options: getModelsForMake(make) + 'Others'
   - Dependency: Changes when make changes

8. **model_other** (text)

   - Shown when: model === 'Others'
   - Required: Yes (conditional)
   - Type: text

9. **year** (number)

   - Required: Yes (for non-Third Party)
   - Type: number
   - Validation: 1900 - currentYear + 1

10. **sum_insured** (formatted_number)
    - Shown when: Comprehensive products
    - Required: Yes (for Comprehensive)
    - Type: formatted_number
    - Validation: 50,000 - 50,000,000

### Special Field

11. **underwriter** (custom component)
    - Type: underwriter (custom rendering)
    - Required: No
    - Renders: UnderwriterCard list with pricing
    - **CRITICAL**: Blinking/re-fetch issue on keystroke

---

## 2. Current State Management Pattern

### State Variables

```javascript
const [formData, setFormData] = useState(initialData);
const [validationErrors, setValidationErrors] = useState({});
const [underwriterComparisons, setUnderwriterComparisons] = useState([]);
const [comparingUnderwriters, setComparingUnderwriters] = useState(false);
const [selectedUnderwriter, setSelectedUnderwriter] = useState(null);
```

### Refs (Current Implementation)

```javascript
const latestFormRef = useRef(formData);
const comparisonTriggerRef = useRef(null);
const comparisonTimeoutRef = useRef(null);
const notifyTimeoutRef = useRef(null);
const formDataUpdateTimeoutRef = useRef(null);
const underwriterSelectedRef = useRef(false);
const hasComparisonsRef = useRef(false);
```

### Parent Communication

- **onDataChange**: Called with debounce (250ms) on field changes
- **onUnderwriterSelection**: Called when underwriter selected
- **onChange**: Alternative prop for parent notification

---

## 3. Current Issues Identified

### Critical Issues

1. **Keyboard Dismissal**

   - Cause: State updates on every keystroke
   - Affected Fields: registrationNumber (most severe)
   - Impact: User experience severely degraded

2. **Underwriter List Blinking**

   - Cause: Effect re-runs on formData changes
   - Trigger: Any field interaction for Third Party/TOR
   - Impact: Visual flicker, unnecessary API calls (cached but still executed)

3. **Excessive Re-renders**
   - Cause: Dependencies include formData in callbacks/memos
   - Impact: Performance degradation

### Business Logic to Preserve

#### 1. DMVIC Integration

- Triggers on: registrationNumber change (for Third Party/TOR)
- Triggers on: cover_start_date change
- Auto-fills: make, model, year, chassisNumber
- Sets: isLocked flag, isAutoFilled metadata
- Must work with new controlled components

#### 2. Underwriter Comparison Logic

- **Third Party/TOR**: Fetch once on mount (fixed pricing)
- **Comprehensive**: Fetch on Underwriter Selection screen (variable pricing)
- **Commercial**: Depends on tonnage
- **PSV**: Depends on passengerCapacity
- Cache key generation must remain stable

#### 3. Field Dependencies

- make changes → reset model if invalid
- make === 'Others' → show make_other
- model === 'Others' → show model_other
- identificationType → changes registrationNumber label/placeholder

#### 4. Validation Timing

- Real-time: Show errors immediately on input
- Parent notification: Debounced to prevent re-renders
- Form submission: Validate all fields before proceeding

---

## 4. Foundation Components Created

### ✅ ControlledTextInput

**File**: `frontend/components/forms/ControlledTextInput.js`

- Memoized with custom comparison
- Props: value, onChangeText, label, required, error, placeholder, etc.
- Stable handlers support
- Consistent styling (Poppins font, PataBima colors)

### ✅ ControlledRadioGroup

**File**: `frontend/components/forms/ControlledRadioGroup.js`

- Memoized radio button group
- Stable option selection handlers
- Props: label, required, options, value, onChange, error

### ✅ useMotorFormField Hook

**File**: `frontend/hooks/useMotorFormField.js`

- Manages field state with refs
- Debounced parent notifications
- Real-time validation
- Returns: { value, error, handleChange, setValue, setError, resetError, latestValue }

### ✅ Validation Utilities

**File**: `frontend/utils/motorFormValidation.js`

- validateKenyanRegistration
- validateChassisNumber
- validateYear
- validateSumInsured
- validateTonnage
- validatePassengerCapacity
- validateEngineCapacity
- validateCoverStartDate
- validateEmail
- validatePhoneNumber
- validateIDNumber
- validateRequired (generic)
- formatCurrency, parseCurrency helpers

---

## 5. Migration Strategy

### Phase 1: Registration Field (HIGHEST PRIORITY)

**Goal**: Eliminate keyboard dismissal on the most critical field

**Steps**:

1. Import ControlledTextInput, useMotorFormField, validateKenyanRegistration/validateChassisNumber
2. Replace existing registration TextInput with ControlledTextInput
3. Use useMotorFormField hook for state management
4. Test keyboard persistence
5. Verify DMVIC auto-fill still works

**Success Criteria**:

- Keyboard stays visible during typing
- Validation shows immediately
- DMVIC integration unaffected
- Parent receives debounced notifications

### Phase 2: Radio Groups

**Goal**: Stable selection handlers, no re-renders

**Fields**:

- financialInterest
- identificationType

**Success Criteria**:

- Selections don't trigger underwriter re-fetch
- No visual glitches
- Validation works

### Phase 3: Other Text Fields

**Fields**:

- make_other
- model_other
- year
- sum_insured (if Comprehensive)

**Success Criteria**:

- Same keyboard persistence as registration
- Validation works correctly
- Formatting works (sum_insured with spaces)

### Phase 4: Select Dropdowns

**Note**: Need to create ControlledSelect component first

**Fields**:

- make
- model

**Complexity**: model depends on make selection

### Phase 5: Date Picker

**Note**: Need to create ControlledDatePicker wrapper

**Field**: cover_start_date

**Complexity**: minCoverStartDate validation from DMVIC

---

## 6. Testing Checklist (Per Field)

### Registration Field Test

- [ ] Open Third Party product
- [ ] Tap registration field
- [ ] Type "K" → Keyboard visible ✓
- [ ] Type "KDA 123A" → Keyboard visible ✓
- [ ] Validation error shows if invalid
- [ ] DMVIC triggers on valid plate
- [ ] Auto-fill works correctly
- [ ] Underwriters don't re-fetch
- [ ] Parent notified with debounce

### Radio Group Test

- [ ] Toggle financialInterest → No re-fetch
- [ ] Toggle identificationType → Label changes ✓
- [ ] No visual glitches
- [ ] Parent notified

### Select Dropdown Test

- [ ] Open make dropdown
- [ ] Select value
- [ ] Dropdown closes
- [ ] model resets if needed
- [ ] No keyboard dismissal

---

## 7. Key Architectural Decisions

### Decision 1: Ref-Based State Management

**Rationale**: Avoid dependency arrays that include form state
**Implementation**: latestFormRef.current for reading values without triggering recalculation

### Decision 2: Debounced Parent Notifications

**Rationale**: Prevent parent re-renders on every keystroke
**Implementation**: useMotorFormField hook with 250ms default debounce

### Decision 3: Memoized Components with Custom Comparison

**Rationale**: Prevent re-renders when props haven't changed
**Implementation**: React.memo with comparison function checking specific props

### Decision 4: Separate Validation from State Updates

**Rationale**: Show errors immediately, but delay parent notification
**Implementation**: Validate on every change, debounce onNotify callback

### Decision 5: Preserve All Business Logic

**Rationale**: Avoid introducing bugs in working features
**Implementation**: Extract current logic into validation utilities, maintain exact behavior

---

## 8. Next Steps

### Immediate (In Progress)

1. ✅ Create ControlledTextInput component
2. ✅ Create ControlledRadioGroup component
3. ✅ Create useMotorFormField hook
4. ✅ Create validation utilities
5. ⏳ Refactor registration field in DynamicVehicleForm
6. ⏳ Test keyboard persistence
7. ⏳ Verify DMVIC integration

### Upcoming

8. Refactor radio groups (financialInterest, identificationType)
9. Refactor other text fields
10. Create ControlledSelect component
11. Refactor select dropdowns
12. Create ControlledDatePicker wrapper
13. Refactor date picker
14. Remove debug logs
15. Comprehensive testing

---

## 9. Risks & Mitigation

### Risk 1: Breaking DMVIC Integration

**Impact**: High
**Mitigation**: Test auto-fill immediately after registration field refactor
**Rollback**: Git revert if integration breaks

### Risk 2: Underwriter Comparison Still Re-triggers

**Impact**: Medium
**Mitigation**: Keep guard logic in place, test with Third Party product
**Rollback**: Maintain current guard implementation

### Risk 3: Performance Regression

**Impact**: Medium
**Mitigation**: Use React DevTools Profiler to measure before/after
**Target**: Max 2 renders per keystroke

### Risk 4: Validation Behavior Changes

**Impact**: Low
**Mitigation**: Use exact same validation functions, test edge cases
**Rollback**: Copy validation logic from current implementation

---

**Last Updated**: November 10, 2025, 10:45 PM
**Next Review**: After registration field refactor complete
**Status**: Foundation ready, starting registration field migration
