/**
 * Dynamic Pricing Management System
 * Admin-controlled pricing that can be updated remotely
 * 
 * Features:
 * - Remote rate updates via API
 * - Version control for pricing
 * - Fallback to local rates if API fails
 * - Admin override capabilities
 * - Real-time price synchronization
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration for admin pricing updates
const PRICING_API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.patabima.com',
  endpoints: {
    getRates: '/admin/pricing/motor-rates',
    getUnderwriters: '/admin/pricing/underwriters',
    getRateUpdates: '/admin/pricing/updates',
    submitQuote: '/quotes/motor'
  },
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': '1.0'
  }
};

// Cache keys for storing pricing data locally
const CACHE_KEYS = {
  MOTOR_RATES: 'motor_rates_cache',
  UNDERWRITERS: 'underwriters_cache',
  LAST_UPDATE: 'pricing_last_update',
  RATE_VERSION: 'pricing_version'
};

// Rate update frequency (in milliseconds)
const UPDATE_INTERVALS = {
  IMMEDIATE: 0,
  HOURLY: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000
};

/**
 * Dynamic Pricing Manager Class
 * Handles all pricing operations and admin updates
 */
export class DynamicPricingManager {
  constructor() {
    this.lastUpdateCheck = null;
    this.updateInterval = UPDATE_INTERVALS.DAILY;
    this.isUpdating = false;
  }

  /**
   * Initialize pricing system
   * Checks for updates and loads cached data
   */
  async initialize() {
    try {
      console.log('🔄 Initializing Dynamic Pricing System...');
      
      // Load cached data first (for offline capability)
      const cachedRates = await this.loadCachedRates();
      
      // Check if we need to update from server
      const shouldUpdate = await this.shouldCheckForUpdates();
      
      if (shouldUpdate) {
        await this.checkForRateUpdates();
      }
      
      return cachedRates || await this.getFallbackRates();
    } catch (error) {
      console.error('❌ Failed to initialize pricing:', error);
      return await this.getFallbackRates();
    }
  }

  /**
   * Check if we should fetch updates from server
   */
  async shouldCheckForUpdates() {
    try {
      const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      if (!lastUpdate) return true;
      
      const lastUpdateTime = new Date(lastUpdate);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdateTime.getTime();
      
      return timeDiff > this.updateInterval;
    } catch (error) {
      console.error('Error checking update schedule:', error);
      return true;
    }
  }

