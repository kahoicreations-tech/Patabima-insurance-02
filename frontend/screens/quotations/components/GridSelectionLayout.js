import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SelectionCard from './SelectionCard';
import { Colors, Typography } from '../../../constants';

/**
 * GridSelectionLayout component for displaying selection cards in a grid layout
 * @param {Array} items - Items to display
 * @param {Object} selectedItem - Currently selected item
 * @param {function} onSelectItem - Callback when an item is selected
 * @param {string} title - Section title
 * @param {string} subtitle - Section subtitle
 * @param {number} itemsPerRow - Number of items per row
 */
const GridSelectionLayout = ({
  items,
  selectedItem,
  onSelectItem,
  title,
  subtitle,
  itemsPerRow = 2
}) => {
  return (
    <View style={styles.container}>
      {(title || subtitle) && (
        <View style={styles.headerContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.gridContainer}>
          {items.map((item) => (
            <SelectionCard
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onSelect={onSelectItem}
              gridLayout={true}
              gridItemsPerRow={itemsPerRow}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    padding: 16,
  },
  title: {
    ...Typography.headingMedium,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 8, // Reduced padding to account for card margins
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default GridSelectionLayout;
