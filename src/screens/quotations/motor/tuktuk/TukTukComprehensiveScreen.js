/**
 * TukTuk Comprehensive Insurance Screen
 * Full coverage for three-wheeler vehicles including own damage, theft, 
 * third party liability, and passenger protection
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../constants';

// Import TukTuk-specific components
import {
  TukTukPersonalInformationStep,
  TukTukVehicleDetailsStep,
  TukTukVehicleValueStep,
  TukTukInsurerSelectionStep,
  TukTukDocumentUploadStep,
} from './components';

function TukTukComprehensiveScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    ownerName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    licenseNumber: '',
    drivingExperience: '',
    
    // Vehicle Details
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    plateNumber: '',
    chassisNumber: '',
    engineNumber: '',
    engineCapacity: '',
    fuelType: '',
    seatingCapacity: '',
    vehicleUsage: '',
    operatingHours: '',
    
    // Vehicle Value & Coverage
    valuationMethod: '',
    vehicleValue: '',
    coverageType: '',
    operatingArea: '',
    passengerCount: '',
    
    // Insurer Selection
    selectedInsurer: null,
    selectedPremium: null,
    coverageFeatures: [],
    
    // Documents
    uploadedDocuments: [],
  });
  
  const [errors, setErrors] = useState({});
  const [calculatedPremium, setCalculatedPremium] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const totalSteps = 5; // Personal Info, Vehicle Details, Vehicle Value, Insurer Selection, Documents

  // Handle input changes
  const updateFormData = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    
    // Clear errors for updated fields
    const updatedFields = Object.keys(updates);
    if (updatedFields.some(field => errors[field])) {
      setErrors(prev => {
        const updated = { ...prev };
        updatedFields.forEach(field => delete updated[field]);
        return updated;
      });
    }
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
        scrollToTop();
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      scrollToTop();
    }
  };

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // Validation functions
  const validateCurrentStep = () => {
    const newErrors = {};
    
    switch (currentStep) {
      case 1: // Personal Information
        if (!formData.ownerName?.trim()) newErrors.ownerName = 'Owner name is required';
        if (!formData.idNumber?.trim()) newErrors.idNumber = 'ID number is required';
        if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
        if (!formData.licenseNumber?.trim()) newErrors.licenseNumber = 'License number is required';
        if (!formData.drivingExperience?.trim()) newErrors.drivingExperience = 'Driving experience is required';
        break;
        
      case 2: // Vehicle Details
        if (!formData.vehicleMake) newErrors.vehicleMake = 'Vehicle make is required';
        if (!formData.vehicleModel?.trim()) newErrors.vehicleModel = 'Vehicle model is required';
        if (!formData.vehicleYear?.trim()) newErrors.vehicleYear = 'Vehicle year is required';
        if (!formData.plateNumber?.trim()) newErrors.plateNumber = 'Plate number is required';
        if (!formData.chassisNumber?.trim()) newErrors.chassisNumber = 'Chassis number is required';
        if (!formData.engineNumber?.trim()) newErrors.engineNumber = 'Engine number is required';
        if (!formData.fuelType) newErrors.fuelType = 'Fuel type is required';
        if (!formData.vehicleUsage) newErrors.vehicleUsage = 'Vehicle usage is required';
        break;
        
      case 3: // Vehicle Value
        if (!formData.valuationMethod) newErrors.valuationMethod = 'Valuation method is required';
        if (!formData.vehicleValue?.trim()) newErrors.vehicleValue = 'Vehicle value is required';
        if (!formData.coverageType) newErrors.coverageType = 'Coverage type is required';
        if (!formData.operatingArea) newErrors.operatingArea = 'Operating area is required';
        break;
        
      case 4: // Insurer Selection
        if (!formData.selectedInsurer) newErrors.selectedInsurer = 'Please select an insurance provider';
        break;
        
      case 5: // Documents
        const requiredDocs = ['logbook', 'license', 'id_copy', 'inspection'];
        if (formData.vehicleUsage === 'passenger') {
          requiredDocs.push('route_license');
        }
        
        const uploadedDocIds = (formData.uploadedDocuments || []).map(doc => doc.id);
        requiredDocs.forEach(docId => {
          if (!uploadedDocIds.includes(docId)) {
            newErrors[docId] = 'This document is required';
          }
        });
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePremiumCalculation = (calculationData) => {
    setIsCalculating(true);
    
    // Simulate premium calculation
    setTimeout(() => {
      const basePremium = calculationData.vehicleValue * 0.08; // 8% of vehicle value
      const usageMultiplier = calculationData.usage === 'passenger' ? 1.5 : 1.2;
      const areaMultiplier = calculationData.location === 'urban' ? 1.3 : 1.0;
      const ageMultiplier = calculationData.vehicleAge > 5 ? 1.2 : 1.0;
      
      const finalPremium = basePremium * usageMultiplier * areaMultiplier * ageMultiplier;
      
      const premium = {
        annual: Math.round(finalPremium),
        monthly: Math.round(finalPremium / 12),
        breakdown: {
          base: Math.round(basePremium),
          passenger: Math.round(basePremium * (usageMultiplier - 1)),
          area: Math.round(basePremium * (areaMultiplier - 1)),
          age: Math.round(basePremium * (ageMultiplier - 1))
        }
      };
      
      setCalculatedPremium(premium);
      setIsCalculating(false);
    }, 2000);
  };

  const handleSubmit = () => {
    if (validateCurrentStep()) {
      Alert.alert(
        'Quotation Submitted',
        'Your TukTuk comprehensive insurance quotation has been submitted successfully! We will contact you shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TukTukPersonalInformationStep
            formData={formData}
            onUpdateFormData={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <TukTukVehicleDetailsStep
            formData={formData}
            onUpdateFormData={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <TukTukVehicleValueStep
            formData={formData}
            onUpdateFormData={updateFormData}
            errors={errors}
            onCalculatePremium={handlePremiumCalculation}
            calculatedPremium={calculatedPremium}
            isCalculating={isCalculating}
          />
        );
      case 4:
        return (
          <TukTukInsurerSelectionStep
            formData={formData}
            onUpdateFormData={updateFormData}
            calculatedPremium={calculatedPremium}
            errors={errors}
          />
        );
      case 5:
        return (
          <TukTukDocumentUploadStep
            formData={formData}
            onUpdateFormData={updateFormData}
            errors={errors}
          />
        );
      default:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>Invalid Step</Text>
          </View>
        );
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>TukTuk Comprehensive</Text>
          <Text style={styles.subtitle}>Motor Insurance Quotation</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              style={[
                styles.progressStep,
                index < currentStep && styles.progressStepCompleted,
                index === currentStep - 1 && styles.progressStepActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={handlePreviousStep}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < totalSteps ? (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, currentStep === 1 && styles.fullWidthButton]}
              onPress={handleNextStep}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryButtonText}>Submit Quotation</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.small,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.bold,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBar: {
    flexDirection: 'row',
    gap: Spacing.small,
    marginBottom: Spacing.small,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressStepCompleted: {
    backgroundColor: Colors.success,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: Spacing.large,
  },
  stepContent: {
    padding: Spacing.large,
  },
  stepText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.medium,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidthButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.border,
    borderWidth: 1,
    borderColor: Colors.textLight,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TukTukComprehensiveScreen;
