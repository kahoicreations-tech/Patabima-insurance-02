/**
 * Commercial Premium Calculator
 * Handles premium calculations for commercial vehicle insurance
 * Based on official underwriter documentation from Sanlam, Monarch, and others
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';

// Base premium rates for commercial vehicles from official underwriter documentation
const COMMERCIAL_BASE_RATES = {
  // Third Party rates by commercial category
  third_party: {
    // General cartage rates
    general_cartage: {
      light: 25000,    // Up to 3.5 tons - min premium 25,000
      medium: 35000,   // 3.5 - 7.5 tons - min premium 35,000
      heavy: 50000     // Above 7.5 tons - min premium 50,000
    },
    // Own goods rates
    own_goods: {
      light: 20000,    // Up to 3.5 tons - min premium 20,000
      medium: 28000,   // 3.5 - 7.5 tons - min premium 28,000
      heavy: 40000     // Above 7.5 tons - min premium 40,000
    },
    // Special type rates
    special_type: {
      mobile_crane: 60000,
      earth_mover: 45000,
      fork_lift: 30000,
      agricultural: 25000,
      construction: 35000,
      other_special: 40000
    }
  },
  
  // Comprehensive rates based on Sanlam binder terms
  comprehensive: {
    // Official Sanlam rates from binder document:
    // 4.0% for showroom/zero mileage vehicles (0-5 years)
    // 4.5% for vehicles 5-15 years old
    // Min premium of KSh 30,000 per vehicle

    // General cartage comprehensive rates (Sanlam binder terms)
    general_cartage: {
      // For vehicles 0-5 years old
      new_vehicle: 0.04,  // 4.0% with excess protector
      // For vehicles 5-15 years old
      older_vehicle: 0.045, // 4.5% with excess protector
      min_premium: 30000, // Minimum basic premium KSh 30,000
    },
    
    // Own goods comprehensive rates (similar structure)
    own_goods: {
      new_vehicle: 0.04,  // 4.0% with excess protector
      older_vehicle: 0.045, // 4.5% with excess protector
      min_premium: 30000, // Minimum basic premium KSh 30,000
    },
    
    // Special type comprehensive rates
    special_type: {
      new_vehicle: 0.045,  // 4.5% with excess protector (slightly higher for special types)
      older_vehicle: 0.05, // 5.0% with excess protector
      min_premium: 35000, // Minimum basic premium KSh 35,000
    }
  }
};

// Weight categories for commercial vehicles
const getWeightCategory = (grossWeight) => {
  const weight = parseInt(grossWeight) || 3500;
  if (weight <= 3500) return 'light';
  if (weight <= 7500) return 'medium';
  return 'heavy';
};

// Usage pattern multipliers
const USAGE_MULTIPLIERS = {
  'urban_delivery': 1.0,
  'long_distance_haulage': 1.3,
  'construction_sites': 1.4,
  'agricultural_use': 0.9,
  'mixed_urban_highway': 1.1,
  'specialized_operations': 1.2,
  'other': 1.0
};

// Age multipliers for commercial vehicles
const getAgeMultiplier = (vehicleAge) => {
  if (vehicleAge <= 3) return 1.0;
  if (vehicleAge <= 5) return 1.1;
  if (vehicleAge <= 10) return 1.2;
  if (vehicleAge <= 15) return 1.3;
  return 1.5; // Very old vehicles
};

// Brand multipliers
const getBrandMultiplier = (vehicleMake) => {
  const premiumBrands = ['mercedes-benz', 'scania', 'volvo', 'man', 'daf'];
  const standardBrands = ['isuzu', 'mitsubishi', 'toyota', 'nissan', 'hino'];
  
  const make = vehicleMake.toLowerCase();
  
  if (premiumBrands.includes(make)) return 1.2;
  if (standardBrands.includes(make)) return 1.0;
  return 0.9; // Other/budget brands
};

// Mileage multipliers
const getMileageMultiplier = (annualMileage) => {
  const mileage = parseInt(annualMileage) || 30000;
  if (mileage <= 20000) return 0.9;
  if (mileage <= 50000) return 1.0;
  if (mileage <= 80000) return 1.2;
  return 1.4; // Very high mileage
};

/**
 * Calculate Third Party Premium for Commercial Vehicles
 */
