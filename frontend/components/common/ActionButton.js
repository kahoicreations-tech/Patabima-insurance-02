import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';

export default function ActionButton({ 
  title, 
  onPress, 
  icon, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  style,
  ...props 
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: Colors.backgroundSecondary,
          borderColor: Colors.border,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: Colors.primary,
          borderWidth: 2,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: Colors.primary,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return Colors.textPrimary;
      case 'outline':
        return Colors.primary;
      case 'ghost':
        return Colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          minHeight: 36,
        };
      case 'large':
        return {
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.lg,
          minHeight: 56,
        };
      default:
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          minHeight: 48,
        };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.content}>
        {icon && <Text style={[styles.icon, { color: getTextColor() }]}>{icon}</Text>}
        <Text style={[styles.title, { color: getTextColor() }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    lineHeight: Typography.lineHeight.md,
  },
  disabled: {
    opacity: 0.5,
  },
});
