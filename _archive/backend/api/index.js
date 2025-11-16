/**
 * API Services
 * Central export point for all API services
 */

import authService from './auth';
import quotationsService from './quotations';
import policiesService from './policies';
import claimsService from './claims';
import usersService from './users';

export {
  authService,
  quotationsService,
  policiesService,
  claimsService,
  usersService,
};

// Default export object with all services
export default {
  auth: authService,
  quotations: quotationsService,
  policies: policiesService,
  claims: claimsService,
  users: usersService,
};
