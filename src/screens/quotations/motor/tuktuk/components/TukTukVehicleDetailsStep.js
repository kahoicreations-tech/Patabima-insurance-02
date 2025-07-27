/**
 * TukTukVehicleDetailsStep - Vehicle details collection for TukTuk insurance
 * Specialized for three-wheeler vehicles with specific requirements
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors, Typography, Spacing } from '../../../../../constants';

const TukTukVehicleDetailsStep = ({
  formData,
  onUpdateFormData,
  errors = {},
  showHeader = true,
}) => {
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  const tukTukMakes = [
    'Bajaj',
    'TVS',
    'Mahindra',
    'Piaggio',
    'Force',
    'Other'
  ];

  const tukTukUsageTypes = [
    { value: 'passenger', label: 'Passenger Transport' },
    { value: 'goods', label: 'Goods Transport' },
    { value: 'mixed', label: 'Mixed Use (Passenger & Goods)' },
    { value: 'personal', label: 'Personal Use' }
  ];

  const fuelTypes = [
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'cng', label: 'CNG' },
    { value: 'lpg', label: 'LPG' },
    { value: 'electric', label: 'Electric' }
  ];

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>TukTuk Vehicle Details</Text>
          <Text style={styles.subtitle}>
            Provide details about your three-wheeler vehicle
          </Text>
        </View>
      )}

      <View style={styles.formSection}>
        {/* Vehicle Make */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Vehicle Make <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.pickerContainer, errors.vehicleMake && styles.inputError]}>
            <Picker
              selectedValue={formData.vehicleMake || ''}
              onValueChange={(value) => updateFormData({ vehicleMake: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select Make" value="" />
              {tukTukMakes.map((make) => (
                <Picker.Item key={make} label={make} value={make} />
              ))}
            </Picker>
          </View>
          {errors.vehicleMake && (
            <Text style={styles.errorText}>{errors.vehicleMake}</Text>
          )}
        </View>

        {/* Vehicle Model */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Vehicle Model <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.vehicleModel && styles.inputError]}
            value={formData.vehicleModel || ''}
            onChangeText={(text) => updateFormData({ vehicleModel: text })}
            placeholder="e.g., RE 2S, King, Ace"
          />
          {errors.vehicleModel && (
            <Text style={styles.errorText}>{errors.vehicleModel}</Text>
          )}
        </View>

        {/* Year of Manufacture */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Year of Manufacture <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.vehicleYear && styles.inputError]}
            value={formData.vehicleYear || ''}
            onChangeText={(text) => updateFormData({ vehicleYear: text })}
            placeholder="e.g., 2020"
            keyboardType="numeric"
            maxLength={4}
          />
          {errors.vehicleYear && (
            <Text style={styles.errorText}>{errors.vehicleYear}</Text>
          )}
        </View>

        {/* Registration/Plate Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Registration/Plate Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.plateNumber && styles.inputError]}
            value={formData.plateNumber || ''}
            onChangeText={(text) => updateFormData({ plateNumber: text.toUpperCase() })}
            placeholder="e.g., KCA 123A"
            autoCapitalize="characters"
          />
          {errors.plateNumber && (
            <Text style={styles.errorText}>{errors.plateNumber}</Text>
          )}
        </View>

        {/* Chassis Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Chassis Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.chassisNumber && styles.inputError]}
            value={formData.chassisNumber || ''}
            onChangeText={(text) => updateFormData({ chassisNumber: text.toUpperCase() })}
            placeholder="17-character chassis number"
            autoCapitalize="characters"
            maxLength={17}
          />
          {errors.chassisNumber && (
            <Text style={styles.errorText}>{errors.chassisNumber}</Text>
          )}
        </View>

        {/* Engine Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Engine Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.engineNumber && styles.inputError]}
            value={formData.engineNumber || ''}
            onChangeText={(text) => updateFormData({ engineNumber: text.toUpperCase() })}
            placeholder="Engine number from logbook"
            autoCapitalize="characters"
          />
          {errors.engineNumber && (
            <Text style={styles.errorText}>{errors.engineNumber}</Text>
          )}
        </View>

        {/* Engine Capacity (CC) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Engine Capacity (CC) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.engineCapacity && styles.inputError]}
            value={formData.engineCapacity || ''}
            onChangeText={(text) => updateFormData({ engineCapacity: text })}
            placeholder="e.g., 200"
            keyboardType="numeric"
          />
          {errors.engineCapacity && (
            <Text style={styles.errorText}>{errors.engineCapacity}</Text>
          )}
        </View>

        {/* Fuel Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Fuel Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.pickerContainer, errors.fuelType && styles.inputError]}>
            <Picker
              selectedValue={formData.fuelType || ''}
              onValueChange={(value) => updateFormData({ fuelType: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select Fuel Type" value="" />
              {fuelTypes.map((fuel) => (
                <Picker.Item key={fuel.value} label={fuel.label} value={fuel.value} />
              ))}
            </Picker>
          </View>
          {errors.fuelType && (
            <Text style={styles.errorText}>{errors.fuelType}</Text>
          )}
        </View>

        {/* Seating Capacity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Seating Capacity <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.seatingCapacity && styles.inputError]}
            value={formData.seatingCapacity || ''}
            onChangeText={(text) => updateFormData({ seatingCapacity: text })}
            placeholder="e.g., 3 (including driver)"
            keyboardType="numeric"
            maxLength={1}
          />
          {errors.seatingCapacity && (
            <Text style={styles.errorText}>{errors.seatingCapacity}</Text>
          )}
        </View>

        {/* Primary Usage */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Primary Usage <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.pickerContainer, errors.vehicleUsage && styles.inputError]}>
            <Picker
              selectedValue={formData.vehicleUsage || ''}
              onValueChange={(value) => updateFormData({ vehicleUsage: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select Usage Type" value="" />
              {tukTukUsageTypes.map((usage) => (
                <Picker.Item key={usage.value} label={usage.label} value={usage.value} />
              ))}
            </Picker>
          </View>
          {errors.vehicleUsage && (
            <Text style={styles.errorText}>{errors.vehicleUsage}</Text>
          )}
        </View>

        {/* Daily Operating Hours */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Daily Operating Hours <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.operatingHours && styles.inputError]}
            value={formData.operatingHours || ''}
            onChangeText={(text) => updateFormData({ operatingHours: text })}
            placeholder="e.g., 8-10 hours"
            keyboardType="numeric"
            maxLength={2}
          />
          {errors.operatingHours && (
            <Text style={styles.errorText}>{errors.operatingHours}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.large,
  },
  header: {
    marginBottom: Spacing.large,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.bold,
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    lineHeight: 24,
  },
  formSection: {
    gap: Spacing.large,
  },
  inputGroup: {
    gap: Spacing.small,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
  },
  required: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    fontSize: 16,
    fontFamily: Typography.regular,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontFamily: Typography.regular,
  },
});

export default TukTukVehicleDetailsStep;
