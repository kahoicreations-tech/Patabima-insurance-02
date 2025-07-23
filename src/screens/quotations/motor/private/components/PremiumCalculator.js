/**
 * PremiumCalculator - Centralized Premium Calculation Logic
 * 
 * This module provides reusable premium calculation functions for motor insurance.
 * It handles the complex business logic for calculating premiums across different
 * insurance types (TOR, Comprehensive, Third Party) and vehicle categories.
 * 
 * Features:
 * - Official underwriter rate calculations
 * - Age-based premium adjustments
 * - Statutory levy calculations (IRA mandated)
 * - Minimum premium enforcement
 * - Detailed breakdown generation
 * - Audit trail for calculations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Colors, Spacing, Typography } from '../../../../../constants';

/**
 * Calculate motor insurance premium based on official underwriter rates
 * @param {Object} params - Calculation parameters
 * @param {number} params.vehicleValue - Market value of the vehicle
 * @param {number} params.vehicleAge - Age of vehicle in years
 * @param {Object} params.insurer - Insurer configuration with rates
 * @param {string} params.insuranceType - Type of insurance (TOR, Comprehensive, etc.)
 * @param {string} params.vehicleCategory - Vehicle category (Private, Commercial, PSV)
 * @returns {Object} Detailed premium calculation results
 */
const calculateMotorPremium = ({
  vehicleValue,
  vehicleAge,
  insurer,
  insuranceType = 'TOR',
  vehicleCategory = 'Private'
}) => {
  // Input validation
  if (!vehicleValue || vehicleValue <= 0) {
    throw new Error('Invalid vehicle value provided');
  }
  
  if (!insurer || !insurer.rate) {
    throw new Error('Invalid insurer configuration provided');
  }

  // Get the appropriate rate based on insurance type and vehicle category
  const baseRate = getInsurerRate(insurer, insuranceType, vehicleCategory);
  
  // Calculate base premium using official underwriter rate
  let basePremium = vehicleValue * (baseRate / 100);
  
  // Apply age-based adjustments according to underwriter pricing logic
  const ageAdjustment = getVehicleAgeAdjustment(vehicleAge, insurer.pricingLogic);
  const adjustedPremium = basePremium * ageAdjustment.factor;
  
  // Apply minimum premium constraint from underwriter terms
  const minimumPremium = getMinimumPremium(insurer, insuranceType, vehicleCategory);
  const finalBasePremium = Math.max(adjustedPremium, minimumPremium);
  
  // Calculate statutory levies (IRA mandated)
  const levies = calculateStatutoryLevies(finalBasePremium, insurer.statutoryLevies);
  
  // Calculate total premium
  const totalPremium = finalBasePremium + levies.total;
  
  // Generate detailed breakdown
  const breakdown = {
    vehicleValue,
    vehicleAge,
    baseRate,
    basePremium: Math.round(basePremium),
    ageAdjustment: {
      factor: ageAdjustment.factor,
      description: ageAdjustment.description,
      adjustedAmount: Math.round(adjustedPremium)
    },
    minimumPremium,
    finalBasePremium: Math.round(finalBasePremium),
    levies: {
      policyholdersFund: Math.round(levies.policyholdersFund),
      trainingLevy: Math.round(levies.trainingLevy),
      stampDuty: levies.stampDuty,
      total: Math.round(levies.total)
    },
    totalPremium: Math.round(totalPremium),
    // Audit information
    calculationMetadata: {
      insurerRef: insurer.id,
      insuranceType,
      vehicleCategory,
      calculationDate: new Date().toISOString(),
      rateSource: 'Official Underwriter Binder Documents',
      minimumApplied: finalBasePremium > adjustedPremium
    }
  };
  
  return breakdown;
};

/**
 * Get the appropriate insurance rate for insurer, type, and category
 * @param {Object} insurer - Insurer configuration
 * @param {string} insuranceType - Type of insurance
 * @param {string} vehicleCategory - Vehicle category
 * @returns {number} Insurance rate percentage
 */
