/**
 * Frontend Utilities
 * UI-specific helper functions and utilities
 */

/**
 * Format currency for display
 */
export const formatCurrency = (amount, currency = 'KES') => {
  if (!amount || isNaN(amount)) return 'KES 0';
  
  const formatter = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(Number(amount));
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format Kenya phone numbers
  if (cleaned.startsWith('254')) {
    cleaned = '+254 ' + cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
    cleaned = '+254 ' + cleaned;
  }
  
  // Add spacing for readability
  if (cleaned.startsWith('+254 ')) {
    const number = cleaned.substring(5);
    if (number.length >= 9) {
      return `+254 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
  }
  
  return cleaned;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Generate random ID for temporary usage
 */
export const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce function for search inputs
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Get initials from full name
 */
export const getInitials = (fullName) => {
  if (!fullName) return '';
  
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format date for display
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    short: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    long: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    },
    time: { 
      hour: '2-digit', 
      minute: '2-digit' 
    },
    datetime: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    }
  };
  
  return new Intl.DateTimeFormat('en-KE', options[format] || options.short).format(dateObj);
};

/**
 * Calculate days between dates
 */
export const daysBetween = (date1, date2 = new Date()) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = typeof date1 === 'string' ? new Date(date1) : date1;
  const secondDate = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

/**
 * Check if date is due soon (within specified days)
 */
export const isDueSoon = (date, days = 30) => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const diffDays = (targetDate - today) / (1000 * 60 * 60 * 24);
  
  return diffDays >= 0 && diffDays <= days;
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file is image
 */
export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageExtensions.includes(getFileExtension(filename));
};

/**
 * Convert bytes to human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate color based on text (for avatars)
 */
export const getColorFromText = (text) => {
  if (!text) return '#999999';
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Sleep utility for delays
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validate required fields
 */
export const validateRequiredFields = (data, requiredFields) => {
  const errors = {};
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors[field] = `${field} is required`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
