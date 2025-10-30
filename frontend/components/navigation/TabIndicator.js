import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';

const TabIndicator = ({ 
  isActive, 
  label, 
  icon, 
  showDot = true,
  simplifiedStyle = true 
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
        <Text style={[
          styles.icon, 
          isActive ? styles.iconActive : styles.iconInactive
        ]}>
          {icon}
        </Text>
        {isActive && showDot && <View style={styles.activeDot} />}
      </View>
      <Text style={[
        styles.label, 
        isActive ? styles.labelActive : styles.labelInactive
      ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    paddingVertical: Spacing.xs,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs / 2,
  },
  iconContainerActive: {
    // Subtle elevation for active state
  },
  icon: {
    fontSize: 22,
    textAlign: 'center',
  },
  iconActive: {
    color: Colors.primary,
  },
  iconInactive: {
    color: Colors.textSecondary,
    opacity: 0.8,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  labelInactive: {
    color: Colors.textSecondary,
  },
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});

export default TabIndicator;
