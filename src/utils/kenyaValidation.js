// Kenya-specific validation utilities for insurance applications

/**
 * Kenya National ID validation
 * Format: 8 digits (12345678)
 */
export const validateKenyaID = (idNumber) => {
  const errors = [];
  
  if (!idNumber || !idNumber.trim()) {
    return { isValid: false, error: 'National ID is required', errors: ['National ID is required'] };
  }
  
  const cleanId = idNumber.replace(/\s/g, '');
  
  // Check if exactly 8 digits
  if (!/^\d{8}$/.test(cleanId)) {
    errors.push('National ID must be exactly 8 digits');
  }
  
  // Check for invalid patterns (all same digits, sequential, etc.)
  if (/^(\d)\1{7}$/.test(cleanId)) {
    errors.push('Invalid ID format (all same digits)');
  }
  
  if (cleanId === '12345678' || cleanId === '00000000') {
    errors.push('Invalid ID number');
  }
  
  return {
    isValid: errors.length === 0,
    error: errors[0] || '',
    errors,
    formatted: cleanId
  };
};

/**
 * Kenya phone number validation
 * Formats: +254 7XX XXX XXX, 07XX XXX XXX, +254 XX XXX XXXX (landline)
 */
export const validateKenyaPhone = (phoneNumber) => {
  const errors = [];
  
  if (!phoneNumber || !phoneNumber.trim()) {
    return { isValid: false, error: 'Phone number is required', errors: ['Phone number is required'] };
  }
  
  const cleanPhone = phoneNumber.replace(/\s|-/g, '');
  
  // Mobile patterns
  const mobilePatterns = [
    /^\+254[71][0-9]{8}$/, // +254 7XX XXX XXX or +254 1XX XXX XXX
    /^254[71][0-9]{8}$/, // 254 7XX XXX XXX
    /^07[0-9]{8}$/, // 07XX XXX XXX
    /^01[0-9]{8}$/, // 01XX XXX XXX
  ];
  
  // Landline patterns
  const landlinePatterns = [
    /^\+254[2-6][0-9]{7}$/, // +254 XX XXX XXXX
    /^254[2-6][0-9]{7}$/, // 254 XX XXX XXXX
    /^0[2-6][0-9]{7}$/, // 0XX XXX XXXX
  ];
  
  const isMobile = mobilePatterns.some(pattern => pattern.test(cleanPhone));
  const isLandline = landlinePatterns.some(pattern => pattern.test(cleanPhone));
  
  if (!isMobile && !isLandline) {
    errors.push('Invalid Kenya phone number format');
  }
  
  // Format the number
  let formatted = cleanPhone;
  if (cleanPhone.startsWith('07') || cleanPhone.startsWith('01')) {
    formatted = `+254${cleanPhone.substring(1)}`;
  } else if (cleanPhone.startsWith('254') && !cleanPhone.startsWith('+')) {
    formatted = `+${cleanPhone}`;
  }
  
  return {
    isValid: errors.length === 0,
    error: errors[0] || '',
    errors,
    formatted,
    type: isMobile ? 'mobile' : 'landline'
  };
};

/**
 * Enhanced email validation
 */
export const validateEmail = (email) => {
  const errors = [];
  
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email address is required', errors: ['Email address is required'] };
  }
  
  const cleanEmail = email.trim().toLowerCase();
  
  // Basic format validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(cleanEmail)) {
    errors.push('Invalid email format');
  }
  
  // Length validation
  if (cleanEmail.length > 254) {
    errors.push('Email address too long');
  }
  
  // Common typo detection
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = cleanEmail.split('@')[1];
  
  if (domain) {
    // Check for common typos
    const typos = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com'
    };
    
    if (typos[domain]) {
      errors.push(`Did you mean ${cleanEmail.replace(domain, typos[domain])}?`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    error: errors[0] || '',
    errors,
    formatted: cleanEmail
  };
};

/**
 * Age validation from date of birth
 */
