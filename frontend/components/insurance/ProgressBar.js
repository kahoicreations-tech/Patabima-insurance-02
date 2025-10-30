/**
 * ProgressBar Component
 * 
 * Shows form progress across multiple steps
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ProgressBar = ({ currentStep, totalSteps, showStepNumbers = true }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {showStepNumbers && (
        <View style={styles.stepNumbers}>
          <Text style={styles.stepText}>
            Step {currentStep} of {totalSteps}
          </Text>
          <Text style={styles.percentageText}>
            {Math.round(progressPercentage)}% Complete
          </Text>
        </View>
      )}
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.stepDots}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              index + 1 <= currentStep ? styles.completedDot : styles.pendingDot,
              index + 1 === currentStep && styles.currentDot
            ]}
          >
            <Text style={[
              styles.dotText,
              index + 1 <= currentStep ? styles.completedDotText : styles.pendingDotText
            ]}>
              {index + 1}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  percentageText: {
    fontSize: 12,
    color: '#666',
  },
  progressBarContainer: {
    marginBottom: 15,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D5222B',
    borderRadius: 3,
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  completedDot: {
    backgroundColor: '#D5222B',
    borderColor: '#D5222B',
  },
  currentDot: {
    backgroundColor: 'white',
    borderColor: '#D5222B',
    borderWidth: 3,
  },
  pendingDot: {
    backgroundColor: 'white',
    borderColor: '#e0e0e0',
  },
  dotText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedDotText: {
    color: 'white',
  },
  pendingDotText: {
    color: '#999',
  },
});

export default ProgressBar;