# Motor 2 Insurance Flow - State Persistence Implementation

## Overview

Implemented comprehensive state persistence for the Motor 2 insurance quotation flow using React Context API with reducers and AsyncStorage. This ensures users never lose their progress when navigating back/forth or even when closing the app.

## Architecture

### 1. **Context-Based State Management**

- **File**: `frontend/contexts/MotorInsuranceContext.js`
- **Pattern**: React Context API with useReducer hook
- **Why**: Industry-standard approach for complex multi-step forms, recommended by React documentation

### 2. **Persistent State Storage**

All critical user data is automatically saved to AsyncStorage:

- ✅ Selected category and subcategory
- ✅ Vehicle details (registration, make, model, year, etc.)
- ✅ Pricing inputs (sum insured, tonnage, passenger capacity, etc.)
- ✅ Client details (name, phone, email, KRA PIN, etc.)
- ✅ Extracted document data (logbook, KRA, ID)
- ✅ Selected underwriter
- ✅ Selected add-ons
- ✅ Current step position
- ✅ Subcategory-specific form data (prevents data bleeding)

### 3. **Key Features**

#### **Automatic Persistence**

- State automatically saves to AsyncStorage every 500ms (debounced)
- No manual save buttons needed
- Survives app restarts and background states

#### **Intelligent State Restoration**

- On app launch, automatically restores last session
- Validates restored data before applying
- Gracefully handles corrupted storage data

#### **Form Data Isolation**

- Each subcategory maintains its own form data
- Switching between Private/Commercial/PSV doesn't lose entered data
- Users can switch back and forth without re-entering information

#### **Navigation State**

- Current step position is preserved
- Users continue exactly where they left off
- Back/forward navigation maintains all selections

#### **Undo/Redo Support**

- Built-in history tracking for major state changes
- Users can undo accidental changes
- Future state preserved for redo operations

## Implementation Details

### State Structure

```javascript
{
  // Product Selection
  selectedCategory: { key, title, category_code, ... },
  selectedSubcategory: { subcategory_code, name, type, ... },
  productType: { /* product configuration */ },

  // Form Data
  vehicleDetails: { registrationNumber, make, model, year, ... },
  pricingInputs: { sumInsured, tonnage, passengerCapacity, ... },
  clientDetails: { firstName, lastName, phoneNumber, email, ... },
  extractedDocuments: { logbook: {...}, kra_pin: {...}, id_copy: {...} },

  // Pricing & Selection
  availableUnderwriters: [...],
  selectedUnderwriter: { code, name, premium, ... },
  selectedAddons: [...],
  addonsPremium: 0,

  // UI State
  currentStep: 0,
  isLoading: false,
  errors: {},

  // Multi-subcategory Support
  subcategoryFormData: {
    'private_comprehensive': { vehicleDetails: {...}, pricingInputs: {...} },
    'commercial_3ton': { vehicleDetails: {...}, pricingInputs: {...} },
    // ... other subcategories
  },

  // History (Undo/Redo)
  past: [],
  future: []
}
```

### Key Actions

#### **State Updates**

```javascript
actions.setCategorySelection({ category, subcategory, productType })
actions.updateVehicleDetails({ registrationNumber: 'KXX 123Y' })
actions.updatePricingInputs({ sumInsured: 2000000 })
actions.updateClientDetails({ firstName: 'John', lastName: 'Doe' })
actions.updateExtractedDocuments({ logbook: {...} })
```

#### **Navigation**

```javascript
actions.setCurrentStep(3); // Move to step 3
```

#### **Underwriter & Add-ons**

```javascript
actions.setSelectedUnderwriter(underwriterObject);
actions.setSelectedAddons([addon1, addon2]);
```

#### **Flow Control**

```javascript
actions.resetFlow(); // Clear all data and start fresh
actions.undo(); // Undo last change
actions.redo(); // Redo undone change
```

### Reducer Actions

