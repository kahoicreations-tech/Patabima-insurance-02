import djangoAPI from './DjangoAPIService';
import SimpleCache, { makeKey } from './SimpleCache';
import { transformPricingRequest, normalizePricingResponse } from '../utils/pricingCalculations';
import { PRODUCT_TYPES } from '../constants/motorInsuranceConfig';

/**
 * Helper function to construct subcategory code from category and cover type
 * Maps legacy cover types to modern subcategory codes
 */
function getSubcategoryCode(category, coverType) {
  const categoryUpper = category?.toUpperCase();
  const coverTypeUpper = coverType?.toUpperCase();
  
  // Map category + cover type combinations to subcategory codes
  const subcategoryMap = {
    'PRIVATE_THIRD_PARTY': 'PRIVATE_THIRD_PARTY',
    'PRIVATE_TOR': 'PRIVATE_TOR',
    'PRIVATE_COMPREHENSIVE': 'PRIVATE_COMPREHENSIVE',
    'COMMERCIAL_THIRD_PARTY': 'COMMERCIAL_THIRD_PARTY',
    'COMMERCIAL_TOR': 'COMMERCIAL_TOR', 
    'COMMERCIAL_COMPREHENSIVE': 'COMMERCIAL_COMPREHENSIVE',
    'PSV_THIRD_PARTY': 'PSV_THIRD_PARTY',
    'PSV_TOR': 'PSV_TOR',
    'PSV_COMPREHENSIVE': 'PSV_COMPREHENSIVE',
    'MOTORCYCLE_THIRD_PARTY': 'MOTORCYCLE_THIRD_PARTY',
    'MOTORCYCLE_TOR': 'MOTORCYCLE_TOR',
    'MOTORCYCLE_COMPREHENSIVE': 'MOTORCYCLE_COMPREHENSIVE',
    'TUKTUK_THIRD_PARTY': 'TUKTUK_THIRD_PARTY',
    'TUKTUK_TOR': 'TUKTUK_TOR',
    'TUKTUK_COMPREHENSIVE': 'TUKTUK_COMPREHENSIVE',
    'SPECIAL_THIRD_PARTY': 'SPECIAL_THIRD_PARTY',
    'SPECIAL_TOR': 'SPECIAL_TOR',
    'SPECIAL_COMPREHENSIVE': 'SPECIAL_COMPREHENSIVE'
  };
  
  // Construct the key
  const key = `${categoryUpper}_${coverTypeUpper}`;
  
  // Return the subcategory code or fallback to key if not found
  return subcategoryMap[key] || key;
}

class MotorInsurancePricingService {
  // Public: allow manual cache flush for pricing data
  async clearPricingCache() {
    await SimpleCache.clearAll();
  }
  async getCategories(options = {}) {
    // Fetch categories from backend database only - no fallback data
    try {
      const res = await djangoAPI.getMotorCategories(options);
      console.log('MotorInsurancePricingService getCategories response:', res);
      const categories = res?.categories || [];
      console.log('MotorInsurancePricingService extracted categories:', categories);
      
      if (!categories || categories.length === 0) {
        throw new Error('Backend returned empty categories');
      }
      
      return categories;
    } catch (e) {
      console.error('MotorInsurancePricingService getCategories error:', e);
      // Re-throw error to let the UI handle it appropriately
      throw new Error(`Failed to load categories from backend: ${e.message}`);
    }
  }

  async getPricingForSubcategory(categoryKey, subcategoryKey, productType, options = {}) {
    // Fetch field requirements for a given category + cover type (subcategoryKey)
    try {
      const res = await djangoAPI.getFieldRequirements(categoryKey, subcategoryKey, options);
      return res || {};
    } catch (e) {
      throw e;
    }
  }

  async calculatePremium(productType, inputs, options = {}) {
    // Transform and call backend calculator
    const payload = transformPricingRequest(productType, inputs);
    try {
      const res = await djangoAPI.calculateMotorPremium(payload, options);
      return normalizePricingResponse(res);
    } catch (e) {
      // Normalize error message
      const msg = typeof e?.message === 'string' ? e.message : 'Failed to calculate premium';
      throw new Error(msg);
    }
  }

