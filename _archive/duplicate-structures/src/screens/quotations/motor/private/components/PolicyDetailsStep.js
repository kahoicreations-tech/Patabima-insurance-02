import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const PolicyDetailsStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  availableInsurers = [],
  errors = {}
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleRegistrationMethodChange = (method) => {
    onUpdateFormData({
      vehicleRegistrationMethod: method,
      registrationNumber: method === 'chassis' ? '' : formData.registrationNumber
    });
  };

  const handleFinancialInterestChange = (hasInterest) => {
    onUpdateFormData({
      hasFinancialInterest: hasInterest,
      financierName: hasInterest ? formData.financierName : ''
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      onUpdateFormData({ insuranceStartDate: selectedDate });
    }
  };

  const selectInsurer = (insurer) => {
    onUpdateFormData({ selectedInsurer: insurer });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Policy Details</Text>
          <Text style={styles.headerSubtitle}>Enter your vehicle and policy information</Text>
        </View>
      )}

      {/* Vehicle Registration Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Identification Method</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              formData.vehicleRegistrationMethod === 'registered' && styles.radioOptionSelected
            ]}
            onPress={() => handleRegistrationMethodChange('registered')}
          >
            <View style={[
              styles.radioButton,
              formData.vehicleRegistrationMethod === 'registered' && styles.radioButtonSelected
            ]}>
              {formData.vehicleRegistrationMethod === 'registered' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.radioLabel}>Registered Vehicle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              formData.vehicleRegistrationMethod === 'chassis' && styles.radioOptionSelected
            ]}
            onPress={() => handleRegistrationMethodChange('chassis')}
          >
            <View style={[
              styles.radioButton,
              formData.vehicleRegistrationMethod === 'chassis' && styles.radioButtonSelected
            ]}>
              {formData.vehicleRegistrationMethod === 'chassis' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.radioLabel}>Chassis Number</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Registration Number Input */}
      {formData.vehicleRegistrationMethod === 'registered' && (
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Vehicle Registration Number *</Text>
          <TextInput
            style={[styles.input, errors.registrationNumber && styles.inputError]}
            value={formData.registrationNumber}
            onChangeText={(text) => onUpdateFormData({ registrationNumber: text.toUpperCase() })}
            placeholder="e.g. KCA 123A"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />
          {errors.registrationNumber && (
            <Text style={styles.errorText}>{errors.registrationNumber}</Text>
          )}
        </View>
      )}

      {/* Financial Interest */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Interest</Text>
        <Text style={styles.sectionSubtitle}>Do you have any financial interest in this vehicle?</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              formData.hasFinancialInterest === true && styles.radioOptionSelected
            ]}
            onPress={() => handleFinancialInterestChange(true)}
          >
            <View style={[
              styles.radioButton,
              formData.hasFinancialInterest === true && styles.radioButtonSelected
            ]}>
              {formData.hasFinancialInterest === true && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.radioLabel}>Yes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              formData.hasFinancialInterest === false && styles.radioOptionSelected
            ]}
            onPress={() => handleFinancialInterestChange(false)}
          >
            <View style={[
              styles.radioButton,
              formData.hasFinancialInterest === false && styles.radioButtonSelected
            ]}>
              {formData.hasFinancialInterest === false && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.radioLabel}>No</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Financier Name */}
      {formData.hasFinancialInterest && (
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Financier Name *</Text>
          <TextInput
            style={[styles.input, errors.financierName && styles.inputError]}
            value={formData.financierName}
            onChangeText={(text) => onUpdateFormData({ financierName: text })}
            placeholder="Enter financier/bank name"
            placeholderTextColor="#999"
          />
          {errors.financierName && (
            <Text style={styles.errorText}>{errors.financierName}</Text>
          )}
        </View>
      )}

      {/* Cover Start Date */}
      <View style={styles.section}>
        <Text style={styles.inputLabel}>Cover Start Date *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {formData.insuranceStartDate.toLocaleDateString()}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={formData.insuranceStartDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* Insurance Provider Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Insurance Provider *</Text>
        <Text style={styles.sectionSubtitle}>Choose your preferred insurance company</Text>
        
        <View style={styles.providerList}>
          {availableInsurers.map((insurer) => (
            <TouchableOpacity
              key={insurer.id}
              style={[
                styles.providerCard,
                formData.selectedInsurer?.id === insurer.id && styles.providerCardSelected
              ]}
              onPress={() => selectInsurer(insurer)}
            >
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{insurer.name}</Text>
                <Text style={styles.providerCode}>{insurer.code}</Text>
              </View>
              {formData.selectedInsurer?.id === insurer.id && (
                <Ionicons name="checkmark-circle" size={24} color="#D5222B" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {errors.selectedInsurer && (
          <Text style={styles.errorText}>{errors.selectedInsurer}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioOptionSelected: {
    // Add any selected state styling if needed
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#D5222B',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D5222B',
  },
  radioLabel: {
    fontSize: 16,
    color: '#374151',
  },
  providerList: {
    gap: 12,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  providerCardSelected: {
    borderColor: '#D5222B',
    backgroundColor: '#FEF2F2',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  providerCode: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default PolicyDetailsStep;