/**
 * Data for personal accident insurance quotation
 */

// Personal Accident Insurance Types (Step 1)
export const personalAccidentTypes = [
  { 
    id: 'individual', 
    name: 'Individual', 
    icon: '👤',
    description: 'Coverage for a single person'
  },
  { 
    id: 'family', 
    name: 'Family', 
    icon: '👨‍👩‍👧‍👦',
    description: 'Coverage for you and your family members'
  },
  { 
    id: 'group', 
    name: 'Group', 
    icon: '👥',
    description: 'Coverage for groups and organizations'
  },
  { 
    id: 'sports', 
    name: 'Sports & Adventure', 
    icon: '🏄‍♂️',
    description: 'Special coverage for sporting and adventure activities'
  }
];

// Personal Accident Insurance Products by Type (Step 2)
export const personalAccidentProducts = {
  individual: [
    { 
      id: 'basic_individual', 
      name: 'Basic Individual', 
      icon: '🥉',
      deathBenefit: 1000000,
      permanentDisability: true,
      temporaryDisability: false,
      medicalExpenses: 100000,
      baseRate: 3000
    },
    { 
      id: 'standard_individual', 
      name: 'Standard Individual', 
      icon: '🥈',
      deathBenefit: 3000000,
      permanentDisability: true,
      temporaryDisability: true,
      medicalExpenses: 300000,
      baseRate: 5000
    },
    { 
      id: 'premium_individual', 
      name: 'Premium Individual', 
      icon: '🥇',
      deathBenefit: 5000000,
      permanentDisability: true,
      temporaryDisability: true,
      medicalExpenses: 500000,
      baseRate: 8000
    }
  ],
  family: [
    { 
      id: 'basic_family', 
      name: 'Basic Family', 
      icon: '🥉',
      deathBenefit: 1000000,
      permanentDisability: true,
      temporaryDisability: false,
      medicalExpenses: 100000,
      baseRate: 7000
    },
    { 
      id: 'standard_family', 
      name: 'Standard Family', 
      icon: '🥈',
      deathBenefit: 3000000,
      permanentDisability: true,
      temporaryDisability: true,
      medicalExpenses: 300000,
      baseRate: 12000
    },
    { 
      id: 'premium_family', 
      name: 'Premium Family', 
      icon: '🥇',
      deathBenefit: 5000000,
      permanentDisability: true,
      temporaryDisability: true,
      medicalExpenses: 500000,
      baseRate: 18000
    }
  ],
  group: [
    { 
      id: 'group_basic', 
      name: 'Group Basic', 
      icon: '👥',
      deathBenefit: 1000000,
      permanentDisability: true,
      temporaryDisability: false,
      medicalExpenses: 100000,
      baseRate: 2500
    },
    { 
      id: 'group_standard', 
      name: 'Group Standard', 
      icon: '👥',
      deathBenefit: 2000000,
      permanentDisability: true,
      temporaryDisability: true,
      medicalExpenses: 200000,
      baseRate: 4000
    },
    { 
      id: 'group_premium', 
      name: 'Group Premium', 
      icon: '👥',
      deathBenefit: 3000000,
      permanentDisability: true,
      temporaryDisability: true,
      medicalExpenses: 300000,
      baseRate: 6000
    }
  ],
  sports: [
    { 
      id: 'sports_basic', 
      name: 'Sports Basic', 
      icon: '🏄‍♂️',
      deathBenefit: 2000000,
      permanentDisability: true,
      temporaryDisability: true,
      medicalExpenses: 300000,
      baseRate: 6000
    },
    { 
      id: 'sports_premium', 
      name: 'Sports Premium', 
      icon: '🏄‍♂️',
      deathBenefit: 5000000,
      permanentDisability: true,
      temporaryDisability: true,
      medicalExpenses: 500000,
      baseRate: 10000
    },
    { 
      id: 'extreme_sports', 
      name: 'Extreme Sports', 
      icon: '🪂',
      deathBenefit: 10000000,
      permanentDisability: true,
      temporaryDisability: true,
      medicalExpenses: 1000000,
      baseRate: 15000
    }
  ]
};

// Occupation risk categories for premium calculation
export const occupationRiskCategories = [
  { id: 'low', name: 'Low Risk', description: 'Office work, teaching, etc.', factor: 1.0 },
  { id: 'medium', name: 'Medium Risk', description: 'Technical work, driving, etc.', factor: 1.3 },
  { id: 'high', name: 'High Risk', description: 'Construction, factory work, etc.', factor: 1.8 },
  { id: 'very_high', name: 'Very High Risk', description: 'Mining, offshore work, etc.', factor: 2.5 }
];

// Age brackets for premium calculation
export const ageBrackets = [
  { min: 18, max: 35, factor: 1.0 },
  { min: 36, max: 50, factor: 1.2 },
  { min: 51, max: 65, factor: 1.5 },
  { min: 66, max: 70, factor: 2.0 }
];

// Cover durations
export const coverDurations = [
  { id: '12_months', name: '12 Months', factor: 1.0 },
  { id: '6_months', name: '6 Months', factor: 0.6 },
  { id: '3_months', name: '3 Months', factor: 0.35 },
  { id: '1_month', name: '1 Month', factor: 0.15 }
];

// Personal accident insurers
export const personalAccidentInsurers = [
  { id: 'jubilee', name: 'Jubilee Insurance', logo: 'jubilee.png' },
  { id: 'britam', name: 'Britam Insurance', logo: 'britam.png' },
  { id: 'madison', name: 'Madison Insurance', logo: 'madison.png' },
  { id: 'heritage', name: 'Heritage Insurance', logo: 'heritage.png' },
  { id: 'aar', name: 'AAR Insurance', logo: 'aar.png' },
  { id: 'resolution', name: 'Resolution Insurance', logo: 'resolution.png' }
];
