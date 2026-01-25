import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useMotor3 } from '../../contexts/Motor3Context';
import RadioGroup from '../../components/RadioGroup';
import StepNavigation from './StepNavigation';
import { UI, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../../../../theme';
import Motor3Stepper from '../../components/Motor3Stepper';

const Step4_ClientDetails = ({ onNext, onBack, currentStep, totalSteps }) => {
  const {
    clientDetailsSource: savedClientDetailsSource,
    setClientDetailsSource,
    vehicleDetailsSource: savedVehicleDetailsSource,
    setVehicleDetailsSource,
  } = useMotor3();

  const [clientDetailsSource, setClientDetailsSourceLocal] = useState(savedClientDetailsSource || 'Logbook');
  const [vehicleDetailsSource, setVehicleDetailsSourceLocal] = useState(savedVehicleDetailsSource || 'Logbook');

  const clientSourceOptions = [
    { label: 'Logbook', value: 'Logbook' },
    { label: 'KRA PIN Certificate', value: 'KRA PIN Certificate' }
  ];

  const vehicleSourceOptions = [
    { label: 'Logbook', value: 'Logbook' },
  ];

  const handleNext = useCallback(() => {
    setClientDetailsSource(clientDetailsSource);
    setVehicleDetailsSource(vehicleDetailsSource);
    onNext();
  }, [clientDetailsSource, onNext, setClientDetailsSource, setVehicleDetailsSource, vehicleDetailsSource]);

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.headerTitle}>Client Details</Text>

        {/* Client Details Source Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Client Details as Per</Text>
          <RadioGroup
            options={clientSourceOptions}
            value={clientDetailsSource}
            onValueChange={(val) => {
              setClientDetailsSourceLocal(val);
              setClientDetailsSource(val);
            }}
          />
        </View>

        {/* Vehicle Details Source Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Vehicle Details as Per</Text>
          <RadioGroup
            options={vehicleSourceOptions}
            value={vehicleDetailsSource}
            onValueChange={(val) => {
              setVehicleDetailsSourceLocal(val);
              setVehicleDetailsSource(val);
            }}
          />
        </View>

      </ScrollView>

      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onBack={onBack}
      />
    </View>
  );
};

export default Step4_ClientDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
    color: UI.textPrimary,
    marginBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  label: {
    fontSize: FONT_SIZES.label,
    fontWeight: FONT_WEIGHTS.semibold,
    color: UI.textSecondary,
    marginBottom: SPACING.md,
  },
});
