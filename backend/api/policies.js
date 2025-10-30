import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

class PoliciesService {
  /**
   * Get all policies for the current user
   */
  async getPolicies(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        status: filters.status, // active, expired, cancelled
        category: filters.category,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc',
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) delete params[key];
      });

      const response = await apiClient.get(API_ENDPOINTS.POLICIES.LIST, {
        params,
      });

      return response.data;
    } catch (error) {
      console.error('Get policies error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Get a single policy by ID
   */
  async getPolicy(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.POLICIES.GET(id));
      return response.data;
    } catch (error) {
      console.error('Get policy error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Create a new policy
   */
  async createPolicy(policyData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.POLICIES.CREATE,
        policyData
      );
      return response.data;
    } catch (error) {
      console.error('Create policy error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Update an existing policy
   */
  async updatePolicy(id, policyData) {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.POLICIES.UPDATE(id),
        policyData
      );
      return response.data;
    } catch (error) {
      console.error('Update policy error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Renew a policy
   */
  async renewPolicy(id, renewalData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.POLICIES.RENEW(id),
        {
          ...renewalData,
          renewalType: 'standard', // standard, early, late
          paymentMethod: renewalData.paymentMethod,
          adjustments: renewalData.adjustments || [],
        }
      );
      return response.data;
    } catch (error) {
      console.error('Renew policy error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Extend a policy
   */
  async extendPolicy(id, extensionData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.POLICIES.EXTEND(id),
        {
          ...extensionData,
          extensionPeriod: extensionData.extensionPeriod, // in months
          reason: extensionData.reason,
          adjustments: extensionData.adjustments || [],
        }
      );
      return response.data;
    } catch (error) {
      console.error('Extend policy error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Get upcoming policies (renewals and expirations)
   */
  async getUpcomingPolicies(daysAhead = 30) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.POLICIES.UPCOMING, {
        params: { daysAhead },
      });
      return response.data;
    } catch (error) {
      console.error('Get upcoming policies error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Get active policies
   */
  async getActivePolicies() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.POLICIES.ACTIVE);
      return response.data;
    } catch (error) {
      console.error('Get active policies error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Get expired policies
   */
  async getExpiredPolicies() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.POLICIES.EXPIRED);
      return response.data;
    } catch (error) {
      console.error('Get expired policies error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Cancel a policy
   */
  async cancelPolicy(id, cancellationData) {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.POLICIES.GET(id)}/cancel`,
        {
          reason: cancellationData.reason,
          effectiveDate: cancellationData.effectiveDate,
          refundRequested: cancellationData.refundRequested || false,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Cancel policy error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Get policy documents
   */
  async getPolicyDocuments(id) {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.POLICIES.GET(id)}/documents`
      );
      return response.data;
    } catch (error) {
      console.error('Get policy documents error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Download policy certificate
   */
  async downloadPolicyCertificate(id) {
    try {
      const response = await apiClient.downloadFile(
        `${API_ENDPOINTS.POLICIES.GET(id)}/certificate`
      );
      return response;
    } catch (error) {
      console.error('Download policy certificate error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Get policy premium calculation
   */
  async calculatePremium(policyData) {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.POLICIES.LIST}/calculate-premium`,
        policyData
      );
      return response.data;
    } catch (error) {
      console.error('Calculate premium error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Update policy beneficiaries
   */
  async updateBeneficiaries(id, beneficiaries) {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.POLICIES.GET(id)}/beneficiaries`,
        { beneficiaries }
      );
      return response.data;
    } catch (error) {
      console.error('Update beneficiaries error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Get policy statistics
   */
  async getPolicyStats(period = '30d') {
    try {
      const response = await apiClient.get(API_ENDPOINTS.POLICIES.LIST, {
        params: { stats: true, period },
      });
      return response.data;
    } catch (error) {
      console.error('Get policy stats error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Search policies
   */
  async searchPolicies(searchTerm) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.POLICIES.LIST, {
        params: { search: searchTerm },
      });
      return response.data;
    } catch (error) {
      console.error('Search policies error:', error);
      throw this.handlePolicyError(error);
    }
  }

  /**
   * Handle policy service errors
   */
  handlePolicyError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid policy data');
        case 404:
          return new Error('Policy not found');
        case 422:
          return new Error(data.message || 'Policy validation failed');
        case 409:
          return new Error('Policy operation conflict');
        case 403:
          return new Error('Not authorized to access this policy');
        default:
          return new Error('Policy operation failed');
      }
    }
    
    return new Error('Network error. Please check your connection');
  }
}

// Create and export a singleton instance
const policiesService = new PoliciesService();
export default policiesService;
