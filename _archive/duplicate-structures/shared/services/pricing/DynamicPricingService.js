// Dynamic Pricing Service for PataBima App
// Uses admin-configurable pricing instead of hard-coded values

import { AdminPricingService } from './AdminPricingService';

export const DynamicPricingService = {
  
  // Initialize and get current pricing configuration
  init: async () => {
    return await AdminPricingService.getCurrentPricingConfig();
  },
  
  // Get medical insurance pricing with current admin configuration
  getMedicalPricing: async (customerData) => {
    try {
      const config = await AdminPricingService.getCurrentPricingConfig();
      if (!config || !config.medical) {
        return null; // Let fallback to static pricing
      }
      const medicalConfig = config.medical;
      
      const {
        planType = 'standard',
        memberType = 'individual',
        age = 30,
        gender = 'male',
        lifestyle = {},
        hospitalCategory = 'private_standard'
      } = customerData;
      
      // Get base premium
      let basePremium = medicalConfig.basePremiums[planType]?.[memberType] || 35000;
      
      // Apply age factor
      const ageFactor = DynamicPricingService.getAgeGroup(age, medicalConfig.ageFactors);
      basePremium *= ageFactor;
      
      // Apply gender factor
      const genderFactor = medicalConfig.genderFactors[gender] || 1.0;
      basePremium *= genderFactor;
      
      // Apply lifestyle factors
      Object.keys(lifestyle).forEach(factor => {
        if (lifestyle[factor] && medicalConfig.lifestyleFactors[factor]) {
          basePremium *= medicalConfig.lifestyleFactors[factor];
        }
      });
      
      // Apply hospital category factor
      const hospitalFactor = medicalConfig.hospitalCategories?.[hospitalCategory] || 1.0;
      basePremium *= hospitalFactor;
      
      return {
        basePremium: Math.round(basePremium),
        coverage: medicalConfig.basePremiums[planType]?.coverage || 1000000,
        breakdown: {
          baseAmount: medicalConfig.basePremiums[planType]?.[memberType] || 35000,
          ageFactor,
          genderFactor,
          hospitalFactor,
          lifestyleAdjustments: lifestyle
        },
        configVersion: config.version,
        lastUpdated: config.lastUpdated
      };
    } catch (error) {
      console.error('Error calculating medical pricing:', error);
      return null;
    }
  },
  
  // Get WIBA insurance pricing with current admin configuration
  getWIBAPricing: async (companyData) => {
    try {
      const config = await AdminPricingService.getCurrentPricingConfig();
      if (!config || !config.wiba) {
        return null; // Let fallback to static pricing
      }
      const wibaConfig = config.wiba;
      
      const {
        employeeCount = 1,
        employeeCategory = 'clerical',
        industry = 'retail',
        coverageType = 'standard',
        experienceRating = 'average'
      } = companyData;
      
      // Get base rate per employee
      const baseRate = wibaConfig.employeeCategories[employeeCategory]?.baseRate || 280;
      
      // Apply industry risk multiplier
      const industryMultiplier = wibaConfig.industryRiskMultipliers[industry] || 1.0;
      
      // Calculate monthly premium
      let monthlyPremium = baseRate * employeeCount * industryMultiplier;
      
      // Apply volume discounts (implement volume discount logic)
      monthlyPremium = DynamicPricingService.applyVolumeDiscount(
        monthlyPremium,
        employeeCount,
        wibaConfig.volumeDiscounts || {}
      );
      
      const annualPremium = monthlyPremium * 12;
      
      return {
        monthlyPremium: Math.round(monthlyPremium),
        annualPremium: Math.round(annualPremium),
        perEmployeeCost: Math.round(monthlyPremium / employeeCount),
        breakdown: {
          baseRate,
          industryMultiplier,
          employeeCount,
          volumeDiscount: monthlyPremium < (baseRate * employeeCount * industryMultiplier)
        },
        configVersion: config.version,
        lastUpdated: config.lastUpdated
      };
    } catch (error) {
      console.error('Error calculating WIBA pricing:', error);
      return null;
    }
  },
  
  // Get motor insurance pricing with current admin configuration
  getMotorPricing: async (vehicleData) => {
    try {
      const config = await AdminPricingService.getCurrentPricingConfig();
      if (!config || !config.motor) {
        return null; // Let fallback to static pricing
      }
      const motorConfig = config.motor;
      
      const {
        vehicleValue = 1000000,
        vehicleAge = 5,
        vehicleCategory = 'private',
        driverAge = 30,
        location = 'urban'
      } = vehicleData;
      
      // Get base rate for vehicle category
      const baseRate = motorConfig.vehicleCategories[vehicleCategory]?.baseRate || 0.035;
      
      // Calculate base premium
      let premium = vehicleValue * baseRate;
      
      // Apply vehicle age factor
      const ageFactor = DynamicPricingService.getVehicleAgeGroup(vehicleAge, motorConfig.ageFactors);
      premium *= ageFactor;
      
      return {
        premium: Math.round(premium),
        breakdown: {
          vehicleValue,
          baseRate,
          ageFactor,
          vehicleCategory
        },
        configVersion: config.version,
        lastUpdated: config.lastUpdated
      };
    } catch (error) {
      console.error('Error calculating motor pricing:', error);
      return null;
    }
  },
  
  // Get travel insurance pricing
  getTravelPricing: async (travelData) => {
    try {
      const config = await AdminPricingService.getCurrentPricingConfig();
      if (!config) {
        return null; // Let fallback to static pricing
      }
      const travelConfig = config.travel || {
        basePremiums: {
          domestic: { basic: 25, standard: 45, premium: 75 },
          regional: { basic: 65, standard: 120, premium: 200 }
        }
      };
      
      const {
        destination = 'domestic',
        planType = 'standard',
        days = 7,
        age = 30
      } = travelData;
      
      const dailyRate = travelConfig.basePremiums[destination]?.[planType] || 45;
      const totalPremium = dailyRate * days;
      
      return {
        dailyRate,
        totalPremium,
        days,
        configVersion: config.version,
        lastUpdated: config.lastUpdated
      };
    } catch (error) {
      console.error('Error calculating travel pricing:', error);
      return null;
    }
  },
  
  // Utility function to get age group factor
  getAgeGroup: (age, ageFactors) => {
    for (const [range, factor] of Object.entries(ageFactors)) {
      if (range.includes('-')) {
        const [min, max] = range.split('-').map(Number);
        if (age >= min && age <= max) return factor;
      } else if (range.includes('+')) {
        const min = parseInt(range);
        if (age >= min) return factor;
      }
    }
    return 1.0; // Default factor
  },
  
  // Utility function for vehicle age grouping
  getVehicleAgeGroup: (age, ageFactors) => {
    for (const [range, factor] of Object.entries(ageFactors)) {
      if (range.includes('-')) {
        const [min, max] = range.split('-').map(Number);
        if (age >= min && age <= max) return factor;
      } else if (range.includes('+')) {
        const min = parseInt(range);
        if (age >= min) return factor;
      }
    }
    return 1.0; // Default factor
  },
  
  // Apply volume discount logic
  applyVolumeDiscount: (premium, count, discountTiers) => {
    if (!discountTiers || typeof discountTiers !== 'object') return premium;
    
    for (const tier of Object.values(discountTiers)) {
      if (count >= tier.min && count <= tier.max) {
        return premium * (1 - (tier.discount || 0));
      }
    }
    return premium;
  },
  
  // Format currency consistently
  formatCurrency: (amount) => {
    return `KES ${Math.round(amount).toLocaleString()}`;
  },
  
  // Get current configuration version info
  getConfigInfo: async () => {
    try {
      const config = await AdminPricingService.getCurrentPricingConfig();
      if (!config) {
        return {
          version: 'fallback',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        };
      }
      return {
        version: config.version,
        lastUpdated: config.lastUpdated,
        updatedBy: config.updatedBy
      };
    } catch (error) {
      console.error('Error getting config info:', error);
      return null;
    }
  }
};

export default DynamicPricingService;
