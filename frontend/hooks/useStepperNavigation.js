import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

/**
 * Custom hook for managing stepper navigation in multi-step forms
 */
export const useStepperNavigation = (totalSteps = 5, validateStepFn = () => true) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Move to next step with validation
  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      // Validate current step before proceeding
      const isValid = validateStepFn(currentStep);
      
      if (isValid) {
        setCurrentStep(prev => prev + 1);
        return true;
      }
      return false;
    }
    return false;
  }, [currentStep, totalSteps, validateStepFn]);
  
  // Move to previous step
  const goToPrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentStep]);
  
  // Go to specific step
  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      return true;
    }
    return false;
  }, [totalSteps]);
  
  // Reset to first step
  const resetSteps = useCallback(() => {
    setCurrentStep(1);
  }, []);
  
  // Calculate progress percentage
  const progress = (currentStep - 1) / (totalSteps - 1);
  
  return {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    resetSteps,
    progress,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps
  };
};

export default useStepperNavigation;
