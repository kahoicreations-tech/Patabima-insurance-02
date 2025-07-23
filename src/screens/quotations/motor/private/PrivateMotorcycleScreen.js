import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import components
import { 
  PersonalInformationStep,
  VehicleDetailsStep,
  VehicleValueStep,
  InsurerSelectionStep,
  PaymentStep
} from './components';

// Import constants
import { Colors, Typography, Spacing } from '../../../../constants';

// Motorcycle types
const MOTORCYCLE_TYPES = [
  { id: 'standard', name: 'Standard Motorcycle', description: 'General purpose motorcycles for everyday use' },
  { id: 'sports', name: 'Sports Bike', description: 'High-performance racing and sport motorcycles' },
  { id: 'cruiser', name: 'Cruiser', description: 'Comfortable touring and leisure motorcycles' },
  { id: 'scooter', name: 'Scooter', description: 'Small displacement urban transportation' },
  { id: 'dirt_bike', name: 'Dirt Bike', description: 'Off-road and motocross motorcycles' },
  { id: 'moped', name: 'Moped', description: 'Low-power motorcycles with pedals' },
  { id: 'delivery', name: 'Delivery Bike', description: 'Commercial delivery motorcycles' },
];

// Motorcycle makes
const MOTORCYCLE_MAKES = [
  'Honda',
  'Yamaha', 
  'Suzuki',
  'Kawasaki',
  'TVS',
  'Bajaj',
  'Hero',
  'Royal Enfield',
  'KTM',
  'Haojue',
  'Skygo',
  'Dayun',
  'Other'
];

// Motorcycle models by make
const MOTORCYCLE_MODELS = {
  'Honda': ['CB150R', 'CBR150R', 'CG125', 'XR150L', 'CB300F', 'CBR300R', 'CB500X', 'PCX150'],
  'Yamaha': ['YBR125', 'FZ150i', 'R15', 'MT125', 'NMAX155', 'Aerox155', 'YZF-R3', 'MT-03'],
  'Suzuki': ['GS125', 'GN125', 'GSX-R150', 'Gixxer', 'Address 110', 'Let\'s', 'GSX250R'],
  'Kawasaki': ['Ninja 300', 'Z125 PRO', 'KLX150', 'Versys-X 300', 'Ninja 400', 'Z400'],
  'TVS': ['Apache RTR 160', 'Apache RTR 200', 'Star City', 'XL100', 'NTORQ 125'],
  'Bajaj': ['Pulsar 150', 'Pulsar 200', 'CT100', 'Platina', 'Dominar 400', 'Avenger'],
  'Hero': ['Splendor Plus', 'HF Deluxe', 'Passion Pro', 'Glamour', 'Xtreme 160R'],
  'Royal Enfield': ['Classic 350', 'Bullet 350', 'Himalayan', 'Interceptor 650', 'Continental GT'],
  'KTM': ['Duke 125', 'Duke 200', 'Duke 390', 'RC 200', 'RC 390', 'Adventure 390'],
  'Haojue': ['DK125', 'DK150', 'TR150', 'HJ125-7', 'Suzuki EN125'],
  'Skygo': ['SG125', 'SG150', 'SG200', 'Cruiser 150'],
  'Dayun': ['DY125', 'DY150', 'Hunter 150', 'Warrior 200'],
  'Other': ['Enter model manually']
};

