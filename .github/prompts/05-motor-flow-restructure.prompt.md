---
mode: agent
title: "Motor Insurance Flow Restructure"
phase: "Frontend Phase 3"
priority: "critical"
dependencies: ["04-ui-components", "03-frontend-services"]
---

# Task: Restructure Motor Insurance Flow

## Objective

Completely restructure Motor 2 flow to follow a simplified, backend-driven user journey that matches the business requirements. Replace the current complex multi-step wizard with a streamlined 6-step process focused on user selection and backend validation.

## Current Problem

The existing Motor 2 flow is overly complex with:

- Multiple unnecessary steps (Category → Subcategory → Vehicle Details → Pricing → Underwriter → Coverage)
- Frontend-heavy pricing calculations
- Confusing UI/UX that doesn't match business workflow
- Performance issues with real-time calculations

## New Flow Requirements

### 🎯 Simplified 6-Step User Journey

#### Step 1: Vehicle Category Selection

**Screen**: `VehicleCategorySelectionScreen`

- Display 4 main categories: **Private, Commercial, Motorcycle, TukTuk**
- Visual cards with category icons and descriptions
- Single tap selection with immediate progression
- Backend endpoint: `GET /api/v1/motor/categories`

#### Step 2: Cover Type Selection

**Screen**: `CoverTypeSelectionScreen`

- Show only valid cover types for selected category:
  - **Third-party**: Basic coverage
  - **Comprehensive**: Full coverage
  - **Extendible**: Third-party with extensions
- Dynamic options based on category from backend
- Backend endpoint: `GET /api/v1/motor/cover-types?category={category}`

#### Step 3: Financial Status

**Screen**: `FinancialStatusScreen`

- Simple binary choice: **Financed (Loaned)** or **Not Financed**
- Clear explanation of implications
- If Financed → Flag for additional underwriting documents
- No backend call needed (pure frontend state)

#### Step 4: Vehicle Identifier

**Screen**: `VehicleIdentifierScreen`

- Two input options:
  - **Vehicle Registration Number (VRN)**: Primary method
  - **Chassis Number**: Alternative for unregistered vehicles
- Real-time validation against DMVIC/NTSA (simulated)
- Backend validation endpoint: `POST /api/v1/motor/validate-vehicle`
- Auto-populate vehicle details if found

#### Step 5: Cover Start Date

**Screen**: `CoverStartDateScreen`

- Date picker with underwriter-specific rules
- Validation against backdating policies
- Max 30 days forward rule enforcement
- Backend validation: `POST /api/v1/motor/validate-cover-date`

#### Step 6: Underwriter Selection

**Screen**: `UnderwriterSelectionScreen`

- Display all available underwriters with pricing
- Clean card layout showing:
  - Underwriter name and logo
  - Premium amount (Net/Gross clearly labeled)
  - Approval method (Auto/Manual indicator)
  - Selection button
- Backend endpoint: `POST /api/v1/motor/get-underwriter-pricing`

## 🔧 Backend API Requirements

### New Endpoints to Create

#### 1. Get Vehicle Categories

```
GET /api/v1/motor/categories
Response: {
  "categories": [
    { "id": "private", "name": "Private", "description": "Personal vehicles", "icon": "🚗" },
    { "id": "commercial", "name": "Commercial", "description": "Goods carriers", "icon": "🚚" },
    { "id": "motorcycle", "name": "Motorcycle", "description": "Boda & private", "icon": "🏍️" },
    { "id": "tuktuk", "name": "TukTuk", "description": "Three-wheeler", "icon": "🛺" }
  ]
}
```

#### 2. Get Cover Types by Category

```
GET /api/v1/motor/cover-types?category={category_id}
Response: {
  "cover_types": [
    { "id": "third_party", "name": "Third Party", "description": "Basic third party coverage", "base_premium": 3000 },
    { "id": "comprehensive", "name": "Comprehensive", "description": "Full coverage including own damage", "requires_sum_insured": true },
    { "id": "extendible", "name": "Third Party Extendible", "description": "Third party plus additional benefits", "base_premium": 4000 }
  ]
}
```

#### 3. Validate Vehicle Identifier

```
POST /api/v1/motor/validate-vehicle
Request: {
  "identifier_type": "vrn|chassis",
  "identifier_value": "KCA123A",
  "category": "private"
}
Response: {
  "valid": true,
  "vehicle_details": {
    "registration": "KCA123A",
    "make": "Toyota",
    "model": "Axio",
    "year": 2018,
    "engine_capacity": "1500cc",
    "estimated_value": 1200000
  },
  "existing_cover": {
    "has_active_policy": false,
    "expires_on": null,
    "insurer": null
  },
  "dmvic_status": "verified"
}
```

