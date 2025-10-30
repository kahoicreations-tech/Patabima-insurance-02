/**
 * Utility Services
 * Central export point for all utility services
 */

import apiClient from './apiClient';
import storageService from './storage';
import validationService from './validation';

export {
  apiClient,
  storageService,
  validationService,
};

// Default export object with all utilities
export default {
  apiClient,
  storage: storageService,
  validation: validationService,
};
