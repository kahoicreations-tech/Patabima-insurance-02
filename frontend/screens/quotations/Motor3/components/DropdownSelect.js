/**
 * DropdownSelect - Enhanced accordion-style dropdown with search
 * Improvements over Motor2:
 * - Built-in search functionality
 * - Keyboard-friendly (closes on selection)
 * - Better visual hierarchy
 * - Loading states
 * - Empty states
 * - Max height with scroll
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from '../utils/responsive';

const DropdownSelect = React.memo(
  ({
    label,
    value,
    options = [], // Array of strings or { value, label } objects
    onValueChange,
    placeholder = 'Select option',
    required = false,
    error = null,
    searchable = false,
    loading = false,
    disabled = false,
    helpText = null,
    testID,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);

    // Normalize options to { value, label } format
    const normalizedOptions = useMemo(() => {
      return options.map((opt) => {
        if (typeof opt === 'string') {
          return { value: opt, label: opt };
        }
        return {
          value: opt.value ?? opt.label ?? String(opt),
          label: opt.label ?? opt.value ?? String(opt),
        };
      });
    }, [options]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return normalizedOptions;

      const query = searchQuery.toLowerCase();
      return normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(query)
      );
    }, [normalizedOptions, searchQuery]);

    // Get display text for selected value
    const displayText = useMemo(() => {
      if (!value) return placeholder;

      const selected = normalizedOptions.find((opt) => opt.value === value);
      return selected ? selected.label : placeholder;
    }, [value, normalizedOptions, placeholder]);

    // Handle dropdown toggle
    const handleToggle = useCallback(() => {
      if (disabled || loading) return;

      if (!isExpanded) {
        // Opening dropdown
        Keyboard.dismiss(); // Close keyboard first
        setIsExpanded(true);
        setSearchQuery(''); // Reset search

        // Focus search input after a short delay
        if (searchable) {
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100);
        }
      } else {
        // Closing dropdown
        setIsExpanded(false);
        setSearchQuery('');
      }
    }, [disabled, loading, isExpanded, searchable]);

    // Handle option selection
    const handleSelect = useCallback(
      (optionValue) => {
        onValueChange(optionValue);
        setIsExpanded(false);
        setSearchQuery('');
        Keyboard.dismiss();
      },
      [onValueChange]
    );

    // Auto-close dropdown when keyboard is dismissed
    useEffect(() => {
      const keyboardListener = Keyboard.addListener('keyboardDidHide', () => {
        if (isExpanded && searchable) {
          setIsExpanded(false);
          setSearchQuery('');
        }
      });

      return () => keyboardListener.remove();
    }, [isExpanded, searchable]);

    return (
      <View style={styles.container}>
        {/* Label */}
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        {/* Dropdown Trigger */}
        <TouchableOpacity
          style={[
            styles.trigger,
            isExpanded && styles.triggerExpanded,
            error && styles.triggerError,
            disabled && styles.triggerDisabled,
          ]}
          onPress={handleToggle}
          activeOpacity={0.7}
          disabled={disabled || loading}
          testID={testID}
        >
          <Text
            style={[
              styles.triggerText,
              !value && styles.triggerPlaceholder,
              disabled && styles.triggerTextDisabled,
            ]}
            numberOfLines={1}
          >
            {displayText}
          </Text>

          <View style={styles.triggerIcon}>
            {loading ? (
              <ActivityIndicator size="small" color="#D5222B" />
            ) : (
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={disabled ? '#CCC' : '#666'}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Dropdown Options Panel */}
        {isExpanded && !loading && (
          <View style={styles.optionsPanel}>
            {/* Search Input */}
            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor="#999"
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  blurOnSubmit={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Options List */}
            <ScrollView
              style={styles.optionsScrollView}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = value === option.value;

                  return (
                    <TouchableOpacity
                      key={`${option.value}-${index}`}
                      style={[
                        styles.option,
                        isSelected && styles.optionSelected,
                        index === filteredOptions.length - 1 && styles.optionLast,
                      ]}
                      onPress={() => handleSelect(option.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#D5222B" />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={32} color="#CCC" />
                  <Text style={styles.emptyText}>No options found</Text>
                  {searchQuery && (
                    <Text style={styles.emptySubtext}>
                      Try adjusting your search
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Help Text */}
        {helpText && !error && <Text style={styles.helpText}>{helpText}</Text>}

        {/* Error Message */}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparator: Only re-render if these props change
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.loading === nextProps.loading &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.options.length === nextProps.options.length &&
      JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options)
    );
  }
);

DropdownSelect.displayName = 'DropdownSelect';

export default DropdownSelect;

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(10),
    zIndex: 10,
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    minHeight: moderateScale(44),
  },
  triggerExpanded: {
    borderColor: '#D5222B',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  triggerError: {
    borderColor: '#E53935',
  },
  triggerDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  triggerText: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  triggerPlaceholder: {
    color: '#999',
  },
  triggerTextDisabled: {
    color: '#999',
  },
  triggerIcon: {
    marginLeft: moderateScale(8),
  },
  optionsPanel: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#D5222B',
    borderBottomLeftRadius: moderateScale(8),
    borderBottomRightRadius: moderateScale(8),
    maxHeight: moderateScale(300),
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    backgroundColor: '#FAFAFA',
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    paddingVertical: moderateScale(4),
  },
  optionsScrollView: {
    maxHeight: moderateScale(240),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: '#FFF5F5',
  },
  optionText: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  optionTextSelected: {
    fontFamily: 'Poppins-SemiBold',
    color: '#D5222B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(30),
    paddingHorizontal: moderateScale(20),
  },
  emptyText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Medium',
    color: '#999',
    marginTop: moderateScale(10),
  },
  emptySubtext: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#BBB',
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
