/**
 * Enhanced Form Validation for Motor3
 * Improvements over basic validation:
 * - Detailed error messages with examples
 * - Field-specific validation rules
 * - Real-time validation helpers
 * - Kenyan-specific validators (phone, ID, KRA PIN, plates)
 * - Sum insured bracket validation
 */

// =====================================================================
// KENYAN REGISTRATION NUMBER VALIDATION
// =====================================================================

/**
 * Validates Kenyan vehicle registration number
 * Formats: KXX 123X, KXX123X (e.g., KAA 123A, KDA456B)
 */
export const validateKenyanRegistration = (value) => {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: 'Registration number is required' };
  }

  const cleaned = value.trim().toUpperCase();

  // Check for invalid characters first
  if (!/^[A-Z0-9\s]+$/.test(cleaned)) {
    return {
      valid: false,
      message: 'Invalid characters. Use only letters and numbers',
    };
  }

  // Kenyan format: K + 2 letters + optional space + 3 digits + 1 letter
  const kenyanPattern = /^K[A-Z]{2}\s?\d{3}[A-Z]$/;

  if (!kenyanPattern.test(cleaned)) {
    return {
      valid: false,
      message: 'Invalid format. Expected: KXX 123X (e.g., KDA 123A)',
    };
  }

  return { valid: true, value: cleaned };
};

// =====================================================================
// CHASSIS NUMBER VALIDATION
// =====================================================================

export const validateChassisNumber = (value) => {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: 'Chassis number is required' };
  }

  const cleaned = value.trim().toUpperCase();

  // Chassis numbers: 17 characters, alphanumeric, no spaces
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return {
      valid: false,
      message: 'Chassis number should contain only letters and numbers',
    };
  }

  if (cleaned.length < 8) {
    return {
      valid: false,
      message: 'Chassis number too short (minimum 8 characters)',
    };
  }

  if (cleaned.length > 20) {
    return {
      valid: false,
      message: 'Chassis number too long (maximum 20 characters)',
    };
  }

  return { valid: true, value: cleaned };
};

// =====================================================================
// LOGBOOK NUMBER VALIDATION
// =====================================================================

export const validateLogbookNumber = (value) => {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: 'Logbook number is required' };
  }

  const cleaned = value.trim().toUpperCase();

  // Logbook format varies, but typically alphanumeric
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return {
      valid: false,
      message: 'Logbook number should contain only letters and numbers',
    };
  }

  if (cleaned.length < 5) {
    return {
      valid: false,
      message: 'Logbook number too short',
    };
  }

  return { valid: true, value: cleaned };
};

// =====================================================================
// DATE VALIDATION
// =====================================================================

export const validateCoverStartDate = (value) => {
  if (!value) {
    return { valid: false, message: 'Cover start date is required' };
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date format' };
  }

  // Cannot be more than 1 year in the past
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (date < oneYearAgo) {
    return {
      valid: false,
      message: 'Cover date cannot be more than 1 year in the past',
    };
  }

  // Cannot be more than 90 days in the future
  const maxFuture = new Date();
  maxFuture.setDate(maxFuture.getDate() + 90);

  if (date > maxFuture) {
    return {
      valid: false,
      message: 'Cover date cannot be more than 90 days in the future',
    };
  }

  return { valid: true, value: date.toISOString().split('T')[0] };
};

// =====================================================================
// SUM INSURED VALIDATION (COMPREHENSIVE)
// =====================================================================

export const validateSumInsured = (value, minValue = 50000, maxValue = 50000000) => {
  if (!value && value !== 0) {
    return { valid: false, message: 'Sum insured is required' };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, message: 'Sum insured must be a valid number' };
  }

  if (num <= 0) {
    return { valid: false, message: 'Sum insured must be greater than zero' };
  }

  if (num < minValue) {
    return {
      valid: false,
      message: `Minimum sum insured is KSh ${minValue.toLocaleString()}`,
    };
  }

  if (num > maxValue) {
    return {
      valid: false,
      message: `Maximum sum insured is KSh ${maxValue.toLocaleString()}`,
    };
  }

  return { valid: true, value: num };
};

// =====================================================================
// TONNAGE VALIDATION (COMMERCIAL)
// =====================================================================

export const validateTonnage = (value, maxTonnage = 31) => {
  if (!value && value !== 0) {
    return { valid: false, message: 'Tonnage is required for commercial vehicles' };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, message: 'Tonnage must be a valid number' };
  }

  if (num <= 0) {
    return { valid: false, message: 'Tonnage must be greater than zero' };
  }

  if (num > maxTonnage) {
    return {
      valid: false,
      message: `Maximum tonnage is ${maxTonnage} tons. For higher tonnage, contact support`,
    };
  }

  return { valid: true, value: num };
};

