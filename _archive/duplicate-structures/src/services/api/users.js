// Users API Service for PataBima Django Backend
import apiClient, { API_CONFIG } from '../config/apiConfig';

export const usersAPI = {
  /**
   * Get user details by user ID
   * @param {string} userId - User UUID
   */
  getUser: async (userId) => {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER.GET_USER, {
        params: { user_id: userId }
      });
      
      return {
        success: true,
        data: response.data,
        user: response.data,
        message: 'User data retrieved successfully',
      };
    } catch (error) {
      console.log('Get user error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.details || error.response?.data || 'Failed to get user',
        message: error.response?.data?.detail || 'User not found',
      };
    }
  },

  /**
   * Get current user profile (requires authentication)
   * This would typically be called after login to get the current user's details
   * You'll need to store the user ID after login to use this
   */
  getCurrentUser: async (userId) => {
    try {
      const response = await usersAPI.getUser(userId);
      return response;
    } catch (error) {
      console.log('Get current user error:', error);
      return {
        success: false,
        error: 'Failed to get current user profile',
        message: 'Unable to retrieve profile',
      };
    }
  },
};

export default usersAPI;
