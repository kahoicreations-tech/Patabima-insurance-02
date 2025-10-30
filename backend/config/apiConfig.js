import Constants from 'expo-constants';

const ENV = {
  development: {
    API_BASE_URL: 'https://dev-api.patabima.com/v1',
    WS_URL: 'wss://dev-ws.patabima.com',
    TIMEOUT: 10000,
  },
  staging: {
    API_BASE_URL: 'https://staging-api.patabima.com/v1',
    WS_URL: 'wss://staging-ws.patabima.com',
    TIMEOUT: 15000,
  },
  production: {
    API_BASE_URL: 'https://api.patabima.com/v1',
    WS_URL: 'wss://ws.patabima.com',
    TIMEOUT: 20000,
  },
};

const getEnvVars = () => {
  const releaseChannel = Constants.expoConfig?.releaseChannel;
  
  if (releaseChannel === 'staging') return ENV.staging;
  if (releaseChannel === 'production') return ENV.production;
  return ENV.development;
};

export const { API_BASE_URL, WS_URL, TIMEOUT } = getEnvVars();

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Quotations
  QUOTATIONS: {
    LIST: '/quotations',
    CREATE: '/quotations',
    GET: (id) => `/quotations/${id}`,
    UPDATE: (id) => `/quotations/${id}`,
    DELETE: (id) => `/quotations/${id}`,
    MOTOR: '/quotations/motor',
    MEDICAL: '/quotations/medical',
    WIBA: '/quotations/wiba',
    TRAVEL: '/quotations/travel',
    LAST_EXPENSE: '/quotations/last-expense',
    PROFESSIONAL_INDEMNITY: '/quotations/professional-indemnity',
    PERSONAL_ACCIDENT: '/quotations/personal-accident',
    DOMESTIC_PACKAGE: '/quotations/domestic-package',
  },
  
  // Policies
  POLICIES: {
    LIST: '/policies',
    GET: (id) => `/policies/${id}`,
    CREATE: '/policies',
    UPDATE: (id) => `/policies/${id}`,
    RENEW: (id) => `/policies/${id}/renew`,
    EXTEND: (id) => `/policies/${id}/extend`,
    UPCOMING: '/policies/upcoming',
    ACTIVE: '/policies/active',
    EXPIRED: '/policies/expired',
  },
  
  // Claims
  CLAIMS: {
    LIST: '/claims',
    CREATE: '/claims',
    GET: (id) => `/claims/${id}`,
    UPDATE: (id) => `/claims/${id}`,
    SUBMIT: '/claims/submit',
    UPLOAD_DOCUMENT: (id) => `/claims/${id}/documents`,
    GET_DOCUMENTS: (id) => `/claims/${id}/documents`,
    TRACK: (id) => `/claims/${id}/track`,
  },
  
  // Users/Agents
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    DASHBOARD: '/users/dashboard',
    STATS: '/users/stats',
    COMMISSION: '/users/commission',
    SALES: '/users/sales',
    ACTIVITY: '/users/activity',
  },
  
  // File Uploads
  FILES: {
    UPLOAD: '/files/upload',
    GET: (id) => `/files/${id}`,
    DELETE: (id) => `/files/${id}`,
  },
  
  // OCR Service
  OCR: {
    EXTRACT: '/ocr/extract',
    VALIDATE: '/ocr/validate',
  },
  
  // Pricing
  PRICING: {
    CALCULATE: '/pricing/calculate',
    GET_RATES: '/pricing/rates',
    COMPARE: '/pricing/compare',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings',
  },
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Platform': 'mobile',
  'X-App-Version': Constants.expoConfig?.version || '1.0.0',
};
