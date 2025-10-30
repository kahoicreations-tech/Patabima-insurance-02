/**
 * Third Party Motor Insurance Data
 * Contains underwriter information and rates for third party motor insurance
 */

// Use a placeholder logo URI for now - can be replaced with actual logos later
const logoPlaceholder = 'https://via.placeholder.com/100x60/007BFF/FFFFFF?text=Logo';

export const THIRD_PARTY_UNDERWRITERS = [
  {
    id: 'jubilee_tp',
    name: 'Jubilee Insurance',
    logo: logoPlaceholder,
    baseRate: 4.5,
    minimumPremium: 8000,
    maximumVehicleAge: 25,
    thirdPartyRates: {
      privateVehicle: 4.0,
      baseMinimum: 7500,
      maxVehicleAge: 25
    },
    thirdPartyFeatures: [
      'Third Party Liability Coverage',
      'Legal Compliance with Traffic Act',
      'Quick Claims Processing',
      'Affordable Premium Rates',
      '24/7 Customer Support',
      'Nationwide Coverage'
    ],
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    },
    pricingLogic: {
      description: 'Rate-based calculation for third party liability',
      formula: 'Base Premium = Vehicle Value × Rate / 100',
      minimumApplies: true
    }
  },
  {
    id: 'madison_tp',
    name: 'Madison Insurance',
    logo: logoPlaceholder,
    baseRate: 4.2,
    minimumPremium: 7800,
    maximumVehicleAge: 20,
    thirdPartyRates: {
      privateVehicle: 3.8,
      baseMinimum: 7500,
      maxVehicleAge: 20
    },
    thirdPartyFeatures: [
      'Third Party Liability Coverage',
      'Legal Compliance',
      'Fast Claims Settlement',
      'Competitive Premium Rates',
      'Online Policy Management',
      'Emergency Roadside Assistance'
    ],
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    },
    pricingLogic: {
      description: 'Competitive rate-based pricing',
      formula: 'Base Premium = Vehicle Value × Rate / 100',
      minimumApplies: true
    }
  },
  {
    id: 'britam_tp',
    name: 'Britam Insurance',
    logo: logoPlaceholder,
    baseRate: 4.3,
    minimumPremium: 7600,
    maximumVehicleAge: 22,
    thirdPartyRates: {
      privateVehicle: 3.9,
      baseMinimum: 7500,
      maxVehicleAge: 22
    },
    thirdPartyFeatures: [
      'Third Party Liability Coverage',
      'Legal Compliance',
      'Reliable Claims Service',
      'Flexible Payment Options',
      'Mobile App Access',
      'Customer Care Support'
    ],
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    },
    pricingLogic: {
      description: 'Standard rate-based calculation',
      formula: 'Base Premium = Vehicle Value × Rate / 100',
      minimumApplies: true
    }
  },
  {
    id: 'kal_tp',
    name: 'KAL Insurance',
    logo: logoPlaceholder,
    baseRate: 4.1,
    minimumPremium: 7700,
    maximumVehicleAge: 18,
    thirdPartyRates: {
      privateVehicle: 3.7,
      baseMinimum: 7500,
      maxVehicleAge: 18
    },
    thirdPartyFeatures: [
      'Third Party Liability Coverage',
      'Legal Compliance',
      'Quick Policy Issuance',
      'Affordable Rates',
      'Local Market Knowledge',
      'Dedicated Customer Service'
    ],
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    },
    pricingLogic: {
      description: 'Value-focused pricing model',
      formula: 'Base Premium = Vehicle Value × Rate / 100',
      minimumApplies: true
    }
  },
  {
    id: 'pacis_tp',
    name: 'PACIS Insurance',
    logo: logoPlaceholder,
    baseRate: 4.4,
    minimumPremium: 7900,
    maximumVehicleAge: 20,
    thirdPartyRates: {
      privateVehicle: 4.0,
      baseMinimum: 7500,
      maxVehicleAge: 20
    },
    thirdPartyFeatures: [
      'Third Party Liability Coverage',
      'Legal Compliance',
      'Professional Service',
      'Fair Premium Rates',
      'Prompt Claims Handling',
      'Wide Agent Network'
    ],
    statutoryLevies: {
      policyholdersFund: 0.25,
      trainingLevy: 0.2,
      stampDuty: 40
    },
    pricingLogic: {
      description: 'Professional rate-based pricing',
      formula: 'Base Premium = Vehicle Value × Rate / 100',
      minimumApplies: true
    }
  }
];

// Standard third party coverage limits as per Kenyan law
export const THIRD_PARTY_COVERAGE_LIMITS = {
  bodilyInjury: 3000000, // KSh 3M per person
  propertyDamage: 1000000, // KSh 1M per accident
  legalLiability: 'Unlimited as per law',
  description: 'Minimum legal requirements for motor vehicle insurance in Kenya'
};

// Statutory levies applicable to all third party policies
export const STATUTORY_LEVIES = {
  policyholdersFund: 0.25, // 0.25% of premium
  trainingLevy: 0.2, // 0.2% of premium
  stampDuty: 40, // Fixed KSh 40
  description: 'Government mandated levies on insurance policies'
};

export default {
  THIRD_PARTY_UNDERWRITERS,
  THIRD_PARTY_COVERAGE_LIMITS,
  STATUTORY_LEVIES
};
