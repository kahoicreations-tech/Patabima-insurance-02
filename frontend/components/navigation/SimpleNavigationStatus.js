import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';

/**
 * SimpleNavigationStatus - Visual indicator for our simplified 4-tab navigation
 * Shows: Home | Quotes | Claims | Account
 */
const SimpleNavigationStatus = ({ currentTab = 'Home' }) => {
  const tabs = [
    { id: 'Home', icon: '🏠', label: 'Home' },
    { id: 'Quotes', icon: '📋', label: 'Quotes' },
    { id: 'Claims', icon: '🔍', label: 'Claims' },
    { id: 'Account', icon: '👤', label: 'Account' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navigation Structure</Text>
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <View key={tab.id} style={styles.tabItem}>
            <View style={[
              styles.tabDot,
              currentTab === tab.id && styles.tabDotActive
            ]}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
            </View>
            <Text style={[
              styles.tabLabel,
              currentTab === tab.id && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
            {index < tabs.length - 1 && <Text style={styles.separator}>|</Text>}
          </View>
        ))}
      </View>
      <Text style={styles.subtitle}>Simplified 4-Tab Layout</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    margin: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  tabDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs / 2,
  },
  tabDotActive: {
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  separator: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xs,
    marginTop: -20,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default SimpleNavigationStatus;