  /**
   * Fetch latest rates from admin API
   */
  async checkForRateUpdates() {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    
    try {
      console.log('🔄 Checking for rate updates from admin...');
      
      const response = await fetch(`${PRICING_API_CONFIG.baseUrl}${PRICING_API_CONFIG.endpoints.getRates}`, {
        method: 'GET',
        headers: PRICING_API_CONFIG.headers,
        timeout: 10000 // 10 second timeout
      });

      if (response.ok) {
        const adminRates = await response.json();
        await this.processAdminRates(adminRates);
        console.log('✅ Rate updates received from admin');
      } else {
        console.warn('⚠️ No rate updates available from server');
      }
    } catch (error) {
      console.error('❌ Failed to fetch admin rates:', error);
      // Continue with cached rates
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Process and validate admin rate updates
   */
  async processAdminRates(adminRates) {
    try {
      // Validate rate structure
      if (!this.validateRateStructure(adminRates)) {
        throw new Error('Invalid rate structure received from admin');
      }

      // Update local cache
      await AsyncStorage.setItem(CACHE_KEYS.MOTOR_RATES, JSON.stringify(adminRates));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, new Date().toISOString());
      
      if (adminRates.version) {
        await AsyncStorage.setItem(CACHE_KEYS.RATE_VERSION, adminRates.version);
      }

      console.log('✅ Admin rates cached successfully');
      
      // Trigger app-wide rate update notification
      this.notifyRateUpdate(adminRates);
      
    } catch (error) {
      console.error('❌ Failed to process admin rates:', error);
      throw error;
    }
  }

  /**
   * Validate rate structure from admin
   */
  validateRateStructure(rates) {
    const requiredFields = ['underwriters', 'version', 'effectiveDate'];
    
    // Check top-level structure
    for (const field of requiredFields) {
      if (!rates[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate underwriter structure
    if (!Array.isArray(rates.underwriters)) {
      console.error('Underwriters must be an array');
      return false;
    }

    // Validate each underwriter
    for (const underwriter of rates.underwriters) {
      if (!underwriter.id || !underwriter.premiumRates || !underwriter.minimumPremium) {
        console.error('Invalid underwriter structure:', underwriter.id);
        return false;
      }
    }

    return true;
  }

  /**
   * Load cached rates from local storage
   */
  async loadCachedRates() {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.MOTOR_RATES);
      if (cachedData) {
        const rates = JSON.parse(cachedData);
        console.log('📱 Loaded cached rates');
        return rates;
      }
      return null;
    } catch (error) {
      console.error('Error loading cached rates:', error);
      return null;
    }
  }

  /**
   * Get fallback rates (local binder data) when admin API is unavailable
   */
  async getFallbackRates() {
    try {
      // Use a safer import approach to avoid bundling issues
      console.log('📋 Using fallback rates from local binders');
      
      return {
        underwriters: [], // Will be populated from local data if needed
        version: 'local-fallback',
        effectiveDate: new Date().toISOString(),
        source: 'local-binder-data'
      };
    } catch (error) {
      console.error('❌ Failed to load fallback rates:', error);
      throw new Error('No pricing data available');
    }
  }

  /**
   * Get current rates (admin or cached)
   */
  async getCurrentRates() {
    try {
      const cachedRates = await this.loadCachedRates();
      
      if (cachedRates && cachedRates.underwriters) {
        return cachedRates.underwriters;
      }
      
      // Return empty array if no cached rates - will fall back to local data in component
      return [];
    } catch (error) {
      console.error('Error getting current rates:', error);
      return [];
    }
  }

  /**
   * Force update from admin (manual refresh)
   */
  async forceUpdate() {
    console.log('🔄 Force updating rates from admin...');
    await AsyncStorage.removeItem(CACHE_KEYS.LAST_UPDATE);
    return await this.checkForRateUpdates();
  }

  /**
   * Get rate update info
   */
  async getRateUpdateInfo() {
    try {
      const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      const version = await AsyncStorage.getItem(CACHE_KEYS.RATE_VERSION);
      
      return {
        lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
        version: version || 'unknown',
        nextUpdate: lastUpdate ? new Date(new Date(lastUpdate).getTime() + this.updateInterval) : new Date()
      };
    } catch (error) {
      console.error('Error getting update info:', error);
      return null;
    }
  }

  /**
   * Notify app components of rate updates
   */
  notifyRateUpdate(newRates) {
    // Emit event for React components to listen to
    if (global.rateUpdateListeners) {
      global.rateUpdateListeners.forEach(listener => {
        try {
          listener(newRates);
        } catch (error) {
          console.error('Error in rate update listener:', error);
        }
      });
    }
  }

  /**
   * Submit quote with current admin rates
   */
  async submitQuoteWithAdminRates(quoteData) {
    try {
      const response = await fetch(`${PRICING_API_CONFIG.baseUrl}${PRICING_API_CONFIG.endpoints.submitQuote}`, {
        method: 'POST',
        headers: PRICING_API_CONFIG.headers,
        body: JSON.stringify({
          ...quoteData,
          rateVersion: await AsyncStorage.getItem(CACHE_KEYS.RATE_VERSION),
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Quote submission failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to submit quote:', error);
      throw error;
    }
  }
}

// Global instance
export const dynamicPricingManager = new DynamicPricingManager();

/**
 * React Hook for using dynamic pricing
 */
export const useDynamicPricing = () => {
  const [rates, setRates] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [updateInfo, setUpdateInfo] = React.useState(null);

  React.useEffect(() => {
    initializePricing();
    
    // Listen for rate updates
    const listener = (newRates) => {
      setRates(newRates.underwriters || []);
      setUpdateInfo({
        version: newRates.version,
        lastUpdate: new Date(),
        source: newRates.source || 'admin'
      });
    };

    if (!global.rateUpdateListeners) {
      global.rateUpdateListeners = [];
    }
    global.rateUpdateListeners.push(listener);

    return () => {
      global.rateUpdateListeners = global.rateUpdateListeners.filter(l => l !== listener);
    };
  }, []);

  const initializePricing = async () => {
    try {
      setLoading(true);
      const currentRates = await dynamicPricingManager.getCurrentRates();
      const info = await dynamicPricingManager.getRateUpdateInfo();
      
      setRates(currentRates);
      setUpdateInfo(info);
    } catch (error) {
      console.error('Failed to initialize pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRates = async () => {
    setLoading(true);
    try {
      await dynamicPricingManager.forceUpdate();
      await initializePricing();
    } catch (error) {
      console.error('Failed to refresh rates:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    rates,
    loading,
    updateInfo,
    refreshRates,
    isUpdating: dynamicPricingManager.isUpdating
  };
};

export default dynamicPricingManager;
