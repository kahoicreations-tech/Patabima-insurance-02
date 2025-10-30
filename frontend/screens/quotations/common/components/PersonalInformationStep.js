/**
 * PersonalInformationStep - Common component for collecting client personal information
 * Used across different insurance product flows
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../constants';

const PersonalInformationStep = ({
  formData,
  onUpdateFormData,
  validationErrors = {},
  showHeader = true,
  requiredFields = ['fullName', 'phoneNumber', 'email', 'idNumber', 'kraPin'],
  optionalFields = [],
}) => {
  // Check if a field is required
  const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);
  
  // Check if a field is optional
  const isFieldOptional = (fieldName) => optionalFields.includes(fieldName);

  // Handle form updates
  const handleInputChange = (field, value) => {
    onUpdateFormData({ [field]: value });
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Personal Information</Text>
          <Text style={styles.stepSubtitle}>Enter your personal details</Text>
        </>
      )}

      {/* Full Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Full Name {isFieldRequired('fullName') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.fullName && styles.inputError
          ]}
          value={formData.fullName}
          onChangeText={(text) => handleInputChange('fullName', text)}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.textSecondary}
        />
        {validationErrors.fullName && (
          <Text style={styles.errorText}>{validationErrors.fullName}</Text>
        )}
      </View>

      {/* Phone Number */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Phone Number {isFieldRequired('phoneNumber') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.phoneNumber && styles.inputError
          ]}
          value={formData.phoneNumber}
          onChangeText={(text) => handleInputChange('phoneNumber', text)}
          placeholder="e.g., 0700123456"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
        />
        {validationErrors.phoneNumber && (
          <Text style={styles.errorText}>{validationErrors.phoneNumber}</Text>
        )}
      </View>

      {/* Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Email {isFieldRequired('email') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.email && styles.inputError
          ]}
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          placeholder="e.g., example@email.com"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {validationErrors.email && (
          <Text style={styles.errorText}>{validationErrors.email}</Text>
        )}
      </View>

      {/* ID Number */}
      {(isFieldRequired('idNumber') || isFieldOptional('idNumber')) && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            ID Number {isFieldRequired('idNumber') && '*'}
          </Text>
          <TextInput
            style={[
              styles.input,
              validationErrors.idNumber && styles.inputError
            ]}
            value={formData.idNumber}
            onChangeText={(text) => handleInputChange('idNumber', text)}
            placeholder="Enter your national ID number"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
          />
          {validationErrors.idNumber && (
            <Text style={styles.errorText}>{validationErrors.idNumber}</Text>
          )}
        </View>
      )}

      {/* KRA PIN */}
      {(isFieldRequired('kraPin') || isFieldOptional('kraPin')) && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            KRA PIN {isFieldRequired('kraPin') && '*'}
          </Text>
          <TextInput
            style={[
              styles.input,
              validationErrors.kraPin && styles.inputError
            ]}
            value={formData.kraPin}
            onChangeText={(text) => handleInputChange('kraPin', text.toUpperCase())}
            placeholder="Enter your KRA PIN"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="characters"
          />
          {validationErrors.kraPin && (
            <Text style={styles.errorText}>{validationErrors.kraPin}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    ...Typography.body,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});

export default PersonalInformationStep;