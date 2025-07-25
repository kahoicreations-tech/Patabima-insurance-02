/**
 * PSVInsurerStep - PSV-specific insurer selection component
 * Handles insurer selection with PSV insurance specialization
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

// PSV Insurance Providers
const PSV_INSURERS = [
  {
    id: 'jubilee',
    name: 'Jubilee Insurance',
    logoIcon: 'shield-checkmark-outline',
    rating: 4.4,
    features: ['PSV Third Party', 'Comprehensive', 'Passenger Liability'],
    psvSpecialty: 'Leading PSV insurance with comprehensive passenger coverage',
    premiumRange: 'Medium',
    claimsTime: '3-5 days',
    networkGarages: 200,
    onlineServices: true,
    benefits: [
      'Nationwide PSV coverage',
      'Passenger liability up to KES 2M',
      'Emergency roadside assistance',
      'SACCO partnership programs',
      'Digital claims processing'
    ]
  },
  {
    id: 'britam',
    name: 'Britam Insurance',
    logoIcon: 'globe-outline',
    rating: 4.3,
    features: ['Comprehensive PSV', 'Digital Platform', 'Fleet Management'],
    psvSpecialty: 'Digital-first PSV insurance with fleet management tools',
    premiumRange: 'Medium',
    claimsTime: '2-4 days',
    networkGarages: 180,
    onlineServices: true,
    benefits: [
      'Digital PSV management platform',
      'Fleet tracking integration',
      'Passenger liability coverage',
      'Route-specific policies',
      'Quick claim settlements'
    ]
  },
  {
    id: 'aig',
    name: 'AIG Insurance',
    logoIcon: 'diamond-outline',
    rating: 4.5,
    features: ['Premium PSV', 'International Standards', 'Enhanced Coverage'],
    psvSpecialty: 'Premium PSV insurance with international service standards',
    premiumRange: 'High',
    claimsTime: '2-3 days',
    networkGarages: 150,
    onlineServices: true,
    benefits: [
      'Premium customer service',
      'Enhanced passenger coverage',
      'International rescue services',
      'Luxury vehicle specialists',
      'Concierge claims service'
    ]
  },
  {
    id: 'madison',
    name: 'Madison Insurance',
    logoIcon: 'business-outline',
    rating: 4.1,
    features: ['Affordable PSV', 'Local Support', 'Community Focus'],
    psvSpecialty: 'Community-focused PSV insurance with local expertise',
    premiumRange: 'Low',
    claimsTime: '4-6 days',
    networkGarages: 120,
    onlineServices: true,
    benefits: [
      'Affordable premium rates',
      'Local community support',
      'Matatu SACCO partnerships',
      'Flexible payment terms',
      'Regional claims offices'
    ]
  },
  {
    id: 'cci',
    name: 'CIC Insurance',
    logoIcon: 'home-outline',
    rating: 4.2,
    features: ['Reliable PSV', 'Established Network', 'Proven Track Record'],
    psvSpecialty: 'Reliable PSV insurance with decades of transport sector experience',
    premiumRange: 'Medium',
    claimsTime: '3-5 days',
    networkGarages: 160,
    onlineServices: true,
    benefits: [
      'Long-standing reputation',
      'Transport sector expertise',
      'Comprehensive garage network',
      'Driver training programs',
      'Safety incentive schemes'
    ]
  },
  {
    id: 'directline',
    name: 'Directline Insurance',
    logoIcon: 'call-outline',
    rating: 4.0,
    features: ['Direct Sales', 'No Agent Fees', 'Simple Process'],
    psvSpecialty: 'Direct PSV insurance sales with simplified processes',
    premiumRange: 'Low',
    claimsTime: '4-7 days',
    networkGarages: 100,
    onlineServices: true,
    benefits: [
      'No agent commission fees',
      'Direct customer service',
      'Simplified application process',
      'Transparent pricing',
      'Online policy management'
    ]
  },
  {
    id: 'heritage',
    name: 'Heritage Insurance',
    logoIcon: 'library-outline',
    rating: 4.1,
    features: ['Traditional Values', 'Personal Service', 'Local Knowledge'],
    psvSpecialty: 'Traditional PSV insurance with personalized service approach',
    premiumRange: 'Medium',
    claimsTime: '4-6 days',
    networkGarages: 140,
    onlineServices: false,
    benefits: [
      'Personalized service',
      'Local market knowledge',
      'Flexible coverage options',
      'Branch-based support',
      'Community involvement'
    ]
  }
];

const PSVInsurerStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  enableComparison = true,
  showRatings = true,
  filterByBudget = false,
  maxBudget = null
}) => {
  const [selectedInsurer, setSelectedInsurer] = useState(formData.selectedInsurer);
  const [showComparison, setShowComparison] = useState(false);
  const [sortBy, setSortBy] = useState('rating'); // rating, premium, features

  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  // Handle insurer selection
  const handleInsurerSelect = (insurer) => {
    setSelectedInsurer(insurer.id);
    updateFormData({ 
      selectedInsurer: insurer.id,
      insurerDetails: insurer
    });
  };

  // Filter insurers based on criteria
  const getFilteredInsurers = () => {
    let filtered = [...PSV_INSURERS];

    // Filter by budget if enabled
    if (filterByBudget && maxBudget) {
      filtered = filtered.filter(insurer => {
        const premiumCategory = insurer.premiumRange.toLowerCase();
        if (maxBudget < 20000 && premiumCategory !== 'low') return false;
        if (maxBudget < 35000 && premiumCategory === 'high') return false;
        return true;
      });
    }

    // Sort insurers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'premium':
          const premiumOrder = { 'low': 1, 'medium': 2, 'high': 3 };
          return premiumOrder[a.premiumRange.toLowerCase()] - premiumOrder[b.premiumRange.toLowerCase()];
        case 'features':
          return b.benefits.length - a.benefits.length;
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Get premium range color
  const getPremiumRangeColor = (range) => {
    switch (range.toLowerCase()) {
      case 'low': return Colors.success;
      case 'medium': return Colors.warning;
      case 'high': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  // Render star rating
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color={Colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color={Colors.warning} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color={Colors.textSecondary} />
      );
    }

    return (
      <View style={styles.starsContainer}>
        {stars}
        <Text style={styles.ratingText}>{rating}</Text>
      </View>
    );
  };

  // Render insurer card
  const renderInsurerCard = (insurer) => {
    const isSelected = selectedInsurer === insurer.id;

    return (
      <TouchableOpacity
        key={insurer.id}
        style={[styles.insurerCard, isSelected && styles.insurerCardSelected]}
        onPress={() => handleInsurerSelect(insurer)}
      >
        <View style={styles.insurerHeader}>
          <View style={styles.insurerIcon}>
            <Ionicons 
              name={insurer.logoIcon} 
              size={32} 
              color={isSelected ? Colors.primary : Colors.textSecondary} 
            />
          </View>
          
          <View style={styles.insurerInfo}>
            <Text style={[styles.insurerName, isSelected && styles.insurerNameSelected]}>
              {insurer.name}
            </Text>
            
            {showRatings && renderStarRating(insurer.rating)}
            
            <View style={styles.premiumRangeContainer}>
              <Text style={styles.premiumRangeLabel}>Premium: </Text>
              <Text style={[
                styles.premiumRangeValue,
                { color: getPremiumRangeColor(insurer.premiumRange) }
              ]}>
                {insurer.premiumRange}
              </Text>
            </View>
          </View>

          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            </View>
          )}
        </View>

        <Text style={styles.insurerSpecialty}>{insurer.psvSpecialty}</Text>

        <View style={styles.insurerFeatures}>
          {insurer.features.map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.insurerDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>Claims: {insurer.claimsTime}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="car-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{insurer.networkGarages} Garages</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons 
              name={insurer.onlineServices ? "cloud-done-outline" : "cloud-offline-outline"} 
              size={16} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.detailText}>
              {insurer.onlineServices ? 'Online Services' : 'Branch Only'}
            </Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.benefitsList}>
            <Text style={styles.benefitsTitle}>Key Benefits:</Text>
            {insurer.benefits.slice(0, 3).map((benefit, index) => (
              <Text key={index} style={styles.benefitItem}>• {benefit}</Text>
            ))}
            {insurer.benefits.length > 3 && (
              <Text style={styles.moreBenefits}>
                +{insurer.benefits.length - 3} more benefits
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render sort options
  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <View style={styles.sortOptions}>
        {[
          { key: 'rating', label: 'Rating' },
          { key: 'premium', label: 'Price' },
          { key: 'features', label: 'Features' }
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortOption,
              sortBy === option.key && styles.sortOptionSelected
            ]}
            onPress={() => setSortBy(option.key)}
          >
            <Text style={[
              styles.sortOptionText,
              sortBy === option.key && styles.sortOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const filteredInsurers = getFilteredInsurers();

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Select Insurance Provider</Text>
          <Text style={styles.subtitle}>
            Choose from PSV insurance specialists
          </Text>
        </View>
      )}

      {renderSortOptions()}

      {filterByBudget && maxBudget && (
        <View style={styles.budgetInfo}>
          <Ionicons name="wallet-outline" size={16} color={Colors.primary} />
          <Text style={styles.budgetText}>
            Showing options for budget: KES {maxBudget.toLocaleString()}
          </Text>
        </View>
      )}

      <ScrollView style={styles.insurersList} showsVerticalScrollIndicator={false}>
        {filteredInsurers.map(renderInsurerCard)}
        
        {filteredInsurers.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.noResultsText}>
              No insurers match your criteria
            </Text>
            <Text style={styles.noResultsSubtext}>
              Try adjusting your budget or requirements
            </Text>
          </View>
        )}
      </ScrollView>

      {enableComparison && selectedInsurer && (
        <View style={styles.comparisonContainer}>
          <TouchableOpacity
            style={styles.compareButton}
            onPress={() => setShowComparison(!showComparison)}
          >
            <Ionicons name="analytics-outline" size={20} color={Colors.primary} />
            <Text style={styles.compareButtonText}>Compare Providers</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Help Section */}
      <View style={styles.helpSection}>
        <View style={styles.helpHeader}>
          <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.helpTitle}>Choosing Your PSV Insurer</Text>
        </View>
        <Text style={styles.helpText}>
          Consider claims processing time, network coverage, and PSV-specific services 
          when selecting your insurance provider.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  sortLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  sortOptions: {
    flexDirection: 'row',
    flex: 1,
  },
  sortOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    marginRight: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortOptionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sortOptionTextSelected: {
    color: Colors.surface,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  budgetText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  insurersList: {
    flex: 1,
  },
  insurerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  insurerCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  insurerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  insurerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  insurerInfo: {
    flex: 1,
  },
  insurerName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  insurerNameSelected: {
    color: Colors.primary,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  premiumRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumRangeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  premiumRangeValue: {
    ...Typography.caption,
    fontWeight: '600',
  },
  selectedIndicator: {
    marginLeft: Spacing.sm,
  },
  insurerSpecialty: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  insurerFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  featureTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  featureText: {
    ...Typography.caption,
    color: Colors.text,
  },
  insurerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  benefitsList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  benefitsTitle: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  benefitItem: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  moreBenefits: {
    ...Typography.caption,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  comparisonContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
  },
  compareButtonText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  noResults: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noResultsText: {
    ...Typography.h3,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  noResultsSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  helpSection: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  helpTitle: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  helpText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});

export default PSVInsurerStep;
