import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`${variant}Button`], styles[`${size}Button`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${variant}Text`], styles[`${size}Text`]];
    
    if (textStyle) {
      baseStyle.push(textStyle);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.background : Colors.primary}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Button variants
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderColor: Colors.primary,
    shadowColor: Colors.borderColor,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: Colors.primary,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 2,
  },
  
  // Button sizes
  smallButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  mediumButton: {
    paddingVertical: Spacing.lg + 4,
    paddingHorizontal: Spacing.xl,
  },
  largeButton: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl + 8,
  },
  
  // Disabled state
  disabledButton: {
    opacity: 0.6,
  },
  
  // Text styles
  buttonText: {
    fontFamily: Typography.fontFamily.bold,
  },
  
  // Text variants
  primaryText: {
    color: Colors.background,
  },
  secondaryText: {
    color: Colors.primary,
  },
  outlineText: {
    color: Colors.primary,
  },
  
  // Text sizes
  smallText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.sm,
  },
  mediumText: {
    fontSize: Typography.fontSize.lg,
    lineHeight: Typography.lineHeight.lg,
  },
  largeText: {
    fontSize: Typography.fontSize.xl,
    lineHeight: Typography.lineHeight.xl,
  },
});

export default Button;
