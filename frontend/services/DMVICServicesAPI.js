/**
 * DMVIC Services API
 * Integrates with services backend for DMVIC certificate management
 */

import djangoAPI from './DjangoAPIService';

class DMVICServicesAPI {
  constructor() {
    this.baseURL = 'http://10.0.2.2:8000/api'; // Services backend URL
    this.djangoAPI = djangoAPI;
  }

  // ===============================
  // DMVIC CERTIFICATES
  // ===============================

  /**
   * Get user's DMVIC certificates
   */
  async getCertificates(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      if (filters.policy_id) {
        queryParams.append('policy', filters.policy_id);
      }
      if (filters.search) {
        queryParams.append('search', filters.search);
      }

      const url = `${this.baseURL}/dmvic/certificates/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.djangoAPI.makeAuthenticatedRequest(url, 'GET');
      
      return {
        success: true,
        data: response.data?.results || response.data || []
      };
    } catch (error) {
      console.error('[DMVICAPI] Get certificates failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch DMVIC certificates'
      };
    }
  }

  /**
   * Get specific DMVIC certificate
   */
  async getCertificate(certificateId) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/certificates/${certificateId}/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Get certificate failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch DMVIC certificate'
      };
    }
  }

  /**
   * Download DMVIC certificate
   */
  async downloadCertificate(certificateId) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/certificates/${certificateId}/download/`,
        'POST'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Download certificate failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to download certificate'
      };
    }
  }

  /**
   * Check certificate status
   */
  async checkCertificateStatus(certificateId) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/certificates/${certificateId}/status/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Check certificate status failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to check certificate status'
      };
    }
  }

  // ===============================
  // DMVIC TRANSACTIONS
  // ===============================

  /**
   * Get DMVIC transactions
   */
  async getTransactions(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      if (filters.transaction_type) {
        queryParams.append('transaction_type', filters.transaction_type);
      }
      if (filters.start_date) {
        queryParams.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        queryParams.append('end_date', filters.end_date);
      }

      const url = `${this.baseURL}/dmvic/transactions/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.djangoAPI.makeAuthenticatedRequest(url, 'GET');
      
      return {
        success: true,
        data: response.data?.results || response.data || []
      };
    } catch (error) {
      console.error('[DMVICAPI] Get transactions failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch DMVIC transactions'
      };
    }
  }

  /**
   * Get specific DMVIC transaction
   */
  async getTransaction(transactionId) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/transactions/${transactionId}/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Get transaction failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch DMVIC transaction'
      };
    }
  }

  // ===============================
  // DMVIC SERVICE OPERATIONS
  // ===============================

  /**
   * Test DMVIC connection
   */
  async testConnection() {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/test-connection/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Test connection failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to test DMVIC connection'
      };
    }
  }

  /**
   * Check DMVIC service health
   */
  async checkServiceHealth() {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/health/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Service health check failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to check DMVIC service health'
      };
    }
  }

  /**
   * Get DMVIC dashboard statistics
   */
  async getDashboardStats() {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/dashboard/stats/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Get dashboard stats failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch DMVIC dashboard statistics'
      };
    }
  }

  /**
   * Get webhook status
   */
  async getWebhookStatus() {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/webhook/status/`,
        'GET'
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Get webhook status failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch webhook status'
      };
    }
  }

  // ===============================
  // VEHICLE VERIFICATION
  // ===============================

  /**
   * Verify vehicle details with DMVIC
   */
  async verifyVehicle(vehicleData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/service/`,
        'POST',
        {
          action: 'verify_vehicle',
          ...vehicleData
        }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Vehicle verification failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify vehicle with DMVIC'
      };
    }
  }

  /**
   * Issue certificate through DMVIC
   */
  async issueCertificate(certificateData) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/service/`,
        'POST',
        {
          action: 'issue_certificate',
          ...certificateData
        }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Certificate issuance failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to issue certificate'
      };
    }
  }

  /**
   * Cancel certificate through DMVIC
   */
  async cancelCertificate(certificateId, reason) {
    try {
      const response = await this.djangoAPI.makeAuthenticatedRequest(
        `${this.baseURL}/dmvic/service/`,
        'POST',
        {
          action: 'cancel_certificate',
          certificate_id: certificateId,
          cancellation_reason: reason
        }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[DMVICAPI] Certificate cancellation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel certificate'
      };
    }
  }
}

export default new DMVICServicesAPI();