- `SET_CATEGORY_SELECTION` - Set category/subcategory
- `UPDATE_VEHICLE_DETAILS` - Update vehicle information
- `UPDATE_PRICING_INPUTS` - Update pricing parameters
- `UPDATE_CLIENT_DETAILS` - Update client information
- `UPDATE_EXTRACTED_DOCUMENTS` - Store extracted document data
- `SET_SELECTED_UNDERWRITER` - Select insurance provider
- `SET_SELECTED_ADDONS` - Select optional add-ons
- `SET_CURRENT_STEP` - Update navigation step
- `RESET_FLOW` - Clear all state and storage
- `UNDO` / `REDO` - History navigation

## Usage Example

### In Components

```javascript
import { useMotorInsurance } from "../contexts/MotorInsuranceContext";

function MyComponent() {
  const { state, actions } = useMotorInsurance();

  // Read state
  const vehicleReg = state.vehicleDetails.registrationNumber;
  const currentStep = state.currentStep;

  // Update state
  const handleInputChange = (field, value) => {
    actions.updateVehicleDetails({ [field]: value });
  };

  // Navigate
  const nextStep = () => {
    actions.setCurrentStep(state.currentStep + 1);
  };

  return (
    <View>
      <TextInput
        value={vehicleReg}
        onChangeText={(text) => handleInputChange("registrationNumber", text)}
      />
      <Button title="Next" onPress={nextStep} />
    </View>
  );
}
```

### Clear State on Completion

```javascript
const handleQuoteSubmitted = async () => {
  // After successful submission
  await actions.resetFlow();
  navigation.navigate("QuotationsScreen");
};
```

## Benefits

### For Users

✅ **Never lose progress** - Data persists across sessions
✅ **Switch freely** - Navigate back/forth without losing data
✅ **Multi-tasking safe** - App closure doesn't lose work
✅ **Compare options** - Switch between subcategories easily
✅ **Error recovery** - Undo mistakes with built-in history

### For Developers

✅ **Centralized state** - Single source of truth
✅ **Type-safe** - Reducer pattern prevents invalid states
✅ **Debuggable** - All state changes logged and traceable
✅ **Testable** - Easy to test with mock context
✅ **Maintainable** - Clear separation of concerns

## Performance Considerations

### Optimizations

- **Debounced persistence** - Saves every 500ms, not on every keystroke
- **Selective restoration** - Only restores non-empty data
- **Memoized selectors** - Computed values cached with useMemo
- **Conditional saves** - Skips initial mount to avoid overwriting

### Memory Management

- **Limited history** - Past/future arrays can be size-limited if needed
- **Selective persistence** - Only essential data saved to AsyncStorage
- **Lazy loading** - Restoration happens asynchronously on mount

## Testing Recommendations

### Manual Testing

1. Fill form halfway → Close app → Reopen → Verify data restored
2. Select category → Switch to another → Switch back → Verify isolation
3. Enter data → Navigate back → Navigate forward → Verify persistence
4. Make changes → Undo → Redo → Verify history works

### Automated Testing

```javascript
describe("MotorInsuranceContext", () => {
  it("should persist vehicle details to AsyncStorage", async () => {
    // Test implementation
  });

  it("should restore state on mount", async () => {
    // Test implementation
  });

  it("should isolate subcategory form data", () => {
    // Test implementation
  });
});
```

## Migration Notes

### Before (Local State)

```javascript
const [vehicleDetails, setVehicleDetails] = useState({});
const [step, setStep] = useState(0);
// Lost on navigation or app closure
```

### After (Context + Persistence)

```javascript
const { state, actions } = useMotorInsurance();
const vehicleDetails = state.vehicleDetails;
const step = state.currentStep;
// Persists across navigation and app restarts
```

## Future Enhancements

### Potential Additions

- **Cloud sync** - Sync state across devices
- **Draft versioning** - Save multiple draft quotes
- **Offline queue** - Queue submissions when offline
- **Analytics** - Track completion rates per step
- **Auto-save indicators** - Visual feedback for saves

## Support

For questions or issues with state persistence:

1. Check AsyncStorage contents: `AsyncStorage.getItem('motor_insurance_flow_state')`
2. Clear corrupted state: `actions.resetFlow()`
3. Check console logs for persistence warnings

## Related Files

- `/frontend/contexts/MotorInsuranceContext.js` - Context implementation
- `/frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js` - Main flow screen
- `/docs/COMPREHENSIVE_PRICING_SYSTEM.md` - Pricing system overview
