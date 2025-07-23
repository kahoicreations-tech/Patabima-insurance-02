/**
 * Private Motorcycle Insurance Screen
 * 
 * This screen handles the Private motorcycle insurance 
 * quotation flow for private individual motorcycle owners
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

// Import motorcycle insurer data (using third party for now)
import { THIRD_PARTY_UNDERWRITERS } from '../../../../data/thirdPartyMotorData';

const PrivateMotorcycleScreen = ({ navigation, route }) => {
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
    
    // Step 2: Vehicle Details (motorcycle specific)
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    registrationNumber: '',
    engineCapacity: '', // CC for motorcycles
    motorcycleType: '', // Standard, Sports, Cruiser, etc.
    
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
    
    // Motorcycle specific fields
    selectedCoverageType: 'third_party', // third_party, comprehensive
    hasHelmet: false,
    hasAntiTheft: false,
    hasPillion: false, // Carries passengers
    useType: 'personal', // personal, commercial
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
  
  // Motorcycle types for selection
  const MOTORCYCLE_TYPES = [
    { id: 'standard', name: 'Standard', description: 'Regular commuter motorcycle' },
    { id: 'sports', name: 'Sports', description: 'High-performance sports bike' },
    { id: 'cruiser', name: 'Cruiser', description: 'Comfortable touring motorcycle' },
    { id: 'scooter', name: 'Scooter', description: 'Automatic transmission scooter' },
    { id: 'dirt_bike', name: 'Dirt Bike', description: 'Off-road motorcycle' },
    { id: 'moped', name: 'Moped', description: 'Low-power urban transport' }
  ];

  // Motorcycle coverage types
  const MOTORCYCLE_COVERAGE_TYPES = [
    {
      id: 'third_party',
      name: 'Third Party Only',
      rate: 2.5,
      description: 'Mandatory third party liability coverage only',
      features: [
        'Third party injury cover',
        'Third party property damage',
        'Legal liability protection',
        'Basic towing service'
      ]
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive',
      rate: 4.5,
      description: 'Full protection including own damage and theft',
      features: [
        'All Third Party features',
        'Own damage coverage',
        'Theft and fire protection',
        'Personal accident cover',
        'Helmet replacement'
      ]
    }
  ];

  // Fixed motorcycle coverage amounts
  const MOTORCYCLE_COVERAGE = {
    thirdPartyLiability: 'Unlimited as per law',
    ownDamage: 'Up to motorcycle value',
    theft: 'Up to motorcycle value',
    personalAccident: 'KSh 500,000',
    helmetReplacement: 'KSh 10,000'
  };

  // Create motorcycle insurers from existing data
  const motorcycleInsurers = THIRD_PARTY_UNDERWRITERS?.map(underwriter => ({
    id: underwriter.id + '_mc',
    name: underwriter.name,
    logo: underwriter.logo,
    rate: 2.5, // Lower rate for motorcycles
    baseMinimum: 15000, // Lower minimum for motorcycles
    maxVehicleAge: 20, // Higher age limit for motorcycles
    features: [
      'Motorcycle Coverage',
      'Third Party Liability',
      'Own Damage (if comprehensive)',
      'Personal Accident Cover',
      'Theft Protection',
      'Emergency Assistance'
    ],
    color: getInsurerColor(underwriter.id),
    pricingLogic: underwriter.pricingLogic,
    statutoryLevies: underwriter.statutoryLevies,
    isOfficial: true,
    supportsMotorcycle: true
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
          id: 'POL345678',
          registrationNumber: 'KCB789D',
          insurerName: 'Britam Insurance',
          policyType: 'Motorcycle Third Party',
          startDate: '2024-02-20',
          endDate: '2025-02-19',
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
          validationMessage: `Motorcycle is currently insured with ${existingPolicy.insurerName} until ${endDate.toLocaleDateString()}`,
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
          validationMessage: 'No active insurance found for this motorcycle',
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

  // Calculate motorcycle premium
  const calculateMotorcyclePremium = (insurer) => {
    try {
      const vehicleValue = formData.vehicleValue ? 
        parseFloat(formData.vehicleValue.replace(/[^0-9.]/g, '')) : 
        100000; // Lower minimum value for motorcycles

      // Base rate depends on coverage type
      let baseRate = insurer.rate;
      if (formData.selectedCoverageType === 'comprehensive') {
        baseRate = 4.5; // Higher rate for comprehensive
      }

      // Calculate base premium using motor premium calculator
      const calculation = calculateMotorPremium({
        vehicleValue: vehicleValue,
        vehicleAge: formData.vehicleAge,
        insurer: {
          id: insurer.id,
          name: insurer.name,
          rate: baseRate,
          baseMinimum: insurer.baseMinimum,
          maxVehicleAge: insurer.maxVehicleAge,
          statutoryLevies: insurer.statutoryLevies || {
            policyholdersFund: 0.25,
            trainingLevy: 0.2,
            stampDuty: 40
          }
        },
        insuranceType: formData.selectedCoverageType === 'comprehensive' ? 'Comprehensive' : 'ThirdParty',
        vehicleCategory: 'Motorcycle'
      });

      // Apply motorcycle-specific factors
      let adjustmentFactor = 1.0;
      
      // Engine capacity adjustment
      const engineCC = parseInt(formData.engineCapacity) || 150;
      if (engineCC > 500) {
        adjustmentFactor += 0.3; // 30% increase for large bikes
      } else if (engineCC > 250) {
        adjustmentFactor += 0.15; // 15% increase for mid-size bikes
      }

      // Usage type adjustment
      if (formData.useType === 'commercial') {
        adjustmentFactor += 0.5; // 50% increase for commercial use
      }

      // Safety feature discounts
      if (formData.hasHelmet) adjustmentFactor -= 0.05; // 5% discount for helmet
      if (formData.hasAntiTheft) adjustmentFactor -= 0.1; // 10% discount for anti-theft

      const adjustedPremium = calculation.totalPremium * adjustmentFactor;

      return {
        isEligible: true,
        totalPremium: adjustedPremium,
        basePremium: calculation.finalBasePremium,
        adjustmentFactor: adjustmentFactor,
        levies: calculation.levies,
        vehicleValue: vehicleValue,
        message: ''
      };
    } catch (error) {
      console.error('Motorcycle premium calculation error:', error);
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
      formData.selectedCoverageType === 'comprehensive' ? 'Comprehensive' : 'ThirdParty'
    );

    if (!eligibility.isEligible) {
      return {
        isEligible: false,
        totalPremium: 0,
        message: eligibility.message
      };
    }

    return calculateMotorcyclePremium(insurer);
  };

  // Handle insurer selection and premium calculation
  const handleInsurerSelection = (updates) => {
    updateFormData(updates);
    
    if (updates.selectedInsurer) {
      const selectedInsurer = motorcycleInsurers.find(i => i.id === updates.selectedInsurer);
      if (selectedInsurer) {
        const calculation = calculateMotorcyclePremium(selectedInsurer);
        
        const quote = {
          basePremium: calculation.basePremium,
          adjustmentFactor: calculation.adjustmentFactor,
          policyholdersFund: calculation.levies?.policyholdersFund || 0,
          trainingLevy: calculation.levies?.trainingLevy || 0,
          stampDuty: calculation.levies?.stampDuty || 40,
          totalPremium: calculation.totalPremium,
          vehicleValue: calculation.vehicleValue,
          coverageType: formData.selectedCoverageType === 'comprehensive' ? 'Comprehensive' : 'Third Party',
          coverageAmounts: MOTORCYCLE_COVERAGE,
          engineCapacity: formData.engineCapacity,
          useType: formData.useType,
          safetyFeatures: {
            hasHelmet: formData.hasHelmet,
            hasAntiTheft: formData.hasAntiTheft,
            hasPillion: formData.hasPillion
          },
          underwriterRef: selectedInsurer.id,
          calculationDate: new Date().toISOString(),
          rateSource: 'Official Motorcycle Underwriter Rates'
        };

        updateFormData({ 
          selectedQuote: quote, 
          totalPremium: quote.totalPremium,
          paymentAmount: quote.totalPremium + 25 // Lower service fee for motorcycles
        });
      }
    }
  };
  
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.fullName && formData.idNumber && formData.phoneNumber;
      case 2:
        return formData.vehicleMake && formData.vehicleModel && formData.vehicleYear && formData.registrationNumber && formData.engineCapacity;
      case 3:
        return formData.vehicleValue && parseFloat(formData.vehicleValue.replace(/[^0-9.]/g, '')) >= 50000;
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
      
      const transactionId = `MC${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
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
        `Your Motorcycle insurance payment of KSh ${formData.paymentAmount?.toLocaleString()} has been confirmed.\n\nTransaction ID: ${formData.transactionId}`,
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
        'Motorcycle Insurance Policy Issued',
        `Your Motorcycle insurance policy has been successfully issued.\n\nPolicy ID: MC${Date.now()}\nTotal Premium: KSh ${formData.totalPremium?.toLocaleString()}\nTransaction ID: ${formData.transactionId}\n\nCoverage: ${formData.selectedCoverageType === 'comprehensive' ? 'Comprehensive' : 'Third Party'}\nValid for 1 year from policy start date.`,
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
            customFields={
              <View style={styles.motorcycleFields}>
                <Text style={styles.fieldLabel}>Engine Capacity (CC) *</Text>
                <TouchableOpacity
                  style={[styles.inputField, !formData.engineCapacity && styles.inputError]}
                  onPress={() => {
                    Alert.prompt(
                      'Engine Capacity',
                      'Enter your motorcycle\'s engine capacity in CC:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'OK', 
                          onPress: (value) => {
                            if (value && !isNaN(value) && parseInt(value) > 0) {
                              updateFormData({ engineCapacity: value });
                            }
                          }
                        }
                      ],
                      'plain-text',
                      formData.engineCapacity
                    );
                  }}
                >
                  <Text style={[styles.inputText, !formData.engineCapacity && styles.placeholderText]}>
                    {formData.engineCapacity ? `${formData.engineCapacity} CC` : 'Select engine capacity'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>Motorcycle Type</Text>
                <TouchableOpacity
                  style={styles.inputField}
                  onPress={() => {
                    Alert.alert(
                      'Motorcycle Type',
                      'Select your motorcycle type:',
                      MOTORCYCLE_TYPES.map(type => ({
                        text: type.name,
                        onPress: () => updateFormData({ motorcycleType: type.id })
                      })).concat([{ text: 'Cancel', style: 'cancel' }])
                    );
                  }}
                >
                  <Text style={[styles.inputText, !formData.motorcycleType && styles.placeholderText]}>
                    {formData.motorcycleType ? 
                      MOTORCYCLE_TYPES.find(t => t.id === formData.motorcycleType)?.name : 
                      'Select motorcycle type'
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            }
          />
        );
      case 3:
        return (
          <VehicleValueStep
            formData={formData}
            onUpdateFormData={updateFormData}
            vehicleAge={formData.vehicleAge}
            enableEstimation={false}
            minimumValue={50000}
            customInfo={
              <View style={styles.motorcycleInfo}>
                <View style={styles.infoHeader}>
                  <Ionicons name="bicycle" size={20} color={Colors.primary} />
                  <Text style={styles.infoTitle}>Motorcycle Insurance Options</Text>
                </View>
                <Text style={styles.infoText}>
                  Choose the right insurance coverage for your motorcycle. We offer both third party 
                  and comprehensive coverage options.
                </Text>
                
                {/* Coverage Type Selection */}
                <Text style={styles.sectionTitle}>Coverage Type:</Text>
                {MOTORCYCLE_COVERAGE_TYPES.map((coverage) => (
                  <TouchableOpacity
                    key={coverage.id}
                    style={[
                      styles.coverageOption,
                      formData.selectedCoverageType === coverage.id && styles.coverageSelected
                    ]}
                    onPress={() => updateFormData({ selectedCoverageType: coverage.id })}
                  >
                    <View style={styles.coverageCheckbox}>
                      {formData.selectedCoverageType === coverage.id ? (
                        <Ionicons name="radio-button-on" size={20} color={Colors.primary} />
                      ) : (
                        <Ionicons name="radio-button-off" size={20} color={Colors.textMuted} />
                      )}
                    </View>
                    <View style={styles.coverageDetails}>
                      <View style={styles.coverageHeader}>
                        <Text style={styles.coverageName}>{coverage.name}</Text>
                        <Text style={styles.coverageRate}>{coverage.rate}% rate</Text>
                      </View>
                      <Text style={styles.coverageDescription}>{coverage.description}</Text>
                      <View style={styles.featuresList}>
                        {coverage.features.map((feature, index) => (
                          <Text key={index} style={styles.feature}>• {feature}</Text>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Usage Type */}
                <Text style={styles.sectionTitle}>Usage Type:</Text>
                <View style={styles.usageOptions}>
                  <TouchableOpacity
                    style={[styles.usageOption, formData.useType === 'personal' && styles.usageSelected]}
                    onPress={() => updateFormData({ useType: 'personal' })}
                  >
                    <Ionicons 
                      name={formData.useType === 'personal' ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={formData.useType === 'personal' ? Colors.primary : Colors.textMuted} 
                    />
                    <Text style={styles.usageText}>Personal Use</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.usageOption, formData.useType === 'commercial' && styles.usageSelected]}
                    onPress={() => updateFormData({ useType: 'commercial' })}
                  >
                    <Ionicons 
                      name={formData.useType === 'commercial' ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={formData.useType === 'commercial' ? Colors.primary : Colors.textMuted} 
                    />
                    <Text style={styles.usageText}>Commercial Use</Text>
                  </TouchableOpacity>
                </View>

                {/* Safety Features */}
                <Text style={styles.sectionTitle}>Safety Features (Discounts Available):</Text>
                <View style={styles.safetyFeatures}>
                  <TouchableOpacity
                    style={styles.safetyFeature}
                    onPress={() => updateFormData({ hasHelmet: !formData.hasHelmet })}
                  >
                    <Ionicons 
                      name={formData.hasHelmet ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={formData.hasHelmet ? Colors.primary : Colors.textMuted} 
                    />
                    <Text style={styles.safetyFeatureText}>Approved Helmet (5% discount)</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.safetyFeature}
                    onPress={() => updateFormData({ hasAntiTheft: !formData.hasAntiTheft })}
                  >
                    <Ionicons 
                      name={formData.hasAntiTheft ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={formData.hasAntiTheft ? Colors.primary : Colors.textMuted} 
                    />
                    <Text style={styles.safetyFeatureText}>Anti-theft Device (10% discount)</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.safetyFeature}
                    onPress={() => updateFormData({ hasPillion: !formData.hasPillion })}
                  >
                    <Ionicons 
                      name={formData.hasPillion ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={formData.hasPillion ? Colors.primary : Colors.textMuted} 
                    />
                    <Text style={styles.safetyFeatureText}>Carries Passengers (pillion rider)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        );
      case 4:
        return (
          <InsurerSelectionStep
            formData={formData}
            onUpdateFormData={handleInsurerSelection}
            insurers={motorcycleInsurers}
            insuranceType="Motorcycle Insurance"
            enablePremiumCalculation={true}
            onCalculatePremium={handleCalculatePremium}
            vehicleAge={formData.vehicleAge}
          >
            {/* Motorcycle Coverage Information */}
            {formData.selectedInsurer && (
              <View style={styles.coverageInfoCard}>
                <View style={styles.coverageCardHeader}>
                  <Ionicons name="bicycle" size={20} color={Colors.primary} />
                  <Text style={styles.coverageCardTitle}>Motorcycle Coverage Details</Text>
                </View>
                
                <View style={styles.coverageRow}>
                  <Text style={styles.coverageLabel}>Coverage Type:</Text>
                  <Text style={styles.coverageValue}>
                    {MOTORCYCLE_COVERAGE_TYPES.find(c => c.id === formData.selectedCoverageType)?.name}
                  </Text>
                </View>
                
                <View style={styles.coverageRow}>
                  <Text style={styles.coverageLabel}>Engine Capacity:</Text>
                  <Text style={styles.coverageValue}>{formData.engineCapacity} CC</Text>
                </View>
                
                <View style={styles.coverageRow}>
                  <Text style={styles.coverageLabel}>Usage Type:</Text>
                  <Text style={styles.coverageValue}>
                    {formData.useType === 'personal' ? 'Personal Use' : 'Commercial Use'}
                  </Text>
                </View>
                
                <View style={styles.coverageRow}>
                  <Text style={styles.coverageLabel}>Third Party Liability:</Text>
                  <Text style={styles.coverageValue}>{MOTORCYCLE_COVERAGE.thirdPartyLiability}</Text>
                </View>
                
                {formData.selectedCoverageType === 'comprehensive' && (
                  <>
                    <View style={styles.coverageRow}>
                      <Text style={styles.coverageLabel}>Own Damage:</Text>
                      <Text style={styles.coverageValue}>{MOTORCYCLE_COVERAGE.ownDamage}</Text>
                    </View>
                    <View style={styles.coverageRow}>
                      <Text style={styles.coverageLabel}>Theft & Fire:</Text>
                      <Text style={styles.coverageValue}>{MOTORCYCLE_COVERAGE.theft}</Text>
                    </View>
                  </>
                )}
                
                <View style={styles.coverageRow}>
                  <Text style={styles.coverageLabel}>Personal Accident:</Text>
                  <Text style={styles.coverageValue}>{MOTORCYCLE_COVERAGE.personalAccident}</Text>
                </View>
                
                {/* Safety Features */}
                {(formData.hasHelmet || formData.hasAntiTheft) && (
                  <>
                    <Text style={styles.safetyHeader}>Safety Features (Discounts Applied):</Text>
                    <View style={styles.safetyList}>
                      {formData.hasHelmet && (
                        <View style={styles.safetyItem}>
                          <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
                          <Text style={styles.safetyText}>Approved Helmet</Text>
                        </View>
                      )}
                      {formData.hasAntiTheft && (
                        <View style={styles.safetyItem}>
                          <Ionicons name="shield" size={14} color={Colors.success} />
                          <Text style={styles.safetyText}>Anti-theft Device</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
                
                {formData.selectedQuote && (
                  <View style={styles.coverageRow}>
                    <Text style={styles.coverageLabel}>Motorcycle Value:</Text>
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
            serviceFee={25}
            insuranceType="Motorcycle Insurance"
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
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Motorcycle Insurance</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <QuotationProgressBar
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabels={['Personal Info', 'Motorcycle Details', 'Coverage & Value', 'Select Insurer', 'Payment']}
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
  motorcycleFields: {
    marginTop: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  motorcycleInfo: {
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
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  coverageOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coverageSelected: {
    backgroundColor: `${Colors.primary}08`,
    borderColor: Colors.primary,
  },
  coverageCheckbox: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  coverageDetails: {
    flex: 1,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coverageName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  coverageRate: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  coverageDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  featuresList: {
    marginTop: 4,
  },
  feature: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  usageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  usageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 120,
  },
  usageSelected: {
    backgroundColor: `${Colors.primary}08`,
    borderColor: Colors.primary,
  },
  usageText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  safetyFeatures: {
    marginTop: Spacing.xs,
  },
  safetyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  safetyFeatureText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
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
  coverageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  coverageCardTitle: {
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
  safetyHeader: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.success,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  safetyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: Spacing.xs,
  },
  safetyText: {
    fontSize: Typography.fontSize.xs,
    marginLeft: 4,
    color: Colors.success,
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

export default PrivateMotorcycleScreen;
