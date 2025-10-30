/**
 * Centralized Authentication Service
 * Handles all authentication logic including token management, validation, and refresh
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import DjangoAPIService from './DjangoAPIService';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  TOKEN_EXPIRY: 'tokenExpiry',
  USER_ROLE: 'userRole',
};

// Token expiration buffer (refresh 5 minutes before actual expiry)
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

class AuthService {
  constructor() {
    this.isRefreshing = false;
    this.refreshSubscribers = [];
    this.requestInProgress = new Set(); // Track ongoing requests to prevent duplicates
  }

  /**
   * Validate input data before submission
   */
  validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return { valid: false, error: 'Phone number is required' };
    }
    
    const cleaned = phone.replace(/\D/g, '');
    
    // Check for valid Kenyan phone number
    if (cleaned.length < 9 || cleaned.length > 12) {
      return { valid: false, error: 'Please enter a valid phone number' };
    }
    
    return { valid: true, formatted: this.formatPhoneNumber(phone) };
  }

  validateEmail(email) {
    if (!email) return { valid: true }; // Email is optional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    return { valid: true };
  }

  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required' };
    }
    
    if (password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters' };
    }
    
    return { valid: true };
  }

  validateLoginInputs(phoneNumber, password) {
    const phoneValidation = this.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return { valid: false, error: phoneValidation.error };
    }
    
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      return { valid: false, error: passwordValidation.error };
    }
    
    return { valid: true, phoneNumber: phoneValidation.formatted };
  }

  validateSignupInputs(data) {
    const { fullName, phoneNumber, password, confirmPassword, email } = data;
    
    if (!fullName || fullName.trim().length < 2) {
      return { valid: false, error: 'Please enter your full name' };
    }
    
    const phoneValidation = this.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return { valid: false, error: phoneValidation.error };
    }
    
    if (email) {
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.valid) {
        return { valid: false, error: emailValidation.error };
      }
    }
    
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      return { valid: false, error: passwordValidation.error };
    }
    
    if (password !== confirmPassword) {
      return { valid: false, error: 'Passwords do not match' };
    }
    
    return { 
      valid: true, 
      data: {
        fullName: fullName.trim(),
        phoneNumber: phoneValidation.formatted,
        email: email?.trim() || null,
        password,
      }
    };
  }

  /**
   * Format phone number to Kenyan standard (254XXXXXXXXX)
   */
  formatPhoneNumber(number) {
    let cleaned = number.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      // Already in correct format
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.length === 9) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Prevent duplicate requests
   */
  async executeOnce(key, asyncFn) {
    if (this.requestInProgress.has(key)) {
      throw new Error('Request already in progress');
    }
    
    this.requestInProgress.add(key);
    try {
      return await asyncFn();
    } finally {
      this.requestInProgress.delete(key);
    }
  }

  /**
   * Store authentication tokens and user data
   */
  async storeAuthData(tokens, userData) {
    try {
      const { access, refresh } = tokens;
      
      // Decode JWT to get expiry time
      const tokenParts = access.split('.');
      let expiry = null;
      
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          expiry = payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
        } catch (e) {
          console.warn('Failed to decode token expiry:', e);
        }
      }
      
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, access],
        [STORAGE_KEYS.REFRESH_TOKEN, refresh],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
        [STORAGE_KEYS.USER_ROLE, userData.role || 'AGENT'],
        ...(expiry ? [[STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString()]] : []),
      ]);
      
      // Update DjangoAPIService with new token
      const apiService = new DjangoAPIService();
      apiService.token = access;
      apiService.refreshToken = refresh;
      
      console.log('[AuthService] Auth data stored successfully');
      return true;
    } catch (error) {
      console.error('[AuthService] Error storing auth data:', error);
      throw error;
    }
  }

  /**
   * Retrieve stored authentication data
   */
  async getAuthData() {
    try {
      const [accessToken, refreshToken, userDataStr, userRole, expiryStr] = await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.TOKEN_EXPIRY,
      ]);
      
      const access = accessToken[1];
      const refresh = refreshToken[1];
      const userData = userDataStr[1] ? JSON.parse(userDataStr[1]) : null;
      const role = userRole[1];
      const expiry = expiryStr[1] ? parseInt(expiryStr[1], 10) : null;
      
      return {
        accessToken: access,
        refreshToken: refresh,
        userData,
        userRole: role,
        tokenExpiry: expiry,
      };
    } catch (error) {
      console.error('[AuthService] Error retrieving auth data:', error);
      return null;
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      
      // Clear DjangoAPIService tokens
      const apiService = new DjangoAPIService();
      apiService.token = null;
      apiService.refreshToken = null;
      apiService.agentData = null;
      
      console.log('[AuthService] Auth data cleared');
      return true;
    } catch (error) {
      console.error('[AuthService] Error clearing auth data:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const authData = await this.getAuthData();
      
      if (!authData?.accessToken || !authData?.refreshToken) {
        return false;
      }
      
      // Check if token is expired
      if (authData.tokenExpiry) {
        const now = Date.now();
        if (now >= authData.tokenExpiry) {
          // Token expired, try to refresh
          const refreshed = await this.refreshAccessToken();
          return refreshed;
        }
      }
      
      return true;
    } catch (error) {
      console.error('[AuthService] Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Check if token needs refresh (within buffer window)
   */
  async shouldRefreshToken() {
    try {
      const authData = await this.getAuthData();
      
      if (!authData?.tokenExpiry) {
        return false;
      }
      
      const now = Date.now();
      const timeUntilExpiry = authData.tokenExpiry - now;
      
      return timeUntilExpiry <= TOKEN_REFRESH_BUFFER && timeUntilExpiry > 0;
    } catch (error) {
      console.error('[AuthService] Error checking token refresh:', error);
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }
    
    this.isRefreshing = true;
    
    try {
      const authData = await this.getAuthData();
      
      if (!authData?.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const apiService = new DjangoAPIService();
      await apiService.initialize();
      
      // Call refresh endpoint
      const response = await apiService.makeRequest('/api/v1/public_app/auth/token/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh: authData.refreshToken }),
      });
      
      if (response?.access) {
        // Store new access token
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access);
        
        // Update expiry if available
        const tokenParts = response.access.split('.');
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.exp) {
              await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, (payload.exp * 1000).toString());
            }
          } catch (e) {
            console.warn('Failed to update token expiry:', e);
          }
        }
        
        // Update DjangoAPIService
        apiService.token = response.access;
        
        // Notify all waiting subscribers
        this.refreshSubscribers.forEach(callback => callback(true));
        this.refreshSubscribers = [];
        
        console.log('[AuthService] Token refreshed successfully');
        return true;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('[AuthService] Token refresh error:', error);
      
      // Notify all waiting subscribers of failure
      this.refreshSubscribers.forEach(callback => callback(false));
      this.refreshSubscribers = [];
      
      // Clear auth data on refresh failure
      await this.clearAuthData();
      
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Login with phone number and password
   */
  async login(phoneNumber, password) {
    return this.executeOnce('login', async () => {
      try {
        // Validate inputs
        const validation = this.validateLoginInputs(phoneNumber, password);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        
        const apiService = new DjangoAPIService();
        await apiService.initialize();
        
        // Send login request
        const response = await apiService.login(validation.phoneNumber, password);
        
        if (response?.detail === 'OTP sent successfully') {
          return { 
            success: true, 
            requiresOtp: true, 
            message: 'OTP sent successfully',
            phoneNumber: validation.phoneNumber,
          };
        }
        
        return { success: false, error: 'Unexpected response from server' };
      } catch (error) {
        console.error('[AuthService] Login error:', error);
        
        // Extract meaningful error message
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.message.includes('401')) {
          errorMessage = 'Invalid phone number or password';
        } else if (error.message.includes('404')) {
          errorMessage = 'User not found. Please sign up first.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
        
        return { success: false, error: errorMessage };
      }
    });
  }

  /**
   * Verify OTP and complete login
   */
  async verifyOtp(phoneNumber, otp) {
    return this.executeOnce('verifyOtp', async () => {
      try {
        if (!otp || otp.length !== 6) {
          return { success: false, error: 'Please enter a valid 6-digit code' };
        }
        
        const validation = this.validatePhoneNumber(phoneNumber);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        
        const apiService = new DjangoAPIService();
        await apiService.initialize();
        
        // Verify OTP
        const response = await apiService.verifyOtp(validation.formatted, otp);
        
        if (response?.access && response?.refresh) {
          // Get user profile
          const profile = await apiService.getCurrentUser();
          
          // Store auth data
          await this.storeAuthData(
            { access: response.access, refresh: response.refresh },
            profile
          );
          
          return { 
            success: true, 
            user: profile,
            tokens: { access: response.access, refresh: response.refresh },
          };
        }
        
        return { success: false, error: 'Invalid OTP verification response' };
      } catch (error) {
        console.error('[AuthService] OTP verification error:', error);
        
        let errorMessage = 'Verification failed. Please try again.';
        
        if (error.message.includes('401') || error.message.includes('400')) {
          errorMessage = 'Invalid or expired OTP';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
        
        return { success: false, error: errorMessage };
      }
    });
  }

  /**
   * Sign up new user
   */
  async signup(userData) {
    return this.executeOnce('signup', async () => {
      try {
        // Validate inputs
        const validation = this.validateSignupInputs(userData);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        
        const { fullName, phoneNumber, email, password } = validation.data;
        
        const apiService = new DjangoAPIService();
        await apiService.initialize();
        
        // Format phone number (remove 254 prefix for backend)
        const cleanPhone = phoneNumber.replace(/^254/, '');
        
        // Send signup request
        const response = await apiService.signup({
          phonenumber: cleanPhone,
          full_names: fullName,
          email: email,
          user_role: userData.userRole || 'AGENT',
          password: password,
          confirm_password: userData.confirmPassword,
        });
        
        if (response?.user_id || response?.id) {
          return { 
            success: true, 
            userId: response.user_id || response.id,
            message: response.message || 'Account created successfully',
          };
        }
        
        return { success: false, error: response.message || 'Signup failed' };
      } catch (error) {
        console.error('[AuthService] Signup error:', error);
        
        let errorMessage = 'Signup failed. Please try again.';
        
        if (error.message.includes('400')) {
          errorMessage = 'Invalid signup data. Please check your information.';
        } else if (error.message.includes('409') || error.message.includes('already exists')) {
          errorMessage = 'An account with this phone number already exists';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error?.response?.data?.errors) {
          const errors = error.response.data.errors;
          errorMessage = Object.values(errors).flat().join(', ');
        } else if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
        
        return { success: false, error: errorMessage };
      }
    });
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await this.clearAuthData();
      return { success: true };
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  /**
   * Reset password (forgot password flow)
   */
  async resetPassword(phoneNumber, newPassword) {
    return this.executeOnce('resetPassword', async () => {
      try {
        const validation = this.validatePhoneNumber(phoneNumber);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        
        const passwordValidation = this.validatePassword(newPassword);
        if (!passwordValidation.valid) {
          return { success: false, error: passwordValidation.error };
        }
        
        const apiService = new DjangoAPIService();
        await apiService.initialize();
        
        // Send password reset request
        const response = await apiService.resetPassword(validation.formatted, newPassword);
        
        if (response?.success || response?.detail?.includes('success')) {
          return { 
            success: true, 
            message: 'Password reset successfully',
          };
        }
        
        return { success: false, error: 'Password reset failed' };
      } catch (error) {
        console.error('[AuthService] Password reset error:', error);
        
        let errorMessage = 'Password reset failed. Please try again.';
        
        if (error.message.includes('404')) {
          errorMessage = 'Phone number not found';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
        
        return { success: false, error: errorMessage };
      }
    });
  }

  /**
   * Get current user data
   */
  async getCurrentUser() {
    try {
      const authData = await this.getAuthData();
      
      if (authData?.userData) {
        return authData.userData;
      }
      
      // Fetch from server if not in storage
      const apiService = new DjangoAPIService();
      await apiService.initialize();
      
      const profile = await apiService.getCurrentUser();
      
      // Update stored user data
      if (profile) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(profile));
      }
      
      return profile;
    } catch (error) {
      console.error('[AuthService] Error getting current user:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new AuthService();
