// PataBima Brand and UI Colors (aligned with existing frontend/constants/Colors.js)
// DO NOT MODIFY hex values without design approval.

export const BRAND = Object.freeze({
  primary: '#D5222B',
  primaryDark: '#B01E26',
  primaryLight: '#F8E6E7',
  secondary: '#646767',
  secondaryLight: '#F0F0F0',
});

export const SEMANTIC = Object.freeze({
  success: '#28A745',
  successLight: '#D4EDDA',
  warning: '#FFC107',
  warningLight: '#FFF3CD',
  error: '#DC3545',
  errorLight: '#F8D7DA',
  info: '#17A2B8',
  infoLight: '#D1ECF1',
});

export const UI = Object.freeze({
  background: '#FFFFFF',
  surface: '#FFFFFF',
  backgroundGray: '#F5F5F5',
  backgroundLight: '#FAFAFA',
  border: '#E0E0E0',
  divider: '#EEEEEE',
  textPrimary: '#212121',
  textSecondary: '#646767',
  textTertiary: '#6C757D',
  textLight: '#9E9E9E',
  inputBackground: '#FFFFFF',
  inputBorder: '#E0E0E0',
  inputBorderFocus: '#D5222B',
  inputBorderError: '#DC3545',
});

export const STATUS = Object.freeze({
  active: '#28A745',
  pending: '#FFC107',
  rejected: '#DC3545',
  completed: '#17A2B8',
  draft: '#6C757D',
});

const colors = { BRAND, SEMANTIC, UI, STATUS };
export default colors;
