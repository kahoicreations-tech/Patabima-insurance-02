import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing } from '../../../constants';
import { PricingService } from '../../../services';
import { 
  EnhancedDatePicker, 
  EnhancedEmailInput, 
  EnhancedPhoneInput, 
  EnhancedIDInput, 
  EnhancedTextInput 
} from '../../../components/EnhancedFormComponents';
import { EnhancedDocumentUpload } from '../../../components/EnhancedDocumentUpload';
import { 
  validateKenyaID, 
  validateKenyaPhone, 
  validateEmail, 
  validateAge 
} from '../../../utils/kenyaValidation';

export default function LastExpenseQuotationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form Data
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    dateOfBirth: '',
    maritalStatus: '',
    
    // Step 2: Coverage Selection
    coverageAmount: '',
    additionalBenefits: [],
    
    // Step 3: Beneficiaries & Payment
    beneficiaries: [],
    paymentFrequency: '',
    
    // Step 4: Documents and Premium
    documents: {
      nationalId: null,
      proofOfIncome: null,
      medicalReport: null
    },
    totalPremium: 0
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  // Coverage Options with PataBima Last Expense Rates
  const coverageOptions = [
    { 
      id: 1, 
      amount: PricingService.lastExpense?.basePremiums?.basic?.coverage || 50000, 
      premium: PricingService.lastExpense?.basePremiums?.basic?.premium || 600, 
      name: `Basic Coverage - KES ${(PricingService.lastExpense?.basePremiums?.basic?.coverage || 50000).toLocaleString()}` 
    },
    { 
      id: 2, 
      amount: PricingService.lastExpense?.basePremiums?.standard?.coverage || 100000, 
      premium: PricingService.lastExpense?.basePremiums?.standard?.premium || 1100, 
      name: `Standard Coverage - KES ${(PricingService.lastExpense?.basePremiums?.standard?.coverage || 100000).toLocaleString()}` 
    },
    { 
      id: 3, 
      amount: PricingService.lastExpense?.basePremiums?.premium?.coverage || 200000, 
      premium: PricingService.lastExpense?.basePremiums?.premium?.premium || 2000, 
      name: `Premium Coverage - KES ${(PricingService.lastExpense?.basePremiums?.premium?.coverage || 200000).toLocaleString()}` 
    },
    { 
      id: 4, 
      amount: PricingService.lastExpense?.basePremiums?.comprehensive?.coverage || 300000, 
      premium: PricingService.lastExpense?.basePremiums?.comprehensive?.premium || 2800, 
      name: `Comprehensive Coverage - KES ${(PricingService.lastExpense?.basePremiums?.comprehensive?.coverage || 300000).toLocaleString()}` 
    }
  ];

  // Additional Benefits with PataBima rates
  const additionalBenefits = [
    { 
      id: 1, 
      name: 'Funeral Service Arrangement', 
      premium: PricingService.lastExpense?.additionalBenefits?.funeral_arrangement || 800
    },
    { 
      id: 2, 
      name: 'Repatriation of Remains', 
      premium: PricingService.lastExpense?.additionalBenefits?.repatriation || 1200
    },
    { 
      id: 3, 
      name: 'Grief Counseling', 
      premium: PricingService.lastExpense?.additionalBenefits?.grief_counseling || 300
    },
    { 
      id: 4, 
      name: 'Memorial Service Coverage', 
      premium: PricingService.lastExpense?.additionalBenefits?.memorial_service || 500
    }
  ];

  const paymentFrequencies = [
    { id: 'monthly', name: 'Monthly', multiplier: 1 },
    { id: 'quarterly', name: 'Quarterly', multiplier: 0.97 },
    { id: 'semi-annual', name: 'Semi-Annual', multiplier: 0.94 },
    { id: 'annual', name: 'Annual', multiplier: 0.90 }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAdditionalBenefit = (benefitId) => {
    setFormData(prev => ({
      ...prev,
      additionalBenefits: prev.additionalBenefits.includes(benefitId)
        ? prev.additionalBenefits.filter(id => id !== benefitId)
        : [...prev.additionalBenefits, benefitId]
    }));
  };

  const calculatePremium = () => {
    const selectedCoverage = coverageOptions.find(option => option.amount.toString() === formData.coverageAmount);
    if (!selectedCoverage) return 0;

    let premium = selectedCoverage.premium;
    
    // Additional benefits (PataBima rates)
    if (formData.additionalBenefits && formData.additionalBenefits.length > 0) {
      formData.additionalBenefits.forEach(benefitId => {
        const benefit = additionalBenefits.find(b => b.id === benefitId);
        if (benefit) premium += benefit.premium;
      });
    }
    
    // Age factor using PataBima underwriter rates
    if (formData.dateOfBirth) {
      const age = PricingService.calculateAge(formData.dateOfBirth);
      const ageFactors = PricingService.lastExpense?.ageFactors || {
        '18-30': 0.7,
        '31-40': 1.0,
        '41-50': 1.4,
        '51-60': 2.0,
        '61-70': 3.2,
        '71+': 4.5
      };
      const ageFactor = PricingService.getAgeGroup(age, ageFactors);
      premium *= ageFactor;
    }
    
    // Payment frequency discount (PataBima standard)
    const paymentFreq = paymentFrequencies.find(pf => pf.id === formData.paymentFrequency);
    if (paymentFreq) {
      // Use default multiplier since paymentFrequencyDiscounts doesn't exist in PricingService
      const discountMultiplier = paymentFreq.multiplier;
      premium *= discountMultiplier;
    }

    return Math.round(premium);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 30;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateStep = (step) => {
    const errors = [];
    
    switch (step) {
      case 1: // Personal Information
        // Name validation
        if (!formData.firstName || !formData.firstName.trim()) {
          errors.push('First Name is required');
        } else if (formData.firstName.trim().length < 2) {
          errors.push('First Name must be at least 2 characters');
        }
        
        if (!formData.lastName || !formData.lastName.trim()) {
          errors.push('Last Name is required');
        } else if (formData.lastName.trim().length < 2) {
          errors.push('Last Name must be at least 2 characters');
        }
        
        // Email validation
        if (!formData.email || !formData.email.trim()) {
          errors.push('Email Address is required');
        } else {
          const emailValidation = validateEmail(formData.email);
          if (!emailValidation.isValid) {
            errors.push(emailValidation.error);
          }
        }
        
        // Phone validation
        if (!formData.phone || !formData.phone.trim()) {
          errors.push('Phone Number is required');
        } else {
          const phoneValidation = validateKenyaPhone(formData.phone);
          if (!phoneValidation.isValid) {
            errors.push(phoneValidation.error);
          }
        }
        
        // ID Number validation
        if (!formData.idNumber || !formData.idNumber.trim()) {
          errors.push('ID Number is required');
        } else {
          const idValidation = validateKenyaID(formData.idNumber);
          if (!idValidation.isValid) {
            errors.push(idValidation.error);
          }
        }
        
        // Date of Birth validation
        if (!formData.dateOfBirth) {
          errors.push('Date of Birth is required');
        } else {
          const ageValidation = validateAge(formData.dateOfBirth);
          if (!ageValidation.isValid) {
            errors.push(ageValidation.error);
          }
        }
        
        if (!formData.maritalStatus) errors.push('Marital Status is required');
        break;
        
      case 2: // Coverage Selection
        if (!formData.coverageAmount) {
          errors.push('Coverage Amount is required');
        } else if (formData.coverageAmount < 50000) {
          errors.push('Minimum coverage amount is KES 50,000');
        } else if (formData.coverageAmount > 5000000) {
          errors.push('Maximum coverage amount is KES 5,000,000');
        }
        break;
        
      case 3: // Beneficiaries & Payment
        if (!formData.beneficiaries || formData.beneficiaries.length === 0) {
          errors.push('At least one beneficiary is required');
        } else {
          let totalPercentage = 0;
          formData.beneficiaries.forEach((ben, index) => {
            if (!ben.name || !ben.name.trim()) {
              errors.push(`Beneficiary ${index + 1} name is required`);
            } else if (ben.name.trim().length < 2) {
              errors.push(`Beneficiary ${index + 1} name must be at least 2 characters`);
            }
            
            if (!ben.relationship || !ben.relationship.trim()) {
              errors.push(`Beneficiary ${index + 1} relationship is required`);
            }
            
            if (!ben.percentage || !ben.percentage.toString().trim()) {
              errors.push(`Beneficiary ${index + 1} percentage is required`);
            } else {
              const percentage = parseFloat(ben.percentage);
              if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
                errors.push(`Beneficiary ${index + 1} percentage must be between 1 and 100`);
              } else {
                totalPercentage += percentage;
              }
            }
            
            // Phone validation for beneficiary if provided
            if (ben.phone && ben.phone.trim()) {
              const phoneValidation = validateKenyaPhone(ben.phone);
              if (!phoneValidation.isValid) {
                errors.push(`Beneficiary ${index + 1} phone: ${phoneValidation.error}`);
              }
            }
            
            // ID validation for beneficiary if provided
            if (ben.idNumber && ben.idNumber.trim()) {
              const idValidation = validateKenyaID(ben.idNumber);
              if (!idValidation.isValid) {
                errors.push(`Beneficiary ${index + 1} ID: ${idValidation.error}`);
              }
            }
          });
          
          // Check total percentage
          if (Math.abs(totalPercentage - 100) > 0.01) {
            errors.push('Total beneficiary percentages must equal 100%');
          }
        }
        
        if (!formData.paymentFrequency) errors.push('Payment Frequency is required');
        break;
        
      case 4: // Final submission
        // Comprehensive validation - recheck all previous steps
        const personalErrors = [];
        const coverageErrors = [];
        const beneficiaryErrors = [];
        
        // Personal Information validation
        if (!formData.firstName || !formData.firstName.trim()) {
          personalErrors.push('First Name is required');
        } else if (formData.firstName.trim().length < 2) {
          personalErrors.push('First Name must be at least 2 characters');
        }
        
        if (!formData.lastName || !formData.lastName.trim()) {
          personalErrors.push('Last Name is required');
        } else if (formData.lastName.trim().length < 2) {
          personalErrors.push('Last Name must be at least 2 characters');
        }
        
        if (!formData.email || !formData.email.trim()) {
          personalErrors.push('Email Address is required');
        } else {
          const emailValidation = validateEmail(formData.email);
          if (!emailValidation.isValid) {
            personalErrors.push(emailValidation.error);
          }
        }
        
        if (!formData.phone || !formData.phone.trim()) {
          personalErrors.push('Phone Number is required');
        } else {
          const phoneValidation = validateKenyaPhone(formData.phone);
          if (!phoneValidation.isValid) {
            personalErrors.push(phoneValidation.error);
          }
        }
        
        if (!formData.idNumber || !formData.idNumber.trim()) {
          personalErrors.push('ID Number is required');
        } else {
          const idValidation = validateKenyaID(formData.idNumber);
          if (!idValidation.isValid) {
            personalErrors.push(idValidation.error);
          }
        }
        
        if (!formData.dateOfBirth) {
          personalErrors.push('Date of Birth is required');
        } else {
          const ageValidation = validateAge(formData.dateOfBirth);
          if (!ageValidation.isValid) {
            personalErrors.push(ageValidation.error);
          }
        }
        
        if (!formData.maritalStatus) personalErrors.push('Marital Status is required');
        
        // Coverage validation
        if (!formData.coverageAmount) {
          coverageErrors.push('Coverage Amount is required');
        } else if (formData.coverageAmount < 50000) {
          coverageErrors.push('Minimum coverage amount is KES 50,000');
        } else if (formData.coverageAmount > 5000000) {
          coverageErrors.push('Maximum coverage amount is KES 5,000,000');
        }
        
        // Beneficiary validation
        if (!formData.beneficiaries || formData.beneficiaries.length === 0) {
          beneficiaryErrors.push('At least one beneficiary is required');
        } else {
          let totalPercentage = 0;
          formData.beneficiaries.forEach((ben, index) => {
            if (!ben.name || !ben.name.trim()) {
              beneficiaryErrors.push(`Beneficiary ${index + 1} name is required`);
            }
            if (!ben.relationship || !ben.relationship.trim()) {
              beneficiaryErrors.push(`Beneficiary ${index + 1} relationship is required`);
            }
            if (!ben.percentage || !ben.percentage.toString().trim()) {
              beneficiaryErrors.push(`Beneficiary ${index + 1} percentage is required`);
            } else {
              const percentage = parseFloat(ben.percentage);
              if (!isNaN(percentage)) {
                totalPercentage += percentage;
              }
            }
          });
          
          if (Math.abs(totalPercentage - 100) > 0.01) {
            beneficiaryErrors.push('Total beneficiary percentages must equal 100%');
          }
        }
        
        if (!formData.paymentFrequency) beneficiaryErrors.push('Payment Frequency is required');
        
        errors.push(...personalErrors, ...coverageErrors, ...beneficiaryErrors);
        
        // Additional document validation
        if (!formData.documents.idDocument) {
          errors.push('ID document is required');
        }
        
        // Terms and conditions
        if (!formData.termsAccepted) {
          errors.push('You must accept the terms and conditions');
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
      if (currentStep === 3) {
        const premium = calculatePremium();
        updateFormData('totalPremium', premium);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitQuotation = () => {
    const errors = validateStep(4); // Final validation
    
    if (errors.length > 0) {
      Alert.alert(
        'Validation Error',
        `Please fix the following errors before submitting:\n\n${errors.join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Quotation Submitted',
      `Your last expense insurance quotation has been submitted successfully. Premium: KES ${formData.totalPremium.toLocaleString()}`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const addBeneficiary = () => {
    const newBeneficiary = {
      id: Date.now(),
      name: '',
      relationship: '',
      percentage: ''
    };
    setFormData(prev => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, newBeneficiary]
    }));
  };

  const removeBeneficiary = (id) => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.filter(ben => ben.id !== id)
    }));
  };

  const updateBeneficiary = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map(ben => 
        ben.id === id ? { ...ben, [field]: value } : ben
      )
    }));
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.progressItem}>
          <View style={[
            styles.progressCircle,
            currentStep >= step && styles.progressCircleActive
          ]}>
            <Text style={[
              styles.progressNumber,
              currentStep >= step && styles.progressNumberActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 4 && (
            <View style={[
              styles.progressLine,
              currentStep > step && styles.progressLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Please provide your personal details</Text>
      
      <EnhancedTextInput
        label="First Name"
        value={formData.firstName}
        onChangeText={(text) => updateFormData('firstName', text)}
        placeholder="Enter first name"
        required
        validation={(text) => {
          if (!text || !text.trim()) return { isValid: false, error: 'First name is required' };
          if (text.trim().length < 2) return { isValid: false, error: 'First name must be at least 2 characters' };
          return { isValid: true };
        }}
      />

      <EnhancedTextInput
        label="Last Name"
        value={formData.lastName}
        onChangeText={(text) => updateFormData('lastName', text)}
        placeholder="Enter last name"
        required
        validation={(text) => {
          if (!text || !text.trim()) return { isValid: false, error: 'Last name is required' };
          if (text.trim().length < 2) return { isValid: false, error: 'Last name must be at least 2 characters' };
          return { isValid: true };
        }}
      />

      <EnhancedEmailInput
        label="Email Address"
        value={formData.email}
        onChangeText={(text) => updateFormData('email', text)}
        placeholder="Enter email address"
        required
      />

      <EnhancedPhoneInput
        label="Phone Number"
        value={formData.phone}
        onChangeText={(text) => updateFormData('phone', text)}
        placeholder="Enter phone number"
        required
      />

      <EnhancedIDInput
        label="ID Number"
        value={formData.idNumber}
        onChangeText={(text) => updateFormData('idNumber', text)}
        placeholder="Enter ID number"
        required
      />

      <EnhancedDatePicker
        label="Date of Birth"
        value={formData.dateOfBirth}
        onDateChange={(date) => updateFormData('dateOfBirth', date)}
        placeholder="Select date of birth"
        minAge={18}
        maxAge={100}
        required
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Marital Status</Text>
        <View style={styles.optionsGrid}>
          {['Single', 'Married', 'Divorced', 'Widowed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.gridOption,
                formData.maritalStatus === status && styles.gridOptionActive
              ]}
              onPress={() => updateFormData('maritalStatus', status)}
            >
              <Text style={[
                styles.gridOptionText,
                formData.maritalStatus === status && styles.gridOptionTextActive
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Coverage Selection</Text>
      <Text style={styles.stepSubtitle}>Choose your coverage amount and additional benefits</Text>
      
      <Text style={styles.sectionTitle}>Coverage Amount</Text>
      {coverageOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.coverageCard,
            formData.coverageAmount === option.amount.toString() && styles.coverageCardActive
          ]}
          onPress={() => updateFormData('coverageAmount', option.amount.toString())}
        >
          <Text style={styles.coverageName}>{option.name}</Text>
          <Text style={styles.coveragePrice}>KES {option.premium.toLocaleString()}/year</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Additional Benefits</Text>
      {additionalBenefits.map((benefit) => (
        <TouchableOpacity
          key={benefit.id}
          style={[
            styles.benefitCard,
            formData.additionalBenefits.includes(benefit.id) && styles.benefitCardActive
          ]}
          onPress={() => toggleAdditionalBenefit(benefit.id)}
        >
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitName}>{benefit.name}</Text>
            <Text style={styles.benefitPrice}>+KES {benefit.premium.toLocaleString()}/year</Text>
          </View>
          <View style={[
            styles.checkbox,
            formData.additionalBenefits.includes(benefit.id) && styles.checkboxActive
          ]}>
            {formData.additionalBenefits.includes(benefit.id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Beneficiaries & Payment</Text>
      <Text style={styles.stepSubtitle}>Add beneficiaries and select payment frequency</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Beneficiaries</Text>
        
        {formData.beneficiaries.map((beneficiary, index) => (
          <View key={beneficiary.id} style={styles.beneficiaryCard}>
            <View style={styles.beneficiaryHeader}>
              <Text style={styles.beneficiaryTitle}>Beneficiary {index + 1}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeBeneficiary(beneficiary.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
            
            <EnhancedTextInput
              label="Full Name"
              value={beneficiary.name}
              onChangeText={(text) => updateBeneficiary(beneficiary.id, 'name', text)}
              placeholder="Enter full name"
              required
              validation={(text) => {
                if (!text || !text.trim()) return { isValid: false, error: 'Name is required' };
                if (text.trim().length < 2) return { isValid: false, error: 'Name must be at least 2 characters' };
                return { isValid: true };
              }}
            />
            
            <EnhancedTextInput
              label="Relationship"
              value={beneficiary.relationship}
              onChangeText={(text) => updateBeneficiary(beneficiary.id, 'relationship', text)}
              placeholder="e.g., Spouse, Child, Parent"
              required
              validation={(text) => {
                if (!text || !text.trim()) return { isValid: false, error: 'Relationship is required' };
                return { isValid: true };
              }}
            />
            
            <EnhancedTextInput
              label="Percentage Share (%)"
              value={beneficiary.percentage}
              onChangeText={(text) => updateBeneficiary(beneficiary.id, 'percentage', text)}
              placeholder="e.g., 50"
              keyboardType="numeric"
              required
              validation={(text) => {
                if (!text || !text.trim()) return { isValid: false, error: 'Percentage is required' };
                const percentage = parseFloat(text);
                if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
                  return { isValid: false, error: 'Percentage must be between 1 and 100' };
                }
                return { isValid: true };
              }}
            />
            
            <EnhancedPhoneInput
              label="Phone Number (Optional)"
              value={beneficiary.phone || ''}
              onChangeText={(text) => updateBeneficiary(beneficiary.id, 'phone', text)}
              placeholder="Enter phone number"
            />
            
            <EnhancedIDInput
              label="ID Number (Optional)"
              value={beneficiary.idNumber || ''}
              onChangeText={(text) => updateBeneficiary(beneficiary.id, 'idNumber', text)}
              placeholder="Enter ID number"
            />
          </View>
        ))}
        
        <TouchableOpacity style={styles.addButton} onPress={addBeneficiary}>
          <Text style={styles.addButtonText}>+ Add Beneficiary</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Payment Frequency</Text>
        <Text style={styles.inputHelper}>Select how often you want to pay premiums</Text>
        
        {paymentFrequencies.map((frequency) => (
          <TouchableOpacity
            key={frequency.id}
            style={[
              styles.paymentCard,
              formData.paymentFrequency === frequency.id && styles.paymentCardActive
            ]}
            onPress={() => updateFormData('paymentFrequency', frequency.id)}
          >
            <Text style={styles.paymentName}>{frequency.name}</Text>
            <Text style={styles.paymentDiscount}>
              {frequency.multiplier < 1 ? `${Math.round((1 - frequency.multiplier) * 100)}% discount` : 'Standard rate'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Premium Calculation</Text>
      <Text style={styles.stepSubtitle}>Your last expense insurance quotation</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Policy Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Insured:</Text>
          <Text style={styles.summaryValue}>{formData.firstName} {formData.lastName}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Coverage Amount:</Text>
          <Text style={styles.summaryValue}>KES {parseInt(formData.coverageAmount || 0).toLocaleString()}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Additional Benefits:</Text>
          <Text style={styles.summaryValue}>{formData.additionalBenefits.length} selected</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Frequency:</Text>
          <Text style={styles.summaryValue}>
            {paymentFrequencies.find(pf => pf.id === formData.paymentFrequency)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Annual Premium:</Text>
          <Text style={styles.totalValue}>KES {formData.totalPremium.toLocaleString()}</Text>
        </View>
        
        {formData.paymentFrequency === 'monthly' && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Premium:</Text>
            <Text style={styles.summaryValue}>KES {Math.round(formData.totalPremium / 12).toLocaleString()}</Text>
          </View>
        )}
      </View>

      {/* Document Upload Section */}
      <View style={styles.documentSection}>
        <Text style={styles.sectionTitle}>Required Documents</Text>
        <Text style={styles.sectionSubtitle}>Please upload the following documents to complete your application</Text>
        
        <View style={styles.documentContainer}>
          <Text style={styles.documentLabel}>ID Document (Required)</Text>
          <EnhancedDocumentUpload
            onDocumentSelected={(document) => {
              updateFormData('documents', {
                ...formData.documents,
                idDocument: document
              });
            }}
            selectedDocument={formData.documents.idDocument}
            documentType="ID Document"
            acceptedTypes={['image/*', 'application/pdf']}
            maxSizeInMB={5}
          />
        </View>
        
        <View style={styles.documentContainer}>
          <Text style={styles.documentLabel}>Proof of Income (Optional)</Text>
          <EnhancedDocumentUpload
            onDocumentSelected={(document) => {
              updateFormData('documents', {
                ...formData.documents,
                incomeProof: document
              });
            }}
            selectedDocument={formData.documents.incomeProof}
            documentType="Income Proof"
            acceptedTypes={['image/*', 'application/pdf']}
            maxSizeInMB={5}
          />
        </View>
      </View>

      {/* Terms and Conditions */}
      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => updateFormData('termsAccepted', !formData.termsAccepted)}
        >
          <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxActive]}>
            {formData.termsAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I accept the{' '}
            <Text style={styles.termsLink}>Terms and Conditions</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          Last expense insurance provides immediate financial assistance to your family to cover funeral and burial costs. This quotation is valid for 30 days.
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Last Expense Insurance</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Text style={styles.backButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < totalSteps ? (
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitButton} onPress={submitQuotation}>
            <Text style={styles.submitButtonText}>Submit Quotation</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    padding: Spacing.xs,
  },
  headerBackText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleActive: {
    backgroundColor: Colors.primary,
  },
  progressNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#6B7280',
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: Spacing.xs,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: Spacing.md,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
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
  inputHelper: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    backgroundColor: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  gridOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: Spacing.xs,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gridOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  gridOptionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  gridOptionTextActive: {
    color: '#FFFFFF',
  },
  coverageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  coverageCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FEF2F2',
  },
  coverageName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  coveragePrice: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: Spacing.xs,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  benefitCardActive: {
    backgroundColor: '#FEF2F2',
    borderColor: Colors.primary,
  },
  benefitInfo: {
    flex: 1,
  },
  benefitName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  benefitPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  beneficiaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Spacing.xs,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  beneficiaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  beneficiaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  removeButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  removeButtonText: {
    fontSize: Typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.medium,
  },
  addButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Spacing.xs,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Spacing.xs,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentCardActive: {
    backgroundColor: '#FEF2F2',
    borderColor: Colors.primary,
  },
  paymentName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  paymentDiscount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontWeight: Typography.fontWeight.medium,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Spacing.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: Spacing.md,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  disclaimerContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: Spacing.xs,
    padding: Spacing.md,
  },
  disclaimerText: {
    fontSize: Typography.fontSize.sm,
    color: '#92400E',
    textAlign: 'center',
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.xs,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.xs,
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.xs,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: '#FFFFFF',
  },
  // Enhanced form component styles
  beneficiaryInputContainer: {
    marginBottom: Spacing.sm,
  },
  beneficiaryInputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  // Document upload styles
  documentSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  documentContainer: {
    marginBottom: Spacing.md,
  },
  documentLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  // Terms and conditions styles
  termsContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
