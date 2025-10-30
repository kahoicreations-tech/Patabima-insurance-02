import SecureTokenStorage from './SecureTokenStorage';
import { Alert } from 'react-native';
import djangoAPI from './DjangoAPIService';

/**
 * Silent Session Manager
 * Handles token refresh, request retry, and graceful session recovery
 * without disrupting user experience
 */

class SessionManager {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
    this.refreshAttempts = 0;
    this.maxRefreshAttempts = 3;
    this.monitoringInterval = null;
    this.onLogoutCallback = null;
    this.onSessionRefreshedCallback = null;
  }

  /**
   * Initialize session monitoring
   */
  startMonitoring() {
    // Check token status every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, 30000);

    // Initial check
    this.checkAndRefreshToken();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Set logout callback
   */
  onLogout(callback) {
    this.onLogoutCallback = callback;
  }

  /**
   * Set session refreshed callback
   */
  onSessionRefreshed(callback) {
    this.onSessionRefreshedCallback = callback;
  }

  /**
   * Check if token needs refresh and do it silently
   */
  async checkAndRefreshToken() {
    try {
      const needsRefresh = await SecureTokenStorage.isTokenExpiringSoon(5);
      
      if (needsRefresh && !this.isRefreshing) {
        console.log('🔄 Token expiring soon, refreshing silently...');
        await this.refreshToken();
      }
    } catch (error) {
      console.error('Token check error:', error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken() {
    if (this.isRefreshing) {
      // Wait for ongoing refresh
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;
    this.refreshAttempts++;

    try {
      const refreshToken = await SecureTokenStorage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');

      // Delegate refresh to DjangoAPIService to keep all auth logic centralized
      const ok = await djangoAPI.refreshTokenFlow();
      if (!ok) throw new Error('Invalid refresh response');

      const newAccess = await SecureTokenStorage.getAccessToken();
      if (!newAccess) throw new Error('No access token after refresh');

      console.log('✅ Token refreshed successfully');
      this.refreshAttempts = 0;
      this.processQueue(null, newAccess);
      if (this.onSessionRefreshedCallback) this.onSessionRefreshedCallback(newAccess);
      return newAccess;
    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
      
      this.processQueue(error, null);

      // If max attempts reached, logout
      if (this.refreshAttempts >= this.maxRefreshAttempts) {
        console.log('🚪 Max refresh attempts reached, logging out...');
        await this.handleLogout('Session expired. Please login again.');
      }

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Process queued failed requests
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * Setup Axios interceptors for automatic token refresh
   */
  setupInterceptors(axiosInstance) {
    // Request interceptor - Add token to requests
    axiosInstance.interceptors.request.use(
      async (config) => {
        // Check if token needs refresh before making request
        const needsRefresh = await SecureTokenStorage.isTokenExpiringSoon(2);
        if (needsRefresh && !this.isRefreshing) {
          try {
            await this.refreshToken();
          } catch (error) {
            console.log('Pre-request refresh failed, continuing with existing token');
          }
        }

        const token = await SecureTokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle 401 errors
    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for refresh to complete
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(axiosInstance(originalRequest));
                },
                reject: (err) => reject(err),
              });
            });
          }

          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        // If error is 401 after retry, logout
        if (error.response?.status === 401 && originalRequest._retry) {
          await this.handleLogout('Your session has expired.');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle logout gracefully
   */
  async handleLogout(message = null) {
    try {
      this.stopMonitoring();
      // Use DjangoAPIService to cleanly clear auth/session cache
      try { await djangoAPI.handleAuthError(); } catch {}
      // Ensure fallback clear in case above fails
      await SecureTokenStorage.clearAll();
      this.refreshAttempts = 0;

      if (this.onLogoutCallback) {
        this.onLogoutCallback(message);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Validate current session
   */
  async validateSession() {
    try {
      const accessToken = await SecureTokenStorage.getAccessToken();
      const refreshToken = await SecureTokenStorage.getRefreshToken();

      if (!accessToken || !refreshToken) {
        return false;
      }

      const isExpiringSoon = await SecureTokenStorage.isTokenExpiringSoon(0);
      if (isExpiringSoon) {
        // Try to refresh
        try {
          await this.refreshToken();
          return true;
        } catch {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Get session info
   */
  async getSessionInfo() {
    const accessToken = await SecureTokenStorage.getAccessToken();
    const tokenExpiry = await SecureTokenStorage.getTokenExpiry();
    const sessionAge = await SecureTokenStorage.getSessionAge();
    const userData = await SecureTokenStorage.getUserData();

    return {
      isActive: !!accessToken,
      expiresIn: tokenExpiry ? Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000)) : 0,
      sessionAge,
      user: userData,
    };
  }

  /**
   * Restore session on app startup
   */
  async restoreSession() {
    try {
      const isValid = await this.validateSession();
      
      if (isValid) {
        console.log('✅ Session restored successfully');
        this.startMonitoring();
        return true;
      } else {
        console.log('❌ Session invalid, clearing...');
        await SecureTokenStorage.clearAll();
        return false;
      }
    } catch (error) {
      console.error('Session restore error:', error);
      return false;
    }
  }
}

export default new SessionManager();
