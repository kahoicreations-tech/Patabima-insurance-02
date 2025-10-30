import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants';

export default function ModernCard({ 
  children, 
  style, 
  onPress, 
  variant = 'default',
  elevation = 'medium' 
}) {
  const cardStyles = [
    styles.card,
    styles[variant],
    styles[`elevation${elevation.charAt(0).toUpperCase() + elevation.slice(1)}`],
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles} 
        onPress={onPress}
        activeOpacity={0.95}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  
  // Card variants
  default: {
    borderWidth: 0,
  },
  
  primary: {
    backgroundColor: Colors.primary,
  },
  
  success: {
    backgroundColor: Colors.success,
  },
  
  warning: {
    backgroundColor: Colors.warning,
  },
  
  info: {
    backgroundColor: Colors.info,
  },
  
  outline: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },

  // Elevation levels
  elevationLow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  
  elevationMedium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  
  elevationHigh: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 10,
  },
});