export const calculateCommercialThirdPartyPremium = (vehicleData) => {
  try {
    const {
      commercialCategory = 'general_cartage',
      commercialSubCategory = 'light commercial',
      grossWeight = '3500',
      usagePattern = 'urban_delivery',
      vehicleMake = 'isuzu',
      vehicleAge = 5,
      annualMileage = '30000'
    } = vehicleData;

    // Determine base rate
    const weightCategory = getWeightCategory(grossWeight);
    const categoryKey = commercialCategory.replace(/\s+/g, '_').toLowerCase();
    const subCategoryKey = commercialSubCategory.replace(/\s+/g, '_').toLowerCase();
    
    let basePremium = 25000; // Default fallback
    
    if (COMMERCIAL_BASE_RATES.third_party[categoryKey]) {
      if (categoryKey === 'special_type') {
        basePremium = COMMERCIAL_BASE_RATES.third_party[categoryKey][subCategoryKey] || 
                     COMMERCIAL_BASE_RATES.third_party[categoryKey]['other_special'];
      } else {
        basePremium = COMMERCIAL_BASE_RATES.third_party[categoryKey][weightCategory] || 25000;
      }
    }

    // Apply multipliers
    const usageMultiplier = USAGE_MULTIPLIERS[usagePattern.replace(/\s+/g, '_').toLowerCase()] || 1.0;
    const ageMultiplier = getAgeMultiplier(vehicleAge);
    const brandMultiplier = getBrandMultiplier(vehicleMake);
    const mileageMultiplier = getMileageMultiplier(annualMileage);

    const calculatedPremium = basePremium * usageMultiplier * ageMultiplier * brandMultiplier * mileageMultiplier;

    // Minimum premium threshold
    const minimumPremium = 15000;
    const finalPremium = Math.max(calculatedPremium, minimumPremium);

    return {
      basePremium,
      usageMultiplier,
      ageMultiplier,
      brandMultiplier,
      mileageMultiplier,
      calculatedPremium,
      totalPremium: Math.round(finalPremium),
      breakdown: {
        base: basePremium,
        usage_adjustment: Math.round((usageMultiplier - 1) * basePremium),
        age_adjustment: Math.round((ageMultiplier - 1) * basePremium),
        brand_adjustment: Math.round((brandMultiplier - 1) * basePremium),
        mileage_adjustment: Math.round((mileageMultiplier - 1) * basePremium)
      }
    };

  } catch (error) {
    console.error('Error calculating commercial third party premium:', error);
    return {
      totalPremium: 25000,
      error: 'Calculation error, using default premium'
    };
  }
};

/**
 * Calculate Comprehensive Premium for Commercial Vehicles
 * Based on official Sanlam underwriter binder terms for commercial motor vehicles
 */
