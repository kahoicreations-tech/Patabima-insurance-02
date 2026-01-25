/**
 * Step3_PricingInputs - Comprehensive Flow
 * Renders CompPricingForm for sum insured, add-ons, instalments
 * Triggers underwriter comparison when pricing is valid
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useMotor3 } from '../../contexts/Motor3Context';
import { useComprehensiveContext } from '../../contexts/ComprehensiveContext';
import CompPricingForm from '../components/CompPricingForm';
import useCompUnderwriters from '../hooks/useCompUnderwriters';
import StepNavigation from '../../third-party/steps/StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';

const Step3_PricingInputs = ({ onNext, onBack, currentStep, totalSteps }) => {
  const { selectedSubcategory } = useMotor3();
  const { pricingInputs, vehicleDetails, setPricingInputs, setUnderwriters } = useComprehensiveContext();
  const [formData, setFormData] = useState(pricingInputs);

  const { underwriters, comparing } = useCompUnderwriters(
    selectedSubcategory?.subcategory_code,
    { ...vehicleDetails, ...formData }
  );

  const handleDataChange = (data) => {
    setFormData(data);
    setPricingInputs(data);
  };

  const handleTriggerComparison = (pricingData) => {
    // Comparison automatically triggered by useCompUnderwriters hook
    console.log('[Step3] Triggering comparison with:', pricingData);
  };

  const validateAndProceed = () => {
    const sumInsuredValue = parseFloat(formData.sum_insured);
    
    if (isNaN(sumInsuredValue) || sumInsuredValue < 500000) {
      Alert.alert('Invalid Sum Insured', 'Sum insured must be at least KSh 500,000');
      return;
    }

    if (!underwriters || underwriters.length === 0) {
      Alert.alert('Loading', 'Please wait for underwriter comparison to complete');
      return;
    }

    setUnderwriters(underwriters);
    onNext();
  };

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      <CompPricingForm
        initialData={pricingInputs}
        onDataChange={handleDataChange}
        onTriggerComparison={handleTriggerComparison}
      />
      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={validateAndProceed}
        disableNext={comparing}
        nextLabel={comparing ? 'Comparing...' : 'Next'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Step3_PricingInputs;
