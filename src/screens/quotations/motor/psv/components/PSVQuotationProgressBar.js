/**
 * PSV Quotation Progress Bar Component
 * Shows progress through PSV insurance quotation steps
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const PSVQuotationProgressBar = ({ currentStep, totalSteps, steps = [] }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>

      {/* Step Indicators */}
      {steps.length > 0 && (
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <View key={step.id} style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  isCompleted && styles.completedStep,
                  isCurrent && styles.currentStep,
                  isUpcoming && styles.upcomingStep
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  ) : (
                    <Text style={[
                      styles.stepNumber,
                      isCurrent && styles.currentStepNumber,
                      isUpcoming && styles.upcomingStepNumber
                    ]}>
                      {stepNumber}
                    </Text>
                  )}
                </View>
                
                <View style={styles.stepInfo}>
                  <Text style={[
                    styles.stepTitle,
                    isCurrent && styles.currentStepTitle,
                    isUpcoming && styles.upcomingStepTitle
                  ]}>
                    {step.title}
                  </Text>
                  {step.description && (
                    <Text style={styles.stepDescription}>
                      {step.description}
                    </Text>
                  )}
                </View>

                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <View style={[
                    styles.connectionLine,
                    isCompleted && styles.completedLine
                  ]} />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBarContainer: {
    marginBottom: Spacing.md,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 2,
  },
  completedStep: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  currentStep: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  upcomingStep: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  stepNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    fontFamily: 'Poppins_600SemiBold',
  },
  currentStepNumber: {
    color: Colors.white,
  },
  upcomingStepNumber: {
    color: Colors.textSecondary,
  },
  stepInfo: {
    alignItems: 'center',
    maxWidth: 80,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
  },
  currentStepTitle: {
    color: Colors.primary,
  },
  upcomingStepTitle: {
    color: Colors.textSecondary,
  },
  stepDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  connectionLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  completedLine: {
    backgroundColor: Colors.success,
  },
});

export default PSVQuotationProgressBar;
