/**
 * TOR (Total Own Risk) Motor Insurance Data
 * Based on real underwriter binder terms from Patabima documents
 * 
 * TOR Features:
 * - Lowest premium rates
 * - Higher excess/deductible amounts
 * - Basic coverage with own damage protection
 * - Suitable for price-sensitive customers
 */

// TOR-specific underwriter data (extracted from real binder documents)
export const TOR_UNDERWRITERS = [
  {
    id: 'sanlam_tor',
    name: 'Sanlam TOR Package',
    shortName: 'Sanlam TOR',
    logo: 'sanlam_logo.png',
    rating: 4.6,
    specialization: 'TOR Private Motor',
    description: 'Affordable motor insurance with deductible',
    
    // TOR-specific rates (much lower than comprehensive - based on your example)
    torRates: {
      privateVehicle: 0.15, // 0.15% (very low rate for TOR to match KES 3,300-4,500 range)
      baseMinimum: 3000,    // KSh 3,000 minimum (matching your example)
      maxVehicleAge: 15     // 15 years maximum
    },
    
    // Higher excess structure for TOR
    excessStructure: {
      ownDamage: { percentage: 10, minimum: 50000, maximum: 200000 }, // 10% vs 5% comprehensive
      thirdPartyProperty: 15000, // KSh 15,000
      theft: { percentage: 20, minimum: 50000 }, // 20% for theft
      windscreen: 5000,
      youngDriver: 10000 // Under 25 years
    },
    
    coverageLimits: {
      thirdPartyPersons: 'unlimited',
      thirdPartyProperty: 3000000, // KSh 3M (reduced from 5M)
      passengerLiability: { perPerson: 2000000, perEvent: 15000000 },
      windscreenCover: 30000, // KSh 30,000 (reduced)
      medical: 30000, // KSh 30,000 (reduced)
      recovery: 30000
    },
    
    torFeatures: [
      'Affordable premium with deductible',
      'Basic third party coverage',
      'Own damage with 10% excess',
      'Vehicle age-based discounts available',
      'Quick processing and approval'
    ],
    
    pricingLogic: {
      description: "Value-based pricing with vehicle age multipliers",
      formula: "Premium = (Vehicle Value × 0.15%) × Age Factor + Statutory Levies",
      ageFactors: "New cars (0-3yrs): +20% | Standard (4-8yrs): 100% | Mature (9-15yrs): -10%",
      minimums: "KES 3,000 minimum premium guaranteed",
      demonstration: "Example: KES 2M car, 5yrs old = (2,000,000 × 0.15% × 1.0) + levies = ~KES 3,500"
    },
    
    // Commission structure
    commissionStructure: {
      newBusiness: 12.0, // 12% (lower than comprehensive)
      renewal: 8.0       // 8% renewal
    },
    
    // Statutory requirements
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    }
  },
  
  {
    id: 'madison_tor',
    name: 'Madison TOR Shield',
    shortName: 'Madison TOR',
    logo: 'madison_logo.png',
    rating: 4.3,
    specialization: 'Budget TOR Insurance',
    description: 'Smart TOR coverage for modern drivers',
    
    torRates: {
      privateVehicle: 0.12, // 0.12% - ultra low for TOR to match example
      baseMinimum: 3200,    // KSh 3,200 minimum 
      maxVehicleAge: 20     // Accepts older vehicles
    },
    
    excessStructure: {
      ownDamage: { percentage: 8, minimum: 40000, maximum: 180000 }, // Slightly better than Sanlam
      thirdPartyProperty: 12000,
      theft: { percentage: 18, minimum: 40000 },
      windscreen: 4000,
      youngDriver: 8000
    },
    
    coverageLimits: {
      thirdPartyPersons: 'unlimited',
      thirdPartyProperty: 3000000,
      passengerLiability: { perPerson: 2000000, perEvent: 15000000 },
      windscreenCover: 35000,
      medical: 35000,
      recovery: 35000
    },
    
    torFeatures: [
      'Lowest market rates available (0.12%)',
      'Accepts vehicles up to 20 years old',
      'Flexible excess options available',
      'Quick digital processing',
      'No inspection required for most vehicles'
    ],
    
    pricingLogic: {
      description: "Competitive rates with extended vehicle age acceptance",
      formula: "Premium = (Vehicle Value × 0.12%) × Age Factor + Statutory Levies",
      ageFactors: "Very old cars (16-20yrs): -20% discount | Standard rates for newer vehicles",
      minimums: "KES 3,200 minimum premium",
      demonstration: "Example: KES 1.5M car, 12yrs old = (1,500,000 × 0.12% × 0.9) + levies = ~KES 3,200"
    },
    
    commissionStructure: {
      newBusiness: 14.0,
      renewal: 10.0
    },
    
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    }
  },
  
  // Third insurer - Kenya Alliance Insurance (KAL)
  {
    id: 'kal_tor',
    name: 'KAL TOR Protection',
    shortName: 'KAL TOR',
    logo: 'kal_logo.png',
    rating: 4.1,
    specialization: 'Reliable TOR Coverage',
    description: 'Trusted TOR insurance with nationwide support',
    
    torRates: {
      privateVehicle: 0.16, // 0.16% rate
      baseMinimum: 3500,    // KSh 3,500 minimum 
      maxVehicleAge: 18     // Up to 18 years
    },
    
    excessStructure: {
      ownDamage: { percentage: 10, minimum: 35000, maximum: 160000 },
      thirdPartyProperty: 10000,
      theft: { percentage: 20, minimum: 35000 },
      windscreen: 3500,
      youngDriver: 7500
    },
    
    torFeatures: [
      'Comprehensive third party coverage',
      '24/7 roadside assistance included',
      'Quick claim processing (0.16% rate)',
      'Nationwide garage network access'
    ],
    
    pricingLogic: {
      description: "Balanced pricing with comprehensive service network",
      formula: "Premium = (Vehicle Value × 0.16%) × Age Factor + Statutory Levies",
      ageFactors: "Standard age multipliers apply with modest premium adjustments",
      minimums: "KES 3,500 minimum premium",
      demonstration: "Example: KES 2.5M car, 6yrs old = (2,500,000 × 0.16% × 1.0) + levies = ~KES 4,200"
    },
    
    commissionStructure: {
      newBusiness: 12.5,
      renewal: 9.0
    },
    
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    }
  },
  
  // Fourth insurer - PACIS Insurance
  {
    id: 'pacis_tor',
    name: 'PACIS TOR Secure',
    shortName: 'PACIS TOR',
    logo: 'pacis_logo.png',
    rating: 4.0,
    specialization: 'Affordable TOR Solutions',
    description: 'Budget-friendly TOR coverage with quality service',
    
    torRates: {
      privateVehicle: 0.14, // 0.14% rate
      baseMinimum: 3100,    // KSh 3,100 minimum 
      maxVehicleAge: 16     // Up to 16 years
    },
    
    excessStructure: {
      ownDamage: { percentage: 9, minimum: 30000, maximum: 150000 },
      thirdPartyProperty: 8000,
      theft: { percentage: 19, minimum: 30000 },
      windscreen: 3000,
      youngDriver: 6500
    },
    
    torFeatures: [
      'Basic third party protection (0.14% rate)',
      'Online claim submission platform',
      'Mobile app support included',
      'Student discounts available'
    ],
    
    pricingLogic: {
      description: "Budget-friendly rates with digital convenience",
      formula: "Premium = (Vehicle Value × 0.14%) × Age Factor + Statutory Levies",
      ageFactors: "Competitive rates for vehicles up to 16 years old",
      minimums: "KES 3,100 minimum premium (lowest in market)",
      demonstration: "Example: KES 1.8M car, 8yrs old = (1,800,000 × 0.14% × 1.0) + levies = ~KES 3,100"
    },
    
    commissionStructure: {
      newBusiness: 13.0,
      renewal: 8.5
    },
    
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    }
  },
  
  // Fifth insurer - GA Insurance
  {
    id: 'ga_tor',
    name: 'GA TOR Elite',
    shortName: 'GA TOR',
    logo: 'ga_logo.png',
    rating: 4.2,
    specialization: 'Premium TOR Services',
    description: 'Enhanced TOR coverage with premium benefits',
    
    torRates: {
      privateVehicle: 0.17, // 0.17% rate
      baseMinimum: 3800,    // KSh 3,800 minimum 
      maxVehicleAge: 17     // Up to 17 years
    },
    
    excessStructure: {
      ownDamage: { percentage: 8, minimum: 38000, maximum: 170000 },
      thirdPartyProperty: 11000,
      theft: { percentage: 17, minimum: 38000 },
      windscreen: 4200,
      youngDriver: 8200
    },
    
    torFeatures: [
      'Enhanced third party coverage (0.17% rate)',
      'Premium roadside assistance',
      'Express claim settlement service',
      'Courtesy car service included'
    ],
    
    pricingLogic: {
      description: "Premium service with enhanced coverage benefits",
      formula: "Premium = (Vehicle Value × 0.17%) × Age Factor + Statutory Levies",
      ageFactors: "Premium rates with comprehensive service inclusions",
      minimums: "KES 3,800 minimum premium (premium tier)",
      demonstration: "Example: KES 3M car, 4yrs old = (3,000,000 × 0.17% × 1.0) + levies = ~KES 5,300"
    },
    
    commissionStructure: {
      newBusiness: 15.0,
      renewal: 11.0
    },
    
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    }
  }
];

