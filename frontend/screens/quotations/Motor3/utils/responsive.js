/**
 * Responsive Scaling Utilities for Motor3
 * Based on react-native-size-matters approach
 * Base dimensions: iPhone 8 (375 x 667)
 */

import { Dimensions, PixelRatio } from 'react-native';
import { SPACING, FONT_SIZES } from '../../../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen (iPhone 8)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 667;

/**
 * Scale size based on screen width
 * @param {number} size - Base size to scale
 * @returns {number} - Scaled size
 */
export const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scale size based on screen height
 * @param {number} size - Base size to scale
 * @returns {number} - Scaled size
 */
export const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scale - doesn't scale linearly
 * Good for padding, margins, font sizes
 * @param {number} size - Base size to scale
 * @param {number} factor - Resize factor (default 0.5)
 * @returns {number} - Moderately scaled size
 */
// NOTE: Motor3 now aligns with the global app theme (main) which uses
// fixed spacing + typography tokens. We keep the API surface for backwards
// compatibility but avoid device-dependent scaling that causes non-uniform UI.
export const moderateScale = (size) => size;

/**
 * Moderate vertical scale
 * @param {number} size - Base size to scale
 * @param {number} factor - Resize factor (default 0.5)
 * @returns {number} - Moderately scaled size
 */
export const moderateVerticalScale = (size) => size;

/**
 * Round to nearest pixel
 * @param {number} size - Size to round
 * @returns {number} - Rounded size
 */
export const roundToPixel = (size) => {
  return PixelRatio.roundToNearestPixel(size);
};

// Shorthand aliases
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;

/**
 * Responsive Spacing Object
 * Use these for consistent spacing across all screen sizes
 */
export const ResponsiveSpacing = {
  xs: SPACING.xs,
  sm: SPACING.sm,
  md: SPACING.lg,
  lg: SPACING.xxl,
  xl: SPACING.xxxl,
  xxl: SPACING.huge,
};

/**
 * Responsive Font Sizes
 * Based on Typography scale but responsive
 */
export const ResponsiveFontSize = {
  xs: FONT_SIZES.bodySmall,
  sm: FONT_SIZES.bodyLarge,
  md: FONT_SIZES.h3,
  lg: FONT_SIZES.h2,
  xl: FONT_SIZES.h1,
  // Back-compat helpers used by older Motor3 screens
  title: FONT_SIZES.h3,
  body: FONT_SIZES.body,
};

/**
 * Get responsive dimensions
 * @returns {object} - Screen dimensions with device info
 */
export const getResponsiveDimensions = () => {
  const pixelRatio = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();
  
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    pixelRatio,
    fontScale,
    isSmallDevice: SCREEN_WIDTH < 375,
    isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
    isLargeDevice: SCREEN_WIDTH >= 414,
    isTablet: SCREEN_WIDTH >= 768,
  };
};

/**
 * Get device-specific spacing multiplier
 * @returns {number} - Spacing multiplier
 */
export const getSpacingMultiplier = () => {
  const { isSmallDevice, isTablet } = getResponsiveDimensions();
  
  if (isSmallDevice) return 0.85; // 15% reduction for small devices
  if (isTablet) return 1.3; // 30% increase for tablets
  return 1; // Standard for medium/large phones
};

export default {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  roundToPixel,
  s,
  vs,
  ms,
  mvs,
  ResponsiveSpacing,
  ResponsiveFontSize,
  getResponsiveDimensions,
  getSpacingMultiplier,
};
