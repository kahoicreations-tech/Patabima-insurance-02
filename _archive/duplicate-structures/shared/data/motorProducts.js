/**
 * Motor Insurance Product Data
 * Defines available motor insurance products with features and pricing
 */

/**
 * Motor Insurance Product Data
 * Defines available motor insurance products with features and pricing
 * Brief coverage options: TOR, Third Party, Third Party Extendible, Comprehensive
 */

export const MOTOR_PRODUCTS = [
  {
    id: 'tor',
    name: 'TOR (Temporary Only Roads)',
    shortName: 'TOR',
    icon: '⚡',
    description: 'Basic temporary coverage for road use only. Most affordable option.',
    baseRate: 2.0,
    isPopular: false,
    features: [
      'Temporary road coverage',
      'Basic third party liability',
      'Legal compliance',
      'Emergency only'
    ],
    limitations: [
      'Limited coverage period',
      'Basic protection only',
      'No comprehensive benefits'
    ]
  },
  {
    id: 'third_party',
    name: 'Third Party Only',
    shortName: 'Third Party',
    icon: '🚗',
    description: 'Standard legal requirement coverage. Protects against third party claims.',
    baseRate: 3.0,
    isPopular: false,
    features: [
      'Third party liability',
      'Legal compliance',
      'Property damage cover',
      'Court attendance'
    ],
    limitations: [
      'No own vehicle damage',
      'No theft protection',
      'No fire coverage'
    ]
  },
  {
    id: 'third_party_extendible',
    name: 'Third Party Extendible',
    shortName: 'TP Extendible',
    icon: '�',
    description: 'Enhanced third party with additional benefits. Better value than basic TP.',
    baseRate: 3.5,
    isPopular: true,
    features: [
      'Third party liability',
      'Extended coverage options',
      'Windscreen protection',
      'Radio/stereo cover',
      'Personal effects'
    ],
    limitations: [
      'No own vehicle damage',
      'Limited theft protection',
      'Partial comprehensive benefits'
    ]
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive Coverage',
    shortName: 'Comprehensive',
    icon: '🛡️',
    description: 'Complete protection for your vehicle. Full coverage including own damage.',
    baseRate: 4.5,
    isPopular: false,
    features: [
      'Own vehicle damage',
      'Theft protection',
      'Fire & natural disasters',
      'Third party liability',
      'Windscreen coverage',
      'Personal accident',
      'Roadside assistance'
    ],
    limitations: [
      'Higher premium cost',
      'Excess payments apply',
      'Age/usage restrictions'
    ]
  }
];

/**
 * Get motor products for selection
 */
export const getMotorInsuranceProducts = () => {
  return MOTOR_PRODUCTS;
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
    tor: ['private', 'commercial', 'motorcycle'], // TOR mainly for specific scenarios
    third_party: ['private', 'commercial', 'motorcycle', 'psv_matatu', 'tuktuk', 'special'],
    third_party_extendible: ['private', 'commercial', 'motorcycle'], // Enhanced TP for better vehicles
    comprehensive: ['private', 'commercial', 'motorcycle', 'special'] // PSV/Matatu and TukTuk typically only get TPO
  };
};

/**
 * Get recommended product for vehicle category
 */
export const getRecommendedProduct = (vehicleCategory, vehicleValue) => {
  const compatibility = getProductVehicleCompatibility();
  
  // For high-value private vehicles, recommend comprehensive
  if (vehicleCategory === 'private' && vehicleValue > 500000) {
    return 'comprehensive';
  }
  
  // For commercial vehicles, check value and recommend extendible
  if (vehicleCategory === 'commercial' && vehicleValue > 300000) {
    return 'third_party_extendible';
  }
  
  // For motorcycles, recommend extendible for higher values
  if (vehicleCategory === 'motorcycle' && vehicleValue > 200000) {
    return 'third_party_extendible';
  }
  
  // For PSV/Matatu and TukTuk, only TPO available
  if (['psv_matatu', 'tuktuk'].includes(vehicleCategory)) {
    return 'third_party';
  }
  
  // Default recommendation based on category
  if (['private', 'commercial'].includes(vehicleCategory)) {
    return 'third_party_extendible';
  }
  
  return 'third_party';
};

/**
 * Get products available for specific vehicle category
 */
export const getProductsForVehicleCategory = (vehicleCategory) => {
  const compatibility = getProductVehicleCompatibility();
  
  return MOTOR_PRODUCTS.filter(product => 
    compatibility[product.id]?.includes(vehicleCategory)
  ).map(product => ({
    ...product,
    isRecommended: product.id === getRecommendedProduct(vehicleCategory)
  }));
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
