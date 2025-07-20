/**
 * Domestic Package Insurance Quotation Screen
 * Based on AllInsuranceForms.xml structure adapted for Home/Property Insurance
 * 3-Step Process: Property Details → Coverage Selection → Documents & Summary
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

const DomesticPackageQuotationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form Data - Updated structure for consistency
  const [formData, setFormData] = useState({
    // Step 1: Property Details
    ownerName: '',
    idNumber: '',
    phoneNumber: '',
    emailAddress: '',
    propertyAddress: '',
    propertyType: '',
    
    // Step 2: Coverage Selection
    propertyValue: '',
    buildingMaterial: '',
    occupancyType: '',
    packageType: '',
    personalAccident: false,
    publicLiability: false,
    allRisks: false,
    lossOfRent: false,
    
    // Step 3: Documents & Summary
    preferredInsurer: '',
    estimatedPremium: 0,
    uploadPropertyDocs: null,
    uploadValuationReport: null,
    uploadPropertyPhotos: null,
    declaration: false
  });

  // Dropdown options
  const propertyTypes = [
    { id: 'apartment', name: 'Apartment/Flat', riskMultiplier: 1.0 },
    { id: 'detached_house', name: 'Detached House', riskMultiplier: 1.2 },
    { id: 'semi_detached', name: 'Semi-Detached House', riskMultiplier: 1.1 },
    { id: 'townhouse', name: 'Townhouse', riskMultiplier: 1.05 },
    { id: 'bungalow', name: 'Bungalow', riskMultiplier: 1.15 }
  ];

  const buildingMaterials = [
    { id: 'concrete_stone', name: 'Concrete/Stone', multiplier: 1.0 },
    { id: 'brick', name: 'Brick', multiplier: 1.1 },
    { id: 'wood_frame', name: 'Wood Frame', multiplier: 1.3 },
    { id: 'mixed_materials', name: 'Mixed Materials', multiplier: 1.15 }
  ];

  const occupancyTypes = [
    { id: 'owner_occupied', name: 'Owner Occupied' },
    { id: 'tenant_occupied', name: 'Tenant Occupied' },
    { id: 'vacant', name: 'Vacant' },
    { id: 'seasonal', name: 'Seasonal Use' }
  ];

  const packageTypes = [
    { id: 'basic', name: 'Basic Package', buildingCover: 2000000, contentsCover: 500000, basePremium: 15000 },
    { id: 'standard', name: 'Standard Package', buildingCover: 5000000, contentsCover: 1000000, basePremium: 35000 },
    { id: 'comprehensive', name: 'Comprehensive Package', buildingCover: 10000000, contentsCover: 2000000, basePremium: 65000 },
    { id: 'premium', name: 'Premium Package', buildingCover: 15000000, contentsCover: 3000000, basePremium: 95000 }
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
    const selectedPackage = packageTypes.find(p => p.id === formData.packageType);
    const selectedProperty = propertyTypes.find(p => p.id === formData.propertyType);
    const selectedMaterial = buildingMaterials.find(m => m.id === formData.buildingMaterial);
    
    if (!selectedPackage || !selectedProperty || !selectedMaterial) return 0;
    
    let basePremium = selectedPackage.basePremium;
    
    // Apply property type and material multipliers
    basePremium *= selectedProperty.riskMultiplier;
    basePremium *= selectedMaterial.multiplier;
    
    // Add optional coverages
    let optionalCost = 0;
    if (formData.personalAccident) optionalCost += 5000;
    if (formData.publicLiability) optionalCost += 8000;
    if (formData.allRisks) optionalCost += 12000;
    if (formData.lossOfRent) optionalCost += 6000;
    
    return Math.round(basePremium + optionalCost);
  };

  const validateStep = (step) => {
    const errors = [];
    
    switch (step) {
      case 1: // Property Details
        if (!formData.ownerName.trim()) errors.push('Property Owner Name is required');
        if (!formData.idNumber.trim()) errors.push('ID Number is required');
        if (!formData.phoneNumber.trim()) errors.push('Phone Number is required');
        if (!formData.propertyAddress.trim()) errors.push('Property Address is required');
        if (!formData.propertyType) errors.push('Property Type is required');
        break;
        
      case 2: // Coverage Selection
        if (!formData.propertyValue.trim()) errors.push('Property Value is required');
        if (!formData.buildingMaterial) errors.push('Building Material is required');
        if (!formData.occupancyType) errors.push('Occupancy Type is required');
        if (!formData.packageType) errors.push('Coverage Package is required');
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
      `Your domestic package insurance quotation has been submitted successfully.\n\nEstimated Premium: KES ${formData.estimatedPremium.toLocaleString()}\n\nPataBima will review your application and provide a detailed quote within 24 hours.`,
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
      <Text style={styles.stepTitle}>Property Details</Text>
      <Text style={styles.stepSubtitle}>Please provide your property and personal information</Text>
      
      <EnhancedTextInput
        label="Property Owner Name"
        value={formData.ownerName}
        onChangeText={(text) => updateFormData('ownerName', text)}
        placeholder="Enter property owner name"
        required
      />

      <EnhancedIDInput
        label="ID Number"
        value={formData.idNumber}
        onChangeText={(text) => updateFormData('idNumber', text)}
        placeholder="Enter your ID number"
        required
      />

      <EnhancedPhoneInput
        label="Phone Number"
        value={formData.phoneNumber}
        onChangeText={(text) => updateFormData('phoneNumber', text)}
        placeholder="Enter phone number"
        required
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <EnhancedEmailInput
          value={formData.emailAddress}
          onChangeText={(text) => updateFormData('emailAddress', text)}
          placeholder="Enter email address (optional)"
        />
      </View>

      <EnhancedTextInput
        label="Property Address"
        value={formData.propertyAddress}
        onChangeText={(text) => updateFormData('propertyAddress', text)}
        placeholder="Enter complete property address"
        multiline
        numberOfLines={3}
        required
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Property Type *</Text>
        <View style={styles.optionsGrid}>
          {propertyTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.gridOption,
                formData.propertyType === type.id && styles.gridOptionActive
              ]}
              onPress={() => updateFormData('propertyType', type.id)}
            >
              <Text style={[
                styles.gridOptionText,
                formData.propertyType === type.id && styles.gridOptionTextActive
              ]}>
                {type.name}
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
      <Text style={styles.stepSubtitle}>Select your coverage options and additional benefits</Text>
      
      <EnhancedTextInput
        label="Estimated Property Value (KES)"
        value={formData.propertyValue}
        onChangeText={(text) => updateFormData('propertyValue', text)}
        placeholder="Enter estimated property value"
        keyboardType="numeric"
        required
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Building Material *</Text>
        {buildingMaterials.map((material) => (
          <TouchableOpacity
            key={material.id}
            style={[
              styles.coverageCard,
              formData.buildingMaterial === material.id && styles.coverageCardActive
            ]}
            onPress={() => updateFormData('buildingMaterial', material.id)}
          >
            <Text style={styles.coverageName}>{material.name}</Text>
            <Text style={styles.coveragePrice}>Rate: {material.multiplier}x</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Occupancy Type *</Text>
        <View style={styles.optionsGrid}>
          {occupancyTypes.map((occupancy) => (
            <TouchableOpacity
              key={occupancy.id}
              style={[
                styles.gridOption,
                formData.occupancyType === occupancy.id && styles.gridOptionActive
              ]}
              onPress={() => updateFormData('occupancyType', occupancy.id)}
            >
              <Text style={[
                styles.gridOptionText,
                formData.occupancyType === occupancy.id && styles.gridOptionTextActive
              ]}>
                {occupancy.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Coverage Package *</Text>
        {packageTypes.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.coverageCard,
              formData.packageType === pkg.id && styles.coverageCardActive
            ]}
            onPress={() => updateFormData('packageType', pkg.id)}
          >
            <Text style={styles.coverageName}>{pkg.name}</Text>
            <Text style={styles.coverageDetails}>
              Building: KES {pkg.buildingCover.toLocaleString()} | Contents: KES {pkg.contentsCover.toLocaleString()}
            </Text>
            <Text style={styles.coveragePrice}>Base Premium: KES {pkg.basePremium.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Additional Coverage</Text>
        
        <TouchableOpacity
          style={[
            styles.benefitCard,
            formData.personalAccident && styles.benefitCardActive
          ]}
          onPress={() => updateFormData('personalAccident', !formData.personalAccident)}
        >
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitName}>Personal Accident Coverage</Text>
            <Text style={styles.benefitPrice}>+KES 5,000</Text>
          </View>
          <View style={[
            styles.checkbox,
            formData.personalAccident && styles.checkboxActive
          ]}>
            {formData.personalAccident && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.benefitCard,
            formData.publicLiability && styles.benefitCardActive
          ]}
          onPress={() => updateFormData('publicLiability', !formData.publicLiability)}
        >
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitName}>Public Liability Coverage</Text>
            <Text style={styles.benefitPrice}>+KES 8,000</Text>
          </View>
          <View style={[
            styles.checkbox,
            formData.publicLiability && styles.checkboxActive
          ]}>
            {formData.publicLiability && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.benefitCard,
            formData.allRisks && styles.benefitCardActive
          ]}
          onPress={() => updateFormData('allRisks', !formData.allRisks)}
        >
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitName}>All Risks Coverage</Text>
            <Text style={styles.benefitPrice}>+KES 12,000</Text>
          </View>
          <View style={[
            styles.checkbox,
            formData.allRisks && styles.checkboxActive
          ]}>
            {formData.allRisks && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.benefitCard,
            formData.lossOfRent && styles.benefitCardActive
          ]}
          onPress={() => updateFormData('lossOfRent', !formData.lossOfRent)}
        >
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitName}>Loss of Rent Coverage</Text>
            <Text style={styles.benefitPrice}>+KES 6,000</Text>
          </View>
          <View style={[
            styles.checkbox,
            formData.lossOfRent && styles.checkboxActive
          ]}>
            {formData.lossOfRent && <Text style={styles.checkmark}>✓</Text>}
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
        <Text style={styles.summaryTitle}>Domestic Package Insurance Quote Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Property Owner</Text>
          <Text style={styles.summaryValue}>{formData.ownerName}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Property Type</Text>
          <Text style={styles.summaryValue}>
            {propertyTypes.find(p => p.id === formData.propertyType)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Property Value</Text>
          <Text style={styles.summaryValue}>KES {formData.propertyValue ? parseInt(formData.propertyValue).toLocaleString() : '0'}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Building Material</Text>
          <Text style={styles.summaryValue}>
            {buildingMaterials.find(m => m.id === formData.buildingMaterial)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Coverage Package</Text>
          <Text style={styles.summaryValue}>
            {packageTypes.find(p => p.id === formData.packageType)?.name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Additional Coverage</Text>
          <Text style={styles.summaryValue}>
            {[
              formData.personalAccident && 'Personal Accident',
              formData.publicLiability && 'Public Liability',
              formData.allRisks && 'All Risks',
              formData.lossOfRent && 'Loss of Rent'
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
        label="Property Documents"
        documentType="property documents"
        onDocumentSelect={(doc) => updateFormData('uploadPropertyDocs', doc)}
        uploadedDocument={formData.uploadPropertyDocs}
        required
      />

      <EnhancedDocumentUpload
        label="Valuation Report"
        documentType="valuation report"
        onDocumentSelect={(doc) => updateFormData('uploadValuationReport', doc)}
        uploadedDocument={formData.uploadValuationReport}
      />

      <EnhancedDocumentUpload
        label="Property Photos"
        documentType="property photos"
        onDocumentSelect={(doc) => updateFormData('uploadPropertyPhotos', doc)}
        uploadedDocument={formData.uploadPropertyPhotos}
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
        <Text style={styles.headerTitle}>Domestic Package Insurance</Text>
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
  coverageDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
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

export default DomesticPackageQuotationScreen;

