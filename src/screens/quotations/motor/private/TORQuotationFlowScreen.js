import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import shared components
import QuotationProgressBar from '../../../../components/QuotationProgressBar';

// Import the new generic form component
import { GenericFormStep } from '../../../../components/insurance';

// Import the summary component (still needed for step 4)
import ScanCompleteStep from './components/ScanCompleteStep';

// Import insurance configurations
import { getStepFields, getStepConfig, getTotalSteps } from '../../../../components/insurance';

// Import validation utilities
import { validateFormData } from '../../../../utils/validation';

// Import constants
import { Colors, Typography, Spacing } from '../../../../constants';

// Sample underwriters data
const UNDERWRITERS = [
  { id: 1, name: 'Jubilee Insurance', code: 'JUB' },
  { id: 2, name: 'APA Insurance', code: 'APA' },
  { id: 3, name: 'Britam Insurance', code: 'BRI' },
  { id: 4, name: 'UAP Insurance', code: 'UAP' },
  { id: 5, name: 'Heritage Insurance', code: 'HER' },
  { id: 6, name: 'Madison Insurance', code: 'MAD' },
  { id: 7, name: 'CIC Insurance', code: 'CIC' }
];

// TOR Step labels matching the Figma design
const TOR_STEP_LABELS = [
  'Policy Details',
  'Client Details', 
  'KYC Details',
  'Scan Complete'
];

