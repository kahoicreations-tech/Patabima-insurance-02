import { useState, useCallback } from 'react';
import { VALIDATION_RULES } from '../config/constants';

/**
 * Hook for form validation
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /**
   * Validate a single field
   */
  const validateField = useCallback((name, value, rules) => {
    if (!rules) return '';

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      return `${name} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value || value.toString().trim() === '') {
      return '';
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || `${name} format is invalid`;
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      return `${name} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${name} must not exceed ${rules.maxLength} characters`;
    }

    // Min value validation
    if (rules.min && Number(value) < rules.min) {
      return `${name} must be at least ${rules.min}`;
    }

    // Max value validation
    if (rules.max && Number(value) > rules.max) {
      return `${name} must not exceed ${rules.max}`;
    }

    // Custom validation function
    if (rules.validator && typeof rules.validator === 'function') {
      const customError = rules.validator(value, values);
      if (customError) return customError;
    }

    return '';
  }, [values]);

  /**
   * Validate all fields
   */
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName], validationRules[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  /**
   * Handle field value change
   */
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Validate field immediately if it was already touched
    if (touched[name] && validationRules[name]) {
      const error = validateField(name, value, validationRules[name]);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [errors, touched, validationRules, validateField]);

  /**
   * Handle field blur (when user leaves the field)
   */
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field on blur
    if (validationRules[name]) {
      const error = validateField(name, values[name], validationRules[name]);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [values, validationRules, validateField]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Set specific field error
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Get error for a specific field
   */
  const getFieldError = useCallback((name) => {
    return touched[name] ? errors[name] : '';
  }, [errors, touched]);

  /**
   * Check if form has any errors
   */
  const hasErrors = Object.values(errors).some(error => error !== '');

  /**
   * Check if form is dirty (has unsaved changes)
   */
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    hasErrors,
    isDirty,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFieldError,
    clearErrors,
    getFieldError,
    setValues,
  };
};

/**
 * Predefined validation rules for common fields
 */
export const commonValidationRules = {
  email: VALIDATION_RULES.email,
  phone: VALIDATION_RULES.phone,
  password: VALIDATION_RULES.password,
  agentCode: VALIDATION_RULES.agentCode,
  vehicleRegistration: VALIDATION_RULES.vehicleRegistration,
  
  // Additional common rules
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name should only contain letters and spaces',
  },
  
  amount: {
    required: true,
    min: 1,
    pattern: /^\d+(\.\d{1,2})?$/,
    message: 'Please enter a valid amount',
  },
  
  vehicleRegistration: {
    required: true,
    pattern: /^K[A-Z]{2,3}\s?\d{3}[A-Z]$/,
    message: 'Please enter a valid Kenyan vehicle registration',
  },
  
  idNumber: {
    required: true,
    pattern: /^\d{7,8}$/,
    message: 'Please enter a valid ID number',
  },
  
  postalCode: {
    pattern: /^\d{5}$/,
    message: 'Please enter a valid postal code',
  },
};
