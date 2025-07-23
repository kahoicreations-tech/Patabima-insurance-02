/**
 * Commercial Comprehensive Insurance Screen
 * Handles comprehensive insurance quotations for commercial vehicles
 * including lorries, trucks, and business vehicles
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Dimensions,
  Image,
  Switch,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  VEHICLE_CATEGORIES,
  COMPREHENSIVE_COVERAGE_OPTIONS as COVERAGE_OPTIONS,
  ADDONS,
  PAYMENT_PLANS
} from './constants';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors, Typography, Spacing } from '../../../../constants';
import ActionButton from '../../../../components/common/ActionButton';
import Button from '../../../../components/common/Button';

export default function CommercialComprehensiveScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    phoneNumber: '',
    emailAddress: '',
    vehicleCategory: '',
    subCategory: '',
    make: '',
    model: '',
    year: '',
    registrationNumber: '',
    tonnage: '',
    vehicleValue: '',
    coverageType: '',
    selectedAddons: [],
    hasTracking: false,
    hasDashcam: false,
    hasAntiTheft: false,
    operatingRadius: '',
    driverExperience: '',
    claimsHistory: {
      hasPreviousClaims: false,
      numberOfClaims: '',
      claimDetails: []
    },
    documents: {
      logbook: null,
      inspectionReport: null,
      goodsTransitLicense: null,
      driverLicense: null
    },
    paymentPlan: '',
    declarationAccepted: false
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [premium, setPremium] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationId, setQuotationId] = useState('');

  // Modal states
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);
  const [makeModalVisible, setMakeModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [coverageModalVisible, setCoverageModalVisible] = useState(false);
  const [claimsModalVisible, setClaimsModalVisible] = useState(false);
  const [paymentPlanModalVisible, setPaymentPlanModalVisible] = useState(false);
  const [documentUploadVisible, setDocumentUploadVisible] = useState(false);
  
  // Loading states
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // Effect to calculate premium when relevant fields change
  useEffect(() => {
    if (formData.vehicleValue && formData.coverageType) {
      calculatePremium();
    }
  }, [
    formData.vehicleValue,
    formData.coverageType,
    formData.selectedAddons,
    formData.hasTracking,
    formData.hasDashcam,
    formData.hasAntiTheft,
    formData.operatingRadius,
    formData.tonnage
  ]);

  // Update form fields
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Toggle addon selection
  const toggleAddon = (addonId) => {
    setFormData(prev => {
      const selectedAddons = [...prev.selectedAddons];
      const index = selectedAddons.indexOf(addonId);
      
      if (index !== -1) {
        selectedAddons.splice(index, 1);
      } else {
        selectedAddons.push(addonId);
      }
      
      return { ...prev, selectedAddons };
    });
  };

  // Calculate commercial comprehensive premium
  const calculatePremium = () => {
    setIsCalculating(true);

    setTimeout(() => {
      try {
        const vehicleValue = parseFloat(formData.vehicleValue);
        if (isNaN(vehicleValue)) {
          setPremium(0);
          setIsCalculating(false);
          return;
        }

        // Get base rate from selected coverage
        const coverage = COVERAGE_OPTIONS.find(c => c.id === formData.coverageType);
        if (!coverage) {
          setPremium(0);
          setIsCalculating(false);
          return;
        }

        let rate = coverage.rate;

        // Add rates for selected add-ons
        formData.selectedAddons.forEach(addonId => {
          const addon = ADDONS.find(a => a.id === addonId);
          if (addon) {
            rate += addon.rate;
          }
        });

        // Adjust rate based on tonnage
        const tonnage = parseFloat(formData.tonnage);
        if (!isNaN(tonnage)) {
          if (tonnage > 10) rate += 1;
          else if (tonnage > 5) rate += 0.5;
        }

        // Adjust for operating radius
        switch (formData.operatingRadius) {
          case 'national':
            rate += 0.5;
            break;
          case 'regional':
            rate += 1;
            break;
          case 'international':
            rate += 1.5;
            break;
        }

        // Security features discounts
        if (formData.hasTracking) rate -= 0.5;
        if (formData.hasDashcam) rate -= 0.25;
        if (formData.hasAntiTheft) rate -= 0.25;

        // Calculate base premium
        let calculatedPremium = (vehicleValue * (rate / 100));

        // Minimum premium thresholds
        const minPremium = 50000; // Higher minimum for commercial vehicles
        calculatedPremium = Math.max(calculatedPremium, minPremium);

        // Add standard fees
        const stampDuty = 40;
        const phcf = 0.25; // Policy holders compensation fund
        const trainingLevy = calculatedPremium * 0.002;

        calculatedPremium += stampDuty + (calculatedPremium * phcf / 100) + trainingLevy;

        // Round to nearest 100
        calculatedPremium = Math.ceil(calculatedPremium / 100) * 100;

        setPremium(calculatedPremium);
      } catch (error) {
        console.error('Premium calculation error:', error);
        setPremium(0);
      } finally {
        setIsCalculating(false);
      }
    }, 800);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Business Information
    if (!formData.businessName) newErrors.businessName = 'Business name is required';
    if (!formData.contactPerson) newErrors.contactPerson = 'Contact person is required';

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(0|\+254|254)7\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Enter a valid Kenyan mobile number';
    }

    if (formData.emailAddress && !/\S+@\S+\.\S+/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Enter a valid email address';
    }

    // Vehicle Information
    if (!formData.vehicleCategory) newErrors.vehicleCategory = 'Vehicle category is required';
    if (!formData.subCategory) newErrors.subCategory = 'Sub-category is required';
    if (!formData.make) newErrors.make = 'Make is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.year) newErrors.year = 'Year is required';

    if (!formData.registrationNumber) {
      newErrors.registrationNumber = 'Registration number is required';
    } else if (!/^K[A-Z]{2}\s?\d{3}[A-Z]$/i.test(formData.registrationNumber)) {
      newErrors.registrationNumber = 'Invalid registration format (e.g. KAA 123Z)';
    }

    if (!formData.tonnage) {
      newErrors.tonnage = 'Tonnage is required';
    } else if (isNaN(parseFloat(formData.tonnage)) || parseFloat(formData.tonnage) <= 0) {
      newErrors.tonnage = 'Enter a valid tonnage';
    }

    if (!formData.vehicleValue) {
      newErrors.vehicleValue = 'Vehicle value is required';
    } else {
      const value = parseFloat(formData.vehicleValue);
      if (isNaN(value) || value < 1000000) {
        newErrors.vehicleValue = 'Vehicle value must be at least KSh 1,000,000';
      }
    }

    // Operating Details
    if (!formData.operatingRadius) newErrors.operatingRadius = 'Operating radius is required';
    if (!formData.coverageType) newErrors.coverageType = 'Please select a coverage type';

    // Claims History
    if (formData.claimsHistory.hasPreviousClaims) {
      if (!formData.claimsHistory.numberOfClaims) {
        newErrors.numberOfClaims = 'Number of claims is required';
      }
      
      formData.claimsHistory.claimDetails.forEach((claim, index) => {
        if (!claim.date) {
          newErrors[`claim_${index}_date`] = 'Claim date is required';
        }
        if (!claim.description) {
          newErrors[`claim_${index}_description`] = 'Claim description is required';
        }
        if (!claim.amount) {
          newErrors[`claim_${index}_amount`] = 'Claim amount is required';
        }
      });
    }

    // Required Documents
    const requiredDocs = [
      { key: 'logbook', label: 'Vehicle Logbook' },
      { key: 'inspectionReport', label: 'Inspection Report' },
      { key: 'driverLicense', label: 'Driver\'s License' }
    ];

    if (formData.vehicleCategory === 'general_cartage') {
      requiredDocs.push({ key: 'goodsTransitLicense', label: 'Goods in Transit License' });
    }

    requiredDocs.forEach(doc => {
      if (!formData.documents[doc.key]) {
        newErrors[`document_${doc.key}`] = `${doc.label} is required`;
      }
    });

    // Payment Plan
    if (!formData.paymentPlan) {
      newErrors.paymentPlan = 'Please select a payment plan';
    }

    // Declaration
    if (!formData.declarationAccepted) {
      newErrors.declarationAccepted = 'You must accept the declaration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      setCurrentStep(2);
      setIsSubmitting(false);
      setQuotationId(`COMPC-${Math.floor(100000 + Math.random() * 900000)}`);
    } else {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }
  };

  // Proceed to final step
  const handleConfirm = () => {
    setCurrentStep(3);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Commercial Comprehensive
        </Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => Alert.alert(
            'Commercial Comprehensive',
            'Full coverage for commercial vehicles including own damage, theft, and third party liability.'
          )}
        >
          <Ionicons name="information-circle-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            currentStep >= 1 && styles.progressActive
          ]}>
            <Text style={styles.progressNumber}>1</Text>
          </View>
          <Text style={styles.progressLabel}>Details</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            currentStep >= 2 && styles.progressActive
          ]}>
            <Text style={styles.progressNumber}>2</Text>
          </View>
          <Text style={styles.progressLabel}>Quote</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            currentStep >= 3 && styles.progressActive
          ]}>
            <Text style={styles.progressNumber}>3</Text>
          </View>
          <Text style={styles.progressLabel}>Complete</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && (
          <View style={styles.formContainer}>
            {/* Business Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Name</Text>
                <TextInput
                  style={[styles.input, errors.businessName && styles.inputError]}
                  value={formData.businessName}
                  onChangeText={(value) => updateField('businessName', value)}
                  placeholder="Enter registered business name"
                  placeholderTextColor={Colors.placeholder}
                />
                {errors.businessName && (
                  <Text style={styles.errorText}>{errors.businessName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Person</Text>
                <TextInput
                  style={[styles.input, errors.contactPerson && styles.inputError]}
                  value={formData.contactPerson}
                  onChangeText={(value) => updateField('contactPerson', value)}
                  placeholder="Enter contact person name"
                  placeholderTextColor={Colors.placeholder}
                />
                {errors.contactPerson && (
                  <Text style={styles.errorText}>{errors.contactPerson}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, errors.phoneNumber && styles.inputError]}
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateField('phoneNumber', value)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.placeholder}
                />
                {errors.phoneNumber && (
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, errors.emailAddress && styles.inputError]}
                  value={formData.emailAddress}
                  onChangeText={(value) => updateField('emailAddress', value)}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.placeholder}
                />
                {errors.emailAddress && (
                  <Text style={styles.errorText}>{errors.emailAddress}</Text>
                )}
              </View>
            </View>

            {/* Vehicle Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              
              <TouchableOpacity
                style={[styles.pickerButton, errors.vehicleCategory && styles.inputError]}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={[
                  styles.pickerButtonText,
                  !formData.vehicleCategory && styles.placeholder
                ]}>
                  {formData.vehicleCategory
                    ? VEHICLE_CATEGORIES.find(c => c.id === formData.vehicleCategory)?.name
                    : 'Select Vehicle Category'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.text} />
              </TouchableOpacity>
              {errors.vehicleCategory && (
                <Text style={styles.errorText}>{errors.vehicleCategory}</Text>
              )}

              <TouchableOpacity
                style={[styles.pickerButton, errors.subCategory && styles.inputError]}
                onPress={() => formData.vehicleCategory && setSubCategoryModalVisible(true)}
              >
                <Text style={[
                  styles.pickerButtonText,
                  !formData.subCategory && styles.placeholder
                ]}>
                  {formData.subCategory || 'Select Sub-Category'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.text} />
              </TouchableOpacity>
              {errors.subCategory && (
                <Text style={styles.errorText}>{errors.subCategory}</Text>
              )}

              <TouchableOpacity
                style={[styles.pickerButton, errors.make && styles.inputError]}
                onPress={() => setMakeModalVisible(true)}
              >
                <Text style={[
                  styles.pickerButtonText,
                  !formData.make && styles.placeholder
                ]}>
                  {formData.make || 'Select Vehicle Make'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.text} />
              </TouchableOpacity>
              {errors.make && (
                <Text style={styles.errorText}>{errors.make}</Text>
              )}

              <TouchableOpacity
                style={[styles.pickerButton, errors.model && styles.inputError]}
                onPress={() => formData.make && setModelModalVisible(true)}
              >
                <Text style={[
                  styles.pickerButtonText,
                  !formData.model && styles.placeholder
                ]}>
                  {formData.model || 'Select Vehicle Model'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.text} />
              </TouchableOpacity>
              {errors.model && (
                <Text style={styles.errorText}>{errors.model}</Text>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Registration Number</Text>
                <TextInput
                  style={[styles.input, errors.registrationNumber && styles.inputError]}
                  value={formData.registrationNumber}
                  onChangeText={(value) => updateField('registrationNumber', value.toUpperCase())}
                  placeholder="e.g., KAA 123Z"
                  autoCapitalize="characters"
                  placeholderTextColor={Colors.placeholder}
                />
                {errors.registrationNumber && (
                  <Text style={styles.errorText}>{errors.registrationNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tonnage (in tons)</Text>
                <TextInput
                  style={[styles.input, errors.tonnage && styles.inputError]}
                  value={formData.tonnage}
                  onChangeText={(value) => updateField('tonnage', value)}
                  placeholder="Enter vehicle tonnage"
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.placeholder}
                />
                {errors.tonnage && (
                  <Text style={styles.errorText}>{errors.tonnage}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Value (KSh)</Text>
                <TextInput
                  style={[styles.input, errors.vehicleValue && styles.inputError]}
                  value={formData.vehicleValue}
                  onChangeText={(value) => updateField('vehicleValue', value)}
                  placeholder="Enter vehicle value"
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.placeholder}
                />
                {errors.vehicleValue && (
                  <Text style={styles.errorText}>{errors.vehicleValue}</Text>
                )}
              </View>
            </View>

            {/* Operating Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Operating Details</Text>
              
              <View style={styles.radioGroup}>
                <Text style={styles.label}>Operating Radius</Text>
                {['local', 'national', 'regional', 'international'].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={styles.radioButton}
                    onPress={() => updateField('operatingRadius', radius)}
                  >
                    <View style={[
                      styles.radio,
                      formData.operatingRadius === radius && styles.radioSelected
                    ]}>
                      {formData.operatingRadius === radius && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>
                      {radius.charAt(0).toUpperCase() + radius.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
                {errors.operatingRadius && (
                  <Text style={styles.errorText}>{errors.operatingRadius}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Driver Experience (years)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.driverExperience}
                  onChangeText={(value) => updateField('driverExperience', value)}
                  placeholder="Enter years of experience"
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.placeholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Claims History</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.claimsHistory}
                  onChangeText={(value) => updateField('claimsHistory', value)}
                  placeholder="Enter details of any claims in the last 3 years"
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
            </View>

            {/* Coverage Selection Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Coverage Selection</Text>
              
              <TouchableOpacity
                style={[styles.pickerButton, errors.coverageType && styles.inputError]}
                onPress={() => setCoverageModalVisible(true)}
              >
                <Text style={[
                  styles.pickerButtonText,
                  !formData.coverageType && styles.placeholder
                ]}>
                  {formData.coverageType
                    ? COVERAGE_OPTIONS.find(c => c.id === formData.coverageType)?.name
                    : 'Select Coverage Type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.text} />
              </TouchableOpacity>
              {errors.coverageType && (
                <Text style={styles.errorText}>{errors.coverageType}</Text>
              )}

              <View style={styles.addonsContainer}>
                <Text style={styles.label}>Additional Coverage Options</Text>
                {ADDONS.map((addon) => (
                  <TouchableOpacity
                    key={addon.id}
                    style={styles.addonItem}
                    onPress={() => toggleAddon(addon.id)}
                  >
                    <View style={styles.addonHeader}>
                      <View style={styles.checkboxContainer}>
                        <View style={[
                          styles.checkbox,
                          formData.selectedAddons.includes(addon.id) && styles.checkboxSelected
                        ]}>
                          {formData.selectedAddons.includes(addon.id) && (
                            <Ionicons name="checkmark" size={16} color={Colors.white} />
                          )}
                        </View>
                        <Text style={styles.addonName}>{addon.name}</Text>
                      </View>
                      <Text style={styles.addonRate}>+{addon.rate}%</Text>
                    </View>
                    <Text style={styles.addonDescription}>{addon.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.securityFeaturesContainer}>
                <Text style={styles.label}>Security Features</Text>
                {[
                  { id: 'hasTracking', label: 'Tracking Device', discount: '0.5%' },
                  { id: 'hasDashcam', label: 'Dashcam', discount: '0.25%' },
                  { id: 'hasAntiTheft', label: 'Anti-Theft System', discount: '0.25%' }
                ].map((feature) => (
                  <TouchableOpacity
                    key={feature.id}
                    style={styles.securityFeatureItem}
                    onPress={() => updateField(feature.id, !formData[feature.id])}
                  >
                    <View style={styles.checkboxContainer}>
                      <View style={[
                        styles.checkbox,
                        formData[feature.id] && styles.checkboxSelected
                      ]}>
                        {formData[feature.id] && (
                          <Ionicons name="checkmark" size={16} color={Colors.white} />
                        )}
                      </View>
                      <Text style={styles.featureLabel}>{feature.label}</Text>
                    </View>
                    <Text style={styles.discountLabel}>-{feature.discount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Premium Display */}
            {premium > 0 && (
              <View style={styles.premiumContainer}>
                <Text style={styles.premiumLabel}>Estimated Premium:</Text>
                <Text style={styles.premiumAmount}>
                  KSh {premium.toLocaleString()}
                </Text>
                <Text style={styles.premiumNote}>
                  *Final premium may vary based on underwriting
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <Button
              label={isSubmitting ? 'Processing...' : 'Get Quote'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.summaryContainer}>
            <View style={styles.quotationHeader}>
              <Text style={styles.quotationId}>Quotation #{quotationId}</Text>
              <Text style={styles.quotationDate}>
                {new Date().toLocaleDateString('en-KE')}
              </Text>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Business Details</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Business Name:</Text>
                <Text style={styles.summaryValue}>{formData.businessName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Contact Person:</Text>
                <Text style={styles.summaryValue}>{formData.contactPerson}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phone:</Text>
                <Text style={styles.summaryValue}>{formData.phoneNumber}</Text>
              </View>
              {formData.emailAddress && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Email:</Text>
                  <Text style={styles.summaryValue}>{formData.emailAddress}</Text>
                </View>
              )}
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Vehicle Details</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Category:</Text>
                <Text style={styles.summaryValue}>
                  {VEHICLE_CATEGORIES.find(c => c.id === formData.vehicleCategory)?.name}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sub-Category:</Text>
                <Text style={styles.summaryValue}>{formData.subCategory}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Make & Model:</Text>
                <Text style={styles.summaryValue}>{formData.make} {formData.model}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Registration:</Text>
                <Text style={styles.summaryValue}>{formData.registrationNumber}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tonnage:</Text>
                <Text style={styles.summaryValue}>{formData.tonnage} tons</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Value:</Text>
                <Text style={styles.summaryValue}>KSh {parseFloat(formData.vehicleValue).toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Coverage Details</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coverage Type:</Text>
                <Text style={styles.summaryValue}>
                  {COVERAGE_OPTIONS.find(c => c.id === formData.coverageType)?.name}
                </Text>
              </View>
              {formData.selectedAddons.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Add-ons:</Text>
                  <View style={styles.summaryValueColumn}>
                    {formData.selectedAddons.map(addonId => (
                      <Text key={addonId} style={styles.summaryValue}>
                        • {ADDONS.find(a => a.id === addonId)?.name}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Security Features:</Text>
                <View style={styles.summaryValueColumn}>
                  {formData.hasTracking && (
                    <Text style={styles.summaryValue}>• Tracking Device</Text>
                  )}
                  {formData.hasDashcam && (
                    <Text style={styles.summaryValue}>• Dashcam</Text>
                  )}
                  {formData.hasAntiTheft && (
                    <Text style={styles.summaryValue}>• Anti-Theft System</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.premiumSummaryContainer}>
              <Text style={styles.premiumSummaryLabel}>Total Premium:</Text>
              <Text style={styles.premiumSummaryAmount}>
                KSh {premium.toLocaleString()}
              </Text>
              <Text style={styles.premiumSummaryNote}>
                Valid for 14 days from {new Date().toLocaleDateString('en-KE')}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <Button
                label="Edit Quote"
                onPress={() => setCurrentStep(1)}
                variant="secondary"
                style={styles.editButton}
              />
              <Button
                label="Proceed"
                onPress={handleConfirm}
                style={styles.proceedButton}
              />
            </View>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Quote Generated Successfully!</Text>
            <Text style={styles.successQuotationId}>Quotation #{quotationId}</Text>
            <Text style={styles.successMessage}>
              Your commercial comprehensive insurance quote has been generated. Our team will
              contact you shortly to complete the process.
            </Text>
            <View style={styles.successActions}>
              <Button
                label="View Quote Details"
                onPress={() => setCurrentStep(2)}
                variant="secondary"
                style={styles.viewDetailsButton}
              />
              <Button
                label="Back to Categories"
                onPress={() => navigation.navigate('MotorCategorySelection')}
                style={styles.backToCategoriesButton}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Render Modals */}
      {renderCategoryModal()}
      {renderSubCategoryModal()}
      {renderMakeModal()}
      {renderModelModal()}
      {renderCoverageModal()}
      {renderClaimsModal()}
      {renderPaymentPlanModal()}
    </KeyboardAvoidingView>
  );
}

// Vehicle makes data
const VEHICLE_MAKES = [
  {
    id: 'isuzu',
    name: 'Isuzu',
    models: ['FRR', 'FSR', 'FTR', 'FVR', 'FVZ', 'EXZ', 'Giga', 'NPR', 'NQR']
  },
  {
    id: 'mitsubishi',
    name: 'Mitsubishi',
    models: ['Fuso', 'Fighter', 'Canter', 'FV51', 'FP54']
  },
  {
    id: 'scania',
    name: 'Scania',
    models: ['P-Series', 'G-Series', 'R-Series', 'S-Series']
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    models: ['Actros', 'Arocs', 'Atego', 'Axor']
  },
  {
    id: 'volvo',
    name: 'Volvo',
    models: ['FH', 'FM', 'FMX', 'FL', 'FE']
  }
];

// Payment plan options
const PAYMENT_PLANS = [
  {
    id: 'full',
    name: 'Full Payment',
    description: 'Pay entire premium upfront',
    discount: '5% discount on total premium'
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    description: 'Pay in 4 installments',
    surcharge: '2% surcharge per installment'
  },
  {
    id: 'monthly',
    name: 'Monthly',
    description: 'Pay in 12 installments',
    surcharge: '3% surcharge per installment'
  }
];

// Modal implementations
const renderCategoryModal = () => (
  <Modal
    visible={categoryModalVisible}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setCategoryModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Vehicle Category</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setCategoryModalVisible(false)}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={VEHICLE_CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                updateField('vehicleCategory', item.id);
                updateField('subCategory', ''); // Reset sub-category
                setCategoryModalVisible(false);
              }}
            >
              <View>
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemDescription}>{item.description}</Text>
              </View>
              {formData.vehicleCategory === item.id && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
        />
      </View>
    </View>
  </Modal>
);

const renderSubCategoryModal = () => {
  const category = VEHICLE_CATEGORIES.find(c => c.id === formData.vehicleCategory);
  if (!category) return null;

  return (
    <Modal
      visible={subCategoryModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSubCategoryModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Sub-Category</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSubCategoryModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={category.subCategories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('subCategory', item);
                  setSubCategoryModalVisible(false);
                }}
              >
                <Text style={styles.modalItemTitle}>{item}</Text>
                {formData.subCategory === item && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
          />
        </View>
      </View>
    </Modal>
  );
};

const renderMakeModal = () => (
  <Modal
    visible={makeModalVisible}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setMakeModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Vehicle Make</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setMakeModalVisible(false)}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        {isLoadingMakes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading vehicle makes...</Text>
          </View>
        ) : (
          <FlatList
            data={VEHICLE_MAKES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('make', item.id);
                  updateField('model', ''); // Reset model when make changes
                  setMakeModalVisible(false);
                }}
              >
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                {formData.make === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
          />
        )}
      </View>
    </View>
  </Modal>
);

const renderModelModal = () => {
  const selectedMake = VEHICLE_MAKES.find(make => make.id === formData.make);
  if (!selectedMake) return null;

  return (
    <Modal
      visible={modelModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModelModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {selectedMake.name} Model</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModelModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {isLoadingModels ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading vehicle models...</Text>
            </View>
          ) : (
            <FlatList
              data={selectedMake.models}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('model', item);
                    setModelModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemTitle}>{item}</Text>
                  {formData.model === item && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const renderCoverageModal = () => (
  <Modal
    visible={coverageModalVisible}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setCoverageModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Coverage Type</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setCoverageModalVisible(false)}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={COVERAGE_OPTIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.coverageModalItem}
              onPress={() => {
                updateField('coverageType', item.id);
                setCoverageModalVisible(false);
              }}
            >
              <View style={styles.coverageModalHeader}>
                <Text style={styles.coverageModalTitle}>{item.name}</Text>
                <Text style={styles.coverageModalRate}>Rate: {item.rate}%</Text>
              </View>
              <Text style={styles.coverageModalDescription}>{item.description}</Text>
              <View style={styles.coverageModalFeatures}>
                {item.features.map((feature, index) => (
                  <View key={index} style={styles.coverageModalFeatureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    <Text style={styles.coverageModalFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              {formData.coverageType === item.id && (
                <View style={styles.coverageModalSelected}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
        />
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    padding: Spacing.large,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.small,
    color: Colors.text,
    fontSize: Typography.fontSizes.small,
  },
  claimsButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.medium,
  },
  claimsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimsButtonText: {
    flex: 1,
    marginHorizontal: Spacing.medium,
  },
  claimsButtonTitle: {
    fontSize: Typography.fontSizes.small,
    fontWeight: 'bold',
    color: Colors.text,
  },
  claimsButtonSubtitle: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.textLight,
    marginTop: 2,
  },
  documentsList: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.medium,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.small,
  },
  documentInfo: {
    flex: 1,
    marginRight: Spacing.medium,
  },
  documentLabel: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
    marginBottom: 2,
  },
  requiredStar: {
    color: Colors.error,
    marginLeft: 4,
  },
  documentUploaded: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.success,
  },
  documentPending: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.textLight,
  },
  uploadButton: {
    minWidth: 80,
  },
  paymentPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedPlan: {
    flex: 1,
  },
  selectedPlanTitle: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
    fontWeight: 'bold',
  },
  selectedPlanDetails: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.textLight,
    marginTop: 2,
  },
  declarationBox: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.medium,
  },
  declarationText: {
    flex: 1,
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
    marginLeft: Spacing.small,
  },
  modalFooter: {
    padding: Spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalFooterButton: {
    marginTop: Spacing.small,
  },
  modalScrollContent: {
    padding: Spacing.medium,
  },
  claimsForm: {
    paddingBottom: Spacing.large,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.medium,
  },
  addClaimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.medium,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: Spacing.medium,
  },
  addClaimButtonText: {
    marginLeft: Spacing.small,
    color: Colors.primary,
    fontSize: Typography.fontSizes.small,
  },
  claimDetailCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  claimDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.medium,
  },
  claimDetailTitle: {
    fontSize: Typography.fontSizes.small,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.small,
  },
  dateButtonText: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
  },
  paymentPlanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.medium,
  },
  paymentPlanContent: {
    flex: 1,
    marginRight: Spacing.medium,
  },
  paymentPlanTitle: {
    fontSize: Typography.fontSizes.small,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  paymentPlanDescription: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.textLight,
    marginBottom: 4,
  },
  paymentPlanDiscount: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.success,
  },
  paymentPlanSurcharge: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.warning,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.fontSizes.large,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: Spacing.medium,
  },
  section: {
    marginBottom: Spacing.large,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.medium,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  inputGroup: {
    marginBottom: Spacing.medium,
  },
  label: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
    marginBottom: Spacing.xsmall,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.small,
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSizes.xsmall,
    marginTop: Spacing.xsmall,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.small,
    marginBottom: Spacing.medium,
  },
  pickerButtonText: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.placeholder,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.medium,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalCloseButton: {
    padding: Spacing.small,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.medium,
  },
  modalItemTitle: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
    marginBottom: Spacing.xsmall,
  },
  modalItemDescription: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.textLight,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  coverageModalItem: {
    padding: Spacing.medium,
  },
  coverageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.small,
  },
  coverageModalTitle: {
    fontSize: Typography.fontSizes.medium,
    fontWeight: 'bold',
    color: Colors.text,
  },
  coverageModalRate: {
    fontSize: Typography.fontSizes.small,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  coverageModalDescription: {
    fontSize: Typography.fontSizes.small,
    color: Colors.textLight,
    marginBottom: Spacing.small,
  },
  coverageModalFeatures: {
    marginTop: Spacing.small,
  },
  coverageModalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xsmall,
  },
  coverageModalFeatureText: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
    marginLeft: Spacing.small,
  },
  coverageModalSelected: {
    position: 'absolute',
    top: Spacing.medium,
    right: Spacing.medium,
  },
  addonsContainer: {
    marginTop: Spacing.medium,
  },
  addonItem: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.medium,
    marginBottom: Spacing.small,
  },
  addonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xsmall,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.small,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  addonName: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
    fontWeight: 'bold',
  },
  addonRate: {
    fontSize: Typography.fontSizes.small,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  addonDescription: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.textLight,
  },
  securityFeaturesContainer: {
    marginTop: Spacing.medium,
  },
  securityFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.small,
  },
  featureLabel: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
    marginLeft: Spacing.small,
  },
  discountLabel: {
    fontSize: Typography.fontSizes.small,
    color: Colors.success,
    fontWeight: 'bold',
  },
  premiumContainer: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.medium,
    marginTop: Spacing.large,
    marginBottom: Spacing.medium,
  },
  premiumLabel: {
    fontSize: Typography.fontSizes.small,
    color: Colors.white,
    marginBottom: Spacing.xsmall,
  },
  premiumAmount: {
    fontSize: Typography.fontSizes.xlarge,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.xsmall,
  },
  premiumNote: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.white,
    opacity: 0.8,
  },
  submitButton: {
    marginTop: Spacing.medium,
  },
  summaryContainer: {
    padding: Spacing.medium,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.large,
  },
  quotationId: {
    fontSize: Typography.fontSizes.medium,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  quotationDate: {
    fontSize: Typography.fontSizes.small,
    color: Colors.textLight,
  },
  summarySection: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
  },
  summarySectionTitle: {
    fontSize: Typography.fontSizes.medium,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.small,
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.small,
    color: Colors.textLight,
    flex: 1,
  },
  summaryValue: {
    fontSize: Typography.fontSizes.small,
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },
  summaryValueColumn: {
    flex: 2,
    alignItems: 'flex-end',
  },
  premiumSummaryContainer: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.medium,
    marginVertical: Spacing.medium,
  },
  premiumSummaryLabel: {
    fontSize: Typography.fontSizes.small,
    color: Colors.white,
    marginBottom: Spacing.xsmall,
  },
  premiumSummaryAmount: {
    fontSize: Typography.fontSizes.xlarge,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.xsmall,
  },
  premiumSummaryNote: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.white,
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.medium,
  },
  editButton: {
    flex: 1,
    marginRight: Spacing.small,
  },
  proceedButton: {
    flex: 1,
    marginLeft: Spacing.small,
  },
  successContainer: {
    padding: Spacing.medium,
    alignItems: 'center',
  },
  successIcon: {
    marginVertical: Spacing.xlarge,
  },
  successTitle: {
    fontSize: Typography.fontSizes.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  successQuotationId: {
    fontSize: Typography.fontSizes.medium,
    color: Colors.primary,
    marginBottom: Spacing.medium,
  },
  successMessage: {
    fontSize: Typography.fontSizes.small,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xlarge,
  },
  successActions: {
    width: '100%',
  },
  viewDetailsButton: {
    marginBottom: Spacing.medium,
  },
  backToCategoriesButton: {
    backgroundColor: Colors.success,
  },
});
