import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { VEHICLE_MAKES, getModelsForMake } from '../../../../../constants/vehicleCatalog';

const DEBUG = false; // Toggle verbose console logs for this form

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  // Kenyan phone format: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, or 2547XXXXXXXX
  const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
  return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
};

const validateKraPin = (kraPin) => {
  // Format: A000000000X (letter + 9 digits + letter)
  const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/;
  return kraPinRegex.test(kraPin.replace(/[\s\-]/g, ''));
};

const validateIdNumber = (idNumber) => {
  // Minimum 7 digits, maximum 8 digits
  return /^\d{7,8}$/.test(idNumber);
};

export default function EnhancedClientForm({ 
  values = {}, 
  onChange, 
  errors = {}, 
  extractedData = {},
  onValidationChange,
  selectedProduct,
  vehicleData
}) {
  const [fieldErrors, setFieldErrors] = useState({});
  
  const update = (k, v) => {
    if (DEBUG) {
      try { console.log('EnhancedClientForm update called:', k, '=', v); } catch {}
    }
    // Avoid emitting changes when value hasn't changed
    const prev = values ? values[k] : undefined;
    if (prev === v) return;
    
    // Clear field error when user starts typing
    if (fieldErrors[k]) {
      setFieldErrors(prev => ({ ...prev, [k]: null }));
    }
    
    const newValues = { ...(values || {}), [k]: v };
    onChange?.(newValues);
  };
  
  const validateField = (key, value) => {
    const val = (value || '').toString().trim();
    
    switch (key) {
      case 'email':
        if (!val) return 'Email is required';
        if (!validateEmail(val)) return 'Enter valid email address';
        return null;
      
      case 'phone':
        if (!val) return 'Phone number is required';
        if (!validatePhone(val)) return 'Enter valid Kenyan phone (e.g., 0712345678)';
        return null;
      
      case 'kra_pin':
        if (val && !validateKraPin(val)) return 'Enter valid KRA PIN (e.g., A000000000X)';
        return null;
      
      case 'id_number':
        if (val && !validateIdNumber(val)) return 'Enter valid ID number (7-8 digits)';
        return null;
      
      case 'first_name':
      case 'last_name':
        if (!val) return `${key === 'first_name' ? 'First' : 'Last'} name is required`;
        if (val.length < 2) return 'Name too short (minimum 2 characters)';
        return null;
      
      default:
        return null;
    }
  };
  
  const handleBlur = (key) => {
    const error = validateField(key, values[key]);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [key]: error }));
    }
  };
  
  const hasAppliedExtractedData = useRef(false);

  // Prefer values from Vehicle Details step when present (keeps UX consistent)
  useEffect(() => {
    if (!vehicleData) return;
    const patch = {};
    if (!values.vehicle_make && vehicleData.make) patch.vehicle_make = vehicleData.make;
    if (!values.vehicle_model && vehicleData.model) patch.vehicle_model = vehicleData.model;
    // NEW: Also prefer registration and chassis from DMVIC/Vehicle Details
    if (!values.vehicle_registration) {
      const reg = vehicleData.registrationNumber || vehicleData.registration_number || vehicleData.Registration_Number;
      if (reg) patch.vehicle_registration = String(reg).toUpperCase();
    }
    if (!values.chassis_number) {
      const ch = vehicleData.chassisNumber || vehicleData.chassis_number;
      if (ch) patch.chassis_number = String(ch).toUpperCase();
    }
    if (Object.keys(patch).length) onChange?.({ ...(values || {}), ...patch });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleData?.make, vehicleData?.model]);
  
  // Validate required fields and document extraction completeness
  const validateFields = () => {
    const requiredFields = [
      { key: 'first_name', label: 'First Name', fromDoc: 'owner_name', validator: null },
      { key: 'last_name', label: 'Last Name', fromDoc: 'owner_name', validator: null },
      { key: 'kra_pin', label: 'KRA PIN', fromDoc: 'kra_pin', validator: validateKraPin },
      { key: 'id_number', label: 'ID Number', fromDoc: 'id_number', validator: validateIdNumber },
      { key: 'email', label: 'Email', fromDoc: 'email', validator: validateEmail },
      { key: 'phone', label: 'Phone', fromDoc: 'phone', validator: validatePhone },
      { key: 'vehicle_registration', label: 'Vehicle Registration', fromDoc: 'registration_number', validator: null },
      { key: 'chassis_number', label: 'Chassis Number', fromDoc: 'chassis_number', validator: null },
      { key: 'vehicle_make', label: 'Vehicle Make', fromDoc: 'make', validator: null },
      { key: 'vehicle_model', label: 'Vehicle Model', fromDoc: 'model', validator: null }
    ];

    const missingFields = [];
    const invalidFields = [];
    const extractionIssues = [];

    requiredFields.forEach(field => {
      const currentValue = (values[field.key] || '').toString().trim();
      const extractedValue = (extractedData[field.fromDoc] || '').toString().trim();
      
      // Check if field is empty
      if (!currentValue) {
        missingFields.push(field.label);
        
        // Check if extraction failed for this field
        if (!extractedValue) {
          extractionIssues.push(`${field.label} could not be extracted from documents`);
        }
      } else if (field.validator && !field.validator(currentValue)) {
        // Check format validation if validator exists
        invalidFields.push(field.label);
      }
    });

    const isValid = missingFields.length === 0 && invalidFields.length === 0;
    const validationResult = {
      isValid,
      missingFields,
      invalidFields,
      extractionIssues,
      message: isValid 
        ? 'All required fields completed'
        : (invalidFields.length > 0 
          ? `Invalid format: ${invalidFields.join(', ')}`
          : `Missing: ${missingFields.join(', ')}`)
    };

    onValidationChange?.(validationResult);
    return validationResult;
  };

  // Apply extracted data on mount or when extractedData changes
  useEffect(() => {
    if (!extractedData || Object.keys(extractedData).length === 0 || hasAppliedExtractedData.current) {
      return; // No data or already applied
    }

    const newValues = { ...values };
    let hasChanges = false;

    const mapping = {
      owner_name: ['first_name', 'last_name'],
      kra_pin: 'kra_pin',
      id_number: 'id_number',
      email: 'email',
      phone: 'phone',
      registration_number: 'vehicle_registration',
      chassis_number: 'chassis_number',
      make: 'vehicle_make',
      model: 'vehicle_model'
    };

    for (const [extractedKey, formKey] of Object.entries(mapping)) {
      if (extractedData[extractedKey]) {
        if (Array.isArray(formKey)) {
          const nameParts = extractedData[extractedKey].trim().split(/\s+/);
          const first = nameParts[0] || '';
          const last = nameParts.slice(1).join(' ') || '';
          if (first && newValues[formKey[0]] !== first) {
            newValues[formKey[0]] = first;
            hasChanges = true;
          }
          if (last && newValues[formKey[1]] !== last) {
            newValues[formKey[1]] = last;
            hasChanges = true;
          }
        } else {
          const newValue = extractedData[extractedKey].toString().trim();
          if (newValues[formKey] !== newValue) {
            newValues[formKey] = newValue;
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      onChange?.(newValues);
      hasAppliedExtractedData.current = true; // Prevent re-applying
      if (DEBUG) {
        try { console.log('✅ Client form auto-filled from extracted data'); } catch {}
      }
    }
  }, [extractedData, values, onChange]);

  // Validate on form changes
  useEffect(() => {
    validateFields();
  }, [values, extractedData]);

  // Helper to determine if field has extraction issues
  const getFieldStatus = (fieldKey, docKey) => {
    const currentValue = (values[fieldKey] || '').toString().trim();
    const extractedValue = (extractedData[docKey] || '').toString().trim();
    
    if (!currentValue && !extractedValue) return 'missing-both';
    if (!currentValue && extractedValue) return 'missing-current';
    if (currentValue && !extractedValue) return 'manual-entry';
    return 'complete';
  };

  return (
    <ScrollView 
      contentContainerStyle={{ gap: 12, paddingBottom: 120 }}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
    >
      {/* Document Extraction Status Notice */}
      {Object.keys(extractedData).length === 0 && (
        <View style={styles.warningNotice}>
          <Text style={styles.warningText}>⚠️ No document data extracted</Text>
          <Text style={styles.warningSubtext}>Please ensure documents are clear and uploaded correctly for auto-fill</Text>
        </View>
      )}

      {/* Personal Details */}
      <Field 
        label="First Name" 
        value={values.first_name} 
        onChangeText={(v) => update('first_name', v)}
        onBlur={() => handleBlur('first_name')}
        placeholder="Auto-filled from documents"
        status={getFieldStatus('first_name', 'owner_name')}
        error={fieldErrors.first_name}
      />
      <Field 
        label="Last Name" 
        value={values.last_name} 
        onChangeText={(v) => update('last_name', v)}
        onBlur={() => handleBlur('last_name')}
        placeholder="Auto-filled from documents"
        status={getFieldStatus('last_name', 'owner_name')}
        error={fieldErrors.last_name}
      />
      <Field 
        label="KRA PIN" 
        value={values.kra_pin} 
        onChangeText={(v) => update('kra_pin', (v || '').toUpperCase())}
        onBlur={() => handleBlur('kra_pin')}
        autoCapitalize="characters" 
        placeholder="Auto-filled from KRA PIN doc"
        status={getFieldStatus('kra_pin', 'kra_pin')}
        error={fieldErrors.kra_pin}
      />
      <Field 
        label="ID Number" 
        value={values.id_number} 
        onChangeText={(v) => update('id_number', v)}
        onBlur={() => handleBlur('id_number')}
        placeholder="Auto-filled from ID document" 
        keyboardType="numeric"
        status={getFieldStatus('id_number', 'id_number')}
        error={fieldErrors.id_number}
      />

      {/* Contact Details */}
      <Field 
        label="Email" 
        value={values.email} 
        onChangeText={(v) => update('email', v)}
        onBlur={() => handleBlur('email')}
        placeholder="Enter client email"
        keyboardType="email-address"
        autoCapitalize="none"
        status={getFieldStatus('email', 'email')}
        error={fieldErrors.email}
      />
      <Field 
        label="Phone" 
        value={values.phone} 
        onChangeText={(v) => update('phone', v)}
        onBlur={() => handleBlur('phone')}
        placeholder="Enter client phone"
        keyboardType="phone-pad"
        status={getFieldStatus('phone', 'phone')}
        error={fieldErrors.phone}
      />

      {/* Vehicle Fields */}
      <Field 
        label="Car Registration Number" 
        value={values.vehicle_registration} 
        onChangeText={(v) => update('vehicle_registration', (v || '').toUpperCase())} 
        autoCapitalize="characters" 
        placeholder="Auto-filled from logbook"
        status={getFieldStatus('vehicle_registration', 'registration_number')}
      />
      <Field 
        label="Chassis No" 
        value={values.chassis_number} 
        onChangeText={(v) => update('chassis_number', (v || '').toUpperCase())} 
        autoCapitalize="characters" 
        placeholder="Auto-filled from logbook"
        status={getFieldStatus('chassis_number', 'chassis_number')}
      />
      
      {/* Vehicle Make - Simple Text Field to avoid dropdown keyboard issues */}
      <Field
        label="Make"
        value={values.vehicle_make}
        onChangeText={(v) => update('vehicle_make', v)}
        placeholder="Auto-filled from logbook/DMVIC"
        status={getFieldStatus('vehicle_make', 'make')}
        autoCapitalize="characters"
      />
      
      {/* Vehicle Model - Simple Text Field to avoid dropdown keyboard issues */}
      <Field
        label="Model"
        value={values.vehicle_model}
        onChangeText={(v) => update('vehicle_model', v)}
        placeholder="Auto-filled from logbook/DMVIC"
        status={getFieldStatus('vehicle_model', 'model')}
        autoCapitalize="characters"
      />
      
      {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
    </ScrollView>
  );
}

function SelectField({ label, error, status, value, options, onValueChange, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const getStatusStyle = () => {
    switch (status) {
      case 'missing-both': return { borderColor: '#ff6b6b', backgroundColor: '#fff5f5' };
      case 'missing-current': return { borderColor: '#ffa500', backgroundColor: '#fff8f0' };
      case 'manual-entry': return { borderColor: '#4dabf7', backgroundColor: '#f0f8ff' };
      case 'complete': return { borderColor: '#51cf66', backgroundColor: '#f0fff4' };
      default: return {};
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'missing-both': return '⚠️ Required field - document extraction failed';
      case 'missing-current': return '⚠️ Please fill this required field';
      case 'manual-entry': return 'ℹ️ Manually entered (document not extracted)';
      case 'complete': return '✓ Auto-filled from document';
      default: return null;
    }
  };

  const displayValue = value || placeholder;
  const hasValue = !!value;

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Dropdown Toggle Button */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          getStatusStyle(),
          disabled && styles.disabledSelect
        ]}
        onPress={() => {
          console.log('SelectField pressed:', label, 'disabled:', disabled, 'options:', options?.length);
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dropdownButtonText,
          !hasValue && styles.placeholderText
        ]}>
          {displayValue}
        </Text>
        <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {/* Inline dropdown (same UX as Vehicle Details) */}
      {isOpen && !disabled && options && options.length > 0 && (
        <View style={styles.dropdownList}>
          <ScrollView 
            style={styles.dropdownScrollView}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={true}
          >
            {options.map((option, index) => {
              const optionText = typeof option === 'string' ? option : (option.label ?? String(option.value ?? option));
              const optionValue = typeof option === 'string' ? option : (option.value ?? option.label ?? String(option));
              const selected = value === optionValue;
              return (
                <TouchableOpacity
                  key={`${label}-${index}`}
                  style={[
                    styles.dropdownOption,
                    selected && styles.selectedDropdownOption
                  ]}
                  onPress={() => {
                    onValueChange(optionValue);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selected && styles.selectedDropdownOptionText
                  ]}>
                    {optionText}
                  </Text>
                  {selected && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {status && status !== 'complete' && (
        <Text style={[
          styles.statusText,
          status === 'missing-both' ? styles.errorStatus : 
          status === 'missing-current' ? styles.warningStatus : styles.infoStatus
        ]}>
          {getStatusMessage()}
        </Text>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function Field({ label, error, style, status, ...inputProps }) {
  const getStatusStyle = () => {
    // Error takes priority over status
    if (error) {
      return { borderColor: '#ff6b6b', backgroundColor: '#fff5f5', borderWidth: 2 };
    }
    
    switch (status) {
      case 'missing-both': return { borderColor: '#ff6b6b', backgroundColor: '#fff5f5' };
      case 'missing-current': return { borderColor: '#ffa500', backgroundColor: '#fff8f0' };
      case 'manual-entry': return { borderColor: '#4dabf7', backgroundColor: '#f0f8ff' };
      case 'complete': return { borderColor: '#51cf66', backgroundColor: '#f0fff4' };
      default: return {};
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'missing-both': return '⚠️ Required field - document extraction failed';
      case 'missing-current': return '⚠️ Please fill this required field';
      case 'manual-entry': return 'ℹ️ Manually entered (document not extracted)';
      case 'complete': return '✓ Auto-filled from document';
      default: return null;
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={[styles.input, getStatusStyle(), style]} 
        {...inputProps} 
        blurOnSubmit={false}
        returnKeyType="next"
      />
      {/* Show error first, then status message */}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : status && status !== 'complete' ? (
        <Text style={[
          styles.statusText,
          status === 'missing-both' ? styles.errorStatus : 
          status === 'missing-current' ? styles.warningStatus : styles.infoStatus
        ]}>
          {getStatusMessage()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', color: '#495057', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', fontSize: 14 },
  error: { color: '#d90429', fontSize: 12, marginTop: 4 },
  
  // Status styling
  statusText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  errorStatus: { color: '#ff6b6b' },
  warningStatus: { color: '#ffa500' },
  infoStatus: { color: '#4dabf7' },
  
  // Warning notice
  warningNotice: { 
    backgroundColor: '#fff3cd', 
    borderColor: '#ffeaa7', 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 8 
  },
  warningText: { color: '#856404', fontWeight: '600', fontSize: 14 },
  warningSubtext: { color: '#856404', fontSize: 12, marginTop: 4 },
  
  // Select dropdown styles
  selectContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
    overflow: 'hidden'
  },
  selectScrollView: {
    maxHeight: 200
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  selectedOption: {
    backgroundColor: '#e7f5ff',
    borderLeftWidth: 3,
    borderLeftColor: '#1c7ed6'
  },
  selectText: {
    fontSize: 14,
    color: '#495057'
  },
  selectedText: {
    fontWeight: '600',
    color: '#1c7ed6'
  },
  selectPlaceholderContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  selectPlaceholder: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic'
  },
  disabledSelect: {
    backgroundColor: '#f1f3f5',
    opacity: 0.6
  },
  
  // Dropdown button styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 44
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#495057',
    flex: 1
  },
  placeholderText: {
    color: '#adb5bd',
    fontStyle: 'italic'
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8
  },
  
  // Dropdown list styles
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  dropdownScrollView: {
    maxHeight: 200
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  selectedDropdownOption: {
    backgroundColor: '#e7f5ff'
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#495057',
    flex: 1
  },
  selectedDropdownOptionText: {
    fontWeight: '600',
    color: '#1c7ed6'
  },
  checkmark: {
    fontSize: 16,
    color: '#1c7ed6',
    fontWeight: 'bold',
    marginLeft: 8
  }
});
