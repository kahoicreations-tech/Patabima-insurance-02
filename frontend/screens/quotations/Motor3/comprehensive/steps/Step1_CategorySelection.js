/**
 * Step1_CategorySelection - Comprehensive Flow
 * Reuses shared CategorySelection component
 */

import React from 'react';
import { View } from 'react-native';
import CategorySelection from '../../shared/CategorySelection/CategorySelection/MotorCategoryGrid';
import { useMotor3 } from '../../contexts/Motor3Context';
import StepNavigation from '../../third-party/steps/StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';

const Step1_CategorySelection = ({ onNext, currentStep, totalSteps }) => {
  const { setCategorySelection } = useMotor3();

  const handleCategorySelect = (category, subcategory) => {
    setCategorySelection(category, subcategory);
    onNext();
  };

  return (
    <View style={{ flex: 1 }}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      <CategorySelection onCategorySelect={handleCategorySelect} />
      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        hideBack
        hideNext
      />
    </View>
  );
};

export default Step1_CategorySelection;
