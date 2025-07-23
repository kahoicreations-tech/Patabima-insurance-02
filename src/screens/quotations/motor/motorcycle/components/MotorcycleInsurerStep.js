/**
 * MotorcycleInsurerStep - Motorcycle-specific insurer selection component
 * Handles insurer selection with motorcycle insurance specialization
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

// Motorcycle Insurance Providers
const MOTORCYCLE_INSURERS = [
  {
    id: 'jubilee',
    name: 'Jubilee Insurance',
    logoIcon: 'shield-checkmark-outline',
    rating: 4.3,
    features: ['Third Party', 'Comprehensive', '24/7 Claims'],
    motorcycleSpecialty: 'Comprehensive motorcycle coverage with competitive rates',
    premiumRange: 'Medium',
    claimsTime: '3-5 days',
    networkGarages: 150,
    onlineServices: true,
    benefits: [
      'Nationwide coverage',
      'Quick claims processing',
      'Motorcycle rescue service',
      'Authorized dealer network'
    ]
  },
  {
    id: 'aig',
    name: 'AIG Insurance',
    logoIcon: 'diamond-outline',
    rating: 4.5,
    features: ['Premium Coverage', 'International Support', 'Extended Coverage'],
    motorcycleSpecialty: 'Premium motorcycle insurance with international coverage',
    premiumRange: 'High',
    claimsTime: '2-4 days',
    networkGarages: 120,
    onlineServices: true,
    benefits: [
      'International coverage',
      'Premium customer service',
      'Advanced motorcycle protection',
      'Accident forgiveness'
    ]
  },
  {
    id: 'madison',
    name: 'Madison Insurance',
    logoIcon: 'business-outline',
    rating: 4.2,
    features: ['Affordable Rates', 'Fast Claims', 'Local Support'],
    motorcycleSpecialty: 'Budget-friendly motorcycle insurance with local expertise',
    premiumRange: 'Low-Medium',
    claimsTime: '4-6 days',
    networkGarages: 100,
    onlineServices: true,
    benefits: [
      'Competitive pricing',
      'Local service centers',
      'Flexible payment plans',
      'Quick policy issuance'
    ]
  },
  {
    id: 'britam',
    name: 'Britam Insurance',
    logoIcon: 'globe-outline',
    rating: 4.4,
    features: ['Comprehensive', 'Digital Claims', 'Wide Network'],
    motorcycleSpecialty: 'Digital-first motorcycle insurance with extensive network',
    premiumRange: 'Medium-High',
    claimsTime: '2-5 days',
    networkGarages: 180,
    onlineServices: true,
    benefits: [
      'Digital claims platform',
      'Extensive garage network',
      'Motorcycle safety programs',
      'Emergency roadside assistance'
    ]
  },
  {
    id: 'cic',
    name: 'CIC Insurance',
    logoIcon: 'finger-print-outline',
    rating: 4.1,
    features: ['Regional Leader', 'Personal Service', 'Flexible Terms'],
    motorcycleSpecialty: 'Personalized motorcycle insurance with flexible terms',
    premiumRange: 'Medium',
    claimsTime: '3-7 days',
    networkGarages: 90,
    onlineServices: false,
    benefits: [
      'Personalized service',
      'Flexible policy terms',
      'Regional expertise',
      'Competitive motorcycle rates'
    ]
  },
  {
    id: 'aar',
    name: 'AAR Insurance',
    logoIcon: 'medical-outline',
    rating: 4.0,
    features: ['Healthcare Focus', 'Comprehensive', 'Medical Benefits'],
    motorcycleSpecialty: 'Motorcycle insurance with medical coverage emphasis',
    premiumRange: 'Medium-High',
    claimsTime: '4-6 days',
    networkGarages: 110,
    onlineServices: true,
    benefits: [
      'Medical coverage focus',
      'Healthcare network access',
      'Motorcycle medical benefits',
      'Comprehensive protection'
    ]
  }
];

const MotorcycleInsurerStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  preSelectedInsurer = null,
  filterByPremiumRange = null,
  showComparison = true
}) => {
  const [selectedInsurer, setSelectedInsurer] = useState(
    preSelectedInsurer || formData.selectedInsurer || null
  );

  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  const handleInsurerSelect = (insurer) => {
    setSelectedInsurer(insurer);
    updateFormData({ 
      selectedInsurer: insurer,
      insurerName: insurer.name,
      insurerId: insurer.id 
    });
  };

  // Filter insurers based on criteria
  const getFilteredInsurers = () => {
    let filtered = MOTORCYCLE_INSURERS;
    
    if (filterByPremiumRange) {
      filtered = filtered.filter(insurer => 
        insurer.premiumRange.toLowerCase().includes(filterByPremiumRange.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => b.rating - a.rating);
  };

  const filteredInsurers = getFilteredInsurers();

  // Get premium range color
  const getPremiumRangeColor = (range) => {
    switch (range.toLowerCase()) {
      case 'low':
      case 'low-medium':
        return Colors.success;
      case 'medium':
        return Colors.warning;
      case 'medium-high':
      case 'high':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const renderInsurerCard = (insurer) => {
    const isSelected = selectedInsurer?.id === insurer.id;
    
    return (
      <TouchableOpacity
        key={insurer.id}
        style={[
          styles.insurerCard,
          isSelected && styles.selectedInsurerCard
        ]}
        onPress={() => handleInsurerSelect(insurer)}
      >
        {/* Header with logo and basic info */}
        <View style={styles.insurerHeader}>
          <View style={styles.logoContainer}>
            <Ionicons name={insurer.logoIcon} size={32} color={Colors.primary} />
          </View>
          <View style={styles.insurerBasicInfo}>
            <Text style={styles.insurerName}>{insurer.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.rating}>{insurer.rating}</Text>
              <Text style={styles.ratingText}>Rating</Text>
            </View>
            <View style={styles.premiumRangeContainer}>
              <Text style={[
                styles.premiumRange, 
                { color: getPremiumRangeColor(insurer.premiumRange) }
              ]}>
                {insurer.premiumRange} Premiums
              </Text>
            </View>
          </View>
          <View style={styles.selectionIndicator}>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            ) : (
              <Ionicons name="radio-button-off" size={24} color={Colors.border} />
            )}
          </View>
        </View>

        {/* Motorcycle specialty */}
        <View style={styles.specialtyContainer}>
          <Ionicons name="bicycle" size={16} color={Colors.primary} />
          <Text style={styles.specialtyText}>{insurer.motorcycleSpecialty}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {insurer.features.map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Quick stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.statText}>{insurer.claimsTime}</Text>
            <Text style={styles.statLabel}>Claims</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.statText}>{insurer.networkGarages}</Text>
            <Text style={styles.statLabel}>Garages</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons 
              name={insurer.onlineServices ? "globe-outline" : "close-circle-outline"} 
              size={16} 
              color={insurer.onlineServices ? Colors.success : Colors.error} 
            />
            <Text style={[
              styles.statText,
              { color: insurer.onlineServices ? Colors.success : Colors.error }
            ]}>
              {insurer.onlineServices ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
        </View>

        {/* Benefits (shown when selected) */}
        {isSelected && (
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Key Benefits:</Text>
            {insurer.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Select Insurance Provider</Text>
          <Text style={styles.stepSubtitle}>
            Choose from motorcycle insurance specialists
          </Text>
        </>
      )}

      {/* Insurance providers list */}
      <ScrollView style={styles.insurersContainer} showsVerticalScrollIndicator={false}>
        {filteredInsurers.map(renderInsurerCard)}
      </ScrollView>

      {/* Selected insurer summary */}
      {selectedInsurer && (
        <View style={styles.selectedSummary}>
          <View style={styles.selectedHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.selectedTitle}>Selected Provider</Text>
          </View>
          <Text style={styles.selectedInsurerName}>{selectedInsurer.name}</Text>
          <Text style={styles.selectedDetails}>
            {selectedInsurer.motorcycleSpecialty}
          </Text>
        </View>
      )}

      {/* Comparison note */}
      {showComparison && (
        <View style={styles.comparisonNote}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.comparisonText}>
            Compare features, ratings, and premiums to find the best motorcycle insurance for your needs. 
            All providers offer third-party coverage as required by law.
          </Text>
        </View>
      )}

      {/* Motorcycle insurance info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Motorcycle Insurance Essentials:</Text>
        <View style={styles.infoItem}>
          <Ionicons name="shield" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>Third-party coverage is mandatory by law</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="car-sport" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>Comprehensive covers theft and damage</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="medical" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>Personal accident coverage recommended</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="call" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>24/7 roadside assistance available</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_700Bold',
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: 'Poppins_400Regular',
  },
  insurersContainer: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  insurerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedInsurerCard: {
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}05`,
  },
  insurerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  insurerBasicInfo: {
    flex: 1,
  },
  insurerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  rating: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  ratingText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  premiumRangeContainer: {
    alignSelf: 'flex-start',
  },
  premiumRange: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: 'Poppins_500Medium',
  },
  selectionIndicator: {
    marginLeft: Spacing.sm,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  specialtyText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  featureTag: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  featureText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontFamily: 'Poppins_400Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    fontFamily: 'Poppins_500Medium',
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  benefitsContainer: {
    backgroundColor: `${Colors.success}10`,
    padding: Spacing.sm,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  benefitsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_500Medium',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  benefitText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  selectedSummary: {
    backgroundColor: `${Colors.success}10`,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.success}30`,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  selectedTitle: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.success,
    fontFamily: 'Poppins_500Medium',
  },
  selectedInsurerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  selectedDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  comparisonNote: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}10`,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  comparisonText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  infoContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_500Medium',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  infoText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
});

export default MotorcycleInsurerStep;
