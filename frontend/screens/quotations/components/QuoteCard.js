import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography } from '../../../constants';

/**
 * Premium quote card component
 * @param {Object} premium - Premium calculation data
 * @param {boolean} isLoading - Whether premium is being calculated
 */
const QuoteCard = ({ premium, isLoading = false }) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Calculating your premium...</Text>
      </View>
    );
  }

  if (!premium) {
    return null;
  }

  const {
    basicPremium,
    levies,
    totalPremium,
    breakdown,
    vehicleType,
    coverType,
    insurer,
    factors
  } = premium;

  return (
    <View style={styles.quoteContainer}>
      <View style={styles.quoteHeader}>
        <Text style={styles.quoteTitle}>Insurance Quote</Text>
        <Text style={styles.quoteInsurer}>{insurer}</Text>
      </View>
      
      <View style={styles.quoteSummary}>
        <Text style={styles.coverTypeText}>{coverType}</Text>
        <Text style={styles.vehicleTypeText}>{vehicleType}</Text>
        <Text style={styles.totalPremiumLabel}>Total Premium</Text>
        <Text style={styles.totalPremiumValue}>
          KES {totalPremium.toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Premium Breakdown</Text>
        
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Basic Premium</Text>
          <Text style={styles.breakdownValue}>
            KES {basicPremium.toLocaleString()}
          </Text>
        </View>
        
        {breakdown && Object.entries(breakdown).map(([key, value]) => (
          <View key={key} style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </Text>
            <Text style={styles.breakdownValue}>
              KES {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
          </View>
        ))}
        
        <View style={styles.breakdownTotal}>
          <Text style={styles.breakdownTotalLabel}>Total Levies</Text>
          <Text style={styles.breakdownTotalValue}>
            KES {levies.toLocaleString()}
          </Text>
        </View>
      </View>
      
      {factors && (
        <View style={styles.factorsContainer}>
          <Text style={styles.factorsTitle}>Premium Factors</Text>
          
          {Object.entries(factors).map(([key, value]) => (
            <View key={key} style={styles.factorItem}>
              <Text style={styles.factorLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Text>
              <Text style={styles.factorValue}>{value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginVertical: 10,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginTop: 10,
  },
  quoteContainer: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteTitle: {
    ...Typography.headingSmall,
    color: Colors.textPrimary,
  },
  quoteInsurer: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  quoteSummary: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coverTypeText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  vehicleTypeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  totalPremiumLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  totalPremiumValue: {
    ...Typography.headingLarge,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  breakdownContainer: {
    marginBottom: 16,
  },
  breakdownTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  breakdownTotalLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  breakdownTotalValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  factorsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  factorsTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  factorLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  factorValue: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
});

export default QuoteCard;
