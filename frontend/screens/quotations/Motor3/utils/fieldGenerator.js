/**
 * Motor Form Field Generator
 * 
 * Utility to generate form field configurations matching Motor2 exactly.
 * This ensures Motor3 fields are identical to Motor2 for consistency.
 * 
 * Usage:
 *   import { generateFormFields, FIELD_TYPES } from './fieldGenerator';
 *   const fields = generateFormFields('PRIVATE_THIRD_PARTY', formData);
 */

import { VEHICLE_MAKES, getModelsForMake } from '../../../../../constants/vehicleCatalog';
import { getSubcategoryByCode, getSubcategoryRequirements } from './staticCategories';

/**
 * Field type constants matching Motor2 DynamicVehicleForm
 */
export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  FORMATTED_NUMBER: 'formatted_number',
  RADIO: 'radio',
  SELECT: 'select',
  DATE: 'date',
  UNDERWRITER: 'underwriter',
};

/**
 * Core form fields (always present for all products)
 * Matches Motor2 exactly
 */
const CORE_FIELDS = [
  {
    key: 'financialInterest',
    label: 'Financial Interest',
    type: FIELD_TYPES.RADIO,
    required: true,
    options: ['Yes', 'No'],
    help: 'Does the vehicle have a loan or is it mortgaged?',
  },
  {
    key: 'identificationType',
    label: 'Vehicle Identification Type',
    type: FIELD_TYPES.RADIO,
    required: true,
    options: ['Vehicle Registration', 'Chassis Number'],
    help: 'How would you like to identify the vehicle?',
  },
];

/**
 * Get identification field (changes based on identificationType)
 */
const getIdentificationField = (formData) => {
  const isChassisNumber = formData.identificationType === 'Chassis Number';
  
  return {
    key: 'registrationNumber', // Same key for both types
    label: isChassisNumber ? 'Chassis Number' : 'Vehicle Registration',
    type: FIELD_TYPES.TEXT,
    required: true,
    placeholder: isChassisNumber ? 'Enter chassis number' : 'e.g., KDA 123A',
    help: isChassisNumber 
      ? 'Enter the vehicle chassis number'
      : 'Enter the vehicle registration number (number plate)',
  };
};

/**
 * Cover start date field
 */
const COVER_START_DATE_FIELD = {
  key: 'cover_start_date',
  label: 'Cover Start Date',
  type: FIELD_TYPES.DATE,
  required: true,
  defaultValue: new Date().toISOString().split('T')[0],
  help: 'When should the insurance coverage begin?',
};

/**
 * Vehicle details fields (shown for non-Third-Party products)
 * Matches Motor2 exactly
 */
const getVehicleDetailsFields = (formData) => {
  const fields = [];

  // Make field (dropdown with "Others" option)
  const makeOptions = [...VEHICLE_MAKES, 'Others'];
  fields.push({
    key: 'make',
    label: 'Vehicle Make',
    type: FIELD_TYPES.SELECT,
    required: true,
    options: makeOptions,
    help: 'Select the vehicle manufacturer',
  });

  // If "Others" selected for make, show text input
  if (formData.make === 'Others') {
    fields.push({
      key: 'make_other',
      label: 'Specify Vehicle Make',
      type: FIELD_TYPES.TEXT,
      required: true,
      placeholder: 'Enter vehicle make',
      help: 'Enter the vehicle make name',
    });
  }

  // Model field (depends on selected make)
  const models = formData.make === 'Others' ? null : getModelsForMake(formData.make);
  if (models && models.length > 0) {
    const modelOptions = [...models, 'Others'];
    fields.push({
      key: 'model',
      label: 'Vehicle Model',
      type: FIELD_TYPES.SELECT,
      required: true,
      options: modelOptions,
      help: 'Select the vehicle model',
    });

    // If "Others" selected for model, show text input
    if (formData.model === 'Others') {
      fields.push({
        key: 'model_other',
        label: 'Specify Vehicle Model',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'Enter vehicle model',
        help: 'Enter the vehicle model name',
      });
    }
  } else {
    // No models list available, show text input
    fields.push({
      key: 'model',
      label: 'Vehicle Model',
      type: FIELD_TYPES.TEXT,
      required: true,
      placeholder: 'Axio',
      help: 'Enter the vehicle model name',
    });
  }

  // Year field
  fields.push({
    key: 'year',
    label: 'Year of Manufacture',
    type: FIELD_TYPES.NUMBER,
    required: true,
    placeholder: '2016',
    help: 'Enter the year the vehicle was manufactured',
  });

  return fields;
};

/**
 * Pricing-specific fields based on pricing model
 */
