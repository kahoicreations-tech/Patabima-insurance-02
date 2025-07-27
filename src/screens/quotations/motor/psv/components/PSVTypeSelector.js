/**
 * PSV Type Selector Component
 * Allows selection of different PSV vehicle types
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const PSVTypeSelector = ({ selectedType, onTypeSelect, style }) => {
  const psvTypes = [
    {
      id: 'matatu',
      name: 'Matatu',
      description: 'Public transport vehicle (14-25 seats)',
      icon: 'bus-outline',
      seatingRange: '14-25',
      baseRiskFactor: 1.5,
    },
    {
      id: 'bus',
      name: 'Bus',
      description: 'Large passenger bus (26+ seats)',
      icon: 'bus',
      seatingRange: '26+',
      baseRiskFactor: 1.8,
    },
    {
      id: 'taxi',
      name: 'Taxi',
      description: 'Private hire vehicle (4-8 seats)',
      icon: 'car-outline',
      seatingRange: '4-8',
      baseRiskFactor: 1.3,
    },
    {
      id: 'uber_bolt',
      name: 'App-based Taxi',
      description: 'Uber, Bolt, Little Cab etc.',
      icon: 'phone-portrait-outline',
      seatingRange: '4-8',
      baseRiskFactor: 1.4,
    },
    {
      id: 'school_bus',
      name: 'School Bus',
      description: 'Dedicated school transport',
      icon: 'school-outline',
      seatingRange: '14+',
      baseRiskFactor: 1.6,
    },
    {
      id: 'boda_boda',
      name: 'Boda Boda',
      description: 'Motorcycle taxi',
      icon: 'bicycle-outline',
      seatingRange: '2',
      baseRiskFactor: 2.5,
    },
    {
      id: 'tuk_tuk',
      name: 'Tuk Tuk',
      description: 'Three-wheeler taxi',
      icon: 'car-sport-outline',
      seatingRange: '3-4',
      baseRiskFactor: 2.0,
    },
    {
      id: 'tour_van',
      name: 'Tour Van',
      description: 'Tourism and safari vehicle',
      icon: 'camera-outline',
      seatingRange: '8-14',
      baseRiskFactor: 1.4,
    },
  ];

  const renderPSVType = ({ item }) => {
    const isSelected = selectedType === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.typeCard,
          isSelected && styles.selectedCard
        ]}
        onPress={() => onTypeSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[
            styles.iconContainer,
            isSelected && styles.selectedIconContainer
          ]}>
            <Ionicons 
              name={item.icon} 
              size={24} 
              color={isSelected ? Colors.white : Colors.primary} 
            />
          </View>
          
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            </View>
          )}
        </View>

        <Text style={[
          styles.typeName,
          isSelected && styles.selectedTypeName
        ]}>
          {item.name}
        </Text>

        <Text style={styles.typeDescription}>
          {item.description}
        </Text>

        <View style={styles.typeDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {item.seatingRange} seats
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              Risk: {item.baseRiskFactor}x
            </Text>
          </View>
        </View>

        {/* Risk Level Indicator */}
        <View style={styles.riskIndicator}>
          <View style={[
            styles.riskBar,
            { 
              width: `${(item.baseRiskFactor / 2.5) * 100}%`,
              backgroundColor: item.baseRiskFactor <= 1.4 
                ? Colors.success 
                : item.baseRiskFactor <= 1.8 
                ? Colors.warning 
                : Colors.error
            }
          ]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Select PSV Type</Text>
      <Text style={styles.subtitle}>
        Choose the type of Public Service Vehicle you want to insure
      </Text>

      <FlatList
        data={psvTypes}
        renderItem={renderPSVType}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {selectedType && (
        <View style={styles.selectionInfo}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.selectionText}>
            Premium calculations will be based on the selected PSV type and associated risk factors.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  listContainer: {
    paddingBottom: Spacing.lg,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  typeCard: {
    flex: 0.48,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIconContainer: {
    backgroundColor: Colors.primary,
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  typeName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_600SemiBold',
  },
  selectedTypeName: {
    color: Colors.primary,
  },
  typeDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  typeDetails: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
  },
  riskIndicator: {
    height: 4,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  riskBar: {
    height: '100%',
    borderRadius: 2,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.md,
  },
  selectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
});

export default PSVTypeSelector;
