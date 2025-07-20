/**
 * Enhanced Corporate Medical Insurance Quotation Screen
 * Based on the enhanced multi-step form pattern
 * 3-Step Process: Company Info → Employee Coverage → Documents & Summary
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

const EnhancedCorporateMedicalQuotation = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form Data for Corporate Medical Insurance
  const [formData, setFormData] = useState({
    // Step 1: Company Information
    companyName: '',
    companyKRAPin: '',
    contactPersonName: '',
    contactPersonPosition: '',
    phoneNumber: '',
    emailAddress: '',
    physicalAddress: '',
    industry: '',
    yearEstablished: '',
    
    // Step 2: Employee Coverage Details
    numberOfEmployees: '',
    employeeCategories: [],
    coverLimitPerEmployee: '',
    includeSpouses: false,
    includeDependents: false,
    maxDependentsPerEmployee: '0',
    coverOptions: {
      inpatient: true,
      outpatient: true,
      dental: false,
      optical: false,
      maternity: false,
      lastExpense: false,
      groupLife: false
    },
    
    // Step 3: Documents & Summary
    preferredInsurer: '',
    estimatedPremium: 0,
    uploadCompanyRegistration: null,
    uploadKRAPin: null,
    uploadEmployeeList: null,
    uploadCoverRequirements: null,
    uploadClaimsHistory: null,
    declaration: false
  });

  // Corporate Medical Insurance Options
  const industryOptions = [
    { id: 'technology', name: 'Technology & IT' },
    { id: 'finance', name: 'Finance & Banking' },
    { id: 'manufacturing', name: 'Manufacturing' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'education', name: 'Education' },
    { id: 'retail', name: 'Retail & Trade' },
    { id: 'hospitality', name: 'Hospitality & Tourism' },
    { id: 'construction', name: 'Construction & Real Estate' },
    { id: 'agriculture', name: 'Agriculture' },
    { id: 'logistics', name: 'Transport & Logistics' },
    { id: 'other', name: 'Other' }
  ];

  const employeeCategoryTypes = [
    { id: 'management', name: 'Management', description: 'Executive & Senior Management', hasHigherLimit: true },
    { id: 'middle_mgmt', name: 'Middle Management', description: 'Department Heads & Managers', hasHigherLimit: true },
    { id: 'staff', name: 'General Staff', description: 'Regular employees', hasHigherLimit: false },
    { id: 'support', name: 'Support Staff', description: 'Auxiliary & support roles', hasHigherLimit: false }
  ];

  const coverLimitOptions = [
    { id: '500k', name: 'KES 500,000', value: 500000 },
    { id: '1m', name: 'KES 1,000,000', value: 1000000 },
    { id: '2m', name: 'KES 2,000,000', value: 2000000 },
    { id: '3m', name: 'KES 3,000,000', value: 3000000 },
    { id: '5m', name: 'KES 5,000,000', value: 5000000 },
    { id: '10m', name: 'KES 10,000,000', value: 10000000 }
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

  // Document types required for corporate medical insurance
  const documentTypes = [
    {
      id: 'company_registration',
      type: 'Company Registration Certificate',
      required: true,
      description: 'Certificate of Incorporation or Business Registration'
    },
    {
      id: 'kra_pin',
      type: 'KRA PIN Certificate',
      required: true,
      description: 'Company\'s KRA PIN Certificate'
    },
    {
      id: 'employee_list',
      type: 'Employee List',
      required: true,
      description: 'List of employees to be covered (with details)'
    },
    {
      id: 'cover_requirements',
      type: 'Cover Requirements',
      required: false,
      description: 'Specific requirements for your company\'s cover'
    },
    {
      id: 'claims_history',
      type: 'Claims History',
      required: false,
      description: 'Previous claims history (if applicable)'
    }
  ];

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => {
      // Handle nested coverOptions object
      if (field.startsWith('cover_')) {
        const optionKey = field.replace('cover_', '');
        return {
          ...prev,
          coverOptions: {
            ...prev.coverOptions,
            [optionKey]: value
          }
        };
      }
      
      // Handle employee category updates
      if (field === 'addEmployeeCategory') {
        // Add a new employee category
        const newCategory = {
          id: `cat_${Date.now()}`,
          type: value.type,
          name: value.name || value.type,
          count: value.count,
          coverLimit: value.coverLimit
        };
        return {
          ...prev,
          employeeCategories: [...prev.employeeCategories, newCategory]
        };
      }
      
      if (field === 'updateEmployeeCategory') {
        // Update an existing employee category
        const updatedCategories = prev.employeeCategories.map(cat => 
          cat.id === value.id ? { ...cat, ...value } : cat
        );
        return {
          ...prev,
          employeeCategories: updatedCategories
        };
      }
      
      if (field === 'removeEmployeeCategory') {
        // Remove an employee category
        return {
          ...prev,
          employeeCategories: prev.employeeCategories.filter(cat => cat.id !== value)
        };
      }
      
      // Handle dependent settings
      if (field === 'includeDependents') {
        if (!value) {
          // If dependents are disabled, reset maxDependents
          return {
            ...prev,
            [field]: value,
            maxDependentsPerEmployee: '0'
          };
        }
      }
      
      // Default case for simple field updates
      return { ...prev, [field]: value };
    });
  }, []);

  const calculatePremium = useCallback(() => {
    const basePremiumPerEmployee = 25000; // KES 25,000 base annual premium per employee
    
    let totalEmployees = 0;
    let premium = 0;
    
    // Calculate based on employee categories
    if (formData.employeeCategories.length > 0) {
      formData.employeeCategories.forEach(category => {
        const count = parseInt(category.count) || 0;
        totalEmployees += count;
        
        let categoryBasePremium = basePremiumPerEmployee;
        
        // Adjust premium based on selected cover limit for this category
        const selectedLimit = coverLimitOptions.find(opt => opt.id === category.coverLimit);
        if (selectedLimit) {
          const limitFactor = selectedLimit.value / 1000000; // Factor based on millions
          categoryBasePremium *= (1 + (limitFactor * 0.08)); // 8% increase per million
        }
        
        // Higher premium for management categories
        if (category.type === 'management' || category.type === 'middle_mgmt') {
          categoryBasePremium *= 1.2; // 20% higher for management
        }
        
        premium += categoryBasePremium * count;
      });
    } else {
      // Fallback if no categories defined
      const employeeCount = parseInt(formData.numberOfEmployees) || 0;
      totalEmployees = employeeCount;
      
      // Base calculation
      const selectedLimit = coverLimitOptions.find(opt => opt.id === formData.coverLimitPerEmployee);
      let adjustedBasePremium = basePremiumPerEmployee;
      
      if (selectedLimit) {
        const limitFactor = selectedLimit.value / 1000000;
        adjustedBasePremium *= (1 + (limitFactor * 0.08));
      }
      
      premium = adjustedBasePremium * employeeCount;
    }
    
    // Additional costs for dependents
    if (formData.includeSpouses) {
      premium += (totalEmployees * 15000); // Spouse coverage at KES 15,000 per employee
    }
    
    if (formData.includeDependents) {
      const maxDependents = parseInt(formData.maxDependentsPerEmployee) || 0;
      premium += (totalEmployees * maxDependents * 10000); // KES 10,000 per dependent
    }
    
    // Additional cover options
    const addOnRates = {
      dental: 3000,
      optical: 2500,
      maternity: 12000,
      lastExpense: 5000,
      groupLife: 8000
    };
    
    Object.entries(formData.coverOptions).forEach(([option, isSelected]) => {
      if (isSelected && option !== 'inpatient' && option !== 'outpatient' && addOnRates[option]) {
        premium += (totalEmployees * addOnRates[option]);
      }
    });
    
    // Apply volume discount
    if (totalEmployees > 50) {
      premium *= 0.95; // 5% discount for 50+ employees
    } else if (totalEmployees > 20) {
      premium *= 0.97; // 3% discount for 20+ employees
    }
    
    return Math.round(premium);
  }, [formData, coverLimitOptions]);

  const handleIndustrySelect = (industry) => {
    updateFormData('industry', industry.id);
  };

  const handleCoverLimitSelect = (limit) => {
    updateFormData('coverLimitPerEmployee', limit.id);
  };

  const handleInsurerSelect = (insurer) => {
    updateFormData('preferredInsurer', insurer.id);
  };

  const toggleCoverOption = (option) => {
    updateFormData(`cover_${option}`, !formData.coverOptions[option]);
  };

  const addEmployeeCategory = (categoryType) => {
    // Find the category type in our options
    const typeInfo = employeeCategoryTypes.find(t => t.id === categoryType);
    if (!typeInfo) return;
    
    // Create a new employee category with default values
    const newCategory = {
      type: categoryType,
      name: typeInfo.name,
      count: '',
      coverLimit: formData.coverLimitPerEmployee || '1m'
    };
    
    updateFormData('addEmployeeCategory', newCategory);
  };

  const updateEmployeeCategory = (id, field, value) => {
    const category = formData.employeeCategories.find(cat => cat.id === id);
    if (!category) return;
    
    updateFormData('updateEmployeeCategory', {
      id,
      [field]: value
    });
  };

  const removeEmployeeCategory = (id) => {
    updateFormData('removeEmployeeCategory', id);
  };

  const validateStep = (step) => {
    const errors = [];
    
    switch (step) {
      case 1: // Company Information
        if (!formData.companyName.trim()) errors.push('Company Name is required');
        if (!formData.companyKRAPin.trim()) errors.push('KRA PIN is required');
        if (!formData.contactPersonName.trim()) errors.push('Contact Person Name is required');
        if (!formData.contactPersonPosition.trim()) errors.push('Contact Person Position is required');
        if (!formData.phoneNumber.trim()) errors.push('Phone Number is required');
        if (!formData.industry) errors.push('Industry is required');
        
        // Email validation if provided
        if (formData.emailAddress.trim() && !/^\S+@\S+\.\S+$/.test(formData.emailAddress)) {
          errors.push('Valid Email Address is required');
        }
        break;
        
      case 2: // Employee Coverage Details
        if (!formData.numberOfEmployees.trim() || parseInt(formData.numberOfEmployees) <= 0) {
          errors.push('Valid Number of Employees is required');
        }
        
        if (!formData.coverLimitPerEmployee) {
          errors.push('Cover Limit Per Employee is required');
        }
        
        // Validate employee categories if any are defined
        if (formData.employeeCategories.length > 0) {
          let totalCount = 0;
          
          formData.employeeCategories.forEach((category, index) => {
            if (!category.count.trim() || parseInt(category.count) <= 0) {
              errors.push(`Valid Employee Count for ${category.name} is required`);
            } else {
              totalCount += parseInt(category.count);
            }
            
            if (!category.coverLimit) {
              errors.push(`Cover Limit for ${category.name} is required`);
            }
          });
          
          // Verify total matches declared number of employees
          const declaredTotal = parseInt(formData.numberOfEmployees);
          if (totalCount !== declaredTotal) {
            errors.push(`Total employees in categories (${totalCount}) must match declared number (${declaredTotal})`);
          }
        }
        
        // Validate dependent settings
        if (formData.includeDependents && (!formData.maxDependentsPerEmployee.trim() || parseInt(formData.maxDependentsPerEmployee) < 0)) {
          errors.push('Valid Max Dependents Per Employee is required');
        }
        break;
        
      case 3: // Documents & Summary
        if (!formData.preferredInsurer) errors.push('Preferred Insurer is required');
        if (!formData.uploadCompanyRegistration) errors.push('Company Registration Certificate is required');
        if (!formData.uploadKRAPin) errors.push('KRA PIN Certificate is required');
        if (!formData.uploadEmployeeList) errors.push('Employee List is required');
        if (!formData.declaration) errors.push('Declaration must be accepted');
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
    updateFormData(`upload${docType.id.replace(/(^|_)([a-z])/g, (_, p1, p2) => p2.toUpperCase())}`, {
      name: `${docType.type}_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: Math.floor(Math.random() * 1000000) + 500000, // Random size between 500KB and 1.5MB
      uri: 'file://simulated-photo-path.jpg'
    });
  };

  const handleChooseFile = (docType) => {
    // Simulate file selection
    updateFormData(`upload${docType.id.replace(/(^|_)([a-z])/g, (_, p1, p2) => p2.toUpperCase())}`, {
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
      'Submit Corporate Quotation',
      'Your corporate medical insurance quotation will be submitted. Our corporate team will process it and contact you shortly.',
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
              const quoteRef = `MED-CORP-${Date.now().toString().slice(-6)}`;
              
              Alert.alert(
                'Corporate Quotation Submitted',
                `Your corporate medical insurance quotation has been submitted successfully!\n\nReference Number: ${quoteRef}\n\nOne of our corporate insurance specialists will contact you within 48 hours.`,
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
  const renderCompanyInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Company Information</Text>
      <Text style={styles.stepDescription}>
        Please provide your company details for the corporate medical insurance quotation
      </Text>
      
      <EnhancedTextInput
        label="Company Name"
        value={formData.companyName}
        onChangeText={(text) => updateFormData('companyName', text)}
        placeholder="Enter company name"
        required
      />
      
      <EnhancedTextInput
        label="Company KRA PIN"
        value={formData.companyKRAPin}
        onChangeText={(text) => updateFormData('companyKRAPin', text)}
        placeholder="Enter KRA PIN"
        required
      />
      
      <EnhancedTextInput
        label="Contact Person Name"
        value={formData.contactPersonName}
        onChangeText={(text) => updateFormData('contactPersonName', text)}
        placeholder="Enter full name"
        required
      />
      
      <EnhancedTextInput
        label="Contact Person Position"
        value={formData.contactPersonPosition}
        onChangeText={(text) => updateFormData('contactPersonPosition', text)}
        placeholder="E.g. HR Manager, Director, etc."
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
      
      <EnhancedTextInput
        label="Physical Address"
        value={formData.physicalAddress}
        onChangeText={(text) => updateFormData('physicalAddress', text)}
        placeholder="Enter company physical address"
        multiline
        numberOfLines={2}
      />
      
      <EnhancedTextInput
        label="Year Established"
        value={formData.yearEstablished}
        onChangeText={(text) => {
          // Allow only year numbers and limit to 4 digits
          const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
          updateFormData('yearEstablished', cleaned);
        }}
        placeholder="E.g. 2010"
        keyboardType="numeric"
      />
      
      {/* Industry Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Industry <Text style={styles.required}>*</Text></Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.industryContainer}
        >
          {industryOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.industryOption,
                formData.industry === option.id && styles.selectedIndustryOption
              ]}
              onPress={() => handleIndustrySelect(option)}
            >
              <Text 
                style={[
                  styles.industryText,
                  formData.industry === option.id && styles.selectedIndustryText
                ]}
              >
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderEmployeeCoverage = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Employee Coverage</Text>
      <Text style={styles.stepDescription}>
        Define the coverage options for your employees
      </Text>
      
      <EnhancedTextInput
        label="Total Number of Employees"
        value={formData.numberOfEmployees}
        onChangeText={(text) => {
          // Allow only numbers
          const cleaned = text.replace(/[^0-9]/g, '');
          updateFormData('numberOfEmployees', cleaned);
        }}
        placeholder="Enter total employees to be covered"
        keyboardType="numeric"
        required
      />
      
      {/* Employee Categories */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Employee Categories</Text>
        <Text style={styles.infoText}>
          Create categories for different employee groups with specific cover limits
        </Text>
        
        {/* Display existing categories */}
        {formData.employeeCategories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {formData.employeeCategories.map((category, index) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <TouchableOpacity
                    onPress={() => removeEmployeeCategory(category.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                
                <EnhancedTextInput
                  label="Number of Employees"
                  value={category.count}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    updateEmployeeCategory(category.id, 'count', cleaned);
                  }}
                  placeholder="Enter count"
                  keyboardType="numeric"
                  required
                />
                
                <View style={styles.coverLimitSelector}>
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
                          category.coverLimit === option.id && styles.selectedCoverLimit
                        ]}
                        onPress={() => updateEmployeeCategory(category.id, 'coverLimit', option.id)}
                      >
                        <Text 
                          style={[
                            styles.coverLimitText,
                            category.coverLimit === option.id && styles.selectedCoverLimitText
                          ]}
                        >
                          {option.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* Add category button */}
        <View style={styles.addCategorySection}>
          <Text style={styles.subLabel}>Add Employee Category</Text>
          <View style={styles.categoryButtonsContainer}>
            {employeeCategoryTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.addCategoryButton}
                onPress={() => addEmployeeCategory(type.id)}
              >
                <Ionicons name="add-circle" size={16} color={Colors.primary} />
                <Text style={styles.addCategoryText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      {/* Default Cover Limit (if no categories defined) */}
      {formData.employeeCategories.length === 0 && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cover Limit Per Employee <Text style={styles.required}>*</Text></Text>
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
                  formData.coverLimitPerEmployee === option.id && styles.selectedCoverLimit
                ]}
                onPress={() => handleCoverLimitSelect(option)}
              >
                <Text 
                  style={[
                    styles.coverLimitText,
                    formData.coverLimitPerEmployee === option.id && styles.selectedCoverLimitText
                  ]}
                >
                  {option.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Dependent Options */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Dependent Options</Text>
        
        <TouchableOpacity 
          style={styles.dependentOption}
          onPress={() => updateFormData('includeSpouses', !formData.includeSpouses)}
        >
          <View style={[
            styles.checkbox,
            formData.includeSpouses && styles.checkboxSelected
          ]}>
            {formData.includeSpouses && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.dependentOptionText}>Include Spouse Coverage</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dependentOption}
          onPress={() => updateFormData('includeDependents', !formData.includeDependents)}
        >
          <View style={[
            styles.checkbox,
            formData.includeDependents && styles.checkboxSelected
          ]}>
            {formData.includeDependents && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.dependentOptionText}>Include Dependent Children Coverage</Text>
        </TouchableOpacity>
        
        {formData.includeDependents && (
          <EnhancedTextInput
            label="Max Dependents Per Employee"
            value={formData.maxDependentsPerEmployee}
            onChangeText={(text) => {
              // Allow only numbers up to 10
              const cleaned = text.replace(/[^0-9]/g, '');
              const count = parseInt(cleaned) || 0;
              updateFormData('maxDependentsPerEmployee', Math.min(10, count).toString());
            }}
            placeholder="Enter maximum dependents allowed"
            keyboardType="numeric"
            required
          />
        )}
      </View>
      
      {/* Cover Options */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cover Options</Text>
        <Text style={styles.infoText}>
          Select the benefits to include in your corporate medical package
        </Text>
        
        <View style={styles.coverOptionsContainer}>
          <TouchableOpacity 
            style={styles.coverOption}
            onPress={() => toggleCoverOption('inpatient')}
          >
            <View style={[
              styles.checkbox,
              formData.coverOptions.inpatient && styles.checkboxSelected
            ]}>
              {formData.coverOptions.inpatient && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.coverOptionContent}>
              <Text style={styles.coverOptionText}>Inpatient Cover</Text>
              <Text style={styles.coverOptionDescription}>Hospital admission, surgery, ICU</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.coverOption}
            onPress={() => toggleCoverOption('outpatient')}
          >
            <View style={[
              styles.checkbox,
              formData.coverOptions.outpatient && styles.checkboxSelected
            ]}>
              {formData.coverOptions.outpatient && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.coverOptionContent}>
              <Text style={styles.coverOptionText}>Outpatient Cover</Text>
              <Text style={styles.coverOptionDescription}>Doctor visits, lab tests, prescriptions</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.coverOption}
            onPress={() => toggleCoverOption('dental')}
          >
            <View style={[
              styles.checkbox,
              formData.coverOptions.dental && styles.checkboxSelected
            ]}>
              {formData.coverOptions.dental && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.coverOptionContent}>
              <Text style={styles.coverOptionText}>Dental Cover</Text>
              <Text style={styles.coverOptionDescription}>Dental checkups, treatment, procedures</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.coverOption}
            onPress={() => toggleCoverOption('optical')}
          >
            <View style={[
              styles.checkbox,
              formData.coverOptions.optical && styles.checkboxSelected
            ]}>
              {formData.coverOptions.optical && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.coverOptionContent}>
              <Text style={styles.coverOptionText}>Optical Cover</Text>
              <Text style={styles.coverOptionDescription}>Eye exams, glasses, contact lenses</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.coverOption}
            onPress={() => toggleCoverOption('maternity')}
          >
            <View style={[
              styles.checkbox,
              formData.coverOptions.maternity && styles.checkboxSelected
            ]}>
              {formData.coverOptions.maternity && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.coverOptionContent}>
              <Text style={styles.coverOptionText}>Maternity Cover</Text>
              <Text style={styles.coverOptionDescription}>Pre and post-natal care, delivery</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.coverOption}
            onPress={() => toggleCoverOption('lastExpense')}
          >
            <View style={[
              styles.checkbox,
              formData.coverOptions.lastExpense && styles.checkboxSelected
            ]}>
              {formData.coverOptions.lastExpense && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.coverOptionContent}>
              <Text style={styles.coverOptionText}>Last Expense Cover</Text>
              <Text style={styles.coverOptionDescription}>Funeral expenses coverage</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.coverOption}
            onPress={() => toggleCoverOption('groupLife')}
          >
            <View style={[
              styles.checkbox,
              formData.coverOptions.groupLife && styles.checkboxSelected
            ]}>
              {formData.coverOptions.groupLife && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.coverOptionContent}>
              <Text style={styles.coverOptionText}>Group Life Cover</Text>
              <Text style={styles.coverOptionDescription}>Life insurance coverage for employees</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderDocumentsAndSummary = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Documents & Summary</Text>
      <Text style={styles.stepDescription}>
        Upload required documents and review your corporate quotation
      </Text>
      
      {/* Document Upload Section */}
      <View style={styles.documentsSection}>
        <Text style={styles.sectionTitle}>Required Documents</Text>
        <Text style={styles.infoText}>
          Please upload clear copies of the required documents
        </Text>
        
        <View style={styles.documentList}>
          {documentTypes.map((doc) => {
            const fieldName = `upload${doc.id.replace(/(^|_)([a-z])/g, (_, p1, p2) => p2.toUpperCase())}`;
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
          This is an estimated premium. Final premium will be confirmed after underwriting.
        </Text>
      </View>
      
      {/* Company Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Company Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Company:</Text>
          <Text style={styles.summaryValue}>{formData.companyName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Employees:</Text>
          <Text style={styles.summaryValue}>{formData.numberOfEmployees}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Employee Groups:</Text>
          <Text style={styles.summaryValue}>{formData.employeeCategories.length || 1}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Coverage Options:</Text>
          <Text style={styles.summaryValue}>
            {Object.entries(formData.coverOptions)
              .filter(([_, isSelected]) => isSelected)
              .map(([option, _], index, arr) => (
                `${option.charAt(0).toUpperCase() + option.slice(1)}${index < arr.length - 1 ? ', ' : ''}`
              ))}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Dependents:</Text>
          <Text style={styles.summaryValue}>
            {formData.includeSpouses ? 'Spouses' : ''}{formData.includeSpouses && formData.includeDependents ? ' & ' : ''}
            {formData.includeDependents ? `Children (max ${formData.maxDependentsPerEmployee})` : ''}
            {!formData.includeSpouses && !formData.includeDependents ? 'None' : ''}
          </Text>
        </View>
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
          I confirm that all the information provided is accurate and complete. I am authorized to request this corporate medical insurance quotation on behalf of the company.
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
        <Text style={styles.headerTitle}>Corporate Medical</Text>
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
        {currentStep === 1 && renderCompanyInfo()}
        {currentStep === 2 && renderEmployeeCoverage()}
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
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginVertical: Spacing.sm,
  },
  industryContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  industryOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
  },
  selectedIndustryOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  industryText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  selectedIndustryText: {
    color: Colors.white,
  },
  categoriesContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  coverLimitSelector: {
    marginTop: Spacing.sm,
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
  addCategorySection: {
    marginTop: Spacing.sm,
  },
  categoryButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  addCategoryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  dependentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dependentOptionText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
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
  coverOptionsContainer: {
    marginTop: Spacing.sm,
  },
  coverOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coverOptionContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  coverOptionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  coverOptionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
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
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    width: '40%',
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
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

export default EnhancedCorporateMedicalQuotation;
