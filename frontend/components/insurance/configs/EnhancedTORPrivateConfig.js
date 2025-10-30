/**
 * Enhanced TOR Private Configuration with Service Integrations
 * 
 * Includes DMVIC, Textract, and real-time pricing features
 */

export const ENHANCED_TOR_PRIVATE_CONFIG = {
  formType: 'TOR_PRIVATE',
  title: 'TOR For Private Insurance',
  description: 'Third Party Only Road Risks for Private Vehicles',
  
  // Service integration settings
  integrations: {
    dmvic: {
      enabled: true,
      checkOnVehicleEntry: true,
      autoSuggestDates: true
    },
    textract: {
      enabled: true,
      requiredDocuments: ['logbook', 'nationalId'],
      autoValidation: true
    },
    realTimePricing: {
      enabled: true,
      updateOnFieldChange: ['vehicle_make', 'vehicle_model', 'vehicle_year', 'insurance_provider']
    }
  },

  // Enhanced multi-step form configuration
  steps: [
    {
      id: 'vehicle_details',
      title: 'Vehicle Details',
      description: 'Enter your vehicle information',
      stepNumber: 1,
      totalSteps: 6,
      integrations: {
        dmvic: {
          triggerFields: ['vehicle_registration'],
          showPolicyCheck: true
        }
      },
      fields: [
        'financial_interest',
        'vehicle_identification_type',
        'vehicle_registration',
        'dmvic_policy_check', // New field for policy check results
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
      id: 'smart_verification',
      title: 'Smart Verification',
      description: 'We verify your vehicle details automatically',
      stepNumber: 2,
      totalSteps: 6,
      integrations: {
        dmvic: {
          autoFetchVehicleDetails: true
        }
      },
      fields: [
        'dmvic_verification_status',
        'verified_vehicle_details',
        'date_adjustment_options'
      ],
      conditional: {
        showIf: 'dmvic_check_completed'
      }
    },
    {
      id: 'insurance_selection',
      title: 'Insurance Selection',
      description: 'Choose your insurance provider and coverage',
      stepNumber: 3,
      totalSteps: 6,
      integrations: {
        realTimePricing: {
          updateOnSelection: true,
          showBreakdown: true
        }
      },
      fields: [
        'insurance_provider',
        'optional_addons',
        'live_premium_display', // New field for real-time pricing
        'premium_breakdown_display'
      ],
      validation: {
        required: true,
        message: 'Please select an insurance provider'
      }
    },
    {
      id: 'kyc_details',
      title: 'KYC Details',
      description: 'Upload documents for verification',
      stepNumber: 4,
      totalSteps: 6,
      integrations: {
        textract: {
          processOnUpload: true,
          autoFillFields: true,
          showConfidence: true
        }
      },
      fields: [
        'document_upload_logbook',
        'document_upload_national_id',
        'document_upload_kra_pin',
        'textract_processing_status',
        'extracted_data_verification',
        'manual_data_entry' // Fallback for failed extractions
      ],
      validation: {
        required: true,
        message: 'Please upload all required documents'
      }
    },
    {
      id: 'data_verification',
      title: 'Data Verification',
      description: 'Confirm extracted information',
      stepNumber: 5,
      totalSteps: 6,
      integrations: {
        textract: {
          showValidationResults: true,
          allowManualCorrection: true
        }
      },
      fields: [
        'validation_results_display',
        'owner_name',
        'owner_id_number',
        'extracted_vs_input_comparison',
        'manual_override_options'
      ],
      conditional: {
        showIf: 'textract_processing_completed'
      }
    },
    {
      id: 'payment',
      title: 'Payment',
      description: 'Complete your payment',
      stepNumber: 6,
      totalSteps: 6,
      fields: [
        'policy_summary_display',
        'final_premium_display',
        'payment_provider',
        'payment_phone',
        'payment_confirmation'
      ],
      validation: {
        required: true,
        message: 'Please complete payment details'
      }
    }
  ],

  // Enhanced field definitions with service integration
  fieldDefinitions: {
    // DMVIC Integration Fields
    dmvic_policy_check: {
      type: 'COMPONENT',
      label: 'Policy Check',
      component: 'DMVICPolicyCheck',
      dependsOn: 'vehicle_registration',
      autoTrigger: true
    },
    
    dmvic_verification_status: {
      type: 'DISPLAY',
      label: 'Verification Status',
      component: 'VerificationStatus'
    },
    
    verified_vehicle_details: {
      type: 'DISPLAY',
      label: 'Verified Vehicle Details',
      component: 'VerifiedDetails'
    },
    
    date_adjustment_options: {
      type: 'COMPONENT',
      label: 'Cover Start Date Options',
      component: 'DateAdjustment'
    },

    // Real-time Pricing Fields
    live_premium_display: {
      type: 'DISPLAY',
      label: 'Live Premium',
      component: 'LivePremiumDisplay',
      highlight: true,
      realTimeUpdate: true
    },
    
    premium_breakdown_display: {
      type: 'DISPLAY',
      label: 'Premium Breakdown',
      component: 'PremiumBreakdown',
      expandable: true
    },

    // Textract Integration Fields
    document_upload_logbook: {
      type: 'FILE_UPLOAD',
      label: 'Vehicle Logbook',
      required: true,
      acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      textractProcessing: true,
      extractionType: 'logbook'
    },
    
    document_upload_national_id: {
      type: 'FILE_UPLOAD',
      label: 'National ID',
      required: true,
      acceptedTypes: ['image/jpeg', 'image/png'],
      textractProcessing: true,
      extractionType: 'nationalId'
    },
    
    document_upload_kra_pin: {
      type: 'FILE_UPLOAD',
      label: 'KRA PIN Certificate',
      required: true,
      acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      textractProcessing: true,
      extractionType: 'kraPin'
    },
    
    textract_processing_status: {
      type: 'COMPONENT',
      label: 'Processing Status',
      component: 'TextractProcessingStatus'
    },
    
    extracted_data_verification: {
      type: 'COMPONENT',
      label: 'Extracted Data',
      component: 'ExtractedDataVerification'
    },
    
    validation_results_display: {
      type: 'COMPONENT',
      label: 'Validation Results',
      component: 'ValidationResults'
    },
    
    extracted_vs_input_comparison: {
      type: 'COMPONENT',
      label: 'Data Comparison',
      component: 'DataComparison'
    },
    
    manual_override_options: {
      type: 'COMPONENT',
      label: 'Manual Corrections',
      component: 'ManualOverride'
    },

    // Enhanced existing fields
    vehicle_registration: {
      type: 'TEXT',
      label: 'Vehicle Registration Number',
      placeholder: 'e.g., KCA 123A',
      required: true,
      dmvicTrigger: true, // Trigger DMVIC check on input
      validation: {
        pattern: '^[A-Z]{3}\\s?\\d{3}[A-Z]$',
        message: 'Please enter a valid registration number'
      }
    },
    
    cover_start_date: {
      type: 'DATE',
      label: 'Cover Start Date',
      required: true,
      dmvicSuggested: true, // Can be auto-suggested by DMVIC
      validation: {
        minDate: 'today',
        message: 'Cover start date cannot be in the past'
      }
    }
  },

  // Service-specific configurations
  serviceConfigs: {
    dmvic: {
      endpoint: '/api/dmvic',
      timeout: 5000,
      retryAttempts: 3
    },
    textract: {
      endpoint: '/api/textract',
      timeout: 15000,
      maxFileSize: '5MB',
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf']
    },
    pricing: {
      endpoint: '/api/pricing',
      updateDebounce: 500,
      showConfidence: true
    }
  },

  // Business rules
  businessRules: {
    existingPolicyHandling: {
      allowOverlap: false,
      suggestGapCover: true,
      showWarnings: true
    },
    documentValidation: {
      minimumConfidence: 85,
      requireManualReview: ['owner_name_mismatch', 'vehicle_details_mismatch'],
      autoApprove: ['exact_match', 'high_confidence_match']
    },
    pricingRules: {
      luxuryCarMultiplier: 1.5,
      oldCarMultiplier: 1.2,
      minimumPremium: 3000
    }
  }
};