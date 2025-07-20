import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';

// ENHANCED FORM COMPONENTS FOR ALL INSURANCE CATEGORIES

export const EnhancedTextInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  required = false, 
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  ...otherProps 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
      <View style={[styles.inputWrapper, multiline && styles.multilineWrapper]}>
        <TextInput
          style={[styles.textInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...otherProps}
        />
      </View>
    </View>
  );
};

export const EnhancedEmailInput = ({ label = "Email", value, onChangeText, required = false, ...otherProps }) => {
  return (
    <EnhancedTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder="Enter email address"
      keyboardType="email-address"
      autoCapitalize="none"
      required={required}
      {...otherProps}
    />
  );
};

export const EnhancedPhoneInput = ({ label = "Phone Number", value, onChangeText, required = false, ...otherProps }) => {
  const handleChange = useCallback((text) => {
    // Allow only digits, +, and spaces
    const cleaned = text.replace(/[^0-9+\s]/g, '');
    onChangeText(cleaned);
  }, [onChangeText]);

  return (
    <EnhancedTextInput
      label={label}
      value={value}
      onChangeText={handleChange}
      placeholder="Enter phone number"
      keyboardType="phone-pad"
      required={required}
      {...otherProps}
    />
  );
};

export const EnhancedIDInput = ({ label = "ID Number", value, onChangeText, required = false, ...otherProps }) => {
  const handleChange = useCallback((text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    onChangeText(cleaned);
  }, [onChangeText]);

  return (
    <EnhancedTextInput
      label={label}
      value={value}
      onChangeText={handleChange}
      placeholder="Enter ID number"
      keyboardType="numeric"
      required={required}
      {...otherProps}
    />
  );
};

export const EnhancedDatePicker = ({
  label = 'Date of Birth',
  value,
  onDateChange,
  placeholder = 'Select date',
  minAge = 16, // Allow 16+ for insurance
  maxAge = 85, // Reasonable max age for insurance
  required = false
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const { selectedDate, maxDate, minDate } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // Use current date as default instead of calculated age
    const defaultDate = new Date(today); // Current date: July 20, 2025
    
    return {
      selectedDate: value ? new Date(value) : defaultDate,
      maxDate: new Date(currentYear - minAge, currentMonth, currentDay), // Latest selectable date
      minDate: new Date(currentYear - maxAge, currentMonth, currentDay)  // Earliest selectable date
    };
  }, [value, minAge, maxAge]);

  const handleDateChange = useCallback((event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date && event.type === 'set') {
      // Format the date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      onDateChange(formattedDate);
      
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  }, [onDateChange]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB');
  }, []);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
};

// DEPARTURE DATE PICKER - Can't select past dates
export const EnhancedDepartureDatePicker = ({
  label = 'Departure Date',
  value,
  onDateChange,
  placeholder = 'Select departure date',
  required = false
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const { selectedDate, maxDate, minDate } = useMemo(() => {
    const today = new Date();
    // Set time to start of day to avoid timezone issues
    today.setHours(0, 0, 0, 0);
    
    // Default to tomorrow for departure
    const defaultDate = new Date(today);
    defaultDate.setDate(today.getDate() + 1);
    
    // Max date: 2 years from now (reasonable for travel planning)
    const maxTravelDate = new Date(today);
    maxTravelDate.setFullYear(today.getFullYear() + 2);
    
    return {
      selectedDate: value ? new Date(value) : defaultDate,
      maxDate: maxTravelDate,
      minDate: today // Can't select past dates
    };
  }, [value]);

  const handleDateChange = useCallback((event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date && event.type === 'set') {
      const formattedDate = date.toISOString().split('T')[0];
      onDateChange(formattedDate);
      
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  }, [onDateChange]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB');
  }, []);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="airplane-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
};

// RETURN DATE PICKER - Can't be before departure date
export const EnhancedReturnDatePicker = ({
  label = 'Return Date',
  value,
  onDateChange,
  placeholder = 'Select return date',
  departureDate, // Required prop to set minimum date
  required = false
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const { selectedDate, maxDate, minDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Minimum date is departure date or today, whichever is later
    let minimumDate = today;
    if (departureDate) {
      const depDate = new Date(departureDate);
      minimumDate = depDate > today ? depDate : today;
    }
    
    // Default to day after departure or tomorrow
    const defaultDate = new Date(minimumDate);
    defaultDate.setDate(minimumDate.getDate() + 1);
    
    // Max date: 2 years from now
    const maxTravelDate = new Date(today);
    maxTravelDate.setFullYear(today.getFullYear() + 2);
    
    return {
      selectedDate: value ? new Date(value) : defaultDate,
      maxDate: maxTravelDate,
      minDate: minimumDate
    };
  }, [value, departureDate]);

  const handleDateChange = useCallback((event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date && event.type === 'set') {
      const formattedDate = date.toISOString().split('T')[0];
      onDateChange(formattedDate);
      
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  }, [onDateChange]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB');
  }, []);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="airplane-outline" size={20} color={Colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  required: {
    color: Colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  multilineWrapper: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  dateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textLight,
  },
});
