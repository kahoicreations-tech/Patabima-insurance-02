/**
 * PSV Insurer Selection Step Component
 * Handles insurer selection for PSV insurance quotation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

// PSV Insurance companies
const PSV_INSURERS = [
  { 
    id: 'jubilee', 
    name: 'Jubilee Insurance', 
    rating: 4.5,
    specialties: ['PSV', 'Commercial'],
    processingTime: '24 hours'
  },
  { 
    id: 'britam', 
    name: 'Britam Insurance', 
    rating: 4.3,
    specialties: ['PSV', 'Fleet'],
    processingTime: '48 hours'
  },
  { 
    id: 'apa', 
    name: 'APA Insurance', 
    rating: 4.2,
    specialties: ['Commercial', 'PSV'],
    processingTime: '24 hours'
  },
  { 
    id: 'uap', 
    name: 'UAP Insurance', 
    rating: 4.1,
    specialties: ['PSV', 'Transport'],
    processingTime: '72 hours'
  },
  { 
    id: 'madison', 
    name: 'Madison Insurance', 
    rating: 4.0,
    specialties: ['PSV', 'General'],
    processingTime: '48 hours'
  }
];

const PSVInsurerSelectionStep = ({ 
  formData, 
  onUpdateFormData, 
  coverageType = 'third_party',
  premium = 15000 
}) => {
  const [selectedInsurer, setSelectedInsurer] = useState(formData.selectedInsurer || null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedInsurer) {
      onUpdateFormData({ selectedInsurer });
    }
  }, [selectedInsurer]);

  const handleInsurerSelect = (insurerId) => {
    setSelectedInsurer(insurerId);
    setIsCalculating(true);
    
    // Clear any existing errors
    if (errors.selectedInsurer) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.selectedInsurer;
        return updated;
      });
    }

    // Simulate premium calculation
    setTimeout(() => {
      setIsCalculating(false);
    }, 1000);
  };

  const renderInsurerCard = (insurer) => {
    const isSelected = selectedInsurer === insurer.id;
    
    return (
      <TouchableOpacity
        key={insurer.id}
        style={[
          styles.insurerCard,
          isSelected && styles.selectedInsurer
        ]}
        onPress={() => handleInsurerSelect(insurer.id)}
      >
        <View style={styles.insurerHeader}>
          <View style={styles.insurerInfo}>
            <Text style={styles.insurerName}>{insurer.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{insurer.rating}/5</Text>
            </View>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          )}
        </View>
        
        <View style={styles.insurerDetails}>
          <Text style={styles.specialtiesText}>
            Specialties: {insurer.specialties.join(', ')}
          </Text>
          <Text style={styles.processingText}>
            Processing: {insurer.processingTime}
          </Text>
        </View>
        
        {isSelected && (
          <View style={styles.premiumContainer}>
            {isCalculating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.premiumText}>
                Premium: KES {premium.toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Insurer</Text>
        <Text style={styles.stepDescription}>
          Choose your preferred insurance provider for PSV {coverageType.replace('_', ' ')} coverage.
        </Text>
        
        <View style={styles.coverageInfo}>
          <Text style={styles.coverageTitle}>Coverage Type</Text>
          <Text style={styles.coverageDescription}>
            {coverageType === 'third_party' 
              ? 'Third Party Liability - Covers damage to third party property and injury'
              : 'Comprehensive Coverage - Full protection including own damage'
            }
          </Text>
        </View>

        <View style={styles.insurersContainer}>
          {PSV_INSURERS.map(renderInsurerCard)}
        </View>

        {errors.selectedInsurer && (
          <Text style={styles.errorText}>{errors.selectedInsurer}</Text>
        )}
      </View>
    </ScrollView>
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
    ...Typography.heading2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  coverageInfo: {
    backgroundColor: Colors.lightBlue,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  coverageTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  coverageDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  insurersContainer: {
    gap: Spacing.md,
  },
  insurerCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedInsurer: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  insurerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  insurerInfo: {
    flex: 1,
  },
  insurerName: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  insurerDetails: {
    marginBottom: Spacing.sm,
  },
  specialtiesText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  processingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  premiumContainer: {
    backgroundColor: Colors.lightGreen,
    padding: Spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  premiumText: {
    ...Typography.bodyBold,
    color: Colors.success,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
});

export default PSVInsurerSelectionStep;