#### 4. Validate Cover Start Date

```
POST /api/v1/motor/validate-cover-date
Request: {
  "start_date": "2025-10-01",
  "category": "private",
  "cover_type": "comprehensive"
}
Response: {
  "valid": true,
  "adjusted_date": "2025-10-01",
  "restrictions": [],
  "underwriter_rules": {
    "max_backdate_days": 0,
    "max_forward_days": 30
  }
}
```

#### 5. Get Underwriter Pricing

```
POST /api/v1/motor/get-underwriter-pricing
Request: {
  "category": "private",
  "cover_type": "comprehensive",
  "vehicle_details": { ... },
  "start_date": "2025-10-01",
  "is_financed": false,
  "sum_insured": 1200000  // Required for comprehensive
}
Response: {
  "underwriters": [
    {
      "id": "cic",
      "name": "CIC Insurance",
      "logo_url": "/logos/cic.png",
      "premium": {
        "amount": 65000,
        "type": "net",
        "breakdown": {
          "base_premium": 60000,
          "itl": 150,
          "pcf": 150,
          "stamp_duty": 40
        }
      },
      "approval_method": "auto",
      "features": ["24/7 Claims", "Towing Service"],
      "rating": 4.5
    },
    {
      "id": "jubilee",
      "name": "Jubilee Insurance",
      "logo_url": "/logos/jubilee.png",
      "premium": {
        "amount": 68000,
        "type": "net",
        "breakdown": { ... }
      },
      "approval_method": "auto",
      "features": ["Fast Claims", "Road Assistance"],
      "rating": 4.3
    }
  ],
  "quote_reference": "QT2025001234"
}
```

#### 6. Confirm Underwriter Selection

```
POST /api/v1/motor/select-underwriter
Request: {
  "quote_reference": "QT2025001234",
  "underwriter_id": "cic",
  "client_details": { ... }  // If needed
}
Response: {
  "policy_quote_id": "PQ2025001234",
  "status": "pending_payment",
  "next_step": "payment",
  "payment_amount": 65000,
  "expires_at": "2025-09-30T23:59:59Z"
}
```

## 🎨 UI/UX Component Requirements

### Screen Components to Create

#### 1. VehicleCategorySelectionScreen

- **Layout**: 2x2 grid of category cards
- **Card Design**: Large icon, category name, description
- **Interaction**: Single tap selection with visual feedback
- **Navigation**: Auto-advance to cover type selection

#### 2. CoverTypeSelectionScreen

- **Layout**: Vertical list of cover type cards
- **Card Design**: Cover type name, description, estimated price range
- **Special Handling**: Show sum insured input for comprehensive
- **Validation**: Ensure valid selection before proceeding

#### 3. FinancialStatusScreen

- **Layout**: Two large selection cards
- **Cards**: "Financed (Loaned)" vs "Not Financed"
- **Information**: Clear explanation of implications
- **Visual**: Icons and color coding for clarity

#### 4. VehicleIdentifierScreen

- **Layout**: Tabbed interface for VRN vs Chassis input
- **Input**: Large, prominent text input with validation
- **Feedback**: Real-time validation with loading states
- **Results**: Auto-populated vehicle details display
- **Fallback**: Manual vehicle details entry if validation fails

#### 5. CoverStartDateScreen

- **Layout**: Calendar date picker with restrictions
- **Validation**: Visual indicators for valid/invalid dates
- **Rules Display**: Clear explanation of date restrictions
- **Default**: Suggest appropriate default date

#### 6. UnderwriterSelectionScreen

- **Layout**: Vertical list of underwriter cards
- **Card Design**:
  - Underwriter logo and name
  - Large, prominent premium display
  - Auto/Manual approval badge
  - Feature highlights
  - Selection button
- **Sorting**: Price, rating, or approval method
- **Comparison**: Allow side-by-side comparison

### Shared Components

#### MotorFlowProgress

- **Purpose**: Show progress through 6 steps
- **Design**: Horizontal progress bar with step indicators
- **State**: Current step highlighted, completed steps marked

#### MotorFlowNavigation

- **Purpose**: Consistent navigation between steps
- **Buttons**: Back, Next, Save Draft
- **Validation**: Disable Next until step is complete
- **State**: Context-aware button states

## 🔄 State Management Restructure

### Simplified Context State

