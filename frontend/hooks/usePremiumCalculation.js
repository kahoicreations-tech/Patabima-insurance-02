import { useState, useCallback } from 'react';

/**
 * Custom hook for calculating insurance premiums
 */
export const usePremiumCalculation = (selectedVehicleCategory, selectedInsuranceProduct) => {
  const [calculatedPremium, setCalculatedPremium] = useState(null);
  const [showQuote, setShowQuote] = useState(false);

  // Usage Types with risk multipliers
  const usageTypes = [
    { id: 'private', name: 'Private', description: 'Personal use only', riskMultiplier: 1.0 },
    { id: 'personal', name: 'Personal', description: 'Personal family use', riskMultiplier: 1.0 },
    { id: 'commercial', name: 'Commercial', description: 'Business/commercial use', riskMultiplier: 1.3 }
  ];

  // Insurance Duration Options
  const insuranceDurations = [
    { id: '1', name: '1 Month', months: 1, multiplier: 0.15 },
    { id: '3', name: '3 Months', months: 3, multiplier: 0.35 },
    { id: '6', name: '6 Months', months: 6, multiplier: 0.65 },
    { id: '12', name: '1 Year', months: 12, multiplier: 1.0 }
  ];

  // Available Insurers with policy durations
  const insurers = [
    { id: 'cic', name: 'CIC Insurance', logo: '🏢', rating: 4.5, policyDuration: 12, baseRate: 3.5 },
    { id: 'madison', name: 'Madison Insurance', logo: '🏛️', rating: 4.3, policyDuration: 12, baseRate: 3.8 },
    { id: 'jubilee', name: 'Jubilee Insurance', logo: '🏦', rating: 4.4, policyDuration: 12, baseRate: 3.6 },
    { id: 'heritage', name: 'Heritage Insurance', logo: '🏢', rating: 4.2, policyDuration: 6, baseRate: 4.0 },
    { id: 'apollo', name: 'Apollo Insurance', logo: '🏛️', rating: 4.1, policyDuration: 12, baseRate: 3.9 }
  ];

  // Calculate premium based on form data
  const calculatePremium = useCallback((formData) => {
    if (!selectedInsuranceProduct || !formData.vehicleValue || !formData.insurer) {
      return null;
    }

    const selectedInsurer = insurers.find(ins => ins.id === formData.insurer);
    if (!selectedInsurer) return null;

    const vehicleValue = parseFloat(formData.vehicleValue) || 0;
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - parseInt(formData.yearOfManufacture || currentYear);
    
    // Use insurer's base rate instead of product base rate
    let premium = vehicleValue * (selectedInsurer.baseRate / 100);
    
    // Age factor
    if (vehicleAge > 10) premium *= 1.3;
    else if (vehicleAge > 5) premium *= 1.1;
    
    // Engine capacity factor
    const engineCC = parseInt(formData.engineCapacity || 0);
    if (engineCC > 3000) premium *= 1.2;
    else if (engineCC > 2000) premium *= 1.1;
    
    // Usage type factor
    const selectedUsageType = usageTypes.find(type => type.id === formData.usageType);
    if (selectedUsageType) {
      premium *= selectedUsageType.riskMultiplier;
    }
    
    // Claims history factor
    if (formData.claimsHistory === 'Yes') premium *= 1.4;
    
    // Modifications factor
    if (formData.modifications === 'Yes') premium *= 1.15;
    
    // Insurance duration factor
    const selectedDuration = insuranceDurations.find(dur => dur.id === formData.insuranceDuration);
    if (selectedDuration) {
      premium *= selectedDuration.multiplier;
    } else {
      // Fallback to policy period factor (discount for longer periods)
      const periodMonths = selectedInsurer.policyDuration;
      if (periodMonths >= 12) premium *= 0.9; // 10% discount for annual
      else if (periodMonths >= 6) premium *= 0.95; // 5% discount for 6+ months
    }
    
    // Minimum premiums by category
    const minimumPremiums = {
      'private': 15000,
      'commercial': 25000,
      'psv': 35000,
      'motorcycle': 8000,
      'tuktuk': 12000,
      'special': 20000
    };
    
    const minPremium = minimumPremiums[selectedVehicleCategory?.id] || 15000;
    premium = Math.max(premium, minPremium);
    
    // Add statutory fees and levies
    const levies = {
      policyFee: 500,
      stampDuty: 40,
      trainingLevy: premium * 0.002, // 0.2% training levy
      pcf: premium * 0.0025 // 0.25% PCF levy
    };
    
    const totalLevies = Object.values(levies).reduce((sum, levy) => sum + levy, 0);
    const totalPremium = premium + totalLevies;
    
    const calculatedPremium = {
      basicPremium: Math.round(premium),
      levies: Math.round(totalLevies),
      totalPremium: Math.round(totalPremium),
      breakdown: {
        ...levies,
        policyFee: levies.policyFee,
        stampDuty: levies.stampDuty,
        trainingLevy: Math.round(levies.trainingLevy),
        pcf: Math.round(levies.pcf)
      }
    };

    return calculatedPremium;
  }, [selectedVehicleCategory, selectedInsuranceProduct, insurers, usageTypes, insuranceDurations]);

  // Calculate and update premium
  const updatePremium = useCallback((formData) => {
    const premium = calculatePremium(formData);
    if (premium) {
      setCalculatedPremium(premium);
      return premium;
    }
    return null;
  }, [calculatePremium]);

  return {
    calculatedPremium,
    setCalculatedPremium,
    showQuote,
    setShowQuote,
    calculatePremium,
    updatePremium,
    usageTypes,
    insuranceDurations,
    insurers
  };
};

export default usePremiumCalculation;