// Engine capacities
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
        const baseCoverPremium = COVER_TYPES.find(type => type.id === formData.coverType)?.basePremium || 0;
        let calculatedPremium = baseCoverPremium;
        
        // Apply adjustments based on usage
        if (formData.usageType === 'food_delivery') {
          calculatedPremium *= 1.5; // 50% increase for delivery
        } else if (formData.usageType === 'recreational') {
          calculatedPremium *= 0.8; // 20% discount for weekend riders
        }
        
        // Engine capacity adjustment
        const engineCC = parseInt(formData.engineCapacity.split(' ')[0]);
        if (engineCC > 400) {
          calculatedPremium *= 1.3; // 30% increase for high capacity
        } else if (engineCC < 150) {
          calculatedPremium *= 0.9; // 10% discount for small bikes
        }
        
        // Age factor
        const vehicleAge = new Date().getFullYear() - parseInt(formData.yearOfManufacture);
        if (vehicleAge > 10) {
          calculatedPremium *= 1.2; // 20% increase for old bikes
        }
        
        // Modifications penalty
        if (formData.hasModifications) {
          calculatedPremium *= 1.15; // 15% increase for modifications
        }
        
        // Add-ons (only for comprehensive)
        if (formData.coverType === 'comprehensive') {
          formData.selectedAddons.forEach(addonId => {
            const addon = ADDONS.find(a => a.id === addonId);
            if (addon) {
              calculatedPremium += addon.premium;
            }
          });
        }
        
        setPremium(Math.round(calculatedPremium));
      } catch (error) {
        console.error('Premium calculation error:', error);
        setPremium(0);
      } finally {
        setIsCalculating(false);
      }
    }, 1000);
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    
    if (!formData.ownerPhone.trim()) {
      newErrors.ownerPhone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.ownerPhone.replace(/\D/g, ''))) {
      newErrors.ownerPhone = 'Please enter a valid 10-digit phone number';
    }
    
    if (formData.ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Please enter a valid email address';
    }
    
    if (!formData.motorcycleType) {
      newErrors.motorcycleType = 'Motorcycle type is required';
    }
    
    if (!formData.motorcycleMake) {
      newErrors.motorcycleMake = 'Make is required';
    }
    
    if (!formData.motorcycleModel) {
      newErrors.motorcycleModel = 'Model is required';
    }
    
    if (!formData.engineCapacity) {
      newErrors.engineCapacity = 'Engine capacity is required';
    }
    
    if (!formData.yearOfManufacture) {
      newErrors.yearOfManufacture = 'Year of manufacture is required';
    }
    
    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registration number is required';
    }
    
    if (!formData.motorcycleValue || parseFloat(formData.motorcycleValue) <= 0) {
      newErrors.motorcycleValue = 'Valid motorcycle value is required';
    }
    
    if (!formData.usageType) {
      newErrors.usageType = 'Usage type is required';
    }
    
    if (!formData.coverType) {
      newErrors.coverType = 'Cover type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }
    
    if (premium === 0) {
      Alert.alert('Error', 'Unable to calculate premium. Please check your inputs.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate quotation ID
      const newQuotationId = `MC${Date.now()}`;
      setQuotationId(newQuotationId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Quotation Generated!',
        `Your motorcycle insurance quotation has been generated successfully.\n\nQuotation ID: ${newQuotationId}\nAnnual Premium: KSh ${premium.toLocaleString()}\n\nA copy has been sent to your email.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to generate quotation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get premium display text
  const getPremiumDisplay = () => {
    if (isCalculating) {
      return 'Calculating...';
    }
    if (premium > 0) {
      return `KSh ${premium.toLocaleString()}`;
    }
    return 'Complete form to see premium';
  };
  
  // Get premium display color
  const getPremiumColor = () => {
    if (isCalculating) {
      return Colors.warning;
    }
    if (premium > 0) {
      return Colors.success;
    }
    return Colors.textMuted;
  };
  
  // Next step handler
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };
  
  // Previous step handler
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <Text style={styles.stepDescription}>
              Please provide your personal details
            </Text>
            
            {/* Owner Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.ownerName && styles.inputError]}
                value={formData.ownerName}
                onChangeText={(value) => updateField('ownerName', value)}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textMuted}
              />
              {errors.ownerName && (
                <Text style={styles.errorText}>{errors.ownerName}</Text>
              )}
            </View>
            
            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.ownerPhone && styles.inputError]}
                value={formData.ownerPhone}
                onChangeText={(value) => updateField('ownerPhone', value)}
                placeholder="0712345678"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                maxLength={15}
              />
              {errors.ownerPhone && (
                <Text style={styles.errorText}>{errors.ownerPhone}</Text>
              )}
            </View>
            
            {/* Email (optional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={[styles.textInput, errors.ownerEmail && styles.inputError]}
                value={formData.ownerEmail}
                onChangeText={(value) => updateField('ownerEmail', value)}
                placeholder="your.email@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.ownerEmail && (
                <Text style={styles.errorText}>{errors.ownerEmail}</Text>
              )}
            </View>
          </View>
        );
      
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Motorcycle Details</Text>
            <Text style={styles.stepDescription}>
              Tell us about your motorcycle
            </Text>
            
            {/* Motorcycle Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Motorcycle Type <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.motorcycleType && styles.inputError]}
                onPress={() => setMotorcycleTypeModalVisible(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !formData.motorcycleType && styles.placeholderText
                ]}>
                  {formData.motorcycleType ? 
                    MOTORCYCLE_TYPES.find(t => t.id === formData.motorcycleType)?.name || formData.motorcycleType :
                    'Select motorcycle type'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              {errors.motorcycleType && (
                <Text style={styles.errorText}>{errors.motorcycleType}</Text>
              )}
            </View>
            
            {/* Make */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Make <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.motorcycleMake && styles.inputError]}
                onPress={() => setMakeModalVisible(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !formData.motorcycleMake && styles.placeholderText
                ]}>
                  {formData.motorcycleMake || 'Select make'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              {errors.motorcycleMake && (
                <Text style={styles.errorText}>{errors.motorcycleMake}</Text>
              )}
            </View>
            
            {/* Model */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Model <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.motorcycleModel && styles.inputError]}
                value={formData.motorcycleModel}
                onChangeText={(value) => updateField('motorcycleModel', value)}
                placeholder="Enter model"
                placeholderTextColor={Colors.textMuted}
              />
              {errors.motorcycleModel && (
                <Text style={styles.errorText}>{errors.motorcycleModel}</Text>
              )}
            </View>
            
            {/* Engine Capacity */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Engine Capacity <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.engineCapacity && styles.inputError]}
                onPress={() => setEngineCapacityModalVisible(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !formData.engineCapacity && styles.placeholderText
                ]}>
                  {formData.engineCapacity || 'Select engine capacity'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              {errors.engineCapacity && (
                <Text style={styles.errorText}>{errors.engineCapacity}</Text>
              )}
            </View>
            
            {/* Year of Manufacture */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Year of Manufacture <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.yearOfManufacture && styles.inputError]}
                onPress={() => setYearModalVisible(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !formData.yearOfManufacture && styles.placeholderText
                ]}>
                  {formData.yearOfManufacture || 'Select year'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              {errors.yearOfManufacture && (
                <Text style={styles.errorText}>{errors.yearOfManufacture}</Text>
              )}
            </View>
            
            {/* Registration Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Registration Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.registrationNumber && styles.inputError]}
                value={formData.registrationNumber}
                onChangeText={(value) => updateField('registrationNumber', value.toUpperCase())}
                placeholder="KXX 123Y"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                maxLength={10}
              />
              {errors.registrationNumber && (
                <Text style={styles.errorText}>{errors.registrationNumber}</Text>
              )}
            </View>
            
            {/* Motorcycle Value */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Motorcycle Value (KSh) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.motorcycleValue && styles.inputError]}
                value={formData.motorcycleValue}
                onChangeText={(value) => updateField('motorcycleValue', value)}
                placeholder="150000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              {errors.motorcycleValue && (
                <Text style={styles.errorText}>{errors.motorcycleValue}</Text>
              )}
            </View>
          </View>
        );
      
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Insurance Details</Text>
            <Text style={styles.stepDescription}>
              Choose your coverage options
            </Text>
            
            {/* Usage Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Usage Type <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.usageType && styles.inputError]}
                onPress={() => setUsageTypeModalVisible(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !formData.usageType && styles.placeholderText
                ]}>
                  {formData.usageType ? 
                    USAGE_TYPES.find(t => t.id === formData.usageType)?.name || formData.usageType :
                    'Select usage type'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              {errors.usageType && (
                <Text style={styles.errorText}>{errors.usageType}</Text>
              )}
            </View>
            
            {/* Cover Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Insurance Cover <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.coverType && styles.inputError]}
                onPress={() => setCoverTypeModalVisible(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !formData.coverType && styles.placeholderText
                ]}>
                  {formData.coverType ? 
                    COVER_TYPES.find(t => t.id === formData.coverType)?.name || formData.coverType :
                    'Select cover type'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              {errors.coverType && (
                <Text style={styles.errorText}>{errors.coverType}</Text>
              )}
            </View>
            
            {/* Modifications */}
            <View style={styles.inputContainer}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => updateField('hasModifications', !formData.hasModifications)}
                >
                  <Ionicons
                    name={formData.hasModifications ? "checkbox" : "square-outline"}
                    size={24}
                    color={formData.hasModifications ? Colors.primary : Colors.textMuted}
                  />
                </TouchableOpacity>
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxLabel}>My motorcycle has modifications</Text>
                  <Text style={styles.checkboxDescription}>
                    Including exhaust, suspension, performance upgrades, etc.
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Add-ons (only for comprehensive) */}
            {formData.coverType === 'comprehensive' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Optional Add-ons</Text>
                <Text style={styles.inputDescription}>
                  Select additional coverage options
                </Text>
                
                {ADDONS.map((addon) => (
                  <View key={addon.id} style={styles.addonContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => toggleAddon(addon.id)}
                    >
                      <Ionicons
                        name={formData.selectedAddons.includes(addon.id) ? "checkbox" : "square-outline"}
                        size={24}
                        color={formData.selectedAddons.includes(addon.id) ? Colors.primary : Colors.textMuted}
                      />
                    </TouchableOpacity>
                    <View style={styles.addonTextContainer}>
                      <View style={styles.addonHeader}>
                        <Text style={styles.addonName}>{addon.name}</Text>
                        <Text style={styles.addonPremium}>+KSh {addon.premium.toLocaleString()}</Text>
                      </View>
                      <Text style={styles.addonDescription}>{addon.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            {/* Premium Display */}
            <View style={styles.premiumContainer}>
              <View style={styles.premiumHeader}>
                <Text style={styles.premiumLabel}>Estimated Annual Premium</Text>
                <Text style={[styles.premiumAmount, { color: getPremiumColor() }]}>
                  {getPremiumDisplay()}
                </Text>
              </View>
              
              {premium > 0 && (
                <View style={styles.premiumBreakdown}>
                  <Text style={styles.premiumNote}>
                    * This is an estimated premium. Final premium may vary based on 
                    underwriter assessment and current market rates.
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Motorcycle Insurance</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressItem}>
            <View style={[
              styles.progressCircle,
              step <= currentStep && styles.progressCircleActive
            ]}>
              <Text style={[
                styles.progressNumber,
                step <= currentStep && styles.progressNumberActive
              ]}>
                {step}
              </Text>
            </View>
            <Text style={[
              styles.progressLabel,
              step <= currentStep && styles.progressLabelActive
            ]}>
              {step === 1 ? 'Personal' : step === 2 ? 'Motorcycle' : 'Insurance'}
            </Text>
          </View>
        ))}
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>
      
      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton]}
            onPress={handlePrevStep}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.navButtonSpacer} />
        
        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNextStep}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.submitButton]}
            onPress={handleSubmit}
            disabled={isSubmitting || premium === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Generate Quotation</Text>
                <Ionicons name="checkmark" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Modals */}
      {/* Motorcycle Type Modal */}
      <Modal
        visible={motorcycleTypeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMotorcycleTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMotorcycleTypeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Motorcycle Type</Text>
            <ScrollView style={styles.modalList}>
              {MOTORCYCLE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('motorcycleType', type.id);
                    setMotorcycleTypeModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemText}>{type.name}</Text>
                    <Text style={styles.modalItemDescription}>{type.description}</Text>
                  </View>
                  {formData.motorcycleType === type.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Make Modal */}
      <Modal
        visible={makeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMakeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMakeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Make</Text>
            <ScrollView style={styles.modalList}>
              {MOTORCYCLE_MAKES.map((make) => (
                <TouchableOpacity
                  key={make}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('motorcycleMake', make);
                    setMakeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{make}</Text>
                  {formData.motorcycleMake === make && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Engine Capacity Modal */}
      <Modal
        visible={engineCapacityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEngineCapacityModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEngineCapacityModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Engine Capacity</Text>
            <ScrollView style={styles.modalList}>
              {ENGINE_CAPACITIES.map((capacity) => (
                <TouchableOpacity
                  key={capacity}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('engineCapacity', capacity);
                    setEngineCapacityModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{capacity}</Text>
                  {formData.engineCapacity === capacity && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Year Modal */}
      <Modal
        visible={yearModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setYearModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Year</Text>
            <ScrollView style={styles.modalList}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('yearOfManufacture', year);
                    setYearModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{year}</Text>
                  {formData.yearOfManufacture === year && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Usage Type Modal */}
      <Modal
        visible={usageTypeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUsageTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setUsageTypeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Usage Type</Text>
            <ScrollView style={styles.modalList}>
              {USAGE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('usageType', type.id);
                    setUsageTypeModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemText}>{type.name}</Text>
                    <Text style={styles.modalItemDescription}>{type.description}</Text>
                  </View>
                  {formData.usageType === type.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Cover Type Modal */}
      <Modal
        visible={coverTypeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCoverTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCoverTypeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Cover Type</Text>
            <ScrollView style={styles.modalList}>
              {COVER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('coverType', type.id);
                    setCoverTypeModalVisible(false);
                  }}
                >
                  <View style={styles.coverTypeInfo}>
                    <View style={styles.coverTypeHeader}>
                      <Text style={styles.modalItemText}>{type.name}</Text>
                      <Text style={styles.coverTypePremium}>
                        from KSh {type.basePremium.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.modalItemDescription}>{type.description}</Text>
                  </View>
                  {formData.coverType === type.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  progressCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textMuted,
  },
  progressNumberActive: {
    color: 'white',
  },
  progressLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  dropdownText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  checkboxDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inputDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  addonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addonTextContainer: {
    flex: 1,
  },
  addonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addonName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  addonPremium: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  addonDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  premiumContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  premiumAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  premiumBreakdown: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  premiumNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  navButtonSpacer: {
    flex: 1,
  },
  prevButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  prevButtonText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.xs,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.xs,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalList: {
    paddingHorizontal: Spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItemText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  modalItemDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  coverTypeInfo: {
    flex: 1,
  },
  coverTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverTypePremium: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
});
