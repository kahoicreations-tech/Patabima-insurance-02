/**
 * Professional Indemnity Insurance Quotation Screen
 * Custom 4-Step Process: Business Info → Professional Details → Coverage Selection → Documents & Summary
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing } from '../../../constants';
import { 
  EnhancedTextInput, 
  EnhancedEmailInput, 
  EnhancedPhoneInput, 
  EnhancedIDInput, 
  EnhancedDatePicker 
} from '../../../components/EnhancedFormComponents';
import { EnhancedDocumentUpload } from '../../../components/EnhancedDocumentUpload';

const ProfessionalIndemnityQuotationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form Data - Custom structure for Professional Indemnity
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    businessName: '',
    businessRegistrationNumber: '',
    businessType: '',
    principalContactName: '',
    phoneNumber: '',
    emailAddress: '',
    physicalAddress: '',
    
    // Step 2: Professional Details
    profession: '',
    yearsInBusiness: '',
    numberOfEmployees: '',
    annualTurnover: '',
    professionalQualifications: '',
    professionalBodies: '',
    
    // Step 3: Coverage Selection
    indemnityLimit: '',
    excessAmount: '',
    territory: '',
    retroactiveDate: '',
    includeCyberLiability: false,
    includeEmploymentPractices: false,
    includeDirectorsOfficers: false,
    
    // Step 4: Documents & Summary
    preferredInsurer: '',
    estimatedPremium: 0,
    uploadBusinessCertificate: null,
    uploadProfessionalCertificate: null,
    uploadFinancialStatements: null,
    uploadInsuranceHistory: null,
    declaration: false
  });

  // Dropdown options
  const businessTypes = [
    { id: 'sole_proprietorship', name: 'Sole Proprietorship' },
    { id: 'partnership', name: 'Partnership' },
    { id: 'limited_company', name: 'Limited Company' },
    { id: 'public_company', name: 'Public Company' }
  ];

  const professions = [
    { id: 'accountant', name: 'Accountant/Auditor', riskMultiplier: 1.2 },
    { id: 'lawyer', name: 'Lawyer/Advocate', riskMultiplier: 1.8 },
    { id: 'doctor', name: 'Medical Doctor', riskMultiplier: 2.5 },
    { id: 'architect', name: 'Architect', riskMultiplier: 1.5 },
    { id: 'engineer', name: 'Engineer', riskMultiplier: 1.4 },
    { id: 'consultant', name: 'Management Consultant', riskMultiplier: 1.3 },
    { id: 'it_professional', name: 'IT Professional', riskMultiplier: 1.6 },
    { id: 'financial_advisor', name: 'Financial Advisor', riskMultiplier: 2.0 },
    { id: 'other', name: 'Other Professional', riskMultiplier: 1.0 }
  ];

  const indemnityLimits = [
    { id: '1million', name: 'KES 1 Million', amount: 1000000, basePremium: 25000 },
    { id: '5million', name: 'KES 5 Million', amount: 5000000, basePremium: 75000 },
    { id: '10million', name: 'KES 10 Million', amount: 10000000, basePremium: 120000 },
    { id: '25million', name: 'KES 25 Million', amount: 25000000, basePremium: 250000 },
    { id: '50million', name: 'KES 50 Million', amount: 50000000, basePremium: 450000 }
  ];

  const excessAmounts = [
    { id: '50000', name: 'KES 50,000', amount: 50000, discount: 0 },
    { id: '100000', name: 'KES 100,000', amount: 100000, discount: 0.05 },
    { id: '250000', name: 'KES 250,000', amount: 250000, discount: 0.1 },
    { id: '500000', name: 'KES 500,000', amount: 500000, discount: 0.15 }
  ];

  const territories = [
    { id: 'kenya', name: 'Kenya Only', multiplier: 1.0 },
    { id: 'east_africa', name: 'East Africa', multiplier: 1.3 },
    { id: 'africa', name: 'Africa', multiplier: 1.6 },
    { id: 'worldwide', name: 'Worldwide', multiplier: 2.0 }
  ];

  const insurers = [
    { id: 'jubilee', name: 'Jubilee Insurance' },
    { id: 'aar', name: 'AAR Insurance' },
    { id: 'madison', name: 'Madison Insurance' },
    { id: 'britam', name: 'Britam Insurance' }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePremium = () => {
    const indemnityLimit = indemnityLimits.find(l => l.id === formData.indemnityLimit);
    const profession = professions.find(p => p.id === formData.profession);
    const excess = excessAmounts.find(e => e.id === formData.excessAmount);
    const territory = territories.find(t => t.id === formData.territory);
    
    if (!indemnityLimit || !profession || !excess || !territory) return 0;
    
    let basePremium = indemnityLimit.basePremium;
    
    // Apply profession risk multiplier
    basePremium *= profession.riskMultiplier;
    
    // Apply territory multiplier
    basePremium *= territory.multiplier;
    
    // Apply excess discount
    basePremium *= (1 - excess.discount);
    
    // Business size adjustments
    const employees = parseInt(formData.numberOfEmployees) || 1;
    if (employees > 50) basePremium *= 1.5;
    else if (employees > 10) basePremium *= 1.2;
    
    // Add optional coverages
    let optionalCost = 0;
    if (formData.includeCyberLiability) optionalCost += 15000;
    if (formData.includeEmploymentPractices) optionalCost += 12000;
    if (formData.includeDirectorsOfficers) optionalCost += 25000;
    
    return Math.round(basePremium + optionalCost);
  };

  const validateStep = (step) => {
    const errors = [];
    
    switch (step) {
      case 1: // Business Information
        if (!formData.businessName?.trim()) errors.push('Business Name is required');
        if (!formData.principalContactName?.trim()) errors.push('Principal Contact Name is required');
        if (!formData.phoneNumber?.trim()) errors.push('Phone Number is required');
        if (!formData.emailAddress?.trim()) errors.push('Email Address is required');
        if (!formData.physicalAddress?.trim()) errors.push('Physical Address is required');
        break;
        
      case 2: // Professional Details
        if (!formData.profession) errors.push('Profession is required');
        if (!formData.yearsInBusiness?.trim()) errors.push('Years in Business is required');
        if (!formData.numberOfEmployees?.trim()) errors.push('Number of Employees is required');
        if (!formData.annualTurnover?.trim()) errors.push('Annual Turnover is required');
        if (!formData.professionalQualifications?.trim()) errors.push('Professional Qualifications is required');
        break;
        
      case 3: // Coverage Selection
        if (!formData.indemnityLimit) errors.push('Indemnity Limit is required');
        if (!formData.excessAmount) errors.push('Excess Amount is required');
        if (!formData.territory) errors.push('Territorial Coverage is required');
        break;
        
      case 4: // Documents & Summary
        if (!formData.preferredInsurer) errors.push('Preferred Insurer is required');
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
      if (currentStep === 3) {
        const premium = calculatePremium();
        updateFormData('estimatedPremium', premium);
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

    if (!formData.declaration) {
      Alert.alert('Error', 'Please accept the declaration to proceed.');
      return;
    }

    Alert.alert(
      'Quotation Submitted',
      `Your professional indemnity insurance quotation has been submitted successfully.\n\nEstimated Premium: KES ${formData.estimatedPremium.toLocaleString()}\n\nPataBima will review your application and provide a detailed quote within 24 hours.`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
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
      <Text style={styles.stepTitle}>Business Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about your business</Text>
      
      <EnhancedTextInput
        label="Business/Practice Name"
        value={formData.businessName}
        onChangeText={(text) => updateFormData('businessName', text)}
        placeholder="Enter business or practice name"
        required
      />

      <EnhancedTextInput
        label="Business Registration Number"
        value={formData.businessRegistrationNumber}
        onChangeText={(text) => updateFormData('businessRegistrationNumber', text)}
        placeholder="Enter registration number (if applicable)"
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Business Type *</Text>
        <View style={styles.optionsGrid}>
          {businessTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.gridOption,
                formData.businessType === type.id && styles.gridOptionActive
              ]}
              onPress={() => updateFormData('businessType', type.id)}
            >
              <Text style={[
                styles.gridOptionText,
                formData.businessType === type.id && styles.gridOptionTextActive
              ]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <EnhancedTextInput
        label="Principal Contact Name"
        value={formData.principalContactName}
        onChangeText={(text) => updateFormData('principalContactName', text)}
        placeholder="Enter principal contact name"
        required
      />

      <EnhancedPhoneInput
        label="Phone Number"
        value={formData.phoneNumber}
        onChangeText={(text) => updateFormData('phoneNumber', text)}
        placeholder="Enter phone number"
        required
      />

      <EnhancedEmailInput
        label="Email Address"
        value={formData.emailAddress}
        onChangeText={(text) => updateFormData('emailAddress', text)}
        placeholder="Enter email address"
        required
      />

      <EnhancedTextInput
        label="Physical Address"
        value={formData.physicalAddress}
        onChangeText={(text) => updateFormData('physicalAddress', text)}
        placeholder="Enter business physical address"
        multiline
        numberOfLines={3}
        required
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Professional Details</Text>
      <Text style={styles.stepSubtitle}>Information about your professional practice</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Profession/Field *</Text>
        {professions.map((profession) => (
          <TouchableOpacity
            key={profession.id}
            style={[
              styles.coverageCard,
              formData.profession === profession.id && styles.coverageCardActive
            ]}
            onPress={() => updateFormData('profession', profession.id)}
          >
            <Text style={styles.coverageName}>{profession.name}</Text>
            <Text style={styles.coveragePrice}>Risk Level: {profession.riskMultiplier}x</Text>
          </TouchableOpacity>
        ))}
      </View>

      <EnhancedTextInput
        label="Years in Business/Practice"
        value={formData.yearsInBusiness}
        onChangeText={(text) => updateFormData('yearsInBusiness', text)}
        placeholder="Enter years in business"
        keyboardType="numeric"
        required
      />

      <EnhancedTextInput
        label="Number of Employees"
        value={formData.numberOfEmployees}
        onChangeText={(text) => updateFormData('numberOfEmployees', text)}
        placeholder="Enter number of employees"
        keyboardType="numeric"
        required
      />

      <EnhancedTextInput
        label="Annual Turnover (KES)"
        value={formData.annualTurnover}
        onChangeText={(text) => updateFormData('annualTurnover', text)}
        placeholder="Enter annual turnover"
        keyboardType="numeric"
        required
      />

      <EnhancedTextInput
        label="Professional Qualifications"
        value={formData.professionalQualifications}
        onChangeText={(text) => updateFormData('professionalQualifications', text)}
        placeholder="List your professional qualifications"
        multiline
        numberOfLines={3}
        required
      />

      <EnhancedTextInput
        label="Professional Bodies/Associations"
        value={formData.professionalBodies}
        onChangeText={(text) => updateFormData('professionalBodies', text)}
        placeholder="List professional bodies you belong to (optional)"
        multiline
        numberOfLines={2}
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Coverage Selection</Text>
      <Text style={styles.stepSubtitle}>Choose your coverage preferences</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Indemnity Limit *</Text>
        {indemnityLimits.map((limit) => (
          <TouchableOpacity
            key={limit.id}
            style={[
              styles.coverageCard,
              formData.indemnityLimit === limit.id && styles.coverageCardActive
            ]}
            onPress={() => updateFormData('indemnityLimit', limit.id)}
          >
            <Text style={styles.coverageName}>{limit.name}</Text>
            <Text style={styles.coveragePrice}>Base: KES {limit.basePremium.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Excess Amount *</Text>
        {excessAmounts.map((excess) => (
          <TouchableOpacity
            key={excess.id}
            style={[
              styles.coverageCard,
              formData.excessAmount === excess.id && styles.coverageCardActive
            ]}
            onPress={() => updateFormData('excessAmount', excess.id)}
          >
            <Text style={styles.coverageName}>{excess.name}</Text>
            <Text style={styles.coveragePrice}>
              {excess.discount > 0 ? `${(excess.discount * 100)}% discount` : 'Standard rate'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Territorial Coverage *</Text>
        {territories.map((territory) => (
          <TouchableOpacity
            key={territory.id}
            style={[
              styles.coverageCard,
              formData.territory === territory.id && styles.coverageCardActive
            ]}
            onPress={() => updateFormData('territory', territory.id)}
          >
            <Text style={styles.coverageName}>{territory.name}</Text>
            <Text style={styles.coveragePrice}>Rate: {territory.multiplier}x</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Retroactive Date</Text>
        <EnhancedDatePicker
          value={formData.retroactiveDate}
          onDateChange={(date) => updateFormData('retroactiveDate', date)}
          placeholder="Select retroactive date (optional)"
        />
        <Text style={styles.inputHelper}>Coverage for claims arising from acts before this date</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Additional Coverage Extensions</Text>
        
        <TouchableOpacity
          style={[
            styles.benefitCard,
            formData.includeCyberLiability && styles.benefitCardActive
          ]}
          onPress={() => updateFormData('includeCyberLiability', !formData.includeCyberLiability)}
        >
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitName}>Cyber Liability Coverage</Text>
            <Text style={styles.benefitPrice}>+KES 15,000</Text>
          </View>
          <View style={[
            styles.checkbox,
            formData.includeCyberLiability && styles.checkboxActive
          ]}>
            {formData.includeCyberLiability && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.benefitCard,
            formData.includeEmploymentPractices && styles.benefitCardActive
          ]}
          onPress={() => updateFormData('includeEmploymentPractices', !formData.includeEmploymentPractices)}
        >
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitName}>Employment Practices Liability</Text>
            <Text style={styles.benefitPrice}>+KES 12,000</Text>
          </View>
          <View style={[
            styles.checkbox,
            formData.includeEmploymentPractices && styles.checkboxActive
          ]}>
            {formData.includeEmploymentPractices && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.benefitCard,
            formData.includeDirectorsOfficers && styles.benefitCardActive
          ]}
          onPress={() => updateFormData('includeDirectorsOfficers', !formData.includeDirectorsOfficers)}
        >
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitName}>Directors & Officers Liability</Text>
            <Text style={styles.benefitPrice}>+KES 25,000</Text>
          </View>
          <View style={[
            styles.checkbox,
            formData.includeDirectorsOfficers && styles.checkboxActive
          ]}>
            {formData.includeDirectorsOfficers && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Documents & Summary</Text>
      <Text style={styles.stepSubtitle}>Review your details and upload documents</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Professional Indemnity Insurance Quote Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Business Name</Text>
          <Text style={styles.summaryValue}>{formData.businessName}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Profession</Text>
          <Text style={styles.summaryValue}>
            {professions.find(p => p.id === formData.profession)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Indemnity Limit</Text>
          <Text style={styles.summaryValue}>
            {indemnityLimits.find(l => l.id === formData.indemnityLimit)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Excess Amount</Text>
          <Text style={styles.summaryValue}>
            {excessAmounts.find(e => e.id === formData.excessAmount)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Territory</Text>
          <Text style={styles.summaryValue}>
            {territories.find(t => t.id === formData.territory)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Additional Coverage</Text>
          <Text style={styles.summaryValue}>
            {[
              formData.includeCyberLiability && 'Cyber Liability',
              formData.includeEmploymentPractices && 'Employment Practices',
              formData.includeDirectorsOfficers && 'Directors & Officers'
            ].filter(Boolean).join(', ') || 'None selected'}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Estimated Premium</Text>
          <Text style={styles.totalValue}>
            KES {formData.estimatedPremium.toLocaleString()}
          </Text>
        </View>
      </View>

      <EnhancedDocumentUpload
        label="Business Certificate"
        documentType="business certificate"
        onDocumentSelect={(doc) => updateFormData('uploadBusinessCertificate', doc)}
        uploadedDocument={formData.uploadBusinessCertificate}
        required
      />

      <EnhancedDocumentUpload
        label="Professional Certificate"
        documentType="professional certificate"
        onDocumentSelect={(doc) => updateFormData('uploadProfessionalCertificate', doc)}
        uploadedDocument={formData.uploadProfessionalCertificate}
        required
      />

      <EnhancedDocumentUpload
        label="Financial Statements"
        documentType="financial statements"
        onDocumentSelect={(doc) => updateFormData('uploadFinancialStatements', doc)}
        uploadedDocument={formData.uploadFinancialStatements}
      />

      <EnhancedDocumentUpload
        label="Insurance History"
        documentType="insurance history"
        onDocumentSelect={(doc) => updateFormData('uploadInsuranceHistory', doc)}
        uploadedDocument={formData.uploadInsuranceHistory}
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Preferred Insurer *</Text>
        <View style={styles.optionsGrid}>
          {insurers.map((insurer) => (
            <TouchableOpacity
              key={insurer.id}
              style={[
                styles.gridOption,
                formData.preferredInsurer === insurer.id && styles.gridOptionActive
              ]}
              onPress={() => updateFormData('preferredInsurer', insurer.id)}
            >
              <Text style={[
                styles.gridOptionText,
                formData.preferredInsurer === insurer.id && styles.gridOptionTextActive
              ]}>
                {insurer.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Declaration *</Text>
        <TouchableOpacity
          style={[
            styles.declarationCard,
            formData.declaration && styles.declarationCardActive
          ]}
          onPress={() => updateFormData('declaration', !formData.declaration)}
        >
          <View style={[
            styles.checkbox,
            formData.declaration && styles.checkboxActive
          ]}>
            {formData.declaration && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.declarationText}>
            I declare that the information provided is true and accurate. I understand that this is a quotation request and PataBima will provide the final quote and terms.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          Payment Method: M-Pesa only. Premium payment will be required after quote approval. 
          PataBima will contact you within 24 hours with your personalized quote.
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
        <Text style={styles.headerTitle}>Professional Indemnity</Text>
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
};

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
    paddingVertical: Spacing.xs,
  },
  headerBackText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
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
    width: 30,
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
    marginTop: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.md,
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
  uploadButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Spacing.xs,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  declarationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: Spacing.xs,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  declarationCardActive: {
    backgroundColor: '#FEF2F2',
    borderColor: Colors.primary,
  },
  declarationText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  disclaimerContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: Spacing.xs,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  disclaimerText: {
    fontSize: Typography.fontSize.sm,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 18,
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
});

export default ProfessionalIndemnityQuotationScreen;
