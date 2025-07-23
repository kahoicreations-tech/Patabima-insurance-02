/**
 * VehicleValueStep - Reusable component for setting vehicle value
 * Used across all private motor insurance quotation flows
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const VehicleValueStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  vehicleAge = 0,
  enableEstimation = false,
  customInfo = null
}) => {
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  // Format number with commas
  const formatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Handle vehicle value input
  const handleValueChange = (text) => {
    // Remove non-numeric characters except decimal point
    const cleanValue = text.replace(/[^0-9.]/g, '');
    updateFormData({ vehicleValue: cleanValue });
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Vehicle Value</Text>
          <Text style={styles.stepSubtitle}>Set the insured value for your vehicle</Text>
        </>
      )}

      {/* Vehicle Age Display */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Vehicle Age</Text>
            <Text style={styles.infoValue}>
              {vehicleAge > 0 ? `${vehicleAge} years old` : 'Enter manufacturing year first'}
            </Text>
          </View>
        </View>
      </View>

      {/* Vehicle Value Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Value (KSh) *</Text>
        <View style={styles.valueInputContainer}>
          <Text style={styles.currencyPrefix}>KSh</Text>
          <TextInput
            style={styles.valueInput}
            value={formData.vehicleValue}
            onChangeText={handleValueChange}
            placeholder="Enter vehicle value"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
        
        {/* Display formatted value */}
        {formData.vehicleValue && (
          <Text style={styles.formattedValue}>
            Formatted: KSh {formatNumber(formData.vehicleValue)}
          </Text>
        )}
      </View>

      {/* Vehicle Value Estimation (if enabled) */}
      {enableEstimation && formData.vehicleMake && formData.vehicleModel && formData.vehicleYear && (
        <View style={styles.estimationCard}>
          <View style={styles.estimationHeader}>
            <Ionicons name="calculator-outline" size={20} color={Colors.primary} />
            <Text style={styles.estimationTitle}>Estimated Market Value</Text>
          </View>
          <Text style={styles.estimationSubtext}>
            Based on {formData.vehicleYear} {formData.vehicleMake} {formData.vehicleModel}
          </Text>
          <View style={styles.estimationRange}>
            <Text style={styles.estimationRangeText}>
              Estimated Range: KSh 800,000 - KSh 1,200,000
            </Text>
          </View>
          <Text style={styles.estimationNote}>
            *This is an estimate. Please enter the actual current market value.
          </Text>
        </View>
      )}

      {/* Information Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.primary} />
        <Text style={styles.infoText}>
          {customInfo || 
          "The vehicle value should reflect the current market value. This will be used to calculate your premium. For accurate valuation, consider getting a professional assessment."}
        </Text>
      </View>

      {/* Value Guidelines */}
      <View style={styles.guidelinesContainer}>
        <Text style={styles.guidelinesTitle}>Vehicle Valuation Guidelines:</Text>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Use current market value, not purchase price</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Consider depreciation based on age and condition</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Include value of accessories and modifications</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Minimum value: KSh 100,000</Text>
        </View>
      </View>
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
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
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
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  currencyPrefix: {
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
  },
  valueInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  formattedValue: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  estimationCard: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  estimationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  estimationTitle: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  estimationSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_400Regular',
  },
  estimationRange: {
    backgroundColor: 'white',
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  estimationRangeText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
  },
  estimationNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: 'Poppins_400Regular',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}10`,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  guidelinesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guidelinesTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_500Medium',
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  guidelineText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
});

export default VehicleValueStep;
