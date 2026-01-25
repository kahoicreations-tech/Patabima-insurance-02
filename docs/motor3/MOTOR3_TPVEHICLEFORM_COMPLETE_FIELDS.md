# Motor 3 TPVehicleForm - Complete Field Implementation

## Current Status: ❌ INCOMPLETE

TPVehicleForm currently has only **6 basic fields** but needs **all Motor2 fields** (16+ fields) to collect proper vehicle data for policy creation.

## Missing Fields (Critical for Policy Creation)

### Vehicle Details Section (Currently Missing)

- ❌ **make** - Vehicle make (e.g., Toyota, Nissan) - Dropdown with VEHICLE_MAKES
- ❌ **make_other** - Manual entry when "Others" selected
- ❌ **model** - Vehicle model (e.g., Corolla, Vitz) - Dynamic dropdown based on make
- ❌ **model_other** - Manual entry when "Others" selected
- ❌ **year** - Year of manufacture (e.g., 2016) - Number input or dropdown (last 30 years)
- ❌ **color** - Vehicle color - Dropdown (White, Silver, Black, etc.)
- ❌ **bodyType** - Body type - Dropdown (Sedan, SUV, Truck, Van, Bus, Motorcycle)
- ❌ **logbookNumber** - Logbook number - Text input (auto-filled from DMVIC)
- ❌ **chassisNumber** - Chassis number - Text input (auto-filled from DMVIC, or manual if not using registration)
- ❌ **engineNumber** - Engine number - Text input (auto-filled from DMVIC)

### Currently Implemented Fields ✅

- ✅ registrationNumber (or chassisNumber based on identificationType)
- ✅ identificationType (Vehicle Registration vs Chassis Number)
- ✅ cover_start_date
- ✅ financialInterest
- ✅ tonnage (conditional - for Commercial vehicles)
- ✅ capacity (conditional - for PSV vehicles)

## Implementation Plan

### Step 1: Update Imports

**Current imports** in TPVehicleForm.js (lines 10-16):

```javascript
import {
  StableTextInput,
  RadioGroup,
  DatePicker,
  TonnageSelector,
  PassengerCapacityInput,
} from "../../components";
```

**Add these imports**:

```javascript
import {
  StableTextInput,
  RadioGroup,
  DatePicker,
  DropdownSelect, // NEW: For color, bodyType
  VehicleMakeSelector, // NEW: Enhanced make selector
  VehicleModelSelector, // NEW: Dynamic model selector
  VehicleYearSelector, // NEW: Year selector (last 30 years)
  TonnageSelector,
  PassengerCapacityInput,
} from "../../components";
```

**Add vehicle catalog import**:

```javascript
import {
  VEHICLE_MAKES,
  getModelsForMake,
} from "../../../../constants/vehicleCatalog";
```

**Replace validation imports**:

```javascript
// OLD:
import {
  validateRegistrationNumber,
  validateCoverStartDate,
} from "../../utils/motor3Validation";

// NEW:
import {
  validateKenyanRegistration,
  validateChassisNumber,
  validateCoverStartDate,
  validateRequired,
} from "../../utils/enhancedValidation";
```

### Step 2: Add Local State for Vehicle Details

**Add after existing local state** (around line 33):

```javascript
// Existing:
const [localRegistration, setLocalRegistration] = useState(
  formData.registrationNumber || ""
);
const [localCoverDate, setLocalCoverDate] = useState(
  formData.cover_start_date || ""
);
const [localTonnage, setLocalTonnage] = useState(formData.tonnage || null);
const [localCapacity, setLocalCapacity] = useState(formData.capacity || null);

// ADD THESE:
const [localMake, setLocalMake] = useState("");
const [localMakeOther, setLocalMakeOther] = useState("");
const [localModel, setLocalModel] = useState("");
const [localModelOther, setLocalModelOther] = useState("");
const [localYear, setLocalYear] = useState("");
const [localColor, setLocalColor] = useState("");
const [localBodyType, setLocalBodyType] = useState("");
const [localLogbook, setLocalLogbook] = useState("");
const [localChassisNum, setLocalChassisNum] = useState("");
const [localEngineNum, setLocalEngineNum] = useState("");
```

