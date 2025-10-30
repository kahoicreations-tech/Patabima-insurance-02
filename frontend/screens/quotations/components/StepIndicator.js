import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../../constants';

/**
 * StepIndicator component for multi-step forms
 * @param {number} currentStep - Current active step
 * @param {number} totalSteps - Total number of steps
 * @param {function} onStepPress - Callback when a step is pressed
 * @param {boolean} paymentCompleted - Whether payment is completed (for final step)
 */
const StepIndicator = ({ currentStep, totalSteps, onStepPress, paymentCompleted = false }) => {
  return (
    <View style={styles.stepperContainer}>
      {[...Array(totalSteps)].map((_, index) => {
        const stepNumber = index + 1;
        return (
          <View key={stepNumber} style={styles.stepperItem}>
            <TouchableOpacity
              style={[
                styles.stepperCircle,
                currentStep >= stepNumber && styles.stepperCircleActive,
                currentStep === stepNumber && styles.stepperCircleCurrent,
                paymentCompleted && stepNumber === totalSteps && styles.stepperCircleComplete
              ]}
              onPress={() => onStepPress(stepNumber)}
              disabled={stepNumber > currentStep}
            >
              <Text
                style={[
                  styles.stepperNumber,
                  (currentStep >= stepNumber || paymentCompleted && stepNumber === totalSteps) && styles.stepperNumberActive
                ]}
              >
                {paymentCompleted && stepNumber === totalSteps ? '✓' : stepNumber}
              </Text>
            </TouchableOpacity>
            
            {stepNumber < totalSteps && (
              <View
                style={[
                  styles.stepperLine,
                  currentStep > stepNumber && styles.stepperLineActive
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12, // Reduced from 16 to 12 for more compact design
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepperItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 1,
  },
  stepperCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepperCircleCurrent: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  stepperCircleComplete: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepperNumber: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  stepperNumberActive: {
    color: Colors.white,
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: -5,
  },
  stepperLineActive: {
    backgroundColor: Colors.primary,
  },
});

export default StepIndicator;
