/**
 * PSVDetailsStep - PSV-specific vehicle details component
 * Handles PSV types, passenger capacity, routes, and SACCO information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// PSV data - simplified with placeholders
const PSV_TYPES = [
  'Matatu', 'Bus', 'Shuttle', 'Taxi', 'Boda Boda', 'Tuk Tuk', 'School Bus', 'Other'
];

const PSV_MAKES = [
  'Toyota', 'Isuzu', 'Mercedes-Benz', 'Mitsubishi', 'Scania', 'Nissan', 
  'Hino', 'Bajaj', 'TVS', 'Honda', 'Ashok Leyland', 'Volvo', 'MAN', 'Other'
];

// Using a single flat list for models
const PSV_MODELS = [
  'Hiace', 'Coaster', 'NQR', 'NPR', 'FRR', 'Sprinter', 'Fuso', 'Rosa',
  'Urvan', 'RE', 'King', 'Bus', 'Minibus', 'Coach', 'Sedan', 'Other'
];

// Generate years from 1990 to current year
const YEARS = [];
const currentYear = new Date().getFullYear();
for (let year = currentYear; year >= 1990; year--) {
  YEARS.push(year.toString());
}

const PSVDetailsStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  showValueInput = true,
  requiredFields = ['psvMake', 'psvModel', 'psvYear', 'registrationNumber', 'passengerCapacity', 'psvType'],
  validationErrors = {}
}) => {
  // Modal visibility states with direct state hooks
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showMakeModal, setShowMakeModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  // Check if a field is required
  const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);

  // Handle form updates
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  // Generic selection modal renderer with improved visibility
  const renderSelectionModal = (
    visible, 
    setVisible, 
    title, 
    data, 
    handleSelect
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>{title}</Text>
            <TouchableOpacity 
              onPress={() => setVisible(false)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={data}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  handleSelect(item);
                  setVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
            style={styles.modalList}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalListContent}
          />
          
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>PSV Details</Text>
          <Text style={styles.stepSubtitle}>Enter your PSV information</Text>
        </>
      )}

      {/* PSV Type Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          PSV Type {isFieldRequired('psvType') && '*'}
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            validationErrors.psvType && styles.inputError
          ]}
          onPress={() => setShowTypeModal(true)}
          activeOpacity={0.7}
        >
          <Text style={formData.psvType ? styles.dropdownText : styles.dropdownPlaceholder}>
            {formData.psvType || "Select PSV Type"}
          </Text>
          <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        {validationErrors.psvType && (
          <Text style={styles.errorText}>{validationErrors.psvType}</Text>
        )}
      </View>

      {/* Vehicle Make Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Vehicle Make {isFieldRequired('psvMake') && '*'}
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            validationErrors.psvMake && styles.inputError
          ]}
          onPress={() => setShowMakeModal(true)}
          activeOpacity={0.7}
        >
          <Text style={formData.psvMake ? styles.dropdownText : styles.dropdownPlaceholder}>
            {formData.psvMake || "Select Vehicle Make"}
          </Text>
          <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        {validationErrors.psvMake && (
          <Text style={styles.errorText}>{validationErrors.psvMake}</Text>
        )}
      </View>

      {/* Vehicle Model Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Vehicle Model {isFieldRequired('psvModel') && '*'}
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            validationErrors.psvModel && styles.inputError
          ]}
          onPress={() => setShowModelModal(true)}
          activeOpacity={0.7}
        >
          <Text style={formData.psvModel ? styles.dropdownText : styles.dropdownPlaceholder}>
            {formData.psvModel || "Select Vehicle Model"}
          </Text>
          <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        {validationErrors.psvModel && (
          <Text style={styles.errorText}>{validationErrors.psvModel}</Text>
        )}
      </View>

      {/* Vehicle Year Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Vehicle Year {isFieldRequired('psvYear') && '*'}
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            validationErrors.psvYear && styles.inputError
          ]}
          onPress={() => setShowYearModal(true)}
          activeOpacity={0.7}
        >
          <Text style={formData.psvYear ? styles.dropdownText : styles.dropdownPlaceholder}>
            {formData.psvYear || "Select Vehicle Year"}
          </Text>
          <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        {validationErrors.psvYear && (
          <Text style={styles.errorText}>{validationErrors.psvYear}</Text>
        )}
      </View>

      {/* Registration Number Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Registration Number {isFieldRequired('registrationNumber') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.registrationNumber && styles.inputError
          ]}
          value={formData.registrationNumber}
          onChangeText={(text) => updateFormData({ registrationNumber: text.toUpperCase() })}
          placeholder="e.g., KDD 123Z"
          placeholderTextColor={Colors.textSecondary}
          maxLength={10}
          autoCapitalize="characters"
        />
        {validationErrors.registrationNumber && (
          <Text style={styles.errorText}>{validationErrors.registrationNumber}</Text>
        )}
      </View>

      {/* Passenger Capacity Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Passenger Capacity {isFieldRequired('passengerCapacity') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.passengerCapacity && styles.inputError
          ]}
          value={formData.passengerCapacity}
          onChangeText={(text) => updateFormData({ passengerCapacity: text.replace(/[^0-9]/g, '') })}
          placeholder="Number of passengers"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          maxLength={3}
        />
        {validationErrors.passengerCapacity && (
          <Text style={styles.errorText}>{validationErrors.passengerCapacity}</Text>
        )}
      </View>

      {/* Primary Route Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Primary Route {isFieldRequired('primaryRoute') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.primaryRoute && styles.inputError
          ]}
          value={formData.primaryRoute}
          onChangeText={(text) => updateFormData({ primaryRoute: text })}
          placeholder="e.g., Nairobi - Mombasa"
          placeholderTextColor={Colors.textSecondary}
        />
        {validationErrors.primaryRoute && (
          <Text style={styles.errorText}>{validationErrors.primaryRoute}</Text>
        )}
      </View>

      {/* SACCO/Company Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          SACCO/Company {isFieldRequired('sacco') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            validationErrors.sacco && styles.inputError
          ]}
          value={formData.sacco}
          onChangeText={(text) => updateFormData({ sacco: text })}
          placeholder="e.g., Super Metro"
          placeholderTextColor={Colors.textSecondary}
        />
        {validationErrors.sacco && (
          <Text style={styles.errorText}>{validationErrors.sacco}</Text>
        )}
      </View>

      {/* Vehicle Value Input (Optional) */}
      {showValueInput && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Vehicle Value (KES) {isFieldRequired('vehicleValue') && '*'}
          </Text>
          <TextInput
            style={[
              styles.input,
              validationErrors.vehicleValue && styles.inputError
            ]}
            value={formData.vehicleValue}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              updateFormData({ 
                vehicleValue: numericValue ? parseInt(numericValue).toLocaleString() : ''
              });
            }}
            placeholder="e.g., 1,000,000"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
          />
          {validationErrors.vehicleValue && (
            <Text style={styles.errorText}>{validationErrors.vehicleValue}</Text>
          )}
        </View>
      )}

      {/* Render modals with improved styling for better visibility */}
      {renderSelectionModal(
        showTypeModal,
        setShowTypeModal,
        "Select PSV Type",
        PSV_TYPES,
        (item) => updateFormData({ psvType: item })
      )}
      
      {renderSelectionModal(
        showMakeModal,
        setShowMakeModal,
        "Select Vehicle Make",
        PSV_MAKES,
        (item) => updateFormData({ psvMake: item })
      )}
      
      {renderSelectionModal(
        showModelModal,
        setShowModelModal,
        "Select Vehicle Model",
        PSV_MODELS,
        (item) => updateFormData({ psvModel: item })
      )}
      
      {renderSelectionModal(
        showYearModal,
        setShowYearModal,
        "Select Vehicle Year",
        YEARS,
        (item) => updateFormData({ psvYear: item })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    ...Typography.body,
    color: Colors.text,
  },
  dropdownButton: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    ...Typography.body,
    color: Colors.text,
  },
  dropdownPlaceholder: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  // Modal styles with improved visibility and contrast
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: '#FFF', // Explicit white for better contrast
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  modalListContent: {
    paddingHorizontal: 5,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalCancelButton: {
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PSVDetailsStep;