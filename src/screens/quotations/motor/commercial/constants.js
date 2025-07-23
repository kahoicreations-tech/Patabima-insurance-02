// Constants for Commercial TPFT Screen
export const VEHICLE_CATEGORIES = [
  { 
    id: 'general_cartage',
    name: 'General Cartage',
    description: 'Vehicles used for general goods transportation',
    subCategories: ['Light', 'Medium', 'Heavy']
  },
  {
    id: 'own_goods',
    name: 'Own Goods',
    description: 'Vehicles used to transport company\'s own goods',
    subCategories: ['Light', 'Medium', 'Heavy']
  },
  {
    id: 'special_type',
    name: 'Special Type',
    description: 'Construction, agricultural, or specialized vehicles',
    subCategories: ['Mobile Crane', 'Earth Mover', 'Fork Lift', 'Other']
  }
];

export const COMPREHENSIVE_COVERAGE_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard Comprehensive',
    rate: 4,
    description: 'Basic comprehensive coverage for commercial vehicles',
    features: [
      'Own damage coverage',
      'Third party liability',
      'Fire and theft coverage',
      'Natural calamities'
    ]
  },
  {
    id: 'enhanced',
    name: 'Enhanced Comprehensive',
    rate: 4.5,
    description: 'Premium coverage with additional benefits',
    features: [
      'All Standard features',
      'Enhanced windscreen cover',
      'Free courtesy car',
      'Roadside assistance'
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
