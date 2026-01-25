/**
 * Motor3 Form Validation Utilities
 * Extracted validators for Motor3 forms
 */

/**
 * Validate Kenyan vehicle registration number
 * Format: KXX 123X (e.g., KAA 123A, KBZ 456C)
 * - Starts with 'K'
 * - Followed by 2 letters (series code)
 * - Optional space
 * - 3 digits
 * - 1 letter (check letter)
 */
export const validateKenyanRegistration = (value) => {
  if (!value || value.trim() === '') {
    return 'Registration number is required';
  }
  
  const cleaned = value.trim().toUpperCase();
  
  // Check for invalid characters first
  if (!/^[A-Z0-9\s]+$/i.test(value)) {
    return 'Registration number contains invalid characters';
  }
  
  // Kenyan plate pattern
  const kenyanPlatePattern = /^K[A-Z]{2}\s?\d{3}[A-Z]$/i;
  
  if (!kenyanPlatePattern.test(cleaned)) {
    return 'Invalid Kenyan plate format. Expected: KXX 123X (e.g., KAA 123A)';
  }
  
  return null;
};

/**
 * Validate chassis number
 * Should contain only letters and numbers without spaces
 */
export const validateChassisNumber = (value) => {
  if (!value || value.trim() === '') {
    return 'Chassis number is required';
  }
  
  if (!/^[A-Z0-9]+$/i.test(value)) {
    return 'Chassis number should contain only letters and numbers without spaces';
  }
  
  if (value.length < 6) {
    return 'Chassis number should be at least 6 characters';
  }
  
  return null;
};

/**
 * Validate engine number
 * Should contain only letters and numbers without spaces
 */
export const validateEngineNumber = (value) => {
  if (!value || value.trim() === '') {
    return 'Engine number is required';
  }
  
  if (!/^[A-Z0-9]+$/i.test(value)) {
    return 'Engine number should contain only letters and numbers without spaces';
  }
  
  if (value.length < 4) {
    return 'Engine number should be at least 4 characters';
  }
  
  return null;
};

/**
 * Validate vehicle year
 * Must be between 1900 and current year + 1 (for new models)
 */
export const validateVehicleYear = (value) => {
  if (!value) {
    return 'Year is required';
  }
  
  const year = parseInt(value, 10);
  const currentYear = new Date().getFullYear();
  
  if (isNaN(year)) {
    return 'Year must be a valid number';
  }
  
  if (year < 1900 || year > currentYear + 1) {
    return `Year must be between 1900 and ${currentYear + 1}`;
  }
  
  return null;
};

/**
 * Validate sum insured amount
 * Must be positive number between min and max range
 */
export const validateSumInsured = (value, minValue = 50000, maxValue = 50000000) => {
  if (!value) {
    return 'Sum insured is required';
  }
  
  const amount = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  
  if (isNaN(amount) || amount <= 0) {
    return 'Sum insured must be a positive number';
  }
  
  if (amount < minValue) {
    return `Sum insured must be at least KSh ${minValue.toLocaleString()}`;
  }
  
  if (amount > maxValue) {
    return `Sum insured cannot exceed KSh ${maxValue.toLocaleString()}`;
  }
  
  return null;
};
