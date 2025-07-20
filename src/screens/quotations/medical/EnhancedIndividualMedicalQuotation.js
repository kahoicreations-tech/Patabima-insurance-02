/**
 * Enhanced Individual & Family Medical Insurance Quotation Screen
 * Based on the enhanced multi-step form pattern
 * 3-Step Process: Personal Info → Coverage Options → Documents & Summary
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { 
  EnhancedTextInput, 
  EnhancedEmailInput, 
  EnhancedPhoneInput, 
  EnhancedIDInput, 
  EnhancedDatePicker
} from '../../../components/EnhancedFormComponents';
import { EnhancedDocumentUpload } from '../../../components/EnhancedDocumentUpload';

const EnhancedIndividualMedicalQuotation = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form Data for Individual/Family Medical Insurance
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: '',
    idNumber: '',
    dateOfBirth: '',
    phoneNumber: '',
    emailAddress: '',
    gender: '',
    
    // Step 2: Coverage Options
    coverType: 'individual', // individual, couple, family
    coverLimit: '',
    inpatient: true,
    outpatient: true,
    dental: false,
    optical: false,
    maternity: false,
    nhifRegistered: false,
    nhifNumber: '',
    preExistingConditions: [],
    dependentsCount: '0',
    dependents: [],
    
    // Step 3: Documents & Summary
    preferredInsurer: '',
    estimatedPremium: 0,
    uploadIDCopy: null,
    uploadMedicalReports: null,
    uploadDependentDocs: null,
    declaration: false
  });

  // Medical Insurance Options
  const genderOptions = [
    { id: 'male', name: 'Male' },
    { id: 'female', name: 'Female' },
    { id: 'other', name: 'Other' }
  ];

  const coverTypeOptions = [
    { 
      id: 'individual', 
      name: 'Individual Cover', 
      description: 'For yourself only',
      icon: 'person'
    },
    { 
      id: 'family', 
      name: 'Family Cover', 
      description: 'For you and dependents',
      icon: 'people'
    }
  ];

  const coverLimitOptions = [
    { id: '500k', name: 'KES 500,000', value: 500000 },
    { id: '1m', name: 'KES 1,000,000', value: 1000000 },
    { id: '2m', name: 'KES 2,000,000', value: 2000000 },
    { id: '3m', name: 'KES 3,000,000', value: 3000000 },
    { id: '5m', name: 'KES 5,000,000', value: 5000000 },
    { id: '10m', name: 'KES 10,000,000', value: 10000000 }
  ];

  const preExistingConditionsOptions = [
    { id: 'none', name: 'None', exclusive: true },
    { id: 'diabetes', name: 'Diabetes' },
    { id: 'hypertension', name: 'Hypertension' },
    { id: 'asthma', name: 'Asthma' },
    { id: 'heart-disease', name: 'Heart Disease' },
    { id: 'cancer', name: 'Cancer' },
    { id: 'kidney-disease', name: 'Kidney Disease' },
    { id: 'mental-health', name: 'Mental Health Conditions' },
    { id: 'other', name: 'Other (specify in documents)' }
  ];

  const insurerOptions = [
    { id: 'jubilee', name: 'Jubilee Insurance', rating: 4.5 },
    { id: 'aar', name: 'AAR Insurance', rating: 4.6 },
    { id: 'cic', name: 'CIC Insurance', rating: 4.3 },
    { id: 'britam', name: 'Britam Insurance', rating: 4.2 },
    { id: 'madison', name: 'Madison Insurance', rating: 4.0 },
    { id: 'icea', name: 'ICEA LION Insurance', rating: 4.4 },
    { id: 'resolution', name: 'Resolution Insurance', rating: 4.1 }
  ];

  // Document types required for medical insurance
  const documentTypes = [
    {
      id: 'id_copy',
      type: 'National ID Copy',
      required: true,
      description: 'Clear copy of your National ID (front and back)'
    },
    {
      id: 'photo',
      type: 'Passport Photo',
      required: true,
      description: 'Recent passport-sized photo'
    },
    {
      id: 'medical_reports',
      type: 'Medical Reports',
      required: false,
      description: 'Any relevant medical reports for pre-existing conditions'
    },
    {
      id: 'dependent_docs',
      type: 'Dependent Documents',
      required: false,
      description: 'Birth certificates or IDs for dependents (if applicable)'
    }
  ];

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => {
      // Special handling for cover type changes
      if (field === 'coverType' && value !== prev.coverType) {
        // Reset dependents if switching from family to individual
        if (value === 'individual') {
          return { 
            ...prev, 
            [field]: value, 
            dependentsCount: '0',
            dependents: [],
            maternity: false
          };
        }
        // Default dependent count for family
        if (value === 'family') {
          return { ...prev, [field]: value, dependentsCount: '1' };
        }
      }
      
      // Handle pre-existing conditions special logic
      if (field === 'preExistingConditions') {
        // If 'None' is selected, clear all other selections
        if (value.some(item => item.id === 'none')) {
          return { ...prev, [field]: value.filter(item => item.id === 'none') };
        }
        
        // If another option is selected while 'None' is already selected, remove 'None'
        if (prev.preExistingConditions.some(item => item.id === 'none')) {
          return { ...prev, [field]: value.filter(item => item.id !== 'none') };
        }
      }
      
      // Handle dependents count changes
      if (field === 'dependentsCount') {
        const count = parseInt(value) || 0;
        let dependents = [...prev.dependents];
        
        // Adjust dependents array size
        if (count < dependents.length) {
          // Remove excess dependents
          dependents = dependents.slice(0, count);
        } else if (count > dependents.length) {
          // Add new empty dependents
          for (let i = dependents.length; i < count; i++) {
            dependents.push({
              id: `dependent_${i}`,
              name: '',
              relationship: '',
              dateOfBirth: '',
              gender: ''
            });
          }
        }
        
        return { ...prev, [field]: value, dependents };
      }
      
      return { ...prev, [field]: value };
    });
  }, []);

  const calculatePremium = useCallback(() => {
    const basePremiums = {
      individual: 30000, // KES 30,000 base annual premium
      family: 55000     // KES 55,000 for family (includes primary + 1 dependent)
    };
    
    // Get base premium based on cover type
    let premium = basePremiums[formData.coverType] || basePremiums.individual;
    
    // Add per dependent (beyond included dependents in family plan)
    if (formData.coverType === 'family') {
      const includedDependents = 2; // Assumes family plan includes 2 dependents
      const additionalDependents = Math.max(0, parseInt(formData.dependentsCount) - includedDependents);
      premium += additionalDependents * 15000; // KES 15,000 per additional dependent
    }
    
    // Adjust based on cover limit selection
    const selectedCoverLimit = coverLimitOptions.find(option => option.id === formData.coverLimit);
    if (selectedCoverLimit) {
      // Factor based on cover limit tier
      const limitFactor = selectedCoverLimit.value / 1000000; // Factor based on millions
      premium = premium * (1 + (limitFactor * 0.1)); // 10% increase per million in cover
    }
    
    // Add-ons pricing
    if (formData.dental) premium += 5000;   // Dental add-on
    if (formData.optical) premium += 4000;  // Optical add-on
    if (formData.maternity) premium += 15000; // Maternity add-on
    
    // Pre-existing conditions adjustment (excluding 'None')
    const conditionsCount = formData.preExistingConditions.filter(c => c.id !== 'none').length;
    if (conditionsCount > 0) {
      premium += premium * (conditionsCount * 0.15); // 15% premium increase per condition
    }
    
    // NHIF discount
    if (formData.nhifRegistered) {
      premium *= 0.95; // 5% discount for NHIF members
    }
    
    return Math.round(premium);
  }, [formData, coverLimitOptions]);

  const handleCoverTypeSelect = (type) => {
    updateFormData('coverType', type.id);
  };

  const handleCoverLimitSelect = (limit) => {
    updateFormData('coverLimit', limit.id);
  };

  const handleInsurerSelect = (insurer) => {
    updateFormData('preferredInsurer', insurer.id);
  };

  const toggleOption = (option) => {
    updateFormData(option, !formData[option]);
  };

  const handlePreExistingConditionSelect = (condition) => {
    const currentConditions = [...formData.preExistingConditions];
    
    // Check if condition is already selected
    const alreadySelected = currentConditions.some(c => c.id === condition.id);
    
    if (alreadySelected) {
      // Remove the condition
      updateFormData('preExistingConditions', 
        currentConditions.filter(c => c.id !== condition.id)
      );
    } else {
      // Add the condition
      if (condition.id === 'none') {
        // If "None" selected, clear all others
        updateFormData('preExistingConditions', [condition]);
      } else {
        // Otherwise add to list, but remove "None" if present
        updateFormData('preExistingConditions', 
          [...currentConditions.filter(c => c.id !== 'none'), condition]
        );
      }
    }
  };

  const handleGenderSelect = (gender) => {
    updateFormData('gender', gender.id);
  };

  const validateStep = (step) => {
    const errors = [];
    
    switch (step) {
      case 1: // Personal Information
        if (!formData.fullName.trim()) errors.push('Full Name is required');
        if (!formData.idNumber.trim()) errors.push('ID Number is required');
        if (!formData.dateOfBirth) errors.push('Date of Birth is required');
        if (!formData.phoneNumber.trim()) errors.push('Phone Number is required');
        if (!formData.gender) errors.push('Gender is required');
        
        // Email validation if provided
        if (formData.emailAddress.trim() && !/^\S+@\S+\.\S+$/.test(formData.emailAddress)) {
          errors.push('Valid Email Address is required');
        }
        break;
        
      case 2: // Coverage Options
        if (!formData.coverType) errors.push('Cover Type is required');
        if (!formData.coverLimit) errors.push('Cover Limit is required');
        
        // If NHIF registered, validate NHIF number
        if (formData.nhifRegistered && !formData.nhifNumber.trim()) {
          errors.push('NHIF Number is required');
        }
        
        // Dependent count validation (should be a number)
        const dependentCount = parseInt(formData.dependentsCount);
        if (isNaN(dependentCount) || dependentCount < 0) {
          errors.push('Valid Dependent Count is required');
        }
        
        // If dependents exist, validate each dependent's information
        if (dependentCount > 0) {
          formData.dependents.forEach((dependent, index) => {
            if (!dependent.name.trim()) {
              errors.push(`Dependent ${index + 1} name is required`);
            }
            if (!dependent.dateOfBirth) {
              errors.push(`Dependent ${index + 1} date of birth is required`);
            }
          });
        }
        break;
        
      case 3: // Documents & Summary
        if (!formData.preferredInsurer) errors.push('Preferred Insurer is required');
        if (!formData.uploadIDCopy) errors.push('ID Copy is required');
        if (!formData.uploadPhoto) errors.push('Passport Photo is required');
        if (!formData.declaration) errors.push('Declaration must be accepted');
        
        // If family cover with dependents, validate dependent docs
        if (formData.coverType === 'family' && parseInt(formData.dependentsCount) > 0 && !formData.uploadDependentDocs) {
          errors.push('Dependent Documents are required for family cover');
        }
        
        // If pre-existing conditions (other than "None"), validate medical reports
        if (formData.preExistingConditions.some(c => c.id !== 'none') && !formData.uploadMedicalReports) {
          errors.push('Medical Reports are required for declared pre-existing conditions');
        }
        break;
    }
    
    return errors;
  };

  const nextStep = () => {
    const errors = validateStep(currentStep);
    
    if (errors.length > 0) {
      Alert.alert(
        'Validation Error',
        `Please fix the following errors:\n\n${errors.join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (currentStep < totalSteps) {
      if (currentStep === 2) {
        // Calculate premium before final step
        const premium = calculatePremium();
        updateFormData('estimatedPremium', premium);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // Go back to category selection if on first step
      navigation.goBack();
    }
  };

  const handleUploadDocument = (docType) => {
    Alert.alert(
      'Upload Document',
      `Please select how you want to upload your ${docType.type}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handleTakePhoto(docType) },
        { text: 'Choose File', onPress: () => handleChooseFile(docType) }
      ]
    );
  };

  const handleTakePhoto = (docType) => {
    // Simulate photo capture
    updateFormData(`upload${docType.id.replace(/_([a-z])/g, g => g[1].toUpperCase())}`, {
      name: `${docType.type}_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: Math.floor(Math.random() * 1000000) + 500000, // Random size between 500KB and 1.5MB
      uri: 'file://simulated-photo-path.jpg'
    });
  };

  const handleChooseFile = (docType) => {
    // Simulate file selection
    updateFormData(`upload${docType.id.replace(/_([a-z])/g, g => g[1].toUpperCase())}`, {
      name: `${docType.type}_${Date.now()}.pdf`,
      type: 'application/pdf',
      size: Math.floor(Math.random() * 2000000) + 1000000, // Random size between 1MB and 3MB
      uri: 'file://simulated-file-path.pdf'
    });
  };

  const handleSubmit = () => {
    const errors = validateStep(currentStep);
    
    if (errors.length > 0) {
      Alert.alert(
        'Validation Error',
        `Please fix the following errors:\n\n${errors.join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Simulate submission
    Alert.alert(
      'Submit Quotation',
      'Your medical insurance quotation will be submitted. Our team will process it and contact you shortly.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Submit',
          onPress: () => {
            // Simulate API call with a delay
            setTimeout(() => {
              // Generate quotation reference number
              const quoteRef = `MED-${Date.now().toString().slice(-6)}`;
              
              Alert.alert(
                'Quotation Submitted',
                `Your medical insurance quotation has been submitted successfully!\n\nReference Number: ${quoteRef}\n\nOne of our agents will contact you within 24 hours.`,
                [
                  { 
                    text: 'View All Quotations', 
                    onPress: () => navigation.navigate('Quotations') 
                  },
                  { 
                    text: 'Done', 
                    onPress: () => navigation.navigate('Home') 
                  }
                ]
              );
            }, 1500);
          }
        }
      ]
    );
  };

  // Render functions for each step
  const renderPersonalInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Please provide your personal details for the medical insurance quotation
      </Text>
      
      <EnhancedTextInput
        label="Full Name"
        value={formData.fullName}
        onChangeText={(text) => updateFormData('fullName', text)}
        placeholder="Enter your full name"
        required
      />
      
      <EnhancedIDInput
        label="ID Number"
        value={formData.idNumber}
        onChangeText={(text) => updateFormData('idNumber', text)}
        required
      />
      
      <EnhancedDatePicker
        label="Date of Birth"
        value={formData.dateOfBirth}
        onDateChange={(date) => updateFormData('dateOfBirth', date)}
        required
      />
      
      <EnhancedPhoneInput
        label="Phone Number"
        value={formData.phoneNumber}
        onChangeText={(text) => updateFormData('phoneNumber', text)}
        required
      />
      
      <EnhancedEmailInput
        label="Email Address"
        value={formData.emailAddress}
        onChangeText={(text) => updateFormData('emailAddress', text)}
      />
      
      {/* Gender Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
        <View style={styles.optionsContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                formData.gender === option.id && styles.selectedOption
              ]}
              onPress={() => handleGenderSelect(option)}
            >
              <Text 
                style={[
                  styles.optionText,
                  formData.gender === option.id && styles.selectedOptionText
                ]}
              >
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderCoverageOptions = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Coverage Options</Text>
      <Text style={styles.stepDescription}>
        Select your preferred medical coverage options
      </Text>
      
      {/* Cover Type Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cover Type <Text style={styles.required}>*</Text></Text>
        <View style={styles.simpleSelectionContainer}>
          {coverTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.simpleSelectionItem,
                formData.coverType === option.id && styles.selectedSimpleItem
              ]}
              onPress={() => handleCoverTypeSelect(option)}
            >
              <View style={styles.simpleSelectionContent}>
                <View style={styles.simpleSelectionIcon}>
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={formData.coverType === option.id ? '#D5222B' : '#646767'} 
                  />
                </View>
                <View style={styles.simpleSelectionText}>
                  <Text style={[
                    styles.simpleSelectionTitle,
                    formData.coverType === option.id && styles.selectedSimpleTitle
                  ]}>
                    {option.name}
                  </Text>
                  <Text style={[
                    styles.simpleSelectionDescription,
                    formData.coverType === option.id && styles.selectedSimpleDescription
                  ]}>
                    {option.description}
                  </Text>
                </View>
                <View style={[
                  styles.radioButton,
                  formData.coverType === option.id && styles.radioButtonSelected
                ]}>
                  {formData.coverType === option.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Cover Limit Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cover Limit <Text style={styles.required}>*</Text></Text>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.coverLimitContainer}
        >
          {coverLimitOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.coverLimitOption,
                formData.coverLimit === option.id && styles.selectedCoverLimit
              ]}
              onPress={() => handleCoverLimitSelect(option)}
            >
              <Text 
                style={[
                  styles.coverLimitText,
                  formData.coverLimit === option.id && styles.selectedCoverLimitText
                ]}
              >
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Additional Benefits */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Additional Benefits</Text>
        <View style={styles.benefitsContainer}>
          <TouchableOpacity 
            style={styles.benefitOption}
            onPress={() => toggleOption('inpatient')}
          >
            <View style={[
              styles.checkbox,
              formData.inpatient && styles.checkboxSelected
            ]}>
              {formData.inpatient && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.benefitText}>Inpatient Cover</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.benefitOption}
            onPress={() => toggleOption('outpatient')}
          >
            <View style={[
              styles.checkbox,
              formData.outpatient && styles.checkboxSelected
            ]}>
              {formData.outpatient && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.benefitText}>Outpatient Cover</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.benefitOption}
            onPress={() => toggleOption('dental')}
          >
            <View style={[
              styles.checkbox,
              formData.dental && styles.checkboxSelected
            ]}>
              {formData.dental && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.benefitText}>Dental Cover</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.benefitOption}
            onPress={() => toggleOption('optical')}
          >
            <View style={[
              styles.checkbox,
              formData.optical && styles.checkboxSelected
            ]}>
              {formData.optical && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.benefitText}>Optical Cover</Text>
          </TouchableOpacity>
          
          {/* Only show maternity option for family cover */}
          {(formData.coverType === 'family' || formData.coverType === 'couple') && (
            <TouchableOpacity 
              style={styles.benefitOption}
              onPress={() => toggleOption('maternity')}
            >
              <View style={[
                styles.checkbox,
                formData.maternity && styles.checkboxSelected
              ]}>
                {formData.maternity && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.benefitText}>Maternity Cover</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* NHIF Registration */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>NHIF Registration</Text>
        <View style={styles.nhifContainer}>
          <TouchableOpacity 
            style={styles.benefitOption}
            onPress={() => toggleOption('nhifRegistered')}
          >
            <View style={[
              styles.checkbox,
              formData.nhifRegistered && styles.checkboxSelected
            ]}>
              {formData.nhifRegistered && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.benefitText}>I am registered with NHIF</Text>
          </TouchableOpacity>
          
          {formData.nhifRegistered && (
            <EnhancedTextInput
              label="NHIF Number"
              value={formData.nhifNumber}
              onChangeText={(text) => updateFormData('nhifNumber', text)}
              placeholder="Enter NHIF number"
              keyboardType="numeric"
              required
            />
          )}
        </View>
      </View>
      
      {/* Pre-existing Conditions */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pre-existing Conditions</Text>
        <Text style={styles.infoText}>
          Select all conditions that apply. This information helps us provide an accurate quote.
        </Text>
        <View style={styles.conditionsContainer}>
          {preExistingConditionsOptions.map((condition) => (
            <TouchableOpacity 
              key={condition.id}
              style={styles.conditionOption}
              onPress={() => handlePreExistingConditionSelect(condition)}
            >
              <View style={[
                styles.checkbox,
                formData.preExistingConditions.some(c => c.id === condition.id) && styles.checkboxSelected
              ]}>
                {formData.preExistingConditions.some(c => c.id === condition.id) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.conditionText}>{condition.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Dependents information (for Family Cover) */}
      {formData.coverType !== 'individual' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {formData.coverType === 'couple' ? 'Spouse Information' : 'Dependents Information'}
          </Text>
          
          {formData.coverType === 'family' && (
            <EnhancedTextInput
              label="Number of Dependents"
              value={formData.dependentsCount}
              onChangeText={(text) => {
                // Allow only numbers and limit to reasonable range (0-10)
                const cleaned = text.replace(/[^0-9]/g, '');
                const count = parseInt(cleaned) || 0;
                updateFormData('dependentsCount', Math.min(10, count).toString());
              }}
              placeholder="Enter number of dependents"
              keyboardType="numeric"
              required
            />
          )}
          
          {/* Dependent details - only show if there are dependents */}
          {(formData.coverType === 'couple' || (formData.coverType === 'family' && parseInt(formData.dependentsCount) > 0)) && (
            <View style={styles.dependentsContainer}>
              <Text style={styles.subLabel}>
                {formData.coverType === 'couple' ? 'Spouse Details' : 'Dependent Details'}
              </Text>
              
              {/* Display form fields for each dependent */}
              {formData.dependents.map((dependent, index) => (
                <View key={dependent.id} style={styles.dependentCard}>
                  <Text style={styles.dependentTitle}>
                    {formData.coverType === 'couple' ? 'Spouse' : `Dependent ${index + 1}`}
                  </Text>
                  
                  <EnhancedTextInput
                    label="Full Name"
                    value={dependent.name}
                    onChangeText={(text) => {
                      const updatedDependents = [...formData.dependents];
                      updatedDependents[index].name = text;
                      updateFormData('dependents', updatedDependents);
                    }}
                    placeholder="Enter full name"
                    required
                  />
                  
                  <EnhancedDatePicker
                    label="Date of Birth"
                    value={dependent.dateOfBirth}
                    onDateChange={(date) => {
                      const updatedDependents = [...formData.dependents];
                      updatedDependents[index].dateOfBirth = date;
                      updateFormData('dependents', updatedDependents);
                    }}
                    required
                  />
                  
                  <View style={styles.dependentRelationship}>
                    <Text style={styles.label}>
                      {formData.coverType === 'couple' ? 'Relationship: Spouse' : 'Relationship'}
                    </Text>
                    {formData.coverType !== 'couple' && (
                      <View style={styles.relationshipOptions}>
                        <TouchableOpacity
                          style={[
                            styles.relationshipOption,
                            dependent.relationship === 'child' && styles.selectedOption
                          ]}
                          onPress={() => {
                            const updatedDependents = [...formData.dependents];
                            updatedDependents[index].relationship = 'child';
                            updateFormData('dependents', updatedDependents);
                          }}
                        >
                          <Text style={styles.optionText}>Child</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.relationshipOption,
                            dependent.relationship === 'other' && styles.selectedOption
                          ]}
                          onPress={() => {
                            const updatedDependents = [...formData.dependents];
                            updatedDependents[index].relationship = 'other';
                            updateFormData('dependents', updatedDependents);
                          }}
                        >
                          <Text style={styles.optionText}>Other</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderDocumentsAndSummary = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Documents & Summary</Text>
      <Text style={styles.stepDescription}>
        Upload required documents and review your quotation
      </Text>
      
      {/* Document Upload Section */}
      <View style={styles.documentsSection}>
        <Text style={styles.sectionTitle}>Required Documents</Text>
        <Text style={styles.infoText}>
          Please upload clear copies of the required documents
        </Text>
        
        <View style={styles.documentList}>
          {documentTypes.map((doc) => {
            // Only show dependent docs for family cover with dependents
            if (doc.id === 'dependent_docs' && 
                (formData.coverType === 'individual' || parseInt(formData.dependentsCount) === 0)) {
              return null;
            }
            
            // Only show medical reports if pre-existing conditions selected
            if (doc.id === 'medical_reports' && 
                (!formData.preExistingConditions.length || 
                 (formData.preExistingConditions.length === 1 && 
                  formData.preExistingConditions[0].id === 'none'))) {
              return null;
            }
            
            const fieldName = `upload${doc.id.replace(/_([a-z])/g, g => g[1].toUpperCase())}`;
            const isUploaded = formData[fieldName] !== null;
            
            return (
              <View key={doc.id} style={styles.documentItem}>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>
                    {doc.type}
                    {doc.required && <Text style={styles.required}> *</Text>}
                  </Text>
                  <Text style={styles.documentDescription}>{doc.description}</Text>
                  
                  {isUploaded && (
                    <View style={styles.uploadedFile}>
                      <Ionicons name="document-text" size={16} color={Colors.success} />
                      <Text style={styles.uploadedFileName}>
                        {formData[fieldName].name} ({Math.round(formData[fieldName].size / 1024)} KB)
                      </Text>
                      <TouchableOpacity
                        onPress={() => updateFormData(fieldName, null)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={16} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                {!isUploaded && (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleUploadDocument(doc)}
                  >
                    <Ionicons name="cloud-upload" size={16} color={Colors.white} />
                    <Text style={styles.uploadButtonText}>Upload</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>
      
      {/* Insurer Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Insurer <Text style={styles.required}>*</Text></Text>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.insurersContainer}
        >
          {insurerOptions.map((insurer) => (
            <TouchableOpacity
              key={insurer.id}
              style={[
                styles.insurerCard,
                formData.preferredInsurer === insurer.id && styles.selectedInsurerCard
              ]}
              onPress={() => handleInsurerSelect(insurer)}
            >
              <Text style={styles.insurerName}>{insurer.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{insurer.rating.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Premium Calculation */}
      <View style={styles.premiumContainer}>
        <Text style={styles.premiumTitle}>Estimated Annual Premium</Text>
        <Text style={styles.premiumAmount}>KES {formData.estimatedPremium.toLocaleString()}</Text>
        <Text style={styles.premiumNote}>
          This is an estimated premium. Final premium will be confirmed by the insurer.
        </Text>
      </View>
      
      {/* Declaration */}
      <TouchableOpacity 
        style={styles.declarationContainer}
        onPress={() => updateFormData('declaration', !formData.declaration)}
      >
        <View style={[
          styles.checkbox,
          formData.declaration && styles.checkboxSelected
        ]}>
          {formData.declaration && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.declarationText}>
          I confirm that all the information provided is accurate and complete. I understand that providing false information may result in rejection of claims.
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Main Render
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={prevStep}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Individual Medical</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[...Array(totalSteps)].map((_, index) => (
          <View 
            key={index}
            style={[
              styles.progressStep,
              index + 1 <= currentStep ? styles.progressStepActive : {}
            ]}
          >
            <Text 
              style={[
                styles.progressStepText,
                index + 1 <= currentStep ? styles.progressStepTextActive : {}
              ]}
            >
              {index + 1}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Form Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentStep === 1 && renderPersonalInfo()}
        {currentStep === 2 && renderCoverageOptions()}
        {currentStep === 3 && renderDocumentsAndSummary()}
      </ScrollView>
      
      {/* Navigation Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={prevStep}
        >
          <Text style={styles.buttonSecondaryText}>
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={currentStep === totalSteps ? handleSubmit : nextStep}
        >
          <Text style={styles.buttonPrimaryText}>
            {currentStep === totalSteps ? 'Submit' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  progressStepText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
  },
  progressStepTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
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
  stepDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  required: {
    color: Colors.error,
  },
  subLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginVertical: Spacing.sm,
    color: Colors.textSecondary,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  optionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  selectedOptionText: {
    color: Colors.white,
  },
  simpleSelectionContainer: {
    marginTop: Spacing.sm,
  },
  simpleSelectionItem: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  selectedSimpleItem: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundLightPrimary,
  },
  simpleSelectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simpleSelectionIcon: {
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleSelectionText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  simpleSelectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  selectedSimpleTitle: {
    color: Colors.primary,
  },
  simpleSelectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  selectedSimpleDescription: {
    color: Colors.primary,
  },
  selectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundLightPrimary,
  },
  selectionCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionCardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  selectionCardDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  coverLimitContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  coverLimitOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
  },
  selectedCoverLimit: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  coverLimitText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  selectedCoverLimitText: {
    color: Colors.white,
  },
  benefitsContainer: {
    marginTop: Spacing.sm,
  },
  benefitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  benefitText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  nhifContainer: {
    marginTop: Spacing.sm,
  },
  conditionsContainer: {
    marginTop: Spacing.sm,
  },
  conditionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  conditionText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginVertical: Spacing.sm,
  },
  dependentsContainer: {
    marginTop: Spacing.sm,
  },
  dependentCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dependentTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  dependentRelationship: {
    marginTop: Spacing.sm,
  },
  relationshipOptions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  relationshipOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
  },
  documentsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  documentList: {
    marginTop: Spacing.sm,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  documentInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  documentTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  documentDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
  },
  uploadedFileName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xs,
    flex: 1,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  insurersContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  insurerCard: {
    width: 150,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  selectedInsurerCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundLightPrimary,
  },
  insurerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  premiumContainer: {
    backgroundColor: Colors.success + '15',
    borderRadius: 8,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  premiumAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  premiumNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  declarationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: Spacing.md,
  },
  declarationText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buttonSecondary: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: Spacing.sm,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

export default EnhancedIndividualMedicalQuotation;
