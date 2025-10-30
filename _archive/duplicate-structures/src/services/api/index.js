// Main API exports for PataBima Django Backend
export { default as authAPI } from './auth';
export { default as usersAPI } from './users';

// You can add more API services here as you develop them
// export { default as quotationsAPI } from './quotations';
// export { default as policiesAPI } from './policies';
// export { default as claimsAPI } from './claims';

// Re-export config for convenience
export { API_CONFIG, getStoredTokens, storeTokens, clearTokens } from '../config/apiConfig';
