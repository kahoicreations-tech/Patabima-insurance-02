/**
 * Travel Insurance Quotation Screen
 * Based on AllInsuranceForms.xml - TravelInsurance_Individual
 * 3-Step Process: Personal Info → Travel Details → Documents & Summary
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
  EnhancedDatePicker,
  EnhancedDepartureDatePicker,
  EnhancedReturnDatePicker
} from '../../../components/EnhancedFormComponents';
import { EnhancedDocumentUpload } from '../../../components/EnhancedDocumentUpload';

const TravelQuotationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form Data based on XML structure
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: '',
    passportIdNumber: '',
    dateOfBirth: '',
    nationality: '',
    phoneNumber: '',
    emailAddress: '',
    
    // Step 2: Travel Details
    destinationCountry: '',
    purposeOfTravel: '',
    departureDate: '',
    returnDate: '',
    numberOfTravelers: '1',
    travelCoverType: '',
    addMedicalCover: false,
    
    // Step 3: Documents & Summary
    preferredInsurer: '',
    estimatedPremium: 0,
    uploadPassportCopy: null,
    uploadVisa: null,
    uploadItinerary: null,
    declaration: false
  });

  // Dropdown options
  const nationalities = [
    { id: 'kenya', name: 'Kenyan' },
    { id: 'uganda', name: 'Ugandan' },
    { id: 'tanzania', name: 'Tanzanian' },
    { id: 'other', name: 'Other' }
  ];

  const travelPurposes = [
    { id: 'business', name: 'Business' },
    { id: 'tourism', name: 'Tourism' },
    { id: 'education', name: 'Education' },
    { id: 'medical', name: 'Medical' },
    { id: 'conference', name: 'Conference' },
    { id: 'other', name: 'Other' }
  ];

  const travelCoverTypes = [
    { id: 'basic', name: 'Basic Cover', premium: 'From KES 2,500' },
    { id: 'comprehensive', name: 'Comprehensive Cover', premium: 'From KES 5,000' },
    { id: 'premium', name: 'Premium Cover', premium: 'From KES 8,500' }
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
    let basePremium = 2500; // Base premium
    
    // Adjust based on cover type
    if (formData.travelCoverType === 'comprehensive') basePremium = 5000;
    if (formData.travelCoverType === 'premium') basePremium = 8500;
    
    // Adjust based on number of travelers
    const travelers = parseInt(formData.numberOfTravelers) || 1;
    basePremium *= travelers;
    
    // Add medical cover if selected
    if (formData.addMedicalCover) {
      basePremium += 1500;
    }
    
    return Math.round(basePremium);
  };

  const validateStep = (step) => {
    const errors = [];
    
    switch (step) {
      case 1: // Personal Information
        if (!formData.fullName.trim()) errors.push('Full Name is required');
        if (!formData.passportIdNumber.trim()) errors.push('Passport/ID Number is required');
        if (!formData.dateOfBirth.trim()) errors.push('Date of Birth is required');
        if (!formData.nationality) errors.push('Nationality is required');
        if (!formData.phoneNumber.trim()) errors.push('Phone Number is required');
        break;
        
      case 2: // Travel Details
        if (!formData.destinationCountry.trim()) errors.push('Destination Country is required');
        if (!formData.purposeOfTravel) errors.push('Purpose of Travel is required');
        if (!formData.departureDate.trim()) errors.push('Departure Date is required');
        if (!formData.returnDate.trim()) errors.push('Return Date is required');
        if (!formData.numberOfTravelers.trim()) errors.push('Number of Travelers is required');
        if (!formData.travelCoverType) errors.push('Travel Cover Type is required');
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
    const errors = validateStep(3); // Final validation
    
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
      `Your travel insurance quotation has been submitted successfully.\n\nEstimated Premium: KES ${formData.estimatedPremium.toLocaleString()}\n\nPataBima will review your application and provide a detailed quote within 24 hours.`,
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
      <Text style={styles.stepSubtitle}>Please provide your personal details for travel insurance</Text>
      
      <EnhancedTextInput
        label="Full Name"
        value={formData.fullName}
        onChangeText={(text) => updateFormData('fullName', text)}
        placeholder="Enter your full name"
        required
      />

      <EnhancedIDInput
        label="Passport / ID Number"
        value={formData.passportIdNumber}
        onChangeText={(text) => updateFormData('passportIdNumber', text)}
        placeholder="Enter passport or ID number"
        required
      />

      <EnhancedDatePicker
        label="Date of Birth"
        value={formData.dateOfBirth}
        onDateChange={(date) => updateFormData('dateOfBirth', date)}
        placeholder="Select date of birth"
        required
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nationality *</Text>
        <View style={styles.optionsGrid}>
          {nationalities.map((nationality) => (
            <TouchableOpacity
              key={nationality.id}
              style={[
                styles.gridOption,
                formData.nationality === nationality.id && styles.gridOptionActive
              ]}
              onPress={() => updateFormData('nationality', nationality.id)}
            >
              <Text style={[
                styles.gridOptionText,
                formData.nationality === nationality.id && styles.gridOptionTextActive
              ]}>
                {nationality.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData('phoneNumber', text)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <EnhancedEmailInput
          value={formData.emailAddress}
          onChangeText={(text) => updateFormData('emailAddress', text)}
          placeholder="Enter email address (optional)"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Travel Details</Text>
      <Text style={styles.stepSubtitle}>Tell us about your travel plans</Text>
      
      <EnhancedTextInput
        label="Destination Country"
        value={formData.destinationCountry}
        onChangeText={(text) => updateFormData('destinationCountry', text)}
        placeholder="Enter destination country"
        required
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Purpose of Travel *</Text>
        <View style={styles.optionsGrid}>
          {travelPurposes.map((purpose) => (
            <TouchableOpacity
              key={purpose.id}
              style={[
                styles.gridOption,
                formData.purposeOfTravel === purpose.id && styles.gridOptionActive
              ]}
              onPress={() => updateFormData('purposeOfTravel', purpose.id)}
            >
              <Text style={[
                styles.gridOptionText,
                formData.purposeOfTravel === purpose.id && styles.gridOptionTextActive
              ]}>
                {purpose.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <EnhancedDepartureDatePicker
        label="Departure Date"
        value={formData.departureDate}
        onDateChange={(date) => updateFormData('departureDate', date)}
        placeholder="Select departure date"
        required
      />

      <EnhancedReturnDatePicker
        label="Return Date"
        value={formData.returnDate}
        onDateChange={(date) => updateFormData('returnDate', date)}
        placeholder="Select return date"
        departureDate={formData.departureDate}
        required
      />

      <EnhancedTextInput
        label="Number of Travelers"
        value={formData.numberOfTravelers}
        onChangeText={(text) => updateFormData('numberOfTravelers', text)}
        placeholder="Enter number of travelers"
        keyboardType="numeric"
        required
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Travel Cover Type *</Text>
        {travelCoverTypes.map((cover) => (
          <TouchableOpacity
            key={cover.id}
            style={[
              styles.coverageCard,
              formData.travelCoverType === cover.id && styles.coverageCardActive
            ]}
            onPress={() => updateFormData('travelCoverType', cover.id)}
          >
            <Text style={styles.coverageName}>{cover.name}</Text>
            <Text style={styles.coveragePrice}>{cover.premium}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Add Medical Cover</Text>
        <TouchableOpacity
          style={[
            styles.benefitCard,
            formData.addMedicalCover && styles.benefitCardActive
          ]}
          onPress={() => updateFormData('addMedicalCover', !formData.addMedicalCover)}
        >
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitName}>Enhanced Medical Coverage</Text>
            <Text style={styles.benefitPrice}>+KES 1,500</Text>
          </View>
          <View style={[
            styles.checkbox,
            formData.addMedicalCover && styles.checkboxActive
          ]}>
            {formData.addMedicalCover && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Documents & Summary</Text>
      <Text style={styles.stepSubtitle}>Review your details and upload documents</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Travel Insurance Quote Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Traveler</Text>
          <Text style={styles.summaryValue}>{formData.fullName}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Destination</Text>
          <Text style={styles.summaryValue}>{formData.destinationCountry}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Travel Dates</Text>
          <Text style={styles.summaryValue}>
            {formData.departureDate} - {formData.returnDate}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Number of Travelers</Text>
          <Text style={styles.summaryValue}>{formData.numberOfTravelers}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cover Type</Text>
          <Text style={styles.summaryValue}>
            {travelCoverTypes.find(c => c.id === formData.travelCoverType)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Medical Cover</Text>
          <Text style={styles.summaryValue}>
            {formData.addMedicalCover ? 'Included' : 'Not included'}
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
        label="Passport Copy"
        documentType="passport copy"
        onDocumentSelect={(doc) => updateFormData('uploadPassportCopy', doc)}
        uploadedDocument={formData.uploadPassportCopy}
        required
      />

      <EnhancedDocumentUpload
        label="Visa Document"
        documentType="visa"
        onDocumentSelect={(doc) => updateFormData('uploadVisa', doc)}
        uploadedDocument={formData.uploadVisa}
      />

      <EnhancedDocumentUpload
        label="Travel Itinerary"
        documentType="itinerary"
        onDocumentSelect={(doc) => updateFormData('uploadItinerary', doc)}
        uploadedDocument={formData.uploadItinerary}
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
        <Text style={styles.headerTitle}>Travel Insurance</Text>
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

export default TravelQuotationScreen;