  async comparePricing(productType, inputs, underwriterIds = [], options = {}) {
    // Enhanced to work with cover type-based pricing system
    const payload = transformPricingRequest(productType, inputs);
    
    // Add cover type information for backend processing
    if (inputs.coverType || inputs.cover_type) {
      payload.cover_type = inputs.coverType || inputs.cover_type;
    }
    if (inputs.category) {
      payload.category = inputs.category;
    }

    try {
      // Use compareMotorPricing API with automatic underwriter discovery
      // Backend will automatically fetch available underwriters for the cover type
      const res = await djangoAPI.compareMotorPricing(payload, { ...options });
      
      // Backend returns comparisons with underwriter details and pricing
      const comparisons = Array.isArray(res?.comparisons) ? res.comparisons : [];
      
      return comparisons.map((comparison) => ({
        // Include underwriter details from backend
        underwriter_id: comparison.underwriter_id,
        underwriter_code: comparison.underwriter_code,
        underwriter_name: comparison.underwriter_name,
        market_position: comparison.market_position, // Budget, Competitive, Premium
        features: comparison.features || {},
        
        // Include pricing with normalized response
        ...normalizePricingResponse(comparison.pricing || comparison.result || comparison),
        
        // Store original comparison for debugging
        _original: comparison
      }));
      
    } catch (e) {
      console.error('MotorInsurancePricingService comparePricing error:', e);
      
      // Fallback to single calculation if comparison endpoint fails
      if (underwriterIds && underwriterIds.length > 0) {
        const tasks = underwriterIds.map((code) =>
          djangoAPI.calculateMotorPremium({ ...payload, underwriter_code: code }, options)
            .then((one) => ({ 
              underwriter_code: code, 
              underwriter_name: `Underwriter ${code}`,
              ...normalizePricingResponse(one) 
            }))
            .catch(() => null)
        );
        const settled = await Promise.all(tasks);
        return settled.filter(Boolean);
      }
      
      throw new Error(`Failed to compare pricing: ${e.message}`);
    }
  }

  async compareUnderwritersBySubcategory(subcategoryCode, inputs, options = {}) {
    // Direct subcategory-based underwriter comparison (preferred method)
    // This method uses the exact subcategory code without any mapping
    
    const payload = {
      ...transformPricingRequest(null, inputs),
      subcategory: subcategoryCode,
      subcategory_code: subcategoryCode,
    };

    try {
      // Cache key: subcategory + pricing-critical fields bucketed as needed
      const tonnage = inputs?.tonnage || inputs?.vehicle_tonnage;
      const capacity = inputs?.passengerCapacity || inputs?.passenger_capacity;
      // For comprehensive, sum_insured matters; for TP/TOR, base is fixed, so we can cache per subcategory
      const sumInsuredRaw = Number(inputs?.sum_insured || inputs?.vehicle_value || 0);
      const isComprehensive = String(inputs?.cover_type || '').toUpperCase().includes('COMP')
        || String(subcategoryCode || '').toUpperCase().includes('COMP');
      // Bucket sum insured to 50k to keep key cardinality reasonable
      const sumBucket = isComprehensive && sumInsuredRaw > 0 ? Math.floor(sumInsuredRaw / 50000) * 50000 : 0;

      const cacheKey = makeKey(['UW_SUBCAT', subcategoryCode, tonnage || 0, capacity || 0, sumBucket]);
      if (!options.forceRefresh) {
        const cached = await SimpleCache.get(cacheKey);
        if (cached) {
          if (__DEV__) console.log(`[CACHE] compareUnderwritersBySubcategory hit → ${cacheKey}`);
          return cached;
        }
      }
      console.log(`[compareUnderwritersBySubcategory] Using subcategory: ${subcategoryCode}`);
      console.log('compareUnderwritersBySubcategory payload:', JSON.stringify(payload, null, 2));
      console.log('compareUnderwritersBySubcategory original inputs:', JSON.stringify(inputs, null, 2));
      const res = await djangoAPI.compareMotorPricing(payload, options);
      
      console.log('compareUnderwritersBySubcategory raw response:', JSON.stringify(res, null, 2));
      
      if (!res?.comparisons || !Array.isArray(res.comparisons)) {
        throw new Error('Invalid response format from backend');
      }

  // Process and enhance comparison results with workaround for backend pricing issue
      const enhanced = res.comparisons.map((comp, index) => {
        console.log(`Processing underwriter ${index + 1}: ${comp.underwriter_code || comp.result?.underwriter_code}`);
        
        // Use the result object which contains the full underwriter data
        const underwriterData = comp.result || comp;
        const pricing = normalizePricingResponse(underwriterData);
        const backendTotal = Number(underwriterData.total_premium ?? underwriterData.premium);
        const finalPremium = Number.isFinite(backendTotal) ? backendTotal : (pricing.totalPremium || pricing.premium || 0);
        console.log(`Pricing for ${underwriterData.underwriter_name}: KSh ${finalPremium}`);

        // Prefer extendible_config exactly as provided by backend
        const extendibleCfg = underwriterData.extendible_config ?? comp.extendible_config ?? pricing.extendible_config;
        const isExtendible = Boolean(
          (underwriterData && typeof underwriterData.is_extendible === 'boolean' ? underwriterData.is_extendible : false) ||
          ((underwriterData?.subcategory || underwriterData?.subcategory_code || '').includes('EXT')) ||
          !!extendibleCfg
        );

        return {
          id: underwriterData.underwriter_id || comp.underwriter_id || `underwriter_${index}`,
          underwriter_id: underwriterData.underwriter_id || comp.underwriter_id,
          underwriter_code: underwriterData.underwriter_code || comp.underwriter_code,
          name: underwriterData.underwriter_name || comp.underwriter_name || `Underwriter ${underwriterData.underwriter_code}`,
          company: underwriterData.underwriter_name || comp.underwriter_name,
          
          // Market positioning from backend
          market_position: comp.market_position,
          features: comp.features || {},
          
          // Pricing information - using backend or calculated pricing
          premium: finalPremium,
          total_premium: finalPremium,
          totalPremium: finalPremium,
          
          // Breakdown details
          breakdown: pricing.breakdown || underwriterData.premium_breakdown || {},
          // Extendible details (preserve from backend exactly)
          ...(extendibleCfg ? { extendible_config: extendibleCfg } : {}),
          ...(isExtendible ? { is_extendible: true } : {}),
          
          // Additional metadata
          rating: typeof comp.rating === 'number' ? comp.rating : undefined,
          savings: comp.savings,
          currency: 'KSh',
          
          // Raw data for debugging
          _raw: comp
        };
      });

      // Sort by total premium (lowest first)
  enhanced.sort((a, b) => (a.total_premium || 0) - (b.total_premium || 0));
      
  console.log('Enhanced underwriter comparisons (subcategory-based):', enhanced);
  // Store for 12 hours by default unless caller overrides
  const ttlMs = options.ttlMs || (12 * 60 * 60 * 1000);
  await SimpleCache.set(cacheKey, enhanced, ttlMs);
  return enhanced;
      
    } catch (e) {
      console.error('compareUnderwritersBySubcategory error:', e);
      throw new Error(`Failed to compare underwriters for subcategory ${subcategoryCode}: ${e.message}`);
    }
  }

