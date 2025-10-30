/**
 * Format currency amount to display format
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol (default: 'KES')
 * @param {boolean} abbreviated - Whether to abbreviate large numbers (default: false)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'KES', abbreviated = false) => {
  if (typeof amount !== 'number') return `${currency} 0`;
  
  if (abbreviated && amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(0)}K`;
  }
  
  return `${currency} ${amount.toLocaleString()}`;
};

/**
 * Format date to display format
 * @param {string|Date} date - The date to format
 * @param {string} format - Format type ('short', 'medium', 'long')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium') => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  };
  
  return dateObj.toLocaleDateString('en-GB', options[format]);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Kenyan)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone number is valid
 */
export const validatePhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check for valid Kenyan phone number patterns
  const phoneRegex = /^(?:254|0)?([17][0-9]{8})$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Format phone number to display format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
    return cleanPhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  if (cleanPhone.length === 12 && cleanPhone.startsWith('254')) {
    return `+${cleanPhone.replace(/(\d{3})(\d{1})(\d{4})(\d{4})/, '$1 $2 $3 $4')}`;
  }
  
  return phone;
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};
