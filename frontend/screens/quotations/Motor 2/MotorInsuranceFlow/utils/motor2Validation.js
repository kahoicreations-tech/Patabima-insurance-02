/**
 * Motor2 Validation Utilities
 * Centralized validation for Motor2 flow to ensure DMVIC compliance
 * and prevent submission errors
 */

/**
 * Validate Kenyan vehicle registration number
 * Format: KXX 000X or KXX-000X or similar variations
 */
export function validateRegistrationNumber(registration) {
  if (!registration || typeof registration !== 'string') {
    return { valid: false, error: 'Registration number is required' };
  }

  const cleaned = registration.toUpperCase().replace(/[\s\-]/g, '');
  
  // Kenyan format: K + 2-3 letters + 3-4 digits + 1 letter
  // Examples: KCA123A, KDA456B, KDAB789C
  const kenyaRegex = /^K[A-Z]{2,3}\d{3,4}[A-Z]$/;
  
  if (!kenyaRegex.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Invalid registration format. Use format: KDA 123A' 
    };
  }

  return { valid: true, cleaned };
}

/**
 * Validate cover dates to prevent DMVIC double-insurance
 * Ensures no overlapping coverage periods
 */
export function validateCoverDates(startDate, endDate) {
  const errors = [];
  
  if (!startDate) {
    errors.push('Cover start date is required');
  }
  
  if (!endDate) {
    errors.push('Cover end date is required');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start date cannot be in the past (more than 7 days ago)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  if (start < sevenDaysAgo) {
    errors.push('Cover start date cannot be more than 7 days in the past');
  }

  // Start date cannot be more than 90 days in the future
  const ninetyDaysFromNow = new Date(today);
  ninetyDaysFromNow.setDate(today.getDate() + 90);
  
  if (start > ninetyDaysFromNow) {
    errors.push('Cover start date cannot be more than 90 days in the future');
  }

  // End date must be after start date
  if (end <= start) {
    errors.push('Cover end date must be after start date');
  }

  // Standard motor insurance period is 12 months
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const coverPeriod = end.getTime() - start.getTime();
  
  if (coverPeriod > oneYear + (7 * 24 * 60 * 60 * 1000)) { // Allow 7 days grace
    errors.push('Cover period cannot exceed 1 year');
  }

  if (coverPeriod < 30 * 24 * 60 * 60 * 1000) { // Minimum 30 days
    errors.push('Cover period must be at least 30 days');
  }

  return {
    valid: errors.length === 0,
    errors,
    coverPeriodDays: Math.round(coverPeriod / (24 * 60 * 60 * 1000))
  };
}

/**
 * Validate Kenyan phone number
 * Formats: 0712345678, +254712345678, 254712345678
 */
export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Kenyan phone: starts with 07 or 01 (10 digits) or +254/254 (12-13 digits)
  const kenyaPhoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
  
  if (!kenyaPhoneRegex.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Invalid Kenyan phone number. Use format: 0712345678' 
    };
  }

  // Normalize to international format
  let normalized = cleaned;
  if (normalized.startsWith('0')) {
    normalized = '+254' + normalized.substring(1);
  } else if (normalized.startsWith('254')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+')) {
    normalized = '+254' + normalized;
  }

  return { valid: true, cleaned: normalized };
}

/**
 * Validate email address
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { 
      valid: false, 
      error: 'Invalid email format' 
    };
  }

  return { valid: true, cleaned: email.toLowerCase().trim() };
}

/**
 * Validate Kenyan KRA PIN
 * Format: A000000000X (1 letter + 9 digits + 1 letter)
 */
export function validateKRAPin(pin) {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'KRA PIN is required' };
  }

  const cleaned = pin.toUpperCase().replace(/[\s\-]/g, '');
  const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/;
  
  if (!kraPinRegex.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Invalid KRA PIN format. Use format: A000000000X' 
    };
  }

  return { valid: true, cleaned };
}

/**
 * Validate Kenyan National ID
 * Format: 8 digits
 */
export function validateNationalID(idNumber) {
  if (!idNumber || typeof idNumber !== 'string') {
    return { valid: false, error: 'National ID is required' };
  }

  const cleaned = idNumber.replace(/[\s\-]/g, '');
  const idRegex = /^\d{7,8}$/;
  
  if (!idRegex.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Invalid ID number. Must be 7-8 digits' 
    };
  }

  return { valid: true, cleaned };
}

/**
 * Validate chassis number
 * Format: 17 characters (VIN standard)
 */
export function validateChassisNumber(chassis) {
  if (!chassis || typeof chassis !== 'string') {
    return { valid: false, error: 'Chassis number is required' };
  }

  const cleaned = chassis.toUpperCase().replace(/[\s\-]/g, '');
  
  // VIN standard: 17 alphanumeric characters (exclude I, O, Q)
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  
  if (!vinRegex.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Invalid chassis number. Must be 17 characters (VIN standard)' 
    };
  }

  return { valid: true, cleaned };
}

/**
 * Validate vehicle details for Motor2 submission
 */
