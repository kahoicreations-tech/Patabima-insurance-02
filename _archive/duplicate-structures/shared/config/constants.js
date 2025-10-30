// App Configuration
export const APP_CONFIG = {
  name: 'PataBima',
  version: '1.0.0',
  environment: 'development', // 'development' | 'staging' | 'production'
};

// API Configuration
export const API_CONFIG = {
  baseURL: 'https://api.patabima.com/v1', // Replace with actual API URL
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Authentication Configuration
export const AUTH_CONFIG = {
  tokenKey: 'patabima_auth_token',
  refreshTokenKey: 'patabima_refresh_token',
  userDataKey: 'patabima_user_data',
  tokenExpiryBuffer: 300000, // 5 minutes before actual expiry
  autoLogoutTime: 1800000, // 30 minutes of inactivity
};

// Feature Flags
export const FEATURES = {
  enableBiometrics: true,
  enablePushNotifications: true,
  enableAnalytics: true,
  enableCrashReporting: true,
  enableOfflineMode: true,
  enableDarkMode: false, // To be implemented later
};

// Business Rules
export const BUSINESS_RULES = {
  // Quotation expiry
  quotationValidityDays: 30,
  
  // Commission rates (as percentages)
  defaultCommissionRates: {
    motor: 15,
    medical: 12,
    wiba: 10,
    lastExpense: 8,
    travel: 10,
    personalAccident: 12,
    professionalIndemnity: 15,
    domesticPackage: 10,
  },
  
  // Policy renewal notifications
  renewalNotificationDays: [30, 14, 7, 1], // Days before expiry
  
  // Payment terms
  commissionPaymentCycle: 'monthly', // 'weekly' | 'monthly' | 'quarterly'
  
  // Validation rules
  minPremiumAmount: 1000, // KES
  maxPremiumAmount: 10000000, // KES 10M
  
  // Motor insurance specific
  motor: {
    minVehicleValue: 50000, // KES
    maxVehicleValue: 50000000, // KES 50M
    minVehicleAge: 0,
    maxVehicleAge: 25,
    minEngineCapacity: 800, // CC
    maxEngineCapacity: 8000, // CC
  },
};

// UI Configuration
export const UI_CONFIG = {
  // Animation durations (in milliseconds)
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  // Pagination
  itemsPerPage: 20,
  
  // Image upload
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
  
  // Search debounce
  searchDebounceMs: 500,
  
  // Notification duration
  notificationDuration: 4000,
};

// Storage Keys
export const STORAGE_KEYS = {
  // User preferences
  theme: 'app_theme',
  language: 'app_language',
  notifications: 'notification_settings',
  
  // App state
  isFirstLaunch: 'is_first_launch',
  lastSyncTime: 'last_sync_time',
  cachedData: 'cached_data',
  
  // Security
  biometricEnabled: 'biometric_enabled',
  pinEnabled: 'pin_enabled',
};

// Default Error Messages
export const ERROR_MESSAGES = {
  network: 'No internet connection. Please check your network settings.',
  server: 'Server error. Please try again later.',
  validation: 'Please check your input and try again.',
  authentication: 'Authentication failed. Please login again.',
  authorization: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  timeout: 'Request timed out. Please try again.',
  unknown: 'An unexpected error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  login: 'Successfully logged in!',
  logout: 'Successfully logged out!',
  quotationSent: 'Quotation sent successfully!',
  profileUpdated: 'Profile updated successfully!',
  passwordChanged: 'Password changed successfully!',
  dataSync: 'Data synchronized successfully!',
};

// Validation Rules
export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    required: true,
    pattern: /^(?:254|0)?([17][0-9]{8})$/,
    message: 'Please enter a valid Kenyan phone number',
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  },
  agentCode: {
    required: true,
    pattern: /^IA\d{5}$/,
    message: 'Agent code must be in format IA12345',
  },
  vehicleRegistration: {
    required: true,
    pattern: /^K[A-Z]{2,3}\s?\d{3}[A-Z]$/,
    message: 'Please enter a valid Kenyan vehicle registration number',
  },
};
