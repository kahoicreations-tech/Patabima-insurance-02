import React, { memo, useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * ControlledDatePicker - Memoized date picker with validation
 * 
 * Features:
 * - Native date picker (iOS/Android)
 * - Min/max date validation
 * - Custom display formatting
 * - Stable handlers with useCallback
 * - Custom memo comparison
 * - PataBima brand styling
 * 
 * @param {string} value - Selected date (ISO format YYYY-MM-DD)
 * @param {function} onChange - Callback when date selected (isoDate) => void
 * @param {string} label - Field label
 * @param {boolean} required - Show asterisk
 * @param {string} error - Error message
 * @param {Date} minDate - Minimum selectable date
 * @param {Date} maxDate - Maximum selectable date
 * @param {string} placeholder - Placeholder text when no selection
 * @param {string} helperText - Helper text (e.g., min date reason)
 */
const ControlledDatePicker = ({
  value,
  onChange,
  label,
  required,
  error,
  minDate,
  maxDate,
  placeholder = 'Select date',
  helperText
}) => {
  const [showPicker, setShowPicker] = useState(false);
  
  // Convert ISO string to Date object
  const dateValue = value ? new Date(value) : new Date();
  
  // Stable show picker handler
  const handlePress = useCallback(() => {
    setShowPicker(true);
  }, []);
  
  // Stable date change handler
  const handleDateChange = useCallback((event, selectedDate) => {
    // Auto-dismiss on Android
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    // Handle dismissal
    if (event?.type === 'dismissed') {
      return;
    }
    
    if (selectedDate) {
      // Validate against minDate
      if (minDate && selectedDate < minDate) {
        Alert.alert(
          'Invalid Date',
          `Date must be on or after ${minDate.toLocaleDateString()}`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Validate against maxDate
      if (maxDate && selectedDate > maxDate) {
        Alert.alert(
          'Invalid Date',
          `Date must be on or before ${maxDate.toLocaleDateString()}`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Convert to ISO format (YYYY-MM-DD)
      const isoDate = selectedDate.toISOString().split('T')[0];
      onChange(isoDate);
    }
  }, [onChange, minDate, maxDate]);
  
  // Format display text
  const getDisplayText = () => {
    if (!value) return placeholder;
    
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }); // e.g., "12 Nov 2025"
    } catch (e) {
      return value;
    }
  };
  
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.trigger,
          error && styles.triggerError
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.triggerText,
          !value && styles.placeholderText
        ]}>
          {getDisplayText()}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>
      
      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={handleDateChange}
        />
      )}
      
      {helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    color: '#495057',
    marginBottom: 6,
  },
  required: {
    color: '#D5222B',
  },
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  triggerError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  triggerText: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#212529',
    flex: 1,
  },
  placeholderText: {
    color: '#6c757d',
    fontStyle: 'italic',
  },
  icon: {
    fontSize: 20,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#FF9800',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#DC2626',
    marginTop: 4,
  },
});

// Custom comparison function
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.label === nextProps.label &&
    prevProps.required === nextProps.required &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.helperText === nextProps.helperText &&
    prevProps.minDate?.getTime() === nextProps.minDate?.getTime() &&
    prevProps.maxDate?.getTime() === nextProps.maxDate?.getTime()
    // Intentionally exclude onChange
  );
};

export default memo(ControlledDatePicker, arePropsEqual);
