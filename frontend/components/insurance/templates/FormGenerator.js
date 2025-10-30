/**
 * Form Generator
 * 
 * Generates complete form configurations from field templates,
 * supporting conditional logic and dynamic field combinations.
 */

import {
  FIELD_TEMPLATES,
  STEP_TEMPLATES,
  FORM_TEMPLATES,
  FIELD_TYPES
} from './FieldTemplates';

/**
 * Builds fields for a step based on field IDs and templates
 */
export function buildFields(fieldIds, overrides = {}) {
  const fields = [];
  
  fieldIds.forEach(fieldId => {
    // Find the field in all template categories
    let fieldConfig = null;
    
    for (const category of Object.values(FIELD_TEMPLATES)) {
      if (category[fieldId]) {
        fieldConfig = { ...category[fieldId] };
        break;
      }
    }
    
    if (fieldConfig) {
      // Apply any overrides
      if (overrides[fieldId]) {
        fieldConfig = { ...fieldConfig, ...overrides[fieldId] };
      }
      
      fields.push(fieldConfig);
    } else {
      console.warn(`Field template not found: ${fieldId}`);
    }
  });
  
  return fields;
}

/**
 * Resolves conditional fields based on form data
 */
export function resolveConditionalFields(fields, formData = {}) {
  return fields.filter(field => {
    if (!field.conditional) return true;
    
    const { field: conditionField, value: conditionValue, operator = '==' } = field.conditional;
    const actualValue = formData[conditionField];
    
    switch (operator) {
      case '==':
        if (Array.isArray(conditionValue)) {
          return conditionValue.includes(actualValue);
        }
        return actualValue === conditionValue;
      case '!=':
        if (Array.isArray(conditionValue)) {
          return !conditionValue.includes(actualValue);
        }
        return actualValue !== conditionValue;
      case 'exists':
        return actualValue !== undefined && actualValue !== null && actualValue !== '';
      default:
        return true;
    }
  });
}

/**
 * Generates a complete form configuration from a template
 */
export function generateFormConfig(formType, options = {}) {
  const template = FORM_TEMPLATES[formType];
  
  if (!template) {
    throw new Error(`Form template not found: ${formType}`);
  }
  
  const {
    fieldOverrides = {},
    stepOverrides = {},
    enableValidation = true,
    showProgressBar = true,
    ...otherOptions
  } = options;
  
  // Build steps
  const steps = template.steps.map((stepKey, index) => {
    const stepTemplate = STEP_TEMPLATES[stepKey];
    
    if (!stepTemplate) {
      console.warn(`Step template not found: ${stepKey}`);
      return null;
    }
    
    // Build fields for this step
    const stepFields = buildFields(stepTemplate.fields, fieldOverrides);
    
    const step = {
      id: stepKey.toLowerCase(),
      title: stepTemplate.title,
      description: stepTemplate.description,
      fields: stepFields,
      stepNumber: index + 1,
      totalSteps: template.steps.length,
      ...stepOverrides[stepKey]
    };
    
    return step;
  }).filter(Boolean);
  
  // Generate form configuration
  const formConfig = {
    formType,
    title: `${formType.replace(/_/g, ' ')} Insurance Quote`,
    steps,
    defaults: template.defaults || {},
    requiredFields: template.requiredFields || [],
    specialFeatures: template.specialFeatures || [],
    validation: enableValidation,
    showProgressBar,
    ...otherOptions
  };
  
  return formConfig;
}

/**
 * Creates a custom form configuration by mixing templates
 */
