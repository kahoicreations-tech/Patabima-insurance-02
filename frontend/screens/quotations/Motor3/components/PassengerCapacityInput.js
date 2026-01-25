/**
 * PassengerCapacityInput - PSV passenger capacity input
 * Integer input with stepper
 * Optional commercial/institutional toggle
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { moderateScale } from '../utils/responsive';

const PassengerCapacityInput = React.memo(
  ({
    value,
    onValueChange,
    label,
    required = false,
    error = null,
    minCapacity = 1,
    showCommercialToggle = false,
    isCommercialInstitutional = false,
    onCommercialToggle,
    testID,
  }) => {
    const [localValue, setLocalValue] = useState(value?.toString() || '');
    const timeoutRef = useRef(null);

    // Sync with prop changes
    useEffect(() => {
      const str = value?.toString() || '';
      if (str !== localValue) {
        setLocalValue(str);
      }
    }, [value]);

    // Handle text change
    const handleChange = useCallback(
      (text) => {
        // Allow only integers
        const cleaned = text.replace(/[^0-9]/g, '');
        setLocalValue(cleaned);

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Debounce parent notification
        timeoutRef.current = setTimeout(() => {
          const numValue = parseInt(cleaned, 10) || 0;
          if (numValue >= minCapacity) {
            onValueChange(numValue);
          }
        }, 400);
      },
      [onValueChange, minCapacity]
    );

    // Increment capacity
    const handleIncrement = useCallback(() => {
      const current = parseInt(localValue, 10) || 0;
      const next = current + 1;
      const str = next.toString();
      setLocalValue(str);
      onValueChange(next);
    }, [localValue, onValueChange]);

    // Decrement capacity
    const handleDecrement = useCallback(() => {
      const current = parseInt(localValue, 10) || 0;
      const next = Math.max(current - 1, minCapacity);
      const str = next.toString();
      setLocalValue(str);
      onValueChange(next);
    }, [localValue, minCapacity, onValueChange]);

    // Toggle commercial/institutional
    const handleCommercialToggle = useCallback(() => {
      if (onCommercialToggle) {
        onCommercialToggle(!isCommercialInstitutional);
      }
    }, [isCommercialInstitutional, onCommercialToggle]);

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
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={handleDecrement}
            activeOpacity={0.7}
            testID={testID ? `${testID}-decrement` : undefined}
          >
            <Text style={styles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <TextInput
            value={localValue}
            onChangeText={handleChange}
            placeholder="0"
            placeholderTextColor="#999"
            style={[styles.input, error && styles.inputError]}
            keyboardType="number-pad"
            returnKeyType="next"
            blurOnSubmit={false}
            testID={testID}
          />
          <Text style={styles.suffix}>passengers</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={handleIncrement}
            activeOpacity={0.7}
            testID={testID ? `${testID}-increment` : undefined}
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        {showCommercialToggle && (
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={handleCommercialToggle}
            activeOpacity={0.7}
            testID={testID ? `${testID}-commercial` : undefined}
          >
            <View
              style={[
                styles.checkbox,
                isCommercialInstitutional && styles.checkboxChecked,
              ]}
            >
              {isCommercialInstitutional && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Commercial / Institutional
            </Text>
          </TouchableOpacity>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.isCommercialInstitutional === nextProps.isCommercialInstitutional &&
      prevProps.label === nextProps.label &&
      prevProps.required === nextProps.required
    );
  }
);

PassengerCapacityInput.displayName = 'PassengerCapacityInput';

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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  stepperButtonText: {
    fontSize: moderateScale(20),
    fontFamily: 'Poppins-Medium',
    color: '#D5222B',
  },
  input: {
    flex: 1,
    height: moderateScale(40),
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    backgroundColor: '#FFF',
    marginHorizontal: moderateScale(8),
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#D5222B',
  },
  suffix: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginLeft: moderateScale(8),
    minWidth: moderateScale(70),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  checkbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(8),
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    borderColor: '#D5222B',
    backgroundColor: '#D5222B',
  },
  checkmark: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
  },
  checkboxLabel: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  errorText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#D5222B',
    marginTop: moderateScale(4),
  },
});

export default PassengerCapacityInput;
