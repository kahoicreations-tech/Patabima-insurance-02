import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SEMANTIC, UI } from '../../theme/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../theme/typography';
import { SPACING, BORDER_RADIUS } from '../../theme/spacing';

const Badge = ({ variant = 'default', children, style, textStyle, ...props }) => (
  <View style={[styles.badge, styles[variant], style]} {...props}>
    <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
      {children}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZES.badge,
    fontWeight: FONT_WEIGHTS.medium,
  },
  default: { backgroundColor: UI.border },
  defaultText: { color: UI.textSecondary },
  success: { backgroundColor: SEMANTIC.successLight },
  successText: { color: SEMANTIC.success },
  warning: { backgroundColor: SEMANTIC.warningLight },
  warningText: { color: '#856404' },
  error: { backgroundColor: SEMANTIC.errorLight },
  errorText: { color: SEMANTIC.error },
  info: { backgroundColor: SEMANTIC.infoLight },
  infoText: { color: SEMANTIC.info },
});

export default Badge;
