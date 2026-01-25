/**
 * DMVIC Error Handler Utility
 * 
 * Provides user-friendly error messages for DMVIC integration errors
 */

// DMVIC Error Code Mapping
export const DMVIC_ERROR_CODES = {
  // Certificate Authorization Errors
  ER001: {
    code: 'ER001',
    title: 'Certificate Type Not Authorized',
    message: 'Your account is not authorized to issue this type of certificate. Only PSV (Public Service Vehicle) certificates are currently authorized.',
    userMessage: 'This certificate type is not available. Please contact support for authorization.',
    action: 'CONTACT_SUPPORT'
  },
  
  // Inventory Errors
  ER006: {
    code: 'ER006',
    title: 'No Certificate Inventory',
    message: 'No sticker inventory has been allocated to your account. Certificate preview can still be generated.',
    userMessage: 'Certificate stickers need to be allocated. You can preview the certificate, but issuance requires inventory.',
    action: 'PREVIEW_ONLY'
  },
  
  // Vehicle Errors
  ER010: {
    code: 'ER010',
    title: 'Vehicle Not Found',
    message: 'The vehicle registration number was not found in the DMVIC database.',
    userMessage: 'Vehicle not found. Please verify the registration number.',
    action: 'RETRY'
  },
  
  ER011: {
    code: 'ER011',
    title: 'Invalid Vehicle Registration',
    message: 'The vehicle registration format is invalid.',
    userMessage: 'Invalid registration number format. Please check and try again.',
    action: 'RETRY'
  },
  
  // Double Insurance Errors
  ER020: {
    code: 'ER020',
    title: 'Active Policy Exists',
    message: 'This vehicle already has an active insurance policy.',
    userMessage: 'This vehicle is already insured. Cannot issue duplicate certificate.',
    action: 'BLOCKED'
  },
  
  // Authentication Errors
  ER100: {
    code: 'ER100',
    title: 'Authentication Failed',
    message: 'DMVIC authentication failed. Please check credentials.',
    userMessage: 'Connection to certificate system failed. Please try again.',
    action: 'RETRY'
  },
  
  // Generic/Unknown Errors
  UNKNOWN: {
    code: 'UNKNOWN',
    title: 'Certificate Error',
    message: 'An unexpected error occurred with the certificate system.',
    userMessage: 'Something went wrong. Please try again or contact support.',
    action: 'RETRY'
  }
};

/**
 * Parse DMVIC error response
 * @param {Object} errorResponse - Error response from DMVIC API
 * @returns {Object} Parsed error details
 */
export const parseDmvicError = (errorResponse) => {
  // Handle different error response formats
  let errors = [];
  
  if (errorResponse?.errors && Array.isArray(errorResponse.errors)) {
    errors = errorResponse.errors;
  } else if (errorResponse?.callbackObj?.Result?.ErrorList) {
    errors = errorResponse.callbackObj.Result.ErrorList;
  } else if (errorResponse?.error) {
    errors = [{ ErrorCode: 'UNKNOWN', ErrorMessage: errorResponse.error }];
  } else if (errorResponse?.message) {
    errors = [{ ErrorCode: 'UNKNOWN', ErrorMessage: errorResponse.message }];
  }
  
  // Get the first error code (usually the most important)
  const primaryError = errors[0] || {};
  const errorCode = primaryError.ErrorCode || primaryError.errorCode || 'UNKNOWN';
  const errorMessage = primaryError.ErrorMessage || primaryError.errorMessage || 'Unknown error';
  
  // Get error details from mapping
  const errorDetails = DMVIC_ERROR_CODES[errorCode] || DMVIC_ERROR_CODES.UNKNOWN;
  
  return {
    code: errorCode,
    title: errorDetails.title,
    message: errorDetails.message,
    userMessage: errorDetails.userMessage,
    action: errorDetails.action,
    originalMessage: errorMessage,
    allErrors: errors
  };
};

/**
 * Get user-friendly error message for toast/alert
 * @param {Object} error - Error object from API
 * @returns {string} User-friendly error message
 */
export const getDmvicErrorMessage = (error) => {
  const parsed = parseDmvicError(error);
  
  // Return different messages based on action type
  switch (parsed.action) {
    case 'CONTACT_SUPPORT':
      return `${parsed.userMessage}\n\nError: ${parsed.code}`;
    
    case 'PREVIEW_ONLY':
      return `${parsed.userMessage}\n\nYou can still preview the certificate.`;
    
    case 'BLOCKED':
      return parsed.userMessage;
    
    case 'RETRY':
      return `${parsed.userMessage}\n\nPlease try again.`;
    
    default:
      return parsed.userMessage;
  }
};

/**
 * Check if error is recoverable (user can retry)
 * @param {Object} error - Error object
 * @returns {boolean} True if user should be able to retry
 */
export const isDmvicErrorRecoverable = (error) => {
  const parsed = parseDmvicError(error);
  return ['RETRY', 'PREVIEW_ONLY'].includes(parsed.action);
};

/**
 * Check if error allows preview generation
 * @param {Object} error - Error object
 * @returns {boolean} True if preview can still be generated
 */
export const canGeneratePreviewDespiteError = (error) => {
  const parsed = parseDmvicError(error);
  // ER006 (no inventory) should still allow preview
  return parsed.code === 'ER006';
};

/**
 * Get error icon/color based on severity
 * @param {Object} error - Error object
 * @returns {Object} Icon name and color
 */
export const getDmvicErrorStyle = (error) => {
  const parsed = parseDmvicError(error);
  
  switch (parsed.action) {
    case 'CONTACT_SUPPORT':
      return { icon: 'alert-circle', color: '#FF6B35' }; // Orange
    
    case 'PREVIEW_ONLY':
      return { icon: 'information-circle', color: '#FFA500' }; // Amber
    
    case 'BLOCKED':
      return { icon: 'close-circle', color: '#E63946' }; // Red
    
    case 'RETRY':
      return { icon: 'refresh-circle', color: '#457B9D' }; // Blue
    
    default:
      return { icon: 'alert-circle', color: '#6C757D' }; // Gray
  }
};

/**
 * Format error for logging/debugging
 * @param {Object} error - Error object
 * @returns {string} Formatted error for console
 */
export const formatDmvicErrorForLogging = (error) => {
  const parsed = parseDmvicError(error);
  
  return `
DMVIC Error Details:
- Code: ${parsed.code}
- Title: ${parsed.title}
- Action: ${parsed.action}
- User Message: ${parsed.userMessage}
- Original: ${parsed.originalMessage}
${parsed.allErrors.length > 1 ? `- Additional Errors: ${parsed.allErrors.slice(1).map(e => e.ErrorCode).join(', ')}` : ''}
  `.trim();
};

export default {
  DMVIC_ERROR_CODES,
  parseDmvicError,
  getDmvicErrorMessage,
  isDmvicErrorRecoverable,
  canGeneratePreviewDespiteError,
  getDmvicErrorStyle,
  formatDmvicErrorForLogging
};
