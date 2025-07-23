/**
 * Motor Insurance Dashboard
 * Uses centralized data from motorCategories.js
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
import { Colors, Typography, Spacing } from '../../../constants';
import { getVehicleCategories } from '../../../data';

const MotorDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const vehicleCategories = getVehicleCategories();
  
  const handleCategorySelect = (category) => {
    // Navigate to category-specific screen based on vehicle type
    switch (category.id) {
      case 'private':
        navigation.navigate('PrivateVehicleScreen');
        break;
      case 'commercial':
        navigation.navigate('CommercialVehicleScreen');
        break;
      case 'motorcycle':
        navigation.navigate('MotorcycleScreen');
        break;
      case 'psv_matatu':
        navigation.navigate('PSVScreen');
        break;
      case 'tuktuk':
        navigation.navigate('TukTukScreen');
        break;
      case 'special':
        navigation.navigate('SpecialClassesScreen');
        break;
      default:
        // Fallback to existing navigation
        navigation.navigate(category.path, category.params);
    }
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
        <Text style={styles.headerTitle}>Motor Insurance</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Select Vehicle Category</Text>
          <Text style={styles.subtitle}>
            Choose the appropriate category for your vehicle to get an accurate quote
          </Text>
          
          {/* Category Cards */}
          {vehicleCategories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.categoryCard}
              onPress={() => handleCategorySelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>{item.icon}</Text>
              </View>
              <View style={styles.categoryContent}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.categoryDescription}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.infoTitle}>PataBima Motor Insurance</Text>
            </View>
            <Text style={styles.infoText}>
              Comprehensive vehicle coverage with competitive rates and 24/7 support.
            </Text>
          </View>

          {/* Check Insurance Status Button */}
          <TouchableOpacity 
            style={styles.checkInsuranceButton}
            onPress={handleCheckInsurance}
          >
            <Ionicons name="search-circle" size={24} color={Colors.light} />
            <Text style={styles.checkInsuranceText}>Check Vehicle Insurance Status</Text>
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
  categoryCard: {
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
  categoryIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryIcon: {
    fontSize: 30,
  },
  categoryContent: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  categoryDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
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

export default MotorDashboardScreen;
