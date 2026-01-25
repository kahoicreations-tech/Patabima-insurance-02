/**
 * Motor3 Validation Rules
 * Comprehensive validation for all 60+ motor products
 * Based on Kenya NTSA regulations and stakeholder requirements
 */

/**
 * Kenyan registration number patterns
 * Examples: KDA 123A, KAT 456B, KBX 789C
 */
export const KENYAN_REGISTRATION_PATTERN = /^[K][A-Z]{2,3}\s?\d{3}[A-Z]$/i;

/**
 * Validate Kenyan registration number
 */
export function validateRegistrationNumber(registration) {
  if (!registration || registration.trim() === '') {
    return { valid: false, message: 'Registration number is required' };
  }
  
  const trimmed = registration.trim().toUpperCase();
  
  if (!KENYAN_REGISTRATION_PATTERN.test(trimmed)) {
    return {
      valid: false,
      message: 'Invalid format. Use KDA 123A format (Kenya NTSA standard)',
    };
  }
  
  return { valid: true };
}

/**
 * Validate sum insured (for BRACKET pricing)
 */
export function validateSumInsured(sumInsured, min = 500000) {
  const parsed = typeof sumInsured === 'string' 
    ? parseFloat(sumInsured.replace(/,/g, '')) 
    : sumInsured;
  
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, message: 'Sum insured is required' };
  }
  
  if (parsed < min) {
    return {
      valid: false,
      message: `Minimum sum insured is KSh ${min.toLocaleString()}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate tonnage (for TONNAGE pricing)
 */
export function validateTonnage(tonnage, max = 31) {
  const parsed = typeof tonnage === 'string' 
    ? parseFloat(tonnage) 
    : tonnage;
  
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, message: 'Tonnage is required' };
  }
  
  if (parsed > max) {
    return {
      valid: false,
      message: `Maximum tonnage is ${max} tons`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate passenger capacity (for PASSENGER pricing)
 */
export function validatePassengerCapacity(capacity, min = 1) {
  const parsed = typeof capacity === 'string' 
    ? parseInt(capacity, 10) 
    : capacity;
  
  if (isNaN(parsed) || parsed < min) {
    return {
      valid: false,
      message: `Minimum passenger capacity is ${min}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate windscreen value (max 30,000)
 */
export function validateWindscreenValue(value) {
  const parsed = typeof value === 'string' 
    ? parseFloat(value.replace(/,/g, '')) 
    : value;
  
  if (isNaN(parsed) || parsed < 0) {
    return { valid: false, message: 'Windscreen value must be a positive number' };
  }
  
  if (parsed > 30000) {
    return {
      valid: false,
      message: 'Maximum windscreen value is KSh 30,000',
    };
  }
  
  return { valid: true };
}

/**
 * Validate radio/cassette value (min 30,000 for coverage)
 */
export function validateRadioCassetteValue(value) {
  const parsed = typeof value === 'string' 
    ? parseFloat(value.replace(/,/g, '')) 
    : value;
  
  if (isNaN(parsed) || parsed < 0) {
    return { valid: false, message: 'Radio cassette value must be a positive number' };
  }
  
  if (parsed > 0 && parsed < 30000) {
    return {
      valid: false,
      message: 'Minimum radio cassette value for coverage is KSh 30,000',
    };
  }
  
  return { valid: true };
}

/**
 * Validate cover start date
 */
export function validateCoverStartDate(dateString) {
  if (!dateString) {
    return { valid: false, message: 'Cover start date is required' };
  }
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date format' };
  }
  
  if (date < today) {
    return {
      valid: false,
      message: 'Cover start date cannot be in the past',
    };
  }
  
  // Max 90 days in future
  const maxFutureDate = new Date();
  maxFutureDate.setDate(maxFutureDate.getDate() + 90);
  
  if (date > maxFutureDate) {
    return {
      valid: false,
      message: 'Cover start date cannot be more than 90 days in future',
    };
  }
  
  return { valid: true };
}

/**
 * Validate vehicle year
 */
export function validateVehicleYear(year) {
  const parsed = typeof year === 'string' ? parseInt(year, 10) : year;
  const currentYear = new Date().getFullYear();
  
  if (isNaN(parsed)) {
    return { valid: false, message: 'Year is required' };
  }
  
  if (parsed < 1900 || parsed > currentYear + 1) {
    return {
      valid: false,
      message: `Year must be between 1900 and ${currentYear + 1}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate ID number (Kenya format: 8 digits)
 */
export function validateKenyanIDNumber(idNumber) {
  if (!idNumber || idNumber.trim() === '') {
    return { valid: false, message: 'ID number is required' };
  }
  
  const cleaned = idNumber.replace(/\s/g, '');
  
  if (!/^\d{8}$/.test(cleaned)) {
    return {
      valid: false,
      message: 'Kenya ID number must be 8 digits',
    };
  }
  
  return { valid: true };
}

/**
 * Validate phone number (Kenya format: 07XX XXX XXX or +2547XX XXX XXX)
 */
export function validateKenyanPhoneNumber(phone) {
  if (!phone || phone.trim() === '') {
    return { valid: false, message: 'Phone number is required' };
  }
  
  const cleaned = phone.replace(/\s/g, '');
  
  // Kenya mobile: 07XX XXX XXX or +2547XX XXX XXX
  const kenyaPattern = /^(\+254|0)(7\d{8}|1\d{8})$/;
  
  if (!kenyaPattern.test(cleaned)) {
    return {
      valid: false,
      message: 'Invalid Kenya phone number. Use 07XX XXX XXX or +2547XX XXX XXX',
    };
  }
  
  return { valid: true };
}

/**
 * Validate email
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { valid: false, message: 'Email is required' };
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(email)) {
    return {
      valid: false,
      message: 'Invalid email format',
    };
  }
  
  return { valid: true };
}

/**
 * Validate all fields for a product based on its configuration
 * @param {object} formData - Form data to validate
 * @param {object} fieldConfig - Product field configuration from productFieldConfig.js
 * @returns {object} { valid: boolean, errors: {field: message} }
 */
export function validateFormData(formData, fieldConfig) {
  const errors = {};
  
  // Validate required fields
  fieldConfig.requiredFields.forEach(field => {
    if (!formData[field] || formData[field].trim() === '') {
      errors[field] = `${field.replace('_', ' ')} is required`;
    }
  });
  
  // Validate specific fields
  if (formData.registrationNumber) {
    const result = validateRegistrationNumber(formData.registrationNumber);
    if (!result.valid) errors.registrationNumber = result.message;
  }
  
  if (formData.sum_insured) {
    const result = validateSumInsured(formData.sum_insured);
    if (!result.valid) errors.sum_insured = result.message;
  }
  
  if (formData.tonnage) {
    const result = validateTonnage(formData.tonnage);
    if (!result.valid) errors.tonnage = result.message;
  }
  
  if (formData.capacity) {
    const result = validatePassengerCapacity(formData.capacity);
    if (!result.valid) errors.capacity = result.message;
  }
  
  if (formData.windscreen_value) {
    const result = validateWindscreenValue(formData.windscreen_value);
    if (!result.valid) errors.windscreen_value = result.message;
  }
  
  if (formData.radio_cassette_value) {
    const result = validateRadioCassetteValue(formData.radio_cassette_value);
    if (!result.valid) errors.radio_cassette_value = result.message;
  }
  
  if (formData.cover_start_date) {
    const result = validateCoverStartDate(formData.cover_start_date);
    if (!result.valid) errors.cover_start_date = result.message;
  }
  
  if (formData.year) {
    const result = validateVehicleYear(formData.year);
    if (!result.valid) errors.year = result.message;
  }
  
  if (formData.id_number) {
    const result = validateKenyanIDNumber(formData.id_number);
    if (!result.valid) errors.id_number = result.message;
  }
  
  if (formData.phone) {
    const result = validateKenyanPhoneNumber(formData.phone);
    if (!result.valid) errors.phone = result.message;
  }
  
  if (formData.email) {
    const result = validateEmail(formData.email);
    if (!result.valid) errors.email = result.message;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if rare model (higher premium, cash-in-lieu only)
 */
export function isRareModel(make) {
  const rareModels = [
    'JAGUAR',
    'CHEVROLET',
    'FORD',
    'CHERRY',
    'BENTLEY',
    'AUDI',
    'TESLA',
    'PORSCHE',
  ];
  
  return rareModels.includes(make?.toUpperCase());
}

/**
 * Format currency value
 */
export function formatCurrency(value) {
  const num = typeof value === 'string' 
    ? parseFloat(value.replace(/,/g, '')) 
    : value;
  
  if (isNaN(num)) return '';
  
  return num.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString) {
  if (typeof currencyString === 'number') return currencyString;
  return parseFloat(currencyString.replace(/,/g, '')) || 0;
}
