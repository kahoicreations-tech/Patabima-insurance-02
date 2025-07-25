/**
 * PSV Third Party Insurance Quotation Flow - Component-Based Architecture
 * Basic third party liability coverage for PSVs - legal minimum requirement
 * 
 * Features:
 * - PSV-specific third party liability coverage
 * - Simplified 4-step process with PSV components
 * - Fixed coverage amounts as per Kenya law
 * - Passenger capacity considerations
 * - Affordable premium calculations for PSVs
 * 
 * Steps:
 * 1. Personal Information
 * 2. PSV Details
 * 3. Insurer Selection
 * 4. Payment
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../constants';

// Import PSV-specific components
import {
  PersonalInformationStep,
  QuotationProgressBar,
  PSVDetailsStep,
  PaymentStep
} from './components';

// Import PSV third party insurer data
const PSV_THIRD_PARTY_INSURERS = [
  {
    id: 'jubilee_psv_tp',
    name: 'Jubilee Insurance',
    logoIcon: 'shield-checkmark-outline',
    baseRate: 0.045, // 4.5% for PSVs
    baseMinimum: 15000,
    maxPassengers: 60,
    features: [
      'Third Party Liability',
      'Passenger Liability',
      'PSV Coverage',
      'Quick Processing'
    ],
    passengerCapacityRates: {
      '1-7': 12000,
      '8-14': 15000,
      '15-25': 20000,
      '26-49': 30000,
      '50-plus': 45000
    }
  },
  {
    id: 'madison_psv_tp',
    name: 'Madison Insurance',
    logoIcon: 'business-outline',
    baseRate: 0.042,
    baseMinimum: 14000,
    maxPassengers: 49,
    features: [
      'Affordable Rates',
      'Local Support',
      'Fast Claims',
      'PSV Specialist'
    ],
    passengerCapacityRates: {
      '1-7': 11000,
      '8-14': 14000,
      '15-25': 18000,
      '26-49': 28000,
      '50-plus': 40000
    }
  },
  {
    id: 'britam_psv_tp',
    name: 'Britam Insurance',
    logoIcon: 'globe-outline',
    baseRate: 0.048,
    baseMinimum: 16000,
    maxPassengers: 70,
    features: [
      'Digital Claims',
      'Wide Network',
      'Comprehensive Coverage',
      '24/7 Support'
    ],
    businessName: '',
    psvType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleReg: '',
    routeLicense: '',
    saccoName: '',
    seatingCapacity: '',
    routeName: '',
    operationArea: ''
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: form, 2: summary, 3: success
  const [premium, setPremium] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  
  // Modal state
  const [psvTypeModalVisible, setPsvTypeModalVisible] = useState(false);
  const [makeModalVisible, setMakeModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [saccoModalVisible, setSaccoModalVisible] = useState(false);
  
  // Effect to calculate premium when relevant fields change
  useEffect(() => {
    if (formData.psvType && formData.seatingCapacity) {
      calculatePremium();
    }
  }, [formData.psvType, formData.seatingCapacity]);
  
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
  
  // Calculate premium for PSV Third-Party insurance
  const calculatePremium = () => {
    setIsCalculating(true);
    
    // Wait a bit to simulate API call/calculation
    setTimeout(() => {
      try {
        // Base premium calculation
        let calculatedPremium = BASE_PREMIUM;
        
        // PSV type adjustment
        if (formData.psvType === 'Bus' || formData.psvType === 'Shuttle') {
          calculatedPremium += 3000;
        } else if (formData.psvType === 'Matatu') {
          calculatedPremium += 2000;
        } else if (formData.psvType === 'Tuk Tuk' || formData.psvType === 'Boda Boda') {
          calculatedPremium = 8000; // Lower base for smaller PSVs
        }
        
        // Seating capacity adjustment
        const seats = parseInt(formData.seatingCapacity) || 0;
        if (seats > 30) {
          calculatedPremium += 5000; // Large buses
        } else if (seats > 14) {
          calculatedPremium += 3000; // Medium sized
        } else if (seats > 7) {
          calculatedPremium += 1000; // Small matatu
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
    
    if (!formData.psvType) newErrors.psvType = 'PSV type is required';
    
    if (!formData.vehicleMake) newErrors.vehicleMake = 'Vehicle make is required';
    if (!formData.vehicleModel) newErrors.vehicleModel = 'Vehicle model is required';
    if (!formData.vehicleYear) newErrors.vehicleYear = 'Vehicle year is required';
    
    if (!formData.vehicleReg) {
      newErrors.vehicleReg = 'Registration number is required';
    } else if (!/^K[A-Z]{2}\s?\d{3}[A-Z]$/i.test(formData.vehicleReg)) {
      newErrors.vehicleReg = 'Invalid registration format (e.g. KAA 123Z)';
    }
    
    if (!formData.routeLicense) {
      newErrors.routeLicense = 'Route license number is required';
    }
    
    if (!formData.seatingCapacity) {
      newErrors.seatingCapacity = 'Seating capacity is required';
    } else if (!/^\d+$/.test(formData.seatingCapacity)) {
      newErrors.seatingCapacity = 'Enter a valid number';
    } else if (parseInt(formData.seatingCapacity) < 4) {
      newErrors.seatingCapacity = 'Minimum seating capacity is 4';
    }
    
    if (!formData.routeName && !formData.operationArea) {
      newErrors.routeName = 'Route name or operation area is required';
    }
    
    if (formData.psvType === 'Matatu' && !formData.saccoName) {
      newErrors.saccoName = 'SACCO name is required for matatus';
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
      setQuotationId(`PSV-${Math.floor(100000 + Math.random() * 900000)}`);
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
  
  // Modal selection for PSV type
  const renderPSVTypeModal = () => (
    <Modal
      visible={psvTypeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setPsvTypeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select PSV Type</Text>
          <FlatList
            data={PSV_TYPES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('psvType', item);
                  setPsvTypeModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setPsvTypeModalVisible(false)}
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
  
  // Modal selection for route
  const renderRouteModal = () => (
    <Modal
      visible={routeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setRouteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Common Route</Text>
          <FlatList
            data={COMMON_ROUTES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('routeName', item);
                  setRouteModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setRouteModalVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </View>
    </Modal>
  );
  
  // Modal selection for SACCO
  const renderSaccoModal = () => (
    <Modal
      visible={saccoModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSaccoModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select SACCO</Text>
          <FlatList
            data={PSV_SACCOS}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('saccoName', item);
                  setSaccoModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setSaccoModalVisible(false)}
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
        <Text style={styles.sectionTitle}>PSV Owner Details</Text>
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
        <Text style={styles.label}>Business Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter business name if applicable"
          value={formData.businessName}
          onChangeText={(text) => updateField('businessName', text)}
        />
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
        <Text style={styles.sectionTitle}>PSV Details</Text>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>PSV Type</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.psvType && styles.inputError]}
          onPress={() => setPsvTypeModalVisible(true)}
        >
          <Text style={formData.psvType ? styles.pickerText : styles.placeholderText}>
            {formData.psvType || 'Select PSV type'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.psvType && <Text style={styles.errorText}>{errors.psvType}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Make</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.vehicleMake && styles.inputError]}
          onPress={() => setMakeModalVisible(true)}
        >
          <Text style={formData.vehicleMake ? styles.pickerText : styles.placeholderText}>
            {formData.vehicleMake || 'Select vehicle make'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.vehicleMake && <Text style={styles.errorText}>{errors.vehicleMake}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Vehicle Model</Text>
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
        <Text style={styles.label}>Vehicle Year</Text>
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
        <Text style={styles.label}>Route License Number</Text>
        <TextInput
          style={[styles.input, errors.routeLicense && styles.inputError]}
          placeholder="Enter route license number"
          value={formData.routeLicense}
          onChangeText={(text) => updateField('routeLicense', text)}
        />
        {errors.routeLicense && <Text style={styles.errorText}>{errors.routeLicense}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Seating Capacity</Text>
        <TextInput
          style={[styles.input, errors.seatingCapacity && styles.inputError]}
          placeholder="Number of seats"
          value={formData.seatingCapacity}
          onChangeText={(text) => updateField('seatingCapacity', text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
        />
        {errors.seatingCapacity && <Text style={styles.errorText}>{errors.seatingCapacity}</Text>}
      </View>
      
      {formData.psvType === 'Matatu' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>SACCO Name</Text>
          <TouchableOpacity
            style={[styles.pickerButton, errors.saccoName && styles.inputError]}
            onPress={() => setSaccoModalVisible(true)}
          >
            <Text style={formData.saccoName ? styles.pickerText : styles.placeholderText}>
              {formData.saccoName || 'Select SACCO'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray} />
          </TouchableOpacity>
          {errors.saccoName && <Text style={styles.errorText}>{errors.saccoName}</Text>}
        </View>
      )}
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Route</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.routeName && styles.inputError]}
          onPress={() => setRouteModalVisible(true)}
        >
          <Text style={formData.routeName ? styles.pickerText : styles.placeholderText}>
            {formData.routeName || 'Select common route or enter below'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        <TextInput
          style={[
            styles.input, 
            { marginTop: 8 },
            errors.routeName && !formData.routeName && errors.operationArea && styles.inputError
          ]}
          placeholder="Or describe operation area"
          value={formData.operationArea}
          onChangeText={(text) => updateField('operationArea', text)}
        />
        {errors.routeName && !formData.routeName && !formData.operationArea && 
          <Text style={styles.errorText}>{errors.routeName}</Text>
        }
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
          <Text style={styles.summaryTitle}>PSV Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>PSV Type:</Text>
            <Text style={styles.summaryValue}>{formData.psvType}</Text>
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
            <Text style={styles.summaryLabel}>Seating Capacity:</Text>
            <Text style={styles.summaryValue}>{formData.seatingCapacity} Seats</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route License:</Text>
            <Text style={styles.summaryValue}>{formData.routeLicense}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route/Area:</Text>
            <Text style={styles.summaryValue}>{formData.routeName || formData.operationArea}</Text>
          </View>
          {formData.saccoName && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SACCO:</Text>
              <Text style={styles.summaryValue}>{formData.saccoName}</Text>
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
          {formData.businessName && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Business:</Text>
              <Text style={styles.summaryValue}>{formData.businessName}</Text>
            </View>
          )}
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
        Your PSV third-party insurance quotation has been created successfully.
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
            {formData.vehicleMake} {formData.vehicleModel} ({formData.psvType})
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
          PSV Third-Party Insurance
        </Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => Alert.alert(
            'PSV Third-Party Insurance',
            'This insurance covers liability for bodily injury and property damage to third parties for Public Service Vehicles. It is mandatory for all PSVs operating in Kenya.'
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
      {renderPSVTypeModal()}
      {renderMakeModal()}
      {renderModelModal()}
      {renderYearModal()}
      {renderRouteModal()}
      {renderSaccoModal()}
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
