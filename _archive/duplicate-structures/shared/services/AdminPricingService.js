// Admin Pricing Management Service
// Allows administrators to update insurance pricing and business rules dynamically

import AsyncStorage from '@react-native-async-storage/async-storage';

const ADMIN_STORAGE_KEYS = {
  PRICING_CONFIG: '@PataBima:admin_pricing_config',
  BUSINESS_RULES: '@PataBima:admin_business_rules',
  ADMIN_SETTINGS: '@PataBima:admin_settings',
  PRICING_HISTORY: '@PataBima:pricing_history'
};

export const AdminPricingService = {
  
  // Initialize with default configuration
  initializeDefaultConfig: async () => {
    try {
      const existingConfig = await AsyncStorage.getItem(ADMIN_STORAGE_KEYS.PRICING_CONFIG);
      if (!existingConfig) {
        const defaultConfig = {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
          updatedBy: 'system',
          
          // Medical Insurance Pricing Configuration
          medical: {
            basePremiums: {
              basic: { individual: 18000, family: 45000, coverage: 500000 },
              standard: { individual: 35000, family: 85000, coverage: 1000000 },
              premium: { individual: 65000, family: 150000, coverage: 2000000 }
            },
            ageFactors: {
              '18-25': 0.8, '26-35': 1.0, '36-45': 1.3,
              '46-55': 1.6, '56-65': 2.1, '66+': 2.8
            },
            genderFactors: { male: 1.0, female: 1.15 },
            lifestyleFactors: {
              smoking: 1.4, alcohol: 1.2,
              chronic_conditions: 1.5, pre_existing: 1.8
            }
          },
          
          // WIBA Insurance Configuration
          wiba: {
            employeeCategories: {
              clerical: { baseRate: 150, riskLevel: 'low' },
              skilled: { baseRate: 280, riskLevel: 'medium' },
              manual: { baseRate: 450, riskLevel: 'high' },
              hazardous: { baseRate: 750, riskLevel: 'very_high' }
            },
            industryRiskMultipliers: {
              finance: 0.8, education: 0.9, retail: 1.0,
              manufacturing: 1.3, construction: 1.8, mining: 2.2
            }
          },
          
          // Motor Insurance Configuration
          motor: {
            vehicleCategories: {
              private: { baseRate: 0.035, description: 'Private vehicles' },
              commercial: { baseRate: 0.055, description: 'Commercial vehicles' },
              psvMatatu: { baseRate: 0.08, description: 'PSV Matatu' },
              truck: { baseRate: 0.065, description: 'Trucks and heavy vehicles' }
            },
            ageFactors: {
              '0-3': 1.0, '4-8': 1.2, '9-15': 1.5, '16+': 2.0
            }
          }
        };
        
        await AsyncStorage.setItem(
          ADMIN_STORAGE_KEYS.PRICING_CONFIG,
          JSON.stringify(defaultConfig)
        );
        return defaultConfig;
      }
      return JSON.parse(existingConfig);
    } catch (error) {
      console.error('Error initializing pricing config:', error);
      return null;
    }
  },
  
  // Get current pricing configuration
  getCurrentPricingConfig: async () => {
    try {
      const config = await AsyncStorage.getItem(ADMIN_STORAGE_KEYS.PRICING_CONFIG);
      return config ? JSON.parse(config) : await AdminPricingService.initializeDefaultConfig();
    } catch (error) {
      console.error('Error getting pricing config:', error);
      return null;
    }
  },
  
  // Update pricing configuration (admin only)
  updatePricingConfig: async (newConfig, adminInfo) => {
    try {
      // Save current config to history
      const currentConfig = await AdminPricingService.getCurrentPricingConfig();
      if (currentConfig) {
        await AdminPricingService.savePricingHistory(currentConfig);
      }
      
      const updatedConfig = {
        ...newConfig,
        lastUpdated: new Date().toISOString(),
        version: AdminPricingService.generateVersion(),
        updatedBy: adminInfo.adminId || 'unknown'
      };
      
      await AsyncStorage.setItem(
        ADMIN_STORAGE_KEYS.PRICING_CONFIG,
        JSON.stringify(updatedConfig)
      );
      
      return updatedConfig;
    } catch (error) {
      console.error('Error updating pricing config:', error);
      return null;
    }
  },
  
  // Save pricing history for audit trail
  savePricingHistory: async (config) => {
    try {
      const historyKey = `${ADMIN_STORAGE_KEYS.PRICING_HISTORY}_${Date.now()}`;
      await AsyncStorage.setItem(historyKey, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving pricing history:', error);
    }
  },
  
  // Get pricing history for audit
  getPricingHistory: async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const historyKeys = allKeys.filter(key => 
        key.startsWith(ADMIN_STORAGE_KEYS.PRICING_HISTORY)
      );
      
      const historyData = await AsyncStorage.multiGet(historyKeys);
      return historyData.map(([key, value]) => ({
        timestamp: key.split('_').pop(),
        config: JSON.parse(value)
      })).sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    } catch (error) {
      console.error('Error getting pricing history:', error);
      return [];
    }
  },
  
  // Update specific insurance type pricing
  updateInsuranceTypePricing: async (insuranceType, newPricing, adminInfo) => {
    try {
      const currentConfig = await AdminPricingService.getCurrentPricingConfig();
      const updatedConfig = {
        ...currentConfig,
        [insuranceType]: newPricing,
        lastUpdated: new Date().toISOString(),
        updatedBy: adminInfo.adminId || 'unknown'
      };
      
      return await AdminPricingService.updatePricingConfig(updatedConfig, adminInfo);
    } catch (error) {
      console.error('Error updating insurance type pricing:', error);
      return null;
    }
  },
  
  // Generate version number
  generateVersion: () => {
    const now = new Date();
    return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  },
  
  // Validate admin permissions (implement your authentication logic here)
  validateAdminAccess: async (adminToken) => {
    try {
      // TODO: Implement proper admin authentication
      // For now, returning true for development
      return {
        isValid: true,
        adminId: 'admin_user',
        permissions: ['pricing_update', 'config_view', 'history_view']
      };
    } catch (error) {
      console.error('Error validating admin access:', error);
      return { isValid: false };
    }
  },
  
  // Export configuration for backup
  exportConfiguration: async () => {
    try {
      const config = await AdminPricingService.getCurrentPricingConfig();
      const history = await AdminPricingService.getPricingHistory();
      
      return {
        currentConfig: config,
        history: history.slice(0, 10), // Last 10 changes
        exportDate: new Date().toISOString(),
        exportedBy: 'admin'
      };
    } catch (error) {
      console.error('Error exporting configuration:', error);
      return null;
    }
  },
  
  // Import configuration from backup
  importConfiguration: async (importData, adminInfo) => {
    try {
      if (!importData.currentConfig) {
        throw new Error('Invalid import data');
      }
      
      return await AdminPricingService.updatePricingConfig(
        importData.currentConfig,
        adminInfo
      );
    } catch (error) {
      console.error('Error importing configuration:', error);
      return null;
    }
  }
};

export default AdminPricingService;
