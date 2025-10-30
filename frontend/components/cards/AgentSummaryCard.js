import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';
import Card from '../common/Card';

const AgentSummaryCard = ({
  agentCode,
  nextPayout,
  commission,
  sales,
  production,
  onPress,
  style
}) => {
  const formatCurrency = (amount) => {
    return `KES ${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <Card
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.agentInfo}>
          <Text style={styles.agentCode}>Agent Code: {agentCode}</Text>
          <Text style={styles.nextPayout}>Next Payout: {nextPayout}</Text>
        </View>
        <View style={styles.agentActions}>
          <View style={styles.agentIconContainer}>
            <Text style={styles.agentIcon}>👤</Text>
          </View>
          <Text style={styles.viewAccountText}>View Account →</Text>
        </View>
      </View>
      
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatCurrency(commission)}</Text>
          <Text style={styles.summaryLabel}>Commission</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatCurrency(sales)}</Text>
          <Text style={styles.summaryLabel}>Sales</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatCurrency(production)}</Text>
          <Text style={styles.summaryLabel}>Production</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  agentInfo: {
    flex: 1,
  },
  agentCode: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.md,
  },
  nextPayout: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  agentActions: {
    alignItems: 'center',
  },
  agentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  agentIcon: {
    fontSize: 20,
  },
  viewAccountText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    lineHeight: Typography.lineHeight.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.lg,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.xs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderColor,
    marginHorizontal: Spacing.sm,
  },
});

export default AgentSummaryCard;
