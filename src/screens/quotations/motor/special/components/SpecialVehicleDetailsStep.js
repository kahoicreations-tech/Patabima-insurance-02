import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const SpecialVehicleDetailsStep = ({ 
  formData, 
  onDataChange, 
  onNext, 
  onPrevious,
  currentStep,
  totalSteps 
}) => {
  const [localData, setLocalData] = useState({
    vehicleType: formData?.vehicleType || '',
    make: formData?.make || '',
    model: formData?.model || '',
    yearOfManufacture: formData?.yearOfManufacture || '',
    engineNumber: formData?.engineNumber || '',
    chassisNumber: formData?.chassisNumber || '',
    registrationNumber: formData?.registrationNumber || '',
    equipmentCapacity: formData?.equipmentCapacity || '',
    operatingWeight: formData?.operatingWeight || '',
    maximumLiftCapacity: formData?.maximumLiftCapacity || '',
    workingHours: formData?.workingHours || '',
    attachments: formData?.attachments || '',
    specialFeatures: formData?.specialFeatures || '',
    maintenanceSchedule: formData?.maintenanceSchedule || '',
    lastInspectionDate: formData?.lastInspectionDate || '',
    certificationNumber: formData?.certificationNumber || '',
    usagePurpose: formData?.usagePurpose || '',
    operatingEnvironment: formData?.operatingEnvironment || ''
  });

  const vehicleTypes = [
    { label: 'Select Vehicle/Equipment Type', value: '' },
    { label: 'Excavator', value: 'excavator' },
    { label: 'Bulldozer', value: 'bulldozer' },
    { label: 'Crane (Mobile)', value: 'mobile_crane' },
    { label: 'Crane (Tower)', value: 'tower_crane' },
    { label: 'Loader (Front)', value: 'front_loader' },
    { label: 'Loader (Backhoe)', value: 'backhoe_loader' },
    { label: 'Grader', value: 'grader' },
    { label: 'Compactor/Roller', value: 'compactor' },
    { label: 'Dump Truck (Mining)', value: 'mining_dump_truck' },
    { label: 'Concrete Mixer', value: 'concrete_mixer' },
    { label: 'Concrete Pump', value: 'concrete_pump' },
    { label: 'Tractor (Agricultural)', value: 'agricultural_tractor' },
    { label: 'Combine Harvester', value: 'combine_harvester' },
    { label: 'Forklift (Heavy)', value: 'heavy_forklift' },
    { label: 'Mobile Workshop', value: 'mobile_workshop' },
    { label: 'Emergency Vehicle', value: 'emergency_vehicle' },
    { label: 'Specialized Transport', value: 'specialized_transport' }
  ];

  const usagePurposes = [
    { label: 'Select Primary Usage', value: '' },
    { label: 'Construction/Building', value: 'construction' },
    { label: 'Road Construction', value: 'road_construction' },
    { label: 'Mining Operations', value: 'mining' },
    { label: 'Agricultural Work', value: 'agricultural' },
    { label: 'Material Handling', value: 'material_handling' },
    { label: 'Demolition', value: 'demolition' },
    { label: 'Excavation/Earthwork', value: 'excavation' },
    { label: 'Cargo/Equipment Transport', value: 'transport' },
    { label: 'Emergency/Rescue Operations', value: 'emergency' },
    { label: 'Industrial Manufacturing', value: 'industrial' }
  ];

  const operatingEnvironments = [
    { label: 'Select Operating Environment', value: '' },
    { label: 'Urban Construction Sites', value: 'urban_sites' },
    { label: 'Highway/Road Projects', value: 'highway_projects' },
    { label: 'Mining Sites', value: 'mining_sites' },
    { label: 'Agricultural Fields', value: 'agricultural_fields' },
    { label: 'Industrial Complexes', value: 'industrial_complexes' },
    { label: 'Port/Harbor Areas', value: 'port_areas' },
    { label: 'Quarries', value: 'quarries' },
    { label: 'Hazardous Materials Sites', value: 'hazardous_sites' },
    { label: 'Multiple Environments', value: 'multiple_environments' }
  ];

  const maintenanceSchedules = [
    { label: 'Select Maintenance Schedule', value: '' },
    { label: 'Daily Inspection', value: 'daily' },
    { label: 'Weekly Maintenance', value: 'weekly' },
    { label: 'Monthly Service', value: 'monthly' },
    { label: 'Quarterly Overhaul', value: 'quarterly' },
    { label: 'Bi-Annual Major Service', value: 'bi_annual' },
    { label: 'Annual Certification', value: 'annual' }
  ];

  const handleInputChange = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onDataChange(updatedData);
  };

  const validateForm = () => {
    const requiredFields = [
      'vehicleType', 'make', 'model', 'yearOfManufacture',
      'engineNumber', 'chassisNumber', 'equipmentCapacity',
      'operatingWeight', 'usagePurpose', 'operatingEnvironment'
    ];
    
    const missingFields = requiredFields.filter(field => !localData[field]);
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Incomplete Information',
        'Please fill in all required fields before proceeding.'
      );
      return false;
    }

    const currentYear = new Date().getFullYear();
    const year = parseInt(localData.yearOfManufacture);
    if (isNaN(year) || year < 1980 || year > currentYear) {
      Alert.alert('Invalid Year', `Year of manufacture must be between 1980 and ${currentYear}.`);
      return false;
    }

    const capacity = parseFloat(localData.equipmentCapacity);
    if (isNaN(capacity) || capacity <= 0) {
      Alert.alert('Invalid Capacity', 'Equipment capacity must be a positive number.');
      return false;
    }

    const weight = parseFloat(localData.operatingWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Operating weight must be a positive number.');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.stepIndicator}>Step {currentStep} of {totalSteps}</Text>
        <Text style={styles.title}>Special Vehicle Details</Text>
        <Text style={styles.subtitle}>
          Provide detailed information about your special equipment or vehicle
        </Text>
      </View>

      <View style={styles.form}>
        {/* Vehicle/Equipment Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Type & Identification</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle/Equipment Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localData.vehicleType}
                onValueChange={(value) => handleInputChange('vehicleType', value)}
                style={styles.picker}
              >
                {vehicleTypes.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Make/Manufacturer *</Text>
              <TextInput
                style={styles.input}
                value={localData.make}
                onChangeText={(value) => handleInputChange('make', value)}
                placeholder="e.g., Caterpillar, Komatsu"
                placeholderTextColor="#999"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Model *</Text>
              <TextInput
                style={styles.input}
                value={localData.model}
                onChangeText={(value) => handleInputChange('model', value)}
                placeholder="Model number/name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year of Manufacture *</Text>
            <TextInput
              style={styles.input}
              value={localData.yearOfManufacture}
              onChangeText={(value) => handleInputChange('yearOfManufacture', value)}
              placeholder="YYYY"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Engine Number *</Text>
            <TextInput
              style={styles.input}
              value={localData.engineNumber}
              onChangeText={(value) => handleInputChange('engineNumber', value)}
              placeholder="Engine identification number"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chassis/Serial Number *</Text>
            <TextInput
              style={styles.input}
              value={localData.chassisNumber}
              onChangeText={(value) => handleInputChange('chassisNumber', value)}
              placeholder="Chassis or serial number"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registration Number</Text>
            <TextInput
              style={styles.input}
              value={localData.registrationNumber}
              onChangeText={(value) => handleInputChange('registrationNumber', value)}
              placeholder="KCA 123A (if registered)"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Technical Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Specifications</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Equipment Capacity *</Text>
            <TextInput
              style={styles.input}
              value={localData.equipmentCapacity}
              onChangeText={(value) => handleInputChange('equipmentCapacity', value)}
              placeholder="e.g., 20 tonnes, 500 cubic meters"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              value={localData.operatingWeight}
              onChangeText={(value) => handleInputChange('operatingWeight', value)}
              placeholder="Operating weight in kilograms"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Lift Capacity</Text>
            <TextInput
              style={styles.input}
              value={localData.maximumLiftCapacity}
              onChangeText={(value) => handleInputChange('maximumLiftCapacity', value)}
              placeholder="Maximum lifting capacity (if applicable)"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Working Hours</Text>
            <TextInput
              style={styles.input}
              value={localData.workingHours}
              onChangeText={(value) => handleInputChange('workingHours', value)}
              placeholder="Average hours per day"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Attachments/Accessories</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={localData.attachments}
              onChangeText={(value) => handleInputChange('attachments', value)}
              placeholder="List any special attachments or accessories"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Special Features</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={localData.specialFeatures}
              onChangeText={(value) => handleInputChange('specialFeatures', value)}
              placeholder="GPS tracking, safety systems, etc."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Usage & Operations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage & Operations</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primary Usage Purpose *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localData.usagePurpose}
                onValueChange={(value) => handleInputChange('usagePurpose', value)}
                style={styles.picker}
              >
                {usagePurposes.map((purpose) => (
                  <Picker.Item key={purpose.value} label={purpose.label} value={purpose.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Environment *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localData.operatingEnvironment}
                onValueChange={(value) => handleInputChange('operatingEnvironment', value)}
                style={styles.picker}
              >
                {operatingEnvironments.map((env) => (
                  <Picker.Item key={env.value} label={env.label} value={env.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Maintenance & Certification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance & Certification</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maintenance Schedule</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localData.maintenanceSchedule}
                onValueChange={(value) => handleInputChange('maintenanceSchedule', value)}
                style={styles.picker}
              >
                {maintenanceSchedules.map((schedule) => (
                  <Picker.Item key={schedule.value} label={schedule.label} value={schedule.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Inspection Date</Text>
            <TextInput
              style={styles.input}
              value={localData.lastInspectionDate}
              onChangeText={(value) => handleInputChange('lastInspectionDate', value)}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certification Number</Text>
            <TextInput
              style={styles.input}
              value={localData.certificationNumber}
              onChangeText={(value) => handleInputChange('certificationNumber', value)}
              placeholder="Equipment certification number"
              placeholderTextColor="#999"
            />
          </View>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrevious}>
          <Ionicons name="arrow-back" size={20} color="#646767" />
          <Text style={styles.secondaryButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#D5222B',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  primaryButton: {
    backgroundColor: '#D5222B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 0.45,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 0.45,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#646767',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SpecialVehicleDetailsStep;
