import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL, TIMEOUT, REQUEST_HEADERS } from '../config/apiConfig';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: TIMEOUT,
      headers: REQUEST_HEADERS,
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for auth token and network check
    this.client.interceptors.request.use(
      async (config) => {
        // Check network connectivity
        const networkState = await NetInfo.fetch();
        if (!networkState.isConnected) {
          throw new Error('No internet connection available');
        }

        // Add auth token if available
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp
        config.headers['X-Request-Time'] = new Date().toISOString();

        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: config.headers,
        });

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle different error scenarios
        if (error.response) {
          const { status, data } = error.response;
          
          console.error('❌ API Error Response:', {
            status,
            url: originalRequest.url,
            data,
          });

          switch (status) {
            case 401:
              // Token expired or invalid
              if (!originalRequest._retry) {
                originalRequest._retry = true;
                
                try {
                  const refreshToken = await AsyncStorage.getItem('refreshToken');
                  if (refreshToken) {
                    const refreshResponse = await this.refreshAuthToken(refreshToken);
                    const newToken = refreshResponse.data.accessToken;
                    
                    await AsyncStorage.setItem('authToken', newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    
                    return this.client(originalRequest);
                  }
                } catch (refreshError) {
                  console.error('Token refresh failed:', refreshError);
                }
                
                // Clear auth data and redirect to login
                await this.clearAuthData();
                // TODO: Navigate to login screen
              }
              break;

            case 403:
              // Forbidden - insufficient permissions
              console.error('Insufficient permissions');
              break;

            case 404:
              // Not found
              console.error('Resource not found');
              break;

            case 422:
              // Validation errors
              console.error('Validation errors:', data.errors);
              break;

            case 429:
              // Rate limit exceeded
              console.error('Rate limit exceeded');
              break;

            case 500:
            case 502:
            case 503:
            case 504:
              // Server errors
              console.error('Server error');
              break;

            default:
              console.error('Unknown error status:', status);
          }
        } else if (error.request) {
          // Network error
          console.error('❌ Network Error:', error.message);
        } else {
          // Other error
          console.error('❌ Unknown Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  async refreshAuthToken(refreshToken) {
    return axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
  }

  async clearAuthData() {
    await AsyncStorage.multiRemove([
      'authToken',
      'refreshToken',
      'userProfile',
    ]);
  }

  // HTTP Methods
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  // File upload with progress tracking
  async uploadFile(url, formData, onUploadProgress = null) {
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });
  }

  // Download file
  async downloadFile(url, config = {}) {
    return this.client.get(url, {
      ...config,
      responseType: 'blob',
    });
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;
