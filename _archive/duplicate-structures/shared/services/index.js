// ==========================================
// PATABIMA SERVICES - ORGANIZED EXPORTS
// ==========================================

// Backend Services - API integration and utilities
export * from './core';
export { default as apiServices } from './core';

// Utility Services - Common utilities and helpers
export * from '../utils';
export { default as utilityServices } from '../utils';

// Configuration Services - App and AWS configuration
export { default as awsConfig } from '../config/awsConfig';

// AWS Services - Amazon Web Services integration
export { default as AWSAuthService } from './AWSAuthService';
export { default as AWSDataService } from './AWSDataService';

// Pricing Services - Insurance pricing and quotes
export * from './pricing';

// External Services - Third-party integrations
export * from './external';

// ==========================================
// BACKEND SERVICES - INDIVIDUAL EXPORTS
// ==========================================

// Re-export commonly used services for convenience
export { authAPI as authService } from './core';
export { quotationsAPI as quotationsService } from './core';
export { policiesAPI as policiesService } from './core';
export { claimsAPI as claimsService } from './core';
export { userAPI as usersService } from './core';

export { default as QuoteStorageService } from './QuoteStorageService';

// ==========================================
// INDIVIDUAL EXPORTS FOR BACKWARD COMPATIBILITY
// ==========================================

// Pricing Services
export { 
  PricingService, 
  AdminPricingService, 
  DynamicPricingService
} from './pricing';

// Core Services
export { 
  apiService, 
  authAPI, 
  userAPI, 
  quotationsAPI, 
  policiesAPI, 
  claimsAPI, 
  categoriesAPI, 
  campaignsAPI,
  NotificationService 
} from './core';

// External Services
export { PaymentService, PDFService } from './external';
