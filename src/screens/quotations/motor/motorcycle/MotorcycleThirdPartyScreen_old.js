/**
 * Motorcycle Third-Party Insurance Screen
 * 
 * This screen handles the Motorcycle third-party insurance 
 * quotation flow, following a similar structure to other insurance product screens
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

// Motorcycle types
const MOTORCYCLE_TYPES = [
  'Standard', 'Sports', 'Cruiser', 'Dirt Bike', 'Scooter', 'Moped', 'Delivery Bike'
];

// Motorcycle makes and models data
const MOTORCYCLE_MAKES = [
  'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Bajaj', 'TVS', 'Hero', 'Royal Enfield', 
  'KTM', 'Ducati', 'Harley-Davidson', 'BMW', 'Piaggio'
];

const MOTORCYCLE_MODELS = {
  'Honda': ['CB150R', 'CB300R', 'XR150L', 'CRF250', 'CBR250R', 'Activa', 'Wave'],
  'Yamaha': ['YBR125', 'MT-07', 'R15', 'FZ', 'YZ250F', 'DT125', 'Crux'],
  'Suzuki': ['GSX-R150', 'Gixxer', 'Hayabusa', 'RM-Z250', 'GD110', 'Access', 'Burgman'],
  'Kawasaki': ['Ninja 250', 'Z650', 'KLX150', 'KX250', 'Versys', 'Vulcan', 'W175'],
  'Bajaj': ['Boxer', 'Pulsar', 'Dominar', 'Discover', 'Platina', 'CT100', 'Avenger'],
  'TVS': ['Apache', 'Star City', 'Sport', 'NTorq', 'Jupiter', 'Victor', 'XL100'],
  'Hero': ['Splendor', 'HF Deluxe', 'Passion', 'Glamour', 'Xtreme', 'Pleasure', 'Destini'],
  'Royal Enfield': ['Classic 350', 'Bullet 350', 'Himalayan', 'Meteor', 'Interceptor', 'Continental GT'],
  'KTM': ['Duke 125', 'Duke 390', 'RC 125', 'RC 390', 'Adventure 390'],
  'Ducati': ['Monster', 'Panigale', 'Scrambler', 'Multistrada'],
  'Harley-Davidson': ['Street 750', 'Iron 883', 'Forty-Eight', 'Fat Boy'],
  'BMW': ['G 310 R', 'G 310 GS', 'S 1000 RR', 'R 1250 GS'],
  'Piaggio': ['Vespa', 'Liberty', 'Zip', 'Beverly']
};

// Engine capacities
const ENGINE_CAPACITIES = [
  '50cc - 100cc',
  '101cc - 125cc',
  '126cc - 150cc',
  '151cc - 200cc',
  '201cc - 250cc',
  '251cc - 400cc',
  '401cc - 750cc',
  'Above 750cc'
];

// Usage types
const USAGE_TYPES = [
  'Personal Use',
  'Commuting',
  'Food Delivery',
  'Courier Service',
  'Ride Sharing',
  'Off-road Recreation',
  'Other'
];

// Generate years from 2000 to current year
const YEARS = Array.from(
  {length: new Date().getFullYear() - 1999}, 
  (_, i) => (new Date().getFullYear() - i).toString()
);

// Motorcycle third-party insurance constants
const BASE_PREMIUM = 5000; // Base premium for motorcycle third-party insurance
const MIN_PREMIUM = 4000; // Minimum premium allowed

export default function MotorcycleThirdPartyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    motorcycleType: '',
    motorcycleMake: '',
    motorcycleModel: '',
    motorcycleYear: '',
    motorcycleReg: '',
    engineCapacity: '',
    usageType: '',
    hasModifications: false,
    modifications: ''
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: form, 2: summary, 3: success
  const [premium, setPremium] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  
  // Modal state
  const [motorcycleTypeModalVisible, setMotorcycleTypeModalVisible] = useState(false);
  const [makeModalVisible, setMakeModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [engineCapacityModalVisible, setEngineCapacityModalVisible] = useState(false);
  const [usageTypeModalVisible, setUsageTypeModalVisible] = useState(false);
  
  // Effect to calculate premium when relevant fields change
  useEffect(() => {
    if (formData.motorcycleType && formData.engineCapacity && formData.usageType) {
      calculatePremium();
    }
  }, [formData.motorcycleType, formData.engineCapacity, formData.usageType, formData.hasModifications]);
  
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
  
  // Calculate premium for Motorcycle Third-Party insurance
  const calculatePremium = () => {
    setIsCalculating(true);
    
    // Wait a bit to simulate API call/calculation
    setTimeout(() => {
      try {
        // Base premium calculation
        let calculatedPremium = BASE_PREMIUM;
        
        // Engine capacity adjustment
        const capacityIndex = ENGINE_CAPACITIES.indexOf(formData.engineCapacity);
        if (capacityIndex >= 0) {
          // Higher premium for larger engines
          calculatedPremium += capacityIndex * 500;
        }
        
        // Motorcycle type adjustment
        if (['Sports', 'Dirt Bike'].includes(formData.motorcycleType)) {
          calculatedPremium += 1000; // Higher risk types
        } else if (formData.motorcycleType === 'Delivery Bike') {
          calculatedPremium += 1500; // Commercial usage
        }
        
        // Usage type adjustment
        if (['Food Delivery', 'Courier Service', 'Ride Sharing'].includes(formData.usageType)) {
          calculatedPremium += 1000; // Commercial usage
        }
        
        // Modifications adjustment
        if (formData.hasModifications) {
          calculatedPremium += 800; // Modified motorcycles have higher risk
        }
        
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
    
    if (!formData.motorcycleType) newErrors.motorcycleType = 'Motorcycle type is required';
    if (!formData.motorcycleMake) newErrors.motorcycleMake = 'Make is required';
    if (!formData.motorcycleModel) newErrors.motorcycleModel = 'Model is required';
    if (!formData.motorcycleYear) newErrors.motorcycleYear = 'Year is required';
    if (!formData.engineCapacity) newErrors.engineCapacity = 'Engine capacity is required';
    if (!formData.usageType) newErrors.usageType = 'Usage type is required';
    
    if (!formData.motorcycleReg) {
      newErrors.motorcycleReg = 'Registration number is required';
    } else if (!/^K[A-Z]{2}\s?\d{3}[A-Z]$/i.test(formData.motorcycleReg)) {
      newErrors.motorcycleReg = 'Invalid registration format (e.g. KAA 123Z)';
    }
    
    if (formData.hasModifications && !formData.modifications) {
      newErrors.modifications = 'Please describe the modifications';
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
      setQuotationId(`MTP-${Math.floor(100000 + Math.random() * 900000)}`);
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
  
  // Modal selection for motorcycle type
  const renderMotorcycleTypeModal = () => (
    <Modal
      visible={motorcycleTypeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setMotorcycleTypeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Motorcycle Type</Text>
          <FlatList
            data={MOTORCYCLE_TYPES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('motorcycleType', item);
                  setMotorcycleTypeModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setMotorcycleTypeModalVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </View>
    </Modal>
  );
  
  // Modal selection for motorcycle make
  const renderMakeModal = () => (
    <Modal
      visible={makeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setMakeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Motorcycle Make</Text>
          <FlatList
            data={MOTORCYCLE_MAKES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('motorcycleMake', item);
                  updateField('motorcycleModel', ''); // Reset model when make changes
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
  
  // Modal selection for motorcycle model
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
            Select {formData.motorcycleMake} Model
          </Text>
          <FlatList
            data={formData.motorcycleMake ? MOTORCYCLE_MODELS[formData.motorcycleMake] || [] : []}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('motorcycleModel', item);
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
  
  // Modal selection for motorcycle year
  const renderYearModal = () => (
    <Modal
      visible={yearModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setYearModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Motorcycle Year</Text>
          <FlatList
            data={YEARS}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('motorcycleYear', item);
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
  
  // Modal selection for engine capacity
  const renderEngineCapacityModal = () => (
    <Modal
      visible={engineCapacityModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setEngineCapacityModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Engine Capacity</Text>
          <FlatList
            data={ENGINE_CAPACITIES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('engineCapacity', item);
                  setEngineCapacityModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setEngineCapacityModalVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </View>
    </Modal>
  );
  
  // Modal selection for usage type
  const renderUsageTypeModal = () => (
    <Modal
      visible={usageTypeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setUsageTypeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Usage Type</Text>
          <FlatList
            data={USAGE_TYPES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('usageType', item);
                  setUsageTypeModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setUsageTypeModalVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </View>
    </Modal>
  );
  
  // First step - Motorcycle and owner information form
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
        <Text style={styles.sectionTitle}>Motorcycle Details</Text>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Motorcycle Type</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.motorcycleType && styles.inputError]}
          onPress={() => setMotorcycleTypeModalVisible(true)}
        >
          <Text style={formData.motorcycleType ? styles.pickerText : styles.placeholderText}>
            {formData.motorcycleType || 'Select motorcycle type'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.motorcycleType && <Text style={styles.errorText}>{errors.motorcycleType}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Make</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.motorcycleMake && styles.inputError]}
          onPress={() => setMakeModalVisible(true)}
        >
          <Text style={formData.motorcycleMake ? styles.pickerText : styles.placeholderText}>
            {formData.motorcycleMake || 'Select make'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.motorcycleMake && <Text style={styles.errorText}>{errors.motorcycleMake}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Model</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.motorcycleModel && styles.inputError]}
          onPress={() => {
            if (formData.motorcycleMake) {
              setModelModalVisible(true);
            } else {
              Alert.alert('Select Make First', 'Please select motorcycle make before model.');
            }
          }}
          disabled={!formData.motorcycleMake}
        >
          <Text 
            style={
              formData.motorcycleModel 
                ? styles.pickerText 
                : styles.placeholderText
            }
          >
            {formData.motorcycleModel || (formData.motorcycleMake ? 'Select model' : 'Select make first')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.motorcycleModel && <Text style={styles.errorText}>{errors.motorcycleModel}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Year</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.motorcycleYear && styles.inputError]}
          onPress={() => setYearModalVisible(true)}
        >
          <Text style={formData.motorcycleYear ? styles.pickerText : styles.placeholderText}>
            {formData.motorcycleYear || 'Select year'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.motorcycleYear && <Text style={styles.errorText}>{errors.motorcycleYear}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Registration Number</Text>
        <TextInput
          style={[styles.input, errors.motorcycleReg && styles.inputError]}
          placeholder="E.g. KAA 123Z"
          value={formData.motorcycleReg}
          onChangeText={(text) => updateField('motorcycleReg', text.toUpperCase())}
        />
        {errors.motorcycleReg && <Text style={styles.errorText}>{errors.motorcycleReg}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Engine Capacity</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.engineCapacity && styles.inputError]}
          onPress={() => setEngineCapacityModalVisible(true)}
        >
          <Text style={formData.engineCapacity ? styles.pickerText : styles.placeholderText}>
            {formData.engineCapacity || 'Select engine capacity'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.engineCapacity && <Text style={styles.errorText}>{errors.engineCapacity}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Usage Type</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.usageType && styles.inputError]}
          onPress={() => setUsageTypeModalVisible(true)}
        >
          <Text style={formData.usageType ? styles.pickerText : styles.placeholderText}>
            {formData.usageType || 'Select usage type'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.usageType && <Text style={styles.errorText}>{errors.usageType}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Any modifications?</Text>
          <TouchableOpacity
            style={[
              styles.switchButton, 
              formData.hasModifications && styles.switchButtonActive
            ]}
            onPress={() => updateField('hasModifications', !formData.hasModifications)}
          >
            <View style={[
              styles.switchThumb, 
              formData.hasModifications && styles.switchThumbActive
            ]} />
          </TouchableOpacity>
        </View>
        
        {formData.hasModifications && (
          <>
            <TextInput
              style={[
                styles.input, 
                { marginTop: 8 },
                errors.modifications && styles.inputError
              ]}
              placeholder="Describe modifications"
              value={formData.modifications}
              onChangeText={(text) => updateField('modifications', text)}
              multiline={true}
              numberOfLines={3}
            />
            {errors.modifications && 
              <Text style={styles.errorText}>{errors.modifications}</Text>
            }
          </>
        )}
      </View>
      
      {/* Premium calculation section */}
      {premium > 0 && (
        <View style={styles.premiumContainer}>
          <Text style={styles.premiumLabel}>Third-Party Premium:</Text>
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
          <Text style={styles.summaryTitle}>Motorcycle Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type:</Text>
            <Text style={styles.summaryValue}>{formData.motorcycleType}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Make & Model:</Text>
            <Text style={styles.summaryValue}>
              {formData.motorcycleMake} {formData.motorcycleModel}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Year:</Text>
            <Text style={styles.summaryValue}>{formData.motorcycleYear}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Registration:</Text>
            <Text style={styles.summaryValue}>{formData.motorcycleReg}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Engine Capacity:</Text>
            <Text style={styles.summaryValue}>{formData.engineCapacity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Usage:</Text>
            <Text style={styles.summaryValue}>{formData.usageType}</Text>
          </View>
          {formData.hasModifications && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Modifications:</Text>
              <Text style={styles.summaryValue}>{formData.modifications}</Text>
            </View>
          )}
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
            <Text style={styles.summaryLabel}>Coverage Type:</Text>
            <Text style={styles.summaryValue}>Third Party Only</Text>
          </View>
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
        Your motorcycle third-party insurance quotation has been created successfully.
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
          <Text style={styles.successLabel}>Motorcycle:</Text>
          <Text style={styles.successValue}>
            {formData.motorcycleMake} {formData.motorcycleModel}
          </Text>
        </View>
        <View style={styles.successRow}>
          <Text style={styles.successLabel}>Registration:</Text>
          <Text style={styles.successValue}>{formData.motorcycleReg}</Text>
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
          Motorcycle Third-Party Insurance
        </Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => Alert.alert(
            'Motorcycle Third-Party Insurance',
            'This insurance covers liability for bodily injury and property damage to third parties caused by your motorcycle. It is a legal requirement for all motorcycle owners in Kenya.'
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
      {renderMotorcycleTypeModal()}
      {renderMakeModal()}
      {renderModelModal()}
      {renderYearModal()}
      {renderEngineCapacityModal()}
      {renderUsageTypeModal()}
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchButton: {
    width: 50,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    padding: 2,
  },
  switchButtonActive: {
    backgroundColor: Colors.lightPrimary,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.gray,
  },
  switchThumbActive: {
    backgroundColor: Colors.primary,
    transform: [{ translateX: 26 }],
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
