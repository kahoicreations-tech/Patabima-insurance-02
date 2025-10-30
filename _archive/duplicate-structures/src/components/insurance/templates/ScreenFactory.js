/**
 * Screen Factory
 * 
 * Automatically generates React Native screen components for insurance forms
 * using the template system and FormEngine.
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import FormEngine from '../FormEngine';
import { generateFormConfig, createCustomFormConfig } from './FormGenerator';

/**
 * Creates a complete insurance screen component
 */
export function createInsuranceScreen(formType, screenOptions = {}) {
  const InsuranceScreen = ({ navigation, route }) => {
    // Get form configuration from templates
    const formConfig = generateFormConfig(formType, screenOptions.configOptions);
    
    const {
      screenTitle = formConfig.title,
      headerStyle = {},
      containerStyle = {},
      showProgressBar = true,
      enableValidation = true,
      enableDocumentUpload = true,
      onSubmit = null,
      onStepChange = null,
      customComponents = {},
      ...otherProps
    } = screenOptions;

    const handleSubmit = (formData) => {
      console.log(`${formType} Form Submitted:`, formData);
      
      if (onSubmit) {
        onSubmit(formData, navigation, route);
      } else {
        // Default submission behavior
        navigation.navigate('QuotationSummary', {
          formType,
          formData,
          quotationId: `${formType}-${Date.now()}`
        });
      }
    };

    const handleStepChange = (stepIndex, stepData) => {
      if (onStepChange) {
        onStepChange(stepIndex, stepData, navigation, route);
      }
    };

    return (
      <SafeAreaView style={[styles.container, containerStyle]}>
        <View style={[styles.header, headerStyle]}>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
        </View>
        
        <FormEngine
          config={formConfig}
          navigation={navigation}
          route={route}
          onSubmit={handleSubmit}
          onStepChange={handleStepChange}
          showProgressBar={showProgressBar}
          enableValidation={enableValidation}
          enableDocumentUpload={enableDocumentUpload}
          customComponents={customComponents}
          {...otherProps}
        />
      </SafeAreaView>
    );
  };

  // Set display name for debugging
  InsuranceScreen.displayName = `${formType}InsuranceScreen`;
  
  return InsuranceScreen;
}

/**
 * Advanced insurance screen with custom configuration
 */
export function createAdvancedInsuranceScreen(customConfig, screenOptions = {}) {
  const AdvancedInsuranceScreen = ({ navigation, route }) => {
    // Generate form configuration from custom config
    const formConfig = createCustomFormConfig(customConfig);
    
    const {
      screenTitle = formConfig.title,
      headerStyle = {},
      containerStyle = {},
      onSubmit = null,
      onStepChange = null,
      ...otherProps
    } = screenOptions;

    const handleSubmit = (formData) => {
      console.log('Advanced Form Submitted:', formData);
      
      if (onSubmit) {
        onSubmit(formData, navigation, route);
      } else {
        navigation.navigate('QuotationSummary', {
          formType: customConfig.formType || 'CUSTOM',
          formData,
          quotationId: `CUSTOM-${Date.now()}`
        });
      }
    };

    const handleStepChange = (stepIndex, stepData) => {
      if (onStepChange) {
        onStepChange(stepIndex, stepData, navigation, route);
      }
    };

    return (
      <SafeAreaView style={[styles.container, containerStyle]}>
        <View style={[styles.header, headerStyle]}>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
        </View>
        
        <FormEngine
          config={formConfig}
          navigation={navigation}
          route={route}
          onSubmit={handleSubmit}
          onStepChange={handleStepChange}
          {...otherProps}
        />
      </SafeAreaView>
    );
  };

  AdvancedInsuranceScreen.displayName = `${customConfig.formType || 'Custom'}InsuranceScreen`;
  
  return AdvancedInsuranceScreen;
}

/**
 * Pre-configured screen creators for common insurance types
 */
