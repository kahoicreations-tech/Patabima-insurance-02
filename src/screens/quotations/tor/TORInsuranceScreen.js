/**
 * TOR Insurance Quotation Screen
 * 
 * Specialized screen for TOR (Third Party Only Risk) insurance
 * Features document upload, validation, and premium calculation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../../constants';
import TORDocumentUpload from '../../../components/TORDocumentUpload';
import { TOR_UNDERWRITERS, calculateTORPremium } from '../../../data/torMotorData';

// Import shared motor insurance components
import { 
  VehicleDetailsForm, 
  PremiumCalculator 
} from '../motor/components';

const TORInsuranceScreen = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Vehicle Owner Information
    ownerName: '',
    ownerIdNumber: '',
    ownerPhone: '',
    ownerEmail: '',
    
    // Vehicle Information
    vehicleRegistrationNumber: '',
    makeModel: '',
    yearOfManufacture: '',
    vehicleEngineCapacity: '',
    vehicleValue: '',
    
    // Insurance Details
    insuranceDuration: '12',
    startDate: new Date(),
    preferredInsurer: '',
    usageType: 'private',
    
    // Driver Information
    driverAge: '30',
    driverExperience: '5+',
    
    // Documents
    documents: [],
    
    // Additional Information
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRelationship: '',
  });
  
  const [errors, setErrors] = useState({});
  const [calculatedPremium, setCalculatedPremium] = useState(null);
  const [selectedUnderwriter, setSelectedUnderwriter] = useState(null);
  
  // Steps configuration
  const steps = [
    { id: 1, title: 'Vehicle Owner Details' },
    { id: 2, title: 'Vehicle Information' },
    { id: 3, title: 'TOR Documents' },
    { id: 4, title: 'Premium & Payment' },
    { id: 5, title: 'Confirmation' }
  ];
  
  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if exists
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };
  
  // Validate the current step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.ownerName?.trim()) newErrors.ownerName = 'Owner name is required';
        if (!formData.ownerIdNumber?.trim()) newErrors.ownerIdNumber = 'ID number is required';
        if (!formData.ownerPhone?.trim()) newErrors.ownerPhone = 'Phone number is required';
        if (formData.ownerPhone && !/^(0|\+254|254)7\d{8}$/.test(formData.ownerPhone)) {
          newErrors.ownerPhone = 'Enter a valid Kenyan mobile number';
        }
        if (formData.ownerEmail && !/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
          newErrors.ownerEmail = 'Enter a valid email address';
        }
        break;
      
      case 2:
        if (!formData.vehicleRegistrationNumber?.trim()) {
          newErrors.vehicleRegistrationNumber = 'Registration number is required';
        } else if (!/^K[A-Z]{2,3}\s?\d{3}[A-Z]$/.test(formData.vehicleRegistrationNumber)) {
          newErrors.vehicleRegistrationNumber = 'Invalid registration format (e.g. KAA 123A)';
        }
        if (!formData.makeModel?.trim()) newErrors.makeModel = 'Make & model is required';
        if (!formData.yearOfManufacture?.trim()) {
          newErrors.yearOfManufacture = 'Year is required';
        } else if (!/^\d{4}$/.test(formData.yearOfManufacture)) {
          newErrors.yearOfManufacture = 'Enter a valid 4-digit year';
        } else {
          const year = parseInt(formData.yearOfManufacture);
          const currentYear = new Date().getFullYear();
          if (year < 1950 || year > currentYear + 1) {
            newErrors.yearOfManufacture = `Year must be between 1950 and ${currentYear + 1}`;
          }
        }
        if (!formData.vehicleEngineCapacity?.trim()) {
          newErrors.vehicleEngineCapacity = 'Engine capacity is required';
        } else if (!/^\d+$/.test(formData.vehicleEngineCapacity)) {
          newErrors.vehicleEngineCapacity = 'Enter a valid engine capacity in cc';
        }
        if (!formData.vehicleValue?.trim()) {
          newErrors.vehicleValue = 'Vehicle value is required';
        } else if (!/^\d+$/.test(formData.vehicleValue)) {
          newErrors.vehicleValue = 'Enter a valid amount';
        } else if (parseInt(formData.vehicleValue) < 100000) {
          newErrors.vehicleValue = 'Value must be at least KES 100,000';
        }
        if (!formData.insuranceDuration) newErrors.insuranceDuration = 'Duration is required';
        if (!formData.preferredInsurer) newErrors.preferredInsurer = 'Insurer selection is required';
        if (!formData.usageType) newErrors.usageType = 'Usage type is required';
        break;
      
      case 3:
        // Document validation - check if required documents are uploaded
        const requiredDocIds = ['national_id', 'driving_license', 'logbook'];
        const uploadedDocIds = formData.documents.map(doc => doc.type);
        
        requiredDocIds.forEach(docId => {
          if (!uploadedDocIds.includes(docId)) {
            newErrors.documents = newErrors.documents || 'Required documents missing';
          }
        });
        
        // Check for validation errors in uploaded documents
        const docsWithErrors = formData.documents.filter(
          doc => doc.validation && !doc.validation.isValid
        );
        
        if (docsWithErrors.length > 0) {
          newErrors.documentValidation = 'Some documents have validation issues';
        }
        break;
      
      case 4:
        if (!calculatedPremium) newErrors.premium = 'Premium calculation required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Navigate to next step
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      // Show validation error
      Alert.alert(
        'Validation Error',
        'Please correct the highlighted fields before proceeding.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  // Handle document processed event
  const handleDocumentProcessed = (docType, extractedData) => {
    // Update form data if needed based on extracted document data
    if (docType === 'national_id' && extractedData.fullName && !formData.ownerName) {
      updateFormData('ownerName', extractedData.fullName);
    }
    
    if (docType === 'national_id' && extractedData.idNumber && !formData.ownerIdNumber) {
      updateFormData('ownerIdNumber', extractedData.idNumber);
    }
    
    if (docType === 'logbook' && extractedData.registrationNumber && !formData.vehicleRegistrationNumber) {
      updateFormData('vehicleRegistrationNumber', extractedData.registrationNumber);
    }
    
    if (docType === 'logbook' && extractedData.makeModel && !formData.makeModel) {
      updateFormData('makeModel', extractedData.makeModel);
    }
    
    if (docType === 'logbook' && extractedData.yearOfManufacture && !formData.yearOfManufacture) {
      updateFormData('yearOfManufacture', extractedData.yearOfManufacture);
    }
    
    if (docType === 'logbook' && extractedData.engineCapacity && !formData.vehicleEngineCapacity) {
      updateFormData('vehicleEngineCapacity', extractedData.engineCapacity);
    }
  };
  
  // Calculate TOR premium
  const calculatePremium = useCallback(() => {
    if (!formData.vehicleValue || !formData.preferredInsurer) {
      Alert.alert('Missing Information', 'Vehicle value and insurer are required to calculate premium');
      return;
    }
    
    setIsLoading(true);
    
    // Use selected underwriter
    const selectedUw = TOR_UNDERWRITERS.find(u => u.id === formData.preferredInsurer);
    setSelectedUnderwriter(selectedUw);
    
    try {
      // Calculate premium based on TOR data
      const vehicleValue = parseInt(formData.vehicleValue);
      const vehicleAge = new Date().getFullYear() - parseInt(formData.yearOfManufacture);
      const engineCapacity = parseInt(formData.vehicleEngineCapacity);
      
      const premium = calculateTORPremium(vehicleValue, formData.preferredInsurer, {
        vehicleAge,
        engineCapacity,
        usageType: formData.usageType,
        driverAge: parseInt(formData.driverAge || '30')
      });
      
      setCalculatedPremium(premium);
      
    } catch (error) {
      console.error('Premium calculation error:', error);
      Alert.alert('Calculation Error', 'Failed to calculate premium. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData.vehicleValue, formData.preferredInsurer, formData.yearOfManufacture, 
      formData.vehicleEngineCapacity, formData.usageType, formData.driverAge]);
  
  // Effect to calculate premium when step 4 is reached
  useEffect(() => {
    if (currentStep === 4 && formData.preferredInsurer && !calculatedPremium) {
      calculatePremium();
    }
  }, [currentStep, formData.preferredInsurer, calculatedPremium, calculatePremium]);
  
  // Process payment and generate policy
  const processPayment = async () => {
    if (!calculatedPremium) {
      Alert.alert('Error', 'Premium calculation is required before payment');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Generate policy number
      const policyNumber = `TOR${Date.now().toString().slice(-10)}`;
      
      // Generate policy effective date
      const effectiveDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + parseInt(formData.insuranceDuration));
      
      // Update form with policy details
      updateFormData('policyNumber', policyNumber);
      updateFormData('effectiveDate', effectiveDate.toISOString());
      updateFormData('expiryDate', expiryDate.toISOString());
      updateFormData('paymentStatus', 'PAID');
      
      // Navigate to success step
      setCurrentStep(5);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert(
        'Payment Failed',
        'Failed to process payment. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Share policy
  const sharePolicy = () => {
    Alert.alert(
      'Share Policy',
      'This feature would allow sharing the policy via email or WhatsApp',
      [{ text: 'OK' }]
    );
  };
  
  // Fill test data (for development)
  const fillTestData = () => {
    setFormData({
      ownerName: 'John Kamau Mwangi',
      ownerIdNumber: '12345678',
      ownerPhone: '0712345678',
      ownerEmail: 'john.kamau@example.com',
      vehicleRegistrationNumber: 'KCA 123A',
      makeModel: 'Toyota Corolla',
      yearOfManufacture: '2020',
      vehicleEngineCapacity: '1500',
      vehicleValue: '2000000',
      insuranceDuration: '12',
      startDate: new Date(),
      preferredInsurer: 'madison_tor',
      usageType: 'private',
      driverAge: '30',
      driverExperience: '5+',
      documents: [],
      nextOfKinName: 'Mary Wanjiku',
      nextOfKinPhone: '0723456789',
      nextOfKinRelationship: 'Spouse'
    });
  };
  
  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepperContainer}>
      {steps.map(step => (
        <View key={step.id} style={styles.stepWrapper}>
          <TouchableOpacity 
            style={[
              styles.stepIndicator, 
              currentStep >= step.id && styles.activeStep
            ]}
            onPress={() => setCurrentStep(step.id)}
            disabled={step.id > currentStep}
          >
            <Text style={[
              styles.stepNumber,
              currentStep >= step.id && styles.activeStepNumber
            ]}>
              {step.id}
            </Text>
          </TouchableOpacity>
          <Text style={[
            styles.stepTitle,
            currentStep === step.id && styles.activeStepTitle
          ]}>
            {step.title}
          </Text>
        </View>
      ))}
      
      <View style={styles.stepperLine} />
    </View>
  );
  
  // Render vehicle owner details step
  const renderVehicleOwnerStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepHeading}>Vehicle Owner Details</Text>
      <Text style={styles.stepDescription}>
        Provide details of the vehicle owner for TOR insurance
      </Text>
      
      <VehicleDetailsForm
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
      />
    </View>
  );
  
  // Render vehicle information step
  const renderVehicleInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepHeading}>Vehicle Information</Text>
      <Text style={styles.stepDescription}>
        Provide details about your vehicle and select TOR insurance options
      </Text>
      
      <View style={styles.formCard}>
        {/* Registration Number */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Vehicle Registration Number</Text>
          <View style={[styles.inputContainer, errors.vehicleRegistrationNumber && styles.inputError]}>
            <Ionicons name="car-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.vehicleRegistrationNumber}
              onChangeText={(text) => updateFormData('vehicleRegistrationNumber', text.toUpperCase())}
              placeholder="e.g., KCA 123A"
              autoCapitalize="characters"
              maxLength={8}
            />
          </View>
          {errors.vehicleRegistrationNumber && (
            <Text style={styles.errorText}>{errors.vehicleRegistrationNumber}</Text>
          )}
        </View>
        
        {/* Make & Model */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Make & Model</Text>
          <View style={[styles.inputContainer, errors.makeModel && styles.inputError]}>
            <Ionicons name="car-sport-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.makeModel}
              onChangeText={(text) => updateFormData('makeModel', text)}
              placeholder="e.g., Toyota Corolla"
            />
          </View>
          {errors.makeModel && (
            <Text style={styles.errorText}>{errors.makeModel}</Text>
          )}
        </View>
        
        {/* Year of Manufacture */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Year of Manufacture</Text>
          <View style={[styles.inputContainer, errors.yearOfManufacture && styles.inputError]}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.yearOfManufacture}
              onChangeText={(text) => updateFormData('yearOfManufacture', text)}
              placeholder="e.g., 2020"
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
          {errors.yearOfManufacture && (
            <Text style={styles.errorText}>{errors.yearOfManufacture}</Text>
          )}
        </View>
        
        {/* Engine Capacity */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Engine Capacity (cc)</Text>
          <View style={[styles.inputContainer, errors.vehicleEngineCapacity && styles.inputError]}>
            <Ionicons name="speedometer-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.vehicleEngineCapacity}
              onChangeText={(text) => updateFormData('vehicleEngineCapacity', text)}
              placeholder="e.g., 1500"
              keyboardType="number-pad"
            />
          </View>
          {errors.vehicleEngineCapacity && (
            <Text style={styles.errorText}>{errors.vehicleEngineCapacity}</Text>
          )}
        </View>
        
        {/* Vehicle Value */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Vehicle Value (KES)</Text>
          <View style={[styles.inputContainer, errors.vehicleValue && styles.inputError]}>
            <Ionicons name="cash-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.vehicleValue}
              onChangeText={(text) => updateFormData('vehicleValue', text)}
              placeholder="e.g., 2000000"
              keyboardType="number-pad"
            />
          </View>
          {errors.vehicleValue && (
            <Text style={styles.errorText}>{errors.vehicleValue}</Text>
          )}
        </View>
        
        {/* Select TOR Provider */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>TOR Insurance Provider</Text>
          <View style={styles.insurerContainer}>
            {TOR_UNDERWRITERS.map(underwriter => (
              <TouchableOpacity
                key={underwriter.id}
                style={[
                  styles.insurerCard,
                  formData.preferredInsurer === underwriter.id && styles.selectedInsurerCard
                ]}
                onPress={() => updateFormData('preferredInsurer', underwriter.id)}
              >
                <Text style={styles.insurerName}>{underwriter.shortName}</Text>
                <Text style={styles.insurerRate}>{underwriter.torRates.privateVehicle}%</Text>
                <Text style={styles.insurerDescription}>{underwriter.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.preferredInsurer && (
            <Text style={styles.errorText}>{errors.preferredInsurer}</Text>
          )}
        </View>
      </View>
    </View>
  );
  
  // Render document upload step
  const renderDocumentsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepHeading}>TOR Insurance Documents</Text>
      <Text style={styles.stepDescription}>
        Upload required documents for your TOR insurance application
      </Text>
      
      <TORDocumentUpload
        documents={formData.documents}
        updateDocuments={(docs) => updateFormData('documents', docs)}
        errors={errors}
        formData={formData}
        onDocumentProcessed={handleDocumentProcessed}
      />
      
      {errors.documents && (
        <Text style={styles.errorSummary}>{errors.documents}</Text>
      )}
      
      {errors.documentValidation && (
        <Text style={styles.errorSummary}>{errors.documentValidation}</Text>
      )}
    </View>
  );
  
  // Render premium calculation and payment step
  const renderPremiumStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepHeading}>Premium Calculation & Payment</Text>
      <Text style={styles.stepDescription}>
        Review your TOR insurance premium breakdown and complete payment
      </Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Calculating your TOR premium...</Text>
        </View>
      ) : calculatedPremium ? (
        <View style={styles.premiumContainer}>
          <View style={styles.premiumCard}>
            <Text style={styles.premiumCardTitle}>TOR Premium Summary</Text>
            <Text style={styles.premiumCardSubtitle}>{selectedUnderwriter?.name || 'Insurance'}</Text>
            
            <View style={styles.premiumBreakdown}>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Basic Premium</Text>
                <Text style={styles.premiumValue}>KES {calculatedPremium.basicPremium.toLocaleString()}</Text>
              </View>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Training Levy</Text>
                <Text style={styles.premiumValue}>KES {calculatedPremium.trainingLevy.toLocaleString()}</Text>
              </View>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>PCF</Text>
                <Text style={styles.premiumValue}>KES {calculatedPremium.pcf.toLocaleString()}</Text>
              </View>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Stamp Duty</Text>
                <Text style={styles.premiumValue}>KES {calculatedPremium.stampDuty.toLocaleString()}</Text>
              </View>
              <View style={styles.premiumDivider} />
              <View style={styles.premiumRowTotal}>
                <Text style={styles.premiumLabelTotal}>Total Premium</Text>
                <Text style={styles.premiumValueTotal}>KES {calculatedPremium.totalPremium.toLocaleString()}</Text>
              </View>
            </View>
            
            <View style={styles.excessInfo}>
              <Ionicons name="information-circle" size={20} color={Colors.warning} />
              <Text style={styles.excessText}>
                TOR Excess: {selectedUnderwriter?.excessStructure.ownDamage.percentage}% (Minimum: KES {selectedUnderwriter?.excessStructure.ownDamage.minimum.toLocaleString()})
              </Text>
            </View>
          </View>
          
          <View style={styles.paymentOptions}>
            <Text style={styles.paymentTitle}>Payment Method</Text>
            <TouchableOpacity style={styles.mpesaButton} onPress={processPayment}>
              <Text style={styles.mpesaButtonText}>Pay with M-PESA</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.premiumError}>
          <Ionicons name="alert-circle" size={40} color={Colors.error} />
          <Text style={styles.premiumErrorText}>Failed to calculate premium</Text>
          <TouchableOpacity style={styles.retryButton} onPress={calculatePremium}>
            <Text style={styles.retryButtonText}>Retry Calculation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  // Render confirmation step
  const renderConfirmationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.confirmationCard}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
        </View>
        
        <Text style={styles.confirmationTitle}>TOR Insurance Purchased!</Text>
        <Text style={styles.confirmationSubtitle}>Your policy has been issued successfully</Text>
        
        <View style={styles.policyDetails}>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Policy Number:</Text>
            <Text style={styles.policyValue}>{formData.policyNumber}</Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Insurer:</Text>
            <Text style={styles.policyValue}>{selectedUnderwriter?.name}</Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Vehicle:</Text>
            <Text style={styles.policyValue}>
              {formData.makeModel} ({formData.vehicleRegistrationNumber})
            </Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Coverage:</Text>
            <Text style={styles.policyValue}>TOR Private Motor</Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Premium Paid:</Text>
            <Text style={styles.policyValue}>
              KES {calculatedPremium?.totalPremium.toLocaleString()}
            </Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Start Date:</Text>
            <Text style={styles.policyValue}>
              {new Date(formData.effectiveDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Expiry Date:</Text>
            <Text style={styles.policyValue}>
              {new Date(formData.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.confirmationActions}>
          <TouchableOpacity style={styles.shareButton} onPress={sharePolicy}>
            <Ionicons name="share-outline" size={20} color={Colors.white} />
            <Text style={styles.shareButtonText}>Share Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.doneButton} 
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  
  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderVehicleOwnerStep();
      case 2:
        return renderVehicleInfoStep();
      case 3:
        return renderDocumentsStep();
      case 4:
        return renderPremiumStep();
      case 5:
        return renderConfirmationStep();
      default:
        return null;
    }
  };
  
  // Render navigation buttons
  const renderNavigationButtons = () => {
    if (currentStep === 5) return null; // No navigation on confirmation
    
    return (
      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Ionicons name="arrow-back" size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 4 && (
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
        
        {/* Test data button (development only) */}
        {__DEV__ && (
          <TouchableOpacity style={styles.testButton} onPress={fillTestData}>
            <Text style={styles.testButtonText}>Fill Test Data</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backArrow} 
          onPress={() => navigation.goBack()}
          disabled={isLoading || currentStep === 5}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TOR Insurance</Text>
      </View>
      
      {renderStepIndicator()}
      
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {renderNavigationButtons()}
      
      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.loadingOverlayText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backArrow: {
    padding: Spacing.small
  },
  headerTitle: {
    fontSize: Typography.size.large,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginLeft: Spacing.small
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
    position: 'relative'
  },
  stepWrapper: {
    alignItems: 'center',
    width: 64
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  activeStep: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  stepNumber: {
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textSecondary
  },
  activeStepNumber: {
    color: Colors.white
  },
  stepTitle: {
    fontSize: Typography.size.tiny,
    color: Colors.textSecondary,
    textAlign: 'center'
  },
  activeStepTitle: {
    color: Colors.text,
    fontWeight: Typography.weight.medium
  },
  stepperLine: {
    position: 'absolute',
    top: Spacing.medium + 14,
    left: Spacing.large + 32,
    right: Spacing.large + 32,
    height: 2,
    backgroundColor: Colors.border,
    zIndex: -1
  },
  content: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: Spacing.extraLarge * 2
  },
  stepContainer: {
    padding: Spacing.medium
  },
  stepHeading: {
    fontSize: Typography.size.large,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.small
  },
  stepDescription: {
    fontSize: Typography.size.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.large
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  formGroup: {
    marginBottom: Spacing.medium
  },
  inputLabel: {
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
    color: Colors.text,
    marginBottom: Spacing.small
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.medium
  },
  inputError: {
    borderColor: Colors.error
  },
  inputIcon: {
    marginRight: Spacing.small
  },
  textInput: {
    flex: 1,
    height: 46,
    color: Colors.text
  },
  errorText: {
    fontSize: Typography.size.tiny,
    color: Colors.error,
    marginTop: 4
  },
  errorSummary: {
    fontSize: Typography.size.small,
    color: Colors.white,
    backgroundColor: Colors.error,
    padding: Spacing.medium,
    borderRadius: 8,
    marginTop: Spacing.medium
  },
  insurerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.small
  },
  insurerCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    borderWidth: 1,
    borderColor: Colors.border
  },
  selectedInsurerCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10'
  },
  insurerName: {
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginBottom: 4
  },
  insurerRate: {
    fontSize: Typography.size.large,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    marginBottom: 8
  },
  insurerDescription: {
    fontSize: Typography.size.tiny,
    color: Colors.textSecondary
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.extraLarge * 2
  },
  loadingText: {
    marginTop: Spacing.medium,
    fontSize: Typography.size.medium,
    color: Colors.textSecondary
  },
  premiumContainer: {
    padding: Spacing.small
  },
  premiumCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6
  },
  premiumCardTitle: {
    fontSize: Typography.size.large,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: 4
  },
  premiumCardSubtitle: {
    fontSize: Typography.size.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.medium
  },
  premiumBreakdown: {
    marginBottom: Spacing.medium
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30'
  },
  premiumLabel: {
    fontSize: Typography.size.small,
    color: Colors.textSecondary
  },
  premiumValue: {
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
    color: Colors.text
  },
  premiumDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.small
  },
  premiumRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.small
  },
  premiumLabelTotal: {
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text
  },
  premiumValueTotal: {
    fontSize: Typography.size.large,
    fontWeight: Typography.weight.bold,
    color: Colors.primary
  },
  excessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '10',
    padding: Spacing.small,
    borderRadius: 8
  },
  excessText: {
    fontSize: Typography.size.small,
    color: Colors.warning,
    marginLeft: 8,
    flex: 1
  },
  paymentOptions: {
    marginVertical: Spacing.medium
  },
  paymentTitle: {
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginBottom: Spacing.medium
  },
  mpesaButton: {
    backgroundColor: Colors.success,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mpesaButtonText: {
    color: Colors.white,
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.semiBold
  },
  premiumError: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.extraLarge
  },
  premiumErrorText: {
    marginTop: Spacing.small,
    fontSize: Typography.size.medium,
    color: Colors.error,
    marginBottom: Spacing.medium
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.large,
    borderRadius: 8
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium
  },
  confirmationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.large,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6
  },
  successIcon: {
    marginBottom: Spacing.medium
  },
  confirmationTitle: {
    fontSize: Typography.size.large,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: 8
  },
  confirmationSubtitle: {
    fontSize: Typography.size.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.large,
    textAlign: 'center'
  },
  policyDetails: {
    width: '100%',
    marginBottom: Spacing.large
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30'
  },
  policyLabel: {
    fontSize: Typography.size.small,
    color: Colors.textSecondary
  },
  policyValue: {
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
    color: Colors.text
  },
  confirmationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.medium
  },
  shareButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: Spacing.small
  },
  shareButtonText: {
    color: Colors.white,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
    marginLeft: 8
  },
  doneButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: Spacing.small
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium
  },
  backButtonText: {
    color: Colors.primary,
    marginLeft: 4,
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.medium
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.large,
    borderRadius: 8
  },
  nextButtonText: {
    color: Colors.white,
    marginRight: 4,
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.medium
  },
  testButton: {
    position: 'absolute',
    top: -30,
    right: Spacing.medium,
    backgroundColor: Colors.warning + '80',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4
  },
  testButtonText: {
    fontSize: Typography.size.tiny,
    color: Colors.white
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingOverlayText: {
    color: Colors.white,
    marginTop: Spacing.medium,
    fontSize: Typography.size.medium
  }
});

export default TORInsuranceScreen;
