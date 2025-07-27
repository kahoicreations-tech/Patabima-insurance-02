import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SpecialInsurerSelectionStep = ({ 
  formData, 
  onDataChange, 
  onNext, 
  onPrevious,
  currentStep,
  totalSteps 
}) => {
  const [selectedInsurer, setSelectedInsurer] = useState(formData?.selectedInsurer || null);
  const [premiumCalculation, setPremiumCalculation] = useState(formData?.premiumCalculation || null);

  const specialEquipmentInsurers = [
    {
      id: 'kenya_re_special',
      name: 'Kenya Re Special Equipment Division',
      logo: '🏢',
      rating: 4.7,
      specialization: 'Heavy Construction & Mining Equipment',
      basePremium: formData?.estimatedPremium || 0,
      multiplier: 1.0,
      features: [
        'Specialized heavy equipment coverage',
        'Mining operations expertise',
        'Equipment breakdown specialist',
        '24/7 emergency response',
        'Nationwide coverage',
        'Equipment financing support'
      ],
      claimsRating: 4.8,
      customerService: 4.6,
      processingTime: '24-48 hours',
      additionalBenefits: [
        'Free equipment inspection',
        'Operator training discounts',
        'Preventive maintenance support'
      ]
    },
    {
      id: 'cic_industrial',
      name: 'CIC Industrial & Special Risks',
      logo: '🛡️',
      rating: 4.5,
      specialization: 'Industrial Equipment & Special Vehicles',
      basePremium: formData?.estimatedPremium || 0,
      multiplier: 0.95,
      features: [
        'Industrial equipment specialists',
        'Agricultural machinery coverage',
        'Mobile equipment protection',
        'Comprehensive liability coverage',
        'Multi-location coverage',
        'Equipment replacement guarantee'
      ],
      claimsRating: 4.5,
      customerService: 4.7,
      processingTime: '2-3 business days',
      additionalBenefits: [
        'Equipment tracking support',
        'Safety training programs',
        'Priority claim processing'
      ]
    },
    {
      id: 'jubilee_special',
      name: 'Jubilee Special Equipment Insurance',
      logo: '⭐',
      rating: 4.4,
      specialization: 'Construction & Agricultural Equipment',
      basePremium: formData?.estimatedPremium || 0,
      multiplier: 1.05,
      features: [
        'Construction equipment focus',
        'Agricultural machinery expertise',
        'Equipment hire coverage',
        'Theft and vandalism protection',
        'Business interruption coverage',
        'Equipment transportation cover'
      ],
      claimsRating: 4.3,
      customerService: 4.5,
      processingTime: '3-5 business days',
      additionalBenefits: [
        'Equipment valuation services',
        'Loss prevention consulting',
        'Emergency equipment hire'
      ]
    },
    {
      id: 'aig_specialty',
      name: 'AIG Specialty Equipment Solutions',
      logo: '🌟',
      rating: 4.6,
      specialization: 'High-Value Specialized Equipment',
      basePremium: formData?.estimatedPremium || 0,
      multiplier: 1.15,
      features: [
        'High-value equipment specialists',
        'International coverage options',
        'Advanced risk management',
        'Equipment modification coverage',
        'Environmental liability',
        'Product liability coverage'
      ],
      claimsRating: 4.7,
      customerService: 4.4,
      processingTime: '1-2 business days',
      additionalBenefits: [
        'Global coverage network',
        'Risk engineering services',
        'Custom policy solutions'
      ]
    },
    {
      id: 'britam_equipment',
      name: 'Britam Equipment & Plant Insurance',
      logo: '🔧',
      rating: 4.3,
      specialization: 'Plant & Equipment Insurance',
      basePremium: formData?.estimatedPremium || 0,
      multiplier: 0.92,
      features: [
        'Plant and equipment specialists',
        'Contractor equipment coverage',
        'Equipment leasing support',
        'Breakdown and repair coverage',
        'Third party liability',
        'Equipment financing insurance'
      ],
      claimsRating: 4.2,
      customerService: 4.4,
      processingTime: '2-4 business days',
      additionalBenefits: [
        'Equipment leasing partnerships',
        'Maintenance scheduling support',
        'Operator certification programs'
      ]
    }
  ];

  const calculateAdjustedPremium = (insurer) => {
    const basePremium = insurer.basePremium;
    return Math.round(basePremium * insurer.multiplier);
  };

  const handleInsurerSelect = (insurer) => {
    const adjustedPremium = calculateAdjustedPremium(insurer);
    const calculation = {
      basePremium: insurer.basePremium,
      multiplier: insurer.multiplier,
      finalPremium: adjustedPremium,
      breakdown: {
        baseAmount: insurer.basePremium,
        insurerAdjustment: Math.round((insurer.multiplier - 1) * insurer.basePremium),
        finalAmount: adjustedPremium
      }
    };

    setSelectedInsurer(insurer);
    setPremiumCalculation(calculation);
    
    const updatedData = {
      ...formData,
      selectedInsurer: insurer,
      premiumCalculation: calculation,
      finalPremium: adjustedPremium
    };
    
    onDataChange(updatedData);
  };

  const validateSelection = () => {
    if (!selectedInsurer) {
      Alert.alert(
        'No Insurer Selected',
        'Please select an insurance provider before proceeding.'
      );
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateSelection()) {
      onNext();
    }
  };

  const renderInsurerCard = (insurer) => {
    const isSelected = selectedInsurer?.id === insurer.id;
    const adjustedPremium = calculateAdjustedPremium(insurer);

    return (
      <TouchableOpacity
        key={insurer.id}
        style={[styles.insurerCard, isSelected && styles.selectedCard]}
        onPress={() => handleInsurerSelect(insurer)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.insurerInfo}>
            <Text style={styles.insurerLogo}>{insurer.logo}</Text>
            <View style={styles.insurerDetails}>
              <Text style={styles.insurerName}>{insurer.name}</Text>
              <Text style={styles.specialization}>{insurer.specialization}</Text>
              <View style={styles.ratingRow}>
                <View style={styles.rating}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{insurer.rating}</Text>
                </View>
                <Text style={styles.processingTime}>{insurer.processingTime}</Text>
              </View>
            </View>
          </View>
          <View style={styles.premiumContainer}>
            <Text style={styles.premiumLabel}>Annual Premium</Text>
            <Text style={styles.premiumAmount}>KES {adjustedPremium.toLocaleString()}</Text>
            {insurer.multiplier !== 1.0 && (
              <Text style={[
                styles.premiumChange,
                insurer.multiplier < 1.0 ? styles.premiumDecrease : styles.premiumIncrease
              ]}>
                {insurer.multiplier < 1.0 ? '↓' : '↑'} {Math.abs((insurer.multiplier - 1) * 100).toFixed(0)}%
              </Text>
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Coverage Features</Text>
            <View style={styles.featuresList}>
              {insurer.features.slice(0, 3).map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              {insurer.features.length > 3 && (
                <Text style={styles.moreFeatures}>
                  +{insurer.features.length - 3} more features
                </Text>
              )}
            </View>
          </View>

          <View style={styles.ratingsSection}>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>Claims</Text>
              <View style={styles.ratingStars}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingValue}>{insurer.claimsRating}</Text>
              </View>
            </View>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>Service</Text>
              <View style={styles.ratingStars}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingValue}>{insurer.customerService}</Text>
              </View>
            </View>
          </View>

          {insurer.additionalBenefits && (
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Additional Benefits</Text>
              <View style={styles.benefitsList}>
                {insurer.additionalBenefits.map((benefit, index) => (
                  <Text key={index} style={styles.benefitItem}>• {benefit}</Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.selectedText}>Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.stepIndicator}>Step {currentStep} of {totalSteps}</Text>
        <Text style={styles.title}>Select Insurance Provider</Text>
        <Text style={styles.subtitle}>
          Choose from specialized equipment insurance providers
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#D5222B" />
            <Text style={styles.infoText}>
              These insurers specialize in heavy equipment and special vehicle coverage.
              Premium adjustments reflect their expertise and market positioning.
            </Text>
          </View>
        </View>

        <View style={styles.insurersSection}>
          <Text style={styles.sectionTitle}>Available Insurance Providers</Text>
          {specialEquipmentInsurers.map(renderInsurerCard)}
        </View>

        {premiumCalculation && (
          <View style={styles.premiumBreakdown}>
            <Text style={styles.breakdownTitle}>Premium Calculation</Text>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Base Premium:</Text>
                <Text style={styles.breakdownValue}>
                  KES {premiumCalculation.breakdown.baseAmount.toLocaleString()}
                </Text>
              </View>
              {premiumCalculation.breakdown.insurerAdjustment !== 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Insurer Adjustment:</Text>
                  <Text style={[
                    styles.breakdownValue,
                    premiumCalculation.breakdown.insurerAdjustment < 0 ? styles.discount : styles.surcharge
                  ]}>
                    {premiumCalculation.breakdown.insurerAdjustment >= 0 ? '+' : ''}
                    KES {premiumCalculation.breakdown.insurerAdjustment.toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={[styles.breakdownRow, styles.finalRow]}>
                <Text style={styles.finalLabel}>Final Premium:</Text>
                <Text style={styles.finalValue}>
                  KES {premiumCalculation.breakdown.finalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}
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
  content: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  insurersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  insurerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#D5222B',
    backgroundColor: '#FFF8F8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  insurerInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 15,
  },
  insurerLogo: {
    fontSize: 24,
    marginRight: 12,
  },
  insurerDetails: {
    flex: 1,
  },
  insurerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  processingTime: {
    fontSize: 11,
    color: '#666',
  },
  premiumContainer: {
    alignItems: 'flex-end',
  },
  premiumLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  premiumAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D5222B',
  },
  premiumChange: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  premiumDecrease: {
    color: '#4CAF50',
  },
  premiumIncrease: {
    color: '#FF5722',
  },
  cardContent: {
    gap: 12,
  },
  featuresSection: {},
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featuresList: {
    gap: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 6,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  ratingsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  ratingItem: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 12,
    color: '#333',
    marginLeft: 2,
  },
  benefitsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  benefitsList: {
    gap: 2,
  },
  benefitItem: {
    fontSize: 11,
    color: '#555',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#D5222B',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  premiumBreakdown: {
    marginTop: 10,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#D5222B',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  discount: {
    color: '#4CAF50',
  },
  surcharge: {
    color: '#FF5722',
  },
  finalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  finalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D5222B',
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

export default SpecialInsurerSelectionStep;