export function validateVehicleDetails(vehicleDetails) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!vehicleDetails.registration) {
    errors.push('Vehicle registration is required');
  } else {
    const regValidation = validateRegistrationNumber(vehicleDetails.registration);
    if (!regValidation.valid) {
      errors.push(regValidation.error);
    }
  }

  if (!vehicleDetails.cover_start_date && !vehicleDetails.coverStartDate) {
    errors.push('Cover start date is required');
  }

  if (!vehicleDetails.identificationType && !vehicleDetails.identification_type) {
    errors.push('Identification type is required');
  }

  // Validate cover dates if both provided
  const startDate = vehicleDetails.cover_start_date || vehicleDetails.coverStartDate;
  const endDate = vehicleDetails.cover_end_date || vehicleDetails.coverEndDate;
  
  if (startDate && endDate) {
    const dateValidation = validateCoverDates(startDate, endDate);
    if (!dateValidation.valid) {
      errors.push(...dateValidation.errors);
    } else if (dateValidation.coverPeriodDays < 365) {
      warnings.push(`Cover period is ${dateValidation.coverPeriodDays} days (less than 1 year)`);
    }
  }

  // Chassis number validation (if provided)
  if (vehicleDetails.chassis_number || vehicleDetails.chassisNumber) {
    const chassis = vehicleDetails.chassis_number || vehicleDetails.chassisNumber;
    const chassisValidation = validateChassisNumber(chassis);
    if (!chassisValidation.valid) {
      warnings.push(chassisValidation.error); // Warning, not error
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate client details for Motor2 submission
 */
export function validateClientDetails(clientDetails) {
  const errors = [];

  // Full name
  if (!clientDetails.fullName && !clientDetails.full_name && !clientDetails.name) {
    errors.push('Client full name is required');
  }

  // Phone number
  const phone = clientDetails.phone || clientDetails.phoneNumber || clientDetails.msisdn;
  if (!phone) {
    errors.push('Client phone number is required');
  } else {
    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.valid) {
      errors.push(phoneValidation.error);
    }
  }

  // Email
  const email = clientDetails.email || clientDetails.email_address;
  if (!email) {
    errors.push('Client email is required');
  } else {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      errors.push(emailValidation.error);
    }
  }

  // National ID
  const idNumber = clientDetails.id_number || clientDetails.idNumber || clientDetails.national_id;
  if (!idNumber) {
    errors.push('National ID number is required');
  } else {
    const idValidation = validateNationalID(idNumber);
    if (!idValidation.valid) {
      errors.push(idValidation.error);
    }
  }

  // KRA PIN (optional but validate if provided)
  const kraPin = clientDetails.kra_pin || clientDetails.kraPin;
  if (kraPin) {
    const kraPinValidation = validateKRAPin(kraPin);
    if (!kraPinValidation.valid) {
      errors.push(kraPinValidation.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate underwriter selection
 */
export function validateUnderwriterSelection(selectedUnderwriter) {
  const errors = [];

  if (!selectedUnderwriter) {
    errors.push('Please select an underwriter');
    return { valid: false, errors };
  }

  if (!selectedUnderwriter.name && !selectedUnderwriter.underwriter_name) {
    errors.push('Underwriter name is missing');
  }

  if (!selectedUnderwriter.code && !selectedUnderwriter.underwriter_code) {
    errors.push('Underwriter code is missing');
  }

  const premium = selectedUnderwriter.total_premium || selectedUnderwriter.totalPremium;
  if (!premium || premium <= 0) {
    errors.push('Premium not calculated - please wait for pricing to load');
  }

  return {
    valid: errors.length === 0,
    errors,
    premium
  };
}

/**
 * Validate complete Motor2 submission data
 */
export function validateMotor2Submission(submissionData) {
  const errors = [];
  const warnings = [];

  // Validate vehicle details
  if (!submissionData.vehicleDetails && !submissionData.vehicle_details) {
    errors.push('Vehicle details are missing');
  } else {
    const vehicleValidation = validateVehicleDetails(
      submissionData.vehicleDetails || submissionData.vehicle_details
    );
    if (!vehicleValidation.valid) {
      errors.push(...vehicleValidation.errors);
    }
    warnings.push(...vehicleValidation.warnings);
  }

  // Validate client details
  if (!submissionData.clientDetails && !submissionData.client_details) {
    errors.push('Client details are missing');
  } else {
    const clientValidation = validateClientDetails(
      submissionData.clientDetails || submissionData.client_details
    );
    if (!clientValidation.valid) {
      errors.push(...clientValidation.errors);
    }
  }

  // Validate underwriter selection
  const underwriterToValidate = submissionData.selectedUnderwriter || 
                                 submissionData.underwriter || 
                                 submissionData.underwriterDetails;
  
  if (!underwriterToValidate) {
    errors.push('Underwriter selection is missing');
  } else {
    const underwriterValidation = validateUnderwriterSelection(underwriterToValidate);
    if (!underwriterValidation.valid) {
      errors.push(...underwriterValidation.errors);
    }
  }

  // Validate product details
  if (!submissionData.productDetails && !submissionData.product_details) {
    errors.push('Product details are missing');
  }

  // Validate category and subcategory
  if (!submissionData.category && !submissionData.productDetails?.category) {
    errors.push('Product category is missing');
  }

  if (!submissionData.subcategory && !submissionData.productDetails?.subcategory) {
    errors.push('Product subcategory is missing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canSubmit: errors.length === 0
  };
}
