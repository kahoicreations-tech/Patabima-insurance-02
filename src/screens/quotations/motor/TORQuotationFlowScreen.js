/**
 * TOR Motor Insurance Quotation Flow
 * Complete 5-step process for TOR private motor insurance
 * Based on real underwriter requirements and competitive rates
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors, Typography, Spacing } from '../../../constants';
import { 
  TOR_UNDERWRITERS, 
  TOR_REQUIRED_DOCUMENTS, 
  TOR_DOCUMENT_STATUS, 
  TOR_VALIDATION_MESSAGES, 
  calculateTORPremium 
} from '../../../data/torMotorData';

const TORQuotationFlowScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const { vehicleCategory, productType, productName } = route?.params || {};
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    emailAddress: '',
    yearOfManufacture: '', // Changed from dateOfBirth
    
    // Step 2: Vehicle Details  
    registrationNumber: '',
    make: '',
    model: '',
    yearOfManufacture: '', // This will be the main one used
    engineCapacity: '',
    vehicleValue: '',
    usageType: 'private',
    
    // Step 3: Insurance Details
    selectedUnderwriter: null,
    policyDuration: '12',
    startDate: new Date().toISOString().split('T')[0],
    
    // Step 4: Documents
    documents: [],
    
    // Step 5: Payment
    paymentMethod: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showUnderwriterModal, setShowUnderwriterModal] = useState(false);
  const [calculatedQuote, setCalculatedQuote] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState(''); // 'dob' or 'policyStart'
  const [tempDate, setTempDate] = useState(new Date());
  
  // Document preview states
  const [previewDocument, setPreviewDocument] = useState(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);

  const totalSteps = 5;

  // Comprehensive Kenyan vehicle makes
  const vehicleMakes = [
    'Toyota', 'Nissan', 'Mitsubishi', 'Honda', 'Mazda', 'Subaru',
    'Isuzu', 'Ford', 'Hyundai', 'Kia', 'Suzuki', 'Daihatsu',
    'Volkswagen', 'Mercedes-Benz', 'BMW', 'Audi', 'Land Rover', 'Jeep',
    'Chevrolet', 'Peugeot', 'Renault', 'Fiat', 'Volvo', 'Jaguar',
    'Lexus', 'Infiniti', 'Acura', 'Cadillac', 'Chrysler', 'Dodge',
    'Mahindra', 'Tata', 'Great Wall', 'Chery', 'JAC', 'Foton',
    'Other'
  ];

  // Date picker functions
  const openDatePicker = (type) => {
    setDatePickerType(type);
    if (type === 'policyStart' && formData.startDate) {
      setTempDate(new Date(formData.startDate));
    } else {
      setTempDate(new Date());
    }
    setShowDatePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'ios') {
        // On iOS, we'll update immediately
        updateDateField(datePickerType, selectedDate);
      }
    }
  };

  const confirmDate = () => {
    updateDateField(datePickerType, tempDate);
    setShowDatePicker(false);
  };

  const cancelDatePicker = () => {
    setShowDatePicker(false);
  };

  const updateDateField = (field, date) => {
    if (field === 'policyStart') {
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      setFormData({ ...formData, startDate: formattedDate });
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Select Date';
    // For policy start date, format as DD/MM/YYYY
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const usageTypes = [
    { id: 'private', name: 'Private Use Only', description: 'Personal and family use' },
    { id: 'business', name: 'Business Use', description: 'Commercial business activities' },
    { id: 'uber', name: 'Ride-Hailing', description: 'Uber, Bolt, Little Cab' }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
        if (!formData.registrationNumber?.trim()) newErrors.registrationNumber = 'Registration number is required';
        if (!formData.make?.trim()) newErrors.make = 'Vehicle make is required';
        if (!formData.model?.trim()) newErrors.model = 'Vehicle model is required';
        if (!formData.yearOfManufacture?.trim()) newErrors.yearOfManufacture = 'Year of manufacture is required';
        if (!formData.startDate?.trim()) newErrors.startDate = 'Policy start date is required';
        if (!formData.engineCapacity?.trim()) newErrors.engineCapacity = 'Engine capacity is required';
        if (!formData.vehicleValue?.trim()) newErrors.vehicleValue = 'Vehicle value is required';
        
        // Additional validations
        const currentYear = new Date().getFullYear();
        const year = parseInt(formData.yearOfManufacture);
        if (year && (year < 1990 || year > currentYear)) {
          newErrors.yearOfManufacture = `Year must be between 1990 and ${currentYear}`;
        }
        
        const value = parseFloat(formData.vehicleValue);
        if (value && value < 200000) {
          newErrors.vehicleValue = 'Vehicle value must be at least KSh 200,000';
        }
        
        // Validate policy start date is not in the past
        if (formData.startDate) {
          const startDate = new Date(formData.startDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (startDate < today) {
            newErrors.startDate = 'Policy start date cannot be in the past';
          }
        }
        break;
      
      case 3:
        if (!formData.selectedUnderwriter) newErrors.selectedUnderwriter = 'Please select an underwriter';
        break;
      
      case 4:
        const hasNationalId = formData.documents.some(doc => doc.type === 'National ID Copy');
        const hasDrivingLicense = formData.documents.some(doc => doc.type === 'Driving License');
        const hasLogbook = formData.documents.some(doc => doc.type === 'Vehicle Logbook');
        if (!hasNationalId || !hasDrivingLicense || !hasLogbook) {
          newErrors.documents = 'National ID, Driving License, and Vehicle Logbook are required';
        }
        break;
      
      case 5:
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Please select a payment method';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateQuote = () => {
    if (!formData.vehicleValue || !formData.selectedUnderwriter) return;
    
    const vehicleAge = new Date().getFullYear() - parseInt(formData.yearOfManufacture);
    const factors = {
      vehicleAge,
      engineCapacity: parseInt(formData.engineCapacity),
      usageType: formData.usageType,
      vehicleAge: calculateVehicleAge(formData.yearOfManufacture)
    };
    
    const quote = calculateTORPremium(
      parseFloat(formData.vehicleValue),
      formData.selectedUnderwriter.id,
      factors
    );
    
    setCalculatedQuote(quote);
  };

  const calculateVehicleAge = (yearOfManufacture) => {
    if (!yearOfManufacture) return 5; // Default vehicle age
    const currentYear = new Date().getFullYear();
    const vehicleYear = parseInt(yearOfManufacture);
    const age = currentYear - vehicleYear;
    return Math.max(0, age); // Ensure age is not negative
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        calculateQuote();
      }
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const addDocument = async (docType) => {
    // Find document type details from the requirements
    const docTypeDetails = TOR_REQUIRED_DOCUMENTS.find(doc => doc.name === docType);
    
    if (!docTypeDetails) {
      Alert.alert('Error', 'Invalid document type');
      return;
    }
    
    // Create action sheet with camera and document options
    Alert.alert(
      `Upload ${docType}`,
      'Choose upload method',
      [
        {
          text: 'Take Photo',
          onPress: () => captureDocument(docTypeDetails),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImageFromGallery(docTypeDetails),
        },
        {
          text: 'Select Document',
          onPress: () => pickDocument(docTypeDetails),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };
  
  const captureDocument = async (docTypeDetails) => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture documents');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileSize = await calculateFileSize(asset.uri);
        
        // Process captured image
        processDocumentUpload(docTypeDetails, {
          uri: asset.uri,
          name: `${docTypeDetails.name.replace(/\s+/g, '_')}_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: fileSize,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image: ' + error.message);
    }
  };
  
  const pickImageFromGallery = async (docTypeDetails) => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to pick documents');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileSize = await calculateFileSize(asset.uri);
        
        // Process selected image
        processDocumentUpload(docTypeDetails, {
          uri: asset.uri,
          name: `${docTypeDetails.name.replace(/\s+/g, '_')}_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: fileSize,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };
  
  const pickDocument = async (docTypeDetails) => {
    try {
      // Launch document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check if file format is supported
        const fileExtension = asset.name.split('.').pop().toLowerCase();
        const supportedFormats = docTypeDetails.formats.map(f => f.toLowerCase());
        
        if (!supportedFormats.includes(fileExtension)) {
          Alert.alert('Invalid Format', `This document only supports ${docTypeDetails.formats.join(', ')} formats`);
          return;
        }
        
        // Process selected document
        processDocumentUpload(docTypeDetails, {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
          size: asset.size,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document: ' + error.message);
    }
  };
  
  const calculateFileSize = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.size;
    } catch (error) {
      console.log('Error getting file size:', error);
      return 0;
    }
  };
  
  const processDocumentUpload = (docTypeDetails, fileInfo) => {
    // Convert bytes to MB for display
    const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
    
    // Check if file size exceeds maximum
    const maxSizeMB = parseFloat(docTypeDetails.maxSize.replace('MB', ''));
    if (fileSizeMB > maxSizeMB) {
      Alert.alert('File Too Large', `Maximum file size is ${docTypeDetails.maxSize}`);
      return;
    }
    
    // Create document object
    const newDoc = {
      id: Date.now(),
      type: docTypeDetails.name,
      name: fileInfo.name,
      uri: fileInfo.uri,
      fileType: fileInfo.type,
      size: `${fileSizeMB} MB`,
      uploaded: true,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
    
    // Update form data with new document
    updateFormData('documents', [...formData.documents, newDoc]);
    
    // Show success message
    Alert.alert('Upload Successful', `${docTypeDetails.name} uploaded successfully`);
    
    // If scannable, simulate OCR processing (in a real app this would call an OCR service)
    if (docTypeDetails.scannable) {
      simulateOCRProcessing(docTypeDetails, newDoc);
    }
  };
  
  const simulateOCRProcessing = (docTypeDetails, document) => {
    // In a real app, this would send the document to an OCR service
    // For now, we'll simulate extracting data based on the document type
    
    // Example extracted data based on document type
    let extractedData = {};
    
    if (docTypeDetails.id === 'national_id') {
      // Simulate extracting data from National ID
      extractedData = {
        fullName: formData.fullName || 'John Doe',
        idNumber: formData.idNumber || '12345678',
        dateOfBirth: '01/01/1980'
      };
    } else if (docTypeDetails.id === 'driving_license') {
      // Simulate extracting data from Driving License
      extractedData = {
        fullName: formData.fullName || 'John Doe',
        licenseNumber: 'DL' + Math.floor(Math.random() * 1000000),
        expiryDate: '31/12/2028'
      };
    } else if (docTypeDetails.id === 'logbook') {
      // Simulate extracting data from Vehicle Logbook
      extractedData = {
        registrationNumber: formData.registrationNumber || 'KAB123C',
        makeModel: `${formData.make || 'Toyota'} ${formData.model || 'Corolla'}`,
        yearOfManufacture: formData.yearOfManufacture || '2018',
        engineCapacity: formData.engineCapacity || '1500',
        chassisNumber: 'CH' + Math.floor(Math.random() * 1000000000)
      };
    }
    
    console.log(`OCR Extracted Data for ${document.type}:`, extractedData);
    
    // In a real app, you would update the form with extracted data
    // and validate it against the form data
  };

  const removeDocument = (docId) => {
    updateFormData('documents', formData.documents.filter(doc => doc.id !== docId));
  };

  const processPayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Payment Successful!',
        `Your TOR insurance policy has been purchased successfully. Policy Number: TOR${Date.now()}`,
        [
          {
            text: 'View Policy',
            onPress: () => navigation.navigate('PolicySuccess', {
              policyData: {
                ...formData,
                quote: calculatedQuote,
                policyNumber: `TOR${Date.now()}`,
                productType: 'TOR Private Motor'
              }
            })
          }
        ]
      );
    }, 3000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalDetails();
      case 2:
        return renderVehicleDetails();
      case 3:
        return renderInsuranceDetails();
      case 4:
        return renderDocuments();
      case 5:
        return renderPaymentConfirmation();
      default:
        return null;
    }
  };

  const renderPersonalDetails = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Enter your personal details for the TOR insurance policy</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={[styles.input, errors.fullName && styles.inputError]}
          value={formData.fullName}
          onChangeText={(value) => updateFormData('fullName', value)}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>National ID Number *</Text>
        <TextInput
          style={[styles.input, errors.idNumber && styles.inputError]}
          value={formData.idNumber}
          onChangeText={(value) => updateFormData('idNumber', value)}
          placeholder="Enter ID number"
          keyboardType="numeric"
          maxLength={8}
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.idNumber && <Text style={styles.errorText}>{errors.idNumber}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number (M-PESA) *</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          value={formData.phoneNumber}
          onChangeText={(value) => updateFormData('phoneNumber', value)}
          placeholder="0712345678"
          keyboardType="phone-pad"
          maxLength={10}
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address (Optional)</Text>
        <TextInput
          style={[styles.input, errors.emailAddress && styles.inputError]}
          value={formData.emailAddress}
          onChangeText={(value) => updateFormData('emailAddress', value)}
          placeholder="your.email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.emailAddress && <Text style={styles.errorText}>{errors.emailAddress}</Text>}
      </View>
    </View>
  );

  const renderVehicleDetails = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vehicle Information</Text>
      <Text style={styles.stepSubtitle}>Provide details about the vehicle to be insured</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Registration Number *</Text>
        <TextInput
          style={[styles.input, errors.registrationNumber && styles.inputError]}
          value={formData.registrationNumber}
          onChangeText={(value) => updateFormData('registrationNumber', value.toUpperCase())}
          placeholder="KCA123A"
          autoCapitalize="characters"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.registrationNumber && <Text style={styles.errorText}>{errors.registrationNumber}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Vehicle Make *</Text>
        <TextInput
          style={[styles.input, errors.make && styles.inputError]}
          value={formData.make}
          onChangeText={(value) => updateFormData('make', value)}
          placeholder="e.g. Toyota, Nissan, Honda"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Vehicle Model *</Text>
        <TextInput
          style={[styles.input, errors.model && styles.inputError]}
          value={formData.model}
          onChangeText={(value) => updateFormData('model', value)}
          placeholder="e.g., Corolla, Vitz, Fielder"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Vehicle Year of Manufacture (For age-based pricing) *</Text>
        <TextInput
          style={[styles.input, errors.yearOfManufacture && styles.inputError]}
          value={formData.yearOfManufacture}
          onChangeText={(value) => updateFormData('yearOfManufacture', value)}
          placeholder="e.g. 2020"
          keyboardType="numeric"
          maxLength={4}
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.yearOfManufacture && <Text style={styles.errorText}>{errors.yearOfManufacture}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Policy Start Date *</Text>
        <TouchableOpacity
          style={[styles.input, styles.datePickerButton]}
          onPress={() => openDatePicker('policyStart')}
        >
          <Text style={[
            styles.datePickerText, 
            !formData.startDate && styles.placeholderText
          ]}>
            {formatDisplayDate(formData.startDate)}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
        {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
      </View>
      
      <View style={styles.rowContainer}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: Spacing.sm }]}>
          <Text style={styles.inputLabel}>Engine (CC) *</Text>
          <TextInput
            style={[styles.input, errors.engineCapacity && styles.inputError]}
            value={formData.engineCapacity}
            onChangeText={(value) => updateFormData('engineCapacity', value)}
            placeholder="1500"
            keyboardType="numeric"
            placeholderTextColor={Colors.textSecondary}
          />
          {errors.engineCapacity && <Text style={styles.errorText}>{errors.engineCapacity}</Text>}
        </View>
        
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Vehicle Value (KSh) *</Text>
          <TextInput
            style={[styles.input, errors.vehicleValue && styles.inputError]}
            value={formData.vehicleValue}
            onChangeText={(value) => updateFormData('vehicleValue', value)}
            placeholder="2500000"
            keyboardType="numeric"
            placeholderTextColor={Colors.textSecondary}
          />
          {errors.vehicleValue && <Text style={styles.errorText}>{errors.vehicleValue}</Text>}
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Usage Type *</Text>
        <View style={styles.usageContainer}>
          {usageTypes.map((usage) => (
            <TouchableOpacity
              key={usage.id}
              style={[
                styles.usageOption,
                formData.usageType === usage.id && styles.usageOptionSelected
              ]}
              onPress={() => updateFormData('usageType', usage.id)}
            >
              <Text style={[
                styles.usageOptionText,
                formData.usageType === usage.id && styles.usageOptionTextSelected
              ]}>
                {usage.name}
              </Text>
              <Text style={styles.usageOptionDescription}>{usage.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderInsuranceDetails = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select TOR Insurance Provider</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred underwriter for TOR coverage</Text>
      
      <View style={styles.underwritersContainer}>
        {TOR_UNDERWRITERS.map((underwriter) => (
          <TouchableOpacity
            key={underwriter.id}
            style={[
              styles.underwriterCard,
              formData.selectedUnderwriter?.id === underwriter.id && styles.underwriterCardSelected
            ]}
            onPress={() => updateFormData('selectedUnderwriter', underwriter)}
          >
            <View style={styles.underwriterHeader}>
              <View style={styles.underwriterInfo}>
                <Text style={styles.underwriterName}>{underwriter.name}</Text>
                <Text style={styles.underwriterSpecialization}>{underwriter.specialization}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={Colors.warning} />
                  <Text style={styles.ratingText}>{underwriter.rating}</Text>
                </View>
              </View>
              <View style={styles.rateContainer}>
                <Text style={styles.rateText}>{underwriter.torRates.privateVehicle}%</Text>
                <Text style={styles.rateLabel}>Base Rate</Text>
              </View>
            </View>
            
            <View style={styles.featuresContainer}>
              {underwriter.torFeatures.slice(0, 3).map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.minimumContainer}>
              <Text style={styles.minimumText}>
                Minimum Premium: KSh {underwriter.torRates.baseMinimum.toLocaleString()}
              </Text>
            </View>
            
            {/* Pricing Logic Demonstration */}
            {underwriter.pricingLogic && (
              <View style={styles.pricingLogicContainer}>
                <Text style={styles.pricingLogicTitle}>💡 Pricing Logic</Text>
                <Text style={styles.pricingFormula}>{underwriter.pricingLogic.formula}</Text>
                <Text style={styles.pricingDemo}>{underwriter.pricingLogic.demonstration}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {errors.selectedUnderwriter && <Text style={styles.errorText}>{errors.selectedUnderwriter}</Text>}
      
      {calculatedQuote && (
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteTitle}>Your TOR Insurance Quote</Text>
          <View style={styles.quoteBreakdown}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Basic Premium:</Text>
              <Text style={styles.quoteValue}>KSh {calculatedQuote.basicPremium.toLocaleString()}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Training Levy:</Text>
              <Text style={styles.quoteValue}>KSh {calculatedQuote.trainingLevy.toLocaleString()}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>PCF:</Text>
              <Text style={styles.quoteValue}>KSh {calculatedQuote.pcf.toLocaleString()}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Stamp Duty:</Text>
              <Text style={styles.quoteValue}>KSh {calculatedQuote.stampDuty.toLocaleString()}</Text>
            </View>
            <View style={[styles.quoteRow, styles.quoteTotalRow]}>
              <Text style={styles.quoteTotalLabel}>Total Premium:</Text>
              <Text style={styles.quoteTotalValue}>KSh {calculatedQuote.totalPremium.toLocaleString()}</Text>
            </View>
            <View style={styles.excessInfo}>
              <Text style={styles.excessLabel}>Your Excess (Deductible):</Text>
              <Text style={styles.excessValue}>KSh {calculatedQuote.excessAmount.toLocaleString()}</Text>
              <Text style={styles.excessNote}>Amount you pay first in case of a claim</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Upload Required Documents</Text>
      <Text style={styles.stepSubtitle}>Upload clear photos or scans of the required documents</Text>
      
      <View style={styles.documentsContainer}>
        {TOR_REQUIRED_DOCUMENTS.map((docType) => {
          const uploaded = formData.documents.find(doc => doc.type === docType.name);
          
          return (
            <View key={docType.id} style={styles.documentItem}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentName}>
                  {docType.name} {docType.required && '*'}
                </Text>
                <Text style={styles.documentDescription}>{docType.description}</Text>
              </View>
              
              {uploaded ? (
                <View>
                  <View style={styles.uploadedContainer}>
                    <View style={styles.uploadedInfo}>
                      {uploaded.fileType?.includes('image') ? (
                        <Ionicons name="image" size={20} color={Colors.success} />
                      ) : uploaded.fileType?.includes('pdf') ? (
                        <Ionicons name="document-text" size={20} color={Colors.success} />
                      ) : (
                        <Ionicons name="document" size={20} color={Colors.success} />
                      )}
                      <Text style={styles.uploadedText}>
                        {uploaded.name.length > 25 ? uploaded.name.substring(0, 22) + '...' : uploaded.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeDocument(uploaded.id)}
                    >
                      <Ionicons name="trash" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Document Preview */}
                  {uploaded.uri && uploaded.fileType?.includes('image') && (
                    <View style={styles.documentPreviewContainer}>
                      <Image 
                        source={{ uri: uploaded.uri }} 
                        style={styles.documentPreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.previewOverlay}
                        onPress={() => {
                          setPreviewDocument(uploaded);
                          setShowDocumentPreview(true);
                        }}
                      >
                        <Ionicons name="eye" size={24} color={Colors.white} />
                        <Text style={styles.previewText}>Preview</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* PDF document indicator */}
                  {uploaded.uri && uploaded.fileType?.includes('pdf') && (
                    <TouchableOpacity 
                      style={styles.pdfPreviewContainer}
                      onPress={() => {
                        setPreviewDocument(uploaded);
                        setShowDocumentPreview(true);
                      }}
                    >
                      <Ionicons name="document-text" size={32} color={Colors.error} />
                      <Text style={styles.pdfText}>PDF Document</Text>
                      <Text style={styles.pdfSize}>{uploaded.size}</Text>
                    </TouchableOpacity>
                  )}
                  
                  <Text style={styles.uploadTimeText}>
                    Uploaded: {new Date(uploaded.timestamp || Date.now()).toLocaleTimeString()}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => addDocument(docType.name)}
                >
                  <View style={styles.uploadButtonContent}>
                    <Ionicons name="cloud-upload" size={24} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>Upload {docType.name}</Text>
                  </View>
                  <View style={styles.uploadOptionsRow}>
                    <View style={styles.uploadOption}>
                      <Ionicons name="camera" size={16} color={Colors.primary} />
                      <Text style={styles.uploadOptionText}>Camera</Text>
                    </View>
                    <View style={styles.uploadOption}>
                      <Ionicons name="image" size={16} color={Colors.primary} />
                      <Text style={styles.uploadOptionText}>Gallery</Text>
                    </View>
                    <View style={styles.uploadOption}>
                      <Ionicons name="document" size={16} color={Colors.primary} />
                      <Text style={styles.uploadOptionText}>Files</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
      
      {errors.documents && <Text style={styles.errorText}>{errors.documents}</Text>}
    </View>
  );

  const renderPaymentConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Payment & Confirmation</Text>
      <Text style={styles.stepSubtitle}>Review your TOR insurance details and proceed with payment</Text>
      
      {calculatedQuote && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Policy Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle:</Text>
            <Text style={styles.summaryValue}>{formData.make} {formData.model} ({formData.yearOfManufacture})</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Registration:</Text>
            <Text style={styles.summaryValue}>{formData.registrationNumber}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Insurer:</Text>
            <Text style={styles.summaryValue}>{formData.selectedUnderwriter?.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Coverage Type:</Text>
            <Text style={styles.summaryValue}>TOR Private Motor</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Premium:</Text>
            <Text style={styles.summaryValue}>KSh {calculatedQuote.totalPremium.toLocaleString()}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Excess:</Text>
            <Text style={styles.summaryValue}>KSh {calculatedQuote.excessAmount.toLocaleString()}</Text>
          </View>
        </View>
      )}
      
      <View style={styles.paymentMethodContainer}>
        <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>
        
        <TouchableOpacity
          style={[
            styles.paymentOption,
            formData.paymentMethod === 'mpesa' && styles.paymentOptionSelected
          ]}
          onPress={() => updateFormData('paymentMethod', 'mpesa')}
        >
          <View style={styles.paymentOptionContent}>
            <Ionicons name="phone-portrait" size={24} color={Colors.success} />
            <View style={styles.paymentOptionText}>
              <Text style={styles.paymentOptionTitle}>M-PESA</Text>
              <Text style={styles.paymentOptionDescription}>Pay with M-PESA STK Push</Text>
            </View>
          </View>
          {formData.paymentMethod === 'mpesa' && (
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          )}
        </TouchableOpacity>
      </View>
      
      {errors.paymentMethod && <Text style={styles.errorText}>{errors.paymentMethod}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TOR Insurance</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>
        
        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={prevStep}
            >
              <Text style={styles.prevButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={currentStep === totalSteps ? processPayment : nextStep}
            disabled={isProcessing}
          >
            <Text style={styles.nextButtonText}>
              {isProcessing ? 'Processing...' : currentStep === totalSteps ? 'Pay Now' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={cancelDatePicker}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={cancelDatePicker}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>
                  Select Policy Start Date
                </Text>
                <TouchableOpacity onPress={confirmDate}>
                  <Text style={styles.datePickerConfirm}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()} // Only future dates for policy start
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Document Preview Modal */}
      {showDocumentPreview && previewDocument && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showDocumentPreview}
          onRequestClose={() => setShowDocumentPreview(false)}
        >
          <View style={styles.documentPreviewOverlay}>
            <View style={styles.documentPreviewModalContainer}>
              <View style={styles.documentPreviewHeader}>
                <Text style={styles.documentPreviewTitle}>
                  {previewDocument.type}
                </Text>
                <TouchableOpacity 
                  style={styles.documentPreviewClose}
                  onPress={() => setShowDocumentPreview(false)}
                >
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              {previewDocument.fileType?.includes('image') ? (
                <Image 
                  source={{ uri: previewDocument.uri }}
                  style={styles.documentPreviewImage}
                  resizeMode="contain"
                />
              ) : previewDocument.fileType?.includes('pdf') ? (
                <View style={styles.pdfPreviewFull}>
                  <Ionicons name="document-text" size={64} color={Colors.error} />
                  <Text style={styles.pdfPreviewText}>
                    PDF Document Preview
                  </Text>
                  <Text style={styles.pdfPreviewNote}>
                    In a full implementation, this would use a PDF viewer component
                  </Text>
                </View>
              ) : (
                <View style={styles.genericPreview}>
                  <Ionicons name="document" size={64} color={Colors.primary} />
                  <Text style={styles.genericPreviewText}>
                    Document Preview
                  </Text>
                </View>
              )}
              
              <View style={styles.documentPreviewDetails}>
                <Text style={styles.documentPreviewFilename}>
                  {previewDocument.name}
                </Text>
                <Text style={styles.documentPreviewSize}>
                  Size: {previewDocument.size}
                </Text>
                {previewDocument.timestamp && (
                  <Text style={styles.documentPreviewTime}>
                    Uploaded: {new Date(previewDocument.timestamp).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  progressContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
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
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  touchableInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  rowContainer: {
    flexDirection: 'row',
  },
  usageContainer: {
    marginTop: Spacing.xs,
  },
  usageOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.white,
  },
  usageOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundLightBlue,
  },
  usageOptionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  usageOptionTextSelected: {
    color: Colors.primary,
  },
  usageOptionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  underwritersContainer: {
    marginTop: Spacing.sm,
  },
  underwriterCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  underwriterCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  underwriterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  underwriterInfo: {
    flex: 1,
  },
  underwriterName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  underwriterSpecialization: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginVertical: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },
  rateContainer: {
    alignItems: 'center',
  },
  rateText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  rateLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  featuresContainer: {
    marginBottom: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  featureText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  minimumContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  minimumText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quoteContainer: {
    backgroundColor: Colors.backgroundLightBlue,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  quoteTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  quoteBreakdown: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quoteLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  quoteValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  quoteTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  quoteTotalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  quoteTotalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  excessInfo: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  excessLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  excessValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
  excessNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  documentsContainer: {
    marginTop: Spacing.sm,
  },
  documentItem: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  documentHeader: {
    marginBottom: Spacing.sm,
  },
  documentName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  documentDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploadedText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    marginLeft: Spacing.xs,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  uploadButton: {
    backgroundColor: Colors.backgroundLightBlue,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  uploadButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  uploadOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: Spacing.sm,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadOptionText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginLeft: 4,
  },
  documentPreviewContainer: {
    height: 120,
    borderRadius: 8,
    marginTop: Spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  documentPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    color: Colors.white,
    marginTop: 4,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  pdfPreviewContainer: {
    height: 80,
    borderRadius: 8,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(220,220,220,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  pdfSize: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  uploadTimeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  summaryContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  paymentMethodContainer: {
    marginTop: Spacing.md,
  },
  paymentMethodTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  paymentOption: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundLightBlue,
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: Spacing.md,
  },
  paymentOptionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  paymentOptionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: Colors.backgroundLight,
    marginRight: Spacing.md,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  prevButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },
  
  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  datePickerText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  datePickerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  datePickerCancel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  datePickerConfirm: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  
  // Pricing Logic Demonstration Styles
  pricingLogicContainer: {
    backgroundColor: Colors.backgroundLightBlue,
    padding: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  pricingLogicTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  pricingFormula: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  pricingDemo: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  
  // Document preview modal styles
  documentPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentPreviewModalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  documentPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  documentPreviewTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  documentPreviewClose: {
    padding: Spacing.xs,
  },
  documentPreviewImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#f0f0f0',
  },
  pdfPreviewFull: {
    height: 300,
    width: '100%',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  pdfPreviewText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  pdfPreviewNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  genericPreview: {
    height: 300,
    width: '100%',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genericPreviewText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  documentPreviewDetails: {
    padding: Spacing.md,
  },
  documentPreviewFilename: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  documentPreviewSize: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  documentPreviewTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default TORQuotationFlowScreen;
