import React, { useState, useEffect } from 'react';
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

const SpecialVehicleValueStep = ({ 
  formData, 
  onDataChange, 
  onNext, 
  onPrevious,
  currentStep,
  totalSteps 
}) => {
  const [localData, setLocalData] = useState({
    currentMarketValue: formData?.currentMarketValue || '',
    purchasePrice: formData?.purchasePrice || '',
    purchaseDate: formData?.purchaseDate || '',
    replacementValue: formData?.replacementValue || '',
    coverageType: formData?.coverageType || '',
    deductibleAmount: formData?.deductibleAmount || '',
    additionalCoverage: formData?.additionalCoverage || [],
    riskLevel: formData?.riskLevel || '',
    securityFeatures: formData?.securityFeatures || [],
    operatingHazards: formData?.operatingHazards || '',
    estimatedPremium: formData?.estimatedPremium || 0
  });

  const coverageTypes = [
    { label: 'Select Coverage Type', value: '' },
    { label: 'Basic Equipment Protection', value: 'basic', baseRate: 0.035 },
    { label: 'Comprehensive Protection', value: 'comprehensive', baseRate: 0.055 },
    { label: 'All-Risk Coverage', value: 'all_risk', baseRate: 0.075 },
    { label: 'Specialized Equipment Coverage', value: 'specialized', baseRate: 0.095 }
  ];

  const additionalCoverageOptions = [
    { id: 'equipment_breakdown', label: 'Equipment Breakdown', rate: 0.01 },
    { id: 'operator_liability', label: 'Operator Liability', rate: 0.015 },
    { id: 'environmental_damage', label: 'Environmental Damage', rate: 0.02 },
    { id: 'third_party_property', label: 'Third Party Property Damage', rate: 0.012 },
    { id: 'business_interruption', label: 'Business Interruption', rate: 0.025 },
    { id: 'theft_hijacking', label: 'Theft & Hijacking', rate: 0.018 },
    { id: 'natural_disasters', label: 'Natural Disasters', rate: 0.015 },
    { id: 'transportation_coverage', label: 'Transportation Coverage', rate: 0.008 }
  ];

  const riskLevels = [
    { label: 'Select Risk Level', value: '', multiplier: 1 },
    { label: 'Low Risk (Office/Warehouse)', value: 'low', multiplier: 0.8 },
    { label: 'Medium Risk (Construction)', value: 'medium', multiplier: 1.0 },
    { label: 'High Risk (Mining/Quarry)', value: 'high', multiplier: 1.3 },
    { label: 'Very High Risk (Hazardous Materials)', value: 'very_high', multiplier: 1.6 }
  ];

  const securityFeaturesOptions = [
    { id: 'gps_tracking', label: 'GPS Tracking System', discount: 0.05 },
    { id: 'immobilizer', label: 'Engine Immobilizer', discount: 0.03 },
    { id: '24_7_monitoring', label: '24/7 Security Monitoring', discount: 0.08 },
    { id: 'secure_parking', label: 'Secure Parking Facility', discount: 0.04 },
    { id: 'operator_access_control', label: 'Operator Access Control', discount: 0.02 },
    { id: 'cctv_surveillance', label: 'CCTV Surveillance', discount: 0.03 }
  ];

  const deductibleOptions = [
    { label: 'Select Deductible Amount', value: '' },
    { label: 'KES 25,000', value: '25000' },
    { label: 'KES 50,000', value: '50000' },
    { label: 'KES 100,000', value: '100000' },
    { label: 'KES 250,000', value: '250000' },
    { label: 'KES 500,000', value: '500000' }
  ];

  const handleInputChange = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onDataChange(updatedData);
  };

  const handleAdditionalCoverageChange = (coverageId) => {
    const currentCoverage = localData.additionalCoverage || [];
    let updatedCoverage;
    
    if (currentCoverage.includes(coverageId)) {
      updatedCoverage = currentCoverage.filter(id => id !== coverageId);
    } else {
      updatedCoverage = [...currentCoverage, coverageId];
    }
    
    handleInputChange('additionalCoverage', updatedCoverage);
  };

  const handleSecurityFeaturesChange = (featureId) => {
    const currentFeatures = localData.securityFeatures || [];
    let updatedFeatures;
    
    if (currentFeatures.includes(featureId)) {
      updatedFeatures = currentFeatures.filter(id => id !== featureId);
    } else {
      updatedFeatures = [...currentFeatures, featureId];
    }
    
    handleInputChange('securityFeatures', updatedFeatures);
  };

  const calculatePremium = () => {
    const marketValue = parseFloat(localData.currentMarketValue) || 0;
    if (marketValue === 0) return 0;

    // Base rate from coverage type
    const selectedCoverage = coverageTypes.find(c => c.value === localData.coverageType);
    if (!selectedCoverage) return 0;

    let premium = marketValue * selectedCoverage.baseRate;

    // Add additional coverage
    const additionalCoverage = localData.additionalCoverage || [];
    additionalCoverage.forEach(coverageId => {
      const coverage = additionalCoverageOptions.find(c => c.id === coverageId);
      if (coverage) {
        premium += marketValue * coverage.rate;
      }
    });

    // Apply risk level multiplier
    const selectedRisk = riskLevels.find(r => r.value === localData.riskLevel);
    if (selectedRisk) {
      premium *= selectedRisk.multiplier;
    }

    // Apply security features discount
    const securityFeatures = localData.securityFeatures || [];
    let totalDiscount = 0;
    securityFeatures.forEach(featureId => {
      const feature = securityFeaturesOptions.find(f => f.id === featureId);
      if (feature) {
        totalDiscount += feature.discount;
      }
    });
    
    // Cap discount at 20%
    totalDiscount = Math.min(totalDiscount, 0.20);
    premium *= (1 - totalDiscount);

    // Deductible adjustment (lower deductible = higher premium)
    const deductible = parseFloat(localData.deductibleAmount) || 0;
    if (deductible > 0) {
      const deductibleRate = Math.min(deductible / marketValue, 0.1); // Max 10% discount for deductible
      premium *= (1 - deductibleRate * 0.3); // 30% of deductible percentage as discount
    }

    return Math.round(premium);
  };

  useEffect(() => {
    const premium = calculatePremium();
    if (premium !== localData.estimatedPremium) {
      handleInputChange('estimatedPremium', premium);
    }
  }, [
    localData.currentMarketValue, 
    localData.coverageType, 
    localData.additionalCoverage, 
    localData.riskLevel, 
    localData.securityFeatures,
    localData.deductibleAmount
  ]);

  const validateForm = () => {
    const requiredFields = ['currentMarketValue', 'coverageType', 'deductibleAmount', 'riskLevel'];
    const missingFields = requiredFields.filter(field => !localData[field]);
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Incomplete Information',
        'Please fill in all required fields before proceeding.'
      );
      return false;
    }

    const marketValue = parseFloat(localData.currentMarketValue);
    if (isNaN(marketValue) || marketValue <= 0) {
      Alert.alert('Invalid Value', 'Current market value must be a positive number.');
      return false;
    }

    if (localData.purchasePrice) {
      const purchasePrice = parseFloat(localData.purchasePrice);
      if (isNaN(purchasePrice) || purchasePrice <= 0) {
        Alert.alert('Invalid Price', 'Purchase price must be a positive number.');
        return false;
      }
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
        <Text style={styles.title}>Vehicle Value & Coverage</Text>
        <Text style={styles.subtitle}>
          Determine the value and coverage options for your special equipment
        </Text>
      </View>

      <View style={styles.form}>
        {/* Vehicle Valuation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Valuation</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Market Value (KES) *</Text>
            <TextInput
              style={styles.input}
              value={localData.currentMarketValue}
              onChangeText={(value) => handleInputChange('currentMarketValue', value)}
              placeholder="Current replacement value"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Purchase Price (KES)</Text>
              <TextInput
                style={styles.input}
                value={localData.purchasePrice}
                onChangeText={(value) => handleInputChange('purchasePrice', value)}
                placeholder="Original purchase price"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Purchase Date</Text>
              <TextInput
                style={styles.input}
                value={localData.purchaseDate}
                onChangeText={(value) => handleInputChange('purchaseDate', value)}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Replacement Value (KES)</Text>
            <TextInput
              style={styles.input}
              value={localData.replacementValue}
              onChangeText={(value) => handleInputChange('replacementValue', value)}
              placeholder="Cost to replace with new equipment"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Coverage Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coverage Options</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Coverage Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localData.coverageType}
                onValueChange={(value) => handleInputChange('coverageType', value)}
                style={styles.picker}
              >
                {coverageTypes.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deductible Amount *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localData.deductibleAmount}
                onValueChange={(value) => handleInputChange('deductibleAmount', value)}
                style={styles.picker}
              >
                {deductibleOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Coverage Options</Text>
            <View style={styles.checkboxContainer}>
              {additionalCoverageOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.checkboxRow}
                  onPress={() => handleAdditionalCoverageChange(option.id)}
                >
                  <View style={[
                    styles.checkbox,
                    (localData.additionalCoverage || []).includes(option.id) && styles.checkboxSelected
                  ]}>
                    {(localData.additionalCoverage || []).includes(option.id) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Risk Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Risk Level *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localData.riskLevel}
                onValueChange={(value) => handleInputChange('riskLevel', value)}
                style={styles.picker}
              >
                {riskLevels.map((level) => (
                  <Picker.Item key={level.value} label={level.label} value={level.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Hazards & Risks</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={localData.operatingHazards}
              onChangeText={(value) => handleInputChange('operatingHazards', value)}
              placeholder="Describe specific hazards or risks associated with operation"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Security Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Features (Premium Discounts)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Installed Security Features</Text>
            <View style={styles.checkboxContainer}>
              {securityFeaturesOptions.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={styles.checkboxRow}
                  onPress={() => handleSecurityFeaturesChange(feature.id)}
                >
                  <View style={[
                    styles.checkbox,
                    (localData.securityFeatures || []).includes(feature.id) && styles.checkboxSelected
                  ]}>
                    {(localData.securityFeatures || []).includes(feature.id) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    {feature.label} 
                    <Text style={styles.discountText}> (-{(feature.discount * 100).toFixed(0)}%)</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Premium Estimate */}
        <View style={styles.premiumSection}>
          <View style={styles.premiumCard}>
            <Text style={styles.premiumTitle}>Estimated Annual Premium</Text>
            <Text style={styles.premiumAmount}>
              KES {localData.estimatedPremium.toLocaleString()}
            </Text>
            <Text style={styles.premiumNote}>
              *This is an estimate. Final premium will be determined after underwriting review.
            </Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  checkboxContainer: {
    gap: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#D5222B',
    borderColor: '#D5222B',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  discountText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  premiumSection: {
    marginTop: 10,
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#D5222B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  premiumAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D5222B',
    marginBottom: 8,
  },
  premiumNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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

export default SpecialVehicleValueStep;
