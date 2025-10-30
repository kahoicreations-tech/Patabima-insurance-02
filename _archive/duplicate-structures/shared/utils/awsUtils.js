import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AWSUtils {
  // Network connectivity check
  static async checkNetworkConnection() {
    // In a real app, you might use NetInfo to check connectivity
    // For now, we'll assume connection is available
    return true;
  }

  // Cache key generators
  static getCacheKey(prefix, id) {
    return `${prefix}_${id}`;
  }

  static getQuoteCacheKey(quoteId) {
    return this.getCacheKey('quote', quoteId);
  }

  static getClientCacheKey(clientId) {
    return this.getCacheKey('client', clientId);
  }

  static getPolicyCacheKey(policyId) {
    return this.getCacheKey('policy', policyId);
  }

  // Error handling utilities
  static handleAWSError(error, context = '') {
    console.error(`AWS Error ${context}:`, error);
    
    let userMessage = 'An error occurred. Please try again.';
    
    if (error.code === 'NetworkError') {
      userMessage = 'Network connection error. Please check your internet connection.';
    } else if (error.code === 'UserNotConfirmedException') {
      userMessage = 'Please confirm your account via email before signing in.';
    } else if (error.code === 'NotAuthorizedException') {
      userMessage = 'Invalid credentials. Please check your username and password.';
    } else if (error.code === 'UserNotFoundException') {
      userMessage = 'User not found. Please check your username.';
    } else if (error.code === 'InvalidPasswordException') {
      userMessage = 'Password does not meet requirements.';
    } else if (error.code === 'UsernameExistsException') {
      userMessage = 'An account with this username already exists.';
    } else if (error.code === 'LimitExceededException') {
      userMessage = 'Too many attempts. Please try again later.';
    }

    return {
      error: true,
      message: userMessage,
      originalError: error
    };
  }

  // Show user-friendly error alerts
  static showErrorAlert(error, title = 'Error') {
    const errorResult = this.handleAWSError(error);
    Alert.alert(title, errorResult.message);
  }

  // Cache management utilities
  static async setCache(key, data, expiryMinutes = 60) {
    try {
      const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
      const cacheData = {
        data,
        expiry: expiryTime
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async getCache(key) {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      if (!cachedData) return null;

      const parsed = JSON.parse(cachedData);
      
      // Check if cache has expired
      if (Date.now() > parsed.expiry) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async clearCache(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  static async clearAllCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('quote_') || 
        key.startsWith('client_') || 
        key.startsWith('policy_') ||
        key.startsWith('aws_')
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear all error:', error);
    }
  }

  // Data validation utilities
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone) {
    // Kenyan phone number validation
    const phoneRegex = /^(?:\+254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone);
  }

  static validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Formatting utilities
  static formatCurrency(amount, currency = 'KES') {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  static formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat('en-KE', { ...defaultOptions, ...options })
      .format(new Date(date));
  }

  static formatDateTime(date) {
    return this.formatDate(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // File utilities
  static getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  static isValidImageFile(filename) {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return validExtensions.includes(this.getFileExtension(filename));
  }

  static isValidDocumentFile(filename) {
    const validExtensions = ['pdf', 'doc', 'docx', 'txt'];
    return validExtensions.includes(this.getFileExtension(filename));
  }

  // Generate unique IDs
  static generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Retry mechanism for AWS operations
  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  // Analytics event formatting
  static formatAnalyticsEvent(eventName, properties = {}) {
    return {
      name: eventName,
      attributes: {
        timestamp: new Date().toISOString(),
        platform: 'mobile',
        app: 'PataBima',
        ...properties
      }
    };
  }

  // Device info utilities
  static getDeviceInfo() {
    // In a real app, you might use expo-device or react-native-device-info
    return {
      platform: 'mobile',
      timestamp: new Date().toISOString()
    };
  }
}

export default AWSUtils;
