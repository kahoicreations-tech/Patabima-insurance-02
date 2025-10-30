// Font Consistency Helper for PataBima App
// This ensures consistent typography across all screens

import { Typography } from '../constants';

export const FONT_STYLES = {
  // Main screen titles
  screenTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: Typography.lineHeight.xl
  },
  
  // Section headers
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: Typography.lineHeight.lg
  },
  
  // Card titles
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    lineHeight: Typography.lineHeight.md
  },
  
  // Subtitle text
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.lineHeight.sm
  },
  
  // Body text
  bodyText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.lineHeight.sm
  },
  
  // Secondary/caption text
  caption: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.lineHeight.xs
  },
  
  // Labels
  label: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.lineHeight.xs
  },
  
  // Values/Numbers
  value: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: Typography.lineHeight.md
  },
  
  // Large values (stats, counts)
  largeValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: Typography.lineHeight.xl
  },
  
  // Status badges
  statusBadge: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    lineHeight: Typography.lineHeight.xs
  },
  
  // Button text
  buttonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    lineHeight: Typography.lineHeight.sm
  },
  
  // Small button text
  smallButtonText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.lineHeight.xs
  }
};

// Icon sizes for consistency
export const ICON_SIZES = {
  small: Typography.fontSize.md,    // 16px
  medium: Typography.fontSize.lg,   // 20px
  large: Typography.fontSize.xl,    // 24px
  xlarge: Typography.fontSize.xxl   // 32px
};

// Performance metrics styling
export const PERFORMANCE_STYLES = {
  trend: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    lineHeight: Typography.lineHeight.xs
  }
};

// Usage examples:
// import { FONT_STYLES, ICON_SIZES } from '../utils/fontStyles';
// 
// const styles = StyleSheet.create({
//   title: {
//     ...FONT_STYLES.sectionTitle,
//     color: Colors.textPrimary
//   },
//   icon: {
//     fontSize: ICON_SIZES.medium
//   }
// });
