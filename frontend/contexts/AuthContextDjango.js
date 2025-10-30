import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/auth';
import { usersAPI } from '../services/users';
import { clearTokens } from '../services/apiConfig';
import StoragePurge from '../services/StoragePurge';

// Helper function to get stored tokens
const getStoredTokens = async () => {
  try {
    const [accessToken, refreshToken, userRole] = await AsyncStorage.multiGet([
      'accessToken',
      'refreshToken', 
      'userRole'
    ]);
    
    return {
      accessToken: accessToken[1],
      refreshToken: refreshToken[1],
      userRole: userRole[1],
    };
  } catch (error) {
    console.log('Error getting stored tokens:', error);
    return null;
  }
};

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
  const [userRole, setUserRole] = useState(null);
  const [loginStep, setLoginStep] = useState(1); // 1: credentials, 2: OTP verification

  useEffect(() => {
    // Check authentication status on app start
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const tokens = await getStoredTokens();
      
      if (tokens.accessToken && tokens.userRole) {
        setIsAuthenticated(true);
        setUserRole(tokens.userRole);
        console.log('User authenticated from stored tokens');
        
        // Optionally load user profile data
        // Note: We would need to store user_id to fetch user details
        const userId = await AsyncStorage.getItem('@PataBima:userId');
        if (userId) {
          const userResult = await usersAPI.getUser(userId);
          if (userResult.success) {
            setUser(userResult.user);
          }
        }
      } else {
        console.log('No valid tokens found, user needs to login');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await clearTokens();
      await AsyncStorage.multiRemove(['@PataBima:userId', '@PataBima:userData']);
    } catch (error) {
      console.log('Error clearing stored auth:', error);
    }
  };

  // Step 1: Login with phone and password (get OTP)
  const login = async ({ phoneNumber, password }) => {
    try {
      setIsLoading(true);
      
      // Clean phone number to 9 digits (remove leading 0 if present)
      const cleanPhone = phoneNumber.replace(/^0/, '').slice(-9);
      
      const result = await authAPI.login({
        phonenumber: cleanPhone,
        password: password
      });

      if (result.success) {
        setLoginStep(2); // Move to OTP verification step
        return {
          success: true,
          message: result.message,
          otpCode: result.otpCode, // For development only
          step: 2,
        };
      } else {
        return {
          success: false,
          error: result.message,
        };
      }
    } catch (error) {
      console.log('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and complete login
  const verifyOTP = async ({ phoneNumber, password, otpCode }) => {
    try {
      setIsLoading(true);
      
      // Clean phone number to 9 digits
      const cleanPhone = phoneNumber.replace(/^0/, '').slice(-9);
      
      const result = await authAPI.authLogin({
        phonenumber: cleanPhone,
        password: password,
        code: otpCode
      });

      if (result.success) {
        setIsAuthenticated(true);
        setUserRole(result.userRole);
        setLoginStep(1); // Reset for next login
        
        // Get user details if needed
        // Note: We might need to store user_id from signup or extract from JWT
        
        return {
          success: true,
          message: 'Login successful',
          userRole: result.userRole,
        };
      } else {
        return {
          success: false,
          error: result.message,
        };
      }
    } catch (error) {
      console.log('OTP verification error:', error);
      return {
        success: false,
        error: 'OTP verification failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async ({ phoneNumber, fullName, email, userRole, password, confirmPassword }) => {
    try {
      setIsLoading(true);
      
      if (password !== confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match',
        };
      }
      
      // Clean phone number to 9 digits (remove leading 0 if present)
      const cleanPhone = phoneNumber.replace(/^0/, '').slice(-9);
      
      const result = await authAPI.signup({
        phonenumber: cleanPhone,
        full_names: fullName,
        email: email || null,
        user_role: userRole || 'CUSTOMER',
        password: password,
        confirm_password: confirmPassword,
      });

      if (result.success) {
        // Store user ID for later use
        if (result.data?.user_id) {
          await AsyncStorage.setItem('@PataBima:userId', result.data.user_id);
        }
        
        return {
          success: true,
          message: result.message,
          userId: result.data?.user_id,
        };
      } else {
        return {
          success: false,
          error: result.message,
        };
      }
    } catch (error) {
      console.log('Signup error:', error);
      return {
        success: false,
        error: 'Signup failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authAPI.logout();
      await clearStoredAuth();
      await StoragePurge.purgeOnLogout();
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
      setLoginStep(1);
      
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.log('Logout error:', error);
      return {
        success: false,
        error: 'Logout failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async ({ oldPassword, newPassword, confirmPassword }) => {
    try {
      setIsLoading(true);
      
      if (newPassword !== confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match',
        };
      }
      
      const result = await authAPI.resetPassword({
        old_password: oldPassword,
        password: newPassword,
        confirm_password: confirmPassword,
      });

      return result;
    } catch (error) {
      console.log('Reset password error:', error);
      return {
        success: false,
        error: 'Password reset failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('@PataBima:userId');
      if (userId) {
        const userResult = await usersAPI.getUser(userId);
        if (userResult.success) {
          setUser(userResult.user);
        }
      }
    } catch (error) {
      console.log('Error refreshing user data:', error);
    }
  };

  const value = {
    // State
    isAuthenticated,
    isLoading,
    user,
    userRole,
    loginStep,
    
    // Actions
    login,
    verifyOTP,
    signup,
    logout,
    resetPassword,
    refreshUserData,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};