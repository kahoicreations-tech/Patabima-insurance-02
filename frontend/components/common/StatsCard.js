import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography } from '../../constants';

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  trendValue,
  variant = 'default',
  style 
}) {
  const getTrendColor = () => {
    if (!trend) return Colors.textSecondary;
    return trend === 'up' ? Colors.success : Colors.error;
  };

  const getTrendIcon = () => {
    if (!trend) return '';
    return trend === 'up' ? '📈' : '📉';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.primary,
          titleColor: Colors.background,
          valueColor: Colors.background,
          subtitleColor: Colors.background,
        };
      case 'success':
        return {
          backgroundColor: Colors.success,
          titleColor: Colors.background,
          valueColor: Colors.background,
          subtitleColor: Colors.background,
        };
      case 'gradient':
        return {
          backgroundColor: Colors.primary,
          titleColor: Colors.background,
          valueColor: Colors.background,
          subtitleColor: Colors.background,
        };
      default:
        return {
          backgroundColor: Colors.background,
          titleColor: Colors.textSecondary,
          valueColor: Colors.textPrimary,
          subtitleColor: Colors.textSecondary,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[
      styles.container,
      { backgroundColor: variantStyles.backgroundColor },
      style
    ]}>
      {icon && (
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: variantStyles.titleColor }]}>
          {title}
        </Text>
        
        <Text style={[styles.value, { color: variantStyles.valueColor }]}>
          {value}
        </Text>
        
        {subtitle && (
          <Text style={[styles.subtitle, { color: variantStyles.subtitleColor }]}>
            {subtitle}
          </Text>
        )}
        
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  
  iconContainer: {
    marginRight: 16,
  },
  
  icon: {
    fontSize: 32,
  },
  
  content: {
    flex: 1,
  },
  
  title: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 4,
  },
  
  value: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 8,
  },
  
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  trendIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  
  trendText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
});
