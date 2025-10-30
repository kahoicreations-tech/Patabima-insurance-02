---
mode: agent
title: "Motor Insurance UI Components"
phase: "Frontend Phase 2"
priority: "high"
dependencies: ["03-frontend-services"]
---

# Task: Implement Motor Insurance UI Components

## Objective
Create comprehensive React Native UI components for motor insurance with dynamic forms, real-time pricing, category selection, and multi-underwriter comparison.

## Requirements

### 1. Category Selection Components

#### Main Category Grid
Create `MotorCategoryGrid` component:
- Display 6 main categories (Private, Commercial, PSV, Motorcycle, TukTuk, Special Classes)
- Visual card layout with category icons and descriptions
- Category selection with visual feedback
- Integration with MotorInsuranceContext

#### Subcategory Selection
Create `MotorSubcategoryList` component:
- Dynamic list based on selected category
- Show product type badges (TOR, Third-Party, Comprehensive)
- Display pricing requirements and additional fields needed
- Visual indicators for complex vs simple products

### 2. Dynamic Form Components

#### Vehicle Details Form
Create `DynamicVehicleForm` component:
- Standard vehicle fields (registration, make, model, year, etc.)
- Conditional fields based on product type
- Vehicle age validation with age restrictions
- Real-time validation with error display

#### Pricing Input Form
Create `DynamicPricingForm` component:
- Dynamic field generation based on subcategory requirements
- Support for different input types:
  - Sum insured with range validation (comprehensive products)
  - Tonnage selection for commercial vehicles (dropdown with brackets)
  - Passenger count for PSV vehicles
  - Engine capacity for motorcycles
- Real-time premium calculation as user types
- Field descriptions and help text

#### Commercial Tonnage Selector
Create specialized `CommercialTonnageSelector`:
- Dropdown with predefined tonnage brackets
- Visual representation of tonnage scale pricing
- Fleet pricing option toggle
- Prime mover designation

#### PSV Features Selector
Create `PSVFeaturesSelector`:
- Passenger count input with validation
- PLL (Personal Liability Limit) options (KSh 500/250 per person)
- Route type selection
- Commercial institutional options

### 3. Pricing Display Components

#### Real-time Premium Calculator
Create `PremiumCalculationDisplay`:
- Live premium updates as user types
- Breakdown display showing:
  - Base premium
  - Mandatory levies (ITL 0.25%, PCF 0.25%, Stamp Duty KSh 40)
  - Additional coverages (for comprehensive products)
  - Total premium
- Loading states during calculations
- Error handling for calculation failures

#### Underwriter Comparison
Create `UnderwriterComparisonView`:
- Side-by-side comparison of multiple underwriters
- Sortable by price, features, rating
- Detailed breakdown for each underwriter
- Selection mechanism for preferred underwriter

#### Premium Breakdown Card
Create `PremiumBreakdownCard`:
- Detailed cost breakdown component
- Expandable sections for different charges
- Visual representation of mandatory levies
- Coverage details for comprehensive products

### 4. Additional Coverage Components (Comprehensive Products)

#### Coverage Selection
Create `AdditionalCoverageSelector`:
- Excess Protector toggle with rate display
- PVT (Political Violence & Terrorism) option
- Windscreen coverage with limits
- Radio/accessories coverage
- Loss of use coverage
- Dynamic premium updates for each selection

### 5. Client Details Components

#### Enhanced Client Form
Enhance existing `ClientDetailsForm`:
- Integration with motor insurance context
- KRA PIN validation
- Phone number formatting
- Email validation
- Address completion

### 6. Navigation & Progress Components

#### Multi-step Progress Indicator
Create `MotorInsuranceProgress`:
- Visual progress through insurance process
- Step validation indicators
- Ability to navigate back to previous steps
- Current step highlighting

#### Navigation Controls
Create `MotorInsuranceNavigation`:
- Context-aware next/previous buttons
- Step validation before navigation
- Save draft functionality
- Exit confirmation

### 7. Specialized Product Components

