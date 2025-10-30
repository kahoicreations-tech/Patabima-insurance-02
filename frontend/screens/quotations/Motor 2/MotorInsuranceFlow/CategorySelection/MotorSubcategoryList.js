import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

/**
 * Professional Motor Subcategory List Component
 * Displays dynamic subcategories with product type badges and requirements
 * Now enhanced to display detailed cover type data from backend app_motorcovertype
 */
export default function MotorSubcategoryList({ items = [], onSelect, bottomPadding = 0 }) {
  const renderSubcategoryItem = ({ item }) => {
    // Determine complexity based on requirements or pricing model
    const isComplex = (item.pricing_model && item.pricing_model !== 'FIXED') || 
                     (item.requirements && item.requirements.length > 0);
    
    // Show base premium if available
    const hasBasePremium = item.base_premium && parseFloat(item.base_premium) > 0;
    
    // Show sum insured requirements
    const hasSumInsuredLimits = item.min_sum_insured || item.max_sum_insured;
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => onSelect?.(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>{item.name || item.subcategory_name}</Text>
        
        <View style={styles.badgesRow}>
          {/* Product Type Badge */}
          {(item.type || item.product_type) && (
            <Text style={styles.badge}>
              {item.type || item.product_type}
            </Text>
          )}
          
          {/* Pricing Model Badge */}
          {item.pricing_model && (
            <Text style={[styles.badge, styles.badgeInfo]}>
              {item.pricing_model}
            </Text>
          )}
          
          {/* Underwriter Pricing Available Badge */}
          {item.raw && (
            <Text style={[styles.badge, styles.badgeSuccess]}>
              Underwriter Pricing
            </Text>
          )}
        </View>
        
        {/* Base Premium Display */}
        {hasBasePremium && (
          <Text style={styles.premiumInfo}>
            💰 Base Premium: KSh {parseFloat(item.base_premium).toLocaleString()}
          </Text>
        )}
        
        {/* Sum Insured Limits */}
        {hasSumInsuredLimits && (
          <Text style={styles.sumInsuredInfo}>
            📊 Sum Insured: KSh {item.min_sum_insured ? parseFloat(item.min_sum_insured).toLocaleString() : '0'} - 
            KSh {item.max_sum_insured ? parseFloat(item.max_sum_insured).toLocaleString() : 'Unlimited'}
          </Text>
        )}
        
        {/* Special Requirements from MotorCoverType */}
        <View style={styles.requirementsSection}>
          {item.requires_tonnage && (
            <Text style={styles.requirement}>⚖️ Tonnage Required</Text>
          )}
          {item.requires_passenger_count && (
            <Text style={styles.requirement}>👥 Passenger Count</Text>
          )}
          {item.requires_vehicle_valuation && (
            <Text style={styles.requirement}>🏷️ Vehicle Valuation</Text>
          )}
        </View>
        
        {/* Requirements Display */}
        {item.requirements?.length > 0 && (
          <Text style={styles.requirements}>
            Requires: {Array.isArray(item.requirements) ? item.requirements.join(', ') : item.requirements}
          </Text>
        )}
        
        {/* Description */}
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        
        {/* Pricing Hint */}
        {item.pricing_model === 'FIXED' && (
          <Text style={styles.pricingHint}>💰 Fixed pricing with underwriter rates</Text>
        )}
        {item.pricing_model === 'BRACKET' && (
          <Text style={styles.pricingHint}>📊 Bracket-based pricing with underwriter comparison</Text>
        )}
        {item.pricing_model === 'TONNAGE' && (
          <Text style={styles.pricingHint}>⚖️ Tonnage-based pricing with underwriter rates</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        scrollEnabled={false}
        keyExtractor={(item, idx) => item.code || item.subcategory_code || item.id || String(idx)}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        renderItem={renderSubcategoryItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  separator: {
    height: 8,
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  title: { 
    fontSize: 16,
    fontWeight: '700', 
    color: '#2c3e50', 
    marginBottom: 8,
    lineHeight: 20,
  },
  badgesRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 6, 
    marginBottom: 8,
  },
  badge: { 
    backgroundColor: '#f1f3f5', 
    color: '#495057', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12, 
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  badgeOk: { 
    backgroundColor: '#e7f5ff', 
    color: '#1864ab',
  },
  badgeWarn: { 
    backgroundColor: '#fff4e6', 
    color: '#d9480f',
  },
  badgeInfo: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  badgeSuccess: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  premiumInfo: {
    color: '#D5222B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  sumInsuredInfo: {
    color: '#1976d2',
    fontSize: 12,
    marginBottom: 4,
  },
  requirementsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  requirement: {
    color: '#646767',
    fontSize: 11,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  requirements: { 
    color: '#646767', 
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 16,
  },
  description: {
    color: '#495057',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  pricingHint: {
    color: '#28a745',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
