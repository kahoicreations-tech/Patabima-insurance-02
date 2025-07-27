/**
 * Commercial Vehicle Details Step Component
 * Handles commercial vehicle specific information including usage and specifications
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const CommercialVehicleDetailsStep = ({ 
  formData, 
  onUpdateFormData, 
  onNext,
  onBack,
  errors: externalErrors,
  setErrors: externalSetErrors,
  isComprehensive = false 
}) => {
  const [showDropdown, setShowDropdown] = useState('');
  const [internalErrors, setInternalErrors] = useState({});
  
  // Use external errors if provided, otherwise use internal state
  const errors = externalErrors || internalErrors;
  const setErrors = externalSetErrors || setInternalErrors;

  // Commercial vehicle categories
  const COMMERCIAL_CATEGORIES = [
    {
      id: 'general_cartage',
      name: 'General Cartage',
      description: 'Vehicles used for general goods transportation',
      subCategories: ['Light Commercial', 'Medium Commercial', 'Heavy Commercial']
    },
    {
      id: 'own_goods',
      name: 'Own Goods',
      description: 'Vehicles used to transport company\'s own goods',
      subCategories: ['Light Own Goods', 'Medium Own Goods', 'Heavy Own Goods']
    },
    {
      id: 'special_type',
      name: 'Special Type',
      description: 'Construction, agricultural, or specialized vehicles',
      subCategories: ['Mobile Crane', 'Earth Mover', 'Fork Lift', 'Agricultural', 'Construction', 'Other Special']
    }
  ];

  // Commercial vehicle makes (focused on commercial brands)
  const COMMERCIAL_MAKES = [
    'Isuzu', 'Mitsubishi', 'Toyota', 'Nissan', 'Hino', 'Scania', 'Volvo', 
    'MAN', 'Mercedes-Benz', 'DAF', 'Iveco', 'Tata', 'Mahindra', 'Ford', 'Other'
  ];

  // Usage patterns for commercial vehicles
  const USAGE_PATTERNS = [
    'Urban delivery',
    'Long distance haulage',
    'Construction sites',
    'Agricultural use',
    'Mixed urban/highway',
    'Specialized operations',
    'Other'
  ];

  // Generate years from 1990 to current year for commercial vehicles
  const YEARS = Array.from(
    {length: new Date().getFullYear() - 1989}, 
    (_, i) => (new Date().getFullYear() - i).toString()
  );

  const updateField = (field, value) => {
    onUpdateFormData({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateStep = () => {
    const newErrors = {};
    
    // Required field validations
    if (!formData.vehicleMake?.trim()) {
      newErrors.vehicleMake = 'Vehicle make is required';
    }
    
    if (!formData.vehicleModel?.trim()) {
      newErrors.vehicleModel = 'Vehicle model is required';
    }
    
    if (!formData.vehicleYear) {
      newErrors.vehicleYear = 'Manufacturing year is required';
    }
    
    if (!formData.registrationNumber?.trim()) {
      newErrors.registrationNumber = 'Registration number is required';
    }
    
    if (!formData.commercialCategory) {
      newErrors.commercialCategory = 'Commercial category is required';
    }
    
    if (!formData.commercialSubCategory) {
      newErrors.commercialSubCategory = 'Sub-category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleDropdown = (dropdownName) => {
    setShowDropdown(showDropdown === dropdownName ? '' : dropdownName);
  };

  const getCurrentSubCategories = () => {
    const selectedCategory = COMMERCIAL_CATEGORIES.find(cat => cat.id === formData.commercialCategory);
    return selectedCategory ? selectedCategory.subCategories : [];
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Commercial Vehicle Details</Text>
        <Text style={styles.stepDescription}>
          Provide detailed information about your commercial vehicle and its usage.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="car-sport" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Commercial Vehicle Classification</Text>
            <Text style={styles.infoText}>
              Proper classification ensures accurate premium calculation and coverage.
            </Text>
          </View>
        </View>

        {/* Commercial Category */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Commercial Category *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.commercialCategory && styles.inputError]}
            onPress={() => toggleDropdown('commercialCategory')}
          >
            <Text style={[styles.dropdownText, !formData.commercialCategory && styles.placeholderText]}>
              {COMMERCIAL_CATEGORIES.find(cat => cat.id === formData.commercialCategory)?.name || 'Select category'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray} />
          </TouchableOpacity>
          {errors.commercialCategory && <Text style={styles.errorText}>{errors.commercialCategory}</Text>}
          
          {showDropdown === 'commercialCategory' && (
            <View style={styles.dropdownOptions}>
              {COMMERCIAL_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    updateField('commercialCategory', category.id);
                    updateField('commercialSubCategory', ''); // Reset subcategory
                    setShowDropdown('');
                  }}
                >
                  <View>
                    <Text style={styles.dropdownOptionText}>{category.name}</Text>
                    <Text style={styles.dropdownOptionDescription}>{category.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Commercial Sub-Category */}
        {formData.commercialCategory && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Sub-Category *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.commercialSubCategory && styles.inputError]}
              onPress={() => toggleDropdown('commercialSubCategory')}
            >
              <Text style={[styles.dropdownText, !formData.commercialSubCategory && styles.placeholderText]}>
                {formData.commercialSubCategory || 'Select sub-category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.gray} />
            </TouchableOpacity>
            {errors.commercialSubCategory && <Text style={styles.errorText}>{errors.commercialSubCategory}</Text>}
            
            {showDropdown === 'commercialSubCategory' && (
              <View style={styles.dropdownOptions}>
                {getCurrentSubCategories().map((subCategory) => (
                  <TouchableOpacity
                    key={subCategory}
                    style={styles.dropdownOption}
                    onPress={() => {
                      updateField('commercialSubCategory', subCategory);
                      setShowDropdown('');
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{subCategory}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Vehicle Make */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehicle Make *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.vehicleMake && styles.inputError]}
            onPress={() => toggleDropdown('vehicleMake')}
          >
            <Text style={[styles.dropdownText, !formData.vehicleMake && styles.placeholderText]}>
              {formData.vehicleMake || 'Select make'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray} />
          </TouchableOpacity>
          {errors.vehicleMake && <Text style={styles.errorText}>{errors.vehicleMake}</Text>}
          
          {showDropdown === 'vehicleMake' && (
            <View style={styles.dropdownOptions}>
              <ScrollView style={{ maxHeight: 200 }}>
                {COMMERCIAL_MAKES.map((make) => (
                  <TouchableOpacity
                    key={make}
                    style={styles.dropdownOption}
                    onPress={() => {
                      updateField('vehicleMake', make);
                      setShowDropdown('');
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{make}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Vehicle Model */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehicle Model *</Text>
          <TextInput
            style={[styles.input, errors.vehicleModel && styles.inputError]}
            value={formData.vehicleModel || ''}
            onChangeText={(value) => updateField('vehicleModel', value)}
            placeholder="Enter vehicle model"
            autoCapitalize="words"
          />
          {errors.vehicleModel && <Text style={styles.errorText}>{errors.vehicleModel}</Text>}
        </View>

        {/* Year of Manufacture */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Year of Manufacture *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.vehicleYear && styles.inputError]}
            onPress={() => toggleDropdown('vehicleYear')}
          >
            <Text style={[styles.dropdownText, !formData.vehicleYear && styles.placeholderText]}>
              {formData.vehicleYear || 'Select year'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray} />
          </TouchableOpacity>
          {errors.vehicleYear && <Text style={styles.errorText}>{errors.vehicleYear}</Text>}
          
          {showDropdown === 'vehicleYear' && (
            <View style={styles.dropdownOptions}>
              <ScrollView style={{ maxHeight: 200 }}>
                {YEARS.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={styles.dropdownOption}
                    onPress={() => {
                      updateField('vehicleYear', year);
                      setShowDropdown('');
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Registration Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Registration Number *</Text>
          <TextInput
            style={[styles.input, errors.registrationNumber && styles.inputError]}
            value={formData.registrationNumber || ''}
            onChangeText={(value) => updateField('registrationNumber', value.toUpperCase())}
            placeholder="e.g., KBA 123A"
            autoCapitalize="characters"
          />
          {errors.registrationNumber && <Text style={styles.errorText}>{errors.registrationNumber}</Text>}
        </View>

        {/* Engine Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Engine Number</Text>
          <TextInput
            style={styles.input}
            value={formData.engineNumber || ''}
            onChangeText={(value) => updateField('engineNumber', value.toUpperCase())}
            placeholder="Engine number (optional)"
            autoCapitalize="characters"
          />
        </View>

        {/* Chassis Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Chassis Number</Text>
          <TextInput
            style={styles.input}
            value={formData.chassisNumber || ''}
            onChangeText={(value) => updateField('chassisNumber', value.toUpperCase())}
            placeholder="Chassis number (optional)"
            autoCapitalize="characters"
          />
        </View>

        {/* Gross Vehicle Weight (GVW) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Gross Vehicle Weight (GVW) in Kg *</Text>
          <TextInput
            style={[styles.input, errors.grossWeight && styles.inputError]}
            value={formData.grossWeight || ''}
            onChangeText={(value) => updateField('grossWeight', value)}
            placeholder="e.g., 3500"
            keyboardType="numeric"
          />
          {errors.grossWeight && <Text style={styles.errorText}>{errors.grossWeight}</Text>}
          <Text style={styles.helperText}>Maximum laden weight including cargo</Text>
        </View>

        {/* Carrying Capacity */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Carrying Capacity (Kg) *</Text>
          <TextInput
            style={[styles.input, errors.carryingCapacity && styles.inputError]}
            value={formData.carryingCapacity || ''}
            onChangeText={(value) => updateField('carryingCapacity', value)}
            placeholder="e.g., 1500"
            keyboardType="numeric"
          />
          {errors.carryingCapacity && <Text style={styles.errorText}>{errors.carryingCapacity}</Text>}
          <Text style={styles.helperText}>Maximum cargo weight capacity</Text>
        </View>

        {/* Usage Pattern */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Primary Usage *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.usagePattern && styles.inputError]}
            onPress={() => toggleDropdown('usagePattern')}
          >
            <Text style={[styles.dropdownText, !formData.usagePattern && styles.placeholderText]}>
              {formData.usagePattern || 'Select usage pattern'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray} />
          </TouchableOpacity>
          {errors.usagePattern && <Text style={styles.errorText}>{errors.usagePattern}</Text>}
          
          {showDropdown === 'usagePattern' && (
            <View style={styles.dropdownOptions}>
              {USAGE_PATTERNS.map((pattern) => (
                <TouchableOpacity
                  key={pattern}
                  style={styles.dropdownOption}
                  onPress={() => {
                    updateField('usagePattern', pattern);
                    setShowDropdown('');
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{pattern}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Annual Mileage */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Estimated Annual Mileage (Km) *</Text>
          <TextInput
            style={[styles.input, errors.annualMileage && styles.inputError]}
            value={formData.annualMileage || ''}
            onChangeText={(value) => updateField('annualMileage', value)}
            placeholder="e.g., 50000"
            keyboardType="numeric"
          />
          {errors.annualMileage && <Text style={styles.errorText}>{errors.annualMileage}</Text>}
          <Text style={styles.helperText}>Estimated kilometers driven per year</Text>
        </View>

        {/* Goods in Transit Value (for comprehensive) */}
        {isComprehensive && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Maximum Goods in Transit Value (KSh)</Text>
            <TextInput
              style={styles.input}
              value={formData.goodsInTransitValue || ''}
              onChangeText={(value) => {
                const numericValue = value.replace(/[^0-9]/g, '');
                const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                updateField('goodsInTransitValue', formattedValue);
              }}
              placeholder="e.g., 500,000"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>Maximum value of goods carried at any time</Text>
          </View>
        )}

        {/* Additional Vehicle Information */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Additional Vehicle Information</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.additionalInfo || ''}
            onChangeText={(value) => updateField('additionalInfo', value)}
            placeholder="Any special features, modifications, or additional information about the vehicle"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.gray} />
          <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.nextButton]} 
          onPress={() => {
            if (validateStep()) {
              onNext();
            }
          }}
        >
          <Text style={[styles.buttonText, styles.nextButtonText]}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    padding: Spacing.md,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.gray,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.gray,
    marginTop: Spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  dropdownText: {
    ...Typography.body,
    color: Colors.dark,
  },
  placeholderText: {
    color: Colors.gray,
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    backgroundColor: Colors.white,
    marginTop: Spacing.xs,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  dropdownOptionText: {
    ...Typography.body,
    color: Colors.dark,
  },
  dropdownOptionDescription: {
    ...Typography.caption,
    color: Colors.gray,
    marginTop: 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    minWidth: 100,
  },
  backButton: {
    backgroundColor: Colors.lightGray,
    borderWidth: 1,
    borderColor: Colors.gray,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
    marginHorizontal: Spacing.xs,
  },
  backButtonText: {
    color: Colors.gray,
  },
  nextButtonText: {
    color: Colors.white,
  },
});

export default CommercialVehicleDetailsStep;
