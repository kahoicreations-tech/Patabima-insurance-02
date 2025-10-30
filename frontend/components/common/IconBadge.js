import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants';

const iconMap = {
  // Insurance Categories
  motor: '🚗',
  medical: '🏥',
  wiba: '👷',
  lastExpense: '⚰️',
  travel: '✈️',
  personalAccident: '🛡️',
  professional: '💼',
  domestic: '🏠',
  
  // Status Icons
  pending: '⏳',
  processed: '✅',
  active: '🟢',
  expired: '🔴',
  draft: '📝',
  paid: '💰',
  
  // Action Icons
  add: '➕',
  edit: '✏️',
  delete: '🗑️',
  share: '📤',
  download: '⬇️',
  search: '🔍',
  filter: '🔽',
  calendar: '📅',
  notification: '🔔',
  
  // Stats Icons
  sales: '💼',
  commission: '💰',
  target: '🎯',
  growth: '📈',
  decline: '📉',
  
  // General
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  error: '❌',
  phone: '📞',
  email: '📧',
  location: '📍',
};

export default function IconBadge({ 
  icon, 
  size = 'medium', 
  variant = 'default',
  backgroundColor,
  style 
}) {
  const iconSizes = {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 40
  };

  const containerSizes = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 80
  };

  const iconEmoji = iconMap[icon] || icon;
  const iconSize = iconSizes[size];
  const containerSize = containerSizes[size];

  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    
    switch (variant) {
      case 'primary': return Colors.primary;
      case 'success': return Colors.success;
      case 'warning': return Colors.warning;
      case 'info': return Colors.info;
      case 'light': return Colors.lightGray;
      default: return Colors.background;
    }
  };

  return (
    <View style={[
      styles.container,
      {
        width: containerSize,
        height: containerSize,
        backgroundColor: getBackgroundColor(),
        borderRadius: containerSize / 2,
      },
      style
    ]}>
      <Text style={[styles.icon, { fontSize: iconSize }]}>
        {iconEmoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    textAlign: 'center',
  },
});
