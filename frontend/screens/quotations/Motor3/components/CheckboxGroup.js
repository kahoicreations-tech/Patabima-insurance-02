/**
 * CheckboxGroup - Performance-optimized checkbox group
 * Multiple selection support with static options (useMemo)
 * PataBima styling with red selection indicator
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale } from '../utils/responsive';

const CheckboxGroup = React.memo(
  ({
    options = [],
    selectedValues = [],
    onValuesChange,
    label,
    required = false,
  }) => {
    // Ensure options are stable (should be passed as useMemo from parent)
    const stableOptions = useMemo(() => options, [JSON.stringify(options)]);

    const handleToggle = useCallback(
      (value) => {
        const newValues = selectedValues.includes(value)
          ? selectedValues.filter((v) => v !== value)
          : [...selectedValues, value];
        onValuesChange && onValuesChange(newValues);
      },
      [selectedValues, onValuesChange]
    );

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <View style={styles.optionsContainer}>
          {stableOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleToggle(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.checkbox}>
                  {isSelected && <View style={styles.checkboxInner} />}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if selectedValues or options change
    return (
      JSON.stringify(prevProps.selectedValues) === JSON.stringify(nextProps.selectedValues) &&
      JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options) &&
      prevProps.label === nextProps.label
    );
  }
);

CheckboxGroup.displayName = 'CheckboxGroup';

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(10),
  },
  label: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  required: {
    color: '#D5222B',
  },
  optionsContainer: {
    gap: moderateScale(6),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: moderateScale(10),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionSelected: {
    borderColor: '#D5222B',
    backgroundColor: '#FFF5F5',
  },
  checkbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(4),
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
    marginTop: moderateScale(2),
  },
  checkboxInner: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(2),
    backgroundColor: '#D5222B',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  optionTextSelected: {
    fontFamily: 'Poppins-SemiBold',
    color: '#D5222B',
  },
  optionDescription: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#646767',
    marginTop: moderateScale(2),
  },
});

export default CheckboxGroup;
