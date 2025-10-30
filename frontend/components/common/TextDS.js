import React from 'react';
import { Text as RNText } from 'react-native';
import { TEXT_PRESETS } from '../../theme/typography';

// Design-system Text component (non-breaking; co-exists with existing Typography wrappers)
const TextDS = ({ variant = 'body', color, style, children, ...props }) => {
  const preset = TEXT_PRESETS[variant] || TEXT_PRESETS.body;
  return (
    <RNText style={[preset, color && { color }, style]} {...props}>
      {children}
    </RNText>
  );
};

export default TextDS;