const getInsurerRate = (insurer, insuranceType, vehicleCategory) => {
  // Handle different rate structures
  if (insuranceType === 'TOR') {
    if (insurer.torRates) {
      switch (vehicleCategory.toLowerCase()) {
        case 'private':
          return insurer.torRates.privateVehicle || insurer.rate;
        case 'commercial':
          return insurer.torRates.commercial || insurer.rate * 1.2;
        case 'psv':
          return insurer.torRates.psv || insurer.rate * 1.5;
        default:
          return insurer.torRates.privateVehicle || insurer.rate;
      }
    }
    return insurer.rate;
  }
  
  if (insuranceType === 'Comprehensive') {
    if (insurer.comprehensiveRates) {
      switch (vehicleCategory.toLowerCase()) {
        case 'private':
          return insurer.comprehensiveRates.privateVehicle || insurer.rate * 2.5;
        case 'commercial':
          return insurer.comprehensiveRates.commercial || insurer.rate * 3.0;
        case 'psv':
          return insurer.comprehensiveRates.psv || insurer.rate * 3.5;
        default:
          return insurer.comprehensiveRates.privateVehicle || insurer.rate * 2.5;
      }
    }
    return insurer.rate * 2.5; // Default comprehensive multiplier
  }
  
  if (insuranceType === 'ThirdParty') {
    if (insurer.thirdPartyRates) {
      switch (vehicleCategory.toLowerCase()) {
        case 'private':
          return insurer.thirdPartyRates.privateVehicle || insurer.rate * 0.8;
        case 'commercial':
          return insurer.thirdPartyRates.commercial || insurer.rate;
        case 'psv':
          return insurer.thirdPartyRates.psv || insurer.rate * 1.2;
        default:
          return insurer.thirdPartyRates.privateVehicle || insurer.rate * 0.8;
      }
    }
    return insurer.rate * 0.8; // Default third party multiplier
  }
  
  return insurer.rate;
};

/**
 * Calculate vehicle age adjustment factor
 * @param {number} vehicleAge - Age of vehicle in years
 * @param {Object} pricingLogic - Insurer-specific pricing logic
 * @returns {Object} Age adjustment details
 */
const getVehicleAgeAdjustment = (vehicleAge, pricingLogic) => {
  // Default age factors (industry standard)
  const defaultFactors = [
    { maxAge: 3, factor: 1.2, description: '+20% (New Vehicle)' },
    { maxAge: 8, factor: 1.0, description: 'Standard Rate' },
    { maxAge: 15, factor: 0.9, description: '-10% (Older Vehicle)' },
    { maxAge: Infinity, factor: 0.8, description: '-20% (Very Old Vehicle)' }
  ];
  
  // Use insurer-specific logic if available
  const ageFactors = pricingLogic?.ageFactors || defaultFactors;
  
  // Find the appropriate age bracket
  const ageBracket = ageFactors.find(bracket => vehicleAge <= bracket.maxAge);
  
  return ageBracket || defaultFactors[defaultFactors.length - 1];
};

/**
 * Get minimum premium for insurer and insurance type
 * @param {Object} insurer - Insurer configuration
 * @param {string} insuranceType - Type of insurance
 * @param {string} vehicleCategory - Vehicle category
 * @returns {number} Minimum premium amount
 */
const getMinimumPremium = (insurer, insuranceType, vehicleCategory) => {
  if (insuranceType === 'TOR') {
    return insurer.torRates?.baseMinimum || insurer.baseMinimum || 5000;
  }
  
  if (insuranceType === 'Comprehensive') {
    return insurer.comprehensiveRates?.baseMinimum || insurer.baseMinimum * 2 || 15000;
  }
  
  if (insuranceType === 'ThirdParty') {
    return insurer.thirdPartyRates?.baseMinimum || insurer.baseMinimum * 0.8 || 4000;
  }
  
  return insurer.baseMinimum || 5000;
};

