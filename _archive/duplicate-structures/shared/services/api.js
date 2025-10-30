/**
 * API Services
 * This file re-exports API services from the core directory for backward compatibility
 */

import apiService, { quotationsAPI, policiesAPI, claimsAPI, authAPI, userAPI, categoriesAPI, campaignsAPI } from './core/api';

export {
  apiService as default,
  quotationsAPI,
  policiesAPI,
  claimsAPI,
  authAPI,
  userAPI,
  categoriesAPI,
  campaignsAPI
};
