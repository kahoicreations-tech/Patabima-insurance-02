/**
 * Motor Insurance Form Components
 * Dynamic form components for different motor insurance categories
 * Based on PataBima Motor Insurance Fields Document
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  Switch
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// ===============================
// PRIVATE MOTOR INSURANCE FORMS
// ===============================

/**
 * Private TOR Form Component
 */
export const PrivateTORForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    // Basic Vehicle Information
    vehicleClass: '',
    vehicleType: '',
    vehicleSubclass: '',
    registrationNumber: '',
    chasisNumber: '',
    engineNumber: '',
    
    // Vehicle Details
    make: '',
    model: '',
    yearOfManufacture: '',
    bodyType: '',
    color: '',
    engineCapacity: '',
    
    // Financial Information
    vehicleValue: '',
    vehicleSeats: '',
    vehicleTonnage: '',
    
    // Owner/Policy Holder Information
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    emailAddress: '',
    physicalAddress: '',
    occupation: '',
    kraPin: '',
    dateOfBirth: new Date(),
    gender: '',
    
    // TOR Specific Fields
    startDate: new Date(),
    endDate: new Date(),
    underwriter: '',
    agentCode: '',
    
    // Coverage Options
    coverage: 'tor'
  });

  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState('start');

  const requiredFields = [
    'vehicleClass', 'vehicleType', 'registrationNumber', 'make', 'model',
    'firstName', 'lastName', 'phoneNumber', 'underwriter'
  ];

  const vehicleClasses = [
    { label: 'Private Car', value: 'private_car' },
    { label: 'Private Commercial', value: 'private_commercial' }
  ];

  const vehicleTypes = [
    { label: 'Motor Car', value: 'motor_car' },
    { label: 'Motor Cycle', value: 'motor_cycle' },
    { label: 'Motor Tricycle', value: 'motor_tricycle' }
  ];

  const bodyTypes = [
    { label: 'Saloon', value: 'saloon' },
    { label: 'Station Wagon', value: 'station_wagon' },
    { label: 'Hatchback', value: 'hatchback' },
    { label: 'SUV', value: 'suv' },
    { label: 'Pick-up', value: 'pickup' },
    { label: 'Van', value: 'van' }
  ];

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateField(datePickerType === 'start' ? 'startDate' : 'endDate', selectedDate);
    }
  };

  const handleSubmit = () => {
    // Validate form data
    const validation = FormFieldValidator.validateFormData(formData, requiredFields);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert(
        'Validation Error', 
        'Please correct the highlighted fields and try again.'
      );
      return;
    }

    // Clear errors and submit
    setErrors({});
    onSubmit(formData);
  };

  const renderError = (fieldName) => {
    if (errors[fieldName]) {
      return <Text style={styles.errorText}>{errors[fieldName]}</Text>;
    }
    return null;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Vehicle Information</Text>
      
      {/* Vehicle Class */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Vehicle Class *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.vehicleClass}
            onValueChange={(value) => updateField('vehicleClass', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Vehicle Class" value="" />
            {vehicleClasses.map(item => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Vehicle Type */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Vehicle Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.vehicleType}
            onValueChange={(value) => updateField('vehicleType', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Vehicle Type" value="" />
            {vehicleTypes.map(item => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Registration Number */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Registration Number *</Text>
        <TextInput
          style={[styles.textInput, errors.registrationNumber && styles.textInputError]}
          value={formData.registrationNumber}
          onChangeText={(value) => updateField('registrationNumber', value)}
          placeholder="Enter registration number"
          autoCapitalize="characters"
        />
        {renderError('registrationNumber')}
      </View>

      {/* Chassis Number */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Chassis Number</Text>
        <TextInput
          style={styles.textInput}
          value={formData.chasisNumber}
          onChangeText={(value) => updateField('chasisNumber', value)}
          placeholder="Enter chassis number"
          autoCapitalize="characters"
        />
      </View>

      {/* Engine Number */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Engine Number</Text>
        <TextInput
          style={styles.textInput}
          value={formData.engineNumber}
          onChangeText={(value) => updateField('engineNumber', value)}
          placeholder="Enter engine number"
          autoCapitalize="characters"
        />
      </View>

      {/* Make and Model */}
      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Make *</Text>
          <TextInput
            style={[styles.textInput, errors.make && styles.textInputError]}
            value={formData.make}
            onChangeText={(value) => updateField('make', value)}
            placeholder="e.g., Toyota"
          />
          {renderError('make')}
        </View>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.label}>Model *</Text>
          <TextInput
            style={[styles.textInput, errors.model && styles.textInputError]}
            value={formData.model}
            onChangeText={(value) => updateField('model', value)}
            placeholder="e.g., Camry"
          />
          {renderError('model')}
        </View>
      </View>

      {/* Year and Body Type */}
      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Year of Manufacture</Text>
          <TextInput
            style={styles.textInput}
            value={formData.yearOfManufacture}
            onChangeText={(value) => updateField('yearOfManufacture', value)}
            placeholder="e.g., 2020"
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.label}>Body Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.bodyType}
              onValueChange={(value) => updateField('bodyType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Body Type" value="" />
              {bodyTypes.map(item => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Policy Holder Information</Text>

      {/* Names */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={[styles.textInput, errors.firstName && styles.textInputError]}
          value={formData.firstName}
          onChangeText={(value) => updateField('firstName', value)}
          placeholder="Enter first name"
        />
        {renderError('firstName')}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Middle Name</Text>
        <TextInput
          style={styles.textInput}
          value={formData.middleName}
          onChangeText={(value) => updateField('middleName', value)}
          placeholder="Enter middle name"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={[styles.textInput, errors.lastName && styles.textInputError]}
          value={formData.lastName}
          onChangeText={(value) => updateField('lastName', value)}
          placeholder="Enter last name"
        />
        {renderError('lastName')}
      </View>

      {/* Contact Information */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={[styles.textInput, errors.phoneNumber && styles.textInputError]}
          value={formData.phoneNumber}
          onChangeText={(value) => updateField('phoneNumber', value)}
          placeholder="e.g., +254700000000"
          keyboardType="phone-pad"
        />
        {renderError('phoneNumber')}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.textInput, errors.emailAddress && styles.textInputError]}
          value={formData.emailAddress}
          onChangeText={(value) => updateField('emailAddress', value)}
          placeholder="Enter email address"
          keyboardType="email-address"
        />
        {renderError('emailAddress')}
      </View>

      <Text style={styles.sectionTitle}>Coverage Period</Text>

      {/* Start Date */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Start Date *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            setDatePickerType('start');
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.dateButtonText}>
            {formData.startDate.toDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* End Date */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>End Date *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            setDatePickerType('end');
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.dateButtonText}>
            {formData.endDate.toDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Creating TOR...' : 'Create TOR Certificate'}
        </Text>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={formData[datePickerType === 'start' ? 'startDate' : 'endDate']}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );
};

// ===============================
// PRIVATE THIRD-PARTY FORM
// ===============================

export const PrivateThirdPartyForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    // Vehicle Information
    vehicleClass: '',
    vehicleType: '',
    vehicleSubclass: '',
    registrationNumber: '',
    chasisNumber: '',
    engineNumber: '',
    make: '',
    model: '',
    yearOfManufacture: '',
    bodyType: '',
    color: '',
    engineCapacity: '',
    vehicleValue: '',
    vehicleSeats: '',
    
    // Policy Holder Information
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    emailAddress: '',
    physicalAddress: '',
    occupation: '',
    kraPin: '',
    dateOfBirth: new Date(),
    gender: '',
    
    // Coverage Information
    startDate: new Date(),
    endDate: new Date(),
    underwriter: '',
    agentCode: '',
    coverage: 'third_party',
    
    // Premium Information
    basicPremium: '',
    phcfLevy: '',
    stampDuty: '',
    totalPremium: ''
  });

  // Form logic similar to TOR form but with additional fields
  // Implementation follows same pattern as above...

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Private Third-Party Insurance</Text>
      {/* Form fields similar to TOR but with third-party specific fields */}
      {/* Implementation continues... */}
    </ScrollView>
  );
};

// ===============================
// COMMERCIAL VEHICLE FORMS
// ===============================

export const CommercialThirdPartyForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    // Commercial Vehicle Specific Fields
    vehicleClass: 'commercial',
    vehicleType: '',
    vehicleSubclass: '',
    registrationNumber: '',
    chasisNumber: '',
    engineNumber: '',
    make: '',
    model: '',
    yearOfManufacture: '',
    bodyType: '',
    color: '',
    engineCapacity: '',
    vehicleValue: '',
    vehicleSeats: '',
    vehicleTonnage: '',
    
    // Commercial Specific
    useOfVehicle: '',
    carryingCapacity: '',
    numberOfPassengers: '',
    
    // Policy Holder Information
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    emailAddress: '',
    physicalAddress: '',
    occupation: '',
    kraPin: '',
    dateOfBirth: new Date(),
    gender: '',
    
    // Company Information (if applicable)
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    
    // Coverage Information
    startDate: new Date(),
    endDate: new Date(),
    underwriter: '',
    agentCode: '',
    coverage: 'third_party'
  });

  // Implementation follows similar pattern...
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Commercial Third-Party Insurance</Text>
      {/* Commercial vehicle specific form fields */}
    </ScrollView>
  );
};

// ===============================
// MOTORCYCLE FORM
// ===============================

export const MotorcycleForm = ({ coverageType = 'third_party', onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    vehicleClass: 'motorcycle',
    vehicleType: 'motor_cycle',
    registrationNumber: '',
    chasisNumber: '',
    engineNumber: '',
    make: '',
    model: '',
    yearOfManufacture: '',
    color: '',
    engineCapacity: '',
    vehicleValue: '',
    
    // Motorcycle Specific
    motorcycleType: '', // standard, sports, cruiser, etc.
    
    // Owner Information
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    emailAddress: '',
    physicalAddress: '',
    occupation: '',
    kraPin: '',
    dateOfBirth: new Date(),
    gender: '',
    
    // Coverage
    startDate: new Date(),
    endDate: new Date(),
    underwriter: '',
    agentCode: '',
    coverage: coverageType
  });

  // Implementation for motorcycle-specific form...
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>
        Motorcycle {coverageType === 'comprehensive' ? 'Comprehensive' : 'Third-Party'} Insurance
      </Text>
      {/* Motorcycle specific form fields */}
    </ScrollView>
  );
};