  async compareUnderwritersByCoverType(category, coverType, inputs, options = {}) {
    // Specialized method for cover type-based underwriter comparison
    // This automatically handles underwriter discovery based on category + cover type
    // Updated to use subcategory instead of deprecated cover_type
    
  // Prefer an explicit subcategory_code if provided from the selected product,
  // otherwise fall back to mapping category + coverType
  const explicitSubcat = inputs?.subcategory_code || inputs?.subcategory;
  const subcategory = explicitSubcat || getSubcategoryCode(category, coverType);
  console.log(`[compareUnderwritersByCoverType] Using subcategory: ${subcategory} (explicit: ${!!explicitSubcat}) for ${category} + ${coverType}`);
    
    // NOTE: Spread transformPricingRequest FIRST, then explicitly set category/subcategory
    // so they don't get overwritten to undefined by the spread.
  const transformed = transformPricingRequest(coverType, inputs);
    const payload = {
      ...transformed,
      category: category?.toUpperCase(),
      subcategory: subcategory,
      subcategory_code: subcategory,
    };

    // Helpful debug to ensure critical fields are present
    if (__DEV__) {
      console.log('[compareUnderwritersByCoverType] key fields:', {
        category: payload.category,
        subcategory: payload.subcategory,
        sum_insured: payload.sum_insured,
        vehicle_year: payload.vehicle_year,
        duration_days: payload.duration_days,
      });
    }

    try {
      // Build cache key from category + subcategory + pricing-critical inputs
      const tonnage = inputs?.tonnage || inputs?.vehicle_tonnage;
      const capacity = inputs?.passengerCapacity || inputs?.passenger_capacity;
      const engine = inputs?.engine_size || inputs?.engine_capacity;
      const sumInsuredRaw = Number(inputs?.sum_insured || inputs?.vehicle_value || 0);
      const isComprehensive = String(coverType || '').toUpperCase().includes('COMP')
        || String(subcategory || '').toUpperCase().includes('COMP');
      const sumBucket = isComprehensive && sumInsuredRaw > 0 ? Math.floor(sumInsuredRaw / 50000) * 50000 : 0;
      const cacheKey = makeKey(['UW_COVER', category, subcategory, tonnage || 0, capacity || 0, engine || 0, sumBucket]);
      if (!options.forceRefresh) {
        const cached = await SimpleCache.get(cacheKey);
        if (cached) {
          if (__DEV__) console.log(`[CACHE] compareUnderwritersByCoverType hit → ${cacheKey}`);
          return cached;
        }
      }
      console.log('compareUnderwritersByCoverType payload:', JSON.stringify(payload, null, 2));
      console.log('compareUnderwritersByCoverType original inputs:', JSON.stringify(inputs, null, 2));
      const res = await djangoAPI.compareMotorPricing(payload, options);
      
      console.log('compareUnderwritersByCoverType raw response:', JSON.stringify(res, null, 2));
      
      if (!res?.comparisons || !Array.isArray(res.comparisons)) {
        throw new Error('Invalid response format from backend');
      }

      // Process and enhance comparison results with workaround for backend pricing issue
      const enhanced = res.comparisons.map((comp, index) => {
        console.log(`Processing underwriter ${index + 1}: ${comp.underwriter_code || comp.result?.underwriter_code}`);
        
        // Use the result object which contains the full underwriter data
        const underwriterData = comp.result || comp;
        const pricing = normalizePricingResponse(underwriterData);
        const backendTotal = Number(underwriterData.total_premium ?? underwriterData.premium);
        const finalPremium = Number.isFinite(backendTotal) ? backendTotal : (pricing.totalPremium || pricing.premium || 0);
        console.log(`Pricing for ${underwriterData.underwriter_name}: KSh ${finalPremium}`);

        const extendibleCfg = underwriterData.extendible_config ?? comp.extendible_config ?? pricing.extendible_config;
        const isExtendible = Boolean(
          (underwriterData && typeof underwriterData.is_extendible === 'boolean' ? underwriterData.is_extendible : false) ||
          ((underwriterData?.subcategory || underwriterData?.subcategory_code || '').includes('EXT')) ||
          !!extendibleCfg
        );
        
        return {
          id: underwriterData.underwriter_id || comp.underwriter_id || `underwriter_${index}`,
          underwriter_id: underwriterData.underwriter_id || comp.underwriter_id,
          underwriter_code: underwriterData.underwriter_code || comp.underwriter_code,
          name: underwriterData.underwriter_name || comp.underwriter_name || `Underwriter ${underwriterData.underwriter_code}`,
          company: underwriterData.underwriter_name || comp.underwriter_name,
          
          // Market positioning from backend
          market_position: comp.market_position,
          features: comp.features || {},
          
          // Pricing information - using backend or calculated pricing
          premium: finalPremium,
          total_premium: finalPremium,
          totalPremium: finalPremium,
          
          // Breakdown details
          breakdown: pricing.breakdown || underwriterData.premium_breakdown || {},
          ...(extendibleCfg ? { extendible_config: extendibleCfg } : {}),
          ...(isExtendible ? { is_extendible: true } : {}),
          
          // Additional metadata
          rating: typeof comp.rating === 'number' ? comp.rating : undefined,
          savings: comp.savings,
          currency: 'KSh',
          
          // Raw data for debugging
          _raw: comp
        };
      });

      // Sort by total premium (lowest first)
  enhanced.sort((a, b) => (a.total_premium || 0) - (b.total_premium || 0));
      
  console.log('Enhanced underwriter comparisons:', enhanced);
  const ttlMs = options.ttlMs || (12 * 60 * 60 * 1000);
  await SimpleCache.set(cacheKey, enhanced, ttlMs);
  return enhanced;
      
    } catch (e) {
      console.error('compareUnderwritersByCoverType error:', e);
      throw new Error(`Failed to compare underwriters: ${e.message}`);
    }
  }

