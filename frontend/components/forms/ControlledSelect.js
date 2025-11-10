import React, { memo, useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';

/**
 * ControlledSelect - Memoized accordion-style dropdown selector
 * 
 * Features:
 * - Accordion expansion (collapsed/expanded states)
 * - Stable handlers with useCallback
 * - Custom memo comparison (excludes onSelect function)
 * - PataBima brand styling
 * - Scrollable options list
 * - "Others" option support
 * 
 * @param {string} value - Selected value
 * @param {function} onSelect - Callback when option selected (value) => void
 * @param {Array} options - Array of option strings or {label, value} objects
 * @param {string} label - Field label
 * @param {boolean} required - Show asterisk
 * @param {string} error - Error message
 * @param {string} placeholder - Placeholder text when no selection
 */
const ControlledSelect = ({ 
  value, 
  onSelect, 
  options = [], 
  label, 
  required, 
  error, 
  placeholder = 'Select an option'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Stable toggle handler
  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  // Stable option select handler
  const handleOptionPress = useCallback((optionValue) => {
    onSelect(optionValue);
    setIsExpanded(false); // Auto-collapse after selection
  }, [onSelect]);
  
  // Get display text for current selection
  const getDisplayText = () => {
    if (!value) return placeholder;
    
    const selectedOption = options.find(opt => {
      const optVal = typeof opt === 'string' ? opt : opt.value;
      return optVal === value;
    });
    
    if (selectedOption) {
      return typeof selectedOption === 'string' ? selectedOption : selectedOption.label;
    }
    
    return value; // Fallback to raw value
  };
  
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      {/* Collapsed dropdown trigger */}
      <TouchableOpacity
        style={[
          styles.trigger,
          error && styles.triggerError,
          isExpanded && styles.triggerExpanded
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.triggerText,
          !value && styles.placeholderText
        ]}>
          {getDisplayText()}
        </Text>
        <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {/* Expanded dropdown options */}
      {isExpanded && (
        <View style={styles.optionsContainer}>
          <ScrollView 
            style={styles.optionsScrollView}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {options.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const isSelected = value === optionValue;
              
              return (
                <TouchableOpacity
                  key={`${optionValue}-${index}`}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected
                  ]}
                  onPress={() => handleOptionPress(optionValue)}
                  activeOpacity={0.9}
                >
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {optionLabel}
                  </Text>
                  {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
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
  triggerExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  arrow: {
    fontSize: 12,
    color: '#646767',
    marginLeft: 8,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#ced4da',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionsScrollView: {
    maxHeight: 200,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    minHeight: 44,
    backgroundColor: '#fff',
  },
  optionSelected: {
    backgroundColor: '#D5222B',
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#212529',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#DC2626',
    marginTop: 4,
  },
});

// Custom comparison function (excludes onSelect to prevent re-renders)
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.label === nextProps.label &&
    prevProps.required === nextProps.required &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.options.length === nextProps.options.length
    // Intentionally exclude onSelect - function reference changes don't matter
  );
};

export default memo(ControlledSelect, arePropsEqual);
