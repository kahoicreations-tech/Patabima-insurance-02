/**
 * Commercial Vehicle Value Step Component
 * Handles commercial vehicle valuation for comprehensive coverage
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const CommercialVehicleValueStep = ({ 
  formData, 
  onUpdateFormData, 
  onNext,
  onBack,
  coverageType = 'third_party',
  isThirdPartyOnly = false 
}) => {
  // Debug logging
  console.log('CommercialVehicleValueStep: Props received:', {
    hasOnUpdateFormData: typeof onUpdateFormData === 'function',
    hasOnNext: typeof onNext === 'function',
    hasOnBack: typeof onBack === 'function',
    coverageType,
    isThirdPartyOnly
  });

  const [errors, setErrors] = useState({});
  const [estimatedValue, setEstimatedValue] = useState(formData.vehicleValue || '');
  const [accessoriesValue, setAccessoriesValue] = useState(formData.accessoriesValue || '');
  const [goodsInTransitValue, setGoodsInTransitValue] = useState(formData.goodsInTransitValue || '');

  // For third party insurance, this step might be simplified or skipped
  if (isThirdPartyOnly || coverageType === 'third_party') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Third Party Coverage</Text>
              <Text style={styles.infoText}>
                Third party insurance doesn't require vehicle valuation as it only covers damage to third parties, not your own vehicle.
              </Text>
            </View>
          </View>
          
          <View style={styles.skipContainer}>
            <Text style={styles.skipTitle}>Skip Vehicle Valuation</Text>
            <Text style={styles.skipDescription}>
              Since you're purchasing third party coverage only, we'll proceed to insurer selection.
            </Text>
          </View>
        </View>

        {/* Navigation Buttons for Third Party */}
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
            onPress={onNext}
          >
            <Text style={[styles.buttonText, styles.nextButtonText]}>Continue to Insurers</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const updateField = (field, value) => {
    console.log('CommercialVehicleValueStep: updateField called with:', { field, value, hasOnUpdateFormData: typeof onUpdateFormData === 'function' });
    
    if (typeof onUpdateFormData !== 'function') {
      console.error('CommercialVehicleValueStep: onUpdateFormData is not a function!', onUpdateFormData);
      return;
    }
    
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

  const handleEstimateValue = () => {
    // Estimate based on commercial category, make, model, year, weight
    const { commercialCategory, vehicleMake, vehicleModel, vehicleYear, grossWeight } = formData;
    
    if (!commercialCategory || !vehicleMake || !vehicleYear) {
      Alert.alert('Missing Information', 'Please ensure commercial category, make, and year are filled in the previous step.');
      return;
    }

    // Basic estimation logic for commercial vehicles
    let baseValue = 0;
    const currentYear = new Date().getFullYear();
    const age = currentYear - parseInt(vehicleYear);
    const weight = parseInt(grossWeight) || 3500;

    // Base values by commercial category and weight
    switch (commercialCategory) {
      case 'general_cartage':
        if (weight <= 3500) {
          baseValue = 2000000; // 2M for light commercial
        } else if (weight <= 7500) {
          baseValue = 4000000; // 4M for medium commercial
        } else {
          baseValue = 8000000; // 8M for heavy commercial
        }
        break;
      case 'own_goods':
        if (weight <= 3500) {
          baseValue = 1800000; // 1.8M for light own goods
        } else if (weight <= 7500) {
          baseValue = 3500000; // 3.5M for medium own goods
        } else {
          baseValue = 7000000; // 7M for heavy own goods
        }
        break;
      case 'special_type':
        if (weight <= 5000) {
          baseValue = 3000000; // 3M for smaller special vehicles
        } else {
          baseValue = 10000000; // 10M for large special vehicles (cranes, etc.)
        }
        break;
      default:
        baseValue = 2500000; // Default value
    }

    // Brand adjustment
    const premiumBrands = ['mercedes-benz', 'scania', 'volvo', 'man', 'daf'];
    if (premiumBrands.includes(vehicleMake.toLowerCase())) {
      baseValue *= 1.3; // 30% premium for luxury brands
    }

    // Depreciation based on age (commercial vehicles depreciate slower)
    const depreciationRate = 0.12; // 12% per year for commercial vehicles
    const depreciatedValue = baseValue * Math.pow(1 - depreciationRate, age);
    const estimatedVal = Math.max(depreciatedValue, baseValue * 0.15); // Minimum 15% of base value

    setEstimatedValue(Math.round(estimatedVal).toString());
    updateField('vehicleValue', Math.round(estimatedVal).toString());

    Alert.alert(
      'Value Estimated',
      `Estimated value: KES ${Math.round(estimatedVal).toLocaleString()}\n\nThis is based on your vehicle category, make, year, and weight. You can adjust this value if needed.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Commercial Vehicle Valuation</Text>
        <Text style={styles.stepDescription}>
          Help us determine the current market value of your commercial vehicle for comprehensive coverage.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Why Commercial Vehicle Value Matters</Text>
            <Text style={styles.infoText}>
              For comprehensive coverage, the vehicle value determines your coverage limit and premium calculation for commercial operations.
            </Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Current Market Value (KES) *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.vehicleValue && styles.inputError]}
              value={estimatedValue}
              onChangeText={(value) => {
                setEstimatedValue(value);
                updateField('vehicleValue', value);
              }}
              placeholder="e.g. 2500000"
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.estimateButton}
              onPress={handleEstimateValue}
            >
              <Ionicons name="calculator" size={20} color={Colors.white} />
              <Text style={styles.estimateButtonText}>Estimate</Text>
            </TouchableOpacity>
          </View>
          {errors.vehicleValue && <Text style={styles.errorText}>{errors.vehicleValue}</Text>}
          <Text style={styles.helperText}>
            Current market value of the vehicle without accessories
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Accessories & Modifications Value (KES)</Text>
          <TextInput
            style={styles.input}
            value={accessoriesValue}
            onChangeText={(value) => {
              setAccessoriesValue(value);
              updateField('accessoriesValue', value);
            }}
            placeholder="e.g. 200000"
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>
            Value of special accessories, toolboxes, crane equipment, etc.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Maximum Goods in Transit Value (KES)</Text>
          <TextInput
            style={styles.input}
            value={goodsInTransitValue}
            onChangeText={(value) => {
              setGoodsInTransitValue(value);
              updateField('goodsInTransitValue', value);
            }}
            placeholder="e.g. 500000"
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>
            Maximum value of goods carried at any one time (for goods in transit coverage)
          </Text>
        </View>

        <View style={styles.valuationTips}>
          <Text style={styles.tipsTitle}>💡 Commercial Vehicle Valuation Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Consider depreciation based on usage intensity</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Include value of specialized equipment or modifications</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Commercial vehicles may have different depreciation rates</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Consider professional valuation for high-value specialized equipment</Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color={Colors.warning} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Important Notice</Text>
            <Text style={styles.warningText}>
              Under-insuring your commercial vehicle may result in proportionate claim settlements. 
              Ensure the declared value reflects the actual replacement cost.
            </Text>
          </View>
        </View>

        {(estimatedValue || accessoriesValue || goodsInTransitValue) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Coverage Summary</Text>
            {estimatedValue && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vehicle Value:</Text>
                <Text style={styles.summaryValue}>KES {parseInt(estimatedValue || 0).toLocaleString()}</Text>
              </View>
            )}
            {accessoriesValue && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Accessories:</Text>
                <Text style={styles.summaryValue}>KES {parseInt(accessoriesValue || 0).toLocaleString()}</Text>
              </View>
            )}
            {goodsInTransitValue && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Goods in Transit:</Text>
                <Text style={styles.summaryValue}>KES {parseInt(goodsInTransitValue || 0).toLocaleString()}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Coverage:</Text>
              <Text style={styles.totalValue}>
                KES {(
                  parseInt(estimatedValue || 0) + 
                  parseInt(accessoriesValue || 0) + 
                  parseInt(goodsInTransitValue || 0)
                ).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
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
          onPress={onNext}
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
  skipContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  skipTitle: {
    ...Typography.h3,
    color: Colors.gray,
    marginBottom: Spacing.sm,
  },
  skipDescription: {
    ...Typography.body,
    color: Colors.gray,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    backgroundColor: Colors.white,
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
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginLeft: Spacing.sm,
  },
  estimateButtonText: {
    ...Typography.body,
    color: Colors.white,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  valuationTips: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.md,
    marginVertical: Spacing.lg,
  },
  tipsTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    marginBottom: Spacing.xs,
  },
  tipText: {
    ...Typography.caption,
    color: Colors.gray,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  warningContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  warningTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: Spacing.xs,
  },
  warningText: {
    ...Typography.caption,
    color: Colors.warning,
  },
  summaryCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.gray,
  },
  summaryValue: {
    ...Typography.body,
    color: Colors.dark,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
  },
  totalValue: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.primary,
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

export default CommercialVehicleValueStep;
