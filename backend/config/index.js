/**
 * Configuration Services
 * Central export point for all configuration files
 */

import apiConfig, { API_ENDPOINTS, HTTP_METHODS, REQUEST_HEADERS } from './apiConfig';
import awsConfig, { AWS_AMPLIFY_CONFIG, LAMBDA_FUNCTIONS, DYNAMODB_TABLES } from './awsConfig';

export {
  apiConfig,
  awsConfig,
  API_ENDPOINTS,
  HTTP_METHODS,
  REQUEST_HEADERS,
  AWS_AMPLIFY_CONFIG,
  LAMBDA_FUNCTIONS,
  DYNAMODB_TABLES,
};

// Default export object with all configurations
export default {
  api: apiConfig,
  aws: awsConfig,
  endpoints: API_ENDPOINTS,
  httpMethods: HTTP_METHODS,
  headers: REQUEST_HEADERS,
  amplify: AWS_AMPLIFY_CONFIG,
  lambda: LAMBDA_FUNCTIONS,
  tables: DYNAMODB_TABLES,
};
