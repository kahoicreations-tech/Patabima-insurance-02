/**
 * Step 3: Underwriter Selection
 * Displays comparison cards sorted by price
 */

import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThirdParty } from '../../contexts/ThirdPartyContext';
import { formatPremium } from '../../utils/premiumCalculations';
import StepNavigation from './StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';
import { BRAND, SPACING, BORDER_RADIUS, BORDER_WIDTH, FONT_SIZES, FONT_WEIGHTS, FONT_FAMILIES, UI, SHADOWS } from '../../../../../theme';

const UnderwriterCard = React.memo(({ underwriter, isSelected, onSelect }) => {
  // Safely extract values - service returns 'name' not 'underwriter_name'
  const underwriterName = underwriter.name || underwriter.underwriter_name || underwriter.company || 'Unknown Provider';
  const totalPremium = underwriter.total_premium || underwriter.premium || underwriter.totalPremium || 0;
  
  // Safely extract breakdown values with defaults
  const breakdown = underwriter.breakdown || {};
  const basePremium = underwriter.base_premium || underwriter.basePremium || breakdown.base_premium || 0;
  
  const itl = breakdown.itl ?? breakdown.training_levy ?? breakdown.trainingLevy ?? 0;
  const pcf = breakdown.pcf ?? breakdown.pcf_levy ?? breakdown.pcfLevy ?? 0;
  const stampDuty = breakdown.stamp_duty ?? breakdown.stampDuty ?? 40; // Default stamp duty

  // If breakdown is missing but total exists, derive base + levies for display.
  const numericTotal = Number(totalPremium) || 0;
  const numericStamp = Number(stampDuty) || 40;
  const levyRate = 0.0025;
  const derivedBase = (!Number(basePremium) && numericTotal > numericStamp)
    ? (numericTotal - numericStamp) / (1 + 2 * levyRate)
    : 0;
  const displayBase = Number(basePremium) || (derivedBase > 0 ? derivedBase : 0);
  const displayItl = Number(itl) || (displayBase > 0 ? displayBase * levyRate : 0);
  const displayPcf = Number(pcf) || (displayBase > 0 ? displayBase * levyRate : 0);
  
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.underwriterName}>{underwriterName}</Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.premiumAmount}>{formatPremium(totalPremium)}</Text>
      <View style={styles.breakdown}>
        <Text style={styles.breakdownLabel}>Base Premium:</Text>
        <Text style={styles.breakdownValue}>{formatPremium(displayBase)}</Text>
      </View>
      <View style={styles.breakdown}>
        <Text style={styles.breakdownLabel}>ITL + PCF:</Text>
        <Text style={styles.breakdownValue}>
          {formatPremium(displayItl + displayPcf)}
        </Text>
      </View>
      <View style={styles.breakdown}>
        <Text style={styles.breakdownLabel}>Stamp Duty:</Text>
        <Text style={styles.breakdownValue}>{formatPremium(stampDuty)}</Text>
      </View>
    </TouchableOpacity>
  );
});

const Step3_UnderwriterSelection = ({ onNext, onBack, currentStep, totalSteps }) => {
  const {
    availableUnderwriters,
    selectedUnderwriter,
    selectUnderwriter,
    loadingUnderwriters,
  } = useThirdParty();

  const handleSelect = useCallback((underwriter) => {
    selectUnderwriter(underwriter);
  }, [selectUnderwriter]);

  const handleNext = useCallback(() => {
    if (!selectedUnderwriter) {
      alert('Please select an underwriter');
      return;
    }
    onNext();
  }, [onNext, selectedUnderwriter]);

  if (loadingUnderwriters) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.loadingText}>Loading underwriters...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Select Insurance Provider</Text>
        <Text style={styles.subtitle}>{availableUnderwriters.length} options available</Text>
      </View>

      <FlatList
        data={availableUnderwriters}
        keyExtractor={(item) => item.underwriter_code}
        renderItem={({ item }) => (
          <UnderwriterCard
            underwriter={item}
            isSelected={selectedUnderwriter?.underwriter_code === item.underwriter_code}
            onSelect={() => handleSelect(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onBack={onBack}
        disableNext={false}
        nextLabel={'Next'}
      />
    </View>
  );
};

export default Step3_UnderwriterSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.backgroundGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: FONT_FAMILIES.regular,
    fontWeight: FONT_WEIGHTS.regular,
    color: UI.textSecondary,
    marginTop: SPACING.md,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: UI.background,
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontFamily: FONT_FAMILIES.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    color: UI.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    fontFamily: FONT_FAMILIES.regular,
    fontWeight: FONT_WEIGHTS.regular,
    color: UI.textSecondary,
    marginTop: SPACING.xs,
  },
  list: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: UI.background,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: BORDER_WIDTH.medium,
    borderColor: UI.border,
    ...SHADOWS.md,
  },
  cardSelected: {
    borderColor: BRAND.primary,
    backgroundColor: '#FFF5F5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  underwriterName: {
    fontSize: FONT_SIZES.h3,
    fontFamily: FONT_FAMILIES.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    color: UI.textPrimary,
  },
  checkmark: {
    fontSize: 24,
    color: BRAND.primary,
  },
  premiumAmount: {
    fontSize: FONT_SIZES.h1,
    fontFamily: FONT_FAMILIES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: BRAND.primary,
    marginBottom: SPACING.md,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  breakdownLabel: {
    fontSize: FONT_SIZES.body,
    fontFamily: FONT_FAMILIES.regular,
    fontWeight: FONT_WEIGHTS.regular,
    color: UI.textSecondary,
  },
  breakdownValue: {
    fontSize: FONT_SIZES.body,
    fontFamily: FONT_FAMILIES.medium,
    fontWeight: FONT_WEIGHTS.medium,
    color: UI.textPrimary,
  },

});
