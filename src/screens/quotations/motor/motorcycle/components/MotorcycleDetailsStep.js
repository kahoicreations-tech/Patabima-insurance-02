/**
 * MotorcycleDetailsStep - Motorcycle-specific vehicle details component
 * Handles motorcycle types, engine capacity, and usage patterns
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing } from '../../../../../constants';

const MotorcycleDetailsStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  showValueInput = true,
  requiredFields = ['motorcycleMake', 'motorcycleModel', 'motorcycleYear', 'registrationNumber', 'engineCapacity', 'motorcycleType'],
  enablePolicyValidation = true,
  enableInsuranceDate = true,
  onRegistrationChange = null,
  policyValidation = {
    isChecking: false,
    hasExistingPolicy: false,
    existingPolicyDetails: null,
    validationMessage: '',
    suggestedStartDate: null
  }
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMakeModal, setShowMakeModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Motorcycle data
  const MOTORCYCLE_TYPES = [
    { id: 'standard', name: 'Standard Motorcycle', description: 'General purpose motorcycles for everyday use' },
    { id: 'sports', name: 'Sports Bike', description: 'High-performance racing and sport motorcycles' },
    { id: 'cruiser', name: 'Cruiser', description: 'Comfortable touring and leisure motorcycles' },
    { id: 'scooter', name: 'Scooter', description: 'Small displacement urban transportation' },
    { id: 'dirt_bike', name: 'Dirt Bike', description: 'Off-road and motocross motorcycles' },
    { id: 'moped', name: 'Moped', description: 'Low-power motorcycles with pedals' },
    { id: 'delivery', name: 'Delivery Bike', description: 'Commercial delivery motorcycles' },
  ];

  const MOTORCYCLE_MAKES = [
    'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Bajaj', 'TVS', 'Hero', 'Royal Enfield', 
    'KTM', 'Ducati', 'Harley-Davidson', 'BMW', 'Piaggio', 'Vespa', 'Triumph'
  ];

  const MOTORCYCLE_MODELS = {
    'Honda': ['CB150R', 'CB300R', 'XR150L', 'CRF250', 'CBR250R', 'Activa', 'Wave', 'CB1000R'],
    'Yamaha': ['YBR125', 'MT-07', 'R15', 'FZ', 'YZ250F', 'DT125', 'Crux', 'MT-09', 'R1'],
    'Suzuki': ['GSX-R150', 'Gixxer', 'Hayabusa', 'RM-Z250', 'GD110', 'Access', 'Burgman'],
    'Kawasaki': ['Ninja 250', 'Z650', 'KLX150', 'KX250', 'Versys', 'Vulcan', 'W175', 'ZX-10R'],
    'Bajaj': ['Boxer', 'Pulsar', 'Dominar', 'Discover', 'Platina', 'CT100', 'Avenger'],
    'TVS': ['Apache', 'Star City', 'Sport', 'NTorq', 'Jupiter', 'Victor', 'XL100'],
    'Hero': ['Splendor', 'HF Deluxe', 'Passion', 'Super Splendor', 'Xtreme', 'Destini'],
    'Royal Enfield': ['Classic 350', 'Bullet', 'Himalayan', 'Interceptor', 'Continental GT'],
    'KTM': ['Duke 200', 'RC 200', 'Adventure 250', 'Duke 390', 'RC 390'],
    'Ducati': ['Monster', 'Panigale', 'Multistrada', 'Scrambler', 'Diavel'],
    'Harley-Davidson': ['Street 750', 'Iron 883', 'Sportster', 'Fat Bob', 'Road King'],
    'BMW': ['G310R', 'F750GS', 'R1250GS', 'S1000RR', 'C400X'],
    'Piaggio': ['Vespa', 'Liberty', 'MP3', 'Beverly', 'X-Evo'],
    'Vespa': ['Primavera', 'Sprint', 'GTS', 'Elettrica'],
    'Triumph': ['Street Triple', 'Bonneville', 'Tiger', 'Speed Triple', 'Rocket']
  };

  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);

  // Handle registration number change with policy validation
  const handleRegistrationChange = (text) => {
    const registrationNumber = text.toUpperCase();
    updateFormData({ registrationNumber });
    
    if (enablePolicyValidation && onRegistrationChange && registrationNumber.length >= 6) {
      onRegistrationChange(registrationNumber);
    }
  };

  // Handle insurance start date validation
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateFormData({ insuranceStartDate: selectedDate });
    }
  };

  // Handle motorcycle make selection
  const handleMakeSelect = (make) => {
    updateFormData({ 
      motorcycleMake: make,
      motorcycleModel: '', // Reset model when make changes
    });
    setShowMakeModal(false);
  };

  // Handle motorcycle model selection
  const handleModelSelect = (model) => {
    updateFormData({ motorcycleModel: model });
    setShowModelModal(false);
  };

  // Handle motorcycle type selection
  const handleTypeSelect = (type) => {
    updateFormData({ motorcycleType: type.id, motorcycleTypeName: type.name });
    setShowTypeModal(false);
  };

  // Get available models for selected make
  const getAvailableModels = () => {
    return MOTORCYCLE_MODELS[formData.motorcycleMake] || [];
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Motorcycle Details</Text>
          <Text style={styles.stepSubtitle}>Information about your motorcycle</Text>
        </>
      )}

      {/* Motorcycle Type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Motorcycle Type {isFieldRequired('motorcycleType') && '*'}
        </Text>
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => setShowTypeModal(true)}
        >
          <Text style={[styles.selectText, !formData.motorcycleType && styles.placeholderText]}>
            {formData.motorcycleTypeName || 'Select motorcycle type'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Motorcycle Make */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Motorcycle Make {isFieldRequired('motorcycleMake') && '*'}
        </Text>
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => setShowMakeModal(true)}
        >
          <Text style={[styles.selectText, !formData.motorcycleMake && styles.placeholderText]}>
            {formData.motorcycleMake || 'Select make'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Motorcycle Model */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Motorcycle Model {isFieldRequired('motorcycleModel') && '*'}
        </Text>
        <TouchableOpacity
          style={[styles.selectInput, !formData.motorcycleMake && styles.disabledInput]}
          onPress={() => formData.motorcycleMake && setShowModelModal(true)}
          disabled={!formData.motorcycleMake}
        >
          <Text style={[styles.selectText, !formData.motorcycleModel && styles.placeholderText]}>
            {formData.motorcycleModel || (formData.motorcycleMake ? 'Select model' : 'Select make first')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Year of Manufacture */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Year of Manufacture {isFieldRequired('motorcycleYear') && '*'}
        </Text>
        <TextInput
          style={styles.input}
          value={formData.motorcycleYear}
          onChangeText={(text) => updateFormData({ motorcycleYear: text })}
          placeholder="YYYY"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      {/* Engine Capacity */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Engine Capacity (CC) {isFieldRequired('engineCapacity') && '*'}
        </Text>
        <TextInput
          style={styles.input}
          value={formData.engineCapacity}
          onChangeText={(text) => updateFormData({ engineCapacity: text })}
          placeholder="e.g., 150, 250, 400"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
        <Text style={styles.helperText}>Enter engine displacement in cubic centimeters (CC)</Text>
      </View>

      {/* Registration Number */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Registration Number {isFieldRequired('registrationNumber') && '*'}
        </Text>
        <TextInput
          style={[
            styles.input,
            enablePolicyValidation && policyValidation.hasExistingPolicy && styles.inputWarning
          ]}
          value={formData.registrationNumber}
          onChangeText={handleRegistrationChange}
          placeholder="KXX 000X"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
        />
        
        {/* Policy validation indicator */}
        {enablePolicyValidation && policyValidation.isChecking && (
          <View style={styles.validationIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.validationText}>Checking existing insurance...</Text>
          </View>
        )}
        
        {enablePolicyValidation && policyValidation.validationMessage && !policyValidation.isChecking && (
          <View style={[
            styles.validationResult,
            policyValidation.hasExistingPolicy ? styles.validationWarning : styles.validationSuccess
          ]}>
            <Ionicons 
              name={policyValidation.hasExistingPolicy ? "warning" : "checkmark-circle"} 
              size={16} 
              color={policyValidation.hasExistingPolicy ? Colors.warning : Colors.success} 
            />
            <Text style={[
              styles.validationText,
              policyValidation.hasExistingPolicy ? styles.warningText : styles.successText
            ]}>
              {policyValidation.validationMessage}
            </Text>
          </View>
        )}
      </View>

      {/* Insurance Start Date Selection */}
      {enableInsuranceDate && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Insurance Start Date *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formData.insuranceStartDate?.toLocaleDateString() || 'Select date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={formData.insuranceStartDate || new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
        </View>
      )}

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Motorcycle Type</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MOTORCYCLE_TYPES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleTypeSelect(item)}
                >
                  <View>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    <Text style={styles.modalItemDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Make Selection Modal */}
      <Modal
        visible={showMakeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMakeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Motorcycle Make</Text>
              <TouchableOpacity onPress={() => setShowMakeModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MOTORCYCLE_MAKES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleMakeSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Model Selection Modal */}
      <Modal
        visible={showModelModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Motorcycle Model</Text>
              <TouchableOpacity onPress={() => setShowModelModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={getAvailableModels()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleModelSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_700Bold',
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: 'Poppins_400Regular',
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_500Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    fontFamily: 'Poppins_400Regular',
  },
  inputWarning: {
    borderColor: Colors.warning,
    backgroundColor: '#FFF8E1',
  },
  selectInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  disabledInput: {
    backgroundColor: Colors.backgroundLight,
    opacity: 0.6,
  },
  selectText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  dateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  helperText: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  validationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  validationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: 6,
  },
  validationWarning: {
    backgroundColor: '#FFF8E1',
  },
  validationSuccess: {
    backgroundColor: '#E8F5E8',
  },
  validationText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
  },
  warningText: {
    color: Colors.warning,
  },
  successText: {
    color: Colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItemText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  modalItemTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  modalItemDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
  },
});

export default MotorcycleDetailsStep;