export const calculateCommercialComprehensivePremium = (vehicleData) => {
  try {
    const {
      commercialCategory = 'general_cartage',
      commercialSubCategory = '',
      vehicleValue = '2000000',
      grossWeight = '3500',
      usagePattern = 'urban_delivery',
      vehicleMake = 'isuzu',
      vehicleAge = 5,
      annualMileage = '30000',
      accessoriesValue = '0',
      goodsInTransitValue = '0',
      hasTracking = false,
      hasFleetManagement = false,
      hasAntiTheft = false,
      selectedAddons = []
    } = vehicleData;

    const baseVehicleValue = parseFloat(vehicleValue.toString().replace(/[^0-9.]/g, '')) || 2000000;
    const accessories = parseFloat(accessoriesValue.toString().replace(/[^0-9.]/g, '')) || 0;
    const totalVehicleValue = baseVehicleValue + accessories;

    // Determine category key for rate lookup
    const categoryKey = commercialCategory.replace(/\s+/g, '_').toLowerCase();
    
    // Get appropriate rate based on vehicle age as per Sanlam binder terms
    // 4.0% for showroom/zero mileage vehicles (0-5 years)
    // 4.5% for vehicles 5-15 years old
    let baseRate;
    let ageDescription;
    
    // Default to general_cartage if category not found
    const categoryRates = COMMERCIAL_BASE_RATES.comprehensive[categoryKey] || 
                         COMMERCIAL_BASE_RATES.comprehensive.general_cartage;
    
    if (vehicleAge <= 5) {
      baseRate = categoryRates.new_vehicle;
      ageDescription = 'New Vehicle (0-5 years)';
    } else {
      baseRate = categoryRates.older_vehicle;
      ageDescription = 'Used Vehicle (5-15 years)';
    }
    
    // Apply minimum value requirements (Sanlam requires min KSh 750,000)
    if (totalVehicleValue < 750000) {
      throw new Error('Vehicle value below minimum insurable value of KSh 750,000');
    }

    // Apply maximum age requirements (Sanlam requires max 15 years)
    if (vehicleAge > 15) {
      throw new Error('Vehicle exceeds maximum age limit of 15 years');
    }

    // Calculate base premium
    let basePremium = totalVehicleValue * baseRate;

    // Calculate Political Violence/Terrorism premium if selected (0.35% of sum insured)
    let pvtPremium = 0;
    if (selectedAddons.includes('political_violence')) {
      pvtPremium = totalVehicleValue * 0.0035; // 0.35%
      pvtPremium = Math.max(pvtPremium, 5000); // Minimum KSh 5,000
    }

    // Calculate Excess Protector premium if selected
    let excessProtectorPremium = 0;
    if (selectedAddons.includes('excess_protector')) {
      excessProtectorPremium = Math.max(5000, totalVehicleValue * 0.0025); // Min KSh 5,000
    }

    // Calculate Goods In Transit premium if selected
    let goodsInTransitPremium = 0;
    if (selectedAddons.includes('goods_in_transit')) {
      const goodsValue = parseFloat(goodsInTransitValue.toString().replace(/[^0-9.]/g, '')) || 0;
      goodsInTransitPremium = goodsValue * 0.005; // 0.5% of goods value
    }

    // Calculate Driver PA Cover if selected
    let driverPAPremium = 0;
    if (selectedAddons.includes('driver_pa')) {
      driverPAPremium = 2500; // Fixed rate for driver PA
    }

    // Apply anti-theft discount for vehicles with tracking devices
    let theftRateAdjustment = 0;
    let theftDescription = '';
    
    if (hasTracking || hasFleetManagement) {
      // Tracking device reduces theft excess to 2.5% of value
      theftRateAdjustment = -0.005; // -0.5% discount
      theftDescription = 'Tracking device installed (reduced theft excess)';
    } else if (hasAntiTheft) {
      // Anti-theft device reduces theft excess to 10% of value
      theftRateAdjustment = -0.0025; // -0.25% discount
      theftDescription = 'Anti-theft device installed';
    }

    const adjustedBasePremium = basePremium * (1 + theftRateAdjustment);
    
    // Calculate total premium including add-ons
    const totalCalculatedPremium = adjustedBasePremium + 
                                  pvtPremium + 
                                  excessProtectorPremium + 
                                  goodsInTransitPremium +
                                  driverPAPremium;

    // Apply minimum premium threshold as per Sanlam binder terms (KSh 30,000)
    const minimumPremium = categoryRates.min_premium || 30000;
    const finalPremium = Math.max(totalCalculatedPremium, minimumPremium);

    // Calculate statutory levies (as per IRA regulations)
    const policyholdersFund = finalPremium * 0.002; // 0.2%
    const trainingLevy = finalPremium * 0.002; // 0.2%
    const stampDuty = 40; // Fixed KSh 40
    const totalLevies = policyholdersFund + trainingLevy + stampDuty;
    
    // Calculate final premium with levies
    const finalTotalPremium = finalPremium + totalLevies;
    
    // Determine excess amounts
    // As per Sanlam commercial binder terms
    const ownDamageExcess = Math.min(250000, Math.max(50000, totalVehicleValue * 0.05));
    const thirdPartyExcess = 10000;
    
    let theftExcess;
    if (hasTracking || hasFleetManagement) {
      theftExcess = Math.max(25000, totalVehicleValue * 0.025); // 2.5% with tracking
    } else if (hasAntiTheft) {
      theftExcess = Math.max(25000, totalVehicleValue * 0.1); // 10% with anti-theft
    } else {
      theftExcess = Math.max(25000, totalVehicleValue * 0.2); // 20% without anti-theft
    }
    
    // Apply minimum premium rule
    const minimumApplied = totalCalculatedPremium < minimumPremium;
    
    return {
      baseRate,
      vehicleValue: totalVehicleValue,
      vehicleAge,
      ageDescription,
      basePremium: Math.round(basePremium),
      adjustedBasePremium: Math.round(adjustedBasePremium),
      securityDiscount: {
        applied: theftRateAdjustment !== 0,
        description: theftDescription,
        amount: Math.round(basePremium * theftRateAdjustment)
      },
      addons: {
        politicalViolence: Math.round(pvtPremium),
        excessProtector: Math.round(excessProtectorPremium),
        goodsInTransit: Math.round(goodsInTransitPremium),
        driverPA: Math.round(driverPAPremium),
        total: Math.round(pvtPremium + excessProtectorPremium + goodsInTransitPremium + driverPAPremium)
      },
      minimumPremium: {
        threshold: minimumPremium,
        applied: minimumApplied,
        difference: minimumApplied ? Math.round(minimumPremium - totalCalculatedPremium) : 0
      },
      excess: {
        ownDamage: Math.round(ownDamageExcess),
        thirdParty: thirdPartyExcess,
        theft: Math.round(theftExcess)
      },
      levies: {
        policyholdersFund: Math.round(policyholdersFund),
        trainingLevy: Math.round(trainingLevy),
        stampDuty,
        total: Math.round(totalLevies)
      },
      netPremium: Math.round(finalPremium),
      totalPremium: Math.round(finalTotalPremium),
      breakdown: {
        description: `Commercial ${commercialCategory} Vehicle Comprehensive Insurance`,
        ageRate: `${(baseRate * 100).toFixed(2)}% (${ageDescription})`,
        baseCalculation: `${(baseRate * 100).toFixed(2)}% of KSh ${totalVehicleValue.toLocaleString()}`,
        basePremium: Math.round(basePremium),
        securityDiscount: Math.round(basePremium * theftRateAdjustment),
        adjustedBasePremium: Math.round(adjustedBasePremium),
        addons: selectedAddons.map(addon => {
          if (addon === 'political_violence') 
            return `Political Violence/Terrorism: KSh ${Math.round(pvtPremium).toLocaleString()}`;
          if (addon === 'excess_protector') 
            return `Excess Protector: KSh ${Math.round(excessProtectorPremium).toLocaleString()}`;
          if (addon === 'goods_in_transit') 
            return `Goods in Transit: KSh ${Math.round(goodsInTransitPremium).toLocaleString()}`;
          if (addon === 'driver_pa') 
            return `Driver PA Cover: KSh ${Math.round(driverPAPremium).toLocaleString()}`;
          return '';
        }).filter(item => item !== ''),
        minimumPremiumAdjustment: minimumApplied ? 
          `Minimum Premium Applied: +KSh ${Math.round(minimumPremium - totalCalculatedPremium).toLocaleString()}` : '',
        netPremium: Math.round(finalPremium),
        leviesBreakdown: [
          `Policyholders Compensation Fund (0.2%): KSh ${Math.round(policyholdersFund).toLocaleString()}`,
          `Training Levy (0.2%): KSh ${Math.round(trainingLevy).toLocaleString()}`,
          `Stamp Duty: KSh ${stampDuty}`
        ],
        totalPremium: Math.round(finalTotalPremium)
      }
    };

  } catch (error) {
    console.error('Error calculating commercial comprehensive premium:', error);
    return {
      totalPremium: 50000,
      error: 'Calculation error, using default premium'
    };
  }
};

