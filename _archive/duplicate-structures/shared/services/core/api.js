import { API_CONFIG, AUTH_CONFIG, ERROR_MESSAGES } from '../../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.retryAttempts = API_CONFIG.retryAttempts;
    this.retryDelay = API_CONFIG.retryDelay;
  }

  /**
   * Get stored auth token
   */
  async getAuthToken() {
    try {
      // Use AsyncStorage for React Native compatibility
      return await AsyncStorage.getItem(AUTH_CONFIG.tokenKey);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Get default headers for API requests
   */
  async getHeaders() {
    const token = await this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || ERROR_MESSAGES.server);
    }

    return data;
  }

  /**
   * Make API request with retry logic
   */
  async makeRequest(url, options = {}, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: await this.getHeaders(),
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      if (attempt < this.retryAttempts && !error.name === 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.makeRequest(url, options, attempt + 1);
      }
      
      if (error.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.timeout);
      }
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    return this.makeRequest(url.toString(), {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
    });
  }

  /**
   * Upload file
   */
  async upload(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const token = await this.getAuthToken();
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.makeRequest(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers,
    });
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;

// Authentication API methods
export const authAPI = {
  login: (credentials) => apiService.post('/auth/login', credentials),
  register: (userData) => apiService.post('/auth/register', userData),
  logout: () => apiService.post('/auth/logout'),
  refreshToken: (refreshToken) => apiService.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => apiService.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiService.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => apiService.post('/auth/verify-email', { token }),
};

// User API methods
export const userAPI = {
  getProfile: async () => {
    // Mock data for development
    return {
      id: 5869,
      name: 'John Mwangi',
      email: 'john.mwangi@patabima.com',
      phone: '+254-712-345-678',
      agentCode: 'PB-AG-5869',
      role: 'agent',
      status: 'active',
      joinDate: '2024-01-15',
      avatar: null,
      region: 'Nairobi',
      branch: 'Westlands',
      supervisor: 'Mary Njeri',
      totalSales: 2850000,
      totalCommission: 427500,
      activePolicies: 142,
      thisMonthSales: 450000,
      thisMonthCommission: 67500,
      ranking: 3,
      performanceScore: 92.5
    };
  },
  updateProfile: (data) => apiService.put('/user/profile', data),
  changePassword: (data) => apiService.put('/user/change-password', data),
  uploadAvatar: (file) => apiService.upload('/user/avatar', file),
  getSalesData: (period) => apiService.get('/user/sales', { period }),
  getCommissions: (page = 1) => apiService.get('/user/commissions', { page }),
};

// Quotations API methods
export const quotationsAPI = {
  getQuotations: (page = 1, status) => apiService.get('/quotations', { page, status }),
  createQuotation: (data) => apiService.post('/quotations', data),
  updateQuotation: (id, data) => apiService.put(`/quotations/${id}`, data),
  deleteQuotation: (id) => apiService.delete(`/quotations/${id}`),
  sendQuotation: (id) => apiService.post(`/quotations/${id}/send`),
  getMotorQuote: (vehicleData) => apiService.post('/quotations/motor/calculate', vehicleData),
};

// Policies API methods
export const policiesAPI = {
  getPolicies: (page = 1, status) => apiService.get('/policies', { page, status }),
  getPolicy: (id) => apiService.get(`/policies/${id}`),
  getRenewals: async (page = 1) => {
    // Mock renewals data
    return [
      {
        id: 'POL-001',
        policyNumber: 'PB/MOT/2024/001',
        clientName: 'David Kamau',
        vehicleReg: 'KCA 123A',
        expiryDate: '2025-02-15',
        premium: 45000,
        type: 'Motor - Comprehensive'
      },
      {
        id: 'POL-002', 
        policyNumber: 'PB/MED/2024/002',
        clientName: 'Grace Wanjiku',
        expiryDate: '2025-02-20',
        premium: 75000,
        type: 'Medical'
      }
    ];
  },
  getExtensions: async (page = 1) => {
    // Mock extensions data
    return [
      {
        id: 'EXT-001',
        policyNumber: 'PB/MOT/2024/003',
        clientName: 'Peter Otieno',
        vehicleReg: 'KBZ 456B',
        requestDate: '2025-01-25',
        premium: 52000,
        type: 'Motor - Third Party'
      }
    ];
  },
  renewPolicy: (id, data) => apiService.post(`/policies/${id}/renew`, data),
};

// Claims API methods
export const claimsAPI = {
  getClaims: async ({ status = 'pending', limit = 5 } = {}) => {
    // Mock claims data
    return [
      {
        id: 'CLM-001',
        claimNumber: 'PB/CLM/2025/001',
        policyNumber: 'PB/MOT/2024/001',
        clientName: 'John Kimani',
        incidentDate: '2025-01-20',
        claimAmount: 150000,
        status: 'pending',
        type: 'Motor Accident',
        description: 'Rear-end collision damage'
      },
      {
        id: 'CLM-002',
        claimNumber: 'PB/CLM/2025/002', 
        policyNumber: 'PB/MED/2024/002',
        clientName: 'Sarah Muthoni',
        incidentDate: '2025-01-18',
        claimAmount: 85000,
        status: 'pending',
        type: 'Medical Treatment',
        description: 'Hospital treatment expenses'
      }
    ];
  },
  getClaim: (id) => apiService.get(`/claims/${id}`),
  createClaim: (data) => apiService.post('/claims', data),
  updateClaim: (id, data) => apiService.put(`/claims/${id}`, data),
  uploadDocument: (claimId, file) => apiService.upload(`/claims/${claimId}/documents`, file),
};

// Insurance categories API methods
export const categoriesAPI = {
  getCategories: () => apiService.get('/categories'),
  getCategory: (id) => apiService.get(`/categories/${id}`),
  getCategoryRates: (id) => apiService.get(`/categories/${id}/rates`),
};

// Campaigns API methods
export const campaignsAPI = {
  getCampaigns: () => apiService.get('/campaigns'),
  getCampaign: (id) => apiService.get(`/campaigns/${id}`),
  getActiveCampaigns: () => apiService.get('/campaigns/active'),
};