// ===============================
// COMPREHENSIVE INSURANCE FORM
// ===============================

export const ComprehensiveInsuranceForm = ({ vehicleCategory = 'private', onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    // Basic Information
    vehicleClass: vehicleCategory,
    vehicleType: '',
    registrationNumber: '',
    chasisNumber: '',
    engineNumber: '',
    make: '',
    model: '',
    yearOfManufacture: '',
    bodyType: '',
    color: '',
    engineCapacity: '',
    vehicleValue: '',
    vehicleSeats: '',
    
    // Comprehensive Specific
    excess: '',
    windscreenLimit: '',
    accessoriesValue: '',
    radioValue: '',
    
    // Additional Covers
    riots: false,
    floods: false,
    earthquakes: false,
    personalAccident: false,
    medicalExpenses: false,
    
    // Owner Information
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    emailAddress: '',
    physicalAddress: '',
    occupation: '',
    kraPin: '',
    dateOfBirth: new Date(),
    gender: '',
    
    // Coverage
    startDate: new Date(),
    endDate: new Date(),
    underwriter: '',
    agentCode: '',
    coverage: 'comprehensive'
  });

  // Implementation for comprehensive insurance form...
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>
        {vehicleCategory.charAt(0).toUpperCase() + vehicleCategory.slice(1)} Comprehensive Insurance
      </Text>
      {/* Comprehensive insurance specific form fields */}
    </ScrollView>
  );
};