/**
 * General Commercial Premium Calculator
 */
export const calculateCommercialPremium = (vehicleData, coverageType = 'third_party') => {
  if (coverageType === 'comprehensive') {
    return calculateCommercialComprehensivePremium(vehicleData);
  } else {
    return calculateCommercialThirdPartyPremium(vehicleData);
  }
};

/**
 * Validate Commercial Vehicle Eligibility based on underwriter requirements
 */
export const validateCommercialVehicleEligibility = (vehicleData, insuranceType = 'comprehensive') => {
  // Extract and validate data
  const vehicleAge = parseInt(vehicleData.vehicleAge) || 0;
  const vehicleValue = parseFloat(vehicleData.vehicleValue?.toString().replace(/[^0-9.]/g, '')) || 0;
  
  // Default eligibility
  let eligible = true;
  let reason = '';
  
  // According to Sanlam binder terms for commercial vehicles
  if (insuranceType === 'comprehensive') {
    // Comprehensive coverage restrictions
    
    // 1. Maximum age is 15 years (Sanlam binder terms)
    if (vehicleAge > 15) {
      eligible = false;
      reason = 'Vehicle exceeds the maximum age limit of 15 years for commercial comprehensive insurance.';
    }
    
    // 2. Minimum sum insured KSh 750,000 (Sanlam binder terms)
    if (vehicleValue < 750000) {
      eligible = false;
      reason = 'Vehicle value must be at least KSh 750,000 for commercial comprehensive insurance.';
    }
  } else {
    // Third Party coverage restrictions
    
    // 1. Maximum age is typically 20 years for third party
    if (vehicleAge > 20) {
      eligible = false;
      reason = 'Vehicle exceeds the maximum age limit of 20 years for commercial third party insurance.';
    }
    
    // 2. Some underwriters may have value restrictions for third party
    if (vehicleValue < 300000) {
      eligible = false;
      reason = 'Vehicle value should be at least KSh 300,000 for commercial third party insurance.';
    }
  }
  
  return {
    eligible: eligible,
    reason: reason,
    
    // Additional info for UI display
    details: {
      ageRequirement: insuranceType === 'comprehensive' ? 
        'Maximum age: 15 years' : 
        'Maximum age: 20 years',
      valueRequirement: insuranceType === 'comprehensive' ? 
        'Minimum value: KSh 750,000' : 
        'Minimum value: KSh 300,000',
      securityRecommendation: 'Anti-theft devices recommended to reduce excess'
    }
  };
};

