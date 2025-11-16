import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

class ClaimsService {
  /**
   * Get all claims for the current user
   */
  async getClaims(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        status: filters.status, // pending, processing, approved, rejected, paid
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

      const response = await apiClient.get(API_ENDPOINTS.CLAIMS.LIST, {
        params,
      });

      return response.data;
    } catch (error) {
      console.error('Get claims error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Get a single claim by ID
   */
  async getClaim(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CLAIMS.GET(id));
      return response.data;
    } catch (error) {
      console.error('Get claim error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Create a new claim
   */
  async createClaim(claimData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CLAIMS.CREATE,
        {
          ...claimData,
          submissionDate: new Date().toISOString(),
          status: 'pending',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create claim error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Submit a claim with documents
   */
  async submitClaim(claimData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CLAIMS.SUBMIT,
        {
          ...claimData,
          submissionDate: new Date().toISOString(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Submit claim error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Update an existing claim
   */
  async updateClaim(id, claimData) {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.CLAIMS.UPDATE(id),
        claimData
      );
      return response.data;
    } catch (error) {
      console.error('Update claim error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Upload document for a claim
   */
  async uploadClaimDocument(claimId, documentData, onUploadProgress) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: documentData.uri,
        type: documentData.type,
        name: documentData.name,
      });
      formData.append('documentType', documentData.documentType);
      formData.append('description', documentData.description || '');

      const response = await apiClient.uploadFile(
        API_ENDPOINTS.CLAIMS.UPLOAD_DOCUMENT(claimId),
        formData,
        onUploadProgress
      );

      return response.data;
    } catch (error) {
      console.error('Upload claim document error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Get documents for a claim
   */
  async getClaimDocuments(claimId) {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CLAIMS.GET_DOCUMENTS(claimId)
      );
      return response.data;
    } catch (error) {
      console.error('Get claim documents error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Track claim status
   */
  async trackClaim(claimId) {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.CLAIMS.TRACK(claimId)
      );
      return response.data;
    } catch (error) {
      console.error('Track claim error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Get claim timeline/history
   */
  async getClaimTimeline(claimId) {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.CLAIMS.GET(claimId)}/timeline`
      );
      return response.data;
    } catch (error) {
      console.error('Get claim timeline error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Add comment to claim
   */
  async addClaimComment(claimId, comment) {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.CLAIMS.GET(claimId)}/comments`,
        {
          comment,
          timestamp: new Date().toISOString(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Add claim comment error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Get claim comments
   */
  async getClaimComments(claimId) {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.CLAIMS.GET(claimId)}/comments`
      );
      return response.data;
    } catch (error) {
      console.error('Get claim comments error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Cancel a claim
   */
  async cancelClaim(claimId, reason) {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.CLAIMS.GET(claimId)}/cancel`,
        {
          reason,
          cancelledDate: new Date().toISOString(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Cancel claim error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Get claim statistics
   */
  async getClaimStats(period = '30d') {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CLAIMS.LIST, {
        params: { stats: true, period },
      });
      return response.data;
    } catch (error) {
      console.error('Get claim stats error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Search claims
   */
  async searchClaims(searchTerm) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CLAIMS.LIST, {
        params: { search: searchTerm },
      });
      return response.data;
    } catch (error) {
      console.error('Search claims error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Get pending claims count
   */
  async getPendingClaimsCount() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CLAIMS.LIST, {
        params: { status: 'pending', count: true },
      });
      return response.data.count;
    } catch (error) {
      console.error('Get pending claims count error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Get processed claims count
   */
  async getProcessedClaimsCount() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CLAIMS.LIST, {
        params: { status: 'processed', count: true },
      });
      return response.data.count;
    } catch (error) {
      console.error('Get processed claims count error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Download claim receipt
   */
  async downloadClaimReceipt(claimId) {
    try {
      const response = await apiClient.downloadFile(
        `${API_ENDPOINTS.CLAIMS.GET(claimId)}/receipt`
      );
      return response;
    } catch (error) {
      console.error('Download claim receipt error:', error);
      throw this.handleClaimError(error);
    }
  }

  /**
   * Handle claim service errors
   */
  handleClaimError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid claim data');
        case 404:
          return new Error('Claim not found');
        case 422:
          return new Error(data.message || 'Claim validation failed');
        case 409:
          return new Error('Claim already exists');
        case 403:
          return new Error('Not authorized to access this claim');
        case 413:
          return new Error('File too large');
        default:
          return new Error('Claim operation failed');
      }
    }
    
    return new Error('Network error. Please check your connection');
  }
}

// Create and export a singleton instance
const claimsService = new ClaimsService();
export default claimsService;
