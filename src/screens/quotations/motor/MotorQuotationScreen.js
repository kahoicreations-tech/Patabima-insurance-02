/**
 * Motor Vehicle Insurance Quotation Screen
 * 
 * Multi-step form for collecting motor vehicle insurance information
 * Based on the claims submission step pattern and XML form structure
 * Supports Third Party, Comprehensive, and Commercial vehicle insurance
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  Modal,
  FlatList,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { processDocumentOffline, validateOfflineData } from '../../../services/offlineOcrService';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../../constants';
import SafeScreen from '../../../components/common/SafeScreen';
import CompactCurvedHeader from '../../../components/common/CompactCurvedHeader';
import EnhancedCard from '../../../components/common/EnhancedCard';

const { width } = Dimensions.get('window');

export default function MotorQuotationScreen({ navigation, route }) {
  const [currentStep, setCurrentStep] = useState(1);
  const vehicleCategory = route?.params?.vehicleCategory;
  const [formData, setFormData] = useState({
    // Vehicle Category (from previous screen)
    vehicleCategory: vehicleCategory || null,
    
    // Step 1: Personal Information
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    emailAddress: '',
    
    // Step 2: Vehicle Details
    vehicleRegistrationNumber: '',
    makeModel: '',
    yearOfManufacture: '',
    vehicleEngineCapacity: '',
    usageType: '',
    
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
  const [showMakeModelModal, setShowMakeModelModal] = useState(false);
  const [showUsageTypeModal, setShowUsageTypeModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showInsurerModal, setShowInsurerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showValidationDrawer, setShowValidationDrawer] = useState(false);
  const [scannedData, setScannedData] = useState({});
  const [validationMismatches, setValidationMismatches] = useState([]);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  // Input refs for focus management
  const inputRefs = {
    fullName: useRef(null),
    idNumber: useRef(null),
    phoneNumber: useRef(null),
    emailAddress: useRef(null),
    vehicleRegistrationNumber: useRef(null),
    yearOfManufacture: useRef(null),
    vehicleEngineCapacity: useRef(null),
    nextOfKinName: useRef(null),
    nextOfKinPhone: useRef(null),
  };

  const totalSteps = 5;

  // Vehicle makes and models data
  const vehicleMakeModels = [
    { id: 1, name: 'Toyota Corolla', make: 'Toyota', category: 'Sedan' },
    { id: 2, name: 'Toyota Vitz', make: 'Toyota', category: 'Hatchback' },
    { id: 3, name: 'Toyota Fielder', make: 'Toyota', category: 'Station Wagon' },
    { id: 4, name: 'Toyota Prado', make: 'Toyota', category: 'SUV' },
    { id: 5, name: 'Toyota Hilux', make: 'Toyota', category: 'Pickup' },
    { id: 6, name: 'Nissan Note', make: 'Nissan', category: 'Hatchback' },
    { id: 7, name: 'Nissan Tiida', make: 'Nissan', category: 'Sedan' },
    { id: 8, name: 'Nissan X-Trail', make: 'Nissan', category: 'SUV' },
    { id: 9, name: 'Honda Fit', make: 'Honda', category: 'Hatchback' },
    { id: 10, name: 'Honda Vezel', make: 'Honda', category: 'SUV' },
    { id: 11, name: 'Subaru Forester', make: 'Subaru', category: 'SUV' },
    { id: 12, name: 'Subaru Impreza', make: 'Subaru', category: 'Sedan' },
    { id: 13, name: 'Mazda Axela', make: 'Mazda', category: 'Sedan' },
    { id: 14, name: 'Mazda Demio', make: 'Mazda', category: 'Hatchback' },
    { id: 15, name: 'Mitsubishi Outlander', make: 'Mitsubishi', category: 'SUV' }
  ];

  const usageTypeOptions = [
    { id: 1, name: 'Private', description: 'Personal and family use', multiplier: 1.0 },
    { id: 2, name: 'Commercial', description: 'Business and commercial use', multiplier: 1.8 },
    { id: 3, name: 'Taxi/Cab', description: 'Licensed taxi operations', multiplier: 2.2 },
    { id: 4, name: 'Uber/Bolt', description: 'Ride-sharing services', multiplier: 2.0 },
    { id: 5, name: 'Delivery', description: 'Package and food delivery', multiplier: 1.9 },
    { id: 6, name: 'Government', description: 'Government vehicle', multiplier: 1.1 }
  ];

  const insuranceDurationOptions = [
    { id: 1, name: '1 Month', months: 1, multiplier: 0.12 },
    { id: 2, name: '2 Months', months: 2, multiplier: 0.22 },
    { id: 3, name: '3 Months', months: 3, multiplier: 0.30 },
    { id: 4, name: '4 Months', months: 4, multiplier: 0.38 },
    { id: 5, name: '5 Months', months: 5, multiplier: 0.45 },
    { id: 6, name: '6 Months', months: 6, multiplier: 0.52 },
    { id: 7, name: '7 Months', months: 7, multiplier: 0.58 },
    { id: 8, name: '8 Months', months: 8, multiplier: 0.65 },
    { id: 9, name: '9 Months', months: 9, multiplier: 0.72 },
    { id: 10, name: '10 Months', months: 10, multiplier: 0.80 },
    { id: 11, name: '11 Months', months: 11, multiplier: 0.88 },
    { id: 12, name: '12 Months (Annual)', months: 12, multiplier: 1.0 }
  ];

  const insurerOptions = [
    { id: 1, name: 'Jubilee Insurance', rating: 4.5 },
    { id: 2, name: 'CIC Insurance', rating: 4.3 },
    { id: 3, name: 'APA Insurance', rating: 4.2 },
    { id: 4, name: 'ICEA Lion', rating: 4.4 },
    { id: 5, name: 'Heritage Insurance', rating: 4.1 },
    { id: 6, name: 'GA Insurance', rating: 4.0 },
    { id: 7, name: 'Takaful Insurance', rating: 4.2 },
    { id: 8, name: 'Kenindia Insurance', rating: 3.9 }
  ];

  const paymentMethodOptions = [
    { 
      id: 1, 
      name: 'M-Pesa', 
      description: 'Safe mobile money payment via Daraja API',
      fee: 0,
      enabled: true 
    }
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
      type: 'KRA PIN Certificate',
      required: true,
      scannable: true,
      extractFields: ['kraPin', 'fullName'],
      icon: '📋',
      description: 'KRA PIN certificate for tax compliance'
    },
    {
      type: 'Vehicle Logbook',
      required: true,
      scannable: true,
      extractFields: ['vehicleRegistrationNumber', 'makeModel', 'yearOfManufacture', 'vehicleEngineCapacity'],
      icon: '📖',
      description: 'Vehicle logbook for ownership verification'
    },
    {
      type: 'Driving License',
      required: false,
      scannable: true,
      extractFields: ['fullName', 'licenseNumber'],
      icon: '🚗',
      description: 'Valid driving license (optional)'
    },
    {
      type: 'Previous Insurance Certificate',
      required: false,
      scannable: false,
      extractFields: [],
      icon: '📄',
      description: 'Previous insurance certificate (optional)'
    },
    {
      type: 'Vehicle Inspection Report',
      required: false,
      scannable: false,
      extractFields: [],
      icon: '🔍',
      description: 'Vehicle inspection report (optional)'
    }
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.fullName?.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.idNumber?.trim()) newErrors.idNumber = 'ID number is required';
        if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
        if (formData.emailAddress?.trim() && !/\S+@\S+\.\S+/.test(formData.emailAddress)) {
          newErrors.emailAddress = 'Please enter a valid email address';
        }
        break;
      
      case 2:
        if (!formData.vehicleRegistrationNumber?.trim()) newErrors.vehicleRegistrationNumber = 'Vehicle registration is required';
        if (!formData.makeModel) newErrors.makeModel = 'Vehicle make & model is required';
        if (!formData.yearOfManufacture?.trim()) newErrors.yearOfManufacture = 'Year of manufacture is required';
        if (!formData.vehicleEngineCapacity?.trim()) newErrors.vehicleEngineCapacity = 'Engine capacity is required';
        if (!formData.usageType) newErrors.usageType = 'Usage type is required';
        
        // Additional validations
        const currentYear = new Date().getFullYear();
        const year = parseInt(formData.yearOfManufacture);
        if (year && (year < 1980 || year > currentYear)) {
          newErrors.yearOfManufacture = `Year must be between 1980 and ${currentYear}`;
        }
        
        const engineCapacity = parseInt(formData.vehicleEngineCapacity);
        if (engineCapacity && (engineCapacity < 50 || engineCapacity > 8000)) {
          newErrors.vehicleEngineCapacity = 'Engine capacity must be between 50cc and 8000cc';
        }
        break;
      
      case 3:
        if (!formData.insuranceDuration) newErrors.insuranceDuration = 'Insurance duration is required';
        if (!formData.preferredInsurer) newErrors.preferredInsurer = 'Preferred insurer is required';
        break;
      
      case 4:
        const hasKRAPin = formData.documents.some(doc => doc.type === 'KRA PIN Certificate');
        const hasNationalId = formData.documents.some(doc => doc.type === 'National ID Copy');
        const hasLogbook = formData.documents.some(doc => doc.type === 'Vehicle Logbook');
        if (!hasKRAPin || !hasNationalId || !hasLogbook) {
          newErrors.documents = 'KRA PIN, National ID, and Vehicle Logbook are required';
        }
        break;
      
      case 5:
        if (!formData.nextOfKinName?.trim()) newErrors.nextOfKinName = 'Next of kin name is required';
        if (!formData.nextOfKinPhone?.trim()) newErrors.nextOfKinPhone = 'Next of kin phone is required';
        if (!formData.declaration) newErrors.declaration = 'Declaration must be accepted';
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
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
      const quotationNumber = `QUO-MOTOR-${Date.now().toString().slice(-6)}`;
      
      Alert.alert(
        'Motor Insurance Quotation Submitted Successfully',
        `Your motor vehicle insurance quotation has been submitted with reference number: ${quotationNumber}\n\nYou will receive a confirmation email shortly.`,
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
      if (prev[key] === value) return prev; // Prevent unnecessary updates
      return {
        ...prev,
        [key]: value
      };
    });
    
    // Clear error when user starts typing
    setErrors(prev => {
      if (!prev[key]) return prev; // Prevent unnecessary updates
      return {
        ...prev,
        [key]: null
      };
    });
  }, []); // Remove errors dependency to prevent re-renders

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

  const selectMakeModel = (vehicle) => {
    updateFormData('makeModel', vehicle.name);
    setShowMakeModelModal(false);
  };

  const selectUsageType = (usage) => {
    updateFormData('usageType', usage.name);
    setShowUsageTypeModal(false);
  };

  const selectDuration = (duration) => {
    updateFormData('insuranceDuration', duration.name);
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

  // Document scanning and OCR processing with real data
  const scanDocument = async (docType) => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to scan documents.');
        return;
      }

      setIsScanning(true);

      // Present options for document capture
      Alert.alert(
        'Scan Document',
        `How would you like to capture your ${docType.type}?`,
        [
          {
            text: 'Take Photo',
            onPress: () => captureWithCamera(docType)
          },
          {
            text: 'Choose from Gallery',
            onPress: () => selectFromGallery(docType)
          },
          {
            text: 'Upload File',
            onPress: () => selectDocument(docType)
          },
          {
            text: 'Cancel',
            onPress: () => setIsScanning(false),
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Document scanning error:', error);
      Alert.alert('Error', 'Failed to initialize document scanning. Please try again.');
      setIsScanning(false);
    }
  };

  const captureWithCamera = async (docType) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        await processDocumentImage(result.assets[0], docType);
      } else {
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setIsScanning(false);
    }
  };

  const selectFromGallery = async (docType) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        await processDocumentImage(result.assets[0], docType);
      } else {
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Gallery selection error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      setIsScanning(false);
    }
  };

  const selectDocument = async (docType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        await processDocumentFile(result, docType);
      } else {
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Document selection error:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
      setIsScanning(false);
    }
  };

  const processDocumentImage = async (imageAsset, docType) => {
    try {
      // Prepare image for offline OCR processing
      const imageData = {
        uri: imageAsset.uri,
        base64: imageAsset.base64,
        width: imageAsset.width,
        height: imageAsset.height,
        type: 'image/jpeg'
      };

      // Process with FREE offline OCR service
      const ocrResult = await processDocumentOffline(imageData, docType);
      
      if (ocrResult.success && ocrResult.data && Object.keys(ocrResult.data).length > 0) {
        console.log(`Offline OCR successful, confidence: ${Math.round(ocrResult.confidence * 100)}%`);
        
        // Validate extracted data against form inputs
        const mismatches = validateOfflineData(ocrResult.data, formData, docType);
        
        if (mismatches.length > 0) {
          setScannedData(ocrResult.data);
          setValidationMismatches(mismatches);
          setShowValidationDrawer(true);
        } else {
          // Auto-populate validated data
          Object.keys(ocrResult.data).forEach(key => {
            if (formData[key] !== ocrResult.data[key]) {
              updateFormData(key, ocrResult.data[key]);
            }
          });
          
          addDocument(docType, ocrResult.data, imageAsset.uri);
          Alert.alert(
            'Success! 🎉', 
            `Document scanned successfully with FREE offline OCR!\nConfidence: ${Math.round(ocrResult.confidence * 100)}%\n\nData extracted: ${Object.keys(ocrResult.data).join(', ')}`
          );
        }
      } else {
        // OCR failed or no data extracted
        const errorMessage = ocrResult.error || 'Could not extract text from document';
        console.warn('Offline OCR failed:', errorMessage);
        
        Alert.alert(
          'OCR Processing Failed',
          `${errorMessage}\n\nWould you like to upload the document manually?`,
          [
            {
              text: 'Try Again',
              onPress: () => setIsScanning(false)
            },
            {
              text: 'Upload Manually',
              onPress: () => {
                addDocument(docType, null, imageAsset.uri);
                Alert.alert('Document Uploaded', 'Document uploaded successfully. Please verify data manually.');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Document processing error:', error);
      Alert.alert(
        'Processing Error',
        `Failed to process document: ${error.message}\n\nWould you like to upload manually?`,
        [
          {
            text: 'Try Again',
            onPress: () => setIsScanning(false)
          },
          {
            text: 'Upload Manually',
            onPress: () => {
              addDocument(docType, null, imageAsset.uri);
              Alert.alert('Document Uploaded', 'Document uploaded successfully. Please verify data manually.');
            }
          }
        ]
      );
    } finally {
      setIsScanning(false);
    }
  };

  const processDocumentFile = async (documentAsset, docType) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(documentAsset.uri);
      
      if (fileInfo.exists) {
        // For PDF files, inform user about limitations
        if (documentAsset.mimeType === 'application/pdf') {
          Alert.alert(
            'PDF Document Detected',
            'PDF OCR processing is not supported in offline mode. For best results, please take a photo of the document.',
            [
              {
                text: 'Upload PDF Anyway',
                onPress: () => {
                  addDocument(docType, null, documentAsset.uri);
                  Alert.alert('PDF Uploaded', 'PDF document uploaded. Please verify data manually.');
                }
              },
              {
                text: 'Take Photo Instead',
                onPress: () => captureWithCamera(docType)
              }
            ]
          );
        } else {
          // Process image documents with FREE offline OCR
          const imageData = {
            uri: documentAsset.uri,
            type: documentAsset.mimeType
          };
          
          const ocrResult = await processDocumentOffline(imageData, docType);
          
          if (ocrResult.success && ocrResult.data && Object.keys(ocrResult.data).length > 0) {
            const mismatches = validateOfflineData(ocrResult.data, formData, docType);
            
            if (mismatches.length > 0) {
              setScannedData(ocrResult.data);
              setValidationMismatches(mismatches);
              setShowValidationDrawer(true);
            } else {
              Object.keys(ocrResult.data).forEach(key => {
                if (formData[key] !== ocrResult.data[key]) {
                  updateFormData(key, ocrResult.data[key]);
                }
              });
              
              addDocument(docType, ocrResult.data, documentAsset.uri);
              Alert.alert(
                'Success! 🎉', 
                `Document processed successfully with FREE offline OCR!\nConfidence: ${Math.round(ocrResult.confidence * 100)}%`
              );
            }
          } else {
            addDocument(docType, null, documentAsset.uri);
            Alert.alert(
              'OCR Failed',
              `Could not extract text from document.\nError: ${ocrResult.error || 'Unknown error'}\n\nDocument uploaded for manual verification.`
            );
          }
        }
      }
    } catch (error) {
      console.error('File processing error:', error);
      Alert.alert('Error', `Failed to process document file: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Validate extracted data against form inputs using the offline OCR service
  const validateExtractedData = (extractedData, docType) => {
    return validateOfflineData(extractedData, formData, docType);
  };

  // Get user-friendly field labels
  const getFieldLabel = (field) => {
    const labels = {
      fullName: 'Full Name',
      idNumber: 'ID Number',
      vehicleRegistrationNumber: 'Vehicle Registration',
      makeModel: 'Make & Model',
      yearOfManufacture: 'Year of Manufacture',
      vehicleEngineCapacity: 'Engine Capacity',
      kraPin: 'KRA PIN'
    };
    return labels[field] || field;
  };

  // Apply validated data from scanning
  const applyScannedData = (useExtractedData = true) => {
    validationMismatches.forEach(mismatch => {
      const valueToUse = useExtractedData ? mismatch.extractedValue : mismatch.formValue;
      updateFormData(mismatch.field, valueToUse);
    });
    
    const docType = documentTypes.find(dt => 
      dt.extractFields.some(field => validationMismatches.some(m => m.field === field))
    );
    
    if (docType) {
      addDocument(docType, scannedData);
    }
    
    setShowValidationDrawer(false);
    setValidationMismatches([]);
    setScannedData({});
    
    Alert.alert('Success', 'Document data has been applied successfully!');
  };

  const addDocument = (docType, extractedData = null, imageUri = null) => {
    const newDoc = {
      id: Date.now(),
      type: docType.type || docType,
      name: `${docType.type || docType}_${Date.now()}`,
      uploaded: true,
      scanned: !!extractedData,
      extractedData: extractedData || null,
      imageUri: imageUri || null,
      size: imageUri ? 'Processing...' : '2.1 MB',
      status: extractedData ? 'verified' : 'uploaded',
      timestamp: new Date().toISOString()
    };
    
    updateFormData('documents', [...formData.documents, newDoc]);
  };

  const removeDocument = (docId) => {
    updateFormData('documents', formData.documents.filter(doc => doc.id !== docId));
  };

  const calculatePremiumEstimate = () => {
    if (!formData.vehicleEngineCapacity || !formData.yearOfManufacture || !formData.usageType || !formData.insuranceDuration) {
      return 0;
    }

    const engineCapacity = parseInt(formData.vehicleEngineCapacity);
    const year = parseInt(formData.yearOfManufacture);
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - year;
    
    const usageType = usageTypeOptions.find(usage => usage.name === formData.usageType);
    const duration = insuranceDurationOptions.find(dur => dur.name === formData.insuranceDuration);
    
    if (!usageType || !duration) return 0;

    // Base premium calculation for Kenya motor insurance
    let basePremium = 15000; // Base annual amount for Kenya motor insurance
    
    // Engine capacity factor
    if (engineCapacity <= 1000) basePremium *= 1.0;
    else if (engineCapacity <= 1500) basePremium *= 1.2;
    else if (engineCapacity <= 2000) basePremium *= 1.5;
    else basePremium *= 1.8;
    
    // Vehicle age factor (newer cars cost more to insure)
    if (vehicleAge <= 3) basePremium *= 1.3;
    else if (vehicleAge <= 7) basePremium *= 1.1;
    else if (vehicleAge <= 15) basePremium *= 1.0;
    else basePremium *= 0.8;
    
    // Usage type multiplier
    basePremium *= usageType.multiplier;
    
    // Duration multiplier
    basePremium *= duration.multiplier;
    
    // Add government levies (Training Levy 0.2%, Stamp Duty, etc.)
    const levies = basePremium * 0.002 + 50; // Training levy + stamp duty
    
    return Math.round(basePremium + levies);
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
            {step === 2 && 'Vehicle'}
            {step === 3 && 'Insurance'}
            {step === 4 && 'Documents'}
            {step === 5 && 'Review'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>Please provide your personal details for the insurance policy</Text>
      
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
          returnKeyType="done"
          onSubmitEditing={() => handleOnSubmitEditing('emailAddress')}
          blurOnSubmit={true}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.emailAddress && <Text style={styles.errorText}>{errors.emailAddress}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Vehicle Details</Text>
      <Text style={styles.stepDescription}>Information about the vehicle to be insured</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Vehicle Registration Number *</Text>
        <TextInput
          ref={inputRefs.vehicleRegistrationNumber}
          style={[styles.input, errors.vehicleRegistrationNumber && styles.inputError]}
          value={formData.vehicleRegistrationNumber}
          onChangeText={(text) => updateFormData('vehicleRegistrationNumber', text.toUpperCase())}
          placeholder="e.g., KCB 123A"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('vehicleRegistrationNumber', 'yearOfManufacture')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.vehicleRegistrationNumber && <Text style={styles.errorText}>{errors.vehicleRegistrationNumber}</Text>}
      </View>
      
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setShowMakeModelModal(true)}
      >
        <Text style={styles.selectorLabel}>Make & Model *</Text>
        <Text style={styles.selectorValue}>
          {formData.makeModel || 'Select vehicle make & model'}
        </Text>
        <Text style={styles.selectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.makeModel && <Text style={styles.errorText}>{errors.makeModel}</Text>}
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Year of Manufacture *</Text>
        <TextInput
          ref={inputRefs.yearOfManufacture}
          style={[styles.input, errors.yearOfManufacture && styles.inputError]}
          value={formData.yearOfManufacture}
          onChangeText={(text) => updateFormData('yearOfManufacture', text)}
          placeholder="e.g., 2018"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('yearOfManufacture', 'vehicleEngineCapacity')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.yearOfManufacture && <Text style={styles.errorText}>{errors.yearOfManufacture}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Vehicle Engine Capacity (cc) *</Text>
        <TextInput
          ref={inputRefs.vehicleEngineCapacity}
          style={[styles.input, errors.vehicleEngineCapacity && styles.inputError]}
          value={formData.vehicleEngineCapacity}
          onChangeText={(text) => updateFormData('vehicleEngineCapacity', text)}
          placeholder="e.g., 1500"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={() => handleOnSubmitEditing('vehicleEngineCapacity')}
          blurOnSubmit={true}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.vehicleEngineCapacity && <Text style={styles.errorText}>{errors.vehicleEngineCapacity}</Text>}
      </View>
      
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setShowUsageTypeModal(true)}
      >
        <Text style={styles.selectorLabel}>Usage Type *</Text>
        <Text style={styles.selectorValue}>
          {formData.usageType || 'Select vehicle usage type'}
        </Text>
        <Text style={styles.selectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.usageType && <Text style={styles.errorText}>{errors.usageType}</Text>}
    </View>
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
      
      {formData.insuranceDuration && formData.usageType && formData.vehicleEngineCapacity && (
        <View style={styles.premiumSection}>
          <Text style={styles.premiumSectionTitle}>Premium Estimate</Text>
          <View style={styles.premiumItem}>
            <Text style={styles.premiumLabel}>Vehicle:</Text>
            <Text style={styles.premiumValue}>{formData.makeModel || 'Not selected'}</Text>
          </View>
          <View style={styles.premiumItem}>
            <Text style={styles.premiumLabel}>Engine Capacity:</Text>
            <Text style={styles.premiumValue}>{formData.vehicleEngineCapacity || 0}cc</Text>
          </View>
          <View style={styles.premiumItem}>
            <Text style={styles.premiumLabel}>Usage Type:</Text>
            <Text style={styles.premiumValue}>{formData.usageType || 'Not selected'}</Text>
          </View>
          <View style={styles.premiumItem}>
            <Text style={styles.premiumLabel}>Duration:</Text>
            <Text style={styles.premiumValue}>{formData.insuranceDuration || 'Not selected'}</Text>
          </View>
          <View style={styles.premiumItem}>
            <Text style={styles.premiumLabel}>Estimated Premium:</Text>
            <Text style={[styles.premiumValue, { fontWeight: 'bold', color: Colors.primary }]}>
              KES {calculatePremiumEstimate().toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Supporting Documents</Text>
      <Text style={styles.stepDescription}>Scan or upload required documents for automatic data extraction</Text>
      
      <View style={styles.documentsContainer}>
        <Text style={styles.documentsLabel}>Required Documents</Text>
        
        <View style={styles.documentTypeGrid}>
          {documentTypes.map((docType, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.documentTypeButton,
                docType.required && styles.requiredDocumentButton,
                formData.documents.some(doc => doc.type === docType.type) && styles.completedDocumentButton
              ]}
              onPress={() => docType.scannable ? scanDocument(docType) : addDocument(docType)}
              disabled={isScanning}
            >
              <Text style={styles.documentIcon}>{docType.icon}</Text>
              <Text style={[
                styles.documentTypeText,
                docType.required && styles.requiredDocumentText
              ]}>
                {docType.type}
                {docType.required && ' *'}
              </Text>
              <Text style={styles.documentDescription}>{docType.description}</Text>
              
              {docType.scannable && (
                <View style={styles.scanBadge}>
                  <Text style={styles.scanBadgeText}>📷 SCAN</Text>
                </View>
              )}
              
              {formData.documents.some(doc => doc.type === docType.type) && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>✓ UPLOADED</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {isScanning && (
          <View style={styles.scanningOverlay}>
            <Text style={styles.scanningText}>📷 Processing Document...</Text>
            <Text style={styles.scanningSubtext}>Using FREE offline OCR - No internet required!</Text>
            <Text style={styles.scanningSubtext}>Extracting data from your {documentTypes.find(dt => dt.scannable)?.type}...</Text>
          </View>
        )}
        
        {formData.documents.length > 0 && (
          <View style={styles.uploadedDocuments}>
            <Text style={styles.uploadedDocumentsTitle}>Uploaded Documents</Text>
            {formData.documents.map((doc) => (
              <View key={doc.id} style={styles.documentItem}>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.type}</Text>
                  <Text style={styles.documentSize}>
                    {doc.size} • {doc.scanned ? 'Scanned & Verified' : 'Uploaded'} • {doc.status}
                  </Text>
                  {doc.extractedData && (
                    <Text style={styles.extractedDataText}>
                      ✓ Data extracted and verified
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeDocumentButton}
                  onPress={() => removeDocument(doc.id)}
                >
                  <Text style={styles.removeDocumentText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
        {errors.documents && <Text style={styles.errorText}>{errors.documents}</Text>}
        
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>🆓 FREE Smart Document Scanning:</Text>
          <Text style={styles.infoBoxText}>📷 Scan documents with camera - 100% FREE offline OCR!</Text>
          <Text style={styles.infoBoxText}>🔍 Advanced pattern recognition for Kenyan documents</Text>
          <Text style={styles.infoBoxText}>✅ Required: National ID, KRA PIN, Vehicle Logbook</Text>
          <Text style={styles.infoBoxText}>📋 Optional: Driving License, Previous Insurance, Inspection Report</Text>
          <Text style={styles.infoBoxText}>🔒 All processing done locally - your data stays private</Text>
          <Text style={styles.infoBoxText}>📱 No internet required - works completely offline!</Text>
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Declaration</Text>
      <Text style={styles.stepDescription}>Please review your information and provide additional details</Text>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Personal Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Full Name:</Text>
          <Text style={styles.reviewValue}>{formData.fullName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>ID Number:</Text>
          <Text style={styles.reviewValue}>{formData.idNumber}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Phone:</Text>
          <Text style={styles.reviewValue}>{formData.phoneNumber}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Email:</Text>
          <Text style={styles.reviewValue}>{formData.emailAddress || 'Not provided'}</Text>
        </View>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Vehicle & Insurance Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Registration:</Text>
          <Text style={styles.reviewValue}>{formData.vehicleRegistrationNumber}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Vehicle:</Text>
          <Text style={styles.reviewValue}>{formData.makeModel}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Year:</Text>
          <Text style={styles.reviewValue}>{formData.yearOfManufacture}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Engine:</Text>
          <Text style={styles.reviewValue}>{formData.vehicleEngineCapacity}cc</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Usage:</Text>
          <Text style={styles.reviewValue}>{formData.usageType}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Duration:</Text>
          <Text style={styles.reviewValue}>{formData.insuranceDuration}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Insurer:</Text>
          <Text style={styles.reviewValue}>{formData.preferredInsurer}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Documents:</Text>
          <Text style={styles.reviewValue}>{formData.documents.length} uploaded</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Premium:</Text>
          <Text style={[styles.reviewValue, { fontWeight: 'bold', color: Colors.primary }]}>
            KES {calculatePremiumEstimate().toLocaleString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Next of Kin Name *</Text>
        <TextInput
          ref={inputRefs.nextOfKinName}
          style={[styles.input, errors.nextOfKinName && styles.inputError]}
          value={formData.nextOfKinName}
          onChangeText={(text) => updateFormData('nextOfKinName', text)}
          placeholder="Enter next of kin name"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          onSubmitEditing={() => handleOnSubmitEditing('nextOfKinName', 'nextOfKinPhone')}
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.nextOfKinName && <Text style={styles.errorText}>{errors.nextOfKinName}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Next of Kin Phone Number *</Text>
        <TextInput
          ref={inputRefs.nextOfKinPhone}
          style={[styles.input, errors.nextOfKinPhone && styles.inputError]}
          value={formData.nextOfKinPhone}
          onChangeText={(text) => updateFormData('nextOfKinPhone', text)}
          placeholder="+254 700 000 000"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
          returnKeyType="done"
          onSubmitEditing={() => handleOnSubmitEditing('nextOfKinPhone')}
          blurOnSubmit={true}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        {errors.nextOfKinPhone && <Text style={styles.errorText}>{errors.nextOfKinPhone}</Text>}
      </View>
      
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setShowPaymentModal(true)}
      >
        <Text style={styles.selectorLabel}>Payment Method *</Text>
        <Text style={styles.selectorValue}>
          {formData.paymentMethod || 'Select payment method'}
        </Text>
        <Text style={styles.selectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.paymentMethod && <Text style={styles.errorText}>{errors.paymentMethod}</Text>}
      
      <TouchableOpacity
        style={styles.declarationContainer}
        onPress={() => updateFormData('declaration', !formData.declaration)}
      >
        <View style={[styles.checkbox, formData.declaration && styles.checkboxChecked]}>
          {formData.declaration && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.declarationText}>
          I declare that the information provided is true and accurate. I understand the terms and conditions of the motor vehicle insurance policy.
        </Text>
      </TouchableOpacity>
      {errors.declaration && <Text style={styles.errorText}>{errors.declaration}</Text>}
    </View>
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
                  {item.category && (
                    <Text style={styles.modalOptionCategory}>Category: {item.category}</Text>
                  )}
                  {item.rating && (
                    <Text style={styles.modalOptionRating}>Rating: {item.rating}/5</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // Validation Drawer for Document Mismatches
  const renderValidationDrawer = () => (
    <Modal
      visible={showValidationDrawer}
      transparent
      animationType="slide"
      onRequestClose={() => setShowValidationDrawer(false)}
    >
      <View style={styles.validationOverlay}>
        <View style={styles.validationDrawer}>
          <View style={styles.validationHeader}>
            <Text style={styles.validationTitle}>⚠️ Data Verification Required</Text>
            <Text style={styles.validationSubtitle}>
              We found mismatches between your form data and scanned document
            </Text>
          </View>
          
          <ScrollView style={styles.validationContent}>
            {validationMismatches.map((mismatch, index) => (
              <View key={index} style={styles.mismatchItem}>
                <Text style={styles.mismatchLabel}>{mismatch.fieldLabel}</Text>
                
                <View style={styles.mismatchComparison}>
                  <View style={styles.mismatchOption}>
                    <Text style={styles.mismatchOptionLabel}>Your Input:</Text>
                    <Text style={styles.formDataValue}>{mismatch.formValue}</Text>
                  </View>
                  
                  <Text style={styles.mismatchVs}>VS</Text>
                  
                  <View style={styles.mismatchOption}>
                    <Text style={styles.mismatchOptionLabel}>Scanned Data:</Text>
                    <Text style={styles.scannedDataValue}>{mismatch.extractedValue}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.validationActions}>
            <TouchableOpacity
              style={styles.validationButton}
              onPress={() => applyScannedData(false)}
            >
              <Text style={styles.validationButtonText}>Keep My Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.validationButton, styles.primaryValidationButton]}
              onPress={() => applyScannedData(true)}
            >
              <Text style={[styles.validationButtonText, styles.primaryValidationButtonText]}>
                Use Scanned Data
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar style="light" />
        <CompactCurvedHeader 
          title={vehicleCategory ? `${vehicleCategory.name} Insurance` : 'Motor Insurance'}
          subtitle="Complete your vehicle insurance quotation"
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
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerSpacing: {
    height: Spacing.xs, // Further reduced for maximum form space
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, // Reduced from md for more compact design
    backgroundColor: Colors.white,
  },
  progressBar: {
    height: 3, // Reduced from 4 for more compact design
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    marginBottom: Spacing.xs, // Reduced for tighter spacing
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.xs, // Reduced for more compact design
    fontWeight: Typography.fontWeight.medium, // Updated from fontFamily
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs, // Reduced from sm for more compact design
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.lightGray,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium, // Updated from fontFamily
    color: Colors.textSecondary,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.regular, // Updated from fontFamily
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium, // Updated from fontFamily
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.sm, // Reduced from md
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Spacing.sm, // Reduced for minimal spacing
  },
  formCard: {
    marginVertical: Spacing.xs, // Reduced from sm
    marginHorizontal: Spacing.xs, // Keep minimal
    minHeight: width * 0.4, // Further reduced
  },
  stepContent: {
    padding: Spacing.md, // Reduced from lg for much tighter spacing
    minHeight: width * 0.3, // Significantly reduced
  },
  stepTitle: {
    fontSize: Typography.fontSize.lg, // Reduced from xl
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm, // Reduced from md
  },
  stepDescription: {
    fontSize: Typography.fontSize.sm, // Reduced from md
    fontWeight: Typography.fontWeight.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.md, // Reduced from lg
    lineHeight: 20, // Reduced from 22
  },
  inputContainer: {
    marginBottom: Spacing.sm, // Further reduced for minimal spacing
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm, // Reduced from md
    fontWeight: Typography.fontWeight.medium, // Updated from fontFamily
    color: Colors.textPrimary,
    marginBottom: Spacing.xs, // Significantly reduced
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md, // Reduced from lg
    paddingVertical: Spacing.md, // Reduced from lg
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular, // Updated from fontFamily
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    minHeight: 44, // Reduced from 52
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.xs, // Reduced from sm
    fontWeight: Typography.fontWeight.regular, // Updated from fontFamily
    color: Colors.error,
    marginTop: Spacing.xs, // Reduced from sm
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md, // Reduced from lg
    paddingVertical: Spacing.md, // Reduced from xl
    backgroundColor: Colors.white,
    marginBottom: Spacing.sm, // Reduced from lg
    minHeight: 44, // Reduced from 64
  },
  selectorLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  selectorValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  selectorIcon: {
    position: 'absolute',
    right: Spacing.lg,
    top: '50%',
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  premiumSection: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
  },
  premiumSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  premiumItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  premiumLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  premiumValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  documentsContainer: {
    marginBottom: Spacing.md, // Reduced from xl
  },
  documentsLabel: {
    fontSize: Typography.fontSize.sm, // Reduced from md
    fontWeight: Typography.fontWeight.medium, // Updated from fontFamily
    color: Colors.textPrimary,
    marginBottom: Spacing.sm, // Reduced from lg
  },
  documentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm, // Reduced from md
  },
  documentTypeButton: {
    paddingHorizontal: Spacing.md, // Reduced from lg
    paddingVertical: Spacing.md, // Increased for more space
    borderRadius: 12, // More rounded for modern look
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minWidth: '48%',
    alignItems: 'center',
    marginBottom: Spacing.sm, // Reduced from sm
    minHeight: 120, // Increased for icon + text + description
  },
  requiredDocumentButton: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  completedDocumentButton: {
    backgroundColor: Colors.lightGray,
    borderColor: Colors.success,
  },
  documentIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  documentTypeText: {
    fontSize: Typography.fontSize.xs, // Reduced from sm
    fontWeight: Typography.fontWeight.medium, // Updated from fontFamily
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  requiredDocumentText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  documentDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  scanBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  scanBadgeText: {
    fontSize: 8,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  completedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  completedBadgeText: {
    fontSize: 8,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  scanningOverlay: {
    backgroundColor: Colors.lightGray,
    padding: Spacing.lg,
    borderRadius: 12,
    marginVertical: Spacing.md,
    alignItems: 'center',
  },
  scanningText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  scanningSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  extractedDataText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.xs,
  },
  uploadedDocuments: {
    marginTop: Spacing.md, // Reduced from xl
  },
  uploadedDocumentsTitle: {
    fontSize: Typography.fontSize.sm, // Reduced from md
    fontWeight: Typography.fontWeight.medium, // Updated from fontFamily
    color: Colors.textPrimary,
    marginBottom: Spacing.sm, // Reduced from lg
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm, // Reduced from md
    paddingHorizontal: Spacing.md, // Reduced from lg
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  documentSize: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  removeDocumentButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  removeDocumentText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
  },
  infoBox: {
    backgroundColor: Colors.lightGray,
    padding: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.lg,
  },
  infoBoxTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoBoxText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  reviewSection: {
    marginBottom: Spacing.md, // Reduced from xl
  },
  reviewSectionTitle: {
    fontSize: Typography.fontSize.md, // Reduced from lg
    fontWeight: Typography.fontWeight.semibold, // Updated from fontFamily
    color: Colors.textPrimary,
    marginBottom: Spacing.sm, // Reduced from lg
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs, // Reduced from md
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  reviewLabel: {
    fontSize: Typography.fontSize.sm, // Reduced from md
    fontWeight: Typography.fontWeight.medium, // Updated from fontFamily
    color: Colors.textSecondary,
    flex: 1,
  },
  reviewValue: {
    fontSize: Typography.fontSize.sm, // Reduced from md
    fontWeight: Typography.fontWeight.regular, // Updated from fontFamily
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  declarationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  declarationText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  footer: {
    padding: Spacing.lg, // Reduced from xl
    paddingBottom: Spacing.md, // Add specific bottom padding
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm, // Reduced from md
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm, // Reduced from md
    borderRadius: 6, // Reduced from 8
    alignItems: 'center',
    minHeight: 40, // Reduced from 44
  },
  primaryButtonFullWidth: {
    flex: 1,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.sm, // Reduced from md
    fontWeight: Typography.fontWeight.semibold, // Changed from fontFamily
    color: Colors.white,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm, // Reduced from md
    borderRadius: 6, // Reduced from 8
    alignItems: 'center',
    minHeight: 40, // Reduced from 44
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.sm, // Reduced from md
    fontWeight: Typography.fontWeight.medium, // Changed from fontFamily
    color: Colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    padding: Spacing.sm,
  },
  modalCloseText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  modalOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalOptionDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  modalOptionCategory: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  modalOptionRating: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
  
  // Validation Drawer Styles
  validationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  validationDrawer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  validationHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  validationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.warning,
    marginBottom: Spacing.xs,
  },
  validationSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  validationContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  mismatchItem: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
  },
  mismatchLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  mismatchComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mismatchOption: {
    flex: 1,
    alignItems: 'center',
  },
  mismatchOptionLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  formDataValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.error,
    textAlign: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  scannedDataValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.success,
    textAlign: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  mismatchVs: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.sm,
  },
  validationActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  validationButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  primaryValidationButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  validationButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  primaryValidationButtonText: {
    color: Colors.white,
  },
});
