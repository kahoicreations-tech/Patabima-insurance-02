/**
 * Dynamic Insurance Form with Background Service Integration
 * 
 * Universal form component with DMVIC, Textract, and pricing services running in background
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { FIELD_LIBRARY } from './FieldLibrary';
import FormField from './FormField';
import ProgressBar from './ProgressBar';
import enhancedServices from './services/EnhancedServices';

const DynamicInsuranceForm = ({ config, navigation, route, ...options }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [calculatedValues, setCalculatedValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Background service states (hidden from UI)
  const [serviceData, setServiceData] = useState({
    dmvic: null,
    textract: {},
    pricing: null,
    processing: {}
  });
  
  const currentStep = config.steps[currentStepIndex];
  const isLastStep = currentStepIndex === config.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Background DMVIC integration
  const runDMVICCheck = useCallback(async (vehicleRegistration) => {
    if (!options.dmvicIntegration || !vehicleRegistration) return;
    
    try {
      setServiceData(prev => ({ 
        ...prev, 
        processing: { ...prev.processing, dmvic: true }
      }));
      
      const [policyCheck, vehicleDetails] = await Promise.all([
        enhancedServices.DMVICService.checkExistingPolicy(vehicleRegistration),
        enhancedServices.DMVICService.getVehicleDetails(vehicleRegistration)
      ]);
      
      const dmvicData = { policyCheck, vehicleDetails };
      setServiceData(prev => ({ 
        ...prev, 
        dmvic: dmvicData,
        processing: { ...prev.processing, dmvic: false }
      }));
      
      // Auto-populate vehicle details if available
      if (vehicleDetails.success) {
        setFormData(prev => ({
          ...prev,
          vehicle_make: vehicleDetails.data.make,
          vehicle_model: vehicleDetails.data.model,
          vehicle_year: vehicleDetails.data.year,
        }));
      }
      
      // Show policy overlap warning if needed
      if (policyCheck.hasExisting) {
        console.log('DMVIC: Existing policy found', policyCheck.policy);
      }
      
    } catch (error) {
      console.error('DMVIC integration error:', error);
      setServiceData(prev => ({ 
        ...prev, 
        processing: { ...prev.processing, dmvic: false }
      }));
    }
  }, [options.dmvicIntegration]);

  // Background Textract integration
  const runTextractProcessing = useCallback(async (file, documentType) => {
    if (!options.textractIntegration || !file) return;
    
    try {
      setServiceData(prev => ({ 
        ...prev, 
        processing: { 
          ...prev.processing, 
          textract: { ...prev.processing.textract, [documentType]: true }
        }
      }));
      
      const extractResult = await enhancedServices.TextractService.extractDocumentData(file, documentType);
      const validationResult = await enhancedServices.TextractService.validateExtractedData(
        extractResult.data, 
        formData
      );
      
      setServiceData(prev => ({ 
        ...prev, 
        textract: {
          ...prev.textract,
          [documentType]: { extractResult, validationResult }
        },
        processing: { 
          ...prev.processing, 
          textract: { ...prev.processing.textract, [documentType]: false }
        }
      }));
      
      // Auto-fill extracted data if validation passes
      if (validationResult.valid && extractResult.success) {
        setFormData(prev => ({
          ...prev,
          ...extractResult.data
        }));
      }
      
    } catch (error) {
      console.error('Textract integration error:', error);
      setServiceData(prev => ({ 
        ...prev, 
        processing: { 
          ...prev.processing, 
          textract: { ...prev.processing.textract, [documentType]: false }
        }
      }));
    }
  }, [options.textractIntegration, formData]);

  // Background pricing updates
  const updateLivePricing = useCallback(async (currentFormData) => {
    if (!options.liveUpdates) return;
    
    const hasRequiredData = currentFormData.vehicle_make && 
                           currentFormData.vehicle_model && 
                           currentFormData.insurance_provider;
    
    if (!hasRequiredData) return;
    
    try {
      setServiceData(prev => ({ 
        ...prev, 
        processing: { ...prev.processing, pricing: true }
      }));
      
      const pricingResult = await enhancedServices.UnderwriterService.calculatePremium(currentFormData);
      
      if (pricingResult.success) {
        setServiceData(prev => ({ 
          ...prev, 
          pricing: pricingResult.data,
          processing: { ...prev.processing, pricing: false }
        }));
      }
      
    } catch (error) {
      console.error('Live pricing error:', error);
      setServiceData(prev => ({ 
        ...prev, 
        processing: { ...prev.processing, pricing: false }
      }));
    }
  }, [options.liveUpdates]);

  // Calculate dynamic values when form data changes
  useEffect(() => {
    if (config.calculations) {
      const newCalculatedValues = {};
      
      // Use live pricing if available, otherwise use config calculations
      if (serviceData.pricing && options.liveUpdates) {
        newCalculatedValues.premium_breakdown = {
          basePremium: serviceData.pricing.basePremium,
          trainingLevy: serviceData.pricing.trainingLevy,
          pcfLevy: serviceData.pricing.pcfLevy,
          stampDuty: serviceData.pricing.stampDuty,
          total: serviceData.pricing.totalPremium
        };
        newCalculatedValues.training_levy = serviceData.pricing.trainingLevy;
        newCalculatedValues.pcf_levy = serviceData.pricing.pcfLevy;
        newCalculatedValues.policy_stamp_duty = serviceData.pricing.stampDuty;
        newCalculatedValues.total_amount_payable = serviceData.pricing.totalPremium;
        newCalculatedValues.amount_to_pay = serviceData.pricing.totalPremium;
      } else if (config.calculations.calculatePremium && formData.insurance_provider) {
        const premiumData = config.calculations.calculatePremium(formData);
        newCalculatedValues.premium_breakdown = premiumData;
        newCalculatedValues.training_levy = premiumData.trainingLevy;
        newCalculatedValues.policy_stamp_duty = premiumData.stampDuty;
        newCalculatedValues.total_amount_payable = premiumData.total;
        newCalculatedValues.amount_to_pay = premiumData.total;
      }
      
      // Calculate display values
      if (config.calculations.insurance_type_display) {
        newCalculatedValues.insurance_type_display = config.calculations.insurance_type_display();
      }
      
      if (config.calculations.policy_type_display) {
        newCalculatedValues.policy_type_display = config.calculations.policy_type_display();
      }
      
      // Auto-generate values
      if (!newCalculatedValues.transaction_reference) {
        newCalculatedValues.transaction_reference = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      }
      
      setCalculatedValues(newCalculatedValues);
    }
  }, [formData, config.calculations, serviceData.pricing, options.liveUpdates]);

  // Trigger background services when relevant fields change
  useEffect(() => {
    // DMVIC check when vehicle registration is entered
    if (formData.vehicle_registration && options.dmvicIntegration) {
      const debounceTimer = setTimeout(() => {
        runDMVICCheck(formData.vehicle_registration);
      }, 1000); // Debounce to avoid too many API calls
      
      return () => clearTimeout(debounceTimer);
    }
  }, [formData.vehicle_registration, runDMVICCheck, options.dmvicIntegration]);

  // Live pricing updates when pricing-relevant fields change
  useEffect(() => {
    if (options.liveUpdates) {
      const debounceTimer = setTimeout(() => {
        updateLivePricing(formData);
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [formData.vehicle_make, formData.vehicle_model, formData.insurance_provider, updateLivePricing, options.liveUpdates]);

  const updateFieldValue = (fieldName, value) => {
    const newFormData = {
      ...formData,
      [fieldName]: value
    };
    
    setFormData(newFormData);
    
    // Trigger background services based on field changes
    if (fieldName === 'vehicle_registration' && value && options.dmvicIntegration) {
      // DMVIC check will be triggered by useEffect above
    }
  };

  // Enhanced file upload handler for Textract
  const handleFileUpload = (fieldName, file) => {
    // Regular file handling
    updateFieldValue(fieldName, file);
    
    // Background Textract processing
    if (options.textractIntegration && file) {
      let documentType = 'general';
      
      // Determine document type based on field name
      if (fieldName.includes('logbook')) documentType = 'logbook';
      else if (fieldName.includes('national_id')) documentType = 'nationalId';
      else if (fieldName.includes('kra')) documentType = 'kraPin';
      
      runTextractProcessing(file, documentType);
    }
  };

  const validateCurrentStep = () => {
    const stepFields = currentStep.fields;
    const missingFields = [];
    
    stepFields.forEach(fieldName => {
      const fieldConfig = FIELD_LIBRARY[fieldName];
      const value = formData[fieldName] || calculatedValues[fieldName];
      
      if (fieldConfig?.required && (!value || value === '')) {
        missingFields.push(fieldConfig.label);
      }
    });
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please complete the following fields:\n• ${missingFields.join('\n• ')}`,
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (isLastStep) {
        handleSubmit();
      } else {
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        ...formData,
        ...calculatedValues,
        // Format dates properly
        cover_start_date: formData.cover_start_date || new Date().toISOString().split('T')[0],
        cover_end_date: formData.cover_end_date || 
          new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      };
      
      // Include background service data
      const serviceDataForSubmission = {
        dmvic: serviceData.dmvic,
        textract: serviceData.textract,
        pricing: serviceData.pricing,
      };
      
      console.log('Submitting form data:', submissionData);
      
      // Use Enhanced Services to submit form data
      const { default: enhancedServices } = await import('./services/EnhancedServices');
      const response = await enhancedServices.submitMotorInsuranceForm(
        submissionData, 
        serviceDataForSubmission
      );
      
      setIsSubmitting(false);
      
      if (response.success) {
        Alert.alert(
          'Success!',
          `Insurance quotation submitted successfully!\nQuotation Number: ${response.quotationNumber || response.quotationId}`,
          [
            {
              text: 'View Receipt',
              onPress: () => showReceipt(response)
            },
            {
              text: 'Go Home',
              onPress: () => navigation.navigate('Dashboard')
            }
          ]
        );
      } else {
        Alert.alert(
          'Submission Failed',
          response.message || 'Failed to submit quotation',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert(
        'Submission Error',
        'There was an error submitting your application. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const showReceipt = (responseData = null) => {
    // Show success alert and go back to dashboard for now
    Alert.alert(
      'Success!',
      `Your quotation has been submitted successfully!\n\nQuotation ID: ${responseData?.quotationId || 'N/A'}\nSource: ${responseData?.source || 'Unknown'}`,
      [
        {
          text: 'Back to Dashboard',
          onPress: () => navigation.navigate('Dashboard')
        }
      ]
    );
  };

  const renderField = (fieldName) => {
    const fieldConfig = FIELD_LIBRARY[fieldName];
    const value = formData[fieldName] || calculatedValues[fieldName];
    
    return (
      <FormField
        key={fieldName}
        name={fieldName}
        config={fieldConfig}
        value={value}
        onValueChange={(newValue) => updateFieldValue(fieldName, newValue)}
        onFileUpload={(file) => handleFileUpload(fieldName, file)}
        formData={formData}
        calculatedValues={calculatedValues}
        isReadOnly={currentStep.isReadOnly}
        // Pass service status for subtle UI hints (optional)
        serviceHints={{
          dmvicProcessing: serviceData.processing.dmvic,
          textractProcessing: serviceData.processing.textract?.[fieldName.includes('logbook') ? 'logbook' : fieldName.includes('national_id') ? 'nationalId' : 'kraPin'],
          pricingActive: serviceData.processing.pricing
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.formTitle}>{config.title}</Text>
        <Text style={styles.stepTitle}>{currentStep.title}</Text>
        <Text style={styles.stepDescription}>{currentStep.description}</Text>
      </View>

      {/* Progress Bar */}
      {config.ui?.showProgressBar && (
        <ProgressBar
          currentStep={currentStepIndex + 1}
          totalSteps={config.steps.length}
          showStepNumbers={config.ui?.showStepNumbers}
        />
      )}

      {/* Form Content */}
      <ScrollView style={styles.content}>
        <View style={styles.fieldsContainer}>
          {currentStep.fields.map(fieldName => renderField(fieldName))}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {!isFirstStep && config.ui?.allowBackNavigation && (
          <TouchableOpacity 
            style={[styles.button, styles.backButton]} 
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.nextButton]} 
          onPress={handleNext}
          disabled={isSubmitting}
        >
          <Text style={styles.nextButtonText}>
            {isSubmitting ? 'Submitting...' : isLastStep ? 'Submit' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#D5222B',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  stepTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  fieldsContainer: {
    paddingVertical: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  nextButton: {
    backgroundColor: '#D5222B',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DynamicInsuranceForm;