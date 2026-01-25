/**
 * Step5_ClientDetails - Comprehensive Flow
 * Updated to match Third Party flow with Logbook/KRA PIN options
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMotor3 } from '../../contexts/Motor3Context';
import RadioGroup from '../../components/RadioGroup';
import DropdownSelect from '../../components/DropdownSelect';
import StepNavigation from '../../third-party/steps/StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';
import { BRAND, UI, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../../../../theme';

const Step5_ClientDetails = ({ onNext, onBack, currentStep, totalSteps }) => {
  const { clientDetails, updateClientDetails } = useMotor3();
  
  const [clientDetailsSource, setClientDetailsSource] = useState('Logbook');
  const [vehicleDetailsSource, setVehicleDetailsSource] = useState('');

  const clientSourceOptions = [
    { label: 'Logbook', value: 'Logbook' },
    { label: 'KRA PIN Certificate', value: 'KRA PIN Certificate' }
  ];

  const vehicleSourceOptions = [
    { value: 'logbook', label: 'Logbook' },
    { value: 'manual', label: 'Enter Manually' },
    { value: 'id_card', label: 'ID Card' }
  ];

  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

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
            onValueChange={setClientDetailsSource}
          />
        </View>

        {/* Vehicle Details Source Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Vehicle Details as Per</Text>
          <DropdownSelect
            options={vehicleSourceOptions}
            value={vehicleDetailsSource}
            onValueChange={(value) => setVehicleDetailsSource(value)}
            placeholder="Select an item"
          />
        </View>

        {/* Logbook Banner */}
        {clientDetailsSource === 'Logbook' && (
          <View style={styles.bannerContainer}>
            <View style={styles.bannerIcon}>
              <Ionicons name="flash" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.bannerText}>
              Select the "Logbook" option to enjoy a quicker, automated application experience!
            </Text>
          </View>
        )}

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
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.sm,
  },
  bannerIcon: {
    width: SPACING.huge + SPACING.sm,
    height: SPACING.huge + SPACING.sm,
    borderRadius: (SPACING.huge + SPACING.sm) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  bannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: FONT_SIZES.body,
    lineHeight: Math.round(FONT_SIZES.body * 1.5),
    fontWeight: FONT_WEIGHTS.medium,
  },
});

export default Step5_ClientDetails;
