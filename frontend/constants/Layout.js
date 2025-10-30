import { Dimensions } from 'react-native';

// NOTE: This file previously exported a Spacing constant which now conflicts
// with the dedicated spacing scale defined in `constants/Spacing.js`.
// To avoid duplicate re-exports (`export *`) causing a non-configurable
// property definition error in Hermes, the Spacing export here has been removed.

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
};

// (Deprecated) If any legacy code imported { Spacing } from 'constants/Layout',
// it should now import { Spacing } directly from 'constants/Spacing'. To aid
// migration without breaking, you may optionally create a soft alias like:
//   export { Spacing as LegacyLayoutSpacing } from './Spacing';
// For now we omit the re-export to surface any outdated imports during build.

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};
