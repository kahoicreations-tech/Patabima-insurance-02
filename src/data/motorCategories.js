/**
 * Motor Insurance Categories Data
 * 
 * Dedicated data file for motor vehicle insurance categories and related information
 * This serves as a centralized source for all motor insurance specific data
 * 
 * @version 1.0.0
 * @author PataBima Development Team
 * @date July 21, 2025
 */

import { Colors } from '../constants';
import { VEHICLE_CATEGORIES, MOTOR_PRODUCT_TYPES } from './motorUnderwriters';

/**
 * Vehicle Categories with Enhanced Details
 * This expands on the basic vehicle categories with additional UI-specific information
 */
export const ENHANCED_VEHICLE_CATEGORIES = [
  { 
    id: VEHICLE_CATEGORIES.PRIVATE, 
    name: 'Private Vehicle',
    shortName: 'Private', 
    icon: '🚗',
    animation: require('../../assets/animations/motor-insurance.json'),
    description: 'Insurance for personal vehicles not used for commercial purposes',
    features: [
      'Saloon cars & Station wagons',
      'SUVs & Personal pickup trucks',
      'Comprehensive & Third Party options'
    ],
    color: Colors.primary,
    commissionRate: 0.15, // 15%
    path: 'MotorProductSelection',
    params: { vehicleCategory: 'private' }
  },
  { 
    id: VEHICLE_CATEGORIES.COMMERCIAL, 
    name: 'Commercial Vehicle',
    shortName: 'Commercial', 
    icon: '🚚',
    animation: require('../../assets/animations/motor-insurance.json'),
    description: 'Insurance for business use vehicles and public service vehicles',
    features: [
      'Trucks & Lorries',
      'PSVs, Matatus & Buses',
      'Business fleets & Special vehicles'
    ],
    color: Colors.info,
    commissionRate: 0.18, // 18%
    path: 'MotorProductSelection',
    params: { vehicleCategory: 'commercial' }
  },
  { 
    id: VEHICLE_CATEGORIES.MOTORCYCLE, 
    name: 'Motorcycle',
    shortName: 'Motorcycle', 
    icon: '🏍️',
    animation: require('../../assets/animations/motor-insurance.json'),
    description: 'Insurance for two-wheeled vehicles including bodabodas',
    features: [
      'Personal motorcycles',
      'Commercial bodabodas',
      'Third Party & Comprehensive'
    ],
    color: Colors.warning,
    commissionRate: 0.12, // 12%
    path: 'MotorProductSelection',
    params: { vehicleCategory: 'motorcycle' }
  },
  { 
    id: VEHICLE_CATEGORIES.PSV_MATATU, 
    name: 'PSV Matatu',
    shortName: 'PSV', 
    icon: '🚌',
    animation: require('../../assets/animations/motor-insurance.json'),
    description: 'Insurance for public service vehicles and matatus',
    features: [
      'Matatus & Public Buses',
      'Taxi Services',
      'Passenger liability coverage'
    ],
    color: Colors.secondary,
    commissionRate: 0.20, // 20%
    path: 'MotorProductSelection',
    params: { vehicleCategory: 'psv_matatu' }
  },
  { 
    id: VEHICLE_CATEGORIES.TUKTUK, 
    name: 'TukTuk',
    shortName: 'TukTuk', 
    icon: '🛺',
    animation: require('../../assets/animations/motor-insurance.json'),
    description: 'Insurance for three-wheeled auto-rickshaws (tuktuks)',
    features: [
      'Commercial tuktuks',
      'Passenger tuktuks',
      'Custom coverage options'
    ],
    color: Colors.success,
    commissionRate: 0.14, // 14%
    path: 'MotorProductSelection',
    params: { vehicleCategory: 'tuktuk' }
  },
  { 
    id: VEHICLE_CATEGORIES.SPECIAL, 
    name: 'Special Classes',
    shortName: 'Special', 
    icon: '🚛',
    animation: require('../../assets/animations/motor-insurance.json'),
    description: 'Insurance for special and heavy-duty vehicles',
    features: [
      'Construction equipment',
      'Farm machinery',
      'Specialized cargo vehicles'
    ],
    color: Colors.purple,
    commissionRate: 0.22, // 22%
    path: 'MotorProductSelection',
    params: { vehicleCategory: 'special' }
  }
];

/**
 * Motor Insurance Product Types with Enhanced Details
 */
export const ENHANCED_MOTOR_PRODUCTS = [
  {
    id: MOTOR_PRODUCT_TYPES.COMPREHENSIVE,
    name: 'Comprehensive Insurance',
    shortName: 'Comprehensive',
    description: 'Full coverage for your vehicle including accidents, theft, fire, and third-party liability',
    icon: '🛡️',
    color: Colors.primary,
    features: [
      'Accident damage coverage',
      'Theft and fire protection',
      'Third party liability',
      'Optional add-ons available'
    ],
    isPopular: true,
    baseRate: 4.0 // 4% of vehicle value
  },
  {
    id: MOTOR_PRODUCT_TYPES.THIRD_PARTY,
    name: 'Third Party Insurance',
    shortName: 'Third Party',
    description: 'Basic mandatory coverage for third-party liability only',
    icon: '🚸',
    color: Colors.secondary,
    features: [
      'Third party bodily injury',
      'Third party property damage',
      'Legal minimum requirement',
      'Most affordable option'
    ],
    isPopular: true,
    baseRate: 3.0 // Fixed rate
  },
  {
    id: MOTOR_PRODUCT_TYPES.COMMERCIAL,
    name: 'Commercial Insurance',
    shortName: 'Commercial',
    description: 'Specialized coverage for business vehicles with enhanced liability protection',
    icon: '🚚',
    color: Colors.info,
    features: [
      'Enhanced liability coverage',
      'Business interruption options',
      'Fleet discounts available',
      'Goods in transit coverage'
    ],
    isPopular: false,
    baseRate: 5.5 // 5.5% of vehicle value
  }
];

/**
 * Get vehicle categories for UI display
 * 
 * @returns {Array} Vehicle categories with UI display info
 */
export const getVehicleCategories = () => {
  return ENHANCED_VEHICLE_CATEGORIES;
};

/**
 * Get motor product types for UI display
 * 
 * @returns {Array} Motor product types with UI display info
 */
export const getMotorProducts = () => {
  return ENHANCED_MOTOR_PRODUCTS;
};

/**
 * Get vehicle category by ID
 * 
 * @param {string} categoryId Vehicle category ID
 * @returns {Object} Vehicle category object or null if not found
 */
export const getVehicleCategoryById = (categoryId) => {
  return ENHANCED_VEHICLE_CATEGORIES.find(category => category.id === categoryId) || null;
};

/**
 * Get motor product by ID
 * 
 * @param {string} productId Motor product ID
 * @returns {Object} Motor product object or null if not found
 */
export const getMotorProductById = (productId) => {
  return ENHANCED_MOTOR_PRODUCTS.find(product => product.id === productId) || null;
};

export default {
  ENHANCED_VEHICLE_CATEGORIES,
  ENHANCED_MOTOR_PRODUCTS,
  getVehicleCategories,
  getMotorProducts,
  getVehicleCategoryById,
  getMotorProductById
};
