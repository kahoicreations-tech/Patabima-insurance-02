/**
 * Commercial TPFT (Third Party, Fire and Theft) Insurance Screen
 * Provides coverage for third party liability plus fire and theft protection
 * for commercial vehicles.
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
import CommercialInsurerSelectionStep from './components/CommercialInsurerSelectionStep';
import CommercialDocumentUploadStep from './components/CommercialDocumentUploadStep';
import CommercialPaymentStep from './components/CommercialPaymentStep';
import CommercialQuotationProgressBar from './components/CommercialQuotationProgressBar';
import { COMMERCIAL_UNDERWRITERS } from './constants';

const CommercialTPFTScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isCalculatingPremium, setIsCalculatingPremium] = useState(false);

  // Get passed data from CommercialVehicleScreen
  const { vehicleCategory, productType, productName } = route.params || {};
  
  // Premium calculation result
  const [premiumResult, setPremiumResult] = useState(null);

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
    
    // Step 3: Vehicle Value
    vehicleValue: '',
    
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
    
    // Security details (required for TPFT)
    hasTracking: false,
    trackingCompany: '',
    hasAntiTheft: false,
    antiTheftSystem: '',
    
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
    // Validate current step (example validation logic)
    let isValid = true;
    let errorMessage = '';
    
    switch (currentStep) {
      case 1: // Personal information
        if (!formData.fullName || !formData.phoneNumber) {
          isValid = false;
          errorMessage = 'Please fill in all required personal information fields.';
        }
        break;
      case 2: // Vehicle details
        if (!formData.vehicleMake || !formData.vehicleModel || !formData.registrationNumber) {
          isValid = false;
          errorMessage = 'Please fill in all required vehicle details.';
        }
        break;
      case 3: // Vehicle value
        if (!formData.vehicleValue || parseFloat(formData.vehicleValue) <= 0) {
          isValid = false;
          errorMessage = 'Please enter a valid vehicle value.';
        }
        
        // TPFT requires security systems
        if (!formData.hasTracking && !formData.hasAntiTheft) {
          isValid = false;
          errorMessage = 'TPFT coverage requires at least one security system (tracking or anti-theft).';
        }
        break;
    }
    
    if (!isValid) {
      Alert.alert('Validation Error', errorMessage);
      return;
    }
    
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
        "Your commercial TPFT insurance quote has been successfully generated. A PataBima agent will contact you shortly.",
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

  // Commercial TPFT Premium Calculator component
  const CommercialPremiumCalculator = ({ formData, onPremiumCalculated, isCalculating, setIsCalculating }) => {
    useEffect(() => {
      if (isCalculating) {
        calculatePremium();
      }
    }, [isCalculating]);

    const calculatePremium = async () => {
      try {
        // Basic premium calculation for commercial TPFT
        // Typically 3.5-4.0% of vehicle value with minimum premium of KSh 25,000
        const vehicleValue = parseFloat(formData.vehicleValue) || 0;
        const vehicleAge = formData.vehicleAge || 0;
        
        // Determine rate based on vehicle age
        let rate = 0.035; // 3.5% base rate
        
        if (vehicleAge > 5) {
          rate = 0.040; // 4.0% for vehicles older than 5 years
        }
        
        // Calculate basic premium
        let basicPremium = vehicleValue * rate;
        
        // Enforce minimum premium
        const minimumPremium = 25000;
        basicPremium = Math.max(basicPremium, minimumPremium);
        
        // Security discount
        let securityDiscount = 0;
        if (formData.hasTracking) {
          securityDiscount += 0.10; // 10% discount for tracking system
        }
        if (formData.hasAntiTheft) {
          securityDiscount += 0.05; // 5% discount for anti-theft system
        }
        
        // Apply security discount (cap at 15%)
        securityDiscount = Math.min(securityDiscount, 0.15);
        basicPremium = basicPremium * (1 - securityDiscount);
        
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
          totalPremium: Math.round(totalPremium),
          rate: rate * 100, // Convert to percentage for display
          securityDiscount: securityDiscount * 100, // Convert to percentage for display
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
    switch (currentStep) {
      case 1:
        return (
          <CommercialPersonalInformationStep
            formData={formData}
            onUpdateFormData={updateFormData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 2:
        return (
          <CommercialVehicleDetailsStep
            formData={formData}
            onUpdateFormData={updateFormData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 3:
        return (
          <CommercialVehicleValueStep
            formData={formData}
            onUpdateFormData={updateFormData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            insuranceType="tpft"
            validateVehicle={(data) => true} // Simplified validation
            showSecurityOptions={true}
          />
        );
      case 4:
        return (
          <CommercialInsurerSelectionStep
            formData={formData}
            onUpdateFormData={updateFormData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            premiumResult={premiumResult}
            underwriters={COMMERCIAL_UNDERWRITERS}
            coverageType="tpft"
          />
        );
      case 5:
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
        <Text style={styles.headerTitle}>{productName || "Commercial TPFT"}</Text>
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
    padding: Spacing.md,
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

export default CommercialTPFTScreen;
