import React from 'react';
import { View, StyleSheet } from 'react-native';
import EnhancedPayment from '../Payment/EnhancedPayment';

export default function PaymentProcessingStep() {
  // EnhancedPayment reads necessary data from context (client, vehicle, premium)
  return (
    <View style={styles.container}>
      <EnhancedPayment />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 0,
    alignItems: 'stretch',
  },
});
