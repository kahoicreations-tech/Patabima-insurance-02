/**
 * Data for last expense insurance quotation
 */

// Last Expense Insurance Types (Step 1)
export const lastExpenseTypes = [
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
    id: 'extended_family', 
    name: 'Extended Family', 
    icon: '👪',
    description: 'Coverage including extended family members'
  },
  { 
    id: 'senior', 
    name: 'Senior', 
    icon: '👵',
    description: 'Special coverage for senior citizens'
  }
];

// Last Expense Insurance Products by Type (Step 2)
export const lastExpenseProducts = {
  individual: [
    { 
      id: 'basic_individual', 
      name: 'Basic Individual', 
      icon: '🥉',
      funeralExpenses: 100000,
      baseRate: 2000
    },
    { 
      id: 'standard_individual', 
      name: 'Standard Individual', 
      icon: '🥈',
      funeralExpenses: 300000,
      baseRate: 4000
    },
    { 
      id: 'premium_individual', 
      name: 'Premium Individual', 
      icon: '🥇',
      funeralExpenses: 500000,
      baseRate: 6000
    }
  ],
  family: [
    { 
      id: 'basic_family', 
      name: 'Basic Family', 
      icon: '🥉',
      funeralExpenses: 100000,
      baseRate: 5000
    },
    { 
      id: 'standard_family', 
      name: 'Standard Family', 
      icon: '🥈',
      funeralExpenses: 300000,
      baseRate: 8000
    },
    { 
      id: 'premium_family', 
      name: 'Premium Family', 
      icon: '🥇',
      funeralExpenses: 500000,
      baseRate: 12000
    }
  ],
  extended_family: [
    { 
      id: 'basic_extended', 
      name: 'Basic Extended Family', 
      icon: '🥉',
      funeralExpenses: 100000,
      baseRate: 8000
    },
    { 
      id: 'standard_extended', 
      name: 'Standard Extended Family', 
      icon: '🥈',
      funeralExpenses: 300000,
      baseRate: 12000
    },
    { 
      id: 'premium_extended', 
      name: 'Premium Extended Family', 
      icon: '🥇',
      funeralExpenses: 500000,
      baseRate: 18000
    }
  ],
  senior: [
    { 
      id: 'basic_senior', 
      name: 'Basic Senior', 
      icon: '👵',
      funeralExpenses: 100000,
      baseRate: 4000
    },
    { 
      id: 'standard_senior', 
      name: 'Standard Senior', 
      icon: '👵',
      funeralExpenses: 200000,
      baseRate: 6000
    },
    { 
      id: 'premium_senior', 
      name: 'Premium Senior', 
      icon: '👵',
      funeralExpenses: 300000,
      baseRate: 8000
    }
  ]
};

// Age brackets for premium calculation
export const ageBrackets = [
  { min: 18, max: 40, factor: 1.0 },
  { min: 41, max: 55, factor: 1.2 },
  { min: 56, max: 65, factor: 1.5 },
  { min: 66, max: 75, factor: 2.0 },
  { min: 76, max: 85, factor: 2.5 },
  { min: 86, max: 999, factor: 3.0 }
];

// Cover durations
export const coverDurations = [
  { id: '12_months', name: '12 Months', factor: 1.0 },
  { id: '24_months', name: '24 Months', factor: 1.9 },
  { id: '36_months', name: '36 Months', factor: 2.8 }
];

// Family size categories
export const familySizeCategories = [
  { id: 'nuclear', name: 'Nuclear (3-4)', members: '3-4', factor: 1.0 },
  { id: 'medium', name: 'Medium (5-6)', members: '5-6', factor: 1.3 },
  { id: 'large', name: 'Large (7-10)', members: '7-10', factor: 1.7 },
  { id: 'extended', name: 'Extended (11+)', members: '11+', factor: 2.2 }
];

// Last expense insurers
export const lastExpenseInsurers = [
  { id: 'britam', name: 'Britam Insurance', logo: 'britam.png' },
  { id: 'jubilee', name: 'Jubilee Insurance', logo: 'jubilee.png' },
  { id: 'cic', name: 'CIC Insurance', logo: 'cic.png' },
  { id: 'madison', name: 'Madison Insurance', logo: 'madison.png' },
  { id: 'icea', name: 'ICEA Lion', logo: 'icea.png' },
  { id: 'heritage', name: 'Heritage Insurance', logo: 'heritage.png' }
];
