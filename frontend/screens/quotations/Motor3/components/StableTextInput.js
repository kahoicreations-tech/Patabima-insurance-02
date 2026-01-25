/**
 * StableTextInput - Performance-optimized text input
 * React.memo with custom comparator to prevent unnecessary re-renders
 * Keyboard persistence (blurOnSubmit=false) for smooth typing experience
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { moderateScale } from '../utils/responsive';

const StableTextInput = React.memo(
  React.forwardRef(({
    value,
    onChangeText,
    label,
    placeholder,
    required = false,
    error = null,
    autoCapitalize = 'none',
    keyboardType = 'default',
    returnKeyType = 'next',
    maxLength,
    editable = true,
    multiline = false,
    numberOfLines = 1,
    testID,
  }, ref) => {
    // Local state for immediate UI updates (prevents parent re-renders)
    const [localValue, setLocalValue] = useState(value || '');
    const timeoutRef = useRef(null);

    // Sync local state with prop changes (e.g., from DMVIC auto-fill)
    useEffect(() => {
      if (value !== localValue) {
        setLocalValue(value || '');
      }
    }, [value]);

    // Debounced update to parent (400ms delay)
    const handleChange = useCallback(
      (text) => {
        setLocalValue(text); // Immediate local update

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Debounce parent notification
        timeoutRef.current = setTimeout(() => {
          onChangeText(text);
        }, 400);
      },
      [onChangeText]
    );

    // Cleanup timeout on unmount
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
        <TextInput
          ref={ref}
          value={localValue}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          style={[
            styles.input,
            error && styles.inputError,
            !editable && styles.inputDisabled,
            multiline && styles.inputMultiline,
          ]}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          blurOnSubmit={false} // CRITICAL: Keeps keyboard visible
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          testID={testID}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }),
  (prevProps, nextProps) => {
    // Custom comparator: Only re-render if these props change
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.editable === nextProps.editable &&
      prevProps.label === nextProps.label &&
      prevProps.required === nextProps.required
      // Explicitly exclude onChangeText from comparison (function identity)
    );
  }
);

StableTextInput.displayName = 'StableTextInput';

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
  input: {
    minHeight: moderateScale(40),
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(15),
    fontFamily: 'Poppins-Regular',
    color: '#2C3E50',
    backgroundColor: '#FFF',
  },
  inputError: {
    borderColor: '#D5222B',
  },
  inputDisabled: {
    backgroundColor: '#F1F3F5',
    color: '#6C757D',
  },
  inputMultiline: {
    minHeight: moderateScale(100),
    paddingTop: moderateScale(12),
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins-Regular',
    color: '#D90429',
    marginTop: moderateScale(4),
  },
});

export default StableTextInput;
