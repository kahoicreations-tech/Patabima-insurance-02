/**
 * Services Index - Central export for all API services
 */

// Authentication & User Management
export { default as AuthService } from './auth';
export { default as UserService } from './users';
export { default as DjangoAPIService } from './DjangoAPIService';

// Insurance Services
export { default as InsuranceServicesAPI } from './InsuranceServicesAPI';
export { default as DMVICServicesAPI } from './DMVICServicesAPI';
export { default as EnhancedTORService } from './EnhancedTORService';

// Backend API
export { default as BackendAPI } from './backendApi';

// API Configuration
export * from './apiConfig';

// Export all services as a collection
export const APIServices = {
  Auth: require('./auth').default,
  User: require('./users').default,
  Django: require('./DjangoAPIService').default,
  Insurance: require('./InsuranceServicesAPI').default,
  DMVIC: require('./DMVICServicesAPI').default,
  TOR: require('./EnhancedTORService').default,
  Backend: require('./backendApi').default,
};

export default APIServices;