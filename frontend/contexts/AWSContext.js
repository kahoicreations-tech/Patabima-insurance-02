// AWS Integration Context for PataBima App
// Provides global state management for AWS services

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AWSAuthService } from '../services/aws/AWSAuthService';
import { AWSDataService } from '../services/aws/AWSDataService';

// Initial state
const initialState = {
  // Authentication state
  isAuthenticated: false,
  user: null,
  agentProfile: null,
  loading: true,
  
  // Data state
  quotes: [],
  clients: [],
  policies: [],
  
  // Connection state
  isOnline: true,
  lastSync: null,
  
  // Error state
  error: null,
  
  // Feature flags
  features: {
    analyticsEnabled: process.env.ENABLE_ANALYTICS === 'true',
    pushNotificationsEnabled: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
    offlineModeEnabled: process.env.ENABLE_OFFLINE_MODE === 'true',
    fileUploadEnabled: process.env.ENABLE_FILE_UPLOAD === 'true'
  }
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_USER: 'SET_USER',
  SET_AGENT_PROFILE: 'SET_AGENT_PROFILE',
  SET_QUOTES: 'SET_QUOTES',
  SET_CLIENTS: 'SET_CLIENTS',
  SET_POLICIES: 'SET_POLICIES',
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_LAST_SYNC: 'SET_LAST_SYNC',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  ADD_QUOTE: 'ADD_QUOTE',
  UPDATE_QUOTE: 'UPDATE_QUOTE',
  REMOVE_QUOTE: 'REMOVE_QUOTE'
};

// Reducer
const awsReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_AUTHENTICATED:
      return { ...state, isAuthenticated: action.payload };
    
    case actionTypes.SET_USER:
      return { ...state, user: action.payload };
    
    case actionTypes.SET_AGENT_PROFILE:
      return { ...state, agentProfile: action.payload };
    
    case actionTypes.SET_QUOTES:
      return { ...state, quotes: action.payload };
    
    case actionTypes.SET_CLIENTS:
      return { ...state, clients: action.payload };
    
    case actionTypes.SET_POLICIES:
      return { ...state, policies: action.payload };
    
    case actionTypes.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };
    
    case actionTypes.SET_LAST_SYNC:
      return { ...state, lastSync: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case actionTypes.ADD_QUOTE:
      return { ...state, quotes: [action.payload, ...state.quotes] };
    
    case actionTypes.UPDATE_QUOTE:
      return {
        ...state,
        quotes: state.quotes.map(quote => 
          quote.id === action.payload.id ? action.payload : quote
        )
      };
    
    case actionTypes.REMOVE_QUOTE:
      return {
        ...state,
        quotes: state.quotes.filter(quote => quote.id !== action.payload)
      };
    
    default:
      return state;
  }
};

// Create context
const AWSContext = createContext();

