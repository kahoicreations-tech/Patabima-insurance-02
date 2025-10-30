/**
 * Field Library - Reusable Field Definitions
 * 
 * All form fields that can be reused across different insurance types
 */

// Field Types
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  NUMBER: 'number',
  RADIO: 'radio',
  DROPDOWN: 'dropdown',
  DATE: 'date',
  FILE_UPLOAD: 'file_upload',
  DISPLAY: 'display',
  COMPONENT: 'component'
};

// Common Options
export const VEHICLE_MAKES = [
  'Toyota', 'Nissan', 'Mazda', 'Honda', 'Subaru', 'Mitsubishi',
  'Volkswagen', 'Mercedes-Benz', 'BMW', 'Audi', 'Land Rover',
  'Isuzu', 'Ford', 'Hyundai', 'Kia', 'Peugeot', 'Other'
];

export const INSURANCE_PROVIDERS = [
  'APA Insurance', 'Jubilee Insurance', 'CIC Insurance', 'Britam',
  'ICEA LION', 'Madison Insurance', 'GA Insurance', 'Takaful Insurance',
  'Kenindia Assurance', 'AAR Insurance', 'Other'
];

export const PAYMENT_PROVIDERS = ['M-PESA', 'DPO Pay'];

export const KYC_DOCUMENTS = ['National ID', 'KRA PIN', 'Logbook'];

