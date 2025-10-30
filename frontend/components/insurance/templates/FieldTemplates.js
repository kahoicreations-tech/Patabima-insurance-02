/**
 * Field Templates for Insurance Forms
 * 
 * This file contains reusable field definitions that can be mixed and matched
 * to create different insurance forms, eliminating duplication across forms.
 */

// Field Types
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  SELECT: 'select',
  RADIO: 'radio',
  DATE: 'date',
  DOCUMENT: 'document',
  CURRENCY: 'currency',
  NUMBER: 'number',
  SWITCH: 'switch'
};

// Common Data Options
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

export const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Machakos', 'Kajiado',
  'Murang\'a', 'Nyeri', 'Meru', 'Embu', 'Tharaka-Nithi', 'Kirinyaga',
  'Kisumu', 'Siaya', 'Busia', 'Kakamega', 'Vihiga', 'Bungoma',
  'Trans Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi',
  'Baringo', 'Kericho', 'Bomet', 'Narok', 'Kajiado', 'Other'
];

// Reusable Field Templates
export const FIELD_TEMPLATES = {
  
  // === VEHICLE IDENTIFICATION FIELDS ===
  VEHICLE_IDENTIFICATION: {
    registration_number: {
      id: 'registration_number',
      label: 'Vehicle Registration Number',
      type: FIELD_TYPES.TEXT,
      placeholder: 'e.g., KCA 123A',
      required: true,
      validation: {
        pattern: /^[A-Z]{3}\s?\d{3}[A-Z]$/,
        message: 'Please enter a valid Kenya registration number'
      }
    },
    
    make: {
      id: 'make',
      label: 'Vehicle Make',
      type: FIELD_TYPES.SELECT,
      options: VEHICLE_MAKES,
      required: true
    },
    
    model: {
      id: 'model',
      label: 'Vehicle Model',
      type: FIELD_TYPES.TEXT,
      placeholder: 'e.g., Corolla, Vitz, Axio',
      required: true
    },
    
    year_of_manufacture: {
      id: 'year_of_manufacture',
      label: 'Year of Manufacture',
      type: FIELD_TYPES.SELECT,
      options: Array.from({length: 30}, (_, i) => (new Date().getFullYear() - i).toString()),
      required: true
    },
    
    chassis_number: {
      id: 'chassis_number',
      label: 'Chassis Number',
      type: FIELD_TYPES.TEXT,
      placeholder: 'Vehicle chassis/VIN number',
      required: true
    },
    
    engine_number: {
      id: 'engine_number',
      label: 'Engine Number',
      type: FIELD_TYPES.TEXT,
      placeholder: 'Engine number',
      required: true
    },
    
    color: {
      id: 'color',
      label: 'Vehicle Color',
      type: FIELD_TYPES.TEXT,
      placeholder: 'e.g., White, Blue, Silver',
      required: true
    },
    
    body_type: {
      id: 'body_type',
      label: 'Body Type',
      type: FIELD_TYPES.SELECT,
      options: ['Saloon', 'Station Wagon', 'Hatchback', 'SUV', 'Pick-up', 'Van', 'Bus', 'Truck', 'Motorcycle', 'Other'],
      required: true
    }
  },

  // === CLIENT DETAILS FIELDS ===
  CLIENT_DETAILS: {
    client_name: {
      id: 'client_name',
      label: 'Full Name',
      type: FIELD_TYPES.TEXT,
      placeholder: 'Enter full name',
      required: true
    },
    
    id_number: {
      id: 'id_number',
      label: 'ID/Passport Number',
      type: FIELD_TYPES.TEXT,
      placeholder: 'National ID or Passport number',
      required: true
    },
    
    phone_number: {
      id: 'phone_number',
      label: 'Phone Number',
      type: FIELD_TYPES.PHONE,
      placeholder: '+254700000000',
      required: true,
      validation: {
        pattern: /^(\+254|0)[17]\d{8}$/,
        message: 'Please enter a valid Kenyan phone number'
      }
    },
    
    email: {
      id: 'email',
      label: 'Email Address',
      type: FIELD_TYPES.EMAIL,
      placeholder: 'example@email.com',
      required: true
    },
    
    postal_address: {
      id: 'postal_address',
      label: 'Postal Address',
      type: FIELD_TYPES.TEXT,
      placeholder: 'P.O. Box 123, Nairobi',
      required: true
    },
    
    physical_address: {
      id: 'physical_address',
      label: 'Physical Address',
      type: FIELD_TYPES.TEXT,
      placeholder: 'Street address, location',
      required: true
    },
    
    county: {
      id: 'county',
      label: 'County',
      type: FIELD_TYPES.SELECT,
      options: KENYAN_COUNTIES,
      required: true
    }
  },

  // === KYC DOCUMENTS FIELDS ===
  KYC_DOCUMENTS: {
    id_copy: {
      id: 'id_copy',
      label: 'Copy of ID/Passport',
      type: FIELD_TYPES.DOCUMENT,
      accept: 'image/*,application/pdf',
      required: true,
      maxSize: 5000000 // 5MB
    },
    
    driving_license: {
      id: 'driving_license',
      label: 'Driving License',
      type: FIELD_TYPES.DOCUMENT,
      accept: 'image/*,application/pdf',
      required: true,
      maxSize: 5000000
    },
    
    logbook: {
      id: 'logbook',
      label: 'Vehicle Logbook',
      type: FIELD_TYPES.DOCUMENT,
      accept: 'image/*,application/pdf',
      required: true,
      maxSize: 5000000
    },
    
    valuation_report: {
      id: 'valuation_report',
      label: 'Valuation Report',
      type: FIELD_TYPES.DOCUMENT,
      accept: 'image/*,application/pdf',
      required: false,
      maxSize: 5000000,
      conditional: {
        field: 'cover_type',
        value: 'comprehensive'
      }
    }
  },

  // === COMMERCIAL VEHICLE SPECIFIC ===
  COMMERCIAL_VEHICLE: {
    commercial_license: {
      id: 'commercial_license',
      label: 'Commercial License',
      type: FIELD_TYPES.DOCUMENT,
      accept: 'image/*,application/pdf',
      required: true,
      maxSize: 5000000
    },
    
    route_license: {
      id: 'route_license',
      label: 'Route License',
      type: FIELD_TYPES.DOCUMENT,
      accept: 'image/*,application/pdf',
      required: true,
      maxSize: 5000000
    },
    
    seating_capacity: {
      id: 'seating_capacity',
      label: 'Seating Capacity',
      type: FIELD_TYPES.NUMBER,
      placeholder: 'Number of seats',
      required: true,
      min: 1,
      max: 100
    },
    
    tonnage: {
      id: 'tonnage',
      label: 'Tonnage (for trucks)',
      type: FIELD_TYPES.NUMBER,
      placeholder: 'Vehicle tonnage',
      required: false,
      conditional: {
        field: 'body_type',
        value: 'Truck'
      }
    }
  },

  // === PSV SPECIFIC FIELDS ===
  PSV_SPECIFIC: {
    psv_license: {
      id: 'psv_license',
      label: 'PSV License',
      type: FIELD_TYPES.DOCUMENT,
      accept: 'image/*,application/pdf',
      required: true,
      maxSize: 5000000
    },
    
    ntsa_inspection: {
      id: 'ntsa_inspection',
      label: 'NTSA Inspection Certificate',
      type: FIELD_TYPES.DOCUMENT,
      accept: 'image/*,application/pdf',
      required: true,
      maxSize: 5000000
    },
    
    route_operated: {
      id: 'route_operated',
      label: 'Route Operated',
      type: FIELD_TYPES.TEXT,
      placeholder: 'e.g., Nairobi-Mombasa',
      required: true
    }
  },

  // === INSURANCE DETAILS ===
  INSURANCE_DETAILS: {
    cover_type: {
      id: 'cover_type',
      label: 'Type of Cover',
      type: FIELD_TYPES.RADIO,
      options: [
        { value: 'third_party', label: 'Third Party Only' },
        { value: 'comprehensive', label: 'Comprehensive' },
        { value: 'third_party_fire_theft', label: 'Third Party Fire & Theft' }
      ],
      required: true
    },
    
    sum_insured: {
      id: 'sum_insured',
      label: 'Sum Insured',
      type: FIELD_TYPES.CURRENCY,
      placeholder: '0.00',
      required: true,
      conditional: {
        field: 'cover_type',
        value: ['comprehensive', 'third_party_fire_theft']
      }
    },
    
    previous_insurer: {
      id: 'previous_insurer',
      label: 'Previous Insurer',
      type: FIELD_TYPES.SELECT,
      options: ['None', ...INSURANCE_PROVIDERS],
      required: true
    },
    
    ncb_percentage: {
      id: 'ncb_percentage',
      label: 'No Claims Bonus (%)',
      type: FIELD_TYPES.SELECT,
      options: ['0', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55', '60'],
      required: false,
      conditional: {
        field: 'previous_insurer',
        operator: '!=',
        value: 'None'
      }
    },
    
    cover_start_date: {
      id: 'cover_start_date',
      label: 'Cover Start Date',
      type: FIELD_TYPES.DATE,
      required: true,
      minDate: new Date().toISOString().split('T')[0]
    },
    
    cover_period: {
      id: 'cover_period',
      label: 'Cover Period',
      type: FIELD_TYPES.SELECT,
      options: ['1 Month', '3 Months', '6 Months', '12 Months'],
      required: true
    }
  }
};

// Step Templates - Common groupings of fields
export const STEP_TEMPLATES = {
  VEHICLE_INFO: {
    title: 'Vehicle Information',
    description: 'Enter your vehicle details',
    fields: [
      'registration_number', 'make', 'model', 'year_of_manufacture',
      'chassis_number', 'engine_number', 'color', 'body_type'
    ]
  },
  
  CLIENT_INFO: {
    title: 'Client Information',
    description: 'Enter your personal details',
    fields: [
      'client_name', 'id_number', 'phone_number', 'email',
      'postal_address', 'physical_address', 'county'
    ]
  },
  
  INSURANCE_INFO: {
    title: 'Insurance Details',
    description: 'Choose your insurance coverage',
    fields: [
      'cover_type', 'sum_insured', 'previous_insurer', 'ncb_percentage',
      'cover_start_date', 'cover_period'
    ]
  },
  
  DOCUMENTS: {
    title: 'Document Upload',
    description: 'Upload required documents',
    fields: [
      'id_copy', 'driving_license', 'logbook', 'valuation_report'
    ]
  },
  
  COMMERCIAL_DOCS: {
    title: 'Commercial Documents',
    description: 'Upload commercial vehicle documents',
    fields: [
      'commercial_license', 'route_license', 'seating_capacity', 'tonnage'
    ]
  },
  
  PSV_DOCS: {
    title: 'PSV Requirements',
    description: 'Upload PSV specific documents',
    fields: [
      'psv_license', 'ntsa_inspection', 'route_operated', 'seating_capacity'
    ]
  }
};

// Form Templates - Complete form configurations
export const FORM_TEMPLATES = {
  // Standard private vehicle forms
  PRIVATE_THIRD_PARTY: {
    steps: ['VEHICLE_INFO', 'CLIENT_INFO', 'INSURANCE_INFO', 'DOCUMENTS'],
    requiredFields: ['cover_type'],
    defaults: { cover_type: 'third_party' }
  },
  
  PRIVATE_COMPREHENSIVE: {
    steps: ['VEHICLE_INFO', 'CLIENT_INFO', 'INSURANCE_INFO', 'DOCUMENTS'],
    requiredFields: ['cover_type', 'sum_insured'],
    defaults: { cover_type: 'comprehensive' }
  },
  
  // Commercial vehicle forms
  COMMERCIAL_THIRD_PARTY: {
    steps: ['VEHICLE_INFO', 'CLIENT_INFO', 'COMMERCIAL_DOCS', 'INSURANCE_INFO', 'DOCUMENTS'],
    requiredFields: ['cover_type', 'seating_capacity'],
    defaults: { cover_type: 'third_party' }
  },
  
  COMMERCIAL_COMPREHENSIVE: {
    steps: ['VEHICLE_INFO', 'CLIENT_INFO', 'COMMERCIAL_DOCS', 'INSURANCE_INFO', 'DOCUMENTS'],
    requiredFields: ['cover_type', 'sum_insured', 'seating_capacity'],
    defaults: { cover_type: 'comprehensive' }
  },
  
  // PSV forms
  PSV_THIRD_PARTY: {
    steps: ['VEHICLE_INFO', 'CLIENT_INFO', 'PSV_DOCS', 'INSURANCE_INFO', 'DOCUMENTS'],
    requiredFields: ['cover_type', 'seating_capacity', 'route_operated'],
    defaults: { cover_type: 'third_party' }
  },
  
  PSV_COMPREHENSIVE: {
    steps: ['VEHICLE_INFO', 'CLIENT_INFO', 'PSV_DOCS', 'INSURANCE_INFO', 'DOCUMENTS'],
    requiredFields: ['cover_type', 'sum_insured', 'seating_capacity', 'route_operated'],
    defaults: { cover_type: 'comprehensive' }
  },
  
  // TOR (temporary operators road permit)
  TOR: {
    steps: ['VEHICLE_INFO', 'CLIENT_INFO', 'INSURANCE_INFO', 'DOCUMENTS'],
    requiredFields: ['cover_type', 'cover_period'],
    defaults: { 
      cover_type: 'third_party',
      cover_period: '1 Month'
    },
    specialFeatures: ['short_term_cover', 'tor_permit_upload']
  }
};

export default {
  FIELD_TYPES,
  VEHICLE_MAKES,
  INSURANCE_PROVIDERS,
  KENYAN_COUNTIES,
  FIELD_TEMPLATES,
  STEP_TEMPLATES,
  FORM_TEMPLATES
};