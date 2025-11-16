import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import { INSURANCE_CATEGORIES } from '../config/categories';

class QuotationsService {
  /**
   * Get all quotations for the current user
   */
  async getQuotations(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        status: filters.status,
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

      const response = await apiClient.get(API_ENDPOINTS.QUOTATIONS.LIST, {
        params,
      });

      return response.data;
    } catch (error) {
      console.error('Get quotations error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Get a single quotation by ID
   */
  async getQuotation(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.QUOTATIONS.GET(id));
      return response.data;
    } catch (error) {
      console.error('Get quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Create a new quotation
   */
  async createQuotation(quotationData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.QUOTATIONS.CREATE,
        quotationData
      );
      return response.data;
    } catch (error) {
      console.error('Create quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Update an existing quotation
   */
  async updateQuotation(id, quotationData) {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.QUOTATIONS.UPDATE(id),
        quotationData
      );
      return response.data;
    } catch (error) {
      console.error('Update quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Delete a quotation
   */
  async deleteQuotation(id) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.QUOTATIONS.DELETE(id));
      return response.data;
    } catch (error) {
      console.error('Delete quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Create motor insurance quotation
   */
  async createMotorQuotation(motorData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.QUOTATIONS.MOTOR,
        {
          ...motorData,
          category: 'motor', // standardized key (see categories.js)
          type: motorData.vehicleType, // private, commercial, motorcycle, psv, tuktuk, special
          coverageType: motorData.coverageType, // comprehensive, third_party, tpft
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create motor quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Create medical insurance quotation
   */
  async createMedicalQuotation(medicalData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.QUOTATIONS.MEDICAL,
        {
          ...medicalData,
          category: 'medical',
          type: medicalData.type, // individual, corporate
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create medical quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Create WIBA insurance quotation
   */
  async createWIBAQuotation(wibaData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.QUOTATIONS.WIBA,
        {
          ...wibaData,
          category: 'wiba',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create WIBA quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Create travel insurance quotation
   */
  async createTravelQuotation(travelData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.QUOTATIONS.TRAVEL,
        {
          ...travelData,
          category: 'travel',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create travel quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Create last expense insurance quotation
   */
  async createLastExpenseQuotation(lastExpenseData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.QUOTATIONS.LAST_EXPENSE,
        {
          ...lastExpenseData,
          category: 'last_expense',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create last expense quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Create professional indemnity insurance quotation
   */
  async createProfessionalIndemnityQuotation(piData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.QUOTATIONS.PROFESSIONAL_INDEMNITY,
        {
          ...piData,
          category: 'professional_indemnity',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create professional indemnity quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Create personal accident insurance quotation
   */
  async createPersonalAccidentQuotation(paData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.QUOTATIONS.PERSONAL_ACCIDENT,
        {
          ...paData,
          category: 'personal_accident',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create personal accident quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Create domestic package insurance quotation
   */
  async createDomesticPackageQuotation(dpData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.QUOTATIONS.DOMESTIC_PACKAGE,
        {
          ...dpData,
          category: 'domestic_package',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create domestic package quotation error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Get quotation statistics
   */
  async getQuotationStats(period = '30d') {
    try {
      const response = await apiClient.get(API_ENDPOINTS.QUOTATIONS.LIST, {
        params: { stats: true, period },
      });
      return response.data;
    } catch (error) {
      console.error('Get quotation stats error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Convert quotation to policy
   */
  async convertToPolicy(quotationId, paymentData) {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.QUOTATIONS.GET(quotationId)}/convert`,
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error('Convert to policy error:', error);
      throw this.handleQuotationError(error);
    }
  }

  /**
   * Handle quotation service errors
   */
  handleQuotationError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid quotation data');
        case 404:
          return new Error('Quotation not found');
        case 422:
          return new Error(data.message || 'Quotation validation failed');
        case 409:
          return new Error('Quotation already exists');
        default:
          return new Error('Quotation operation failed');
      }
    }
    
    return new Error('Network error. Please check your connection');
  }
}

// Create and export a singleton instance
const quotationsService = new QuotationsService();
export default quotationsService;
