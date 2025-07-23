/**
 * Private Third-Party Insurance Screen
 * 
 * This screen handles the private third-party insurance quotation flow,
 * following a similar structure to other insurance product screens
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
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing } from '../../../../constants';
import ActionButton from '../../../../components/common/ActionButton';
import Button from '../../../../components/common/Button';

// Vehicle makes and models data
const VEHICLE_MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 
  'Mitsubishi', 'Mercedes-Benz', 'BMW', 'Volkswagen', 'Audi'
];

const VEHICLE_MODELS = {
  'Toyota': ['Corolla', 'Camry', 'RAV4', 'Land Cruiser', 'Prado', 'Fortuner', 'Vitz', 'Prius'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Fit', 'Jazz', 'HR-V'],
  'Nissan': ['X-Trail', 'Juke', 'Note', 'Qashqai', 'Navara', 'Patrol'],
  'Mazda': ['CX-5', 'Mazda3', 'Mazda6', 'CX-3', 'CX-9', 'Demio'],
  'Subaru': ['Forester', 'Impreza', 'Outback', 'Legacy', 'XV', 'WRX'],
  'Mitsubishi': ['Outlander', 'Pajero', 'ASX', 'Lancer', 'Eclipse Cross'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'A-Class'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series', 'X1'],
  'Volkswagen': ['Golf', 'Passat', 'Tiguan', 'Polo', 'Touareg', 'Jetta'],
  'Audi': ['A4', 'Q5', 'A6', 'Q7', 'A3', 'Q3']
};

// Generate years from 2000 to current year
const YEARS = Array.from(
  {length: new Date().getFullYear() - 1999}, 
  (_, i) => (new Date().getFullYear() - i).toString()
);

// Private third-party insurance constants
const BASE_PREMIUM = 7500; // Base premium for private third-party insurance
const MIN_PREMIUM = 7500; // Minimum premium allowed

export default function PrivateThirdPartyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleReg: '',
    vehicleValue: ''
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: form, 2: summary, 3: success
  const [premium, setPremium] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  
  // Modal state
  const [makeModalVisible, setMakeModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  
  // Effect to calculate premium when relevant fields change
  useEffect(() => {
    if (formData.vehicleMake && formData.vehicleModel && formData.vehicleYear && formData.vehicleValue) {
      calculatePremium();
    }
  }, [formData.vehicleMake, formData.vehicleModel, formData.vehicleYear, formData.vehicleValue]);
  
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
  
  // Calculate premium for Private Third-Party insurance
  const calculatePremium = () => {
    setIsCalculating(true);
    
    // Wait a bit to simulate API call/calculation
    setTimeout(() => {
      try {
        // Base premium calculation
        let calculatedPremium = BASE_PREMIUM;
        
        // Vehicle age adjustment
        const vehicleAge = new Date().getFullYear() - parseInt(formData.vehicleYear);
        
        if (vehicleAge < 5) {
          calculatedPremium += 500; // Newer vehicles
        } else if (vehicleAge >= 10) {
          calculatedPremium += 1000; // Older vehicles have higher risk
        }
        
        // Make/model risk factor adjustments could be added here
        
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
    
    if (!formData.vehicleMake) newErrors.vehicleMake = 'Vehicle make is required';
    if (!formData.vehicleModel) newErrors.vehicleModel = 'Vehicle model is required';
    if (!formData.vehicleYear) newErrors.vehicleYear = 'Vehicle year is required';
    
    if (!formData.vehicleReg) {
      newErrors.vehicleReg = 'Registration number is required';
    } else if (!/^K[A-Z]{2}\s?\d{3}[A-Z]$/i.test(formData.vehicleReg)) {
      newErrors.vehicleReg = 'Invalid registration format (e.g. KAA 123Z)';
    }
    
    if (!formData.vehicleValue) {
      newErrors.vehicleValue = 'Vehicle value is required';
    } else if (!/^\d+$/.test(formData.vehicleValue)) {
      newErrors.vehicleValue = 'Enter a valid amount';
    } else if (parseInt(formData.vehicleValue) < 100000) {
      newErrors.vehicleValue = 'Value must be at least KES 100,000';
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
      setQuotationId(`PTP-${Math.floor(100000 + Math.random() * 900000)}`);
    } else {
      // Scroll to first error
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }
  };
  
  // Handle policy purchase
  const handlePurchase = () => {
    setIsSubmitting(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStep(3);
    }, 2000);
  };
  
  // Share quotation details
  const handleShare = () => {
    const policyDetails = {
      quotationId,
      ownerName: formData.ownerName,
      vehicleDetails: `${formData.vehicleMake} ${formData.vehicleModel} (${formData.vehicleYear})`,
      vehicleReg: formData.vehicleReg,
      premium,
      coverType: 'Private Third-Party Insurance',
      period: '1 Year',
      timestamp: new Date().toISOString(),
    };
    
    // Alert for demo purposes - in production would use Share API
    Alert.alert(
      "Share Quotation",
      `Quotation ${quotationId} ready to share for ${formData.ownerName}'s ${formData.vehicleMake} ${formData.vehicleModel}`,
      [
        { text: "OK" }
      ]
    );
  };
  
  // Reset and start over
  const handleStartOver = () => {
    navigation.navigate('MotorProductSelection', { vehicleCategory: { id: 'private', name: 'Private' } });
  };
  
  // Navigate back
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };
  
  // Render Vehicle Make Selection
  const renderMakeSelection = () => (
    <View>
      <Text style={styles.formLabel}>Vehicle Make</Text>
      <TouchableOpacity
        style={[styles.selectInput, errors.vehicleMake && styles.inputError]}
        onPress={() => setMakeModalVisible(true)}
      >
        <View style={styles.inputRow}>
          <Ionicons name="car-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
          <Text style={formData.vehicleMake ? styles.inputText : styles.inputPlaceholder}>
            {formData.vehicleMake || 'Select Vehicle Make'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {errors.vehicleMake && <Text style={styles.errorText}>{errors.vehicleMake}</Text>}
      
      {makeModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicle Make</Text>
              <TouchableOpacity onPress={() => setMakeModalVisible(false)}>
                <View>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </View>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {VEHICLE_MAKES.map(make => (
                <TouchableOpacity 
                  key={make}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('vehicleMake', make);
                    updateField('vehicleModel', ''); // Reset model when make changes
                    setMakeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{make}</Text>
                  {formData.vehicleMake === make && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
  
  // Render Vehicle Model Selection
  const renderModelSelection = () => (
    <View>
      <Text style={styles.formLabel}>Vehicle Model</Text>
      <TouchableOpacity
        style={[styles.selectInput, errors.vehicleModel && styles.inputError]}
        onPress={() => {
          if (!formData.vehicleMake) {
            Alert.alert('Select Make First', 'Please select a vehicle make first');
            return;
          }
          setModelModalVisible(true);
        }}
      >
        <View style={styles.inputRow}>
          <Ionicons name="car-sport-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
          <Text style={formData.vehicleModel ? styles.inputText : styles.inputPlaceholder}>
            {formData.vehicleModel || 'Select Vehicle Model'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {errors.vehicleModel && <Text style={styles.errorText}>{errors.vehicleModel}</Text>}
      
      {modelModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicle Model</Text>
              <TouchableOpacity onPress={() => setModelModalVisible(false)}>
                <View>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </View>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {VEHICLE_MODELS[formData.vehicleMake]?.map(model => (
                <TouchableOpacity 
                  key={model}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('vehicleModel', model);
                    setModelModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{model}</Text>
                  {formData.vehicleModel === model && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
  
  // Render Vehicle Year Selection
  const renderYearSelection = () => (
    <View>
      <Text style={styles.formLabel}>Year of Manufacture</Text>
      <TouchableOpacity
        style={[styles.selectInput, errors.vehicleYear && styles.inputError]}
        onPress={() => setYearModalVisible(true)}
      >
        <View style={styles.inputRow}>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
          <Text style={formData.vehicleYear ? styles.inputText : styles.inputPlaceholder}>
            {formData.vehicleYear || 'Select Year'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {errors.vehicleYear && <Text style={styles.errorText}>{errors.vehicleYear}</Text>}
      
      {yearModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setYearModalVisible(false)}>
                <View>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </View>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {YEARS.map(year => (
                <TouchableOpacity 
                  key={year}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('vehicleYear', year);
                    setYearModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{year}</Text>
                  {formData.vehicleYear === year && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
  
  // Render form inputs step
  const renderFormStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
            <Text style={styles.infoCardTitle}>Private Third-Party Insurance</Text>
          </View>
          <Text style={styles.infoCardText}>
            This coverage provides protection against third-party liabilities arising from accidents
            involving your private vehicle. It covers damages to third-party property, bodily injury,
            and death as required by law.
          </Text>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Owner Information</Text>
          
          <Text style={styles.formLabel}>Owner Name</Text>
          <View style={[styles.textInputContainer, errors.ownerName && styles.inputError]}>
            <Ionicons name="person-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Full Name"
              placeholderTextColor={Colors.textSecondary}
              value={formData.ownerName}
              onChangeText={(text) => updateField('ownerName', text)}
            />
          </View>
          {errors.ownerName && <Text style={styles.errorText}>{errors.ownerName}</Text>}
          
          <Text style={styles.formLabel}>Phone Number</Text>
          <View style={[styles.textInputContainer, errors.ownerPhone && styles.inputError]}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="0712 345 678"
              placeholderTextColor={Colors.textSecondary}
              value={formData.ownerPhone}
              onChangeText={(text) => updateField('ownerPhone', text)}
              keyboardType="phone-pad"
            />
          </View>
          {errors.ownerPhone && <Text style={styles.errorText}>{errors.ownerPhone}</Text>}
          
          <Text style={styles.formLabel}>Email (Optional)</Text>
          <View style={[styles.textInputContainer, errors.ownerEmail && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="email@example.com"
              placeholderTextColor={Colors.textSecondary}
              value={formData.ownerEmail}
              onChangeText={(text) => updateField('ownerEmail', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.ownerEmail && <Text style={styles.errorText}>{errors.ownerEmail}</Text>}
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          
          {renderMakeSelection()}
          {renderModelSelection()}
          {renderYearSelection()}
          
          <Text style={styles.formLabel}>Registration Number</Text>
          <View style={[styles.textInputContainer, errors.vehicleReg && styles.inputError]}>
            <Ionicons name="car-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="KAA 123Z"
              placeholderTextColor={Colors.textSecondary}
              value={formData.vehicleReg}
              onChangeText={(text) => updateField('vehicleReg', text.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>
          {errors.vehicleReg && <Text style={styles.errorText}>{errors.vehicleReg}</Text>}
          
          <Text style={styles.formLabel}>Vehicle Value (KES)</Text>
          <View style={[styles.textInputContainer, errors.vehicleValue && styles.inputError]}>
            <Ionicons name="cash-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 1500000"
              placeholderTextColor={Colors.textSecondary}
              value={formData.vehicleValue}
              onChangeText={(text) => updateField('vehicleValue', text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
          </View>
          {errors.vehicleValue && <Text style={styles.errorText}>{errors.vehicleValue}</Text>}
        </View>
        
        <View style={styles.premiumSection}>
          <Text style={styles.premiumLabel}>Calculated Premium</Text>
          {isCalculating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.premiumValue}>
              KES {premium.toLocaleString()}
            </Text>
          )}
        </View>
        
        <Button 
          title="Continue to Quote"
          onPress={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          style={styles.submitButton}
          variant="primary"
          size="large"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
  
  // Render quotation summary step
  const renderSummaryStep = () => (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.quotationCard}>
        <View style={styles.quotationHeader}>
          <Text style={styles.quotationTitle}>Private Third-Party Insurance</Text>
          <Text style={styles.quotationNumber}>Quote #{quotationId}</Text>
        </View>
        
        <View style={styles.quotationSection}>
          <Text style={styles.quotationSectionTitle}>Customer Details</Text>
          
          <View style={styles.quotationRow}>
            <Text style={styles.quotationLabel}>Name:</Text>
            <Text style={styles.quotationValue}>{formData.ownerName}</Text>
          </View>
          
          <View style={styles.quotationRow}>
            <Text style={styles.quotationLabel}>Phone:</Text>
            <Text style={styles.quotationValue}>{formData.ownerPhone}</Text>
          </View>
          
          {formData.ownerEmail && (
            <View style={styles.quotationRow}>
              <Text style={styles.quotationLabel}>Email:</Text>
              <Text style={styles.quotationValue}>{formData.ownerEmail}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.quotationSection}>
          <Text style={styles.quotationSectionTitle}>Vehicle Details</Text>
          
          <View style={styles.quotationRow}>
            <Text style={styles.quotationLabel}>Vehicle:</Text>
            <Text style={styles.quotationValue}>{formData.vehicleMake} {formData.vehicleModel}</Text>
          </View>
          
          <View style={styles.quotationRow}>
            <Text style={styles.quotationLabel}>Year:</Text>
            <Text style={styles.quotationValue}>{formData.vehicleYear}</Text>
          </View>
          
          <View style={styles.quotationRow}>
            <Text style={styles.quotationLabel}>Registration:</Text>
            <Text style={styles.quotationValue}>{formData.vehicleReg}</Text>
          </View>
          
          <View style={styles.quotationRow}>
            <Text style={styles.quotationLabel}>Value:</Text>
            <Text style={styles.quotationValue}>KES {parseInt(formData.vehicleValue).toLocaleString()}</Text>
          </View>
        </View>
        
        <View style={styles.quotationSection}>
          <Text style={styles.quotationSectionTitle}>Coverage Details</Text>
          
          <View style={styles.quotationRow}>
            <Text style={styles.quotationLabel}>Type:</Text>
            <Text style={styles.quotationValue}>Third-Party Only</Text>
          </View>
          
          <View style={styles.quotationRow}>
            <Text style={styles.quotationLabel}>Duration:</Text>
            <Text style={styles.quotationValue}>1 Year</Text>
          </View>
        </View>
        
        <View style={styles.premiumQuoteSection}>
          <Text style={styles.premiumQuoteLabel}>Premium Amount</Text>
          <Text style={styles.premiumQuoteValue}>KES {premium.toLocaleString()}</Text>
        </View>
        
        <View style={styles.quotationActions}>
          <Button
            title="Share Quote"
            onPress={handleShare}
            variant="secondary"
            style={styles.shareButton}
            textStyle={styles.shareButtonText}
          />
          
          <Button
            title="Purchase Policy"
            onPress={handlePurchase}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.purchaseButton}
            variant="primary"
          />
        </View>
      </View>
    </ScrollView>
  );
  
  // Render success step
  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIconContainer}>
        <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      </View>
      
      <Text style={styles.successTitle}>Quote Generated Successfully!</Text>
      <Text style={styles.successMessage}>
        Your private third-party insurance quotation has been generated successfully.
        You can now proceed with the purchase or share it with your client.
      </Text>
      
      <View style={styles.quotationSummary}>
        <Text style={styles.quotationSummaryTitle}>Quote Summary</Text>
        <Text style={styles.quotationSummaryId}>#{quotationId}</Text>
        <Text style={styles.quotationSummaryVehicle}>{formData.vehicleMake} {formData.vehicleModel} ({formData.vehicleYear})</Text>
        <Text style={styles.quotationSummaryReg}>{formData.vehicleReg}</Text>
        <Text style={styles.quotationSummaryPremium}>KES {premium.toLocaleString()}</Text>
      </View>
      
      <View style={styles.successButtons}>
        <Button
          title="Back to Home"
          onPress={() => navigation.navigate('Home')}
          variant="secondary"
          style={styles.homeButton}
          textStyle={styles.homeButtonText}
        />
        
        <Button
          title="New Quote"
          onPress={handleStartOver}
          variant="primary"
          style={styles.newQuoteButton}
        />
      </View>
    </View>
  );
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={handleBack}
        >
          <View>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {currentStep === 1 ? 'Private Third-Party Insurance' : 
           currentStep === 2 ? 'Quotation Summary' : 
           'Success'}
        </Text>
      </View>
      
      {/* Progress steps */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.stepItem}>
            <View style={[
              styles.stepIndicator,
              currentStep >= step ? styles.stepActive : {}
            ]}>
              {currentStep > step ? (
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  currentStep >= step ? styles.stepNumberActive : {}
                ]}>
                  {step}
                </Text>
              )}
            </View>
            
            <View style={[
              styles.stepConnector,
              step < 3 ? {} : styles.stepConnectorHidden,
              currentStep > step ? styles.stepConnectorActive : {}
            ]} />
          </View>
        ))}
      </View>
      
      {/* Content based on current step */}
      <View style={styles.content}>
        {currentStep === 1 && renderFormStep()}
        {currentStep === 2 && renderSummaryStep()}
        {currentStep === 3 && renderSuccessStep()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  backButtonContainer: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepConnector: {
    width: 40,
    height: 3,
    backgroundColor: Colors.backgroundLight,
    marginHorizontal: Spacing.xs / 2,
  },
  stepConnectorActive: {
    backgroundColor: Colors.primary,
  },
  stepConnectorHidden: {
    opacity: 0,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoCardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  infoCardText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs / 2,
    marginTop: Spacing.sm,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 12,
    marginBottom: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    marginTop: -Spacing.xs / 2,
    marginBottom: Spacing.sm,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  modalList: {
    maxHeight: 300,
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
  },
  premiumSection: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  premiumLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  premiumValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  quotationCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quotationHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  quotationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  quotationNumber: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs / 2,
  },
  quotationSection: {
    marginBottom: Spacing.md,
  },
  quotationSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  quotationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  quotationLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  quotationValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  premiumQuoteSection: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  premiumQuoteLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  premiumQuoteValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  quotationActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.xs,
  },
  shareButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.xs / 2,
  },
  purchaseButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  purchaseButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.xs / 2,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  successIconContainer: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  quotationSummary: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  quotationSummaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  quotationSummaryId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  quotationSummaryVehicle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  quotationSummaryReg: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  quotationSummaryPremium: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  successButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    marginRight: Spacing.xs,
  },
  homeButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.xs / 2,
  },
  newQuoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.xs,
  },
  newQuoteButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.xs / 2,
  },
});
