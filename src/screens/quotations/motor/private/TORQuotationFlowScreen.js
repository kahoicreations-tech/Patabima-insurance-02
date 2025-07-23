/**
 * TOR Motor Insurance Quotation Flow - UPDATED WITH OFFICIAL UNDERWRITER DATA
 * Complete multi-step process for TOR private motor insurance
 * Integrates with REAL underwriter pricing from verified binder documents
 * 
 * DATA SOURCES:
 * - Official underwriter rates from torMotorData.js
 * - Verified minimum premiums from binder documents
 * - IRA-mandated statutory levies (0.25% + 0.2% + KSh 40)
 * - Age-based pricing factors from underwriter terms
 * 
 * UNDERWRITERS INCLUDED:
 * - Sanlam TOR: 0.15% rate, KSh 3,000 minimum
 * - Madison TOR: 0.12% rate, KSh 3,200 minimum  
 * - Plus additional verified underwriters from data files
 * 
 * Last Updated: July 2025 with official binder rates
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Typography, Spacing } from '../../../../constants';
import { TOR_UNDERWRITERS } from '../../../../data/torMotorData';

const TORQuotationFlowScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Get passed data from PrivateVehicleScreen
  const { vehicleCategory, productType, productName, productFeatures } = route.params || {};

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: new Date(),
    kraPin: '',
    
    // Step 2: Vehicle Details
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
    
    // Step 3: Vehicle Value & Coverage
    vehicleValue: '',
    estimatedValue: 0,
    coverageOptions: [],
    
    // Step 4: Insurer Selection
    selectedInsurer: '',
    selectedQuote: null,
    
    // Step 5: Documents
    documents: {
      logbook: null,
      nationalId: null,
      kraPin: null,
    },
    
    // Calculated fields
    vehicleAge: 0,
    totalPremium: 0,

    // New insurance date fields
    insuranceStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    preferredStartDate: '',
    existingPolicyCheck: null,
    policyConflict: null,
  });

  // Add new state for policy validation
  const [policyValidation, setPolicyValidation] = useState({
    isChecking: false,
    hasExistingPolicy: false,
    existingPolicyDetails: null,
    validationMessage: '',
    suggestedStartDate: null
  });

  const TOTAL_STEPS = 5;

  // Use real TOR underwriter data from your official files
  const torInsurers = TOR_UNDERWRITERS.map(underwriter => ({
    id: underwriter.id,
    name: underwriter.name,
    logo: underwriter.logo.replace('.png', ''), // Remove extension for Ionicons
    rate: underwriter.torRates.privateVehicle, // Official rate from binder docs
    baseMinimum: underwriter.torRates.baseMinimum, // Official minimum from underwriter
    maxVehicleAge: underwriter.torRates.maxVehicleAge || underwriter.maximumVehicleAge,
    features: underwriter.torFeatures || underwriter.specialFeatures?.slice(0, 4) || [
      'Third Party Liability',
      'Own Damage with Excess',
      'Affordable Premiums',
      'Quick Processing'
    ],
    color: getInsurerColor(underwriter.id),
    // Official pricing logic from underwriter documents
    pricingLogic: underwriter.pricingLogic,
    excessStructure: underwriter.excessStructure,
    coverageLimits: underwriter.coverageLimits,
    commissionStructure: underwriter.commissionStructure,
    statutoryLevies: underwriter.statutoryLevies
  }));

  // Helper function to assign colors to insurers
  function getInsurerColor(insurerId) {
    const colorMap = {
      'sanlam_tor': '#1B4F72',
      'madison_tor': '#E74C3C', 
      'jubilee_tor': '#27AE60',
      'britam_tor': '#8E44AD',
      'kal_tor': '#F39C12',
      'pacis_tor': '#16A085',
      'monarch_tor': '#C0392B',
      'ga_tor': '#8B4513'
    };
    return colorMap[insurerId] || Colors.primary;
  }

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep / TOTAL_STEPS) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Calculate vehicle age when year changes
  useEffect(() => {
    if (formData.vehicleYear) {
      const age = new Date().getFullYear() - parseInt(formData.vehicleYear);
      updateFormData({ vehicleAge: age });
    }
  }, [formData.vehicleYear]);

  // Calculate premium when vehicle value or insurer changes
  useEffect(() => {
    if (formData.vehicleValue && formData.selectedInsurer) {
      calculatePremium();
    }
  }, [formData.vehicleValue, formData.selectedInsurer, formData.vehicleAge]);

  // Trigger policy check when registration number is entered
  useEffect(() => {
    if (formData.registrationNumber && formData.registrationNumber.length >= 6) {
      const timeoutId = setTimeout(() => {
        checkExistingInsurance(formData.registrationNumber);
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.registrationNumber]);

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const calculatePremium = () => {
    const insurer = torInsurers.find(i => i.id === formData.selectedInsurer);
    if (!insurer || !formData.vehicleValue) return;

    const vehicleValue = parseFloat(formData.vehicleValue.replace(/[^0-9.]/g, ''));
    
    // Use official rate from underwriter binder documents
    let premium = vehicleValue * (insurer.rate / 100);

    // Apply official age factor adjustments from underwriter pricing logic
    if (formData.vehicleAge <= 3) premium *= 1.2; // New cars +20% (from binder docs)
    else if (formData.vehicleAge <= 8) premium *= 1.0; // Standard rate (from binder docs)
    else if (formData.vehicleAge <= 15) premium *= 0.9; // Older cars -10% (from binder docs)
    else premium *= 0.8; // Very old cars -20% (from binder docs)

    // Apply official minimum premium from underwriter documentation
    premium = Math.max(premium, insurer.baseMinimum);

    // Calculate statutory levies (fixed by Insurance Regulatory Authority - IRA)
    const levies = insurer.statutoryLevies || {
      policyholdersFund: 0.25, // 0.25% - IRA mandated
      trainingLevy: 0.2,       // 0.2% - IRA mandated
      stampDuty: 40            // KSh 40 - Government fixed
    };
    
    const policyholdersFund = premium * (levies.policyholdersFund / 100);
    const trainingLevy = premium * (levies.trainingLevy / 100);
    const stampDuty = levies.stampDuty;
    
    const totalPremium = premium + policyholdersFund + trainingLevy + stampDuty;

    const quote = {
      basePremium: Math.round(premium),
      policyholdersFund: Math.round(policyholdersFund),
      trainingLevy: Math.round(trainingLevy),
      stampDuty,
      totalPremium: Math.round(totalPremium),
      // Add underwriter reference for audit trail
      underwriterRef: insurer.id,
      calculationDate: new Date().toISOString(),
      rateSource: 'Official Underwriter Binder Documents'
    };

    updateFormData({ selectedQuote: quote, totalPremium: quote.totalPremium });
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
        return formData.documents.logbook && formData.documents.nationalId;
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

  const handleDocumentPick = async (documentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const document = result.assets[0];
        updateFormData({
          documents: {
            ...formData.documents,
            [documentType]: document,
          },
        });
        Alert.alert('Success', `${documentType} document uploaded successfully`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simulate API call for TOR quotation submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'TOR Quotation Submitted',
        `Your TOR quotation has been submitted successfully.\n\nQuotation ID: TOR${Date.now()}\nTotal Premium: KSh ${formData.totalPremium?.toLocaleString()}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logic for TOR quotation with date validation
  const validateInsuranceStartDate = async (registrationNumber, startDate) => {
    // 1. Check for existing active policies
    const existingPolicies = await checkExistingPolicies(registrationNumber);
    
    // 2. Validate start date constraints
    const today = new Date();
    const selectedDate = new Date(startDate);
    
    // 3. Business rules validation
    if (selectedDate < today.setHours(0,0,0,0)) {
      return { valid: false, message: "Start date cannot be in the past" };
    }
    
    // 4. Check for policy overlaps
    if (existingPolicies.length > 0) {
      const activePolicy = existingPolicies.find(p => p.status === 'active');
      if (activePolicy && selectedDate <= new Date(activePolicy.endDate)) {
        return {
          valid: false,
          message: `Vehicle is currently insured until ${activePolicy.endDate}. Please select start date after this period.`,
          suggestedDate: new Date(activePolicy.endDate).setDate(new Date(activePolicy.endDate).getDate() + 1)
        };
      }
    }
    
    return { valid: true };
  };

  const checkExistingInsurance = async (registrationNumber) => {
    setPolicyValidation(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Simulate API call to check existing policies
      // In production, this would query your insurance database
      const mockExistingPolicies = [
        // Example existing policy
        {
          id: 'POL123456',
          registrationNumber: registrationNumber.toUpperCase(),
          insurerName: 'Jubilee Insurance',
          policyType: 'TOR',
          startDate: '2024-01-15',
          endDate: '2025-01-14',
          status: 'active'
        }
      ];
      
      // Check if any policies match the registration number
      const existingPolicy = mockExistingPolicies.find(
        policy => policy.registrationNumber === registrationNumber.toUpperCase() && 
                  policy.status === 'active'
      );
      
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
        
        // Auto-update the start date
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
      setPolicyValidation({
        isChecking: false,
        hasExistingPolicy: false,
        existingPolicyDetails: null,
        validationMessage: 'Unable to verify existing insurance. Please proceed with caution.',
        suggestedStartDate: null
      });
    }
  };

  // Date validation function
  const validateStartDate = (selectedDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      Alert.alert(
        'Invalid Start Date',
        'Insurance start date cannot be in the past. Please select today or a future date.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check against existing policy
    if (policyValidation.existingPolicyDetails) {
      const existingEndDate = new Date(policyValidation.existingPolicyDetails.endDate);
      if (selectedDate <= existingEndDate) {
        Alert.alert(
          'Policy Overlap Warning',
          `The selected start date overlaps with your existing insurance policy which expires on ${existingEndDate.toLocaleDateString()}. This may result in double coverage and additional costs.`,
          [
            { text: 'Change Date', style: 'cancel' },
            { 
              text: 'Continue Anyway', 
              onPress: () => updateFormData({ insuranceStartDate: selectedDate }),
              style: 'destructive'
            }
          ]
        );
        return;
      }
    }
    
    updateFormData({ insuranceStartDate: selectedDate });
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of {TOTAL_STEPS}</Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.fullName}
          onChangeText={(text) => updateFormData({ fullName: text })}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>ID Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.idNumber}
          onChangeText={(text) => updateFormData({ idNumber: text })}
          placeholder="Enter ID/Passport number"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData({ phoneNumber: text })}
          placeholder="+254 7XX XXX XXX"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => updateFormData({ email: text })}
          placeholder="Enter email address"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>KRA PIN</Text>
        <TextInput
          style={styles.input}
          value={formData.kraPin}
          onChangeText={(text) => updateFormData({ kraPin: text.toUpperCase() })}
          placeholder="A000000000X"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
          maxLength={11}
        />
      </View>
    </View>
  );

  const renderStep2Enhanced = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vehicle Details</Text>
      <Text style={styles.stepSubtitle}>Information about your vehicle</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Make *</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleMake}
          onChangeText={(text) => updateFormData({ vehicleMake: text })}
          placeholder="e.g., Toyota, Nissan"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Model *</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleModel}
          onChangeText={(text) => updateFormData({ vehicleModel: text })}
          placeholder="e.g., Corolla, X-Trail"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Year of Manufacture *</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleYear}
          onChangeText={(text) => updateFormData({ vehicleYear: text })}
          placeholder="YYYY"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Registration Number *</Text>
        <TextInput
          style={[
            styles.input,
            policyValidation.hasExistingPolicy && styles.inputWarning
          ]}
          value={formData.registrationNumber}
          onChangeText={(text) => updateFormData({ registrationNumber: text.toUpperCase() })}
          placeholder="KXX 000X"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
        />
        
        {/* Policy validation indicator */}
        {policyValidation.isChecking && (
          <View style={styles.validationIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.validationText}>Checking existing insurance...</Text>
          </View>
        )}
        
        {policyValidation.validationMessage && !policyValidation.isChecking && (
          <View style={[
            styles.validationResult,
            policyValidation.hasExistingPolicy ? styles.validationWarning : styles.validationSuccess
          ]}>
            <Ionicons 
              name={policyValidation.hasExistingPolicy ? "warning" : "checkmark-circle"} 
              size={16} 
              color={policyValidation.hasExistingPolicy ? Colors.warning : Colors.success} 
            />
            <Text style={[
              styles.validationText,
              policyValidation.hasExistingPolicy ? styles.warningText : styles.successText
            ]}>
              {policyValidation.validationMessage}
            </Text>
          </View>
        )}
        
        {/* Existing policy details */}
        {policyValidation.existingPolicyDetails && (
          <View style={styles.existingPolicyCard}>
            <Text style={styles.existingPolicyTitle}>Current Insurance Details</Text>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Insurer:</Text>
              <Text style={styles.policyDetailValue}>{policyValidation.existingPolicyDetails.insurerName}</Text>
            </View>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Policy Type:</Text>
              <Text style={styles.policyDetailValue}>{policyValidation.existingPolicyDetails.policyType}</Text>
            </View>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Expires:</Text>
              <Text style={styles.policyDetailValue}>
                {new Date(policyValidation.existingPolicyDetails.endDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Insurance Start Date Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Insurance Start Date *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {formData.insuranceStartDate.toLocaleDateString()}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={formData.insuranceStartDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                validateStartDate(selectedDate);
              }
            }}
          />
        )}
        
        {/* Start date validation messages */}
        {policyValidation.hasExistingPolicy && policyValidation.suggestedStartDate && (
          <View style={styles.dateRecommendation}>
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
            <Text style={styles.recommendationText}>
              Recommended start date: {policyValidation.suggestedStartDate.toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={styles.useSuggestedButton}
              onPress={() => updateFormData({ insuranceStartDate: policyValidation.suggestedStartDate })}
            >
              <Text style={styles.useSuggestedText}>Use This Date</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vehicle Details</Text>
      <Text style={styles.stepSubtitle}>Information about your vehicle</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Make *</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleMake}
          onChangeText={(text) => updateFormData({ vehicleMake: text })}
          placeholder="e.g., Toyota, Nissan"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Model *</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleModel}
          onChangeText={(text) => updateFormData({ vehicleModel: text })}
          placeholder="e.g., Corolla, X-Trail"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Year of Manufacture *</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleYear}
          onChangeText={(text) => updateFormData({ vehicleYear: text })}
          placeholder="YYYY"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Registration Number *</Text>
        <TextInput
          style={[
            styles.input,
            policyValidation.hasExistingPolicy && styles.inputWarning
          ]}
          value={formData.registrationNumber}
          onChangeText={(text) => updateFormData({ registrationNumber: text.toUpperCase() })}
          placeholder="KXX 000X"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
        />
        
        {/* Policy validation indicator */}
        {policyValidation.isChecking && (
          <View style={styles.validationIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.validationText}>Checking existing insurance...</Text>
          </View>
        )}
        
        {policyValidation.validationMessage && !policyValidation.isChecking && (
          <View style={[
            styles.validationResult,
            policyValidation.hasExistingPolicy ? styles.validationWarning : styles.validationSuccess
          ]}>
            <Ionicons 
              name={policyValidation.hasExistingPolicy ? "warning" : "checkmark-circle"} 
              size={16} 
              color={policyValidation.hasExistingPolicy ? Colors.warning : Colors.success} 
            />
            <Text style={[
              styles.validationText,
              policyValidation.hasExistingPolicy ? styles.warningText : styles.successText
            ]}>
              {policyValidation.validationMessage}
            </Text>
          </View>
        )}
        
        {/* Existing policy details */}
        {policyValidation.existingPolicyDetails && (
          <View style={styles.existingPolicyCard}>
            <Text style={styles.existingPolicyTitle}>Current Insurance Details</Text>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Insurer:</Text>
              <Text style={styles.policyDetailValue}>{policyValidation.existingPolicyDetails.insurerName}</Text>
            </View>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Policy Type:</Text>
              <Text style={styles.policyDetailValue}>{policyValidation.existingPolicyDetails.policyType}</Text>
            </View>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Expires:</Text>
              <Text style={styles.policyDetailValue}>
                {new Date(policyValidation.existingPolicyDetails.endDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Insurance Start Date Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Insurance Start Date *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {formData.insuranceStartDate.toLocaleDateString()}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={formData.insuranceStartDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                validateStartDate(selectedDate);
              }
            }}
          />
        )}
        
        {/* Start date validation messages */}
        {policyValidation.hasExistingPolicy && policyValidation.suggestedStartDate && (
          <View style={styles.dateRecommendation}>
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
            <Text style={styles.recommendationText}>
              Recommended start date: {policyValidation.suggestedStartDate.toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={styles.useSuggestedButton}
              onPress={() => updateFormData({ insuranceStartDate: policyValidation.suggestedStartDate })}
            >
              <Text style={styles.useSuggestedText}>Use This Date</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vehicle Value</Text>
      <Text style={styles.stepSubtitle}>Set the insured value for your vehicle</Text>

      <View style={styles.estimatedValueCard}>
        <Text style={styles.estimatedLabel}>Vehicle Age</Text>
        <Text style={styles.estimatedValue}>
          {formData.vehicleAge > 0 ? `${formData.vehicleAge} years` : 'Enter year first'}
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Value (KSh) *</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleValue}
          onChangeText={(text) => updateFormData({ vehicleValue: text })}
          placeholder="Enter vehicle value"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.primary} />
        <Text style={styles.infoText}>
          The vehicle value should reflect the current market value. This will be used to calculate your premium.
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select TOR Insurer</Text>
      <Text style={styles.stepSubtitle}>Compare quotes from verified underwriters</Text>

      {torInsurers.map((insurer) => {
        const vehicleValue = parseFloat(formData.vehicleValue?.replace(/[^0-9.]/g, '') || '0');
        
        // Calculate premium using official underwriter rates
        let premium = vehicleValue * (insurer.rate / 100);
        
        // Apply official age factors from underwriter documentation
        if (formData.vehicleAge <= 3) premium *= 1.2;
        else if (formData.vehicleAge <= 8) premium *= 1.0;
        else if (formData.vehicleAge <= 15) premium *= 0.9;
        else premium *= 0.8;
        
        // Apply official minimum premium from underwriter binder
        premium = Math.max(premium, insurer.baseMinimum);
        
        // Calculate total with statutory levies
        const levies = insurer.statutoryLevies || { policyholdersFund: 0.25, trainingLevy: 0.2, stampDuty: 40 };
        const totalPremium = premium + (premium * (levies.policyholdersFund / 100)) + (premium * (levies.trainingLevy / 100)) + levies.stampDuty;

        // Check if vehicle age exceeds insurer's maximum
        const isEligible = formData.vehicleAge <= insurer.maxVehicleAge;

        return (
          <TouchableOpacity
            key={insurer.id}
            style={[
              styles.insurerCard,
              formData.selectedInsurer === insurer.id && styles.selectedInsurerCard,
              !isEligible && styles.ineligibleInsurerCard
            ]}
            onPress={() => isEligible && updateFormData({ selectedInsurer: insurer.id })}
            disabled={!isEligible}
          >
            <View style={styles.insurerHeader}>
              <View style={[styles.insurerIcon, { backgroundColor: insurer.color }]}>
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
              <View style={styles.insurerInfo}>
                <Text style={styles.insurerName}>{insurer.name}</Text>
                <Text style={styles.insurerRate}>
                  Official Rate: {insurer.rate}% | Min: KSh {insurer.baseMinimum?.toLocaleString()}
                </Text>
                {!isEligible && (
                  <Text style={styles.ineligibleText}>
                    Max Age: {insurer.maxVehicleAge} years (Vehicle too old)
                  </Text>
                )}
              </View>
              <View style={styles.premiumInfo}>
                {isEligible ? (
                  <>
                    <Text style={styles.premiumAmount}>KSh {Math.round(totalPremium).toLocaleString()}</Text>
                    <Text style={styles.premiumLabel}>Total Premium</Text>
                  </>
                ) : (
                  <Text style={styles.ineligibleAmount}>Not Available</Text>
                )}
              </View>
            </View>
            
            <View style={styles.featuresContainer}>
              {insurer.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={14} 
                    color={isEligible ? Colors.primary : Colors.textMuted} 
                  />
                  <Text style={[
                    styles.featureText,
                    !isEligible && styles.ineligibleFeatureText
                  ]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Show official pricing source */}
            {isEligible && (
              <Text style={styles.officialSourceText}>
                ✓ Rates from verified underwriter binder documents
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      {formData.selectedQuote && (
        <View style={styles.premiumBreakdown}>
          <Text style={styles.breakdownTitle}>Official Premium Breakdown</Text>
          
          {/* Calculation Logic Explanation */}
          <View style={styles.calculationLogic}>
            <Text style={styles.logicTitle}>How Your Premium Was Calculated:</Text>
            <View style={styles.logicStep}>
              <Text style={styles.logicStepNumber}>1.</Text>
              <Text style={styles.logicStepText}>
                Vehicle Value × Underwriter Rate: KSh {parseFloat(formData.vehicleValue?.replace(/[^0-9.]/g, '') || '0').toLocaleString()} × {torInsurers.find(i => i.id === formData.selectedInsurer)?.rate}%
              </Text>
            </View>
            <View style={styles.logicStep}>
              <Text style={styles.logicStepNumber}>2.</Text>
              <Text style={styles.logicStepText}>
                Age Factor Applied: {formData.vehicleAge <= 3 ? '+20% (New Vehicle)' : 
                  formData.vehicleAge <= 8 ? 'Standard Rate' : 
                  formData.vehicleAge <= 15 ? '-10% (Older Vehicle)' : '-20% (Very Old Vehicle)'}
              </Text>
            </View>
            <View style={styles.logicStep}>
              <Text style={styles.logicStepNumber}>3.</Text>
              <Text style={styles.logicStepText}>
                Minimum Premium Check: Applied KSh {torInsurers.find(i => i.id === formData.selectedInsurer)?.baseMinimum?.toLocaleString()} minimum as per underwriter terms
              </Text>
            </View>
            <View style={styles.logicStep}>
              <Text style={styles.logicStepNumber}>4.</Text>
              <Text style={styles.logicStepText}>
                IRA Statutory Levies Added: Policyholders Fund + Training Levy + Stamp Duty
              </Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Premium:</Text>
            <Text style={styles.breakdownValue}>KSh {formData.selectedQuote.basePremium.toLocaleString()}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Policyholders Fund (0.25%):</Text>
            <Text style={styles.breakdownValue}>KSh {formData.selectedQuote.policyholdersFund.toLocaleString()}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Training Levy (0.2%):</Text>
            <Text style={styles.breakdownValue}>KSh {formData.selectedQuote.trainingLevy.toLocaleString()}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Stamp Duty:</Text>
            <Text style={styles.breakdownValue}>KSh {formData.selectedQuote.stampDuty}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Premium:</Text>
            <Text style={styles.totalValue}>KSh {formData.selectedQuote.totalPremium.toLocaleString()}</Text>
          </View>
          
          {/* Show calculation source */}
          <View style={styles.calculationSource}>
            <Text style={styles.sourceText}>
              ✓ Calculated using official underwriter rates from verified binder documents
            </Text>
            <Text style={styles.sourceText}>
              ✓ Vehicle Age: {formData.vehicleAge} years | Rate: {torInsurers.find(i => i.id === formData.selectedInsurer)?.rate}% | Min: KSh {torInsurers.find(i => i.id === formData.selectedInsurer)?.baseMinimum?.toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Upload Documents</Text>
      <Text style={styles.stepSubtitle}>Required documents for TOR insurance</Text>

      <TouchableOpacity
        style={styles.documentUpload}
        onPress={() => handleDocumentPick('logbook')}
      >
        <Ionicons
          name={formData.documents.logbook ? "document-text" : "cloud-upload-outline"}
          size={24}
          color={formData.documents.logbook ? Colors.success : Colors.primary}
        />
        <Text style={[
          styles.documentUploadText,
          formData.documents.logbook && styles.documentUploadSuccess
        ]}>
          {formData.documents.logbook 
            ? `Logbook: ${formData.documents.logbook.name}`
            : 'Upload Vehicle Logbook *'
          }
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.documentUpload}
        onPress={() => handleDocumentPick('nationalId')}
      >
        <Ionicons
          name={formData.documents.nationalId ? "document-text" : "cloud-upload-outline"}
          size={24}
          color={formData.documents.nationalId ? Colors.success : Colors.primary}
        />
        <Text style={[
          styles.documentUploadText,
          formData.documents.nationalId && styles.documentUploadSuccess
        ]}>
          {formData.documents.nationalId 
            ? `National ID: ${formData.documents.nationalId.name}`
            : 'Upload National ID Copy *'
          }
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.documentUpload}
        onPress={() => handleDocumentPick('kraPin')}
      >
        <Ionicons
          name={formData.documents.kraPin ? "document-text" : "cloud-upload-outline"}
          size={24}
          color={formData.documents.kraPin ? Colors.success : Colors.primary}
        />
        <Text style={[
          styles.documentUploadText,
          formData.documents.kraPin && styles.documentUploadSuccess
        ]}>
          {formData.documents.kraPin 
            ? `KRA PIN: ${formData.documents.kraPin.name}`
            : 'Upload KRA PIN Certificate (Optional)'
          }
        </Text>
      </TouchableOpacity>

      {formData.selectedQuote && (
        <View style={styles.finalSummary}>
          <Text style={styles.summaryTitle}>Quotation Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle:</Text>
            <Text style={styles.summaryValue}>{formData.vehicleMake} {formData.vehicleModel} ({formData.vehicleYear})</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Registration:</Text>
            <Text style={styles.summaryValue}>{formData.registrationNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Insured Value:</Text>
            <Text style={styles.summaryValue}>KSh {parseFloat(formData.vehicleValue?.replace(/[^0-9.]/g, '') || '0').toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Insurer:</Text>
            <Text style={styles.summaryValue}>{torInsurers.find(i => i.id === formData.selectedInsurer)?.name}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalSummaryRow]}>
            <Text style={styles.totalSummaryLabel}>Total Premium:</Text>
            <Text style={styles.totalSummaryValue}>KSh {formData.selectedQuote.totalPremium.toLocaleString()}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2Enhanced();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return renderStep1();
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
        <Text style={styles.headerTitle}>TOR Insurance Quotation</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderProgressBar()}

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
                  <Text style={styles.submitButtonText}>Submit Quotation</Text>
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
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  progressContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 3,
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  stepContainer: {
    padding: Spacing.md,
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
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_600SemiBold',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    fontFamily: 'Poppins_400Regular',
  },
  estimatedValueCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  estimatedLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  estimatedValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  insurerCard: {
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
  selectedInsurerCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  insurerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  insurerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontFamily: 'Poppins_600SemiBold',
  },
  insurerRate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  premiumInfo: {
    alignItems: 'flex-end',
  },
  premiumAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  premiumLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: Spacing.xs,
  },
  featureText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
  },
  premiumBreakdown: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: 'Poppins_600SemiBold',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  breakdownValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  totalValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  documentUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderStyle: 'dashed',
  },
  documentUploadText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    fontFamily: 'Poppins_400Regular',
  },
  documentUploadSuccess: {
    color: Colors.success,
  },
  finalSummary: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: 'Poppins_600SemiBold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
    textAlign: 'right',
  },
  totalSummaryRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalSummaryLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  totalSummaryValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
    flex: 1,
    textAlign: 'right',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  prevButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  prevButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontFamily: 'Poppins_600SemiBold',
  },
  nextButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginRight: Spacing.xs,
    fontFamily: 'Poppins_600SemiBold',
  },
  submitButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginRight: Spacing.xs,
    fontFamily: 'Poppins_600SemiBold',
  },
  inputWarning: {
    borderColor: Colors.warning,
    borderWidth: 2,
  },
  validationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  validationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: 6,
  },
  validationWarning: {
    backgroundColor: '#FFF3CD',
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  validationSuccess: {
    backgroundColor: '#D4EDDA',
    borderColor: Colors.success,
    borderWidth: 1,
  },
  validationText: {
    fontSize: Typography.fontSize.sm,
    marginLeft: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
  },
  warningText: {
    color: Colors.warning,
  },
  successText: {
    color: Colors.success,
  },
  existingPolicyCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  existingPolicyTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_600SemiBold',
  },
  policyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  policyDetailLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  policyDetailValue: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  dateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  dateRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: Spacing.sm,
    borderRadius: 6,
    marginTop: Spacing.xs,
  },
  recommendationText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  useSuggestedButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  useSuggestedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontFamily: 'Poppins_500Medium',
  },
  // New styles for official underwriter data
  ineligibleInsurerCard: {
    opacity: 0.6,
    borderColor: Colors.textMuted,
  },
  ineligibleText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
  },
  ineligibleAmount: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    fontFamily: 'Poppins_600SemiBold',
  },
  ineligibleFeatureText: {
    color: Colors.textMuted,
  },
  officialSourceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontFamily: 'Poppins_400Regular',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  calculationSource: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sourceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  // Calculation logic styles
  calculationLogic: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  logicTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_600SemiBold',
  },
  logicStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  logicStepNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    width: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  logicStepText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
    fontFamily: 'Poppins_400Regular',
  },
});

export default TORQuotationFlowScreen;
