/**
 * Commercial Quotation Progress Bar Component
 * Shows progress through commercial vehicle insurance quotation steps
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { Colors, Typography, Spacing } from '../../../../../constants';

const CommercialQuotationProgressBar = ({ 
  currentStep = 0, 
  totalSteps = 6,
  stepTitles = []
}) => {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Commercial Insurance Application</Text>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {totalSteps}
          {stepTitles[currentStep] && `: ${stepTitles[currentStep]}`}
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{Math.round(progressPercentage)}%</Text>
      </View>

      <View style={styles.stepIndicator}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              index <= currentStep && styles.stepCircleActive,
              index === currentStep && styles.stepCircleCurrent
            ]}>
              <Text style={[
                styles.stepNumber,
                index <= currentStep && styles.stepNumberActive
              ]}>
                {index + 1}
              </Text>
            </View>
            {index < totalSteps - 1 && (
              <View style={[
                styles.stepLine,
                index < currentStep && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.lightGray,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  progressHeader: {
    marginBottom: Spacing.md,
  },
  progressTitle: {
    ...Typography.h4,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.gray,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.white,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  percentageText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  stepCircleCurrent: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  stepNumber: {
    ...Typography.caption,
    color: Colors.gray,
    fontWeight: 'bold',
    fontSize: 10,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: Colors.gray,
    marginHorizontal: 3,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
});

export default CommercialQuotationProgressBar;
