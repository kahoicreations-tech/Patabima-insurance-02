/**
 * InsurerSelectionStep - Reusable component for insurer selection and quote comparison
 * Supports different insurance types (TOR, Comprehensive, Third Party, etc.)
 * Used across all private motor insurance quotation flows
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const InsurerSelectionStep = ({
  formData,
  onUpdateFormData,
  insurers = [],
  insuranceType = 'Motor Insurance',
  showHeader = true,
  enablePremiumCalculation = true,
  onCalculatePremium = null,
  vehicleAge = 0,
  children // For additional components like PremiumCalculator
}) => {
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  // Calculate premium for an insurer
  const calculateInsurerPremium = (insurer, vehicleValue) => {
    if (!enablePremiumCalculation || !onCalculatePremium) {
      return { premium: 0, isEligible: true, message: '' };
    }
    
    return onCalculatePremium(insurer, vehicleValue, vehicleAge);
  };

  // Format number with commas
  const formatNumber = (value) => {
    if (!value) return '0';
    return Math.round(value).toLocaleString();
  };

  const vehicleValue = parseFloat(formData.vehicleValue?.replace(/[^0-9.]/g, '') || '0');

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Select {insuranceType} Insurer</Text>
          <Text style={styles.stepSubtitle}>Compare quotes from verified underwriters</Text>
        </>
      )}

      {/* Insurers List */}
      {insurers.map((insurer) => {
        const calculation = calculateInsurerPremium(insurer, vehicleValue);
        const isEligible = calculation.isEligible;
        const totalPremium = calculation.totalPremium || 0;

        return (
          <TouchableOpacity
            key={insurer.id}
            style={[
              styles.insurerCard,
              formData.selectedInsurer === insurer.id && styles.selectedInsurerCard,
              !isEligible && styles.ineligibleInsurerCard
            ]}
            onPress={() => isEligible && updateFormData({ selectedInsurer: insurer.id })}
            disabled={!isEligible}
            activeOpacity={0.7}
          >
            {/* Selection Indicator */}
            <View style={styles.selectionIndicator}>
              {formData.selectedInsurer === insurer.id ? (
                <Ionicons name="radio-button-on" size={20} color={Colors.primary} />
              ) : (
                <Ionicons name="radio-button-off" size={20} color={Colors.textMuted} />
              )}
            </View>

            {/* Insurer Content */}
            <View style={styles.insurerContent}>
              {/* Insurer Header */}
              <View style={styles.insurerHeader}>
                <View style={[styles.insurerIcon, { backgroundColor: insurer.color || Colors.primary }]}>
                  <Ionicons name="shield-checkmark" size={20} color="white" />
                </View>
                
                <View style={styles.insurerInfo}>
                  <Text style={[styles.insurerName, !isEligible && styles.ineligibleText]}>
                    {insurer.name}
                  </Text>
                  
                  <Text style={[styles.insurerDetails, !isEligible && styles.ineligibleText]}>
                    Rate: {insurer.rate}% | Min: KSh {formatNumber(insurer.baseMinimum)}
                  </Text>
                  
                  {!isEligible && (
                    <Text style={styles.ineligibilityReason}>
                      {calculation.message || `Max Age: ${insurer.maxVehicleAge} years`}
                    </Text>
                  )}
                </View>
                
                <View style={styles.premiumInfo}>
                  {isEligible && enablePremiumCalculation ? (
                    <>
                      <Text style={styles.premiumAmount}>KSh {formatNumber(totalPremium)}</Text>
                      <Text style={styles.premiumLabel}>Total Premium</Text>
                    </>
                  ) : isEligible ? (
                    <>
                      <Text style={styles.premiumAmount}>Available</Text>
                      <Text style={styles.premiumLabel}>Get Quote</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.ineligibleAmount}>Not Available</Text>
                      <Text style={styles.ineligibleLabel}>Ineligible</Text>
                    </>
                  )}
                </View>
              </View>
              
              {/* Features List */}
              <View style={styles.featuresContainer}>
                {insurer.features?.slice(0, 4).map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={14} 
                      color={isEligible ? Colors.success : Colors.textMuted} 
                    />
                    <Text style={[
                      styles.featureText,
                      !isEligible && styles.ineligibleFeatureText
                    ]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
              
              {/* Official Source Badge */}
              {isEligible && insurer.isOfficial && (
                <View style={styles.officialBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
                  <Text style={styles.officialText}>
                    Verified underwriter rates
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* No Insurers Available */}
      {insurers.length === 0 && (
        <View style={styles.noInsurersContainer}>
          <Ionicons name="information-circle" size={48} color={Colors.textMuted} />
          <Text style={styles.noInsurersTitle}>No Insurers Available</Text>
          <Text style={styles.noInsurersText}>
            Please check your vehicle details and try again.
          </Text>
        </View>
      )}

      {/* Additional Components (like PremiumCalculator) */}
      {children}

      {/* Selection Summary */}
      {formData.selectedInsurer && (
        <View style={styles.selectionSummary}>
          <View style={styles.summaryHeader}>
            <Ionicons name="document-text" size={20} color={Colors.primary} />
            <Text style={styles.summaryTitle}>Selection Summary</Text>
          </View>
          
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              Selected Insurer: {insurers.find(i => i.id === formData.selectedInsurer)?.name}
            </Text>
            
            {enablePremiumCalculation && formData.selectedQuote && (
              <Text style={styles.summaryText}>
                Total Premium: KSh {formatNumber(formData.selectedQuote.totalPremium)}
              </Text>
            )}
          </View>
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
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  insurerCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedInsurerCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  ineligibleInsurerCard: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
    borderColor: Colors.textMuted,
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 1,
  },
  insurerContent: {
    paddingTop: Spacing.lg,
  },
  insurerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  insurerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  insurerInfo: {
    flex: 1,
  },
  insurerName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  insurerDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  ineligibilityReason: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  ineligibleText: {
    color: Colors.textMuted,
  },
  premiumInfo: {
    alignItems: 'flex-end',
  },
  premiumAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  premiumLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  ineligibleAmount: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textMuted,
    fontFamily: 'Poppins_500Medium',
  },
  ineligibleLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: Spacing.xs,
  },
  featureText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  ineligibleFeatureText: {
    color: Colors.textMuted,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.success}20`,
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  selectedText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.success,
    fontFamily: 'Poppins_500Medium',
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.success}15`,
    padding: Spacing.xs,
    borderRadius: 6,
  },
  officialText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontFamily: 'Poppins_400Regular',
  },
  noInsurersContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noInsurersTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    fontFamily: 'Poppins_500Medium',
  },
  noInsurersText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontFamily: 'Poppins_400Regular',
  },
  selectionSummary: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  summaryContent: {
    marginLeft: Spacing.lg,
  },
  summaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
  },
});

export default InsurerSelectionStep;
