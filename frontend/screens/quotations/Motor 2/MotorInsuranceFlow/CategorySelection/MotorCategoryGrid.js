import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Professional Motor Category Grid Component
 * Displays 6 main motor insurance categories with visual feedback
 * Matches PataBima design with soft pink cards and red icons
 */
export default function MotorCategoryGrid({ 
  categories = [], 
  selectedCategory, 
  loading = false, 
  onSelect, 
  bottomPadding = 0,
  onCheckExistingCover 
}) {
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingBottom: bottomPadding }]}>
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategory?.key === item.key;
    
    return (
      <TouchableOpacity 
        style={[
          styles.card,
          isSelected && styles.selectedCard
        ]} 
        onPress={() => onSelect?.(item)}
        activeOpacity={0.8}
      >
        <View style={styles.iconWrapper}>
          <Ionicons 
            name={item.icon || 'car-sport-outline'} 
            size={48} 
            color="#D5222B"
          />
        </View>
        <Text style={styles.title}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <FlatList
        data={categories}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        keyExtractor={(item) => item.key}
        renderItem={renderCategoryItem}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Check Existing Cover Button */}
      {onCheckExistingCover && (
        <TouchableOpacity 
          style={styles.checkCoverButton}
          onPress={onCheckExistingCover}
          activeOpacity={0.9}
        >
          <Ionicons name="car-sport" size={24} color="#FFFFFF" />
          <Text style={styles.checkCoverButtonText}>
            Check Vehicle For Existing Cover
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#646767',
    textAlign: 'center',
  },
  grid: {
    gap: 16,
    paddingHorizontal: 4,
  },
  row: {
    gap: 16,
    justifyContent: 'space-between',
  },
  card: { 
    flex: 1,
    backgroundColor: '#FFE8E8', // More visible soft pink background matching the design
    borderRadius: 16, 
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    // Remove shadows for flatter design
    borderWidth: 0,
  },
  selectedCard: {
    backgroundColor: '#FFD5D5', // Slightly darker pink for selection (more saturated)
    borderWidth: 2,
    borderColor: '#D5222B',
  },
  iconWrapper: { 
    marginBottom: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '700', 
    fontFamily: 'Poppins-SemiBold',
    color: '#000000', 
    textAlign: 'center',
  },
  checkCoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D5222B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    marginHorizontal: 4,
    gap: 12,
  },
  checkCoverButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
