/**
 * Private Third-Party Extendible Insurance Screen
 * 
 * This screen handles the Private third-party extendible insurance 
 * quotation flow, offering extended coverage options beyond basic third-party
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing } from '../../../../constants';
import ActionButton from '../../../../components/common/ActionButton';
import Button from '../../../../components/common/Button';

// Vehicle types
const VEHICLE_TYPES = [
  'Saloon', 'Hatchback', 'Station Wagon', 'SUV', 'Pickup', 'Van'
];

// Vehicle makes and models data
const VEHICLE_MAKES = [
  'Toyota', 'Nissan', 'Mazda', 'Subaru', 'Honda', 'Mitsubishi', 
  'Mercedes-Benz', 'BMW', 'Volkswagen', 'Ford', 'Chevrolet', 'Hyundai', 
  'Kia', 'Suzuki', 'Isuzu', 'Land Rover', 'Jeep', 'Audi', 'Volvo', 'Peugeot'
];

const VEHICLE_MODELS = {
  'Toyota': ['Corolla', 'Camry', 'RAV4', 'Prado', 'Land Cruiser', 'Fortuner', 'Hilux', 'Vitz', 'Fielder'],
  'Nissan': ['X-Trail', 'Juke', 'Qashqai', 'Patrol', 'Sunny', 'Tiida', 'Navara', 'Note', 'Serena'],
  'Mazda': ['Demio', 'Axela', 'CX-5', 'CX-3', 'Atenza', 'Familia', 'BT-50', 'Verisa'],
  'Subaru': ['Forester', 'Impreza', 'Legacy', 'Outback', 'XV', 'Tribeca', 'BRZ', 'Levorg'],
  'Honda': ['Fit', 'CRV', 'HRV', 'Accord', 'Civic', 'Vezel', 'Freed', 'Jade', 'Odyssey'],
  'Mitsubishi': ['Outlander', 'Pajero', 'Lancer', 'ASX', 'RVR', 'Mirage', 'L200', 'Galant'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'A-Class', 'B-Class'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X6', '1 Series', '2 Series'],
  'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'Touareg', 'Jetta', 'Caddy', 'Amarok'],
  'Ford': ['Ranger', 'Everest', 'Escape', 'EcoSport', 'Focus', 'Fiesta', 'Mustang', 'Explorer'],
  'Chevrolet': ['Cruze', 'Captiva', 'Trailblazer', 'Spark', 'Aveo', 'Orlando', 'Colorado'],
  'Hyundai': ['Tucson', 'Santa Fe', 'i30', 'i20', 'Accent', 'Elantra', 'Creta', 'Sonata', 'H1'],
  'Kia': ['Sportage', 'Sorento', 'Rio', 'Picanto', 'Cerato', 'Soul', 'Carens'],
  'Suzuki': ['Swift', 'Jimny', 'Vitara', 'Grand Vitara', 'Alto', 'Ciaz', 'Ertiga', 'S-Cross'],
  'Isuzu': ['D-Max', 'MU-X', 'FRR', 'NQR', 'NPR', 'ELF', 'FSR', 'FVR'],
  'Land Rover': ['Discovery', 'Range Rover', 'Defender', 'Range Rover Sport', 'Evoque', 'Freelander'],
  'Jeep': ['Grand Cherokee', 'Cherokee', 'Wrangler', 'Compass', 'Renegade', 'Gladiator'],
  'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'TT', 'A1', 'A5'],
  'Volvo': ['XC60', 'XC90', 'V40', 'S60', 'V60', 'S90', 'V90', 'XC40'],
  'Peugeot': ['208', '308', '3008', '508', '2008', '5008', 'Partner', 'Boxer']
};

// Generate years from 2000 to current year
const YEARS = Array.from(
  {length: new Date().getFullYear() - 1999}, 
  (_, i) => (new Date().getFullYear() - i).toString()
);

// Extra coverage options specific to extendible third-party
const EXTRA_COVERAGE_OPTIONS = [
  { id: 'windscreen', name: 'Windscreen Cover', premium: 3000, description: 'Covers repair or replacement of windscreen without affecting no-claims bonus' },
  { id: 'audio', name: 'Audio Equipment', premium: 2500, description: 'Coverage for factory-installed audio equipment up to KSh 50,000' },
  { id: 'personal_effects', name: 'Personal Effects', premium: 2000, description: 'Coverage for personal belongings in the car up to KSh 30,000' },
  { id: 'medical', name: 'Enhanced Medical Cover', premium: 4000, description: 'Additional medical expenses coverage up to KSh 100,000 for vehicle occupants' },
  { id: 'towing', name: 'Emergency Towing', premium: 2000, description: 'Towing and recovery services in case of accident up to KSh 20,000' },
];

// Third-party insurance constants
const BASE_PREMIUM = 7500; // Higher base premium for extendible
const MIN_PREMIUM = 7500; // Minimum premium allowed

export default function PrivateThirdPartyExtendibleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleReg: '',
    vehicleValue: '',
    selectedCoverage: []
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: form, 2: summary, 3: success
  const [premium, setPremium] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  
  // Modal state
  const [vehicleTypeModalVisible, setVehicleTypeModalVisible] = useState(false);
  const [makeModalVisible, setMakeModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  
  // Effect to calculate premium when relevant fields change
  useEffect(() => {
    if (formData.vehicleType && formData.vehicleYear) {
      calculatePremium();
    }
  }, [formData.vehicleType, formData.vehicleYear, formData.selectedCoverage]);
  
  // Update form fields
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if exists
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };
  
  // Toggle extra coverage selection
  const toggleCoverage = (coverageId) => {
    setFormData(prev => {
      const selectedCoverage = [...prev.selectedCoverage];
      const index = selectedCoverage.indexOf(coverageId);
      
      if (index !== -1) {
        selectedCoverage.splice(index, 1);
      } else {
        selectedCoverage.push(coverageId);
      }
      
      return { ...prev, selectedCoverage };
    });
  };
  
  // Calculate premium for Third-Party Extendible insurance
  const calculatePremium = () => {
    setIsCalculating(true);
    
    // Wait a bit to simulate API call/calculation
    setTimeout(() => {
      try {
        // Base premium calculation
        let calculatedPremium = BASE_PREMIUM;
        
        // Vehicle age adjustment
        const vehicleAge = new Date().getFullYear() - parseInt(formData.vehicleYear);
        if (vehicleAge > 12) {
          calculatedPremium += 3000; // Older vehicles have higher risk
        } else if (vehicleAge > 8) {
          calculatedPremium += 2000;
        } else if (vehicleAge > 5) {
          calculatedPremium += 1000;
        }
        
        // Vehicle type adjustment
        if (['SUV', 'Pickup'].includes(formData.vehicleType)) {
          calculatedPremium += 1500; // Higher premium for larger vehicles
        }
        
        // Add premiums for selected extra coverage options
        formData.selectedCoverage.forEach(coverageId => {
          const coverage = EXTRA_COVERAGE_OPTIONS.find(c => c.id === coverageId);
          if (coverage) {
            calculatedPremium += coverage.premium;
          }
        });
        
        // Ensure minimum premium
        calculatedPremium = Math.max(calculatedPremium, MIN_PREMIUM);
        
        setPremium(calculatedPremium);
      } catch (error) {
        console.error("Premium calculation error:", error);
        setPremium(BASE_PREMIUM); // Fallback to base premium
      } finally {
        setIsCalculating(false);
      }
    }, 1000);
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.ownerName) newErrors.ownerName = 'Owner name is required';
    
    if (!formData.ownerPhone) {
      newErrors.ownerPhone = 'Phone number is required';
    } else if (!/^(0|\+254|254)7\d{8}$/.test(formData.ownerPhone)) {
      newErrors.ownerPhone = 'Enter a valid Kenyan mobile number';
    }
    
    if (formData.ownerEmail && !/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Enter a valid email address';
    }
    
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    if (!formData.vehicleMake) newErrors.vehicleMake = 'Make is required';
    if (!formData.vehicleModel) newErrors.vehicleModel = 'Model is required';
    if (!formData.vehicleYear) newErrors.vehicleYear = 'Year is required';
    
    if (!formData.vehicleReg) {
      newErrors.vehicleReg = 'Registration number is required';
    } else if (!/^K[A-Z]{2}\s?\d{3}[A-Z]$/i.test(formData.vehicleReg)) {
      newErrors.vehicleReg = 'Invalid registration format (e.g. KAA 123Z)';
    }
    
    if (!formData.vehicleValue) {
      newErrors.vehicleValue = 'Vehicle value is required';
    } else {
      const value = parseFloat(formData.vehicleValue);
      if (isNaN(value) || value < 100000) {
        newErrors.vehicleValue = 'Vehicle value must be at least KSh 100,000';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Move to summary step
      setCurrentStep(2);
      setIsSubmitting(false);
      
      // Generate a quotation ID
      setQuotationId(`TPEX-${Math.floor(100000 + Math.random() * 900000)}`);
    } else {
      // Scroll to first error
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }
  };
  
  // Proceed to final step
  const handleConfirm = () => {
    setCurrentStep(3);
  };
  
  // Modal selection for vehicle type
  const renderVehicleTypeModal = () => (
    <Modal
      visible={vehicleTypeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setVehicleTypeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Vehicle Type</Text>
          <FlatList
            data={VEHICLE_TYPES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('vehicleType', item);
                  setVehicleTypeModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setVehicleTypeModalVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </View>
    </Modal>
  );
  
  // Modal selection for vehicle make
  const renderMakeModal = () => (
    <Modal
      visible={makeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setMakeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Vehicle Make</Text>
          <FlatList
            data={VEHICLE_MAKES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('vehicleMake', item);
                  updateField('vehicleModel', ''); // Reset model when make changes
                  setMakeModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setMakeModalVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </View>
    </Modal>
  );
  
  // Modal selection for vehicle model
  const renderModelModal = () => (
    <Modal
      visible={modelModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModelModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Select {formData.vehicleMake} Model
          </Text>
          <FlatList
            data={formData.vehicleMake ? VEHICLE_MODELS[formData.vehicleMake] || [] : []}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('vehicleModel', item);
                  setModelModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setModelModalVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </View>
    </Modal>
  );
  
  // Modal selection for vehicle year
  const renderYearModal = () => (
    <Modal
      visible={yearModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setYearModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Vehicle Year</Text>
          <FlatList
            data={YEARS}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('vehicleYear', item);
                  setYearModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setYearModalVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </View>
    </Modal>
  );
  
  // First step - Vehicle and owner information form
  const renderForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Owner Details</Text>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Owner's Full Name</Text>
        <TextInput
          style={[styles.input, errors.ownerName && styles.inputError]}
          placeholder="Enter owner's full name"
          value={formData.ownerName}
          onChangeText={(text) => updateField('ownerName', text)}
        />
        {errors.ownerName && <Text style={styles.errorText}>{errors.ownerName}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[styles.input, errors.ownerPhone && styles.inputError]}
          placeholder="E.g. 0722123456"
          value={formData.ownerPhone}
          onChangeText={(text) => updateField('ownerPhone', text)}
          keyboardType="phone-pad"
        />
        {errors.ownerPhone && <Text style={styles.errorText}>{errors.ownerPhone}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address (Optional)</Text>
        <TextInput
          style={[styles.input, errors.ownerEmail && styles.inputError]}
          placeholder="Enter email address"
          value={formData.ownerEmail}
          onChangeText={(text) => updateField('ownerEmail', text)}
          keyboardType="email-address"
        />
        {errors.ownerEmail && <Text style={styles.errorText}>{errors.ownerEmail}</Text>}
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Type</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.vehicleType && styles.inputError]}
          onPress={() => setVehicleTypeModalVisible(true)}
        >
          <Text style={formData.vehicleType ? styles.pickerText : styles.placeholderText}>
            {formData.vehicleType || 'Select vehicle type'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.vehicleType && <Text style={styles.errorText}>{errors.vehicleType}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Make</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.vehicleMake && styles.inputError]}
          onPress={() => setMakeModalVisible(true)}
        >
          <Text style={formData.vehicleMake ? styles.pickerText : styles.placeholderText}>
            {formData.vehicleMake || 'Select make'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.vehicleMake && <Text style={styles.errorText}>{errors.vehicleMake}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Model</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.vehicleModel && styles.inputError]}
          onPress={() => {
            if (formData.vehicleMake) {
              setModelModalVisible(true);
            } else {
              Alert.alert('Select Make First', 'Please select vehicle make before model.');
            }
          }}
          disabled={!formData.vehicleMake}
        >
          <Text 
            style={
              formData.vehicleModel 
                ? styles.pickerText 
                : styles.placeholderText
            }
          >
            {formData.vehicleModel || (formData.vehicleMake ? 'Select model' : 'Select make first')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.vehicleModel && <Text style={styles.errorText}>{errors.vehicleModel}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Year</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.vehicleYear && styles.inputError]}
          onPress={() => setYearModalVisible(true)}
        >
          <Text style={formData.vehicleYear ? styles.pickerText : styles.placeholderText}>
            {formData.vehicleYear || 'Select year'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.vehicleYear && <Text style={styles.errorText}>{errors.vehicleYear}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Registration Number</Text>
        <TextInput
          style={[styles.input, errors.vehicleReg && styles.inputError]}
          placeholder="E.g. KAA 123Z"
          value={formData.vehicleReg}
          onChangeText={(text) => updateField('vehicleReg', text.toUpperCase())}
        />
        {errors.vehicleReg && <Text style={styles.errorText}>{errors.vehicleReg}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Value (KSh)</Text>
        <TextInput
          style={[styles.input, errors.vehicleValue && styles.inputError]}
          placeholder="E.g. 1500000"
          value={formData.vehicleValue}
          onChangeText={(text) => updateField('vehicleValue', text)}
          keyboardType="numeric"
        />
        {errors.vehicleValue && <Text style={styles.errorText}>{errors.vehicleValue}</Text>}
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Extra Coverage Options</Text>
        <Text style={styles.sectionSubtitle}>Select additional coverage to extend your third-party policy</Text>
      </View>
      
      {EXTRA_COVERAGE_OPTIONS.map((coverage) => (
        <TouchableOpacity
          key={coverage.id}
          style={[
            styles.coverageOption,
            formData.selectedCoverage.includes(coverage.id) && styles.coverageOptionSelected
          ]}
          onPress={() => toggleCoverage(coverage.id)}
        >
          <View style={styles.coverageCheckbox}>
            {formData.selectedCoverage.includes(coverage.id) ? (
              <Ionicons name="checkbox" size={24} color={Colors.primary} />
            ) : (
              <Ionicons name="square-outline" size={24} color={Colors.gray} />
            )}
          </View>
          <View style={styles.coverageDetails}>
            <View style={styles.coverageHeader}>
              <Text style={styles.coverageName}>{coverage.name}</Text>
              <Text style={styles.coveragePremium}>+ KSh {coverage.premium.toLocaleString()}</Text>
            </View>
            <Text style={styles.coverageDescription}>{coverage.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
      
      {/* Premium calculation section */}
      {premium > 0 && (
        <View style={styles.premiumContainer}>
          <Text style={styles.premiumLabel}>Third-Party Extendible Premium:</Text>
          <Text style={styles.premiumValue}>KES {premium.toLocaleString()}</Text>
        </View>
      )}
      
      <Button
        title="Get Quotation"
        onPress={handleSubmit}
        loading={isSubmitting}
        style={styles.submitButton}
        textStyle={styles.submitButtonText}
      />
    </View>
  );
  
  // Second step - Quotation summary
  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.quotationHeader}>
        <Text style={styles.quotationId}>Quotation #{quotationId}</Text>
        <Text style={styles.quotationDate}>
          {new Date().toLocaleDateString('en-GB')}
        </Text>
      </View>
      
      <View style={styles.summaryCard}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Vehicle Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type:</Text>
            <Text style={styles.summaryValue}>{formData.vehicleType}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Make & Model:</Text>
            <Text style={styles.summaryValue}>
              {formData.vehicleMake} {formData.vehicleModel}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Year:</Text>
            <Text style={styles.summaryValue}>{formData.vehicleYear}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Registration:</Text>
            <Text style={styles.summaryValue}>{formData.vehicleReg}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Value:</Text>
            <Text style={styles.summaryValue}>KSh {parseInt(formData.vehicleValue).toLocaleString()}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Owner Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Name:</Text>
            <Text style={styles.summaryValue}>{formData.ownerName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone:</Text>
            <Text style={styles.summaryValue}>{formData.ownerPhone}</Text>
          </View>
          {formData.ownerEmail && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Email:</Text>
              <Text style={styles.summaryValue}>{formData.ownerEmail}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Coverage Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Basic Coverage:</Text>
            <Text style={styles.summaryValue}>Third Party Extendible</Text>
          </View>
          
          {/* Extra coverage options */}
          {formData.selectedCoverage.length > 0 && (
            <>
              <Text style={styles.extraCoverageTitle}>Extra Coverage:</Text>
              {formData.selectedCoverage.map(coverageId => {
                const coverage = EXTRA_COVERAGE_OPTIONS.find(c => c.id === coverageId);
                return (
                  <View key={coverageId} style={styles.extraCoverageItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.extraCoverageName}>{coverage.name}</Text>
                    <Text style={styles.extraCoveragePremium}>
                      KSh {coverage.premium.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Period:</Text>
            <Text style={styles.summaryValue}>12 Months</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Premium:</Text>
            <Text style={styles.premiumValue}>KES {premium.toLocaleString()}</Text>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setCurrentStep(1)}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.primary} />
            <Text style={styles.editButtonText}>Edit Details</Text>
          </TouchableOpacity>
          
          <Button
            title="Proceed to Payment"
            onPress={handleConfirm}
            style={styles.confirmButton}
            textStyle={styles.confirmButtonText}
          />
        </View>
      </View>
    </View>
  );
  
  // Third step - Success message
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={100} color={Colors.success} />
      </View>
      
      <Text style={styles.successTitle}>Quotation Created!</Text>
      <Text style={styles.successMessage}>
        Your third-party extendible insurance quotation has been created successfully.
      </Text>
      
      <View style={styles.successDetails}>
        <View style={styles.successRow}>
          <Text style={styles.successLabel}>Quotation ID:</Text>
          <Text style={styles.successValue}>{quotationId}</Text>
        </View>
        <View style={styles.successRow}>
          <Text style={styles.successLabel}>Amount:</Text>
          <Text style={styles.successValue}>KES {premium.toLocaleString()}</Text>
        </View>
        <View style={styles.successRow}>
          <Text style={styles.successLabel}>Vehicle:</Text>
          <Text style={styles.successValue}>
            {formData.vehicleMake} {formData.vehicleModel}
          </Text>
        </View>
        <View style={styles.successRow}>
          <Text style={styles.successLabel}>Registration:</Text>
          <Text style={styles.successValue}>{formData.vehicleReg}</Text>
        </View>
      </View>
      
      <View style={styles.successActions}>
        <Button
          title="View Policy Details"
          onPress={() => {
            // In a real app, navigate to policy details
            Alert.alert('Success', 'Navigating to policy details would happen here.');
          }}
          style={styles.successButton}
          textStyle={styles.successButtonText}
        />
        
        <Button
          title="Back to Insurance Products"
          onPress={() => navigation.goBack()}
          style={styles.outlineButton}
          textStyle={styles.outlineButtonText}
        />
      </View>
    </View>
  );
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Private Third-Party Extendible
        </Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => Alert.alert(
            'Third-Party Extendible Insurance',
            'This insurance provides the mandatory third-party coverage with additional optional coverages like windscreen, audio equipment, and more.'
          )}
        >
          <Ionicons name="information-circle-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            currentStep >= 1 && styles.progressActive
          ]}>
            <Text style={styles.progressNumber}>1</Text>
          </View>
          <Text style={styles.progressLabel}>Details</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            currentStep >= 2 && styles.progressActive
          ]}>
            <Text style={styles.progressNumber}>2</Text>
          </View>
          <Text style={styles.progressLabel}>Quote</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            currentStep >= 3 && styles.progressActive
          ]}>
            <Text style={styles.progressNumber}>3</Text>
          </View>
          <Text style={styles.progressLabel}>Complete</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content} 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderForm()}
        {currentStep === 2 && renderSummary()}
        {currentStep === 3 && renderSuccess()}
      </ScrollView>
      
      {/* Modals */}
      {renderVehicleTypeModal()}
      {renderMakeModal()}
      {renderModelModal()}
      {renderYearModal()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  backButton: {
    padding: Spacing.small,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.fontSizes.large,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  infoButton: {
    padding: Spacing.small,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xlarge,
    paddingVertical: Spacing.medium,
    backgroundColor: Colors.lightGray,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressActive: {
    backgroundColor: Colors.primary,
  },
  progressNumber: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  progressLabel: {
    marginTop: 4,
    fontSize: Typography.fontSizes.small,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.gray,
    marginHorizontal: Spacing.tiny,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: Spacing.medium,
  },
  sectionHeader: {
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.medium,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSizes.small,
    color: Colors.gray,
    marginTop: Spacing.tiny,
  },
  formGroup: {
    marginBottom: Spacing.medium,
  },
  label: {
    fontSize: Typography.fontSizes.small,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.small,
    fontSize: Typography.fontSizes.small,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSizes.xsmall,
    marginTop: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.small,
  },
  pickerText: {
    fontSize: Typography.fontSizes.small,
  },
  placeholderText: {
    fontSize: Typography.fontSizes.small,
    color: Colors.gray,
  },
  coverageOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.small,
    marginBottom: Spacing.small,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coverageOptionSelected: {
    backgroundColor: Colors.lightPrimary,
    borderColor: Colors.primary,
  },
  coverageCheckbox: {
    marginRight: Spacing.small,
    marginTop: 2,
  },
  coverageDetails: {
    flex: 1,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coverageName: {
    fontSize: Typography.fontSizes.small,
    fontWeight: '500',
  },
  coveragePremium: {
    fontSize: Typography.fontSizes.small,
    color: Colors.primary,
    fontWeight: '500',
  },
  coverageDescription: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.gray,
  },
  premiumContainer: {
    backgroundColor: Colors.lightPrimary,
    borderRadius: 8,
    padding: Spacing.medium,
    marginVertical: Spacing.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumLabel: {
    fontSize: Typography.fontSizes.small,
    fontWeight: '500',
  },
  premiumValue: {
    fontSize: Typography.fontSizes.large,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    marginTop: Spacing.medium,
    borderRadius: 8,
  },
  submitButtonText: {
    fontWeight: 'bold',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.medium,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: Typography.fontSizes.medium,
    fontWeight: 'bold',
    marginBottom: Spacing.medium,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalItemText: {
    fontSize: Typography.fontSizes.small,
  },
  cancelButton: {
    marginTop: Spacing.medium,
    backgroundColor: Colors.lightGray,
  },
  cancelButtonText: {
    color: Colors.dark,
  },
  
  // Summary styles
  summaryContainer: {
    padding: Spacing.medium,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.medium,
  },
  quotationId: {
    fontSize: Typography.fontSizes.medium,
    fontWeight: 'bold',
  },
  quotationDate: {
    fontSize: Typography.fontSizes.small,
    color: Colors.gray,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summarySection: {
    marginBottom: Spacing.medium,
  },
  summaryTitle: {
    fontSize: Typography.fontSizes.medium,
    fontWeight: 'bold',
    marginBottom: Spacing.small,
    color: Colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.small,
    color: Colors.gray,
  },
  summaryValue: {
    fontSize: Typography.fontSizes.small,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  extraCoverageTitle: {
    fontSize: Typography.fontSizes.small,
    fontWeight: '500',
    color: Colors.primary,
    marginTop: Spacing.small,
    marginBottom: 4,
  },
  extraCoverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  extraCoverageName: {
    fontSize: Typography.fontSizes.small,
    marginLeft: 6,
    flex: 1,
  },
  extraCoveragePremium: {
    fontSize: Typography.fontSizes.small,
    color: Colors.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: Spacing.small,
  },
  actionsContainer: {
    marginTop: Spacing.medium,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.medium,
  },
  editButtonText: {
    marginLeft: 6,
    color: Colors.primary,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontWeight: 'bold',
  },
  
  // Success styles
  successContainer: {
    padding: Spacing.medium,
    alignItems: 'center',
  },
  successIcon: {
    marginVertical: Spacing.xlarge,
  },
  successTitle: {
    fontSize: Typography.fontSizes.xlarge,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: Spacing.small,
  },
  successMessage: {
    fontSize: Typography.fontSizes.small,
    textAlign: 'center',
    color: Colors.gray,
    marginBottom: Spacing.large,
  },
  successDetails: {
    backgroundColor: Colors.lightGray,
    width: '100%',
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.large,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  successLabel: {
    fontSize: Typography.fontSizes.small,
    color: Colors.gray,
  },
  successValue: {
    fontSize: Typography.fontSizes.small,
    fontWeight: '500',
  },
  successActions: {
    width: '100%',
  },
  successButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginBottom: Spacing.small,
  },
  successButtonText: {
    fontWeight: 'bold',
  },
  outlineButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  outlineButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
