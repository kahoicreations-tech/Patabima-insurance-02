/**
 * Motorcycle Insurance Landing Screen
 * Lists all available motorcycle insurance products
 */

import React from 'react';
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

const MotorcycleScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const motorcycleProducts = [
    {
      id: 'motorcycle_third_party',
      name: 'Motorcycle Third Party',
      description: 'Essential third party liability coverage for motorcycles and bodabodas',
      screen: 'MotorcycleThirdParty',
      icon: '🏍️',
      isRecommended: true
    },
    {
      id: 'motorcycle_comprehensive',
      name: 'Motorcycle Comprehensive',
      description: 'Full protection including theft and accident damage for motorcycles',
      screen: 'MotorcycleComprehensive',
      icon: '🛡️',
      isRecommended: false
    }
  ];

  const handleProductSelect = (product) => {
    navigation.navigate(product.screen, {
      vehicleCategory: { id: 'motorcycle', name: 'Motorcycle' },
      productType: product.id,
      productName: product.name
    });
  };

  const handleCheckInsurance = () => {
    navigation.navigate('CheckInsuranceStatusScreen');
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
        <Text style={styles.headerTitle}>Motorcycle Insurance</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Select Insurance Product</Text>
          <Text style={styles.subtitle}>
            Choose the appropriate insurance product for your motorcycle or bodaboda
          </Text>

          {/* Product Cards */}
          {motorcycleProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => handleProductSelect(product)}
              activeOpacity={0.7}
            >
              <View style={styles.productIconContainer}>
                <Text style={styles.productIcon}>{product.icon}</Text>
              </View>
              
              <View style={styles.productContent}>
                <View style={styles.productHeader}>
                  <Text style={styles.productTitle}>{product.name}</Text>
                  <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.productDescription}>{product.description}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.infoTitle}>Motorcycle Coverage</Text>
            </View>
            <Text style={styles.infoText}>
              Motorcycle insurance covers personal motorcycles, scooters, and commercial bodabodas. Special coverage options available for riders and passengers.
            </Text>
          </View>

          {/* Check Insurance Status Button */}
          <TouchableOpacity 
            style={styles.checkInsuranceButton}
            onPress={handleCheckInsurance}
          >
            <Ionicons name="search-circle" size={24} color={Colors.white} />
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
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
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
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  productIcon: {
    fontSize: 30,
  },
  productContent: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  productTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  productDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: Colors.backgroundLightBlue,
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  checkInsuranceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.md,
  },
  checkInsuranceText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
});

export default MotorcycleScreen;
