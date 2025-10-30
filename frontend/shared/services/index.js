// Minimal services shims for legacy imports. Replace with real implementations gradually.

export const QuoteStorageService = {
  async saveDraft(draft) {
    try {
      const key = `quote_draft_${Date.now()}`;
      // In React Native you might use AsyncStorage, but avoid dependency here
      global.__PATABIMA_DRAFTS__ = global.__PATABIMA_DRAFTS__ || {};
      global.__PATABIMA_DRAFTS__[key] = draft;
      return { key };
    } catch (e) {
      console.warn('QuoteStorageService.saveDraft no-op:', e?.message || e);
      return null;
    }
  },
  async getDrafts() {
    try {
      return Object.entries(global.__PATABIMA_DRAFTS__ || {}).map(([key, value]) => ({ key, value }));
    } catch (e) {
      console.warn('QuoteStorageService.getDrafts no-op:', e?.message || e);
      return [];
    }
  },
};

import { formatCurrency as formatCurrencyUtil } from '../../utils';

export const PricingService = {
  formatCurrency(amount, currency = 'KES') {
    return formatCurrencyUtil(amount, currency);
  },

  async calculatePremium(params) {
    try {
      console.warn('PricingService.calculatePremium stub called. Params:', params);
      return { premium: 0, breakdown: [] };
    } catch (e) {
      console.warn('PricingService.calculatePremium no-op:', e?.message || e);
      return { premium: 0, breakdown: [] };
    }
  },

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 30;
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 30;
    }
  },

  getAgeGroup(age, factors) {
    if (!age || !factors) return 1.0;
    const ranges = Object.keys(factors);
    for (const r of ranges) {
      if (r.includes('+')) {
        const min = parseInt(r, 10);
        if (age >= min) return factors[r];
      } else if (r.includes('-')) {
        const [minS, maxS] = r.split('-');
        const min = parseInt(minS, 10);
        const max = parseInt(maxS, 10);
        if (age >= min && age <= max) return factors[r];
      }
    }
    return 1.0;
  },

  lastExpense: {
    basePremiums: {
      basic: { coverage: 50000, premium: 600 },
      standard: { coverage: 100000, premium: 1100 },
      premium: { coverage: 200000, premium: 2000 },
      comprehensive: { coverage: 300000, premium: 2800 },
    },
    additionalBenefits: {
      funeral_arrangement: 800,
      repatriation: 1200,
      grief_counseling: 300,
      memorial_service: 500,
    },
    ageFactors: {
      '18-30': 0.7,
      '31-40': 1.0,
      '41-50': 1.4,
      '51-60': 2.0,
      '61-70': 3.2,
      '71+': 4.5,
    },
  },
};

export const PDFService = {
  async generateQuotePDF(data) {
    console.warn('PDFService.generateQuotePDF stub called.');
    return { uri: null };
  },
};

export const PaymentService = {
  async initiatePayment(amount, meta) {
    console.warn('PaymentService.initiatePayment stub called.', amount, meta);
    return { status: 'pending' };
  },
};

export default { QuoteStorageService, PricingService, PDFService, PaymentService };