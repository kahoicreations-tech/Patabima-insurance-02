import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const BRACKETS = [
  'Up to 3 Tons',
  '3 to 5 Tons',
  '5 to 8 Tons',
  '8 to 10 Tons',
  '10 to 15 Tons',
  '15 to 20 Tons',
  'Over 20 Tons',
];

export default function CommercialTonnageSelector({ value, onChange, fleet = false, onToggleFleet }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {BRACKETS.map((b) => (
          <TouchableOpacity key={b} style={[styles.pill, value === b && styles.pillActive]} onPress={() => onChange?.(b)}>
            <Text style={[styles.pillText, value === b && styles.pillTextActive]}>{b}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[styles.switch, fleet && styles.pillActive]} onPress={() => onToggleFleet?.(!fleet)}>
        <Text style={[styles.pillText, fleet && styles.pillTextActive]}>{fleet ? 'Fleet Pricing: ON' : 'Fleet Pricing: OFF'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#ced4da' },
  pillActive: { backgroundColor: '#D5222B', borderColor: '#D5222B' },
  pillText: { color: '#495057' },
  pillTextActive: { color: '#fff' },
  switch: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#ced4da' },
});
