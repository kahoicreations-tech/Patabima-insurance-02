/**
 * Medical Insurance Quotation Screen
 * 
 * Standardized multi-step form for medical insurance quotations
 * Based on Motor Insurance template with medical-specific fields
 * No premium calculations - underwriters provide quotations
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  Modal,
  FlatList,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Typography } from '../../../constants';
import { SafeScreen, EnhancedCard, CompactCurvedHeader } from '../../../components';
import { processDocumentOffline, validateOfflineData } from '../../../services/offlineOcrService';

const { width } = Dimensions.get('window');

export default function MedicalQuotationScreen({ navigation, route }) {
  const [currentStep, setCurrentStep] = useState(1);
  const medicalCategory = route?.params?.medicalCategory;
  const [formData, setFormData] = useState({
    // Medical Category (from previous screen)
    medicalCategory: medicalCategory || null,
    
    // Step 1: Personal Information
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    emailAddress: '',
    dateOfBirth: '',
    gender: '',
    
    // Step 2: Medical Details
    nhifNumber: '',
    preferredCoverLimit: '',
    preExistingConditions: [],
    dependentsCount: '',
    
    // Step 3: Insurance Configuration
    insuranceDuration: '',
    preferredInsurer: '',
    
    // Step 4: Supporting Documents
    documents: [],
    
    // Step 5: Additional Information & Declaration
    nextOfKinName: '',
    nextOfKinPhone: '',
    declaration: false,
    paymentMethod: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showCoverLimitModal, setShowCoverLimitModal] = useState(false);
  const [showConditionsModal, setShowConditionsModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showInsurerModal, setShowInsurerModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const totalSteps = 5;
  const scrollViewRef = useRef(null);

  // Input refs for focus management
  const inputRefs = {
    fullName: useRef(null),
    idNumber: useRef(null),
    phoneNumber: useRef(null),
    emailAddress: useRef(null),
    dateOfBirth: useRef(null),
    nhifNumber: useRef(null),
    dependentsCount: useRef(null),
  };

  // Medical insurance data
  const genderOptions = [
    { id: 1, name: 'Male' },
    { id: 2, name: 'Female' },
    { id: 3, name: 'Other' }
  ];

  const coverLimitOptions = [
    { id: 1, name: 'KES 500,000', value: 500000 },
    { id: 2, name: 'KES 1,000,000', value: 1000000 },
    { id: 3, name: 'KES 2,000,000', value: 2000000 },
    { id: 4, name: 'KES 3,000,000', value: 3000000 },
    { id: 5, name: 'KES 5,000,000', value: 5000000 },
    { id: 6, name: 'KES 10,000,000', value: 10000000 }
  ];

  const preExistingConditionsOptions = [
    { id: 1, name: 'None', exclusive: true },
    { id: 2, name: 'Diabetes' },
    { id: 3, name: 'Hypertension (High Blood Pressure)' },
    { id: 4, name: 'Heart Disease' },
    { id: 5, name: 'Asthma' },
    { id: 6, name: 'Cancer' },
    { id: 7, name: 'Kidney Disease' },
    { id: 8, name: 'Mental Health Conditions' },
    { id: 9, name: 'Epilepsy' },
    { id: 10, name: 'Stroke' },
    { id: 11, name: 'Other (specify in documents)' }
  ];

  const insuranceDurationOptions = [
    { id: 1, name: '1 Month', months: 1 },
    { id: 2, name: '3 Months', months: 3 },
    { id: 3, name: '6 Months', months: 6 },
    { id: 4, name: '12 Months (Annual)', months: 12 }
  ];

  const insurerOptions = [
    { id: 1, name: 'Jubilee Insurance', rating: 4.5 },
    { id: 2, name: 'CIC Insurance', rating: 4.3 },
    { id: 3, name: 'APA Insurance', rating: 4.2 },
    { id: 4, name: 'ICEA Lion', rating: 4.4 },
    { id: 5, name: 'Heritage Insurance', rating: 4.1 },
    { id: 6, name: 'GA Insurance', rating: 4.0 },
    { id: 7, name: 'Takaful Insurance', rating: 4.2 },
    { id: 8, name: 'AAR Insurance', rating: 4.6 }
  ];

  const documentTypes = [
    {
      type: 'National ID Copy',
      required: true,
      scannable: true,
      extractFields: ['fullName', 'idNumber'],
      icon: '🆔',
      description: 'Scan your National ID for automatic data extraction'
    },
    {
      type: 'NHIF Card',
      required: false,
      scannable: true,
      extractFields: ['nhifNumber'],
      icon: '🏥',
      description: 'NHIF membership card (if applicable)'
    },
    {
      type: 'Medical Reports',
      required: false,
      scannable: false,
      extractFields: [],
      icon: '📋',
      description: 'Medical reports for pre-existing conditions'
    },
    {
      type: 'Passport Photos',
      required: true,
      scannable: false,
      extractFields: [],
      icon: '📷',
      description: 'Recent passport-size photographs'
    },
    {
      type: 'Dependents Documents',
      required: false,
      scannable: false,
      extractFields: [],
      icon: '👨‍👩‍👧‍👦',
      description: 'Birth certificates or IDs for dependents'
    }
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.fullName?.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.idNumber?.trim()) newErrors.idNumber = 'ID number is required';
        if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
        if (!formData.dateOfBirth?.trim()) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (formData.emailAddress?.trim() && !/\S+@\S+\.\S+/.test(formData.emailAddress)) {
          newErrors.emailAddress = 'Please enter a valid email address';
        }
        break;
      
      case 2:
        // NHIF is optional - only validate if provided
        if (!formData.preferredCoverLimit) newErrors.preferredCoverLimit = 'Cover limit is required';
        if (!formData.dependentsCount?.trim()) newErrors.dependentsCount = 'Number of dependents is required';
        
        // Additional validations
        const dependents = parseInt(formData.dependentsCount);
        if (dependents && (dependents < 0 || dependents > 20)) {
          newErrors.dependentsCount = 'Number of dependents must be between 0 and 20';
        }
        break;
      
      case 3:
        if (!formData.insuranceDuration) newErrors.insuranceDuration = 'Insurance duration is required';
        if (!formData.preferredInsurer) newErrors.preferredInsurer = 'Preferred insurer is required';
        break;
      
      case 4:
        // Step 4: Supporting Documents validation
        const hasNationalId = formData.documents?.some(doc => doc.type === 'National ID Copy');
        const hasPassportPhotos = formData.documents?.some(doc => doc.type === 'Passport Photos');
        
        if (!hasNationalId || !hasPassportPhotos) {
          newErrors.documents = 'National ID Copy and Passport Photos are required';
        }
        break;
      
      case 5:
        // Step 5: Review & Submit - no additional fields to validate
        // All previous data already validated in earlier steps
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate quotation number
      const quotationNumber = `QUO-MED-${Date.now().toString().slice(-6)}`;
      
      Alert.alert(
        'Medical Insurance Quotation Submitted Successfully',
        `Your medical insurance quotation has been submitted with reference number: ${quotationNumber}\n\nYou will receive a confirmation email shortly.`,
        [
          {
            text: 'View Quotations',
            onPress: () => navigation.navigate('Quotations')
          },
          {
            text: 'Go Home',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quotation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optimized form update to prevent unnecessary re-renders
  const updateFormData = useCallback((key, value) => {
    setFormData(prev => {
      if (prev[key] === value) return prev;
      return {
        ...prev,
        [key]: value
      };
    });
    
    // Clear error when user starts typing
    setErrors(prev => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: null
      };
    });
  }, []);

  // Refine onSubmitEditing handlers to avoid unnecessary keyboard dismissal
  const handleOnSubmitEditing = (currentField, nextField) => {
    if (nextField && inputRefs[nextField]?.current) {
      // Add a small delay to ensure the focus works properly
      setTimeout(() => {
        inputRefs[nextField].current.focus();
      }, 50);
    }
    // Don't dismiss keyboard if there's no next field
  };

  const selectGender = (gender) => {
    updateFormData('gender', gender.name);
    setShowGenderModal(false);
  };

  const selectCoverLimit = (option) => {
    updateFormData('preferredCoverLimit', option.name);
    setShowCoverLimitModal(false);
  };

  const selectDuration = (duration) => {
    updateFormData('insuranceDuration', duration.name);
    setShowDurationModal(false);
  };

  const selectInsurer = (insurer) => {
    updateFormData('preferredInsurer', insurer.name);
    setShowInsurerModal(false);
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    
    if (event.type === 'set') {
      const formattedDate = currentDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      updateFormData('dateOfBirth', formattedDate);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // Document handling functions
  const scanDocument = async (docType) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to scan documents');
        return;
      }

      Alert.alert(
        'Scan Document',
        `How would you like to capture your ${docType}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Take Photo',
            onPress: () => takePhoto(docType)
          },
          {
            text: 'Choose from Gallery',
            onPress: () => pickFromGallery(docType)
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  const takePhoto = async (docType) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processDocumentImage(result.assets[0], docType);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickFromGallery = async (docType) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processDocumentImage(result.assets[0], docType);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const selectDocument = async (docType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processDocumentFile(result.assets[0], docType);
      }
    } catch (error) {
      console.error('Error selecting document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const processDocumentImage = async (imageAsset, docType) => {
    try {
      const imageData = {
        uri: imageAsset.uri,
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || `${docType.replace(/\s+/g, '_')}.jpg`
      };

      // For scannable documents, try OCR
      const documentConfig = documentTypes.find(dt => dt.type === docType);
      if (documentConfig && documentConfig.scannable) {
        const ocrResult = await processDocumentOffline(imageData, docType);
        
        if (ocrResult.success && ocrResult.extractedData) {
          // Auto-fill form data from OCR if available
          Object.keys(ocrResult.extractedData).forEach(key => {
            if (formData.hasOwnProperty(key)) {
              updateFormData(key, ocrResult.extractedData[key]);
            }
          });

          addDocument(docType, ocrResult.extractedData, imageAsset.uri);
          
          Alert.alert(
            'Document Processed',
            `Successfully scanned ${docType}. Extracted data has been auto-filled.`,
            [{ text: 'OK' }]
          );
        } else {
          // Even if OCR fails, still add the document
          addDocument(docType, null, imageAsset.uri);
          
          const errorMessage = ocrResult.error || 'Could not extract text from document';
          Alert.alert(
            'Document Added',
            `${docType} has been added, but automatic text extraction failed: ${errorMessage}. Please verify the information manually.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        // For non-scannable documents, just add the image
        addDocument(docType, null, imageAsset.uri);
        Alert.alert('Document Added', `${docType} has been successfully added.`);
      }
    } catch (error) {
      console.error('Error processing document image:', error);
      Alert.alert('Error', `Failed to process ${docType}: ${error.message}`);
    }
  };

  const processDocumentFile = async (documentAsset, docType) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(documentAsset.uri);
      
      if (fileInfo.exists) {
        if (documentAsset.mimeType === 'application/pdf') {
          // For PDF files, just store the document without OCR
          addDocument(docType, null, documentAsset.uri);
          Alert.alert('Document Added', `${docType} PDF has been successfully added.`);
        } else if (documentAsset.mimeType && documentAsset.mimeType.startsWith('image/')) {
          // For image files, try OCR if scannable
          const documentConfig = documentTypes.find(dt => dt.type === docType);
          if (documentConfig && documentConfig.scannable) {
            const imageData = {
              uri: documentAsset.uri,
              type: documentAsset.mimeType,
              name: documentAsset.name
            };

            const ocrResult = await processDocumentOffline(imageData, docType);
            
            if (ocrResult.success && ocrResult.extractedData) {
              // Auto-fill form data from OCR
              Object.keys(ocrResult.extractedData).forEach(key => {
                if (formData.hasOwnProperty(key)) {
                  updateFormData(key, ocrResult.extractedData[key]);
                }
              });

              addDocument(docType, ocrResult.extractedData, documentAsset.uri);
              Alert.alert('Document Processed', `Successfully processed ${docType} with text extraction.`);
            } else {
              addDocument(docType, null, documentAsset.uri);
              Alert.alert('Document Added', `${docType} added, but text extraction failed.`);
            }
          } else {
            addDocument(docType, null, documentAsset.uri);
            Alert.alert('Document Added', `${docType} has been successfully added.`);
          }
        } else {
          // For other file types, just store them
          addDocument(docType, null, documentAsset.uri);
          Alert.alert('Document Added', `${docType} has been successfully added.`);
        }
      } else {
        Alert.alert('Error', 'Selected file does not exist');
      }
    } catch (error) {
      console.error('Error processing document file:', error);
      Alert.alert('Error', `Failed to process ${docType}: ${error.message}`);
    }
  };

  const showDocumentPicker = (docType) => {
    const docConfig = documentTypes.find(dt => dt.type === docType);
    
    const options = [
      { text: 'Cancel', style: 'cancel' }
    ];

    if (docConfig && docConfig.scannable) {
      options.push({ text: 'Scan Document', onPress: () => scanDocument(docType) });
    }
    
    options.push({ text: 'Choose File', onPress: () => selectDocument(docType) });

    Alert.alert('Add Document', `How would you like to add your ${docType}?`, options);
  };

  const addDocument = (docType, extractedData = null, imageUri = null) => {
    const newDoc = {
      id: Date.now().toString(),
      type: docType,
      timestamp: new Date().toISOString(),
      extractedData,
      imageUri,
      verified: extractedData ? true : false
    };

    const currentDocs = formData.documents || [];
    const updatedDocs = [...currentDocs.filter(doc => doc.type !== docType), newDoc];
    updateFormData('documents', updatedDocs);
  };

  const removeDocument = (docId) => {
    updateFormData('documents', formData.documents.filter(doc => doc.id !== docId));
  };

  const togglePreExistingCondition = (condition) => {
    const currentConditions = formData.preExistingConditions || [];
    
    if (condition.exclusive) {
      // If "None" is selected, clear all other conditions
      updateFormData('preExistingConditions', [condition.name]);
    } else {
      // Remove "None" if it exists and add the new condition
      const filteredConditions = currentConditions.filter(c => c !== 'None');
      
      if (filteredConditions.includes(condition.name)) {
        // Remove if already selected
        updateFormData('preExistingConditions', filteredConditions.filter(c => c !== condition.name));
      } else {
        // Add to selection
        updateFormData('preExistingConditions', [...filteredConditions, condition.name]);
      }
    }
    
    // Don't close modal automatically - let user select multiple conditions
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            step <= currentStep && styles.stepCircleActive,
            step < currentStep && styles.stepCircleCompleted
          ]}>
            <Text style={[
              styles.stepNumber,
              step <= currentStep && styles.stepNumberActive
            ]}>
              {step < currentStep ? '✓' : step}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            step <= currentStep && styles.stepLabelActive
          ]}>
            {step === 1 && 'Personal'}
            {step === 2 && 'Medical'}
            {step === 3 && 'Insurance'}
            {step === 4 && 'Documents'}
            {step === 5 && 'Review'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Medical Details</Text>
      <Text style={styles.stepDescription}>Please provide your medical information and coverage preferences</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>NHIF Number (Optional)</Text>
        <TextInput
          ref={inputRefs.nhifNumber}
          style={[styles.input, errors.nhifNumber && styles.inputError]}
          value={formData.nhifNumber}
          onChangeText={(text) => updateFormData('nhifNumber', text)}
          placeholder="Enter NHIF number if you have one"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('nhifNumber', 'dependentsCount')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.nhifNumber && <Text style={styles.errorText}>{errors.nhifNumber}</Text>}
      </View>

      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setShowCoverLimitModal(true)}
      >
        <Text style={styles.selectorLabel}>Preferred Cover Limit *</Text>
        <Text style={styles.selectorValue}>
          {formData.preferredCoverLimit || 'Select your preferred cover limit'}
        </Text>
        <Text style={styles.selectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.preferredCoverLimit && <Text style={styles.errorText}>{errors.preferredCoverLimit}</Text>}

      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setShowConditionsModal(true)}
      >
        <Text style={styles.selectorLabel}>Pre-existing Conditions</Text>
        <Text style={styles.selectorValue}>
          {formData.preExistingConditions && formData.preExistingConditions.length > 0 
            ? `${formData.preExistingConditions.length} condition(s) selected`
            : 'Select any pre-existing conditions'
          }
        </Text>
        <Text style={styles.selectorIcon}>▼</Text>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Number of Dependents *</Text>
        <TextInput
          ref={inputRefs.dependentsCount}
          style={[styles.input, errors.dependentsCount && styles.inputError]}
          value={formData.dependentsCount}
          onChangeText={(text) => updateFormData('dependentsCount', text)}
          placeholder="Enter number of dependents (0-20)"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={() => handleOnSubmitEditing('dependentsCount')}
          blurOnSubmit={true}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.dependentsCount && <Text style={styles.errorText}>{errors.dependentsCount}</Text>}
      </View>

      {formData.preExistingConditions && formData.preExistingConditions.length > 0 && (
        <View style={styles.selectedConditionsContainer}>
          <Text style={styles.selectedConditionsTitle}>Selected Pre-existing Conditions:</Text>
          {formData.preExistingConditions.map((condition, index) => (
            <View key={index} style={styles.selectedConditionItem}>
              <Text style={styles.selectedConditionText}>• {condition}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>📋 Medical Insurance Information:</Text>
        <Text style={styles.infoBoxText}>🏥 NHIF membership provides additional benefits</Text>
        <Text style={styles.infoBoxText}>💊 Cover limits determine maximum claimable amount</Text>
        <Text style={styles.infoBoxText}>👨‍👩‍👧‍👦 Dependents can be covered under your policy</Text>
        <Text style={styles.infoBoxText}>⚕️ Pre-existing conditions may affect premium rates</Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>Please provide your personal details for the medical insurance policy</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          ref={inputRefs.fullName}
          style={[styles.input, errors.fullName && styles.inputError]}
          value={formData.fullName}
          onChangeText={(text) => updateFormData('fullName', text)}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('fullName', 'idNumber')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>ID Number *</Text>
        <TextInput
          ref={inputRefs.idNumber}
          style={[styles.input, errors.idNumber && styles.inputError]}
          value={formData.idNumber}
          onChangeText={(text) => updateFormData('idNumber', text)}
          placeholder="Enter your national ID number"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('idNumber', 'phoneNumber')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.idNumber && <Text style={styles.errorText}>{errors.idNumber}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          ref={inputRefs.phoneNumber}
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData('phoneNumber', text)}
          placeholder="+254 700 000 000"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('phoneNumber', 'emailAddress')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address (Optional)</Text>
        <TextInput
          ref={inputRefs.emailAddress}
          style={[styles.input, errors.emailAddress && styles.inputError]}
          value={formData.emailAddress}
          onChangeText={(text) => updateFormData('emailAddress', text)}
          placeholder="your.email@example.com"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('emailAddress', 'dateOfBirth')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.emailAddress && <Text style={styles.errorText}>{errors.emailAddress}</Text>}
      </View>

      <TouchableOpacity 
        style={[styles.selectorButton, errors.dateOfBirth && styles.inputError]}
        onPress={() => showDatePickerModal()}
      >
        <Text style={styles.selectorLabel}>Date of Birth *</Text>
        <Text style={styles.selectorValue}>
          {formData.dateOfBirth || 'Select your date of birth'}
        </Text>
        <Text style={styles.selectorIcon}>📅</Text>
      </TouchableOpacity>
      {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}

      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setShowGenderModal(true)}
      >
        <Text style={styles.selectorLabel}>Gender *</Text>
        <Text style={styles.selectorValue}>
          {formData.gender || 'Select your gender'}
        </Text>
        <Text style={styles.selectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
    </View>
  );

  const renderConditionsModal = () => (
    <Modal
      visible={showConditionsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowConditionsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pre-existing Conditions</Text>
            <TouchableOpacity 
              onPress={() => setShowConditionsModal(false)} 
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.conditionsScrollView}>
            {preExistingConditionsOptions.map((condition) => (
              <TouchableOpacity
                key={condition.id}
                style={[
                  styles.conditionOption,
                  formData.preExistingConditions?.includes(condition.name) && styles.conditionOptionSelected
                ]}
                onPress={() => togglePreExistingCondition(condition)}
              >
                <View style={styles.conditionOptionContent}>
                  <Text style={[
                    styles.conditionOptionText,
                    formData.preExistingConditions?.includes(condition.name) && styles.conditionOptionTextSelected
                  ]}>
                    {condition.name}
                  </Text>
                  {formData.preExistingConditions?.includes(condition.name) && (
                    <Text style={styles.conditionSelectedIcon}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.conditionsFooter}>
            <TouchableOpacity
              style={styles.conditionsDoneButton}
              onPress={() => setShowConditionsModal(false)}
            >
              <Text style={styles.conditionsDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderModalSelector = (visible, onClose, options, onSelect, title) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={options}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => onSelect(item)}
              >
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionText}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.modalOptionDescription}>{item.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Insurance Configuration</Text>
      <Text style={styles.stepDescription}>Choose your insurance duration and preferred insurer</Text>
      
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setShowDurationModal(true)}
      >
        <Text style={styles.selectorLabel}>Insurance Duration *</Text>
        <Text style={styles.selectorValue}>
          {formData.insuranceDuration || 'Select insurance duration'}
        </Text>
        <Text style={styles.selectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.insuranceDuration && <Text style={styles.errorText}>{errors.insuranceDuration}</Text>}
      
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setShowInsurerModal(true)}
      >
        <Text style={styles.selectorLabel}>Preferred Insurer *</Text>
        <Text style={styles.selectorValue}>
          {formData.preferredInsurer || 'Select preferred insurer'}
        </Text>
        <Text style={styles.selectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.preferredInsurer && <Text style={styles.errorText}>{errors.preferredInsurer}</Text>}
      
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>Medical Insurance Features:</Text>
        <Text style={styles.infoBoxText}>• Comprehensive medical coverage for you and dependents</Text>
        <Text style={styles.infoBoxText}>• NHIF integration for enhanced benefits</Text>
        <Text style={styles.infoBoxText}>• Pre-existing conditions coverage (terms apply)</Text>
        <Text style={styles.infoBoxText}>• Underwriters will provide personalized quotations</Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Supporting Documents</Text>
      <Text style={styles.stepDescription}>Upload required documents for your medical insurance application</Text>
      
      {/* Document upload sections */}
      {documentTypes.map((docType) => (
        <View key={docType.type} style={styles.documentSection}>
          <View style={styles.documentHeader}>
            <Text style={styles.documentIcon}>{docType.icon}</Text>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>
                {docType.type}
                {docType.required && <Text style={styles.requiredAsterisk}> *</Text>}
              </Text>
              <Text style={styles.documentDescription}>{docType.description}</Text>
            </View>
          </View>

          {/* Check if document is already uploaded */}
          {formData.documents?.find(doc => doc.type === docType.type) ? (
            <View style={styles.uploadedDocument}>
              <View style={styles.uploadedDocumentHeader}>
                <Text style={styles.uploadedDocumentText}>✓ Document uploaded</Text>
                <TouchableOpacity
                  onPress={() => removeDocument(formData.documents.find(doc => doc.type === docType.type).id)}
                  style={styles.removeDocumentButton}
                >
                  <Text style={styles.removeDocumentText}>Remove</Text>
                </TouchableOpacity>
              </View>
              {formData.documents.find(doc => doc.type === docType.type).extractedData && (
                <Text style={styles.extractedDataText}>
                  Data extracted and auto-filled
                </Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.uploadButton,
                docType.required && styles.uploadButtonRequired
              ]}
              onPress={() => showDocumentPicker(docType.type)}
            >
              <Text style={styles.uploadButtonIcon}>📎</Text>
              <Text style={styles.uploadButtonText}>
                {docType.scannable ? 'Scan or Upload' : 'Upload'} {docType.type}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Show uploaded documents summary */}
      {formData.documents && formData.documents.length > 0 && (
        <View style={styles.uploadedDocuments}>
          <Text style={styles.uploadedDocumentsTitle}>Uploaded Documents ({formData.documents.length})</Text>
          {formData.documents.map((doc) => (
            <View key={doc.id} style={styles.documentItem}>
              <Text style={styles.documentItemIcon}>
                {documentTypes.find(dt => dt.type === doc.type)?.icon || '📄'}
              </Text>
              <View style={styles.documentItemInfo}>
                <Text style={styles.documentItemName}>{doc.type}</Text>
                <Text style={styles.documentItemTime}>
                  {new Date(doc.timestamp).toLocaleString()}
                </Text>
              </View>
              {doc.verified && (
                <Text style={styles.documentVerifiedIcon}>✓</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {errors.documents && <Text style={styles.errorText}>{errors.documents}</Text>}
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>Review your information and submit for underwriter quotation</Text>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Personal Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Full Name:</Text>
          <Text style={styles.reviewValue}>{formData.fullName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Gender:</Text>
          <Text style={styles.reviewValue}>{formData.gender}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Date of Birth:</Text>
          <Text style={styles.reviewValue}>{formData.dateOfBirth}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Phone:</Text>
          <Text style={styles.reviewValue}>{formData.phoneNumber}</Text>
        </View>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Medical Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>NHIF Member:</Text>
          <Text style={styles.reviewValue}>{formData.nhifNumber ? 'Yes' : 'No'}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Cover Limit:</Text>
          <Text style={styles.reviewValue}>{formData.preferredCoverLimit}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Dependents:</Text>
          <Text style={styles.reviewValue}>{formData.dependentsCount || 0}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Pre-existing Conditions:</Text>
          <Text style={styles.reviewValue}>
            {formData.preExistingConditions?.length > 0 
              ? formData.preExistingConditions.join(', ') 
              : 'None declared'}
          </Text>
        </View>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Insurance Configuration</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Duration:</Text>
          <Text style={styles.reviewValue}>{formData.insuranceDuration}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Preferred Insurer:</Text>
          <Text style={styles.reviewValue}>{formData.preferredInsurer}</Text>
        </View>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>🎯 Next Steps:</Text>
        <Text style={styles.infoBoxText}>• Your application will be reviewed by underwriters</Text>
        <Text style={styles.infoBoxText}>• You'll receive a personalized quotation within 24 hours</Text>
        <Text style={styles.infoBoxText}>• Premium will be calculated based on your specific needs</Text>
        <Text style={styles.infoBoxText}>• Payment options will be provided with the quotation</Text>
      </View>
    </View>
  );

  return (
    <SafeScreen>
      <StatusBar style="light" />
      <CompactCurvedHeader 
        title={medicalCategory ? `${medicalCategory.name} Insurance` : 'Medical Insurance'}
        subtitle="Complete your medical insurance quotation"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        height={80}
      />
      
      <View style={styles.container}>
        <View style={styles.headerSpacing} />
        {renderProgressBar()}
        {renderStepIndicator()}
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.keyboardAvoid}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          removeClippedSubviews={false}
          automaticallyAdjustKeyboardInsets={true}
          contentInsetAdjustmentBehavior="automatic"
          nestedScrollEnabled={true}
        >
          <EnhancedCard style={styles.formCard}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </EnhancedCard>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            {currentStep > 1 && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handlePrevious}
              >
                <Text style={styles.secondaryButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.primaryButton,
                currentStep === 1 && styles.primaryButtonFullWidth,
                isSubmitting && styles.primaryButtonDisabled
              ]}
              onPress={handleNext}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Submitting...' : currentStep === totalSteps ? 'Submit Quotation' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal selectors */}
        {renderModalSelector(showGenderModal, () => setShowGenderModal(false), genderOptions, selectGender, 'Select Gender')}
        {renderModalSelector(showCoverLimitModal, () => setShowCoverLimitModal(false), coverLimitOptions, selectCoverLimit, 'Select Cover Limit')}
        {renderModalSelector(showDurationModal, () => setShowDurationModal(false), insuranceDurationOptions, selectDuration, 'Select Duration')}
        {renderModalSelector(showInsurerModal, () => setShowInsurerModal(false), insurerOptions, selectInsurer, 'Select Insurer')}
        {renderConditionsModal()}
        
        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()} // Can't select future dates for DOB
          />
        )}
      </View>
    </SafeScreen>
  );
}

// Styles (same as Motor screen with appropriate modifications)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSpacing: {
    height: 10,
  },
  progressContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.success,
  },
  stepNumber: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  formCard: {
    marginTop: Spacing.sm,
  },
  stepContent: {
    padding: Spacing.lg,
  },
  stepTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    minHeight: 48,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  selectorButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    minHeight: 48,
  },
  selectorLabel: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 4,
    fontSize: 12,
  },
  selectorValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  selectorIcon: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonFullWidth: {
    flex: 1,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.border,
  },
  primaryButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  modalOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  modalOptionDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  selectedConditionsContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  selectedConditionsTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  selectedConditionItem: {
    marginBottom: Spacing.xs,
  },
  selectedConditionText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  conditionsScrollView: {
    maxHeight: 300,
  },
  conditionOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  conditionOptionSelected: {
    backgroundColor: Colors.primary + '10',
  },
  conditionOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionOptionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  conditionOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  conditionSelectedIcon: {
    ...Typography.bodyBold,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  conditionsFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  conditionsDoneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  conditionsDoneButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  infoBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  infoBoxTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoBoxText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  reviewSection: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reviewSectionTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '50',
  },
  reviewLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  reviewValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  headerSpacing: {
    height: 10,
  },
  keyboardAvoid: {
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonFullWidth: {
    flex: 1,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.primary + '70',
  },
  primaryButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  // Document upload styles
  documentSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  requiredAsterisk: {
    color: Colors.error,
  },
  documentDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  uploadButton: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  uploadButtonRequired: {
    borderColor: Colors.primary + '50',
    backgroundColor: Colors.primary + '05',
  },
  uploadButtonIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  uploadButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  uploadedDocument: {
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  uploadedDocumentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  uploadedDocumentText: {
    ...Typography.bodyBold,
    color: Colors.success,
  },
  removeDocumentButton: {
    backgroundColor: Colors.error + '10',
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  removeDocumentText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  extractedDataText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  uploadedDocuments: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  uploadedDocumentsTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  documentItemIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  documentItemInfo: {
    flex: 1,
  },
  documentItemName: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  documentItemTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  documentVerifiedIcon: {
    ...Typography.bodyBold,
    color: Colors.success,
    fontSize: 18,
  },
});

// End of component