const getPricingFields = (subcategoryCode) => {
  const requirements = getSubcategoryRequirements(subcategoryCode);
  const fields = [];

  // Comprehensive: needs sum_insured
  if (requirements.pricing_model === 'BRACKET') {
    fields.push({
      key: 'sum_insured',
      label: 'Sum Insured (Vehicle Value)',
      type: FIELD_TYPES.FORMATTED_NUMBER,
      required: true,
      placeholder: 'e.g., 1 500 000',
      help: 'Enter the current market value of your vehicle',
    });
  }

  // Commercial: needs tonnage
  if (requirements.requires_tonnage) {
    fields.push({
      key: 'tonnage',
      label: 'Vehicle Tonnage',
      type: FIELD_TYPES.NUMBER,
      required: true,
      placeholder: 'e.g., 3.5',
      help: 'Enter the vehicle tonnage in tons',
    });
  }

  // PSV/TukTuk: needs passenger capacity
  if (requirements.requires_passenger_count) {
    fields.push({
      key: 'capacity',
      label: 'Passenger Capacity',
      type: FIELD_TYPES.NUMBER,
      required: true,
      placeholder: 'e.g., 14',
      help: 'Enter the number of passengers the vehicle can carry',
    });
  }

  // PSV: needs passenger type
  if (requirements.requires_passenger_type) {
    fields.push({
      key: 'passenger_type',
      label: 'Passenger Type',
      type: FIELD_TYPES.RADIO,
      required: true,
      options: ['Adults', 'Students'],
      help: 'Type of passengers primarily carried',
    });
  }

  return fields;
};

/**
 * Underwriter selection placeholder field
 */
const UNDERWRITER_FIELD = {
  key: 'underwriter',
  label: 'Available Underwriters',
  type: FIELD_TYPES.UNDERWRITER,
  required: false,
  help: 'Compare and select an insurance underwriter',
};

/**
 * Main function to generate all form fields for a subcategory
 * 
 * @param {string} subcategoryCode - e.g., 'PRIVATE_THIRD_PARTY'
 * @param {object} formData - Current form data (for conditional fields)
 * @returns {array} Array of field configuration objects
 */
export const generateFormFields = (subcategoryCode, formData = {}) => {
  const fields = [];
  const subcategory = getSubcategoryByCode(subcategoryCode);
  
  if (!subcategory) {
    console.warn(`[fieldGenerator] Unknown subcategory: ${subcategoryCode}`);
    return fields;
  }

  const requirements = getSubcategoryRequirements(subcategoryCode);
  const isThirdPartyLike = (
    requirements.coverage_type?.toLowerCase().includes('third_party') ||
    requirements.coverage_type?.toLowerCase().includes('tor') ||
    requirements.pricing_model === 'FIXED'
  );

  // Step 1: Core fields (always present)
  fields.push(...CORE_FIELDS);

  // Step 2: Identification field (dynamic label/placeholder)
  fields.push(getIdentificationField(formData));

  // Step 3: Cover start date
  fields.push(COVER_START_DATE_FIELD);

  // Step 4: Vehicle details (skip for Third Party/TOR)
  if (!isThirdPartyLike) {
    fields.push(...getVehicleDetailsFields(formData));
  }

  // Step 5: Pricing fields (if applicable)
  fields.push(...getPricingFields(subcategoryCode));

  // Step 6: Underwriter selection placeholder
  fields.push(UNDERWRITER_FIELD);

  return fields;
};

/**
 * Get field by key
 */
export const getFieldByKey = (fields, key) => {
  return fields.find((field) => field.key === key);
};

/**
 * Get required fields
 */
export const getRequiredFields = (fields) => {
  return fields.filter((field) => field.required);
};

/**
 * Get field keys only
 */
export const getFieldKeys = (fields) => {
  return fields.map((field) => field.key);
};

/**
 * Validate form data against fields
 */
export const validateFormData = (fields, formData) => {
  const errors = {};
  
  fields.forEach((field) => {
    if (field.required && !formData[field.key]) {
      errors[field.key] = `${field.label} is required`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Get field configuration for a specific key (with current form state)
 */
export const getFieldConfig = (subcategoryCode, fieldKey, formData = {}) => {
  const allFields = generateFormFields(subcategoryCode, formData);
  return getFieldByKey(allFields, fieldKey);
};

/**
 * Export field sets for direct use
 */
export const FIELD_SETS = {
  CORE: CORE_FIELDS,
  COVER_DATE: COVER_START_DATE_FIELD,
  UNDERWRITER: UNDERWRITER_FIELD,
};

export default {
  FIELD_TYPES,
  FIELD_SETS,
  generateFormFields,
  getFieldByKey,
  getRequiredFields,
  getFieldKeys,
  validateFormData,
  getFieldConfig,
};
