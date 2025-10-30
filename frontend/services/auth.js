// Authentication API Services for PataBima Django Backend
import apiClient, { API_CONFIG, storeTokens, clearTokens } from './apiConfig';

export const authAPI = {
  /**
   * User signup with phone number
   * @param {Object} userData - User registration data
   * @param {string} userData.phone_number - 9-digit phone number
   * @param {string} userData.password - User password
   * @param {string} userData.role - User role ('agent' or 'customer')
   * @returns {Promise} Signup response
   */
  signup: async (userData) => {
    try {
      console.log('Attempting signup with data:', userData);

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, userData);

      console.log('Signup successful:', response.data);
      return response.data;
    } catch (error) {
      console.log('Signup error status:', error.response?.status);
      console.log('Signup error details:', error.response?.data);
      console.log('Signup error message:', error.message);
      
      // Log the full error structure to help debug
      if (error.response?.data) {
        console.log('Django validation errors:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
  },

  /**
   * User login with phone number and password
   * @param {string} phone_number - 9-digit phone number
   * @param {string} password - User password
   * @returns {Promise} Login response with OTP details
   */
  login: async (phone_number, password) => {
    try {
      console.log('Attempting login with phone:', phone_number, 'password length:', password.length);

      const loginData = {
        phonenumber: phone_number,
        password,
      };
      console.log('Login data being sent:', loginData);

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, loginData);

      console.log('Login successful - OTP sent:', response.data);
      return response.data;
    } catch (error) {
      console.log('Login error details:', error.response?.data);
      console.log('Login error status:', error.response?.status);
      console.log('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Complete authentication with OTP
   * @param {string} phone_number - 9-digit phone number
   * @param {string} password - User password (required by Django serializer)
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise} Authentication response with tokens
   */
  authLogin: async (phone_number, password, otp) => {
    try {
      console.log('Attempting auth login with phone:', phone_number);

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.AUTH_LOGIN, {
        phonenumber: phone_number,
        password: password, // Required by Django serializer
        code: otp,
      });

      console.log('Auth login successful:', response.data);

      // Store tokens if authentication successful
      if (response.data.access && response.data.refresh) {
        await storeTokens(
          response.data.access,
          response.data.refresh,
          response.data.user_role || 'AGENT'
        );
        console.log('Tokens stored successfully');
      }

      return response.data;
    } catch (error) {
      console.log('Auth login error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Logout user and clear tokens
   * @returns {Promise} Logout success
   */
  logout: async () => {
    try {
      await clearTokens();
      console.log('Logout successful');
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.log('Logout error:', error);
      throw error;
    }
  },

  /**
   * Reset password for user
   * @param {string} phone_number - 9-digit phone number
   * @param {string} new_password - New password
   * @returns {Promise} Password reset response
   */
  resetPassword: async (phone_number, new_password, confirm_password) => {
    try {
      console.log('Attempting password reset for phone:', phone_number);

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
        username: phone_number, // Django expects 'username' field
        password: new_password,
        confirm_password: confirm_password,
      });

      console.log('Password reset successful:', response.data);
      return response.data;
    } catch (error) {
      console.log('Password reset error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Validate phone number availability
   * @param {string} phonenumber - 9-digit phone number
   * @returns {Promise} Validation response
   */
  validatePhone: async (phonenumber) => {
    try {
      console.log('Validating phone number:', phonenumber);

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.VALIDATE_PHONE, {
        phonenumber: phonenumber,
      });

      console.log('Phone validation successful:', response.data);
      return response.data;
    } catch (error) {
      console.log('Phone validation error:', error.response?.data);
      throw error;
    }
  },
};

export default authAPI;