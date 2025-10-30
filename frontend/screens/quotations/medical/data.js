/**
 * Data for medical insurance quotation
 */

// Medical Insurance Types (Step 1)
export const medicalInsuranceTypes = [
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
    id: 'senior', 
    name: 'Senior Citizen', 
    icon: '👵',
    description: 'Special coverage for senior citizens'
  },
  { 
    id: 'group', 
    name: 'Group Medical', 
    icon: '👥',
    description: 'Coverage for groups and organizations'
  },
  { 
    id: 'preExisting', 
    name: 'Pre-existing Conditions', 
    icon: '🏥',
    description: 'Coverage for pre-existing medical conditions'
  }
];

// Medical Insurance Products by Type (Step 2)
export const medicalInsuranceProducts = {
  individual: [
    { 
      id: 'bronze_individual', 
      name: 'Bronze Individual', 
      icon: '🥉',
      annualLimit: 500000,
      inpatientCover: true,
      outpatientCover: false,
      dentalCover: false,
      opticalCover: false,
      maternityCover: false,
      baseRate: 15000
    },
    { 
      id: 'silver_individual', 
      name: 'Silver Individual', 
      icon: '🥈',
      annualLimit: 1000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: false,
      opticalCover: false,
      maternityCover: false,
      baseRate: 25000
    },
    { 
      id: 'gold_individual', 
      name: 'Gold Individual', 
      icon: '🥇',
      annualLimit: 3000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: true,
      opticalCover: true,
      maternityCover: false,
      baseRate: 40000
    }
  ],
  family: [
    { 
      id: 'bronze_family', 
      name: 'Bronze Family', 
      icon: '🥉',
      annualLimit: 1000000,
      inpatientCover: true,
      outpatientCover: false,
      dentalCover: false,
      opticalCover: false,
      maternityCover: true,
      baseRate: 45000
    },
    { 
      id: 'silver_family', 
      name: 'Silver Family', 
      icon: '🥈',
      annualLimit: 3000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: false,
      opticalCover: false,
      maternityCover: true,
      baseRate: 65000
    },
    { 
      id: 'gold_family', 
      name: 'Gold Family', 
      icon: '🥇',
      annualLimit: 5000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: true,
      opticalCover: true,
      maternityCover: true,
      baseRate: 100000
    }
  ],
  senior: [
    { 
      id: 'senior_bronze', 
      name: 'Senior Bronze', 
      icon: '🥉',
      annualLimit: 500000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: false,
      opticalCover: false,
      maternityCover: false,
      baseRate: 30000
    },
    { 
      id: 'senior_silver', 
      name: 'Senior Silver', 
      icon: '🥈',
      annualLimit: 1000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: true,
      opticalCover: true,
      maternityCover: false,
      baseRate: 45000
    }
  ],
  group: [
    { 
      id: 'group_small', 
      name: 'Small Group (5-20)', 
      icon: '👥',
      annualLimit: 2000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: false,
      opticalCover: false,
      maternityCover: true,
      baseRate: 12000
    },
    { 
      id: 'group_medium', 
      name: 'Medium Group (21-100)', 
      icon: '👥',
      annualLimit: 3000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: true,
      opticalCover: true,
      maternityCover: true,
      baseRate: 10000
    },
    { 
      id: 'group_large', 
      name: 'Large Group (100+)', 
      icon: '👥',
      annualLimit: 5000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: true,
      opticalCover: true,
      maternityCover: true,
      baseRate: 8000
    }
  ],
  preExisting: [
    { 
      id: 'pre_existing_basic', 
      name: 'Basic Pre-existing Cover', 
      icon: '🏥',
      annualLimit: 1000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: false,
      opticalCover: false,
      maternityCover: false,
      baseRate: 50000
    },
    { 
      id: 'pre_existing_comprehensive', 
      name: 'Comprehensive Pre-existing Cover', 
      icon: '🏥',
      annualLimit: 3000000,
      inpatientCover: true,
      outpatientCover: true,
      dentalCover: true,
      opticalCover: true,
      maternityCover: true,
      baseRate: 75000
    }
  ]
};

// Age brackets for premium calculation
export const ageBrackets = [
  { min: 0, max: 18, factor: 0.7 },
  { min: 19, max: 35, factor: 1.0 },
  { min: 36, max: 50, factor: 1.3 },
  { min: 51, max: 65, factor: 1.8 },
  { min: 66, max: 75, factor: 2.2 },
  { min: 76, max: 999, factor: 3.0 }
];

// Medical insurers
export const medicalInsurers = [
  { id: 'jubilee', name: 'Jubilee Health Insurance', logo: 'jubilee.png' },
  { id: 'madison', name: 'Madison Health Insurance', logo: 'madison.png' },
  { id: 'britam', name: 'Britam Health Insurance', logo: 'britam.png' },
  { id: 'aar', name: 'AAR Health Insurance', logo: 'aar.png' },
  { id: 'cic', name: 'CIC Health Insurance', logo: 'cic.png' },
  { id: 'resolution', name: 'Resolution Health', logo: 'resolution.png' }
];

// Medical cover durations
export const coverDurations = [
  { id: '12_months', name: '12 Months', factor: 1.0 },
  { id: '6_months', name: '6 Months', factor: 0.6 },
  { id: '3_months', name: '3 Months', factor: 0.35 }
];
