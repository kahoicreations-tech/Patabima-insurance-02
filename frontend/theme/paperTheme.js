import { MD3LightTheme as BaseTheme } from 'react-native-paper';
import { BRAND, SEMANTIC, UI } from './index';

export const paperTheme = {
  ...BaseTheme,
  roundness: 12,
  colors: {
    ...BaseTheme.colors,
    primary: BRAND.primary,
    secondary: BRAND.secondary,
    background: UI.background,
    surface: UI.surface,
    error: SEMANTIC.error,
  },
};

export default paperTheme;
