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

const SpecialPersonalInformationStep = ({ 
  formData, 
  onDataChange, 
  onNext, 
  onPrevious,
  currentStep,
  totalSteps 
}) => {
  const [localData, setLocalData] = useState({
    fullName: formData?.fullName || '',
    idNumber: formData?.idNumber || '',
    phoneNumber: formData?.phoneNumber || '',
    email: formData?.email || '',
    operatorLicenseNumber: formData?.operatorLicenseNumber || '',
    yearsOfExperience: formData?.yearsOfExperience || '',
    specialOperatorType: formData?.specialOperatorType || '',
    companyName: formData?.companyName || '',
    businessRegistrationNumber: formData?.businessRegistrationNumber || '',
    operationalArea: formData?.operationalArea || '',
    safetyTrainingCertification: formData?.safetyTrainingCertification || '',
    emergencyContactName: formData?.emergencyContactName || '',
    emergencyContactPhone: formData?.emergencyContactPhone || '',
    previousClaims: formData?.previousClaims || ''
  });

  const operatorTypes = [
    { label: 'Select Operator Type', value: '' },
    { label: 'Construction Equipment Operator', value: 'construction' },
    { label: 'Agricultural Machinery Operator', value: 'agricultural' },
    { label: 'Mining Equipment Operator', value: 'mining' },
    { label: 'Industrial Transport Operator', value: 'industrial' },
    { label: 'Specialized Cargo Transport', value: 'cargo' },
    { label: 'Emergency/Rescue Vehicle Operator', value: 'emergency' },
    { label: 'Mobile Services Operator', value: 'mobile_services' },
    { label: 'Heavy Lifting Equipment Operator', value: 'heavy_lifting' }
  ];

  const operationalAreas = [
    { label: 'Select Operational Area', value: '' },
    { label: 'Urban Construction Sites', value: 'urban_construction' },
    { label: 'Rural/Agricultural Areas', value: 'rural_agricultural' },
    { label: 'Mining Sites', value: 'mining_sites' },
    { label: 'Industrial Complexes', value: 'industrial' },
    { label: 'Highway/Road Construction', value: 'highway' },
    { label: 'Port/Harbor Areas', value: 'port' },
    { label: 'Quarries/Excavation Sites', value: 'quarries' },
    { label: 'Multiple Locations', value: 'multiple' }
  ];

  const handleInputChange = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onDataChange(updatedData);
  };

  const validateForm = () => {
    const requiredFields = [
      'fullName', 'idNumber', 'phoneNumber', 'email', 
      'operatorLicenseNumber', 'yearsOfExperience', 
      'specialOperatorType', 'operationalArea'
    ];
    
    const missingFields = requiredFields.filter(field => !localData[field]);
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Incomplete Information',
        'Please fill in all required fields before proceeding.'
      );
      return false;
    }

    if (!/^\d{8}$/.test(localData.idNumber)) {
      Alert.alert('Invalid ID', 'Please enter a valid 8-digit ID number.');
      return false;
    }

    if (!/^(\+254|0)[7-9]\d{8}$/.test(localData.phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number.');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(localData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    const experience = parseInt(localData.yearsOfExperience);
    if (isNaN(experience) || experience < 1) {
      Alert.alert('Invalid Experience', 'Years of experience must be at least 1.');
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
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>
          Provide your personal details and special operator credentials
        </Text>
      </View>

      <View style={styles.form}>
        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={localData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID Number *</Text>
            <TextInput
              style={styles.input}
              value={localData.idNumber}
              onChangeText={(value) => handleInputChange('idNumber', value)}
              placeholder="Enter 8-digit ID number"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={8}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={localData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder="0712345678 or +254712345678"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={localData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="your.email@example.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Operator Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operator Credentials</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operator License Number *</Text>
            <TextInput
              style={styles.input}
              value={localData.operatorLicenseNumber}
              onChangeText={(value) => handleInputChange('operatorLicenseNumber', value)}
              placeholder="Special equipment operator license"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience *</Text>
            <TextInput
              style={styles.input}
              value={localData.yearsOfExperience}
              onChangeText={(value) => handleInputChange('yearsOfExperience', value)}
              placeholder="Years operating special equipment"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operator Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localData.specialOperatorType}
                onValueChange={(value) => handleInputChange('specialOperatorType', value)}
                style={styles.picker}
              >
                {operatorTypes.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Safety Training Certification</Text>
            <TextInput
              style={styles.input}
              value={localData.safetyTrainingCertification}
              onChangeText={(value) => handleInputChange('safetyTrainingCertification', value)}
              placeholder="Safety certification number (optional)"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={localData.companyName}
              onChangeText={(value) => handleInputChange('companyName', value)}
              placeholder="Company or business name (if applicable)"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Registration Number</Text>
            <TextInput
              style={styles.input}
              value={localData.businessRegistrationNumber}
              onChangeText={(value) => handleInputChange('businessRegistrationNumber', value)}
              placeholder="Business registration number (if applicable)"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operational Area *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localData.operationalArea}
                onValueChange={(value) => handleInputChange('operationalArea', value)}
                style={styles.picker}
              >
                {operationalAreas.map((area) => (
                  <Picker.Item key={area.value} label={area.label} value={area.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <TextInput
              style={styles.input}
              value={localData.emergencyContactName}
              onChangeText={(value) => handleInputChange('emergencyContactName', value)}
              placeholder="Name of emergency contact"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={localData.emergencyContactPhone}
              onChangeText={(value) => handleInputChange('emergencyContactPhone', value)}
              placeholder="Emergency contact phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Previous Claims */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claims History</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Previous Claims (Last 5 Years)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={localData.previousClaims}
              onChangeText={(value) => handleInputChange('previousClaims', value)}
              placeholder="Describe any previous insurance claims or incidents"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {onPrevious && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onPrevious}>
            <Ionicons name="arrow-back" size={20} color="#646767" />
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
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
    height: 100,
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
    flex: onPrevious ? 0.45 : 1,
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

export default SpecialPersonalInformationStep;
