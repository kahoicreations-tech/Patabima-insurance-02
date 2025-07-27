/**
 * Commercial Personal Information Step Component
 * Handles business owner/operator information for commercial vehicle insurance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const CommercialPersonalInformationStep = ({ 
  formData, 
  onUpdateFormData, 
  onNext,
  onBack,
  errors: externalErrors,
  setErrors: externalSetErrors
}) => {
  const [showDropdown, setShowDropdown] = useState('');
  const [internalErrors, setInternalErrors] = useState({});
  
  // Use external errors if provided, otherwise use internal state
  const errors = externalErrors || internalErrors;
  const setErrors = externalSetErrors || setInternalErrors;

  // Business types for commercial vehicles
  const BUSINESS_TYPES = [
    'Sole Proprietorship',
    'Partnership',
    'Limited Company',
    'Cooperative Society',
    'Government Entity',
    'NGO/Non-Profit',
    'Other'
  ];

  const updateField = (field, value) => {
    onUpdateFormData({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateStep = () => {
    const newErrors = {};
    
    // Business name validation
    if (!formData.businessName) {
      newErrors.businessName = 'Business name is required';
    }
    
    // Business type validation
    if (!formData.businessType) {
      newErrors.businessType = 'Business type is required';
    }
    
    // Contact person validation
    if (!formData.contactPersonName) {
      newErrors.contactPersonName = 'Contact person name is required';
    }
    
    // Phone validation
    if (!formData.contactPhone) {
      newErrors.contactPhone = 'Phone number is required';
    } else if (!/^(0|\+254|254)7\d{8}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Enter a valid Kenyan mobile number';
    }
    
    // Email validation (optional but must be valid if provided)
    if (formData.contactEmail && !/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Enter a valid email address';
    }
    
    // Business registration validation
    if (!formData.businessRegistrationNumber) {
      newErrors.businessRegistrationNumber = 'Business registration number is required';
    }
    
    // KRA PIN validation
    if (!formData.kraPin) {
      newErrors.kraPin = 'KRA PIN is required for commercial insurance';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleDropdown = (dropdownName) => {
    setShowDropdown(showDropdown === dropdownName ? '' : dropdownName);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Business Information</Text>
        <Text style={styles.stepDescription}>
          Provide your business details for commercial vehicle insurance.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="business" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Commercial Insurance Requirements</Text>
            <Text style={styles.infoText}>
              Commercial vehicle insurance requires valid business registration and KRA PIN.
            </Text>
          </View>
        </View>

        {/* Business Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={[styles.input, errors.businessName && styles.inputError]}
            value={formData.businessName || ''}
            onChangeText={(value) => updateField('businessName', value)}
            placeholder="Enter registered business name"
            autoCapitalize="words"
          />
          {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
        </View>

        {/* Business Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Business Type *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.businessType && styles.inputError]}
            onPress={() => toggleDropdown('businessType')}
          >
            <Text style={[styles.dropdownText, !formData.businessType && styles.placeholderText]}>
              {formData.businessType || 'Select business type'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray} />
          </TouchableOpacity>
          {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}
          
          {showDropdown === 'businessType' && (
            <View style={styles.dropdownOptions}>
              {BUSINESS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownOption}
                  onPress={() => {
                    updateField('businessType', type);
                    setShowDropdown('');
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Business Registration Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Business Registration Number *</Text>
          <TextInput
            style={[styles.input, errors.businessRegistrationNumber && styles.inputError]}
            value={formData.businessRegistrationNumber || ''}
            onChangeText={(value) => updateField('businessRegistrationNumber', value.toUpperCase())}
            placeholder="e.g., C.123456, PVT-123456"
            autoCapitalize="characters"
          />
          {errors.businessRegistrationNumber && <Text style={styles.errorText}>{errors.businessRegistrationNumber}</Text>}
        </View>

        {/* KRA PIN */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>KRA PIN *</Text>
          <TextInput
            style={[styles.input, errors.kraPin && styles.inputError]}
            value={formData.kraPin || ''}
            onChangeText={(value) => updateField('kraPin', value.toUpperCase())}
            placeholder="e.g., A001234567Z"
            autoCapitalize="characters"
          />
          {errors.kraPin && <Text style={styles.errorText}>{errors.kraPin}</Text>}
          <Text style={styles.helperText}>Required for commercial vehicle insurance</Text>
        </View>

        {/* Contact Person */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Person Name *</Text>
          <TextInput
            style={[styles.input, errors.contactPersonName && styles.inputError]}
            value={formData.contactPersonName || ''}
            onChangeText={(value) => updateField('contactPersonName', value)}
            placeholder="Enter contact person's full name"
            autoCapitalize="words"
          />
          {errors.contactPersonName && <Text style={styles.errorText}>{errors.contactPersonName}</Text>}
        </View>

        {/* Contact Phone */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.contactPhone && styles.inputError]}
            value={formData.contactPhone || ''}
            onChangeText={(value) => updateField('contactPhone', value)}
            placeholder="0712345678"
            keyboardType="phone-pad"
          />
          {errors.contactPhone && <Text style={styles.errorText}>{errors.contactPhone}</Text>}
        </View>

        {/* Contact Email */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Email Address</Text>
          <TextInput
            style={[styles.input, errors.contactEmail && styles.inputError]}
            value={formData.contactEmail || ''}
            onChangeText={(value) => updateField('contactEmail', value)}
            placeholder="business@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.contactEmail && <Text style={styles.errorText}>{errors.contactEmail}</Text>}
        </View>

        {/* Business Address */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Business Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.businessAddress || ''}
            onChangeText={(value) => updateField('businessAddress', value)}
            placeholder="Enter business physical address"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Business Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nature of Business</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.businessDescription || ''}
            onChangeText={(value) => updateField('businessDescription', value)}
            placeholder="Describe your business activities (e.g., goods transportation, construction, etc.)"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.gray} />
          <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.nextButton]} 
          onPress={() => {
            if (validateStep()) {
              onNext();
            }
          }}
        >
          <Text style={[styles.buttonText, styles.nextButtonText]}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    padding: Spacing.md,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.gray,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.gray,
    marginTop: Spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  dropdownText: {
    ...Typography.body,
    color: Colors.dark,
  },
  placeholderText: {
    color: Colors.gray,
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    backgroundColor: Colors.white,
    marginTop: Spacing.xs,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  dropdownOptionText: {
    ...Typography.body,
    color: Colors.dark,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    minWidth: 100,
  },
  backButton: {
    backgroundColor: Colors.lightGray,
    borderWidth: 1,
    borderColor: Colors.gray,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
    marginHorizontal: Spacing.xs,
  },
  backButtonText: {
    color: Colors.gray,
  },
  nextButtonText: {
    color: Colors.white,
  },
});

export default CommercialPersonalInformationStep;
