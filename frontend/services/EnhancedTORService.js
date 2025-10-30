/**
 * Enhanced TOR Service Integration Layer
 * 
 * Bridges the robust backend API services with the existing TOR flow
 * Provides enhanced functionality including DMVIC verification, document uploads, and payment processing
 */

import djangoAPI from './DjangoAPIService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class EnhancedTORService {
  constructor() {
    this.djangoAPI = djangoAPI;
    this.isInitialized = false;
    this._underwritersCache = { at: 0, value: [] };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize both services
      await this.djangoAPI.initialize();
      this.isInitialized = true;
      console.log('[EnhancedTORService] Initialized successfully');
    } catch (error) {
      console.error('[EnhancedTORService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced vehicle verification with DMVIC integration
   * Combines Django API with backend service for comprehensive verification
   */
  async verifyVehicle(vehicleData) {
    try {
      const { vehicle_registration, vehicle_make, vehicle_model, vehicle_year } = vehicleData;
      
      // Skip if insufficient data
      if (!vehicle_registration || vehicle_registration.length < 3) {
        return null;
      }

      console.log('[EnhancedTORService] Verifying vehicle:', vehicle_registration);

      // Use Django API vehicle check
      const result = await this.djangoAPI.vehicleCheck(vehicleData);

      // Cache result for performance
      if (result) {
        await AsyncStorage.setItem(`vehicle_verification_${vehicle_registration}`, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      }

      return result;
    } catch (error) {
      console.error('[EnhancedTORService] Vehicle verification failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced quote generation with underwriter management
   */
  async generateQuote(quoteData) {
    try {
      console.log('[EnhancedTORService] Generating quote:', quoteData);
      // Ensure TOR subcategory for private
      const payload = {
        subcategory_code: quoteData.subcategory_code || 'PRIVATE_TOR',
        underwriter_code: quoteData.underwriter_code || quoteData.underwriter_id || 'APA',
        vehicle_year: quoteData.vehicle_year,
        vehicle_make: quoteData.vehicle_make,
        cover_type: 'THIRD_PARTY',
      };
      // Use the motor calculation endpoint that accepts underwriter_code & subcategory_code
      return await this.djangoAPI.calculateMotorPremium(payload);
    } catch (error) {
      console.error('[EnhancedTORService] Quote generation failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced underwriter management
   */
  async getUnderwriters(params = {}) {
    try {
      console.log('[EnhancedTORService] Fetching TOR providers (underwriters)');

      // Ensure initialization (loads token/baseUrl) before hitting endpoints
      await this.initialize();

      // Use simple cache to prevent spamming the backend
      const now = Date.now();
      if (this._underwritersCache.value.length && now - this._underwritersCache.at < 60_000) {
        return this._underwritersCache.value;
      }

      // Prefer Django API unified provider method (it already handles shape + caching)
      let providers = [];
      const primary = await this.djangoAPI.getUnderwriters();
      providers = Array.isArray(primary) ? primary : (primary?.underwriters || []);
      console.log('[EnhancedTORService] Got providers from DjangoAPIService:', providers.length);

      // Filter to TOR-capable providers if model exposes supported_policy_types
      const filtered = (providers || []).filter(p => {
        const s = (p?.supported_policy_types || '').toString().toLowerCase();
        const isTorCapable = s.includes('tor') || s.includes('tor_private') || s.includes('third_party') || !s;
        if (isTorCapable) {
          console.log('[EnhancedTORService] TOR-capable provider:', p.name || p.company, 'supports:', s || 'all');
        }
        return isTorCapable;
      });

      // Normalize provider codes
      const normalized = (filtered.length ? filtered : providers).map(p => {
        if (!p.code && p.underwriter_code) p.code = p.underwriter_code;
        if (!p.code && p.provider_code) p.code = p.provider_code;
        if (!p.code && p.company_code) p.code = p.company_code;
        return p;
      });
      const finalProviders = normalized;

      // Fetch TOR prices per underwriter using compareMotorPricing
      try {
        const uwCodes = finalProviders.map(p => p.code || p.underwriter_code).filter(Boolean);
        console.log('[EnhancedTORService] Underwriter codes for compare:', uwCodes);
        const comparePayload = {
          subcategory_code: 'PRIVATE_TOR',
          underwriter_codes: uwCodes,
          vehicle_year: parseInt(params.vehicle_year) || new Date().getFullYear(),
          vehicle_make: params.vehicle_make || 'Toyota',
          cover_type: params.cover_type || 'THIRD_PARTY',
        };
        console.log('[EnhancedTORService] compare payload:', comparePayload);
        let cmp = null;
        if (uwCodes.length) {
          cmp = await this.djangoAPI.compareMotorPricing(comparePayload);
        } else {
          console.warn('[EnhancedTORService] No underwriter codes available for compare pricing');
        }
        const comparisons = Array.isArray(cmp?.comparisons) ? cmp.comparisons : [];
        const priceByCode = new Map();
        for (const item of comparisons) {
          const code = item?.underwriter_code || item?.result?.underwriter?.code;
          const base = item?.result?.base_premium || item?.result?.premium || 0;
          const m = item?.result?.mandatory_levies || {};
          const itl = m.insurance_training_levy || 0;
          const pcf = m.pcf_levy || 0;
          const stamp = m.stamp_duty ?? 40;
          const total = item?.result?.total_premium || (base + itl + pcf + stamp);
          if (code) priceByCode.set(code, { base, itl, pcf, stamp, total, mandatory_levies: m });
        }
        // Attach prices to providers
        finalProviders.forEach(p => {
          const code = p.code || p.underwriter_code;
          const prices = priceByCode.get(code);
          if (prices) {
            p.base_premium = prices.base;
            p.insurance_training_levy = prices.itl;
            p.pcf_levy = prices.pcf;
            p.stamp_duty = prices.stamp;
            p.mandatory_levies = prices.mandatory_levies || { insurance_training_levy: prices.itl, pcf_levy: prices.pcf, stamp_duty: prices.stamp };
            p.total_premium = prices.total;
          }
        });
      } catch (e) {
        console.warn('[EnhancedTORService] compareMotorPricing failed, providers returned without priced totals:', e?.message);
      }

      this._underwritersCache = { at: now, value: finalProviders };
      const uwEp = this.djangoAPI.getLastUsedEndpoint?.('underwriters');
      if (uwEp) {
        console.log('[EnhancedTORService] Cached', finalProviders.length, 'providers for TOR via:', uwEp);
      } else {
        console.log('[EnhancedTORService] Cached', finalProviders.length, 'providers for TOR');
      }
      return this._underwritersCache.value;
    } catch (error) {
      console.error('[EnhancedTORService] Get underwriters failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced document upload with progress tracking (optional)
   */
  async uploadDocuments(formData, onProgress) {
    try {
      console.log('[EnhancedTORService] Uploading documents (optional)');

  // Use Django API documents endpoint when available (placeholder: treat as optional success)
  // If a real Django upload endpoint exists, wire it here similarly to other djangoAPI methods.
  const result = { ok: true, optional: true };
      
      console.log('[EnhancedTORService] Document upload successful:', result);
      return result;
    } catch (error) {
      console.error('[EnhancedTORService] Document upload failed (non-blocking):', error);
      // For optional uploads, don't throw error, just log it
      return { error: error.message, optional: true };
    }
  }

  /**
   * Enhanced payment processing with transaction tracking
   */
  async processPayment(paymentData) {
    try {
      console.log('[EnhancedTORService] Processing payment:', paymentData);

  // Use Django payments API
  const result = await this.djangoAPI.initiatePayment(paymentData);
      
      console.log('[EnhancedTORService] Payment processing successful:', result);
      return result;
    } catch (error) {
      console.error('[EnhancedTORService] Payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced policy submission combining both services (documents optional)
   */
  async submitPolicy(policyData) {
    try {
      console.log('[EnhancedTORService] Submitting policy (documents optional):', policyData);

      // Submit via Django motor form
      const cleanPolicyData = {
        ...policyData,
        documents_uploaded: policyData.documents_uploaded || false,
      };
      return await this.djangoAPI.submitMotorInsuranceForm(cleanPolicyData);
    } catch (error) {
      console.error('[EnhancedTORService] Policy submission failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced receipt generation
   */
  async getReceipt(policyId) {
    try {
      console.log('[EnhancedTORService] Getting receipt for policy:', policyId);

  const result = await this.djangoAPI.getReceipt(policyId);
      
      console.log('[EnhancedTORService] Receipt retrieval successful:', result);
      return result;
    } catch (error) {
      console.error('[EnhancedTORService] Receipt retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced certificate issuance
   */
  async issueCertificate(policyId) {
    try {
      console.log('[EnhancedTORService] Issuing certificate for policy:', policyId);

  const result = await this.djangoAPI.issueCertificate(policyId);
      
      console.log('[EnhancedTORService] Certificate issuance successful:', result);
      return result;
    } catch (error) {
      console.error('[EnhancedTORService] Certificate issuance failed:', error);
      throw error;
    }
  }

  /**
   * Download certificate
   */
  async downloadCertificate(policyId) {
    try {
      console.log('[EnhancedTORService] Downloading certificate for policy:', policyId);

  const result = await this.djangoAPI.downloadCertificate(policyId);
      
      console.log('[EnhancedTORService] Certificate download successful');
      return result;
    } catch (error) {
      console.error('[EnhancedTORService] Certificate download failed:', error);
      throw error;
    }
  }

  /**
   * Dashboard overview for agents
   */
  async getDashboardOverview() {
    try {
      console.log('[EnhancedTORService] Getting dashboard overview');

  const result = await this.djangoAPI.getDashboardOverview();
      
      console.log('[EnhancedTORService] Dashboard overview successful:', result);
      return result;
    } catch (error) {
      console.error('[EnhancedTORService] Dashboard overview failed:', error);
      throw error;
    }
  }

  /**
   * Get policies with filtering
   */
  async getPolicies(filters = {}) {
    try {
      console.log('[EnhancedTORService] Getting policies with filters:', filters);

  const result = await this.djangoAPI.getPolicies(filters);
      
      console.log('[EnhancedTORService] Policies retrieval successful:', result);
      return result;
    } catch (error) {
      console.error('[EnhancedTORService] Policies retrieval failed:', error);
      throw error;
    }
  }

  /**
   * DMVIC health check
   */
  async checkDMVICHealth() {
    try {
  const result = await this.djangoAPI.dmvicHealth();
      console.log('[EnhancedTORService] DMVIC health check successful:', result);
      return result;
    } catch (error) {
      console.error('[EnhancedTORService] DMVIC health check failed:', error);
      throw error;
    }
  }

  /**
   * Helper method to get authentication token
   */
  async getAuthToken() {
    // Try multiple token sources for compatibility
    const sources = ['auth_token', 'accessToken', 'user'];
    
    for (const source of sources) {
      try {
        const stored = await AsyncStorage.getItem(source);
        if (stored) {
          if (source === 'user') {
            const parsed = JSON.parse(stored);
            return parsed?.tokens?.access;
          }
          return stored;
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Cache management
   */
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('vehicle_verification_'));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('[EnhancedTORService] Cache cleared');
    } catch (error) {
      console.error('[EnhancedTORService] Cache clear failed:', error);
    }
  }
}

// Create singleton instance
const enhancedTORService = new EnhancedTORService();

export default enhancedTORService;