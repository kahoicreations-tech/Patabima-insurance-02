---
mode: agent
title: "Payment Integration & Policy Generation"
phase: "Integration Phase 1"
priority: "high"
dependencies: ["05-navigation-integration", "02-api-endpoints"]
---

# Task: Implement Payment Integration & Policy Generation

## Objective
Integrate motor insurance quotations with payment processing systems and implement automated policy generation with document management.

## Requirements

### 1. Payment Integration

#### M-PESA Integration
Enhance existing M-PESA integration for motor insurance:
- Motor insurance specific payment flows
- Premium amount validation
- Payment reference tracking
- STK push integration for motor quotes
- Payment status callbacks
- Retry mechanisms for failed payments

#### DPO Pay Integration
Integrate DPO Pay for card payments:
- Motor insurance payment flows
- Multi-currency support (KES primary)
- Payment tokenization for recurring premiums
- 3D Secure authentication
- Payment status webhooks
- Refund capabilities

#### Payment Context Integration
Enhance existing PaymentContext:
- Motor insurance payment types
- Premium payment tracking
- Payment method selection
- Payment history for motor policies
- Installment payment support (if applicable)

### 2. Policy Generation System

#### Automated Policy Creation
Implement automated policy generation:
- PDF policy document generation
- Digital policy certificates
- Policy number generation system
- Underwriter-specific policy templates
- Digital signatures and stamps
- Policy effective date management

#### Document Management
Create comprehensive document system:
- Policy document storage (AWS S3)
- Client document uploads (logbook, KRA PIN, etc.)
- Document versioning
- Secure document access
- Document sharing capabilities
- Backup and archival

#### AWS Integration
Implement AWS services:
- S3 for document storage and policy documents
- Textract for document processing (logbook extraction)
- Hosting services for backend deployment

### 3. Quote to Policy Workflow

#### Quote Finalization
Create quote finalization process:
- Final pricing confirmation
- Terms and conditions acceptance
- Payment method selection
- Client verification
- Underwriter confirmation

#### Payment Processing
Implement comprehensive payment flow:
- Payment initiation from quotation summary
- Real-time payment status updates
- Payment confirmation handling
- Failed payment recovery
- Payment receipt generation

#### Policy Issuance
Automate policy issuance:
- Automatic policy creation on payment confirmation
- Policy document generation
- Client notification system
- Underwriter notification
- Agent commission calculation

### 4. Integration with Existing Systems

#### Quote Management Integration
Connect with existing quote system:
- Quote status updates
- Quote to policy conversion
- Quote history tracking
- Quote modification workflows
- Quote expiration handling

#### Client Management Integration
Integrate with client management:
- Client record updates
- Policy association with clients
- Client notification preferences
- Client document management
- Client portal access

#### Agent Dashboard Integration
Update agent dashboard:
- Motor insurance sales tracking
- Commission calculations for motor policies
- Performance analytics
- Policy portfolio management
- Renewal tracking

### 5. Payment Processing Components

#### Payment Selection Screen
Create `PaymentSelectionScreen`:
- Payment method options (M-PESA, Card, Bank)
- Payment amount confirmation
- Terms acceptance
- Payment initiation

#### Payment Processing Screen
Create `PaymentProcessingScreen`:
- Real-time payment status
- Payment instructions (for M-PESA)
- Progress indicators
- Cancel payment option
- Error handling

#### Payment Confirmation Screen
Create `PaymentConfirmationScreen`:
- Payment success confirmation
- Policy generation status
- Document download options
- Next steps guidance
- Share policy options

### 6. Policy Management Features

#### Policy Document Viewer
Create policy document viewing:
- PDF policy viewer
- Document download
- Print functionality
- Share options
- Digital signatures verification

#### Policy Portfolio
Implement policy management:
- Active policies list
- Policy details view
- Renewal reminders
- Claims access
- Policy modifications

## Success Criteria
- [ ] M-PESA integration fully functional for motor insurance
- [ ] DPO Pay integration working for card payments
- [ ] Automated policy generation system operational
- [ ] AWS S3 document storage implemented
- [ ] AWS Textract document processing functional
- [ ] Complete quote-to-policy workflow working
- [ ] Payment status tracking and callbacks functional
- [ ] Policy documents automatically generated
- [ ] Client notifications working
- [ ] Agent dashboard updated with motor insurance data
- [ ] Error handling comprehensive for all payment scenarios
- [ ] Performance optimized for payment processing

## Technical Implementation Details

### Payment Flow Architecture
```javascript
// Payment processing workflow
const processMotorInsurancePayment = async (quotationData, paymentMethod) => {
  // 1. Validate quotation and pricing
  // 2. Initialize payment with selected method
  // 3. Handle payment processing
  // 4. Confirm payment status
  // 5. Generate policy on success
  // 6. Send notifications
  // 7. Update agent dashboard
};
```

### Policy Generation Service
```python
# Policy generation service
class MotorPolicyGenerator:
    def generate_policy(self, quotation_id, payment_reference):
        # Generate policy number
        # Create policy record
        # Generate PDF document
        # Upload to S3
        # Send notifications
        # Update quotation status
```

### Document Management
```javascript
// Document service
class DocumentManagementService {
  async uploadToS3(document, metadata)
  async processWithTextract(documentUrl)
  async generatePolicyPDF(policyData)
  async getSecureDocumentUrl(documentId)
}
```

## Files to Create/Modify
- `src/services/MotorInsurancePaymentService.js` - Payment integration
- `src/screens/Payment/MotorInsurancePayment.js` - Payment screens
- `src/components/PolicyGeneration/` - Policy components
- `src/services/DocumentManagementService.js` - Document handling
- `apps/payments/motor_insurance_payments.py` - Backend payment handling
- `apps/policies/models.py` - Policy models
- `apps/policies/services/policy_generator.py` - Policy generation
- `apps/policies/views.py` - Policy API endpoints
- AWS integration configuration files

## Payment Integration Details

### M-PESA Integration
- Use existing M-PESA credentials
- Implement motor insurance specific payment descriptions
- Handle large premium amounts (validate limits)
- Implement payment splitting if needed (agent commission)

### DPO Pay Integration
- Set up DPO Pay merchant account
- Implement secure card processing
- Handle 3D Secure flows
- Implement payment tokenization for future use

### Payment Security
- PCI DSS compliance for card payments
- Secure payment data handling
- Payment audit trails
- Fraud detection integration

## Testing Requirements
- Payment integration testing (sandbox environments)
- Policy generation testing
- Document upload and processing testing
- End-to-end quote-to-policy testing
- Payment failure scenario testing
- Performance testing for document generation
- Security testing for payment flows

## Next Steps After Completion
This enables:
- Complete motor insurance sales process
- Policy management and renewals
- Claims submission and processing
- Agent commission processing
- Regulatory compliance and reporting

## Integration Points
- Connects with navigation and UI from previous phases
- Integrates with existing payment systems
- Links to policy management workflows
- Supports claims and renewal processes
- Enables comprehensive analytics and reporting