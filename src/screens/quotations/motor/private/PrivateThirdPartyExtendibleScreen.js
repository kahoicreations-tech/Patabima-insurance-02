/**
 * Private Third-Party Extendible Insurance Screen
 * 
 * This screen handles the Private third-party extendible insurance 
 * quotation flow, offering extended coverage options beyond basic third-party
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../constants';

// Import reusable components
import {
  PersonalInformationStep,
  VehicleDetailsStep,
  VehicleValueStep,
  InsurerSelectionStep,
  PaymentStep,
  QuotationProgressBar,
  calculateMotorPremium,
  validateVehicleEligibility
} from './components';

// Import third party extendible insurer data
import { THIRD_PARTY_UNDERWRITERS } from '../../../../data/thirdPartyMotorData';

const PrivateThirdPartyExtendibleScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Get passed data from PrivateVehicleScreen
  const { vehicleCategory, productType, productName, productFeatures } = route.params || {};

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    kraPin: '',
    
    // Step 2: Vehicle Details
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    registrationNumber: '',
    
    // Step 3: Vehicle Value
    vehicleValue: '',
    
    // Calculated fields
    vehicleAge: 0,
    
    // Step 4: Insurer Selection
    selectedInsurer: '',
    selectedQuote: null,
    totalPremium: 0,
    
    // Step 5: Payment
    paymentMethod: 'mpesa',
    mpesaPhoneNumber: '',
    paymentStatus: 'pending',
    transactionId: '',
    paymentAmount: 0,
    
    // Policy validation
    existingPolicyCheck: null,
    insuranceStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    
    // Third Party Extendible specific fields
    selectedExtensions: [], // Additional coverage extensions
  });

  // Payment state
  const [paymentState, setPaymentState] = useState({
    isProcessing: false,
    paymentInitiated: false,
    paymentCompleted: false,
    paymentError: null,
    countdown: 0,
  });

  // Policy validation state
  const [policyValidation, setPolicyValidation] = useState({
    isChecking: false,
    hasExistingPolicy: false,
    existingPolicyDetails: null,
    validationMessage: '',
    suggestedStartDate: null
  });

  const TOTAL_STEPS = 5;
  
  // Third Party Extendible coverage extensions
  const EXTENDIBLE_EXTENSIONS = [
    {
      id: 'windscreen',
      name: 'Windscreen Cover',
      premium: 3000,
      description: 'Covers repair or replacement of windscreen without affecting no-claims bonus',
      limit: 'Up to KSh 50,000'
    },
    {
      id: 'audio',
      name: 'Audio Equipment',
      premium: 2500,
      description: 'Coverage for factory-installed audio equipment',
      limit: 'Up to KSh 50,000'
    },
    {
      id: 'personal_effects',
      name: 'Personal Effects',
      premium: 2000,
      description: 'Coverage for personal belongings in the car',
      limit: 'Up to KSh 30,000'
    },
    {
      id: 'medical',
      name: 'Enhanced Medical Cover',
      premium: 4000,
      description: 'Additional medical expenses coverage for vehicle occupants',
      limit: 'Up to KSh 100,000'
    },
    {
      id: 'towing',
      name: 'Emergency Towing',
      premium: 2000,
      description: 'Towing and recovery services in case of accident',
      limit: 'Up to KSh 20,000'
    },
  ];

  // Fixed third party extendible coverage amounts
  const THIRD_PARTY_EXTENDIBLE_COVERAGE = {
    bodilyInjury: 3000000, // KSh 3M per person
    propertyDamage: 1000000, // KSh 1M per accident
    legalLiability: 'Unlimited as per law',
    extendibleOptions: EXTENDIBLE_EXTENSIONS
  };

  // Filter insurers for third party extendible
  const thirdPartyExtendibleInsurers = THIRD_PARTY_UNDERWRITERS?.map(underwriter => ({
    id: underwriter.id + '_ext',
    name: underwriter.name,
    logo: underwriter.logo,
    rate: (underwriter.thirdPartyRates?.privateVehicle || underwriter.baseRate) + 1, // Slightly higher rate for extendible
    baseMinimum: (underwriter.thirdPartyRates?.baseMinimum || underwriter.minimumPremium) + 1500, // Higher minimum for extendible
    maxVehicleAge: underwriter.thirdPartyRates?.maxVehicleAge || underwriter.maximumVehicleAge || 25,
    features: [
      'Third Party Liability',
      'Extendible Coverage Options',
      'Windscreen Protection Available',
      'Personal Effects Coverage',
      'Enhanced Medical Benefits',
      'Emergency Towing Services'
    ],
    color: getInsurerColor(underwriter.id),
    pricingLogic: underwriter.pricingLogic,
    statutoryLevies: underwriter.statutoryLevies,
    isOfficial: true,
    supportsExtensions: true
  })) || [];

  // Helper function to assign colors to insurers
  function getInsurerColor(insurerId) {
    const colorMap = {
      'jubilee_tp': '#27AE60',
      'madison_tp': '#E74C3C',
      'britam_tp': '#8E44AD',
      'kal_tp': '#F39C12',
      'pacis_tp': '#16A085',
      'sanlam_tp': '#1B4F72',
      'monarch_tp': '#C0392B',
      'ga_tp': '#8B4513'
    };
    return colorMap[insurerId] || Colors.primary;
  }

  // Calculate vehicle age when year changes
  useEffect(() => {
    if (formData.vehicleYear) {
      const age = new Date().getFullYear() - parseInt(formData.vehicleYear);
      updateFormData({ vehicleAge: age });
    }
  }, [formData.vehicleYear]);

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  // Check for existing insurance policies
  const checkExistingInsurance = async (registrationNumber) => {
    setPolicyValidation(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Simulate API call to check existing policies
      const mockExistingPolicies = [
        {
          id: 'POL123456',
          registrationNumber: 'KCA123A',
          insurerName: 'Jubilee Insurance',
          policyType: 'Third Party Extendible',
          startDate: '2024-01-15',
          endDate: '2025-01-14',
          status: 'active'
        }
      ];
      
      const existingPolicy = mockExistingPolicies.find(
        policy => policy.registrationNumber === registrationNumber.toUpperCase() && 
                  policy.status === 'active'
      );
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (existingPolicy) {
        const endDate = new Date(existingPolicy.endDate);
        const suggestedStart = new Date(endDate);
        suggestedStart.setDate(suggestedStart.getDate() + 1);
        
        setPolicyValidation({
          isChecking: false,
          hasExistingPolicy: true,
          existingPolicyDetails: existingPolicy,
          validationMessage: `Vehicle is currently insured with ${existingPolicy.insurerName} until ${endDate.toLocaleDateString()}`,
          suggestedStartDate: suggestedStart
        });
        
        updateFormData({ 
          insuranceStartDate: suggestedStart,
          existingPolicyCheck: existingPolicy 
        });
      } else {
        setPolicyValidation({
          isChecking: false,
          hasExistingPolicy: false,
          existingPolicyDetails: null,
          validationMessage: 'No active insurance found for this vehicle',
          suggestedStartDate: null
        });
      }
      
    } catch (error) {
      console.error('Policy check error:', error);
      setPolicyValidation({
        isChecking: false,
        hasExistingPolicy: false,
        existingPolicyDetails: null,
        validationMessage: 'Unable to check existing policies. Please proceed.',
        suggestedStartDate: null
      });
    }
  };

  // Calculate third party extendible premium
  const calculateThirdPartyExtendiblePremium = (insurer) => {
    try {
      const vehicleValue = formData.vehicleValue ? 
        parseFloat(formData.vehicleValue.replace(/[^0-9.]/g, '')) : 
        400000; // Minimum value for third party extendible

      // Calculate base premium using motor premium calculator
      const calculation = calculateMotorPremium({
        vehicleValue: vehicleValue,
        vehicleAge: formData.vehicleAge,
        insurer: {
          id: insurer.id,
          name: insurer.name,
          rate: insurer.rate,
          baseMinimum: insurer.baseMinimum,
          maxVehicleAge: insurer.maxVehicleAge,
          statutoryLevies: insurer.statutoryLevies || {
            policyholdersFund: 0.25,
            trainingLevy: 0.2,
            stampDuty: 40
          }
        },
        insuranceType: 'ThirdPartyExtendible',
        vehicleCategory: 'Private'
      });

      // Add extension premiums
      let extensionPremium = 0;
      formData.selectedExtensions?.forEach(extensionId => {
        const extension = EXTENDIBLE_EXTENSIONS.find(ext => ext.id === extensionId);
        if (extension) {
          extensionPremium += extension.premium;
        }
      });

      return {
        isEligible: true,
        totalPremium: calculation.totalPremium + extensionPremium,
        basePremium: calculation.finalBasePremium,
        extensionPremium: extensionPremium,
        levies: calculation.levies,
        vehicleValue: vehicleValue,
        message: ''
      };
    } catch (error) {
      console.error('Third party extendible premium calculation error:', error);
      return {
        isEligible: false,
        totalPremium: 0,
        message: 'Calculation error'
      };
    }
  };

  // Handle insurer premium calculation
  const handleCalculatePremium = (insurer, vehicleValue, vehicleAge) => {
    const eligibility = validateVehicleEligibility(
      vehicleAge,
      insurer,
      'ThirdPartyExtendible'
    );

    if (!eligibility.isEligible) {
      return {
        isEligible: false,
        totalPremium: 0,
        message: eligibility.message
      };
    }

    return calculateThirdPartyExtendiblePremium(insurer);
  };

  // Handle insurer selection and premium calculation
  const handleInsurerSelection = (updates) => {
    updateFormData(updates);
    
    if (updates.selectedInsurer) {
      const selectedInsurer = thirdPartyExtendibleInsurers.find(i => i.id === updates.selectedInsurer);
      if (selectedInsurer) {
        const calculation = calculateThirdPartyExtendiblePremium(selectedInsurer);
        
        const quote = {
          basePremium: calculation.basePremium,
          extensionPremium: calculation.extensionPremium,
          policyholdersFund: calculation.levies?.policyholdersFund || 0,
          trainingLevy: calculation.levies?.trainingLevy || 0,
          stampDuty: calculation.levies?.stampDuty || 40,
          totalPremium: calculation.totalPremium,
          vehicleValue: calculation.vehicleValue,
          coverageType: 'Third Party Extendible',
          coverageAmounts: THIRD_PARTY_EXTENDIBLE_COVERAGE,
          selectedExtensions: formData.selectedExtensions || [],
          underwriterRef: selectedInsurer.id,
          calculationDate: new Date().toISOString(),
          rateSource: 'Official Third Party Extendible Underwriter Rates'
        };

        updateFormData({ 
          selectedQuote: quote, 
          totalPremium: quote.totalPremium,
          paymentAmount: quote.totalPremium + 50 // Add service fee
        });
      }
    }
  };
  
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.fullName && formData.idNumber && formData.phoneNumber;
      case 2:
        return formData.vehicleMake && formData.vehicleModel && formData.vehicleYear && formData.registrationNumber;
      case 3:
        return formData.vehicleValue && parseFloat(formData.vehicleValue.replace(/[^0-9.]/g, '')) > 0;
      case 4:
        return formData.selectedInsurer;
      case 5:
        return paymentState.paymentCompleted;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      Alert.alert('Incomplete Information', 'Please fill in all required fields before proceeding.');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // M-Pesa payment functions
  const initiateMpesaPayment = async () => {
    if (!formData.mpesaPhoneNumber || formData.mpesaPhoneNumber.length < 9) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid M-Pesa phone number');
      return;
    }

    setPaymentState(prev => ({ ...prev, isProcessing: true, paymentError: null }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transactionId = `TPEXT${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      updateFormData({ 
        transactionId,
        paymentStatus: 'processing'
      });

      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false,
        paymentInitiated: true,
        countdown: 60
      }));

      startPaymentCountdown();
      
      Alert.alert(
        'Payment Request Sent',
        `An M-Pesa payment request for KSh ${formData.paymentAmount?.toLocaleString()} has been sent to +254${formData.mpesaPhoneNumber}.\n\nPlease complete the payment on your phone.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false,
        paymentError: 'Failed to initiate payment. Please try again.'
      }));
      Alert.alert('Payment Error', 'Failed to initiate M-Pesa payment. Please try again.');
    }
  };

  const startPaymentCountdown = () => {
    const interval = setInterval(() => {
      setPaymentState(prev => {
        if (prev.countdown <= 1) {
          clearInterval(interval);
          simulatePaymentCompletion();
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  const simulatePaymentCompletion = () => {
    const isSuccessful = Math.random() > 0.1; // 90% success rate
    
    if (isSuccessful) {
      updateFormData({ paymentStatus: 'completed' });
      setPaymentState(prev => ({ 
        ...prev, 
        paymentCompleted: true,
        paymentInitiated: false
      }));
      
      Alert.alert(
        'Payment Successful!',
        `Your Third Party Extendible insurance payment of KSh ${formData.paymentAmount?.toLocaleString()} has been confirmed.\n\nTransaction ID: ${formData.transactionId}`,
        [{ text: 'Continue' }]
      );
    } else {
      updateFormData({ paymentStatus: 'failed' });
      setPaymentState(prev => ({ 
        ...prev, 
        paymentError: 'Payment was cancelled or failed. Please try again.',
        paymentInitiated: false
      }));
    }
  };

  const retryPayment = () => {
    setPaymentState({
      isProcessing: false,
      paymentInitiated: false,
      paymentCompleted: false,
      paymentError: null,
      countdown: 0,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Third Party Extendible Insurance Policy Issued',
        `Your Third Party Extendible insurance policy has been successfully issued.\n\nPolicy ID: TPEXT${Date.now()}\nTotal Premium: KSh ${formData.totalPremium?.toLocaleString()}\nTransaction ID: ${formData.transactionId}\n\nCoverage: Third Party Extendible with selected extensions\nValid for 1 year from policy start date.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to issue policy. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInformationStep
            formData={formData}
            onUpdateFormData={updateFormData}
            requiredFields={['fullName', 'idNumber', 'phoneNumber']}
            optionalFields={['email', 'kraPin']}
            showValidation={true}
          />
        );
      case 2:
        return (
          <VehicleDetailsStep
            formData={formData}
            onUpdateFormData={updateFormData}
            requiredFields={['vehicleMake', 'vehicleModel', 'vehicleYear', 'registrationNumber']}
            enablePolicyValidation={true}
            enableInsuranceDate={false}
            onRegistrationChange={checkExistingInsurance}
            policyValidation={policyValidation}
          />
        );
      case 3:
        return (
          <VehicleValueStep
            formData={formData}
            onUpdateFormData={updateFormData}
            vehicleAge={formData.vehicleAge}
            enableEstimation={false}
            customInfo={
              <View style={styles.extendibleInfo}>
                <View style={styles.infoHeader}>
                  <Ionicons name="layers" size={20} color={Colors.primary} />
                  <Text style={styles.infoTitle}>Third Party Extendible Insurance</Text>
                </View>
                <Text style={styles.infoText}>
                  Third Party Extendible provides basic third party coverage with optional 
                  extensions like windscreen cover, personal effects, and enhanced medical benefits.
                </Text>
                
                {/* Extension Options */}
                <Text style={styles.extensionTitle}>Available Extensions:</Text>
                {EXTENDIBLE_EXTENSIONS.map((extension) => (
                  <TouchableOpacity
                    key={extension.id}
                    style={[
                      styles.extensionOption,
                      formData.selectedExtensions?.includes(extension.id) && styles.extensionSelected
                    ]}
                    onPress={() => {
                      const selectedExtensions = formData.selectedExtensions || [];
                      const index = selectedExtensions.indexOf(extension.id);
                      
                      if (index !== -1) {
                        selectedExtensions.splice(index, 1);
                      } else {
                        selectedExtensions.push(extension.id);
                      }
                      
                      updateFormData({ selectedExtensions: [...selectedExtensions] });
                    }}
                  >
                    <View style={styles.extensionCheckbox}>
                      {formData.selectedExtensions?.includes(extension.id) ? (
                        <Ionicons name="checkbox" size={20} color={Colors.primary} />
                      ) : (
                        <Ionicons name="square-outline" size={20} color={Colors.textMuted} />
                      )}
                    </View>
                    <View style={styles.extensionDetails}>
                      <View style={styles.extensionHeader}>
                        <Text style={styles.extensionName}>{extension.name}</Text>
                        <Text style={styles.extensionPremium}>+KSh {extension.premium.toLocaleString()}</Text>
                      </View>
                      <Text style={styles.extensionDescription}>{extension.description}</Text>
                      <Text style={styles.extensionLimit}>{extension.limit}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            }
          />
        );
      case 4:
        return (
          <InsurerSelectionStep
            formData={formData}
            onUpdateFormData={handleInsurerSelection}
            insurers={thirdPartyExtendibleInsurers}
            insuranceType="Third Party Extendible Insurance"
            enablePremiumCalculation={true}
            onCalculatePremium={handleCalculatePremium}
            vehicleAge={formData.vehicleAge}
          >
            {/* Third Party Extendible Coverage Information */}
            {formData.selectedInsurer && (
              <View style={styles.coverageInfoCard}>
                <View style={styles.coverageHeader}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                  <Text style={styles.coverageTitle}>Third Party Extendible Coverage</Text>
                </View>
                <View style={styles.coverageRow}>
                  <Text style={styles.coverageLabel}>Bodily Injury (per person):</Text>
                  <Text style={styles.coverageValue}>KSh {THIRD_PARTY_EXTENDIBLE_COVERAGE.bodilyInjury.toLocaleString()}</Text>
                </View>
                <View style={styles.coverageRow}>
                  <Text style={styles.coverageLabel}>Property Damage:</Text>
                  <Text style={styles.coverageValue}>KSh {THIRD_PARTY_EXTENDIBLE_COVERAGE.propertyDamage.toLocaleString()}</Text>
                </View>
                <View style={styles.coverageRow}>
                  <Text style={styles.coverageLabel}>Legal Liability:</Text>
                  <Text style={styles.coverageValue}>{THIRD_PARTY_EXTENDIBLE_COVERAGE.legalLiability}</Text>
                </View>
                
                {/* Selected Extensions */}
                {formData.selectedExtensions && formData.selectedExtensions.length > 0 && (
                  <>
                    <Text style={styles.extensionsHeader}>Selected Extensions:</Text>
                    {formData.selectedExtensions.map(extensionId => {
                      const extension = EXTENDIBLE_EXTENSIONS.find(ext => ext.id === extensionId);
                      return extension ? (
                        <View key={extensionId} style={styles.selectedExtension}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                          <Text style={styles.selectedExtensionName}>{extension.name}</Text>
                          <Text style={styles.selectedExtensionPremium}>+KSh {extension.premium.toLocaleString()}</Text>
                        </View>
                      ) : null;
                    })}
                  </>
                )}
                
                {formData.selectedQuote && (
                  <View style={styles.coverageRow}>
                    <Text style={styles.coverageLabel}>Vehicle Value:</Text>
                    <Text style={styles.coverageValue}>KSh {formData.selectedQuote.vehicleValue?.toLocaleString()}</Text>
                  </View>
                )}
              </View>
            )}
          </InsurerSelectionStep>
        );
      case 5:
        return (
          <PaymentStep
            formData={formData}
            onUpdateFormData={updateFormData}
            paymentState={paymentState}
            onInitiatePayment={initiateMpesaPayment}
            onRetryPayment={retryPayment}
            serviceFee={50}
            insuranceType="Third Party Extendible Insurance"
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Third Party Extendible</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <QuotationProgressBar
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabels={['Personal Info', 'Vehicle Details', 'Vehicle Value', 'Select Insurer', 'Payment']}
        showStepLabels={true}
        animated={true}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={prevStep}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.primary} />
              <Text style={styles.prevButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < TOTAL_STEPS ? (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={nextStep}
              disabled={!validateStep(currentStep)}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading || !validateStep(currentStep)}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Issue Policy</Text>
                  <Ionicons name="checkmark" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: 'white',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  extendibleInfo: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  extensionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  extensionOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  extensionSelected: {
    backgroundColor: `${Colors.primary}08`,
    borderColor: Colors.primary,
  },
  extensionCheckbox: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  extensionDetails: {
    flex: 1,
  },
  extensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  extensionName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  extensionPremium: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  extensionDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  extensionLimit: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  coverageInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  coverageTitle: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  coverageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  coverageLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  coverageValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  extensionsHeader: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  selectedExtension: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  selectedExtensionName: {
    fontSize: Typography.fontSize.sm,
    marginLeft: Spacing.xs,
    flex: 1,
    color: Colors.textPrimary,
  },
  selectedExtensionPremium: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  prevButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  prevButtonText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.xs,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.xs,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.xs,
  },
});

export default PrivateThirdPartyExtendibleScreen;
