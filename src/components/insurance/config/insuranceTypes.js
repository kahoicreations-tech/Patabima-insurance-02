import BASE_FIELDS from './baseFields';

// Define which fields appear in each step for different insurance types
export const INSURANCE_CONFIGURATIONS = {
  // TOR (Third Party Own Risk) Configuration
  TOR: {
    name: 'Third Party Own Risk',
    code: 'TOR',
    steps: {
      1: {
        title: 'Policy Details',
        subtitle: 'Enter your vehicle and policy information',
        fields: [
          'vehicleRegistrationMethod',
          'registrationNumber', // conditional on vehicleRegistrationMethod
          'hasFinancialInterest',
          'financierName', // conditional on hasFinancialInterest
          'insuranceStartDate',
          'selectedInsurer'
        ]
      },
      2: {
        title: 'Personal Information',
        subtitle: 'Tell us about yourself and your driving experience',
        fields: [
          'fullName',
          'nationalId',
          'dateOfBirth',
          'phoneNumber',
          'email',
          'licenseNumber',
          'licenseIssueDate',
          'vehicleValue',
          'vehicleUsage',
          'hasExistingCover',
          'existingCoverDetails' // conditional on hasExistingCover
        ]
      },
      3: {
        title: 'KYC Details',
        subtitle: 'Upload required documents',
        fields: [
          'nationalIdDocument',
          'kraDocument',
          'logbookDocument'
        ]
      },
      4: {
        title: 'Review & Generate Quotation',
        subtitle: 'Please review your information before generating the quotation',
        fields: [] // Summary step, no additional fields
      }
    }
  },
  
  // Third Party Insurance Configuration
  THIRD_PARTY: {
    name: 'Third Party Insurance',
    code: 'TP',
    steps: {
      1: {
        title: 'Vehicle Details',
        subtitle: 'Enter your vehicle information',
        fields: [
          'vehicleRegistrationMethod',
          'registrationNumber',
          'vehicleValue',
          'vehicleUsage',
          'insuranceStartDate'
        ]
      },
      2: {
        title: 'Personal Information',
        subtitle: 'Your personal and license details',
        fields: [
          'fullName',
          'nationalId',
          'phoneNumber',
          'email',
          'licenseNumber',
          'licenseIssueDate',
          'hasExistingCover',
          'existingCoverDetails'
        ]
      },
      3: {
        title: 'Documents',
        subtitle: 'Upload required documents',
        fields: [
          'nationalIdDocument',
          'kraDocument',
          'logbookDocument'
        ]
      },
      4: {
        title: 'Summary',
        subtitle: 'Review and generate quotation',
        fields: []
      }
    }
  },
  
  // Comprehensive Insurance Configuration
  COMPREHENSIVE: {
    name: 'Comprehensive Insurance',
    code: 'COMP',
    steps: {
      1: {
        title: 'Policy Details',
        subtitle: 'Complete policy information',
        fields: [
          'vehicleRegistrationMethod',
          'registrationNumber',
          'hasFinancialInterest',
          'financierName',
          'insuranceStartDate',
          'selectedInsurer'
        ]
      },
      2: {
        title: 'Personal Information',
        subtitle: 'Your details and driving history',
        fields: [
          'fullName',
          'nationalId',
          'dateOfBirth',
          'phoneNumber',
          'email',
          'licenseNumber',
          'licenseIssueDate'
        ]
      },
      3: {
        title: 'Vehicle Information',
        subtitle: 'Detailed vehicle information',
        fields: [
          'vehicleValue',
          'vehicleUsage',
          'hasExistingCover',
          'existingCoverDetails'
        ]
      },
      4: {
        title: 'Documents',
        subtitle: 'Upload required documents',
        fields: [
          'nationalIdDocument',
          'kraDocument',
          'logbookDocument'
        ]
      },
      5: {
        title: 'Summary',
        subtitle: 'Review and generate quotation',
        fields: []
      }
    }
  }
};

// Helper function to get field configuration for a specific insurance type and step
export const getStepFields = (insuranceType, stepNumber) => {
  const config = INSURANCE_CONFIGURATIONS[insuranceType];
  if (!config || !config.steps[stepNumber]) {
    return [];
  }
  
  const stepConfig = config.steps[stepNumber];
  return stepConfig.fields.map(fieldName => ({
    name: fieldName,
    ...BASE_FIELDS[fieldName]
  }));
};

// Helper function to get step configuration
export const getStepConfig = (insuranceType, stepNumber) => {
  const config = INSURANCE_CONFIGURATIONS[insuranceType];
  if (!config || !config.steps[stepNumber]) {
    return null;
  }
  
  return config.steps[stepNumber];
};

// Helper function to get total steps for an insurance type
export const getTotalSteps = (insuranceType) => {
  const config = INSURANCE_CONFIGURATIONS[insuranceType];
  if (!config) return 0;
  
  return Object.keys(config.steps).length;
};

// Helper function to check if a field should be displayed based on conditions
export const shouldShowField = (field, formData) => {
  if (!field.conditional) return true;
  
  const { field: conditionalField, value: conditionalValue } = field.conditional;
  return formData[conditionalField] === conditionalValue;
};

export default INSURANCE_CONFIGURATIONS;