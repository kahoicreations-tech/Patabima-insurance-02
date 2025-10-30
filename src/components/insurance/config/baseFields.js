// Insurance Form Field Configurations
// This file defines what fields to show for each insurance type and step

export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  NUMBER: 'number',
  DATE: 'date',
  RADIO: 'radio',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  DOCUMENT: 'document'
};

export const VALIDATION_RULES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  PHONE: 'phone',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  MIN_VALUE: 'minValue',
  MAX_VALUE: 'maxValue',
  PATTERN: 'pattern'
};

// Base field configurations that can be reused
export const BASE_FIELDS = {
  // Personal Information Fields
  fullName: {
    type: FIELD_TYPES.TEXT,
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  nationalId: {
    type: FIELD_TYPES.TEXT,
    label: 'National ID Number',
    placeholder: 'Enter your National ID number',
    required: true,
    keyboardType: 'numeric',
    maxLength: 8,
    validation: [VALIDATION_RULES.REQUIRED, { type: VALIDATION_RULES.MAX_LENGTH, value: 8 }]
  },
  
  email: {
    type: FIELD_TYPES.EMAIL,
    label: 'Email Address',
    placeholder: 'Enter your email address',
    required: true,
    keyboardType: 'email-address',
    autoCapitalize: 'none',
    validation: [VALIDATION_RULES.REQUIRED, VALIDATION_RULES.EMAIL]
  },
  
  phoneNumber: {
    type: FIELD_TYPES.PHONE,
    label: 'Phone Number',
    placeholder: '+254 XXX XXX XXX',
    required: true,
    keyboardType: 'phone-pad',
    validation: [VALIDATION_RULES.REQUIRED, VALIDATION_RULES.PHONE]
  },
  
  dateOfBirth: {
    type: FIELD_TYPES.DATE,
    label: 'Date of Birth',
    placeholder: 'Select date of birth',
    required: true,
    maximumDate: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), // 18 years ago
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  // Driving License Fields
  licenseNumber: {
    type: FIELD_TYPES.TEXT,
    label: 'Driving License Number',
    placeholder: 'Enter license number',
    required: true,
    autoCapitalize: 'characters',
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  licenseIssueDate: {
    type: FIELD_TYPES.DATE,
    label: 'License Issue Date',
    placeholder: 'Select issue date',
    required: true,
    maximumDate: new Date(),
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  // Vehicle Information Fields
  registrationNumber: {
    type: FIELD_TYPES.TEXT,
    label: 'Vehicle Registration Number',
    placeholder: 'e.g. KCA 123A',
    required: true,
    autoCapitalize: 'characters',
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  vehicleValue: {
    type: FIELD_TYPES.NUMBER,
    label: 'Vehicle Value (KES)',
    placeholder: 'Enter vehicle current market value',
    required: true,
    keyboardType: 'numeric',
    validation: [VALIDATION_RULES.REQUIRED, { type: VALIDATION_RULES.MIN_VALUE, value: 1 }]
  },
  
  vehicleUsage: {
    type: FIELD_TYPES.RADIO,
    label: 'Vehicle Usage',
    required: true,
    options: [
      { value: 'private', label: 'Private Use' },
      { value: 'commercial', label: 'Commercial Use' }
    ],
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  // Policy Fields
  vehicleRegistrationMethod: {
    type: FIELD_TYPES.RADIO,
    label: 'Vehicle Identification Method',
    required: true,
    options: [
      { value: 'registered', label: 'Registered Vehicle' },
      { value: 'chassis', label: 'Chassis Number' }
    ],
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  hasFinancialInterest: {
    type: FIELD_TYPES.RADIO,
    label: 'Financial Interest',
    subtitle: 'Do you have any financial interest in this vehicle?',
    required: true,
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ],
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  financierName: {
    type: FIELD_TYPES.TEXT,
    label: 'Financier Name',
    placeholder: 'Enter financier/bank name',
    required: true,
    conditional: { field: 'hasFinancialInterest', value: true },
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  insuranceStartDate: {
    type: FIELD_TYPES.DATE,
    label: 'Cover Start Date',
    placeholder: 'Select start date',
    required: true,
    minimumDate: new Date(),
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  selectedInsurer: {
    type: FIELD_TYPES.SELECT,
    label: 'Select Insurance Provider',
    subtitle: 'Choose your preferred insurance company',
    required: true,
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  // Existing Cover
  hasExistingCover: {
    type: FIELD_TYPES.RADIO,
    label: 'Existing Insurance Cover',
    subtitle: 'Do you currently have motor insurance for this vehicle?',
    required: true,
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ],
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  existingCoverDetails: {
    type: FIELD_TYPES.TEXTAREA,
    label: 'Current Insurance Details',
    placeholder: 'Please provide details about your current insurance (company, policy number, expiry date)',
    required: true,
    conditional: { field: 'hasExistingCover', value: true },
    numberOfLines: 4,
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  // Documents
  nationalIdDocument: {
    type: FIELD_TYPES.DOCUMENT,
    label: 'National ID',
    required: true,
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  kraDocument: {
    type: FIELD_TYPES.DOCUMENT,
    label: 'KRA PIN Certificate',
    required: true,
    validation: [VALIDATION_RULES.REQUIRED]
  },
  
  logbookDocument: {
    type: FIELD_TYPES.DOCUMENT,
    label: 'Vehicle Logbook',
    required: true,
    validation: [VALIDATION_RULES.REQUIRED]
  }
};

export default BASE_FIELDS;