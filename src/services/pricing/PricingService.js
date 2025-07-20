// PataBima Insurance Pricing Service
// Now uses Dynamic Admin-Managed Pricing Configuration
// Legacy service maintained for backward compatibility

import { DynamicPricingService } from './DynamicPricingService';

export const PricingService = {
  
  // Initialize dynamic pricing on service load
  init: async () => {
    try {
      await DynamicPricingService.init();
      console.log('PricingService initialized with dynamic configuration');
    } catch (error) {
      console.warn('Failed to initialize dynamic pricing, falling back to static config');
    }
  },
  
  // Medical Insurance Pricing - Now uses dynamic configuration
  medical: {
    // Base premiums for backward compatibility
    basePremiums: {
      basic: { individual: 18000, family: 45000, coverage: 500000 },
      standard: { individual: 35000, family: 85000, coverage: 1000000 },
      premium: { individual: 65000, family: 150000, coverage: 2000000 }
    },
    
    // Age factors for pricing calculations
    ageFactors: {
      '18-25': 0.8,
      '26-35': 1.0,
      '36-45': 1.2,
      '46-55': 1.5,
      '56-65': 2.0,
      '66+': 3.0
    },
    
    calculatePremium: async (customerData) => {
      try {
        const dynamicResult = await DynamicPricingService.getMedicalPricing(customerData);
        if (dynamicResult) {
          return dynamicResult;
        }
        // Fallback to static calculation if dynamic fails
        return PricingService.medical.calculateStaticPremium(customerData);
      } catch (error) {
        console.error('Error in dynamic medical pricing:', error);
        return PricingService.medical.calculateStaticPremium(customerData);
      }
    },
    
    // Legacy static calculation as fallback
    calculateStaticPremium: (customerData) => {
      const {
        planType = 'standard',
        memberType = 'individual',
        age = 30
      } = customerData;
      
      let basePremium = PricingService.medical.basePremiums[planType]?.[memberType] || 35000;
      
      // Simple age factor calculation
      if (age > 50) basePremium *= 1.5;
      else if (age > 35) basePremium *= 1.2;
      
      return {
        basePremium: Math.round(basePremium),
        coverage: PricingService.medical.basePremiums[planType]?.coverage || 1000000,
        isStaticFallback: true
      };
    }
  },

  // WIBA Insurance Pricing - Now uses dynamic configuration
  wiba: {
    // Employee categories for pricing
    employeeCategories: {
      clerical: { baseRate: 150, riskLevel: 'low', description: 'Office workers, clerks, administrators' },
      skilled: { baseRate: 280, riskLevel: 'medium', description: 'Technicians, supervisors, skilled workers' },
      manual: { baseRate: 450, riskLevel: 'high', description: 'Manual laborers, operators, general workers' },
      hazardous: { baseRate: 750, riskLevel: 'very_high', description: 'Construction, mining, high-risk workers' }
    },
    
    // Industry risk multipliers
    industryRiskMultipliers: {
      'office': 1.0,
      'retail': 1.1,
      'manufacturing': 1.3,
      'construction': 1.8,
      'mining': 2.2,
      'agriculture': 1.4,
      'transport': 1.5,
      'healthcare': 1.1,
      'education': 0.9,
      'hospitality': 1.2
    },
    
    // Coverage types
    coverageTypes: {
      'basic': { baseMultiplier: 1.0, description: 'Basic WIBA coverage' },
      'enhanced': { baseMultiplier: 1.3, description: 'Enhanced WIBA coverage' },
      'comprehensive': { baseMultiplier: 1.6, description: 'Comprehensive WIBA coverage' }
    },
    
    // Experience rating
    experienceRating: {
      'excellent': 0.8,
      'good': 0.9,
      'average': 1.0,
      'poor': 1.3,
      'very_poor': 1.6
    },
    
    calculatePremium: async (companyData) => {
      try {
        const dynamicResult = await DynamicPricingService.getWIBAPricing(companyData);
        if (dynamicResult) {
          return dynamicResult;
        }
        return PricingService.wiba.calculateStaticPremium(companyData);
      } catch (error) {
        console.error('Error in dynamic WIBA pricing:', error);
        return PricingService.wiba.calculateStaticPremium(companyData);
      }
    },
    
    calculateStaticPremium: (companyData) => {
      const {
        employeeCount = 1,
        employeeCategory = 'clerical'
      } = companyData;
      
      const baseRate = PricingService.wiba.employeeCategories[employeeCategory]?.baseRate || 280;
      const monthlyPremium = baseRate * employeeCount;
      
      return {
        monthlyPremium: Math.round(monthlyPremium),
        annualPremium: Math.round(monthlyPremium * 12),
        isStaticFallback: true
      };
    }
  },

  // Motor Insurance Pricing - Now uses dynamic configuration
  motor: {
    calculatePremium: async (vehicleData) => {
      try {
        const dynamicResult = await DynamicPricingService.getMotorPricing(vehicleData);
        if (dynamicResult) {
          return dynamicResult;
        }
        return PricingService.motor.calculateStaticPremium(vehicleData);
      } catch (error) {
        console.error('Error in dynamic motor pricing:', error);
        return PricingService.motor.calculateStaticPremium(vehicleData);
      }
    },
    
    calculateStaticPremium: (vehicleData) => {
      const { vehicleValue = 1000000, vehicleCategory = 'private' } = vehicleData;
      const baseRates = {
        private: 0.035,
        commercial: 0.055,
        psvMatatu: 0.08,
        truck: 0.065
      };
      
      const baseRate = baseRates[vehicleCategory] || 0.035;
      const premium = vehicleValue * baseRate;
      
      return {
        premium: Math.round(premium),
        isStaticFallback: true
      };
    }
  },

  // Travel Insurance - Uses dynamic configuration
  travel: {
    calculatePremium: async (travelData) => {
      try {
        const dynamicResult = await DynamicPricingService.getTravelPricing(travelData);
        if (dynamicResult) {
          return dynamicResult;
        }
        return PricingService.travel.calculateStaticPremium(travelData);
      } catch (error) {
        console.error('Error in dynamic travel pricing:', error);
        return PricingService.travel.calculateStaticPremium(travelData);
      }
    },
    
    calculateStaticPremium: (travelData) => {
      const { destination = 'domestic', planType = 'standard', days = 7 } = travelData;
      const rates = {
        domestic: { basic: 25, standard: 45, premium: 75 },
        regional: { basic: 65, standard: 120, premium: 200 }
      };
      
      const dailyRate = rates[destination]?.[planType] || 45;
      const totalPremium = dailyRate * days;
      
      return {
        dailyRate,
        totalPremium,
        days,
        isStaticFallback: true
      };
    }
  },

  // Personal Accident Insurance
  personalAccident: {
    calculatePremium: async (customerData) => {
      const { coverage = 1000000, occupation = 'office worker', age = 30 } = customerData;
      
      const basePremiums = {
        500000: 2500,
        1000000: 4200,
        2000000: 7500,
        5000000: 15000
      };
      
      let premium = basePremiums[coverage] || 4200;
      
      // Simple occupation and age adjustments
      if (occupation.includes('construction') || occupation.includes('security')) {
        premium *= 2.0;
      } else if (occupation.includes('driver') || occupation.includes('mechanic')) {
        premium *= 1.4;
      }
      
      if (age > 60) premium *= 1.8;
      else if (age > 45) premium *= 1.3;
      
      return {
        premium: Math.round(premium),
        coverage,
        isStaticFallback: true
      };
    }
  },

  // Last Expense Insurance
  lastExpense: {
    // Base premiums for backward compatibility
    basePremiums: {
      basic: { coverage: 50000, premium: 600 },
      standard: { coverage: 100000, premium: 1100 },
      premium: { coverage: 200000, premium: 2000 },
      comprehensive: { coverage: 300000, premium: 2800 }
    },
    
    // Additional benefits pricing
    additionalBenefits: {
      funeral_arrangement: 800,
      repatriation: 1200,
      grief_counseling: 300,
      memorial_service: 500
    },
    
    // Age factors for pricing calculations
    ageFactors: {
      '18-30': 0.7,
      '31-40': 1.0,
      '41-50': 1.4,
      '51-60': 2.0,
      '61-70': 3.2,
      '71+': 4.5
    },
    
    calculatePremium: async (customerData) => {
      const { planType = 'standard', age = 40 } = customerData;
      
      let premium = PricingService.lastExpense.basePremiums[planType]?.premium || 1100;
      
      // Age adjustments
      if (age > 70) premium *= 3.2;
      else if (age > 60) premium *= 2.0;
      else if (age > 50) premium *= 1.4;
      else if (age < 30) premium *= 0.7;
      
      return {
        premium: Math.round(premium),
        coverage: PricingService.lastExpense.basePremiums[planType]?.coverage || 100000,
        isStaticFallback: true
      };
    }
  },

  // Utility Functions - Enhanced with dynamic support
  calculateAge: (dateOfBirth) => {
    if (!dateOfBirth) return 30;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  },
  
  getAgeGroup: (age, ageFactors) => {
    if (!ageFactors || !age) return 1.0;
    
    if (age <= 25) return ageFactors['18-25'] || ageFactors['18-30'] || 1.0;
    if (age <= 30) return ageFactors['26-30'] || ageFactors['18-30'] || 1.0;
    if (age <= 35) return ageFactors['31-35'] || ageFactors['31-40'] || 1.0;
    if (age <= 40) return ageFactors['36-40'] || ageFactors['31-40'] || 1.0;
    if (age <= 45) return ageFactors['41-45'] || ageFactors['41-50'] || 1.2;
    if (age <= 50) return ageFactors['46-50'] || ageFactors['41-50'] || 1.4;
    if (age <= 55) return ageFactors['51-55'] || ageFactors['51-60'] || 1.5;
    if (age <= 60) return ageFactors['56-60'] || ageFactors['51-60'] || 2.0;
    if (age <= 65) return ageFactors['61-65'] || ageFactors['61-70'] || 2.5;
    if (age <= 70) return ageFactors['66-70'] || ageFactors['61-70'] || 3.0;
    return ageFactors['71+'] || ageFactors['66+'] || 4.0;
  },

  formatCurrency: (amount) => {
    return `KES ${Math.round(amount).toLocaleString()}`;
  },

  // Get current pricing configuration info
  getConfigInfo: async () => {
    try {
      return await DynamicPricingService.getConfigInfo();
    } catch (error) {
      return {
        version: 'static-fallback',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      };
    }
  },

  // Check if using dynamic pricing
  isDynamicPricingActive: async () => {
    try {
      const config = await DynamicPricingService.getConfigInfo();
      return !!config && config.version !== 'static-fallback';
    } catch (error) {
      return false;
    }
  }
};

export default PricingService;
