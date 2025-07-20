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
  EnhancedDatePicker
} from '../../../components/EnhancedFormComponents';
import { EnhancedDocumentUpload } from '../../../components/EnhancedDocumentUpload';

const { width } = Dimensions.get('window');

export default function WIBAQuotationScreen({ navigation, route }) {
  // Using props navigation instead of hook
  // const navigation = useNavigation();
  // const insets = useSafeAreaInsets(); // Commented out to avoid duplicate declaration

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Keep this for internal use in this function

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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // Using safeAreaInsets from props instead of hook to avoid duplicate declaration
  // const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const steps = 5; // Renamed to avoid conflict

  // Sample data - in real app, this would come from API
  const industryClassificationOptions = [
    { id: 1, name: 'Manufacturing', riskLevel: 'High', multiplier: 1.5 },
    { id: 2, name: 'Construction', riskLevel: 'Very High', multiplier: 2.0 },
    { id: 3, name: 'Mining', riskLevel: 'Very High', multiplier: 2.2 },
    { id: 4, name: 'Agriculture', riskLevel: 'Medium', multiplier: 1.2 },
    { id: 5, name: 'Transportation', riskLevel: 'High', multiplier: 1.6 },
    { id: 6, name: 'Healthcare', riskLevel: 'Medium', multiplier: 1.1 },
    { id: 7, name: 'Education', riskLevel: 'Low', multiplier: 0.8 },
    { id: 8, name: 'Finance/Banking', riskLevel: 'Low', multiplier: 0.7 },
    { id: 9, name: 'Information Technology', riskLevel: 'Low', multiplier: 0.6 },
    { id: 10, name: 'Retail/Trade', riskLevel: 'Medium', multiplier: 1.0 }
  ];

  const paymentMethodOptions = [
    { id: 1, name: 'Bank Transfer', description: 'Direct bank transfer' },
    { id: 2, name: 'Cheque', description: 'Company cheque payment' },
    { id: 3, name: 'Mobile Money', description: 'M-Pesa, Airtel Money' },
    { id: 4, name: 'Credit Card', description: 'Corporate credit card' },
    { id: 5, name: 'Direct Debit', description: 'Monthly direct debit' }
  ];

  const documentTypes = [
    'Employee List',
    'Registration Certificate',
    'KRA PIN Certificate',
    'Business License',
    'Incorporation Certificate',
    'Other Documents'
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.employerCompanyName?.trim()) newErrors.employerCompanyName = 'Company name is required';
        if (!formData.natureOfBusiness?.trim()) newErrors.natureOfBusiness = 'Nature of business is required';
        if (!formData.businessRegistrationNo?.trim()) newErrors.businessRegistrationNo = 'Business registration number is required';
        if (!formData.locationOfOperation?.trim()) newErrors.locationOfOperation = 'Location of operation is required';
        break;
      
      case 2:
        if (!formData.contactPersonName?.trim()) newErrors.contactPersonName = 'Contact person name is required';
        if (!formData.contactPhone?.trim()) newErrors.contactPhone = 'Contact phone is required';
        if (!formData.emailAddress?.trim()) newErrors.emailAddress = 'Email address is required';
        if (formData.emailAddress?.trim() && !/\S+@\S+\.\S+/.test(formData.emailAddress)) {
          newErrors.emailAddress = 'Please enter a valid email address';
        }
        break;
      
      case 3:
        if (!formData.numberOfEmployees?.trim()) newErrors.numberOfEmployees = 'Number of employees is required';
        if (!formData.averageMonthlySalary?.trim()) newErrors.averageMonthlySalary = 'Average monthly salary is required';
        if (!formData.industryClassification) newErrors.industryClassification = 'Industry classification is required';
        break;
      
      case 4:
        const hasEmployeeList = formData.documents.some(doc => doc.type === 'Employee List');
        const hasRegistrationCert = formData.documents.some(doc => doc.type === 'Registration Certificate');
        if (!hasEmployeeList || !hasRegistrationCert) {
          newErrors.documents = 'Employee List and Registration Certificate are required';
        }
        break;
      
      case 5:
        if (!formData.declaration) newErrors.declaration = 'Declaration must be accepted';
        if (!formData.preferredPaymentMethod) newErrors.preferredPaymentMethod = 'Payment method is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps) {
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
        'WIBA Quotation Submitted Successfully',
        `Your WIBA insurance quotation has been submitted with reference number: ${quotationNumber}\n\nYou will receive a confirmation email shortly.`,
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

  const selectIndustry = (industry) => {
    updateFormData('industryClassification', industry.name);
    setShowIndustryModal(false);
  };

  const selectPaymentMethod = (method) => {
    updateFormData('preferredPaymentMethod', method.name);
    setShowPaymentModal(false);
  };

  const addDocument = (docType) => {
    const newDoc = {
      id: Date.now(),
      type: docType,
      name: `${docType}_${Date.now()}`,
      uploaded: true,
      size: '2.5 MB'
    };
    
    updateFormData('documents', [...formData.documents, newDoc]);
  };

  const removeDocument = (docId) => {
    updateFormData('documents', formData.documents.filter(doc => doc.id !== docId));
  };

  const calculatePremiumEstimate = () => {
    if (!formData.numberOfEmployees || !formData.averageMonthlySalary || !formData.industryClassification) {
      return 0;
    }

    const employees = parseInt(formData.numberOfEmployees);
    const salary = parseInt(formData.averageMonthlySalary);
    const industry = industryClassificationOptions.find(ind => ind.name === formData.industryClassification);
    
    if (!industry) return 0;

    // Base calculation: (Number of employees × Average salary × Risk multiplier × 0.02)
    const basePremium = employees * salary * industry.multiplier * 0.02;
    return Math.round(basePremium);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / steps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of {steps}</Text>
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
            {step === 2 && 'Contact'}
            {step === 3 && 'Business'}
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
      <Text style={styles.stepDescription}>Please provide your company details</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Employer/Company Name *</Text>
        <TextInput
          style={[styles.input, errors.employerCompanyName && styles.inputError]}
          value={formData.employerCompanyName}
          onChangeText={(text) => updateFormData('employerCompanyName', text)}
          placeholder="Enter company name"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.employerCompanyName && <Text style={styles.errorText}>{errors.employerCompanyName}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nature of Business *</Text>
        <TextInput
          style={[styles.input, errors.natureOfBusiness && styles.inputError]}
          value={formData.natureOfBusiness}
          onChangeText={(text) => updateFormData('natureOfBusiness', text)}
          placeholder="Describe your business activities"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.natureOfBusiness && <Text style={styles.errorText}>{errors.natureOfBusiness}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Business Registration No. *</Text>
        <TextInput
          style={[styles.input, errors.businessRegistrationNo && styles.inputError]}
          value={formData.businessRegistrationNo}
          onChangeText={(text) => updateFormData('businessRegistrationNo', text)}
          placeholder="Enter registration number"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.businessRegistrationNo && <Text style={styles.errorText}>{errors.businessRegistrationNo}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Location of Operation *</Text>
        <TextInput
          style={[styles.input, errors.locationOfOperation && styles.inputError]}
          value={formData.locationOfOperation}
          onChangeText={(text) => updateFormData('locationOfOperation', text)}
          placeholder="Primary business location"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.locationOfOperation && <Text style={styles.errorText}>{errors.locationOfOperation}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact Details</Text>
      <Text style={styles.stepDescription}>Contact person information for this policy</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Contact Person Name *</Text>
        <TextInput
          style={[styles.input, errors.contactPersonName && styles.inputError]}
          value={formData.contactPersonName}
          onChangeText={(text) => updateFormData('contactPersonName', text)}
          placeholder="Enter contact person name"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.contactPersonName && <Text style={styles.errorText}>{errors.contactPersonName}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Contact Phone *</Text>
        <TextInput
          style={[styles.input, errors.contactPhone && styles.inputError]}
          value={formData.contactPhone}
          onChangeText={(text) => updateFormData('contactPhone', text)}
          placeholder="+254 700 000 000"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
        />
        {errors.contactPhone && <Text style={styles.errorText}>{errors.contactPhone}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address *</Text>
        <TextInput
          style={[styles.input, errors.emailAddress && styles.inputError]}
          value={formData.emailAddress}
          onChangeText={(text) => updateFormData('emailAddress', text)}
          placeholder="company@example.com"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.emailAddress && <Text style={styles.errorText}>{errors.emailAddress}</Text>}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Employee & Business Details</Text>
      <Text style={styles.stepDescription}>Information about your workforce and operations</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Number of Employees *</Text>
        <TextInput
          style={[styles.input, errors.numberOfEmployees && styles.inputError]}
          value={formData.numberOfEmployees}
          onChangeText={(text) => updateFormData('numberOfEmployees', text)}
          placeholder="Enter total number of employees"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
        {errors.numberOfEmployees && <Text style={styles.errorText}>{errors.numberOfEmployees}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Average Monthly Salary (KES) *</Text>
        <TextInput
          style={[styles.input, errors.averageMonthlySalary && styles.inputError]}
          value={formData.averageMonthlySalary}
          onChangeText={(text) => updateFormData('averageMonthlySalary', text)}
          placeholder="e.g., 50000"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
        {errors.averageMonthlySalary && <Text style={styles.errorText}>{errors.averageMonthlySalary}</Text>}
      </View>
      
      <TouchableOpacity 
        style={styles.claimTypeSelector}
        onPress={() => setShowIndustryModal(true)}
      >
        <Text style={styles.claimTypeSelectorLabel}>Industry Classification *</Text>
        <Text style={styles.claimTypeSelectorValue}>
          {formData.industryClassification || 'Select industry type'}
        </Text>
        <Text style={styles.claimTypeSelectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.industryClassification && <Text style={styles.errorText}>{errors.industryClassification}</Text>}
      
      {formData.industryClassification && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Premium Estimate</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Employees:</Text>
            <Text style={styles.reviewValue}>{formData.numberOfEmployees || 0}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Average Salary:</Text>
            <Text style={styles.reviewValue}>KES {parseInt(formData.averageMonthlySalary || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Industry Risk:</Text>
            <Text style={styles.reviewValue}>
              {industryClassificationOptions.find(ind => ind.name === formData.industryClassification)?.riskLevel || 'N/A'}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Estimated Annual Premium:</Text>
            <Text style={[styles.reviewValue, { fontWeight: 'bold', color: Colors.primary }]}>
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
      <Text style={styles.stepDescription}>Upload required business documents</Text>
      
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
          <Text style={styles.infoBoxText}>• Employee List (mandatory)</Text>
          <Text style={styles.infoBoxText}>• Registration Certificate (mandatory)</Text>
          <Text style={styles.infoBoxText}>• Additional supporting documents (optional)</Text>
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Declaration</Text>
      <Text style={styles.stepDescription}>Please review your information and declare</Text>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Company Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Company Name:</Text>
          <Text style={styles.reviewValue}>{formData.employerCompanyName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Business Nature:</Text>
          <Text style={styles.reviewValue}>{formData.natureOfBusiness}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Registration No:</Text>
          <Text style={styles.reviewValue}>{formData.businessRegistrationNo}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Location:</Text>
          <Text style={styles.reviewValue}>{formData.locationOfOperation}</Text>
        </View>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Contact & Business Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Contact Person:</Text>
          <Text style={styles.reviewValue}>{formData.contactPersonName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Phone:</Text>
          <Text style={styles.reviewValue}>{formData.contactPhone}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Email:</Text>
          <Text style={styles.reviewValue}>{formData.emailAddress}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Employees:</Text>
          <Text style={styles.reviewValue}>{formData.numberOfEmployees}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Industry:</Text>
          <Text style={styles.reviewValue}>{formData.industryClassification}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Documents:</Text>
          <Text style={styles.reviewValue}>{formData.documents.length} uploaded</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Estimated Premium:</Text>
          <Text style={[styles.reviewValue, { fontWeight: 'bold', color: Colors.primary }]}>
            KES {calculatePremiumEstimate().toLocaleString()} / year
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.claimTypeSelector}
        onPress={() => setShowPaymentModal(true)}
      >
        <Text style={styles.claimTypeSelectorLabel}>Preferred Payment Method *</Text>
        <Text style={styles.claimTypeSelectorValue}>
          {formData.preferredPaymentMethod || 'Select payment method'}
        </Text>
        <Text style={styles.claimTypeSelectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.preferredPaymentMethod && <Text style={styles.errorText}>{errors.preferredPaymentMethod}</Text>}
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Additional Comments (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.additionalComments}
          onChangeText={(text) => updateFormData('additionalComments', text)}
          placeholder="Any additional information or special requests..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>
      
      <TouchableOpacity
        style={styles.declarationContainer}
        onPress={() => updateFormData('declaration', !formData.declaration)}
      >
        <View style={[styles.checkbox, formData.declaration && styles.checkboxChecked]}>
          {formData.declaration && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.declarationText}>
          I declare that the information provided is true and accurate. I understand this is for WIBA insurance coverage for workplace injuries and accidents.
        </Text>
      </TouchableOpacity>
      {errors.declaration && <Text style={styles.errorText}>{errors.declaration}</Text>}
    </View>
  );

  const renderModalSelector = (visible, onClose, options, onSelect, title, showRating = false) => (
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
                  {item.riskLevel && (
                    <Text style={[styles.modalOptionRisk, { 
                      color: item.riskLevel === 'Low' ? Colors.success : 
                            item.riskLevel === 'Medium' ? Colors.warning : Colors.error 
                    }]}>
                      Risk: {item.riskLevel}
                    </Text>
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
          <Text style={styles.headerTitle}>WIBA Insurance</Text>
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
                {isSubmitting ? 'Submitting...' : currentStep === steps ? 'Submit Quotation' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderModalSelector(
        showIndustryModal,
        () => setShowIndustryModal(false),
        industryClassificationOptions,
        selectIndustry,
        'Select Industry Classification'
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  claimTypeSelector: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  claimTypeSelectorLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  claimTypeSelectorValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  claimTypeSelectorIcon: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
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
  documentsContainer: {
    marginBottom: Spacing.lg,
  },
  documentsLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
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
  modalOptionRisk: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginTop: Spacing.xs,
  },
});
