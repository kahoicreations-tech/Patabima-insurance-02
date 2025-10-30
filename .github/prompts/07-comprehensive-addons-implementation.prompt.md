# Comprehensive Motor Insurance Add-ons Implementation Guide

## Overview

This prompt outlines the implementation of a comprehensive add-ons system for motor insurance, specifically for comprehensive coverage types. The system includes dynamic add-on fields, underwriter-specific pricing calculations, and an enhanced flow that skips document upload for comprehensive policies.

## Backend Analysis & Alignment Status ✅

### Current Backend Support:

1. **AdditionalCoverage Model** - ✅ EXISTS

   - Supports percentage, fixed, and rate-based pricing
   - Configurable per product type
   - Optional/mandatory flags

2. **MotorCoverType Model** - ✅ EXISTS

   - Has `requires_windscreen_value` flag
   - Has `requires_radio_value` flag
   - Has `supports_optional_addons` flag

3. **InsuranceProvider Model** - ✅ EXISTS
   - Has `features` JSONField for custom underwriter configurations
   - Can store underwriter-specific add-on rates

### Required Backend Enhancements:

1. **Add windscreen/radio value fields** to vehicle details
2. **Create underwriter-specific add-on rate tables**
3. **Update pricing calculation APIs** to include add-ons

## Frontend Implementation Requirements

### 1. Enhanced Vehicle Details Form

#### New Fields for Comprehensive Coverage:

```javascript
// Add to DynamicVehicleForm.js for comprehensive products
const comprehensiveAdditionalFields = [
  {
    key: "windscreen_value",
    label: "Windscreen Value (KSh)",
    type: "number",
    required: false,
    help: "Enter the replacement value of your vehicle windscreen",
    visible: () => selectedProduct?.coverage_type === "COMPREHENSIVE",
  },
  {
    key: "radio_cassette_value",
    label: "Radio/Cassette Value (KSh)",
    type: "number",
    required: false,
    help: "Enter the replacement value of your vehicle audio system",
    visible: () => selectedProduct?.coverage_type === "COMPREHENSIVE",
  },
  {
    key: "vehicle_accessories_value",
    label: "Other Accessories Value (KSh)",
    type: "number",
    required: false,
    help: "Total value of other vehicle accessories",
    visible: () => selectedProduct?.coverage_type === "COMPREHENSIVE",
  },
];
```

### 2. Add-ons Selection Step

#### Create New Component: `AddonSelectionStep.js`

```javascript
// Path: /screens/quotations/Motor 2/MotorInsuranceFlow/AddonsSelection/AddonSelectionStep.js

const standardAddons = [
  {
    id: "excess_protector",
    name: "Excess Protector",
    description: "Covers the excess amount in case of a claim",
    pricing_type: "PERCENTAGE",
    base_rate: 0.0025, // 0.25%
    minimum_premium: 3000,
    calculation_base: "sum_insured",
  },
  {
    id: "political_violence_terrorism",
    name: "Political Violence & Terrorism (PVT)",
    description: "Covers damage from political violence and terrorism",
    pricing_type: "PERCENTAGE",
    base_rate: 0.0025, // 0.25%
    minimum_premium: 2500,
    calculation_base: "sum_insured",
  },
  {
    id: "loss_of_use",
    name: "Loss of Use",
    description: "Daily compensation when vehicle is being repaired",
    pricing_type: "FIXED",
    base_rate: 3000,
    maximum_limit: 30000,
    calculation_base: "fixed",
  },
  {
    id: "windscreen_cover",
    name: "Windscreen Cover",
    description: "Extended windscreen replacement coverage",
    pricing_type: "PERCENTAGE",
    base_rate: 0.1, // 10%
    minimum_value_threshold: 30000,
    calculation_base: "windscreen_value",
    conditional: true, // Only if windscreen_value > threshold
  },
  {
    id: "radio_cover",
    name: "Radio/Cassette Cover",
    description: "Audio system replacement coverage",
    pricing_type: "PERCENTAGE",
    base_rate: 0.1, // 10%
    minimum_value_threshold: 30000,
    calculation_base: "radio_cassette_value",
    conditional: true, // Only if radio_value > threshold
  },
];
```

### 3. Updated Motor Insurance Flow

#### New Step Sequence for Comprehensive:

```javascript
const comprehensiveSteps = [
  { id: 1, name: "Category", title: "Category Selection" },
  { id: 2, name: "Subcategory", title: "Product Selection" },
  { id: 3, name: "Policy Details", title: "Policy Information" },
  { id: 4, name: "Vehicle Details", title: "Vehicle & Underwriter Selection" },
  { id: 5, name: "Add-ons", title: "Additional Coverage" }, // NEW STEP
  { id: 6, name: "Client Details", title: "Client Information" },
  { id: 7, name: "Payment", title: "Payment & Summary" },
  { id: 8, name: "Submission", title: "Policy Submission" },
];

// Skip Documents step for comprehensive (step 4 in original flow)
const skipDocuments = selectedProduct?.coverage_type === "COMPREHENSIVE";
```