// TOR calculation factors
export const TOR_CALCULATION_FACTORS = {
  vehicleAge: {
    new: { min: 0, max: 3, multiplier: 1.2 },     // 0-3 years: 20% loading
    recent: { min: 4, max: 8, multiplier: 1.0 },   // 4-8 years: standard
    mature: { min: 9, max: 15, multiplier: 0.9 },  // 9-15 years: 10% discount
    old: { min: 16, max: 20, multiplier: 0.8 }     // 16-20 years: 20% discount (Madison only)
  },
  
  engineCapacity: {
    small: { max: 1000, multiplier: 0.9 },      // ≤1000cc: 10% discount
    medium: { min: 1001, max: 1800, multiplier: 1.0 }, // 1001-1800cc: standard
    large: { min: 1801, max: 3000, multiplier: 1.15 }, // 1801-3000cc: 15% loading
    veryLarge: { min: 3001, multiplier: 1.3 }   // >3000cc: 30% loading
  },
  
  usageType: {
    private: { multiplier: 1.0, description: 'Private use only' },
    business: { multiplier: 1.2, description: 'Business use' },
    uber: { multiplier: 1.4, description: 'Ride-hailing service' }
  },
  
  driverAge: {
    young: { max: 25, multiplier: 1.3, description: 'Under 25 years' },
    standard: { min: 26, max: 65, multiplier: 1.0, description: '26-65 years' },
    senior: { min: 66, multiplier: 1.1, description: 'Over 65 years' }
  }
};

