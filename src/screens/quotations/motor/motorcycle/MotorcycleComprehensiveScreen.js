/**
 * MotorcycleComprehensiveScreen - Component-based motorcycle comprehensive insurance quotation
 * Uses new component architecture for consistent UI and enhanced functionality
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
  MotorcycleValueStep,
  MotorcycleInsurerStep,
  MotorcyclePremiumCalculator,
  PaymentStep
} from './components';

const MotorcycleComprehensiveScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  
  // Get route params
  const { vehicleCategory, productType, productName } = route.params || {};
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information (matching PersonalInformationStep fields)
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    kraPin: '',
    
    // Motorcycle Details
    motorcycleType: '',
    motorcycleMake: '',
    motorcycleModel: '',
    motorcycleYear: '',
    engineCapacity: '',
    chassisNumber: '',
    registrationNumber: '',
    motorcycleColor: '',
    currentValue: '',
    
    // Insurance Details
    coverageType: 'comprehensive',
    motorcycleValue: '',
    selectedInsurer: null,
    premiumCalculation: null,
    
    // Additional
    hasAccessories: false,
    accessories: [],
    preferredStartDate: new Date(),
    
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
      title: 'Motorcycle Value', 
      component: 'MotorcycleValueStep',
      icon: 'pricetag-outline',
      description: 'Set insured value'
    },
    { 
      id: 4, 
      title: 'Select Insurer', 
      component: 'MotorcycleInsurerStep',
      icon: 'shield-outline',
      description: 'Choose insurance provider'
    },
    { 
      id: 5, 
      title: 'Calculate Premium', 
      component: 'MotorcyclePremiumCalculator',
      icon: 'calculator-outline',
      description: 'Get premium quote'
    },
    { 
      id: 6, 
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
        return formData.fullName && formData.idNumber && formData.phoneNumber;
      case 2:
        return formData.motorcycleType && formData.motorcycleMake && 
               formData.motorcycleModel && formData.motorcycleYear && formData.engineCapacity;
      case 3:
        return formData.motorcycleValue && parseFloat(formData.motorcycleValue) >= 50000;
      case 4:
        return formData.selectedInsurer;
      case 5:
        return formData.premiumCalculation && formData.premiumCalculation.totalPremium;
      case 6:
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

  const handleSubmitQuotation = async () => {
    try {
      const quotationData = {
        ...formData,
        vehicleCategory: 'motorcycle',
        productType: 'comprehensive',
        quotationDate: new Date().toISOString(),
        status: 'pending'
      };

      // Here you would normally submit to your API
      console.log('Quotation Data:', quotationData);
      
      Alert.alert(
        'Quotation Submitted!',
        'Your motorcycle insurance quotation has been submitted successfully. You will receive a confirmation email shortly.',
        [
          {
            text: 'View Details',
            onPress: () => {
              navigation.navigate('QuotationConfirmation', { 
                quotationData,
                quotationType: 'motorcycle_comprehensive'
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

  const renderCurrentStep = () => {
    const currentStepInfo = steps[currentStep - 1];
    
    // Calculate motorcycle age for value step
    const motorcycleAge = formData.motorcycleYear ? 
      new Date().getFullYear() - parseInt(formData.motorcycleYear) : 0;

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
          />
        );
      case 'MotorcycleValueStep':
        return (
          <MotorcycleValueStep
            formData={formData}
            onUpdateFormData={updateFormData}
            vehicleAge={motorcycleAge}
          />
        );
      case 'MotorcycleInsurerStep':
        return (
          <MotorcycleInsurerStep
            formData={formData}
            onUpdateFormData={updateFormData}
          />
        );
      case 'MotorcyclePremiumCalculator':
        return (
          <MotorcyclePremiumCalculator
            formData={formData}
            onUpdateFormData={updateFormData}
            onPremiumCalculated={(premiumData) => {
              updateFormData({ premiumCalculation: premiumData });
            }}
          />
        );
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
          <Text style={styles.headerTitle}>Motorcycle Comprehensive</Text>
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

export default MotorcycleComprehensiveScreen;