/**
 * Calculate statutory levies according to IRA regulations
 * @param {number} basePremium - Base premium amount
 * @param {Object} levyStructure - Insurer-specific levy structure
 * @returns {Object} Detailed levy breakdown
 */
const calculateStatutoryLevies = (basePremium, levyStructure) => {
  // IRA mandated statutory levies (fixed by law)
  const defaultLevies = {
    policyholdersFund: 0.25,    // 0.25% - Policyholders Protection Fund
    trainingLevy: 0.2,          // 0.2% - Insurance Industry Training Fund
    stampDuty: 40               // KSh 40 - Government stamp duty (fixed)
  };
  
  // Use insurer-specific structure or defaults
  const levies = { ...defaultLevies, ...levyStructure };
  
  const policyholdersFund = basePremium * (levies.policyholdersFund / 100);
  const trainingLevy = basePremium * (levies.trainingLevy / 100);
  const stampDuty = levies.stampDuty;
  
  return {
    policyholdersFund,
    trainingLevy,
    stampDuty,
    total: policyholdersFund + trainingLevy + stampDuty,
    breakdown: {
      policyholdersFundRate: levies.policyholdersFund,
      trainingLevyRate: levies.trainingLevy,
      stampDutyFixed: levies.stampDuty
    }
  };
};

/**
 * Validate if vehicle is eligible for insurance with specific insurer
 * @param {number} vehicleAge - Age of vehicle in years
 * @param {Object} insurer - Insurer configuration
 * @param {string} insuranceType - Type of insurance
 * @returns {Object} Eligibility result
 */
const validateVehicleEligibility = (vehicleAge, insurer, insuranceType = 'TOR') => {
  let maxAge;
  
  // Get maximum age limits
  if (insuranceType === 'TOR') {
    maxAge = insurer.torRates?.maxVehicleAge || insurer.maxVehicleAge || 20;
  } else if (insuranceType === 'Comprehensive') {
    maxAge = insurer.comprehensiveRates?.maxVehicleAge || insurer.maxVehicleAge || 15;
  } else {
    maxAge = insurer.maxVehicleAge || 20;
  }
  
  const isEligible = vehicleAge <= maxAge;
  
  return {
    isEligible,
    maxAge,
    vehicleAge,
    message: isEligible 
      ? 'Vehicle is eligible for insurance'
      : `Vehicle is too old. Maximum age allowed: ${maxAge} years`
  };
};

/**
 * Compare premiums across multiple insurers
 * @param {Object} calculationParams - Base calculation parameters
 * @param {Array} insurers - Array of insurer configurations
 * @returns {Array} Sorted comparison results
 */
const compareInsurerPremiums = (calculationParams, insurers) => {
  const comparisons = insurers.map(insurer => {
    try {
      // Check eligibility first
      const eligibility = validateVehicleEligibility(
        calculationParams.vehicleAge,
        insurer,
        calculationParams.insuranceType
      );
      
      if (!eligibility.isEligible) {
        return {
          insurer,
          eligible: false,
          reason: eligibility.message,
          premium: null
        };
      }
      
      // Calculate premium
      const calculation = calculateMotorPremium({
        ...calculationParams,
        insurer
      });
      
      return {
        insurer,
        eligible: true,
        premium: calculation.totalPremium,
        breakdown: calculation,
        savings: null // Will be calculated after sorting
      };
    } catch (error) {
      return {
        insurer,
        eligible: false,
        reason: `Calculation error: ${error.message}`,
        premium: null
      };
    }
  });
  
  // Sort by premium (lowest first) and calculate savings
  const sortedComparisons = comparisons
    .filter(comp => comp.eligible)
    .sort((a, b) => a.premium - b.premium);
  
  // Calculate savings compared to highest premium
  if (sortedComparisons.length > 1) {
    const highestPremium = sortedComparisons[sortedComparisons.length - 1].premium;
    sortedComparisons.forEach(comp => {
      comp.savings = highestPremium - comp.premium;
      comp.savingsPercentage = ((comp.savings / highestPremium) * 100).toFixed(1);
    });
  }
  
  // Add ineligible insurers at the end
  const ineligibleComparisons = comparisons.filter(comp => !comp.eligible);
  
  return [...sortedComparisons, ...ineligibleComparisons];
};

