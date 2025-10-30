import { Platform } from 'react-native';
import { FONT_SIZES, FONT_WEIGHTS, TEXT_PRESETS } from '../theme';

// Using system fonts for now (Poppins can be added later)
// When Poppins fonts are added, update these to: 'Poppins_400Regular', etc.
// Prefer Roboto on Android (system-available), System on iOS
const SYSTEM_FONT_REGULAR = Platform.OS === 'ios' ? 'System' : 'Roboto';
const SYSTEM_FONT_MEDIUM = Platform.OS === 'ios' ? 'System' : 'Roboto-Medium';
const SYSTEM_FONT_SEMIBOLD = Platform.OS === 'ios' ? 'System' : 'Roboto-Medium';
const SYSTEM_FONT_BOLD = Platform.OS === 'ios' ? 'System' : 'Roboto-Bold';

export const Typography = {
  // Font families - Using system fonts (Poppins disabled for now)
  // To enable Poppins: See ADDING_POPPINS_FONTS.md
  fontFamily: {
    regular: SYSTEM_FONT_REGULAR,
    medium: SYSTEM_FONT_MEDIUM,
    semiBold: SYSTEM_FONT_SEMIBOLD,
    bold: SYSTEM_FONT_BOLD,
  },
  
  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  // Font sizes - Mobile optimized
  fontSize: {
    xs: FONT_SIZES.bodySmall,
    sm: FONT_SIZES.body,
    md: FONT_SIZES.bodyLarge,
    lg: FONT_SIZES.h3,
    xl: FONT_SIZES.h2,
    xxl: FONT_SIZES.h1,
    xxxl: 28,
    xxxxl: 32,
  },
  
  // Font sizes - using full names for compatibility (DEPRECATED)
  fontSizes: {
    small: 12,
    medium: 14,
    large: 18,
    xlarge: 24,
    xxlarge: 32,
  },
  
  // Additional size property for legacy support (DEPRECATED)
  size: {
    small: 12,
    medium: 14,
    large: 18,
    xlarge: 24,
    xxlarge: 32,
  },
  
  // Line heights - Optimal readability
  lineHeight: {
    xs: Math.round(FONT_SIZES.bodySmall * 1.33),
    sm: Math.round(FONT_SIZES.body * 1.43),
    md: Math.round(FONT_SIZES.bodyLarge * 1.375),
    lg: Math.round(FONT_SIZES.h3 * 1.44),
    xl: Math.round(FONT_SIZES.h2 * 1.4),
    xxl: Math.round(FONT_SIZES.h1 * 1.33),
    xxxl: 36,
    xxxxl: 40,
  },
  
  // Pre-defined text styles - Using system fonts for now
  styles: {
    // Headers
    h1: { ...TEXT_PRESETS.h1 },
    h2: { ...TEXT_PRESETS.h2 },
    h3: { ...TEXT_PRESETS.h3 },
    // Bridge: map h4 to DS h2 to unify screen titles across quotation screens using Heading4
    h4: { ...TEXT_PRESETS.h2 },
    h5: {
      fontFamily: SYSTEM_FONT_SEMIBOLD,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: FONT_WEIGHTS.semibold,
      color: '#212121',
    },
    h6: {
      fontFamily: SYSTEM_FONT_SEMIBOLD,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: FONT_WEIGHTS.semibold,
      color: '#212121',
    },
    
    // Body text
    body1: {
      fontFamily: SYSTEM_FONT_REGULAR,
      fontSize: FONT_SIZES.bodyLarge,
      lineHeight: Math.round(FONT_SIZES.bodyLarge * 1.375),
      fontWeight: FONT_WEIGHTS.regular,
      color: '#212121',
    },
    body2: {
      fontFamily: SYSTEM_FONT_REGULAR,
      fontSize: FONT_SIZES.body,
      lineHeight: Math.round(FONT_SIZES.body * 1.43),
      fontWeight: FONT_WEIGHTS.regular,
      color: '#646767',
    },
    
    // Special text
    subtitle1: {
      fontFamily: SYSTEM_FONT_MEDIUM,
      fontSize: FONT_SIZES.bodyLarge,
      lineHeight: Math.round(FONT_SIZES.bodyLarge * 1.375),
      fontWeight: FONT_WEIGHTS.medium,
      color: '#212121',
    },
    subtitle2: {
      fontFamily: SYSTEM_FONT_MEDIUM,
      fontSize: FONT_SIZES.body,
      lineHeight: Math.round(FONT_SIZES.body * 1.43),
      fontWeight: FONT_WEIGHTS.medium,
      color: '#646767',
    },
    caption: {
      fontFamily: SYSTEM_FONT_REGULAR,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      color: '#9E9E9E',
    },
    overline: {
      fontFamily: SYSTEM_FONT_SEMIBOLD,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: '#646767',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    
    // Button text
    button: {
      fontFamily: SYSTEM_FONT_SEMIBOLD,
      fontSize: FONT_SIZES.button,
      lineHeight: Math.round(FONT_SIZES.button * 1.375),
      fontWeight: FONT_WEIGHTS.semibold,
      textAlign: 'center',
    },
    buttonSmall: {
      fontFamily: SYSTEM_FONT_SEMIBOLD,
      fontSize: FONT_SIZES.buttonSmall,
      lineHeight: Math.round(FONT_SIZES.buttonSmall * 1.43),
      fontWeight: FONT_WEIGHTS.semibold,
      textAlign: 'center',
    },
    buttonLarge: {
      fontFamily: SYSTEM_FONT_SEMIBOLD,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: FONT_WEIGHTS.semibold,
      textAlign: 'center',
    },
    
    // Input text
    input: {
      fontFamily: SYSTEM_FONT_REGULAR,
      fontSize: FONT_SIZES.input,
      lineHeight: Math.round(FONT_SIZES.input * 1.375),
      fontWeight: FONT_WEIGHTS.regular,
      color: '#212121',
    },
    inputLabel: {
      fontFamily: SYSTEM_FONT_SEMIBOLD,
      fontSize: FONT_SIZES.label,
      lineHeight: Math.round(FONT_SIZES.label * 1.43),
      fontWeight: FONT_WEIGHTS.semibold,
      color: '#212121',
    },
    inputHelper: {
      fontFamily: SYSTEM_FONT_REGULAR,
      fontSize: FONT_SIZES.caption,
      lineHeight: Math.round(FONT_SIZES.caption * 1.33),
      fontWeight: FONT_WEIGHTS.regular,
      color: '#646767',
    },
    inputError: {
      fontFamily: SYSTEM_FONT_REGULAR,
      fontSize: FONT_SIZES.caption,
      lineHeight: Math.round(FONT_SIZES.caption * 1.33),
      fontWeight: FONT_WEIGHTS.regular,
      color: '#D5222B',
    },
  },
};