#### TOR Product Component
Create `TORProductSelector`:
- Simple product selection for Time on Risk
- Fixed pricing display
- Minimal form requirements
- Quick quotation flow

#### Third-party Component
Create `ThirdPartyProductForm`:
- Standard third-party fields
- Additional factors (tonnage, passengers)
- Fixed pricing with adjustments
- Streamlined form flow

#### Comprehensive Product Component
Create `ComprehensiveProductForm`:
- Complex form with sum insured
- Additional coverage selection
- Bracket-based pricing
- Comprehensive validation

## Success Criteria
- [ ] All category selection components functional
- [ ] Dynamic forms adapt to different product types
- [ ] Real-time premium calculations working
- [ ] Underwriter comparison view complete
- [ ] All specialized product components implemented
- [ ] Form validation comprehensive and user-friendly
- [ ] Navigation between steps smooth and validated
- [ ] Responsive design for different screen sizes
- [ ] Accessibility compliance implemented
- [ ] Performance optimized for real-time updates

## Technical Implementation Details

### Component Architecture
```javascript
// Component hierarchy
MotorInsuranceFlow/
├── CategorySelection/
│   ├── MotorCategoryGrid
│   └── MotorSubcategoryList
├── VehicleDetails/
│   └── DynamicVehicleForm
├── PricingInputs/
│   ├── DynamicPricingForm
│   ├── CommercialTonnageSelector
│   └── PSVFeaturesSelector
├── PremiumCalculation/
│   ├── PremiumCalculationDisplay
│   ├── UnderwriterComparisonView
│   └── PremiumBreakdownCard
├── AdditionalCoverage/
│   └── AdditionalCoverageSelector
├── ClientDetails/
│   └── EnhancedClientForm
└── Navigation/
    ├── MotorInsuranceProgress
    └── MotorInsuranceNavigation
```

### Real-time Calculation Implementation
```javascript
// Hook for real-time calculations
const usePremiumCalculation = () => {
  const { pricingInputs, actions } = useMotorInsurance();
  
  const debouncedCalculation = useCallback(
    debounce((inputs) => {
      actions.calculatePremium(inputs);
    }, 500),
    []
  );
  
  useEffect(() => {
    if (isValidForCalculation(pricingInputs)) {
      debouncedCalculation(pricingInputs);
    }
  }, [pricingInputs]);
};
```

### Dynamic Form Generation
```javascript
// Dynamic field renderer
const DynamicFieldRenderer = ({ field, value, onChange, error }) => {
  switch (field.type) {
    case 'sum_insured':
      return <SumInsuredInput />;
    case 'tonnage':
      return <TonnageSelector />;
    case 'passengers':
      return <PassengerCountInput />;
    default:
      return <TextInput />;
  }
};
```

## Styling Requirements
- Use PataBima brand colors (#D5222B red, #646767 gray)
- Poppins font family throughout
- Consistent card-based UI with rounded corners and shadows
- Responsive design for different screen sizes
- Loading states and animations
- Error state styling
- Accessibility compliance (proper contrast, touch targets)

## Files to Create/Modify
- `src/screens/MotorInsurance/` - Main screen folder
- `src/components/MotorInsurance/` - Shared components
- `src/components/CategorySelection/` - Category components
- `src/components/DynamicForms/` - Form components
- `src/components/PricingDisplay/` - Pricing components
- Component style files for each component
- `src/navigation/MotorInsuranceNavigator.js` - Navigation setup

## Testing Requirements
- Unit tests for all components
- Integration tests for form flows
- Real-time calculation testing
- Accessibility testing
- Visual regression testing
- Performance testing for complex forms
- User interaction testing

## Next Steps After Completion
This enables:
- Complete motor insurance quotation flow
- Integration with payment processing
- Policy generation and management
- Agent dashboard integration
- Claims submission features

## Integration Points
- Uses services and context from Phase 1
- Integrates with existing navigation structure 
- Connects to payment flow components
- Supports policy management workflows