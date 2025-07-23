/**
 * Private Comprehensive Insurance Screen
 * Offers full coverage including own damage, theft, third party liability,
 * and optional add-ons for private vehicle owners
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
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors, Typography, Spacing } from '../../../../constants';
import ActionButton from '../../../../components/common/ActionButton';
import Button from '../../../../components/common/Button';

// Vehicle types that can be covered under comprehensive
const VEHICLE_TYPES = [
  { id: 'saloon', name: 'Saloon', description: 'Standard 4-door sedan' },
  { id: 'hatchback', name: 'Hatchback', description: 'Compact car with rear door' },
  { id: 'suv', name: 'SUV', description: 'Sport Utility Vehicle' },
  { id: 'pickup', name: 'Pickup', description: 'Light duty truck' },
  { id: 'van', name: 'Van', description: 'Passenger or cargo van' },
  { id: 'station_wagon', name: 'Station Wagon', description: 'Extended roof car' }
];

// Coverage options specific to comprehensive insurance
const COVERAGE_OPTIONS = [
  { 
    id: 'basic',
    name: 'Basic Comprehensive',
    rate: 4,
    description: 'Standard coverage including accident, theft, and third party',
    features: [
      'Own damage cover',
      'Third party liability',
      'Theft & fire coverage',
      'Basic windscreen cover'
    ]
  },
  {
    id: 'enhanced',
    name: 'Enhanced Comprehensive',
    rate: 4.5,
    description: 'Additional benefits and higher limits',
    features: [
      'All Basic features',
      'Enhanced windscreen cover',
      'Free towing service',
      'Courtesy car benefit'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Comprehensive',
    rate: 5,
    description: 'Maximum protection with all benefits',
    features: [
      'All Enhanced features',
      'Zero excess for glass damage',
      'Natural disaster coverage',
      'Personal accident cover',
      'Medical expenses cover'
    ]
  }
];

// Additional coverage options (add-ons)
const ADDONS = [
  {
    id: 'excess_protector',
    name: 'Excess Protector',
    description: 'Covers your excess payment in case of a claim',
    rate: 0.5
  },
  {
    id: 'political_violence',
    name: 'Political Violence & Terrorism',
    description: 'Coverage against politically motivated damage',
    rate: 0.25
  },
  {
    id: 'loss_of_use',
    name: 'Loss of Use',
    description: 'Daily allowance while your car is being repaired',
    rate: 0.3
  },
  {
    id: 'personal_effects',
    name: 'Personal Effects',
    description: 'Cover for personal belongings in the vehicle',
    rate: 0.2
  }
];

export default function PrivateComprehensiveScreen() {
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
    make: '',
    model: '',
    year: '',
    registrationNumber: '',
    engineCapacity: '',
    vehicleValue: '',
    coverageType: '',
    selectedAddons: [],
    hasTracking: false,
    hasDashcam: false,
    hasAntiTheft: false
  });
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [premium, setPremium] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  
  // Modal visibility states
  const [vehicleTypeModalVisible, setVehicleTypeModalVisible] = useState(false);
  const [makeModalVisible, setMakeModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [coverageModalVisible, setCoverageModalVisible] = useState(false);
  
  // Generate years for selection
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    {length: 15}, 
    (_, i) => (currentYear - i).toString()
  );
  
  // Effect to calculate premium when relevant fields change
  useEffect(() => {
    if (formData.vehicleValue && formData.coverageType) {
      calculatePremium();
    }
  }, [
    formData.vehicleValue,
    formData.coverageType,
    formData.selectedAddons,
    formData.hasTracking,
    formData.hasDashcam,
    formData.hasAntiTheft,
    formData.year
  ]);
  
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
  
  // Toggle addon selection
  const toggleAddon = (addonId) => {
    setFormData(prev => {
      const selectedAddons = [...prev.selectedAddons];
      const index = selectedAddons.indexOf(addonId);
      
      if (index !== -1) {
        selectedAddons.splice(index, 1);
      } else {
        selectedAddons.push(addonId);
      }
      
      return { ...prev, selectedAddons };
    });
  };
  
  // Calculate comprehensive insurance premium
  const calculatePremium = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const vehicleValue = parseFloat(formData.vehicleValue);
        if (isNaN(vehicleValue)) {
          setPremium(0);
          setIsCalculating(false);
          return;
        }
        
        // Get base rate from selected coverage type
        const coverage = COVERAGE_OPTIONS.find(c => c.id === formData.coverageType);
        if (!coverage) {
          setPremium(0);
          setIsCalculating(false);
          return;
        }
        
        let rate = coverage.rate;
        
        // Add rates for selected add-ons
        formData.selectedAddons.forEach(addonId => {
          const addon = ADDONS.find(a => a.id === addonId);
          if (addon) {
            rate += addon.rate;
          }
        });
        
        // Apply discounts for security features
        if (formData.hasTracking) rate -= 0.5;
        if (formData.hasDashcam) rate -= 0.25;
        if (formData.hasAntiTheft) rate -= 0.25;
        
        // Age factor
        const vehicleAge = currentYear - parseInt(formData.year);
        if (vehicleAge > 10) {
          rate += 0.5; // Higher rate for older vehicles
        } else if (vehicleAge > 5) {
          rate += 0.25;
        }
        
        // Calculate base premium
        let calculatedPremium = (vehicleValue * (rate / 100));
        
        // Minimum premium thresholds
        const minPremium = 25000; // Minimum premium amount
        calculatedPremium = Math.max(calculatedPremium, minPremium);
        
        // Add standard fees
        const stampDuty = 40;
        const phcf = 0.25; // Policy holders compensation fund
        const trainingLevy = calculatedPremium * 0.002;
        
        calculatedPremium += stampDuty + (calculatedPremium * phcf / 100) + trainingLevy;
        
        // Round to nearest 100
        calculatedPremium = Math.ceil(calculatedPremium / 100) * 100;
        
        setPremium(calculatedPremium);
      } catch (error) {
        console.error('Premium calculation error:', error);
        setPremium(0);
      } finally {
        setIsCalculating(false);
      }
    }, 800);
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
    if (!formData.make) newErrors.make = 'Make is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.year) newErrors.year = 'Year is required';
    
    if (!formData.registrationNumber) {
      newErrors.registrationNumber = 'Registration number is required';
    } else if (!/^K[A-Z]{2}\s?\d{3}[A-Z]$/i.test(formData.registrationNumber)) {
      newErrors.registrationNumber = 'Invalid registration format (e.g. KAA 123Z)';
    }
    
    if (!formData.vehicleValue) {
      newErrors.vehicleValue = 'Vehicle value is required';
    } else {
      const value = parseFloat(formData.vehicleValue);
      if (isNaN(value) || value < 500000) {
        newErrors.vehicleValue = 'Vehicle value must be at least KSh 500,000';
      }
    }
    
    if (!formData.coverageType) newErrors.coverageType = 'Please select a coverage type';
    
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
      
      // Generate quotation ID
      setQuotationId(`COMP-${Math.floor(100000 + Math.random() * 900000)}`);
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
  
  // First step - Vehicle and owner information form
  const renderForm = () => (
    <View style={styles.formContainer}>
      {/* Form implementation */}
    </View>
  );
  
  // Second step - Quotation summary
  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      {/* Summary implementation */}
    </View>
  );
  
  // Third step - Success message
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      {/* Success message implementation */}
    </View>
  );
  
  // Modal implementations for vehicle type, make, model, year, and coverage selection
  const renderVehicleTypeModal = () => (
    <Modal
      visible={vehicleTypeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setVehicleTypeModalVisible(false)}
    >
      {/* Vehicle type modal implementation */}
    </Modal>
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
          Private Comprehensive
        </Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => Alert.alert(
            'Comprehensive Insurance',
            'Full coverage for your vehicle including own damage, theft, and third party liability.'
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
      {/* Other modals */}
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
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.fontSizes.large,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  // Add more styles as needed
});
