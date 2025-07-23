/**
 * PersonalInformationStep - Reusable component for collecting personal information
 * Used across all private motor insurance quotation flows
 * (TOR, Comprehensive, Third Party, Third Party Extendible, Motorcycle)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../../../../constants';

const PersonalInformationStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  requiredFields = ['fullName', 'idNumber', 'phoneNumber'],
  optionalFields = ['email', 'kraPin'],
  showValidation = true
}) => {
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Personal Information</Text>
          <Text style={styles.stepSubtitle}>Tell us about yourself</Text>
        </>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Full Name {isFieldRequired('fullName') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            showValidation && isFieldRequired('fullName') && !formData.fullName && styles.inputError
          ]}
          value={formData.fullName}
          onChangeText={(text) => updateFormData({ fullName: text })}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          ID Number {isFieldRequired('idNumber') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            showValidation && isFieldRequired('idNumber') && !formData.idNumber && styles.inputError
          ]}
          value={formData.idNumber}
          onChangeText={(text) => updateFormData({ idNumber: text })}
          placeholder="Enter ID/Passport number"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Phone Number {isFieldRequired('phoneNumber') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            showValidation && isFieldRequired('phoneNumber') && !formData.phoneNumber && styles.inputError
          ]}
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData({ phoneNumber: text })}
          placeholder="+254 7XX XXX XXX"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
        />
      </View>

      {(optionalFields.includes('email') || isFieldRequired('email')) && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Email Address {isFieldRequired('email') && '*'}
          </Text>
          <TextInput
            style={[
              styles.input,
              showValidation && isFieldRequired('email') && !formData.email && styles.inputError
            ]}
            value={formData.email}
            onChangeText={(text) => updateFormData({ email: text })}
            placeholder="Enter email address"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      )}

      {(optionalFields.includes('kraPin') || isFieldRequired('kraPin')) && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            KRA PIN {isFieldRequired('kraPin') && '*'}
          </Text>
          <TextInput
            style={[
              styles.input,
              showValidation && isFieldRequired('kraPin') && !formData.kraPin && styles.inputError
            ]}
            value={formData.kraPin}
            onChangeText={(text) => updateFormData({ kraPin: text.toUpperCase() })}
            placeholder="A000000000X"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="characters"
            maxLength={11}
          />
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
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_700Bold',
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: 'Poppins_400Regular',
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_500Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    fontFamily: 'Poppins_400Regular',
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
});

export default PersonalInformationStep;
