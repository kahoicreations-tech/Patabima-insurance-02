/**
 * Motor2 Form Validation Utilities
 * 
 * Contains all validation functions used across Motor Insurance forms.
 * Preserves existing business logic from DynamicVehicleForm.
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
  
  if (value.length < 8) {
    return 'Chassis number must be at least 8 characters';
  }
  
  return null;
};

/**
 * Validate year of manufacture
 */
export const validateYear = (value) => {
  if (!value || value.toString().trim() === '') {
    return 'Year of manufacture is required';
  }
  
  const yearNum = Number(value);
  
  if (isNaN(yearNum)) {
    return 'Year must be a valid number';
  }
  
  const currentYear = new Date().getFullYear();
  const minYear = 1900;
  
  if (yearNum < minYear || yearNum > currentYear + 1) {
    return `Year must be between ${minYear} and ${currentYear + 1}`;
  }
  
  return null;
};

/**
 * Validate sum insured (vehicle value) for Comprehensive insurance
 */
export const validateSumInsured = (value) => {
  if (!value || value.toString().trim() === '') {
    return 'Vehicle value is required';
  }
  
  // Remove formatting (spaces, commas) for validation
  const numValue = Number(value.toString().replace(/[^0-9]/g, ''));
  
  if (isNaN(numValue) || numValue <= 0) {
    return 'Enter a valid positive amount';
  }
  
  if (numValue < 50000) {
    return 'Minimum vehicle value is KSh 50,000';
  }
  
  if (numValue > 50000000) {
    return 'Maximum vehicle value is KSh 50,000,000';
  }
  
  return null;
};

/**
 * Validate tonnage for commercial vehicles
 */
export const validateTonnage = (value) => {
  if (!value || value.toString().trim() === '') {
    return 'Tonnage is required';
  }
  
  const numValue = Number(value);
  
  if (isNaN(numValue) || numValue <= 0) {
    return 'Enter a valid tonnage';
  }
  
  if (numValue > 100) {
    return 'Maximum tonnage is 100 tons';
  }
  
  return null;
};

/**
 * Validate passenger capacity for PSV vehicles
 */
export const validatePassengerCapacity = (value) => {
  if (!value || value.toString().trim() === '') {
    return 'Passenger capacity is required';
  }
  
  const numValue = Number(value);
  
  if (isNaN(numValue) || numValue <= 0) {
    return 'Enter a valid passenger capacity';
  }
  
  if (numValue > 100) {
    return 'Maximum capacity is 100 passengers';
  }
  
  return null;
};

/**
 * Validate engine capacity for motorcycles
 */
export const validateEngineCapacity = (value) => {
  if (!value || value.toString().trim() === '') {
    return 'Engine capacity is required';
  }
  
  const numValue = Number(value);
  
  if (isNaN(numValue) || numValue <= 0) {
    return 'Enter a valid engine capacity';
  }
  
  if (numValue > 5000) {
    return 'Maximum engine capacity is 5000cc';
  }
  
  return null;
};

/**
 * Validate cover start date
 */
export const validateCoverStartDate = (value, minDate = null) => {
  if (!value || value.trim() === '') {
    return 'Cover start date is required';
  }
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'Date must be in YYYY-MM-DD format';
  }
  
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Check minimum date if provided (DMVIC constraint)
  if (minDate) {
    const minDateObj = new Date(minDate);
    if (date < minDateObj) {
      return `Cover start date must be on or after ${minDateObj.toLocaleDateString()}`;
    }
  }
  
  // Don't allow dates too far in the past
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  if (date < oneYearAgo) {
    return 'Cover start date cannot be more than 1 year in the past';
  }
  
  return null;
};

/**
 * Validate email address
 */
export const validateEmail = (value) => {
  if (!value || value.trim() === '') {
    return 'Email address is required';
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(value)) {
    return 'Enter a valid email address';
  }
  
  return null;
};

/**
 * Validate phone number (Kenyan format)
 */
export const validatePhoneNumber = (value) => {
  if (!value || value.trim() === '') {
    return 'Phone number is required';
  }
  
  // Remove spaces and special characters
  const cleaned = value.replace(/[\s\-\(\)]/g, '');
  
  // Kenyan phone number patterns
  // 0712345678, +254712345678, 254712345678
  const kenyanPattern = /^(\+?254|0)?[17]\d{8}$/;
  
  if (!kenyanPattern.test(cleaned)) {
    return 'Enter a valid Kenyan phone number (e.g., 0712345678)';
  }
  
  return null;
};

/**
 * Validate Kenyan ID number
 */
export const validateIDNumber = (value) => {
  if (!value || value.trim() === '') {
    return 'ID number is required';
  }
  
  const cleaned = value.replace(/\s/g, '');
  
  // Kenyan ID: 7-8 digits
  if (!/^\d{7,8}$/.test(cleaned)) {
    return 'ID number must be 7-8 digits';
  }
  
  return null;
};

/**
 * Validate required field (generic)
 */
export const validateRequired = (fieldName) => (value) => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Format number with thousand separators for display
 */
export const formatCurrency = (value) => {
  if (!value) return '';
  const numValue = value.toString().replace(/[^0-9]/g, '');
  return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Parse formatted currency to number
 */
export const parseCurrency = (value) => {
  if (!value) return 0;
  return Number(value.toString().replace(/[^0-9]/g, ''));
};