/**
 * Compare Commercial Insurer Premiums
 */
export const compareCommercialInsurerPremiums = (baseQuote, insurers = []) => {
  return insurers.map(insurer => {
    // Apply insurer-specific adjustments (these would come from actual API)
    let adjustment = 1.0;
    
    switch (insurer.id) {
      case 'jubilee':
        adjustment = 0.95; // 5% discount for commercial specialty
        break;
      case 'britam':
        adjustment = 0.98; // 2% discount
        break;
      case 'apa':
        adjustment = 1.02; // 2% premium but better coverage
        break;
      case 'uap':
        adjustment = 1.00; // Standard rate
        break;
      case 'madison':
        adjustment = 0.96; // 4% discount
        break;
      case 'cic':
        adjustment = 1.01; // 1% premium
        break;
      default:
        adjustment = 1.00;
    }
    
    return {
      ...insurer,
      premium: Math.round(baseQuote.totalPremium * adjustment),
      originalPremium: baseQuote.totalPremium,
      adjustment: Math.round((adjustment - 1) * 100), // Percentage adjustment
      quote: {
        ...baseQuote,
        totalPremium: Math.round(baseQuote.totalPremium * adjustment)
      }
    };
  });
};

/**
 * React Component for Commercial Premium Calculator
 */
const CommercialPremiumCalculator = ({ 
  formData, 
  coverageType, 
  onPremiumCalculated, 
  isCalculating, 
  setIsCalculating 
}) => {
  useEffect(() => {
    if (!formData.vehicleValue || !formData.vehicleCategory) {
      return;
    }

    setIsCalculating(true);

    try {
      let calculatedPremium;
      
      if (coverageType === 'comprehensive') {
        calculatedPremium = calculateCommercialComprehensivePremium(formData);
      } else {
        calculatedPremium = calculateCommercialThirdPartyPremium(formData);
      }

      onPremiumCalculated(calculatedPremium);
    } catch (error) {
      console.error('Premium calculation error:', error);
      onPremiumCalculated(null);
    } finally {
      setIsCalculating(false);
    }
  }, [
    formData.vehicleValue,
    formData.vehicleCategory,
    formData.vehicleWeight,
    formData.vehicleUsage,
    formData.goodsInTransitValue,
    formData.vehicleMake,
    formData.vehicleYear,
    coverageType
  ]);

  // This is a background calculator component - no visible UI
  return <View style={{ display: 'none' }} />;
};

export default CommercialPremiumCalculator;
