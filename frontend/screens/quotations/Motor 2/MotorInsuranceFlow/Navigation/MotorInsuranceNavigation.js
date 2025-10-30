import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function MotorInsuranceNavigation({ onPrev, onNext, canNext = true, showBack = false }) {
  return (
    <View style={styles.row}>
      {showBack && (
        <TouchableOpacity style={[styles.secondary]} onPress={onPrev}>
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[styles.primary, !canNext && styles.disabled, !showBack && styles.fullWidth]} onPress={() => (canNext ? onNext?.() : Alert.alert('Please complete the form'))}>
        <Text style={styles.primaryText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  primary: { backgroundColor: '#D5222B', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D5222B', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  secondaryText: { color: '#D5222B', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  fullWidth: { flex: 1 },
});
