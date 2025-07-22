/**
 * Motor Insurance - Add TOR Option Navigation Integration
 * 
 * This component extends the motor insurance options to include TOR (Third Party Only Risk)
 * It integrates with the existing insurance selection flow
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../../constants';

const TOROption = () => {
  const navigation = useNavigation();

  // Navigate to TOR insurance screen
  const navigateToTORScreen = () => {
    navigation.navigate('TORInsurance');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>TOR Insurance</Text>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>NEW</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>⚡</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Total Own Risk Motor Insurance</Text>
          <Text style={styles.infoDescription}>
            Lowest cost option with own damage coverage. Basic legal protection with deductible for claims.
          </Text>
          
          <View style={styles.highlightsContainer}>
            <View style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.highlightText}>Starts at KES 3,000</Text>
            </View>
            <View style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.highlightText}>Fast approval</Text>
            </View>
            <View style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.highlightText}>10% excess on claims</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={navigateToTORScreen}>
            <Text style={styles.actionButtonText}>Get TOR Quote</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: Spacing.medium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.small,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.medium,
  },
  tagContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: Colors.white,
    fontSize: Typography.size.tiny,
    fontWeight: Typography.weight.bold,
  },
  cardContent: {
    padding: Spacing.medium,
    flexDirection: 'row',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.medium,
  },
  iconText: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: Typography.size.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
    lineHeight: 18,
  },
  highlightsContainer: {
    marginBottom: Spacing.medium,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: Typography.size.small,
    color: Colors.text,
    marginLeft: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
    marginRight: 6,
  },
});

export default TOROption;