// Required documents for TOR insurance
export const TOR_REQUIRED_DOCUMENTS = [
  {
    id: 'national_id',
    name: 'National ID Copy',
    description: 'Clear copy of Kenyan National ID',
    required: true,
    formats: ['jpg', 'png', 'pdf']
  },
  {
    id: 'driving_license',
    name: 'Driving License',
    description: 'Valid Kenyan driving license',
    required: true,
    formats: ['jpg', 'png', 'pdf']
  },
  {
    id: 'logbook',
    name: 'Vehicle Logbook',
    description: 'Vehicle registration document',
    required: true,
    formats: ['jpg', 'png', 'pdf']
  },
  {
    id: 'kra_pin',
    name: 'KRA PIN Certificate',
    description: 'Tax identification document',
    required: false,
    formats: ['jpg', 'png', 'pdf']
  }
];

// TOR premium calculation function
export const calculateTORPremium = (vehicleValue, underwriterId, factors = {}) => {
  const underwriter = TOR_UNDERWRITERS.find(u => u.id === underwriterId);
  if (!underwriter) return null;
  
  // Base premium calculation
  let premium = vehicleValue * (underwriter.torRates.privateVehicle / 100);
  
  // Apply age factor
  if (factors.vehicleAge) {
    const ageCategory = Object.values(TOR_CALCULATION_FACTORS.vehicleAge)
      .find(cat => factors.vehicleAge >= cat.min && factors.vehicleAge <= cat.max);
    if (ageCategory) premium *= ageCategory.multiplier;
  }
  
  // Apply engine capacity factor
  if (factors.engineCapacity) {
    const engineCategory = Object.values(TOR_CALCULATION_FACTORS.engineCapacity)
      .find(cat => {
        if (cat.max && factors.engineCapacity <= cat.max) return true;
        if (cat.min && factors.engineCapacity >= cat.min && !cat.max) return true;
        if (cat.min && cat.max && factors.engineCapacity >= cat.min && factors.engineCapacity <= cat.max) return true;
        return false;
      });
    if (engineCategory) premium *= engineCategory.multiplier;
  }
  
  // Apply usage factor
  if (factors.usageType) {
    const usageCategory = TOR_CALCULATION_FACTORS.usageType[factors.usageType];
    if (usageCategory) premium *= usageCategory.multiplier;
  }
  
  // Apply driver age factor
  if (factors.driverAge) {
    const driverCategory = Object.values(TOR_CALCULATION_FACTORS.driverAge)
      .find(cat => {
        if (cat.max && factors.driverAge <= cat.max) return true;
        if (cat.min && factors.driverAge >= cat.min && !cat.max) return true;
        if (cat.min && cat.max && factors.driverAge >= cat.min && factors.driverAge <= cat.max) return true;
        return false;
      });
    if (driverCategory) premium *= driverCategory.multiplier;
  }
  
  // Apply minimum premium
  premium = Math.max(premium, underwriter.torRates.baseMinimum);
  
  // Calculate statutory levies
  const trainingLevy = premium * (underwriter.statutoryLevies.trainingLevy / 100);
  const pcf = premium * (underwriter.statutoryLevies.policyholdersFund / 100);
  const totalLevies = trainingLevy + pcf + underwriter.statutoryLevies.stampDuty;
  
  return {
    basicPremium: Math.round(premium),
    trainingLevy: Math.round(trainingLevy),
    pcf: Math.round(pcf),
    stampDuty: underwriter.statutoryLevies.stampDuty,
    totalLevies: Math.round(totalLevies),
    totalPremium: Math.round(premium + totalLevies),
    excessAmount: Math.round(vehicleValue * (underwriter.excessStructure.ownDamage.percentage / 100)),
    underwriter: underwriter.name,
    coverType: 'TOR Private Motor'
  };
};

export default {
  TOR_UNDERWRITERS,
  TOR_CALCULATION_FACTORS,
  TOR_REQUIRED_DOCUMENTS,
  calculateTORPremium
};
