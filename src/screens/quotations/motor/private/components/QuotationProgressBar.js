/**
 * QuotationProgressBar - Reusable progress indicator for quotation flows
 * Used across all private motor insurance quotation flows
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../../../../constants';

const QuotationProgressBar = ({
  currentStep,
  totalSteps,
  stepLabels = [],
  showStepLabels = true,
  showStepNumbers = true,
  progressColor = Colors.primary,
  backgroundColor = Colors.border,
  animated = true
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: (currentStep / totalSteps) * 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue((currentStep / totalSteps) * 100);
    }
  }, [currentStep, totalSteps, animated]);

  // Default step labels if not provided
  const defaultLabels = [
    'Personal Info',
    'Vehicle Details', 
    'Vehicle Value',
    'Select Insurer',
    'Documents',
    'Payment'
  ];

  const labels = stepLabels.length > 0 ? stepLabels : defaultLabels.slice(0, totalSteps);

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarBackground, { backgroundColor }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { 
                backgroundColor: progressColor,
                width: animated 
                  ? progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    })
                  : `${(currentStep / totalSteps) * 100}%`
              },
            ]}
          />
        </View>
        
        {/* Step Indicators */}
        <View style={styles.stepIndicatorsContainer}>
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <View
                key={stepNumber}
                style={[
                  styles.stepIndicator,
                  isCompleted && [styles.completedStep, { backgroundColor: progressColor }],
                  isCurrent && [styles.currentStep, { borderColor: progressColor }],
                  isUpcoming && [styles.upcomingStep, { backgroundColor }],
                ]}
              >
                {showStepNumbers && (
                  <Text
                    style={[
                      styles.stepNumber,
                      isCompleted && styles.completedStepText,
                      isCurrent && [styles.currentStepText, { color: progressColor }],
                      isUpcoming && styles.upcomingStepText,
                    ]}
                  >
                    {stepNumber}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Step Labels */}
      {showStepLabels && (
        <View style={styles.stepLabelsContainer}>
          {labels.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <View key={stepNumber} style={styles.stepLabelContainer}>
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.completedStepLabel,
                    isCurrent && [styles.currentStepLabel, { color: progressColor }],
                    isUpcoming && styles.upcomingStepLabel,
                  ]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Progress Text */}
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressText}>
          Step {currentStep} of {totalSteps}
        </Text>
        <Text style={styles.progressPercentage}>
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  stepIndicatorsContainer: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  completedStep: {
    // backgroundColor set dynamically
  },
  currentStep: {
    backgroundColor: Colors.surface,
    // borderColor set dynamically
  },
  upcomingStep: {
    // backgroundColor set dynamically
  },
  stepNumber: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: 'Poppins_700Bold',
  },
  completedStepText: {
    color: 'white',
  },
  currentStepText: {
    // color set dynamically
  },
  upcomingStepText: {
    color: Colors.textMuted,
  },
  stepLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  stepLabelContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  completedStepLabel: {
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: 'Poppins_500Medium',
  },
  currentStepLabel: {
    // color set dynamically
    fontWeight: Typography.fontWeight.bold,
    fontFamily: 'Poppins_700Bold',
  },
  upcomingStepLabel: {
    color: Colors.textMuted,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  progressPercentage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
});

export default QuotationProgressBar;
