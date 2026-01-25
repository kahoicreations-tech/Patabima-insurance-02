/**
 * EXAMPLE: Using Field Generator in TPVehicleForm
 * 
 * This demonstrates how to use the field generator to create
 * Motor2-identical form fields dynamically.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { generateFormFields, FIELD_TYPES } from '../utils/fieldGenerator';
import { getSubcategoryByCode } from '../constants/staticCategories';
import {
  StableTextInput,
  RadioGroup,
  DatePicker,
  DropdownSelect,
  VehicleMakeSelector,
  VehicleModelSelector,
  VehicleYearSelector,
} from '../components';

const TPVehicleFormWithGenerator = ({ subcategoryCode, onDataChange }) => {
  const [formData, setFormData] = useState({
    financialInterest: '',
    identificationType: 'Vehicle Registration',
    registrationNumber: '',
    cover_start_date: new Date().toISOString().split('T')[0],
    make: '',
    model: '',
    year: '',
    sum_insured: '',
    tonnage: '',
    capacity: '',
  });

  const [errors, setErrors] = useState({});

  // Generate fields dynamically based on subcategory and current form data
  const fields = useMemo(() => {
    return generateFormFields(subcategoryCode, formData);
  }, [subcategoryCode, formData.identificationType, formData.make, formData.model]);

  // Get subcategory info
  const subcategory = useMemo(() => {
    return getSubcategoryByCode(subcategoryCode);
  }, [subcategoryCode]);

  // Handle field change
  const handleFieldChange = (key, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      
      // Clear dependent fields
      if (key === 'make') {
        updated.model = '';
        updated.model_other = '';
      }
      
      return updated;
    });

    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }

    // Notify parent
    if (onDataChange) {
      onDataChange(key, value);
    }
  };

  // Render field based on type
  const renderField = (field) => {
    const { key, label, type, required, options, placeholder, help } = field;

    // Skip underwriter field (rendered separately)
    if (type === FIELD_TYPES.UNDERWRITER) {
      return null;
    }

    switch (type) {
      case FIELD_TYPES.TEXT:
        return (
          <StableTextInput
            key={key}
            label={label}
            value={formData[key] || ''}
            onChangeText={(value) => handleFieldChange(key, value)}
            placeholder={placeholder}
            required={required}
            error={errors[key]}
            help={help}
          />
        );

      case FIELD_TYPES.NUMBER:
        return (
          <StableTextInput
            key={key}
            label={label}
            value={formData[key] || ''}
            onChangeText={(value) => handleFieldChange(key, value)}
            placeholder={placeholder}
            keyboardType="numeric"
            required={required}
            error={errors[key]}
            help={help}
          />
        );

      case FIELD_TYPES.FORMATTED_NUMBER:
        return (
          <StableTextInput
            key={key}
            label={label}
            value={formData[key] || ''}
            onChangeText={(value) => {
              // Format as currency (add spaces every 3 digits)
              const formatted = value.replace(/\s/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
              handleFieldChange(key, formatted);
            }}
            placeholder={placeholder}
            keyboardType="numeric"
            required={required}
            error={errors[key]}
            help={help}
          />
        );

      case FIELD_TYPES.RADIO:
        return (
          <RadioGroup
            key={key}
            label={label}
            options={options}
            value={formData[key] || ''}
            onSelect={(value) => handleFieldChange(key, value)}
            required={required}
            error={errors[key]}
            help={help}
          />
        );

      case FIELD_TYPES.SELECT:
        return (
          <DropdownSelect
            key={key}
            label={label}
            options={options}
            value={formData[key] || ''}
            onSelect={(value) => handleFieldChange(key, value)}
            placeholder={`Select ${label.toLowerCase()}`}
            required={required}
            error={errors[key]}
            help={help}
          />
        );

      case FIELD_TYPES.DATE:
        return (
          <DatePicker
            key={key}
            label={label}
            value={formData[key] || ''}
            onChange={(value) => handleFieldChange(key, value)}
            required={required}
            error={errors[key]}
            help={help}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{subcategory?.name || 'Vehicle Details'}</Text>
        <Text style={styles.subtitle}>{subcategory?.description || ''}</Text>
      </View>

      <View style={styles.form}>
        {fields.map((field) => (
          <View key={field.key} style={styles.fieldContainer}>
            {renderField(field)}
          </View>
        ))}
      </View>

      {/* Underwriter section rendered separately */}
      <View style={styles.underwriterSection}>
        <Text style={styles.sectionTitle}>Available Underwriters</Text>
        {/* Underwriter comparison cards go here */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#7F8C8D',
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  underwriterSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
    marginBottom: 16,
  },
});

export default TPVehicleFormWithGenerator;
