import { VALIDATION_RULES, shouldShowField } from '../components/insurance';

// Validation utility functions
export const validateFormData = (formData, fields) => {
  const errors = {};
  
  fields.forEach(field => {
    // Skip validation if field should not be shown
    if (!shouldShowField(field, formData)) {
      return;
    }
    
    const value = formData[field.name];
    const fieldErrors = validateField(value, field.validation, field.name);
    
    if (fieldErrors.length > 0) {
      errors[field.name] = fieldErrors[0]; // Show first error
    }
  });
  
  return errors;
};

export const validateField = (value, validationRules = [], fieldName = '') => {
  const errors = [];
  
  validationRules.forEach(rule => {
    if (typeof rule === 'string') {
      // Simple validation rule
      switch (rule) {
        case VALIDATION_RULES.REQUIRED:
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(`${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
          }
          break;
          
        case VALIDATION_RULES.EMAIL:
          if (value && !isValidEmail(value)) {
            errors.push('Please enter a valid email address');
          }
          break;
          
        case VALIDATION_RULES.PHONE:
          if (value && !isValidPhone(value)) {
            errors.push('Please enter a valid phone number');
          }
          break;
      }
    } else if (typeof rule === 'object') {
      // Complex validation rule with parameters
      switch (rule.type) {
        case VALIDATION_RULES.MIN_LENGTH:
          if (value && value.length < rule.value) {
            errors.push(`Minimum ${rule.value} characters required`);
          }
          break;
          
        case VALIDATION_RULES.MAX_LENGTH:
          if (value && value.length > rule.value) {
            errors.push(`Maximum ${rule.value} characters allowed`);
          }
          break;
          
        case VALIDATION_RULES.MIN_VALUE:
          if (value && Number(value) < rule.value) {
            errors.push(`Minimum value is ${rule.value}`);
          }
          break;
          
        case VALIDATION_RULES.MAX_VALUE:
          if (value && Number(value) > rule.value) {
            errors.push(`Maximum value is ${rule.value}`);
          }
          break;
          
        case VALIDATION_RULES.PATTERN:
          if (value && !rule.value.test(value)) {
            errors.push(rule.message || 'Invalid format');
          }
          break;
      }
    }
  });
  
  return errors;
};

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Kenya format)
export const isValidPhone = (phone) => {
  // Accept formats: +254XXXXXXXXX, 254XXXXXXXXX, 07XXXXXXXX, 01XXXXXXXX
  const phoneRegex = /^(\+254|254|0)[17]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Format phone number to Kenya standard
export const formatPhoneNumber = (phone) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +254 XXX XXX XXX
  if (cleaned.startsWith('254')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+254${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    return `+254${cleaned}`;
  } else {
    return `+254${cleaned}`;
  }
};

// Validate specific field types
export const validateSpecificField = (fieldName, value, formData) => {
  switch (fieldName) {
    case 'nationalId':
      if (value && (value.length !== 7 && value.length !== 8)) {
        return 'National ID must be 7 or 8 digits';
      }
      break;
      
    case 'registrationNumber':
      if (formData.vehicleRegistrationMethod === 'registered' && !value) {
        return 'Registration number is required for registered vehicles';
      }
      break;
      
    case 'financierName':
      if (formData.hasFinancialInterest && !value) {
        return 'Financier name is required when financial interest exists';
      }
      break;
      
    case 'existingCoverDetails':
      if (formData.hasExistingCover && !value) {
        return 'Please provide details about your existing cover';
      }
      break;
      
    case 'dateOfBirth':
      if (value) {
        const age = calculateAge(value);
        if (age < 18) {
          return 'You must be at least 18 years old';
        }
        if (age > 100) {
          return 'Please enter a valid date of birth';
        }
      }
      break;
      
    case 'licenseIssueDate':
      if (value && value > new Date()) {
        return 'License issue date cannot be in the future';
      }
      break;
      
    case 'insuranceStartDate':
      if (value && value < new Date().setHours(0, 0, 0, 0)) {
        return 'Start date cannot be in the past';
      }
      break;
  }
  
  return null;
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export default {
  validateFormData,
  validateField,
  validateSpecificField,
  isValidEmail,
  isValidPhone,
  formatPhoneNumber,
  calculateAge
};