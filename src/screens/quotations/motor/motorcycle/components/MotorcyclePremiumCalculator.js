/**
 * MotorcyclePremiumCalculator - Motorcycle-specific premium calculation component
 * Handles premium calculation with motorcycle-specific factors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const MotorcyclePremiumCalculator = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  enableAdvancedFactors = true,
  showBreakdown = true,
  onPremiumCalculated = null
}) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [premiumData, setPremiumData] = useState(null);
  const [selectedCoverageType, setSelectedCoverageType] = useState('comprehensive');

  // Motorcycle-specific premium factors
  const COVERAGE_TYPES = {
    thirdParty: {
      name: 'Third Party Only',
      description: 'Covers damage to third parties only (Legal requirement)',
      baseRate: 0.025, // 2.5% of motorcycle value
      icon: 'shield-outline'
    },
    comprehensive: {
      name: 'Comprehensive',
      description: 'Full coverage including theft, fire, and damage',
      baseRate: 0.055, // 5.5% of motorcycle value
      icon: 'shield-checkmark'
    },
    thirdPartyFireTheft: {
      name: 'Third Party Fire & Theft',
      description: 'Third party plus fire and theft coverage',
      baseRate: 0.035, // 3.5% of motorcycle value
      icon: 'shield-half'
    }
  };

  // Engine capacity multipliers
  const ENGINE_CAPACITY_MULTIPLIERS = {
    'up-to-125': { min: 0, max: 125, multiplier: 0.8, label: 'Up to 125cc' },
    '126-250': { min: 126, max: 250, multiplier: 1.0, label: '126-250cc' },
    '251-400': { min: 251, max: 400, multiplier: 1.3, label: '251-400cc' },
    '401-600': { min: 401, max: 600, multiplier: 1.6, label: '401-600cc' },
    '601-1000': { min: 601, max: 1000, multiplier: 2.0, label: '601-1000cc' },
    'above-1000': { min: 1001, max: 9999, multiplier: 2.5, label: 'Above 1000cc' }
  };

  // Motorcycle type multipliers
  const MOTORCYCLE_TYPE_MULTIPLIERS = {
    'standard': 1.0,
    'sports': 1.8,
    'cruiser': 1.2,
    'scooter': 0.7,
    'dirt-bike': 1.4,
    'moped': 0.6,
    'delivery': 1.1
  };

  // Age multipliers
  const AGE_MULTIPLIERS = {
    0: 1.0,    // New
    1: 0.95,
    2: 0.90,
    3: 0.85,
    4: 0.80,
    5: 0.75,
    6: 0.70,
    7: 0.65,
    8: 0.60,
    9: 0.55,
    10: 0.50   // 10+ years
  };

  useEffect(() => {
    if (formData.motorcycleValue && formData.engineCapacity && formData.motorcycleType) {
      calculatePremium();
    }
  }, [formData, selectedCoverageType]);

  const getEngineCapacityMultiplier = (engineCapacity) => {
    const capacity = parseInt(engineCapacity) || 0;
    
    for (const key in ENGINE_CAPACITY_MULTIPLIERS) {
      const range = ENGINE_CAPACITY_MULTIPLIERS[key];
      if (capacity >= range.min && capacity <= range.max) {
        return range.multiplier;
      }
    }
    return 1.0; // Default multiplier
  };

  const getEngineCapacityCategory = (engineCapacity) => {
    const capacity = parseInt(engineCapacity) || 0;
    
    for (const key in ENGINE_CAPACITY_MULTIPLIERS) {
      const range = ENGINE_CAPACITY_MULTIPLIERS[key];
      if (capacity >= range.min && capacity <= range.max) {
        return range.label;
      }
    }
    return 'Unknown';
  };

  const calculatePremium = async () => {
    setIsCalculating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const motorcycleValue = parseFloat(formData.motorcycleValue) || 0;
      const engineCapacity = parseInt(formData.engineCapacity) || 0;
      const motorcycleAge = new Date().getFullYear() - parseInt(formData.motorcycleYear || new Date().getFullYear());
      
      // Base premium calculation
      const coverage = COVERAGE_TYPES[selectedCoverageType];
      let basePremium = motorcycleValue * coverage.baseRate;
      
      // Apply engine capacity multiplier
      const engineMultiplier = getEngineCapacityMultiplier(engineCapacity);
      basePremium *= engineMultiplier;
      
      // Apply motorcycle type multiplier
      const typeMultiplier = MOTORCYCLE_TYPE_MULTIPLIERS[formData.motorcycleType] || 1.0;
      basePremium *= typeMultiplier;
      
      // Apply age depreciation
      const ageMultiplier = AGE_MULTIPLIERS[Math.min(motorcycleAge, 10)] || 0.50;
      basePremium *= ageMultiplier;
      
      // Additional factors
      let locationMultiplier = 1.0;
      if (formData.location?.toLowerCase().includes('nairobi')) {
        locationMultiplier = 1.2; // Higher risk in Nairobi
      } else if (formData.location?.toLowerCase().includes('mombasa')) {
        locationMultiplier = 1.1;
      }
      basePremium *= locationMultiplier;
      
      // Driver experience factor
      const driverAge = parseInt(formData.age) || 25;
      let experienceMultiplier = 1.0;
      if (driverAge < 25) {
        experienceMultiplier = 1.3; // Young rider surcharge
      } else if (driverAge > 50) {
        experienceMultiplier = 0.9; // Mature rider discount
      }
      basePremium *= experienceMultiplier;
      
      // Calculate add-ons
      const addOns = {
        personalAccident: selectedCoverageType === 'comprehensive' ? motorcycleValue * 0.005 : 0,
        roadAssistance: 2500,
        legalExpenses: 1500,
        medicalExpenses: selectedCoverageType === 'comprehensive' ? 3000 : 0,
        accessoriesCover: formData.hasAccessories ? motorcycleValue * 0.01 : 0
      };
      
      const totalAddOns = Object.values(addOns).reduce((sum, value) => sum + value, 0);
      
      // Government levies and taxes
      const stampDuty = 40;
      const trainingLevy = Math.max(50, basePremium * 0.002);
      const policyHoldersFund = basePremium * 0.0025;
      const vat = (basePremium + totalAddOns) * 0.16;
      
      const totalTaxes = stampDuty + trainingLevy + policyHoldersFund + vat;
      const totalPremium = basePremium + totalAddOns + totalTaxes;
      
      const calculatedData = {
        coverageType: selectedCoverageType,
        motorcycleValue,
        basePremium: Math.round(basePremium),
        addOns,
        totalAddOns: Math.round(totalAddOns),
        taxes: {
          stampDuty,
          trainingLevy: Math.round(trainingLevy),
          policyHoldersFund: Math.round(policyHoldersFund),
          vat: Math.round(vat)
        },
        totalTaxes: Math.round(totalTaxes),
        totalPremium: Math.round(totalPremium),
        factors: {
          engineCapacity: {
            value: engineCapacity,
            category: getEngineCapacityCategory(engineCapacity),
            multiplier: engineMultiplier
          },
          motorcycleType: {
            value: formData.motorcycleType,
            multiplier: typeMultiplier
          },
          age: {
            value: motorcycleAge,
            multiplier: ageMultiplier
          },
          location: {
            value: formData.location,
            multiplier: locationMultiplier
          },
          driverExperience: {
            age: driverAge,
            multiplier: experienceMultiplier
          }
        }
      };
      
      setPremiumData(calculatedData);
      onUpdateFormData({ 
        premiumCalculation: calculatedData,
        selectedCoverageType,
        calculatedPremium: totalPremium 
      });
      
      if (onPremiumCalculated) {
        onPremiumCalculated(calculatedData);
      }
    } catch (error) {
      console.error('Premium calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderCoverageOption = (key, coverage) => {
    const isSelected = selectedCoverageType === key;
    
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.coverageOption,
          isSelected && styles.selectedCoverageOption
        ]}
        onPress={() => setSelectedCoverageType(key)}
      >
        <View style={styles.coverageHeader}>
          <Ionicons 
            name={coverage.icon} 
            size={24} 
            color={isSelected ? Colors.primary : Colors.textSecondary} 
          />
          <View style={styles.coverageInfo}>
            <Text style={[
              styles.coverageName,
              isSelected && styles.selectedCoverageText
            ]}>
              {coverage.name}
            </Text>
            <Text style={styles.coverageDescription}>
              {coverage.description}
            </Text>
          </View>
          <View style={styles.selectionIndicator}>
            {isSelected ? (
              <Ionicons name="radio-button-on" size={20} color={Colors.primary} />
            ) : (
              <Ionicons name="radio-button-off" size={20} color={Colors.border} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPremiumBreakdown = () => {
    if (!premiumData || !showBreakdown) return null;

    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Premium Breakdown</Text>
        
        {/* Base premium */}
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Base Premium</Text>
          <Text style={styles.breakdownValue}>
            {formatCurrency(premiumData.basePremium)}
          </Text>
        </View>
        
        {/* Add-ons */}
        {Object.entries(premiumData.addOns).map(([key, value]) => {
          if (value > 0) {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <View key={key} style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>{label}</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(value)}
                </Text>
              </View>
            );
          }
          return null;
        })}
        
        {/* Taxes */}
        <View style={styles.taxesSection}>
          <Text style={styles.taxesSectionTitle}>Government Levies & Taxes</Text>
          {Object.entries(premiumData.taxes).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <View key={key} style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>{label}</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(value)}
                </Text>
              </View>
            );
          })}
        </View>
        
        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.breakdownItem}>
            <Text style={styles.totalLabel}>Total Annual Premium</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(premiumData.totalPremium)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFactors = () => {
    if (!premiumData || !enableAdvancedFactors) return null;

    return (
      <View style={styles.factorsContainer}>
        <Text style={styles.factorsTitle}>Premium Calculation Factors</Text>
        
        {Object.entries(premiumData.factors).map(([key, factor]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return (
            <View key={key} style={styles.factorItem}>
              <Text style={styles.factorLabel}>{label}</Text>
              <View style={styles.factorDetails}>
                <Text style={styles.factorValue}>
                  {typeof factor.value === 'string' ? factor.value : factor.category || factor.value}
                </Text>
                <Text style={styles.factorMultiplier}>
                  {factor.multiplier}x
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Premium Calculation</Text>
          <Text style={styles.stepSubtitle}>
            Calculate your motorcycle insurance premium
          </Text>
        </>
      )}

      {/* Coverage Type Selection */}
      <View style={styles.coverageSection}>
        <Text style={styles.sectionTitle}>Select Coverage Type</Text>
        {Object.entries(COVERAGE_TYPES).map(([key, coverage]) =>
          renderCoverageOption(key, coverage)
        )}
      </View>

      {/* Calculate Button */}
      <TouchableOpacity
        style={[
          styles.calculateButton,
          isCalculating && styles.calculateButtonDisabled
        ]}
        onPress={calculatePremium}
        disabled={isCalculating}
      >
        {isCalculating ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Ionicons name="calculator" size={20} color="white" />
        )}
        <Text style={styles.calculateButtonText}>
          {isCalculating ? 'Calculating...' : 'Calculate Premium'}
        </Text>
      </TouchableOpacity>

      {/* Premium Result */}
      {premiumData && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.resultTitle}>Premium Calculated</Text>
          </View>
          
          <View style={styles.premiumDisplay}>
            <Text style={styles.premiumAmount}>
              {formatCurrency(premiumData.totalPremium)}
            </Text>
            <Text style={styles.premiumPeriod}>per year</Text>
          </View>
          
          <Text style={styles.coverageTypeDisplay}>
            {COVERAGE_TYPES[premiumData.coverageType].name}
          </Text>
        </View>
      )}

      {/* Premium Breakdown */}
      {renderPremiumBreakdown()}

      {/* Calculation Factors */}
      {renderFactors()}

      {/* Important Notes */}
      <View style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Important Notes:</Text>
        <View style={styles.noteItem}>
          <Ionicons name="information-circle" size={16} color={Colors.primary} />
          <Text style={styles.noteText}>
            Premium rates are indicative and subject to underwriting approval
          </Text>
        </View>
        <View style={styles.noteItem}>
          <Ionicons name="time" size={16} color={Colors.primary} />
          <Text style={styles.noteText}>
            Final premium may vary based on detailed risk assessment
          </Text>
        </View>
        <View style={styles.noteItem}>
          <Ionicons name="document-text" size={16} color={Colors.primary} />
          <Text style={styles.noteText}>
            All government levies and taxes are included in the total
          </Text>
        </View>
      </View>
    </ScrollView>
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
  coverageSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: 'Poppins_700Bold',
  },
  coverageOption: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCoverageOption: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}05`,
  },
  coverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverageInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  coverageName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  selectedCoverageText: {
    color: Colors.primary,
  },
  coverageDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  selectionIndicator: {
    marginLeft: Spacing.sm,
  },
  calculateButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  calculateButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  calculateButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing.sm,
    fontFamily: 'Poppins_700Bold',
  },
  resultContainer: {
    backgroundColor: `${Colors.success}10`,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.success}30`,
    alignItems: 'center',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultTitle: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
    fontFamily: 'Poppins_700Bold',
  },
  premiumDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  premiumAmount: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  premiumPeriod: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  coverageTypeDisplay: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  breakdownContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: 'Poppins_700Bold',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  breakdownValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  taxesSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  taxesSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_700Bold',
  },
  totalSection: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  factorsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  factorsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: 'Poppins_700Bold',
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  factorLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  factorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
    fontFamily: 'Poppins_400Regular',
  },
  factorMultiplier: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  notesContainer: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  notesTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_700Bold',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  noteText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
});

export default MotorcyclePremiumCalculator;
