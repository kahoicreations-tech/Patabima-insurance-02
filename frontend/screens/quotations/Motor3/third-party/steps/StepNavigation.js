/**
 * StepNavigation - Reusable navigation component for step-based flows
 * Motor 2 Design Match: Stepper dots + Back/Next buttons
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../../../../theme';

// Motor2-matching step labels
const STEP_LABELS = ['Vehicle Type', 'Coverage', 'Vehicle', 'Underwriter', 'Client', 'Documents', 'Review', 'Payment'];

const StepNavigation = ({
  currentStep,
  totalSteps = 8,
  onNext,
  onBack,
  nextLabel = 'Next',
  backLabel = 'Back',
  hideNext = false,
  hideBack = false,
  disableNext = false,
  validationMessage = '',
}) => {
  return (
    <View style={styles.wrapper}>
      {/* Navigation Buttons */}
      <View style={[styles.navRow, { paddingBottom: Platform.OS === 'android' ? SPACING.lg : SPACING.xxl }]}>
        {!hideBack && (currentStep > 1 || (currentStep === 1 && typeof onBack === 'function')) && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBack} 
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={20} color="#495057" />
            <Text style={styles.backText}>{backLabel}</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        {!hideNext && (
          <TouchableOpacity
            style={[styles.nextButton, disableNext && styles.nextDisabled]}
            onPress={onNext}
            disabled={disableNext}
            activeOpacity={0.75}
          >
            <Text style={styles.nextText}>{nextLabel}</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Validation Message */}
      {!!validationMessage && (
        <Text style={styles.validation}>{validationMessage}</Text>
      )}
    </View>
  );
};

export default StepNavigation;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: SPACING.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F3F4F6',
    borderRadius: BORDER_RADIUS.md,
  },
  backText: {
    color: '#374151',
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.button,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#111827',  // Dark theme to match Motor 2
    borderRadius: BORDER_RADIUS.md,
  },
  nextDisabled: {
    opacity: 0.5,
  },
  nextText: {
    color: '#fff',
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.button,
  },
  validation: {
    color: '#DC2626',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    fontSize: FONT_SIZES.body,
  },
});
