/**
 * TOR For Private Insurance Form Configuration
 * 
 * JSON configuration for TOR form using field library
 */

export const TOR_PRIVATE_CONFIG = {
  formType: 'TOR_PRIVATE',
  title: 'TOR For Private Insurance hello',
  description: 'Third Party Only Road Risks for Private Vehicles',
  
  // Multi-step form configuration
  steps: [
    {
      id: 'vehicle_details',
      title: 'Vehicle Details',
      description: 'Enter your vehicle information',
      stepNumber: 1,
      totalSteps: 5,
      fields: [
        'financial_interest',
        'vehicle_identification_type',
        'vehicle_registration',
        'vehicle_make',
        'vehicle_model',
        'cover_start_date'
      ],
      validation: {
        required: true,
        message: 'Please complete all vehicle details before proceeding'
      }
    },
    
    {
      id: 'insurance_selection',
      title: 'Insurance Selection',
      description: 'Choose your insurance provider and premium',
      stepNumber: 2,
      totalSteps: 5,
      fields: [
        'insurance_provider'
      ],
      validation: {
        required: true,
        message: 'Please select an insurance provider'
      }
    },
    
    {
      id: 'kyc_documents',
      title: 'KYC Documents',
      description: 'Upload required documents',
      stepNumber: 3,
      totalSteps: 5,
      fields: [
        'kyc_documents'
      ],
      validation: {
        required: true,
        message: 'Please upload all required documents'
      }
    },
    
    {
      id: 'payment_gateway',
      title: 'Payment',
      description: 'Complete your payment',
      stepNumber: 4,
      totalSteps: 5,
      fields: [
        'payment_provider',
        'payment_phone',
        'transaction_reference',
        'amount_to_pay',
        'payment_instructions',
        'payment_status'
      ],
      validation: {
        required: true,
        message: 'Payment must be completed to proceed'
      }
    },
    
    {
      id: 'policy_summary',
      title: 'Policy Summary',
      description: 'Review your policy details',
      stepNumber: 5,
      totalSteps: 5,
      fields: [
        'insurance_type_display',
        'selected_insurer',
        'cover_period_display',
        'vehicle_registration',
        'premium_breakdown',
        'training_levy',
        'pcf_levy',
        'policy_stamp_duty',
        'total_amount_payable'
      ],
      isReadOnly: true,
      showReceipt: true
    }
  ],
  
  // Receipt configuration
  receipt: {
    title: 'Payment Receipt',
    fields: [
      'receipt_header',
      'policy_number',
      'policy_type_display',
      'vehicle_registration',
      'cover_period_display',
      'total_amount_payable',
      'payment_date',
      'payment_time',
      'transaction_id',
      'receipt_actions'
    ]
  },
  
  // Form-specific calculations and logic
  calculations: {
    insurance_type_display: () => 'Private Third Party (Motor Insurance)',
    policy_type_display: () => 'TOR For Private',
    
    // Premium calculation logic
    calculatePremium: (formData) => {
      const baseRates = {
        'APA Insurance': 5000,
        'Jubilee Insurance': 4800,
        'CIC Insurance': 5200,
        'Britam': 4900,
        'ICEA LION': 5100,
        'Madison Insurance': 4700,
        'GA Insurance': 5300,
        'Takaful Insurance': 4600,
        'Kenindia Assurance': 5000,
        'AAR Insurance': 5400
      };
      
      const basePremium = baseRates[formData.insurance_provider] || 5000;
      const trainingLevy = basePremium * 0.002; // 0.2%
      const stampDuty = 40; // Fixed KSh 40
      
      return {
        basePremium,
        trainingLevy,
        stampDuty,
        total: basePremium + trainingLevy + stampDuty
      };
    }
  },
  
  // Backend submission configuration
  submission: {
    endpoint: '/api/insurance/submit',
    method: 'POST',
    format: {
      insuranceType: 'TOR_PRIVATE',
      formData: 'all_fields',
      calculations: 'premium_breakdown',
      timestamp: 'auto',
      agentId: 'from_context'
    }
  },
  
  // Validation rules
  validation: {
    // Cross-field validation
    crossFieldRules: [
      {
        condition: (data) => data.vehicle_identification_type === 'Vehicle Registration',
        validates: 'vehicle_registration',
        message: 'Vehicle registration is required when using registration number'
      }
    ],
    
    // Business rules
    businessRules: [
      {
        field: 'cover_start_date',
        rule: (date) => new Date(date) >= new Date(),
        message: 'Cover start date cannot be in the past'
      }
    ]
  },
  
  // UI Configuration
  ui: {
    theme: 'patabima',
    showProgressBar: true,
    showStepNumbers: true,
    allowBackNavigation: true,
    showValidationSummary: true,
    
    // Step-specific UI settings
    stepSettings: {
      payment_gateway: {
        showLoadingStates: true,
        autoRefreshStatus: true,
        refreshInterval: 5000
      },
      policy_summary: {
        showPrintButton: true,
        showEmailButton: true,
        highlightTotal: true
      }
    }
  }
};