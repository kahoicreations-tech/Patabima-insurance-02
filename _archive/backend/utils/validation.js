/**
 * Validation Utilities
 * Common validation functions for form data and API requests
 */

class ValidationService {
  /**
   * Email validation
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Phone number validation (Kenya format)
   */
  isValidPhoneNumber(phone) {
    // Kenya phone number formats: +254XXXXXXXXX, 254XXXXXXXXX, 07XXXXXXXX, 01XXXXXXXX
    const phoneRegex = /^(\+254|254|0)[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  /**
   * ID number validation (Kenya)
   */
  isValidIdNumber(idNumber) {
    // Kenya ID numbers are 7-8 digits
    const idRegex = /^\d{7,8}$/;
    return idRegex.test(idNumber);
  }

  /**
   * Vehicle registration validation (Kenya)
   */
  isValidVehicleRegistration(registration) {
    // Kenya formats: KAA 123A, KBZ 456B, etc.
    const regRegex = /^K[A-Z]{2}\s?\d{3}[A-Z]$/i;
    return regRegex.test(registration.replace(/\s+/g, ' ').trim());
  }

  /**
   * Password strength validation
   */
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const validations = {
      length: password.length >= minLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      numbers: hasNumbers,
      specialChar: hasSpecialChar,
    };

    const score = Object.values(validations).filter(Boolean).length;
    
    return {
      isValid: score >= 4 && validations.length,
      score,
      validations,
      strength: this.getPasswordStrength(score),
    };
  }

  /**
   * Get password strength level
   */
  getPasswordStrength(score) {
    if (score < 2) return 'weak';
    if (score < 4) return 'medium';
    return 'strong';
  }

  /**
   * Required field validation
   */
  isRequired(value) {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  }

  /**
   * Minimum length validation
   */
  hasMinLength(value, minLength) {
    if (typeof value !== 'string') return false;
    return value.trim().length >= minLength;
  }

  /**
   * Maximum length validation
   */
  hasMaxLength(value, maxLength) {
    if (typeof value !== 'string') return false;
    return value.trim().length <= maxLength;
  }

  /**
   * Numeric validation
   */
  isNumeric(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
  }

  /**
   * Integer validation
   */
  isInteger(value) {
    return Number.isInteger(Number(value));
  }

  /**
   * Positive number validation
   */
  isPositive(value) {
    return this.isNumeric(value) && Number(value) > 0;
  }

  /**
   * Range validation
   */
  isInRange(value, min, max) {
    if (!this.isNumeric(value)) return false;
    const num = Number(value);
    return num >= min && num <= max;
  }

  /**
   * Date validation
   */
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Future date validation
   */
  isFutureDate(dateString) {
    if (!this.isValidDate(dateString)) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date > now;
  }

  /**
   * Past date validation
   */
  isPastDate(dateString) {
    if (!this.isValidDate(dateString)) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  }

  /**
   * Age validation (18+ years)
   */
  isValidAge(birthDate, minAge = 18) {
    if (!this.isValidDate(birthDate)) return false;
    
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= minAge;
    }
    
    return age >= minAge;
  }

  /**
   * URL validation
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * File type validation
   */
  isValidFileType(fileName, allowedTypes) {
    if (!fileName || !allowedTypes || !Array.isArray(allowedTypes)) {
      return false;
    }
    
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(fileExtension);
  }

  /**
   * File size validation (in MB)
   */
  isValidFileSize(fileSize, maxSizeMB) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return fileSize <= maxSizeBytes;
  }

  /**
   * Validate motor insurance data
   */
  validateMotorInsurance(data) {
    const errors = {};

    // Vehicle details
    if (!this.isRequired(data.vehicleRegistration)) {
      errors.vehicleRegistration = 'Vehicle registration is required';
    } else if (!this.isValidVehicleRegistration(data.vehicleRegistration)) {
      errors.vehicleRegistration = 'Invalid vehicle registration format';
    }

    if (!this.isRequired(data.vehicleMake)) {
      errors.vehicleMake = 'Vehicle make is required';
    }

    if (!this.isRequired(data.vehicleModel)) {
      errors.vehicleModel = 'Vehicle model is required';
    }

    if (!this.isRequired(data.yearOfManufacture)) {
      errors.yearOfManufacture = 'Year of manufacture is required';
    } else if (!this.isInRange(data.yearOfManufacture, 1990, new Date().getFullYear())) {
      errors.yearOfManufacture = 'Invalid year of manufacture';
    }

    if (!this.isRequired(data.vehicleValue)) {
      errors.vehicleValue = 'Vehicle value is required';
    } else if (!this.isPositive(data.vehicleValue)) {
      errors.vehicleValue = 'Vehicle value must be positive';
    }

    // Personal details
    if (!this.isRequired(data.fullName)) {
      errors.fullName = 'Full name is required';
    }

    if (!this.isRequired(data.email)) {
      errors.email = 'Email is required';
    } else if (!this.isValidEmail(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!this.isRequired(data.phoneNumber)) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!this.isValidPhoneNumber(data.phoneNumber)) {
      errors.phoneNumber = 'Invalid phone number format';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate medical insurance data
   */
  validateMedicalInsurance(data) {
    const errors = {};

    if (!this.isRequired(data.fullName)) {
      errors.fullName = 'Full name is required';
    }

    if (!this.isRequired(data.dateOfBirth)) {
      errors.dateOfBirth = 'Date of birth is required';
    } else if (!this.isValidAge(data.dateOfBirth)) {
      errors.dateOfBirth = 'Must be 18 years or older';
    }

    if (!this.isRequired(data.email)) {
      errors.email = 'Email is required';
    } else if (!this.isValidEmail(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!this.isRequired(data.phoneNumber)) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!this.isValidPhoneNumber(data.phoneNumber)) {
      errors.phoneNumber = 'Invalid phone number format';
    }

    if (!this.isRequired(data.coverageAmount)) {
      errors.coverageAmount = 'Coverage amount is required';
    } else if (!this.isPositive(data.coverageAmount)) {
      errors.coverageAmount = 'Coverage amount must be positive';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Sanitize input string
   */
  sanitizeString(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .substring(0, 1000); // Limit length
  }

  /**
   * Sanitize phone number
   */
  sanitizePhoneNumber(phone) {
    if (typeof phone !== 'string') return phone;
    
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Normalize Kenya phone numbers
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254') && !cleaned.startsWith('+254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Format currency value
   */
  formatCurrency(amount, currency = 'KES') {
    if (!this.isNumeric(amount)) return '0';
    
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    return formatter.format(Number(amount));
  }
}

// Create and export a singleton instance
const validationService = new ValidationService();
export default validationService;
