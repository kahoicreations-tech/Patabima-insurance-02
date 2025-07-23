/**
 * Private Motorcycle Insurance Screen
 * 
 * This screen handles the Private motorcycle insurance 
 * quotation flow for private individual motorcycle owners
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

// Motorcycle makes
const MOTORCYCLE_MAKES = [
  'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Bajaj', 'TVS', 'Hero', 'Royal Enfield', 
  'KTM', 'Piaggio', 'BMW', 'Harley-Davidson', 'Ducati', 'Triumph', 'Husqvarna'
];

// Models by make
const MOTORCYCLE_MODELS = {
  'Honda': ['CB150', 'CB200', 'CB300', 'CB500X', 'CBR250', 'CBR600', 'CRF250', 'XL125', 'Wave'],
  'Yamaha': ['YBR125', 'FZ150', 'MT-03', 'MT-07', 'R15', 'R25', 'R3', 'TZR', 'XTZ125', 'YZ250'],
  'Suzuki': ['GN125', 'GSX-R150', 'GSX-R600', 'Hayabusa', 'GD110', 'DR200', 'RM-Z450', 'V-Strom'],
  'Kawasaki': ['Ninja 250', 'Ninja 400', 'Z400', 'Z650', 'Versys 650', 'KLX150', 'KX250', 'KLR650'],
  'Bajaj': ['Pulsar 125', 'Pulsar 150', 'Boxer', 'Dominar 400', 'Avenger', 'Discover', 'Platina'],
  'TVS': ['Apache RTR 160', 'Apache RTR 180', 'Star City', 'Phoenix', 'Wego', 'Jupiter', 'XL100'],
  'Hero': ['Splendor', 'Passion', 'HF Deluxe', 'Glamour', 'Karizma', 'Xpulse 200', 'Pleasure'],
  'Royal Enfield': ['Classic 350', 'Classic 500', 'Bullet 350', 'Himalayan', 'Meteor 350', 'Interceptor 650', 'Continental GT'],
  'KTM': ['Duke 125', 'Duke 200', 'Duke 390', 'RC 125', 'RC 200', 'RC 390', 'Adventure 390'],
  'Piaggio': ['Vespa Primavera', 'Vespa Sprint', 'Vespa GTS', 'Liberty', 'Fly', 'ZIP', 'NRG'],
  'BMW': ['G310R', 'G310GS', 'F750GS', 'F850GS', 'R1250GS', 'S1000RR', 'R nineT'],
  'Harley-Davidson': ['Street 750', 'Iron 883', 'Forty-Eight', 'Fat Boy', 'Heritage Classic', 'Road King', 'Street Glide'],
  'Ducati': ['Monster', 'Panigale V2', 'Panigale V4', 'Scrambler', 'Multistrada', 'Diavel', 'Hypermotard'],
  'Triumph': ['Street Triple', 'Speed Triple', 'Tiger 800', 'Bonneville', 'Trident', 'Rocket 3', 'Scrambler'],
  'Husqvarna': ['Svartpilen 401', 'Vitpilen 401', 'Svartpilen 250', 'Vitpilen 250', 'TE250', 'FE250', 'TE300']
};

// Engine capacity ranges
const ENGINE_CAPACITIES = [
  '50cc - 100cc',
  '101cc - 125cc', 
  '126cc - 150cc', 
  '151cc - 200cc', 
  '201cc - 250cc',
  '251cc - 400cc', 
  '401cc - 650cc',
  '651cc - 1000cc',
  'Above 1000cc'
];

// Usage types
const USAGE_TYPES = [
  { id: 'personal', name: 'Personal Use', description: 'Casual riding and daily commute' },
  { id: 'commuting', name: 'Regular Commuting', description: 'Daily transportation to work/school' },
  { id: 'food_delivery', name: 'Food Delivery', description: 'Food and small package delivery' },
  { id: 'recreational', name: 'Recreational', description: 'Weekend and leisure riding only' }
];

// Insurance cover types
const COVER_TYPES = [
  { id: 'third_party', name: 'Third Party Only', description: 'Covers damages to third parties only', basePremium: 3000 },
  { id: 'comprehensive', name: 'Comprehensive', description: 'Full coverage including your motorcycle', basePremium: 7000 }
];

// Optional add-ons (only for comprehensive)
const ADDONS = [
  { id: 'accessories', name: 'Custom Accessories', premium: 1500, description: 'Coverage for aftermarket parts and accessories' },
  { id: 'roadside', name: 'Roadside Assistance', premium: 1200, description: '24/7 roadside help and towing service' },
  { id: 'passenger', name: 'Passenger Coverage', premium: 1000, description: 'Additional protection for your passenger' },
  { id: 'theft', name: 'Enhanced Theft Protection', premium: 2000, description: 'Additional coverage for theft with lower excess' }
];

export default function PrivateMotorcycleScreen() {
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
    engineCapacity: '',
    yearOfManufacture: '',
    registrationNumber: '',
    motorcycleValue: '',
    usageType: '',
    coverType: '',
    hasModifications: false,
    selectedAddons: []
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [premium, setPremium] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  
  // Year generation
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 20}, (_, i) => (currentYear - i).toString());
  
  // Modals visibility state
  const [motorcycleTypeModalVisible, setMotorcycleTypeModalVisible] = useState(false);
  const [makeModalVisible, setMakeModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [engineCapacityModalVisible, setEngineCapacityModalVisible] = useState(false);
  const [usageTypeModalVisible, setUsageTypeModalVisible] = useState(false);
  const [coverTypeModalVisible, setCoverTypeModalVisible] = useState(false);
  
  // Effect for premium calculation
  useEffect(() => {
    if (formData.motorcycleType && formData.engineCapacity && 
        formData.yearOfManufacture && formData.usageType && formData.coverType) {
      calculatePremium();
    }
  }, [
    formData.motorcycleType, 
    formData.engineCapacity, 
    formData.yearOfManufacture, 
    formData.usageType, 
    formData.coverType,
    formData.hasModifications,
    formData.selectedAddons
  ]);
  
  // Update form fields
  const updateField = (field, value) => {
    setFormData(prev => {
      // If updating cover type, reset add-ons if switching to third party
      if (field === 'coverType' && value === 'third_party') {
        return { ...prev, [field]: value, selectedAddons: [] };
      }
      return { ...prev, [field]: value };
    });
    
    // Clear error for this field if exists
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };
  
  // Toggle add-ons
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
  
  // Calculate premium
  const calculatePremium = () => {
    setIsCalculating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        // Find selected cover type
        const coverType = COVER_TYPES.find(c => c.id === formData.coverType);
        if (!coverType) {
          setPremium(0);
          setIsCalculating(false);
          return;
        }
        
        // Start with base premium
        let calculatedPremium = coverType.basePremium;
        
        // Engine capacity factor
        const getEngineCapacityFactor = () => {
          const capacity = formData.engineCapacity;
          if (capacity === '50cc - 100cc') return 0.8;
          if (capacity === '101cc - 125cc') return 0.9;
          if (capacity === '126cc - 150cc') return 1.0;
          if (capacity === '151cc - 200cc') return 1.1;
          if (capacity === '201cc - 250cc') return 1.2;
          if (capacity === '251cc - 400cc') return 1.4;
          if (capacity === '401cc - 650cc') return 1.6;
          if (capacity === '651cc - 1000cc') return 2.0;
          if (capacity === 'Above 1000cc') return 2.5;
          return 1.0;
        };
        
        const capacityFactor = getEngineCapacityFactor();
        calculatedPremium *= capacityFactor;
        
        // Motorcycle type factor
        const getTypeFactors = () => {
          const type = formData.motorcycleType;
          if (type === 'Sports') return 1.4;
          if (type === 'Dirt Bike') return 1.2;
          if (type === 'Cruiser') return 1.1;
          if (type === 'Delivery Bike') return 1.3;
          return 1.0; // Standard, Scooter, Moped
        };
        
        const typeFactor = getTypeFactors();
        calculatedPremium *= typeFactor;
        
        // Usage type factor
        const getUsageFactor = () => {
          const usage = formData.usageType;
          if (usage === 'food_delivery') return 1.5;
          if (usage === 'commuting') return 1.2;
          if (usage === 'recreational') return 0.9;
          return 1.0; // personal
        };
        
        const usageFactor = getUsageFactor();
        calculatedPremium *= usageFactor;
        
        // Age of motorcycle factor
        const vehicleAge = currentYear - parseInt(formData.yearOfManufacture);
        let ageFactor = 1.0;
        
        if (vehicleAge <= 3) ageFactor = 1.0;
        else if (vehicleAge <= 5) ageFactor = 1.1;
        else if (vehicleAge <= 10) ageFactor = 1.2;
        else ageFactor = 1.3;
        
        calculatedPremium *= ageFactor;
        
        // Modifications factor
        if (formData.hasModifications) {
          calculatedPremium *= 1.15; // 15% increase for modifications
        }
        
        // Add premiums for selected add-ons (only applicable for comprehensive)
        if (formData.coverType === 'comprehensive') {
          formData.selectedAddons.forEach(addonId => {
            const addon = ADDONS.find(a => a.id === addonId);
            if (addon) {
              calculatedPremium += addon.premium;
            }
          });
        }
        
        // Policy fees and levies
        const trainingLevy = calculatedPremium * 0.002; // Training levy
        const pcf = 40; // Policy holders compensation fund
        const stampDuty = 40; // Stamp duty
        
        // Add fees and levies
        calculatedPremium = calculatedPremium + trainingLevy + pcf + stampDuty;
        
        // Round to nearest 100
        calculatedPremium = Math.ceil(calculatedPremium / 100) * 100;
        
        setPremium(calculatedPremium);
      } catch (error) {
        console.error("Premium calculation error:", error);
        // Fallback to default premium
        setPremium(formData.coverType === 'comprehensive' ? 7000 : 3000);
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
    
    if (!formData.motorcycleType) newErrors.motorcycleType = 'Motorcycle type is required';
    if (!formData.motorcycleMake) newErrors.motorcycleMake = 'Make is required';
    if (!formData.motorcycleModel) newErrors.motorcycleModel = 'Model is required';
    if (!formData.engineCapacity) newErrors.engineCapacity = 'Engine capacity is required';
    if (!formData.yearOfManufacture) newErrors.yearOfManufacture = 'Year is required';
    if (!formData.usageType) newErrors.usageType = 'Usage type is required';
    if (!formData.coverType) newErrors.coverType = 'Cover type is required';
    
    if (!formData.registrationNumber) {
      newErrors.registrationNumber = 'Registration number is required';
    } else if (!/^K[A-Z]{2}\s?\d{3}[A-Z]$/i.test(formData.registrationNumber)) {
      newErrors.registrationNumber = 'Invalid registration format (e.g. KAA 123Z)';
    }
    
    // Only validate motorcycle value for comprehensive cover
    if (formData.coverType === 'comprehensive') {
      if (!formData.motorcycleValue) {
        newErrors.motorcycleValue = 'Motorcycle value is required for comprehensive cover';
      } else {
        const value = parseFloat(formData.motorcycleValue);
        if (isNaN(value) || value < 50000) {
          newErrors.motorcycleValue = 'Motorcycle value must be at least KSh 50,000';
        }
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
      const prefix = formData.coverType === 'comprehensive' ? 'PMC' : 'PMT';
      setQuotationId(`${prefix}-${Math.floor(100000 + Math.random() * 900000)}`);
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
          autoCapitalize="none"
        />
        {errors.ownerEmail && <Text style={styles.errorText}>{errors.ownerEmail}</Text>}
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Motorcycle Details</Text>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Cover Type</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.coverType && styles.inputError]}
          onPress={() => setCoverTypeModalVisible(true)}
        >
          <Text style={formData.coverType ? styles.pickerText : styles.placeholderText}>
            {formData.coverType ? 
              COVER_TYPES.find(c => c.id === formData.coverType)?.name : 
              'Select cover type'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.coverType && <Text style={styles.errorText}>{errors.coverType}</Text>}
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
          <Text style={formData.motorcycleModel ? styles.pickerText : styles.placeholderText}>
            {formData.motorcycleModel || (formData.motorcycleMake ? 'Select model' : 'Select make first')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.motorcycleModel && <Text style={styles.errorText}>{errors.motorcycleModel}</Text>}
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
        <Text style={styles.label}>Year of Manufacture</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.yearOfManufacture && styles.inputError]}
          onPress={() => setYearModalVisible(true)}
        >
          <Text style={formData.yearOfManufacture ? styles.pickerText : styles.placeholderText}>
            {formData.yearOfManufacture || 'Select year'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.yearOfManufacture && <Text style={styles.errorText}>{errors.yearOfManufacture}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Registration Number</Text>
        <TextInput
          style={[styles.input, errors.registrationNumber && styles.inputError]}
          placeholder="E.g. KAA 123Z"
          value={formData.registrationNumber}
          onChangeText={(text) => updateField('registrationNumber', text.toUpperCase())}
        />
        {errors.registrationNumber && <Text style={styles.errorText}>{errors.registrationNumber}</Text>}
      </View>
      
      {/* Only show value field for comprehensive cover */}
      {formData.coverType === 'comprehensive' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Motorcycle Value (KSh)</Text>
          <TextInput
            style={[styles.input, errors.motorcycleValue && styles.inputError]}
            placeholder="E.g. 150000"
            value={formData.motorcycleValue}
            onChangeText={(text) => updateField('motorcycleValue', text)}
            keyboardType="numeric"
          />
          {errors.motorcycleValue && <Text style={styles.errorText}>{errors.motorcycleValue}</Text>}
        </View>
      )}
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Usage Type</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.usageType && styles.inputError]}
          onPress={() => setUsageTypeModalVisible(true)}
        >
          <Text style={formData.usageType ? styles.pickerText : styles.placeholderText}>
            {formData.usageType ? 
              USAGE_TYPES.find(u => u.id === formData.usageType)?.name : 
              'Select usage type'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.gray} />
        </TouchableOpacity>
        {errors.usageType && <Text style={styles.errorText}>{errors.usageType}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Does the motorcycle have modifications?</Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.hasModifications && styles.toggleButtonActive
            ]}
            onPress={() => updateField('hasModifications', !formData.hasModifications)}
          >
            <View style={[
              styles.toggleKnob,
              formData.hasModifications && styles.toggleKnobActive
            ]} />
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          Modifications include performance enhancements, aesthetic changes, or non-standard parts
        </Text>
      </View>
      
      {/* Add-ons section (only for comprehensive cover) */}
      {formData.coverType === 'comprehensive' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Optional Add-ons</Text>
            <Text style={styles.sectionSubtitle}>Enhance your comprehensive policy with these add-ons</Text>
          </View>
          
          {ADDONS.map((addon) => (
            <TouchableOpacity
              key={addon.id}
              style={[
                styles.addonOption,
                formData.selectedAddons.includes(addon.id) && styles.addonOptionSelected
              ]}
              onPress={() => toggleAddon(addon.id)}
            >
              <View style={styles.addonCheckbox}>
                {formData.selectedAddons.includes(addon.id) ? (
                  <Ionicons name="checkbox" size={24} color={Colors.primary} />
                ) : (
                  <Ionicons name="square-outline" size={24} color={Colors.gray} />
                )}
              </View>
              <View style={styles.addonDetails}>
                <View style={styles.addonHeader}>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonPremium}>+ KSh {addon.premium.toLocaleString()}</Text>
                </View>
                <Text style={styles.addonDescription}>{addon.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
      
      {/* Premium calculation section */}
      {premium > 0 && (
        <View style={styles.premiumContainer}>
          <Text style={styles.premiumLabel}>
            {formData.coverType === 'comprehensive' ? 'Comprehensive' : 'Third Party'} Premium:
          </Text>
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
            <Text style={styles.summaryLabel}>Engine:</Text>
            <Text style={styles.summaryValue}>{formData.engineCapacity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Year:</Text>
            <Text style={styles.summaryValue}>{formData.yearOfManufacture}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Registration:</Text>
            <Text style={styles.summaryValue}>{formData.registrationNumber}</Text>
          </View>
          {formData.coverType === 'comprehensive' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Value:</Text>
              <Text style={styles.summaryValue}>KSh {parseInt(formData.motorcycleValue).toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Usage:</Text>
            <Text style={styles.summaryValue}>
              {USAGE_TYPES.find(u => u.id === formData.usageType)?.name}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Modifications:</Text>
            <Text style={styles.summaryValue}>{formData.hasModifications ? 'Yes' : 'No'}</Text>
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
            <Text style={styles.summaryLabel}>Cover Type:</Text>
            <Text style={styles.summaryValue}>
              {COVER_TYPES.find(c => c.id === formData.coverType)?.name}
            </Text>
          </View>
          
          {/* Add-ons (for comprehensive only) */}
          {formData.coverType === 'comprehensive' && formData.selectedAddons.length > 0 && (
            <>
              <Text style={styles.addonsTitle}>Add-ons:</Text>
              {formData.selectedAddons.map(addonId => {
                const addon = ADDONS.find(a => a.id === addonId);
                return (
                  <View key={addonId} style={styles.addonItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.addonItemName}>{addon.name}</Text>
                    <Text style={styles.addonItemPremium}>
                      KSh {addon.premium.toLocaleString()}
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
        Your {formData.coverType === 'comprehensive' ? 'comprehensive' : 'third party'} motorcycle insurance quotation has been created successfully.
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
          <Text style={styles.successValue}>{formData.registrationNumber}</Text>
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
  
  // Modal for motorcycle type selection
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
  
  // Modal for make selection
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
  
  // Modal for model selection
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
  
  // Modal for year selection
  const renderYearModal = () => (
    <Modal
      visible={yearModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setYearModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Year of Manufacture</Text>
          <FlatList
            data={years}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('yearOfManufacture', item);
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
  
  // Modal for engine capacity selection
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
  
  // Modal for usage type selection
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
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('usageType', item.id);
                  setUsageTypeModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
                <Text style={styles.modalItemDescription}>{item.description}</Text>
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
  
  // Modal for cover type selection
  const renderCoverTypeModal = () => (
    <Modal
      visible={coverTypeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setCoverTypeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Cover Type</Text>
          <FlatList
            data={COVER_TYPES}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  updateField('coverType', item.id);
                  setCoverTypeModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
                <Text style={styles.modalItemDescription}>{item.description}</Text>
                <Text style={styles.modalItemPrice}>
                  From KSh {item.basePremium.toLocaleString()} per year
                </Text>
              </TouchableOpacity>
            )}
          />
          <Button
            title="Cancel"
            onPress={() => setCoverTypeModalVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </View>
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
          Private Motorcycle Insurance
        </Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => Alert.alert(
            'Motorcycle Insurance',
            'This insurance provides coverage for private motorcycles, with options for both comprehensive and third-party coverage.'
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
      {renderCoverTypeModal()}
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
  helperText: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.gray,
    marginTop: 2,
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
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: Colors.lightPrimary,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
    backgroundColor: Colors.primary,
  },
  addonOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.small,
    marginBottom: Spacing.small,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addonOptionSelected: {
    backgroundColor: Colors.lightPrimary,
    borderColor: Colors.primary,
  },
  addonCheckbox: {
    marginRight: Spacing.small,
    marginTop: 2,
  },
  addonDetails: {
    flex: 1,
  },
  addonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addonName: {
    fontSize: Typography.fontSizes.small,
    fontWeight: '500',
  },
  addonPremium: {
    fontSize: Typography.fontSizes.small,
    color: Colors.primary,
    fontWeight: '500',
  },
  addonDescription: {
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
    fontWeight: '500',
  },
  modalItemDescription: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.gray,
    marginTop: 2,
  },
  modalItemPrice: {
    fontSize: Typography.fontSizes.xsmall,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
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
  addonsTitle: {
    fontSize: Typography.fontSizes.small,
    fontWeight: '500',
    color: Colors.primary,
    marginTop: Spacing.small,
    marginBottom: 4,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  addonItemName: {
    fontSize: Typography.fontSizes.small,
    marginLeft: 6,
    flex: 1,
  },
  addonItemPremium: {
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
