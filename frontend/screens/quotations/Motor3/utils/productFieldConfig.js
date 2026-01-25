/**
 * Product Field Configuration for Motor3
 * Maps all 60+ motor products to their required fields, pricing models, and add-ons
 * Based on PATA BIMA APP FEEDBACK.xlsx stakeholder requirements
 */

export const PRODUCT_FIELD_CONFIG = {
  // FIXED Pricing Products (Third Party Flow)
  FIXED: {
    requiredFields: [
      'registrationNumber',
      'identificationType',
      'cover_start_date',
      'financialInterest',
    ],
    optionalFields: [],
    pricingFields: [], // No pricing inputs needed
    addons: [],
    autoLoadUnderwriters: true, // Load immediately on mount
  },
  
  // BRACKET Pricing Products (Comprehensive Flow)
  BRACKET: {
    requiredFields: [
      'registrationNumber',
      'year',
      'make',
      'model',
      'sum_insured', // Minimum 500,000
      'windscreen_value',
      'radio_cassette_value',
      'cover_start_date',
      'financialInterest',
    ],
    optionalFields: [
      'engineNumber',
      'chasisNumber',
      'color',
      'bodyType',
      'purpose',
      'logbookNumber',
    ],
    pricingFields: ['sum_insured'],
    addons: [
      { id: 'windscreen', label: 'Windscreen Cover', condition: 'value <= 30000' },
      { id: 'radio_cassette', label: 'Radio Cassette Cover', condition: 'value >= 30000' },
      { id: 'excess_protector', label: 'Excess Protector', condition: 'optional' },
      { id: 'pvt', label: 'Political Violence & Terrorism (PVT)', condition: 'optional' },
      { id: 'loss_of_use', label: 'Loss of Use', condition: 'optional' },
    ],
    autoLoadUnderwriters: false, // Load after sum_insured entered
    validationRules: {
      sum_insured: { min: 500000, message: 'Minimum sum insured is KSh 500,000' },
      initial_cover_period: { days: 30, message: 'Initial cover strictly 30 days pending valuation' },
      rare_models: {
        models: ['Jaguar', 'Chevrolet', 'Ford', 'Cherry', 'Bentley', 'Audi', 'Tesla', 'Porsche'],
        message: 'Rare model - higher premium applies, claims restricted to cash-in-lieu only',
      },
    },
  },
  
  // TONNAGE Pricing Products (Commercial Flow)
  TONNAGE: {
    requiredFields: [
      'registrationNumber',
      'tonnage', // ≤31 tons
      'cover_start_date',
      'financialInterest',
    ],
    optionalFields: [
      'is_prime_mover', // Prime mover flag
      'is_over_limit',
    ],
    pricingFields: ['tonnage', 'is_prime_mover'],
    addons: [],
    autoLoadUnderwriters: false, // Load after tonnage entered
    validationRules: {
      tonnage: { max: 31, message: 'Maximum tonnage is 31 tons' },
    },
  },
  
  // PASSENGER Pricing Products (PSV Flow)
  PASSENGER: {
    requiredFields: [
      'registrationNumber',
      'capacity', // Passenger capacity
      'cover_start_date',
      'financialInterest',
    ],
    optionalFields: [
      'passenger_type', // Student/Adult (for institutional)
      'is_commercial_institutional',
    ],
    pricingFields: ['capacity', 'is_commercial_institutional', 'passenger_type'],
    addons: [],
    autoLoadUnderwriters: false, // Load after capacity entered
    validationRules: {
      capacity: { min: 1, message: 'Minimum 1 passenger' },
    },
  },
  
  // HYBRID: TONNAGE + PASSENGER (e.g., Driving School TPO)
  TONNAGE_PASSENGER: {
    requiredFields: [
      'registrationNumber',
      'tonnage',
      'capacity',
      'cover_start_date',
      'financialInterest',
    ],
    optionalFields: [],
    pricingFields: ['tonnage', 'capacity'],
    addons: [],
    autoLoadUnderwriters: false,
    validationRules: {
      tonnage: { max: 31, message: 'Maximum tonnage is 31 tons' },
      capacity: { min: 1, message: 'Minimum 1 passenger' },
    },
  },
  
  // HYBRID: TONNAGE + PASSENGER + BRACKET (e.g., Driving School Comprehensive)
  TONNAGE_PASSENGER_BRACKET: {
    requiredFields: [
      'registrationNumber',
      'tonnage',
      'capacity',
      'sum_insured',
      'year',
      'make',
      'model',
      'cover_start_date',
      'financialInterest',
    ],
    optionalFields: [],
    pricingFields: ['tonnage', 'capacity', 'sum_insured'],
    addons: [
      { id: 'windscreen', label: 'Windscreen Cover' },
      { id: 'radio_cassette', label: 'Radio Cassette Cover' },
      { id: 'excess_protector', label: 'Excess Protector' },
      { id: 'pvt', label: 'PVT' },
      { id: 'loss_of_use', label: 'Loss of Use' },
    ],
    autoLoadUnderwriters: false,
    validationRules: {
      sum_insured: { min: 500000, message: 'Minimum sum insured is KSh 500,000' },
      tonnage: { max: 31, message: 'Maximum tonnage is 31 tons' },
      capacity: { min: 1, message: 'Minimum 1 passenger' },
    },
  },
};