// Screen Component
const TORQuotationFlowScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);

  const INSURANCE_TYPE = 'TOR';
  const totalScreens = getTotalSteps(INSURANCE_TYPE);

  // Screen management state
  const [currentScreen, setCurrentScreen] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    nationalId: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: null,
    
    // Driving License
    licenseNumber: '',
    licenseIssueDate: null,
    
    // Vehicle Details
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
    vehicleValue: '',
    vehicleUsage: 'private',
    
    // Policy Details
    vehicleRegistrationMethod: 'registered',
    hasFinancialInterest: false,
    financierName: '',
    insuranceStartDate: new Date(),
    selectedInsurer: null,
    
    // Existing Cover
    hasExistingCover: false,
    existingCoverDetails: '',
    
    // Documents for KYC step - using the structure expected by KYCDetailsStep
    documents: {
      nationalId: null,
      kraPin: null, 
      logbook: null
    }
  });

  // Error state
  const [errors, setErrors] = useState({});

  // Handle form input changes
  const handleUpdateFormData = (updates) => {
    setFormData(prevData => ({
      ...prevData,
      ...updates
    }));
    
    // Clear related errors
    Object.keys(updates).forEach(field => {
      if (errors[field]) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [field]: null
        }));
      }
    });
  };

  // Validate current screen
  const validateScreen = () => {
    const stepFields = getStepFields(INSURANCE_TYPE, currentScreen);
    const validationErrors = validateFormData(formData, stepFields);
    
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // Handle navigation between screens
  const goToNextScreen = () => {
    if (validateScreen()) {
      if (currentScreen < totalScreens) {
        setCurrentScreen(currentScreen + 1);
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
      } else {
        // Submit the form
        handleSubmit();
      }
    }
  };

  const goToPreviousScreen = () => {
    if (currentScreen > 1) {
      setCurrentScreen(currentScreen - 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    } else {
      navigation.goBack();
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      // Navigate to payment screen with form data
      navigation.navigate('PaymentScreen', { formData });
    }, 1500);
  };

  // Select insurer
  const selectInsurer = (insurer) => {
    handleUpdateFormData({ selectedInsurer: insurer });
  };

  // Handle document selection
  const handleDocumentSelect = (documentType) => {
    Alert.alert(
      'Select Document',
      `Please select your ${documentType} document`,
      [
        { text: 'Camera', onPress: () => selectFromCamera(documentType) },
        { text: 'Gallery', onPress: () => selectFromGallery(documentType) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const selectFromCamera = (documentType) => {
    // Simulate document capture
    handleUpdateFormData({
      documents: {
        ...formData.documents,
        [documentType]: {
          status: 'uploaded',
          fileName: `${documentType}_camera.jpg`,
          uploadedAt: new Date().toISOString()
        }
      }
    });
  };

  const selectFromGallery = (documentType) => {
    // Simulate document selection
    handleUpdateFormData({
      documents: {
        ...formData.documents,
        [documentType]: {
          status: 'uploaded',
          fileName: `${documentType}_gallery.jpg`,
          uploadedAt: new Date().toISOString()
        }
      }
    });
  };

  // Get current step configuration and fields
  const stepConfig = getStepConfig(INSURANCE_TYPE, currentScreen);
  const stepFields = getStepFields(INSURANCE_TYPE, currentScreen);
  
  // Debug logging
  console.log('Current screen:', currentScreen);
  console.log('Insurance type:', INSURANCE_TYPE);
  console.log('Step config:', stepConfig);
  console.log('Step fields:', stepFields);

  // Render current screen content
  const renderScreenContent = () => {
    // For summary step (step 4), show custom summary component
    if (currentScreen === 4) {
      return (
        <View style={styles.screenContainer}>
          <ScanCompleteStep
            formData={formData}
            onUpdateFormData={handleUpdateFormData}
            showHeader={true}
            onGenerateQuotation={() => {
              Alert.alert('Generate Quotation', 'Quotation generation will be implemented here');
            }}
            onStartOver={() => {
              setCurrentScreen(1);
              setFormData({
                fullName: '',
                nationalId: '',
                phoneNumber: '',
                email: '',
                dateOfBirth: null,
                licenseNumber: '',
                licenseIssueDate: null,
                vehicleMake: '',
                vehicleModel: '',
                vehicleYear: '',
                registrationNumber: '',
                engineNumber: '',
                chassisNumber: '',
                vehicleValue: '',
                vehicleUsage: 'private',
                vehicleRegistrationMethod: 'registered',
                hasFinancialInterest: false,
                financierName: '',
                insuranceStartDate: new Date(),
                selectedInsurer: null,
                hasExistingCover: false,
                existingCoverDetails: '',
                documents: {
                  nationalId: null,
                  kraPin: null,
                  logbook: null
                }
              });
              setErrors({});
            }}
            isGeneratingQuotation={isLoading}
          />
        </View>
      );
    }
    
    // For other steps, use the generic form component
    return (
      <View style={styles.screenContainer}>
        <Text style={{fontSize: 18, padding: 20, color: 'red'}}>DEBUG: Screen {currentScreen}</Text>
        <Text style={{fontSize: 14, padding: 10}}>Insurance Type: {INSURANCE_TYPE}</Text>
        <Text style={{fontSize: 14, padding: 10}}>Step Config: {stepConfig ? 'Found' : 'Missing'}</Text>
        <Text style={{fontSize: 14, padding: 10}}>Fields Count: {stepFields?.length || 0}</Text>
        <Text style={{fontSize: 14, padding: 10}}>Fields: {JSON.stringify(stepFields?.map(f => f.name))}</Text>
        
        {stepFields && stepFields.length > 0 ? (
          <GenericFormStep
            stepConfig={stepConfig}
            fields={stepFields}
            formData={formData}
            onUpdateFormData={handleUpdateFormData}
            errors={errors}
            availableInsurers={UNDERWRITERS}
            onDocumentSelect={handleDocumentSelect}
            showHeader={true}
          />
        ) : (
          <View style={{ padding: 20, backgroundColor: 'yellow' }}>
            <Text style={{fontSize: 16, color: 'red'}}>No fields found for step {currentScreen}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={{fontSize: 24, color: 'red', textAlign: 'center', padding: 20}}>
        TOR SCREEN TEST - CURRENT STEP: {currentScreen}
      </Text>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousScreen} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TOR2 For Private</Text>
        <View style={{ width: 24 }} /> {/* Empty view for spacing */}
      </View>
      
      <QuotationProgressBar
        currentStep={currentScreen}
        totalSteps={totalScreens}
        stepLabels={TOR_STEP_LABELS}
        showStepNumbers={true}
        showStepLabels={false}
        progressColor={Colors.primary}
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderScreenContent()}
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={goToNextScreen}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.buttonText}>
                {currentScreen === totalScreens ? 'Continue & Proceed' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  backButton: {
    padding: 4,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  screenContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    marginRight: 8,
    fontFamily: 'Poppins_500Medium',
  },
});

export default TORQuotationFlowScreen;
