import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

export default function UnderwriterComparisonView({ items = [], onSelect, showDetailed = true }) {
  const renderItem = ({ item }) => {
    const total = item.total_premium || item.totalPremium || item.total || item.premium || 0;
    const name = item.name || item.company || `Underwriter ${item.underwriter_code || item.underwriter_id}`;
    
    if (showDetailed) {
      return (
        <TouchableOpacity style={styles.detailedCard} onPress={() => onSelect?.(item)}>
          <View style={styles.cardHeader}>
            <Text style={styles.underwriterName}>{name}</Text>
            {item.market_position && (
              <View style={[
                styles.positionBadge,
                item.market_position?.toLowerCase() === 'budget' && styles.budgetBadge,
                item.market_position?.toLowerCase() === 'competitive' && styles.competitiveBadge,
                item.market_position?.toLowerCase() === 'premium' && styles.premiumBadge,
              ]}>
                <Text style={[
                  styles.positionText,
                  item.market_position?.toLowerCase() === 'budget' && styles.budgetText,
                  item.market_position?.toLowerCase() === 'competitive' && styles.competitiveText,
                  item.market_position?.toLowerCase() === 'premium' && styles.premiumText,
                ]}>
                  {item.market_position}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.price}>KSh {total.toLocaleString()}</Text>
          
          <View style={styles.cardFooter}>
            {item.rating && (
              <Text style={styles.rating}>Rating: {item.rating}★</Text>
            )}
            {item.savings && item.savings !== 0 && (
              <Text style={[styles.savings, item.savings > 0 ? styles.savingsPositive : styles.savingsNegative]}>
                {item.savings > 0 ? 'Save' : 'Extra'} KSh {Math.abs(item.savings).toLocaleString()}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    // Simple row for basic display
    return (
      <TouchableOpacity style={styles.row} onPress={() => onSelect?.(item)}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.price}>KSh {total.toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item, idx) => String(item.id || item.underwriter_id || idx)}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  // Simple row styles (backward compatibility)
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  name: { 
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: 16,
  },
  price: { 
    fontWeight: 'bold',
    color: '#D5222B',
    fontSize: 16,
  },
  
  // Detailed card styles
  detailedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  underwriterName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  budgetBadge: {
    backgroundColor: '#e8f5e8',
  },
  competitiveBadge: {
    backgroundColor: '#e3f2fd',
  },
  premiumBadge: {
    backgroundColor: '#fff3e0',
  },
  positionText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  budgetText: {
    color: '#2e7d32',
  },
  competitiveText: {
    color: '#1565c0',
  },
  premiumText: {
    color: '#ef6c00',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    fontSize: 14,
    color: '#646767',
    fontWeight: '500',
  },
  savings: {
    fontSize: 14,
    fontWeight: '600',
  },
  savingsPositive: {
    color: '#2e7d32',
  },
  savingsNegative: {
    color: '#d32f2f',
  },
  separator: {
    height: 12,
  },
});
