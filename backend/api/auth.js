import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  /**
   * Login user with credentials
   */
  async login(credentials) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: credentials.email?.toLowerCase().trim(),
        password: credentials.password,
        deviceInfo: {
          platform: 'mobile',
          deviceId: credentials.deviceId,
        },
      });

      const { accessToken, refreshToken, user } = response.data;

      // Store auth data
      await this.storeAuthData({
        accessToken,
        refreshToken,
        user,
      });

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Register new user/agent
   */
  async register(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        ...userData,
        email: userData.email?.toLowerCase().trim(),
      });

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
          refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if server logout fails
    } finally {
      await this.clearAuthData();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await AsyncStorage.multiSet([
        ['authToken', accessToken],
        ['refreshToken', newRefreshToken],
      ]);

      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.clearAuthData();
      throw error;
    }
  }

  /**
   * Verify user account
   */
  async verifyAccount(verificationData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY, {
        token: verificationData.token,
        code: verificationData.code,
      });

      return response.data;
    } catch (error) {
      console.error('Account verification error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email: email.toLowerCase().trim(),
      });

      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(resetData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token: resetData.token,
        password: resetData.password,
        confirmPassword: resetData.confirmPassword,
      });

      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      return userProfile ? JSON.parse(userProfile) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Store authentication data
   */
  async storeAuthData({ accessToken, refreshToken, user }) {
    try {
      await AsyncStorage.multiSet([
        ['authToken', accessToken],
        ['refreshToken', refreshToken],
        ['userProfile', JSON.stringify(user)],
      ]);

      console.log('Auth data stored successfully');
    } catch (error) {
      console.error('Store auth data error:', error);
      throw error;
    }
  }

  /**
   * Clear authentication data
   */
  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove([
        'authToken',
        'refreshToken',
        'userProfile',
      ]);

      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Clear auth data error:', error);
    }
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid request');
        case 401:
          return new Error('Invalid credentials');
        case 403:
          return new Error('Account access forbidden');
        case 422:
          return new Error(data.message || 'Validation failed');
        case 429:
          return new Error('Too many attempts. Please try again later');
        default:
          return new Error('Authentication failed');
      }
    }
    
    return new Error('Network error. Please check your connection');
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
