/**
 * PSV Third Party Insurance Quotation Flow - Component-Based Architecture
 * Basic third party liability coverage for PSVs - legal minimum requirement
 * 
 * Features:
 * - PSV-specific third party liability coverage
 * - Simplified 4-step process with PSV components
 * - Fixed coverage amounts as per Kenya law
 * - Passenger capacity considerations
 * - Affordable premium calculations for PSVs
 * 
 * Steps:
 * 1. Personal Information
 * 2. PSV Details
 * 3. Insurer Selection
 * 4. Payment
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../constants';

// Import PSV-specific components
import {
  PersonalInformationStep,
  QuotationProgressBar,
  PSVDetailsStep,
  PaymentStep
} from './components';

// Import PSV third party insurer data
const PSV_THIRD_PARTY_INSURERS = [
  {
    id: 'jubilee_psv_tp',
    name: 'Jubilee Insurance',
    logoIcon: 'shield-checkmark-outline',
    baseRate: 0.045, // 4.5% for PSVs
    baseMinimum: 15000,
    maxPassengers: 60,
    features: [
      'Third Party Liability',
      'Passenger Liability',
      'PSV Coverage',
      'Quick Processing'
    ],
    passengerCapacityRates: {
      '1-7': 12000,
      '8-14': 15000,
      '15-25': 20000,
      '26-49': 30000,
      '50-plus': 45000
    }
  },
  {
    id: 'madison_psv_tp',
    name: 'Madison Insurance',
    logoIcon: 'business-outline',
    baseRate: 0.042,
    baseMinimum: 14000,
    maxPassengers: 49,
    features: [
      'Affordable Rates',
      'Local Support',
      'Fast Claims',
      'PSV Specialist'
    ],
    passengerCapacityRates: {
      '1-7': 11000,
      '8-14': 14000,
      '15-25': 18000,
      '26-49': 28000,
      '50-plus': 40000
    }
  },
  {
    id: 'britam_psv_tp',
    name: 'Britam Insurance',
    logoIcon: 'globe-outline',
    baseRate: 0.048,
    baseMinimum: 16000,
    maxPassengers: 70,
    features: [
      'Digital Claims',
      'Wide Network',
      'Comprehensive Coverage',
      '24/7 Support'
    ],
    passengerCapacityRates: {
      '1-7': 13000,
      '8-14': 16000,
      '15-25': 22000,
      '26-49': 32000,
      '50-plus': 48000
    }
  },
  {
    id: 'cci_psv_tp',
    name: 'CIC Insurance',
    logoIcon: 'home-outline',
    baseRate: 0.044,
    baseMinimum: 14500,
    maxPassengers: 55,
    features: [
      'Reliable Service',
      'Transport Expertise',
      'Proven Track Record',
      'Professional Claims'
    ],
    passengerCapacityRates: {
      '1-7': 11500,
      '8-14': 14500,
      '15-25': 19000,
      '26-49': 29000,
      '50-plus': 42000
    }
  }
];

const PSVThirdPartyScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  // Form state management
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerKRA: '',
    ownerAddress: '',
    
    // PSV Details
    psvType: '',
    psvMake: '',
    psvModel: '',
    psvYear: '',
    registrationNumber: '',
    passengerCapacity: '',
    primaryRoute: '',
    sacco: '',
    vehicleValue: '',
    insuranceStartDate: new Date(),
    
    // Insurance Selection
    selectedInsurer: '',
    insurerDetails: null,
    coverageType: 'thirdParty',
    calculatedPremium: null,
    
    // Payment Details
    paymentMethod: '',
    paymentDetails: {}
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Handle form data updates
  const handleFormDataUpdate = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Clear validation errors for updated fields
    const updatedFields = Object.keys(updates);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => {
        delete newErrors[field];
      });
      return newErrors;
    });
  };

  // Validate current step
  const validateCurrentStep = () => {
    const errors = {};

    switch (currentStep) {
      case 1: // Personal Information
        if (!formData.ownerName.trim()) errors.ownerName = 'Name is required';
        if (!formData.ownerPhone.trim()) errors.ownerPhone = 'Phone number is required';
        if (!formData.ownerEmail.trim()) errors.ownerEmail = 'Email is required';
        break;

      case 2: // PSV Details
        if (!formData.psvType) errors.psvType = 'PSV type is required';
        if (!formData.psvMake) errors.psvMake = 'Vehicle make is required';
        if (!formData.psvModel) errors.psvModel = 'Vehicle model is required';
        if (!formData.psvYear) errors.psvYear = 'Vehicle year is required';
        if (!formData.registrationNumber) errors.registrationNumber = 'Registration number is required';
        if (!formData.passengerCapacity) errors.passengerCapacity = 'Passenger capacity is required';
        break;

      case 3: // Insurer Selection
        if (!formData.selectedInsurer) errors.selectedInsurer = 'Please select an insurer';
        break;

      case 4: // Payment
        if (!formData.paymentMethod) errors.paymentMethod = 'Please select a payment method';
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigate to next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        handleSubmitQuotation();
      }
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
    }
  };

  // Navigate to previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Calculate premium based on PSV details
  const calculatePremium = () => {
    if (!formData.passengerCapacity || !formData.selectedInsurer) return null;

    const selectedInsurerData = PSV_THIRD_PARTY_INSURERS.find(
      insurer => insurer.id === formData.selectedInsurer
    );

    if (!selectedInsurerData) return null;

    const capacity = parseInt(formData.passengerCapacity);
    let capacityKey = '8-14'; // Default

    if (capacity <= 7) capacityKey = '1-7';
    else if (capacity <= 14) capacityKey = '8-14';
    else if (capacity <= 25) capacityKey = '15-25';
    else if (capacity <= 49) capacityKey = '26-49';
    else capacityKey = '50-plus';

    const basePremium = selectedInsurerData.passengerCapacityRates[capacityKey];
    const stampDuty = 40;
    const trainingLevy = basePremium * 0.002;
    const policyFee = 25;
    const totalPremium = basePremium + stampDuty + trainingLevy + policyFee;

    return {
      basePremium,
      stampDuty,
      trainingLevy: Math.round(trainingLevy),
      policyFee,
      totalPremium: Math.round(totalPremium),
      coverageType: 'thirdParty',
      insurer: selectedInsurerData
    };
  };

  // Submit quotation
  const handleSubmitQuotation = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const quotationData = {
        ...formData,
        premium: calculatePremium(),
        quotationId: `PSV-TP-${Date.now()}`,
        createdAt: new Date().toISOString(),
        productType: 'PSV Third Party',
        status: 'pending'
      };

      // Navigate to success screen or quotation summary
      navigation.navigate('QuotationSuccess', { quotationData });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quotation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInformationStep
            formData={formData}
            onUpdateFormData={handleFormDataUpdate}
            validationErrors={validationErrors}
            title="Personal Information"
            subtitle="Tell us about yourself"
          />
        );

      case 2:
        return (
          <PSVDetailsStep
            formData={formData}
            onUpdateFormData={handleFormDataUpdate}
            validationErrors={validationErrors}
            showValueInput={false}
            title="PSV Details"
            subtitle="Enter your vehicle information"
          />
        );

      case 3:
        return (
          <View style={styles.insurerSection}>
            <Text style={styles.stepTitle}>Select Insurance Provider</Text>
            <Text style={styles.stepSubtitle}>Choose from PSV third party specialists</Text>
            
            {PSV_THIRD_PARTY_INSURERS.map(insurer => {
              const premium = formData.passengerCapacity ? 
                calculatePremiumForInsurer(insurer, formData.passengerCapacity) : null;
              
              return (
                <TouchableOpacity
                  key={insurer.id}
                  style={[
                    styles.insurerCard,
                    formData.selectedInsurer === insurer.id && styles.insurerCardSelected
                  ]}
                  onPress={() => handleFormDataUpdate({ 
                    selectedInsurer: insurer.id, 
                    insurerDetails: insurer 
                  })}
                >
                  <View style={styles.insurerHeader}>
                    <Ionicons 
                      name={insurer.logoIcon} 
                      size={32} 
                      color={formData.selectedInsurer === insurer.id ? Colors.primary : Colors.textSecondary} 
                    />
                    <View style={styles.insurerInfo}>
                      <Text style={styles.insurerName}>{insurer.name}</Text>
                      {premium && (
                        <Text style={styles.insurerPremium}>
                          KES {premium.toLocaleString()}/year
                        </Text>
                      )}
                    </View>
                    {formData.selectedInsurer === insurer.id && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </View>
                  
                  <View style={styles.insurerFeatures}>
                    {insurer.features.map((feature, index) => (
                      <Text key={index} style={styles.featureText}>• {feature}</Text>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 4:
        return (
          <PaymentStep
            formData={formData}
            onUpdateFormData={handleFormDataUpdate}
            validationErrors={validationErrors}
            premium={calculatePremium()}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  // Calculate premium for a specific insurer
  const calculatePremiumForInsurer = (insurer, passengerCapacity) => {
    const capacity = parseInt(passengerCapacity);
    let capacityKey = '8-14';

    if (capacity <= 7) capacityKey = '1-7';
    else if (capacity <= 14) capacityKey = '8-14';
    else if (capacity <= 25) capacityKey = '15-25';
    else if (capacity <= 49) capacityKey = '26-49';
    else capacityKey = '50-plus';

    return insurer.passengerCapacityRates[capacityKey];
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={[styles.statusBarBackground, { backgroundColor: Colors.background }]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => currentStep > 1 ? handlePreviousStep() : navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>PSV Third Party Insurance</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <QuotationProgressBar currentStep={currentStep} totalSteps={4} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderStepContent()}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handlePreviousStep}
              >
                <Text style={styles.secondaryButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleNextStep}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Processing...' : currentStep === 4 ? 'Submit' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusBarBackground: {
    height: 0, // Will be sized by the View component
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  insurerSection: {
    flex: 1,
  },
  insurerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  insurerCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  insurerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  insurerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  insurerName: {
    ...Typography.h3,
    color: Colors.text,
  },
  insurerPremium: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
  insurerFeatures: {
    marginTop: Spacing.sm,
  },
  featureText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.surface,
    fontWeight: '600',
  },
  secondaryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
});

export default PSVThirdPartyScreen;
