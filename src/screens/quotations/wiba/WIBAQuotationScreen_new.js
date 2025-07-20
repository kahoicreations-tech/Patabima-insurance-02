/**
 * WIBA Insurance Quotation Screen
 * 
 * Standardized multi-step form for WIBA (Work Injury Benefits Act) insurance quotations
 * Focused on business/employer coverage for workplace injury protection
 * Based on Motor/Medical template with business-specific fields
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

export default function WIBAQuotationScreen({ navigation, route }) {
  const [currentStep, setCurrentStep] = useState(1);
  const wibaCategory = route?.params?.wibaCategory;
  const [formData, setFormData] = useState({
    // WIBA Category (from previous screen)
    wibaCategory: wibaCategory || null,
    
    // Step 1: Company Information
    companyName: '',
    businessRegistrationNumber: '',
    kraPin: '',
    natureOfBusiness: '',
    companyEmail: '',
    companyPhone: '',
    
    // Step 2: Business Details & Risk Assessment
    industryCategory: '',
    companySize: '',
    totalEmployees: '',
    averageMonthlySalary: '',
    businessLocation: '',
    operationalYears: '',
    
    // Step 3: WIBA Configuration
    coverageType: '',
    coverageDuration: '',
    policyStartDate: '',
    preferredInsurer: '',
    
    // Step 4: Supporting Documents
    documents: [],
    
    // Step 5: Contact Person & Declaration
    contactPersonName: '',
    contactPersonTitle: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    declaration: false,
    paymentMethod: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showCompanySizeModal, setShowCompanySizeModal] = useState(false);
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showInsurerModal, setShowInsurerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const totalSteps = 5;
  const scrollViewRef = useRef(null);

  // Input refs for focus management
  const inputRefs = {
    companyName: useRef(null),
    businessRegistrationNumber: useRef(null),
    kraPin: useRef(null),
    natureOfBusiness: useRef(null),
    companyEmail: useRef(null),
    companyPhone: useRef(null),
    totalEmployees: useRef(null),
    averageMonthlySalary: useRef(null),
    businessLocation: useRef(null),
    operationalYears: useRef(null),
    contactPersonName: useRef(null),
    contactPersonTitle: useRef(null),
    contactPersonPhone: useRef(null),
    contactPersonEmail: useRef(null),
  };

  // WIBA business data
  const industryCategories = [
    { id: 1, name: 'Manufacturing', riskLevel: 'High', factor: 1.8, description: 'Manufacturing and production' },
    { id: 2, name: 'Construction', riskLevel: 'Very High', factor: 2.2, description: 'Building and construction work' },
    { id: 3, name: 'Mining & Quarrying', riskLevel: 'Very High', factor: 2.5, description: 'Mining and quarrying operations' },
    { id: 4, name: 'Agriculture & Forestry', riskLevel: 'Medium', factor: 1.4, description: 'Agricultural and forestry work' },
    { id: 5, name: 'Transportation & Logistics', riskLevel: 'High', factor: 1.6, description: 'Transport and logistics services' },
    { id: 6, name: 'Healthcare & Social', riskLevel: 'Medium', factor: 1.2, description: 'Healthcare and social services' },
    { id: 7, name: 'Education', riskLevel: 'Low', factor: 0.8, description: 'Educational institutions' },
    { id: 8, name: 'Financial Services', riskLevel: 'Low', factor: 0.7, description: 'Banking and financial services' },
    { id: 9, name: 'Information Technology', riskLevel: 'Low', factor: 0.6, description: 'IT and software services' },
    { id: 10, name: 'Retail & Wholesale', riskLevel: 'Medium', factor: 1.0, description: 'Retail and wholesale trade' },
    { id: 11, name: 'Hospitality & Tourism', riskLevel: 'Medium', factor: 1.1, description: 'Hotels, restaurants, tourism' },
    { id: 12, name: 'Security Services', riskLevel: 'High', factor: 1.7, description: 'Security and protection services' }
  ];

  const companySizeOptions = [
    { id: 1, name: 'Micro (1-10 employees)', range: '1-10', factor: 1.2, description: 'Small businesses with 1-10 employees' },
    { id: 2, name: 'Small (11-50 employees)', range: '11-50', factor: 1.1, description: 'Small to medium businesses' },
    { id: 3, name: 'Medium (51-250 employees)', range: '51-250', factor: 1.0, description: 'Medium-sized enterprises' },
    { id: 4, name: 'Large (251+ employees)', range: '251+', factor: 0.9, description: 'Large enterprises and corporations' }
  ];

  const coverageTypeOptions = [
    { id: 1, name: 'Basic WIBA Coverage', coverage: 'Statutory minimum coverage', medicalLimit: 100000, deathBenefit: '8 years salary', baseRate: 150 },
    { id: 2, name: 'Enhanced WIBA Coverage', coverage: 'Above statutory minimum', medicalLimit: 250000, deathBenefit: '10 years salary', baseRate: 220 },
    { id: 3, name: 'Comprehensive WIBA Coverage', coverage: 'Maximum workplace protection', medicalLimit: 500000, deathBenefit: '12 years salary', baseRate: 320 },
    { id: 4, name: 'Group WIBA Coverage', coverage: 'Large workforce coverage', medicalLimit: 300000, deathBenefit: '10 years salary', baseRate: 280 }
  ];

  const coverageDurationOptions = [
    { id: 1, name: '12 Months (Annual)', months: 12, factor: 1.0 },
    { id: 2, name: '6 Months', months: 6, factor: 0.6 },
    { id: 3, name: '3 Months', months: 3, factor: 0.35 }
  ];

  const insurerOptions = [
    { id: 1, name: 'Jubilee Insurance', rating: 4.5, specialization: 'Commercial insurance leader' },
    { id: 2, name: 'Britam Insurance', rating: 4.4, specialization: 'WIBA specialist' },
    { id: 3, name: 'CIC Insurance', rating: 4.3, specialization: 'Corporate solutions' },
    { id: 4, name: 'UAP Old Mutual', rating: 4.2, specialization: 'Business insurance' },
    { id: 5, name: 'APA Insurance', rating: 4.1, specialization: 'Workplace protection' },
    { id: 6, name: 'ICEA Lion', rating: 4.3, specialization: 'Commercial coverage' },
    { id: 7, name: 'Heritage Insurance', rating: 4.0, specialization: 'WIBA solutions' },
    { id: 8, name: 'AAR Insurance', rating: 4.4, specialization: 'Employee benefits' }
  ];

  const paymentMethodOptions = [
    { id: 1, name: 'Bank Transfer', description: 'Direct bank transfer from company account' },
    { id: 2, name: 'Company Cheque', description: 'Payment via company cheque' },
    { id: 3, name: 'Mobile Money (M-Pesa)', description: 'M-Pesa Paybill payment' },
    { id: 4, name: 'Corporate Credit Card', description: 'Company credit card payment' },
    { id: 5, name: 'Standing Order', description: 'Automatic monthly/annual payments' }
  ];

  const documentTypes = [
    {
      type: 'Certificate of Incorporation',
      required: true,
      scannable: true,
      extractFields: ['companyName', 'businessRegistrationNumber'],
      icon: '📜',
      description: 'Company incorporation certificate'
    },
    {
      type: 'KRA PIN Certificate',
      required: true,
      scannable: true,
      extractFields: ['kraPin'],
      icon: '🏛️',
      description: 'KRA tax identification certificate'
    },
    {
      type: 'Business License',
      required: true,
      scannable: false,
      extractFields: [],
      icon: '📋',
      description: 'Current business operating license'
    },
    {
      type: 'Employee List',
      required: true,
      scannable: false,
      extractFields: [],
      icon: '👥',
      description: 'Complete list of employees to be covered'
    },
    {
      type: 'Payroll Records',
      required: false,
      scannable: false,
      extractFields: [],
      icon: '💰',
      description: 'Recent payroll records (last 3 months)'
    },
    {
      type: 'Company Profile',
      required: false,
      scannable: false,
      extractFields: [],
      icon: '🏢',
      description: 'Company profile and business description'
    }
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        // Step 1: Company Information
        if (!formData.companyName?.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.businessRegistrationNumber?.trim()) newErrors.businessRegistrationNumber = 'Business registration number is required';
        if (!formData.kraPin?.trim()) newErrors.kraPin = 'KRA PIN is required';
        if (!formData.natureOfBusiness?.trim()) newErrors.natureOfBusiness = 'Nature of business is required';
        if (!formData.companyEmail?.trim()) newErrors.companyEmail = 'Company email is required';
        if (!formData.companyPhone?.trim()) newErrors.companyPhone = 'Company phone is required';
        if (formData.companyEmail?.trim() && !/\S+@\S+\.\S+/.test(formData.companyEmail)) {
          newErrors.companyEmail = 'Please enter a valid email address';
        }
        break;
      
      case 2:
        // Step 2: Business Details & Risk Assessment
        if (!formData.industryCategory) newErrors.industryCategory = 'Industry category is required';
        if (!formData.companySize) newErrors.companySize = 'Company size is required';
        if (!formData.totalEmployees?.trim()) newErrors.totalEmployees = 'Total number of employees is required';
        if (!formData.averageMonthlySalary?.trim()) newErrors.averageMonthlySalary = 'Average monthly salary is required';
        if (!formData.businessLocation?.trim()) newErrors.businessLocation = 'Business location is required';
        if (!formData.operationalYears?.trim()) newErrors.operationalYears = 'Years in operation is required';
        
        // Additional validations
        const employees = parseInt(formData.totalEmployees);
        if (employees && (employees < 1 || employees > 10000)) {
          newErrors.totalEmployees = 'Number of employees must be between 1 and 10,000';
        }
        
        const salary = parseInt(formData.averageMonthlySalary);
        if (salary && (salary < 1000 || salary > 1000000)) {
          newErrors.averageMonthlySalary = 'Average salary must be between KES 1,000 and KES 1,000,000';
        }
        
        const years = parseInt(formData.operationalYears);
        if (years && (years < 0 || years > 100)) {
          newErrors.operationalYears = 'Years in operation must be between 0 and 100';
        }
        break;
      
      case 3:
        // Step 3: WIBA Configuration
        if (!formData.coverageType) newErrors.coverageType = 'Coverage type is required';
        if (!formData.coverageDuration) newErrors.coverageDuration = 'Coverage duration is required';
        if (!formData.policyStartDate?.trim()) newErrors.policyStartDate = 'Policy start date is required';
        if (!formData.preferredInsurer) newErrors.preferredInsurer = 'Preferred insurer is required';
        break;
      
      case 4:
        // Step 4: Supporting Documents validation
        const hasIncorporationCert = formData.documents?.some(doc => doc.type === 'Certificate of Incorporation');
        const hasKraCert = formData.documents?.some(doc => doc.type === 'KRA PIN Certificate');
        const hasBusinessLicense = formData.documents?.some(doc => doc.type === 'Business License');
        const hasEmployeeList = formData.documents?.some(doc => doc.type === 'Employee List');
        
        if (!hasIncorporationCert || !hasKraCert || !hasBusinessLicense || !hasEmployeeList) {
          newErrors.documents = 'Certificate of Incorporation, KRA PIN Certificate, Business License, and Employee List are required';
        }
        break;
      
      case 5:
        // Step 5: Contact Person & Declaration
        if (!formData.contactPersonName?.trim()) newErrors.contactPersonName = 'Contact person name is required';
        if (!formData.contactPersonTitle?.trim()) newErrors.contactPersonTitle = 'Contact person title is required';
        if (!formData.contactPersonPhone?.trim()) newErrors.contactPersonPhone = 'Contact person phone is required';
        if (!formData.contactPersonEmail?.trim()) newErrors.contactPersonEmail = 'Contact person email is required';
        if (!formData.declaration) newErrors.declaration = 'Declaration must be accepted';
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
        if (formData.contactPersonEmail?.trim() && !/\S+@\S+\.\S+/.test(formData.contactPersonEmail)) {
          newErrors.contactPersonEmail = 'Please enter a valid email address';
        }
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
      const quotationNumber = `QUO-WIBA-${Date.now().toString().slice(-6)}`;
      
      Alert.alert(
        'WIBA Insurance Quotation Submitted Successfully',
        `Your WIBA insurance quotation has been submitted with reference number: ${quotationNumber}\n\nOur underwriters will review your application and provide a detailed quotation within 24 hours.`,
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

  const selectIndustryCategory = (industry) => {
    updateFormData('industryCategory', industry.name);
    setShowIndustryModal(false);
  };

  const selectCompanySize = (size) => {
    updateFormData('companySize', size.name);
    setShowCompanySizeModal(false);
  };

  const selectCoverageType = (coverage) => {
    updateFormData('coverageType', coverage.name);
    setShowCoverageModal(false);
  };

  const selectCoverageDuration = (duration) => {
    updateFormData('coverageDuration', duration.name);
    setShowDurationModal(false);
  };

  const selectInsurer = (insurer) => {
    updateFormData('preferredInsurer', insurer.name);
    setShowInsurerModal(false);
  };

  const selectPaymentMethod = (method) => {
    updateFormData('paymentMethod', method.name);
    setShowPaymentModal(false);
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    
    if (event.type === 'set') {
      const formattedDate = currentDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      updateFormData('policyStartDate', formattedDate);
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
            {step === 1 && 'Company'}
            {step === 2 && 'Business'}
            {step === 3 && 'Coverage'}
            {step === 4 && 'Documents'}
            {step === 5 && 'Review'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Company Information</Text>
      <Text style={styles.stepDescription}>Please provide your company details for WIBA insurance coverage</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Company Name *</Text>
        <TextInput
          ref={inputRefs.companyName}
          style={[styles.input, errors.companyName && styles.inputError]}
          value={formData.companyName}
          onChangeText={(text) => updateFormData('companyName', text)}
          placeholder="Enter your company name"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('companyName', 'businessRegistrationNumber')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.companyName && <Text style={styles.errorText}>{errors.companyName}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Business Registration Number *</Text>
        <TextInput
          ref={inputRefs.businessRegistrationNumber}
          style={[styles.input, errors.businessRegistrationNumber && styles.inputError]}
          value={formData.businessRegistrationNumber}
          onChangeText={(text) => updateFormData('businessRegistrationNumber', text)}
          placeholder="Enter business registration number"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('businessRegistrationNumber', 'kraPin')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.businessRegistrationNumber && <Text style={styles.errorText}>{errors.businessRegistrationNumber}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>KRA PIN *</Text>
        <TextInput
          ref={inputRefs.kraPin}
          style={[styles.input, errors.kraPin && styles.inputError]}
          value={formData.kraPin}
          onChangeText={(text) => updateFormData('kraPin', text)}
          placeholder="Enter KRA PIN number"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('kraPin', 'natureOfBusiness')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.kraPin && <Text style={styles.errorText}>{errors.kraPin}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nature of Business *</Text>
        <TextInput
          ref={inputRefs.natureOfBusiness}
          style={[styles.input, errors.natureOfBusiness && styles.inputError]}
          value={formData.natureOfBusiness}
          onChangeText={(text) => updateFormData('natureOfBusiness', text)}
          placeholder="Describe your business activities"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('natureOfBusiness', 'companyEmail')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          multiline={true}
          numberOfLines={3}
        />
        {errors.natureOfBusiness && <Text style={styles.errorText}>{errors.natureOfBusiness}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Company Email *</Text>
        <TextInput
          ref={inputRefs.companyEmail}
          style={[styles.input, errors.companyEmail && styles.inputError]}
          value={formData.companyEmail}
          onChangeText={(text) => updateFormData('companyEmail', text)}
          placeholder="company@example.com"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('companyEmail', 'companyPhone')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.companyEmail && <Text style={styles.errorText}>{errors.companyEmail}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Company Phone *</Text>
        <TextInput
          ref={inputRefs.companyPhone}
          style={[styles.input, errors.companyPhone && styles.inputError]}
          value={formData.companyPhone}
          onChangeText={(text) => updateFormData('companyPhone', text)}
          placeholder="+254 700 000 000"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
          returnKeyType="done"
          onSubmitEditing={() => handleOnSubmitEditing('companyPhone')}
          blurOnSubmit={true}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.companyPhone && <Text style={styles.errorText}>{errors.companyPhone}</Text>}
      </View>
    </View>
  );

  // Continue with the rest of the render functions and return statement...
  return (
    <SafeScreen>
      <StatusBar style="light" />
      <CompactCurvedHeader 
        title={wibaCategory ? `${wibaCategory.name} Insurance` : 'WIBA Insurance'}
        subtitle="Complete your WIBA insurance quotation"
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
            {/* Add other steps here */}
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

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()} // Can't select past dates for policy start
          />
        )}
      </View>
    </SafeScreen>
  );
}

// Add styles here
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
});
