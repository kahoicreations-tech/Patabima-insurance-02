/**
 * Authentication Context
 * Global state management for authentication with automatic token refresh
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  
  // Ref to track token refresh interval
  const refreshIntervalRef = useRef(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Setup automatic token refresh when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setupTokenRefresh();
    } else {
      clearTokenRefresh();
    }
    
    return () => clearTokenRefresh();
  }, [isAuthenticated]);

  /**
   * Check current authentication status
   */
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authenticated = await authService.isAuthenticated();
      
      if (authenticated) {
        // Load user data
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        console.log('[AuthContext] User authenticated:', userData?.full_names);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('[AuthContext] User not authenticated');
      }
    } catch (error) {
      console.error('[AuthContext] Error checking auth status:', error);
      setError('Failed to check authentication status');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Setup automatic token refresh (check every 5 minutes)
   */
  const setupTokenRefresh = () => {
    // Clear existing interval
    clearTokenRefresh();
    
    // Check token refresh every 5 minutes
    refreshIntervalRef.current = setInterval(async () => {
      try {
        const shouldRefresh = await authService.shouldRefreshToken();
        if (shouldRefresh) {
          console.log('[AuthContext] Auto-refreshing token...');
          const refreshed = await authService.refreshAccessToken();
          if (!refreshed) {
            console.error('[AuthContext] Token refresh failed, logging out');
            await handleLogout();
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error in auto token refresh:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  };

  /**
   * Clear token refresh interval
   */
  const clearTokenRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  /**
   * Login with credentials
   * Returns { success, requiresOtp, error, phoneNumber }
   */
  const login = async (phoneNumber, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.login(phoneNumber, password);
      
      if (result.success && result.requiresOtp) {
        // OTP sent, don't update auth state yet
        return result;
      } else if (result.success && result.user) {
        // Direct login successful (if OTP not required)
        setUser(result.user);
        setIsAuthenticated(true);
        return result;
      }
      
      setError(result.error);
      return result;
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      const errorMsg = 'An unexpected error occurred during login';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP and complete login
   */
  const verifyOtp = async (phoneNumber, otp) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.verifyOtp(phoneNumber, otp);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        console.log('[AuthContext] OTP verified, user logged in');
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('[AuthContext] OTP verification error:', error);
      const errorMsg = 'An unexpected error occurred during verification';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up new user
   */
  const signup = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.signup(userData);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('[AuthContext] Signup error:', error);
      const errorMsg = 'An unexpected error occurred during signup';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.logout();
      
      // Always clear auth state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      clearTokenRefresh();
      
      console.log('[AuthContext] User logged out');
      return result;
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      
      // Still clear local state
      setUser(null);
      setIsAuthenticated(false);
      clearTokenRefresh();
      
      return { success: false, error: 'Logout failed, but local session cleared' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Internal logout handler for error cases
   */
  const handleLogout = async () => {
    await logout();
  };

  /**
   * Reset password
   */
  const resetPassword = async (phoneNumber, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.resetPassword(phoneNumber, newPassword);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('[AuthContext] Reset password error:', error);
      const errorMsg = 'An unexpected error occurred during password reset';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('[AuthContext] Error refreshing user:', error);
      return { success: false, error: 'Failed to refresh user data' };
    }
  };

  /**
   * Manually trigger token refresh
   */
  const refreshToken = async () => {
    try {
      setIsLoading(true);
      const refreshed = await authService.refreshAccessToken();
      
      if (!refreshed) {
        // Token refresh failed, logout user
        await handleLogout();
        return { success: false, error: 'Session expired, please login again' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Token refresh error:', error);
      await handleLogout();
      return { success: false, error: 'Session expired, please login again' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    // State
    isAuthenticated,
    isLoading,
    user,
    error,
    
    // Actions
    login,
    verifyOtp,
    signup,
    logout,
    resetPassword,
    refreshUser,
    refreshToken,
    checkAuthStatus,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
