/**
 * Commercial Insurance Underwriters
 * Based on official binder terms from Sanlam, Monarch, and other partners
 */

// Import for icons
import { Ionicons } from '@expo/vector-icons';

// Commercial underwriters offering both comprehensive and third party products
export const COMMERCIAL_UNDERWRITERS = [
  {
    id: 'sanlam',
    name: 'Sanlam General Insurance',
    iconName: 'shield-checkmark',
    iconColor: '#E3051B', // Sanlam red color
    comprehensive: {
      // From Sanlam Motor Commercial Binder Terms 2021
      new_vehicle_rate: 0.04, // 4.0% for 0-5 years with excess protector
      older_vehicle_rate: 0.045, // 4.5% for 5-15 years with excess protector
      min_premium: 30000, // KSh 30,000 minimum premium
      max_age: 15, // Maximum 15 years
      min_value: 750000, // Minimum KSh 750,000 sum insured
      pvt_rate: 0.0035, // Political Violence/Terrorism rate 0.35%
      pvt_min: 5000, // Political Violence/Terrorism minimum KSh 5,000
      excess: {
        own_damage: {
          percent: 0.05, // 5% of sum insured 
          min: 50000, // Minimum KSh 50,000
          max: 250000 // Maximum KSh 250,000
        },
        third_party: 10000, // Fixed KSh 10,000
        theft: {
          with_tracking: {
            percent: 0.025, // 2.5% with tracking device
            min: 25000 // Minimum KSh 25,000
          },
          with_antitheft: {
            percent: 0.1, // 10% with anti-theft device
            min: 25000 // Minimum KSh 25,000
          },
          without_antitheft: {
            percent: 0.2, // 20% without anti-theft device
            min: 25000 // Minimum KSh 25,000
          }
        }
      }
    },
    third_party: {
      // Third party rates based on vehicle category and tonnage
      light: 15000, // Up to 3 tons
      medium: 20000, // 3-8 tons
      heavy: 30000, // Above 8 tons
      special_type: 25000 // Special type vehicles
    },
    benefits: [
      'Unlimited third party persons liability',
      'Third party property damage up to KSh 5 million',
      'Passenger liability up to KSh 3 million per person',
      'Towing charges up to KSh 50,000',
      'Authorized repairs up to KSh 50,000',
      'Windscreen cover up to KSh 50,000',
      'Radio/cassette cover up to KSh 30,000',
      'Medical expenses up to KSh 50,000',
      'Free riot & strike, civil commotion cover',
      'No blame no excess',
      'East Africa geographical coverage'
    ]
  },
  {
    id: 'monarch',
    name: 'Monarch Insurance',
    iconName: 'shield',
    iconColor: '#FDB813', // Monarch gold/yellow color
    comprehensive: {
      new_vehicle_rate: 0.042, // 4.2% for 0-5 years 
      older_vehicle_rate: 0.047, // 4.7% for 5-15 years
      min_premium: 30000, // KSh 30,000 minimum premium
      max_age: 15, // Maximum 15 years
      min_value: 750000, // Minimum KSh 750,000 sum insured
      pvt_rate: 0.0035, // Political Violence/Terrorism rate 0.35%
      pvt_min: 5000, // Political Violence/Terrorism minimum KSh 5,000
      excess: {
        own_damage: {
          percent: 0.05, // 5% of sum insured 
          min: 50000, // Minimum KSh 50,000
          max: 250000 // Maximum KSh 250,000
        },
        third_party: 10000, // Fixed KSh 10,000
        theft: {
          with_tracking: {
            percent: 0.025, // 2.5% with tracking device
            min: 25000 // Minimum KSh 25,000
          },
          with_antitheft: {
            percent: 0.1, // 10% with anti-theft device
            min: 25000 // Minimum KSh 25,000
          },
          without_antitheft: {
            percent: 0.2, // 20% without anti-theft device
            min: 25000 // Minimum KSh 25,000
          }
        }
      }
    },
    third_party: {
      light: 16000,
      medium: 22000,
      heavy: 32000,
      special_type: 27000
    },
    benefits: [
      'Third party persons - unlimited liability',
      'Third party property damage - KSh 5 million',
      'Passenger liability - KSh 3 million per person',
      'Towing charges - KSh 50,000',
      'Windscreen cover - KSh 30,000',
      'Radio cassette - KSh 30,000',
      'Medical expenses - KSh 50,000',
      'Free valuation at inception'
    ]
  },
  {
    id: 'pacis',
    name: 'PACIS Insurance',
    iconName: 'briefcase',
    iconColor: '#00529B', // Pacis blue color
    comprehensive: {
      new_vehicle_rate: 0.039, // 3.9% for 0-5 years
      older_vehicle_rate: 0.044, // 4.4% for 5-15 years
      min_premium: 30000,
      max_age: 15,
      min_value: 700000, // Minimum KSh 700,000 sum insured
      pvt_rate: 0.0035,
      pvt_min: 5000,
      excess: {
        own_damage: {
          percent: 0.05,
          min: 50000,
          max: 250000
        },
        third_party: 10000,
        theft: {
          with_tracking: {
            percent: 0.025,
            min: 25000
          },
          with_antitheft: {
            percent: 0.1,
            min: 25000
          },
          without_antitheft: {
            percent: 0.2,
            min: 25000
          }
        }
      }
    },
    third_party: {
      light: 15000,
      medium: 20000,
      heavy: 30000,
      special_type: 25000
    },
    benefits: [
      'Third party persons liability - unlimited',
      'Third party property damage - KSh 5 million',
      'Passenger liability - KSh 3 million per person',
      'Towing charges - KSh 40,000',
      'Windscreen cover - KSh 40,000',
      'Audio equipment - KSh 30,000',
      'Medical expenses - KSh 30,000'
    ]
  },
  {
    id: 'mua',
    name: 'MUA Insurance',
    iconName: 'umbrella',
    iconColor: '#007A33', // MUA green color
    comprehensive: {
      new_vehicle_rate: 0.041, // 4.1% for 0-5 years
      older_vehicle_rate: 0.046, // 4.6% for 5-15 years
      min_premium: 30000,
      max_age: 15,
      min_value: 750000,
      pvt_rate: 0.0035,
      pvt_min: 5000,
      excess: {
        own_damage: {
          percent: 0.05,
          min: 50000,
          max: 250000
        },
        third_party: 10000,
        theft: {
          with_tracking: {
            percent: 0.025,
            min: 25000
          },
          with_antitheft: {
            percent: 0.1,
            min: 25000
          },
          without_antitheft: {
            percent: 0.2,
            min: 25000
          }
        }
      }
    },
    third_party: {
      light: 15500,
      medium: 21000,
      heavy: 31000,
      special_type: 26000
    },
    benefits: [
      'Third party persons liability - unlimited',
      'Third party property damage - KSh 5 million',
      'Passenger liability - KSh 3 million per person',
      'Towing charges - KSh 50,000',
      'Windscreen cover - KSh 50,000',
      'Audio equipment - KSh 30,000',
      'Medical expenses - KSh 40,000',
      '24/7 Roadside assistance'
    ]
  },
  {
    id: 'madison',
    name: 'Madison Insurance',
    iconName: 'business',
    iconColor: '#0066CC', // Madison blue color
    comprehensive: {
      new_vehicle_rate: 0.04, // 4.0% for 0-5 years
      older_vehicle_rate: 0.045, // 4.5% for 5-15 years
      min_premium: 30000,
      max_age: 15,
      min_value: 750000,
      pvt_rate: 0.0035,
      pvt_min: 5000,
      excess: {
        own_damage: {
          percent: 0.05,
          min: 50000,
          max: 250000
        },
        third_party: 10000,
        theft: {
          with_tracking: {
            percent: 0.025,
            min: 25000
          },
          with_antitheft: {
            percent: 0.1,
            min: 25000
          },
          without_antitheft: {
            percent: 0.2,
            min: 25000
          }
        }
      }
    },
    third_party: {
      light: 15000,
      medium: 20000,
      heavy: 30000,
      special_type: 25000
    },
    benefits: [
      'Third party persons liability - unlimited',
      'Third party property damage - KSh 5 million',
      'Passenger liability - KSh 3 million per person',
      'Towing charges - KSh 50,000',
      'Windscreen cover - KSh 30,000',
      'Audio equipment - KSh 30,000',
      'Medical expenses - KSh 50,000',
      'Free valuation within 30 days'
    ]
  }
];