```javascript
const initialState = {
  // Step 1: Category
  selectedCategory: null,

  // Step 2: Cover Type
  selectedCoverType: null,
  sumInsured: null, // For comprehensive

  // Step 3: Financial Status
  isFinanced: null,

  // Step 4: Vehicle
  vehicleIdentifier: null,
  vehicleDetails: null,

  // Step 5: Cover Date
  coverStartDate: null,

  // Step 6: Underwriter
  availableUnderwriters: [],
  selectedUnderwriter: null,
  quoteReference: null,

  // Navigation
  currentStep: 1,
  isLoading: false,
  errors: {},
};
```

### Context Actions

```javascript
const actions = {
  setCategory: (category) => {},
  setCoverType: (coverType, sumInsured) => {},
  setFinancialStatus: (isFinanced) => {},
  setVehicleIdentifier: (identifier, details) => {},
  setCoverStartDate: (date) => {},
  loadUnderwriters: () => {},
  selectUnderwriter: (underwriter) => {},

  // Navigation
  nextStep: () => {},
  prevStep: () => {},
  setStep: (step) => {},

  // Utility
  resetFlow: () => {},
  saveDraft: () => {},
};
```

## 🏗️ Implementation Plan

### Phase 1: Backend API Development

1. Create new API endpoints in `insurance-app`
2. Implement DMVIC simulation service
3. Create underwriter pricing engine
4. Add vehicle validation logic
5. Set up proper error handling

### Phase 2: Frontend Service Layer

1. Create `MotorFlowService` for API integration
2. Update `MotorInsuranceContext` with simplified state
3. Implement form validation utilities
4. Add offline support for basic operations

### Phase 3: UI Component Development

1. Create 6 main screen components
2. Implement shared components (Progress, Navigation)
3. Add proper loading and error states
4. Implement responsive design

### Phase 4: Integration & Testing

1. Wire up API integration
2. Add comprehensive error handling
3. Implement navigation flow
4. Add form persistence
5. Performance optimization

## 🧪 DMVIC Integration (Simulated)

### Simulation Service Requirements

Create `DMVICSimulationService` that:

- Validates common Kenyan registration formats
- Returns realistic vehicle data for test VRNs
- Simulates existing cover checks
- Handles error scenarios (invalid VRN, etc.)

### Test Data Requirements

Provide simulation data for:

- 50+ common vehicle registration numbers
- Various makes/models/years
- Different vehicle categories
- Active/expired policy scenarios

## ✅ Success Criteria

### User Experience

- [ ] Complete flow takes under 3 minutes
- [ ] Each step has clear purpose and outcome
- [ ] No confusing or unnecessary steps
- [ ] Proper error handling and recovery
- [ ] Smooth transitions between steps

### Technical Requirements

- [ ] All 6 backend endpoints functional
- [ ] DMVIC simulation working
- [ ] Real-time validation implemented
- [ ] Proper state management
- [ ] Offline capability for basic flow
- [ ] Performance optimized (< 2s per step)

### Business Logic

- [ ] Proper category-cover type mapping
- [ ] Financial status implications handled
- [ ] Date validation with underwriter rules
- [ ] Accurate pricing calculations
- [ ] Underwriter selection properly stored

## 📁 Files to Create/Modify

### Backend Files

- `insurance-app/app/views/motor_flow.py` - New API views
- `insurance-app/app/services/dmvic_simulation.py` - DMVIC simulation
- `insurance-app/app/services/underwriter_pricing.py` - Pricing engine
- `insurance-app/app/serializers/motor_flow.py` - API serializers

### Frontend Files

- `frontend/screens/Motor2/MotorFlowScreen.js` - Main flow container
- `frontend/screens/Motor2/steps/` - Individual step screens
- `frontend/services/MotorFlowService.js` - API integration
- `frontend/contexts/MotorFlowContext.js` - Simplified context
- `frontend/components/MotorFlow/` - Shared components

### Configuration

- Update routing in `frontend/navigation/`
- Update API endpoints in service configurations
- Add new validation rules

## 🚀 Migration Strategy

### 1. Gradual Migration

- Keep existing Motor 2 flow as fallback
- Implement new flow as "Motor 2 Beta"
- A/B test with small user group
- Gradually migrate all users

### 2. Data Compatibility

- Ensure new flow can handle existing quote data
- Provide migration utilities for in-progress quotes
- Maintain backward compatibility

### 3. Rollback Plan

- Keep old components available
- Feature flag for new vs old flow
- Quick rollback capability if issues arise

## 📋 Next Steps After Completion

This restructure enables:

- Faster user onboarding
- Better conversion rates
- Simplified maintenance
- Easier A/B testing
- Better analytics tracking
- Integration with payment flow
- Policy generation workflow

The new flow will be the foundation for all future motor insurance features and improvements.
