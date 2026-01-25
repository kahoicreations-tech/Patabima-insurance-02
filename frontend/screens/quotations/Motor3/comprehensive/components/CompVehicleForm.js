/**
 * CompVehicleForm - Comprehensive vehicle details form
 * Full vehicle details: Registration, Make, Model, Year, Color, Body Type, Engine#, Chassis#
 * 
 * Eliminates Motor2 mistakes:
 * - Local state for immediate UI updates (no parent re-renders)
 * - Debounced context updates (400ms)
 * - Static field configurations
 * - React.memo with custom comparator
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import StableTextInput from '../../components/StableTextInput';
import RadioGroup from '../../components/RadioGroup';
import DatePicker from '../../components/DatePicker';
import DropdownSelect from '../../components/DropdownSelect';
import VehicleMakeSelector from '../../components/VehicleMakeSelector';
import VehicleModelSelector from '../../components/VehicleModelSelector';
import { validateKenyanRegistration } from '../../utils/motor3Validation';

const CompVehicleForm = React.memo(({ 
  initialData = {}, 
  onDataChange, 
  dmvicData = null,
  isDataLocked = false 
}) => {
  // Local state for immediate UI updates
  const [registrationNumber, setRegistrationNumber] = useState(initialData.registrationNumber || '');
  const [identificationType, setIdentificationType] = useState(initialData.identificationType || 'Vehicle Registration');
  const [make, setMake] = useState(initialData.make || '');
  const [model, setModel] = useState(initialData.model || '');
  const [manualMake, setManualMake] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [year, setYear] = useState(initialData.year || '');
  const [color, setColor] = useState(initialData.color || '');
  const [bodyType, setBodyType] = useState(initialData.bodyType || '');
  const [engineNumber, setEngineNumber] = useState(initialData.engineNumber || '');
  const [chasisNumber, setChasisNumber] = useState(initialData.chasisNumber || '');
  const [logbookNumber, setLogbookNumber] = useState(initialData.logbookNumber || '');
  const [localCoverDate, setLocalCoverDate] = useState(initialData.cover_start_date || '');
  const [financialInterest, setFinancialInterest] = useState(initialData.financialInterest || 'No');

  // Refs for debouncing
  const debounceTimerRef = useRef(null);
  const lastNotifiedDataRef = useRef(null);

  // Static options (never change)
  const identificationOptions = useMemo(() => [
    { label: 'Vehicle Registration', value: 'Vehicle Registration' },
    { label: 'Logbook Number', value: 'Logbook Number' },
  ], []);

  const financialInterestOptions = useMemo(() => [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
  ], []);

  const bodyTypeOptions = useMemo(() => [
    { label: 'Saloon', value: 'Saloon' },
    { label: 'Station Wagon', value: 'Station Wagon' },
    { label: 'SUV', value: 'SUV' },
    { label: 'Pickup', value: 'Pickup' },
    { label: 'Van', value: 'Van' },
    { label: 'Other', value: 'Other' },
  ], []);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 30; i++) {
       const y = (currentYear - i).toString();
       years.push({ label: y, value: y });
    }
    return years;
  }, []);

  // Auto-fill from DMVIC data if available
  useEffect(() => {
    if (dmvicData && !isDataLocked) {
      setMake(dmvicData.make || make);
      setModel(dmvicData.model || model);
      setYear(dmvicData.year || year);
      setColor(dmvicData.color || color);
      setBodyType(dmvicData.bodyType || bodyType);
      setEngineNumber(dmvicData.engineNumber || engineNumber);
      setChasisNumber(dmvicData.chasisNumber || chasisNumber);
      setLogbookNumber(dmvicData.logbookNumber || logbookNumber);
    }
  }, [dmvicData]);

  // Debounced notification to parent
  const notifyParent = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const finalMake = make === 'Other' ? manualMake.trim() : make.trim();
      const finalModel = model === 'Other' ? manualModel.trim() : model.trim();

      const currentData = {
        registrationNumber: registrationNumber.trim().toUpperCase(),
        identificationType,
        make: finalMake,
        model: finalModel,
        year: year.trim(),
        color: color.trim(),
        bodyType,
        engineNumber: engineNumber.trim(),
        chasisNumber: chasisNumber.trim(),
        logbookNumber: logbookNumber.trim(),
        cover_start_date: localCoverDate,
        financialInterest,
      };

      const dataStr = JSON.stringify(currentData);
      if (dataStr !== lastNotifiedDataRef.current) {
        lastNotifiedDataRef.current = dataStr;
        onDataChange && onDataChange(currentData);
      }
    }, 400); // 400ms debounce
  }, [
    registrationNumber, identificationType, make, model, manualMake, manualModel, year, color,
    bodyType, engineNumber, chasisNumber, logbookNumber, localCoverDate,
    financialInterest, onDataChange
  ]);

  // Trigger notification on any field change
  useEffect(() => {
    notifyParent();
  }, [
    registrationNumber, identificationType, make, model, manualMake, manualModel, year, color,
    bodyType, engineNumber, chasisNumber, logbookNumber, localCoverDate,
    financialInterest
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.section}>
        <RadioGroup
          label="Financial Interest (Bank Loan)"
          options={financialInterestOptions}
          value={financialInterest}
          onValueChange={setFinancialInterest}
          required
          horizontal={true}
        />

        <RadioGroup
          label="Identification Type"
          options={identificationOptions}
          value={identificationType}
          onValueChange={setIdentificationType}
          required
          horizontal={true}
        />

        <StableTextInput
          label={identificationType === 'Vehicle Registration' ? 'Vehicle Registration Number' : 'Logbook Number'}
          value={identificationType === 'Vehicle Registration' ? registrationNumber : logbookNumber}
          onChangeText={identificationType === 'Vehicle Registration' ? setRegistrationNumber : setLogbookNumber}
          placeholder={identificationType === 'Vehicle Registration' ? 'e.g., KDA 123A' : 'e.g., 12345678'}
          autoCapitalize="characters"
          required
          validate={identificationType === 'Vehicle Registration' ? validateKenyanRegistration : undefined}
          editable={!isDataLocked}
        />

        <DatePicker
          label="Cover Start Date"
          value={localCoverDate}
          onDateChange={setLocalCoverDate}
          minDate={new Date()}
          required
        />

        <VehicleMakeSelector
          value={make}
          onValueChange={(val) => {
            setMake(val);
            setModel(''); // Reset model when make changes
          }}
          required
          disabled={isDataLocked}
        />

        {make === 'Other' && (
          <StableTextInput
            label="Specify Make"
            value={manualMake}
            onChangeText={setManualMake}
            placeholder="e.g., Hyundai"
            required
            editable={!isDataLocked}
          />
        )}

        <VehicleModelSelector
          value={model}
          onValueChange={setModel}
          selectedMake={make}
          required
          disabled={isDataLocked}
        />

        {(model === 'Other' || make === 'Other') && (
          <StableTextInput
            label="Specify Model"
            value={manualModel}
            onChangeText={setManualModel}
            placeholder="e.g., Santa Fe"
            required
            editable={!isDataLocked}
          />
        )}

        <DropdownSelect
          label="Year of Manufacture"
          value={year}
          onValueChange={setYear}
          options={yearOptions}
          placeholder="Select Year"
          required
          searchable
          disabled={isDataLocked}
        />

        <StableTextInput
          label="Color"
          value={color}
          onChangeText={setColor}
          placeholder="e.g., Silver"
          required
          editable={!isDataLocked}
        />

        <DropdownSelect
          label="Body Type"
          value={bodyType}
          onValueChange={setBodyType}
          options={bodyTypeOptions}
          placeholder="Select Body Type"
          required
          disabled={isDataLocked}
        />

        <StableTextInput
          label="Engine Number"
          value={engineNumber}
          onChangeText={setEngineNumber}
          placeholder="e.g., 1NZ1234567"
          autoCapitalize="characters"
          editable={!isDataLocked}
        />

        <StableTextInput
          label="Chassis Number"
          value={chasisNumber}
          onChangeText={setChasisNumber}
          placeholder="e.g., NZE121-1234567"
          autoCapitalize="characters"
          editable={!isDataLocked}
        />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - exclude function props
  return (
    prevProps.dmvicData === nextProps.dmvicData &&
    prevProps.isDataLocked === nextProps.isDataLocked &&
    JSON.stringify(prevProps.initialData) === JSON.stringify(nextProps.initialData)
  );
});

CompVehicleForm.displayName = 'CompVehicleForm';

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150, // Extra padding for keyboard
  },
  section: {
    padding: 16,
  },
});

export default CompVehicleForm;
