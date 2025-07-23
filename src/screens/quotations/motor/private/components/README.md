# Private Motor Insurance Components

## Overview

This directory contains reusable components extracted from the TOR quotation flow that can be used across all private motor insurance categories:

- **TOR (Third Party Only Required)**
- **Comprehensive Insurance**
- **Third Party Insurance**
- **Third Party Extendible Insurance**
- **Motorcycle Insurance**

## Components

### Step Components

#### 1. PersonalInformationStep
Collects customer personal information with configurable required/optional fields.

```javascript
import { PersonalInformationStep } from './components';

<PersonalInformationStep
  formData={formData}
  onUpdateFormData={updateFormData}
  requiredFields={['fullName', 'idNumber', 'phoneNumber']}
  optionalFields={['email', 'kraPin']}
  showValidation={true}
/>
```

#### 2. VehicleDetailsStep
Handles vehicle information with policy validation and insurance date selection.

```javascript
import { VehicleDetailsStep } from './components';

<VehicleDetailsStep
  formData={formData}
  onUpdateFormData={updateFormData}
  enablePolicyValidation={true}
  enableInsuranceDate={true}
  onRegistrationChange={checkExistingInsurance}
  policyValidation={policyValidation}
/>
```

#### 3. VehicleValueStep
Vehicle value input with estimation and guidelines.

```javascript
import { VehicleValueStep } from './components';

<VehicleValueStep
  formData={formData}
  onUpdateFormData={updateFormData}
  vehicleAge={formData.vehicleAge}
  enableEstimation={true}
/>
```

#### 4. InsurerSelectionStep
Insurer comparison and selection with premium calculations.

```javascript
import { InsurerSelectionStep } from './components';

<InsurerSelectionStep
  formData={formData}
  onUpdateFormData={updateFormData}
  insurers={availableInsurers}
  insuranceType="TOR Insurance"
  enablePremiumCalculation={true}
  onCalculatePremium={calculatePremiumForInsurer}
  vehicleAge={formData.vehicleAge}
/>
```

#### 5. DocumentUploadStep
Document upload with configurable document types.

```javascript
import { DocumentUploadStep } from './components';

<DocumentUploadStep
  formData={formData}
  onUpdateFormData={updateFormData}
  requiredDocuments={['logbook', 'nationalId']}
  optionalDocuments={['kraPin']}
  showQuotationSummary={true}
  selectedInsurer={selectedInsurer}
  insuranceType="TOR Insurance"
/>
```

#### 6. PaymentStep
M-Pesa payment processing with status tracking.

```javascript
import { PaymentStep } from './components';

<PaymentStep
  formData={formData}
  onUpdateFormData={updateFormData}
  paymentState={paymentState}
  onInitiatePayment={initiateMpesaPayment}
  onRetryPayment={retryPayment}
  serviceFee={50}
  insuranceType="TOR Insurance"
/>
```

### UI Components

#### QuotationProgressBar
Progress indicator for quotation steps.

```javascript
import { QuotationProgressBar } from './components';

<QuotationProgressBar
  currentStep={currentStep}
  totalSteps={6}
  stepLabels={['Personal', 'Vehicle', 'Value', 'Insurer', 'Documents', 'Payment']}
  showStepLabels={true}
  animated={true}
/>
```

## Business Logic Functions

The components also export business logic functions for premium calculations:

```javascript
import { 
  calculateMotorPremium,
  validateVehicleEligibility,
  compareInsurerPremiums 
} from './components';

// Calculate premium for an insurer
const calculation = calculateMotorPremium({
  vehicleValue: 1000000,
  vehicleAge: 5,
  insurer: insurerConfig,
  insuranceType: 'TOR',
  vehicleCategory: 'Private'
});

// Validate vehicle eligibility
const eligibility = validateVehicleEligibility(
  vehicleAge,
  insurerConfig,
  'TOR'
);
```

## Usage Example

Here's how to use these components in a new insurance quotation flow:

```javascript
import React, { useState } from 'react';
import {
  PersonalInformationStep,
  VehicleDetailsStep,
  VehicleValueStep,
  InsurerSelectionStep,
  DocumentUploadStep,
  PaymentStep,
  QuotationProgressBar
} from './components';

const NewInsuranceQuotationScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Initialize form data
  });

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInformationStep
            formData={formData}
            onUpdateFormData={setFormData}
          />
        );
      case 2:
        return (
          <VehicleDetailsStep
            formData={formData}
            onUpdateFormData={setFormData}
          />
        );
      // ... other steps
    }
  };

  return (
    <View>
      <QuotationProgressBar
        currentStep={currentStep}
        totalSteps={6}
      />
      {renderCurrentStep()}
    </View>
  );
};
```

## Customization

Each component is highly configurable:

- **Required/Optional Fields**: Control which fields are mandatory
- **Feature Toggles**: Enable/disable specific features
- **Custom Styling**: Components inherit from app constants
- **Business Logic**: Plug in custom calculation functions
- **Document Types**: Configure required documents per insurance type

## File Structure

```
src/screens/quotations/motor/private/components/
├── PersonalInformationStep.js
├── VehicleDetailsStep.js
├── VehicleValueStep.js
├── InsurerSelectionStep.js
├── DocumentUploadStep.js
├── PaymentStep.js
├── QuotationProgressBar.js
├── PremiumCalculator.js
├── index.js
└── README.md
```

This modular approach ensures consistency across all private motor insurance quotation flows while maintaining flexibility for specific requirements of each insurance type.
