import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PaymentOptions({ value, onChange }) {
  return (
    <View style={styles.card}>
      {/* Removed inner heading to avoid double headings with parent section title */}
      <View style={styles.methods}>
        <TouchableOpacity 
          style={[styles.method, value === 'MPESA' && styles.selected]}
          onPress={() => onChange?.('MPESA')}
        >
          <Text style={styles.methodText}>M-PESA</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.method, value === 'DPO' && styles.selected]}
          onPress={() => onChange?.('DPO')}
        >
          <Text style={styles.methodText}>DPO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e9ecef' },
  text: { color: '#495057', marginBottom: 8 },
  methods: { flexDirection: 'row', gap: 10 },
  method: { flex: 1, borderWidth: 1, borderColor: '#ced4da', paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
  selected: { borderColor: '#D5222B', backgroundColor: '#fff5f5' },
  methodText: { color: '#2c3e50', fontWeight: '600' },
});
