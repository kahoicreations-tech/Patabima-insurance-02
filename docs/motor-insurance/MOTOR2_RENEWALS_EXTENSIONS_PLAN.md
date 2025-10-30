# Motor 2 Renewals and Extensions Implementation Plan

## 📋 Executive Summary

This document outlines the comprehensive implementation plan for adding renewal and extension functionality to the Motor 2 insurance system. The goal is to provide agents with seamless tools to renew existing policies and extend coverage periods with updated pricing, validations, and automated workflows.

## 🔍 Current State Analysis

### Existing Infrastructure

#### 📁 Backend Models (Django)

- **MotorPolicy Model**: Complete policy storage with JSON fields for flexibility
- **PolicyExtension Model**: Already exists with extension status tracking
- **ExtensionReminder Model**: Automated reminder system in place
- **ExtendiblePricing Model**: Pricing framework for extendible products
- **InsuranceProvider Model**: Underwriter management system

#### 📱 Frontend Screens

- **UpcomingScreen**: Shows renewals/extensions tabs (placeholder data)
- **RenewalScreen**: Basic renewal flow with mock data
- **ExtensionScreen**: Extension flow with period selection
- **Motor 2 Flow**: Complete policy creation system

#### 🔧 Services & APIs

- **DjangoAPIService**: Backend integration service
- **MotorInsurancePricingService**: Pricing calculation engine
- **PoliciesService**: Basic policy operations (renew/extend methods exist)

### Current Limitations

1. **No Motor 2 Integration**: Renewal/extension screens use mock data
2. **Missing Backend Endpoints**: Motor 2 renewal/extension API endpoints needed
3. **No Pricing Updates**: Current renewal doesn't recalculate pricing
4. **Limited Validation**: No policy eligibility checks
5. **No Document Management**: Missing document update capabilities

## 🎯 Implementation Objectives

### Primary Goals

1. **Motor 2 Policy Renewal**

   - Fetch active Motor 2 policies eligible for renewal
   - Recalculate pricing with current rates
   - Update vehicle details and client information
   - Generate renewed policy documents

2. **Motor 2 Policy Extension**

   - Extend policy periods with prorated calculations
   - Handle partial payment scenarios
   - Track extension status and reminders
   - Support multiple extension periods

3. **Integration with Existing Flows**
   - Connect to UpcomingScreen for policy listings
   - Reuse Motor 2 form components for data collection
   - Integrate with payment and document systems

## 🏗️ Technical Architecture

### Backend Implementation

#### New API Endpoints Needed

```python
# Motor 2 Renewal Endpoints
POST /api/v1/policies/motor/{policy_id}/renew/
GET /api/v1/policies/motor/upcoming-renewals/
POST /api/v1/policies/motor/{policy_id}/renew/calculate-premium/

# Motor 2 Extension Endpoints
POST /api/v1/policies/motor/{policy_id}/extend/
GET /api/v1/policies/motor/upcoming-extensions/
POST /api/v1/policies/motor/{policy_id}/extend/calculate-premium/

# Policy Management
GET /api/v1/policies/motor/active/
GET /api/v1/policies/motor/{policy_id}/eligibility/
```

#### Database Schema Updates

```python
# Add renewal tracking to MotorPolicy
class MotorPolicy(BaseModel):
    # ... existing fields ...

    # Renewal tracking
    original_policy_id = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    renewal_count = models.IntegerField(default=0)
    is_renewal = models.BooleanField(default=False)
    renewed_at = models.DateTimeField(null=True, blank=True)

    # Extension tracking
    extension_count = models.IntegerField(default=0)
    last_extension_date = models.DateTimeField(null=True, blank=True)
    total_extensions_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
```

### Frontend Implementation

#### Component Architecture

