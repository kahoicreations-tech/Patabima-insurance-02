/**
 * MotorcycleValueStep - Motorcycle-specific vehicle value component
 * Handles motorcycle valuation with engine capacity consideration
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
import { Colors, Typography, Spacing } from '../../../../../constants';

const MotorcycleValueStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  vehicleAge = 0,
  enableEstimation = true,
  minimumValue = 50000,
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

  // Handle motorcycle value input
  const handleValueChange = (text) => {
    const cleanValue = text.replace(/[^0-9.]/g, '');
    updateFormData({ motorcycleValue: cleanValue });
  };

  // Get estimated value range based on motorcycle details
  const getEstimatedValueRange = () => {
    const engineCapacity = parseInt(formData.engineCapacity) || 0;
    const make = formData.motorcycleMake || '';
    const type = formData.motorcycleType || '';
    
    let baseMin = 50000;
    let baseMax = 150000;
    
    // Adjust based on engine capacity
    if (engineCapacity <= 125) {
      baseMin = 40000;
      baseMax = 120000;
    } else if (engineCapacity <= 250) {
      baseMin = 80000;
      baseMax = 250000;
    } else if (engineCapacity <= 400) {
      baseMin = 150000;
      baseMax = 450000;
    } else if (engineCapacity <= 600) {
      baseMin = 300000;
      baseMax = 800000;
    } else {
      baseMin = 500000;
      baseMax = 1500000;
    }
    
    // Adjust based on make
    const premiumMakes = ['Ducati', 'Harley-Davidson', 'BMW', 'KTM', 'Triumph'];
    if (premiumMakes.includes(make)) {
      baseMin *= 1.3;
      baseMax *= 1.8;
    }
    
    // Adjust based on type
    if (type === 'sports') {
      baseMin *= 1.2;
      baseMax *= 1.5;
    } else if (type === 'scooter' || type === 'moped') {
      baseMin *= 0.7;
      baseMax *= 0.8;
    }
    
    // Adjust for age
    const ageDepreciation = Math.max(0.4, 1 - (vehicleAge * 0.1));
    baseMin *= ageDepreciation;
    baseMax *= ageDepreciation;
    
    return {
      min: Math.round(baseMin),
      max: Math.round(baseMax)
    };
  };

  const estimatedRange = getEstimatedValueRange();

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Motorcycle Value</Text>
          <Text style={styles.stepSubtitle}>Set the insured value for your motorcycle</Text>
        </>
      )}

      {/* Motorcycle Age Display */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Motorcycle Age</Text>
            <Text style={styles.infoValue}>
              {vehicleAge > 0 ? `${vehicleAge} years old` : 'Enter manufacturing year first'}
            </Text>
          </View>
        </View>
        
        {formData.engineCapacity && (
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="speedometer-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Engine Capacity</Text>
              <Text style={styles.infoValue}>{formData.engineCapacity} CC</Text>
            </View>
          </View>
        )}
      </View>

      {/* Motorcycle Value Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Motorcycle Value (KSh) *</Text>
        <View style={styles.valueInputContainer}>
          <Text style={styles.currencyPrefix}>KSh</Text>
          <TextInput
            style={styles.valueInput}
            value={formData.motorcycleValue}
            onChangeText={handleValueChange}
            placeholder="Enter motorcycle value"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
        
        {/* Display formatted value */}
        {formData.motorcycleValue && (
          <Text style={styles.formattedValue}>
            Formatted: KSh {formatNumber(formData.motorcycleValue)}
          </Text>
        )}
      </View>

      {/* Motorcycle Value Estimation */}
      {enableEstimation && formData.motorcycleMake && formData.motorcycleModel && formData.motorcycleYear && (
        <View style={styles.estimationCard}>
          <View style={styles.estimationHeader}>
            <Ionicons name="calculator-outline" size={20} color={Colors.primary} />
            <Text style={styles.estimationTitle}>Estimated Market Value</Text>
          </View>
          <Text style={styles.estimationSubtext}>
            Based on {formData.motorcycleYear} {formData.motorcycleMake} {formData.motorcycleModel}
            {formData.engineCapacity && ` (${formData.engineCapacity}CC)`}
          </Text>
          <View style={styles.estimationRange}>
            <Text style={styles.estimationRangeText}>
              Estimated Range: KSh {formatNumber(estimatedRange.min)} - KSh {formatNumber(estimatedRange.max)}
            </Text>
          </View>
          
          {/* Quick value suggestions */}
          <View style={styles.quickSuggestions}>
            <Text style={styles.suggestionsTitle}>Quick Select:</Text>
            <View style={styles.suggestionButtons}>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => updateFormData({ motorcycleValue: estimatedRange.min.toString() })}
              >
                <Text style={styles.suggestionButtonText}>
                  KSh {formatNumber(estimatedRange.min)}
                </Text>
                <Text style={styles.suggestionLabel}>Minimum</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => updateFormData({ 
                  motorcycleValue: Math.round((estimatedRange.min + estimatedRange.max) / 2).toString() 
                })}
              >
                <Text style={styles.suggestionButtonText}>
                  KSh {formatNumber(Math.round((estimatedRange.min + estimatedRange.max) / 2))}
                </Text>
                <Text style={styles.suggestionLabel}>Average</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => updateFormData({ motorcycleValue: estimatedRange.max.toString() })}
              >
                <Text style={styles.suggestionButtonText}>
                  KSh {formatNumber(estimatedRange.max)}
                </Text>
                <Text style={styles.suggestionLabel}>Maximum</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.estimationNote}>
            *This is an estimate based on motorcycle specifications and age. Please enter the actual current market value.
          </Text>
        </View>
      )}

      {/* Information Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.primary} />
        <Text style={styles.infoText}>
          {customInfo || 
          "The motorcycle value should reflect the current market value. Engine capacity, make, model, and age are key factors in determining motorcycle value. For accurate valuation, consider getting a professional assessment."}
        </Text>
      </View>

      {/* Value Guidelines */}
      <View style={styles.guidelinesContainer}>
        <Text style={styles.guidelinesTitle}>Motorcycle Valuation Guidelines:</Text>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Use current market value, not purchase price</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Consider engine capacity and motorcycle type</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Include value of accessories and modifications</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Account for depreciation based on age and condition</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Minimum value: KSh {formatNumber(minimumValue)}</Text>
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
    marginBottom: Spacing.sm,
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
  quickSuggestions: {
    marginBottom: Spacing.sm,
  },
  suggestionsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_500Medium',
  },
  suggestionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  suggestionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    fontFamily: 'Poppins_500Medium',
  },
  suggestionLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
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

export default MotorcycleValueStep;