export const validateAge = (dateOfBirth, minAge = 18, maxAge = 100) => {
  const errors = [];
  
  if (!dateOfBirth) {
    errors.push('Date of birth is required');
    return { isValid: false, errors };
  }
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  if (isNaN(birthDate.getTime())) {
    errors.push('Invalid date of birth');
    return { isValid: false, errors };
  }
  
  if (birthDate >= today) {
    errors.push('Date of birth must be in the past');
  }
  
  const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
  
  if (age < minAge) {
    errors.push(`Minimum age is ${minAge} years`);
  }
  
  if (age > maxAge) {
    errors.push(`Maximum age is ${maxAge} years`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    age
  };
};

/**
 * Validate passport number
 */
export const validatePassport = (passportNumber) => {
  const errors = [];
  
  if (!passportNumber || !passportNumber.trim()) {
    errors.push('Passport number is required');
    return { isValid: false, errors };
  }
  
  const cleanPassport = passportNumber.trim().toUpperCase();
  
  // Kenya passport format: A12345678 (1 letter + 8 digits)
  if (!/^[A-Z][0-9]{8}$/.test(cleanPassport)) {
    errors.push('Invalid passport format (should be 1 letter + 8 digits)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    formatted: cleanPassport
  };
};

/**
 * Business registration number validation
 */
export const validateBusinessRegistration = (regNumber) => {
  const errors = [];
  
  if (!regNumber || !regNumber.trim()) {
    errors.push('Business registration number is required');
    return { isValid: false, errors };
  }
  
  const cleanReg = regNumber.trim().toUpperCase();
  
  // Kenya business registration formats
  const formats = [
    /^PVT-[A-Z0-9]+\/[0-9]{4}$/, // Private company
    /^C\.[0-9]+$/, // Certificate of incorporation
    /^BN\/[0-9]+$/, // Business name
  ];
  
  const isValid = formats.some(format => format.test(cleanReg));
  
  if (!isValid) {
    errors.push('Invalid business registration format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    formatted: cleanReg
  };
};

/**
 * Professional license validation
 */
export const validateProfessionalLicense = (licenseNumber, profession) => {
  const errors = [];
  
  if (!licenseNumber || !licenseNumber.trim()) {
    errors.push('Professional license number is required');
    return { isValid: false, errors };
  }
  
  const cleanLicense = licenseNumber.trim().toUpperCase();
  
  // Different formats for different professions
  const professionFormats = {
    lawyer: /^LSK\/[0-9]+$/, // Law Society of Kenya
    doctor: /^MD\/[0-9]+$/, // Medical Doctor
    engineer: /^EBK\/[0-9]+$/, // Engineers Board of Kenya
    architect: /^BAK\/[0-9]+$/, // Board of Architects of Kenya
    accountant: /^CPA\/[0-9]+$/, // CPA Kenya
  };
  
  if (profession && professionFormats[profession.toLowerCase()]) {
    if (!professionFormats[profession.toLowerCase()].test(cleanLicense)) {
      errors.push(`Invalid ${profession} license format`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    formatted: cleanLicense
  };
};

/**
 * Travel destination validation
 */
export const validateTravelDestination = (destination) => {
  const errors = [];
  
  if (!destination || !destination.trim()) {
    errors.push('Destination is required');
    return { isValid: false, errors };
  }
  
  // High-risk destinations that might require special coverage
  const highRiskCountries = [
    'Afghanistan', 'Syria', 'Iraq', 'Yemen', 'Somalia', 'South Sudan'
  ];
  
  const warnings = [];
  if (highRiskCountries.includes(destination)) {
    warnings.push('This destination may require special coverage');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    destination: destination.trim()
  };
};

/**
 * Property value validation
 */
export const validatePropertyValue = (value, minValue = 100000, maxValue = 100000000) => {
  const errors = [];
  
  if (!value) {
    errors.push('Property value is required');
    return { isValid: false, errors };
  }
  
  const numValue = parseFloat(value.toString().replace(/,/g, ''));
  
  if (isNaN(numValue) || numValue <= 0) {
    errors.push('Property value must be a positive number');
  } else if (numValue < minValue) {
    errors.push(`Minimum property value is KES ${minValue.toLocaleString()}`);
  } else if (numValue > maxValue) {
    errors.push(`Maximum property value is KES ${maxValue.toLocaleString()}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: numValue,
    formatted: `KES ${numValue.toLocaleString()}`
  };
};
