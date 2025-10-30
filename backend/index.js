/**
 * Backend Services
 * Central export point for all backend services and utilities
 */

// API Services
export * from './api';
export { default as apiServices } from './api';

// Utility Services  
export * from './utils';
export { default as utilityServices } from './utils';

// Configuration Services
export * from './config';
export { default as configServices } from './config';

// AWS Services (if exists)
// export * from './aws';

// Re-export commonly used services for convenience
export { default as authService } from './api/auth';
export { default as quotationsService } from './api/quotations';
export { default as policiesService } from './api/policies';
export { default as claimsService } from './api/claims';
export { default as usersService } from './api/users';

export { default as apiClient } from './utils/apiClient';
export { default as storageService } from './utils/storage';
export { default as validationService } from './utils/validation';

export { API_ENDPOINTS } from './config/apiConfig';
export { AWS_AMPLIFY_CONFIG } from './config/awsConfig';
