import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../../constants';

const Card = ({
  children,
  style,
  onPress,
  activeOpacity = 0.8,
  padding = 'medium',
  shadow = true,
  ...props
}) => {
  const Component = onPress ? TouchableOpacity : View;
  
  const getCardStyle = () => {
    const baseStyle = [styles.card, styles[`${padding}Padding`]];
    
    if (shadow) {
      baseStyle.push(styles.shadow);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  return (
    <Component
      style={getCardStyle()}
      onPress={onPress}
      activeOpacity={activeOpacity}
      {...props}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  
  // Padding variants
  smallPadding: {
    padding: Spacing.sm,
  },
  mediumPadding: {
    padding: Spacing.lg,
  },
  largePadding: {
    padding: Spacing.xl,
  },
  
  // Shadow
  shadow: {
    shadowColor: Colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default Card;
