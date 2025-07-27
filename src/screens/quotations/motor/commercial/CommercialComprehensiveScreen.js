/**
 * Commercial Comprehensive Insurance Screen
 * Offers full coverage (own damage + third party liability) for commercial vehicle owners.
 * Uses Sanlam commercial underwriter rates for premium calculation (4.0% - 4.5%)
 * with a minimum premium of KSh 30,000.
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

// Import commercial reusable components
import {
  CommercialPersonalInformationStep,
  CommercialVehicleDetailsStep,
  CommercialVehicleValueStep,
  CommercialInsurerSelectionStep,
  CommercialDocumentUploadStep,
  CommercialPaymentStep,
  CommercialQuotationProgressBar,
  CommercialPremiumCalculator,
  calculateCommercialPremium,
  calculateCommercialComprehensivePremium,
  validateCommercialVehicleEligibility
} from './components';

// Import commercial underwriters data
import { COMMERCIAL_UNDERWRITERS } from './constants';

const CommercialComprehensiveScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isCalculatingPremium, setIsCalculatingPremium] = useState(false);
  const [errors, setErrors] = useState({});

  // Get passed data from CommercialVehicleScreen
  const { vehicleCategory, productType, productName } = route.params || {};
  
  // Premium calculation result
  const [premiumResult, setPremiumResult] = useState(null);

  // Form data state with commercial-specific fields
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    kraPin: '',
    businessName: '', // Commercial specific
    businessRegistrationNumber: '', // Commercial specific
    
    // Step 2: Commercial Vehicle Details
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    registrationNumber: '',
    commercialCategory: 'general_cartage', // Options: general_cartage, own_goods, special_type
    commercialSubCategory: '',
    tonnage: '', // Commercial specific - carrying capacity
    usagePattern: '', // How the vehicle is used
    goodsCarried: '', // Type of goods typically carried
    operationRadius: '', // Typical operating area
    
    // Step 3: Vehicle Value
    vehicleValue: '',
    goodsInTransitValue: '', // Commercial specific - value of goods being transported
    
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
    
    // Commercial Comprehensive specific fields
    selectedCoverageLevel: 'basic', // basic, enhanced, premium
    selectedAddons: [], // Additional coverage add-ons
    hasTracking: false, // Reduced excess if tracking device is installed
    hasFleetManagement: false, // Fleet management system integration
    hasAntiTheft: false, // Anti-theft devices installed
  });

  // Payment state
  const [paymentState, setPaymentState] = useState({
    isProcessing: false,
    paymentInitiated: false,
    paymentCompleted: false,
    paymentError: null,
    countdown: 0,
  });

  // Add-on options for commercial comprehensive insurance
  const coverageAddons = [
    {
      id: 'goods_in_transit',
      name: 'Goods In Transit',
      description: 'Coverage for goods being transported',
      rateAdjustment: 0.5, // Additional percentage
    },
    {
      id: 'driver_pa',
      name: 'Driver PA Cover',
      description: 'Personal accident cover for the driver',
      rateAdjustment: 0.25,
    },
    {
      id: 'political_violence',
      name: 'Political Violence/Terrorism',
      description: 'Coverage for damage from political violence or terrorism',
      rateAdjustment: 0.35,
    },
    {
      id: 'excess_protector',
      name: 'Excess Protector',
      description: 'Waiver of excess in case of a claim',
      rateAdjustment: 0.5,
    },
  ];

  // Update form data when values change
  const handleUpdateFormData = (newData) => {
    setFormData((prevData) => {
      const updatedData = { ...prevData, ...newData };
      
      // Calculate vehicle age if year is provided
      if (newData.vehicleYear && !isNaN(newData.vehicleYear)) {
        const currentYear = new Date().getFullYear();
        updatedData.vehicleAge = currentYear - parseInt(newData.vehicleYear);
      }
      
      return updatedData;
    });
  };
  
  // Handle premium calculation result
  const handlePremiumCalculated = (result) => {
    setPremiumResult(result);
    if (result) {
      handleUpdateFormData({
        totalPremium: result.totalPremium,
        paymentAmount: result.totalPremium,
      });
    }
    setIsCalculatingPremium(false);
  };

  // Validate current step data
  const validateStep = (step) => {
    let newErrors = {};
    let isValid = true;
    
    switch (step) {
      case 1: // Personal Information
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'Full name is required';
          isValid = false;
        }
        
        if (!formData.idNumber.trim()) {
          newErrors.idNumber = 'ID number is required';
          isValid = false;
        }
        
        if (!formData.phoneNumber.trim()) {
          newErrors.phoneNumber = 'Phone number is required';
          isValid = false;
        } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
          newErrors.phoneNumber = 'Enter a valid 10-digit phone number';
          isValid = false;
        }
        
        if (!formData.email.trim()) {
          newErrors.email = 'Email address is required';
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Enter a valid email address';
          isValid = false;
        }

        // Commercial specific validation
        if (!formData.businessName.trim()) {
          newErrors.businessName = 'Business name is required';
          isValid = false;
        }
        break;
        
      case 2: // Vehicle Details
        if (!formData.vehicleMake.trim()) {
          newErrors.vehicleMake = 'Vehicle make is required';
          isValid = false;
        }
        
        if (!formData.vehicleModel.trim()) {
          newErrors.vehicleModel = 'Vehicle model is required';
          isValid = false;
        }
        
        if (!formData.vehicleYear) {
          newErrors.vehicleYear = 'Manufacturing year is required';
          isValid = false;
        }
        
        if (!formData.registrationNumber.trim()) {
          newErrors.registrationNumber = 'Registration number is required';
          isValid = false;
        }

        if (!formData.commercialSubCategory) {
          newErrors.commercialSubCategory = 'Vehicle sub-category is required';
          isValid = false;
        }

        if (!formData.tonnage) {
          newErrors.tonnage = 'Tonnage/carrying capacity is required';
          isValid = false;
        }
        break;
        
      case 3: // Vehicle Value
        if (!formData.vehicleValue || isNaN(formData.vehicleValue) || formData.vehicleValue <= 0) {
          newErrors.vehicleValue = 'Valid vehicle value is required';
          isValid = false;
        } else {
          // Check if vehicle meets minimum insured value requirement
          const eligibilityCheck = validateCommercialVehicleEligibility(formData, 'comprehensive');
          if (!eligibilityCheck.eligible) {
            newErrors.vehicleValue = eligibilityCheck.reason;
            isValid = false;
          }
        }

        // Check goods in transit value if addon selected
        if (formData.selectedAddons.includes('goods_in_transit') && 
           (!formData.goodsInTransitValue || isNaN(formData.goodsInTransitValue))) {
          newErrors.goodsInTransitValue = 'Goods in transit value is required';
          isValid = false;
        }
        break;
        
      case 4: // Insurer Selection
        if (!formData.selectedInsurer) {
          newErrors.selectedInsurer = 'Please select an insurer';
          isValid = false;
        }
        break;
        
      case 5: // Payment
        if (formData.paymentMethod === 'mpesa' && !formData.mpesaPhoneNumber) {
          newErrors.mpesaPhoneNumber = 'M-Pesa phone number is required';
          isValid = false;
        } else if (
          formData.paymentMethod === 'mpesa' && 
          !/^\d{10}$/.test(formData.mpesaPhoneNumber.replace(/\s/g, ''))
        ) {
          newErrors.mpesaPhoneNumber = 'Enter a valid 10-digit phone number';
          isValid = false;
        }
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle next step button press
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
        
        // If moving to insurer selection step, calculate premium
        if (currentStep === 3) {
          setIsCalculatingPremium(true);
        }
      } else {
        // Process final submission
        handleSubmitQuotation();
      }
    }
  };

  // Handle back button press
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // Calculate premium quotes from all available insurers
  const calculateQuotes = () => {
    setLoading(true);
    
    try {
      // Get quotes from all insurers for comparison
      const quotes = COMMERCIAL_UNDERWRITERS.map(insurer => {
        const calculationResult = calculateCommercialPremium({
          vehicleValue: parseFloat(formData.vehicleValue),
          vehicleAge: formData.vehicleAge,
          insurer: insurer,
          insuranceType: 'comprehensive',
          vehicleCategory: 'commercial',
          commercialCategory: formData.commercialCategory,
          commercialSubCategory: formData.commercialSubCategory,
          tonnage: parseFloat(formData.tonnage) || 0,
          selectedAddons: formData.selectedAddons,
          goodsInTransitValue: parseFloat(formData.goodsInTransitValue) || 0,
          hasTracking: formData.hasTracking,
          hasFleetManagement: formData.hasFleetManagement,
          hasAntiTheft: formData.hasAntiTheft
        });
        
        return {
          insurerId: insurer.id,
          insurerName: insurer.name,
          insurerLogo: insurer.logo,
          benefits: insurer.benefits,
          premium: calculationResult.totalPremium,
          breakdown: calculationResult,
        };
      });
      
      // Sort quotes by premium amount (lowest first)
      quotes.sort((a, b) => a.premium - b.premium);
      
      // Update form data with quotes
      handleUpdateFormData({
        insurerQuotes: quotes,
      });
    } catch (error) {
      console.error('Error calculating quotes:', error);
      Alert.alert(
        'Calculation Error',
        'There was an error calculating insurance quotes. Please check your vehicle details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle final quote submission
  const handleSubmitQuotation = async () => {
    if (!validateStep(currentStep)) return;
    
    setPaymentState(prev => ({
      ...prev,
      isProcessing: true,
      paymentInitiated: true,
    }));
    
    try {
      // Mock API call to submit quotation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update payment state
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        paymentCompleted: true,
        transactionId: 'COM-' + Math.floor(Math.random() * 1000000)
      }));
      
      // Update form data
      handleUpdateFormData({
        paymentStatus: 'completed',
        transactionId: paymentState.transactionId,
      });
      
      // Show success alert
      Alert.alert(
        'Quotation Submitted',
        'Your commercial comprehensive insurance quotation has been successfully submitted. You will receive a confirmation email shortly.',
        [
          {
            text: 'View Summary',
            onPress: () => navigation.navigate('MainTabs'),
          },
          {
            text: 'Return Home',
            onPress: () => navigation.navigate('MainTabs'),
            style: 'default',
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting quotation:', error);
      
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        paymentError: 'Failed to process payment. Please try again.',
      }));
      
      Alert.alert(
        'Submission Error',
        'There was an error submitting your quotation. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Toggle an add-on in the selected list
  const toggleAddon = (addonId) => {
    handleUpdateFormData({
      selectedAddons: formData.selectedAddons.includes(addonId)
        ? formData.selectedAddons.filter(id => id !== addonId)
        : [...formData.selectedAddons, addonId]
    });
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CommercialPersonalInformationStep
            formData={formData}
            onUpdateFormData={handleUpdateFormData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case 2:
        return (
          <CommercialVehicleDetailsStep
            formData={formData}
            onUpdateFormData={handleUpdateFormData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
            errors={errors}
            setErrors={setErrors}
            isComprehensive={true}
          />
        );
      case 3:
        return (
          <CommercialVehicleValueStep
            formData={formData}
            onUpdateFormData={handleUpdateFormData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
            errors={errors}
            setErrors={setErrors}
            coverageAddons={coverageAddons}
            toggleAddon={toggleAddon}
            isComprehensive={true}
          />
        );
      case 4:
        return (
          <CommercialInsurerSelectionStep
            formData={formData}
            onUpdateFormData={handleUpdateFormData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
            premiumResult={premiumResult}
            underwriters={COMMERCIAL_UNDERWRITERS}
            coverageType="comprehensive"
            isCalculating={isCalculatingPremium}
          />
        );
      case 5:
        return (
          <CommercialPaymentStep
            formData={formData}
            onUpdateFormData={handleUpdateFormData}
            onBack={handlePreviousStep}
            onSubmit={handleSubmit}
            paymentState={paymentState}
            onUpdatePayment={setPaymentState}
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
          onPress={handlePreviousStep}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commercial Comprehensive</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Progress Bar */}
      <CommercialQuotationProgressBar 
        currentStep={currentStep} 
        totalSteps={5}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
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
          
          {loading && currentStep === 4 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Calculating best quotes...</Text>
            </View>
          ) : (
            renderCurrentStep()
          )}
          
          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navigationButton, styles.previousButton]}
              onPress={handlePreviousStep}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.primary} />
              <Text style={styles.previousButtonText}>
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navigationButton, styles.nextButton]}
              onPress={handleNextStep}
              disabled={loading && currentStep === 4}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 5 ? 'Submit Quotation' : 'Next'}
              </Text>
              <Ionicons 
                name={currentStep === 5 ? "checkbox" : "chevron-forward"} 
                size={24} 
                color={Colors.white} 
              />
            </TouchableOpacity>
          </View>
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
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
  },
  previousButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  previousButtonText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  nextButtonText: {
    marginRight: Spacing.xs,
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default CommercialComprehensiveScreen;