// Product to pricing model mapping (all 60+ products)
export const PRODUCT_PRICING_MODEL = {
  // Private (5 products)
  'PRIVATE_TOR': 'FIXED',
  'PRIVATE_THIRD_PARTY': 'FIXED',
  'PRIVATE_THIRD_PARTY_EXTENDIBLE': 'FIXED',
  'PRIVATE_MOTORCYCLE_TPO': 'FIXED',
  'PRIVATE_COMPREHENSIVE': 'BRACKET',
  
  // PSV (12 products)
  'PSV_UBER_TOR': 'FIXED',
  'PSV_UBER_TPO': 'FIXED',
  'PSV_UBER_TPO_EXTENDIBLE': 'FIXED',
  'PSV_TUKTUK_TPO': 'PASSENGER',
  'PSV_TUKTUK_TPO_EXTENDIBLE': 'PASSENGER',
  'PSV_MATATU_TPO_1MONTH': 'PASSENGER',
  'PSV_MATATU_TPO_2WEEKS': 'PASSENGER',
  'PSV_PLAIN_TPO': 'PASSENGER',
  'PSV_TOURVAN_TPO': 'PASSENGER',
  'PSV_TOURVAN_TPO_EXTENDIBLE': 'PASSENGER',
  'PSV_UBER_COMPREHENSIVE': 'BRACKET',
  'PSV_TOURVAN_COMPREHENSIVE': 'BRACKET',
  
  // Commercial (10 products)
  'COMMERCIAL_TOR': 'TONNAGE',
  'COMMERCIAL_OWN_GOODS_TPO': 'TONNAGE',
  'COMMERCIAL_OWN_GOODS_TPO_EXTENDIBLE': 'TONNAGE',
  'COMMERCIAL_GENERAL_CARTAGE_TPO': 'TONNAGE',
  'COMMERCIAL_GENERAL_CARTAGE_TPO_EXTENDIBLE': 'TONNAGE',
  'COMMERCIAL_TUKTUK_TPO': 'TONNAGE',
  'COMMERCIAL_TUKTUK_TPO_EXTENDIBLE': 'TONNAGE',
  'COMMERCIAL_GENERAL_CARTAGE_TPO_PRIME_MOVER': 'TONNAGE',
  'COMMERCIAL_GENERAL_CARTAGE_TPO_PRIME_MOVER_EXTENDIBLE': 'TONNAGE',
  'COMMERCIAL_TUKTUK_COMPREHENSIVE': 'TONNAGE',
  'COMMERCIAL_GENERAL_CARTAGE_COMPREHENSIVE': 'TONNAGE',
  'COMMERCIAL_OWN_GOODS_COMPREHENSIVE': 'TONNAGE',
  
  // Special Classes (11 products)
  'SPECIAL_AGRICULTURAL_TRACTOR_TPO': 'TONNAGE',
  'SPECIAL_COMMERCIAL_INSTITUTIONAL_TPO': 'PASSENGER',
  'SPECIAL_COMMERCIAL_INSTITUTIONAL_TPO_EXTENDIBLE': 'PASSENGER',
  'SPECIAL_KG_PLATE_TPO': 'FIXED',
  'SPECIAL_DRIVING_SCHOOL_TPO': 'TONNAGE_PASSENGER',
  'SPECIAL_AGRICULTURAL_TRACTOR_COMPREHENSIVE': 'TONNAGE',
  'SPECIAL_COMMERCIAL_INSTITUTIONAL_COMPREHENSIVE': 'TONNAGE',
  'SPECIAL_DRIVING_SCHOOL_COMPREHENSIVE': 'TONNAGE_PASSENGER_BRACKET',
  'SPECIAL_FUEL_TANKER_COMPREHENSIVE': 'TONNAGE',
  'SPECIAL_COMMERCIAL_AMBULANCE_COMPREHENSIVE': 'BRACKET',
  
  // Motorcycles (6 products)
  'MOTORCYCLE_PRIVATE_TPO': 'FIXED',
  'MOTORCYCLE_PSV_TPO_ANNUAL': 'PASSENGER',
  'MOTORCYCLE_PSV_TPO_6MONTHS': 'PASSENGER',
  'MOTORCYCLE_PRIVATE_COMPREHENSIVE': 'BRACKET',
  'MOTORCYCLE_PSV_COMPREHENSIVE': 'PASSENGER',
  'MOTORCYCLE_PSV_COMPREHENSIVE_6MONTHS': 'PASSENGER',
};

/**
 * Get field configuration for a product
 * @param {string} productCode - Product code (e.g., 'PRIVATE_THIRD_PARTY')
 * @returns {object} Field configuration
 */
export function getProductFieldConfig(productCode) {
  const pricingModel = PRODUCT_PRICING_MODEL[productCode];
  return PRODUCT_FIELD_CONFIG[pricingModel] || PRODUCT_FIELD_CONFIG.FIXED;
}

/**
 * Determine flow type from product code
 * @param {string} productCode 
 * @returns {'THIRD_PARTY' | 'COMPREHENSIVE'}
 */
export function getFlowType(productCode) {
  const pricingModel = PRODUCT_PRICING_MODEL[productCode];
  
  // All BRACKET models are Comprehensive flow
  if (pricingModel === 'BRACKET' || pricingModel?.includes('BRACKET')) {
    return 'COMPREHENSIVE';
  }
  
  // FIXED, TONNAGE, PASSENGER are Third Party flow
  return 'THIRD_PARTY';
}

/**
 * Check if product is extendible (can be extended after expiry)
 * @param {string} productCode 
 * @returns {boolean}
 */
export function isExtendible(productCode) {
  return productCode.includes('EXTENDIBLE');
}

/**
 * Get extension grace period based on product type
 * @param {string} productCode 
 * @returns {number} Days
 */
export function getExtensionGracePeriod(productCode) {
  if (productCode.includes('THIRD_PARTY') || productCode.includes('TPO')) {
    return 90; // 90 days for Third Party
  }
  if (productCode.includes('TOR')) {
    return 60; // 60 days for TOR
  }
  return 0; // Comprehensive not extendible
}