export const ScreenCreators = {
  
  // TOR Insurance
  createTORScreen: (options = {}) => {
    return createInsuranceScreen('TOR', {
      screenTitle: 'TOR Insurance Quotation',
      headerStyle: { backgroundColor: '#D5222B' },
      configOptions: {
        showProgressBar: true,
        enableValidation: true,
        enableDocumentUpload: true
      },
      ...options
    });
  },

  // Private Vehicle - Third Party
  createThirdPartyScreen: (options = {}) => {
    return createInsuranceScreen('PRIVATE_THIRD_PARTY', {
      screenTitle: 'Third Party Insurance',
      headerStyle: { backgroundColor: '#2E86AB' },
      configOptions: {
        showProgressBar: true,
        enableValidation: true
      },
      ...options
    });
  },

  // Private Vehicle - Comprehensive
  createComprehensiveScreen: (options = {}) => {
    return createInsuranceScreen('PRIVATE_COMPREHENSIVE', {
      screenTitle: 'Comprehensive Insurance',
      headerStyle: { backgroundColor: '#A23B72' },
      configOptions: {
        showProgressBar: true,
        enableValidation: true,
        enableDocumentUpload: true
      },
      ...options
    });
  },

  // Commercial Vehicle - Third Party
  createCommercialThirdPartyScreen: (options = {}) => {
    return createInsuranceScreen('COMMERCIAL_THIRD_PARTY', {
      screenTitle: 'Commercial Third Party Insurance',
      headerStyle: { backgroundColor: '#F18F01' },
      configOptions: {
        showProgressBar: true,
        enableValidation: true,
        enableDocumentUpload: true
      },
      ...options
    });
  },

  // Commercial Vehicle - Comprehensive
  createCommercialComprehensiveScreen: (options = {}) => {
    return createInsuranceScreen('COMMERCIAL_COMPREHENSIVE', {
      screenTitle: 'Commercial Comprehensive Insurance',
      headerStyle: { backgroundColor: '#C73E1D' },
      configOptions: {
        showProgressBar: true,
        enableValidation: true,
        enableDocumentUpload: true
      },
      ...options
    });
  },

  // PSV - Third Party
  createPSVThirdPartyScreen: (options = {}) => {
    return createInsuranceScreen('PSV_THIRD_PARTY', {
      screenTitle: 'PSV Third Party Insurance',
      headerStyle: { backgroundColor: '#4E6E58' },
      configOptions: {
        showProgressBar: true,
        enableValidation: true,
        enableDocumentUpload: true
      },
      ...options
    });
  },

  // PSV - Comprehensive
  createPSVComprehensiveScreen: (options = {}) => {
    return createInsuranceScreen('PSV_COMPREHENSIVE', {
      screenTitle: 'PSV Comprehensive Insurance',
      headerStyle: { backgroundColor: '#3B1F2B' },
      configOptions: {
        showProgressBar: true,
        enableValidation: true,
        enableDocumentUpload: true
      },
      ...options
    });
  },

  // Motorcycle
  createMotorcycleScreen: (options = {}) => {
    return createAdvancedInsuranceScreen({
      formType: 'MOTORCYCLE',
      stepConfigs: [
        {
          id: 'vehicle_info',
          title: 'Motorcycle Information',
          description: 'Enter motorcycle details',
          stepTemplate: 'VEHICLE_INFO',
          fieldOverrides: {
            body_type: { defaultValue: 'Motorcycle' }
          }
        },
        {
          id: 'client_info',
          title: 'Owner Information', 
          description: 'Enter your details',
          stepTemplate: 'CLIENT_INFO'
        },
        {
          id: 'insurance_info',
          title: 'Insurance Cover',
          description: 'Choose your coverage',
          stepTemplate: 'INSURANCE_INFO'
        },
        {
          id: 'documents',
          title: 'Required Documents',
          description: 'Upload documents',
          stepTemplate: 'DOCUMENTS'
        }
      ],
      defaults: { 
        cover_type: 'third_party',
        body_type: 'Motorcycle'
      }
    }, {
      screenTitle: 'Motorcycle Insurance',
      headerStyle: { backgroundColor: '#8E44AD' },
      ...options
    });
  }
};

/**
 * Generates multiple screens at once
 */
export function generateMultipleScreens(screenConfigs) {
  const screens = {};
  
  screenConfigs.forEach(config => {
    const { name, type, options = {} } = config;
    
    if (ScreenCreators[`create${type}Screen`]) {
      screens[name] = ScreenCreators[`create${type}Screen`](options);
    } else {
      console.warn(`Screen creator not found: create${type}Screen`);
    }
  });
  
  return screens;
}

/**
 * Creates navigation screens configuration
 */
export function createNavigationScreens() {
  return {
    // Standard screens
    TORQuotationFlowScreen: ScreenCreators.createTORScreen(),
    ThirdPartyQuotationFlowScreen: ScreenCreators.createThirdPartyScreen(),
    ComprehensiveQuotationFlowScreen: ScreenCreators.createComprehensiveScreen(),
    CommercialThirdPartyQuotationFlowScreen: ScreenCreators.createCommercialThirdPartyScreen(),
    CommercialComprehensiveQuotationFlowScreen: ScreenCreators.createCommercialComprehensiveScreen(),
    PSVThirdPartyQuotationFlowScreen: ScreenCreators.createPSVThirdPartyScreen(),
    PSVComprehensiveQuotationFlowScreen: ScreenCreators.createPSVComprehensiveScreen(),
    MotorcycleQuotationFlowScreen: ScreenCreators.createMotorcycleScreen(),
    
    // Custom configurations
    TukTukScreen: createAdvancedInsuranceScreen({
      formType: 'TUKTUK',
      stepConfigs: [
        {
          id: 'vehicle_info',
          title: 'TukTuk Information',
          stepTemplate: 'VEHICLE_INFO',
          fieldOverrides: {
            body_type: { defaultValue: 'TukTuk', options: ['TukTuk'] }
          }
        },
        {
          id: 'client_info',
          stepTemplate: 'CLIENT_INFO'
        },
        {
          id: 'commercial_info',
          stepTemplate: 'COMMERCIAL_DOCS'
        },
        {
          id: 'insurance_info',
          stepTemplate: 'INSURANCE_INFO'
        }
      ]
    }, {
      screenTitle: 'TukTuk Insurance',
      headerStyle: { backgroundColor: '#E67E22' }
    }),
    
    TractorScreen: createAdvancedInsuranceScreen({
      formType: 'TRACTOR',
      stepConfigs: [
        {
          id: 'vehicle_info',
          title: 'Tractor Information',
          stepTemplate: 'VEHICLE_INFO',
          fieldOverrides: {
            body_type: { defaultValue: 'Tractor', options: ['Tractor'] }
          }
        },
        {
          id: 'client_info',
          stepTemplate: 'CLIENT_INFO'
        },
        {
          id: 'insurance_info',
          stepTemplate: 'INSURANCE_INFO'
        }
      ]
    }, {
      screenTitle: 'Tractor Insurance',
      headerStyle: { backgroundColor: '#27AE60' }
    })
  };
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#D5222B',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center'
  }
});

export default {
  createInsuranceScreen,
  createAdvancedInsuranceScreen,
  ScreenCreators,
  generateMultipleScreens,
  createNavigationScreens
};