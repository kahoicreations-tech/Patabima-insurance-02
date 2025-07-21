/**
 * Data Layer Index
 * 
 * Centralized exports for all data-related modules
 * This provides a clean import interface for components
 */

// Insurance Categories
export {
  INSURANCE_CATEGORIES,
  CATEGORY_STATUS,
  CATEGORY_TYPES,
  getActiveCategories,
  getPopularCategories,
  getCategoriesByType,
  getCategoryById,
  getCategoriesByStatus,
  searchCategories,
  getNavigableCategories,
  getCategoryStatusMessage,
  getLegacyCategories
} from './insuranceCategories';

// Motor Vehicle Insurance Categories and Products
export {
  ENHANCED_VEHICLE_CATEGORIES,
  ENHANCED_MOTOR_PRODUCTS,
  getVehicleCategories,
  getMotorProducts,
  getVehicleCategoryById,
  getMotorProductById
} from './motorCategories';

// Motor Underwriters Data
export {
  MOTOR_UNDERWRITERS,
  MOTOR_PRODUCT_TYPES,
  VEHICLE_CATEGORIES,
  VEHICLE_AGE_CATEGORIES
} from './motorUnderwriters';

// Motor Products Data - Brief Coverage Types
export {
  MOTOR_PRODUCTS,
  getMotorInsuranceProducts,
  getMotorInsuranceProductById,
  calculateBasePremium,
  getPremiumFactors,
  getProductVehicleCompatibility,
  getRecommendedProduct
} from './motorProductsBrief';

// Category Management Examples
export { default as categoryManagementExamples } from './categoryManagementExamples';

// Mock Data
export {
  MOCK_AGENT,
  MOCK_POLICIES,
  MOCK_QUOTATIONS,
  MOCK_CLAIMS,
  MOCK_UPCOMING,
  MOCK_CAMPAIGNS
} from './mockData';
