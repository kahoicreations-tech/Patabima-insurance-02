/**
 * DatePicker - Native date picker with validation
 * Platform-specific implementation (iOS/Android)
 * Native driver animations for smooth performance
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { moderateScale } from '../utils/responsive';

const DatePicker = React.memo(
  ({
    label,
    value, // Date string or Date object
    onValueChange,
    required = false,
    error = null,
    minDate, // Optional minimum date (Date object)
    maxDate, // Optional maximum date (Date object)
    testID,
  }) => {
    const [showPicker, setShowPicker] = useState(false);

    // Convert value to Date object
    const dateValue = value ? new Date(value) : new Date();

    // Format date for display (DD/MM/YYYY)
    const formatDate = useCallback((date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }, []);

    // Handle date selection
    const handleDateChange = useCallback(
      (event, selectedDate) => {
        if (Platform.OS === 'android') {
          setShowPicker(false);
        }

        if (selectedDate) {
          // Convert to ISO string for storage
          const isoString = selectedDate.toISOString().split('T')[0];
          onValueChange(isoString);
        }
      },
      [onValueChange]
    );

    // Show picker
    const handlePress = useCallback(() => {
      setShowPicker(true);
    }, []);

    // Hide picker (iOS only)
    const handleDismiss = useCallback(() => {
      setShowPicker(false);
    }, []);

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.input, error && styles.inputError]}
          onPress={handlePress}
          activeOpacity={0.7}
          testID={testID}
        >
          <Text style={styles.inputText}>
            {value ? formatDate(dateValue) : 'Select date'}
          </Text>
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}

        {showPicker && (
          <>
            {Platform.OS === 'ios' && (
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity onPress={handleDismiss}>
                    <Text style={styles.iosPickerButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={minDate}
                  maximumDate={maxDate}
                  textColor="#333"
                />
              </View>
            )}
            {Platform.OS === 'android' && (
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={minDate}
                maximumDate={maxDate}
              />
            )}
          </>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparator
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.label === nextProps.label &&
      prevProps.required === nextProps.required
    );
  }
);

DatePicker.displayName = 'DatePicker';

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
    minHeight: moderateScale(44),
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  inputError: {
    borderColor: '#D5222B',
  },
  inputText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: '#2C3E50',
  },
  errorText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#D90429',
    marginTop: moderateScale(4),
  },
  iosPickerContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    marginTop: moderateScale(8),
    borderRadius: moderateScale(8),
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  iosPickerButton: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-SemiBold',
    color: '#D5222B',
  },
});

export default DatePicker;