```
Motor2RenewalFlow/
├── RenewalInitiation/
│   ├── PolicySelector.js          # Select policy to renew
│   ├── EligibilityChecker.js      # Check renewal eligibility
│   └── RenewalOptions.js          # Choose renewal type
├── DataUpdate/
│   ├── VehicleDetailsUpdate.js    # Update vehicle information
│   ├── ClientDetailsUpdate.js     # Update client information
│   └── CoverageReview.js          # Review coverage options
├── PricingRecalculation/
│   ├── PremiumCalculator.js       # Calculate new premium
│   ├── ComparisonDisplay.js       # Show old vs new pricing
│   └── UnderwriterSelection.js    # Choose underwriter
├── Documentation/
│   ├── DocumentsReview.js         # Review existing documents
│   └── DocumentsUpdate.js         # Upload new/updated docs
├── Payment/
│   ├── PaymentMethod.js           # Select payment method
│   └── PaymentConfirmation.js     # Confirm payment
└── Completion/
    ├── RenewalConfirmation.js     # Show renewal success
    └── PolicyDocuments.js         # Download renewed documents

Motor2ExtensionFlow/
├── ExtensionInitiation/
│   ├── PolicySelector.js          # Select policy to extend
│   ├── ExtensionEligibility.js    # Check extension eligibility
│   └── ExtensionPeriods.js        # Choose extension period
├── ProratedCalculation/
│   ├── PeriodCalculator.js        # Calculate prorated amount
│   ├── ExtensionPricing.js        # Show extension costs
│   └── PaymentSchedule.js         # Show payment breakdown
├── ReasonSelection/
│   ├── ExtensionReasons.js        # Select extension reason
│   └── AdditionalNotes.js         # Add notes/comments
├── Payment/
│   ├── ExtensionPayment.js        # Process extension payment
│   └── PaymentConfirmation.js     # Confirm payment
└── Completion/
    ├── ExtensionConfirmation.js   # Show extension success
    └── UpdatedDocuments.js        # Download updated docs
```

## 📋 Implementation Phases

### Phase 1: Backend Foundation (Week 1-2)

#### 1.1 Database Schema Updates

- [ ] Add renewal/extension tracking fields to MotorPolicy
- [ ] Create database migrations
- [ ] Update admin interface for new fields

#### 1.2 API Endpoints Development

- [ ] Implement Motor 2 renewal endpoints
- [ ] Implement Motor 2 extension endpoints
- [ ] Add policy eligibility checking
- [ ] Create pricing recalculation services

#### 1.3 Business Logic Implementation

- [ ] Renewal eligibility rules (30 days before expiry)
- [ ] Extension eligibility rules (grace period, payment status)
- [ ] Prorated calculation logic
- [ ] Policy document generation updates

### Phase 2: Frontend Core Components (Week 2-3)

#### 2.1 Reusable Components

- [ ] PolicySelector component for choosing policies
- [ ] EligibilityChecker for validation display
- [ ] PricingComparison for old vs new pricing
- [ ] DocumentReview for existing documents

#### 2.2 Navigation Integration

- [ ] Update UpcomingScreen to fetch real Motor 2 data
- [ ] Connect RenewalScreen to Motor 2 flow
- [ ] Connect ExtensionScreen to Motor 2 flow
- [ ] Add navigation routing for new flows

#### 2.3 Data Services

- [ ] Update DjangoAPIService with new endpoints
- [ ] Create Motor2RenewalService
- [ ] Create Motor2ExtensionService
- [ ] Update context providers for state management

### Phase 3: Renewal Flow Implementation (Week 3-4)

#### 3.1 Renewal Initiation

- [ ] Policy selection and eligibility checking
- [ ] Renewal type selection (standard, early, late)
- [ ] Integration with existing Motor 2 categories

#### 3.2 Data Update Flow

- [ ] Reuse DynamicVehicleForm for vehicle updates
- [ ] Reuse EnhancedClientForm for client updates
- [ ] Implement change tracking and validation

#### 3.3 Pricing and Underwriter Selection

