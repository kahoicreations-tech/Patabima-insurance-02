/**
 * Step2_VehicleDetails - Comprehensive Flow
 * Renders CompVehicleForm for full vehicle details
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useComprehensiveContext } from '../../contexts/ComprehensiveContext';
import { useMotor3 } from '../../contexts/Motor3Context';
import CompVehicleForm from '../components/CompVehicleForm';
import StepNavigation from '../../third-party/steps/StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';

const Step2_VehicleDetails = ({ onNext, onBack, currentStep, totalSteps }) => {
  const { vehicleDetails, setVehicleDetails } = useComprehensiveContext();
  const { showSnackbar } = useMotor3();
  const [formData, setFormData] = useState(vehicleDetails);

  const handleDataChange = (data) => {
    setFormData(data);
    setVehicleDetails(data);
  };

  const validateAndProceed = () => {
    const required = ['registrationNumber', 'identificationType', 'cover_start_date', 
                     'make', 'model', 'year', 'color', 'bodyType', 'financialInterest'];
    
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      showSnackbar('Please fill in all required vehicle details', 'error');
      return;
    }

    onNext();
  };

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      <CompVehicleForm
        initialData={vehicleDetails}
        onDataChange={handleDataChange}
      />
      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={validateAndProceed}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Step2_VehicleDetails;
