import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SelectorCard = ({
  label,
  options = [],
  selectedValue,
  onValueChange,
  error,
  required = false,
  keyExtractor = (item) => item.id,
  labelExtractor = (item) => item.name,
  subtitleExtractor = (item) => item.code,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <View style={styles.optionsList}>
        {options.map((option) => {
          const key = keyExtractor(option);
          const isSelected = selectedValue && keyExtractor(selectedValue) === key;
          
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected
              ]}
              onPress={() => onValueChange(option)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionName}>{labelExtractor(option)}</Text>
                {subtitleExtractor && (
                  <Text style={styles.optionSubtitle}>{subtitleExtractor(option)}</Text>
                )}
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#D5222B" />
              )}
            </TouchableOpacity>
          );
        })}
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
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  optionCardSelected: {
    borderColor: '#D5222B',
    backgroundColor: '#FEF2F2',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default SelectorCard;