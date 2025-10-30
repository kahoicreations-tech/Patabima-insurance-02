import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../../constants';

/**
 * Navigation buttons for multi-step forms
 * @param {function} onBack - Callback for back button
 * @param {function} onContinue - Callback for continue button
 * @param {boolean} isFirstStep - Whether current step is the first one
 * @param {boolean} isLastStep - Whether current step is the last one
 * @param {boolean} continueDisabled - Whether continue button should be disabled
 * @param {string} continueText - Text for continue button
 * @param {string} finalText - Text for final button (last step)
 */
const FormNavigation = ({
  onBack,
  onContinue,
  isFirstStep = false,
  isLastStep = false,
  continueDisabled = false,
  continueText = 'Continue',
  finalText = 'Submit'
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.navigationButtons}>
        {!isFirstStep ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}
        
        <TouchableOpacity 
          style={[
            styles.continueButton, 
            continueDisabled && styles.disabledButton,
            isLastStep && styles.finalButton
          ]}
          onPress={onContinue}
          disabled={continueDisabled}
        >
          <Text style={styles.continueButtonText}>
            {isLastStep ? finalText : continueText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderButton: {
    minWidth: 100,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  backButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  continueButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    marginLeft: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.disabled,
  },
  finalButton: {
    backgroundColor: Colors.success,
  },
  continueButtonText: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontWeight: '500',
  },
});

export default FormNavigation;
