import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  onPress, 
  color = Colors.primary,
  trend,
  trendDirection = 'up'
}) {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component 
      style={[styles.container, onPress && styles.touchable]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
            <Text style={[styles.icon, { color }]}>{icon}</Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {trend && (
            <View style={styles.trendContainer}>
              <Text style={[
                styles.trend, 
                { color: trendDirection === 'up' ? Colors.success : Colors.error }
              ]}>
                {trendDirection === 'up' ? '↗' : '↘'} {trend}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <Text style={[styles.value, { color }]}>{value}</Text>
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  touchable: {
    transform: [{ scale: 1 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  trendContainer: {
    marginTop: Spacing.xs,
  },
  trend: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    lineHeight: Typography.lineHeight.xs,
  },
  value: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: Typography.lineHeight.xxl,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs,
  },
});
