---
mode: agent
title: "Navigation & Screen Integration"
phase: "Frontend Phase 3"
priority: "medium"
dependencies: ["04-ui-components"]
---

# Task: Implement Motor Insurance Navigation & Screen Integration

## Objective
Integrate motor insurance components into the main app navigation structure, create screen-level orchestration, and implement proper navigation flow for the entire motor insurance process.

## Requirements

### 1. Main Navigation Integration

#### Bottom Tab Navigation Enhancement
Enhance existing bottom tab navigation to include motor insurance:
- Add motor insurance entry point in Dashboard/Home tab
- Integrate with existing tab structure
- Maintain consistent navigation patterns
- Handle deep linking for motor insurance flows

#### Native Stack Navigator Setup
Create dedicated motor insurance stack navigator:
```javascript
const MotorInsuranceStack = createNativeStackNavigator();

MotorInsuranceNavigator() {
  // Stack screens for motor insurance flow
  // Category Selection → Vehicle Details → Pricing → Comparison → Client Details → Payment
}
```

### 2. Screen-Level Implementation

#### Main Motor Insurance Screen
Create `MotorInsuranceScreen`:
- Entry point from dashboard
- Category grid display
- Quick access to recent quotes
- Search and filter functionality

#### Category Selection Screen
Create `CategorySelectionScreen`:
- Full category grid with descriptions
- Subcategory navigation
- Product type explanations
- Progress indicator initialization

#### Vehicle Details Screen
Create `VehicleDetailsScreen`:
- Dynamic vehicle form based on selected product
- Form validation and error display
- Save draft functionality
- Navigation controls

#### Pricing Input Screen
Create `PricingInputScreen`:
- Dynamic pricing form
- Real-time premium calculation
- Field help and explanations
- Validation and error handling

#### Underwriter Comparison Screen
Create `UnderwriterComparisonScreen`:
- Multi-underwriter pricing display
- Comparison table/cards
- Sorting and filtering options
- Selection confirmation

#### Client Details Screen
Create `ClientDetailsScreen`:
- Client information form
- Integration with existing client data
- Form validation
- Terms and conditions

#### Quotation Summary Screen
Create `QuotationSummaryScreen`:
- Complete quotation review
- Pricing breakdown
- Policy details
- Edit functionality
- Proceed to payment

### 3. Navigation Flow Implementation

#### Progressive Navigation
Implement step-by-step navigation:
- Validate current step before proceeding
- Maintain navigation history
- Support back navigation with state preservation
- Handle navigation interruptions

#### Deep Linking Support
Create deep linking for motor insurance:
- Direct category access
- Resume incomplete quotations
- Share quotation links
- Navigate from notifications

#### Navigation State Management
Integrate with MotorInsuranceContext:
- Sync navigation state with context
- Preserve form data across navigation
- Handle navigation-based validation
- Support draft saving and restoration

### 4. Integration with Existing App Structure

#### Dashboard Integration
Enhance existing dashboard:
- Add motor insurance quick access
- Show motor insurance analytics
- Display recent motor quotes
- Integration with sales statistics

#### Header Component Integration
Enhance existing header components:
- Motor insurance specific headers
- Progress indicators
- Context-aware actions
- Consistent branding

#### Existing Service Integration
Connect motor insurance with existing services:
- User authentication state
- Agent profile information
- Existing client data
- Payment service integration

### 5. Screen Orchestration

#### State Synchronization
Implement proper state sync between screens:
- Context state updates
- Form data persistence
- Validation state management
- Loading state coordination

#### Error Boundary Implementation
Add error boundaries for motor insurance flows:
- Screen-level error handling
- Graceful error recovery
- Error reporting
- User-friendly error messages

#### Loading State Management
Coordinate loading states across screens:
- API call loading indicators
- Screen transition loading
- Form submission loading
- Background calculation loading

### 6. Navigation Guards

#### Form Validation Guards
Implement navigation guards:
- Prevent navigation with invalid data
- Prompt for unsaved changes
- Validate required fields
- Handle validation errors

#### Authentication Guards
Ensure proper authentication:
- Require login for motor insurance
- Handle session expiration
- Redirect to login when needed
- Preserve navigation intent

## Success Criteria
- [ ] Motor insurance fully integrated into main navigation
- [ ] All screens properly implemented and connected
- [ ] Navigation flow smooth and validated
- [ ] Deep linking functional for all screens
- [ ] State preservation across navigation
- [ ] Integration with existing app components
- [ ] Error boundaries protecting all flows
- [ ] Loading states properly coordinated
- [ ] Navigation guards preventing invalid states
- [ ] Performance optimized for navigation

## Technical Implementation Details

### Navigation Structure
```javascript
// Main App Navigator
const MainNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Dashboard" component={DashboardNavigator} />
    <Tab.Screen name="MotorInsurance" component={MotorInsuranceNavigator} />
    {/* Other tabs */}
  </Tab.Navigator>
);

// Motor Insurance Navigator
const MotorInsuranceNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="MotorHome" component={MotorInsuranceScreen} />
    <Stack.Screen name="CategorySelection" component={CategorySelectionScreen} />
    <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
    <Stack.Screen name="PricingInput" component={PricingInputScreen} />
    <Stack.Screen name="Comparison" component={UnderwriterComparisonScreen} />
    <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
    <Stack.Screen name="Summary" component={QuotationSummaryScreen} />
  </Stack.Navigator>
);
```

### Screen Components
```javascript
// Screen template
const MotorInsuranceScreen = ({ navigation, route }) => {
  const { state, actions } = useMotorInsurance();
  
  // Screen-specific logic
  // Component rendering
  // Navigation handling
};
```

### Deep Linking Configuration
```javascript
const linking = {
  prefixes: ['patabima://'],
  config: {
    screens: {
      MotorInsurance: {
        screens: {
          CategorySelection: 'motor/category/:categoryId',
          VehicleDetails: 'motor/vehicle',
          PricingInput: 'motor/pricing',
          // Other screens
        }
      }
    }
  }
};
```

## Files to Create/Modify
- `src/navigation/MotorInsuranceNavigator.js` - Motor insurance navigation
- `src/navigation/AppNavigator.js` - Main app navigation updates
- `src/screens/MotorInsurance/MotorInsuranceScreen.js` - Main motor screen
- `src/screens/MotorInsurance/CategorySelectionScreen.js` - Category selection
- `src/screens/MotorInsurance/VehicleDetailsScreen.js` - Vehicle details
- `src/screens/MotorInsurance/PricingInputScreen.js` - Pricing input
- `src/screens/MotorInsurance/UnderwriterComparisonScreen.js` - Comparison
- `src/screens/MotorInsurance/ClientDetailsScreen.js` - Client details
- `src/screens/MotorInsurance/QuotationSummaryScreen.js` - Summary
- `src/components/ErrorBoundary/MotorInsuranceErrorBoundary.js` - Error boundary
- `src/utils/navigationGuards.js` - Navigation validation
- Navigation configuration files

## Testing Requirements
- Navigation flow testing
- Deep linking testing
- Error boundary testing
- State persistence testing
- Performance testing for navigation
- Accessibility navigation testing
- Integration testing with existing app

## Next Steps After Completion
This enables:
- Complete motor insurance user journey
- Integration with payment processing
- Policy generation workflows
- Agent dashboard analytics
- Claims and renewal processes

## Integration Points
- Connects UI components from Phase 2
- Integrates with main app navigation
- Supports payment and policy workflows
- Enables analytics and reporting features