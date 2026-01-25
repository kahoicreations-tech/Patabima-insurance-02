# Motor3 TPVehicleForm - Exact Code to Add

## File: frontend/screens/quotations/Motor3/third-party/components/TPVehicleForm.js

### ✅ VERIFIED: Context Already Has All Fields

ThirdPartyContext.js (lines 23-28) already includes:

```javascript
make: '',
model: '',
year: '',
color: '',
logbookNumber: '',
engineNumber: '',
```

Plus `chassisNumber` in UPDATE_FIELD reducer. Context is complete!

### ✅ VERIFIED: Enhanced Components Exist

All components ready at `frontend/screens/quotations/Motor3/components/`:

- VehicleMakeSelector.js (55 lines)
- VehicleModelSelector.js (85 lines)
- VehicleYearSelector.js (77 lines)
- DropdownSelect.js (362 lines)
- StableTextInput.js (existing)

### ✅ VERIFIED: Vehicle Catalog Exists

File: `frontend/constants/vehicleCatalog.js`

```javascript
export const VEHICLE_MAKES = ['Toyota', 'Nissan', 'Honda', ...]; // 15 makes
export const VEHICLE_MODELS = { Toyota: ['Corolla', 'Axio', ...], ... };
export function getModelsForMake(make) { return VEHICLE_MODELS[make] || []; }
```

---

## CODE ADDITIONS REQUIRED

### 1. Update Imports (Lines 10-16)

**FIND:**

```javascript
import {
  StableTextInput,
  RadioGroup,
  DatePicker,
  TonnageSelector,
  PassengerCapacityInput,
} from "../../components";
```

**REPLACE WITH:**

```javascript
import {
  StableTextInput,
  RadioGroup,
  DatePicker,
  DropdownSelect,
  VehicleMakeSelector,
  VehicleModelSelector,
  VehicleYearSelector,
  TonnageSelector,
  PassengerCapacityInput,
} from "../../components";
```

**FIND:**

```javascript
import {
  validateRegistrationNumber,
  validateCoverStartDate,
} from "../../utils/motor3Validation";
import {
  getProductFieldConfig,
  PRODUCT_PRICING_MODEL,
} from "../../utils/productFieldConfig";
```

**REPLACE WITH:**

```javascript
import {
  validateKenyanRegistration,
  validateChassisNumber,
  validateCoverStartDate,
  validateRequired,
} from "../../utils/enhancedValidation";
import {
  VEHICLE_MAKES,
  getModelsForMake,
} from "../../../../constants/vehicleCatalog";
```

### 2. Update Context Destructuring (Line 20-28)

**FIND:**

```javascript
const {
  formData,
  updateField,
  updateMultipleFields,
  dmvicData,
  isDataLocked,
  errors,
  setErrors,
  clearError,
} = useThirdParty();
```

**REPLACE WITH:**

```javascript
const {
  selectedProduct,
  registrationNumber,
  identificationType,
  cover_start_date,
  financialInterest,
  make,
  model,
  year,
  color,
  bodyType,
  logbookNumber,
  chassisNumber,
  engineNumber,
  updateField,
  updateMultipleFields,
  dmvicData,
  isDataLocked,
  errors,
  setErrors,
  clearError,
} = useThirdParty();
```

### 3. Add Local State (After Line 33)

**FIND:**

```javascript
const [localRegistration, setLocalRegistration] = useState(
  formData.registrationNumber || ""
);
const [localCoverDate, setLocalCoverDate] = useState(
  formData.cover_start_date || ""
);
const [localTonnage, setLocalTonnage] = useState(formData.tonnage || null);
const [localCapacity, setLocalCapacity] = useState(formData.capacity || null);
```

**ADD AFTER:**

```javascript
const [localMake, setLocalMake] = useState(make || "");
const [localMakeOther, setLocalMakeOther] = useState("");
const [localModel, setLocalModel] = useState(model || "");
const [localModelOther, setLocalModelOther] = useState("");
const [localYear, setLocalYear] = useState(year || "");
const [localColor, setLocalColor] = useState(color || "");
const [localBodyType, setLocalBodyType] = useState(bodyType || "");
const [localLogbook, setLocalLogbook] = useState(logbookNumber || "");
const [localChassisNum, setLocalChassisNum] = useState(chassisNumber || "");
const [localEngineNum, setLocalEngineNum] = useState(engineNumber || "");
```

### 4. Add isThirdPartyLike Logic (After Line 52)

**FIND:**

```javascript
const needsTonnage = useMemo(() => {
  return pricingModel === "TONNAGE" || pricingModel.includes("TONNAGE");
}, [pricingModel]);
```

**ADD AFTER:**

```javascript
// Determine if we should show vehicle details (NOT for Third-Party/TOR)
const isThirdPartyLike = useMemo(() => {
  const coverageType = selectedSubcategory?.coverage_type?.toLowerCase() || "";
  const code = subcategoryCode?.toLowerCase() || "";

  return (
    coverageType.includes("third_party") ||
    coverageType.includes("third-party") ||
    coverageType === "tor" ||
    code.includes("tor") ||
    code.includes("third_party") ||
    code.includes("third-party")
  );
}, [selectedSubcategory, subcategoryCode]);
```

