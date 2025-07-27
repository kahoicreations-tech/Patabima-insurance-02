/**
 * TukTukVehicleValueStep - Vehicle valuation for TukTuk insurance
 * Handles market value assessment and coverage options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors, Typography, Spacing } from '../../../../../constants';

const TukTukVehicleValueStep = ({
  formData,
  onUpdateFormData,
  errors = {},
  showHeader = true,
  onCalculatePremium,
  calculatedPremium,
  isCalculating = false,
}) => {
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  const valuationMethods = [
    { value: 'market', label: 'Current Market Value' },
    { value: 'agreed', label: 'Agreed Value' },
    { value: 'replacement', label: 'Replacement Cost' }
  ];

  const coverageOptions = [
    { value: 'basic', label: 'Basic Third Party', description: 'Mandatory legal coverage' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'Full coverage including own damage' },
    { value: 'passenger', label: 'Passenger Coverage', description: 'Enhanced passenger protection' }
  ];

  const handleCalculatePremium = () => {
    if (!formData.vehicleValue || !formData.coverageType) {
      Alert.alert('Missing Information', 'Please enter vehicle value and select coverage type to calculate premium.');
      return;
    }

    const calculationData = {
      vehicleValue: parseFloat(formData.vehicleValue),
      coverageType: formData.coverageType,
      valuationMethod: formData.valuationMethod,
      passengerCount: formData.passengerCount || 3,
      usage: formData.vehicleUsage || 'passenger',
      vehicleAge: new Date().getFullYear() - parseInt(formData.vehicleYear || '2020'),
      location: formData.operatingArea || 'urban'
    };

    onCalculatePremium && onCalculatePremium(calculationData);
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Vehicle Valuation & Coverage</Text>
          <Text style={styles.subtitle}>
            Determine your TukTuk's value and select appropriate coverage
          </Text>
        </View>
      )}

      <View style={styles.formSection}>
        {/* Valuation Method */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Valuation Method <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.pickerContainer, errors.valuationMethod && styles.inputError]}>
            <Picker
              selectedValue={formData.valuationMethod || ''}
              onValueChange={(value) => updateFormData({ valuationMethod: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select Valuation Method" value="" />
              {valuationMethods.map((method) => (
                <Picker.Item key={method.value} label={method.label} value={method.value} />
              ))}
            </Picker>
          </View>
          {errors.valuationMethod && (
            <Text style={styles.errorText}>{errors.valuationMethod}</Text>
          )}
        </View>

        {/* Vehicle Value */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Vehicle Value (KES) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.vehicleValue && styles.inputError]}
            value={formData.vehicleValue || ''}
            onChangeText={(text) => updateFormData({ vehicleValue: text })}
            placeholder="e.g., 350000"
            keyboardType="numeric"
          />
          {errors.vehicleValue && (
            <Text style={styles.errorText}>{errors.vehicleValue}</Text>
          )}
          <Text style={styles.helpText}>
            Typical TukTuk values range from KES 200,000 to KES 800,000
          </Text>
        </View>

        {/* Coverage Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Coverage Type <Text style={styles.required}>*</Text>
          </Text>
          {coverageOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                formData.coverageType === option.value && styles.selectedOption
              ]}
              onPress={() => updateFormData({ coverageType: option.value })}
            >
              <View style={styles.optionHeader}>
                <Text style={[
                  styles.optionTitle,
                  formData.coverageType === option.value && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
                <View style={[
                  styles.radioButton,
                  formData.coverageType === option.value && styles.radioSelected
                ]} />
              </View>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
          {errors.coverageType && (
            <Text style={styles.errorText}>{errors.coverageType}</Text>
          )}
        </View>

        {/* Operating Area */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Primary Operating Area <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.pickerContainer, errors.operatingArea && styles.inputError]}>
            <Picker
              selectedValue={formData.operatingArea || ''}
              onValueChange={(value) => updateFormData({ operatingArea: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select Operating Area" value="" />
              <Picker.Item label="Urban/City Center" value="urban" />
              <Picker.Item label="Suburban" value="suburban" />
              <Picker.Item label="Rural/County" value="rural" />
              <Picker.Item label="Mixed Areas" value="mixed" />
            </Picker>
          </View>
          {errors.operatingArea && (
            <Text style={styles.errorText}>{errors.operatingArea}</Text>
          )}
        </View>

        {/* Maximum Passenger Count */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Maximum Passengers (excluding driver)
          </Text>
          <TextInput
            style={styles.input}
            value={formData.passengerCount || ''}
            onChangeText={(text) => updateFormData({ passengerCount: text })}
            placeholder="e.g., 2"
            keyboardType="numeric"
            maxLength={1}
          />
          <Text style={styles.helpText}>
            Standard TukTuk carries 2-3 passengers
          </Text>
        </View>

        {/* Calculate Premium Button */}
        <TouchableOpacity
          style={[styles.calculateButton, isCalculating && styles.calculatingButton]}
          onPress={handleCalculatePremium}
          disabled={isCalculating}
        >
          <Text style={styles.calculateButtonText}>
            {isCalculating ? 'Calculating...' : 'Calculate Premium'}
          </Text>
        </TouchableOpacity>

        {/* Premium Display */}
        {calculatedPremium && (
          <View style={styles.premiumCard}>
            <Text style={styles.premiumTitle}>Estimated Premium</Text>
            <Text style={styles.premiumAmount}>
              KES {calculatedPremium.annual?.toLocaleString()}
            </Text>
            <Text style={styles.premiumPeriod}>per year</Text>
            
            {calculatedPremium.breakdown && (
              <View style={styles.breakdown}>
                <Text style={styles.breakdownTitle}>Premium Breakdown:</Text>
                <Text style={styles.breakdownItem}>
                  Base Premium: KES {calculatedPremium.breakdown.base?.toLocaleString()}
                </Text>
                <Text style={styles.breakdownItem}>
                  Passenger Coverage: KES {calculatedPremium.breakdown.passenger?.toLocaleString()}
                </Text>
                <Text style={styles.breakdownItem}>
                  Area Risk: KES {calculatedPremium.breakdown.area?.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  picker: {
    height: 50,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    fontStyle: 'italic',
  },
  optionCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.medium,
    backgroundColor: Colors.white,
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
  },
  selectedOptionText: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: Typography.regular,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  calculateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculatingButton: {
    opacity: 0.7,
  },
  calculateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.semiBold,
  },
  premiumCard: {
    backgroundColor: Colors.successLight,
    padding: Spacing.large,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
    marginBottom: Spacing.small,
  },
  premiumAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.success,
    fontFamily: Typography.bold,
  },
  premiumPeriod: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    marginBottom: Spacing.medium,
  },
  breakdown: {
    gap: Spacing.small,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
    marginBottom: Spacing.small,
  },
  breakdownItem: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Typography.regular,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontFamily: Typography.regular,
  },
});

export default TukTukVehicleValueStep;
