import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import DynamicVehicleForm from '../VehicleDetails/DynamicVehicleForm';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';

export default function PolicyDetailsStep() {
  const { state, actions } = useMotorInsurance();
  
  // Use ref to hold latest callback without causing re-renders
  const updateRef = useRef(actions.updateVehicleDetails);
  updateRef.current = actions.updateVehicleDetails;
  
  // Keep an initial snapshot of vehicle details stable while typing to avoid child re-mounts
  const initialDataRef = useRef(state.vehicleDetails);
  // Refresh the snapshot only when the selected product changes (new flow context)
  useEffect(() => {
    initialDataRef.current = state.vehicleDetails;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedSubcategory?.id, state.selectedSubcategory?.subcategory_code]);
  
  // Stable callback that won't cause re-renders
  const handleDataChange = useCallback((data) => {
    updateRef.current(data);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <DynamicVehicleForm 
            selectedProduct={state.selectedSubcategory}
            productType={state.productType}
            initialData={initialDataRef.current}
            onDataChange={handleDataChange}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
});
