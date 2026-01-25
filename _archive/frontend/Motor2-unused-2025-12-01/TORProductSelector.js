import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function TORProductSelector({ price, onSelect }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Time on Risk (TOR)</Text>
      <Text style={styles.help}>Fixed pricing with minimal requirements</Text>
      <Text style={styles.price}>From KES {Number(price || 0).toLocaleString()}</Text>
      <TouchableOpacity style={styles.primary} onPress={onSelect}>
        <Text style={styles.primaryText}>Choose TOR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e9ecef' },
  title: { fontWeight: '700', color: '#2c3e50', marginBottom: 4 },
  help: { color: '#646767' },
  price: { fontWeight: '700', color: '#2c3e50', marginVertical: 8 },
  primary: { backgroundColor: '#D5222B', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
});
