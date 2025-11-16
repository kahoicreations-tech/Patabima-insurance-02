import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  /**
   * Store data with key
   */
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      console.log(`✅ Stored data for key: ${key}`);
    } catch (error) {
      console.error(`❌ Error storing data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get data by key
   */
  async getItem(key, defaultValue = null) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return defaultValue;
      
      try {
        return JSON.parse(value);
      } catch (parseError) {
        // If parsing fails, return the raw string value
        return value;
      }
    } catch (error) {
      console.error(`❌ Error getting data for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove data by key
   */
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`✅ Removed data for key: ${key}`);
    } catch (error) {
      console.error(`❌ Error removing data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove multiple items
   */
  async removeItems(keys) {
    try {
      await AsyncStorage.multiRemove(keys);
      console.log(`✅ Removed data for keys: ${keys.join(', ')}`);
    } catch (error) {
      console.error(`❌ Error removing multiple items:`, error);
      throw error;
    }
  }

  /**
   * Store multiple key-value pairs
   */
  async setItems(keyValuePairs) {
    try {
      const formattedPairs = keyValuePairs.map(([key, value]) => [
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      ]);
      
      await AsyncStorage.multiSet(formattedPairs);
      console.log(`✅ Stored multiple items: ${keyValuePairs.map(([key]) => key).join(', ')}`);
    } catch (error) {
      console.error(`❌ Error storing multiple items:`, error);
      throw error;
    }
  }

  /**
   * Get multiple items by keys
   */
  async getItems(keys) {
    try {
      const values = await AsyncStorage.multiGet(keys);
      const result = {};
      
      values.forEach(([key, value]) => {
        if (value !== null) {
          try {
            result[key] = JSON.parse(value);
          } catch (parseError) {
            result[key] = value;
          }
        } else {
          result[key] = null;
        }
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Error getting multiple items:`, error);
      throw error;
    }
  }

  /**
   * Clear all storage
   */
  async clear() {
    try {
      await AsyncStorage.clear();
      console.log('✅ Cleared all storage');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error) {
      console.error('❌ Error getting all keys:', error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async hasKey(key) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.includes(key);
    } catch (error) {
      console.error(`❌ Error checking if key ${key} exists:`, error);
      return false;
    }
  }

  /**
   * Get storage size (approximate)
   */
  async getStorageSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const values = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      values.forEach(([key, value]) => {
        totalSize += key.length + (value ? value.length : 0);
      });
      
      return {
        keys: keys.length,
        totalSize,
        formattedSize: this.formatBytes(totalSize),
      };
    } catch (error) {
      console.error('❌ Error getting storage size:', error);
      return { keys: 0, totalSize: 0, formattedSize: '0 B' };
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Cache data with expiration
   */
  async setCache(key, value, expirationHours = 24) {
    try {
      const expirationTime = Date.now() + (expirationHours * 60 * 60 * 1000);
      const cacheData = {
        value,
        expirationTime,
      };
      
      await this.setItem(`cache_${key}`, cacheData);
    } catch (error) {
      console.error(`❌ Error setting cache for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get cached data if not expired
   */
  async getCache(key, defaultValue = null) {
    try {
      const cacheData = await this.getItem(`cache_${key}`);
      
      if (!cacheData) return defaultValue;
      
      if (Date.now() > cacheData.expirationTime) {
        // Cache expired, remove it
        await this.removeItem(`cache_${key}`);
        return defaultValue;
      }
      
      return cacheData.value;
    } catch (error) {
      console.error(`❌ Error getting cache for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Clear expired cache items
   */
  async clearExpiredCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      if (cacheKeys.length === 0) return;
      
      const cacheData = await AsyncStorage.multiGet(cacheKeys);
      const expiredKeys = [];
      
      cacheData.forEach(([key, value]) => {
        if (value) {
          try {
            const parsedValue = JSON.parse(value);
            if (Date.now() > parsedValue.expirationTime) {
              expiredKeys.push(key);
            }
          } catch (parseError) {
            // Invalid cache format, mark for removal
            expiredKeys.push(key);
          }
        }
      });
      
      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
        console.log(`✅ Cleared ${expiredKeys.length} expired cache items`);
      }
    } catch (error) {
      console.error('❌ Error clearing expired cache:', error);
    }
  }
}

// Create and export a singleton instance
const storageService = new StorageService();
export default storageService;