// =====================================================================
// PASSENGER CAPACITY VALIDATION (PSV)
// =====================================================================

export const validatePassengerCapacity = (value, minCapacity = 1, maxCapacity = 100) => {
  if (!value && value !== 0) {
    return { valid: false, message: 'Passenger capacity is required' };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, message: 'Capacity must be a valid number' };
  }

  if (num < minCapacity) {
    return {
      valid: false,
      message: `Minimum capacity is ${minCapacity} passenger${minCapacity > 1 ? 's' : ''}`,
    };
  }

  if (num > maxCapacity) {
    return {
      valid: false,
      message: `Maximum capacity is ${maxCapacity} passengers`,
    };
  }

  return { valid: true, value: num };
};

// =====================================================================
// KENYAN PHONE NUMBER VALIDATION
// =====================================================================

export const validateKenyanPhone = (value) => {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: 'Phone number is required' };
  }

  const cleaned = value.replace(/[\s\-()]/g, ''); // Remove formatting

  // Kenyan formats: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX
  const patterns = [
    /^07\d{8}$/, // 07XXXXXXXX
    /^01\d{8}$/, // 01XXXXXXXX (landline)
    /^\+2547\d{8}$/, // +2547XXXXXXXX
    /^2547\d{8}$/, // 2547XXXXXXXX
  ];

  const isValid = patterns.some((pattern) => pattern.test(cleaned));

  if (!isValid) {
    return {
      valid: false,
      message: 'Invalid Kenyan phone. Expected: 07XXXXXXXX or 01XXXXXXXX',
    };
  }

  // Normalize to 07XXXXXXXX format
  let normalized = cleaned;
  if (cleaned.startsWith('+254')) {
    normalized = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('254')) {
    normalized = '0' + cleaned.substring(3);
  }

  return { valid: true, value: normalized };
};

// =====================================================================
// EMAIL VALIDATION
// =====================================================================

export const validateEmail = (value) => {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: 'Email is required' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(value)) {
    return {
      valid: false,
      message: 'Invalid email format (e.g., example@domain.com)',
    };
  }

  return { valid: true, value: value.toLowerCase().trim() };
};

// =====================================================================
// KENYAN ID NUMBER VALIDATION
// =====================================================================

export const validateKenyanID = (value) => {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: 'ID number is required' };
  }

  const cleaned = value.replace(/\s/g, '');

  // Kenyan ID: 7-8 digits
  if (!/^\d{7,8}$/.test(cleaned)) {
    return {
      valid: false,
      message: 'Invalid ID number. Expected: 7-8 digits',
    };
  }

  return { valid: true, value: cleaned };
};

// =====================================================================
// KRA PIN VALIDATION
// =====================================================================

export const validateKRAPin = (value) => {
  if (!value || typeof value !== 'string') {
    return { valid: false, message: 'KRA PIN is required' };
  }

  const cleaned = value.replace(/\s/g, '').toUpperCase();

  // KRA PIN format: A000000000X (1 letter + 9 digits + 1 letter)
  if (!/^[A-Z]\d{9}[A-Z]$/.test(cleaned)) {
    return {
      valid: false,
      message: 'Invalid KRA PIN. Expected: A123456789Z',
    };
  }

  return { valid: true, value: cleaned };
};

// =====================================================================
// VEHICLE YEAR VALIDATION
// =====================================================================

export const validateVehicleYear = (value) => {
  if (!value) {
    return { valid: false, message: 'Year of manufacture is required' };
  }

  const year = Number(value);
  const currentYear = new Date().getFullYear();

  if (isNaN(year)) {
    return { valid: false, message: 'Year must be a valid number' };
  }

  if (year < 1900) {
    return { valid: false, message: 'Year too old (minimum 1900)' };
  }

  if (year > currentYear + 1) {
    return {
      valid: false,
      message: `Year cannot be in the future (max ${currentYear + 1})`,
    };
  }

  return { valid: true, value: year };
};

// =====================================================================
// GENERIC REQUIRED FIELD VALIDATION
// =====================================================================

export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, message: `${fieldName} cannot be empty` };
  }

  return { valid: true, value };
};

// =====================================================================
// BATCH VALIDATION HELPER
// =====================================================================

/**
 * Validates multiple fields at once
 * Returns: { isValid: boolean, errors: { fieldName: errorMessage } }
 */
export const validateFields = (fields) => {
  const errors = {};
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, { value, validator, ...options }]) => {
    const result = validator(value, options);

    if (!result.valid) {
      errors[fieldName] = result.message;
      isValid = false;
    }
  });

  return { isValid, errors };
};
