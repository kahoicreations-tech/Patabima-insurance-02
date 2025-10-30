// Typography tokens for PataBima (using system fonts by default for consistency)
import { Platform } from 'react-native';

export const FONT_SIZES = Object.freeze({
  h1: 24,
  h2: 20,
  h3: 18,
  h4: 16,
  body: 14,
  bodyLarge: 16,
  bodySmall: 12,
  button: 16,
  buttonSmall: 14,
  input: 14,
  label: 14,
  caption: 12,
  badge: 12,
  tiny: 10,
});

export const FONT_WEIGHTS = Object.freeze({
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
});

export const LINE_HEIGHTS = Object.freeze({
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
});

export const LETTER_SPACING = Object.freeze({
  tight: -0.5,
  normal: 0,
  wide: 0.5,
});

// If Poppins not loaded, fall back to platform defaults
const SYS_REG = Platform.OS === 'ios' ? 'System' : 'sans-serif';
const SYS_MED = Platform.OS === 'ios' ? 'System' : 'sans-serif-medium';

// Use system fonts to avoid mismatches when custom fonts aren't loaded
export const FONT_FAMILIES = Object.freeze({
  regular: SYS_REG,
  medium: SYS_MED,
  semibold: SYS_MED,
  bold: SYS_MED,
});

// Common presets; defaults to system if Poppins missing.
export const TEXT_PRESETS = Object.freeze({
  h1: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: FONT_SIZES.h1,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: Math.round(FONT_SIZES.h1 * LINE_HEIGHTS.tight),
    color: '#2C3E50',
  },
  h2: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: Math.round(FONT_SIZES.h2 * LINE_HEIGHTS.tight),
    color: '#2C3E50',
  },
  h3: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: Math.round(FONT_SIZES.h3 * LINE_HEIGHTS.tight),
    color: '#2C3E50',
  },
  h4: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: Math.round(FONT_SIZES.h4 * LINE_HEIGHTS.tight),
    color: '#2C3E50',
  },
  body: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: Math.round(FONT_SIZES.body * LINE_HEIGHTS.normal),
    color: '#2C3E50',
  },
  bodyBold: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: Math.round(FONT_SIZES.body * LINE_HEIGHTS.normal),
    color: '#2C3E50',
  },
  caption: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: Math.round(FONT_SIZES.caption * LINE_HEIGHTS.normal),
    color: '#646767',
  },
});

const typography = { FONT_SIZES, FONT_WEIGHTS, LINE_HEIGHTS, LETTER_SPACING, FONT_FAMILIES, TEXT_PRESETS };
export default typography;
