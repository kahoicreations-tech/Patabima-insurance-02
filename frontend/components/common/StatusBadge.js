import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';

export default function StatusBadge({ 
  status, 
  variant = 'default',
  size = 'medium',
  customColor,
  style 
}) {
  const getStatusConfig = () => {
    const configs = {
      // Status-based colors
      active: { bg: Colors.success + '20', text: Colors.success, label: 'Active' },
      pending: { bg: Colors.warning + '20', text: Colors.warning, label: 'Pending' },
      overdue: { bg: Colors.error + '20', text: Colors.error, label: 'Overdue' },
      processed: { bg: Colors.success + '20', text: Colors.success, label: 'Processed' },
      draft: { bg: Colors.textSecondary + '20', text: Colors.textSecondary, label: 'Draft' },
      paid: { bg: Colors.primary + '20', text: Colors.primary, label: 'Paid' },
      'due soon': { bg: Colors.warning + '20', text: Colors.warning, label: 'Due Soon' },
      
      // Fallback
      default: { bg: Colors.backgroundSecondary, text: Colors.textSecondary, label: status }
    };

    const statusKey = status?.toLowerCase() || 'default';
    return configs[statusKey] || configs.default;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
          fontSize: Typography.fontSize.xs,
        };
      case 'large':
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          fontSize: Typography.fontSize.md,
        };
      default:
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
          fontSize: Typography.fontSize.sm,
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: customColor?.bg || config.bg,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: customColor?.text || config.text,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

export function InteractiveBadge({ 
  status, 
  onPress, 
  variant = 'default',
  size = 'medium',
  style 
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <StatusBadge 
        status={status} 
        variant={variant} 
        size={size} 
        style={style} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.lineHeight.sm,
    textAlign: 'center',
  },
});
