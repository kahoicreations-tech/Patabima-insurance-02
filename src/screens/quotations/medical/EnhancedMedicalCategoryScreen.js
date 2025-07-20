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
          
          {/* Simple Selection Options */}
          <View style={styles.selectionContainer}>
            {/* Individual/Family Option */}
            <TouchableOpacity
              style={styles.selectionItem}
              onPress={() => handleCategorySelect('individual')}
              activeOpacity={0.7}
            >
              <View style={styles.selectionContent}>
                <View style={styles.selectionIcon}>
                  <Ionicons name="person" size={24} color={Colors.primary} />
                </View>
                <View style={styles.selectionText}>
                  <Text style={styles.selectionTitle}>Individual & Family</Text>
                  <Text style={styles.selectionDescription}>
                    Personal medical coverage for you and dependents
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
            
            {/* Corporate Option */}
            <TouchableOpacity
              style={styles.selectionItem}
              onPress={() => handleCategorySelect('corporate')}
              activeOpacity={0.7}
            >
              <View style={styles.selectionContent}>
                <View style={styles.selectionIcon}>
                  <Ionicons name="business" size={24} color={Colors.primary} />
                </View>
                <View style={styles.selectionText}>
                  <Text style={styles.selectionTitle}>Corporate</Text>
                  <Text style={styles.selectionDescription}>
                    Group medical cover for company employees
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

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
  selectionContainer: {
    marginTop: Spacing.md,
  },
  selectionItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLightPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  selectionText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  selectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  selectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
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
