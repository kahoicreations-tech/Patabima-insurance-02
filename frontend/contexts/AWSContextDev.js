// Simple AWS Context for Development Mode
// This provides mock AWS functionality until we deploy actual services

import React, { createContext, useContext, useState, useEffect } from 'react';

const AWSContextDev = createContext(null);

export const useAWS = () => {
  const context = useContext(AWSContextDev);
  if (!context) {
    throw new Error('useAWS must be used within an AWSProviderDev');
  }
  return context;
};

export const AWSProviderDev = ({ children }) => {
  const [state, setState] = useState({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    isOnline: true,
    developmentMode: true,
  });

  const signIn = async (email, password) => {
    setState(prev => ({ ...prev, loading: true }));
    
    // Mock sign in for development
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: {
          email,
          firstName: 'Dev',
          lastName: 'User',
          agentCode: 'DEV001'
        },
        loading: false
      }));
    }, 1000);
  };

  const signOut = async () => {
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      loading: false
    }));
  };

  const signUp = async (userData) => {
    setState(prev => ({ ...prev, loading: true }));
    
    // Mock sign up for development
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        loading: false
      }));
      alert('Development Mode: Sign up successful! Please use sign in.');
    }, 1000);
  };

  const createQuote = async (quoteData) => {
    // Mock quote creation
    console.log('Development Mode: Creating quote', quoteData);
    return {
      id: `dev_quote_${Date.now()}`,
      ...quoteData,
      createdAt: new Date().toISOString()
    };
  };

  const getQuotes = async () => {
    // Mock quote retrieval
    return [
      {
        id: 'dev_quote_1',
        insuranceType: 'MOTOR',
        premium: 15000,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      }
    ];
  };

  const value = {
    ...state,
    // Auth methods
    signIn,
    signOut,
    signUp,
    // Data methods
    createQuote,
    getQuotes,
    // Status methods
    isConfigured: false,
    isDevelopmentMode: true,
  };

  return (
    <AWSContextDev.Provider value={value}>
      {children}
    </AWSContextDev.Provider>
  );
};

export default AWSContextDev;
