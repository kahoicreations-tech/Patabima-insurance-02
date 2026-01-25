/**
 * TPVehicleForm - Complete Third Party Vehicle Details Form
 * ALL fields from Motor2 Dynamic VehicleForm, same flow, same styling
 * Improvements: Enhanced components, better validation, same visual appearance
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import {
  StableTextInput,
  RadioGroup,
  DatePicker,
  DropdownSelect,
  VehicleMakeSelector,
  VehicleModelSelector,
  VehicleYearSelector,
  TonnageSelector,
  PassengerCapacityInput,
} from '../../components';
import { useThirdParty } from '../../contexts/ThirdPartyContext';
import { useMotor3 } from '../../contexts/Motor3Context';
import { useTPUnderwriters } from '../hooks/useTPUnderwriters';
import {
  validateKenyanRegistration,
  validateChassisNumber,
  validateCoverStartDate,
  validateRequired,
} from '../../utils/enhancedValidation';
import { VEHICLE_MAKES, getModelsForMake } from '../../../../../constants/vehicleCatalog';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, FONT_FAMILIES, UI } from '../../../../../theme';

const TPVehicleForm = ({ subcategoryCode, onUnderwritersLoaded }) => {
  console.log('[TPVehicleForm] ========================================');
  console.log('[TPVehicleForm] Component rendering');
  console.log('[TPVehicleForm] Subcategory code prop:', subcategoryCode);
  
  const {
    selectedProduct,
    registrationNumber,
    identificationType,
    cover_start_date,
    tonnage,
    capacity,
    engine_cc,
    financialInterest,
    make,
    model,
    year,
    updateField,
    updateMultipleFields,
    dmvicData,
    isDataLocked,
    unlockDMVICData,
    errors,
    setErrors,
    clearError,
  } = useThirdParty();

  const {
    selectedSubcategory,
    dmvicSearchResult,
    setDMVICSearchResult,
    setFinancialInterest: setGlobalFinancialInterest,
  } = useMotor3();
  
  console.log('[TPVehicleForm] Selected product from context:', selectedProduct);
  console.log('[TPVehicleForm] Selected subcategory from Motor3:', selectedSubcategory);
  console.log('[TPVehicleForm] ========================================');

  // Local state for immediate UI updates
  const [localRegistration, setLocalRegistration] = useState(registrationNumber || '');
  const [localCoverDate, setLocalCoverDate] = useState(cover_start_date || '');
  const [localMake, setLocalMake] = useState(make || '');
  const [localModel, setLocalModel] = useState(model || '');
  const [localYear, setLocalYear] = useState(year || '');
  const [localMakeOther, setLocalMakeOther] = useState('');
  const [localModelOther, setLocalModelOther] = useState('');

  // Sync externally-updated fields (e.g., auto-adjusted start date from existing cover drawer)
  useEffect(() => {
    setLocalCoverDate(cover_start_date || '');
  }, [cover_start_date]);

  // Default cover start date to today (Motor2-like behavior).
  // DMVIC may later push this forward to expiry+1 when existing cover is detected.
  const initializedCoverDateRef = useRef(false);
  useEffect(() => {
    if (initializedCoverDateRef.current) return;
    initializedCoverDateRef.current = true;

    if (!cover_start_date) {
      const todayISO = new Date().toISOString().split('T')[0];
      setLocalCoverDate(todayISO);
      updateField('cover_start_date', todayISO);
      clearError('cover_start_date');
    }
  }, [cover_start_date, updateField, clearError]);

  // Determine if we should show additional fields (not Third-Party/TOR)
  const isThirdPartyLike = useMemo(() => {
    const coverageType = selectedSubcategory?.coverage_type?.toLowerCase() || '';
    const code = subcategoryCode?.toLowerCase() || '';

    return (
      coverageType.includes('third_party') ||
      coverageType.includes('third-party') ||
      coverageType === 'tor' ||
      code.includes('tor') ||
      code.includes('third_party') ||
      code.includes('third-party')
    );
  }, [selectedSubcategory, subcategoryCode]);

  // Check if pricing model requires tonnage, capacity, or engine_cc
  const pricingModel = selectedSubcategory?.pricing_model || 'FIXED';
  const needsTonnage = pricingModel === 'TONNAGE' || pricingModel.includes('TONNAGE');
  const needsCapacity = pricingModel === 'PASSENGER' || pricingModel.includes('PASSENGER');
  const needsEngineCC = pricingModel === 'ENGINE_CC' || pricingModel.includes('ENGINE_CC');

  // Avoid a “flash” spinner: only show the underwriter loader if it stays loading for a moment.
  const [showUnderwriterLoader, setShowUnderwriterLoader] = useState(false);

  // Auto-load underwriters for Third Party (FIXED pricing)
  const shouldLoadUnderwriters = useMemo(() => {
    // Third Party/TOR: load immediately (FIXED pricing)
    if (isThirdPartyLike && pricingModel === 'FIXED') {
      return true;
    }

    // For other pricing models, ensure required fields filled
    if (!registrationNumber || !cover_start_date) {
      return false;
    }

    // Commercial: need tonnage
    if (needsTonnage && !tonnage) {
      return false;
    }
    // PSV: need passenger capacity
    if (needsCapacity && !capacity) {
      return false;
    }
    // Motorcycle: need engine capacity (cc)
    if (needsEngineCC && !engine_cc) {
      return false;
    }

    return true;
  }, [
    isThirdPartyLike,
    pricingModel,
    registrationNumber,
    cover_start_date,
    needsTonnage,
    needsCapacity,
    needsEngineCC,
    tonnage,
    capacity,
    engine_cc,
  ]);

  const pricingInputs = useMemo(() => {
    if (!shouldLoadUnderwriters) return null;
    return {
      cover_start_date: localCoverDate || new Date().toISOString().split('T')[0],
      tonnage,
      capacity,
      engine_cc,
    };
  }, [shouldLoadUnderwriters, localCoverDate, tonnage, capacity, engine_cc]);

  const { underwriters, loading: loadingUnderwriters } = useTPUnderwriters(
    subcategoryCode,
    pricingInputs,
    { enabled: shouldLoadUnderwriters }
  );

  useEffect(() => {
    if (!(loadingUnderwriters && shouldLoadUnderwriters)) {
      setShowUnderwriterLoader(false);
      return;
    }

    const t = setTimeout(() => {
      setShowUnderwriterLoader(true);
    }, 350);

    return () => clearTimeout(t);
  }, [loadingUnderwriters, shouldLoadUnderwriters]);

  // Notify parent when underwriters loaded
  useEffect(() => {
    if (underwriters.length > 0 && onUnderwritersLoaded) {
      onUnderwritersLoaded(underwriters);
    }
  }, [underwriters, onUnderwritersLoaded]);

  // Get identification label and placeholder based on type
  const { identLabel, identPlaceholder } = useMemo(() => {
    if (identificationType === 'Chassis Number') {
      return {
        identLabel: 'Chassis Number',
        identPlaceholder: 'Enter chassis number',
      };
    }
    return {
      identLabel: 'Vehicle Registration',
      identPlaceholder: 'e.g., KDA 123A',
    };
  }, [identificationType]);

  // Validation handlers
  const handleRegistrationChange = useCallback(
    (value) => {
      // Vehicle changed; DMVIC check must be re-run
      if (dmvicSearchResult) setDMVICSearchResult(null);

      // If the user edits/clears the plate after a DMVIC lock, clear the DMVIC vehicle data
      // so we don't keep showing a stale "Verified" state.
      const nextReg = (value || '').trim().toUpperCase();
      const lockedReg = (dmvicData?.registration_number || '').trim().toUpperCase();
      if (dmvicData && lockedReg && nextReg !== lockedReg) {
        unlockDMVICData?.();
      }

      setLocalRegistration(value);
      updateField('registrationNumber', value);
      clearError('registrationNumber');

      // Validate based on identification type
      const validator =
        identificationType === 'Chassis Number' ? validateChassisNumber : validateKenyanRegistration;

      const result = validator(value);
      if (!result.valid) {
        setErrors({ registrationNumber: result.message });
      }
    },
    [updateField, clearError, setErrors, identificationType, dmvicSearchResult, setDMVICSearchResult, dmvicData, unlockDMVICData]
  );

  const handleCoverDateChange = useCallback(
    (date) => {
      setLocalCoverDate(date);
      updateField('cover_start_date', date);
      clearError('cover_start_date');

      // Motor2 concept: cover start date adjustment happens on Vehicle Details;
      // Keep the last DMVIC result so the app can immediately detect and gate date conflicts
      // against the existing cover (expiry + 1 day). Registration changes still clear DMVIC.

      const result = validateCoverStartDate(date);
      if (!result.valid) {
        setErrors({ cover_start_date: result.message });
      }
    },
    [updateField, clearError, setErrors]
  );

  const handleIdentificationTypeChange = useCallback(
    (value) => {
      // Vehicle identifier mode changed; DMVIC check must be re-run
      if (dmvicSearchResult) setDMVICSearchResult(null);

      // Switching identifier invalidates any DMVIC lock.
      if (dmvicData) unlockDMVICData?.();

      updateField('identificationType', value);
      // Clear registration when switching type
      setLocalRegistration('');
      updateField('registrationNumber', '');
      clearError('registrationNumber');
    },
    [updateField, clearError, dmvicSearchResult, setDMVICSearchResult, dmvicData, unlockDMVICData]
  );


  const handleFinancialInterestChange = useCallback(
    (value) => {
      updateField('financialInterest', value);
      setGlobalFinancialInterest(value);
    },
    [updateField, setGlobalFinancialInterest]
  );

  // Vehicle details handlers (for non-Third-Party products)
  const handleMakeChange = useCallback(
    (value) => {
      setLocalMake(value);
      updateField('make', value);
      clearError('make');

      // Reset model when make changes
      setLocalModel('');
      updateField('model', '');
      clearError('model');
    },
    [updateField, clearError]
  );

  const handleModelChange = useCallback(
    (value) => {
      setLocalModel(value);
      updateField('model', value);
      clearError('model');
    },
    [updateField, clearError]
  );

  const handleYearChange = useCallback(
    (value) => {
      setLocalYear(value);
      updateField('year', value);
      clearError('year');
    },
    [updateField, clearError]
  );

  const handleMakeOtherChange = useCallback(
    (value) => {
      setLocalMakeOther(value);
      updateField('make_other', value);
      clearError('make_other');
    },
    [updateField, clearError]
  );

  const handleModelOtherChange = useCallback(
    (value) => {
      setLocalModelOther(value);
      updateField('model_other', value);
      clearError('model_other');
    },
    [updateField, clearError]
  );

  // Identification type options
  const identificationOptions = useMemo(
    () => [
      { value: 'Vehicle Registration', label: 'Vehicle Registration' },
      { value: 'Chassis Number', label: 'Chassis Number' },
    ],
    []
  );

  const financialInterestOptions = useMemo(
    () => [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' },
    ],
    []
  );

  // Get model options based on selected make
  const modelOptions = useMemo(() => {
    if (!localMake || localMake === 'Others') {
      return [{ value: 'Others', label: 'Other (Manual Entry)' }];
    }

    const models = getModelsForMake(localMake);
    if (!models || models.length === 0) {
      return [{ value: 'Others', label: 'Other (Manual Entry)' }];
    }

    return [
      ...models.map((m) => ({ value: m, label: m })),
      { value: 'Others', label: 'Other (Manual Entry)' },
    ];
  }, [localMake]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <RadioGroup
        label="Financial Interest"
        options={financialInterestOptions}
        value={financialInterest}
        onValueChange={handleFinancialInterestChange}
        required
        horizontal
      />

      <RadioGroup
        label="Identification Type"
        options={identificationOptions}
        value={identificationType}
        onValueChange={handleIdentificationTypeChange}
        required
        horizontal
      />

      <StableTextInput
        label={identLabel}
        value={localRegistration}
        onChangeText={handleRegistrationChange}
        placeholder={identPlaceholder}
        autoCapitalize={identificationType === 'Vehicle Registration' ? 'characters' : 'none'}
        required
        error={errors.registrationNumber}
        editable
      />

      <DatePicker
        label="Cover Start Date"
        value={localCoverDate}
        onValueChange={handleCoverDateChange}
        required
        error={errors.cover_start_date}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // +90 days
      />

      {/* Section 4: Vehicle Details (Only for non-Third-Party products) */}
      {!isThirdPartyLike && (
        <View>
          <VehicleMakeSelector
            value={localMake}
            onValueChange={handleMakeChange}
            required
            error={errors.make}
            disabled={isDataLocked}
          />

          {localMake === 'Others' && (
            <StableTextInput
              label="Specify Vehicle Make"
              value={localMakeOther}
              onChangeText={handleMakeOtherChange}
              placeholder="Enter vehicle make"
              required
              error={errors.make_other}
              autoCapitalize="words"
            />
          )}

          {localMake && localMake !== 'Others' ? (
            <>
              <DropdownSelect
                label="Vehicle Model"
                value={localModel}
                options={modelOptions}
                onValueChange={handleModelChange}
                placeholder="Select vehicle model"
                required
                searchable
                error={errors.model}
                disabled={isDataLocked}
              />

              {localModel === 'Others' && (
                <StableTextInput
                  label="Specify Vehicle Model"
                  value={localModelOther}
                  onChangeText={handleModelOtherChange}
                  placeholder="Enter vehicle model"
                  required
                  error={errors.model_other}
                  autoCapitalize="words"
                />
              )}
            </>
          ) : (
            localMake &&
            localMake !== 'Others' && (
              <StableTextInput
                label="Vehicle Model"
                value={localModel}
                onChangeText={handleModelChange}
                placeholder="Axio"
                required
                error={errors.model}
                autoCapitalize="words"
              />
            )
          )}

          <VehicleYearSelector
            value={localYear}
            onValueChange={handleYearChange}
            required
            error={errors.year}
            disabled={isDataLocked}
          />
        </View>
      )}

      {/* Section 5: Vehicle Specifications (Tonnage/Capacity/Engine CC) */}
      {(needsTonnage || needsCapacity || needsEngineCC) && (
        <View>
          {needsTonnage && (
            <TonnageSelector
              label="Vehicle Tonnage"
              value={selectedProduct?.tonnage}
              onValueChange={(value) => updateField('tonnage', value)}
              required
              error={errors.tonnage}
              maxTonnage={31}
            />
          )}

          {needsCapacity && (
            <PassengerCapacityInput
              label="Passenger Capacity"
              value={selectedProduct?.capacity}
              onValueChange={(value) => updateField('capacity', value)}
              required
              error={errors.capacity}
              minCapacity={1}
            />
          )}

          {needsEngineCC && (
            <StableTextInput
              label="Engine Capacity (cc)"
              value={String(selectedProduct?.engine_cc || '')}
              onChangeText={(value) => updateField('engine_cc', value ? parseInt(value, 10) : null)}
              placeholder="e.g., 150"
              keyboardType="numeric"
              required
              error={errors.engine_cc}
            />
          )}

          {(needsTonnage || needsCapacity || needsEngineCC) && !selectedProduct?.tonnage && !selectedProduct?.capacity && !selectedProduct?.engine_cc && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoText}>
                ℹ️ {needsTonnage ? 'Tonnage' : needsCapacity ? 'Passenger capacity' : 'Engine capacity (cc)'} is required to calculate pricing
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Underwriter Loading/Success */}
      {showUnderwriterLoader && !((isThirdPartyLike && pricingModel === 'FIXED')) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D5222B" />
          <Text style={styles.loadingText}>Loading underwriter pricing...</Text>
        </View>
      )}

      {/* Underwriter availability is shown on the next screen (Underwriter step) */}
    </ScrollView>
  );
};

// React.memo with custom comparator
export default React.memo(TPVehicleForm, (prevProps, nextProps) => {
  return prevProps.subcategoryCode === nextProps.subcategoryCode;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  dmvicBadge: {
    backgroundColor: '#E8F5E9',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 0,
    marginBottom: SPACING.md,
  },
  dmvicText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: FONT_FAMILIES.medium,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#2E7D32',
  },
  loadingContainer: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: FONT_FAMILIES.regular,
    fontWeight: FONT_WEIGHTS.regular,
    color: UI.textSecondary,
    marginTop: SPACING.md,
  },
  successBadge: {
    backgroundColor: '#E3F2FD',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 0,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  successText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: FONT_FAMILIES.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#1565C0',
  },
  infoBadge: {
    backgroundColor: '#FFF3E0',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 0,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZES.bodyLarge,
    fontFamily: FONT_FAMILIES.regular,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#E65100',
  },
});
