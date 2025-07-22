import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Linking,
  Dimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Typography } from '../../../constants';
import {
  useMotorInsuranceForm,
  useStepperNavigation,
  useVehicleVerification,
  usePremiumCalculation,
  useDocumentUpload
} from '../../../hooks';
import {
  calculateBasicPremium,
  getVehicleAgeFactor,
  getEngineCapacityFactor,
  getMinimumPremium,
  calculateLevies,
  calculateTotalLevies,
  generatePolicyNumber
} from '../../../utils';

export default function MotorQuotationScreen({ navigation }) {
  // Safe area and responsive dimensions
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // State for vehicle category and insurance product selection
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState(null);
  const [selectedInsuranceProduct, setSelectedInsuranceProduct] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [policyNumber, setPolicyNumber] = useState(null);
  
  // Use custom hooks for better organization and reusability
  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setFormData,
    hasErrors,
    validateStep,
    coverStartDate,
    setCoverStartDate,
    showDatePicker,
    setShowDatePicker,
    handleDateChange
  } = useMotorInsuranceForm();
  
  // Stepper navigation hook
  const {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    resetSteps,
    progress,
    isFirstStep,
    isLastStep
  } = useStepperNavigation(5, validateStep);
  
  // Vehicle verification hook
  const {
    isVerifying,
    setIsVerifying,
    vehicleVerified,
    setVehicleVerified,
    verifyVehicle
  } = useVehicleVerification(setFormData);
  
  // Premium calculation hook
  const {
    calculatedPremium,
    setCalculatedPremium,
    showQuote,
    setShowQuote,
    updatePremium,
    usageTypes,
    insuranceDurations,
    insurers
  } = usePremiumCalculation(selectedVehicleCategory, selectedInsuranceProduct);
  
  // Document upload hook
  const {
    uploadedDocuments,
    setUploadedDocuments,
    uploadDocument,
    removeDocument,
    checkRequiredDocuments
  } = useDocumentUpload();

  // Vehicle Categories (Step 1)
  const vehicleCategories = [
    { 
      id: 'private', 
      name: 'Private', 
      icon: '🚗',
      description: 'Personal vehicles for private use'
    },
    { 
      id: 'commercial', 
      name: 'Commercial', 
      icon: '🚚',
      description: 'Commercial vehicles for business use'
    },
    { 
      id: 'psv', 
      name: 'PSV', 
      icon: '🚌',
      description: 'Public Service Vehicles'
    },
    { 
      id: 'motorcycle', 
      name: 'Motorcycle', 
      icon: '🏍️',
      description: 'Motorcycles and scooters'
    },
    { 
      id: 'tuktuk', 
      name: 'TukTuk', 
      icon: '🛺',
      description: 'Three-wheelers and auto-rickshaws'
    },
    { 
      id: 'special', 
      name: 'Special Classes', 
      icon: '🚛',
      description: 'Special and heavy vehicles'
    }
  ];

  // Insurance Products by Category (Step 2)
  const insuranceProducts = {
    private: {
      thirdParty: [
        { id: 'tor_private', name: 'TOR For Private', icon: '⚡', baseRate: 3.5 },
        { id: 'private_third_party', name: 'Private Third-Party', icon: '🚗', baseRate: 3.0 },
        { id: 'private_third_party_ext', name: 'Private Third-Party Extendible', icon: '🚗', baseRate: 3.2 },
        { id: 'private_motorcycle_third', name: 'Private Motorcycle Third-Party', icon: '🏍️', baseRate: 2.8 }
      ],
      comprehensive: [
        { id: 'private_comprehensive', name: 'Private Comprehensive', icon: '🛡️', baseRate: 5.0 }
      ]
    },
    commercial: {
      thirdParty: [
        { id: 'commercial_third_party', name: 'Commercial Third-Party', icon: '🚚', baseRate: 4.5 },
        { id: 'commercial_ext', name: 'Commercial Extendible', icon: '🚚', baseRate: 4.8 }
      ],
      comprehensive: [
        { id: 'commercial_comprehensive', name: 'Commercial Comprehensive', icon: '🛡️', baseRate: 6.0 }
      ]
    },
    psv: {
      thirdParty: [
        { id: 'psv_third_party', name: 'PSV Third-Party', icon: '🚌', baseRate: 6.0 },
        { id: 'matatu_cover', name: 'Matatu Cover', icon: '🚐', baseRate: 6.5 }
      ],
      comprehensive: [
        { id: 'psv_comprehensive', name: 'PSV Comprehensive', icon: '🛡️', baseRate: 8.0 }
      ]
    },
    motorcycle: {
      thirdParty: [
        { id: 'motorcycle_third_party', name: 'Motorcycle Third-Party', icon: '🏍️', baseRate: 2.8 },
        { id: 'boda_boda_cover', name: 'Boda Boda Cover', icon: '🏍️', baseRate: 4.5 }
      ],
      comprehensive: [
        { id: 'motorcycle_comprehensive', name: 'Motorcycle Comprehensive', icon: '🛡️', baseRate: 4.0 }
      ]
    },
    tuktuk: {
      thirdParty: [
        { id: 'tuktuk_third_party', name: 'TukTuk Third-Party', icon: '🛺', baseRate: 3.5 }
      ],
      comprehensive: [
        { id: 'tuktuk_comprehensive', name: 'TukTuk Comprehensive', icon: '🛡️', baseRate: 5.0 }
      ]
    },
    special: {
      thirdParty: [
        { id: 'tractor_third_party', name: 'Tractor Third-Party', icon: '🚜', baseRate: 3.0 },
        { id: 'heavy_machinery', name: 'Heavy Machinery', icon: '🏗️', baseRate: 5.5 }
      ],
      comprehensive: [
        { id: 'special_comprehensive', name: 'Special Comprehensive', icon: '🛡️', baseRate: 6.5 }
      ]
    }
  };

  // Insurance products data defined here for reference
  // (Note: Insurers, UsageTypes, and InsuranceDurations are now provided by the usePremiumCalculation hook)

  // Custom step validation functions for more specific validation logic
  // (Note: Basic step navigation is now handled by useStepperNavigation hook)

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return selectedVehicleCategory !== null; // Only category needed for Step 1
      case 2:
        return selectedInsuranceProduct !== null; // Product selection in Step 2
      case 3:
        return formData.registrationNumber && vehicleVerified;
      case 4:
        return isStep4Valid();
      case 5:
        return isStep5Valid();
      default:
        return false;
    }
  };

  const selectVehicleCategory = (category) => {
    setSelectedVehicleCategory(category);
    // Auto-advance to next step immediately after category selection
    setCurrentStep(2);
  };

  const selectInsuranceProduct = (product) => {
    setSelectedInsuranceProduct(product);
    setFormData(prev => ({
      ...prev,
      coverType: product.id
    }));
    // Auto-advance to next step after product selection
    setCurrentStep(3);
  };

  const checkExistingCover = () => {
    Alert.alert(
      'Check Existing Cover',
      'This feature will check if your vehicle has existing insurance coverage.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          // Navigate to existing cover check
          Alert.alert('Info', 'Existing cover check functionality will be implemented here.');
        }}
      ]
    );
  };

  // Enhanced AKI API Vehicle Registration Lookup is now managed by the useVehicleVerification hook
  const simulateAKILookup = (regNumber) => {
    // Use the verifyVehicle function from the hook
    verifyVehicle(regNumber, navigation);
  };

  // Document upload functionality is now managed by useDocumentUpload hook

  const captureDocument = async (documentType) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedDocuments(prev => ({
          ...prev,
          [documentType]: {
            uri: result.assets[0].uri,
            type: 'image',
            name: `${documentType}_${Date.now()}.jpg`
          }
        }));
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture document. Please try again.');
    }
  };

  const pickDocument = async (documentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedDocuments(prev => ({
          ...prev,
          [documentType]: {
            uri: result.assets[0].uri,
            type: result.assets[0].mimeType?.includes('pdf') ? 'pdf' : 'image',
            name: result.assets[0].name || `${documentType}_${Date.now()}.pdf`
          }
        }));
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // M-PESA Payment Simulation
  const processMPesaPayment = async () => {
    if (!calculatedPremium || !formData.ownerPhone) {
      Alert.alert('Error', 'Please calculate premium and provide phone number first.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Simulate M-PESA STK push
      Alert.alert(
        'M-PESA Payment',
        `An STK push has been sent to ${formData.ownerPhone} for KES ${calculatedPremium.totalPremium.toLocaleString()}. Please enter your M-PESA PIN on your phone.`,
        [{ text: 'OK' }]
      );

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate successful payment (90% success rate)
      const paymentSuccess = Math.random() > 0.1;

      if (paymentSuccess) {
        const newPolicyNumber = `POL${Date.now().toString().slice(-8)}`;
        setPolicyNumber(newPolicyNumber);
        setPaymentCompleted(true);
        // Stay on step 5 - this is the final step
        
        Alert.alert(
          'Payment Successful!',
          `Your policy has been purchased successfully. Policy Number: ${newPolicyNumber}`,
          [{ text: 'View Receipt', onPress: () => shareReceipt() }]
        );
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      Alert.alert(
        'Payment Failed',
        'Your M-PESA payment was not successful. Please try again or contact support.',
        [
          { text: 'Retry', onPress: () => processMPesaPayment() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Generate and share receipt
  const shareReceipt = async () => {
    if (!policyNumber || !calculatedPremium) return;

    const receiptText = `
PATABIMA INSURANCE RECEIPT
========================
Policy Number: ${policyNumber}
Vehicle: ${formData.make} ${formData.model}
Registration: ${formData.registrationNumber}
Owner: ${formData.ownerName}
Premium: KES ${calculatedPremium.totalPremium.toLocaleString()}
Date: ${new Date().toLocaleDateString()}
========================
Thank you for choosing PataBima!
    `;

    try {
      // In a real app, you would generate a PDF here
      Alert.alert(
        'Receipt',
        receiptText,
        [
          { text: 'Close' },
          { text: 'Share', onPress: () => {
            // Simulate sharing functionality
            Alert.alert('Share', 'Receipt sharing functionality would be implemented here.');
          }}
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate receipt.');
    }
  };

  // Update form data using our custom hook's handleChange function
  const updateFormData = (field, value) => {
    // Use the handleChange function from useMotorInsuranceForm hook
    // Pass updatePremium as the callback for premium recalculation
    handleChange(field, value, updatePremium);
  };

  // Auto Premium Calculation (triggers when insurer is selected)
  const autoCalculatePremium = (dataToUse = formData) => {
    if (!selectedInsuranceProduct || !dataToUse.vehicleValue || !dataToUse.insurer) {
      return;
    }

    const selectedInsurer = insurers.find(ins => ins.id === dataToUse.insurer);
    if (!selectedInsurer) return;

    // Set policy duration based on insurer
    setFormData(prev => ({
      ...prev,
      policyPeriod: selectedInsurer.policyDuration.toString()
    }));

    const vehicleValue = parseFloat(dataToUse.vehicleValue) || 0;
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - parseInt(dataToUse.yearOfManufacture || currentYear);
    
    // Use insurer's base rate instead of product base rate
    let premium = vehicleValue * (selectedInsurer.baseRate / 100);
    
    // Age factor
    if (vehicleAge > 10) premium *= 1.3;
    else if (vehicleAge > 5) premium *= 1.1;
    
    // Engine capacity factor
    const engineCC = parseInt(dataToUse.engineCapacity || 0);
    if (engineCC > 3000) premium *= 1.2;
    else if (engineCC > 2000) premium *= 1.1;
    
    // Usage type factor (from XML specification)
    const selectedUsageType = usageTypes.find(type => type.id === dataToUse.usageType);
    if (selectedUsageType) {
      premium *= selectedUsageType.riskMultiplier;
    }
    
    // Claims history factor
    if (dataToUse.claimsHistory === 'Yes') premium *= 1.4;
    
    // Modifications factor
    if (dataToUse.modifications === 'Yes') premium *= 1.15;
    
    // Insurance duration factor (from XML specification)
    const selectedDuration = insuranceDurations.find(dur => dur.id === dataToUse.insuranceDuration);
    if (selectedDuration) {
      premium *= selectedDuration.multiplier;
    } else {
      // Fallback to policy period factor (discount for longer periods)
      const periodMonths = selectedInsurer.policyDuration;
      if (periodMonths >= 12) premium *= 0.9; // 10% discount for annual
      else if (periodMonths >= 6) premium *= 0.95; // 5% discount for 6+ months
    }
    
    // Minimum premiums by category
    const minimumPremiums = {
      'private': 15000,
      'commercial': 25000,
      'psv': 35000,
      'motorcycle': 8000,
      'tuktuk': 12000,
      'special': 20000
    };
    
    const minPremium = minimumPremiums[selectedVehicleCategory?.id] || 15000;
    premium = Math.max(premium, minPremium);
    
    // Add statutory fees and levies
    const levies = {
      policyFee: 500,
      stampDuty: 40,
      trainingLevy: premium * 0.002, // 0.2% training levy
      pcf: premium * 0.0025 // 0.25% PCF levy
    };
    
    const totalLevies = Object.values(levies).reduce((sum, levy) => sum + levy, 0);
    const totalPremium = premium + totalLevies;
    
    setCalculatedPremium({
      basicPremium: Math.round(premium),
      levies: Math.round(totalLevies),
      totalPremium: Math.round(totalPremium),
      breakdown: {
        ...levies,
        policyFee: levies.policyFee,
        stampDuty: levies.stampDuty,
        trainingLevy: Math.round(levies.trainingLevy),
        pcf: Math.round(levies.pcf)
      },
      vehicleType: selectedVehicleCategory?.name || 'Unknown',
      coverType: selectedInsuranceProduct?.name || 'Unknown',
      vehicleAge: vehicleAge,
      insurer: selectedInsurer.name,
      policyDuration: `${selectedInsurer.policyDuration} months`,
      
      // NEW: Enhanced factors display (from XML specification)
      factors: {
        vehicleAge: `${vehicleAge} years`,
        engineCapacity: `${engineCC} CC`,
        usageType: selectedUsageType?.name || 'Not specified',
        insuranceDuration: selectedDuration?.name || `${selectedInsurer.policyDuration} months`,
        claimsHistory: dataToUse.claimsHistory,
        modifications: dataToUse.modifications,
        riskMultiplier: selectedUsageType?.riskMultiplier || 1.0,
        durationMultiplier: selectedDuration?.multiplier || 1.0
      }
    });
    
    setShowQuote(true);
  };

  // Enhanced Premium Calculation with more realistic factors
  const calculatePremium = () => {
    // Use updatePremium from our usePremiumCalculation hook
    updatePremium(formData);
  };

  // Quick test function to populate form with sample data
  const fillSampleData = () => {
    setSelectedVehicleCategory(vehicleCategories[0]); // Private
    setSelectedInsuranceProduct(insuranceProducts.private.comprehensive[0]); // Private Comprehensive
    setCurrentStep(5); // Go to documents/payment step
    setFormData({
      registrationNumber: 'KCA123A',
      vehicleType: 'private_comprehensive',
      make: 'Toyota',
      model: 'Corolla',
      yearOfManufacture: '2020',
      engineCapacity: '1500',
      vehicleValue: '2500000',
      usageType: 'private',
      insuranceDuration: '12',
      ownerName: 'John Kamau Mwangi',
      ownerIdNumber: '12345678',
      ownerPhone: '0712345678',
      ownerEmail: 'john.kamau@email.com',
      coverType: 'private_comprehensive',
      policyPeriod: '12',
      startDate: '01/01/2025',
      insurer: 'cic',
      previousInsurer: 'None',
      claimsHistory: 'No',
      modifications: 'No'
    });
    setVehicleVerified(true);
    setUploadedDocuments({
      id: { uri: 'mock_id.jpg', type: 'image', name: 'id_document.jpg' },
      logbook: { uri: 'mock_logbook.jpg', type: 'image', name: 'logbook.jpg' }
    });
  };

  // Date picker handlers - Using handleDateChange from our hook
  const onDateChange = (event, selectedDate) => {
    handleDateChange(event, selectedDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };



  // Stepper Header Component - Now Clickable
  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepperItem}>
          <TouchableOpacity
            style={[
              styles.stepperCircle,
              currentStep >= step && styles.stepperCircleActive,
              currentStep === step && styles.stepperCircleCurrent,
              paymentCompleted && step === 5 && styles.stepperCircleComplete
            ]}
            onPress={() => goToStep(step)}
            disabled={step > currentStep && !isStepValid(currentStep)}
          >
            <Text style={[
              styles.stepperNumber,
              currentStep >= step && styles.stepperNumberActive,
              paymentCompleted && step === 5 && styles.stepperNumberComplete
            ]}>          {paymentCompleted && step === 5 ? '✓' : step}
        </Text>
      </TouchableOpacity>
      {step < 5 && (
        <View style={[
          styles.stepperLine,
          currentStep > step && styles.stepperLineActive
        ]} />
      )}
        </View>
      ))}
    </View>
  );

  // OPTIMIZED Step 1: Vehicle Category Selection
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Motor Vehicle Insurance</Text>
      
      {/* Vehicle Category Selection */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
        <View style={styles.categoryGrid}>
          {vehicleCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedVehicleCategory?.id === category.id && styles.categoryCardSelected
              ]}
              onPress={() => selectVehicleCategory(category)}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              {selectedVehicleCategory?.id === category.id && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Insurance Product Selection - Shows only when category is selected */}
      {selectedVehicleCategory && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Insurance Type</Text>
          {(() => {
            const products = insuranceProducts[selectedVehicleCategory.id];
            if (!products) return null;

            return (
              <View>
                {/* Third-Party Options */}
                {products.thirdParty && products.thirdParty.length > 0 && (
                  <View style={styles.productSection}>
                    <Text style={styles.productSectionTitle}>
                      Third-Party Coverage
                    </Text>
                    <Text style={styles.productSectionDescription}>
                      Legal minimum coverage for damages to others
                    </Text>
                    <View style={styles.productGrid}>
                      {products.thirdParty.map(product => (
                        <TouchableOpacity
                          key={product.id}
                          style={[
                            styles.productCard,
                            selectedInsuranceProduct?.id === product.id && styles.productCardSelected
                          ]}
                          onPress={() => selectInsuranceProduct(product)}
                        >
                          <View style={styles.productIconContainer}>
                            <Text style={styles.productIconText}>{product.icon}</Text>
                          </View>
                          <Text style={styles.productName}>{product.name}</Text>
                          <Text style={styles.productRate}>From {product.baseRate}%</Text>
                          {selectedInsuranceProduct?.id === product.id && (
                            <View style={styles.selectedProductBadge}>
                              <Text style={styles.selectedProductBadgeText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Comprehensive Options */}
                {products.comprehensive && products.comprehensive.length > 0 && (
                  <View style={styles.productSection}>
                    <Text style={styles.productSectionTitle}>
                      Comprehensive Coverage
                    </Text>
                    <Text style={styles.productSectionDescription}>
                      Full protection including theft, fire, and own damage
                    </Text>
                    <View style={styles.productGrid}>
                      {products.comprehensive.map(product => (
                        <TouchableOpacity
                          key={product.id}
                          style={[
                            styles.productCard,
                            selectedInsuranceProduct?.id === product.id && styles.productCardSelected
                          ]}
                          onPress={() => selectInsuranceProduct(product)}
                        >
                          <Text style={styles.productIcon}>{product.icon}</Text>
                          <Text style={styles.productName}>{product.name}</Text>
                          <Text style={styles.productRate}>From {product.baseRate}%</Text>
                          {selectedInsuranceProduct?.id === product.id && (
                            <View style={styles.selectedProductBadge}>
                              <Text style={styles.selectedProductBadgeText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      )}

      {/* Check Existing Cover - moved to bottom */}
      <TouchableOpacity style={styles.existingCoverButton} onPress={checkExistingCover}>
        <View style={styles.existingCoverContent}>
          <View style={styles.existingCoverIcon}>
            <Text style={styles.existingCoverIconText}>🔍</Text>
          </View>
          <View style={styles.existingCoverTextContainer}>
            <Text style={styles.existingCoverTitle}>Check Vehicle For</Text>
            <Text style={styles.existingCoverSubtitle}>Existing Cover</Text>
          </View>
          <Text style={styles.existingCoverArrow}>→</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Step 2: Insurance Product Selection
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Insurance Type</Text>
      
      {/* Selected Vehicle Category Summary */}
      <View style={styles.selectionSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Selected Vehicle Type:</Text>
          <Text style={styles.summaryValue}>
            {selectedVehicleCategory?.icon} {selectedVehicleCategory?.name}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📋 Choose Insurance Coverage</Text>
        <Text style={styles.sectionSubtitle}>
          Select the type of insurance coverage you need for your {selectedVehicleCategory?.name?.toLowerCase()}
        </Text>
        
        {selectedVehicleCategory && (() => {
          const products = insuranceProducts[selectedVehicleCategory.id];
          if (!products) return null;

          return (
            <View>
              {/* Third-Party Options */}
              {products.thirdParty && products.thirdParty.length > 0 && (
                <View style={styles.productSection}>
                  <Text style={styles.productSectionTitle}>
                    🛡️ Third-Party Coverage
                  </Text>
                  <Text style={styles.productSectionDescription}>
                    Legal minimum coverage for damages to others
                  </Text>
                  <View style={styles.productGrid}>
                    {products.thirdParty.map(product => (
                      <TouchableOpacity
                        key={product.id}
                        style={[
                          styles.productCard,
                          selectedInsuranceProduct?.id === product.id && styles.productCardSelected
                        ]}
                        onPress={() => selectInsuranceProduct(product)}
                      >
                        <Text style={styles.productIcon}>{product.icon}</Text>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productRate}>From {product.baseRate}%</Text>
                        {selectedInsuranceProduct?.id === product.id && (
                          <View style={styles.selectedProductBadge}>
                            <Text style={styles.selectedProductBadgeText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              {/* Comprehensive Options */}
              {products.comprehensive && products.comprehensive.length > 0 && (
                <View style={styles.productSection}>
                  <Text style={styles.productSectionTitle}>
                    🛡️ Comprehensive Coverage
                  </Text>
                  <Text style={styles.productSectionDescription}>
                    Full protection including theft, fire, and own damage
                  </Text>
                  <View style={styles.productGrid}>
                    {products.comprehensive.map(product => (
                      <TouchableOpacity
                        key={product.id}
                        style={[
                          styles.productCard,
                          selectedInsuranceProduct?.id === product.id && styles.productCardSelected
                        ]}
                        onPress={() => selectInsuranceProduct(product)}
                      >
                        <Text style={styles.productIcon}>{product.icon}</Text>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productRate}>From {product.baseRate}%</Text>
                        {selectedInsuranceProduct?.id === product.id && (
                          <View style={styles.selectedProductBadge}>
                            <Text style={styles.selectedProductBadgeText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })()}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={prevStep}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.continueButton, !selectedInsuranceProduct && styles.disabledButton]}
          onPress={() => selectedInsuranceProduct && nextStep()}
          disabled={!selectedInsuranceProduct}
        >
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // OPTIMIZED Step 3: Vehicle Registration & AKI Verification (Focused)
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vehicle Registration</Text>
      
      {/* Selected Vehicle & Product Summary */}
      <View style={styles.selectionSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Vehicle Type:</Text>
          <Text style={styles.summaryValue}>{selectedVehicleCategory?.name}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Insurance:</Text>
          <Text style={styles.summaryValue}>{selectedInsuranceProduct?.name}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🚗 Vehicle Registration & Verification</Text>
        <Text style={styles.sectionSubtitle}>
          Enter your vehicle registration number for automatic details lookup
        </Text>
        
        <View style={styles.regInputContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.registrationNumber}
            onChangeText={(value) => updateFormData('registrationNumber', value)}
            placeholder="Enter registration number (e.g. KCA123A)"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.akiButton, isVerifying && styles.akiButtonDisabled]}
            onPress={() => simulateAKILookup(formData.registrationNumber)}
            disabled={isVerifying || !formData.registrationNumber}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={styles.akiButtonText}>AKI Verify</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {vehicleVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified with AKI database</Text>
          </View>
        )}

        {formData.registrationNumber && !vehicleVerified && (
          <Text style={styles.verificationHint}>
            Click "AKI Verify" to automatically fetch vehicle details
          </Text>
        )}
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={goToPrevStep}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.continueButton, (!formData.registrationNumber || !vehicleVerified) && styles.disabledButton]}
          onPress={() => (formData.registrationNumber && vehicleVerified) && goToNextStep()}
          disabled={!formData.registrationNumber || !vehicleVerified}
        >
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 3: Policy Details Form
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vehicle Details & Policy Information</Text>
      
      {/* Vehicle Details Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🚗 Vehicle Information</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Make *</Text>
            <TextInput
              style={styles.input}
              value={formData.make}
              onChangeText={(value) => updateFormData('make', value)}
              placeholder="e.g. Toyota"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Model *</Text>
            <TextInput
              style={styles.input}
              value={formData.model}
              onChangeText={(value) => updateFormData('model', value)}
              placeholder="e.g. Corolla"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Year of Manufacture *</Text>
            <TextInput
              style={styles.input}
              value={formData.yearOfManufacture}
              onChangeText={(value) => updateFormData('yearOfManufacture', value)}
              placeholder="2020"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Engine Capacity (CC) *</Text>
            <TextInput
              style={styles.input}
              value={formData.engineCapacity}
              onChangeText={(value) => updateFormData('engineCapacity', value)}
              placeholder="1500"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Vehicle Value (KES) *</Text>
          <TextInput
            style={styles.input}
            value={formData.vehicleValue}
            onChangeText={(value) => updateFormData('vehicleValue', value)}
            placeholder="2,500,000"
            keyboardType="numeric"
          />
        </View>

        {/* Usage Type Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Usage Type *</Text>
          <Text style={styles.inputHint}>Select how the vehicle will be used</Text>
          <View style={styles.radioGroup}>
            {usageTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.radioOption,
                  formData.usageType === type.id && styles.radioOptionSelected
                ]}
                onPress={() => updateFormData('usageType', type.id)}
              >
                <View style={[
                  styles.radioCircle,
                  formData.usageType === type.id && styles.radioCircleSelected
                ]} />
                <View style={styles.radioContent}>
                  <Text style={[
                    styles.radioText,
                    formData.usageType === type.id && styles.radioTextSelected
                  ]}>
                    {type.name}
                  </Text>
                  <Text style={styles.radioDescription}>{type.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Insurance Duration Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Insurance Duration *</Text>
          <Text style={styles.inputHint}>Select policy period</Text>
          <View style={styles.durationGrid}>
            {insuranceDurations.map((duration) => (
              <TouchableOpacity
                key={duration.id}
                style={[
                  styles.durationOption,
                  formData.insuranceDuration === duration.id && styles.durationOptionSelected
                ]}
                onPress={() => updateFormData('insuranceDuration', duration.id)}
              >
                <Text style={[
                  styles.durationText,
                  formData.insuranceDuration === duration.id && styles.durationTextSelected
                ]}>
                  {duration.name}
                </Text>
                <Text style={styles.durationMultiplier}>
                  {duration.multiplier === 1.0 ? 'Best Value' : `${(duration.multiplier * 100).toFixed(0)}%`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📋 Personal Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>ID Number</Text>
          <TextInput
            style={styles.input}
            value={formData.ownerIdNumber}
            onChangeText={(value) => updateFormData('ownerIdNumber', value)}
            placeholder="Enter your ID number"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.ownerName}
            onChangeText={(value) => updateFormData('ownerName', value)}
            placeholder="Enter full name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number (M-PESA) *</Text>
          <TextInput
            style={[
              styles.input,
              formData.ownerPhone && !validateKenyanPhone(formData.ownerPhone) && styles.inputError
            ]}
            value={formData.ownerPhone}
            onChangeText={(value) => updateFormData('ownerPhone', value)}
            placeholder="07XX XXX XXX"
            keyboardType="phone-pad"
          />
          {formData.ownerPhone && !validateKenyanPhone(formData.ownerPhone) && (
            <Text style={styles.errorText}>Please enter a valid Kenyan phone number (07XX XXX XXX)</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              formData.ownerEmail && !validateEmail(formData.ownerEmail) && styles.inputError
            ]}
            value={formData.ownerEmail}
            onChangeText={(value) => updateFormData('ownerEmail', value)}
            placeholder="user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {formData.ownerEmail && !validateEmail(formData.ownerEmail) && (
            <Text style={styles.errorText}>Please enter a valid email address</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cover Start Date</Text>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerText}>
              {formatDate(coverStartDate)}
            </Text>
            <Text style={styles.datePickerIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={coverStartDate}
            mode="date"
            is24Hour={true}
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Select Insurer</Text>
          <View style={styles.insurerContainer}>
            {insurers.map(insurer => (
              <TouchableOpacity
                key={insurer.id}
                style={[
                  styles.insurerOption,
                  formData.insurer === insurer.id && styles.insurerOptionSelected
                ]}
                onPress={() => updateFormData('insurer', insurer.id)}
              >
                <View style={styles.insurerHeader}>
                  <Text style={styles.insurerLogo}>{insurer.logo}</Text>
                  <View style={styles.insurerInfo}>
                    <Text style={styles.insurerName}>{insurer.name}</Text>
                    <Text style={styles.insurerRating}>⭐ {insurer.rating}</Text>
                  </View>
                </View>
                <View style={styles.insurerDetails}>
                  <Text style={styles.insurerDetail}>Duration: {insurer.policyDuration} months</Text>
                  <Text style={styles.insurerDetail}>Rate: {insurer.baseRate}%</Text>
                  {formData.insurer === insurer.id && calculatedPremium && (
                    <Text style={styles.insurerPremium}>
                      Premium: KES {calculatedPremium.totalPremium.toLocaleString()}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={prevStep}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.continueButton, !isStep4Valid() && styles.disabledButton]}
          onPress={() => isStep4Valid() && nextStep()}
          disabled={!isStep4Valid()}
        >
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 5: KYC Documents Upload
  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Upload Documents</Text>
      
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📄 Required Documents</Text>
        <Text style={styles.sectionSubtitle}>
          Upload clear, readable copies of the following documents
        </Text>
        
        <View style={styles.documentItem}>
          <Text style={styles.documentIcon}>🆔</Text>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>National ID Copy</Text>
            <Text style={styles.documentStatus}>
              {uploadedDocuments.id ? '✓ Uploaded' : 'Required'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.uploadButton,
              uploadedDocuments.id && styles.uploadButtonUploaded
            ]}
            onPress={() => uploadDocument('id')}
          >
            <Text style={[
              styles.uploadButtonText,
              uploadedDocuments.id && styles.uploadButtonTextUploaded
            ]}>
              {uploadedDocuments.id ? 'Replace' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.documentItem}>
          <Text style={styles.documentIcon}>📋</Text>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>Vehicle Logbook</Text>
            <Text style={styles.documentStatus}>
              {uploadedDocuments.logbook ? '✓ Uploaded' : 'Required'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.uploadButton,
              uploadedDocuments.logbook && styles.uploadButtonUploaded
            ]}
            onPress={() => uploadDocument('logbook')}
          >
            <Text style={[
              styles.uploadButtonText,
              uploadedDocuments.logbook && styles.uploadButtonTextUploaded
            ]}>
              {uploadedDocuments.logbook ? 'Replace' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.documentItem}>
          <Text style={styles.documentIcon}>🧾</Text>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>KRA PIN Certificate</Text>
            <Text style={styles.documentStatus}>
              {uploadedDocuments.kraPin ? '✓ Uploaded' : 'Optional'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.uploadButton,
              uploadedDocuments.kraPin && styles.uploadButtonUploaded
            ]}
            onPress={() => uploadDocument('kraPin')}
          >
            <Text style={[
              styles.uploadButtonText,
              uploadedDocuments.kraPin && styles.uploadButtonTextUploaded
            ]}>
              {uploadedDocuments.kraPin ? 'Replace' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={prevStep}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.continueButton, !calculatedPremium && styles.disabledButton]}
          onPress={() => {
            // Since this is the last step, complete the process
            if (calculatedPremium && formData.ownerPhone) {
              processMPesaPayment();
            } else {
              Alert.alert('Incomplete', 'Please complete all previous steps first.');
            }
          }}
        >
          <Text style={styles.continueButtonText}>Proceed to Payment →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Enhanced validation functions (from XML specification)
  const validateKenyanPhone = (phone) => {
    // Kenyan phone format: 07XX XXX XXX
    const cleanPhone = phone.replace(/\s/g, '');
    return /^07\d{8}$/.test(cleanPhone);
  };

  const validateEmail = (email) => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEngineCapacity = (capacity) => {
    const cc = parseInt(capacity);
    return cc >= 100 && cc <= 8000; // Reasonable range for vehicles
  };

  const validateUsageType = (usageType) => {
    return usageTypes.some(type => type.id === usageType);
  };

  const validateInsuranceDuration = (duration) => {
    return insuranceDurations.some(dur => dur.id === duration);
  };

  // OPTIMIZED Step Validation Functions for 5-step flow
  const isStep3Valid = () => {
    return formData.registrationNumber && vehicleVerified;
  };

  const isStep4Valid = () => {
    return formData.make && 
           formData.model && 
           formData.vehicleValue &&
           formData.engineCapacity &&
           validateEngineCapacity(formData.engineCapacity) &&
           formData.usageType &&
           validateUsageType(formData.usageType) &&
           formData.insuranceDuration &&
           validateInsuranceDuration(formData.insuranceDuration) &&
           formData.ownerIdNumber && 
           formData.ownerName && 
           formData.ownerPhone && 
           validateKenyanPhone(formData.ownerPhone) &&
           (!formData.ownerEmail || validateEmail(formData.ownerEmail)) &&
           formData.insurer;
  };

  const isStep5Valid = () => {
    return formData.registrationNumber && formData.make && formData.model && 
           formData.vehicleValue && formData.ownerName && formData.ownerPhone && 
           formData.insurer && calculatedPremium;
  };

  const renderFormContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1(); // Vehicle Category Selection
      case 2:
        return renderStep2(); // Insurance Product Selection  
      case 3:
        return renderStep3(); // Vehicle Registration & AKI Verification
      case 4:
        return renderStep4(); // Vehicle Details, Owner Info & Insurer
      case 5:
        return renderStep5(); // Documents & Payment
      default:
        return renderStep1();
    }
  };
  const renderQuoteModal = () => (
    <Modal
      visible={showQuote}
      animationType="slide"
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.quoteModal}>
            <Text style={styles.quoteTitle}>📋 Insurance Quote</Text>

            {calculatedPremium && (
              <>
                {/* Vehicle Summary */}
                <View style={styles.quoteSection}>
                  <Text style={styles.quoteSectionTitle}>Vehicle Details</Text>
                  <Text style={styles.quoteText}>Registration: {formData.registrationNumber}</Text>
                  <Text style={styles.quoteText}>Vehicle: {formData.make} {formData.model} ({formData.yearOfManufacture})</Text>
                  <Text style={styles.quoteText}>Type: {calculatedPremium.vehicleType}</Text>
                  <Text style={styles.quoteText}>Coverage: {calculatedPremium.coverType}</Text>
                  <Text style={styles.quoteText}>Value: KES {parseInt(formData.vehicleValue).toLocaleString()}</Text>
                </View>

                {/* Premium Breakdown */}
                <View style={styles.quoteSection}>
                  <Text style={styles.quoteSectionTitle}>Premium Breakdown</Text>
                  <View style={styles.premiumRow}>
                    <Text style={styles.premiumLabel}>Basic Premium:</Text>
                    <Text style={styles.premiumValue}>KES {calculatedPremium.basicPremium.toLocaleString()}</Text>
                  </View>
                  <View style={styles.premiumRow}>
                    <Text style={styles.premiumLabel}>Policy Fee:</Text>
                    <Text style={styles.premiumValue}>KES {calculatedPremium.breakdown.policyFee.toLocaleString()}</Text>
                  </View>
                  <View style={styles.premiumRow}>
                    <Text style={styles.premiumLabel}>Stamp Duty:</Text>
                    <Text style={styles.premiumValue}>KES {calculatedPremium.breakdown.stampDuty.toLocaleString()}</Text>
                  </View>
                  <View style={styles.premiumRow}>
                    <Text style={styles.premiumLabel}>Training Levy:</Text>
                    <Text style={styles.premiumValue}>KES {calculatedPremium.breakdown.trainingLevy.toLocaleString()}</Text>
                  </View>
                  <View style={styles.premiumRow}>
                    <Text style={styles.premiumLabel}>PCF:</Text>
                    <Text style={styles.premiumValue}>KES {calculatedPremium.breakdown.pcf.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.premiumRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Premium:</Text>
                    <Text style={styles.totalValue}>KES {calculatedPremium.totalPremium.toLocaleString()}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.quoteActions}>
              <TouchableOpacity 
                style={styles.quoteCloseButton}
                onPress={() => setShowQuote(false)}
              >
                <Text style={styles.quoteCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );


  // Step 5: KYC Documents Upload
  const renderStep7 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Upload Documents</Text>
      
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📄 Required Documents</Text>
        <Text style={styles.sectionSubtitle}>
          Upload clear, readable copies of the following documents
        </Text>
        
        <View style={styles.documentItem}>
          <Text style={styles.documentIcon}>🆔</Text>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>National ID Copy</Text>
            <Text style={styles.documentStatus}>
              {uploadedDocuments.id ? '✓ Uploaded' : 'Required'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.uploadButton,
              uploadedDocuments.id && styles.uploadButtonUploaded
            ]}
            onPress={() => uploadDocument('id')}
          >
            <Text style={[
              styles.uploadButtonText,
              uploadedDocuments.id && styles.uploadButtonTextUploaded
            ]}>
              {uploadedDocuments.id ? 'Replace' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.documentItem}>
          <Text style={styles.documentIcon}>📋</Text>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>Vehicle Logbook</Text>
            <Text style={styles.documentStatus}>
              {uploadedDocuments.logbook ? '✓ Uploaded' : 'Required'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.uploadButton,
              uploadedDocuments.logbook && styles.uploadButtonUploaded
            ]}
            onPress={() => uploadDocument('logbook')}
          >
            <Text style={[
              styles.uploadButtonText,
              uploadedDocuments.logbook && styles.uploadButtonTextUploaded
            ]}>
              {uploadedDocuments.logbook ? 'Replace' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.documentItem}>
          <Text style={styles.documentIcon}>🧾</Text>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>KRA PIN Certificate</Text>
            <Text style={styles.documentStatus}>
              {uploadedDocuments.kraPin ? '✓ Uploaded' : 'Optional'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.uploadButton,
              uploadedDocuments.kraPin && styles.uploadButtonUploaded
            ]}
            onPress={() => uploadDocument('kraPin')}
          >
            <Text style={[
              styles.uploadButtonText,
              uploadedDocuments.kraPin && styles.uploadButtonTextUploaded
            ]}>
              {uploadedDocuments.kraPin ? 'Replace' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={prevStep}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={nextStep}
        >
          <Text style={styles.continueButtonText}>Continue to Payment →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 6: Payment
  const renderStep8 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Premium & Payment</Text>
      
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📊 Policy Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Vehicle:</Text>
          <Text style={styles.summaryValue}>{formData.make} {formData.model}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Registration:</Text>
          <Text style={styles.summaryValue}>{formData.registrationNumber}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Coverage:</Text>
          <Text style={styles.summaryValue}>{selectedInsuranceProduct?.name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Insurer:</Text>
          <Text style={styles.summaryValue}>{insurers.find(ins => ins.id === formData.insurer)?.name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration:</Text>
          <Text style={styles.summaryValue}>{formData.policyPeriod} months</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Owner:</Text>
          <Text style={styles.summaryValue}>{formData.ownerName}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Phone:</Text>
          <Text style={styles.summaryValue}>{formData.ownerPhone}</Text>
        </View>
      </View>

      {calculatedPremium ? (
        <View>
          <View style={styles.premiumCard}>
            <Text style={styles.premiumTitle}>💰 Premium Breakdown</Text>
            <View style={styles.premiumRow}>
              <Text style={styles.premiumLabel}>Basic Premium:</Text>
              <Text style={styles.premiumValue}>KES {calculatedPremium.basicPremium.toLocaleString()}</Text>
            </View>
            <View style={styles.premiumRow}>
              <Text style={styles.premiumLabel}>Levies & Fees:</Text>
              <Text style={styles.premiumValue}>KES {calculatedPremium.levies.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={[styles.premiumRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Premium:</Text>
              <Text style={styles.totalValue}>KES {calculatedPremium.totalPremium.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.payButton, isProcessingPayment && styles.disabledButton]}
            onPress={processMPesaPayment}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <View style={styles.payButtonContent}>
                <ActivityIndicator size="small" color={Colors.background} />
                <Text style={styles.payButtonText}>Processing Payment...</Text>
              </View>
            ) : (
              <Text style={styles.payButtonText}>Pay with M-PESA</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.premiumPlaceholder}>
          <Text style={styles.premiumPlaceholderText}>
            Premium will be calculated automatically when you select an insurer and fill in vehicle details.
          </Text>
        </View>
      )}

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={prevStep}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 7: Confirmation & Receipt
  const renderStep9 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Policy Purchased Successfully!</Text>
        <Text style={styles.successSubtitle}>
          Your motor vehicle insurance policy is now active
        </Text>

        <View style={styles.policyCard}>
          <Text style={styles.policyCardTitle}>📋 Policy Details</Text>
          
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Policy Number:</Text>
            <Text style={styles.policyValue}>{policyNumber}</Text>
          </View>
          
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Vehicle:</Text>
            <Text style={styles.policyValue}>{formData.make} {formData.model}</Text>
          </View>
          
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Registration:</Text>
            <Text style={styles.policyValue}>{formData.registrationNumber}</Text>
          </View>
          
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Coverage:</Text>
            <Text style={styles.policyValue}>{selectedInsuranceProduct?.name}</Text>
          </View>
          
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Insurer:</Text>
            <Text style={styles.policyValue}>{insurers.find(ins => ins.id === formData.insurer)?.name}</Text>
          </View>
          
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Premium Paid:</Text>
            <Text style={styles.policyValue}>KES {calculatedPremium?.totalPremium.toLocaleString()}</Text>
          </View>
          
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Start Date:</Text>
            <Text style={styles.policyValue}>{formData.startDate || new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.receiptButton}
            onPress={shareReceipt}
          >
            <Text style={styles.receiptButtonText}>📄 View Receipt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeButtonText}>🏠 Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Vehicle Insurance</Text>
          {currentStep > 1 && selectedVehicleCategory && (
            <Text style={styles.headerSubtitle}>{selectedVehicleCategory.name}</Text>
          )}
        </View>
        <TouchableOpacity onPress={fillSampleData} style={styles.testButton}>
          <Text style={styles.testButtonText}>Test</Text>
        </TouchableOpacity>
      </View>

      {/* Stepper */}
      {renderStepper()}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
      >
        {renderFormContent()}
      </ScrollView>

      {renderQuoteModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackIcon: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  testButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl * 2,
  },
  formContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerSection: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  formTitle: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  regInputContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: '#FAFBFC',
  },
  akiButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  akiButtonDisabled: {
    backgroundColor: Colors.backgroundGray,
  },
  akiButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  verifiedBadge: {
    backgroundColor: '#D4F6D4',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#2D7D32',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  vehicleTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FAFBFC',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  selectedVehicleType: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  vehicleTypeName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  selectedVehicleTypeName: {
    color: Colors.primary,
  },
  vehicleTypeRate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  
  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FAFBFC',
  },
  datePickerText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  datePickerIcon: {
    fontSize: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfInput: {
    flex: 1,
  },
  coverageOption: {
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#FAFBFC',
  },
  selectedCoverage: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  coverageContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  coverageName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  selectedCoverageName: {
    color: Colors.primary,
  },
  coverageDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F4',
    borderRadius: 12,
    padding: 4,
    marginTop: Spacing.sm,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleOptionSelected: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  toggleTextSelected: {
    color: Colors.background,
  },
  calculatePremiumButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#E9ECEF',
    shadowOpacity: 0,
    elevation: 0,
  },
  calculateButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  quoteModal: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.xl,
    margin: Spacing.lg,
    maxHeight: '90%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  quoteTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  quoteSection: {
    marginBottom: Spacing.lg,
  },
  quoteSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  quoteText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  premiumBreakdown: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  premiumLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  premiumValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  subSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: Spacing.md,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  quoteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  closeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },

  // Stepper Styles (MINIMAL PADDING)
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, // Further reduced padding
    paddingHorizontal: 12, // Further reduced padding
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  stepperItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperCircle: {
    width: 24, // Further reduced size
    height: 24, // Further reduced size
    borderRadius: 12, // Further reduced radius
    backgroundColor: '#F1F3F4',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCircleActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  stepperCircleCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepperNumber: {
    fontSize: Typography.fontSize.xs, // Reduced from sm
    fontFamily: Typography.fontFamily.semiBold,
    color: '#9E9E9E',
  },
  stepperNumberActive: {
    color: Colors.background,
  },
  stepperLine: {
    width: 16, // Reduced from 24
    height: 2,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 2, // Reduced from 4
  },
  stepperLineActive: {
    backgroundColor: Colors.primary,
  },
  
  // Step Container (REDUCED PADDING)
  stepContainer: {
    flex: 1,
    padding: 12, // Significantly reduced padding
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  
  // Section Card - ENHANCED STYLING
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  regInputContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: '#FAFBFC',
  },
  akiButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  akiButtonDisabled: {
    backgroundColor: Colors.backgroundGray,
  },
  akiButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  verifiedBadge: {
    backgroundColor: '#D4F6D4',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#2D7D32',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  vehicleTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FAFBFC',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  selectedVehicleType: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  vehicleTypeName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  selectedVehicleTypeName: {
    color: Colors.primary,
  },
  vehicleTypeRate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  
  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FAFBFC',
  },
  datePickerText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  datePickerIcon: {
    fontSize: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfInput: {
    flex: 1,
  },
  coverageOption: {
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#FAFBFC',
  },
  selectedCoverage: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  coverageContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  coverageName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  selectedCoverageName: {
    color: Colors.primary,
  },
  coverageDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F4',
    borderRadius: 12,
    padding: 4,
    marginTop: Spacing.sm,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleOptionSelected: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  toggleTextSelected: {
    color: Colors.background,
  },
  calculatePremiumButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#E9ECEF',
    shadowOpacity: 0,
    elevation: 0,
  },
  calculateButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  quoteModal: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.xl,
    margin: Spacing.lg,
    maxHeight: '90%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  quoteTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  quoteSection: {
    marginBottom: Spacing.lg,
  },
  quoteSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  quoteText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  premiumBreakdown: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  premiumLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  premiumValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  subSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: Spacing.md,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  quoteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  closeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },

  // Stepper Styles (MINIMAL PADDING)
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, // Further reduced padding
    paddingHorizontal: 12, // Further reduced padding
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  stepperItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperCircle: {
    width: 24, // Further reduced size
    height: 24, // Further reduced size
    borderRadius: 12, // Further reduced radius
    backgroundColor: '#F1F3F4',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCircleActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  stepperCircleCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepperNumber: {
    fontSize: Typography.fontSize.xs, // Reduced from sm
    fontFamily: Typography.fontFamily.semiBold,
    color: '#9E9E9E',
  },
  stepperNumberActive: {
    color: Colors.background,
  },
  stepperLine: {
    width: 16, // Reduced from 24
    height: 2,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 2, // Reduced from 4
  },
  stepperLineActive: {
    backgroundColor: Colors.primary,
  },
  
  // Step Container (REDUCED PADDING)
  stepContainer: {
    flex: 1,
    padding: 12, // Significantly reduced padding
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  
  // Section Card - ENHANCED STYLING
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  regInputContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: '#FAFBFC',
  },
  akiButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  akiButtonDisabled: {
    backgroundColor: Colors.backgroundGray,
  },
  akiButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  verifiedBadge: {
    backgroundColor: '#D4F6D4',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#2D7D32',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  vehicleTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FAFBFC',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  selectedVehicleType: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  vehicleTypeName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  selectedVehicleTypeName: {
    color: Colors.primary,
  },
  vehicleTypeRate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  
  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FAFBFC',
  },
  datePickerText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  datePickerIcon: {
    fontSize: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfInput: {
    flex: 1,
  },
  coverageOption: {
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#FAFBFC',
  },
  selectedCoverage: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  coverageContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  coverageName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  selectedCoverageName: {
    color: Colors.primary,
  },
  coverageDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F4',
    borderRadius: 12,
    padding: 4,
    marginTop: Spacing.sm,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleOptionSelected: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  toggleTextSelected: {
    color: Colors.background,
  },
  calculatePremiumButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#E9ECEF',
    shadowOpacity: 0,
    elevation: 0,
  },
  calculateButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  quoteModal: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.xl,
    margin: Spacing.lg,
    maxHeight: '90%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  quoteTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  quoteSection: {
    marginBottom: Spacing.lg,
  },
  quoteSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  quoteText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  premiumBreakdown: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  premiumLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  premiumValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  subSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: Spacing.md,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  quoteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  closeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },

  // Product section styles - NEW IMPROVED STYLING
  productSection: {
    marginBottom: Spacing.lg,
  },
  productSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  productSectionDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productCardSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  productIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  productIconText: {
    fontSize: 22,
    color: Colors.primary,
  },
  productName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  productRate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  selectedProductBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 3,
  },
  selectedProductBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs - 1,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: 14,
  },
});