// API Configuration for PataBima Django Backend
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base configuration
export const API_CONFIG = {
  // Django backend base URL - configured for Android emulator
  BASE_URL: 'http://10.0.2.2:8000/api/v1/public_app',
  
  // For Android emulator, use: 'http://10.0.2.2:8000/api/v1/public_app'
  // For iOS simulator, use: 'http://127.0.0.1:8000/api/v1/public_app'
  // For real device, use your computer's IP: 'http://192.168.x.x:8000/api/v1/public_app'
  
  TIMEOUT: 30000, // 30 seconds
  
  ENDPOINTS: {
    // Authentication endpoints
    AUTH: {
      SIGNUP: '/auth/signup',
      LOGIN: '/auth/login',
      AUTH_LOGIN: '/auth/auth_login',
      RESET_PASSWORD: '/auth/reset_password_self',
    },
    
    // User endpoints
    USER: {
      GET_USER: '/user/get_user',
    },
  },
};

// Create axios instance with default configuration
import axios from 'axios';

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
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token from storage:', error);
    }
    
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
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
      data: response.data,
    });
    return response;
  },
  async (error) => {
    console.log('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userRole']);
        // You might want to navigate to login screen here
        // NavigationService.navigate('Login');
      } catch (storageError) {
        console.log('Error clearing storage:', storageError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper function to get stored tokens
export const getStoredTokens = async () => {
  try {
    const tokens = await AsyncStorage.multiGet(['accessToken', 'refreshToken', 'userRole']);
    return {
      accessToken: tokens[0][1],
      refreshToken: tokens[1][1],
      userRole: tokens[2][1],
    };
  } catch (error) {
    console.log('Error getting stored tokens:', error);
    return {
      accessToken: null,
      refreshToken: null,
      userRole: null,
    };
  }
};

// Helper function to store tokens
export const storeTokens = async (accessToken, refreshToken, userRole) => {
  try {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['userRole', userRole],
    ]);
    console.log('Tokens stored successfully');
  } catch (error) {
    console.log('Error storing tokens:', error);
    throw error;
  }
};

// Helper function to clear tokens
export const clearTokens = async () => {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userRole']);
    console.log('Tokens cleared successfully');
  } catch (error) {
    console.log('Error clearing tokens:', error);
    throw error;
  }
};