// Commercial vehicle categories and sub-categories
export const COMMERCIAL_VEHICLE_CATEGORIES = [
  { 
    id: 'general_cartage',
    name: 'General Cartage',
    description: 'Vehicles used for general goods transportation',
    subCategories: [
      { id: 'light_commercial', name: 'Light Commercial (Up to 3.5 tons)' },
      { id: 'medium_commercial', name: 'Medium Commercial (3.5 - 7.5 tons)' },
      { id: 'heavy_commercial', name: 'Heavy Commercial (Above 7.5 tons)' }
    ]
  },
  {
    id: 'own_goods',
    name: 'Own Goods',
    description: 'Vehicles used to transport company\'s own goods',
    subCategories: [
      { id: 'light_own_goods', name: 'Light Own Goods (Up to 3.5 tons)' },
      { id: 'medium_own_goods', name: 'Medium Own Goods (3.5 - 7.5 tons)' },
      { id: 'heavy_own_goods', name: 'Heavy Own Goods (Above 7.5 tons)' }
    ]
  },
  {
    id: 'special_type',
    name: 'Special Type',
    description: 'Construction, agricultural, or specialized vehicles',
    subCategories: [
      { id: 'mobile_crane', name: 'Mobile Crane' },
      { id: 'earth_mover', name: 'Earth Mover' },
      { id: 'fork_lift', name: 'Fork Lift' },
      { id: 'agricultural', name: 'Agricultural' },
      { id: 'construction', name: 'Construction' },
      { id: 'other_special', name: 'Other Special Type' }
    ]
  }
];

