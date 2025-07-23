/**
 * VehicleDetailsStep - Reusable component for collecting vehicle details
 * Includes policy validation and insurance start date selection
 * Used across all private motor insurance quotation flows
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing } from '../../../../../constants';

const VehicleDetailsStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  requiredFields = ['vehicleMake', 'vehicleModel', 'vehicleYear', 'registrationNumber'],
  enablePolicyValidation = true,
  enableInsuranceDate = true,
  onRegistrationChange = null,
  policyValidation = {
    isChecking: false,
    hasExistingPolicy: false,
    existingPolicyDetails: null,
    validationMessage: '',
    suggestedStartDate: null
  }
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);

  // Handle registration number change with policy validation
  const handleRegistrationChange = (text) => {
    const registrationNumber = text.toUpperCase();
    updateFormData({ registrationNumber });
    
    // Trigger policy validation if enabled and callback provided
    if (enablePolicyValidation && onRegistrationChange && registrationNumber.length >= 6) {
      onRegistrationChange(registrationNumber);
    }
  };

  // Handle insurance start date validation
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateFormData({ insuranceStartDate: selectedDate });
    }
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Vehicle Details</Text>
          <Text style={styles.stepSubtitle}>Information about your vehicle</Text>
        </>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Vehicle Make {isFieldRequired('vehicleMake') && '*'}
        </Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleMake}
          onChangeText={(text) => updateFormData({ vehicleMake: text })}
          placeholder="e.g., Toyota, Nissan"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Vehicle Model {isFieldRequired('vehicleModel') && '*'}
        </Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleModel}
          onChangeText={(text) => updateFormData({ vehicleModel: text })}
          placeholder="e.g., Corolla, X-Trail"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Year of Manufacture {isFieldRequired('vehicleYear') && '*'}
        </Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleYear}
          onChangeText={(text) => updateFormData({ vehicleYear: text })}
          placeholder="YYYY"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Registration Number {isFieldRequired('registrationNumber') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            enablePolicyValidation && policyValidation.hasExistingPolicy && styles.inputWarning
          ]}
          value={formData.registrationNumber}
          onChangeText={handleRegistrationChange}
          placeholder="KXX 000X"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
        />
        
        {/* Policy validation indicator */}
        {enablePolicyValidation && policyValidation.isChecking && (
          <View style={styles.validationIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.validationText}>Checking existing insurance...</Text>
          </View>
        )}
        
        {enablePolicyValidation && policyValidation.validationMessage && !policyValidation.isChecking && (
          <View style={[
            styles.validationResult,
            policyValidation.hasExistingPolicy ? styles.validationWarning : styles.validationSuccess
          ]}>
            <Ionicons 
              name={policyValidation.hasExistingPolicy ? "warning" : "checkmark-circle"} 
              size={16} 
              color={policyValidation.hasExistingPolicy ? Colors.warning : Colors.success} 
            />
            <Text style={[
              styles.validationText,
              policyValidation.hasExistingPolicy ? styles.warningText : styles.successText
            ]}>
              {policyValidation.validationMessage}
            </Text>
          </View>
        )}
        
        {/* Existing policy details */}
        {enablePolicyValidation && policyValidation.existingPolicyDetails && (
          <View style={styles.existingPolicyCard}>
            <Text style={styles.existingPolicyTitle}>Current Insurance Details</Text>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Insurer:</Text>
              <Text style={styles.policyDetailValue}>{policyValidation.existingPolicyDetails.insurerName}</Text>
            </View>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Policy Type:</Text>
              <Text style={styles.policyDetailValue}>{policyValidation.existingPolicyDetails.policyType}</Text>
            </View>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Expires:</Text>
              <Text style={styles.policyDetailValue}>
                {new Date(policyValidation.existingPolicyDetails.endDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Insurance Start Date Selection */}
      {enableInsuranceDate && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Insurance Start Date *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.insuranceStartDate?.toLocaleDateString() || 'Select date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={formData.insuranceStartDate || new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
          
          {/* Start date validation messages */}
          {enablePolicyValidation && policyValidation.hasExistingPolicy && policyValidation.suggestedStartDate && (
            <View style={styles.dateRecommendation}>
              <Ionicons name="information-circle" size={16} color={Colors.primary} />
              <Text style={styles.recommendationText}>
                Recommended start date: {policyValidation.suggestedStartDate.toLocaleDateString()}
              </Text>
              <TouchableOpacity
                style={styles.useSuggestedButton}
                onPress={() => updateFormData({ insuranceStartDate: policyValidation.suggestedStartDate })}
              >
                <Text style={styles.useSuggestedText}>Use This Date</Text>
              </TouchableOpacity>
            </View>
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
  inputWarning: {
    borderColor: Colors.warning,
    backgroundColor: '#FFF8E1',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  dateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  validationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  validationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: 6,
  },
  validationWarning: {
    backgroundColor: '#FFF8E1',
  },
  validationSuccess: {
    backgroundColor: '#E8F5E8',
  },
  validationText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
  },
  warningText: {
    color: Colors.warning,
  },
  successText: {
    color: Colors.success,
  },
  existingPolicyCard: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  existingPolicyTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_500Medium',
  },
  policyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  policyDetailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  policyDetailValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: 'Poppins_500Medium',
  },
  dateRecommendation: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    flex: 1,
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  useSuggestedButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  useSuggestedText: {
    color: 'white',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: 'Poppins_500Medium',
  },
});

export default VehicleDetailsStep;