### 4. Pricing Calculation Engine

#### Add-on Calculation Logic:

```javascript
// services/AddonCalculationService.js
class AddonCalculationService {
  static calculateAddonPremium(addon, vehicleData, underwriter) {
    const { sum_insured, windscreen_value, radio_cassette_value } = vehicleData;

    // Get underwriter-specific rate or use default
    const underwriterRate =
      underwriter?.features?.addon_rates?.[addon.id] || addon.base_rate;

    let calculationBase = 0;
    let premium = 0;

    switch (addon.calculation_base) {
      case "sum_insured":
        calculationBase = sum_insured;
        premium = calculationBase * underwriterRate;
        break;

      case "windscreen_value":
        calculationBase = windscreen_value || 0;
        if (calculationBase > (addon.minimum_value_threshold || 0)) {
          premium = calculationBase * underwriterRate;
        }
        break;

      case "radio_cassette_value":
        calculationBase = radio_cassette_value || 0;
        if (calculationBase > (addon.minimum_value_threshold || 0)) {
          premium = calculationBase * underwriterRate;
        }
        break;

      case "fixed":
        premium = underwriterRate;
        break;
    }

    // Apply minimum premium if specified
    if (addon.minimum_premium && premium < addon.minimum_premium) {
      premium = addon.minimum_premium;
    }

    // Apply maximum limit if specified
    if (addon.maximum_limit && premium > addon.maximum_limit) {
      premium = addon.maximum_limit;
    }

    return {
      base_value: calculationBase,
      rate_applied: underwriterRate,
      calculated_premium: premium,
      is_applicable: premium > 0,
    };
  }

  static calculateTotalAddonsPremium(selectedAddons, vehicleData, underwriter) {
    let total = 0;
    const breakdown = [];

    selectedAddons.forEach((addon) => {
      const calculation = this.calculateAddonPremium(
        addon,
        vehicleData,
        underwriter
      );
      if (calculation.is_applicable) {
        total += calculation.calculated_premium;
        breakdown.push({
          addon_id: addon.id,
          addon_name: addon.name,
          ...calculation,
        });
      }
    });

    return { total, breakdown };
  }
}
```

### 5. Updated MotorInsuranceScreen Logic

#### Step Navigation Changes:

```javascript
// In MotorInsuranceScreen.js

const getStepSequence = () => {
  const isComprehensive =
    selectedProductMemo?.coverage_type === "COMPREHENSIVE";

  if (isComprehensive) {
    return [
      { id: 1, component: "CategorySelection" },
      { id: 2, component: "SubcategorySelection" },
      { id: 3, component: "PolicyDetails" },
      { id: 4, component: "VehicleDetails" }, // Enhanced with addon fields
      { id: 5, component: "AddonSelection" }, // NEW
      { id: 6, component: "ClientDetails" },
      { id: 7, component: "Payment" },
      { id: 8, component: "Submission" },
    ];
  }

  // Standard flow for other products
  return originalStepSequence;
};

// Add step 5 handler
if (step === 5 && selectedProductMemo?.coverage_type === "COMPREHENSIVE") {
  return (
    <AddonSelectionStep
      selectedProduct={selectedProductMemo}
      vehicleData={vehicleDataMemo}
      underwriter={state.selectedUnderwriter}
      selectedAddons={state.selectedAddons || []}
      onAddonsChange={(addons) => actions.setSelectedAddons(addons)}
      onNext={() => setStep(6)}
      onBack={() => setStep(4)}
    />
  );
}
```

### 6. Context Updates

#### Add to MotorInsuranceContext:

```javascript
// Add new state fields
const initialState = {
  // ... existing fields
  selectedAddons: [],
  addonsPremium: 0,
  addonsBreakdown: []
};

// Add new actions
const actions = {
  // ... existing actions
  setSelectedAddons: (addons) => {
    dispatch({ type: 'SET_SELECTED_ADDONS', payload: addons });
  },
  calculateAddonsPremium: () => {
    dispatch({ type: 'CALCULATE_ADDONS_PREMIUM' });
  }
};

// Add reducer cases
case 'SET_SELECTED_ADDONS':
  const addonsCalculation = AddonCalculationService.calculateTotalAddonsPremium(
    action.payload,
    state.vehicleDetails,
    state.selectedUnderwriter
  );
  return {
    ...state,
    selectedAddons: action.payload,
    addonsPremium: addonsCalculation.total,
    addonsBreakdown: addonsCalculation.breakdown
  };
```

## Backend API Requirements

### 1. Enhanced Vehicle Details Endpoint