// AWS Provider component
export const AWSProvider = ({ children }) => {
  const [state, dispatch] = useReducer(awsReducer, initialState);
  
  // Initialize AWS on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        
        // Check authentication status
        const authResult = await AWSAuthService.isAuthenticated();
        dispatch({ type: actionTypes.SET_AUTHENTICATED, payload: authResult });
        
        if (authResult) {
          // Get user data
          const userResult = await AWSAuthService.getCurrentUser();
          if (userResult.success) {
            dispatch({ type: actionTypes.SET_USER, payload: userResult.user });
          }
          
          // Get agent profile
          const profileResult = await AWSAuthService.getAgentProfile();
          if (profileResult.success) {
            dispatch({ type: actionTypes.SET_AGENT_PROFILE, payload: profileResult.profile });
          }
          
          // Initialize data service
          await AWSDataService.initialize();
          
          // Load initial data
          await loadQuotes();
          await loadClients();
          await loadPolicies();
        }
        
        // Check connection status
        const connectionResult = await AWSDataService.checkConnection();
        dispatch({ type: actionTypes.SET_ONLINE_STATUS, payload: connectionResult.online });
        
      } catch (error) {
        console.error('App initialization error:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };
    
    initializeApp();
  }, []);
  
  // Load quotes
  const loadQuotes = async (forceRefresh = false) => {
    try {
      const result = await AWSDataService.quotes.getAll(forceRefresh);
      if (result.success) {
        dispatch({ type: actionTypes.SET_QUOTES, payload: result.data });
        if (!result.fromCache) {
          dispatch({ type: actionTypes.SET_LAST_SYNC, payload: new Date() });
        }
      }
    } catch (error) {
      console.error('Load quotes error:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };
  
  // Load clients
  const loadClients = async () => {
    try {
      const result = await AWSDataService.clients.getAll();
      if (result.success) {
        dispatch({ type: actionTypes.SET_CLIENTS, payload: result.data });
      }
    } catch (error) {
      console.error('Load clients error:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };
  
  // Load policies
  const loadPolicies = async () => {
    try {
      const result = await AWSDataService.policies.getAll();
      if (result.success) {
        dispatch({ type: actionTypes.SET_POLICIES, payload: result.data });
      }
    } catch (error) {
      console.error('Load policies error:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };
  
  // Authentication actions
  const signIn = async (email, password) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      dispatch({ type: actionTypes.CLEAR_ERROR });
      
      const result = await AWSAuthService.signIn(email, password);
      if (result.success) {
        dispatch({ type: actionTypes.SET_AUTHENTICATED, payload: true });
        dispatch({ type: actionTypes.SET_USER, payload: result.user });
        
        // Load user data
        const profileResult = await AWSAuthService.getAgentProfile();
        if (profileResult.success) {
          dispatch({ type: actionTypes.SET_AGENT_PROFILE, payload: profileResult.profile });
        }
        
        // Initialize data
        await AWSDataService.initialize();
        await loadQuotes();
        await loadClients();
        await loadPolicies();
      } else {
        dispatch({ type: actionTypes.SET_ERROR, payload: result.error });
      }
      
      return result;
    } catch (error) {
      const errorMsg = error.message || 'Sign in failed';
      dispatch({ type: actionTypes.SET_ERROR, payload: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };
  
  const signOut = async () => {
    try {
      const result = await AWSAuthService.signOut();
      if (result.success) {
        dispatch({ type: actionTypes.SET_AUTHENTICATED, payload: false });
        dispatch({ type: actionTypes.SET_USER, payload: null });
        dispatch({ type: actionTypes.SET_AGENT_PROFILE, payload: null });
        dispatch({ type: actionTypes.SET_QUOTES, payload: [] });
        dispatch({ type: actionTypes.SET_CLIENTS, payload: [] });
        dispatch({ type: actionTypes.SET_POLICIES, payload: [] });
        dispatch({ type: actionTypes.CLEAR_ERROR });
      }
      return result;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };
  
  // Quote actions
  const createQuote = async (quoteData) => {
    try {
      const result = await AWSDataService.quotes.create(quoteData);
      if (result.success) {
        dispatch({ type: actionTypes.ADD_QUOTE, payload: result.data });
      }
      return result;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };
  
  const updateQuote = async (quoteId, updateData) => {
    try {
      const result = await AWSDataService.quotes.update(quoteId, updateData);
      if (result.success) {
        dispatch({ type: actionTypes.UPDATE_QUOTE, payload: result.data });
      }
      return result;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };
  
  const deleteQuote = async (quoteId) => {
    try {
      const result = await AWSDataService.quotes.delete(quoteId);
      if (result.success) {
        dispatch({ type: actionTypes.REMOVE_QUOTE, payload: quoteId });
      }
      return result;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };
  
  // Utility actions
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };
  
  const refreshData = async () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      await Promise.all([
        loadQuotes(true),
        loadClients(),
        loadPolicies()
      ]);
      dispatch({ type: actionTypes.SET_LAST_SYNC, payload: new Date() });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };
  
  const value = {
    // State
    ...state,
    
    // Authentication actions
    signIn,
    signOut,
    
    // Data actions
    loadQuotes,
    loadClients,
    loadPolicies,
    createQuote,
    updateQuote,
    deleteQuote,
    
    // Utility actions
    clearError,
    refreshData
  };
  
  return (
    <AWSContext.Provider value={value}>
      {children}
    </AWSContext.Provider>
  );
};

// Hook to use AWS context
export const useAWS = () => {
  const context = useContext(AWSContext);
  if (!context) {
    throw new Error('useAWS must be used within an AWSProvider');
  }
  return context;
};

export default AWSContext;
