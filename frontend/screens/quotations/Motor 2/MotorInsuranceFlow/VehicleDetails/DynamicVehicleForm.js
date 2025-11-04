import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import motorPricingService from '../../../../../services/MotorInsurancePricingService';
import { VEHICLE_MAKES, getModelsForMake } from '../../../../../constants/vehicleCatalog';
import djangoAPI from '../../../../../services/DjangoAPIService';

// Memoized TextInput component to prevent re-creation and focus loss
const MemoizedTextInput = memo(({ 
  fieldKey, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType, 
  autoCapitalize, 
  style,
  hasError 
}) => {
  return (
    <TextInput
      key={fieldKey}
      style={[style, hasError && styles.inputError]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      blurOnSubmit={false}
      returnKeyType="next"
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if relevant props change
  return (
    prevProps.value === nextProps.value &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.placeholder === nextProps.placeholder
  );
});

const DynamicPolicyForm = ({ selectedProduct, onDataChange, initialData = {}, values, onChange, errors = {}, productType, onUnderwriterComparison, onUnderwriterSelection }) => {
  const [formData, setFormData] = useState(initialData || values || {});
  const [validationErrors, setValidationErrors] = useState(errors);
  const [underwriterComparisons, setUnderwriterComparisons] = useState([]);
  const [comparingUnderwriters, setComparingUnderwriters] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);
  const [lastComparisonData, setLastComparisonData] = useState(null);
  const [selectedUnderwriter, setSelectedUnderwriter] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // State for accordion-style dropdowns
  const [expandedDropdown, setExpandedDropdown] = useState(null); // Track which dropdown is open
  
  // Ref to track comparison trigger and prevent duplicates
  const comparisonTriggerRef = useRef(null);
  const comparisonTimeoutRef = useRef(null);
  const lastComparisonKeyRef = useRef(null);
  
  // Debounced parent notifier to avoid parent re-renders on every keystroke
  const notifyTimeoutRef = useRef(null);
  const latestFormRef = useRef(formData);
  
  // Track if underwriter has been selected (prevents re-fetch after selection)
  const underwriterSelectedRef = useRef(false);
  const hasComparisonsRef = useRef(false);

  // Update refs when values change (without triggering re-renders)
  useEffect(() => {
    latestFormRef.current = formData;
    underwriterSelectedRef.current = Boolean(formData?.underwriter);
  }, [formData]);

  useEffect(() => {
    hasComparisonsRef.current = underwriterComparisons.length > 0;
  }, [underwriterComparisons.length]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (notifyTimeoutRef.current) {
        clearTimeout(notifyTimeoutRef.current);
      }
    };
  }, []);

  // Check if a field should be locked (TOR/Third Party with auto-filled data)
  const isFieldLocked = useCallback((fieldKey) => {
    // Check if form data has global lock flag
    const globalLock = formData.isLocked === true;
    
    // Check if specific field has lock metadata
    const fieldHasAutoFill = formData[`${fieldKey}_isAutoFilled`] === true;
    const fieldFromLogbook = formData[`${fieldKey}_autoFillSource`] === 'logbook';
    
    // Fields that can be locked: make, model, year, registrationNumber, chassisNumber
    const lockableFields = ['make', 'model', 'year', 'registrationNumber', 'chassisNumber'];
    
    // Lock if: global lock flag is set AND field is lockable AND has auto-fill data
    return globalLock && lockableFields.includes(fieldKey) && fieldHasAutoFill && fieldFromLogbook;
  }, [formData]);

  // Render a locked field with visual indicator
  const renderLockedField = useCallback((field) => {
    const value = formData[field.key] ?? '';
    return (
      <View key={field.key} style={styles.fieldContainer}>
        <Text style={styles.label}>
          {field.label} {field.required && <Text style={styles.required}>*</Text>}
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#f1f3f5', color: '#6c757d' }]}
          value={String(value)}
          editable={false}
        />
        {validationErrors[field.key] && (
          <Text style={styles.errorText}>{validationErrors[field.key]}</Text>
        )}
      </View>
    );
  }, [formData, validationErrors]);

  const getIdentificationLabel = useCallback(() => {
    return formData.identificationType === 'Chassis Number' ? 'Chassis Number' : 'Vehicle Registration';
  }, [formData.identificationType]);

  const getIdentificationPlaceholder = useCallback(() => {
    return formData.identificationType === 'Chassis Number' ? 'Enter chassis number' : 'e.g., KDA 123A';
  }, [formData.identificationType]);

  const getFormFields = useMemo(() => {
    // Call functions directly instead of including them in dependencies
    const identLabel = formData.identificationType === 'Chassis Number' ? 'Chassis Number' : 'Vehicle Registration';
    const identPlaceholder = formData.identificationType === 'Chassis Number' ? 'Enter chassis number' : 'e.g., KDA 123A';
    
    const fields = [
      { key: 'financialInterest', label: 'Financial Interest', type: 'radio', required: true, options: ['Yes', 'No'] },
      { key: 'identificationType', label: 'Vehicle Identification Type', type: 'radio', required: true, options: ['Vehicle Registration', 'Chassis Number'] },
      { key: 'registrationNumber', label: identLabel, type: 'text', required: true, placeholder: identPlaceholder },
      { key: 'cover_start_date', label: 'Cover Start Date', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
    ];

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

    if (!isThirdPartyLike) {
      // Make as dropdown - add "Others" option
      const makeOptions = [...VEHICLE_MAKES, 'Others'];
      fields.push(
        { key: 'make', label: 'Vehicle Make', type: 'select', required: true, options: makeOptions }
      );
      
      // If "Others" is selected for make, show text input
      if (formData.make === 'Others') {
        fields.push({ key: 'make_other', label: 'Specify Vehicle Make', type: 'text', required: true, placeholder: 'Enter vehicle make' });
      }
      
      // Model depends on selected make; if no list available or "Others" selected, fall back to text
      const models = formData.make === 'Others' ? null : getModelsForMake(formData.make);
      if (models && models.length > 0) {
        // Add "Others" option to models
        const modelOptions = [...models, 'Others'];
        fields.push({ key: 'model', label: 'Vehicle Model', type: 'select', required: true, options: modelOptions });
        
        // If "Others" is selected for model, show text input
        if (formData.model === 'Others') {
          fields.push({ key: 'model_other', label: 'Specify Vehicle Model', type: 'text', required: true, placeholder: 'Enter vehicle model' });
        }
      } else {
        fields.push({ key: 'model', label: 'Vehicle Model', type: 'text', required: true, placeholder: 'Axio' });
      }
      fields.push({ key: 'year', label: 'Year of Manufacture', type: 'number', required: true, placeholder: '2016' });
      
      // For Comprehensive products, add sum_insured field here in Vehicle Details
      if (isComprehensive) {
        fields.push({ 
          key: 'sum_insured', 
          label: 'Sum Insured (Vehicle Value)', 
          type: 'formatted_number', 
          required: true, 
          placeholder: 'e.g., 1 500 000',
          help: 'Enter the current market value of your vehicle'
        });
      }
    }

    // Placeholder to render the underwriter list in this step (except for comprehensive)
    fields.push({ key: 'underwriter', label: 'Available Underwriters', type: 'underwriter', required: false });

    return fields;
  }, [
    selectedProduct?.subcategory_code, 
    selectedProduct?.coverage_type,
    formData.make,
    formData.model,
    formData.identificationType
  ]);

  // Check if we can trigger underwriter comparison
  // Memoize only the pricing-relevant fields to prevent unnecessary re-triggers
  const canCompareUnderwriters = useCallback(() => {
    if (!selectedProduct || !selectedProduct.category || !selectedProduct.coverage_type) {
      return false;
    }

    const requiredFields = ['registrationNumber', 'cover_start_date'];
    
    // Check basic required fields including cover start date
    const hasRequired = requiredFields.every(field => formData[field] && formData[field].toString().trim());
    if (!hasRequired) {
      return false;
    }

    // For comprehensive insurance, need sum_insured
    const isComprehensive = selectedProduct.coverage_type?.toLowerCase().includes('comprehensive');
    // Disable underwriter comparison on Vehicle Details for Comprehensive to avoid duplication
    if (isComprehensive) {
      return false;
    }

    // For commercial, need tonnage
    const isCommercial = selectedProduct.category?.toLowerCase() === 'commercial';
    if (isCommercial && !formData.tonnage) {
      return false;
    }

    // For PSV, need passenger capacity
    const isPSV = selectedProduct.category?.toLowerCase() === 'psv';
    if (isPSV && (!formData.passengerCapacity || Number(formData.passengerCapacity) <= 0)) {
      return false;
    }

    return true;
  }, [
    selectedProduct, 
    // Only depend on fields that affect pricing, NOT underwriter selection
    formData.registrationNumber,
    formData.cover_start_date,
    formData.tonnage,
    formData.passengerCapacity,
    formData.sum_insured,
    formData.engineCapacity
  ]);

  // Memoize comparison trigger data to prevent unnecessary calls
  // This creates a stable signature of the data that triggers comparison
  // CRITICAL: Do NOT include formData.underwriter in the key or dependencies
  // so that selecting an underwriter does not schedule a new comparison
  const comparisonKey = useMemo(() => {
    if (!selectedProduct) return null;
    // Do not trigger comparisons from the Vehicle Details step for Comprehensive
    if (selectedProduct.coverage_type?.toLowerCase().includes('comprehensive')) return null;

    const subcategory_code = selectedProduct?.subcategory_code || selectedProduct?.code;
    const category = selectedProduct?.category?.toUpperCase();
    const coverType = selectedProduct?.coverage_type?.toUpperCase();
    
    // Create signature with only the fields that affect pricing
    // Exclude underwriter selection to prevent re-scheduling comparison on every click
    return JSON.stringify({
      subcategory: subcategory_code,
      category: category,
      coverType: coverType,
      registration: formData.registrationNumber,
      sumInsured: formData.sum_insured,
      tonnage: formData.tonnage,
      capacity: formData.passengerCapacity,
      engineCapacity: formData.engineCapacity,
      coverDate: formData.cover_start_date
    });
  }, [
    selectedProduct?.subcategory_code,
    selectedProduct?.code,
    selectedProduct?.category,
    selectedProduct?.coverage_type,
    formData.registrationNumber,
    formData.sum_insured,
    formData.tonnage,
    formData.passengerCapacity,
    formData.engineCapacity,
    formData.cover_start_date
  ]);

  // Trigger underwriter comparison when form is ready
  const triggerUnderwriterComparison = useCallback(async () => {
    if (!canCompareUnderwriters() || comparingUnderwriters) {
      return;
    }

    // Extra safety: if user already selected an underwriter and we still have comparisons, do nothing
    // This prevents any late-triggered compare from toggling loading state and causing a visual blink
    if (hasComparisonsRef.current && underwriterSelectedRef.current) {
      return;
    }

    // Use subcategory_code directly if available, otherwise fall back to category + coverType
    const subcategory_code = selectedProduct?.subcategory_code || selectedProduct?.code;
    const category = selectedProduct?.category?.toUpperCase();
    const coverType = selectedProduct?.coverage_type?.toUpperCase();
    
    // Create a signature of the current data to avoid repeated calls
    const currentDataSignature = JSON.stringify({
      subcategory_code,
      category,
      coverType,
      registrationNumber: formData.registrationNumber,
      sum_insured: formData.sum_insured,
      tonnage: formData.tonnage,
      passengerCapacity: formData.passengerCapacity,
    });

    // Don't repeat the same comparison
    if (lastComparisonData === currentDataSignature) {
      return;
    }
    
  setComparingUnderwriters(true);
    setComparisonError(null);
    setLastComparisonData(currentDataSignature);

    try {
      console.log('Triggering underwriter comparison for:', { subcategory_code, category, coverType, formData });
      
      let comparisons;
      
      // If we have a specific subcategory_code, use it directly
      if (subcategory_code) {
        // Use the subcategory directly for comparison
        const enhancedFormData = {
          ...formData,
          subcategory_code: subcategory_code,
          category: category
        };
        
        comparisons = await motorPricingService.compareUnderwritersBySubcategory(
          subcategory_code,
          enhancedFormData
        );
      } else {
        // Fall back to the old method if no subcategory_code
        comparisons = await motorPricingService.compareUnderwritersByCoverType(
          category,
          coverType,
          formData
        );
      }

      console.log('Underwriter comparisons received:', comparisons);
      
      // Check if we got empty comparisons - this means no pricing configured for this product
      if (!comparisons || comparisons.length === 0) {
        const productName = selectedProduct?.subcategory_name || selectedProduct?.name || 'this product';
        setComparisonError(`No underwriter pricing available for ${productName}. This product may not be configured yet. Please contact support or select a different product.`);
        setUnderwriterComparisons([]);
        // Reset the signature on error so it can be retried
        setLastComparisonData(null);
        lastComparisonKeyRef.current = null;
        comparisonTriggerRef.current = null;
      } else {
        setUnderwriterComparisons(comparisons);
        setComparisonError(null); // Clear any previous errors
        
        // Notify parent if callback provided
        if (onUnderwriterComparison) {
          onUnderwriterComparison(comparisons);
        }
      }

    } catch (error) {
      console.error('Failed to compare underwriters:', error);
      setComparisonError(error.message);
      setUnderwriterComparisons([]);
      // Reset the signature on error so it can be retried
      setLastComparisonData(null);
      lastComparisonKeyRef.current = null;
      comparisonTriggerRef.current = null;
    } finally {
      setComparingUnderwriters(false);
    }
  }, [selectedProduct, formData, canCompareUnderwriters, comparingUnderwriters, onUnderwriterComparison, lastComparisonData]);

  // Auto-trigger underwriter comparison with debouncing when comparisonKey changes
  useEffect(() => {
    // Skip auto comparisons for Comprehensive on Vehicle Details screen
    if (selectedProduct?.coverage_type?.toLowerCase().includes('comprehensive')) {
      return;
    }
    
    // Skip if no comparison key (not ready yet)
    if (!comparisonKey) {
      lastComparisonKeyRef.current = null;
      return;
    }

    // Prevent duplicate calls - check if this key was already processed
    // This prevents re-triggering when formData changes but pricing inputs haven't
    if (comparisonTriggerRef.current === comparisonKey) {
      // Silent skip - don't log to reduce console noise
      return;
    }

    if (lastComparisonKeyRef.current === comparisonKey) {
      return;
    }

    // Check if we can trigger comparison (call inline to avoid dependency issues)
    const canCompare = canCompareUnderwriters();
    if (!canCompare) {
      return;
    }

    // If we already have comparisons and an underwriter is selected, don't re-fetch
    // Use refs to check current state without adding to dependencies
    if (hasComparisonsRef.current && underwriterSelectedRef.current) {
      console.log('⏭️  Skipping comparison - underwriter already selected:', latestFormRef.current?.underwriter);
      return;
    }

    // Clear any existing timeout
    if (comparisonTimeoutRef.current) {
      clearTimeout(comparisonTimeoutRef.current);
    }

    // Mark this key as being processed BEFORE setting timeout
    // This prevents duplicate timeouts from being created
  comparisonTriggerRef.current = comparisonKey;
  lastComparisonKeyRef.current = comparisonKey;
    console.log('🧮 comparisonKey changed → scheduling comparison', {
      comparisonKey,
      formSignature: {
        registration: formData.registrationNumber,
        coverDate: formData.cover_start_date,
        tonnage: formData.tonnage,
        capacity: formData.passengerCapacity,
        sumInsured: formData.sum_insured
      }
    });

    // Shorter debounce (1 second) to load underwriters faster
    comparisonTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Auto-triggering underwriter comparison (debounced 1s)');
      triggerUnderwriterComparison();
    }, 1000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (comparisonTimeoutRef.current) {
        clearTimeout(comparisonTimeoutRef.current);
      }
    };
  }, [
    comparisonKey, 
    selectedProduct?.coverage_type, 
    triggerUnderwriterComparison,
    canCompareUnderwriters,
    formData.registrationNumber,
    formData.cover_start_date,
    formData.tonnage,
    formData.passengerCapacity,
    formData.sum_insured
  ]);



  const handleInputChange = (key, value) => {
    // Format currency inputs
    if (getFormFields.find(f => f.key === key)?.type === 'currency') {
      value = value.replace(/[^0-9]/g, '');
    }

  const newFormData = { ...formData, [key]: value };

    // If a pricing-critical field changes, clear any previously selected underwriter
    // Note: 'underwriter' is NOT included here because selecting an underwriter should persist
    const pricingCriticalKeys = [
      'registrationNumber',
      'cover_start_date',
      'tonnage',
      'passengerCapacity',
      'sum_insured',
      'engineCapacity'
    ];
    if (pricingCriticalKeys.includes(key)) {
      if (newFormData.underwriter) {
        delete newFormData.underwriter;
      }
      if (selectedUnderwriter) {
        setSelectedUnderwriter(null);
      }
      // Reset the ref to allow new comparison
      underwriterSelectedRef.current = false;
      // Reset comparison tracking refs to allow fresh comparison
      comparisonTriggerRef.current = null;
      lastComparisonKeyRef.current = null;
    }

    // If the user just selected an underwriter, freeze any pending auto-compare
    if (key === 'underwriter') {
      // Mark selection in ref immediately to short-circuit auto-compare effect
      underwriterSelectedRef.current = true;
      // Cancel any scheduled comparison triggered before selection
      if (comparisonTimeoutRef.current) {
        clearTimeout(comparisonTimeoutRef.current);
        comparisonTimeoutRef.current = null;
      }
      // Ensure the current comparison key is treated as already processed
      if (comparisonKey) {
        comparisonTriggerRef.current = comparisonKey;
        lastComparisonKeyRef.current = comparisonKey;
      }
      // Also stop any active spinner just in case
      if (comparingUnderwriters) {
        setComparingUnderwriters(false);
      }
    }
    
    // When make changes, reset model if it's no longer valid for the selected make
    if (key === 'make') {
      const allowedModels = getModelsForMake(value);
      if (allowedModels.length > 0 && !allowedModels.includes(newFormData.model)) {
        newFormData.model = ''; // Clear model when make changes and current model is invalid
      }
      // If switching away from "Others", clear make_other field
      if (value !== 'Others') {
        delete newFormData.make_other;
      }
    }
    
    // If model changed and not "Others", clear model_other field
    if (key === 'model' && value !== 'Others') {
      delete newFormData.model_other;
    }
    
  // Update local state immediately for instant UI feedback
  setFormData(newFormData);
  latestFormRef.current = newFormData;

    // Real-time validation
    const error = validateField(key, value);
    setValidationErrors(prev => ({
      ...prev,
      [key]: error
    }));

    // Notify parent component with a small debounce to prevent focus loss
    if (notifyTimeoutRef.current) {
      clearTimeout(notifyTimeoutRef.current);
    }
    if (onDataChange) {
      notifyTimeoutRef.current = setTimeout(() => {
        onDataChange(latestFormRef.current);
      }, 250);
    }
    if (onChange) {
      onChange(newFormData);
    }
  };

  const validateField = (key, value) => {
    const field = getFormFields.find(f => f.key === key);
    if (!field) return null;

    if (field.required && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`;
    }

    switch (field.type) {
      case 'number':
        if (value && isNaN(Number(value))) {
          return `${field.label} must be a valid number`;
        }
        break;
      case 'currency':
        if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
          return `${field.label} must be a valid positive amount`;
        }
        break;
      case 'date':
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return `${field.label} must be in YYYY-MM-DD format`;
        }
        if (value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return `${field.label} must be a valid date`;
          }
          // Don't allow dates too far in the past
          const minDate = new Date();
          minDate.setFullYear(minDate.getFullYear() - 1);
          if (date < minDate) {
            return `${field.label} cannot be more than 1 year in the past`;
          }
        }
        break;
      case 'text':
        if (key === 'registrationNumber' && value) {
          const identificationType = formData.identificationType;
          if (identificationType === 'Vehicle Registration') {
            if (!/^[A-Z0-9\s]+$/i.test(value)) {
              return 'Registration number contains invalid characters';
            }
          } else if (identificationType === 'Chassis Number') {
            if (!/^[A-Z0-9]+$/i.test(value)) {
              return 'Chassis number should contain only letters and numbers without spaces';
            }
          }
        }
        break;
    }

    return null;
  };

  const renderField = (field) => {
    // Check if this field should be locked
    if (isFieldLocked(field.key)) {
      return renderLockedField(field);
    }
    
    switch (field.type) {
      case 'select':
        const isExpanded = expandedDropdown === field.key;
        const selectedValue = formData[field.key];
        const selectedLabel = field.options?.find(opt => {
          const optVal = typeof opt === 'string' ? opt : (opt.value ?? opt.label);
          return optVal === selectedValue;
        });
        const displayText = selectedLabel 
          ? (typeof selectedLabel === 'string' ? selectedLabel : (selectedLabel.label ?? selectedLabel.value))
          : 'Select ' + field.label;

        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            
            {/* Collapsed dropdown trigger */}
            <TouchableOpacity
              style={[styles.dropdownTrigger, validationErrors[field.key] && styles.inputError]}
              onPress={() => setExpandedDropdown(isExpanded ? null : field.key)}
            >
              <Text style={[styles.dropdownTriggerText, !selectedValue && styles.placeholderText]}>
                {displayText}
              </Text>
              <Text style={styles.dropdownArrow}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Expanded dropdown options */}
            {isExpanded && (
              <View style={styles.dropdownOptionsContainer}>
                <ScrollView 
                  style={styles.dropdownScrollView}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {(field.options || []).map((option, index) => {
                    const optionText = typeof option === 'string' ? option : (option.label ?? String(option.value ?? option));
                    const optionValue = typeof option === 'string' ? option : (option.value ?? option.label ?? String(option));
                    const isSelected = formData[field.key] === optionValue;
                    
                    return (
                      <TouchableOpacity
                        key={`${field.key}-${index}`}
                        style={[
                          styles.dropdownOption,
                          isSelected && styles.selectedOption
                        ]}
                        onPress={() => {
                          handleInputChange(field.key, optionValue);
                          setExpandedDropdown(null); // Close dropdown after selection
                        }}
                      >
                        <Text style={[
                          styles.dropdownOptionText,
                          isSelected && styles.selectedText
                        ]}>
                          {optionText}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {field.help && (
              <Text style={styles.helpText}>{field.help}</Text>
            )}
            {validationErrors[field.key] && (
              <Text style={styles.errorText}>{validationErrors[field.key]}</Text>
            )}
          </View>
        );

      case 'date':
        {
          const dateValue = formData[field.key] || field.defaultValue;
          const displayDate = dateValue ? new Date(dateValue) : new Date();
          
          return (
            <View key={field.key} style={styles.fieldContainer}>
              <Text style={styles.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(field.key)}
              >
                <Text style={styles.dateInputText}>
                  {dateValue ? displayDate.toLocaleDateString() : 'Select date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker === field.key && (
                <DateTimePicker
                  value={displayDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                    if (event?.type === 'dismissed') return;
                    if (selectedDate) {
                      const formattedDate = selectedDate.toISOString().split('T')[0];
                      handleInputChange(field.key, formattedDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
              {validationErrors[field.key] && (
                <Text style={styles.errorText}>{validationErrors[field.key]}</Text>
              )}
            </View>
          );
        }

      case 'radio':
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.radioContainer}>
              {(field.options || []).map((option) => (
                <TouchableOpacity
                  key={String(option)}
                  style={styles.radioOption}
                  onPress={() => handleInputChange(field.key, option)}
                >
                  <View style={[
                    styles.radioCircle,
                    formData[field.key] === option && styles.radioSelected
                  ]}>
                    {formData[field.key] === option && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text style={[
                    styles.radioText,
                    formData[field.key] === option && styles.radioTextSelected
                  ]}>
                    {String(option)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {validationErrors[field.key] && (
              <Text style={styles.errorText}>{validationErrors[field.key]}</Text>
            )}
          </View>
        );

      case 'underwriter':
        // Hide underwriters in Vehicle Details for Comprehensive; handled in dedicated Underwriter screen
        if (selectedProduct?.coverage_type?.toLowerCase().includes('comprehensive')) {
          return null;
        }
        
        // Show loading state - only when actively comparing
        const canCompare = canCompareUnderwriters();
        const hasSelectedUnderwriter = formData[field.key] || selectedUnderwriter;
        const isLoading = comparingUnderwriters;
        
        if (isLoading) {
          return (
            <View key={field.key} style={styles.fieldContainer}>
              <Text style={styles.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D5222B" />
                <Text style={styles.loadingText}>Loading underwriter prices...</Text>
              </View>
            </View>
          );
        }
        
        // Show error if comparison failed or returned no results
        if (comparisonError) {
          return (
            <View key={field.key} style={styles.fieldContainer}>
              <Text style={styles.label}>
                {field.label} <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={24} color="#DC2626" />
                <Text style={styles.errorText}>{comparisonError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={() => {
                    setComparisonError(null);
                    setLastComparisonData(null);
                    lastComparisonKeyRef.current = null;
                    comparisonTriggerRef.current = null;
                    // Re-trigger comparison using the unified path
                    triggerUnderwriterComparison();
                  }}
                >
                  <Ionicons name="refresh-outline" size={20} color="#fff" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        
        // Show message if no comparisons available yet and form not ready
        if (underwriterComparisons.length === 0 && !canCompare) {
          return (
            <View key={field.key} style={styles.fieldContainer}>
              <Text style={styles.label}>
                {field.label} <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.noUnderwritersContainer}>
                <Text style={styles.noUnderwritersText}>
                  Please fill in the required fields above to compare underwriter prices
                </Text>
              </View>
            </View>
          );
        }
        
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.underwriterFieldContainer}>
              {(() => {
                // For EXT subcategories, only display underwriters that support extendible
                const isExtProduct = Boolean(selectedProduct?.subcategory_code?.includes('EXT') || selectedProduct?.is_extendible);
                const displayComparisons = isExtProduct
                  ? underwriterComparisons.filter(u => u?.is_extendible || !!u?.extendible_config)
                  : underwriterComparisons;
                return displayComparisons;
              })().map((comparison, index) => (
                <TouchableOpacity 
                  key={comparison.id || index} 
                  style={[
                    styles.underwriterOption,
                    formData[field.key] === comparison.name && styles.selectedUnderwriterOption
                  ]}
                  onPress={() => {
                    setSelectedUnderwriter(comparison);
                    handleInputChange(field.key, comparison.name);
                    // Notify parent component about underwriter selection
                    if (onUnderwriterSelection) {
                      onUnderwriterSelection(comparison);
                    }
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.underwriterOptionContent}>
                    <View style={styles.underwriterHeader}>
                      <View style={styles.underwriterInfo}>
                        <Text style={[
                          styles.underwriterOptionName,
                          formData[field.key] === comparison.name && styles.selectedUnderwriterText
                        ]}>
                          {comparison.name}
                        </Text>
                        <Text style={styles.marketPositionBadge}>
                          {comparison.market_position || 'Standard'}
                        </Text>
                      </View>
                      <Text style={[
                        styles.underwriterOptionPrice,
                        formData[field.key] === comparison.name && styles.selectedUnderwriterText
                      ]}>
                        KSh {comparison.total_premium?.toLocaleString() || 'N/A'}
                      </Text>
                    </View>
                    
                    {/* Calculation Summary (uses backend breakdown when available) */}
                    <View style={styles.calculationSummary}>
                      {(() => {
                        const base = Number(
                          comparison.premium_breakdown?.base_premium ??
                          comparison.breakdown?.base_premium ??
                          comparison.breakdown?.base ??
                          comparison.base_premium ??
                          0
                        );
                        const itl = Number(
                          comparison.premium_breakdown?.training_levy ??
                          comparison.breakdown?.training_levy ??
                          comparison.training_levy ??
                          (base * 0.0025)
                        );
                        const pcf = Number(
                          comparison.premium_breakdown?.pcf_levy ??
                          comparison.breakdown?.pcf_levy ??
                          comparison.pcf_levy ??
                          (base * 0.0025)
                        );
                        const stamp = Number(
                          comparison.premium_breakdown?.stamp_duty ??
                          comparison.breakdown?.stamp_duty ??
                          comparison.stamp_duty ??
                          40
                        );
                        const total = Number(
                          comparison.total_premium ??
                          comparison.premium_breakdown?.total_premium ??
                          comparison.totalPremium ??
                          (base + itl + pcf + stamp)
                        );
                        return (
                          <>
                            <Text style={styles.calculationLabel}>Calculation Breakdown:</Text>
                            <View style={styles.calculationRow}>
                              <Text style={styles.calculationItem}>
                                Base Premium: KSh {base.toLocaleString()}
                              </Text>
                              <Text style={styles.calculationItem}>
                                Training Levy (0.25%): KSh {itl.toFixed(2)}
                              </Text>
                            </View>
                            <View style={styles.calculationRow}>
                              <Text style={styles.calculationItem}>
                                PCF Levy (0.25%): KSh {pcf.toFixed(2)}
                              </Text>
                              <Text style={styles.calculationItem}>
                                Stamp Duty: KSh {stamp.toFixed(2)}
                              </Text>
                            </View>
                            <View style={styles.calculationTotal}>
                              <Text style={styles.calculationTotalText}>
                                Total Premium: KSh {total.toLocaleString()}
                              </Text>
                            </View>
                            {/* Show extendible split if available to highlight differences */}
                            {comparison.extendible_config && (
                              <View style={{ marginTop: 6 }}>
                                <Text style={styles.calculationLabel}>Extendible Plan:</Text>
                                <View style={styles.calculationRow}>
                                  <Text style={styles.calculationItem}>
                                    Initial Payment: KSh {Number(comparison.extendible_config.initial_amount || 0).toLocaleString()}
                                  </Text>
                                  <Text style={styles.calculationItem}>
                                    Balance: KSh {Number(
                                      comparison.extendible_config.balance_amount ??
                                      Math.max(0, (comparison.extendible_config.total_annual_premium || 0) - (comparison.extendible_config.initial_amount || 0))
                                    ).toLocaleString()}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  </View>
                  {formData[field.key] === comparison.name && (
                    <Text style={styles.underwriterSelectedIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {validationErrors[field.key] && (
              <Text style={styles.errorText}>{validationErrors[field.key]}</Text>
            )}
          </View>
        );

      default:
        // Handle dynamic labels and placeholders for registration field
        const dynamicLabel = field.key === 'registrationNumber' ? getIdentificationLabel() : field.label;
        const dynamicPlaceholder = field.key === 'registrationNumber' ? getIdentificationPlaceholder() : (field.placeholder || `Enter ${field.label.toLowerCase()}`);
        
        // Format number with spaces for sum_insured
        const isFormattedNumber = field.type === 'formatted_number';
        const displayValue = isFormattedNumber && formData[field.key] 
          ? formData[field.key].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
          : (formData[field.key] || '');
        
        // Create stable handler to prevent TextInput recreation and focus loss
        const handleTextChange = useCallback((value) => {
          const cleanValue = isFormattedNumber ? value.replace(/\s/g, '') : value;
          handleInputChange(field.key, cleanValue);
        }, [field.key, isFormattedNumber]);
        
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>
              {dynamicLabel} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <MemoizedTextInput
              fieldKey={field.key}
              value={displayValue}
              onChangeText={handleTextChange}
              placeholder={dynamicPlaceholder}
              keyboardType={field.type === 'number' || field.type === 'currency' || field.type === 'formatted_number' ? 'numeric' : 'default'}
              autoCapitalize={field.key === 'registrationNumber' ? 'characters' : 'words'}
              style={styles.input}
              hasError={!!validationErrors[field.key]}
            />
            {field.help && (
              <Text style={styles.helpText}>{field.help}</Text>
            )}
            {validationErrors[field.key] && (
              <Text style={styles.errorText}>{validationErrors[field.key]}</Text>
            )}
          </View>
        );
    }
  };

  // Initialize once when product changes; avoid depending on object props to prevent loops
  useEffect(() => {
    const initialFormData = initialData || values || {};
    // Only update if content actually changed to avoid re-render loops
    const sameKeys = Object.keys(initialFormData).length === Object.keys(formData || {}).length;
    const isSame = sameKeys && Object.keys(initialFormData).every(k => initialFormData[k] === formData[k]);
    if (!isSame) {
      setFormData(initialFormData);
    }
    if (errors && errors !== validationErrors) {
      setValidationErrors(errors);
    }
    
    // Clear comparisons when product/subcategory changes to prevent showing stale data
    setUnderwriterComparisons([]);
    setSelectedUnderwriter(null);
    setComparisonError(null);
    setLastComparisonData(null);
    lastComparisonKeyRef.current = null;
    comparisonTriggerRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct?.id, selectedProduct?.subcategory_code, selectedProduct?.code, productType]);

  // Underwriter auto-trigger is handled by the earlier effect using `comparisonKey` + 1s debounce.
  // The previous duplicate effect caused double fetches and two spinners, so it has been removed.
  // Legacy support for simple form rendering
  if (!selectedProduct && productType) {
    return (
      <View style={styles.legacyContainer}>
        {getFormFields.map(renderField)}
        {errors.form && <Text style={styles.errorText}>{errors.form}</Text>}
      </View>
    );
  }

  if (!selectedProduct && !productType) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Please select a product to continue</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'interactive'}
    >
      <View style={styles.formContainer}>
        {getFormFields.map(renderField)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  legacyContainer: {
    gap: 12,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#646767',
    fontWeight: '500',
  },
  formContainer: {
    padding: 12,
    gap: 10,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  required: {
    color: '#D5222B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#2c3e50',
  },
  inputError: {
    borderColor: '#D5222B',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    minHeight: 44,
  },
  dateInputText: {
    fontSize: 15,
    color: '#2c3e50',
  },
  placeholderText: {
    color: '#6c757d',
  },
  // Accordion-style dropdown trigger (collapsed state)
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  dropdownTriggerText: {
    fontSize: 15,
    color: '#212529',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#646767',
    marginLeft: 8,
  },
  // Dropdown options container (expanded state)
  dropdownOptionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#212529',
  },
  selectContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ced4da',
    minHeight: 44,
    maxHeight: 250, // Limit height to make it scrollable
  },
  selectScrollView: {
    maxHeight: 250, // Match container height
  },
  selectOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  selectText: {
    fontSize: 15,
    color: '#212529',
    lineHeight: 20,
  },
  selectedOption: {
    backgroundColor: '#D5222B',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    color: '#d90429',
    fontSize: 11,
    marginTop: 3,
  },
  helpText: {
    color: '#646767',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 3,
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ced4da',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#D5222B',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D5222B',
  },
  radioText: {
    fontSize: 16,
    color: '#495057',
  },
  radioTextSelected: {
    color: '#D5222B',
    fontWeight: '600',
  },
  summaryContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#646767',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#646767',
    textAlign: 'center',
  },
  // Underwriter comparison styles
  comparisonContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    color: '#646767',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 24,
  },
  retryButton: {
    backgroundColor: '#D5222B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  underwriterList: {
    marginTop: 16,
    gap: 0,
  },
  selectedUnderwriterCard: {
    borderColor: '#D5222B',
    borderWidth: 2,
    backgroundColor: '#fef7f7',
  },
  selectedUnderwriterName: {
    color: '#D5222B',
  },
  selectedUnderwriterPrice: {
    color: '#D5222B',
  },
  selectedIndicator: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D5222B',
  },
  underwriterCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 8,
  },
  underwriterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  underwriterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
    marginBottom: 4,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  budgetBadge: {
    backgroundColor: '#e8f5e8',
  },
  competitiveBadge: {
    backgroundColor: '#e3f2fd',
  },
  premiumBadge: {
    backgroundColor: '#fff3e0',
  },
  positionText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    lineHeight: 16,
  },
  budgetText: {
    color: '#2e7d32',
  },
  competitiveText: {
    color: '#1565c0',
  },
  premiumText: {
    color: '#ef6c00',
  },
  underwriterPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D5222B',
    marginBottom: 4,
    lineHeight: 20,
  },
  underwriterRating: {
    fontSize: 14,
    color: '#646767',
    lineHeight: 18,
  },
  summaryHighlight: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
    marginTop: 4,
  },
  underwriterFieldContainer: {
    gap: 8,
  },
  underwriterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  selectedUnderwriterOption: {
    borderColor: '#D5222B',
    backgroundColor: '#fef7f7',
  },
  underwriterOptionContent: {
    flex: 1,
  },
  underwriterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  underwriterInfo: {
    flex: 1,
  },
  underwriterOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  marketPositionBadge: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  underwriterOptionPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D5222B',
  },
  calculationSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  calculationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  calculationItem: {
    fontSize: 11,
    color: '#6c757d',
    flex: 1,
  },
  calculationTotal: {
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    paddingTop: 4,
    marginTop: 4,
  },
  calculationTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D5222B',
    textAlign: 'right',
  },
  selectedUnderwriterText: {
    color: '#D5222B',
  },
  underwriterSelectedIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D5222B',
    marginLeft: 8,
  },
  // Locked field styles for Day 10
  lockedFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedBadge: {
    fontSize: 11,
    color: '#646767',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '500',
  },
  lockedInputContainer: {
    position: 'relative',
  },
  lockedInput: {
    backgroundColor: '#f8f9fa',
    color: '#495057',
    borderColor: '#dee2e6',
  },
  unlockButton: {
    position: 'absolute',
    right: 8,
    top: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  unlockButtonText: {
    fontSize: 12,
    color: '#646767',
    fontWeight: '500',
  },
  lockedHelpText: {
    fontSize: 11,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6c757d',
  },
  noUnderwritersContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  noUnderwritersText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
});

// Memoize to prevent re-renders when parent updates
export default React.memo(DynamicPolicyForm, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.selectedProduct?.id === nextProps.selectedProduct?.id &&
    prevProps.selectedProduct?.subcategory_code === nextProps.selectedProduct?.subcategory_code &&
    prevProps.productType === nextProps.productType &&
    prevProps.initialData === nextProps.initialData
  );
});
