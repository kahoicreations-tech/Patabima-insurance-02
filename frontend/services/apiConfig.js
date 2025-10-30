// API Configuration for PataBima Django Backend
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { emitUnauthorized } from './authEvents';
import SecureTokenStorage from './SecureTokenStorage';
import DjangoAPIService from './DjangoAPIService';

// Resolve environment-provided base URL if available
const envObj = (typeof process !== 'undefined' && process.env) ? process.env : {};
const ENV_BASE = envObj.EXPO_PUBLIC_API_BASE_URL || envObj.EXPO_PUBLIC_API_URL || null;

// Base configuration
export const API_CONFIG = {
  // Django backend base URL - prefer env, else fall back to DjangoAPIService base
  BASE_URL: `${(ENV_BASE || DjangoAPIService.baseUrl).replace(/\/$/, '')}/api/v1/public_app`,
  
  TIMEOUT: 30000, // 30 seconds
  
  ENDPOINTS: {
    // Authentication endpoints
    AUTH: {
      SIGNUP: '/auth/signup',
      LOGIN: '/auth/login',
      AUTH_LOGIN: '/auth/auth_login',
      RESET_PASSWORD: '/auth/reset_password_self',
      VALIDATE_PHONE: '/auth/validate_phone',
    },
    
    // User endpoints
    USER: {
      GET_USER: '/user/get_user',
      GET_CURRENT_USER: '/user/get_current_user',
    },
    // Commission endpoints
    COMMISSIONS: {
      SUMMARY: '/commissions/summary',
      // DRF ListModelMixin exposes list at base route
      LIST: '/commissions',
    },
  },
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Prefer secure storage token; fall back to AsyncStorage for backward compatibility
      const secureToken = await SecureTokenStorage.getAccessToken();
      const legacyToken = (!secureToken)
        ? ((await AsyncStorage.getItem('auth_token')) || (await AsyncStorage.getItem('accessToken')))
        : null;
      const token = secureToken || legacyToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Optional dynamic base URL override (prefer env, then stored, then DjangoAPIService)
      const envBase = ENV_BASE;
      let storedUrl = await AsyncStorage.getItem('api_base_url');
      if (envBase) {
        // If env base is set, ensure we clear any stale stored override
        if (storedUrl) { await AsyncStorage.removeItem('api_base_url'); storedUrl = null; }
        config.baseURL = `${envBase.replace(/\/$/, '')}/api/v1/public_app`;
      } else {
        const base = (storedUrl || DjangoAPIService.baseUrl);
        if (base && config.baseURL?.startsWith('http')) {
          config.baseURL = `${base.replace(/\/$/, '')}/api/v1/public_app`;
        }
      }
    } catch (error) {
      console.log('Error preparing request (token/baseURL):', error);
    }

    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
    });

    return config;
  },
  (error) => {
    console.log('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling responses and errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error) => {
    console.log('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });
    const originalRequest = error.config || {};

    // Attempt silent refresh-and-retry once on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Ensure we have a refresh token
        const refreshToken = await SecureTokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

        // Use the centralized refresh flow to update tokens everywhere
        const refreshed = await DjangoAPIService.refreshTokenFlow();
        if (!refreshed) throw new Error('REFRESH_FAILED');

        // Read the new access token and retry the original request
        const newAccess = await SecureTokenStorage.getAccessToken();
        if (newAccess) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        // Fall through to cleanup below
        console.warn('Auto-refresh failed, clearing session:', refreshErr?.message || refreshErr);
      }
    }

    // For persistent 401/403, clear only if a token existed to avoid noisy loops
    if (error.response?.status === 401 || error.response?.status === 403) {
      try {
        const hadToken = (await AsyncStorage.getItem('auth_token')) || (await AsyncStorage.getItem('accessToken'));
        await SecureTokenStorage.clearAll();
        if (hadToken) {
          await AsyncStorage.multiRemove(['auth_token','refresh_token','accessToken', 'refreshToken', 'userRole']);
          console.log('Cleared tokens due to unauthorized response');
          emitUnauthorized({ status: error.response?.status, url: error.config?.url });
        }
      } catch (storageError) {
        console.log('Error handling unauthorized clear:', storageError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to store tokens
export const storeTokens = async (accessToken, refreshToken, userRole) => {
  try {
    // Store in SecureTokenStorage for secure, session-aware storage
    await SecureTokenStorage.storeTokens(accessToken, refreshToken, { userRole });
    
    // Also store in AsyncStorage for backward compatibility
    await AsyncStorage.multiSet([
      ['auth_token', accessToken],
      ['refresh_token', refreshToken],
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['userRole', userRole],
    ]);
    
    // Start session monitoring in DjangoAPIService
    DjangoAPIService.startSessionMonitoring();
    
    console.log('Tokens stored successfully and session monitoring started');
  } catch (error) {
    console.log('Error storing tokens:', error);
    throw error;
  }
};

// Helper function to clear tokens
export const clearTokens = async () => {
  try {
    // Clear from SecureTokenStorage
    await SecureTokenStorage.clearAll();
    
    // Also clear from AsyncStorage for backward compatibility
    await AsyncStorage.multiRemove(['auth_token','refresh_token','accessToken', 'refreshToken', 'userRole']);
    
    // Stop session monitoring
    DjangoAPIService.stopSessionMonitoring();
    
    console.log('Tokens cleared successfully and session monitoring stopped');
  } catch (error) {
    console.log('Error clearing tokens:', error);
    throw error;
  }
};

export default apiClient;