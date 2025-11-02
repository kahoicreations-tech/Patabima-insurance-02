import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { VEHICLE_MAKES, getModelsForMake } from '../../../../../constants/vehicleCatalog';

export default function EnhancedClientForm({ 
  values = {}, 
  onChange, 
  errors = {}, 
  extractedData = {},
  onValidationChange,
  selectedProduct,
  vehicleData
}) {
  const update = (k, v) => {
    console.log('EnhancedClientForm update called:', k, '=', v);
    console.log('Current values:', values);
    const newValues = { ...(values || {}), [k]: v };
    console.log('New values to send:', newValues);
    onChange?.(newValues);
  };
  const hasAppliedExtractedData = useRef(false);

  // Prefer values from Vehicle Details step when present (keeps UX consistent)
  useEffect(() => {
    if (!vehicleData) return;
    const patch = {};
    if (!values.vehicle_make && vehicleData.make) patch.vehicle_make = vehicleData.make;
    if (!values.vehicle_model && vehicleData.model) patch.vehicle_model = vehicleData.model;
    if (Object.keys(patch).length) onChange?.({ ...(values || {}), ...patch });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleData?.make, vehicleData?.model]);
  
  // Validate required fields and document extraction completeness
  const validateFields = () => {
    const requiredFields = [
      { key: 'first_name', label: 'First Name', fromDoc: 'owner_name' },
      { key: 'last_name', label: 'Last Name', fromDoc: 'owner_name' },
      { key: 'kra_pin', label: 'KRA PIN', fromDoc: 'kra_pin' },
      { key: 'id_number', label: 'ID Number', fromDoc: 'id_number' },
      { key: 'email', label: 'Email', fromDoc: 'email' },
      { key: 'phone', label: 'Phone', fromDoc: 'phone' },
      { key: 'vehicle_registration', label: 'Vehicle Registration', fromDoc: 'registration_number' },
      { key: 'chassis_number', label: 'Chassis Number', fromDoc: 'chassis_number' },
      { key: 'vehicle_make', label: 'Vehicle Make', fromDoc: 'make' },
      { key: 'vehicle_model', label: 'Vehicle Model', fromDoc: 'model' }
    ];

    const missingFields = [];
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
      }
    });

    const isValid = missingFields.length === 0;
    const validationResult = {
      isValid,
      missingFields,
      extractionIssues,
      message: isValid 
        ? 'All required fields completed'
        : `Missing: ${missingFields.join(', ')}`
    };

    onValidationChange?.(validationResult);
    return validationResult;
  };

  // Apply extracted data on mount or when extractedData changes
  useEffect(() => {
    if (!extractedData || Object.keys(extractedData).length === 0) {
      return; // No extracted data to apply
    }
    
    // Apply extracted data to form fields
    const updated = { ...values };
    let hasChanges = false;

    const shouldOverwrite = (current, incoming, opts = {}) => {
      const cur = (current ?? '').toString().trim();
      const inc = (incoming ?? '').toString().trim();
      if (!inc) return false;
      if (!cur) return true;
      // If min length required and current is clearly partial, overwrite
      if (opts.minLen && cur.length < opts.minLen && inc.length >= opts.minLen) return true;
      // If current is a prefix of incoming (e.g., 'KCA' vs 'KCA123A'), overwrite
      if (inc.toUpperCase().startsWith(cur.toUpperCase()) && inc.length > cur.length) return true;
      return false;
    };
    
  // Map extracted fields from logbook/ID/KRA to form fields
    if (extractedData.owner_name) {
      const name = extractedData.owner_name.trim();
      const nameParts = name.split(/\s+/);
      const computedFirst = nameParts[0] || '';
      const computedLast = nameParts.slice(1).join(' ') || '';
      const firstHasSpace = (updated.first_name || '').includes(' ');
      if (!updated.first_name || firstHasSpace || !updated.last_name) {
        if (computedFirst && updated.first_name !== computedFirst) { updated.first_name = computedFirst; hasChanges = true; }
        if (computedLast && updated.last_name !== computedLast) { updated.last_name = computedLast; hasChanges = true; }
      }
    }

    // Email and phone from documents (if any)
    if (extractedData.email && shouldOverwrite(updated.email, extractedData.email)) {
      updated.email = extractedData.email.trim();
      hasChanges = true;
    }
    if (extractedData.phone && shouldOverwrite(updated.phone, extractedData.phone, { minLen: 9 })) {
      updated.phone = extractedData.phone.toString().trim();
      hasChanges = true;
    }
    
    if (extractedData.registration_number && shouldOverwrite(updated.vehicle_registration, extractedData.registration_number, { minLen: 6 })) {
      updated.vehicle_registration = extractedData.registration_number.toUpperCase();
      hasChanges = true;
    }
    
    if (extractedData.chassis_number && shouldOverwrite(updated.chassis_number, extractedData.chassis_number, { minLen: 6 })) {
      updated.chassis_number = extractedData.chassis_number.toUpperCase();
      hasChanges = true;
    }
    
    if (extractedData.kra_pin && shouldOverwrite(updated.kra_pin, extractedData.kra_pin, { minLen: 8 })) {
      updated.kra_pin = extractedData.kra_pin.toUpperCase();
      hasChanges = true;
    }
    
    if (extractedData.id_number && shouldOverwrite(updated.id_number, extractedData.id_number, { minLen: 6 })) {
      updated.id_number = extractedData.id_number;
      hasChanges = true;
    }
    
    // Make and model from logbook
    if (extractedData.make && shouldOverwrite(updated.vehicle_make, extractedData.make)) {
      updated.vehicle_make = extractedData.make;
      hasChanges = true;
    }
    
    if (extractedData.model && shouldOverwrite(updated.vehicle_model, extractedData.model)) {
      updated.vehicle_model = extractedData.model;
      hasChanges = true;
    }

    // Engine number (keep in values for later submission even if not displayed)
    if (extractedData.engine_number && shouldOverwrite(updated.engine_number, extractedData.engine_number, { minLen: 6 })) {
      updated.engine_number = extractedData.engine_number.toUpperCase();
      hasChanges = true;
    }
    
    // Apply changes if any fields were filled
    if (hasChanges && !hasAppliedExtractedData.current) {
      hasAppliedExtractedData.current = true;
      onChange?.(updated);
      console.log('✅ Client form auto-filled from extracted data:', updated);
    }
  }, [extractedData]); // Re-run when extractedData changes

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
        placeholder="Auto-filled from documents"
        status={getFieldStatus('first_name', 'owner_name')}
      />
      <Field 
        label="Last Name" 
        value={values.last_name} 
        onChangeText={(v) => update('last_name', v)} 
        placeholder="Auto-filled from documents"
        status={getFieldStatus('last_name', 'owner_name')}
      />
      <Field 
        label="KRA PIN" 
        value={values.kra_pin} 
        onChangeText={(v) => update('kra_pin', (v || '').toUpperCase())} 
        autoCapitalize="characters" 
        placeholder="Auto-filled from KRA PIN doc"
        status={getFieldStatus('kra_pin', 'kra_pin')}
      />
      <Field 
        label="ID Number" 
        value={values.id_number} 
        onChangeText={(v) => update('id_number', v)} 
        placeholder="Auto-filled from ID document" 
        keyboardType="numeric"
        status={getFieldStatus('id_number', 'id_number')}
      />

      {/* Contact Details */}
      <Field 
        label="Email" 
        value={values.email} 
        onChangeText={(v) => update('email', v)} 
        placeholder="Enter client email"
        keyboardType="email-address"
        autoCapitalize="none"
        status={getFieldStatus('email', 'email')}
      />
      <Field 
        label="Phone" 
        value={values.phone} 
        onChangeText={(v) => update('phone', v)} 
        placeholder="Enter client phone"
        keyboardType="phone-pad"
        status={getFieldStatus('phone', 'phone')}
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
      
      {/* Vehicle Make - Dropdown Select */}
      <SelectField 
        label="Make" 
        value={values.vehicle_make}
        options={VEHICLE_MAKES}
        onValueChange={(v) => {
          console.log('Make selected:', v);
          update('vehicle_make', v);
          // Clear model when make changes
          if (values.vehicle_model && v !== values.vehicle_make) {
            update('vehicle_model', '');
          }
        }}
        placeholder="Select vehicle make"
        status={getFieldStatus('vehicle_make', 'make')}
        disabled={false}
      />
      
      {/* Vehicle Model - Dropdown Select (depends on Make) */}
      <SelectField 
        label="Model" 
        value={values.vehicle_model}
        options={values.vehicle_make ? getModelsForMake(values.vehicle_make) : []}
        onValueChange={(v) => {
          console.log('Model selected:', v);
          update('vehicle_model', v);
        }}
        placeholder={values.vehicle_make ? "Select vehicle model" : "Select make first"}
        disabled={!values.vehicle_make}
        status={getFieldStatus('vehicle_model', 'model')}
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
