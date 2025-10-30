import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFormValidation } from './useFormValidation';

/**
 * Custom hook for managing motor insurance form state and validation
 */
export const useMotorInsuranceForm = () => {
  // Initial form values
  const initialFormValues = {
    // Vehicle Information
    registrationNumber: '',
    vehicleType: '',
    make: '',
    model: '',
    yearOfManufacture: '',
    engineCapacity: '',
    vehicleValue: '',
    usageType: 'private', // Default to private usage
    
    // Owner Information
    ownerName: '',
    ownerIdNumber: '',
    ownerPhone: '',
    ownerEmail: '',
    
    // Insurance Details
    coverType: '',
    policyPeriod: '12', // months - will be set by insurer selection
    insuranceDuration: '12', // 1,3,6,12 months options
    startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    insurer: '',
    
    // Additional Information
    previousInsurer: '',
    claimsHistory: 'No',
    modifications: 'No'
  };

  // Validation rules
  const validationRules = {
    registrationNumber: {
      required: true,
      pattern: /^K[A-Z]{2,3}\s?\d{3}[A-Z]$/,
      message: 'Please enter a valid Kenyan vehicle registration'
    },
    make: {
      required: true,
      minLength: 2,
    },
    model: {
      required: true,
      minLength: 1,
    },
    yearOfManufacture: {
      required: true,
      pattern: /^\d{4}$/,
      min: 1950,
      max: new Date().getFullYear() + 1,
      message: 'Please enter a valid year'
    },
    engineCapacity: {
      required: true,
      pattern: /^\d+$/,
      message: 'Please enter a valid engine capacity in cc'
    },
    vehicleValue: {
      required: true,
      pattern: /^\d+$/,
      min: 50000,
      message: 'Please enter a valid vehicle value'
    },
    ownerName: {
      required: true,
      minLength: 3,
      pattern: /^[a-zA-Z\s]+$/,
      message: 'Please enter a valid name'
    },
    ownerIdNumber: {
      required: true,
      pattern: /^\d{7,8}$/,
      message: 'Please enter a valid ID number'
    },
    ownerPhone: {
      required: true,
      pattern: /^(0|\+254|254)7\d{8}$/,
      message: 'Please enter a valid Kenyan mobile number'
    },
    ownerEmail: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    insurer: {
      required: true
    }
  };

  // Use the form validation hook
  const {
    values: formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setValues: setFormData,
    hasErrors
  } = useFormValidation(initialFormValues, validationRules);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [coverStartDate, setCoverStartDate] = useState(new Date());

  // Handle date change
  const handleDateChange = useCallback((event, selectedDate) => {
    const currentDate = selectedDate || coverStartDate;
    setShowDatePicker(Platform.OS === 'ios');
    setCoverStartDate(currentDate);
    setFormData(prev => ({
      ...prev,
      startDate: currentDate.toISOString().split('T')[0]
    }));
  }, [coverStartDate, setFormData]);

  // Handle field change with auto premium calculation trigger
  const handleFieldChange = useCallback((field, value, onPremiumUpdate) => {
    handleChange(field, value);

    // Auto-trigger premium calculation when key fields change
    const triggerPremiumUpdate = [
      'insurer', 'vehicleValue', 'yearOfManufacture', 
      'engineCapacity', 'usageType', 'insuranceDuration'
    ].includes(field);

    if (triggerPremiumUpdate && onPremiumUpdate) {
      setTimeout(() => onPremiumUpdate({...formData, [field]: value}), 100);
    }
  }, [formData, handleChange]);

  // Validate step based on current step
  const validateStep = useCallback((step) => {
    let fieldsToValidate = {};
    let isValid = true;

    switch(step) {
      case 1: // Vehicle Category
        // No validation needed for step 1
        return true;

      case 2: // Insurance Products
        // No validation needed for step 2
        return true;

      case 3: // Vehicle Information
        fieldsToValidate = {
          registrationNumber: validationRules.registrationNumber,
          make: validationRules.make,
          model: validationRules.model,
          yearOfManufacture: validationRules.yearOfManufacture,
          engineCapacity: validationRules.engineCapacity,
          vehicleValue: validationRules.vehicleValue
        };
        break;

      case 4: // Owner Information
        fieldsToValidate = {
          ownerName: validationRules.ownerName,
          ownerIdNumber: validationRules.ownerIdNumber,
          ownerPhone: validationRules.ownerPhone,
          ownerEmail: validationRules.ownerEmail
        };
        break;

      case 5: // Payment Information
        fieldsToValidate = {
          insurer: validationRules.insurer
        };
        break;

      default:
        return true;
    }

    // Validate the specified fields for the current step
    Object.keys(fieldsToValidate).forEach(field => {
      const rule = fieldsToValidate[field];
      const error = rule ? rule.required && (!formData[field] || formData[field].trim() === '') : false;
      
      if (error) {
        Alert.alert('Required Field', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        isValid = false;
      }
    });

    return isValid;
  }, [formData]);

  return {
    formData,
    errors,
    touched,
    handleChange: handleFieldChange,
    handleBlur,
    validateForm,
    setFormData,
    hasErrors,
    validateStep,
    coverStartDate,
    setCoverStartDate,
    showDatePicker,
    setShowDatePicker,
    handleDateChange
  };
};

export default useMotorInsuranceForm;
