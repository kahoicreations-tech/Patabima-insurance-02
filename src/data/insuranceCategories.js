/**
 * Centralized Insurance Categories Data
 * 
 * This file contains all insurance category definitions for the PataBima app.
 * It provides a single source of truth for category information across the application.
 * 
 * @version 1.0.0
 * @author PataBima Development Team
 * @date July 19, 2025
 */

import { Colors } from '../constants';

/**
 * Insurance Category Status Types
 */
export const CATEGORY_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  COMING_SOON: 'coming_soon',
  DISABLED: 'disabled'
};

/**
 * Insurance Category Types
 */
export const CATEGORY_TYPES = {
  MOTOR: 'motor',
  HEALTH: 'health',
  LIFE: 'life',
  GENERAL: 'general',
  COMMERCIAL: 'commercial'
};

/**
 * Main Insurance Categories Configuration
 * 
 * Each category contains:
 * - id: Unique identifier
 * - name: Display name
 * - shortName: Abbreviated name for compact displays
 * - description: Category description
 * - icon: Emoji icon (fallback)
 * - image: Image asset (preferred)
 * - color: Brand color
 * - type: Category type classification
 * - status: Current availability status
 * - screen: Navigation target screen
 * - isPopular: Whether to highlight as popular
 * - commissionRate: Default commission rate
 * - minimumPremium: Minimum premium amount
 * - features: Key features array
 * - tags: Search/filter tags
 */
export const INSURANCE_CATEGORIES = [
  {
    id: 'motor-vehicle',
    name: 'Motor Vehicle',
    shortName: 'Motor',
    description: 'Comprehensive vehicle insurance coverage for cars, motorcycles, and commercial vehicles',
    icon: '🚗',
    image: require('../../assets/images/motor.png'),
    color: Colors.primary,
    type: CATEGORY_TYPES.MOTOR,
    status: CATEGORY_STATUS.ACTIVE,
    screen: 'MotorDashboard', // Updated to use the new centralized Motor Dashboard
    isPopular: true,
    commissionRate: 0.15, // 15%
    minimumPremium: 15000,
    features: [
      'Third Party Coverage',
      'Comprehensive Coverage',
      'Theft Protection',
      '24/7 Emergency Support'
    ],
    tags: ['vehicle', 'car', 'motorcycle', 'transport', 'accident']
  },
  {
    id: 'medical',
    name: 'Medical',
    shortName: 'Health',
    description: 'Health insurance coverage for individuals and families',
    icon: '🏥',
    image: require('../../assets/images/health.png'),
    color: Colors.success,
    type: CATEGORY_TYPES.HEALTH,
    status: CATEGORY_STATUS.ACTIVE,
    screen: 'EnhancedMedicalCategory',
    isPopular: true,
    commissionRate: 0.12, // 12%
    minimumPremium: 25000,
    features: [
      'Inpatient Coverage',
      'Outpatient Services',
      'Maternity Benefits',
      'Dental Coverage'
    ],
    tags: ['health', 'medical', 'hospital', 'doctor', 'treatment']
  },
  {
    id: 'wiba',
    name: 'Work Injury Benefits Act (WIBA)',
    shortName: 'WIBA',
    description: 'Mandatory workplace injury insurance for employees',
    icon: '👷',
    image: require('../../assets/images/wiba.png'),
    color: Colors.warning,
    type: CATEGORY_TYPES.COMMERCIAL,
    status: CATEGORY_STATUS.ACTIVE,
    screen: 'WIBAQuotation',
    isPopular: false,
    commissionRate: 0.10, // 10%
    minimumPremium: 5000,
    features: [
      'Workplace Injury Coverage',
      'Disability Benefits',
      'Medical Expenses',
      'Death Benefits'
    ],
    tags: ['work', 'injury', 'employee', 'workplace', 'compensation']
  },
  {
    id: 'last-expense',
    name: 'Last Expense',
    shortName: 'Funeral',
    description: 'Funeral and burial expense insurance coverage',
    icon: '⚰️',
    image: require('../../assets/images/funeral.png'),
    color: Colors.secondary,
    type: CATEGORY_TYPES.LIFE,
    status: CATEGORY_STATUS.ACTIVE,
    screen: 'LastExpenseQuotation',
    isPopular: false,
    commissionRate: 0.08, // 8%
    minimumPremium: 10000,
    features: [
      'Funeral Expenses',
      'Burial Costs',
      'Memorial Services',
      'Family Support'
    ],
    tags: ['funeral', 'burial', 'death', 'family', 'memorial']
  },
  {
    id: 'travel',
    name: 'Travel Insurance',
    shortName: 'Travel',
    description: 'Comprehensive travel protection for domestic and international trips',
    icon: '✈️',
    image: require('../../assets/images/travel.png'),
    color: Colors.info,
    type: CATEGORY_TYPES.GENERAL,
    status: CATEGORY_STATUS.ACTIVE,
    screen: 'TravelQuotation',
    isPopular: true,
    commissionRate: 0.20, // 20%
    minimumPremium: 2000,
    features: [
      'Trip Cancellation',
      'Medical Emergency',
      'Lost Luggage',
      'Flight Delays'
    ],
    tags: ['travel', 'trip', 'vacation', 'international', 'emergency']
  },
  {
    id: 'personal-accident',
    name: 'Personal Accident',
    shortName: 'Accident',
    description: 'Personal accident insurance for unexpected injuries',
    icon: '🛡️',
    image: require('../../assets/images/accident.png'),
    color: Colors.primary,
    type: CATEGORY_TYPES.GENERAL,
    status: CATEGORY_STATUS.ACTIVE,
    screen: 'PersonalAccidentQuotation',
    isPopular: false,
    commissionRate: 0.18, // 18%
    minimumPremium: 8000,
    features: [
      'Accidental Death',
      'Disability Coverage',
      'Medical Expenses',
      'Income Protection'
    ],
    tags: ['accident', 'injury', 'disability', 'protection', 'emergency']
  },
  {
    id: 'professional-indemnity',
    name: 'Professional Indemnity',
    shortName: 'Professional',
    description: 'Professional liability insurance for businesses and professionals',
    icon: '💼',
    image: require('../../assets/images/professional.png'),
    color: Colors.success,
    type: CATEGORY_TYPES.COMMERCIAL,
    status: CATEGORY_STATUS.ACTIVE,
    screen: 'ProfessionalIndemnityQuotation',
    isPopular: false,
    commissionRate: 0.14, // 14%
    minimumPremium: 20000,
    features: [
      'Professional Liability',
      'Legal Defense',
      'Client Claims',
      'Business Protection'
    ],
    tags: ['professional', 'business', 'liability', 'legal', 'claims']
  },
  {
    id: 'domestic-package',
    name: 'Domestic Package',
    shortName: 'Home',
    description: 'Comprehensive home and domestic property insurance',
    icon: '🏠',
    image: require('../../assets/images/home.png'),
    color: Colors.warning,
    type: CATEGORY_TYPES.GENERAL,
    status: CATEGORY_STATUS.ACTIVE,
    screen: 'DomesticPackageQuotation',
    isPopular: false,
    commissionRate: 0.12, // 12%
    minimumPremium: 15000,
    features: [
      'Property Protection',
      'Contents Insurance',
      'Theft Coverage',
      'Natural Disasters'
    ],
    tags: ['home', 'property', 'domestic', 'theft', 'fire']
  }
];

