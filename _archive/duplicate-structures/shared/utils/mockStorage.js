// Temporary Mock Storage for AsyncStorage until dependency is resolved
// This provides a simple in-memory storage for development and testing

let storage = {};

export const MockAsyncStorage = {
  getItem: async (key) => {
    return storage[key] || null;
  },
  
  setItem: async (key, value) => {
    storage[key] = value;
    return Promise.resolve();
  },
  
  removeItem: async (key) => {
    delete storage[key];
    return Promise.resolve();
  },
  
  getAllKeys: async () => {
    return Object.keys(storage);
  },
  
  multiGet: async (keys) => {
    return keys.map(key => [key, storage[key] || null]);
  },
  
  multiSet: async (keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => {
      storage[key] = value;
    });
    return Promise.resolve();
  },
  
  multiRemove: async (keys) => {
    keys.forEach(key => {
      delete storage[key];
    });
    return Promise.resolve();
  },
  
  clear: async () => {
    storage = {};
    return Promise.resolve();
  },
  
  // Development helper to view current storage
  _viewStorage: () => {
    console.log('Current MockStorage:', storage);
    return storage;
  }
};

export default MockAsyncStorage;
