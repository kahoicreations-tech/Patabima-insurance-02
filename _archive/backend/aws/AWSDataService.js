// AWS Data Service for PataBima App
// Handles API calls to AWS backend and data synchronization

// import { API, Storage, Analytics } from 'aws-amplify'; // Removed for Android bundling compatibility
import AsyncStorage from '@react-native-async-storage/async-storage';

const DATA_STORAGE_KEYS = {
  QUOTES_CACHE: '@PataBima:quotesCache',
  CLIENTS_CACHE: '@PataBima:clientsCache',
  POLICIES_CACHE: '@PataBima:policiesCache',
  SYNC_STATUS: '@PataBima:syncStatus'
};

// AWS Data Service temporarily disabled for Android bundling compatibility  
/*
export const AWSDataService = {
  
  // Initialize and sync data
  initialize: async () => {
    try {
      // Track app launch
      Analytics.record({
        name: 'app_launch',
        attributes: {
          platform: 'mobile',
          timestamp: new Date().toISOString()
        }
      });
      
      // Sync critical data
      await AWSDataService.syncQuotes();
      await AWSDataService.syncClients();
      
      return { success: true };
    } catch (error) {
      console.error('Data service initialization error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Quotes Management
  quotes: {
    // Create new quote
    create: async (quoteData) => {
      try {
        const response = await API.post('PataBimaAPI', '/quotes', {
          body: {
            ...quoteData,
            createdAt: new Date().toISOString(),
            status: 'draft'
          }
        });
        
        // Track quote creation
        Analytics.record({
          name: 'quote_created',
          attributes: {
            insuranceType: quoteData.insuranceType,
            premium: quoteData.premium?.toString()
          }
        });
        
        // Update local cache
        await AWSDataService.updateQuoteCache(response);
        
        return { success: true, data: response };
      } catch (error) {
        console.error('Create quote error:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Get all quotes
    getAll: async (forceRefresh = false) => {
      try {
        if (!forceRefresh) {
          // Try cache first
          const cached = await AsyncStorage.getItem(DATA_STORAGE_KEYS.QUOTES_CACHE);
          if (cached) {
            const cacheData = JSON.parse(cached);
            if (Date.now() - cacheData.timestamp < 300000) { // 5 minutes cache
              return { success: true, data: cacheData.quotes };
            }
          }
        }
        
        const response = await API.get('PataBimaAPI', '/quotes');
        
        // Update cache
        await AsyncStorage.setItem(DATA_STORAGE_KEYS.QUOTES_CACHE, JSON.stringify({
          quotes: response,
          timestamp: Date.now()
        }));
        
        return { success: true, data: response };
      } catch (error) {
        console.error('Get quotes error:', error);
        
        // Fallback to cache if API fails
        const cached = await AsyncStorage.getItem(DATA_STORAGE_KEYS.QUOTES_CACHE);
        if (cached) {
          const cacheData = JSON.parse(cached);
          return { success: true, data: cacheData.quotes, fromCache: true };
        }
        
        return { success: false, error: error.message };
      }
    },
    
    // Update quote
    update: async (quoteId, updateData) => {
      try {
        const response = await API.put('PataBimaAPI', `/quotes/${quoteId}`, {
          body: {
            ...updateData,
            updatedAt: new Date().toISOString()
          }
        });
        
        // Track quote update
        Analytics.record({
          name: 'quote_updated',
          attributes: {
            quoteId,
            status: updateData.status
          }
        });
        
        return { success: true, data: response };
      } catch (error) {
        console.error('Update quote error:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Delete quote
    delete: async (quoteId) => {
      try {
        await API.del('PataBimaAPI', `/quotes/${quoteId}`);
        
        // Track quote deletion
        Analytics.record({
          name: 'quote_deleted',
          attributes: { quoteId }
        });
        
        return { success: true };
      } catch (error) {
        console.error('Delete quote error:', error);
        return { success: false, error: error.message };
      }
    }
  },
  
  // Clients Management
  clients: {
    // Create new client
    create: async (clientData) => {
      try {
        const response = await API.post('PataBimaAPI', '/clients', {
          body: {
            ...clientData,
            createdAt: new Date().toISOString()
          }
        });
        
        // Track client creation
        Analytics.record({
          name: 'client_created',
          attributes: {
            clientType: clientData.type || 'individual'
          }
        });
        
        return { success: true, data: response };
      } catch (error) {
        console.error('Create client error:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Get all clients
    getAll: async () => {
      try {
        const response = await API.get('PataBimaAPI', '/clients');
        return { success: true, data: response };
      } catch (error) {
        console.error('Get clients error:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Search clients
    search: async (searchTerm) => {
      try {
        const response = await API.get('PataBimaAPI', `/clients/search?q=${encodeURIComponent(searchTerm)}`);
        
        // Track search
        Analytics.record({
          name: 'client_search',
          attributes: { searchTerm }
        });
        
        return { success: true, data: response };
      } catch (error) {
        console.error('Search clients error:', error);
        return { success: false, error: error.message };
      }
    }
  },
  
  // Policies Management
  policies: {
    // Get agent policies
    getAll: async () => {
      try {
        const response = await API.get('PataBimaAPI', '/policies');
        return { success: true, data: response };
      } catch (error) {
        console.error('Get policies error:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Get upcoming renewals
    getUpcomingRenewals: async () => {
      try {
        const response = await API.get('PataBimaAPI', '/policies/renewals');
        return { success: true, data: response };
      } catch (error) {
        console.error('Get renewals error:', error);
        return { success: false, error: error.message };
      }
    }
  },
  
  // Analytics and Reporting
  analytics: {
    // Get agent performance
    getPerformance: async (period = 'month') => {
      try {
        const response = await API.get('PataBimaAPI', `/analytics/performance?period=${period}`);
        return { success: true, data: response };
      } catch (error) {
        console.error('Get performance error:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Track custom event
    trackEvent: async (eventName, attributes = {}) => {
      try {
        Analytics.record({
          name: eventName,
          attributes: {
            ...attributes,
            timestamp: new Date().toISOString()
          }
        });
        
        return { success: true };
      } catch (error) {
        console.error('Track event error:', error);
        return { success: false, error: error.message };
      }
    }
  },
  
  // File Management (S3 Storage)
  files: {
    // Upload file
    upload: async (file, fileName, visibility = 'private') => {
      try {
        const result = await Storage.put(fileName, file, {
          level: visibility,
          contentType: file.type
        });
        
        return { success: true, key: result.key };
      } catch (error) {
        console.error('File upload error:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Download file
    download: async (fileName, visibility = 'private') => {
      try {
        const url = await Storage.get(fileName, {
          level: visibility,
          expires: 3600 // 1 hour
        });
        
        return { success: true, url };
      } catch (error) {
        console.error('File download error:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Delete file
    delete: async (fileName, visibility = 'private') => {
      try {
        await Storage.remove(fileName, { level: visibility });
        return { success: true };
      } catch (error) {
        console.error('File delete error:', error);
        return { success: false, error: error.message };
      }
    }
  },
  
  // Data Synchronization
  syncQuotes: async () => {
    try {
      const result = await AWSDataService.quotes.getAll(true);
      if (result.success) {
        await AsyncStorage.setItem(DATA_STORAGE_KEYS.QUOTES_CACHE, JSON.stringify({
          quotes: result.data,
          timestamp: Date.now()
        }));
      }
      return result;
    } catch (error) {
      console.error('Sync quotes error:', error);
      return { success: false, error: error.message };
    }
  },
  
  syncClients: async () => {
    try {
      const result = await AWSDataService.clients.getAll();
      if (result.success) {
        await AsyncStorage.setItem(DATA_STORAGE_KEYS.CLIENTS_CACHE, JSON.stringify({
          clients: result.data,
          timestamp: Date.now()
        }));
      }
      return result;
    } catch (error) {
      console.error('Sync clients error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Helper function to update quote cache
  updateQuoteCache: async (newQuote) => {
    try {
      const cached = await AsyncStorage.getItem(DATA_STORAGE_KEYS.QUOTES_CACHE);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const updatedQuotes = [newQuote, ...cacheData.quotes];
        
        await AsyncStorage.setItem(DATA_STORAGE_KEYS.QUOTES_CACHE, JSON.stringify({
          quotes: updatedQuotes,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Update quote cache error:', error);
    }
  },
  
  // Network status check
  checkConnection: async () => {
    try {
      await API.get('PataBimaAPI', '/health');
      return { success: true, online: true };
    } catch (error) {
      return { success: false, online: false };
    }
  }
};
*/

// Temporary placeholder export for Android compatibility
export const AWSDataService = {
  initialize: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  quotes: {
    create: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    getAll: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    getById: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    update: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    delete: async () => ({ success: false, error: 'AWS temporarily disabled' })
  },
  clients: {
    create: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    getAll: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    getById: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    update: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    delete: async () => ({ success: false, error: 'AWS temporarily disabled' })
  },
  policies: {
    create: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    getAll: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    getById: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    update: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    delete: async () => ({ success: false, error: 'AWS temporarily disabled' })
  },
  sync: {
    syncAll: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    syncQuotes: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    syncClients: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    syncPolicies: async () => ({ success: false, error: 'AWS temporarily disabled' })
  },
  analytics: {
    track: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    recordEvent: async () => ({ success: false, error: 'AWS temporarily disabled' })
  },
  storage: {
    upload: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    download: async () => ({ success: false, error: 'AWS temporarily disabled' }),
    delete: async () => ({ success: false, error: 'AWS temporarily disabled' })
  },
  getConnectionStatus: async () => ({ success: false, online: false, error: 'AWS temporarily disabled' })
};

export default AWSDataService;