  _calculateRating(marketPosition) {
    // Deprecated: avoid synthetic ratings; rely on backend or omit
    return undefined;
  }

  _applyUnderwriterPricingVariation(basePremium, underwriterName, marketPosition) {
    // Deprecated: no synthetic price variations; use backend-provided totals only
    return basePremium;
  }

  async submitQuotation(quotationData) {
    try {
      const res = await djangoAPI.makeRequest('/api/v1/public_app/insurance/submit_motor_quotation', {
        method: 'POST',
        body: JSON.stringify(quotationData),
      });
      return res;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Compare pricing across multiple underwriters for a specific cover type
   * Uses the backend's automatic underwriter discovery - no need to specify underwriter codes
   * Converts legacy cover_type to modern subcategory_code approach
   */
  async comparePricingByCoverType(payload, options = {}) {
    try {
      console.log('MotorInsurancePricingService comparePricingByCoverType payload:', payload);
      
      // Convert legacy cover_type approach to modern subcategory_code approach
      const category = payload.category || 'PRIVATE';
      const coverType = payload.cover_type;
      
      // Get the proper subcategory code
      const subcategory_code = getSubcategoryCode(category, coverType);
      
      // Transform payload to backend format
      const backendPayload = {
        category_code: category.toUpperCase(),
        subcategory_code: subcategory_code,
        // Vehicle details
        sum_insured: payload.sum_insured || payload.vehicle_value || 0,
        vehicle_year: payload.vehicle_year,
        vehicle_make: payload.vehicle_make,
        vehicle_model: payload.vehicle_model,
        vehicle_registration: payload.vehicle_registration,
        // Commercial specific
        tonnage: payload.tonnage,
        // PSV specific  
        passenger_capacity: payload.passenger_capacity,
        // Motorcycle specific
        engine_size: payload.engine_size || payload.engine_capacity,
        // Policy details
        cover_start_date: payload.cover_start_date || new Date().toISOString().split('T')[0],
        duration_days: payload.duration_days || 365,
        // Customer details (if available)
        customer_phone: payload.customer_phone,
        customer_first_name: payload.customer_first_name,
        customer_last_name: payload.customer_last_name,
        customer_email: payload.customer_email
      };
      
      console.log('MotorInsurancePricingService transformed payload:', backendPayload);
      
      // Use the new backend compare endpoint that automatically fetches underwriters
      const comparison = await djangoAPI.compareMotorPricing(backendPayload, options);
      
      console.log('MotorInsurancePricingService comparePricingByCoverType response:', comparison);
      
      if (!comparison?.comparisons || !Array.isArray(comparison.comparisons)) {
        console.warn('Invalid comparison response format:', comparison);
        return { underwriters: [] };
      }
      
      // Transform the response to match frontend expectations
      const underwriters = comparison.comparisons.map(item => {
        const result = item.result;
        const underwriterCode = result.underwriter_code;
        const underwriterName = result.underwriter_name || `${underwriterCode} Insurance`;
        
        return {
          id: result.underwriter_id || underwriterCode,
          underwriter_id: result.underwriter_id,
          underwriter_code: underwriterCode,
          name: underwriterName,
          company: underwriterName,
          underwriter_name: underwriterName,
          base_premium: result.base_premium || 0,
          total_premium: result.total_premium || 0,
          premium: result.total_premium || 0,
          totalPremium: result.total_premium || 0,
          premium_breakdown: result.premium_breakdown || {},
          breakdown: result.premium_breakdown || {},
          policy_term: result.policy_term || {},
          // Use market position from backend response
          market_position: result.market_position || 'standard',
          features: result.features || {},
          rating: result.rating || 4.0,
          pricing_source: result.pricing_source,
          // Store original comparison for debugging
          _original: item
        };
      }).sort((a, b) => a.total_premium - b.total_premium); // Sort by price
      
      console.log('MotorInsurancePricingService transformed underwriters:', underwriters);
      
      // Return in the format expected by Motor 2 screen
      return {
        underwriters: underwriters,
        count: underwriters.length,
        success: true
      };
      
    } catch (e) {
      console.error('MotorInsurancePricingService comparePricingByCoverType error:', e);
      return { underwriters: [], count: 0, success: false, error: e.message };
    }
  }

  /**
   * Determine market positioning based on underwriter code
   */
  getMarketPositionFromCode(underwriterCode) {
    // This method is deprecated - we should not hardcode market positions
    // Backend should provide market positioning in the API response
    // This ensures data consistency and allows for market position changes without code updates
    console.warn('getMarketPositionFromCode is deprecated - market positions should come from backend');
    return undefined;
  }
}

const motorPricingService = new MotorInsurancePricingService();
export default motorPricingService;
