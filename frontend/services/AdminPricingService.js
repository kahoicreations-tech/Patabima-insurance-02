// Minimal AdminPricingService to replace legacy shared/services

export const AdminPricingService = {
  async getPricingConfiguration(insuranceType) {
    return {
      insuranceType,
      basePremium: 1000,
      factors: {
        ageMultiplier: 1.0,
        genderMultiplier: 1.0,
        occupationMultiplier: 1.0,
      },
      isActive: true,
    };
  },
  async updatePricingConfiguration(insuranceType, configData) {
    return { ...configData };
  },
  async getCurrentPricingConfig() {
    return {
      medical: {
        basePremiums: {
          basic: { individual: 5000, family: 9000 },
          standard: { individual: 8000, family: 15000 },
        },
        ageFactors: { '18-25': 1.1, '26-35': 1.0, '36-50': 1.2 },
      },
    };
  },
  async getPricingHistory() {
    return [
      { id: 1, date: new Date().toISOString(), changes: 'Initial config' },
    ];
  },
  async updatePricingConfig(editedConfig, adminInfo) {
    return editedConfig;
  },
  async exportConfiguration() {
    return [{ key: 'config', value: 'exported' }];
  },
};
