/**
 * TukTukPersonalInformationStep - Personal information collection for TukTuk insurance
 * Tailored for three-wheeler vehicle owners
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../../../../constants';

const TukTukPersonalInformationStep = ({
  formData,
  onUpdateFormData,
  errors = {},
  showHeader = true,
}) => {
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Personal Information</Text>
          <Text style={styles.subtitle}>
            Please provide your details for TukTuk insurance registration
          </Text>
        </View>
      )}

      <View style={styles.formSection}>
        {/* Driver/Owner Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Driver/Owner Full Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.ownerName && styles.inputError]}
            value={formData.ownerName || ''}
            onChangeText={(text) => updateFormData({ ownerName: text })}
            placeholder="Enter full name as per ID"
            autoCapitalize="words"
          />
          {errors.ownerName && (
            <Text style={styles.errorText}>{errors.ownerName}</Text>
          )}
        </View>

        {/* National ID/Passport */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            National ID/Passport Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.idNumber && styles.inputError]}
            value={formData.idNumber || ''}
            onChangeText={(text) => updateFormData({ idNumber: text })}
            placeholder="Enter ID or passport number"
            keyboardType="default"
          />
          {errors.idNumber && (
            <Text style={styles.errorText}>{errors.idNumber}</Text>
          )}
        </View>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Phone Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            value={formData.phoneNumber || ''}
            onChangeText={(text) => updateFormData({ phoneNumber: text })}
            placeholder="07xxxxxxxx"
            keyboardType="phone-pad"
            maxLength={10}
          />
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>

        {/* Email (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={formData.email || ''}
            onChangeText={(text) => updateFormData({ email: text })}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* TukTuk Driver License */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Driver's License Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.licenseNumber && styles.inputError]}
            value={formData.licenseNumber || ''}
            onChangeText={(text) => updateFormData({ licenseNumber: text })}
            placeholder="Enter valid driving license number"
          />
          {errors.licenseNumber && (
            <Text style={styles.errorText}>{errors.licenseNumber}</Text>
          )}
        </View>

        {/* Years of TukTuk Experience */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Years of TukTuk Driving Experience <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.drivingExperience && styles.inputError]}
            value={formData.drivingExperience || ''}
            onChangeText={(text) => updateFormData({ drivingExperience: text })}
            placeholder="Number of years"
            keyboardType="numeric"
            maxLength={2}
          />
          {errors.drivingExperience && (
            <Text style={styles.errorText}>{errors.drivingExperience}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.large,
  },
  header: {
    marginBottom: Spacing.large,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.bold,
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    lineHeight: 24,
  },
  formSection: {
    gap: Spacing.large,
  },
  inputGroup: {
    gap: Spacing.small,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
  },
  required: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    fontSize: 16,
    fontFamily: Typography.regular,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontFamily: Typography.regular,
  },
});

export default TukTukPersonalInformationStep;
