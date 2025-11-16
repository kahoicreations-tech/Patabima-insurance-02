// Normalized insurance product catalog.
// This acts as a lightweight backend-side source of truth until full DB models are implemented.
// Each product belongs to a category (see categories.js) and can carry pricing model metadata placeholders.

// Support both ESM (import) and CommonJS (require) usage.
let INSURANCE_CATEGORIES;
try {
  // Prefer ESM import syntax when transpiled/handled by bundler
  // (Will be stripped or handled in RN Metro environment)
  // eslint-disable-next-line no-unused-vars
  INSURANCE_CATEGORIES = require('./categories.js').INSURANCE_CATEGORIES; // CommonJS path
} catch (e) {
  // Fallback for pure ESM execution; dynamic import
  try {
    // eslint-disable-next-line no-eval
    const mod = eval("require")('./categories.js');
    INSURANCE_CATEGORIES = mod.INSURANCE_CATEGORIES;
  } catch (_) {
    // Last resort empty list to avoid crash in diagnostics
    INSURANCE_CATEGORIES = [];
  }
}

/*
Pricing model placeholders:
  model: 'fixed' | 'bracket' | 'tonnage' | 'passenger' | 'sum_insured_band' | 'benefit_tier' | 'composite'
  config: Arbitrary object used by eventual pricing engine.
*/

export const INSURANCE_PRODUCTS = [
  // Motor sub-types (examples)
  { code: 'MOTOR_PRIVATE_THIRD_PARTY', name: 'Private Motor - Third Party', category: 'motor', model: 'fixed', config: { basePremium: 7500 } },
  { code: 'MOTOR_PRIVATE_COMPREHENSIVE', name: 'Private Motor - Comprehensive', category: 'motor', model: 'sum_insured_band', config: { bands: [] } },
  { code: 'MOTOR_COMMERCIAL_LIGHT', name: 'Commercial Vehicle - Light', category: 'motor', model: 'tonnage', config: { bands: [] } },
  { code: 'MOTOR_PSV', name: 'PSV Vehicle', category: 'motor', model: 'passenger', config: { perSeatRate: null } },

  // Medical
  { code: 'MEDICAL_INDIVIDUAL_STANDARD', name: 'Medical Individual Standard', category: 'medical', model: 'benefit_tier', config: { tiers: [] } },
  { code: 'MEDICAL_CORPORATE', name: 'Medical Corporate', category: 'medical', model: 'benefit_tier', config: { tiers: [] } },

  // WIBA
  { code: 'WIBA_STANDARD', name: 'WIBA Standard', category: 'wiba', model: 'composite', config: {} },

  // Last Expense
  { code: 'LAST_EXPENSE_FAMILY', name: 'Last Expense Family Cover', category: 'last_expense', model: 'fixed', config: { basePremium: null } },

  // Travel
  { code: 'TRAVEL_INTERNATIONAL', name: 'Travel International', category: 'travel', model: 'composite', config: {} },

  // Personal Accident
  { code: 'PA_INDIVIDUAL', name: 'Personal Accident Individual', category: 'personal_accident', model: 'fixed', config: { basePremium: null } },

  // Professional Indemnity
  { code: 'PI_STANDARD', name: 'Professional Indemnity Standard', category: 'professional_indemnity', model: 'composite', config: {} },

  // Domestic Package
  { code: 'DOMESTIC_PACKAGE_STANDARD', name: 'Domestic Package Standard', category: 'domestic_package', model: 'composite', config: {} },
];

export function listProducts(category) {
  if (!category) return INSURANCE_PRODUCTS;
  return INSURANCE_PRODUCTS.filter(p => p.category === category);
}

export function getProductByCode(code) {
  return INSURANCE_PRODUCTS.find(p => p.code === code) || null;
}

export function ensureAllCategoriesRepresented() {
  const catKeys = new Set(INSURANCE_CATEGORIES.map(c => c.key));
  const represented = new Set(INSURANCE_PRODUCTS.map(p => p.category));
  const missing = [...catKeys].filter(k => !represented.has(k));
  return missing; // For diagnostics
}

// CommonJS interop for Node scripts (diagnostics) without enabling full ESM project-wide
try {
  // eslint-disable-next-line no-undef
  if (typeof module !== 'undefined' && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { INSURANCE_PRODUCTS, listProducts, getProductByCode, ensureAllCategoriesRepresented };
  }
} catch {}
