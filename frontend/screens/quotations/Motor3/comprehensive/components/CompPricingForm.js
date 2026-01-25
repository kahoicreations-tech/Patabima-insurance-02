/**
 * CompPricingForm - Comprehensive pricing inputs form
 * Sum Insured, Windscreen, Radio/Cassette, Add-ons, Instalments
 * 
 * Triggers underwriter comparison when sum_insured >= 500,000
 * 
 * Eliminates Motor2 mistakes:
 * - Local state for immediate UI updates
 * - Debounced comparison trigger (1000ms)
 * - Static add-on configurations
 * - Smart comparison key (only pricing fields)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import CurrencyInput from '../../components/CurrencyInput';
import CheckboxGroup from '../../components/CheckboxGroup';
import RadioGroup from '../../components/RadioGroup';

const CompPricingForm = React.memo(({ 
  initialData = {}, 
  onDataChange,
  onTriggerComparison 
}) => {
  // Local state for immediate UI updates
  const [sumInsured, setSumInsured] = useState(initialData.sum_insured || '');
  const [windscreenValue, setWindscreenValue] = useState(initialData.windscreen_value || '');
  const [radioCassetteValue, setRadioCassetteValue] = useState(initialData.radio_cassette_value || '');
  const [selectedAddons, setSelectedAddons] = useState(initialData.add_ons || []);
  const [instalmentOption, setInstalmentOption] = useState(initialData.instalment_option || 'None');

  // Refs for debouncing and comparison tracking
  const debounceTimerRef = useRef(null);
  const comparisonTimerRef = useRef(null);
  const lastNotifiedDataRef = useRef(null);
  const lastComparisonKeyRef = useRef(null);

  // Static add-on options
  const addonOptions = useMemo(() => [
    { label: 'Windscreen Cover', value: 'windscreen', description: 'Covers windscreen damage' },
    { label: 'Radio/Cassette Cover', value: 'radio', description: 'Covers radio/cassette theft' },
    { label: 'Excess Protector', value: 'excess_protector', description: 'Waives excess on claims' },
    { label: 'Political Violence & Terrorism (PVT)', value: 'pvt', description: 'Covers political violence' },
    { label: 'Loss of Use', value: 'loss_of_use', description: 'Covers alternative transport' },
  ], []);

  const instalmentOptions = useMemo(() => [
    { label: 'None (Full Payment)', value: 'None' },
    { label: '3 Instalments (40-30-30)', value: '3_instalments' },
    { label: '4 Instalments (25-25-25-25)', value: '4_instalments' },
  ], []);

  // Validation
  const sumInsuredError = useMemo(() => {
    const value = parseFloat(sumInsured);
    if (isNaN(value) || value < 500000) {
      return 'Sum insured must be at least KSh 500,000';
    }
    return null;
  }, [sumInsured]);

  const windscreenError = useMemo(() => {
    if (!windscreenValue) return null;
    const value = parseFloat(windscreenValue);
    if (isNaN(value) || value > 30000) {
      return 'Windscreen value cannot exceed KSh 30,000';
    }
    return null;
  }, [windscreenValue]);

  const radioError = useMemo(() => {
    if (!radioCassetteValue) return null;
    const value = parseFloat(radioCassetteValue);
    if (isNaN(value) || value < 30000) {
      return 'Radio/Cassette value must be at least KSh 30,000';
    }
    return null;
  }, [radioCassetteValue]);

  // Debounced notification to parent
  const notifyParent = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentData = {
        sum_insured: sumInsured,
        windscreen_value: windscreenValue,
        radio_cassette_value: radioCassetteValue,
        add_ons: selectedAddons,
        instalment_option: instalmentOption,
      };

      const dataStr = JSON.stringify(currentData);
      if (dataStr !== lastNotifiedDataRef.current) {
        lastNotifiedDataRef.current = dataStr;
        onDataChange && onDataChange(currentData);
      }
    }, 400);
  }, [sumInsured, windscreenValue, radioCassetteValue, selectedAddons, instalmentOption, onDataChange]);

  // Trigger notification on any field change
  useEffect(() => {
    notifyParent();
  }, [sumInsured, windscreenValue, radioCassetteValue, selectedAddons, instalmentOption]);

  // Smart comparison trigger (only on pricing fields, after validation)
  const triggerComparison = useCallback(() => {
    // Only trigger if sum insured is valid
    const sumInsuredValue = parseFloat(sumInsured);
    if (isNaN(sumInsuredValue) || sumInsuredValue < 500000) {
      return;
    }

    // Create comparison key from pricing-critical fields
    const comparisonKey = JSON.stringify({
      sum_insured: sumInsuredValue,
      windscreen: windscreenValue || 0,
      radio: radioCassetteValue || 0,
      addons: selectedAddons.sort(),
    });

    // Only trigger if comparison key changed
    if (comparisonKey === lastComparisonKeyRef.current) {
      return;
    }

    if (comparisonTimerRef.current) {
      clearTimeout(comparisonTimerRef.current);
    }

    comparisonTimerRef.current = setTimeout(() => {
      lastComparisonKeyRef.current = comparisonKey;
      onTriggerComparison && onTriggerComparison({
        sum_insured: sumInsuredValue,
        windscreen_value: windscreenValue ? parseFloat(windscreenValue) : 0,
        radio_cassette_value: radioCassetteValue ? parseFloat(radioCassetteValue) : 0,
        add_ons: selectedAddons,
      });
    }, 1000); // 1 second debounce for comparison
  }, [sumInsured, windscreenValue, radioCassetteValue, selectedAddons, onTriggerComparison]);

  // Trigger comparison when pricing fields change
  useEffect(() => {
    triggerComparison();
  }, [sumInsured, windscreenValue, radioCassetteValue, selectedAddons]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (comparisonTimerRef.current) clearTimeout(comparisonTimerRef.current);
    };
  }, []);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Value</Text>
        
        <CurrencyInput
          label="Sum Insured (Vehicle Value)"
          value={sumInsured}
          onChangeValue={setSumInsured}
          placeholder="e.g., 1,500,000"
          required
          error={sumInsuredError}
          helperText="Minimum KSh 500,000"
        />

        <Text style={styles.sectionTitle}>Optional Covers</Text>

        <CurrencyInput
          label="Windscreen Value"
          value={windscreenValue}
          onChangeValue={setWindscreenValue}
          placeholder="e.g., 15,000"
          error={windscreenError}
          helperText="Maximum KSh 30,000"
        />

        <CurrencyInput
          label="Radio/Cassette Value"
          value={radioCassetteValue}
          onChangeValue={setRadioCassetteValue}
          placeholder="e.g., 50,000"
          error={radioError}
          helperText="Minimum KSh 30,000 if applicable"
        />

        <Text style={styles.sectionTitle}>Additional Add-ons</Text>
        
        <CheckboxGroup
          options={addonOptions}
          selectedValues={selectedAddons}
          onValuesChange={setSelectedAddons}
        />

        <Text style={styles.sectionTitle}>Payment Plan</Text>

        <RadioGroup
          label="Instalment Option"
          options={instalmentOptions}
          selectedValue={instalmentOption}
          onValueChange={setInstalmentOption}
        />

        {instalmentOption !== 'None' && (
          <View style={styles.instalmentInfo}>
            <Text style={styles.instalmentText}>
              {instalmentOption === '3_instalments' 
                ? '40% upfront, 30% after 4 months, 30% after 8 months'
                : '25% upfront, 25% after 3 months, 25% after 6 months, 25% after 9 months'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.initialData) === JSON.stringify(nextProps.initialData);
});

CompPricingForm.displayName = 'CompPricingForm';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  instalmentInfo: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  instalmentText: {
    fontSize: 14,
    color: '#646767',
  },
});

export default CompPricingForm;
