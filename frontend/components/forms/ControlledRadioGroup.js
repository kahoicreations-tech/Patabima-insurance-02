import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * ControlledRadioGroup - Memoized radio button group with stable handlers
 * 
 * @param {Object} props
 * @param {string} props.label - Group label
 * @param {boolean} props.required - Show required asterisk
 * @param {Array<string>} props.options - Array of option values
 * @param {string} props.value - Currently selected value
 * @param {Function} props.onChange - Stable change handler
 * @param {string} props.error - Validation error message
 */
const ControlledRadioGroup = memo(({
  label,
  required = false,
  options = [],
  value,
  onChange,
  error = null,
}) => {
  const handleOptionPress = useCallback((option) => {
    onChange(option);
  }, [onChange]);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={styles.radioContainer}>
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <TouchableOpacity
              key={String(option)}
              style={styles.radioOption}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioText, isSelected && styles.radioTextSelected]}>
                {String(option)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if value, error, or options array length changes
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.options.length === nextProps.options.length &&
    prevProps.label === nextProps.label
  );
});

ControlledRadioGroup.displayName = 'ControlledRadioGroup';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
    fontFamily: 'Poppins',
  },
  required: {
    color: '#DC2626',
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: '#D5222B',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D5222B',
  },
  radioText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins',
  },
  radioTextSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins',
  },
});

export default ControlledRadioGroup;
