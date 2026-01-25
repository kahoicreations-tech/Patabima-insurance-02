/**
 * CurrencyInput - Formatted currency input with validation
 * Auto-formats with commas (1,500,000)
 * Parses to number for validation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { formatCurrency, parseCurrency } from '../utils/motor3Validation';
import { moderateScale } from '../utils/responsive';

const CurrencyInput = React.memo(
  ({
    value,
    onValueChange,
    label,
    placeholder = 'Enter amount',
    required = false,
    error = null,
    minValue,
    maxValue,
    testID,
  }) => {
    // Local state for formatted display
    const [localValue, setLocalValue] = useState(formatCurrency(value || 0));
    const timeoutRef = useRef(null);

    // Sync with prop changes
    useEffect(() => {
      const formatted = formatCurrency(value || 0);
      if (formatted !== localValue) {
        setLocalValue(formatted);
      }
    }, [value]);

    // Handle text change with formatting
    const handleChange = useCallback(
      (text) => {
        // Remove non-numeric characters except decimal point
        const cleaned = text.replace(/[^0-9.]/g, '');

        // Format with commas for display
        const formatted = formatCurrency(cleaned);
        setLocalValue(formatted);

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Debounce parent notification (400ms)
        timeoutRef.current = setTimeout(() => {
          const numericValue = parseCurrency(cleaned);
          onValueChange(numericValue);
        }, 400);
      },
      [onValueChange]
    );

    // Cleanup
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <View style={[styles.inputContainer, error && styles.inputContainerError]}>
          <Text style={styles.prefix}>KSh</Text>
          <TextInput
            value={localValue}
            onChangeText={handleChange}
            placeholder={placeholder}
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="numeric"
            returnKeyType="next"
            blurOnSubmit={false}
            testID={testID}
          />
        </View>
        {minValue && (
          <Text style={styles.helperText}>
            Minimum: KSh {formatCurrency(minValue)}
          </Text>
        )}
        {maxValue && (
          <Text style={styles.helperText}>
            Maximum: KSh {formatCurrency(maxValue)}
          </Text>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.label === nextProps.label &&
      prevProps.required === nextProps.required
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(10),
  },
  label: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins-Medium',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  required: {
    color: '#D5222B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: moderateScale(40),
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#FFF',
  },
  inputContainerError: {
    borderColor: '#D5222B',
  },
  prefix: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginRight: moderateScale(8),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    padding: 0,
  },
  helperText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: moderateScale(4),
  },
  errorText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#D5222B',
    marginTop: moderateScale(4),
  },
});

export default CurrencyInput;
