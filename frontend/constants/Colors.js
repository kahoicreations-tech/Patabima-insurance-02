import { BRAND, SEMANTIC, UI, STATUS } from '../theme';

// Legacy Colors mapping bridged to theme tokens
const Colors = {
  // Brand
  primary: BRAND.primary,
  primaryDark: BRAND.primaryDark,
  primaryLight: BRAND.primaryLight,

  // Secondary
  secondary: BRAND.secondary,
  secondaryLight: BRAND.secondaryLight,

  // Semantic
  success: SEMANTIC.success,
  warning: SEMANTIC.warning,
  error: SEMANTIC.error,
  info: SEMANTIC.info,

  // Extended palette (mapped to UI or reasonable defaults)
  lightGray: UI.background, // previously #F8F9FA
  mediumGray: UI.textTertiary, // previously #6C757D
  darkGray: '#343A40', // no direct token; keep constant

  // Text colors
  textPrimary: UI.textPrimary,
  textSecondary: UI.textSecondary,
  textLight: UI.textLight,
  textMuted: UI.textTertiary,

  // Backgrounds
  background: UI.surface,
  white: '#FFFFFF',
  backgroundGray: UI.background,
  backgroundLight: '#FAFAFA',
  backgroundLightBlue: '#E3F2FD', // not in tokens; keep as-is
  backgroundCard: UI.surface,
  backgroundSecondary: UI.background,

  // UI
  border: UI.border,
  borderLight: '#F1F3F4', // close to UI.divider
  divider: UI.divider,
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Tabs
  tabActive: BRAND.primary,
  tabInactive: '#9E9E9E',

  // Status
  statusPending: STATUS.pending || SEMANTIC.warning,
  statusProcessed: STATUS.active || SEMANTIC.success,
  statusActive: STATUS.completed || SEMANTIC.info,
  statusExpired: STATUS.rejected || SEMANTIC.error,
  statusDraft: UI.textTertiary,
  statusPaid: SEMANTIC.success,
};

export { Colors };