/**
 * Generate human-readable premium explanation
 * @param {Object} breakdown - Premium breakdown from calculateMotorPremium
 * @returns {Array} Array of explanation steps
 */
const generatePremiumExplanation = (breakdown) => {
  const steps = [];
  
  // Step 1: Base calculation
  steps.push({
    step: 1,
    title: 'Base Premium Calculation',
    description: `Vehicle Value × Insurance Rate: KSh ${breakdown.vehicleValue.toLocaleString()} × ${breakdown.baseRate}%`,
    amount: breakdown.basePremium,
    formula: `${breakdown.vehicleValue} × ${breakdown.baseRate}% = KSh ${breakdown.basePremium.toLocaleString()}`
  });
  
  // Step 2: Age adjustment
  if (breakdown.ageAdjustment.factor !== 1.0) {
    steps.push({
      step: 2,
      title: 'Vehicle Age Adjustment',
      description: `${breakdown.ageAdjustment.description} applied for ${breakdown.vehicleAge}-year-old vehicle`,
      amount: breakdown.ageAdjustment.adjustedAmount - breakdown.basePremium,
      formula: `KSh ${breakdown.basePremium.toLocaleString()} × ${breakdown.ageAdjustment.factor} = KSh ${breakdown.ageAdjustment.adjustedAmount.toLocaleString()}`
    });
  }
  
  // Step 3: Minimum premium check
  if (breakdown.calculationMetadata.minimumApplied) {
    steps.push({
      step: steps.length + 1,
      title: 'Minimum Premium Applied',
      description: `Underwriter minimum premium of KSh ${breakdown.minimumPremium.toLocaleString()} applied`,
      amount: breakdown.finalBasePremium - breakdown.ageAdjustment.adjustedAmount,
      formula: `Applied minimum: KSh ${breakdown.minimumPremium.toLocaleString()}`
    });
  }
  
  // Step 4: Statutory levies
  steps.push({
    step: steps.length + 1,
    title: 'IRA Statutory Levies',
    description: 'Insurance Regulatory Authority mandated charges',
    amount: breakdown.levies.total,
    formula: `Policyholders Fund + Training Levy + Stamp Duty = KSh ${breakdown.levies.total.toLocaleString()}`,
    breakdown: [
      `Policyholders Fund (0.25%): KSh ${breakdown.levies.policyholdersFund.toLocaleString()}`,
      `Training Levy (0.2%): KSh ${breakdown.levies.trainingLevy.toLocaleString()}`,
      `Stamp Duty (Fixed): KSh ${breakdown.levies.stampDuty.toLocaleString()}`
    ]
  });
  
  return steps;
};

// Export individual utility functions for use in other components
export {
  calculateMotorPremium,
  calculateStatutoryLevies,
  validateVehicleEligibility,
  compareInsurerPremiums,
  generatePremiumExplanation
};

