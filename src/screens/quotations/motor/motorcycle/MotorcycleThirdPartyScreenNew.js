/**
 * Motorcycle Third Party Insurance Quotation Flow - Component-Based Architecture
 * Basic third party liability coverage for motorcycles - legal minimum requirement
 * 
 * Features:
 * - Motorcycle-specific third party liability coverage
 * - Simplified 4-step process with motorcycle components
 * - Fixed coverage amounts as per Kenya law
 * - Engine capacity considerations
 * - Affordable premium calculations for motorcycles
 * 
 * Steps:
 * 1. Personal Information
 * 2. Motorcycle Details
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

// Import motorcycle-specific components
import {
  PersonalInformationStep,
  QuotationProgressBar,
  MotorcycleDetailsStep,
  PaymentStep
} from './components';

// Import motorcycle third party insurer data
const MOTORCYCLE_THIRD_PARTY_INSURERS = [
  {
    id: 'jubilee_motorcycle_tp',
    name: 'Jubilee Insurance',
    logoIcon: 'shield-checkmark-outline',
    baseRate: 0.035, // 3.5% for motorcycles
    baseMinimum: 4500,
    maxEngineCapacity: 1000,
    features: [
      'Third Party Liability',
      'Legal Compliance',
      'Motorcycle Coverage',
      'Quick Processing'
    ],
    engineCapacityRates: {
      'up-to-125': 4500,
      '126-250': 6000,
      '251-400': 8000,
      '401-plus': 10000
    }
  },
  {
    id: 'madison_motorcycle_tp',
    name: 'Madison Insurance',
    logoIcon: 'business-outline',
    baseRate: 0.032,
    baseMinimum: 4200,
    maxEngineCapacity: 800,
    features: [
      'Affordable Rates',
      'Local Support',
      'Fast Claims',
      'Motorcycle Specialist'
    ],
    engineCapacityRates: {
      'up-to-125': 4200,
      '126-250': 5500,
      '251-400': 7500,
      '401-plus': 9500
    }
  },
  {
    id: 'britam_motorcycle_tp',
    name: 'Britam Insurance',
    logoIcon: 'globe-outline',
    baseRate: 0.038,
    baseMinimum: 4800,
    maxEngineCapacity: 1200,
    features: [
      'Digital Claims',
      'Wide Network',
      'Comprehensive Coverage',
      '24/7 Support'
    ],
    engineCapacityRates: {
      'up-to-125': 4800,
      '126-250': 6200,
      '251-400': 8500,
      '401-plus': 11000
    }
  }
];

const MotorcycleThirdPartyScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  
  // Get route params
  const { vehicleCategory, productType, productName } = route.params || {};
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    nationalId: '',
    age: '',
    gender: '',
    maritalStatus: '',
    occupation: '',
    county: '',
    location: '',
    
    // Motorcycle Details
    motorcycleType: '',
    motorcycleMake: '',
    motorcycleModel: '',
    motorcycleYear: '',
    engineCapacity: '',
    chassisNumber: '',
    registrationNumber: '',
    motorcycleColor: '',
    
    // Insurance Details
    coverageType: 'third_party',
    selectedInsurer: null,
    premiumCalculation: null,
    
    // Payment
    paymentMethod: '',
    paymentPlan: 'annual'
  });

  const steps = [
    { 
      id: 1, 
      title: 'Personal Information', 
      component: 'PersonalInformationStep',
      icon: 'person-outline',
      description: 'Basic personal details'
    },
    { 
      id: 2, 
      title: 'Motorcycle Details', 
      component: 'MotorcycleDetailsStep',
      icon: 'bicycle',
      description: 'Motorcycle specifications'
    },
    { 
      id: 3, 
      title: 'Select Insurer', 
      component: 'InsurerSelectionStep',
      icon: 'shield-outline',
      description: 'Choose insurance provider'
    },
    { 
      id: 4, 
      title: 'Payment', 
      component: 'PaymentStep',
      icon: 'card-outline',
      description: 'Complete purchase'
    }
  ];

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && 
               formData.phoneNumber && formData.nationalId && formData.age;
      case 2:
        return formData.motorcycleType && formData.motorcycleMake && 
               formData.motorcycleModel && formData.motorcycleYear && formData.engineCapacity;
      case 3:
        return formData.selectedInsurer;
      case 4:
        return formData.paymentMethod;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      Alert.alert(
        'Incomplete Information',
        'Please fill in all required fields before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const calculateThirdPartyPremium = (insurer, engineCapacity) => {
    const capacity = parseInt(engineCapacity) || 0;
    let categoryRate = 'up-to-125';
    
    if (capacity > 125 && capacity <= 250) {
      categoryRate = '126-250';
    } else if (capacity > 250 && capacity <= 400) {
      categoryRate = '251-400';
    } else if (capacity > 400) {
      categoryRate = '401-plus';
    }
    
    const basePremium = insurer.engineCapacityRates[categoryRate] || insurer.baseMinimum;
    
    // Government levies and taxes
    const stampDuty = 40;
    const trainingLevy = Math.max(50, basePremium * 0.002);
    const policyHoldersFund = basePremium * 0.0025;
    const vat = basePremium * 0.16;
    
    const totalTaxes = stampDuty + trainingLevy + policyHoldersFund + vat;
    const totalPremium = basePremium + totalTaxes;
    
    return {
      basePremium: Math.round(basePremium),
      taxes: {
        stampDuty,
        trainingLevy: Math.round(trainingLevy),
        policyHoldersFund: Math.round(policyHoldersFund),
        vat: Math.round(vat)
      },
      totalTaxes: Math.round(totalTaxes),
      totalPremium: Math.round(totalPremium),
      engineCapacityCategory: categoryRate
    };
  };

  const handleSubmitQuotation = async () => {
    try {
      const quotationData = {
        ...formData,
        vehicleCategory: 'motorcycle',
        productType: 'third_party',
        quotationDate: new Date().toISOString(),
        status: 'pending'
      };

      console.log('Motorcycle Third Party Quotation:', quotationData);
      
      Alert.alert(
        'Quotation Submitted!',
        'Your motorcycle third party insurance quotation has been submitted successfully. You will receive a confirmation email shortly.',
        [
          {
            text: 'View Details',
            onPress: () => {
              navigation.navigate('QuotationConfirmation', { 
                quotationData,
                quotationType: 'motorcycle_third_party'
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Quotation submission error:', error);
      Alert.alert(
        'Submission Error',
        'There was an error submitting your quotation. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderInsurerSelection = () => {
    return (
      <View style={styles.insurerContainer}>
        <Text style={styles.stepTitle}>Select Insurance Provider</Text>
        <Text style={styles.stepSubtitle}>
          Choose from motorcycle third party specialists
        </Text>

        {/* Third Party Coverage Info */}
        <View style={styles.coverageInfoCard}>
          <View style={styles.coverageHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            <Text style={styles.coverageTitle}>Third Party Coverage</Text>
          </View>
          <Text style={styles.coverageText}>
            • Bodily Injury: KSh 3,000,000 per person{'\n'}
            • Property Damage: KSh 1,000,000 per accident{'\n'}
            • Legal Liability: As per Kenya Motor Insurance requirements
          </Text>
        </View>

        {/* Insurer Options */}
        {MOTORCYCLE_THIRD_PARTY_INSURERS.map((insurer) => {
          const premiumCalc = calculateThirdPartyPremium(insurer, formData.engineCapacity);
          const isSelected = formData.selectedInsurer?.id === insurer.id;
          
          return (
            <TouchableOpacity
              key={insurer.id}
              style={[
                styles.insurerCard,
                isSelected && styles.selectedInsurerCard
              ]}
              onPress={() => {
                updateFormData({ 
                  selectedInsurer: insurer,
                  premiumCalculation: premiumCalc
                });
              }}
            >
              <View style={styles.insurerHeader}>
                <View style={styles.insurerLogoContainer}>
                  <Ionicons name={insurer.logoIcon} size={32} color={Colors.primary} />
                </View>
                <View style={styles.insurerInfo}>
                  <Text style={styles.insurerName}>{insurer.name}</Text>
                  <Text style={styles.insurerPremium}>
                    KSh {premiumCalc.totalPremium.toLocaleString()}/year
                  </Text>
                </View>
                <View style={styles.selectionIndicator}>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  ) : (
                    <Ionicons name="radio-button-off" size={24} color={Colors.border} />
                  )}
                </View>
              </View>

              {/* Features */}
              <View style={styles.featuresContainer}>
                {insurer.features.map((feature, index) => (
                  <View key={index} style={styles.featureTag}>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Premium breakdown for selected */}
              {isSelected && (
                <View style={styles.premiumBreakdown}>
                  <Text style={styles.breakdownTitle}>Premium Breakdown:</Text>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Base Premium</Text>
                    <Text style={styles.breakdownValue}>KSh {premiumCalc.basePremium.toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Government Levies & VAT</Text>
                    <Text style={styles.breakdownValue}>KSh {premiumCalc.totalTaxes.toLocaleString()}</Text>
                  </View>
                  <View style={styles.totalBreakdownItem}>
                    <Text style={styles.totalBreakdownLabel}>Total Annual Premium</Text>
                    <Text style={styles.totalBreakdownValue}>KSh {premiumCalc.totalPremium.toLocaleString()}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderCurrentStep = () => {
    const currentStepInfo = steps[currentStep - 1];

    switch (currentStepInfo.component) {
      case 'PersonalInformationStep':
        return (
          <PersonalInformationStep
            formData={formData}
            onUpdateFormData={updateFormData}
            vehicleType="motorcycle"
          />
        );
      case 'MotorcycleDetailsStep':
        return (
          <MotorcycleDetailsStep
            formData={formData}
            onUpdateFormData={updateFormData}
            showValueInput={false}
          />
        );
      case 'InsurerSelectionStep':
        return renderInsurerSelection();
      case 'PaymentStep':
        return (
          <PaymentStep
            formData={formData}
            onUpdateFormData={updateFormData}
            totalAmount={formData.premiumCalculation?.totalPremium || 0}
            vehicleType="motorcycle"
            onPaymentComplete={handleSubmitQuotation}
          />
        );
      default:
        return <View />;
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Motorcycle Third Party</Text>
          <Text style={styles.headerSubtitle}>Step {currentStep} of {steps.length}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <QuotationProgressBar 
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + Spacing.xl }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepContainer}>
              {renderCurrentStep()}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Navigation Buttons */}
        <View style={[styles.navigationContainer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              currentStep === 1 && styles.disabledButton
            ]}
            onPress={handlePrevStep}
            disabled={currentStep === 1}
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={currentStep === 1 ? Colors.textSecondary : Colors.primary} 
            />
            <Text style={[
              styles.navButtonText,
              styles.prevButtonText,
              currentStep === 1 && styles.disabledButtonText
            ]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              !validateCurrentStep() && styles.disabledButton
            ]}
            onPress={currentStep === steps.length ? handleSubmitQuotation : handleNextStep}
            disabled={!validateCurrentStep()}
          >
            <Text style={[
              styles.navButtonText,
              styles.nextButtonText,
              !validateCurrentStep() && styles.disabledButtonText
            ]}>
              {currentStep === steps.length ? 'Submit Quote' : 'Next'}
            </Text>
            <Ionicons 
              name={currentStep === steps.length ? "checkmark" : "chevron-forward"} 
              size={20} 
              color={!validateCurrentStep() ? Colors.textSecondary : Colors.white} 
            />
          </TouchableOpacity>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  insurerContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_700Bold',
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: 'Poppins_400Regular',
  },
  coverageInfoCard: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  coverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  coverageTitle: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  coverageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  insurerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedInsurerCard: {
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}05`,
  },
  insurerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  insurerLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  insurerInfo: {
    flex: 1,
  },
  insurerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  insurerPremium: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  selectionIndicator: {
    marginLeft: Spacing.sm,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  featureTag: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  featureText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontFamily: 'Poppins_400Regular',
  },
  premiumBreakdown: {
    backgroundColor: `${Colors.success}10`,
    padding: Spacing.sm,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  breakdownTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_700Bold',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  breakdownValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  totalBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  totalBreakdownLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  totalBreakdownValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  prevButton: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    backgroundColor: Colors.backgroundLight,
    borderColor: Colors.border,
  },
  navButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: 'Poppins_500Medium',
  },
  prevButtonText: {
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  nextButtonText: {
    color: Colors.white,
    marginRight: Spacing.xs,
  },
  disabledButtonText: {
    color: Colors.textSecondary,
  },
});

export default MotorcycleThirdPartyScreen;
