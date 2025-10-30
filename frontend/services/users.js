// User API Services for PataBima Django Backend
import DjangoAPIService from './DjangoAPIService';

export const usersAPI = {
  /**
   * Get current authenticated user details
   * Uses DjangoAPIService for consistent auth, timeout, and retry handling
   * @returns {Promise} User data response
   */
  getCurrentUser: async () => {
    try {
      console.log('[usersAPI] Fetching current authenticated user details');
      
      // Use DjangoAPIService with extended timeout for EC2
      const candidates = [
        '/api/v1/public_app/user/get_current_user',
        '/api/v1/public_app/user/get_current_user/',
      ];
      
      const response = await DjangoAPIService.tryEndpoints(candidates, { 
        _traceKey: 'get_current_user',
        timeoutMs: 30000 // 30s timeout for EC2 profile data
      });

      console.log('[usersAPI] Current user details fetched successfully');
      return response;
    } catch (error) {
      console.error('[usersAPI] Get current user error:', error.message);
      
      // Provide more helpful error messages
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new Error('Session expired. Please log in again.');
      } else if (error.message?.includes('timeout') || error.message?.includes('Network')) {
        throw new Error('Network connection issue. Please check your internet and try again.');
      }
      
      throw error;
    }
  },

  /**
   * Get user details by ID
   * Uses DjangoAPIService for consistent auth, timeout, and retry handling
   * @param {string} userId - User ID
   * @returns {Promise} User data response
   */
  getUserById: async (userId) => {
    try {
      console.log('[usersAPI] Fetching user details for ID:', userId);

      const endpoint = `/api/v1/public_app/user/get_user?user_id=${encodeURIComponent(userId)}`;
      const response = await DjangoAPIService.makeRequest(endpoint, { 
        timeoutMs: 30000 
      });

      console.log('[usersAPI] User details fetched successfully');
      return response;
    } catch (error) {
      console.error('[usersAPI] Get user by ID error:', error.message);
      
      // Provide more helpful error messages
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new Error('Session expired. Please log in again.');
      } else if (error.message?.includes('timeout') || error.message?.includes('Network')) {
        throw new Error('Network connection issue. Please check your internet and try again.');
      }
      
      throw error;
    }
  },
};

export default usersAPI;