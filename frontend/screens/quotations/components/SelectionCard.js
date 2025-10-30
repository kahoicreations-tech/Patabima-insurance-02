import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../../constants';

/**
 * SelectionCard component for displaying selectable options
 * @param {Object} item - Item data to display
 * @param {boolean} isSelected - Whether the item is selected
 * @param {function} onSelect - Callback when item is selected
 * @param {boolean} gridLayout - Whether to display in grid layout
 * @param {number} gridItemsPerRow - Number of items per row in grid
 */
const SelectionCard = ({ 
  item, 
  isSelected = false, 
  onSelect, 
  gridLayout = false,
  gridItemsPerRow = 2
}) => {
  const { id, name, icon, description, baseRate } = item;

  // Grid layout card (based on the screenshot)
  if (gridLayout) {
    return (
      <TouchableOpacity
        style={[
          styles.gridCard, 
          isSelected && styles.gridCardSelected,
          { width: `${100 / gridItemsPerRow - 4}%` } // Calculate width based on items per row
        ]}
        onPress={() => onSelect(item)}
      >
        <View style={styles.gridIconContainer}>
          <Text style={styles.gridIcon}>{icon}</Text>
        </View>
        <Text style={styles.gridTitle}>{name}</Text>
        {isSelected && (
          <View style={styles.gridSelectedIndicator}>
            <View style={styles.gridSelectedDot} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Standard list layout card
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onSelect(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{name}</Text>
          {baseRate && (
            <Text style={styles.cardRate}>
              Rate: {baseRate}%
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}
      </View>
      
      {description && (
        <Text style={styles.cardDescription}>{description}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Standard list card styles
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 400, // Limit maximum width
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  cardRate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectedBadge: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  cardDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 8,
  },

  // Grid layout card styles (based on the screenshots)
  gridCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    aspectRatio: 1, // Square cards
  },
  gridCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridIcon: {
    fontSize: 24,
    color: Colors.primary,
  },
  gridTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  gridSelectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  gridSelectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});

export default SelectionCard;
