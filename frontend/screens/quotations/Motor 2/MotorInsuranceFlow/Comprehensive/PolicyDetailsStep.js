import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PolicyDetailsStep({ 
  values, 
  onChange, 
  errors, 
  selectedProduct 
}) {
  
  const updateField = (field, value) => {
    if (onChange) {
      onChange({ ...values, [field]: value });
    }
  };

  // Validate required fields for comprehensive insurance
  React.useEffect(() => {
    const validateForm = () => {
      const newErrors = {};
      
      // Validate sum_insured - CRITICAL for comprehensive pricing
      const sumInsured = Number(values?.sum_insured || 0);
      if (!sumInsured || sumInsured === 0) {
        newErrors.sum_insured = 'Sum Insured is required for calculating your premium';
      } else if (sumInsured < 50000) {
        newErrors.sum_insured = 'Sum Insured must be at least KSh 50,000';
      } else if (sumInsured > 50000000) {
        newErrors.sum_insured = 'Sum Insured cannot exceed KSh 50,000,000';
      }
      
      // Validate registration number
      if (!values?.registration_number || values.registration_number.trim().length === 0) {
        newErrors.registration_number = 'Registration number is required';
      }
      
      // Validate vehicle make and model
      if (!values?.make || values.make.trim().length === 0) {
        newErrors.make = 'Vehicle make is required';
      }
      
      if (!values?.model || values.model.trim().length === 0) {
        newErrors.model = 'Vehicle model is required';
      }
      
      // Validate year of manufacture
      const currentYear = new Date().getFullYear();
      const year = Number(values?.year_of_manufacture);
      if (!year) {
        newErrors.year_of_manufacture = 'Year of manufacture is required';
      } else if (year < 1900 || year > currentYear + 1) {
        newErrors.year_of_manufacture = `Year must be between 1900 and ${currentYear + 1}`;
      }
      
      // Log validation results
      if (Object.keys(newErrors).length > 0) {
        console.log('⚠️ PolicyDetailsStep validation errors:', newErrors);
      } else {
        console.log('✅ PolicyDetailsStep validation passed');
      }
    };
    
    validateForm();
  }, [values]);

  const formatCurrency = (amount) => {
    if (!amount) return '';
    const numericAmount = String(amount).replace(/[^\d]/g, '');
    return numericAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleCurrencyChange = (field, text) => {
    const numericValue = text.replace(/[^\d]/g, '');
    updateField(field, numericValue);
  };

  const renderFormField = (field, label, placeholder, keyboardType = 'default', isRequired = true) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {isRequired && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          errors?.[field] && styles.inputError
        ]}
        value={values?.[field] || ''}
        onChangeText={(text) => updateField(field, text)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
      {errors?.[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  const renderCurrencyField = (field, label, placeholder, isRequired = true) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {isRequired && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.currencyInputContainer}>
        <Text style={styles.currencySymbol}>KSh</Text>
        <TextInput
          style={[
            styles.currencyInput,
            errors?.[field] && styles.inputError
          ]}
          value={formatCurrency(values?.[field])}
          onChangeText={(text) => handleCurrencyChange(field, text)}
          placeholder={placeholder}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>
      {errors?.[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  const renderDateField = (field, label, isRequired = true) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {isRequired && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          styles.dateInput,
          errors?.[field] && styles.inputError
        ]}
        onPress={() => {
          // TODO: Open date picker
          console.log('Open date picker for', field);
        }}
      >
        <Text style={[
          styles.dateText,
          !values?.[field] && styles.placeholderText
        ]}>
          {values?.[field] || 'Select date'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>
      {errors?.[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Policy Details</Text>
      <Text style={styles.sectionDescription}>
        Please provide the vehicle and coverage information for your comprehensive insurance policy.
      </Text>

      {/* Vehicle Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="car-outline" size={20} color="#D5222B" />
          <Text style={styles.sectionHeaderText}>Vehicle Information</Text>
        </View>

        {renderFormField('registration_number', 'Registration Number', 'e.g. KCA 123A')}
        {renderFormField('make', 'Vehicle Make', 'e.g. Toyota')}
        {renderFormField('model', 'Vehicle Model', 'e.g. Corolla')}
        {renderFormField('year_of_manufacture', 'Year of Manufacture', 'e.g. 2020', 'numeric')}
        {renderFormField('engine_number', 'Engine Number', 'Engine number', 'default', false)}
        {renderFormField('chassis_number', 'Chassis Number', 'Chassis number', 'default', false)}
      </View>

      {/* Coverage Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#D5222B" />
          <Text style={styles.sectionHeaderText}>Coverage Information</Text>
        </View>

        {renderCurrencyField('sum_insured', 'Sum Insured', '0')}
        {renderDateField('policy_start_date', 'Policy Start Date')}
        {renderDateField('policy_end_date', 'Policy End Date')}
      </View>

      {/* Additional Coverage Values Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="add-circle-outline" size={20} color="#D5222B" />
          <Text style={styles.sectionHeaderText}>Additional Coverage Values</Text>
        </View>
        <Text style={styles.sectionNote}>
          These values will be used for calculating add-on premiums
        </Text>

        {renderCurrencyField('windscreen_value', 'Windscreen Value', '0', false)}
        {renderCurrencyField('radio_cassette_value', 'Radio/Audio System Value', '0', false)}
        {renderCurrencyField('vehicle_accessories_value', 'Vehicle Accessories Value', '0', false)}
      </View>

      {/* Policy Holder Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color="#D5222B" />
          <Text style={styles.sectionHeaderText}>Policy Holder Information</Text>
        </View>

        {renderFormField('policy_holder_name', 'Policy Holder Name', 'Full name')}
        {renderFormField('policy_holder_id', 'ID Number', 'National ID number')}
        {renderFormField('policy_holder_phone', 'Phone Number', '+254...')}
        {renderFormField('policy_holder_email', 'Email Address', 'email@example.com', 'email-address', false)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
    fontFamily: 'Poppins-Regular',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 6,
    fontFamily: 'Poppins-Medium',
  },
  required: {
    color: '#D5222B',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    fontFamily: 'Poppins-Regular',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  currencySymbol: {
    paddingLeft: 16,
    paddingRight: 8,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'Poppins-Regular',
  },
  placeholderText: {
    color: '#999',
  },
  inputError: {
    borderColor: '#D5222B',
  },
  errorText: {
    fontSize: 12,
    color: '#D5222B',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});