### 5. Update Registration Validation (Line 100)

**FIND:**

```javascript
const result = validateRegistrationNumber(value);
```

**REPLACE WITH:**

```javascript
// Validate based on identification type
const validator =
  identificationType === "Chassis Number"
    ? validateChassisNumber
    : validateKenyanRegistration;

const result = validator(value);
```

### 6. Add Vehicle Detail Handlers (After Line 150)

**ADD THESE HANDLERS:**

```javascript
// Make change handler
const handleMakeChange = useCallback(
  (value) => {
    setLocalMake(value);
    updateField("make", value);
    clearError("make");

    // Reset model when make changes
    setLocalModel("");
    updateField("model", "");
    clearError("model");
  },
  [updateField, clearError]
);

// Model change handler
const handleModelChange = useCallback(
  (value) => {
    setLocalModel(value);
    updateField("model", value);
    clearError("model");
  },
  [updateField, clearError]
);

// Year change handler
const handleYearChange = useCallback(
  (value) => {
    setLocalYear(value);
    updateField("year", value);
    clearError("year");
  },
  [updateField, clearError]
);

// Make Other change handler
const handleMakeOtherChange = useCallback(
  (value) => {
    setLocalMakeOther(value);
    updateField("make_other", value);
    clearError("make_other");
  },
  [updateField, clearError]
);

// Model Other change handler
const handleModelOtherChange = useCallback(
  (value) => {
    setLocalModelOther(value);
    updateField("model_other", value);
    clearError("model_other");
  },
  [updateField, clearError]
);

// Color change handler
const handleColorChange = useCallback(
  (value) => {
    setLocalColor(value);
    updateField("color", value);
    clearError("color");
  },
  [updateField, clearError]
);

// Body Type change handler
const handleBodyTypeChange = useCallback(
  (value) => {
    setLocalBodyType(value);
    updateField("bodyType", value);
    clearError("bodyType");
  },
  [updateField, clearError]
);

// Logbook change handler
const handleLogbookChange = useCallback(
  (value) => {
    setLocalLogbook(value);
    updateField("logbookNumber", value);
    clearError("logbookNumber");
  },
  [updateField, clearError]
);

// Chassis Number change handler (for manual entry)
const handleChassisNumChange = useCallback(
  (value) => {
    setLocalChassisNum(value);
    updateField("chassisNumber", value);
    clearError("chassisNumber");
  },
  [updateField, clearError]
);

// Engine Number change handler
const handleEngineNumChange = useCallback(
  (value) => {
    setLocalEngineNum(value);
    updateField("engineNumber", value);
    clearError("engineNumber");
  },
  [updateField, clearError]
);
```

### 7. Add Options useMemos (Before return statement)

**ADD BEFORE `return (`:**

```javascript
// Get model options based on selected make
const modelOptions = useMemo(() => {
  if (!localMake || localMake === "Others") {
    return [{ value: "Others", label: "Other (Manual Entry)" }];
  }

  const models = getModelsForMake(localMake);
  if (!models || models.length === 0) {
    return [{ value: "Others", label: "Other (Manual Entry)" }];
  }

  return [
    ...models.map((m) => ({ value: m, label: m })),
    { value: "Others", label: "Other (Manual Entry)" },
  ];
}, [localMake]);

// Color options
const colorOptions = useMemo(
  () => [
    { value: "White", label: "White" },
    { value: "Silver", label: "Silver" },
    { value: "Black", label: "Black" },
    { value: "Gray", label: "Gray" },
    { value: "Blue", label: "Blue" },
    { value: "Red", label: "Red" },
    { value: "Green", label: "Green" },
    { value: "Yellow", label: "Yellow" },
    { value: "Brown", label: "Brown" },
    { value: "Other", label: "Other" },
  ],
  []
);

// Body Type options
const bodyTypeOptions = useMemo(
  () => [
    { value: "Sedan", label: "Sedan" },
    { value: "SUV", label: "SUV" },
    { value: "Hatchback", label: "Hatchback" },
    { value: "Truck", label: "Truck" },
    { value: "Van", label: "Van" },
    { value: "Bus", label: "Bus" },
    { value: "Pickup", label: "Pickup" },
    { value: "Motorcycle", label: "Motorcycle" },
    { value: "Other", label: "Other" },
  ],
  []
);
```

### 8. Add Vehicle Details Section to JSX (After Cover Details section, BEFORE Tonnage section)

**FIND (around line 240):**

```javascript
</View>

{/* Additional fields based on subcategory */}
{(needsTonnage || needsCapacity) && (
```

