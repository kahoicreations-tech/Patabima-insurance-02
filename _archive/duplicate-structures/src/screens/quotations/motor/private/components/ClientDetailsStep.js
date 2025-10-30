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

const ClientDetailsStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  errors = {}
}) => {
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showLicenseDatePicker, setShowLicenseDatePicker] = useState(false);

  const handleBirthDateChange = (event, selectedDate) => {
    setShowBirthDatePicker(false);
    if (selectedDate) {
      onUpdateFormData({ dateOfBirth: selectedDate });
    }
  };

  const handleLicenseDateChange = (event, selectedDate) => {
    setShowLicenseDatePicker(false);
    if (selectedDate) {
      onUpdateFormData({ licenseIssueDate: selectedDate });
    }
  };

  const handleExistingCoverChange = (hasExistingCover) => {
    onUpdateFormData({
      hasExistingCover: hasExistingCover,
      existingCoverDetails: hasExistingCover ? formData.existingCoverDetails : ''
    });
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as +254 XXX XXX XXX
    if (cleaned.startsWith('254')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.substring(1)}`;
    } else {
      return `+254${cleaned}`;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <Text style={styles.headerSubtitle}>Tell us about yourself and your driving experience</Text>
        </View>
      )}

      {/* Existing Cover Warning */}
      <View style={styles.warningCard}>
        <Ionicons name="warning-outline" size={20} color="#F59E0B" />
        <Text style={styles.warningText}>
          If you currently have motor insurance, please ensure to cancel it before starting your new policy to avoid double charges.
        </Text>
      </View>

      {/* Personal Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        
        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            value={formData.fullName}
            onChangeText={(text) => onUpdateFormData({ fullName: text })}
            placeholder="Enter your full name"
            placeholderTextColor="#999"
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}
        </View>

        {/* National ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>National ID Number *</Text>
          <TextInput
            style={[styles.input, errors.nationalId && styles.inputError]}
            value={formData.nationalId}
            onChangeText={(text) => onUpdateFormData({ nationalId: text })}
            placeholder="Enter your National ID number"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={8}
          />
          {errors.nationalId && (
            <Text style={styles.errorText}>{errors.nationalId}</Text>
          )}
        </View>

        {/* Date of Birth */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date of Birth *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowBirthDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.dateOfBirth ? formData.dateOfBirth.toLocaleDateString() : 'Select date of birth'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
          
          {showBirthDatePicker && (
            <DateTimePicker
              value={formData.dateOfBirth || new Date()}
              mode="date"
              display="default"
              onChange={handleBirthDateChange}
              maximumDate={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000)} // 18 years ago
            />
          )}
          {errors.dateOfBirth && (
            <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
          )}
        </View>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            value={formData.phoneNumber}
            onChangeText={(text) => onUpdateFormData({ phoneNumber: formatPhoneNumber(text) })}
            placeholder="+254 XXX XXX XXX"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={formData.email}
            onChangeText={(text) => onUpdateFormData({ email: text })}
            placeholder="Enter your email address"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>
      </View>

      {/* Driving License Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driving License</Text>
        
        {/* License Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Driving License Number *</Text>
          <TextInput
            style={[styles.input, errors.licenseNumber && styles.inputError]}
            value={formData.licenseNumber}
            onChangeText={(text) => onUpdateFormData({ licenseNumber: text.toUpperCase() })}
            placeholder="Enter license number"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />
          {errors.licenseNumber && (
            <Text style={styles.errorText}>{errors.licenseNumber}</Text>
          )}
        </View>

        {/* License Issue Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>License Issue Date *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowLicenseDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.licenseIssueDate ? formData.licenseIssueDate.toLocaleDateString() : 'Select issue date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
          
          {showLicenseDatePicker && (
            <DateTimePicker
              value={formData.licenseIssueDate || new Date()}
              mode="date"
              display="default"
              onChange={handleLicenseDateChange}
              maximumDate={new Date()}
            />
          )}
          {errors.licenseIssueDate && (
            <Text style={styles.errorText}>{errors.licenseIssueDate}</Text>
          )}
        </View>
      </View>

      {/* Vehicle Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        
        {/* Vehicle Value */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Vehicle Value (KES) *</Text>
          <TextInput
            style={[styles.input, errors.vehicleValue && styles.inputError]}
            value={formData.vehicleValue}
            onChangeText={(text) => onUpdateFormData({ vehicleValue: text })}
            placeholder="Enter vehicle current market value"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          {errors.vehicleValue && (
            <Text style={styles.errorText}>{errors.vehicleValue}</Text>
          )}
        </View>

        {/* Vehicle Usage */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Vehicle Usage *</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                formData.vehicleUsage === 'private' && styles.radioOptionSelected
              ]}
              onPress={() => onUpdateFormData({ vehicleUsage: 'private' })}
            >
              <View style={[
                styles.radioButton,
                formData.vehicleUsage === 'private' && styles.radioButtonSelected
              ]}>
                {formData.vehicleUsage === 'private' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={styles.radioLabel}>Private Use</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                formData.vehicleUsage === 'commercial' && styles.radioOptionSelected
              ]}
              onPress={() => onUpdateFormData({ vehicleUsage: 'commercial' })}
            >
              <View style={[
                styles.radioButton,
                formData.vehicleUsage === 'commercial' && styles.radioButtonSelected
              ]}>
                {formData.vehicleUsage === 'commercial' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={styles.radioLabel}>Commercial Use</Text>
            </TouchableOpacity>
          </View>
          {errors.vehicleUsage && (
            <Text style={styles.errorText}>{errors.vehicleUsage}</Text>
          )}
        </View>
      </View>

      {/* Existing Cover Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Existing Insurance Cover</Text>
        <Text style={styles.sectionSubtitle}>Do you currently have motor insurance for this vehicle?</Text>
        
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              formData.hasExistingCover === true && styles.radioOptionSelected
            ]}
            onPress={() => handleExistingCoverChange(true)}
          >
            <View style={[
              styles.radioButton,
              formData.hasExistingCover === true && styles.radioButtonSelected
            ]}>
              {formData.hasExistingCover === true && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.radioLabel}>Yes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              formData.hasExistingCover === false && styles.radioOptionSelected
            ]}
            onPress={() => handleExistingCoverChange(false)}
          >
            <View style={[
              styles.radioButton,
              formData.hasExistingCover === false && styles.radioButtonSelected
            ]}>
              {formData.hasExistingCover === false && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.radioLabel}>No</Text>
          </TouchableOpacity>
        </View>

        {formData.hasExistingCover && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Insurance Details</Text>
            <TextInput
              style={[styles.textArea, errors.existingCoverDetails && styles.inputError]}
              value={formData.existingCoverDetails}
              onChangeText={(text) => onUpdateFormData({ existingCoverDetails: text })}
              placeholder="Please provide details about your current insurance (company, policy number, expiry date)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
            {errors.existingCoverDetails && (
              <Text style={styles.errorText}>{errors.existingCoverDetails}</Text>
            )}
          </View>
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    marginBottom: 24,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
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
  inputGroup: {
    marginBottom: 16,
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
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
    minHeight: 100,
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
    flexWrap: 'wrap',
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
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default ClientDetailsStep;