- [ ] Integrate with MotorInsurancePricingService
- [ ] Reuse UnderwriterSelectionStep component
- [ ] Show pricing comparison (old vs new)

#### 3.4 Payment and Completion

- [ ] Reuse EnhancedPayment component
- [ ] Generate renewed policy documents
- [ ] Update policy status and metadata

### Phase 4: Extension Flow Implementation (Week 4-5)

#### 4.1 Extension Initiation

- [ ] Policy selection and eligibility checking
- [ ] Extension period selection (1, 3, 6 months)
- [ ] Reason selection and documentation

#### 4.2 Prorated Calculation

- [ ] Calculate prorated premium amounts
- [ ] Handle different extension scenarios
- [ ] Display payment breakdown

#### 4.3 Payment Processing

- [ ] Process extension payments
- [ ] Update policy extension records
- [ ] Generate extension certificates

#### 4.4 Reminder System Integration

- [ ] Connect to ExtensionReminder model
- [ ] Schedule automated reminders
- [ ] Track customer responses

### Phase 5: Testing and Optimization (Week 5-6)

#### 5.1 Integration Testing

- [ ] End-to-end renewal flow testing
- [ ] End-to-end extension flow testing
- [ ] Cross-component compatibility testing

#### 5.2 Performance Optimization

- [ ] Optimize API response times
- [ ] Implement proper loading states
- [ ] Add error handling and retry logic

#### 5.3 User Experience Polish

- [ ] Smooth animations and transitions
- [ ] Consistent styling with Motor 2 flow
- [ ] Accessibility improvements

## 🔧 Technical Specifications

### Renewal Flow Logic

```javascript
// Renewal Eligibility Rules
const isEligibleForRenewal = (policy) => {
  const today = new Date();
  const expiryDate = new Date(policy.cover_end_date);
  const daysUntilExpiry = Math.ceil(
    (expiryDate - today) / (1000 * 60 * 60 * 24)
  );

  return {
    eligible: daysUntilExpiry <= 30 && daysUntilExpiry >= -7, // 30 days before to 7 days after
    daysRemaining: daysUntilExpiry,
    renewalType:
      daysUntilExpiry < 0
        ? "late"
        : daysUntilExpiry <= 7
        ? "urgent"
        : "standard",
  };
};

// Pricing Recalculation
const calculateRenewalPricing = async (policy, updatedData) => {
  const pricingService = new MotorInsurancePricingService();
  const newPricing = await pricingService.calculatePremium({
    ...policy.vehicle_details,
    ...updatedData.vehicleDetails,
    subcategory: policy.product_details.subcategory,
    underwriter: updatedData.selectedUnderwriter,
  });

  return {
    originalPremium: policy.premium_breakdown.totalPremium,
    newPremium: newPricing.totalPremium,
    difference: newPricing.totalPremium - policy.premium_breakdown.totalPremium,
    breakdown: newPricing,
  };
};
```

### Extension Flow Logic

```javascript
// Extension Calculation
const calculateExtensionPremium = (policy, extensionPeriod) => {
  const annualPremium = policy.premium_breakdown.totalPremium;
  const daysInYear = 365;
  const extensionDays = {
    "1 month": 30,
    "3 months": 90,
    "6 months": 180,
  }[extensionPeriod];

  const proratedAmount = (annualPremium * extensionDays) / daysInYear;

  return {
    extensionPeriod,
    extensionDays,
    proratedAmount: Math.round(proratedAmount),
    newExpiryDate: addDays(policy.cover_end_date, extensionDays),
  };
};

// Extension Eligibility
const isEligibleForExtension = (policy) => {
  const hasExtendibleProduct = policy.product_details.is_extendible;
  const withinGracePeriod = checkGracePeriod(policy);
  const paymentStatus = policy.status === "ACTIVE";

  return {
    eligible: hasExtendibleProduct && withinGracePeriod && paymentStatus,
    reasons: getIneligibilityReasons(
      hasExtendibleProduct,
      withinGracePeriod,
      paymentStatus
    ),
  };
};
```

