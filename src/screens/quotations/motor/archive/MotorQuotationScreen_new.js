/**
 * Motor Vehicle Insurance Quotation Screen
 * 
 * Multi-step form for collecting motor vehicle insurance information
 * Based on the claims submission step pattern and XML form structure
 * Supports Third Party, Comprehensive, and Commercial vehicle insurance
 */

import React, { useState, useRef } from 'react';
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
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../../constants';
import { SafeScreen, EnhancedCard } from '../../../components';

const { width } = Dimensions.get('window');

export default function MotorQuotationScreen({ navigation, route }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
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
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

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
    { id: 1, name: '90 Days', days: 90, multiplier: 0.3 },
    { id: 2, name: '180 Days', days: 180, multiplier: 0.6 },
    { id: 3, name: '365 Days (1 Year)', days: 365, multiplier: 1.0 }
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
    { id: 1, name: 'M-Pesa', description: 'Mobile money payment' },
    { id: 2, name: 'Bank Transfer', description: 'Direct bank transfer' },
    { id: 3, name: 'Credit Card', description: 'Visa/Mastercard payment' },
    { id: 4, name: 'Debit Card', description: 'Bank debit card' },
    { id: 5, name: 'Airtel Money', description: 'Airtel mobile money' },
    { id: 6, name: 'Cheque', description: 'Bank cheque payment' }
  ];

  const documentTypes = [
    'KRA PIN Certificate',
    'National ID Copy',
    'Logbook/Ownership Proof',
    'Driving License',
    'Previous Insurance Certificate',
    'Vehicle Inspection Report'
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
        const hasLogbook = formData.documents.some(doc => doc.type === 'Logbook/Ownership Proof');
        if (!hasKRAPin || !hasNationalId || !hasLogbook) {
          newErrors.documents = 'KRA PIN, National ID, and Logbook are required';
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

  const updateFormData = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: null
      }));
    }
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

  const addDocument = (docType) => {
    const newDoc = {
      id: Date.now(),
      type: docType,
      name: `${docType}_${Date.now()}`,
      uploaded: true,
      size: '2.1 MB'
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

    // Base premium calculation
    let basePremium = 15000; // Base amount for Kenya motor insurance
    
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
          style={[styles.input, errors.fullName && styles.inputError]}
          value={formData.fullName}
          onChangeText={(text) => updateFormData('fullName', text)}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>ID Number *</Text>
        <TextInput
          style={[styles.input, errors.idNumber && styles.inputError]}
          value={formData.idNumber}
          onChangeText={(text) => updateFormData('idNumber', text)}
          placeholder="Enter your national ID number"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
        {errors.idNumber && <Text style={styles.errorText}>{errors.idNumber}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData('phoneNumber', text)}
          placeholder="+254 700 000 000"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address (Optional)</Text>
        <TextInput
          style={[styles.input, errors.emailAddress && styles.inputError]}
          value={formData.emailAddress}
          onChangeText={(text) => updateFormData('emailAddress', text)}
          placeholder="your.email@example.com"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
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
          style={[styles.input, errors.vehicleRegistrationNumber && styles.inputError]}
          value={formData.vehicleRegistrationNumber}
          onChangeText={(text) => updateFormData('vehicleRegistrationNumber', text.toUpperCase())}
          placeholder="e.g., KCB 123A"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
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
          style={[styles.input, errors.yearOfManufacture && styles.inputError]}
          value={formData.yearOfManufacture}
          onChangeText={(text) => updateFormData('yearOfManufacture', text)}
          placeholder="e.g., 2018"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
        />
        {errors.yearOfManufacture && <Text style={styles.errorText}>{errors.yearOfManufacture}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Vehicle Engine Capacity (cc) *</Text>
        <TextInput
          style={[styles.input, errors.vehicleEngineCapacity && styles.inputError]}
          value={formData.vehicleEngineCapacity}
          onChangeText={(text) => updateFormData('vehicleEngineCapacity', text)}
          placeholder="e.g., 1500"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
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
      <Text style={styles.stepDescription}>Upload required documents for your motor insurance</Text>
      
      <View style={styles.documentsContainer}>
        <Text style={styles.documentsLabel}>Add Documents</Text>
        
        <View style={styles.documentTypeGrid}>
          {documentTypes.map((docType) => (
            <TouchableOpacity
              key={docType}
              style={styles.documentTypeButton}
              onPress={() => addDocument(docType)}
            >
              <Text style={styles.documentTypeText}>{docType}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {formData.documents.length > 0 && (
          <View style={styles.uploadedDocuments}>
            <Text style={styles.uploadedDocumentsTitle}>Uploaded Documents</Text>
            {formData.documents.map((doc) => (
              <View key={doc.id} style={styles.documentItem}>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.name}</Text>
                  <Text style={styles.documentSize}>{doc.size}</Text>
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
          <Text style={styles.infoBoxTitle}>Required Documents:</Text>
          <Text style={styles.infoBoxText}>• KRA PIN Certificate (mandatory)</Text>
          <Text style={styles.infoBoxText}>• National ID Copy (mandatory)</Text>
          <Text style={styles.infoBoxText}>• Logbook/Ownership Proof (mandatory)</Text>
          <Text style={styles.infoBoxText}>• Additional supporting documents (optional)</Text>
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
          style={[styles.input, errors.nextOfKinName && styles.inputError]}
          value={formData.nextOfKinName}
          onChangeText={(text) => updateFormData('nextOfKinName', text)}
          placeholder="Enter next of kin name"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.nextOfKinName && <Text style={styles.errorText}>{errors.nextOfKinName}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Next of Kin Phone Number *</Text>
        <TextInput
          style={[styles.input, errors.nextOfKinPhone && styles.inputError]}
          value={formData.nextOfKinPhone}
          onChangeText={(text) => updateFormData('nextOfKinPhone', text)}
          placeholder="+254 700 000 000"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
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

  return (
    <SafeScreen>
      <StatusBar style="dark" />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Motor Insurance</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderProgressBar()}
        {renderStepIndicator()}

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
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

      {renderModalSelector(
        showMakeModelModal,
        () => setShowMakeModelModal(false),
        vehicleMakeModels,
        selectMakeModel,
        'Select Vehicle Make & Model'
      )}

      {renderModalSelector(
        showUsageTypeModal,
        () => setShowUsageTypeModal(false),
        usageTypeOptions,
        selectUsageType,
        'Select Usage Type'
      )}

      {renderModalSelector(
        showDurationModal,
        () => setShowDurationModal(false),
        insuranceDurationOptions,
        selectDuration,
        'Select Insurance Duration'
      )}

      {renderModalSelector(
        showInsurerModal,
        () => setShowInsurerModal(false),
        insurerOptions,
        selectInsurer,
        'Select Preferred Insurer'
      )}

      {renderModalSelector(
        showPaymentModal,
        () => setShowPaymentModal(false),
        paymentMethodOptions,
        selectPaymentMethod,
        'Select Payment Method'
      )}
    </SafeScreen>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  backButtonText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: Spacing.lg,
  },
  stepContent: {
    padding: Spacing.lg,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  selectorValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  selectorIcon: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  premiumSection: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  premiumSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  premiumItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
    marginBottom: Spacing.lg,
  },
  documentsLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  documentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  documentTypeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minWidth: '45%',
    alignItems: 'center',
  },
  documentTypeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  uploadedDocuments: {
    marginTop: Spacing.lg,
  },
  uploadedDocumentsTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    marginBottom: Spacing.sm,
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  removeDocumentText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
  },
  infoBox: {
    backgroundColor: Colors.lightGray,
    padding: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.md,
  },
  infoBoxTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoBoxText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  reviewSection: {
    marginBottom: Spacing.lg,
  },
  reviewSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  reviewLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  reviewValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  declarationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    marginRight: Spacing.sm,
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
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonFullWidth: {
    flex: 1,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
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
});
