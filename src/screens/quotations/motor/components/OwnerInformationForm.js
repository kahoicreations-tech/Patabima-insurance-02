/**
 * OwnerInformationForm - Enhanced Reusable Personal Information Form Component
 * 
 * Handles collection and validation of personal information for motor insurance quotations.
 * This component can be reused across all motor insurance types (TOR, Comprehensive, Third Party, etc.)
 * 
 * Features:
 * - Real-time input validation with business logic
 * - Visual feedback for invalid fields
 * - Auto-formatting for specific fields (KRA PIN, phone numbers)
 * - Support for optional fields
 * - Document verification integration readiness
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../constants';

const OwnerInformationForm = ({
  formData = {},
  onUpdateFormData,
  validationErrors = {},
  showValidation = true,
  showHeader = true,
  requiredFields = ['fullName', 'idNumber', 'phoneNumber'],
  optionalFields = ['email', 'kraPin'],
  title = "Personal Information",
  subtitle = "Tell us about yourself",
  // For backward compatibility with existing usage
  ownerName,
  ownerIdNumber,
  ownerPhone,
  ownerEmail,
  previousInsurer
}) => {
  // Handle backward compatibility - map old props to new structure
  const compatibilityData = {
    fullName: ownerName || formData.fullName || formData.ownerName || '',
    idNumber: ownerIdNumber || formData.idNumber || formData.ownerIdNumber || '',
    phoneNumber: ownerPhone || formData.phoneNumber || formData.ownerPhone || '',
    email: ownerEmail || formData.email || formData.ownerEmail || '',
    kraPin: formData.kraPin || '',
    previousInsurer: previousInsurer || formData.previousInsurer || '',
    ...formData
  };

  const [localData, setLocalData] = useState(compatibilityData);
  const [fieldValidation, setFieldValidation] = useState({});

  // Sync with parent form data
  useEffect(() => {
    setLocalData(prev => ({ ...prev, ...compatibilityData }));
  }, [formData, ownerName, ownerIdNumber, ownerPhone, ownerEmail, previousInsurer]);

  const updateField = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);

    // Real-time validation
    if (showValidation) {
      validateField(field, value);
    }

    // Notify parent component - support both new and old callback patterns
    if (onUpdateFormData) {
      if (typeof onUpdateFormData === 'function' && onUpdateFormData.length === 2) {
        // Old pattern: onUpdateFormData(field, value)
        onUpdateFormData(field, value);
      } else {
        // New pattern: onUpdateFormData({ field: value })
        onUpdateFormData({ [field]: value });
      }
    }
  };

  const validateField = (field, value) => {
    let isValid = true;
    let message = '';

    switch (field) {
      case 'fullName':
        if (!value || value.trim().length === 0) {
          isValid = false;
          message = "Full name is required";
        } else if (value.trim().length < 3) {
          isValid = false;
          message = "Name must be at least 3 characters";
        } else {
          const nameParts = value.trim().split(/\s+/);
          if (nameParts.length < 2) {
            isValid = false;
            message = "Please provide both first and last name";
          }
        }
        break;

      case 'idNumber':
        if (!value || value.trim().length === 0) {
          isValid = false;
          message = "ID number is required";
        } else {
          const idRegex = /^\d{8}$/;
          if (!idRegex.test(value.trim())) {
            isValid = false;
            message = "Please enter a valid 8-digit ID number";
          }
        }
        break;

      case 'phoneNumber':
        if (!value || value.trim().length === 0) {
          isValid = false;
          message = "Phone number is required";
        } else {
          const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
          if (!phoneRegex.test(value.trim())) {
            isValid = false;
            message = "Please enter a valid Kenya phone number";
          }
        }
        break;

      case 'email':
        if (value && value.trim().length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            isValid = false;
            message = "Please enter a valid email address";
          }
        }
        break;

      case 'kraPin':
        if (value && value.trim().length > 0) {
          const pinRegex = /^[A-Z]\d{9}[A-Z]$/;
          if (!pinRegex.test(value.trim())) {
            isValid = false;
            message = "Please enter a valid KRA PIN (format: A000000000X)";
          }
        }
        break;

      default:
        break;
    }

    setFieldValidation(prev => ({
      ...prev,
      [field]: { isValid, message }
    }));

    return { isValid, message };
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('254')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+254' + cleaned.substring(1);
    } else if (cleaned.length <= 9) {
      return cleaned;
    }
    
    return text;
  };

  const formatKraPin = (text) => {
    return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const getFieldIcon = (field) => {
    const icons = {
      fullName: 'person-outline',
      idNumber: 'card-outline',
      phoneNumber: 'call-outline',
      email: 'mail-outline',
      kraPin: 'document-text-outline',
      previousInsurer: 'business-outline'
    };
    return icons[field] || 'text-outline';
  };

  const getFieldLabel = (field) => {
    const labels = {
      fullName: 'Full Name',
      idNumber: 'ID Number',
      phoneNumber: 'Phone Number', 
      email: 'Email Address',
      kraPin: 'KRA PIN',
      previousInsurer: 'Previous Insurer'
    };
    return labels[field] || field;
  };

  const getFieldPlaceholder = (field) => {
    const placeholders = {
      fullName: 'Enter your full name',
      idNumber: 'Enter ID/Passport number',
      phoneNumber: '+254 7XX XXX XXX',
      email: 'Enter email address',
      kraPin: 'A000000000X',
      previousInsurer: 'e.g. Jubilee Insurance'
    };
    return placeholders[field] || '';
  };

  const isFieldRequired = (field) => {
    return requiredFields.includes(field);
  };

  const renderFormField = (field) => {
    const isRequired = isFieldRequired(field);
    const validation = fieldValidation[field] || {};
    const hasError = showValidation && !validation.isValid && validation.message;
    const externalError = validationErrors[field];

    return (
      <View key={field} style={styles.formGroup}>
        <View style={styles.labelContainer}>
          <Ionicons 
            name={getFieldIcon(field)} 
            size={16} 
            color={Colors.primary} 
            style={styles.labelIcon}
          />
          <Text style={styles.label}>
            {getFieldLabel(field)} {isRequired && <Text style={styles.required}>*</Text>}
          </Text>
        </View>

        <TextInput
          style={[
            styles.input,
            (hasError || externalError) && styles.inputError
          ]}
          value={localData[field] || ''}
          onChangeText={(text) => {
            let processedText = text;
            
            // Apply field-specific formatting
            if (field === 'phoneNumber') {
              processedText = formatPhoneNumber(text);
            } else if (field === 'kraPin') {
              processedText = formatKraPin(text);
            }
            
            updateField(field, processedText);
          }}
          placeholder={getFieldPlaceholder(field)}
          placeholderTextColor={Colors.textSecondary}
          keyboardType={
            field === 'idNumber' ? 'numeric' :
            field === 'phoneNumber' ? 'phone-pad' :
            field === 'email' ? 'email-address' : 'default'
          }
          autoCapitalize={
            field === 'email' ? 'none' :
            field === 'kraPin' ? 'characters' : 'words'
          }
          maxLength={field === 'kraPin' ? 11 : undefined}
          onBlur={() => {
            if (showValidation) {
              validateField(field, localData[field] || '');
            }
          }}
        />

        {/* Validation Error Display */}
        {(hasError || externalError) && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error} />
            <Text style={styles.errorText}>
              {externalError || validation.message}
            </Text>
          </View>
        )}

        {/* Success Indicator */}
        {showValidation && validation.isValid && localData[field] && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.successText}>Valid</Text>
          </View>
        )}
      </View>
    );
  };

  // All fields to render (required + optional + legacy)
  const allFields = [
    ...requiredFields,
    ...optionalFields.filter(field => !requiredFields.includes(field)),
    // Add legacy fields if they exist
    ...(localData.previousInsurer !== undefined ? ['previousInsurer'] : [])
  ].filter((field, index, arr) => arr.indexOf(field) === index); // Remove duplicates

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        {allFields.map(field => renderFormField(field))}
      </View>

      {/* Form completion indicator */}
      <View style={styles.progressIndicator}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {requiredFields.filter(field => localData[field] && localData[field].trim()).length} of {requiredFields.length} required fields completed
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(requiredFields.filter(field => localData[field] && localData[field].trim()).length / requiredFields.length) * 100}%` 
                }
              ]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  formContainer: {
    flex: 1,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  labelIcon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textPrimary,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: Colors.error,
    marginLeft: Spacing.xs,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  successText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: Colors.success,
    marginLeft: Spacing.xs,
  },
  progressIndicator: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});

export default OwnerInformationForm;

// Export validation utilities for use in parent components
export const validatePersonalInfo = {
  fullName: (name) => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: "Full name is required" };
    }
    if (name.trim().length < 3) {
      return { isValid: false, message: "Name must be at least 3 characters" };
    }
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return { isValid: false, message: "Please provide both first and last name" };
    }
    return { isValid: true };
  },
  
  idNumber: (id) => {
    if (!id || id.trim().length === 0) {
      return { isValid: false, message: "ID number is required" };
    }
    const idRegex = /^\d{8}$/;
    if (!idRegex.test(id.trim())) {
      return { isValid: false, message: "Please enter a valid 8-digit ID number" };
    }
    return { isValid: true };
  },
  
  phoneNumber: (phone) => {
    if (!phone || phone.trim().length === 0) {
      return { isValid: false, message: "Phone number is required" };
    }
    const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      return { isValid: false, message: "Please enter a valid Kenya phone number" };
    }
    return { isValid: true };
  },
  
  email: (email) => {
    if (!email || email.trim().length === 0) {
      return { isValid: true }; // Email is optional
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: "Please enter a valid email address" };
    }
    return { isValid: true };
  },
  
  kraPin: (pin) => {
    if (!pin || pin.trim().length === 0) {
      return { isValid: true }; // KRA PIN is optional
    }
    const pinRegex = /^[A-Z]\d{9}[A-Z]$/;
    if (!pinRegex.test(pin.trim())) {
      return { isValid: false, message: "Please enter a valid KRA PIN (format: A000000000X)" };
    }
    return { isValid: true };
  }
};
