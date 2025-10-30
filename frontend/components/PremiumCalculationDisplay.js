import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PremiumCalculationDisplay({ premium }) {
  if (!premium) return null;
  return (
    <View style={styles.card}>
      <Text>Base: KSh {premium.breakdown?.base ?? premium.premium}</Text>
      <Text>ITL: KSh {premium.levies?.itl}</Text>
      <Text>PCF: KSh {premium.levies?.pcf}</Text>
      <Text>Stamp: KSh {premium.levies?.stampDuty}</Text>
      <Text style={styles.total}>Total: KSh {premium.total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
  },
  total: { fontWeight: 'bold', marginTop: 6 },
});