const PremiumCalculator = ({ 
  formData, 
  insuranceDuration, 
  preferredInsurer 
}) => {
  const calculatePremiumBreakdown = () => {
    if (!formData.vehicleValue || !formData.yearOfManufacture || 
        !formData.usageType || !insuranceDuration) {
      return null;
    }

    try {
      const vehicleValue = parseFloat(formData.vehicleValue) || 0;
      const year = parseInt(formData.yearOfManufacture) || new Date().getFullYear();
      const currentYear = new Date().getFullYear();
      const vehicleAge = currentYear - year;
      
      // Create insurer configuration based on preferred insurer
      const insurerConfig = createInsurerConfig(preferredInsurer, formData.usageType);
      
      // Use the enhanced business logic for premium calculation
      const calculation = calculateMotorPremium({
        vehicleValue,
        vehicleAge,
        insurer: insurerConfig,
        insuranceType: 'TOR',
        vehicleCategory: getVehicleCategory(formData.usageType)
      });
      
      // Apply duration adjustment
      const durationOptions = {
        '90 Days': 0.3,
        '180 Days': 0.6,
        '365 Days (1 Year)': 1.0
      };
      const durationMultiplier = durationOptions[insuranceDuration] || 1.0;
      
      // Adjust all amounts for duration
      const adjustedCalculation = {
        ...calculation,
        finalBasePremium: Math.round(calculation.finalBasePremium * durationMultiplier),
        totalPremium: Math.round(calculation.totalPremium * durationMultiplier),
        durationMultiplier,
        durationDescription: insuranceDuration
      };
      
      return adjustedCalculation;
    } catch (error) {
      console.error('Premium calculation error:', error);
      return null;
    }
  };

  // Helper function to create insurer configuration
  const createInsurerConfig = (insurerName, usageType) => {
    const baseInsurerConfigs = {
      'Jubilee Insurance': {
        id: 'jubilee',
        name: 'Jubilee Insurance',
        rate: 2.5,
        baseMinimum: 5000,
        maxVehicleAge: 20
      },
      'CIC Insurance': {
        id: 'cic',
        name: 'CIC Insurance',
        rate: 2.3,
        baseMinimum: 4800,
        maxVehicleAge: 18
      },
      'APA Insurance': {
        id: 'apa',
        name: 'APA Insurance',
        rate: 2.6,
        baseMinimum: 5200,
        maxVehicleAge: 20
      },
      'ICEA Lion': {
        id: 'icea',
        name: 'ICEA Lion',
        rate: 2.4,
        baseMinimum: 4900,
        maxVehicleAge: 19
      },
      'Heritage Insurance': {
        id: 'heritage',
        name: 'Heritage Insurance',
        rate: 2.55,
        baseMinimum: 5100,
        maxVehicleAge: 20
      }
    };
    
    // Default insurer if not found
    const defaultInsurer = {
      id: 'default',
      name: 'Standard Insurer',
      rate: 2.5,
      baseMinimum: 5000,
      maxVehicleAge: 20
    };
    
    const baseConfig = baseInsurerConfigs[insurerName] || defaultInsurer;
    
    // Add TOR-specific rates and usage multipliers
    return {
      ...baseConfig,
      torRates: {
        privateVehicle: baseConfig.rate,
        commercial: baseConfig.rate * 1.2,
        psv: baseConfig.rate * 1.5,
        baseMinimum: baseConfig.baseMinimum
      },
      pricingLogic: {
        ageFactors: [
          { maxAge: 3, factor: 1.3, description: '+30% (New Vehicle)' },
          { maxAge: 8, factor: 1.0, description: 'Standard Rate' },
          { maxAge: 15, factor: 0.9, description: '-10% (Older Vehicle)' },
          { maxAge: Infinity, factor: 0.8, description: '-20% (Very Old Vehicle)' }
        ]
      },
      statutoryLevies: {
        policyholdersFund: 0.25,
        trainingLevy: 0.2,
        stampDuty: 40
      }
    };
  };

  // Helper function to determine vehicle category
  const getVehicleCategory = (usageType) => {
    const categoryMapping = {
      'Private Use': 'Private',
      'Commercial Use': 'Commercial',
      'Public Service Vehicle': 'PSV',
      'Taxi': 'Commercial',
      'School Bus': 'PSV',
      'Matatu': 'PSV'
    };
    
    return categoryMapping[usageType] || 'Private';
  };

  const premiumData = calculatePremiumBreakdown();

  const getRiskLevel = () => {
    if (!formData.usageType || !formData.vehicleValue) return 'Unknown';
    
    const vehicleValue = parseFloat(formData.vehicleValue) || 0;
    const usageRisk = formData.riskLevel || 'Medium';
    const valueRisk = vehicleValue > 3000000 ? 'High' : vehicleValue > 1500000 ? 'Medium' : 'Low';
    
    if (usageRisk === 'Very High' || (usageRisk === 'High' && valueRisk === 'High')) {
      return 'Very High';
    } else if (usageRisk === 'High' || valueRisk === 'High') {
      return 'High';
    } else if (usageRisk === 'Medium' || valueRisk === 'Medium') {
      return 'Medium';
    } else {
      return 'Low';
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return Colors.success;
      case 'Medium': return Colors.warning;
      case 'High': return Colors.error;
      case 'Very High': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  if (!premiumData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Premium Calculator</Text>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Complete vehicle details to see premium calculation
          </Text>
          <Text style={styles.placeholderSubtext}>
            Please fill in vehicle value, year of manufacture, and insurance duration to calculate your premium.
          </Text>
        </View>
      </View>
    );
  }

  const riskLevel = getRiskLevel();
  const explanationSteps = generatePremiumExplanation(premiumData);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Premium Calculation</Text>
      <Text style={styles.subtitle}>
        Detailed breakdown using official underwriter rates
      </Text>

      {/* Premium Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Total Premium</Text>
          <Text style={styles.summaryAmount}>KES {premiumData.totalPremium.toLocaleString()}</Text>
        </View>
        
        <View style={styles.summaryDetails}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>{premiumData.durationDescription}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Risk Level:</Text>
            <Text style={[styles.summaryValue, { color: getRiskColor(riskLevel) }]}>
              {riskLevel}
            </Text>
          </View>
          {preferredInsurer && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Insurer:</Text>
              <Text style={styles.summaryValue}>{preferredInsurer}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Rate:</Text>
            <Text style={styles.summaryValue}>{premiumData.baseRate}%</Text>
          </View>
        </View>
      </View>

      {/* Vehicle Information Card */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Vehicle Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoValue}>{formData.makeModel || 'Not specified'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Value</Text>
            <Text style={styles.infoValue}>KES {premiumData.vehicleValue.toLocaleString()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{premiumData.vehicleAge} years</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Usage</Text>
            <Text style={styles.infoValue}>{formData.usageType}</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Premium Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.cardTitle}>Premium Calculation Steps</Text>
        
        {explanationSteps.map((step, index) => (
          <View key={index} style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <Text style={styles.breakdownLabel}>{step.title}</Text>
              <Text style={styles.breakdownDescription}>{step.description}</Text>
              {step.breakdown && step.breakdown.map((item, itemIndex) => (
                <Text key={itemIndex} style={styles.breakdownSubItem}>• {item}</Text>
              ))}
            </View>
            <View style={styles.breakdownRight}>
              <Text style={styles.breakdownAmount}>
                KES {step.amount.toLocaleString()}
              </Text>
              {step.formula && (
                <Text style={styles.breakdownFormula}>{step.formula}</Text>
              )}
            </View>
          </View>
        ))}
        
        {/* Duration Adjustment */}
        {premiumData.durationMultiplier !== 1.0 && (
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <Text style={styles.breakdownLabel}>Duration Adjustment</Text>
              <Text style={styles.breakdownDescription}>
                {premiumData.durationDescription} coverage period
              </Text>
            </View>
            <View style={styles.breakdownRight}>
              <Text style={styles.breakdownFactor}>×{premiumData.durationMultiplier}</Text>
              <Text style={styles.breakdownAmount}>
                KES {premiumData.totalPremium.toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.breakdownTotal}>
          <Text style={styles.breakdownTotalLabel}>Final Premium</Text>
          <Text style={styles.breakdownTotalAmount}>KES {premiumData.totalPremium.toLocaleString()}</Text>
        </View>
      </View>

      {/* Calculation Metadata */}
      <View style={styles.metadataCard}>
        <Text style={styles.cardTitle}>Calculation Details</Text>
        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Rate Source:</Text>
          <Text style={styles.metadataValue}>{premiumData.calculationMetadata.rateSource}</Text>
        </View>
        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Minimum Applied:</Text>
          <Text style={styles.metadataValue}>
            {premiumData.calculationMetadata.minimumApplied ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Calculation Date:</Text>
          <Text style={styles.metadataValue}>
            {new Date(premiumData.calculationMetadata.calculationDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Risk Factors */}
      <View style={styles.riskCard}>
        <Text style={styles.cardTitle}>Risk Assessment</Text>
        <View style={styles.riskLevel}>
          <Text style={styles.riskLevelLabel}>Overall Risk Level:</Text>
          <Text style={[styles.riskLevelValue, { color: getRiskColor(riskLevel) }]}>
            {riskLevel}
          </Text>
        </View>
        
        <View style={styles.riskFactors}>
          <View style={styles.riskFactor}>
            <Text style={styles.riskFactorLabel}>Vehicle Value</Text>
            <Text style={styles.riskFactorValue}>
              {premiumData.vehicleValue > 3000000 ? 'High Value' : 
               premiumData.vehicleValue > 1500000 ? 'Medium Value' : 'Standard Value'}
            </Text>
          </View>
          <View style={styles.riskFactor}>
            <Text style={styles.riskFactorLabel}>Vehicle Age</Text>
            <Text style={styles.riskFactorValue}>
              {premiumData.ageAdjustment.description.replace(/[+\-]\d+%\s*/, '')}
            </Text>
          </View>
          <View style={styles.riskFactor}>
            <Text style={styles.riskFactorLabel}>Usage Type</Text>
            <Text style={[styles.riskFactorValue, { color: getRiskColor(formData.riskLevel) }]}>
              {formData.riskLevel || 'Medium'} Risk
            </Text>
          </View>
          <View style={styles.riskFactor}>
            <Text style={styles.riskFactorLabel}>Insurance Rate</Text>
            <Text style={styles.riskFactorValue}>
              {premiumData.baseRate}% of vehicle value
            </Text>
          </View>
        </View>
      </View>

      {/* Coverage Information */}
      <View style={styles.coverageCard}>
        <Text style={styles.cardTitle}>Coverage Information</Text>
        <Text style={styles.coverageDescription}>
          This motor insurance policy covers third-party liability as required by Kenyan law. 
          Additional coverage options may be available.
        </Text>
        
        <View style={styles.coverageItems}>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageItemIcon}>✓</Text>
            <Text style={styles.coverageItemText}>Third-party liability coverage</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageItemIcon}>✓</Text>
            <Text style={styles.coverageItemText}>Legal compliance certificate</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageItemIcon}>✓</Text>
            <Text style={styles.coverageItemText}>24/7 claims support</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageItemIcon}>✓</Text>
            <Text style={styles.coverageItemText}>Nationwide coverage</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  placeholderContainer: {
    backgroundColor: Colors.lightGray,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  placeholderSubtext: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  summaryDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  breakdownCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  breakdownLeft: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  breakdownDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownFactor: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  breakdownAmount: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
  },
  breakdownFormula: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  breakdownSubItem: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  breakdownAmountPositive: {
    color: Colors.error,
  },
  breakdownAmountNegative: {
    color: Colors.success,
  },
  breakdownAmountNeutral: {
    color: Colors.textSecondary,
  },
  metadataCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  metadataLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  metadataValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  breakdownTotalLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  breakdownTotalAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  riskCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  riskLevel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  riskLevelLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  riskLevelValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  riskFactors: {
    gap: Spacing.sm,
  },
  riskFactor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  riskFactorLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  riskFactorValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  coverageCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coverageDescription: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  coverageItems: {
    gap: Spacing.sm,
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverageItemIcon: {
    fontSize: Typography.fontSize.md,
    color: Colors.success,
    marginRight: Spacing.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  coverageItemText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
  },
});

export default PremiumCalculator;
