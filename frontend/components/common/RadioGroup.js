import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RadioGroup({ label, options = [], value, onChange, inline = false }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, inline && { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }]}>
        {options.map(opt => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity key={opt.value} style={[styles.option, selected && styles.optionActive]} onPress={() => onChange(opt.value)}>
              <View style={[styles.circle, selected && styles.circleActive]}>
                {selected ? <View style={styles.inner} /> : null}
              </View>
              <Text style={[styles.text, selected && styles.textActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontWeight: '600', color: '#495057', marginBottom: 6 },
  row: { gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  optionActive: { backgroundColor: '#D5222B', borderColor: '#D5222B' },
  text: { marginLeft: 8, color: '#2c3e50', fontWeight: '700' },
  textActive: { color: '#fff' },
  circle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#adb5bd', justifyContent: 'center', alignItems: 'center' },
  circleActive: { borderColor: '#fff' },
  inner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
});
