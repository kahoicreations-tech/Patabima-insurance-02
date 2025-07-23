/**
 * Private Vehicle Insurance Landing Screen
 * Lists all available private vehicle insurance products
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../constants';

const PrivateVehicleScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [expandedCards, setExpandedCards] = useState({});
  
  const privateProducts = [
    {
      id: 'tor_private',
      name: 'TOR (Third Party, Own Damage & Robbery)',
      description: 'Comprehensive coverage including third party, own damage, and theft protection',
      screen: 'TORQuotationFlow',
      icon: 'shield-checkmark',
      features: ['Third Party Coverage', 'Own Damage Protection', 'Theft Coverage', 'Fire Protection']
    },
    {
      id: 'private_third_party',
      name: 'Private Third Party',
      description: 'Basic third party liability coverage - legal minimum requirement',
      screen: 'PrivateThirdParty',
      icon: 'car-sport',
      features: ['Third Party Liability', 'Legal Compliance', 'Affordable Premium']
    },
    {
      id: 'private_third_party_extendible',
      name: 'Private Third Party (Extendible)',
      description: 'Enhanced third party coverage with extension options and additional benefits',
      screen: 'PrivateThirdPartyExtendible',
      icon: 'add-circle',
      features: ['Third Party Coverage', 'Extension Options', 'Additional Benefits', 'Flexible Terms']
    },
    {
      id: 'private_motorcycle',
      name: 'Private Motorcycle',
      description: 'Specialized insurance coverage for private motorcycles and scooters',
      screen: 'PrivateMotorcycle',
      icon: 'bicycle',
      features: ['Motorcycle Coverage', 'Personal Use Only', 'Theft Protection', 'Accident Coverage']
    },
    {
      id: 'private_comprehensive',
      name: 'Private Comprehensive',
      description: 'Complete comprehensive coverage with maximum protection for all risks',
      screen: 'PrivateComprehensive',
      icon: 'shield',
      features: ['Full Comprehensive', 'All Risks Covered', 'Maximum Protection', 'Premium Service']
    }
  ];

  const handleProductSelect = (product) => {
    navigation.navigate(product.screen, {
      vehicleCategory: { id: 'private', name: 'Private Vehicle' },
      productType: product.id,
      productName: product.name,
      productFeatures: product.features
    });
  };

  const handleCheckInsurance = () => {
    navigation.navigate('CheckInsuranceStatusScreen', {
      category: 'private'
    });
  };

  const toggleCardExpansion = (productId) => {
    setExpandedCards(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Private Vehicle Insurance</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Select Insurance Product</Text>
          <Text style={styles.subtitle}>
            Choose the appropriate insurance product for your private vehicle
          </Text>

          {/* Product Cards */}
          {privateProducts.map((product) => (
            <View key={product.id} style={styles.productCardWrapper}>
              {/* Card Header */}
              <TouchableOpacity
                style={[
                  styles.productCard,
                  expandedCards[product.id] && styles.expandedCard
                ]}
                onPress={() => toggleCardExpansion(product.id)}
                activeOpacity={0.8}
              >
                <View style={styles.productHeader}>
                  <View style={styles.productIconContainer}>
                    <Ionicons 
                      name={product.icon} 
                      size={24} 
                      color={Colors.primary} 
                    />
                  </View>
                  
                  <View style={styles.productContent}>
                    <Text style={styles.productTitle}>{product.name}</Text>
                    <Text style={styles.productDescription} numberOfLines={expandedCards[product.id] ? 0 : 1}>
                      {product.description}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.chevronButton}
                    onPress={() => toggleCardExpansion(product.id)}
                  >
                    <Ionicons 
                      name={expandedCards[product.id] ? "chevron-up" : "chevron-down"} 
                      size={22} 
                      color={Colors.primary} 
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Expanded Content */}
              {expandedCards[product.id] && (
                <View style={styles.expandedContent}>
                  {/* Features Grid */}
                  <View style={styles.featuresContainer}>
                    <Text style={styles.featuresTitle}>What's Covered:</Text>
                    <View style={styles.featuresGrid}>
                      {product.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <View style={styles.featureIndicator}>
                            <Ionicons name="checkmark" size={12} color={Colors.white} />
                          </View>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => handleProductSelect(product)}
                  >
                    <Text style={styles.selectButtonText}>Get Quote</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {/* Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
              <Text style={styles.infoTitle}>PataBima Private Vehicle Insurance</Text>
            </View>
            <Text style={styles.infoText}>
              Protect your clients' vehicles with comprehensive coverage. Tap any product above to view detailed features and get instant quotes.
            </Text>
          </View>

          {/* Check Insurance Status Button */}
          <TouchableOpacity 
            style={styles.checkInsuranceButton}
            onPress={handleCheckInsurance}
          >
            <Ionicons name="search" size={20} color={Colors.white} />
            <Text style={styles.checkInsuranceText}>Check Current Insurance Status</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: Spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(213, 34, 43, 0.1)',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  content: {
    padding: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  productCardWrapper: {
    marginBottom: Spacing.md,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expandedCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(213, 34, 43, 0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  productContent: {
    flex: 1,
  },
  productTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: Spacing.xs,
  },
  productDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  chevronButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  expandedContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: Spacing.md,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  featuresContainer: {
    marginBottom: Spacing.md,
  },
  featuresTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: Spacing.sm,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  featureIndicator: {
    width: 18,
    height: 18,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  featureText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.xs,
  },
  selectButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginRight: Spacing.xs,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  checkInsuranceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkInsuranceText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginLeft: Spacing.sm,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default PrivateVehicleScreen;
