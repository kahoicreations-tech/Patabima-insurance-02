---
mode: agent
title: "Frontend Core Services Setup"
phase: "Frontend Phase 1"
priority: "high"
dependencies: ["02-api-endpoints"]
---

# Task: Implement Frontend Core Services

## Objective
Create centralized service layer and context architecture to handle all motor insurance operations with real-time pricing, state management, and API integration.

## Requirements

### 1. Core Service Implementation

#### DjangoAPIService Enhancement
Enhance existing `DjangoAPIService` to support motor insurance endpoints:
- Add motor insurance specific methods
- Implement request/response transformation
- Add error handling for pricing calculations
- Support for concurrent pricing requests

#### MotorInsurancePricingService
Create dedicated service for motor insurance operations:
```javascript
class MotorInsurancePricingService {
  async getCategories()
  async getPricingForSubcategory(category, subcategory, productType)  
  async calculatePremium(pricingData)
  async comparePricing(comparisonData)
  async submitQuotation(quotationData)
}
```

### 2. React Context Architecture

#### MotorInsuranceContext Implementation
Create comprehensive context with state management for:
- Category and subcategory selection
- Vehicle details form data
- Pricing inputs (dynamic based on product type)
- Client details
- Underwriter selection and comparison
- Calculated premiums and pricing breakdown
- Form validation and error states
- Loading states for API calls

#### State Structure
```javascript
const initialState = {
  // Selection State
  selectedCategory: null,
  selectedSubcategory: null,
  productType: null,
  
  // Form Data
  vehicleDetails: {},
  pricingInputs: {},
  clientDetails: {},
  
  // Pricing State
  availableUnderwriters: [],
  selectedUnderwriter: null,
  pricingComparison: [],
  calculatedPremium: null,
  
  // UI State
  currentStep: 1,
  isLoading: false,
  errors: {},
  formValidation: {}
}
```

### 3. Context Actions & Reducers

#### Core Actions to Implement
- `setCategorySelection` - Handle category/subcategory selection
- `updateVehicleDetails` - Update vehicle information
- `updatePricingInputs` - Dynamic pricing input updates
- `updateClientDetails` - Client information updates
- `loadUnderwriters` - Fetch available underwriters
- `calculatePremium` - Real-time premium calculation
- `comparePricing` - Multi-underwriter comparison
- `submitQuotation` - Complete quotation submission
- `validateForm` - Progressive form validation
- `setCurrentStep` - Navigation state management

#### Reducer Implementation
Implement motorInsuranceReducer with proper state immutability:
- Handle all state updates properly
- Maintain form validation state
- Manage loading and error states
- Support for undo/redo capabilities

### 4. API Integration Layer

#### Request/Response Transformation
- Transform frontend form data to API request format
- Handle different pricing calculation types (TOR, Third-party, Comprehensive)
- Parse and structure API responses for UI consumption
- Error response normalization

#### Real-time Calculations
- Debounced premium calculations on input changes
- Background pricing updates without blocking UI
- Caching strategy for frequently requested data
- Offline support for basic calculations

### 5. Validation System

#### Dynamic Form Validation
Create validation rules based on product type:
- Required field validation per subcategory
- Range validation for sum insured (comprehensive products)
- Tonnage validation for commercial vehicles
- Passenger count validation for PSV products
- Vehicle age restrictions

#### Progressive Validation
- Real-time field validation as user types
- Step-by-step validation before navigation
- Complete form validation before submission
- Error state management and display

## Success Criteria
- [ ] DjangoAPIService enhanced with motor insurance methods
- [ ] MotorInsurancePricingService fully implemented
- [ ] MotorInsuranceContext provides complete state management
- [ ] All context actions and reducers working correctly
- [ ] API integration handles all product types
- [ ] Real-time premium calculations functional
- [ ] Form validation system dynamic and comprehensive
- [ ] Error handling covers all scenarios
- [ ] Loading states properly managed
- [ ] Offline capabilities implemented

## Technical Implementation Details

### Service Architecture
```javascript
// services/MotorInsurancePricingService.js
export class MotorInsurancePricingService extends DjangoAPIService {
  async calculatePremium(pricingData) {
    // Handle different calculation types
    // Transform request data
    // Make API call
    // Transform response
  }
}
```

### Context Hook Pattern
```javascript
// contexts/MotorInsuranceContext.js
export const useMotorInsurance = () => {
  const context = useContext(MotorInsuranceContext);
  if (!context) {
    throw new Error('useMotorInsurance must be used within MotorInsuranceProvider');
  }
  return context;
};
```

### Validation System
```javascript
// utils/motorInsuranceValidation.js
export const validatePricingInputs = (productType, inputs) => {
  // Dynamic validation based on product type
  // Return validation errors object
};
```

## Files to Create/Modify
- `src/services/MotorInsurancePricingService.js` - New service class
- `src/contexts/MotorInsuranceContext.js` - Context and provider
- `src/hooks/useMotorInsurance.js` - Custom hook (if separate)
- `src/utils/motorInsuranceValidation.js` - Validation utilities
- `src/utils/pricingCalculations.js` - Local calculation helpers
- `src/constants/motorInsuranceConfig.js` - Configuration constants
- `src/services/DjangoAPIService.js` - Enhance existing service

## Testing Requirements
- Unit tests for all service methods
- Context state management tests
- Validation function tests
- API integration tests with mock data
- Error handling scenario tests
- Performance tests for real-time calculations

## Next Steps After Completion
This enables:
- Implementation of motor insurance UI components
- Dynamic form generation based on product types
- Real-time premium calculations in UI
- Multi-step form navigation
- Underwriter comparison features

## Integration Points
- Connects to backend APIs from Phase 2
- Provides data layer for UI components in Phase 3
- Supports quote management and policy workflows
- Enables payment integration features