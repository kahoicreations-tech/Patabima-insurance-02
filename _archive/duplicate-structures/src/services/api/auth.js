// Authentication API Service for PataBima Django Backend
import apiClient, { API_CONFIG, storeTokens, clearTokens } from '../config/apiConfig';

export const authAPI = {
  /**
   * Register a new user (Agent or Customer)
   * @param {Object} userData 
   * @param {string} userData.phonenumber - 9 digits (e.g., "712345678")
   * @param {string} userData.full_names - Full name
   * @param {string} userData.email - Email (optional)
   * @param {string} userData.user_role - "AGENT" or "CUSTOMER"
   * @param {string} userData.password - Password
   * @param {string} userData.confirm_password - Confirm password
   */
  signup: async (userData) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, userData);
      return {
        success: true,
        data: response.data,
        message: response.data.detail || 'User created successfully',
      };
    } catch (error) {
      console.log('Signup error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.details || error.response?.data || 'Signup failed',
        message: error.response?.data?.detail || 'Failed to create account',
      };
    }
  },

  /**
   * Login Step 1: Send credentials and get OTP
   * @param {Object} credentials 
   * @param {string} credentials.phonenumber - 9 digits (e.g., "712345678")
   * @param {string} credentials.password - User password
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
      return {
        success: true,
        data: response.data,
        message: response.data.detail || 'OTP sent successfully',
        otpCode: response.data.otp_code, // For development only
      };
    } catch (error) {
      console.log('Login error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.details || error.response?.data || 'Login failed',
        message: error.response?.data?.detail || 'Invalid credentials',
      };
    }
  },

  /**
   * Login Step 2: Verify OTP and get JWT tokens
   * @param {Object} authData 
   * @param {string} authData.phonenumber - 9 digits (e.g., "712345678")
   * @param {string} authData.password - User password
   * @param {string} authData.code - OTP code
   */
  authLogin: async (authData) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.AUTH_LOGIN, authData);
      
      // Store tokens if login successful
      if (response.data.access && response.data.refresh) {
        await storeTokens(
          response.data.access,
          response.data.refresh,
          response.data.user_role
        );
      }

      return {
        success: true,
        data: response.data,
        message: 'Login successful',
        tokens: {
          access: response.data.access,
          refresh: response.data.refresh,
          expiresAt: response.data.expires_at,
        },
        userRole: response.data.user_role,
      };
    } catch (error) {
      console.log('Auth login error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.details || error.response?.data || 'Authentication failed',
        message: error.response?.data?.detail || 'Invalid OTP or credentials',
      };
    }
  },

  /**
   * Reset password for authenticated user
   * @param {Object} passwordData 
   * @param {string} passwordData.old_password - Current password
   * @param {string} passwordData.password - New password
   * @param {string} passwordData.confirm_password - Confirm new password
   */
  resetPassword: async (passwordData) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, passwordData);
      return {
        success: true,
        data: response.data,
        message: response.data.detail || 'Password reset successfully',
      };
    } catch (error) {
      console.log('Reset password error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.details || error.response?.data || 'Password reset failed',
        message: error.response?.data?.detail || 'Failed to reset password',
      };
    }
  },

  /**
   * Logout user - clear stored tokens
   */
  logout: async () => {
    try {
      await clearTokens();
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.log('Logout error:', error);
      return {
        success: false,
        error: 'Failed to logout',
        message: 'Logout failed',
      };
    }
  },
};

export default authAPI;
