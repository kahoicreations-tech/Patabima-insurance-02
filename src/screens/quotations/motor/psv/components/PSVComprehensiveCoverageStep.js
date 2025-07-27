/**
 * PSV Comprehensive Coverage Selection Step
 * Handles coverage level selection and add-ons for comprehensive PSV insurance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

// Comprehensive coverage levels for PSV
const COMPREHENSIVE_COVERAGE_LEVELS = [
  {
    id: 'basic',
    name: 'Basic Comprehensive',
    rate: 6.0,
    description: 'Essential comprehensive coverage for PSVs',
    features: [
      'Own damage cover',
      'Third party liability (unlimited)',
      'Passenger liability (KSh 10M)',
      'Theft & fire coverage',
      'Basic windscreen cover (KSh 75,000)',
      'Emergency towing services'
    ]
  },
  {
    id: 'enhanced',
    name: 'Enhanced Comprehensive',
    rate: 7.5,
    description: 'Comprehensive coverage with business protection',
    features: [
      'All Basic features',
      'Enhanced passenger liability (KSh 20M)',
      'Business interruption cover',
      'Enhanced windscreen cover (KSh 150,000)',
      'Free towing & recovery',
      'Loss of earnings (KSh 5,000/day)',
      'Personal accident for driver (KSh 1M)'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Comprehensive',
    rate: 9.0,
    description: 'Maximum comprehensive protection for commercial PSVs',
    features: [
      'All Enhanced features',
      'Maximum passenger liability (KSh 50M)',
      'Extended business interruption',
      'Zero excess for glass damage',
      'Natural disaster coverage',
      'Extended loss of earnings (KSh 10,000/day)',
      'Multiple driver coverage',
      'Route deviation coverage'
    ]
  }
];

// Comprehensive add-ons for PSVs
const PSV_COMPREHENSIVE_ADDONS = [
  {
    id: 'excess_protector',
    name: 'Excess Protector',
    premium: 8000,
    description: 'Covers your excess payment in case of a claim',
    limit: 'Up to policy excess amount'
  },
  {
    id: 'political_violence',
    name: 'Political Violence & Terrorism',
    premium: 5000,
    description: 'Coverage against riot, strike, malicious damage and terrorism',
    limit: 'Up to vehicle value'
  },
  {
    id: 'loss_of_use_enhanced',
    name: 'Enhanced Loss of Use',
    premium: 12000,
    description: 'Extended daily allowance while your vehicle is being repaired',
    limit: 'KSh 8,000 per day (max 45 days)'
  },
  {
    id: 'route_deviation',
    name: 'Route Deviation Cover',
    premium: 6000,
    description: 'Protection when operating outside designated routes',
    limit: 'Emergency situations only'
  },
  {
    id: 'passenger_goods',
    name: 'Passenger Goods Protection',
    premium: 4000,
    description: 'Coverage for passenger belongings during transit',
    limit: 'Up to KSh 50,000 per passenger'
  },
  {
    id: 'driver_training',
    name: 'Driver Training Benefit',
    premium: 3000,
    description: 'Annual driver safety training program',
    limit: 'Up to 2 drivers per policy'
  }
];

const PSVComprehensiveCoverageStep = ({ 
  formData, 
  onUpdateFormData,
  selectedCoverageLevel = COMPREHENSIVE_COVERAGE_LEVELS[1],
  onSelectCoverageLevel 
}) => {
  const [localSelectedAddons, setLocalSelectedAddons] = useState(formData.selectedAddons || []);

  const handleCoverageLevelSelect = (level) => {
    onSelectCoverageLevel(level);
    onUpdateFormData({ coverageLevel: level.id });
  };

  const handleAddonToggle = (addonId) => {
    const isSelected = localSelectedAddons.includes(addonId);
    const updatedAddons = isSelected 
      ? localSelectedAddons.filter(id => id !== addonId)
      : [...localSelectedAddons, addonId];
    
    setLocalSelectedAddons(updatedAddons);
    onUpdateFormData({ selectedAddons: updatedAddons });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Coverage Selection</Text>
        <Text style={styles.stepDescription}>
          Choose your comprehensive coverage level and optional add-ons.
        </Text>

        {/* Coverage Levels */}
        <Text style={styles.sectionTitle}>Coverage Level</Text>
        {COMPREHENSIVE_COVERAGE_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.coverageOption,
              selectedCoverageLevel.id === level.id && styles.coverageOptionSelected
            ]}
            onPress={() => handleCoverageLevelSelect(level)}
          >
            <View style={styles.coverageHeader}>
              <View style={styles.coverageInfo}>
                <Text style={styles.coverageName}>{level.name}</Text>
                <Text style={styles.coverageRate}>{level.rate}% of vehicle value</Text>
              </View>
              <View style={[
                styles.radioButton,
                selectedCoverageLevel.id === level.id && styles.radioButtonSelected
              ]}>
                {selectedCoverageLevel.id === level.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
            <Text style={styles.coverageDescription}>{level.description}</Text>
            <View style={styles.featuresList}>
              {level.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Add-ons */}
        <Text style={styles.sectionTitle}>Optional Add-ons</Text>
        {PSV_COMPREHENSIVE_ADDONS.map((addon) => (
          <TouchableOpacity
            key={addon.id}
            style={[
              styles.addonOption,
              localSelectedAddons.includes(addon.id) && styles.addonOptionSelected
            ]}
            onPress={() => handleAddonToggle(addon.id)}
          >
            <View style={styles.addonHeader}>
              <View style={styles.addonInfo}>
                <Text style={styles.addonName}>{addon.name}</Text>
                <Text style={styles.addonPremium}>+KSh {addon.premium.toLocaleString()}</Text>
              </View>
              <View style={[
                styles.checkbox,
                localSelectedAddons.includes(addon.id) && styles.checkboxSelected
              ]}>
                {localSelectedAddons.includes(addon.id) && (
                  <Ionicons name="checkmark" size={16} color={Colors.white} />
                )}
              </View>
            </View>
            <Text style={styles.addonDescription}>{addon.description}</Text>
            <Text style={styles.addonLimit}>{addon.limit}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  coverageOption: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  coverageOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  coverageInfo: {
    flex: 1,
  },
  coverageName: {
    ...Typography.h4,
    color: Colors.dark,
  },
  coverageRate: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  coverageDescription: {
    ...Typography.body,
    color: Colors.gray,
    marginBottom: Spacing.sm,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  featuresList: {
    marginTop: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  featureText: {
    ...Typography.caption,
    color: Colors.dark,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  addonOption: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  addonOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  addonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
  },
  addonPremium: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  addonDescription: {
    ...Typography.caption,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  addonLimit: {
    ...Typography.caption,
    color: Colors.gray,
    fontStyle: 'italic',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
});

export default PSVComprehensiveCoverageStep;
