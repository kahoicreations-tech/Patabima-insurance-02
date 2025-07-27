/**
 * Commercial Insurer Selection Step Component
 * Handles insurer selection for commercial vehicle insurance
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

const CommercialInsurerSelectionStep = ({ 
  formData,
  updateFormData,
  onNext,
  onBack,
  premiumResult,
  underwriters = [],
  coverageType = 'third_party',
  isCalculating = false 
}) => {
  const [selectedInsurer, setSelectedInsurer] = useState(formData.selectedInsurer || null);
  
  // If no underwriters are provided, use these defaults
  const insurers = underwriters.length > 0 ? underwriters : [
    {
      id: 'jubilee',
      name: 'Jubilee Insurance',
      rating: 4.5,
      iconName: 'shield',
      iconColor: '#FF0000',
      features: [
        'Comprehensive commercial vehicle coverage',
        'Goods in transit protection',
        'Nationwide network',
        '24/7 claims support',
        'Fleet management services'
      ],
      strengths: ['Strong commercial focus', 'Quick claims processing', 'Fleet discounts'],
      commercialSpecialty: true
    },
    {
      id: 'britam',
      name: 'Britam Insurance',
      rating: 4.3,
      iconName: 'shield-checkmark',
      iconColor: '#0066FF',
      features: [
        'Commercial motor insurance',
        'Business interruption cover',
        'Professional indemnity add-on',
        'Digital claims platform',
        'Risk management support'
      ],
      strengths: ['Digital innovation', 'Business insurance expertise', 'Competitive rates'],
      commercialSpecialty: true
    },
    {
      id: 'apa',
      name: 'APA Insurance',
      rating: 4.2,
      iconName: 'shield-outline',
      iconColor: '#00AA00',
      features: [
        'Commercial vehicle protection',
        'Carrier\'s liability coverage',
        'Third party protection',
        'Flexible payment terms',
        'Business advisory services'
      ],
      strengths: ['Flexible terms', 'Business advisory', 'Local expertise'],
      commercialSpecialty: true
    }
  ];

  useEffect(() => {
    if (selectedInsurer) {
      updateFormData({ selectedInsurer });
    }
  }, [selectedInsurer]);

  const handleInsurerSelect = (insurer) => {
    setSelectedInsurer(insurer);
  };

  const renderInsurerCard = (insurer) => (
    <TouchableOpacity
      key={insurer.id}
      style={[
        styles.insurerCard,
        selectedInsurer?.id === insurer.id && styles.insurerCardSelected
      ]}
      onPress={() => handleInsurerSelect(insurer)}
    >
      <View style={styles.insurerHeader}>
        <View style={styles.insurerInfo}>
          {/* Insurer Icon */}
          <View style={styles.insurerIconContainer}>
            <Ionicons 
              name={insurer.iconName || 'shield'} 
              size={24} 
              color={insurer.iconColor || Colors.primary} 
            />
          </View>
          
          <Text style={styles.insurerName}>{insurer.name}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[...Array(5)].map((_, index) => (
                <Ionicons
                  key={index}
                  name={index < Math.floor(insurer.rating || 4.2) ? 'star' : 'star-outline'}
                  size={12}
                  color={Colors.warning}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{insurer.rating || 4.2}/5</Text>
          </View>
          <View style={styles.specialtyBadge}>
            <Text style={styles.specialtyText}>Commercial Specialist</Text>
          </View>
        </View>
        <View style={[
          styles.radioButton,
          selectedInsurer?.id === insurer.id && styles.radioButtonSelected
        ]}>
          {selectedInsurer?.id === insurer.id && (
            <View style={styles.radioButtonInner} />
          )}
        </View>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>Key Features:</Text>
        {/* Default features if the insurer doesn't have any */}
        {(insurer.features || [
          'Commercial vehicle insurance',
          `${coverageType === 'comprehensive' ? 'Comprehensive' : 'Third party'} coverage`,
          'Business focused policies'
        ]).slice(0, 3).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.strengthsSection}>
        <Text style={styles.strengthsTitle}>Strengths:</Text>
        <View style={styles.strengthsContainer}>
          {/* Default strengths if the insurer doesn't have any */}
          {(insurer.strengths || [
            'Commercial expertise',
            'Competitive rates',
            'Fast claims'
          ]).map((strength, index) => (
            <View key={index} style={styles.strengthBadge}>
              <Text style={styles.strengthText}>{strength}</Text>
            </View>
          ))}
        </View>
      </View>

      {premiumResult && premiumResult.totalPremium > 0 && !isCalculating && (
        <View style={styles.premiumSection}>
          <Text style={styles.premiumLabel}>Estimated Premium:</Text>
          <Text style={styles.premiumValue}>KSh {premiumResult.totalPremium.toLocaleString()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Commercial Insurer</Text>
        <Text style={styles.stepDescription}>
          Choose your preferred insurance provider for commercial vehicle coverage.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="business" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Commercial Insurance Expertise</Text>
            <Text style={styles.infoText}>
              All listed insurers have specialized commercial vehicle departments and understand business needs.
            </Text>
          </View>
        </View>

        {isCalculating && (
          <View style={styles.calculatingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.calculatingText}>Calculating premiums...</Text>
          </View>
        )}

        <View style={styles.insurersContainer}>
          {insurers.map(renderInsurerCard)}
        </View>

        {selectedInsurer && (
          <View style={styles.selectedInsurerInfo}>
            <Text style={styles.selectedTitle}>Selected Insurer</Text>
            <View style={styles.selectedCard}>
              <Text style={styles.selectedName}>{selectedInsurer.name}</Text>
              <Text style={styles.selectedDescription}>
                {selectedInsurer.commercialSpecialty 
                  ? 'Specialized in commercial vehicle insurance with tailored business solutions.'
                  : 'Comprehensive motor insurance with reliable coverage options.'
                }
              </Text>
            </View>
          </View>
        )}

        <View style={styles.comparisonNote}>
          <Ionicons name="information-circle" size={20} color={Colors.info} />
          <Text style={styles.comparisonText}>
            Premiums may vary based on your specific commercial vehicle details, usage pattern, and claims history. 
            Final quotes will be provided after detailed assessment.
          </Text>
        </View>
        
        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBack}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              (!selectedInsurer) && styles.nextButtonDisabled
            ]} 
            onPress={selectedInsurer ? onNext : null}
            disabled={!selectedInsurer}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
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
  calculatingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  calculatingText: {
    ...Typography.body,
    color: Colors.gray,
    marginTop: Spacing.sm,
  },
  insurersContainer: {
    marginBottom: Spacing.lg,
  },
  insurerCard: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  insurerCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  insurerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  insurerInfo: {
    flex: 1,
  },
  insurerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  insurerName: {
    ...Typography.h4,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stars: {
    flexDirection: 'row',
    marginRight: Spacing.xs,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.gray,
  },
  specialtyBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  specialtyText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  featuresSection: {
    marginBottom: Spacing.sm,
  },
  featuresTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  featureText: {
    ...Typography.caption,
    color: Colors.dark,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  strengthsSection: {
    marginBottom: Spacing.sm,
  },
  strengthsTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  strengthsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  strengthBadge: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  strengthText: {
    ...Typography.caption,
    color: Colors.dark,
    fontSize: 10,
  },
  premiumSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  premiumLabel: {
    ...Typography.body,
    color: Colors.gray,
  },
  premiumValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectedInsurerInfo: {
    marginBottom: Spacing.lg,
  },
  selectedTitle: {
    ...Typography.h4,
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  selectedCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: Spacing.md,
  },
  selectedName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  selectedDescription: {
    ...Typography.caption,
    color: Colors.primary,
  },
  comparisonNote: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  comparisonText: {
    ...Typography.caption,
    color: Colors.info,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.primary,
  },
  nextButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  nextButtonText: {
    ...Typography.button,
    color: Colors.white,
  }
});

export default CommercialInsurerSelectionStep;
