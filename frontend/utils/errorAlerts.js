/**
 * Improved Error Alert Utility
 * 
 * Provides consistent error display across the app with better formatting
 */

import { Alert, Platform } from 'react-native';
import { getDmvicErrorMessage, parseDmvicError, formatDmvicErrorForLogging } from './dmvicErrorHandler';

/**
 * Show error alert with improved formatting
 * @param {string} title - Alert title
 * @param {string|Object} error - Error message or error object
 * @param {Array} buttons - Optional custom buttons
 * @param {Object} options - Additional options
 */
export const showErrorAlert = (title, error, buttons = null, options = {}) => {
  let errorMessage = '';
  
  // Parse different error formats
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.error) {
    errorMessage = error.error;
  } else if (error?.detail) {
    errorMessage = error.detail;
  } else if (error?.errors) {
    // DMVIC error format
    errorMessage = getDmvicErrorMessage(error);
    // Log detailed error for debugging
    console.error(formatDmvicErrorForLogging(error));
  } else {
    errorMessage = 'An unexpected error occurred. Please try again.';
  }
  
  // Add error code if available
  if (error?.code || error?.errorCode) {
    errorMessage += `\n\nError Code: ${error.code || error.errorCode}`;
  }
  
  // Add status code if available
  if (error?.status || error?.statusCode) {
    errorMessage += `\nStatus: ${error.status || error.statusCode}`;
  }
  
  const defaultButtons = [
    {
      text: 'OK',
      style: 'default'
    }
  ];
  
  Alert.alert(
    title,
    errorMessage,
    buttons || defaultButtons,
    { cancelable: options.cancelable !== false }
  );
};

/**
 * Show DMVIC-specific error with appropriate actions
 * @param {Object} dmvicError - DMVIC error response
 * @param {Function} onRetry - Callback for retry action
 * @param {Function} onContactSupport - Callback for contact support action
 */
export const showDmvicErrorAlert = (dmvicError, onRetry = null, onContactSupport = null) => {
  const parsed = parseDmvicError(dmvicError);
  
  let buttons = [];
  
  // Add action-specific buttons
  switch (parsed.action) {
    case 'RETRY':
      if (onRetry) {
        buttons.push({
          text: 'Retry',
          onPress: onRetry,
          style: 'default'
        });
      }
      buttons.push({
        text: 'Cancel',
        style: 'cancel'
      });
      break;
    
    case 'CONTACT_SUPPORT':
      if (onContactSupport) {
        buttons.push({
          text: 'Contact Support',
          onPress: onContactSupport,
          style: 'default'
        });
      }
      buttons.push({
        text: 'OK',
        style: 'cancel'
      });
      break;
    
    case 'PREVIEW_ONLY':
      buttons.push({
        text: 'View Preview',
        onPress: () => {
          // Preview action handled by caller
        },
        style: 'default'
      });
      buttons.push({
        text: 'OK',
        style: 'cancel'
      });
      break;
    
    default:
      buttons.push({
        text: 'OK',
        style: 'default'
      });
  }
  
  // Log for debugging
  console.error(formatDmvicErrorForLogging(dmvicError));
  
  Alert.alert(
    parsed.title,
    parsed.userMessage + (parsed.code !== 'UNKNOWN' ? `\n\nError Code: ${parsed.code}` : ''),
    buttons,
    { cancelable: false }
  );
};

/**
 * Show success alert with consistent formatting
 * @param {string} title - Alert title
 * @param {string} message - Success message
 * @param {Array} buttons - Optional custom buttons
 */
export const showSuccessAlert = (title, message, buttons = null) => {
  const defaultButtons = [
    {
      text: 'OK',
      style: 'default'
    }
  ];
  
  Alert.alert(
    title,
    message,
    buttons || defaultButtons,
    { cancelable: true }
  );
};

/**
 * Show confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 * @param {Object} options - Additional options
 */
export const showConfirmDialog = (title, message, onConfirm, onCancel = null, options = {}) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: options.cancelText || 'Cancel',
        onPress: onCancel,
        style: 'cancel'
      },
      {
        text: options.confirmText || 'Confirm',
        onPress: onConfirm,
        style: options.destructive ? 'destructive' : 'default'
      }
    ],
    { cancelable: options.cancelable !== false }
  );
};

/**
 * Format API error response for display
 * @param {Object} apiError - Error from API call
 * @returns {string} Formatted error message
 */
export const formatAPIError = (apiError) => {
  // Check for DMVIC errors first
  if (apiError?.errors || apiError?.callbackObj?.Result?.ErrorList) {
    return getDmvicErrorMessage(apiError);
  }
  
  // Handle standard API errors
  if (apiError?.payload?.error) {
    return apiError.payload.error;
  }
  
  if (apiError?.payload?.detail) {
    return apiError.payload.detail;
  }
  
  if (apiError?.payload?.message) {
    return apiError.payload.message;
  }
  
  if (apiError?.message) {
    return apiError.message;
  }
  
  // Network errors
  if (apiError?.status === 0 || !apiError?.status) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  // HTTP status errors
  switch (apiError?.status || apiError?.statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication failed. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'Conflict detected. This action cannot be completed.';
    case 500:
      return 'Server error. Please try again later or contact support.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return `An error occurred (${apiError?.status || 'Unknown'}). Please try again.`;
  }
};

export default {
  showErrorAlert,
  showDmvicErrorAlert,
  showSuccessAlert,
  showConfirmDialog,
  formatAPIError
};
