/**
 * ComprehensiveFlow - Orchestrator for Comprehensive insurance flow
 * 8 Steps: Category → Vehicle → Pricing → Underwriter → Client → Docs → Payment → Submit
 * 
 * Wraps ComprehensiveProvider for flow-specific state
 * Uses same step pattern as ThirdPartyFlow
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ComprehensiveProvider } from '../contexts/ComprehensiveContext';
import { useMotor3 } from '../contexts/Motor3Context';

// Step components
import Step2_VehicleDetails from './steps/Step2_VehicleDetails';
import Step3_PricingInputs from './steps/Step3_PricingInputs';
import Step4_UnderwriterSelection from './steps/Step4_UnderwriterSelection';
import Step5_ClientDetails from './steps/Step5_ClientDetails';
import Step6_DocumentUpload from './steps/Step6_DocumentUpload';
import Step7_Review from './steps/Step7_Review';
import Step8_Payment from './steps/Step8_Payment';
import Step9_Submission from './steps/Step9_Submission';

// ComprehensiveFlow is rendered only after a subcategory is selected.
// Motor3Container handles Category/Subcategory selection via ThirdPartyFlow.
// This flow therefore starts at Vehicle Details.
const TOTAL_STEPS = 8;

const ComprehensiveFlowContent = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { setCategorySelection } = useMotor3();

  const goToNextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      return;
    }

    // At first step of Comprehensive flow, go back to product selection.
    setCategorySelection(null, null);
  };

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < TOTAL_STEPS) {
      setCurrentStep(stepIndex);
    }
  };

  const renderStep = () => {
    const stepProps = {
      onNext: goToNextStep,
      onBack: goToPreviousStep,
      goToStep,
      currentStep: currentStep + 1,
      totalSteps: TOTAL_STEPS,
    };

    switch (currentStep) {
      case 0:
        return <Step2_VehicleDetails {...stepProps} />;
      case 1:
        return <Step3_PricingInputs {...stepProps} />;
      case 2:
        return <Step4_UnderwriterSelection {...stepProps} />;
      case 3:
        return <Step5_ClientDetails {...stepProps} />;
      case 4:
        return <Step6_DocumentUpload {...stepProps} />;
      case 5:
        return <Step7_Review {...stepProps} />;
      case 6:
        return <Step8_Payment {...stepProps} />;
      case 7:
        return <Step9_Submission {...stepProps} />;
      case 8:
      default:
        return <Step2_VehicleDetails {...stepProps} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
    </View>
  );
};

const ComprehensiveFlow = () => {
  return (
    <ComprehensiveProvider>
      <ComprehensiveFlowContent />
    </ComprehensiveProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default ComprehensiveFlow;
