/**
 * Insurance Template System - Dynamic JSON-Driven Forms with Service Integrations
 * 
 * Universal form system using field library, JSON configurations, and backend services
 */

import React from 'react';
import DynamicInsuranceForm from './insurance/DynamicForm';
import EnhancedDynamicForm from './insurance/EnhancedDynamicForm';
import { TOR_PRIVATE_CONFIG } from './insurance/configs/TORPrivateConfig';
import { ENHANCED_TOR_PRIVATE_CONFIG } from './insurance/configs/EnhancedTORPrivateConfig';

// Enhanced TOR Screen Creator with service integrations
export const createEnhancedTORScreen = (options = {}) => {
  const EnhancedTORScreen = ({ navigation, route }) => {
    const handleServiceUpdate = (service, data) => {
      console.log(`Service update - ${service}:`, data);
      // Handle service updates (analytics, logging, etc.)
    };

    const handleFormSubmit = async (submissionData) => {
      console.log('Form submission with service data:', submissionData);
      
      // Navigate to receipt screen with all data
      navigation.navigate('InsuranceReceipt', {
        formData: submissionData.formData,
        serviceResults: submissionData.serviceResults,
        metadata: submissionData.metadata
      });
    };

    return (
      <EnhancedDynamicForm
        config={ENHANCED_TOR_PRIVATE_CONFIG}
        navigation={navigation}
        route={route}
        onServiceUpdate={handleServiceUpdate}
        onSubmit={handleFormSubmit}
        {...options}
      />
    );
  };

  EnhancedTORScreen.displayName = 'EnhancedTORInsuranceScreen';
  return EnhancedTORScreen;
};

// Standard TOR Screen Creator using basic configuration
export const createTORScreen = (options = {}) => {
  const TORScreen = ({ navigation, route }) => {
    return (
      <DynamicInsuranceForm
        config={TOR_PRIVATE_CONFIG}
        navigation={navigation}
        route={route}
        {...options}
      />
    );
  };

  TORScreen.displayName = 'TORInsuranceScreen';
  return TORScreen;
};

// Export the dynamic forms for direct use
export { DynamicInsuranceForm, EnhancedDynamicForm };

// Export configurations for other insurance types
export const INSURANCE_CONFIGS = {
  TOR_PRIVATE: TOR_PRIVATE_CONFIG,
  ENHANCED_TOR_PRIVATE: ENHANCED_TOR_PRIVATE_CONFIG,
  // Add more configs here:
  // COMPREHENSIVE_PRIVATE: COMPREHENSIVE_PRIVATE_CONFIG,
  // TOR_COMMERCIAL: TOR_COMMERCIAL_CONFIG,
  // etc.
};

// Enhanced placeholder screen creators for other insurance types
// These will use enhanced forms with service integrations
export const createEnhancedThirdPartyScreen = (options = {}) => {
  return createEnhancedTORScreen({ ...options, screenTitle: 'Enhanced Third Party Insurance' });
};

export const createEnhancedComprehensiveScreen = (options = {}) => {
  return createEnhancedTORScreen({ ...options, screenTitle: 'Enhanced Comprehensive Insurance' });
};

// Standard placeholder screen creators (without service integrations)
export const createThirdPartyScreen = (options = {}) => {
  return createTORScreen({ ...options, screenTitle: 'Third Party Insurance' });
};

export const createComprehensiveScreen = (options = {}) => {
  return createTORScreen({ ...options, screenTitle: 'Comprehensive Insurance' });
};

export const createCommercialThirdPartyScreen = (options = {}) => {
  return createTORScreen({ ...options, screenTitle: 'Commercial Third Party' });
};

export const createCommercialComprehensiveScreen = (options = {}) => {
  return createTORScreen({ ...options, screenTitle: 'Commercial Comprehensive' });
};

export const createPSVThirdPartyScreen = (options = {}) => {
  return createTORScreen({ ...options, screenTitle: 'PSV Third Party' });
};

export const createPSVComprehensiveScreen = (options = {}) => {
  return createTORScreen({ ...options, screenTitle: 'PSV Comprehensive' });
};

export const createMotorcycleScreen = (options = {}) => {
  return createTORScreen({ ...options, screenTitle: 'Motorcycle Insurance' });
};

export const createTukTukScreen = (options = {}) => {
  return createTORScreen({ ...options, screenTitle: 'TukTuk Insurance' });
};