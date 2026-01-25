/**
 * Simple Test: Verify Motor3 Flow Works
 * 
 * This minimal component tests if the basic flow works:
 * 1. Shows categories
 * 2. Shows subcategories
 * 3. Shows form fields
 * 
 * Replace Motor3Container temporarily with this to test
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Motor3Provider } from './contexts/Motor3Context';
import { ThirdPartyProvider } from './contexts/ThirdPartyContext';

const SimpleMotor3Test = () => {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Hardcoded test data
  const testCategories = [
    { code: 'PRIVATE', name: 'Private', icon: '🚗' },
    { code: 'COMMERCIAL', name: 'Commercial', icon: '🚚' },
  ];

  const testSubcategories = {
    PRIVATE: [
      { subcategory_code: 'PRIVATE_THIRD_PARTY', name: 'Third Party', coverage_type: 'THIRD_PARTY', pricing_model: 'FIXED' },
      { subcategory_code: 'PRIVATE_COMPREHENSIVE', name: 'Comprehensive', coverage_type: 'COMPREHENSIVE', pricing_model: 'BRACKET' },
    ],
    COMMERCIAL: [
      { subcategory_code: 'COMMERCIAL_THIRD_PARTY', name: 'Commercial Third Party', coverage_type: 'THIRD_PARTY', pricing_model: 'TONNAGE' },
    ],
  };

  const handleCategorySelect = (category) => {
    console.log('✅ Category selected:', category.name);
    setSelectedCategory(category);
    setStep(2);
  };

  const handleSubcategorySelect = (subcategory) => {
    console.log('✅ Subcategory selected:', subcategory.name);
    setSelectedSubcategory(subcategory);
    setStep(3);
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Step 1: Select Category</Text>
      {testCategories.map((cat) => (
        <TouchableOpacity
          key={cat.code}
          style={styles.card}
          onPress={() => handleCategorySelect(cat)}
        >
          <Text style={styles.icon}>{cat.icon}</Text>
          <Text style={styles.cardText}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep2 = () => {
    const subcategories = testSubcategories[selectedCategory.code] || [];
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>Step 2: Select Coverage for {selectedCategory.name}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        {subcategories.map((sub) => (
          <TouchableOpacity
            key={sub.subcategory_code}
            style={styles.card}
            onPress={() => handleSubcategorySelect(sub)}
          >
            <Text style={styles.cardText}>{sub.name}</Text>
            <Text style={styles.subText}>{sub.coverage_type} - {sub.pricing_model}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.title}>Step 3: Vehicle Details</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>✅ Category: {selectedCategory.name}</Text>
        <Text style={styles.infoText}>✅ Coverage: {selectedSubcategory.name}</Text>
        <Text style={styles.infoText}>✅ Code: {selectedSubcategory.subcategory_code}</Text>
      </View>

      {/* Simulated form fields */}
      <View style={styles.formField}>
        <Text style={styles.label}>Financial Interest</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity style={styles.radioButton}>
            <Text>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioButton}>
            <Text>No</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Identification Type</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity style={styles.radioButton}>
            <Text>Vehicle Registration</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioButton}>
            <Text>Chassis Number</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Vehicle Registration</Text>
        <View style={styles.textInput}>
          <Text style={styles.placeholder}>e.g., KDA 123A</Text>
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Cover Start Date</Text>
        <View style={styles.textInput}>
          <Text style={styles.placeholder}>Select date</Text>
        </View>
      </View>

      <View style={styles.successBox}>
        <Text style={styles.successText}>
          ✅ If you see these fields, Motor3 flow is working correctly!
        </Text>
        <Text style={styles.successText}>
          The issue is likely in TPVehicleForm rendering or context updates.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </View>
  );
};

const SimpleMotor3TestWithProviders = () => (
  <Motor3Provider>
    <ThirdPartyProvider>
      <SimpleMotor3Test />
    </ThirdPartyProvider>
  </Motor3Provider>
);

export default SimpleMotor3TestWithProviders;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2C3E50',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  subText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  backButton: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  infoBox: {
    backgroundColor: '#D4EDDA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 4,
  },
  formField: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2C3E50',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    backgroundColor: '#ECF0F1',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  placeholder: {
    color: '#999',
  },
  successBox: {
    backgroundColor: '#D4EDDA',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  successText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 8,
  },
});
