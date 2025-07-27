/**
 * TukTukInsurerSelectionStep - Insurance company selection for TukTuk coverage
 * Shows available insurers and their specific TukTuk products
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../../../../constants';

const TukTukInsurerSelectionStep = ({
  formData,
  onUpdateFormData,
  calculatedPremium,
  errors = {},
  showHeader = true,
}) => {
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  const tukTukInsurers = [
    {
      id: 'jubilee',
      name: 'Jubilee Insurance',
      logo: '🛡️',
      premium: calculatedPremium?.annual || 45000,
      features: [
        '24/7 Roadside Assistance',
        'Passenger Accident Cover',
        'Third Party Unlimited',
        'Quick Claims Processing'
      ],
      specialization: 'Commercial Vehicles',
      rating: 4.2
    },
    {
      id: 'aar',
      name: 'AAR Insurance',
      logo: '⚡',
      premium: (calculatedPremium?.annual || 45000) * 1.1,
      features: [
        'Medical Emergency Cover',
        'Vehicle Tracking Support',
        'Flexible Payment Terms',
        'Driver Training Programs'
      ],
      specialization: 'Three-Wheeler Expert',
      rating: 4.0
    },
    {
      id: 'britam',
      name: 'Britam Insurance',
      logo: '🏛️',
      premium: (calculatedPremium?.annual || 45000) * 0.95,
      features: [
        'Comprehensive Coverage',
        'Personal Accident Benefit',
        'Loss of Income Protection',
        'Emergency Medical Expenses'
      ],
      specialization: 'Public Transport',
      rating: 4.1
    },
    {
      id: 'cic',
      name: 'CIC Insurance',
      logo: '🔷',
      premium: (calculatedPremium?.annual || 45000) * 1.05,
      features: [
        'Windscreen Protection',
        'Theft & Hijacking Cover',
        'Fire & Natural Disasters',
        'Legal Liability Protection'
      ],
      specialization: 'Motor Insurance',
      rating: 3.9
    }
  ];

  const handleInsurerSelect = (insurer) => {
    updateFormData({
      selectedInsurer: insurer,
      selectedPremium: insurer.premium,
      coverageFeatures: insurer.features
    });
  };

  const formatPremium = (amount) => {
    return `KES ${Math.round(amount).toLocaleString()}`;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, i <= rating && styles.activeStar]}>
          ⭐
        </Text>
      );
    }
    return stars;
  };

  return (
    <ScrollView style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Select Insurance Provider</Text>
          <Text style={styles.subtitle}>
            Choose the best TukTuk insurance for your needs
          </Text>
        </View>
      )}

      <View style={styles.insurerList}>
        {tukTukInsurers.map((insurer) => (
          <TouchableOpacity
            key={insurer.id}
            style={[
              styles.insurerCard,
              formData.selectedInsurer?.id === insurer.id && styles.selectedCard
            ]}
            onPress={() => handleInsurerSelect(insurer)}
          >

            <View style={styles.insurerHeader}>
              <View style={styles.insurerInfo}>
                <Text style={styles.insurerLogo}>{insurer.logo}</Text>
                <View style={styles.insurerDetails}>
                  <Text style={styles.insurerName}>{insurer.name}</Text>
                  <Text style={styles.specialization}>{insurer.specialization}</Text>
                  <View style={styles.ratingContainer}>
                    <View style={styles.stars}>
                      {renderStars(insurer.rating)}
                    </View>
                    <Text style={styles.ratingText}>{insurer.rating}/5</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.premiumSection}>
                <Text style={styles.premiumAmount}>
                  {formatPremium(insurer.premium)}
                </Text>
                <Text style={styles.premiumPeriod}>per year</Text>
              </View>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Key Benefits:</Text>
              {insurer.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.selectionIndicator}>
              <View style={[
                styles.radioButton,
                formData.selectedInsurer?.id === insurer.id && styles.radioSelected
              ]} />
              <Text style={styles.selectText}>
                {formData.selectedInsurer?.id === insurer.id ? 'Selected' : 'Select this plan'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {errors.selectedInsurer && (
        <Text style={styles.errorText}>{errors.selectedInsurer}</Text>
      )}

      {formData.selectedInsurer && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Selected Plan Summary</Text>
          <Text style={styles.summaryInsurer}>
            {formData.selectedInsurer.name}
          </Text>
          <Text style={styles.summaryPremium}>
            Annual Premium: {formatPremium(formData.selectedInsurer.premium)}
          </Text>
          <Text style={styles.summaryNote}>
            Monthly installments available from {formatPremium(formData.selectedInsurer.premium / 12)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.large,
  },
  header: {
    marginBottom: Spacing.large,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.bold,
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    lineHeight: 24,
  },
  insurerList: {
    gap: Spacing.medium,
  },
  insurerCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.medium,
    backgroundColor: Colors.white,
    position: 'relative',
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  insurerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.medium,
  },
  insurerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  insurerLogo: {
    fontSize: 40,
    marginRight: Spacing.medium,
  },
  insurerDetails: {
    flex: 1,
  },
  insurerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    marginBottom: Spacing.small,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 12,
    color: Colors.border,
  },
  activeStar: {
    color: Colors.warning,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Typography.regular,
  },
  premiumSection: {
    alignItems: 'flex-end',
  },
  premiumAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Typography.bold,
  },
  premiumPeriod: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Typography.regular,
  },
  featuresSection: {
    marginBottom: Spacing.medium,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
    marginBottom: Spacing.small,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureBullet: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '700',
    marginRight: Spacing.small,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Typography.regular,
    flex: 1,
  },
  selectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  selectText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Typography.regular,
  },
  summaryCard: {
    backgroundColor: Colors.successLight,
    padding: Spacing.large,
    borderRadius: 8,
    marginTop: Spacing.large,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
    marginBottom: Spacing.small,
  },
  summaryInsurer: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  summaryPremium: {
    fontSize: 16,
    color: Colors.success,
    fontFamily: Typography.semiBold,
    marginBottom: 4,
  },
  summaryNote: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontFamily: Typography.regular,
    textAlign: 'center',
    marginTop: Spacing.medium,
  },
});

export default TukTukInsurerSelectionStep;
