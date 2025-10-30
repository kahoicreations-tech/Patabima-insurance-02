import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import the generic form component
import GenericFormStep from '../../components/insurance/GenericFormStep';

// Import insurance configurations
import { getStepFields, getStepConfig, getTotalSteps } from '../../components/insurance';

// Import validation utilities
import { validateFormData } from '../../utils/validation';

// Sample underwriters data
const UNDERWRITERS = [
  { id: 1, name: 'Jubilee Insurance', code: 'JUB' },
  { id: 2, name: 'APA Insurance', code: 'APA' },
  { id: 3, name: 'Britam Insurance', code: 'BRI' },
  { id: 4, name: 'UAP Insurance', code: 'UAP' },
  { id: 5, name: 'Heritage Insurance', code: 'HER' }
];

const ThirdPartyQuotationFlowScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);

  const INSURANCE_TYPE = 'THIRD_PARTY';
  const totalScreens = getTotalSteps(INSURANCE_TYPE);

  // Screen management state
  const [currentScreen, setCurrentScreen] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form data state - using the same structure as TOR for consistency
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
    registrationNumber: '',
    vehicleValue: '',
    vehicleUsage: 'private',
    
    // Policy Details
    vehicleRegistrationMethod: 'registered',
    insuranceStartDate: new Date(),
    selectedInsurer: null,
    
    // Existing Cover
    hasExistingCover: false,
    existingCoverDetails: '',
    
    // Documents
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
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        handleSubmitForm();
      }
    }
  };

  const goToPreviousScreen = () => {
    if (currentScreen > 1) {
      setCurrentScreen(currentScreen - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      navigation.goBack();
    }
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

  // Handle form submission
  const handleSubmitForm = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      // Navigate to payment screen with form data
      navigation.navigate('PaymentScreen', { 
        formData,
        insuranceType: INSURANCE_TYPE
      });
    }, 1500);
  };

  // Get current step configuration and fields
  const stepConfig = getStepConfig(INSURANCE_TYPE, currentScreen);
  const stepFields = getStepFields(INSURANCE_TYPE, currentScreen);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goToPreviousScreen}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Third Party Insurance</Text>
        
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{currentScreen}/{totalScreens}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(currentScreen / totalScreens) * 100}%` }]} />
      </View>

      {/* Form Content */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={goToNextScreen}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>
                {currentScreen === totalScreens ? 'Generate Quote' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D5222B',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 4,
  },
  stepIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D5222B',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D5222B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ThirdPartyQuotationFlowScreen;