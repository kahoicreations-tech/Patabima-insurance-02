// Spacing and radius tokens (4px grid)

export const SPACING = Object.freeze({
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
});

export const BORDER_RADIUS = Object.freeze({
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
});

export const BORDER_WIDTH = Object.freeze({
  thin: 1,
  medium: 2,
  thick: 3,
});

export const SAFE_AREA = Object.freeze({
  top: 16,
  bottom: 20,
  horizontal: 16,
});

const spacing = { SPACING, BORDER_RADIUS, BORDER_WIDTH, SAFE_AREA };
export default spacing;