// Field Library - All reusable fields
export const FIELD_LIBRARY = {
  
  // === BASIC VEHICLE FIELDS ===
  financial_interest: {
    type: FIELD_TYPES.RADIO,
    label: 'Financial Interest',
    options: ['Yes', 'No'],
    required: true,
    validation: {
      required: 'Please select financial interest'
    }
  },

  vehicle_identification_type: {
    type: FIELD_TYPES.RADIO,
    label: 'Select Vehicle Identification',
    options: ['Vehicle Registration', 'Chassis Number'],
    required: true,
    validation: {
      required: 'Please select identification type'
    }
  },

  vehicle_registration: {
    type: FIELD_TYPES.TEXT,
    label: 'Vehicle Registration Number',
    placeholder: 'e.g., KCA 123A',
    required: true,
    validation: {
      required: 'Vehicle registration is required',
      pattern: /^[A-Z]{3}\s?\d{3}[A-Z]$/,
      message: 'Please enter a valid Kenya registration number'
    }
  },

  vehicle_make: {
    type: FIELD_TYPES.DROPDOWN,
    label: 'Vehicle Make',
    options: VEHICLE_MAKES,
    required: true,
    validation: {
      required: 'Please select vehicle make'
    }
  },

  vehicle_model: {
    type: FIELD_TYPES.DROPDOWN,
    label: 'Vehicle Model',
    placeholder: 'Select model based on make',
    required: true,
    dependsOn: 'vehicle_make', // Dynamic options based on make
    validation: {
      required: 'Please select vehicle model'
    }
  },

  cover_start_date: {
    type: FIELD_TYPES.DATE,
    label: 'Cover Start Date',
    required: true,
    validation: {
      required: 'Please select start date',
      minDate: new Date(), // Can't be in the past
    }
  },

  // === COMMERCIAL FIELDS ===
  tonnage: {
    type: FIELD_TYPES.NUMBER,
    label: 'Tonnage',
    placeholder: 'Up to 31 tons',
    required: true,
    validation: {
      required: 'Tonnage is required',
      min: 0.1,
      max: 31,
      message: 'Tonnage must be between 0.1 and 31 tons'
    }
  },

  // === COMPREHENSIVE FIELDS ===
  vehicle_valuation: {
    type: FIELD_TYPES.NUMBER,
    label: 'Vehicle Valuation',
    placeholder: 'Enter vehicle value',
    required: true,
    validation: {
      required: 'Vehicle valuation is required',
      min: 50000,
      message: 'Vehicle value must be at least KSh 50,000'
    }
  },

  year_of_manufacture: {
    type: FIELD_TYPES.DROPDOWN,
    label: 'Year of Manufacture',
    options: Array.from({length: 30}, (_, i) => (new Date().getFullYear() - i).toString()),
    required: true,
    validation: {
      required: 'Please select year of manufacture'
    }
  },

  windscreen_value: {
    type: FIELD_TYPES.NUMBER,
    label: 'Vehicle Windscreen Value',
    placeholder: 'Enter windscreen value',
    required: false,
    validation: {
      min: 0,
      message: 'Windscreen value cannot be negative'
    }
  },

  radio_value: {
    type: FIELD_TYPES.NUMBER,
    label: 'Radio Cassette Value',
    placeholder: 'Enter radio/cassette value',
    required: false,
    validation: {
      min: 0,
      message: 'Radio value cannot be negative'
    }
  },

  // === INSURANCE SELECTION ===
  insurance_provider: {
    type: FIELD_TYPES.DROPDOWN,
    label: 'Select Third-Party Premium / Insurance Provider',
    options: INSURANCE_PROVIDERS,
    required: true,
    showPrices: true, // Special flag to show prices
    validation: {
      required: 'Please select insurance provider'
    }
  },

  optional_addons: {
    type: FIELD_TYPES.COMPONENT,
    component: 'AddonsSelector',
    label: 'Optional Add-ons',
    options: ['Excess protector', 'Political violence & Terrorism'],
    required: false
  },

  // === KYC DOCUMENTS ===
  kyc_documents: {
    type: FIELD_TYPES.FILE_UPLOAD,
    label: 'KYC Documents',
    acceptedTypes: ['image/*', 'application/pdf'],
    multiple: true,
    requiredFiles: KYC_DOCUMENTS,
    validation: {
      required: 'Please upload all required documents'
    }
  },

  // === PAYMENT GATEWAY FIELDS ===
  payment_provider: {
    type: FIELD_TYPES.RADIO,
    label: 'Payment Provider',
    options: PAYMENT_PROVIDERS,
    required: true,
    validation: {
      required: 'Please select payment method'
    }
  },

  payment_phone: {
    type: FIELD_TYPES.PHONE,
    label: 'Phone Number',
    placeholder: '+254700000000',
    required: true,
    validation: {
      required: 'Phone number is required for payment',
      pattern: /^(\+254|0)[17]\d{8}$/,
      message: 'Please enter a valid Kenyan phone number'
    }
  },

  transaction_reference: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Transaction Reference',
    autoGenerate: true,
    format: 'PAT-{timestamp}-{random}'
  },

  amount_to_pay: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Amount to Pay',
    calculated: true,
    dependsOn: ['insurance_provider', 'optional_addons'],
    format: 'currency'
  },

  payment_instructions: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Payment Instructions',
    content: 'Step-by-step payment guide will appear here',
    dependsOn: 'payment_provider'
  },

  payment_status: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Transaction Status',
    dynamic: true,
    options: ['Transaction Pending', 'Payment Confirmed']
  },

  // === POLICY SUMMARY FIELDS ===
  insurance_type_display: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Insurance type',
    calculated: true,
    format: 'text'
  },

  selected_insurer: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Insurer',
    dependsOn: 'insurance_provider'
  },

  cover_period_display: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Cover period',
    calculated: true,
    dependsOn: 'cover_start_date'
  },

  premium_breakdown: {
    type: FIELD_TYPES.COMPONENT,
    component: 'PremiumBreakdown',
    label: 'Premium Breakdown',
    calculated: true
  },

  training_levy: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Training Levy',
    calculated: true,
    format: 'currency'
  },

  pcf_levy: {
    type: FIELD_TYPES.DISPLAY,
    label: 'PCF Levy',
    calculated: true,
    format: 'currency'
  },

  policy_stamp_duty: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Policy Stamp Duty',
    calculated: true,
    format: 'currency'
  },

  total_amount_payable: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Total Amount Payable',
    calculated: true,
    format: 'currency',
    style: 'highlight'
  },

  // === RECEIPT FIELDS ===
  receipt_header: {
    type: FIELD_TYPES.COMPONENT,
    component: 'ReceiptHeader',
    label: 'Receipt Header'
  },

  policy_number: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Policy Number',
    autoGenerate: true,
    format: 'POL-{year}-{random}'
  },

  policy_type_display: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Policy Type',
    calculated: true
  },

  payment_date: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Payment Date',
    autoGenerate: true,
    format: 'date'
  },

  payment_time: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Payment Time',
    autoGenerate: true,
    format: 'time'
  },

  transaction_id: {
    type: FIELD_TYPES.DISPLAY,
    label: 'Transaction ID',
    dependsOn: 'payment_provider'
  },

  receipt_actions: {
    type: FIELD_TYPES.COMPONENT,
    component: 'ReceiptActions',
    actions: ['Download Receipt', 'Go to Home']
  }
};