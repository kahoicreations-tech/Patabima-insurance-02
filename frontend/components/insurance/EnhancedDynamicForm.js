/**
 * Enhanced Dynamic Form with Service Integrations
 * 
 * Extended form engine that integrates with DMVIC, Textract, and real-time pricing
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import FormField from './FormField';
import ProgressBar from './ProgressBar';
import ServiceComponents from './ServiceComponents';
import { SimulationServices } from './services/SimulationServices';

const EnhancedDynamicForm = ({ 
  config, 
  onSubmit, 
  initialData = {},
  navigation,
  onServiceUpdate = () => {} 
}) => {
  const [formData, setFormData] = useState(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Service states
  const [dmvicResults, setDmvicResults] = useState({});
  const [textractResults, setTextractResults] = useState({});
  const [livePrice, setLivePrice] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});

  // Get current step configuration
  const currentStepConfig = useMemo(() => config.steps[currentStep], [config, currentStep]);
  
  // Get step integrations
  const stepIntegrations = useMemo(() => 
    currentStepConfig?.integrations || {}, 
    [currentStepConfig]
  );

  // DMVIC Integration Functions
  const handleDMVICCheck = useCallback(async (vehicleRegistration) => {
    if (!vehicleRegistration || !config.integrations?.dmvic?.enabled) return;
    
    try {
      setProcessingStatus(prev => ({ ...prev, dmvic: 'checking' }));
      
      const policyCheck = await SimulationServices.DMVICService.checkExistingPolicy(vehicleRegistration);
      const vehicleDetails = await SimulationServices.DMVICService.getVehicleDetails(vehicleRegistration);
      
      const results = { policyCheck, vehicleDetails };
      setDmvicResults(results);
      
      // Auto-fill form data if enabled
      if (stepIntegrations.dmvic?.autoFetchVehicleDetails && vehicleDetails.success) {
        setFormData(prev => ({
          ...prev,
          vehicle_make: vehicleDetails.data.make,
          vehicle_model: vehicleDetails.data.model,
          vehicle_year: vehicleDetails.data.year,
          owner_name: vehicleDetails.data.ownerName
        }));
      }
      
      // Suggest cover start date if policy exists
      if (policyCheck.hasExisting && policyCheck.policy?.expiryDate) {
        const suggestedDate = new Date(policyCheck.policy.expiryDate);
        suggestedDate.setDate(suggestedDate.getDate() + 1);
        
        setFormData(prev => ({
          ...prev,
          suggested_cover_start_date: suggestedDate.toISOString().split('T')[0]
        }));
      }
      
      setProcessingStatus(prev => ({ ...prev, dmvic: 'completed' }));
      onServiceUpdate('dmvic', results);
      
    } catch (error) {
      console.error('DMVIC check failed:', error);
      setProcessingStatus(prev => ({ ...prev, dmvic: 'error' }));
    }
  }, [config.integrations, stepIntegrations, onServiceUpdate]);

  // Textract Integration Functions
  const handleDocumentUpload = useCallback(async (file, extractionType) => {
    if (!config.integrations?.textract?.enabled) return;
    
    try {
      setProcessingStatus(prev => ({ 
        ...prev, 
        textract: { ...prev.textract, [extractionType]: 'processing' }
      }));
      
      const extractResult = await SimulationServices.TextractService.extractDocumentData(
        file, 
        extractionType
      );
      
      if (extractResult.success) {
        const validationResult = await SimulationServices.TextractService.validateExtractedData(
          extractResult.data,
          formData
        );
        
        const results = { extractResult, validationResult };
        setTextractResults(prev => ({
          ...prev,
          [extractionType]: results
        }));
        
        // Auto-fill form if validation passes
        if (validationResult.valid && stepIntegrations.textract?.autoFillFields) {
          setFormData(prev => ({
            ...prev,
            ...extractResult.data
          }));
        }
        
        setProcessingStatus(prev => ({ 
          ...prev, 
          textract: { ...prev.textract, [extractionType]: 'completed' }
        }));
        
        onServiceUpdate('textract', { [extractionType]: results });
      }
      
    } catch (error) {
      console.error('Document processing failed:', error);
      setProcessingStatus(prev => ({ 
        ...prev, 
        textract: { ...prev.textract, [extractionType]: 'error' }
      }));
    }
  }, [config.integrations, stepIntegrations, formData, onServiceUpdate]);

  // Real-time Pricing Functions
  const updateLivePricing = useCallback(async (formData) => {
    if (!config.integrations?.realTimePricing?.enabled) return;
    
    const pricingFields = config.integrations.realTimePricing.updateOnFieldChange;
    const hasRequiredFields = pricingFields.some(field => formData[field]);
    
    if (!hasRequiredFields) return;
    
    try {
      setProcessingStatus(prev => ({ ...prev, pricing: 'calculating' }));
      
      const pricingResult = await SimulationServices.UnderwriterService.calculatePremium(formData);
      
      if (pricingResult.success) {
        setLivePrice(pricingResult.data);
        setProcessingStatus(prev => ({ ...prev, pricing: 'completed' }));
        onServiceUpdate('pricing', pricingResult.data);
      }
      
    } catch (error) {
      console.error('Pricing update failed:', error);
      setProcessingStatus(prev => ({ ...prev, pricing: 'error' }));
    }
  }, [config.integrations, onServiceUpdate]);

  // Handle field value changes
  const handleFieldChange = useCallback((fieldId, value) => {
    const newFormData = { ...formData, [fieldId]: value };
    setFormData(newFormData);
    
    // Clear field error
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
    
    // Trigger service integrations
    if (fieldId === 'vehicle_registration' && stepIntegrations.dmvic?.triggerFields?.includes(fieldId)) {
      handleDMVICCheck(value);
    }
    
    // Update live pricing
    if (config.integrations?.realTimePricing?.updateOnFieldChange?.includes(fieldId)) {
      const debounceTimer = setTimeout(() => {
        updateLivePricing(newFormData);
      }, config.serviceConfigs?.pricing?.updateDebounce || 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [formData, errors, stepIntegrations, handleDMVICCheck, updateLivePricing, config]);

  // Handle file uploads
  const handleFileUpload = useCallback((fieldId, file) => {
    const fieldConfig = config.fieldDefinitions[fieldId];
    if (fieldConfig?.textractProcessing) {
      handleDocumentUpload(file, fieldConfig.extractionType);
    }
  }, [config, handleDocumentUpload]);

  // Validate current step
  const validateStep = useCallback(() => {
    const stepErrors = {};
    const requiredFields = currentStepConfig.fields.filter(fieldId => {
      const fieldDef = config.fieldDefinitions[fieldId];
      return fieldDef?.required;
    });
    
    requiredFields.forEach(fieldId => {
      if (!formData[fieldId]) {
        stepErrors[fieldId] = 'This field is required';
      }
    });
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [currentStepConfig, config, formData]);

  // Navigate to next step
  const handleNext = useCallback(async () => {
    if (!validateStep()) return;
    
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleSubmit();
    }
  }, [currentStep, config.steps.length, validateStep]);

  // Navigate to previous step
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    
    try {
      const submissionData = {
        formData,
        serviceResults: {
          dmvic: dmvicResults,
          textract: textractResults,
          pricing: livePrice
        },
        metadata: {
          formType: config.formType,
          completedSteps: config.steps.length,
          submissionTime: new Date().toISOString()
        }
      };
      
      await onSubmit(submissionData);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, dmvicResults, textractResults, livePrice, config, onSubmit]);

  // Render service components
  const renderServiceComponent = useCallback((fieldId, fieldConfig) => {
    const componentType = fieldConfig.component;
    const serviceProps = {
      formData,
      dmvicResults,
      textractResults,
      livePrice,
      processingStatus,
      onFieldChange: handleFieldChange,
      onFileUpload: handleFileUpload
    };
    
    return (
      <ServiceComponents
        type={componentType}
        fieldId={fieldId}
        config={fieldConfig}
        {...serviceProps}
      />
    );
  }, [formData, dmvicResults, textractResults, livePrice, processingStatus, handleFieldChange, handleFileUpload]);

  // Render form fields
  const renderFormFields = useMemo(() => {
    return currentStepConfig.fields.map(fieldId => {
      const fieldConfig = config.fieldDefinitions[fieldId];
      if (!fieldConfig) return null;
      
      // Render service components
      if (fieldConfig.type === 'COMPONENT' || fieldConfig.type === 'DISPLAY') {
        return (
          <View key={fieldId} style={styles.fieldContainer}>
            {renderServiceComponent(fieldId, fieldConfig)}
          </View>
        );
      }
      
      // Render regular form fields
      return (
        <View key={fieldId} style={styles.fieldContainer}>
          <FormField
            fieldId={fieldId}
            config={fieldConfig}
            value={formData[fieldId]}
            onValueChange={handleFieldChange}
            onFileUpload={handleFileUpload}
            error={errors[fieldId]}
            formData={formData}
          />
        </View>
      );
    });
  }, [currentStepConfig, config, formData, errors, handleFieldChange, handleFileUpload, renderServiceComponent]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.description}>{config.description}</Text>
        
        <ProgressBar
          currentStep={currentStepConfig.stepNumber}
          totalSteps={currentStepConfig.totalSteps}
          stepTitle={currentStepConfig.title}
        />
      </View>

      {/* Form Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{currentStepConfig.title}</Text>
          <Text style={styles.stepDescription}>{currentStepConfig.description}</Text>
          
          {renderFormFields}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton]}
            onPress={handlePrev}
            disabled={loading}
          >
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === config.steps.length - 1 ? 'Submit' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D5222B',
    marginBottom: 8
  },
  description: {
    fontSize: 16,
    color: '#646767',
    marginBottom: 20
  },
  content: {
    flex: 1,
    padding: 20
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8
  },
  stepDescription: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 20
  },
  fieldContainer: {
    marginBottom: 20
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF'
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center'
  },
  prevButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6'
  },
  nextButton: {
    backgroundColor: '#D5222B'
  },
  prevButtonText: {
    color: '#646767',
    fontSize: 16,
    fontWeight: '600'
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default EnhancedDynamicForm;