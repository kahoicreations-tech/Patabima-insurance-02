import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DynamicVehicleForm from './MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm';

// TOR uses the same layout as Third Party products via the shared DynamicVehicleForm
export default function TORProductForm({ values, onChange, errors }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.title}>Time On Risk (TOR)</Text>
      <DynamicVehicleForm values={values} onChange={onChange} errors={errors} productType="TOR" />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700', color: '#2c3e50' },
});