export function createCustomFormConfig(config) {
  const {
    formType = 'CUSTOM',
    stepConfigs = [],
    defaults = {},
    requiredFields = [],
    specialFeatures = [],
    ...options
  } = config;
  
  const steps = stepConfigs.map((stepConfig, index) => {
    const {
      id,
      title,
      description,
      fieldIds = [],
      fieldOverrides = {},
      stepTemplate = null
    } = stepConfig;
    
    let fields = [];
    
    // Use step template or custom field list
    if (stepTemplate && STEP_TEMPLATES[stepTemplate]) {
      fields = buildFields(STEP_TEMPLATES[stepTemplate].fields, fieldOverrides);
    } else {
      fields = buildFields(fieldIds, fieldOverrides);
    }
    
    return {
      id: id || `step_${index + 1}`,
      title: title || `Step ${index + 1}`,
      description: description || '',
      fields,
      stepNumber: index + 1,
      totalSteps: stepConfigs.length
    };
  });
  
  return {
    formType,
    title: options.title || `${formType} Insurance Quote`,
    steps,
    defaults,
    requiredFields,
    specialFeatures,
    validation: options.enableValidation !== false,
    showProgressBar: options.showProgressBar !== false,
    ...options
  };
}

/**
 * Gets list of available form types
 */
export function getAvailableFormTypes() {
  return Object.keys(FORM_TEMPLATES);
}

/**
 * Validates if a form type exists
 */
export function isValidFormType(formType) {
  return FORM_TEMPLATES.hasOwnProperty(formType);
}

/**
 * Gets field template by ID across all categories
 */
export function getFieldTemplate(fieldId) {
  for (const category of Object.values(FIELD_TEMPLATES)) {
    if (category[fieldId]) {
      return category[fieldId];
    }
  }
  return null;
}

/**
 * Generates form data structure with defaults
 */
export function generateDefaultFormData(formConfig) {
  const defaultData = { ...formConfig.defaults };
  
  // Add empty values for all fields
  formConfig.steps.forEach(step => {
    step.fields.forEach(field => {
      if (defaultData[field.id] === undefined) {
        switch (field.type) {
          case FIELD_TYPES.SWITCH:
            defaultData[field.id] = false;
            break;
          case FIELD_TYPES.SELECT:
          case FIELD_TYPES.RADIO:
            defaultData[field.id] = field.defaultValue || '';
            break;
          default:
            defaultData[field.id] = field.defaultValue || '';
        }
      }
    });
  });
  
  return defaultData;
}

/**
 * Updates form configuration based on current data (for conditional fields)
 */
export function updateFormConfigWithData(formConfig, formData) {
  const updatedSteps = formConfig.steps.map(step => ({
    ...step,
    fields: resolveConditionalFields(step.fields, formData)
  }));
  
  return {
    ...formConfig,
    steps: updatedSteps
  };
}

/**
 * Validates form data against configuration
 */
export function validateFormData(formConfig, formData) {
  const errors = {};
  
  formConfig.steps.forEach(step => {
    const visibleFields = resolveConditionalFields(step.fields, formData);
    
    visibleFields.forEach(field => {
      const value = formData[field.id];
      const fieldErrors = [];
      
      // Required field validation
      if (field.required && (!value || value === '')) {
        fieldErrors.push(`${field.label} is required`);
      }
      
      // Pattern validation
      if (value && field.validation && field.validation.pattern) {
        if (!field.validation.pattern.test(value)) {
          fieldErrors.push(field.validation.message || `Invalid ${field.label} format`);
        }
      }
      
      // Number range validation
      if (field.type === FIELD_TYPES.NUMBER && value) {
        const numValue = parseFloat(value);
        if (field.min !== undefined && numValue < field.min) {
          fieldErrors.push(`${field.label} must be at least ${field.min}`);
        }
        if (field.max !== undefined && numValue > field.max) {
          fieldErrors.push(`${field.label} must be at most ${field.max}`);
        }
      }
      
      // File size validation
      if (field.type === FIELD_TYPES.DOCUMENT && value && field.maxSize) {
        if (value.size && value.size > field.maxSize) {
          fieldErrors.push(`${field.label} file size must be less than ${field.maxSize / 1000000}MB`);
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[field.id] = fieldErrors;
      }
    });
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  generateFormConfig,
  createCustomFormConfig,
  buildFields,
  resolveConditionalFields,
  getAvailableFormTypes,
  isValidFormType,
  getFieldTemplate,
  generateDefaultFormData,
  updateFormConfigWithData,
  validateFormData
};