import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// New controlled components
import ControlledTextInput from '../../../../components/forms/ControlledTextInput';
import ControlledRadioGroup from '../../../../components/forms/ControlledRadioGroup';

// Hooks
import { useMotorFormField, useStableCallback } from '../../../../hooks/useMotorFormField';

// Services
import motorPricingService from '../../../../../services/MotorInsurancePricingService';
import djangoAPI from '../../../../../services/DjangoAPIService';

// Utils and constants
import { VEHICLE_MAKES, getModelsForMake } from '../../../../../constants/vehicleCatalog';
import {
  validateKenyanRegistration,
  validateChassisNumber,
  validateYear,
  validateSumInsured,
  validateRequired,
} from '../../../../utils/motorFormValidation';

/**
 * DynamicPolicyForm - Refactored with stable handlers and controlled components
 * 
 * Key improvements:
 * - Uses ControlledTextInput and ControlledRadioGroup for stable rendering
 * - useMotorFormField hook manages individual field state with debouncing
 * - Refs used for latest values without dependency issues
 * - All business logic preserved (DMVIC, underwriter comparison, validation)
 */
const DynamicPolicyForm = ({ 
  selectedProduct, 
  onDataChange, 
  initialData = {}, 
  values, 
  onChange, 
  errors = {}, 
  productType, 
  onUnderwriterComparison, 
  onUnderwriterSelection,
  minCoverStartDate,
  dmvicLoading,
  dmvicError,
  existingCoverData,
}) => {
  // Main form data ref (source of truth)
  const formDataRef = useRef(initialData || values || {});
  
  // Underwriter comparison state
  const [underwriterComparisons, setUnderwriterComparisons] = useState([]);
  const [comparingUnderwriters, setComparingUnderwriters] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);
  const [lastComparisonData, setLastComparisonData] = useState(null);
  const [selectedUnderwriter, setSelectedUnderwriter] = useState(null);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Dropdown state
  const [expandedDropdown, setExpandedDropdown] = useState(null);
  
  // Comparison tracking refs
  const comparisonTriggerRef = useRef(null);
  const comparisonTimeoutRef = useRef(null);
  const lastComparisonKeyRef = useRef(null);
  const underwriterSelectedRef = useRef(false);
  const hasComparisonsRef = useRef(false);
  
  // UI refs
  const underwriterSectionRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  // Stable parent notification handler
  const notifyParent = useStableCallback((fieldName, fieldValue) => {
    // Update ref immediately
    formDataRef.current = {
      ...formDataRef.current,
      [fieldName]: fieldValue,
    };
    
    // Notify parent callbacks
    if (onDataChange) {
      onDataChange(formDataRef.current);
    }
    if (onChange) {
      onChange(formDataRef.current);
    }
  });
  
  // Get validation function based on identification type
  const getRegistrationValidator = useCallback(() => {
    const identificationType = formDataRef.current.identificationType || 'Vehicle Registration';
    return identificationType === 'Chassis Number' 
      ? validateChassisNumber 
      : validateKenyanRegistration;
  }, []);
  
  // Registration/Chassis field with dynamic validation
  const registration = useMotorFormField({
    name: 'registrationNumber',
    initialValue: initialData.registrationNumber || '',
    validate: getRegistrationValidator(),
    onNotify: notifyParent,
    debounceMs: 400, // Longer debounce for typing
  });
  
  // Financial Interest radio group
  const financialInterest = useMotorFormField({
    name: 'financialInterest',
    initialValue: initialData.financialInterest || '',
    validate: validateRequired('Financial Interest'),
    onNotify: notifyParent,
    debounceMs: 100, // Shorter for radio (immediate feedback)
  });
  
  // Identification Type radio group
  const identificationType = useMotorFormField({
    name: 'identificationType',
    initialValue: initialData.identificationType || 'Vehicle Registration',
    validate: validateRequired('Vehicle Identification Type'),
    onNotify: notifyParent,
    debounceMs: 100,
  });
  
  // Cover start date
  const [coverStartDate, setCoverStartDate] = useState(
    initialData.cover_start_date || new Date().toISOString().split('T')[0]
  );
  
  // Year field (for non-Third Party products)
  const year = useMotorFormField({
    name: 'year',
    initialValue: initialData.year || '',
    validate: validateYear,
    onNotify: notifyParent,
    debounceMs: 300,
  });
  
  // Sum insured field (for Comprehensive products)
  const sumInsured = useMotorFormField({
    name: 'sum_insured',
    initialValue: initialData.sum_insured || '',
    validate: validateSumInsured,
    onNotify: notifyParent,
    debounceMs: 400,
  });
  
  // Make and model state (for dropdowns - will be refactored to ControlledSelect later)
  const [make, setMake] = useState(initialData.make || '');
  const [model, setModel] = useState(initialData.model || '');
  const [makeOther, setMakeOther] = useState(initialData.make_other || '');
  const [modelOther, setModelOther] = useState(initialData.model_other || '');
  
  // Track hasComparisons ref
  useEffect(() => {
    hasComparisonsRef.current = underwriterComparisons.length > 0;
  }, [underwriterComparisons.length]);
  
  // Check if field should be locked (TOR/Third Party with auto-filled data)
  const isFieldLocked = useCallback((fieldKey) => {
    const globalLock = formDataRef.current.isLocked === true;
    const fieldHasAutoFill = formDataRef.current[`${fieldKey}_isAutoFilled`] === true;
    const fieldFromLogbook = formDataRef.current[`${fieldKey}_autoFillSource`] === 'logbook';
    const lockableFields = ['make', 'model', 'year', 'registrationNumber', 'chassisNumber'];
    
    return globalLock && lockableFields.includes(fieldKey) && fieldHasAutoFill && fieldFromLogbook;
  }, []);
  
  // Get dynamic labels based on identification type
  const getIdentificationLabel = useCallback(() => {
    return identificationType.value === 'Chassis Number' ? 'Chassis Number' : 'Vehicle Registration';
  }, [identificationType.value]);
  
  const getIdentificationPlaceholder = useCallback(() => {
    return identificationType.value === 'Chassis Number' ? 'Enter chassis number' : 'e.g., KDA 123A';
  }, [identificationType.value]);
  
  // Determine product type characteristics
  const productCharacteristics = useMemo(() => {
    const subcategoryCode = selectedProduct?.subcategory_code?.toLowerCase() || '';
    const coverageType = (selectedProduct?.coverage_type || '').toLowerCase();
    
    const isThirdPartyLike = (
      coverageType.includes('third_party') ||
      coverageType.includes('third-party') ||
      coverageType === 'tor' ||
      subcategoryCode.includes('tor') ||
      subcategoryCode.includes('third_party') ||
      subcategoryCode.includes('third-party')
    );
    
    const isComprehensive = (
      coverageType.includes('comp') ||
      subcategoryCode.includes('comp')
    );
    
    return { isThirdPartyLike, isComprehensive };
  }, [selectedProduct?.subcategory_code, selectedProduct?.coverage_type]);
  
  // Get form fields configuration
  const formFields = useMemo(() => {
    const fields = [];
    const { isThirdPartyLike, isComprehensive } = productCharacteristics;
    
    // Core fields (always present)
    fields.push({ key: 'financialInterest', type: 'radio' });
    fields.push({ key: 'identificationType', type: 'radio' });
    fields.push({ key: 'registrationNumber', type: 'text' });
    fields.push({ key: 'cover_start_date', type: 'date' });
    
    // Additional fields for non-Third Party products
    if (!isThirdPartyLike) {
      fields.push({ key: 'make', type: 'select' });
      
      if (make === 'Others') {
        fields.push({ key: 'make_other', type: 'text' });
      }
      
      fields.push({ key: 'model', type: 'select' });
      
      if (model === 'Others') {
        fields.push({ key: 'model_other', type: 'text' });
      }
      
      fields.push({ key: 'year', type: 'number' });
      
      // Sum insured for Comprehensive
      if (isComprehensive) {
        fields.push({ key: 'sum_insured', type: 'formatted_number' });
      }
    }
    
    // Underwriter field
    fields.push({ key: 'underwriter', type: 'underwriter' });
    
    return fields;
  }, [productCharacteristics, make, model]);
  
  // [CONTINUING IN NEXT FILE SEGMENT - This is part 1 of the refactored component]
  
  return null; // Placeholder - will be completed in next segment
};

export default DynamicPolicyForm;
