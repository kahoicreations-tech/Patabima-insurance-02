import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MotorInsuranceProgress({ steps = [], current = 0 }) {
  return (
    <View style={styles.row}>
      {steps.map((s, idx) => (
        <View key={s} style={[styles.dot, idx <= current ? styles.dotActive : null]}>
          <Text style={styles.dotText}>{idx + 1}</Text>
          <Text style={styles.label}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  dot: { alignItems: 'center', gap: 4 },
  dotActive: {},
  dotText: { width: 28, height: 28, borderRadius: 999, textAlign: 'center', lineHeight: 28, backgroundColor: '#e9ecef', color: '#495057' },
  label: { fontSize: 12, color: '#646767' },
});
