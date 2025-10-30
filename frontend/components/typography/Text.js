import React from 'react';
import { Text as RNText } from 'react-native';
import { Typography, Colors } from '../../constants';

/**
 * Base Text Component with variant support
 * @param {string} variant - Typography variant (h1-h6, body1-2, subtitle1-2, caption, overline, button, etc.)
 * @param {string} color - Optional text color override
 * @param {object} style - Additional styles
 */
export const Text = ({ 
  variant = 'body1', 
  color, 
  style, 
  children,
  ...props 
}) => {
  const textStyle = Typography.styles[variant] || Typography.styles.body1;
  
  return (
    <RNText
      style={[
        textStyle,
        color && { color },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

// Specialized Header Components
export const Heading1 = ({ children, style, color, ...props }) => (
  <Text variant="h1" style={style} color={color} {...props}>{children}</Text>
);

export const Heading2 = ({ children, style, color, ...props }) => (
  <Text variant="h2" style={style} color={color} {...props}>{children}</Text>
);

export const Heading3 = ({ children, style, color, ...props }) => (
  <Text variant="h3" style={style} color={color} {...props}>{children}</Text>
);

export const Heading4 = ({ children, style, color, ...props }) => (
  <Text variant="h4" style={style} color={color} {...props}>{children}</Text>
);

export const Heading5 = ({ children, style, color, ...props }) => (
  <Text variant="h5" style={style} color={color} {...props}>{children}</Text>
);

export const Heading6 = ({ children, style, color, ...props }) => (
  <Text variant="h6" style={style} color={color} {...props}>{children}</Text>
);

// Body Text Components
export const Body1 = ({ children, style, color, ...props }) => (
  <Text variant="body1" style={style} color={color} {...props}>{children}</Text>
);

export const Body2 = ({ children, style, color, ...props }) => (
  <Text variant="body2" style={style} color={color} {...props}>{children}</Text>
);

// Subtitle Components
export const Subtitle1 = ({ children, style, color, ...props }) => (
  <Text variant="subtitle1" style={style} color={color} {...props}>{children}</Text>
);

export const Subtitle2 = ({ children, style, color, ...props }) => (
  <Text variant="subtitle2" style={style} color={color} {...props}>{children}</Text>
);

// Caption and Overline
export const Caption = ({ children, style, color, ...props }) => (
  <Text variant="caption" style={style} color={color} {...props}>{children}</Text>
);

export const Overline = ({ children, style, color, ...props }) => (
  <Text variant="overline" style={style} color={color} {...props}>{children}</Text>
);

// Button Text (for use inside TouchableOpacity/Pressable)
export const ButtonText = ({ children, style, color, size = 'medium', ...props }) => {
  const variant = size === 'small' ? 'buttonSmall' : size === 'large' ? 'buttonLarge' : 'button';
  return <Text variant={variant} style={style} color={color} {...props}>{children}</Text>;
};

// Input Text Components
export const InputText = ({ children, style, color, ...props }) => (
  <Text variant="input" style={style} color={color} {...props}>{children}</Text>
);

export const InputLabel = ({ children, style, color, ...props }) => (
  <Text variant="inputLabel" style={style} color={color} {...props}>{children}</Text>
);

export const InputHelper = ({ children, style, color, ...props }) => (
  <Text variant="inputHelper" style={style} color={color} {...props}>{children}</Text>
);

export const InputError = ({ children, style, color, ...props }) => (
  <Text variant="inputError" style={style} color={color} {...props}>{children}</Text>
);
