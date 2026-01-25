/**
 * Motor3QuotationService - Handles Motor3 quote submission
 * Communicates with Django backend for quote creation
 */

import DjangoAPIService from './DjangoAPIService';
import SimpleCache from './SimpleCache';

class Motor3QuotationService {
  constructor() {
    this.djangoAPI = DjangoAPIService.getInstance();
  }

  /**
   * Submit Third-Party quotation
   * @param {Object} data - Complete third-party quote data
   * @returns {Promise<Object>} Created quotation with quote_number
   */
  async submitThirdPartyQuote(data) {
    try {
      // Motor3 quotations use the same schema as motor policy submissions.
      const response = await this.djangoAPI.makeRequest('/api/motor3/quotations/third-party/', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Clear relevant caches on successful submission
      await SimpleCache.clearPattern('motor3_quotes');
      
      return response;
    } catch (error) {
      console.error('[Motor3QuotationService] Third-party submission failed:', error);
      throw error;
    }
  }

  /**
   * Submit Comprehensive quotation
   * @param {Object} data - Complete comprehensive quote data
   * @returns {Promise<Object>} Created quotation with quote_number
   */
  async submitComprehensiveQuote(data) {
    try {
      // Motor3 quotations use the same schema as motor policy submissions.
      const response = await this.djangoAPI.makeRequest('/api/motor3/quotations/comprehensive/', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Clear relevant caches on successful submission
      await SimpleCache.clearPattern('motor3_quotes');
      
      return response;
    } catch (error) {
      console.error('[Motor3QuotationService] Comprehensive submission failed:', error);
      throw error;
    }
  }

  /**
   * Convert an existing quotation into an active policy (create + activate).
   */
  async convertQuotationToPolicy(quotationId, overrides = {}) {
    const response = await this.djangoAPI.makeRequest(`/api/motor3/quotations/${quotationId}/convert/`, {
      method: 'POST',
      body: JSON.stringify(overrides || {}),
      timeoutMs: 120000,
    });

    await SimpleCache.clearPattern('motor3_quotes');
    return response;
  }

  /**
   * Transform third-party data to backend format
   * @private
   */
  _transformThirdPartyPayload(data) {
    return {
      // Category & Product
      category: data.category,
      subcategory: data.subcategory,
      product_type: 'THIRD_PARTY',

      // Vehicle Details
      vehicle: {
        registration: data.vehicleDetails?.registration,
        chassis_number: data.vehicleDetails?.chassisNumber,
        make: data.vehicleDetails?.make,
        model: data.vehicleDetails?.model,
        year: data.vehicleDetails?.year,
        body_type: data.vehicleDetails?.bodyType,
        color: data.vehicleDetails?.color,
        engine_number: data.vehicleDetails?.engineNumber,
      },

      // Coverage Details
      coverage: {
        cover_start_date: data.vehicleDetails?.cover_start_date,
        cover_end_date: this._calculateEndDate(data.vehicleDetails?.cover_start_date),
      },

      // Underwriter Selection
      underwriter: {
        code: data.selectedUnderwriter?.code,
        name: data.selectedUnderwriter?.name,
      },

      // Pricing
      pricing: {
        base_premium: data.selectedUnderwriter?.base_premium,
        total_premium: data.selectedUnderwriter?.total_premium,
        breakdown: data.selectedUnderwriter?.breakdown,
      },

      // Client Details
      client: {
        id_number: data.clientDetails?.idNumber,
        full_name: data.clientDetails?.fullName,
        email: data.clientDetails?.email,
        phone: data.clientDetails?.phone,
        address: data.clientDetails?.address,
      },

      // Documents
      documents: data.uploadedDocuments || [],
    };
  }

  /**
   * Transform comprehensive data to backend format
   * @private
   */
  _transformComprehensivePayload(data) {
    return {
      // Category & Product
      category: data.category,
      subcategory: data.subcategory,
      product_type: 'COMPREHENSIVE',

      // Vehicle Details
      vehicle: {
        registration: data.vehicleDetails?.registration,
        chassis_number: data.vehicleDetails?.chassisNumber,
        make: data.vehicleDetails?.make,
        model: data.vehicleDetails?.model,
        year: data.vehicleDetails?.year,
        body_type: data.vehicleDetails?.bodyType,
        color: data.vehicleDetails?.color,
        engine_number: data.vehicleDetails?.engineNumber,
      },

      // Coverage Details
      coverage: {
        cover_start_date: data.vehicleDetails?.cover_start_date,
        cover_end_date: this._calculateEndDate(data.vehicleDetails?.cover_start_date),
        sum_insured: data.pricingInputs?.sum_insured,
      },

      // Underwriter Selection
      underwriter: {
        code: data.selectedUnderwriter?.code,
        name: data.selectedUnderwriter?.name,
      },

      // Pricing
      pricing: {
        base_premium: data.selectedUnderwriter?.base_premium,
        total_premium: data.selectedUnderwriter?.total_premium,
        breakdown: data.selectedUnderwriter?.breakdown,
        addons: data.pricingInputs?.selectedAddons || [],
      },

      // Client Details
      client: {
        id_number: data.clientDetails?.idNumber,
        full_name: data.clientDetails?.fullName,
        email: data.clientDetails?.email,
        phone: data.clientDetails?.phone,
        address: data.clientDetails?.address,
      },

      // Documents
      documents: data.uploadedDocuments || [],

      // Payment Details (if exists)
      payment: data.paymentDetails || null,
    };
  }

  /**
   * Legacy fallback: submit Third-Party quote via public Motor2 endpoint
   * @private
   */
  async _submitThirdPartyLegacyFallback(data) {
    const legacyBody = {
      vehicle_make: data?.vehicleDetails?.make || '',
      vehicle_model: data?.vehicleDetails?.model || '',
      vehicle_year: data?.vehicleDetails?.year || '',
      vehicle_registration: data?.vehicleDetails?.registration || data?.vehicleDetails?.registrationNumber || '',
      cover_type: 'THIRD_PARTY',
      owner_name: data?.clientDetails?.fullName || '',
      owner_id_number: data?.clientDetails?.idNumber || '',
      owner_phone: (data?.clientDetails?.phone || '').replace(/^\+254/, '0'),
      cover_start_date: data?.vehicleDetails?.cover_start_date || '',
      cover_end_date: this._calculateEndDate(data?.vehicleDetails?.cover_start_date) || '',
    };

    const resp = await this.djangoAPI.makeRequest('/api/v1/public_app/insurance/submit_motor_quotation', {
      method: 'POST',
      body: JSON.stringify(legacyBody),
    });
    return resp;
  }

  /**
   * Legacy fallback: submit Comprehensive quote via public Motor2 endpoint
   * @private
   */
  async _submitComprehensiveLegacyFallback(data) {
    const legacyBody = {
      vehicle_make: data?.vehicleDetails?.make || '',
      vehicle_model: data?.vehicleDetails?.model || '',
      vehicle_year: data?.vehicleDetails?.year || '',
      vehicle_registration: data?.vehicleDetails?.registration || data?.vehicleDetails?.registrationNumber || '',
      cover_type: 'COMPREHENSIVE',
      owner_name: data?.clientDetails?.fullName || '',
      owner_id_number: data?.clientDetails?.idNumber || '',
      owner_phone: (data?.clientDetails?.phone || '').replace(/^\+254/, '0'),
      cover_start_date: data?.vehicleDetails?.cover_start_date || '',
      cover_end_date: this._calculateEndDate(data?.vehicleDetails?.cover_start_date) || '',
      sum_insured: data?.pricingInputs?.sum_insured || '',
    };

    const resp = await this.djangoAPI.makeRequest('/api/v1/public_app/insurance/submit_motor_quotation', {
      method: 'POST',
      body: JSON.stringify(legacyBody),
    });
    return resp;
  }

  /**
   * Calculate cover end date (12 months from start)
   * @private
   */
  _calculateEndDate(startDate) {
    if (!startDate) return null;
    const date = new Date(startDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get quotation by ID
   */
  async getQuotationById(quoteId) {
    const cacheKey = `motor3_quotes|detail|${quoteId}`;
    const cached = await SimpleCache.get(cacheKey);
    if (cached) return cached;

    const resp = await this.djangoAPI.makeRequest(`/api/motor3/quotations/${quoteId}/`, {
      method: 'GET',
    });

    await SimpleCache.set(cacheKey, resp, 2 * 60 * 1000);
    return resp;
  }

  /**
   * List all quotations with filters
   */
  async listQuotations(filters = {}) {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', String(filters.status));
    if (filters?.registration_number || filters?.registration) {
      params.set('registration_number', String(filters.registration_number || filters.registration));
    }

    const qs = params.toString();
    const url = qs ? `/api/motor3/quotations/?${qs}` : '/api/motor3/quotations/';

    const cacheKey = `motor3_quotes|list|${qs || 'all'}`;
    const cached = await SimpleCache.get(cacheKey);
    if (cached) return cached;

    const resp = await this.djangoAPI.makeRequest(url, { method: 'GET' });
    await SimpleCache.set(cacheKey, resp, 2 * 60 * 1000);
    return resp;
  }
}

// Export singleton instance
export const motor3QuotationService = new Motor3QuotationService();
export default motor3QuotationService;
