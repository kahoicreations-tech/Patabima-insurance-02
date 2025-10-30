/**
 * Motor Category Cache Service
 * 
 * Implements intelligent caching for motor insurance categories and subcategories
 * to eliminate unnecessary API calls and improve user experience.
 * 
 * Features:
 * - AsyncStorage persistence with 7-day TTL
 * - Background refresh on app startup
 * - Pre-fetch all subcategories for all categories
 * - Singleton pattern for global access
 * - Force refresh capability
 * 
 * @module MotorCategoryCache
 * @version 2.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import djangoAPI from './DjangoAPIService';

const CACHE_KEYS = {
  CATEGORIES: 'motor_categories_cache',
  SUBCATEGORIES: 'motor_subcategories_cache',
  TIMESTAMP: 'motor_cache_timestamp'
};

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

class MotorCategoryCache {
  constructor() {
    this.categories = null;
    this.subcategories = {};
    this.initialized = false;
    this.refreshPromise = null;
  }

  /**
   * Initialize cache on app startup
   * Loads cached data and checks if refresh is needed
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      console.log('MotorCategoryCache already initialized');
      return;
    }
    
    try {
      console.log('Initializing MotorCategoryCache...');
      await this.loadFromStorage();
      this.initialized = true;
      
      // Check if cache needs refresh in background (non-blocking)
      this.refreshIfNeeded().catch(error => {
        console.warn('Background cache refresh failed:', error.message);
      });
      
      console.log('MotorCategoryCache initialized successfully');
    } catch (error) {
      console.error('Failed to initialize motor category cache:', error);
      this.initialized = true; // Mark as initialized even on error to prevent retry loops
    }
  }

  /**
   * Load cached data from AsyncStorage
   * 
   * @returns {Promise<void>}
   * @private
   */
  async loadFromStorage() {
    try {
      const [categoriesData, subcategoriesData, timestamp] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.CATEGORIES),
        AsyncStorage.getItem(CACHE_KEYS.SUBCATEGORIES),
        AsyncStorage.getItem(CACHE_KEYS.TIMESTAMP)
      ]);

      if (categoriesData) {
        this.categories = JSON.parse(categoriesData);
        console.log(`✓ Loaded ${this.categories.length} categories from cache`);
      }
      
      if (subcategoriesData) {
        this.subcategories = JSON.parse(subcategoriesData);
        const totalSubcategories = Object.values(this.subcategories).reduce(
          (sum, subs) => sum + subs.length, 
          0
        );
        console.log(`✓ Loaded ${totalSubcategories} subcategories from cache`);
      }
      
      if (timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp, 10);
        const ageInMinutes = Math.floor(cacheAge / 1000 / 60);
        const ageInHours = Math.floor(ageInMinutes / 60);
        const ageInDays = Math.floor(ageInHours / 24);
        
        if (ageInDays > 0) {
          console.log(`Cache age: ${ageInDays} days, ${ageInHours % 24} hours`);
        } else if (ageInHours > 0) {
          console.log(`Cache age: ${ageInHours} hours, ${ageInMinutes % 60} minutes`);
        } else {
          console.log(`Cache age: ${ageInMinutes} minutes`);
        }
      } else {
        console.log('No cache timestamp found - cache is empty');
      }
    } catch (error) {
      console.error('Error loading motor category cache from storage:', error);
      // Reset cache on error
      this.categories = null;
      this.subcategories = {};
    }
  }

  /**
   * Check if cache is stale and refresh in background
   * 
   * @returns {Promise<void>}
   * @private
   */
  async refreshIfNeeded() {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.TIMESTAMP);
      
      if (!timestamp) {
        console.log('No cache timestamp - triggering initial refresh');
        await this.refreshCache();
        return;
      }
      
      const cacheAge = Date.now() - parseInt(timestamp, 10);

      if (cacheAge > CACHE_TTL) {
        console.log(`Cache is stale (age: ${Math.floor(cacheAge / 1000 / 60 / 60 / 24)} days) - refreshing...`);
        await this.refreshCache();
      } else {
        console.log('Cache is fresh - no refresh needed');
      }
    } catch (error) {
      console.error('Error checking cache freshness:', error);
    }
  }

  /**
   * Force refresh cache from API
   * Fetches all categories and their subcategories
   * 
   * @returns {Promise<void>}
   */
  async refreshCache() {
    // Prevent concurrent refresh calls
    if (this.refreshPromise) {
      console.log('Cache refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        console.log('Starting cache refresh from API...');
        
        // Fetch categories
        console.log('Fetching categories...');
        const categoriesResponse = await djangoAPI.getCategories();
        this.categories = categoriesResponse;
        console.log(`✓ Fetched ${this.categories.length} categories`);

        // Fetch all subcategories in parallel
        console.log('Fetching subcategories for all categories...');
        const allSubcategories = await this.fetchAllSubcategories();
        this.subcategories = allSubcategories;
        
        const totalSubcategories = Object.values(this.subcategories).reduce(
          (sum, subs) => sum + subs.length, 
          0
        );
        console.log(`✓ Fetched ${totalSubcategories} subcategories across ${Object.keys(this.subcategories).length} categories`);

        // Save to storage
        await this.saveToStorage();
        
        console.log('✓ Motor category cache refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh motor category cache:', error);
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Fetch all subcategories for all categories
   * 
   * @returns {Promise<Object>} Map of category name to subcategories array
   * @private
   */
  async fetchAllSubcategories() {
    try {
      // Ensure we have categories
      if (!this.categories || this.categories.length === 0) {
        console.warn('No categories available to fetch subcategories');
        return {};
      }

      const subcategoriesMap = {};
      
      // Fetch subcategories for each category in parallel
      const results = await Promise.allSettled(
        this.categories.map(async (category) => {
          try {
            const categoryKey = category.name || category.key || category.code;
            console.log(`  Fetching subcategories for: ${categoryKey}`);
            
            const subcategories = await djangoAPI.getSubcategories(categoryKey);
            
            // Normalize subcategories
            const normalized = (Array.isArray(subcategories) ? subcategories : []).map((sub) => {
              const type = String(sub.cover_type || sub.product_type || sub.pricing_model || sub.coverage_type || '').toUpperCase();
              const rawReq = sub.pricing_requirements || sub.required_fields || [];
              const reqArr = Array.isArray(rawReq) ? rawReq : Object.values(rawReq || {});
              
              return {
                id: sub.id,
                code: sub.subcategory_code || sub.code,
                subcategory_code: sub.subcategory_code || sub.code,
                name: sub.subcategory_name || sub.name,
                type,
                coverage_type: sub.coverage_type || type,
                description: sub.description,
                requirements: reqArr,
                is_extendible: Boolean(sub.is_extendible),
                extendible_variant_id: sub.extendible_variant_id || sub.extendible_variant || null,
                additionalFields: sub.additional_fields || sub.additionalFields || [],
                fieldValidations: sub.field_validations || sub.fieldValidations || {},
                base_premium: sub.base_premium,
                min_sum_insured: sub.min_sum_insured,
                max_sum_insured: sub.max_sum_insured,
                pricing_model: sub.pricing_model,
                raw: sub,
              };
            });
            
            console.log(`    ✓ ${normalized.length} subcategories`);
            
            return { categoryKey, subcategories: normalized };
          } catch (error) {
            console.error(`    ✗ Failed to fetch subcategories for ${category.name}:`, error.message);
            return { categoryKey: category.name, subcategories: [] };
          }
        })
      );

      // Process results
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          subcategoriesMap[result.value.categoryKey] = result.value.subcategories;
        }
      });

      return subcategoriesMap;
    } catch (error) {
      console.error('Error fetching all subcategories:', error);
      return {};
    }
  }

  /**
   * Save cache to AsyncStorage
   * 
   * @returns {Promise<void>}
   * @private
   */
  async saveToStorage() {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(this.categories)),
        AsyncStorage.setItem(CACHE_KEYS.SUBCATEGORIES, JSON.stringify(this.subcategories)),
        AsyncStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString())
      ]);
      
      console.log('✓ Cache saved to AsyncStorage');
    } catch (error) {
      console.error('Error saving motor category cache to storage:', error);
      throw error;
    }
  }

  /**
   * Get categories (from cache or API)
   * 
   * @param {boolean} forceRefresh - Force fetch from API
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories(forceRefresh = false) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (forceRefresh || !this.categories || this.categories.length === 0) {
      console.log('Fetching categories from API...');
      await this.refreshCache();
    } else {
      console.log('✓ Using cached categories');
    }

    return this.categories || [];
  }

  /**
   * Get subcategories for a category (from cache or API)
   * 
   * @param {string} categoryName - Category name or code
   * @param {boolean} forceRefresh - Force fetch from API
   * @returns {Promise<Array>} Array of subcategories
   */
  async getSubcategories(categoryName, forceRefresh = false) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Normalize category name for lookup
    const normalizedName = categoryName.toLowerCase().trim();
    
    // Check cache first
    const cachedKey = Object.keys(this.subcategories).find(
      key => key.toLowerCase().trim() === normalizedName
    );

    if (forceRefresh || !cachedKey || !this.subcategories[cachedKey]) {
      console.log(`Fetching subcategories for ${categoryName} from API...`);
      
      try {
        const subcategories = await djangoAPI.getSubcategories(categoryName);
        
        // Normalize and cache
        const normalized = (Array.isArray(subcategories) ? subcategories : []).map((sub) => {
          const type = String(sub.cover_type || sub.product_type || sub.pricing_model || sub.coverage_type || '').toUpperCase();
          const rawReq = sub.pricing_requirements || sub.required_fields || [];
          const reqArr = Array.isArray(rawReq) ? rawReq : Object.values(rawReq || {});
          
          return {
            id: sub.id,
            code: sub.subcategory_code || sub.code,
            subcategory_code: sub.subcategory_code || sub.code,
            name: sub.subcategory_name || sub.name,
            type,
            coverage_type: sub.coverage_type || type,
            description: sub.description,
            requirements: reqArr,
            is_extendible: Boolean(sub.is_extendible),
            extendible_variant_id: sub.extendible_variant_id || sub.extendible_variant || null,
            additionalFields: sub.additional_fields || sub.additionalFields || [],
            fieldValidations: sub.field_validations || sub.fieldValidations || {},
            base_premium: sub.base_premium,
            min_sum_insured: sub.min_sum_insured,
            max_sum_insured: sub.max_sum_insured,
            pricing_model: sub.pricing_model,
            raw: sub,
          };
        });
        
        this.subcategories[categoryName] = normalized;
        await this.saveToStorage();
        
        console.log(`✓ Fetched and cached ${normalized.length} subcategories for ${categoryName}`);
        
        return normalized;
      } catch (error) {
        console.error(`Failed to fetch subcategories for ${categoryName}:`, error);
        return [];
      }
    } else {
      console.log(`✓ Using cached subcategories for ${categoryName}`);
    }

    return this.subcategories[cachedKey] || [];
  }

  /**
   * Clear cache (useful for debugging or force refresh)
   * 
   * @returns {Promise<void>}
   */
  async clearCache() {
    console.log('Clearing motor category cache...');
    
    this.categories = null;
    this.subcategories = {};
    this.initialized = false;
    
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEYS.CATEGORIES),
        AsyncStorage.removeItem(CACHE_KEYS.SUBCATEGORIES),
        AsyncStorage.removeItem(CACHE_KEYS.TIMESTAMP)
      ]);
      
      console.log('✓ Motor category cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    const timestamp = await AsyncStorage.getItem(CACHE_KEYS.TIMESTAMP);
    const cacheAge = timestamp ? Date.now() - parseInt(timestamp, 10) : null;
    const categoriesCount = this.categories ? this.categories.length : 0;
    const subcategoriesCount = Object.values(this.subcategories).reduce(
      (sum, subs) => sum + subs.length,
      0
    );

    return {
      initialized: this.initialized,
      categoriesCount,
      subcategoriesCount,
      cacheAge: cacheAge ? Math.floor(cacheAge / 1000 / 60) : null, // in minutes
      cacheAgeHuman: cacheAge ? this.formatCacheAge(cacheAge) : 'No cache',
      isStale: cacheAge ? cacheAge > CACHE_TTL : true
    };
  }

  /**
   * Format cache age in human-readable format
   * 
   * @param {number} ageMs - Age in milliseconds
   * @returns {string} Formatted age
   * @private
   */
  formatCacheAge(ageMs) {
    const minutes = Math.floor(ageMs / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}, ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }
}

// Export singleton instance
const motorCategoryCache = new MotorCategoryCache();
export default motorCategoryCache;
