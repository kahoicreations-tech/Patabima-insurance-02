/**
 * Enhanced Medical Insurance Category Selection Screen
 * Allows users to choose between Individual/Family and Corporate Medical Insurance
 * The first step in the enhanced medical insurance quotation flow
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';

const EnhancedMedicalCategoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const handleCategorySelect = (category) => {
    // Navigate to the appropriate medical quotation screen based on category
    if (category === 'individual') {
      navigation.navigate('EnhancedIndividualMedicalQuotation');
    } else if (category === 'corporate') {
      navigation.navigate('EnhancedCorporateMedicalQuotation');
    }
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
        <Text style={styles.headerTitle}>Medical Insurance</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Select Medical Insurance Type</Text>
          <Text style={styles.subtitle}>
            Choose the appropriate insurance category for your needs
          </Text>
          
          {/* Individual/Family Card */}
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategorySelect('individual')}
            activeOpacity={0.7}
          >
            <View style={styles.categoryImageContainer}>
              <Image 
                source={require('../../../../assets/images/health.png')}
                style={styles.categoryImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.categoryContent}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Individual & Family</Text>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.categoryDescription}>
                Comprehensive medical coverage for individuals and families with flexible benefits
              </Text>
              <View style={styles.featureContainer}>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>In-patient & Out-patient</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Family options available</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Dental & Optical options</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Corporate Card */}
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategorySelect('corporate')}
            activeOpacity={0.7}
          >
            <View style={styles.categoryImageContainer}>
              <Image 
                source={require('../../../../assets/images/health.png')}
                style={styles.categoryImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.categoryContent}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Corporate</Text>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.categoryDescription}>
                Group medical cover for companies with customized benefits for employees
              </Text>
              <View style={styles.featureContainer}>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Employee medical cover</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Customized group benefits</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>Simplified administration</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color={Colors.primary} />
              <Text style={styles.infoTitle}>Why Choose PataBima</Text>
            </View>
            <Text style={styles.infoText}>
              We partner with top medical insurers in Kenya to provide comprehensive health coverage at competitive rates. Our medical insurance products cater to various needs with flexible payment options.
            </Text>
          </View>
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
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryImageContainer: {
    height: 160,
    backgroundColor: Colors.backgroundLight,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryContent: {
    padding: Spacing.md,
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
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  featureContainer: {
    marginTop: Spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  infoCard: {
    backgroundColor: Colors.backgroundLightBlue,
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
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
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});

export default EnhancedMedicalCategoryScreen;
