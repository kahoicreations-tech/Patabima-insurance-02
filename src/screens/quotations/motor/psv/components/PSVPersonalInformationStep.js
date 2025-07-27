/**
 * PSV Personal Information Step Component
 * Handles owner/operator information for PSV insurance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

// Kenya counties for PSV operations
const KENYA_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
  'Kitale', 'Garissa', 'Kakamega', 'Meru', 'Nyeri', 'Machakos', 'Kericho',
  'Embu', 'Migori', 'Homa Bay', 'Voi', 'Nanyuki', 'Isiolo', 'Other'
];

// PSV operator types
const OPERATOR_TYPES = [
  'Individual Owner-Operator',
  'SACCO Member',
  'Transport Company',
  'Cooperative Society',
  'Fleet Owner',
  'Other'
];

const PSVPersonalInformationStep = ({ formData, onUpdateFormData, vehicleType = 'psv' }) => {
  const [errors, setErrors] = useState({});
  const [showDropdowns, setShowDropdowns] = useState({});

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

  const toggleDropdown = (dropdown) => {
    setShowDropdowns(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const validateFields = () => {
    const newErrors = {};
    
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(0|\+254|254)7\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Kenyan mobile number';
    }
    
    if (!formData.nationalId?.trim()) {
      newErrors.nationalId = 'National ID is required';
    } else if (!/^\d{7,8}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'Please enter a valid National ID number';
    }
    
    if (!formData.age?.trim()) {
      newErrors.age = 'Age is required';
    } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 80) {
      newErrors.age = 'Age must be between 18 and 80 years';
    }
    
    if (!formData.county?.trim()) {
      newErrors.county = 'County is required';
    }
    
    if (!formData.operatorType?.trim()) {
      newErrors.operatorType = 'Operator type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validateFields();
  }, [formData]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>PSV Owner Information</Text>
        <Text style={styles.subtitle}>
          Enter the details of the PSV owner or authorized operator
        </Text>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: Spacing.sm }]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                value={formData.firstName || ''}
                onChangeText={(value) => updateField('firstName', value)}
                placeholder="Enter first name"
                autoCapitalize="words"
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>
            
            <View style={[styles.inputContainer, { flex: 1, marginLeft: Spacing.sm }]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                value={formData.lastName || ''}
                onChangeText={(value) => updateField('lastName', value)}
                placeholder="Enter last name"
                autoCapitalize="words"
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email || ''}
              onChangeText={(value) => updateField('email', value.toLowerCase())}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              value={formData.phoneNumber || ''}
              onChangeText={(value) => updateField('phoneNumber', value)}
              placeholder="0712345678"
              keyboardType="phone-pad"
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: Spacing.sm }]}>
              <Text style={styles.label}>National ID *</Text>
              <TextInput
                style={[styles.input, errors.nationalId && styles.inputError]}
                value={formData.nationalId || ''}
                onChangeText={(value) => updateField('nationalId', value)}
                placeholder="12345678"
                keyboardType="numeric"
              />
              {errors.nationalId && (
                <Text style={styles.errorText}>{errors.nationalId}</Text>
              )}
            </View>
            
            <View style={[styles.inputContainer, { flex: 1, marginLeft: Spacing.sm }]}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={[styles.input, errors.age && styles.inputError]}
                value={formData.age || ''}
                onChangeText={(value) => updateField('age', value)}
                placeholder="30"
                keyboardType="numeric"
              />
              {errors.age && (
                <Text style={styles.errorText}>{errors.age}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Operation</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Primary County of Operation *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.county && styles.inputError]}
              onPress={() => toggleDropdown('county')}
            >
              <Text style={[
                styles.dropdownText,
                !formData.county && styles.placeholderText
              ]}>
                {formData.county || 'Select county'}
              </Text>
              <Ionicons 
                name={showDropdowns.county ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>
            {errors.county && (
              <Text style={styles.errorText}>{errors.county}</Text>
            )}
            
            {showDropdowns.county && (
              <View style={styles.dropdownOptions}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {KENYA_COUNTIES.map((county) => (
                    <TouchableOpacity
                      key={county}
                      style={styles.dropdownOption}
                      onPress={() => {
                        updateField('county', county);
                        toggleDropdown('county');
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{county}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Operator Type *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.operatorType && styles.inputError]}
              onPress={() => toggleDropdown('operatorType')}
            >
              <Text style={[
                styles.dropdownText,
                !formData.operatorType && styles.placeholderText
              ]}>
                {formData.operatorType || 'Select operator type'}
              </Text>
              <Ionicons 
                name={showDropdowns.operatorType ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>
            {errors.operatorType && (
              <Text style={styles.errorText}>{errors.operatorType}</Text>
            )}
            
            {showDropdowns.operatorType && (
              <View style={styles.dropdownOptions}>
                {OPERATOR_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.dropdownOption}
                    onPress={() => {
                      updateField('operatorType', type);
                      toggleDropdown('operatorType');
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Specific Location/Area</Text>
            <TextInput
              style={styles.input}
              value={formData.location || ''}
              onChangeText={(value) => updateField('location', value)}
              placeholder="e.g., Westlands, Eastleigh, CBD"
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* PSV License Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PSV License Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>PSV License Number</Text>
            <TextInput
              style={styles.input}
              value={formData.psvLicenseNumber || ''}
              onChangeText={(value) => updateField('psvLicenseNumber', value.toUpperCase())}
              placeholder="PSV12345"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>PSV Badge Number</Text>
            <TextInput
              style={styles.input}
              value={formData.psvBadgeNumber || ''}
              onChangeText={(value) => updateField('psvBadgeNumber', value.toUpperCase())}
              placeholder="Badge number (if applicable)"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: Spacing.sm }]}>
              <Text style={styles.label}>Gender</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => toggleDropdown('gender')}
              >
                <Text style={[
                  styles.dropdownText,
                  !formData.gender && styles.placeholderText
                ]}>
                  {formData.gender || 'Select gender'}
                </Text>
                <Ionicons 
                  name={showDropdowns.gender ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {showDropdowns.gender && (
                <View style={styles.dropdownOptions}>
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={styles.dropdownOption}
                      onPress={() => {
                        updateField('gender', gender);
                        toggleDropdown('gender');
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{gender}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            <View style={[styles.inputContainer, { flex: 1, marginLeft: Spacing.sm }]}>
              <Text style={styles.label}>Marital Status</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => toggleDropdown('maritalStatus')}
              >
                <Text style={[
                  styles.dropdownText,
                  !formData.maritalStatus && styles.placeholderText
                ]}>
                  {formData.maritalStatus || 'Select status'}
                </Text>
                <Ionicons 
                  name={showDropdowns.maritalStatus ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {showDropdowns.maritalStatus && (
                <View style={styles.dropdownOptions}>
                  {['Single', 'Married', 'Divorced', 'Widowed'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={styles.dropdownOption}
                      onPress={() => {
                        updateField('maritalStatus', status);
                        toggleDropdown('maritalStatus');
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Occupation</Text>
            <TextInput
              style={styles.input}
              value={formData.occupation || ''}
              onChangeText={(value) => updateField('occupation', value)}
              placeholder="e.g., Driver, Business Owner"
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoTitle}>Important Note</Text>
          </View>
          <Text style={styles.infoText}>
            All information provided must match your official documents. This information will be used for policy issuance and claims processing.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: 'Poppins_400Regular',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: 'Poppins_600SemiBold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_500Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    fontFamily: 'Poppins_400Regular',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontFamily: 'Poppins_400Regular',
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginTop: Spacing.xs,
    zIndex: 1000,
    elevation: 5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownOptionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  infoCard: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
});

export default PSVPersonalInformationStep;
