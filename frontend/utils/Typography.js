import { Platform } from 'react-native';

// Font fallback system for cross-platform compatibility
export const FontWeights = {
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'Arial'
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'Arial'
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'Arial'
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'Arial'
  })
};

// Font mapping for existing Poppins references
export const FontMapping = {
  'Poppins_400Regular': FontWeights.regular,
  'Poppins_500Medium': FontWeights.medium,
  'Poppins_600SemiBold': FontWeights.semibold,
  'Poppins_700Bold': FontWeights.bold,
};

// Helper function to get platform-appropriate font
export const getFont = (fontName) => {
  return FontMapping[fontName] || FontWeights.regular;
};

// Typography styles with PataBima brand consistency
export const Typography = {
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FontWeights.bold,
    color: '#646767',
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FontWeights.semibold,
    color: '#646767',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FontWeights.semibold,
    color: '#646767',
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: FontWeights.regular,
    color: '#646767',
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FontWeights.regular,
    color: '#646767',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: FontWeights.regular,
    color: '#646767',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FontWeights.semibold,
    color: '#FFFFFF',
  }
};

export default Typography;