### Step 3: Add isThirdPartyLike Logic

**Add after pricingModel useMemo** (around line 52):

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

### Step 4: Add Vehicle Detail Handlers

**Add after existing handlers** (around line 150):

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

### Step 5: Add Model Options useMemo

**Add before return statement**:

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

### Step 6: Add Vehicle Details Section to JSX

**Add after "Cover Details" formSection and BEFORE tonnage/capacity section** (around line 240):

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

## Why These Fields Are Critical

### Business Requirements

- **make/model/year**: Required for DMVIC verification and policy documents
- **logbook/chassis/engine**: Legal vehicle identification (Kenyan law compliance)
- **color/bodyType**: Required for claims processing and vehicle identification

### Motor2 Has These Fields

- Motor2's `DynamicVehicleForm` collects ALL these fields (lines 191-285)
- Motor2 uses dynamic field generation with `getFormFields` useMemo
- Motor2 has conditional logic: Third-Party/TOR skip vehicle details, Comprehensive requires them

### User's Requirement

> "we dont have the input fields in Motor3, please check and complete, the fields should be the same as those in motor2 same as the steps flow"

Motor3 must collect the same data as Motor2 to enable proper policy creation.

## Implementation Priority

1. **CRITICAL (Now)**: Add vehicle details section with all fields
2. **HIGH**: Integrate DMVIC auto-fill for logbook/chassis/engine
3. **MEDIUM**: Add validation for all new fields
4. **MEDIUM**: Test with Third-Party (should skip vehicle details) vs Comprehensive (should show all fields)

## Files That Need Updates

1. **TPVehicleForm.js** - Add missing fields (this document)
2. **ThirdPartyContext.js** - Ensure state includes make, model, year, color, bodyType, logbook, chassis, engine fields
3. **enhancedValidation.js** - Already has required validators (validateKenyanRegistration, validateChassisNumber, etc.)

## Enhanced Components Already Created ✅

- ✅ VehicleMakeSelector.js (55 lines) - Uses VEHICLE_MAKES catalog
- ✅ VehicleModelSelector.js (85 lines) - Dynamic models based on make
- ✅ VehicleYearSelector.js (77 lines) - Last 30 years dropdown
- ✅ DropdownSelect.js (362 lines) - Searchable dropdown for color/bodyType
- ✅ StableTextInput.js (existing) - For logbook/chassis/engine

All components are ready - just need to wire them into TPVehicleForm!

## Next Steps

1. Update TPVehicleForm.js imports (Step 1)
2. Add local state for vehicle details (Step 2)
3. Add isThirdPartyLike logic (Step 3)
4. Add all handlers (Step 4)
5. Add options useMemos (Step 5)
6. Add vehicle details JSX section (Step 6)
7. Test with Third-Party product (should hide vehicle details)
8. Test with Comprehensive product (should show vehicle details)
9. Verify DMVIC auto-fill populates logbook/chassis/engine correctly

## Testing Checklist

- [ ] Third-Party: Vehicle details section hidden (isThirdPartyLike = true)
- [ ] Comprehensive: Vehicle details section visible (isThirdPartyLike = false)
- [ ] Make dropdown populates from VEHICLE_MAKES
- [ ] Model dropdown changes when make selected
- [ ] "Others" option shows text input for make/model
- [ ] Year selector shows last 30 years
- [ ] Color/bodyType dropdowns are searchable
- [ ] DMVIC auto-fills logbook/chassis/engine when vehicle verified
- [ ] Fields lock (disabled) when DMVIC data present
- [ ] All validation works (required fields, formats, etc.)