## 📊 Data Flow Architecture

### Renewal Data Flow

```
1. UpcomingScreen (fetch upcoming renewals)
   ↓
2. PolicySelector (select policy to renew)
   ↓
3. EligibilityChecker (validate renewal eligibility)
   ↓
4. VehicleDetailsUpdate (update vehicle information)
   ↓
5. ClientDetailsUpdate (update client information)
   ↓
6. PricingRecalculation (calculate new premium)
   ↓
7. UnderwriterSelection (choose underwriter)
   ↓
8. DocumentsUpdate (upload new documents)
   ↓
9. PaymentProcessing (process renewal payment)
   ↓
10. PolicyGeneration (generate renewed policy)
```

### Extension Data Flow

```
1. UpcomingScreen (fetch policies eligible for extension)
   ↓
2. PolicySelector (select policy to extend)
   ↓
3. ExtensionEligibility (validate extension eligibility)
   ↓
4. PeriodSelection (choose extension period)
   ↓
5. ReasonSelection (select extension reason)
   ↓
6. ProratedCalculation (calculate prorated premium)
   ↓
7. PaymentProcessing (process extension payment)
   ↓
8. ExtensionCompletion (update policy records)
```

## 🔍 Integration Points

### With Existing Motor 2 Flow

1. **Component Reuse**

   - DynamicVehicleForm for vehicle details
   - EnhancedClientForm for client information
   - UnderwriterSelectionStep for underwriter choice
   - EnhancedPayment for payment processing

2. **Service Integration**

   - MotorInsurancePricingService for pricing
   - DjangoAPIService for backend communication
   - MotorInsuranceContext for state management

3. **Navigation Integration**
   - UpcomingScreen as entry point
   - Home screen for completion redirect
   - Policy details for document viewing

### With Backend Services

1. **API Integration**

   - Motor 2 policy endpoints
   - Pricing calculation services
   - Document generation services
   - Payment processing integration

2. **Database Integration**
   - MotorPolicy model updates
   - PolicyExtension records
   - ExtensionReminder scheduling

## 📈 Success Metrics

### Functional Requirements

- [ ] Agents can renew Motor 2 policies within 30 days of expiry
- [ ] Agents can extend eligible policies with prorated calculations
- [ ] System automatically calculates updated pricing
- [ ] Integration with existing payment and document systems
- [ ] Automated reminder system for extensions

### Performance Requirements

- [ ] Renewal flow completion in < 3 minutes
- [ ] Extension flow completion in < 2 minutes
- [ ] API response times < 2 seconds
- [ ] Document generation < 10 seconds

### User Experience Requirements

- [ ] Intuitive navigation consistent with Motor 2 flow
- [ ] Clear pricing comparisons and breakdowns
- [ ] Proper error handling and user feedback
- [ ] Mobile-responsive design

## 🎯 Next Steps

1. **Immediate Actions (Today)**

   - Review and approve this implementation plan
   - Set up development branch for renewal/extension work
   - Identify any missing requirements or dependencies

2. **Week 1 Priorities**

   - Start backend API endpoint development
   - Begin database schema updates
   - Create development environment setup

3. **Weekly Reviews**
   - Track progress against phase timelines
   - Identify and resolve blockers
   - Adjust scope based on findings

## 📝 Conclusion

This implementation plan provides a comprehensive roadmap for adding renewal and extension functionality to the Motor 2 system. By leveraging existing components and infrastructure, we can deliver a robust solution that integrates seamlessly with the current PataBima ecosystem while providing agents with powerful tools for policy management.

The phased approach ensures steady progress while maintaining code quality and user experience standards. The extensive reuse of existing Motor 2 components will significantly reduce development time and ensure consistency across the application.

---

**Document Version**: 1.0  
**Created**: October 5, 2025  
**Last Updated**: October 5, 2025  
**Status**: Ready for Implementation
