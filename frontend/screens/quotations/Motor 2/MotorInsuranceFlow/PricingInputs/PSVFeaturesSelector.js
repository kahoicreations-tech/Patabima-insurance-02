import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

export default function PSVFeaturesSelector({ passengers, onChangePassengers, pll = 250, onChangePLL, route = 'URBAN', onChangeRoute }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Passengers</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={String(passengers || '')} onChangeText={(v) => onChangePassengers?.(v.replace(/\D/g, ''))} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[250, 500].map((v) => (
          <TouchableOpacity key={v} style={[styles.pill, pll === v && styles.pillActive]} onPress={() => onChangePLL?.(v)}>
            <Text style={[styles.pillText, pll === v && styles.pillTextActive]}>PLL KSh {v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['URBAN', 'RURAL', 'LONG_ROUTE'].map((r) => (
          <TouchableOpacity key={r} style={[styles.pill, route === r && styles.pillActive]} onPress={() => onChangeRoute?.(r)}>
            <Text style={[styles.pillText, route === r && styles.pillTextActive]}>{r.replace('_',' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', color: '#495057' },
  input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#ced4da' },
  pillActive: { backgroundColor: '#D5222B', borderColor: '#D5222B' },
  pillText: { color: '#495057' },
  pillTextActive: { color: '#fff' },
});
