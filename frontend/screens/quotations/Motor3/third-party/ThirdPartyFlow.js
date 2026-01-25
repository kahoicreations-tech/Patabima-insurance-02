/**
 * ThirdPartyFlow - Main orchestrator for Third Party insurance flow
 * Eliminates Motor2 mistakes:
 * 1. Single context provider (ThirdPartyProvider)
 * 2. Step-based navigation (no monolithic form)
 * 3. Validation per step (not at end)
 * 4. Clean separation from Motor3Context
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThirdPartyProvider, useThirdParty } from '../contexts/ThirdPartyContext';
import { useMotor3 } from '../contexts/Motor3Context';
import { validateStep } from '../utils/stepValidation';

// Step components
import Step1_CategorySelection from './steps/Step1_CategorySelection';
import Step1b_SubcategorySelection from './steps/Step1b_SubcategorySelection';
import Step2_VehicleDetails from './steps/Step2_VehicleDetails';
import Step3_UnderwriterSelection from './steps/Step3_UnderwriterSelection';
import Step4_ClientDetails from './steps/Step4_ClientDetails';
import Step5_DocumentUpload from './steps/Step5_DocumentUpload';
import Step6_Review from './steps/Step6_Review';
import Step7_Payment from './steps/Step7_Payment';
import Step8_Submission from './steps/Step8_Submission';

const STEPS = [
  { id: 1, component: Step1_CategorySelection, title: 'Category' },
  { id: 2, component: Step1b_SubcategorySelection, title: 'Subcategory' },
  { id: 3, component: Step2_VehicleDetails, title: 'Vehicle Details' },
  { id: 4, component: Step3_UnderwriterSelection, title: 'Select Underwriter' },
  { id: 5, component: Step4_ClientDetails, title: 'Client Details' },
  { id: 6, component: Step5_DocumentUpload, title: 'Upload Documents' },
  { id: 7, component: Step6_Review, title: 'Review & Confirm' },
  { id: 8, component: Step7_Payment, title: 'Payment' },
  { id: 9, component: Step8_Submission, title: 'Submit Quote' },
];

const ThirdPartyFlowContent = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const motor3State = useMotor3();
  const thirdPartyState = useThirdParty();

  // Step validation with helpful messages
  // Skip validation for Step 1 & 2 (selection steps). Step 3 validates vehicle inputs.
  const { canProceed, validationMessage } = useMemo(() => {
    // Allow Step 1 (Category) and Step 2 (Subcategory) without validation
    if (currentStep === 1 || currentStep === 2) {
      return { canProceed: true, validationMessage: '' };
    }
    
    const validation = validateStep(currentStep, motor3State, thirdPartyState);
    console.log(`[ThirdPartyFlow] Step ${currentStep} validation:`, validation);
    return validation;
  }, [currentStep, motor3State, thirdPartyState]);

  // Navigate to next step (with validation)
  const goToNextStep = useCallback(() => {
    console.log(`[ThirdPartyFlow] goToNextStep called from step ${currentStep}`);
    console.log('[ThirdPartyFlow] canProceed:', canProceed, 'validationMessage:', validationMessage);
    console.log('[ThirdPartyFlow] motor3State.selectedCategory:', motor3State.selectedCategory);
    
    if (!canProceed) {
      console.warn('[ThirdPartyFlow] Cannot proceed:', validationMessage);
      return;
    }
    
    const nextStep = currentStep + 1;
    console.log(`[ThirdPartyFlow] Moving to step ${nextStep}`);
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  }, [currentStep, canProceed, validationMessage, motor3State.selectedCategory]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Jump to specific step
  const goToStep = useCallback((stepNumber) => {
    setCurrentStep(stepNumber);
  }, []);

  // Get current step component
  const CurrentStepComponent = useMemo(() => {
    const step = STEPS.find(s => s.id === currentStep);
    return step?.component || Step1_CategorySelection;
  }, [currentStep]);

  return (
    <View style={styles.container}>
      {typeof CurrentStepComponent === 'function' ? (
        <CurrentStepComponent
          onNext={goToNextStep}
          onBack={goToPreviousStep}
          goToStep={goToStep}
          currentStep={currentStep}
          totalSteps={STEPS.length}
          canProceed={canProceed}
          validationMessage={validationMessage}
        />
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#D5222B', fontWeight: '700', marginBottom: 6 }}>
            Unable to render step {currentStep}
          </Text>
          <Text style={{ color: '#646767' }}>
            Component type invalid. Please go back and try again.
          </Text>
        </View>
      )}
    </View>
  );
};

const ThirdPartyFlow = () => {
  return (
    <ThirdPartyProvider>
      <ThirdPartyFlowContent />
    </ThirdPartyProvider>
  );
};

export default ThirdPartyFlow;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
});
