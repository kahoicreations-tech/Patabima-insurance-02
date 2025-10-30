import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DynamicVehicleForm from './MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm';

export default function ThirdPartyProductForm({ values, onChange, errors }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.title}>Third-Party Cover</Text>
      <DynamicVehicleForm values={values} onChange={onChange} errors={errors} productType="THIRD_PARTY" />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700', color: '#2c3e50' },
});
