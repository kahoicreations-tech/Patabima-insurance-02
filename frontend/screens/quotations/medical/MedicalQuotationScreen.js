/**
 * Medical Insurance Quotation Screen
 * Simple category selection: Individual & Family or Corporate
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants';
import { Heading5, Heading6, Body1, Body2 } from '../../../components/typography/Text';

const MEDICAL_CATEGORIES = [
  {
    id: 'individual',
    name: 'Individual & Family',
    description: 'Comprehensive medical coverage for individuals and families',
    icon: 'people-outline'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Group medical cover for companies and employees',
    icon: 'business-outline'
  }
];

export default function MedicalQuotationScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleCategorySelect = (category) => {
    if (category.id === 'individual') {
      navigation.navigate('EnhancedIndividualMedical');
    } else if (category.id === 'corporate') {
      navigation.navigate('CorporateMedical');
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategorySelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={32} color={Colors.primary} />
        </View>
        
        <View style={styles.categoryInfo}>
          <Body1 style={styles.categoryTitle}>{item.name}</Body1>
          <Body2 style={styles.categoryDescription} numberOfLines={2}>
            {item.description}
          </Body2>
        </View>
        
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
  <Heading6 style={styles.headerTitle}>Medical Insurance</Heading6>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Heading5 style={styles.pageTitle}>Select Medical Insurance Type</Heading5>
        <Body2 style={styles.pageSubtitle}>
          Choose the appropriate insurance category for your needs
        </Body2>

        <FlatList
          data={MEDICAL_CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  pageTitle: {
    marginBottom: 8,
  },
  pageSubtitle: {
    marginBottom: 24,
  },
  listContainer: {
    paddingBottom: 20,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    marginBottom: 4,
  },
  categoryDescription: {
    // Body2 handles sizing/color/lineHeight
  },
  arrowContainer: {
    marginLeft: 12,
  },
});
