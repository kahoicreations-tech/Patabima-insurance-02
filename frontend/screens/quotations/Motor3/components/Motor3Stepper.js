import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { BRAND, SPACING, FONT_SIZES, FONT_WEIGHTS, UI } from '../../../../theme';

// Motor2-matching step labels
const STEP_LABELS = ['Vehicle Type', 'Coverage', 'Vehicle', 'Underwriter', 'Client', 'Documents', 'Review', 'Payment'];

const Motor3Stepper = ({ currentStep, totalSteps = 8 }) => {
  return (
    <View style={styles.safeAreaWrapper}>
      <View style={styles.stepperWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepperContainer}
        >
          {Array.from({ length: totalSteps }, (_, idx) => idx + 1).map((step) => {
            const isActive = step === currentStep;
            const label = STEP_LABELS[step - 1] || `Step ${step}`;
            return (
              <View key={step} style={isActive ? styles.activeStep : styles.dotSmall}>
                <Text style={isActive ? styles.activeIndex : styles.dotIndex}>{step}</Text>
                {isActive && <Text style={styles.activeLabel}>{label}</Text>}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeAreaWrapper: {
    backgroundColor: UI.background,
  },
  stepperWrapper: {
    paddingBottom: SPACING.sm,
    backgroundColor: UI.background,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  dotSmall: { 
    width: SPACING.xxl + SPACING.xs, 
    height: SPACING.xxl + SPACING.xs, 
    borderRadius: (SPACING.xxl + SPACING.xs) / 2, 
    backgroundColor: '#E5E7EB', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  dotIndex: { 
    fontSize: FONT_SIZES.bodySmall, 
    color: '#6B7280', 
    fontWeight: FONT_WEIGHTS.semibold, 
  },
  activeStep: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    backgroundColor: BRAND.primary,
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.xs, 
    borderRadius: SPACING.xxl / 2,
  },
  activeIndex: { 
    color: '#fff', 
    fontWeight: FONT_WEIGHTS.bold, 
    fontSize: FONT_SIZES.bodySmall, 
  },
  activeLabel: { 
    color: '#fff', 
    fontWeight: FONT_WEIGHTS.semibold, 
    fontSize: FONT_SIZES.body, 
  },
});

export default Motor3Stepper;
