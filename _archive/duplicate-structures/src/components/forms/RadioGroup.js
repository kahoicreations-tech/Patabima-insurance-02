import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

const RadioGroup = ({
  label,
  options = [],
  selectedValue,
  onValueChange,
  error,
  required = false,
  horizontal = true,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <View style={[
        styles.optionsContainer,
        horizontal ? styles.horizontal : styles.vertical
      ]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              selectedValue === option.value && styles.optionSelected
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <View style={[
              styles.radioButton,
              selectedValue === option.value && styles.radioButtonSelected
            ]}>
              {selectedValue === option.value && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.optionLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  optionsContainer: {
    gap: 16,
  },
  horizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vertical: {
    flexDirection: 'column',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionSelected: {
    // Add any selected state styling if needed
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#D5222B',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D5222B',
  },
  optionLabel: {
    fontSize: 16,
    color: '#374151',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default RadioGroup;