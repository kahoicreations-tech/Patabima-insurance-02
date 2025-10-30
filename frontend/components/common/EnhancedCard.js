import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';

export default function EnhancedCard({ 
  children, 
  style, 
  onPress, 
  elevated = true, 
  gradient = false,
  padding = Spacing.lg,
  borderRadius = 16,
  ...props 
}) {
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const AnimatedView = Animated.createAnimatedComponent(View);
  
  const Component = onPress ? AnimatedTouchable : AnimatedView;
  
  const cardStyles = [
    styles.card,
    {
      padding,
      borderRadius,
      backgroundColor: gradient ? 'transparent' : Colors.backgroundCard,
    },
    elevated && styles.elevated,
    style
  ];

  if (gradient) {
    return (
      <Component style={cardStyles} onPress={onPress} activeOpacity={0.95} {...props}>
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={[StyleSheet.absoluteFillObject, { borderRadius }]}
        />
        {children}
      </Component>
    );
  }

  return (
    <Component style={cardStyles} onPress={onPress} activeOpacity={0.95} {...props}>
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  elevated: {
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
});
