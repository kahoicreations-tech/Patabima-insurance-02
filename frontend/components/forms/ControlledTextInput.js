import React, { memo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

/**
 * ControlledTextInput - Memoized text input component with stable handlers
 * 
 * Key Features:
 * - Memoized to prevent unnecessary re-renders
 * - Custom comparison function for optimization
 * - Stable handler support via useCallback in parent
 * - Built-in error display
 * - Consistent styling across Motor2 forms
 * 
 * @param {Object} props
 * @param {string} props.value - Current field value
 * @param {Function} props.onChangeText - Stable change handler from parent
 * @param {string} props.label - Field label
 * @param {boolean} props.required - Show required asterisk
 * @param {string} props.error - Validation error message
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.keyboardType - Keyboard type (default, numeric, email-address, etc.)
 * @param {string} props.autoCapitalize - Auto-capitalization behavior
 * @param {boolean} props.editable - Whether field is editable (for locked fields)
 * @param {Object} props.style - Custom input style
 * @param {boolean} props.multiline - Enable multiline input
 * @param {number} props.numberOfLines - Number of lines for multiline
 */
const ControlledTextInput = memo(({
  value = '',
  onChangeText,
  label,
  required = false,
  error = null,
  placeholder = '',
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  style,
  multiline = false,
  numberOfLines = 1,
  ...otherProps
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          style,
        ]}
        placeholderTextColor="#9CA3AF"
        blurOnSubmit={false}
        returnKeyType="next"
        {...otherProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  // This prevents re-renders when parent state changes but these props haven't
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.label === nextProps.label &&
    prevProps.required === nextProps.required &&
    prevProps.editable === nextProps.editable &&
    prevProps.placeholder === nextProps.placeholder
  );
});

ControlledTextInput.displayName = 'ControlledTextInput';

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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Poppins',
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins',
  },
});

export default ControlledTextInput;
