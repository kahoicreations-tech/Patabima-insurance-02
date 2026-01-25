/**
 * Field Classification Utility
 * Classifies form fields into shared vs pricing-dependent categories
 * Used to determine when to trigger underwriter comparisons
 */

/**
 * Shared fields across all motor products (doesn't affect pricing)
 */
export const SHARED_FIELDS = [
  'registrationNumber',
  'identificationType',
  'chasisNumber',
  'engineNumber',
  'color',
  'bodyType',
  'logbookNumber',
  'purpose',
  'financialInterest',
  'cover_start_date',
];

/**
 * Pricing-dependent fields (triggers underwriter comparison on change)
 */
export const PRICING_FIELDS = {
  FIXED: [], // No pricing inputs needed
  BRACKET: ['sum_insured', 'year', 'make', 'model'],
  TONNAGE: ['tonnage', 'is_prime_mover', 'is_over_limit'],
  PASSENGER: ['capacity', 'is_commercial_institutional', 'passenger_type'],
  TONNAGE_PASSENGER: ['tonnage', 'capacity'],
  TONNAGE_PASSENGER_BRACKET: ['tonnage', 'capacity', 'sum_insured', 'year', 'make', 'model'],
};

/**
 * Check if field is pricing-dependent
 * @param {string} fieldName 
 * @param {string} pricingModel - e.g., 'FIXED', 'BRACKET', 'TONNAGE'
 * @returns {boolean}
 */
export function isPricingField(fieldName, pricingModel) {
  const pricingFields = PRICING_FIELDS[pricingModel] || [];
  return pricingFields.includes(fieldName);
}

/**
 * Check if field is shared (non-pricing)
 * @param {string} fieldName 
 * @returns {boolean}
 */
export function isSharedField(fieldName) {
  return SHARED_FIELDS.includes(fieldName);
}

/**
 * Get all required pricing fields for a pricing model
 * @param {string} pricingModel 
 * @returns {array} Array of field names
 */
export function getRequiredPricingFields(pricingModel) {
  return PRICING_FIELDS[pricingModel] || [];
}

/**
 * Check if all pricing fields are filled
 * @param {object} formData 
 * @param {string} pricingModel 
 * @returns {boolean}
 */
export function arePricingFieldsFilled(formData, pricingModel) {
  const requiredFields = getRequiredPricingFields(pricingModel);
  
  if (requiredFields.length === 0) return true; // FIXED pricing
  
  return requiredFields.every(field => {
    const value = formData[field];
    return value !== null && value !== undefined && value !== '';
  });
}

/**
 * Create comparison key for caching (only pricing fields)
 * @param {object} formData 
 * @param {string} pricingModel 
 * @returns {string} Stable key for comparison
 */
export function makeComparisonKey(formData, pricingModel) {
  const pricingFields = getRequiredPricingFields(pricingModel);
  
  if (pricingFields.length === 0) {
    // FIXED pricing: only product code matters
    return `FIXED_${formData.productCode || 'default'}`;
  }
  
  // Create key from pricing fields only
  const keyParts = pricingFields.map(field => {
    const value = formData[field];
    
    // Handle sum_insured: bucket to 50k to reduce cache misses
    if (field === 'sum_insured' && value) {
      const parsed = typeof value === 'string' 
        ? parseFloat(value.replace(/,/g, '')) 
        : value;
      return Math.floor(parsed / 50000) * 50000;
    }
    
    return value || 'null';
  });
  
  return `${pricingModel}_${keyParts.join('_')}`;
}

/**
 * Check if comparison should be triggered (pricing field changed)
 * @param {object} oldData - Previous form data
 * @param {object} newData - New form data
 * @param {string} pricingModel 
 * @returns {boolean}
 */
export function shouldTriggerComparison(oldData, newData, pricingModel) {
  const pricingFields = getRequiredPricingFields(pricingModel);
  
  // FIXED pricing: compare once on mount
  if (pricingFields.length === 0) {
    return !oldData.comparisonDone;
  }
  
  // Check if any pricing field changed
  return pricingFields.some(field => oldData[field] !== newData[field]);
}

/**
 * Extract pricing-only data (for API requests)
 * @param {object} formData 
 * @param {string} pricingModel 
 * @returns {object} Pricing data only
 */
export function extractPricingData(formData, pricingModel) {
  const pricingFields = getRequiredPricingFields(pricingModel);
  const pricingData = {};
  
  pricingFields.forEach(field => {
    if (formData[field] !== undefined) {
      pricingData[field] = formData[field];
    }
  });
  
  return pricingData;
}
