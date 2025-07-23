import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    // Check authentication status on app start
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user has stored auth token/session
      const storedUser = await AsyncStorage.getItem('@PataBima:userData');
      const sessionToken = await AsyncStorage.getItem('@PataBima:sessionToken');
      const sessionExpiry = await AsyncStorage.getItem('@PataBima:sessionExpiry');
      
      if (storedUser && sessionToken && sessionExpiry) {
        const userData = JSON.parse(storedUser);
        const expiryTime = parseInt(sessionExpiry);
        const currentTime = Date.now();
        
        // Check if session is still valid (not expired)
        if (currentTime < expiryTime) {
          setUser(userData);
          setIsAuthenticated(true);
          console.log('User authenticated from stored session:', userData.email);
        } else {
          // Session expired, clear stored data
          console.log('Session expired, clearing stored data');
          await clearStoredAuth();
          setIsAuthenticated(false);
        }
      } else {
        console.log('No valid session found, user needs to login');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@PataBima:userData',
        '@PataBima:sessionToken',
        '@PataBima:sessionExpiry'
      ]);
    } catch (error) {
      console.error('Error clearing stored auth:', error);
    }
  };

  const storeAuthData = async (userData, sessionDuration = 24 * 60 * 60 * 1000) => {
    try {
      const sessionToken = `pat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionExpiry = Date.now() + sessionDuration; // Default 24 hours
      
      await AsyncStorage.multiSet([
        ['@PataBima:userData', JSON.stringify(userData)],
        ['@PataBima:sessionToken', sessionToken],
        ['@PataBima:sessionExpiry', sessionExpiry.toString()]
      ]);
      
      console.log('Auth data stored successfully');
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      // Demo login - accepts any credentials
      // In a real app, validate with backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const demoUser = {
        id: '1',
        name: 'John Doe',
        email: credentials.email,
        agentCode: 'PAT001',
        phone: '+254 700 000 000'
      };
      
      // Store auth data for persistence
      await storeAuthData(demoUser);
      
      setUser(demoUser);
      setIsAuthenticated(true);
      
      console.log('User logged in successfully:', demoUser.email);
      return { success: true, user: demoUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setIsLoading(true);
      
      // Demo signup - accepts any data
      // In a real app, register with backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        agentCode: `PAT${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        phone: userData.phone
      };
      
      // Store auth data for persistence
      await storeAuthData(newUser);
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      console.log('User signed up successfully:', newUser.email);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear stored auth data
      await clearStoredAuth();
      
      // In a real app, notify backend about logout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setIsLoading(true);
      
      // Demo reset password
      // In a real app, send reset request to backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return { success: true, message: 'Password reset link sent to your email' };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Failed to send reset link. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    signup,
    logout,
    resetPassword,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
