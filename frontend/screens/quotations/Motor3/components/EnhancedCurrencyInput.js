/**
 * EnhancedCurrencyInput - Smart currency input with formatting
 * Improvements over basic CurrencyInput:
 * - Real-time thousand separators (KSh 1,000,000)
 * - Decimal support (optional)
 * - Min/max validation
 * - Bracket suggestions (for sum insured)
 * - Visual feedback for valid amounts
 * - Copy-paste handling
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from '../utils/responsive';

const EnhancedCurrencyInput = React.memo(
  ({
    value,
    onValueChange,
    label,
    placeholder = 'Enter amount',
    required = false,
    error = null,
    helpText = null,
    minValue = 0,
    maxValue = null,
    allowDecimals = false,
    suggestedAmounts = [], // Array of suggested amounts (e.g., common sum insured brackets)
    prefix = 'KSh ',
    editable = true,
    testID,
  }) => {
    // Local state for formatted display
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const timeoutRef = useRef(null);

    // Format number with thousand separators
    const formatCurrency = useCallback((num) => {
      if (!num && num !== 0) return '';
      
      const numStr = String(num);
      const parts = numStr.split('.');
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
      if (allowDecimals && parts.length > 1) {
        return `${integerPart}.${parts[1]}`;
      }
      
      return integerPart;
    }, [allowDecimals]);

    // Parse formatted string to number
    const parseValue = useCallback((str) => {
      if (!str) return null;
      
      // Remove commas and prefix
      const cleaned = str.replace(/,/g, '').replace(/^KSh\s?/, '');
      const parsed = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10);
      
      return isNaN(parsed) ? null : parsed;
    }, [allowDecimals]);

    // Initialize display value
    useEffect(() => {
      setDisplayValue(value ? formatCurrency(value) : '');
    }, [value, formatCurrency]);

    // Handle text change
    const handleChange = useCallback(
      (text) => {
        // Allow only numbers, commas, and optionally decimals
        const regex = allowDecimals ? /^[\d,]*\.?\d*$/ : /^[\d,]*$/;
        const cleanedText = text.replace(/^KSh\s?/, ''); // Remove prefix if pasted
        
        if (!regex.test(cleanedText) && cleanedText !== '') {
          return; // Reject invalid input
        }

        // Update display immediately
        setDisplayValue(cleanedText);

        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Debounce parent notification (300ms)
        timeoutRef.current = setTimeout(() => {
          const parsedValue = parseValue(cleanedText);
          
          // Validate min/max
          if (parsedValue !== null) {
            if (minValue !== null && parsedValue < minValue) {
              // Don't notify parent if below minimum
              return;
            }
            if (maxValue !== null && parsedValue > maxValue) {
              // Don't notify parent if above maximum
              return;
            }
          }

          onValueChange(parsedValue);
        }, 300);
      },
      [onValueChange, parseValue, allowDecimals, minValue, maxValue]
    );

    // Handle focus
    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    // Handle blur (apply formatting)
    const handleBlur = useCallback(() => {
      setIsFocused(false);
      
      // Reformat on blur
      const parsedValue = parseValue(displayValue);
      if (parsedValue !== null) {
        setDisplayValue(formatCurrency(parsedValue));
      }
    }, [displayValue, parseValue, formatCurrency]);

    // Handle suggested amount selection
    const handleSuggestion = useCallback(
      (amount) => {
        setDisplayValue(formatCurrency(amount));
        onValueChange(amount);
      },
      [formatCurrency, onValueChange]
    );

    // Cleanup timeout
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Validation status
    const isValid = value && value >= minValue && (!maxValue || value <= maxValue);

    return (
      <View style={styles.container}>
        {/* Label */}
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        {/* Input Container */}
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
            error && styles.inputContainerError,
            !editable && styles.inputContainerDisabled,
          ]}
        >
          <Text style={[styles.prefix, !editable && styles.prefixDisabled]}>
            {prefix}
          </Text>
          <TextInput
            value={displayValue}
            onChangeText={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor="#999"
            style={[styles.input, !editable && styles.inputDisabled]}
            keyboardType="numeric"
            returnKeyType="done"
            blurOnSubmit={false}
            editable={editable}
            testID={testID}
          />
          {isValid && (
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          )}
        </View>

        {/* Suggested Amounts */}
        {suggestedAmounts.length > 0 && !error && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Quick Select:</Text>
            <View style={styles.suggestions}>
              {suggestedAmounts.map((amount, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionChip,
                    value === amount && styles.suggestionChipActive,
                  ]}
                  onPress={() => handleSuggestion(amount)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      value === amount && styles.suggestionTextActive,
                    ]}
                  >
                    {formatCurrency(amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Range Info */}
        {!error && (minValue > 0 || maxValue) && (
          <Text style={styles.rangeText}>
            {minValue > 0 && maxValue
              ? `Range: ${formatCurrency(minValue)} - ${formatCurrency(maxValue)}`
              : minValue > 0
              ? `Minimum: ${formatCurrency(minValue)}`
              : `Maximum: ${formatCurrency(maxValue)}`}
          </Text>
        )}

        {/* Help Text */}
        {helpText && !error && <Text style={styles.helpText}>{helpText}</Text>}

        {/* Error Message */}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.editable === nextProps.editable &&
      JSON.stringify(prevProps.suggestedAmounts) ===
        JSON.stringify(nextProps.suggestedAmounts)
    );
  }
);

EnhancedCurrencyInput.displayName = 'EnhancedCurrencyInput';

export default EnhancedCurrencyInput;

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
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    minHeight: moderateScale(44),
  },
  inputContainerFocused: {
    borderColor: '#D5222B',
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: '#E53935',
  },
  inputContainerDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  prefix: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginRight: moderateScale(4),
  },
  prefixDisabled: {
    color: '#999',
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    paddingVertical: moderateScale(10),
  },
  inputDisabled: {
    color: '#999',
  },
  suggestionsContainer: {
    marginTop: moderateScale(8),
  },
  suggestionsLabel: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginBottom: moderateScale(4),
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  suggestionChip: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
  },
  suggestionChipActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#D5222B',
  },
  suggestionText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  suggestionTextActive: {
    color: '#D5222B',
  },
  rangeText: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: moderateScale(4),
  },
  helpText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: moderateScale(4),
  },
  errorText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Medium',
    color: '#E53935',
    marginTop: moderateScale(4),
  },
});
