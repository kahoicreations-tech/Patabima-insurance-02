/**
 * Commercial Third Party Insurance Screen
 * Offers third party liability coverage for commercial vehicle owners.
 * Uses Sanlam commercial underwriter rates for premium calculation.
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

// Import commercial components
import CommercialPersonalInformationStep from './components/CommercialPersonalInformationStep';
import CommercialVehicleDetailsStep from './components/CommercialVehicleDetailsStep';
import CommercialVehicleValueStep from './components/CommercialVehicleValueStep';
import CommercialInsurerSelectionStep from './components/CommercialInsurerSelectionStep_minimal';
import CommercialDocumentUploadStep from './components/CommercialDocumentUploadStep';
import CommercialPaymentStep from './components/CommercialPaymentStep';
import CommercialQuotationProgressBar from './components/CommercialQuotationProgressBar';
import { COMMERCIAL_UNDERWRITERS } from './constants';

const CommercialThirdPartyScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isCalculatingPremium, setIsCalculatingPremium] = useState(false);

  console.log('CommercialThirdPartyScreen: Component mounted with route params:', route.params);

  // Get passed data from CommercialVehicleScreen
  const { vehicleCategory, productType, productName } = route.params || {};

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Business/Personal Information
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    kraPin: '',
    businessName: '',
    businessType: '',
    
    // Step 2: Vehicle Details
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear().toString(),
    vehicleAge: 0,
    registrationNumber: '',
    chassisNumber: '',
    engineNumber: '',
    grossWeight: '',
    commercialCategory: 'general_cartage',
    commercialSubCategory: '',
    vehicleType: '',
    vehicleUsage: 'urban_delivery',
    
    // Step 3: Vehicle Value (not required for third party, but we keep for consistency)
    vehicleValue: '1000000', // Default value just for calculation purposes
    
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
  });

  // Payment state
  const [paymentState, setPaymentState] = useState({
    isProcessing: false,
    paymentInitiated: false,
    paymentCompleted: false,
    paymentError: null,
    countdown: 0,
  });

  // Premium calculation result
  const [premiumResult, setPremiumResult] = useState(null);
  
  // Update vehicle age when year changes
  useEffect(() => {
    if (formData.vehicleYear) {
      const currentYear = new Date().getFullYear();
      const vehicleYear = parseInt(formData.vehicleYear);
      const vehicleAge = currentYear - vehicleYear;
      
      setFormData({
        ...formData,
        vehicleAge: vehicleAge >= 0 ? vehicleAge : 0,
      });
    }
  }, [formData.vehicleYear]);

  // Handle premium calculation
  const handlePremiumCalculated = (result) => {
    setPremiumResult(result);
    if (result) {
      setFormData(prev => ({
        ...prev,
        totalPremium: result.totalPremium,
        paymentAmount: result.totalPremium,
      }));
    }
    setIsCalculatingPremium(false);
  };
  
  // Next step handler
  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      
      // Calculate premium when moving to insurer selection step
      if (currentStep === 3) {
        setIsCalculatingPremium(true);
      }
    }
  };

  // Previous step handler
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // Update form data
  const updateFormData = (data) => {
    setFormData({ ...formData, ...data });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // In a real app, we would submit the data to an API here
      // For now, we'll just simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful submission
      Alert.alert(
        "Quotation Submitted",
        "Your commercial third party insurance quote has been successfully generated. A PataBima agent will contact you shortly.",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('MainTabs')
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit quotation. Please try again.");
      console.error("Quotation submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Commercial Third Party Premium Calculator component
  const CommercialPremiumCalculator = ({ formData, onPremiumCalculated, isCalculating, setIsCalculating }) => {
    useEffect(() => {
      if (isCalculating) {
        calculatePremium();
      }
    }, [isCalculating]);

    const calculatePremium = async () => {
      try {
        // Basic premium calculation for commercial third party
        // For third party, premium is based on tonnage and vehicle type
        const vehicleType = formData.vehicleType || 'general';
        const tonnage = parseFloat(formData.grossWeight) || 0;
        
        // Base premium calculation
        let basicPremium = 7500; // Base premium for commercial third party
        
        // Adjust based on tonnage
        if (tonnage <= 3) {
          basicPremium = 7500;
        } else if (tonnage <= 8) {
          basicPremium = 10000;
        } else if (tonnage <= 20) {
          basicPremium = 15000;
        } else {
          basicPremium = 20000;
        }
        
        // Adjust based on vehicle category
        if (formData.commercialCategory === 'general_cartage') {
          // No additional adjustment
        } else if (formData.commercialCategory === 'own_goods') {
          basicPremium *= 0.9; // 10% discount
        } else if (formData.commercialCategory === 'special_type') {
          basicPremium *= 1.2; // 20% increase
        }
        
        // Calculate levies and taxes
        const policyHolderCompensation = 0.0025 * basicPremium; // 0.25% of basic premium
        const trainingLevy = 0.002 * basicPremium; // 0.2% of basic premium
        const stampDuty = 40; // Fixed KSh 40
        
        // Total premium
        const totalPremium = basicPremium + policyHolderCompensation + trainingLevy + stampDuty;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return premium calculation result
        onPremiumCalculated({
          basicPremium: Math.round(basicPremium),
          policyHolderCompensation: Math.round(policyHolderCompensation),
          trainingLevy: Math.round(trainingLevy),
          stampDuty: stampDuty,
          totalPremium: Math.round(totalPremium)
        });
      } catch (error) {
        console.error("Premium calculation error:", error);
        Alert.alert("Error", "Failed to calculate premium. Please try again.");
        onPremiumCalculated(null);
      }
    };

    return null; // This is a background component, no UI
  };

  // Render the correct step based on currentStep
  const renderStep = () => {
    console.log('CommercialThirdPartyScreen: Rendering step', currentStep, 'with formData:', formData);
    console.log('CommercialThirdPartyScreen: About to enter switch statement with currentStep:', currentStep);
    
    switch (currentStep) {
      case 1:
        console.log('CommercialThirdPartyScreen: Rendering step 1');
        return (
          <CommercialPersonalInformationStep
            formData={formData}
            onUpdateFormData={updateFormData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 2:
        console.log('CommercialThirdPartyScreen: Rendering step 2');
        return (
          <CommercialVehicleDetailsStep
            formData={formData}
            onUpdateFormData={updateFormData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 3:
        console.log('CommercialThirdPartyScreen: Rendering step 3');
        return (
          <CommercialVehicleValueStep
            formData={formData}
            onUpdateFormData={updateFormData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            coverageType="third_party"
            isThirdPartyOnly={true}
          />
        );
      case 4:
        console.log('CommercialThirdPartyScreen: About to render CommercialInsurerSelectionStep');
        console.log('CommercialThirdPartyScreen: updateFormData function:', updateFormData);
        console.log('CommercialThirdPartyScreen: typeof updateFormData:', typeof updateFormData);
        return (
          <CommercialInsurerSelectionStep
            formData={formData}
            onUpdateFormData={updateFormData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            premiumResult={premiumResult}
            underwriters={COMMERCIAL_UNDERWRITERS}
            coverageType="third_party"
          />
        );
      case 5:
        console.log('CommercialThirdPartyScreen: Rendering step 5');
        return (
          <CommercialPaymentStep
            formData={formData}
            onUpdateFormData={updateFormData}
            onSubmit={handleSubmit}
            onBack={handlePrevStep}
            paymentState={paymentState}
            setPaymentState={setPaymentState}
          />
        );
      default:
        console.log('CommercialThirdPartyScreen: Rendering default (null)');
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handlePrevStep}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{productName || "Commercial Third Party"}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Progress Bar */}
      <CommercialQuotationProgressBar 
        currentStep={currentStep}
        totalSteps={5}
      />
      
      {/* Main Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Calculator (hidden component) */}
          <CommercialPremiumCalculator
            formData={formData}
            onPremiumCalculated={handlePremiumCalculated}
            isCalculating={isCalculatingPremium}
            setIsCalculating={setIsCalculatingPremium}
          />
          
          {/* Current Step Content */}
          {renderStep()}
          
          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Processing your request...</Text>
            </View>
          )}
        </ScrollView>
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
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    minHeight: 400, // Ensure minimum height for content visibility
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  }
});

export default CommercialThirdPartyScreen;
