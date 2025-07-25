/**
 * PSV Comprehensive Insurance Quotation Flow - Component-Based Architecture
 * Full comprehensive coverage for PSVs including theft, fire, and enhanced passenger liability
 * 
 * Features:
 * - PSV-specific comprehensive coverage
 * - 5-step process with PSV components
 * - Vehicle valuation with PSV-specific factors
 * - Premium calculation with comprehensive coverage
 * - Enhanced passenger liability coverage
 * 
 * Steps:
 * 1. Personal Information
 * 2. PSV Details
 * 3. Vehicle Valuation
 * 4. Insurer Selection
 * 5. Payment
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../constants';

// Import components with correct paths
// Fix: Corrected path for PersonalInformationStep and PSVDetailsStep
import PersonalInformationStep from '../../common/components/PersonalInformationStep';
// Fix: Updated the path to match the folder structure - using './components/PSVDetailsStep' instead of '../components/PSVDetailsStep'
import PSVDetailsStep from './components/PSVDetailsStep';

// Define the simple payment step directly here to avoid import errors
// You can move this to a separate file later
const PaymentStep = ({ formData, onUpdateFormData, validationErrors, premium, isLoading }) => {
  // Payment methods
  const paymentMethods = [
    { id: 'mpesa', name: 'M-Pesa', icon: 'phone-portrait-outline' },
    { id: 'card', name: 'Card Payment', icon: 'card-outline' },
    { id: 'bank', name: 'Bank Transfer', icon: 'cash-outline' },
  ];

  // Handle payment method selection
  const handleSelectPaymentMethod = (methodId) => {
    onUpdateFormData({ paymentMethod: methodId });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Payment</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred payment method</Text>

      {/* Premium Summary */}
      <View style={styles.premiumSummary}>
        <Text style={styles.premiumLabel}>Total Premium:</Text>
        <Text style={styles.premiumValue}>
          KES {premium ? premium.toLocaleString() : '0'}
        </Text>
      </View>

      {/* Payment Methods */}
      <Text style={styles.sectionTitle}>Payment Method</Text>
      <View style={styles.paymentMethodsContainer}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethodOption,
              formData.paymentMethod === method.id && styles.selectedPaymentMethod,
            ]}
            onPress={() => handleSelectPaymentMethod(method.id)}
          >
            <Ionicons 
              name={method.icon} 
              size={24} 
              color={formData.paymentMethod === method.id ? Colors.primary : Colors.text} 
            />
            <Text style={[
              styles.paymentMethodText,
              formData.paymentMethod === method.id && styles.selectedPaymentMethodText
            ]}>
              {method.name}
            </Text>
            {formData.paymentMethod === method.id && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      {validationErrors.paymentMethod && (
        <Text style={styles.errorText}>{validationErrors.paymentMethod}</Text>
      )}

      {/* Payment Instructions */}
      {formData.paymentMethod && (
        <View style={styles.paymentInstructions}>
          <Text style={styles.instructionsTitle}>Payment Instructions</Text>
          {formData.paymentMethod === 'mpesa' && (
            <View>
              <Text style={styles.instructionStep}>1. Click submit to proceed</Text>
              <Text style={styles.instructionStep}>2. You will receive an M-Pesa prompt</Text>
              <Text style={styles.instructionStep}>3. Enter your M-Pesa PIN to complete payment</Text>
            </View>
          )}
          {formData.paymentMethod === 'card' && (
            <View>
              <Text style={styles.instructionStep}>1. Click submit to proceed</Text>
              <Text style={styles.instructionStep}>2. You'll be redirected to secure payment page</Text>
              <Text style={styles.instructionStep}>3. Enter your card details to complete payment</Text>
            </View>
          )}
          {formData.paymentMethod === 'bank' && (
            <View>
              <Text style={styles.instructionStep}>1. Click submit to proceed</Text>
              <Text style={styles.instructionStep}>2. You'll receive bank transfer details</Text>
              <Text style={styles.instructionStep}>3. Make payment and upload proof of payment</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// Placeholder component for PSV Vehicle Value Step
const PSVValueStep = ({ formData, onUpdateFormData, validationErrors, vehicleAge, enableEstimation, minimumValue }) => (
  <View style={styles.stepContainer}>
    <Text style={styles.stepTitle}>Vehicle Valuation</Text>
    <Text style={styles.stepSubtitle}>Enter your vehicle's current market value</Text>
    
    <View style={styles.formGroup}>
      <Text style={styles.label}>Vehicle Value (KES) *</Text>
      <View style={[
        styles.input,
        validationErrors.vehicleValue && styles.inputError
      ]}>
        <Text>KES </Text>
        <TextInput
          value={formData.vehicleValue}
          onChangeText={(text) => {
            const numericValue = text.replace(/[^0-9]/g, '');
            onUpdateFormData({ 
              vehicleValue: numericValue ? parseInt(numericValue).toLocaleString() : ''
            });
          }}
          placeholder="e.g., 1,000,000"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          style={styles.valueInput}
        />
      </View>
      {validationErrors.vehicleValue && (
        <Text style={styles.errorText}>{validationErrors.vehicleValue}</Text>
      )}
    </View>
  </View>
);

// Placeholder component for PSV Insurer Selection Step
const PSVInsurerStep = ({ formData, onUpdateFormData, validationErrors, enableComparison, showRatings }) => (
  <View style={styles.stepContainer}>
    <Text style={styles.stepTitle}>Select Insurer</Text>
    <Text style={styles.stepSubtitle}>Choose your preferred insurance provider</Text>
    
    <View style={styles.insurersList}>
      {/* Sample insurers - replace with actual data */}
      {['Jubilee Insurance', 'APA Insurance', 'Britam', 'CIC Insurance'].map((insurer) => (
        <TouchableOpacity
          key={insurer}
          style={[
            styles.insurerOption,
            formData.selectedInsurer === insurer && styles.selectedInsurerOption
          ]}
          onPress={() => onUpdateFormData({ selectedInsurer: insurer, calculatedPremium: 25000 })}
        >
          <View style={styles.insurerContent}>
            <View style={styles.insurerLogo}>
              <Text style={styles.insurerInitial}>{insurer.charAt(0)}</Text>
            </View>
            <View style={styles.insurerDetails}>
              <Text style={styles.insurerName}>{insurer}</Text>
              <Text style={styles.insurerRating}>★★★★☆</Text>
            </View>
          </View>
          {formData.selectedInsurer === insurer && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
    {validationErrors.selectedInsurer && (
      <Text style={styles.errorText}>{validationErrors.selectedInsurer}</Text>
    )}
  </View>
);

// Placeholder component for PSV Premium Calculator
const PSVPremiumCalculator = ({ formData, onUpdateFormData, showHeader, enableAdvancedFactors, showBreakdown, onPremiumCalculated }) => {
  // Simple mock calculation for demo purposes
  const basePremium = 20000;
  const valuePercentage = 0.04; // 4% of vehicle value
  const passengerFactor = parseInt(formData.passengerCapacity || '0') * 100;
  
  const vehicleValue = parseInt(formData.vehicleValue?.toString().replace(/,/g, '') || '0');
  const valuePremium = vehicleValue * valuePercentage;
  
  const totalPremium = basePremium + valuePremium + passengerFactor;
  
  // Notify parent component of calculated premium
  React.useEffect(() => {
    if (onPremiumCalculated && totalPremium > 0) {
      onPremiumCalculated(totalPremium);
    }
  }, [totalPremium, onPremiumCalculated]);

  return (
    <View style={styles.calculatorContainer}>
      {showHeader && (
        <Text style={styles.calculatorTitle}>Premium Calculation</Text>
      )}
      
      {showBreakdown && (
        <View style={styles.premiumBreakdown}>
          <View style={styles.premiumRow}>
            <Text style={styles.premiumItem}>Base Premium:</Text>
            <Text style={styles.premiumValue}>KES {basePremium.toLocaleString()}</Text>
          </View>
          
          <View style={styles.premiumRow}>
            <Text style={styles.premiumItem}>Vehicle Value ({valuePercentage * 100}%):</Text>
            <Text style={styles.premiumValue}>KES {valuePremium.toLocaleString()}</Text>
          </View>
          
          <View style={styles.premiumRow}>
            <Text style={styles.premiumItem}>Passenger Factor:</Text>
            <Text style={styles.premiumValue}>KES {passengerFactor.toLocaleString()}</Text>
          </View>
          
          <View style={[styles.premiumRow, styles.premiumTotal]}>
            <Text style={[styles.premiumItem, styles.premiumTotalText]}>Total Premium:</Text>
            <Text style={[styles.premiumValue, styles.premiumTotalText]}>
              KES {totalPremium.toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const PSVComprehensiveScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  // Form state management
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information - Updated to match PersonalInformationStep component
    fullName: '',
    phoneNumber: '',
    email: '',
    idNumber: '',
    kraPin: '',
    
    // PSV Details
    psvType: '',
    psvMake: '',
    psvModel: '',
    psvYear: '',
    registrationNumber: '',
    passengerCapacity: '',
    primaryRoute: '',
    sacco: '',
    engineCapacity: '',
    insuranceStartDate: new Date(),
    
    // Vehicle Valuation
    vehicleValue: '',
    estimatedValue: '',
    valuationMethod: 'market', // market, replacement, agreed
    
    // Insurance Selection
    selectedInsurer: '',
    insurerDetails: null,
    coverageType: 'comprehensive',
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
        if (!formData.fullName || !formData.fullName.trim()) {
          errors.fullName = 'Name is required';
        }
        if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
          errors.phoneNumber = 'Phone number is required';
        } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.phoneNumber.trim())) {
          errors.phoneNumber = 'Please enter a valid phone number';
        }
        if (!formData.email || !formData.email.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
          errors.email = 'Please enter a valid email address';
        }
        break;

      case 2: // PSV Details
        if (!formData.psvType) errors.psvType = 'PSV type is required';
        if (!formData.psvMake) errors.psvMake = 'Vehicle make is required';
        if (!formData.psvModel) errors.psvModel = 'Vehicle model is required';
        if (!formData.psvYear || !formData.psvYear.trim()) {
          errors.psvYear = 'Vehicle year is required';
        } else {
          const year = parseInt(formData.psvYear);
          const currentYear = new Date().getFullYear();
          if (isNaN(year) || year < 1990 || year > currentYear) {
            errors.psvYear = `Year must be between 1990 and ${currentYear}`;
          }
        }
        if (!formData.registrationNumber || !formData.registrationNumber.trim()) {
          errors.registrationNumber = 'Registration number is required';
        }
        if (!formData.passengerCapacity || !formData.passengerCapacity.trim()) {
          errors.passengerCapacity = 'Passenger capacity is required';
        } else {
          const capacity = parseInt(formData.passengerCapacity);
          if (isNaN(capacity) || capacity < 1 || capacity > 200) {
            errors.passengerCapacity = 'Passenger capacity must be between 1 and 200';
          }
        }
        break;

      case 3: // Vehicle Valuation
        if (!formData.vehicleValue || !formData.vehicleValue.toString().trim()) {
          errors.vehicleValue = 'Vehicle value is required';
        } else {
          const value = parseFloat(formData.vehicleValue.toString().replace(/,/g, ''));
          if (isNaN(value) || value < 300000) {
            errors.vehicleValue = 'Minimum vehicle value is KES 300,000';
          } else if (value > 50000000) {
            errors.vehicleValue = 'Maximum vehicle value is KES 50,000,000';
          }
        }
        break;

      case 4: // Insurer Selection
        if (!formData.selectedInsurer) {
          errors.selectedInsurer = 'Please select an insurer';
        }
        break;

      case 5: // Payment
        if (!formData.paymentMethod) {
          errors.paymentMethod = 'Please select a payment method';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigate to next step
  const handleNextStep = () => {
    const isValid = validateCurrentStep();
    
    if (isValid) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        handleSubmitQuotation();
      }
    } else {
      // Get current step errors for better messaging
      const currentErrors = Object.keys(validationErrors);
      let errorMessage = 'Please fill in all required fields.';
      
      if (currentErrors.length > 0) {
        const firstError = validationErrors[currentErrors[0]];
        errorMessage = firstError;
      }
      
      Alert.alert('Validation Error', errorMessage);
      
      // Scroll to top to show errors
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Navigate to previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Submit quotation
  const handleSubmitQuotation = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const quotationData = {
        ...formData,
        premium: formData.calculatedPremium,
        quotationId: `PSV-COMP-${Date.now()}`,
        createdAt: new Date().toISOString(),
        productType: 'PSV Comprehensive',
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

  // Handle premium calculation
  const handlePremiumCalculated = (premiumData) => {
    handleFormDataUpdate({ calculatedPremium: premiumData });
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
            requiredFields={['fullName', 'phoneNumber', 'email']}
            optionalFields={['idNumber', 'kraPin']}
          />
        );

      case 2:
        return (
          <PSVDetailsStep
            formData={formData}
            onUpdateFormData={handleFormDataUpdate}
            validationErrors={validationErrors}
            showValueInput={false}
            requiredFields={['psvType', 'psvMake', 'psvModel', 'psvYear', 'registrationNumber', 'passengerCapacity']}
          />
        );

      case 3:
        return (
          <PSVValueStep
            formData={formData}
            onUpdateFormData={handleFormDataUpdate}
            validationErrors={validationErrors}
            vehicleAge={formData.psvYear ? new Date().getFullYear() - parseInt(formData.psvYear) : 0}
            enableEstimation={true}
            minimumValue={300000}
          />
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <PSVInsurerStep
              formData={formData}
              onUpdateFormData={handleFormDataUpdate}
              validationErrors={validationErrors}
              enableComparison={true}
              showRatings={true}
            />
            
            {formData.selectedInsurer && formData.vehicleValue && (
              <View style={styles.premiumSection}>
                <PSVPremiumCalculator
                  formData={formData}
                  onUpdateFormData={handleFormDataUpdate}
                  showHeader={false}
                  enableAdvancedFactors={true}
                  showBreakdown={true}
                  onPremiumCalculated={handlePremiumCalculated}
                />
              </View>
            )}
          </View>
        );

      case 5:
        return (
          <PaymentStep
            formData={formData}
            onUpdateFormData={handleFormDataUpdate}
            validationErrors={validationErrors}
            premium={formData.calculatedPremium}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
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
        
        <Text style={styles.headerTitle}>PSV Comprehensive Insurance</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / 5) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 5</Text>
      </View>

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
                {isLoading ? 'Processing...' : currentStep === 5 ? 'Submit' : 'Next'}
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
  // Progress bar styles
  progressBarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'right',
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
  stepContainer: {
    flex: 1,
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
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  premiumSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  calculatorContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calculatorTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  premiumBreakdown: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
  },
  insurersList: {
    marginTop: Spacing.md,
  },
  insurerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  selectedInsurerOption: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  insurerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insurerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  insurerInitial: {
    ...Typography.h3,
    color: Colors.primary,
  },
  insurerDetails: {
    flex: 1,
  },
  insurerName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
  },
  insurerRating: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  premiumItem: {
    ...Typography.body,
    color: Colors.text,
  },
  premiumValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  premiumTotal: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  premiumTotalText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Payment styles
  premiumSummary: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  premiumLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  paymentMethodsContainer: {
    marginBottom: Spacing.lg,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  paymentMethodText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    marginLeft: Spacing.md,
  },
  selectedPaymentMethodText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  paymentInstructions: {
    padding: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  instructionsTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  instructionStep: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
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

export default PSVComprehensiveScreen;