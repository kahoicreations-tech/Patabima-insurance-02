/**
 * Enhanced Medical Insurance Category Selection Screen
 * Allows users to choose between Individual/Family and Corporate Medical Insurance
 * The first step in the enhanced medical insurance quotation flow
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Heading4, Body1, Body2, Subtitle2 } from '../../../components/typography/Text';
import { BRAND, UI, SPACING, BORDER_RADIUS } from '../../../theme';

const EnhancedMedicalCategoryScreen = ({ navigation }) => {
  
  const handleCategorySelect = (category) => {
    // Navigate to the appropriate medical quotation screen based on category
    if (category === 'individual') {
      navigation.navigate('EnhancedIndividualMedicalQuotation');
    } else if (category === 'corporate') {
      navigation.navigate('EnhancedCorporateMedicalQuotation');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />
      
      {/* Red Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Heading4 style={styles.headerTitle}>Medical Insurance</Heading4>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Content */}
        <View style={styles.content}>
          <Heading4 style={styles.title}>Select Medical Insurance Type</Heading4>
          <Body1 style={styles.subtitle}>
            Choose the appropriate insurance category for your needs
          </Body1>
          
          {/* Individual/Family Card */}
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategorySelect('individual')}
            activeOpacity={0.7}
          >
            <View style={styles.categoryContent}>
              <View style={styles.categoryHeader}>
                <Subtitle2 style={styles.categoryTitle}>Individual & Family</Subtitle2>
                <Ionicons name="chevron-forward" size={24} color={BRAND.primary} />
              </View>
              <Body2 style={styles.categoryDescription}>
                Comprehensive medical coverage for individuals and families
              </Body2>
            </View>
          </TouchableOpacity>
          
          {/* Corporate Card */}
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategorySelect('corporate')}
            activeOpacity={0.7}
          >
            <View style={styles.categoryContent}>
              <View style={styles.categoryHeader}>
                <Subtitle2 style={styles.categoryTitle}>Corporate</Subtitle2>
                <Ionicons name="chevron-forward" size={24} color={BRAND.primary} />
              </View>
              <Body2 style={styles.categoryDescription}>
                Group medical cover for companies and employees
              </Body2>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.xs,
    color: UI.textPrimary,
  },
  subtitle: {
    marginBottom: SPACING.lg,
    color: UI.textSecondary,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryContent: {
    padding: SPACING.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryTitle: {
    color: UI.textPrimary,
  },
  categoryDescription: {
    color: UI.textSecondary,
  },
});

export default EnhancedMedicalCategoryScreen;
