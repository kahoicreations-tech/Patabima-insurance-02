/**
 * List Selection Layout Component
 * 
 * Renders items in a vertical list format with selection functionality
 * Used for category selection and other list-based selections
 */

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import SelectionCard from './SelectionCard';
import { Layout } from '../../../constants';

export function ListSelectionLayout({
  items,
  selectedItem,
  onSelectItem,
  renderItem,
  keyExtractor,
  showSeparator = true,
  contentContainerStyle,
  maxWidth = '90%', // New prop to control list width
  ...flatListProps
}) {
  const defaultRenderItem = ({ item, index }) => (
    <View style={[
      styles.itemContainer,
      { maxWidth: maxWidth },
      showSeparator && index < items.length - 1 && styles.itemSeparator
    ]}>
      <SelectionCard
        item={item}
        isSelected={selectedItem?.id === item.id}
        onSelect={() => onSelectItem(item)}
        gridLayout={false}
      />
    </View>
  );

  const defaultKeyExtractor = (item, index) => item.id || index.toString();

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem || defaultRenderItem}
        keyExtractor={keyExtractor || defaultKeyExtractor}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        {...flatListProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center', // Center the list items
  },
  listContent: {
    paddingVertical: Layout.padding / 2,
    alignItems: 'center', // Center content
    width: '100%',
  },
  itemContainer: {
    marginBottom: Layout.padding / 2,
    width: '100%', // Take full width of container
    alignItems: 'center', // Center the card within container
  },
  itemSeparator: {
    marginBottom: Layout.padding,
  },
});

export default ListSelectionLayout;