```python
# Add to vehicle details API response
{
  "registration_number": "KAA 123A",
  "make": "Toyota",
  "model": "Axio",
  "year": 2015,
  "sum_insured": 2000000,
  "windscreen_value": 30000,  # NEW
  "radio_cassette_value": 25000,  # NEW
  "vehicle_accessories_value": 50000  # NEW
}
```

### 2. Underwriter Add-on Rates API

```python
# GET /api/underwriters/{id}/addon-rates
{
  "underwriter": "Madison Insurance",
  "addon_rates": {
    "excess_protector": 0.0025,  # 0.25%
    "political_violence_terrorism": 0.0025,
    "loss_of_use": 3000,  # Fixed amount
    "windscreen_cover": 0.12,  # 12% (higher than standard 10%)
    "radio_cover": 0.08  # 8% (lower than standard 10%)
  },
  "minimum_premiums": {
    "excess_protector": 3000,
    "political_violence_terrorism": 2500
  }
}
```

### 3. Enhanced Pricing Calculation API

```python
# POST /api/motor-pricing/calculate-comprehensive
{
  "vehicle_details": {
    "sum_insured": 2000000,
    "windscreen_value": 30000,
    "radio_cassette_value": 25000
  },
  "selected_addons": [
    "excess_protector",
    "windscreen_cover"
  ],
  "underwriter_code": "MADISON"
}

# Response
{
  "base_premium": 60000,
  "addons_premium": 6300,  # 2500 (excess) + 3800 (windscreen)
  "total_premium": 66300,
  "addons_breakdown": [
    {
      "addon_id": "excess_protector",
      "premium": 2500,
      "calculation": "0.25% × 2,000,000 = 5,000, min 3,000 applied"
    },
    {
      "addon_id": "windscreen_cover",
      "premium": 3800,
      "calculation": "12% × 30,000 = 3,600"
    }
  ]
}
```

## Database Updates Required

### 1. Add Vehicle Add-on Fields

```sql
ALTER TABLE app_motorinsurancedetails
ADD COLUMN windscreen_value DECIMAL(10,2) NULL,
ADD COLUMN radio_cassette_value DECIMAL(10,2) NULL,
ADD COLUMN vehicle_accessories_value DECIMAL(10,2) NULL;
```

### 2. Populate Standard Add-ons

```python
# Create standard add-ons in AdditionalCoverage table
standard_addons = [
  {
    'coverage_code': 'EXCESS_PROTECTOR',
    'coverage_name': 'Excess Protector',
    'pricing_type': 'PERCENTAGE',
    'default_rate': 0.0025,
    'applicable_to': ['COMPREHENSIVE']
  },
  # ... other add-ons
]
```

### 3. Update Underwriter Features

```python
# Update InsuranceProvider.features with add-on rates
underwriter_features = {
  'addon_rates': {
    'excess_protector': 0.0025,
    'windscreen_cover': 0.10,
    # ... other rates
  },
  'minimum_premiums': {
    'excess_protector': 3000,
    # ... other minimums
  }
}
```

## Testing Requirements

### 1. Frontend Testing

- [ ] Comprehensive flow shows add-on fields
- [ ] Documents step is skipped for comprehensive
- [ ] Add-on calculations are accurate
- [ ] Multiple underwriter rates work correctly
- [ ] Payment summary includes add-ons breakdown

### 2. Backend Testing

- [ ] Vehicle details API accepts new fields
- [ ] Pricing API calculates add-ons correctly
- [ ] Underwriter-specific rates are applied
- [ ] Minimum/maximum limits are enforced

### 3. Integration Testing

- [ ] End-to-end comprehensive quote flow
- [ ] Add-on premium calculations match backend
- [ ] Policy submission includes all add-on data

## Implementation Priority

### Phase 1: Core Infrastructure

1. ✅ Backend models analysis (COMPLETE)
2. Add vehicle add-on fields to form
3. Create AddonSelectionStep component
4. Update step navigation logic

### Phase 2: Calculation Engine

1. Implement AddonCalculationService
2. Update pricing API integration
3. Add context state management
4. Update PaymentSummary display

### Phase 3: Underwriter Integration

1. Add underwriter-specific rates
2. Test multiple underwriter scenarios
3. Validate pricing calculations
4. End-to-end testing

## Success Criteria

✅ **User Experience**

- Comprehensive policies skip document upload
- Add-on selection is intuitive with clear pricing
- Premium calculations are transparent
- Multiple underwriters show different rates

✅ **Technical Implementation**

- Backend fully supports add-on calculations
- Frontend accurately reflects backend pricing
- Context state properly manages add-on data
- API responses include detailed breakdowns

✅ **Business Logic**

- Pricing matches underwriter rate tables
- Minimum/maximum limits are enforced
- Conditional add-ons (windscreen/radio) work correctly
- Policy summaries include all selected add-ons

This implementation creates a comprehensive, underwriter-aware add-on system that enhances the motor insurance experience while maintaining pricing accuracy and business rule compliance.
