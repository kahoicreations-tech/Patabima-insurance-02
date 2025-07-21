/**
 * Motor Insurance Product Data - Brief Coverage Types
 * Based on actual insurance coverage options shown in user interface
 * Includes: TOR, Third Party, Third Party Extendible, Comprehensive
 */

export const MOTOR_PRODUCTS = [
  {
    id: 'tor',
    name: 'TOR FOR Private',
    shortName: 'TOR',
    icon: '🔴',
    description: 'Total Own Risk - lowest premium with excess deductible',
    baseRate: 1.5,
    isPopular: false,
    features: [
      'Legal minimum coverage',
      'Own damage with excess',
      'Third party liability'
    ],
    supportedVehicles: ['private'],
    briefDescription: 'Lowest cost with deductible'
  },
  {
    id: 'private_third_party',
    name: 'Private Third-party',
    shortName: 'Third Party',
    icon: '🚗',
    description: 'Basic third party liability for private vehicles',
    baseRate: 2.5,
    isPopular: false,
    features: [
      'Third party liability',
      'Legal compliance',
      'Property damage cover'
    ],
    supportedVehicles: ['private'],
    briefDescription: 'Basic legal requirement'
  },
  {
    id: 'private_third_party_extendible',
    name: 'Private Third-party Extendible',
    shortName: 'TP Extendible',
    icon: '🚙',
    description: 'Third party with upgrade options',
    baseRate: 3.0,
    isPopular: false,
    features: [
      'Third party liability',
      'Extendible coverage',
      'Upgrade to comprehensive'
    ],
    supportedVehicles: ['private'],
    briefDescription: 'Third party with options'
  },
  {
    id: 'motorcycle_third_party',
    name: 'Private Motorcycle Third-party',
    shortName: 'Motorcycle TP',
    icon: '🏍️',
    description: 'Third party coverage for motorcycles',
    baseRate: 2.0,
    isPopular: false,
    features: [
      'Motorcycle third party',
      'Legal compliance',
      'Bodaboda coverage'
    ],
    supportedVehicles: ['motorcycle'],
    briefDescription: 'Motorcycle basic cover'
  },
  {
    id: 'private_comprehensive',
    name: 'Private Comprehensive',
    shortName: 'Comprehensive',
    icon: '🛡️',
    description: 'Complete protection package',
    baseRate: 4.5,
    isPopular: true,
    features: [
      'Own damage coverage',
      'Third party liability',
      'Theft & fire protection',
      'Windscreen coverage'
    ],
    supportedVehicles: ['private'],
    briefDescription: 'Complete protection'
  },
  // Commercial vehicle options
  {
    id: 'commercial_third_party',
    name: 'Commercial Third-party',
    shortName: 'Commercial TP',
    icon: '🚚',
    description: 'Third party for commercial vehicles',
    baseRate: 3.5,
    isPopular: false,
    features: [
      'Commercial third party',
      'Business use coverage',
      'Higher liability limits'
    ],
    supportedVehicles: ['commercial'],
    briefDescription: 'Commercial basic cover'
  },
  {
    id: 'commercial_comprehensive',
    name: 'Commercial Comprehensive',
    shortName: 'Commercial Comp',
    icon: '🚛',
    description: 'Full commercial vehicle protection',
    baseRate: 5.5,
    isPopular: true,
    features: [
      'Commercial own damage',
      'Business interruption',
      'Goods in transit',
      'Third party liability'
    ],
    supportedVehicles: ['commercial'],
    briefDescription: 'Full commercial protection'
  },
  // PSV/Matatu options
  {
    id: 'psv_third_party',
    name: 'PSV Third-party',
    shortName: 'PSV TP',
    icon: '🚌',
    description: 'Third party for PSV/Matatu',
    baseRate: 4.0,
    isPopular: true,
    features: [
      'PSV third party',
      'Passenger liability',
      'Public service coverage'
    ],
    supportedVehicles: ['psv_matatu'],
    briefDescription: 'PSV passenger protection'
  },
  // TukTuk options
  {
    id: 'tuktuk_third_party',
    name: 'TukTuk Third-party',
    shortName: 'TukTuk TP',
    icon: '🛺',
    description: 'Third party for TukTuk',
    baseRate: 2.5,
    isPopular: true,
    features: [
      'TukTuk third party',
      'Passenger coverage',
      'Commercial use'
    ],
    supportedVehicles: ['tuktuk'],
    briefDescription: 'TukTuk basic cover'
  }
];

