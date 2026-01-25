/**
 * RadioGroup - Performance-optimized radio button group
 * Static options (useMemo) and stable handlers (useCallback)
 * PataBima styling with red selection indicator
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale } from '../utils/responsive';

const RadioGroup = React.memo(
  ({
    label,
    options, // Array of { value, label } objects
    value,
    onValueChange,
    required = false,
    error = null,
    horizontal = false,
    testID,
  }) => {
    // Memoize options to prevent recreation
    const stableOptions = useMemo(() => options, [JSON.stringify(options)]);

    // Stable handler for option selection
    const handlePress = useCallback(
      (optionValue) => {
        onValueChange(optionValue);
      },
      [onValueChange]
    );

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <View
          style={[
            styles.optionsContainer,
            horizontal && styles.optionsContainerHorizontal,
          ]}
        >
          {stableOptions.map((option) => {
            const isSelected = value === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  horizontal && styles.optionHorizontal,
                  isSelected && styles.optionSelected,
                ]}
                onPress={() => handlePress(option.value)}
                activeOpacity={0.7}
                testID={testID ? `${testID}-${option.value}` : undefined}
              >
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparator: Only re-render if these props change
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.label === nextProps.label &&
      prevProps.required === nextProps.required &&
      prevProps.horizontal === nextProps.horizontal &&
      JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options)
      // Exclude onValueChange from comparison
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(10),
  },
  label: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#495057',
    marginBottom: moderateScale(4),
    fontFamily: 'Poppins-SemiBold',
  },
  required: {
    color: '#D5222B',
  },
  optionsContainer: {
    flexDirection: 'column',
    gap: moderateScale(8),
  },
  optionsContainerHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(12),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(4),
    backgroundColor: 'transparent',
    minHeight: moderateScale(36),
  },
  optionHorizontal: {
    flex: 1,
    minWidth: moderateScale(120),
  },
  optionSelected: {
    backgroundColor: 'transparent',
  },
  radioCircle: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 2,
    borderColor: '#CED4DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  radioCircleSelected: {
    borderColor: '#D5222B',
  },
  radioInner: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#D5222B',
  },
  optionLabel: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-Regular',
    color: '#495057',
  },
  optionLabelSelected: {
    fontFamily: 'Poppins-SemiBold',
    color: '#D5222B',
  },
  errorText: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins-Regular',
    color: '#D90429',
    marginTop: moderateScale(4),
  },
});

export default RadioGroup;
