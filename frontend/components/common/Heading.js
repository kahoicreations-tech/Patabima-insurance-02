import React from 'react';
import { Text as RNText } from 'react-native';
import { TEXT_PRESETS } from '../../theme/typography';

const Heading = ({ level = 1, color, style, children, ...props }) => {
  const key = `h${level}`;
  const preset = TEXT_PRESETS[key] || TEXT_PRESETS.h1;
  return (
    <RNText style={[preset, color && { color }, style]} {...props}>
      {children}
    </RNText>
  );
};

export default Heading;