// ===============================
// FORM UTILITIES
// ===============================

export const FormFieldValidator = {
  validateRegistrationNumber: (regNumber) => {
    const kenyanRegex = /^K[A-Z]{2}\s?\d{3}[A-Z]$/;
    return {
      isValid: kenyanRegex.test(regNumber),
      message: 'Invalid Kenyan registration format (e.g., KCA 123A)'
    };
  },
  
  validatePhoneNumber: (phone) => {
    const kenyanPhoneRegex = /^(\+254|0)[17]\d{8}$/;
    return {
      isValid: kenyanPhoneRegex.test(phone),
      message: 'Invalid Kenyan phone number format'
    };
  },
  
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      message: 'Invalid email format'
    };
  },
  
  validateKRAPin: (pin) => {
    const kraRegex = /^[AP]\d{9}[A-Z]$/;
    return {
      isValid: kraRegex.test(pin),
      message: 'Invalid KRA PIN format (e.g., A123456789Z)'
    };
  },
  
  validateRequired: (value, fieldName) => {
    const isValid = value && value.toString().trim() !== '';
    return {
      isValid,
      message: `${fieldName} is required`
    };
  },
  
  validateYear: (year) => {
    const currentYear = new Date().getFullYear();
    const numYear = parseInt(year);
    const isValid = numYear >= 1980 && numYear <= currentYear + 1;
    return {
      isValid,
      message: `Year must be between 1980 and ${currentYear + 1}`
    };
  },
  
  validateEngineCapacity: (capacity) => {
    const numCapacity = parseFloat(capacity);
    const isValid = numCapacity > 0 && numCapacity <= 10000;
    return {
      isValid,
      message: 'Engine capacity must be between 1 and 10000 CC'
    };
  },
  
  validateVehicleValue: (value) => {
    const numValue = parseFloat(value);
    const isValid = numValue >= 50000 && numValue <= 50000000;
    return {
      isValid,
      message: 'Vehicle value must be between KES 50,000 and KES 50,000,000'
    };
  },

  validateFormData: (formData, requiredFields = []) => {
    const errors = {};
    
    // Check required fields
    requiredFields.forEach(field => {
      const validation = FormFieldValidator.validateRequired(formData[field], field);
      if (!validation.isValid) {
        errors[field] = validation.message;
      }
    });
    
    // Specific field validations
    if (formData.registrationNumber) {
      const regValidation = FormFieldValidator.validateRegistrationNumber(formData.registrationNumber);
      if (!regValidation.isValid) {
        errors.registrationNumber = regValidation.message;
      }
    }
    
    if (formData.phoneNumber) {
      const phoneValidation = FormFieldValidator.validatePhoneNumber(formData.phoneNumber);
      if (!phoneValidation.isValid) {
        errors.phoneNumber = phoneValidation.message;
      }
    }
    
    if (formData.emailAddress) {
      const emailValidation = FormFieldValidator.validateEmail(formData.emailAddress);
      if (!emailValidation.isValid) {
        errors.emailAddress = emailValidation.message;
      }
    }
    
    if (formData.kraPin) {
      const kraValidation = FormFieldValidator.validateKRAPin(formData.kraPin);
      if (!kraValidation.isValid) {
        errors.kraPin = kraValidation.message;
      }
    }
    
    if (formData.yearOfManufacture) {
      const yearValidation = FormFieldValidator.validateYear(formData.yearOfManufacture);
      if (!yearValidation.isValid) {
        errors.yearOfManufacture = yearValidation.message;
      }
    }
    
    if (formData.engineCapacity) {
      const capacityValidation = FormFieldValidator.validateEngineCapacity(formData.engineCapacity);
      if (!capacityValidation.isValid) {
        errors.engineCapacity = capacityValidation.message;
      }
    }
    
    if (formData.vehicleValue) {
      const valueValidation = FormFieldValidator.validateVehicleValue(formData.vehicleValue);
      if (!valueValidation.isValid) {
        errors.vehicleValue = valueValidation.message;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// ===============================
// STYLES
// ===============================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#D5222B',
    paddingBottom: 5
  },
  fieldGroup: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  textInputError: {
    borderColor: '#f44336'
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  picker: {
    height: 50
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff'
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333'
  },
  submitButton: {
    backgroundColor: '#D5222B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});