/**
 * WIBA (Work Injury Benefits Act) Insurance Quotation Screen
 * Based on Travel Insurance structure with Enhanced Form Components
 * 3-Step Process: Personal Info → Employment & Coverage Details → Documents & Summary
 */

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
import { 
  EnhancedTextInput, 
  EnhancedEmailInput, 
  EnhancedPhoneInput, 
  EnhancedIDInput, 
  EnhancedDatePicker,
  EnhancedEmploymentDatePicker
} from '../../../components/EnhancedFormComponents';
import { EnhancedDocumentUpload } from '../../../components/EnhancedDocumentUpload';

const EnhancedWIBAQuotationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form Data for WIBA Insurance
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: '',
    idNumber: '',
    dateOfBirth: '',
    phoneNumber: '',
    emailAddress: '',
    
    // Step 2: Employment & Coverage Details
    employerName: '',
    employerAddress: '',
    jobTitle: '',
    monthlySalary: '',
    employmentStartDate: '',
    contractType: '', // permanent, temporary, casual
    riskCategory: '', // office, manual, hazardous
    coverageAmount: '',
    beneficiaryName: '',
    beneficiaryRelationship: '',
    beneficiaryPhone: '',
    
    // Step 3: Documents & Summary
    preferredInsurer: '',
    estimatedPremium: 0,
    uploadEmploymentLetter: null,
    uploadIdCopy: null,
    uploadPayslip: null,
    uploadMedicalCert: null,
    declaration: false
  });

  // Dropdown options for WIBA
  const contractTypes = [
    { id: 'permanent', name: 'Permanent Employment' },
    { id: 'temporary', name: 'Temporary Contract' },
    { id: 'casual', name: 'Casual Employment' },
    { id: 'probation', name: 'Probation Period' }
  ];

  const riskCategories = [
    { 
      id: 'office', 
      name: 'Office Work', 
      description: 'Desk-based, administrative roles',
      multiplier: 1.0,
      rate: '0.5%'
    },
    { 
      id: 'manual', 
      name: 'Manual Labor', 
      description: 'Physical work, machinery operation',
      multiplier: 1.5,
      rate: '0.75%'
    },
    { 
      id: 'hazardous', 
      name: 'Hazardous Work', 
      description: 'High-risk environments, construction',
      multiplier: 2.0,
      rate: '1.0%'
    }
  ];

  const beneficiaryRelationships = [
    { id: 'spouse', name: 'Spouse' },
    { id: 'child', name: 'Child' },
    { id: 'parent', name: 'Parent' },
    { id: 'sibling', name: 'Sibling' },
    { id: 'other', name: 'Other Family Member' }
  ];

  const insurers = [
    { id: 'jubilee', name: 'Jubilee Insurance' },
    { id: 'aar', name: 'AAR Insurance' },
    { id: 'madison', name: 'Madison Insurance' },
    { id: 'britam', name: 'Britam Insurance' },
    { id: 'icea', name: 'ICEA LION Insurance' }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePremium = () => {
    const salary = parseFloat(formData.monthlySalary) || 0;
    if (salary === 0) return 0;

    // WIBA premium calculation based on salary and risk category
    const riskCat = riskCategories.find(r => r.id === formData.riskCategory);
    const baseRate = 0.005; // 0.5% base rate
    const multiplier = riskCat ? riskCat.multiplier : 1.0;
    
    // Annual salary for calculation
    const annualSalary = salary * 12;
    
    // Calculate premium (rate * salary * risk multiplier)
    const premium = annualSalary * baseRate * multiplier;
    
    // Minimum premium of KES 1,000
    return Math.max(Math.round(premium), 1000);
  };

  const calculateCoverageAmount = () => {
    const salary = parseFloat(formData.monthlySalary) || 0;
    // WIBA coverage is typically 48 months of salary
    return salary * 48;
  };

  const validateStep = (step) => {
    const errors = [];
    
    switch (step) {
      case 1: // Personal Information
        if (!formData.fullName.trim()) errors.push('Full Name is required');
        if (!formData.idNumber.trim()) errors.push('ID Number is required');
        if (!formData.dateOfBirth.trim()) errors.push('Date of Birth is required');
        if (!formData.phoneNumber.trim()) errors.push('Phone Number is required');
        break;
        
      case 2: // Employment & Coverage Details
        if (!formData.employerName.trim()) errors.push('Employer Name is required');
        if (!formData.jobTitle.trim()) errors.push('Job Title is required');
        if (!formData.monthlySalary.trim()) errors.push('Monthly Salary is required');
        if (!formData.employmentStartDate.trim()) errors.push('Employment Start Date is required');
        if (!formData.contractType) errors.push('Contract Type is required');
        if (!formData.riskCategory) errors.push('Risk Category is required');
        if (!formData.beneficiaryName.trim()) errors.push('Beneficiary Name is required');
        if (!formData.beneficiaryRelationship) errors.push('Beneficiary Relationship is required');
        break;
        
      case 3: // Documents & Summary
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
      if (currentStep === 2) {
        const premium = calculatePremium();
        const coverage = calculateCoverageAmount();
        updateFormData('estimatedPremium', premium);
        updateFormData('coverageAmount', coverage);
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
    const errors = validateStep(3);
    
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
      'WIBA Quotation Submitted',
      `Your WIBA insurance quotation has been submitted successfully.\n\nEstimated Premium: KES ${formData.estimatedPremium.toLocaleString()}\nCoverage Amount: KES ${formData.coverageAmount.toLocaleString()}\n\nPataBima will review your application and provide a detailed quote within 24 hours.`,
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
      {[1, 2, 3].map((step) => (
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
          {step < 3 && (
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
      <Text style={styles.stepSubtitle}>Please provide your personal details for WIBA insurance</Text>
      
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
        placeholder="Enter your ID number"
        required
      />

      <EnhancedDatePicker
        label="Date of Birth"
        value={formData.dateOfBirth}
        onDateChange={(date) => updateFormData('dateOfBirth', date)}
        placeholder="Select date of birth"
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
        placeholder="Enter email address (optional)"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Employment & Coverage Details</Text>
      <Text style={styles.stepSubtitle}>Tell us about your employment and coverage requirements</Text>
      
      <EnhancedTextInput
        label="Employer Name"
        value={formData.employerName}
        onChangeText={(text) => updateFormData('employerName', text)}
        placeholder="Enter employer/company name"
        required
      />

      <EnhancedTextInput
        label="Employer Address"
        value={formData.employerAddress}
        onChangeText={(text) => updateFormData('employerAddress', text)}
        placeholder="Enter employer address"
        multiline
        numberOfLines={3}
      />

      <EnhancedTextInput
        label="Job Title / Occupation"
        value={formData.jobTitle}
        onChangeText={(text) => updateFormData('jobTitle', text)}
        placeholder="Enter your job title"
        required
      />

      <EnhancedTextInput
        label="Monthly Salary (KES)"
        value={formData.monthlySalary}
        onChangeText={(text) => updateFormData('monthlySalary', text)}
        placeholder="Enter monthly salary amount"
        keyboardType="numeric"
        required
      />

      <EnhancedEmploymentDatePicker
        label="Employment Start Date"
        value={formData.employmentStartDate}
        onDateChange={(date) => updateFormData('employmentStartDate', date)}
        placeholder="Select employment start date"
        required
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Contract Type *</Text>
        <View style={styles.optionsGrid}>
          {contractTypes.map((contract) => (
            <TouchableOpacity
              key={contract.id}
              style={[
                styles.gridOption,
                formData.contractType === contract.id && styles.gridOptionActive
              ]}
              onPress={() => updateFormData('contractType', contract.id)}
            >
              <Text style={[
                styles.gridOptionText,
                formData.contractType === contract.id && styles.gridOptionTextActive
              ]}>
                {contract.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Risk Category *</Text>
        <Text style={styles.inputHelper}>Select the category that best describes your work environment</Text>
        {riskCategories.map((risk) => (
          <TouchableOpacity
            key={risk.id}
            style={[
              styles.riskCard,
              formData.riskCategory === risk.id && styles.riskCardActive
            ]}
            onPress={() => updateFormData('riskCategory', risk.id)}
          >
            <View style={styles.riskCardContent}>
              <Text style={[
                styles.riskName,
                formData.riskCategory === risk.id && styles.riskNameActive
              ]}>
                {risk.name}
              </Text>
              <Text style={[
                styles.riskDescription,
                formData.riskCategory === risk.id && styles.riskDescriptionActive
              ]}>
                {risk.description}
              </Text>
              <Text style={[
                styles.riskRate,
                formData.riskCategory === risk.id && styles.riskRateActive
              ]}>
                Premium Rate: {risk.rate} of annual salary
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Beneficiary Information</Text>
        <Text style={styles.sectionSubtitle}>Person to receive benefits in case of work injury</Text>
      </View>

      <EnhancedTextInput
        label="Beneficiary Full Name"
        value={formData.beneficiaryName}
        onChangeText={(text) => updateFormData('beneficiaryName', text)}
        placeholder="Enter beneficiary full name"
        required
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Relationship to Beneficiary *</Text>
        <View style={styles.optionsGrid}>
          {beneficiaryRelationships.map((relationship) => (
            <TouchableOpacity
              key={relationship.id}
              style={[
                styles.gridOption,
                formData.beneficiaryRelationship === relationship.id && styles.gridOptionActive
              ]}
              onPress={() => updateFormData('beneficiaryRelationship', relationship.id)}
            >
              <Text style={[
                styles.gridOptionText,
                formData.beneficiaryRelationship === relationship.id && styles.gridOptionTextActive
              ]}>
                {relationship.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <EnhancedPhoneInput
        label="Beneficiary Phone Number"
        value={formData.beneficiaryPhone}
        onChangeText={(text) => updateFormData('beneficiaryPhone', text)}
        placeholder="Enter beneficiary phone number"
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Documents & Summary</Text>
      <Text style={styles.stepSubtitle}>Review your details and upload required documents</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>WIBA Insurance Quote Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Employee</Text>
          <Text style={styles.summaryValue}>{formData.fullName}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Employer</Text>
          <Text style={styles.summaryValue}>{formData.employerName}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Job Title</Text>
          <Text style={styles.summaryValue}>{formData.jobTitle}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Monthly Salary</Text>
          <Text style={styles.summaryValue}>
            KES {formData.monthlySalary ? parseFloat(formData.monthlySalary).toLocaleString() : '0'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Risk Category</Text>
          <Text style={styles.summaryValue}>
            {riskCategories.find(r => r.id === formData.riskCategory)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Beneficiary</Text>
          <Text style={styles.summaryValue}>{formData.beneficiaryName}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Coverage Amount</Text>
          <Text style={styles.summaryValue}>
            KES {formData.coverageAmount ? formData.coverageAmount.toLocaleString() : '0'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Annual Premium</Text>
          <Text style={styles.totalValue}>
            KES {formData.estimatedPremium.toLocaleString()}
          </Text>
        </View>
      </View>

      <EnhancedDocumentUpload
        label="Employment Letter"
        documentType="employment letter"
        onDocumentSelect={(doc) => updateFormData('uploadEmploymentLetter', doc)}
        uploadedDocument={formData.uploadEmploymentLetter}
        required
      />

      <EnhancedDocumentUpload
        label="ID Copy"
        documentType="ID copy"
        onDocumentSelect={(doc) => updateFormData('uploadIdCopy', doc)}
        uploadedDocument={formData.uploadIdCopy}
        required
      />

      <EnhancedDocumentUpload
        label="Recent Payslip"
        documentType="payslip"
        onDocumentSelect={(doc) => updateFormData('uploadPayslip', doc)}
        uploadedDocument={formData.uploadPayslip}
        required
      />

      <EnhancedDocumentUpload
        label="Medical Certificate"
        documentType="medical certificate"
        onDocumentSelect={(doc) => updateFormData('uploadMedicalCert', doc)}
        uploadedDocument={formData.uploadMedicalCert}
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
            I declare that the information provided is true and accurate. I understand that this is a quotation request for WIBA insurance and PataBima will provide the final quote and terms. I confirm that I am currently employed by the stated employer.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          WIBA Coverage: This insurance covers work-related injuries as per the Work Injury Benefits Act. 
          Premium payment required after quote approval. PataBima will contact you within 24 hours.
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
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
        <Text style={styles.headerTitle}>WIBA Insurance</Text>
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
  riskCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  riskCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FEF2F2',
  },
  riskCardContent: {
    flex: 1,
  },
  riskName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  riskNameActive: {
    color: Colors.primary,
  },
  riskDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  riskDescriptionActive: {
    color: Colors.textPrimary,
  },
  riskRate: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  riskRateActive: {
    color: Colors.primary,
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
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

export default EnhancedWIBAQuotationScreen;