**INSERT BETWEEN THESE (after </View>, before {(needsTonnage...):**

```javascript
{
  /* Section 4: Vehicle Details (Only for non-Third-Party products) */
}
{
  !isThirdPartyLike && (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Vehicle Details</Text>

      <VehicleMakeSelector
        value={localMake}
        onValueChange={handleMakeChange}
        required
        error={errors.make}
        disabled={isDataLocked}
      />

      {localMake === "Others" && (
        <StableTextInput
          label="Specify Vehicle Make"
          value={localMakeOther}
          onChangeText={handleMakeOtherChange}
          placeholder="Enter vehicle make"
          required
          error={errors.make_other}
          autoCapitalize="words"
        />
      )}

      {localMake && localMake !== "Others" ? (
        <>
          <DropdownSelect
            label="Vehicle Model"
            value={localModel}
            options={modelOptions}
            onValueChange={handleModelChange}
            placeholder="Select vehicle model"
            required
            searchable
            error={errors.model}
            disabled={isDataLocked}
          />

          {localModel === "Others" && (
            <StableTextInput
              label="Specify Vehicle Model"
              value={localModelOther}
              onChangeText={handleModelOtherChange}
              placeholder="Enter vehicle model"
              required
              error={errors.model_other}
              autoCapitalize="words"
            />
          )}
        </>
      ) : (
        localMake &&
        localMake !== "Others" && (
          <StableTextInput
            label="Vehicle Model"
            value={localModel}
            onChangeText={handleModelChange}
            placeholder="Axio"
            required
            error={errors.model}
            autoCapitalize="words"
          />
        )
      )}

      <VehicleYearSelector
        value={localYear}
        onValueChange={handleYearChange}
        required
        error={errors.year}
        disabled={isDataLocked}
      />

      <DropdownSelect
        label="Vehicle Color"
        value={localColor}
        options={colorOptions}
        onValueChange={handleColorChange}
        placeholder="Select vehicle color"
        searchable
        error={errors.color}
      />

      <DropdownSelect
        label="Body Type"
        value={localBodyType}
        options={bodyTypeOptions}
        onValueChange={handleBodyTypeChange}
        placeholder="Select body type"
        searchable
        error={errors.bodyType}
      />

      <StableTextInput
        label="Logbook Number"
        value={localLogbook}
        onChangeText={handleLogbookChange}
        placeholder="Enter logbook number"
        error={errors.logbookNumber}
        editable={!isDataLocked}
        helpText={dmvicData ? "Auto-filled from DMVIC verification" : undefined}
      />

      <StableTextInput
        label="Chassis Number"
        value={localChassisNum}
        onChangeText={handleChassisNumChange}
        placeholder="Enter chassis number"
        error={errors.chassisNumber}
        editable={!isDataLocked}
        helpText={dmvicData ? "Auto-filled from DMVIC verification" : undefined}
      />

      <StableTextInput
        label="Engine Number"
        value={localEngineNum}
        onChangeText={handleEngineNumChange}
        placeholder="Enter engine number"
        error={errors.engineNumber}
        editable={!isDataLocked}
        helpText={dmvicData ? "Auto-filled from DMVIC verification" : undefined}
      />
    </View>
  );
}
```

---

## Summary of Changes

### Imports Updated:

- Added 4 new component imports (DropdownSelect, VehicleMakeSelector, VehicleModelSelector, VehicleYearSelector)
- Replaced motor3Validation with enhancedValidation
- Added vehicleCatalog import (VEHICLE_MAKES, getModelsForMake)

### State Updated:

- Added 10 local state variables for vehicle details
- Updated context destructuring to get vehicle detail fields directly

### Logic Added:

- isThirdPartyLike useMemo (determines if vehicle details should show)
- 9 new handlers for vehicle detail changes
- 3 new options useMemos (modelOptions, colorOptions, bodyTypeOptions)

### JSX Added:

- Complete "Vehicle Details" formSection (100+ lines)
- Conditional rendering based on !isThirdPartyLike
- Make/model with "Others" fallback
- Year, color, bodyType dropdowns
- Logbook, chassis, engine text inputs

### Result:

TPVehicleForm will now collect ALL vehicle details that Motor2 collects:

- ✅ Same fields as Motor2
- ✅ Same conditional logic (Third-Party hides vehicle details)
- ✅ Same "Others" fallback for make/model
- ✅ Enhanced components (better UX)
- ✅ Same Motor2 styling (already verified in visual comparison)

---

## Files to Modify

**ONLY 1 FILE NEEDS CHANGES:**

- `frontend/screens/quotations/Motor3/third-party/components/TPVehicleForm.js`

All other files (context, components, validation, catalog) are already complete!

---

## Testing After Implementation

1. **Third-Party Product**: Vehicle details section should be HIDDEN
2. **Comprehensive Product**: Vehicle details section should be VISIBLE
3. **Make Dropdown**: Should populate with 15 makes from VEHICLE_MAKES
4. **Model Dropdown**: Should dynamically load based on selected make
5. **"Others" Fallback**: Should show text input when "Others" selected
6. **Year Selector**: Should show last 30 years
7. **Color/BodyType**: Should be searchable dropdowns
8. **DMVIC Integration**: Should auto-fill logbook/chassis/engine when vehicle verified
9. **Field Locking**: Fields should disable when isDataLocked = true (DMVIC data present)
10. **Validation**: All fields should validate correctly (required, format, etc.)