/**
 * Utility Functions for Category Management
 */

/**
 * Get all active categories
 */
export const getActiveCategories = () => {
  return INSURANCE_CATEGORIES.filter(category => 
    category.status === CATEGORY_STATUS.ACTIVE
  );
};

/**
 * Get popular categories
 */
export const getPopularCategories = () => {
  return INSURANCE_CATEGORIES.filter(category => category.isPopular);
};

/**
 * Get categories by type
 */
export const getCategoriesByType = (type) => {
  return INSURANCE_CATEGORIES.filter(category => category.type === type);
};

/**
 * Get category by ID
 */
export const getCategoryById = (id) => {
  return INSURANCE_CATEGORIES.find(category => category.id === id);
};

/**
 * Get categories by status
 */
export const getCategoriesByStatus = (status) => {
  return INSURANCE_CATEGORIES.filter(category => category.status === status);
};

/**
 * Search categories by name or tags
 */
export const searchCategories = (query) => {
  const searchTerm = query.toLowerCase();
  return INSURANCE_CATEGORIES.filter(category => 
    category.name.toLowerCase().includes(searchTerm) ||
    category.shortName.toLowerCase().includes(searchTerm) ||
    category.description.toLowerCase().includes(searchTerm) ||
    category.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

/**
 * Get categories with navigation screens available
 */
export const getNavigableCategories = () => {
  return INSURANCE_CATEGORIES.filter(category => category.screen !== null);
};

/**
 * Get category status message
 */
export const getCategoryStatusMessage = (category) => {
  switch (category.status) {
    case CATEGORY_STATUS.ACTIVE:
      return `${category.name} insurance is available for quotation.`;
    case CATEGORY_STATUS.MAINTENANCE:
      return `${category.name} insurance is currently under maintenance. We are working to improve your experience and will be back soon!`;
    case CATEGORY_STATUS.COMING_SOON:
      return `${category.name} insurance is coming soon! Stay tuned for updates.`;
    case CATEGORY_STATUS.DISABLED:
      return `${category.name} insurance is currently unavailable.`;
    default:
      return `${category.name} insurance status is unknown.`;
  }
};

/**
 * Legacy compatibility - converts to the old format
 * @deprecated Use INSURANCE_CATEGORIES directly
 */
export const getLegacyCategories = () => {
  return INSURANCE_CATEGORIES.map((category, index) => ({
    id: index + 1, // Legacy numeric ID
    name: category.name,
    icon: category.icon,
    image: category.image,
    color: category.color,
    screen: category.screen
  }));
};

export default INSURANCE_CATEGORIES;