/**
 * Get motor products filtered by vehicle category
 */
export const getMotorInsuranceProducts = (vehicleCategory = null) => {
  if (!vehicleCategory) {
    return MOTOR_PRODUCTS;
  }
  
  return MOTOR_PRODUCTS.filter(product => 
    product.supportedVehicles.includes(vehicleCategory)
  );
};

/**
 * Get specific motor product by ID
 */
export const getMotorInsuranceProductById = (productId) => {
  return MOTOR_PRODUCTS.find(product => product.id === productId);
};

/**
 * Calculate base premium for motor product
 */
export const calculateBasePremium = (productId, vehicleValue) => {
  const product = getMotorInsuranceProductById(productId);
  if (!product || !vehicleValue) return 0;
  
  return (vehicleValue * product.baseRate) / 100;
};

/**
 * Get premium calculation factors
 */
export const getPremiumFactors = () => {
  return {
    ageFactors: {
      '18-25': 1.3,  // Higher risk, higher premium
      '26-35': 1.1,
      '36-50': 1.0,  // Base rate
      '51-65': 1.05,
      '65+': 1.2
    },
    experienceFactors: {
      '0-2': 1.2,    // New drivers
      '3-5': 1.1,
      '6-10': 1.0,   // Base rate
      '10+': 0.95    // Experienced drivers discount
    },
    vehicleAgeFactors: {
      '0-3': 1.0,    // New vehicles
      '4-7': 1.1,
      '8-12': 1.2,
      '13+': 1.3     // Older vehicles higher risk
    },
    locationFactors: {
      'nairobi': 1.2,
      'mombasa': 1.15,
      'kisumu': 1.1,
      'nakuru': 1.05,
      'eldoret': 1.05,
      'other': 1.0
    },
    usageFactors: {
      'private': 1.0,
      'commercial': 1.4,
      'taxi': 1.6,
      'delivery': 1.5
    }
  };
};

/**
 * Get vehicle categories that support each product type
 */
export const getProductVehicleCompatibility = () => {
  return {
    tor: ['private'],
    private_third_party: ['private'],
    private_third_party_extendible: ['private'],
    motorcycle_third_party: ['motorcycle'],
    private_comprehensive: ['private'],
    commercial_third_party: ['commercial'],
    commercial_comprehensive: ['commercial'],
    psv_third_party: ['psv_matatu'],
    tuktuk_third_party: ['tuktuk']
  };
};

/**
 * Get recommended product for vehicle category
 */
export const getRecommendedProduct = (vehicleCategory, vehicleValue) => {
  // For private vehicles, recommend comprehensive if high value
  if (vehicleCategory === 'private' && vehicleValue > 800000) {
    return 'private_comprehensive';
  }
  
  // For commercial vehicles, check value
  if (vehicleCategory === 'commercial' && vehicleValue > 1500000) {
    return 'commercial_comprehensive';
  }
  
  // For PSV/Matatu and TukTuk, only third party available
  if (vehicleCategory === 'psv_matatu') {
    return 'psv_third_party';
  }
  
  if (vehicleCategory === 'tuktuk') {
    return 'tuktuk_third_party';
  }
  
  if (vehicleCategory === 'motorcycle') {
    return 'motorcycle_third_party';
  }
  
  // Default recommendations by category
  const recommendations = {
    private: 'private_third_party_extendible',
    commercial: 'commercial_third_party',
    motorcycle: 'motorcycle_third_party',
    psv_matatu: 'psv_third_party',
    tuktuk: 'tuktuk_third_party'
  };
  
  return recommendations[vehicleCategory] || 'private_third_party';
};

export default {
  MOTOR_PRODUCTS,
  getMotorInsuranceProducts,
  getMotorInsuranceProductById,
  calculateBasePremium,
  getPremiumFactors,
  getProductVehicleCompatibility,
  getRecommendedProduct
};
