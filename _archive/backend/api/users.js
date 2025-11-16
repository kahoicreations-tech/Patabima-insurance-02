import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

class UsersService {
  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.USERS.UPDATE_PROFILE,
        profileData
      );
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Get user dashboard data
   */
  async getDashboard() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.DASHBOARD);
      return response.data;
    } catch (error) {
      console.error('Get dashboard error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(period = '30d') {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.STATS, {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Get commission data
   */
  async getCommission(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        period: filters.period || '30d',
        status: filters.status, // pending, paid
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) delete params[key];
      });

      const response = await apiClient.get(API_ENDPOINTS.USERS.COMMISSION, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Get commission error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Get sales data
   */
  async getSales(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        period: filters.period || '30d',
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

      const response = await apiClient.get(API_ENDPOINTS.USERS.SALES, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Get sales error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Get user activity log
   */
  async getActivity(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        type: filters.type, // login, quotation, policy, claim
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) delete params[key];
      });

      const response = await apiClient.get(API_ENDPOINTS.USERS.ACTIVITY, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Get activity error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Update user avatar
   */
  async updateAvatar(avatarData, onUploadProgress) {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: avatarData.uri,
        type: avatarData.type,
        name: avatarData.name || 'avatar.jpg',
      });

      const response = await apiClient.uploadFile(
        `${API_ENDPOINTS.USERS.PROFILE}/avatar`,
        formData,
        onUploadProgress
      );

      return response.data;
    } catch (error) {
      console.error('Update avatar error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.USERS.PROFILE}/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences) {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.USERS.PROFILE}/notifications`,
        preferences
      );
      return response.data;
    } catch (error) {
      console.error('Update notification preferences error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(period = '30d') {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.USERS.STATS}/performance`,
        {
          params: { period },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Get performance metrics error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(type = 'sales', period = '30d') {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.USERS.STATS}/leaderboard`,
        {
          params: { type, period },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Get agent targets
   */
  async getTargets() {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.USERS.STATS}/targets`
      );
      return response.data;
    } catch (error) {
      console.error('Get targets error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Update agent targets
   */
  async updateTargets(targets) {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.USERS.STATS}/targets`,
        targets
      );
      return response.data;
    } catch (error) {
      console.error('Update targets error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Request commission payout
   */
  async requestCommissionPayout(payoutData) {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.USERS.COMMISSION}/payout`,
        payoutData
      );
      return response.data;
    } catch (error) {
      console.error('Request commission payout error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Get commission history
   */
  async getCommissionHistory(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) delete params[key];
      });

      const response = await apiClient.get(
        `${API_ENDPOINTS.USERS.COMMISSION}/history`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Get commission history error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Export user data
   */
  async exportUserData(dataType, format = 'pdf') {
    try {
      const response = await apiClient.downloadFile(
        `${API_ENDPOINTS.USERS.PROFILE}/export`,
        {
          params: { type: dataType, format },
        }
      );
      return response;
    } catch (error) {
      console.error('Export user data error:', error);
      throw this.handleUserError(error);
    }
  }

  /**
   * Handle user service errors
   */
  handleUserError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid user data');
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Access denied');
        case 404:
          return new Error('User not found');
        case 422:
          return new Error(data.message || 'User validation failed');
        case 413:
          return new Error('File too large');
        default:
          return new Error('User operation failed');
      }
    }
    
    return new Error('Network error. Please check your connection');
  }
}

// Create and export a singleton instance
const usersService = new UsersService();
export default usersService;
