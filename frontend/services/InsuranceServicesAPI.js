/**
 * Enhanced Insurance Services API
 * Integrates with services backend for comprehensive insurance management
 */

import djangoAPI from './DjangoAPIService';

class InsuranceServicesAPI {
  constructor() {
    // Configuration for multiple backends
    this.servicesBackendURL = 'http://10.0.2.2:8000/api'; // Services backend URL  
    this.insuranceAppURL = 'http://127.0.0.1:8000/api/v1/public_app'; // Local insurance-app URL
  this.djangoAPI = djangoAPI;
    
    // Default to services backend, fallback to insurance-app
    this.baseURL = this.servicesBackendURL;
  }

  /**
   * Switch to using local insurance-app backend
   */
  useInsuranceApp() {
    this.baseURL = this.insuranceAppURL;
    return this;
  }

  /**
   * Switch to using services backend
   */
  useServicesBackend() {
    this.baseURL = this.servicesBackendURL;
    return this;
  }

  // ===============================
  // INSURANCE PROVIDERS
  // ===============================

  /**
   * Get all active insurance providers
   */
  async getInsuranceProviders() {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/providers/`,
        'GET'
      );
      return {
        success: true,
        data: response.data?.results || response.data || []
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get providers failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch insurance providers'
      };
    }
  }

  /**
   * Get specific insurance provider by ID
   */
  async getInsuranceProvider(providerId) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/providers/${providerId}/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get provider failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch insurance provider'
      };
    }
  }

  // ===============================
  // VEHICLE MANAGEMENT
  // ===============================

  /**
   * Get user's vehicles
   */
  async getVehicles(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      if (filters.vehicle_type) {
        queryParams.append('vehicle_type', filters.vehicle_type);
      }
      if (filters.verified) {
        queryParams.append('dmvic_verified', filters.verified);
      }

      const url = `${this.baseURL}/insurance/vehicles/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.djangoAPI.makeAuthenticatedRequest(url, 'GET');
      
      return {
        success: true,
        data: response.data?.results || response.data || []
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get vehicles failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch vehicles'
      };
    }
  }

  /**
   * Create new vehicle
   */
  async createVehicle(vehicleData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/vehicles/`,
        'POST',
        vehicleData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Create vehicle failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create vehicle'
      };
    }
  }

  /**
   * Update vehicle
   */
  async updateVehicle(vehicleId, vehicleData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/vehicles/${vehicleId}/`,
        'PATCH',
        vehicleData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Update vehicle failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to update vehicle'
      };
    }
  }

  /**
   * Verify vehicle with DMVIC
   */
  async verifyVehicleWithDMVIC(vehicleId) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/vehicles/${vehicleId}/verify_with_dmvic/`,
        'POST'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] DMVIC verification failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify vehicle with DMVIC'
      };
    }
  }

  // ===============================
  // MOTOR INSURANCE POLICIES
  // ===============================

  /**
   * Get user's insurance policies
   */
  async getInsurancePolicies(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      if (filters.expiring_in_days) {
        queryParams.append('expiring_in_days', filters.expiring_in_days);
      }
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      if (filters.ordering) {
        queryParams.append('ordering', filters.ordering);
      }

      const url = `${this.baseURL}/insurance/policies/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.djangoAPI.makeAuthenticatedRequest(url, 'GET');
      
      return {
        success: true,
        data: response.data?.results || response.data || []
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get policies failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch insurance policies'
      };
    }
  }

  /**
   * Get specific insurance policy
   */
  async getInsurancePolicy(policyId) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/policies/${policyId}/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get policy failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch insurance policy'
      };
    }
  }

  /**
   * Create new insurance policy
   */
  async createInsurancePolicy(policyData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/policies/`,
        'POST',
        policyData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Create policy failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create insurance policy'
      };
    }
  }

  /**
   * Update insurance policy status
   */
  async updatePolicyStatus(policyId, statusData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/policies/${policyId}/update_status/`,
        'POST',
        statusData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Update policy status failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to update policy status'
      };
    }
  }

  // ===============================
  // PREMIUM CALCULATIONS
  // ===============================

  /**
   * Calculate premium for policy
   */
  async calculatePremium(calculationData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/calculations/`,
        'POST',
        calculationData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Premium calculation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to calculate premium'
      };
    }
  }

  /**
   * Get premium calculations
   */
  async getPremiumCalculations(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.policy_id) {
        queryParams.append('policy', filters.policy_id);
      }
      if (filters.calculation_method) {
        queryParams.append('calculation_method', filters.calculation_method);
      }

      const url = `${this.baseURL}/insurance/calculations/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.djangoAPI.makeAuthenticatedRequest(url, 'GET');
      
      return {
        success: true,
        data: response.data?.results || response.data || []
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get premium calculations failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch premium calculations'
      };
    }
  }

  // ===============================
  // DASHBOARD ANALYTICS
  // ===============================

  /**
   * Get dashboard overview
   */
  async getDashboardOverview() {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/dashboard/overview/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get dashboard overview failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch dashboard overview'
      };
    }
  }

  /**
   * Get insurance analytics
   */
  async getInsuranceAnalytics(period = '30') {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/dashboard/analytics/?period=${period}`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get analytics failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch analytics'
      };
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/dashboard/system-stats/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get system stats failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch system statistics'
      };
    }
  }

  // ===============================
  // MOTOR INSURANCE CATEGORIES
  // ===============================

  /**
   * PRIVATE MOTOR INSURANCE CATEGORIES
   */

  /**
   * Create Private TOR Quotation
   */
  async createPrivateTORQuotation(quotationData) {
    try {
      const payload = {
        category: 'private',
        product_type: 'tor_private',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/private/tor/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Private TOR quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Private TOR quotation'
      };
    }
  }

  /**
   * Create Private Third-Party Quotation
   */
  async createPrivateThirdPartyQuotation(quotationData) {
    try {
      const payload = {
        category: 'private',
        product_type: 'third_party',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/private/third-party/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Private Third-Party quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Private Third-Party quotation'
      };
    }
  }

  /**
   * Create Private Third-Party Extendible Quotation
   */
  async createPrivateExtendibleQuotation(quotationData) {
    try {
      const payload = {
        category: 'private',
        product_type: 'third_party_extendible',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/private/extendible/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Private Extendible quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Private Extendible quotation'
      };
    }
  }

  /**
   * Create Private Comprehensive Quotation
   */
  async createPrivateComprehensiveQuotation(quotationData) {
    try {
      const payload = {
        category: 'private',
        product_type: 'comprehensive',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/private/comprehensive/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Private Comprehensive quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Private Comprehensive quotation'
      };
    }
  }

  /**
   * COMMERCIAL MOTOR INSURANCE CATEGORIES
   */

  /**
   * Create Commercial TOR Quotation
   */
  async createCommercialTORQuotation(quotationData) {
    try {
      const payload = {
        category: 'commercial',
        product_type: 'tor_commercial',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/commercial/tor/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Commercial TOR quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Commercial TOR quotation'
      };
    }
  }

  /**
   * Create Commercial Third-Party Quotation
   */
  async createCommercialThirdPartyQuotation(quotationData) {
    try {
      const payload = {
        category: 'commercial',
        product_type: 'third_party',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/commercial/third-party/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Commercial Third-Party quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Commercial Third-Party quotation'
      };
    }
  }

  /**
   * Create Commercial Comprehensive Quotation
   */
  async createCommercialComprehensiveQuotation(quotationData) {
    try {
      const payload = {
        category: 'commercial',
        product_type: 'comprehensive',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/commercial/comprehensive/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Commercial Comprehensive quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Commercial Comprehensive quotation'
      };
    }
  }

  /**
   * Create TukTuk Comprehensive Quotation
   */
  async createTukTukComprehensiveQuotation(quotationData) {
    try {
      const payload = {
        category: 'commercial',
        product_type: 'tuktuk_comprehensive',
        vehicle_type: 'tuktuk',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/commercial/tuktuk/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] TukTuk Comprehensive quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create TukTuk Comprehensive quotation'
      };
    }
  }

  /**
   * MOTORCYCLE INSURANCE CATEGORIES
   */

  /**
   * Create Motorcycle Third-Party Quotation
   */
  async createMotorcycleThirdPartyQuotation(quotationData) {
    try {
      const payload = {
        category: 'motorcycle',
        product_type: 'third_party',
        vehicle_type: 'motorcycle',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/motorcycle/third-party/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Motorcycle Third-Party quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Motorcycle Third-Party quotation'
      };
    }
  }

  /**
   * Create Motorcycle Comprehensive Quotation
   */
  async createMotorcycleComprehensiveQuotation(quotationData) {
    try {
      const payload = {
        category: 'motorcycle',
        product_type: 'comprehensive',
        vehicle_type: 'motorcycle',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/motorcycle/comprehensive/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Motorcycle Comprehensive quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Motorcycle Comprehensive quotation'
      };
    }
  }

  /**
   * PSV INSURANCE CATEGORIES
   */

  /**
   * Create PSV Third-Party Quotation
   */
  async createPSVThirdPartyQuotation(quotationData) {
    try {
      const payload = {
        category: 'psv',
        product_type: 'third_party',
        vehicle_type: 'psv',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/psv/third-party/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] PSV Third-Party quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create PSV Third-Party quotation'
      };
    }
  }

  /**
   * Create Matatu Cover Quotation
   */
  async createMatatuCoverQuotation(quotationData) {
    try {
      const payload = {
        category: 'psv',
        product_type: 'matatu_cover',
        vehicle_type: 'matatu',
        ...quotationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/psv/matatu/quotation/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Matatu Cover quotation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Matatu Cover quotation'
      };
    }
  }

  /**
   * CATEGORY-SPECIFIC PREMIUM CALCULATIONS
   */

  /**
   * Calculate premium for specific category and product
   */
  async calculateCategoryPremium(category, productType, calculationData) {
    try {
      const payload = {
        category,
        product_type: productType,
        ...calculationData
      };

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/${category}/calculate-premium/`,
        'POST',
        payload
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`[InsuranceAPI] ${category} premium calculation failed:`, error);
      return {
        success: false,
        error: error.message || `Failed to calculate ${category} premium`
      };
    }
  }

  /**
   * Get available underwriters for category
   */
  async getCategoryUnderwriters(category, productType) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/${category}/${productType}/underwriters/`,
        'GET'
      );
      return {
        success: true,
        data: response.data?.underwriters || response.data || []
      };
    } catch (error) {
      console.error(`[InsuranceAPI] Get ${category} underwriters failed:`, error);
      return {
        success: false,
        error: error.message || `Failed to fetch ${category} underwriters`
      };
    }
  }

  /**
   * FORM CONFIGURATION HELPERS
   */

  /**
   * Get form configuration for specific category and product
   */
  async getCategoryFormConfig(category, productType) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/${category}/${productType}/form-config/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`[InsuranceAPI] Get ${category} form config failed:`, error);
      return {
        success: false,
        error: error.message || `Failed to fetch ${category} form configuration`
      };
    }
  }

  /**
   * Get validation schema for category
   */
  async getCategoryValidationSchema(category, productType) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/${category}/${productType}/validation-schema/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`[InsuranceAPI] Get ${category} validation schema failed:`, error);
      return {
        success: false,
        error: error.message || `Failed to fetch ${category} validation schema`
      };
    }
  }

  /**
   * CATEGORY-SPECIFIC DOCUMENT UPLOAD
   */

  /**
   * Upload documents for specific category
   */
  async uploadCategoryDocuments(category, productType, documents) {
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('product_type', productType);
      
      // Add documents to form data
      Object.keys(documents).forEach(docType => {
        if (documents[docType]) {
          formData.append(docType, documents[docType]);
        }
      });

      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/motor/${category}/documents/upload/`,
        'POST',
        formData,
        {
          'Content-Type': 'multipart/form-data'
        }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`[InsuranceAPI] Upload ${category} documents failed:`, error);
      return {
        success: false,
        error: error.message || `Failed to upload ${category} documents`
      };
    }
  }

  // ===============================
  // TOR (CERTIFICATE) WORKFLOW
  // ===============================

  /**
   * Create TOR quote
   */
  async createTORQuote(quoteData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/tor/quote/`,
        'POST',
        quoteData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] TOR quote failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create TOR quote'
      };
    }
  }

  /**
   * Upload TOR documents
   */
  async uploadTORDocuments(documentData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/tor/documents/`,
        'POST',
        documentData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] TOR document upload failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload TOR documents'
      };
    }
  }

  /**
   * Process TOR payment
   */
  async processTORPayment(paymentData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/payment/`,
        'POST',
        paymentData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] TOR payment failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to process TOR payment'
      };
    }
  }

  /**
   * Get receipt for policy
   */
  async getReceipt(policyId) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/insurance/receipt/${policyId}/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[InsuranceAPI] Get receipt failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch receipt'
      };
    }
  }
}

export default new InsuranceServicesAPI();