const TPFT_COVERAGE_OPTIONS = [
  {
    id: 'basic_tpft',
    name: 'Basic TPFT',
    rate: 3,
    description: 'Standard third party, fire and theft coverage',
    features: [
      'Third party liability',
      'Fire damage coverage',
      'Theft coverage',
      'Basic windscreen cover'
    ]
  },
  {
    id: 'enhanced_tpft',
    name: 'Enhanced TPFT',
    rate: 3.5,
    description: 'Additional benefits with TPFT coverage',
    features: [
      'All Basic features',
      'Enhanced windscreen cover',
      'Anti-theft device discount',
      'Recovery after theft'
    ]
  }
];

export const ADDONS = [
  {
    id: 'political_violence',
    name: 'Political Violence & Terrorism',
    description: 'Coverage against politically motivated damage',
    rate: 0.25
  },
  {
    id: 'geographical_extension',
    name: 'Geographical Extension',
    description: 'Coverage in East African countries',
    rate: 0.25
  },
  {
    id: 'passenger_legal',
    name: 'Passenger Legal Liability',
    description: 'Extended legal coverage for passengers',
    rate: 0.2
  }
];

export const PAYMENT_PLANS = [
  {
    id: 'full',
    name: 'Full Payment',
    description: 'Pay entire premium upfront',
    discount: '5% discount on total premium'
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    description: 'Pay in 4 installments',
    surcharge: '2% surcharge per installment'
  },
  {
    id: 'monthly',
    name: 'Monthly',
    description: 'Pay in 12 installments',
    surcharge: '3% surcharge per installment'
  }
];
