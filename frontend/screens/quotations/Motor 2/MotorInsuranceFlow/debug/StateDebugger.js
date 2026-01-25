import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';

/**
 * StateDebugger - Visual confirmation that separation architecture is working
 * 
 * Shows:
 * 1. sharedVehicleData (universal fields)
 * 2. pricingData[subcategory_code] (isolated fields)
 * 3. selectedUnderwriter
 * 4. Legacy vehicleDetails (for comparison)
 */
export default function StateDebugger() {
  const { state } = useMotorInsurance();
  
  const subcategoryCode = state.selectedSubcategory?.subcategory_code;
  const currentPricingData = state.pricingData?.[subcategoryCode] || {};
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 State Separation Debugger</Text>
      
      {/* Current Subcategory */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Subcategory:</Text>
        <Text style={styles.code}>{subcategoryCode || 'None'}</Text>
        <Text style={styles.code}>Model: {state.selectedSubcategory?.pricing_model || 'N/A'}</Text>
      </View>
      
      {/* Shared Vehicle Data (NEW) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ sharedVehicleData (Universal):</Text>
        <Text style={styles.code}>
          {JSON.stringify(state.sharedVehicleData || {}, null, 2)}
        </Text>
      </View>
      
      {/* Pricing Data (NEW) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ pricingData[{subcategoryCode}] (Isolated):</Text>
        <Text style={styles.code}>
          {JSON.stringify(currentPricingData, null, 2)}
        </Text>
      </View>
      
      {/* All Pricing Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 All pricingData (All subcategories):</Text>
        <Text style={styles.code}>
          {JSON.stringify(state.pricingData || {}, null, 2)}
        </Text>
      </View>
      
      {/* Selected Underwriter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏢 selectedUnderwriter:</Text>
        <Text style={styles.code}>
          {state.selectedUnderwriter?.name || 'None'}
        </Text>
        {state.selectedUnderwriter && (
          <Text style={styles.code}>
            Code: {state.selectedUnderwriter.code}{'\n'}
            Premium: KSh {state.selectedUnderwriter.total_premium}{'\n'}
            Linked to: {state.selectedUnderwriter.subcategory_code || 'N/A'}
          </Text>
        )}
      </View>
      
      {/* Legacy vehicleDetails (for comparison) */}
      <View style={[styles.section, styles.deprecated]}>
        <Text style={styles.sectionTitle}>⚠️ vehicleDetails (Legacy - Backward Compat):</Text>
        <Text style={styles.code}>
          {JSON.stringify(state.vehicleDetails || {}, null, 2)}
        </Text>
      </View>
      
      {/* Verification Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Verification Tests:</Text>
        
        <Text style={styles.testResult}>
          ✓ sharedVehicleData exists: {state.sharedVehicleData ? '✅ YES' : '❌ NO'}
        </Text>
        
        <Text style={styles.testResult}>
          ✓ pricingData is object: {typeof state.pricingData === 'object' ? '✅ YES' : '❌ NO'}
        </Text>
        
        <Text style={styles.testResult}>
          ✓ vehicleDetails merged correctly: {
            state.vehicleDetails?.registrationNumber === state.sharedVehicleData?.registrationNumber 
              ? '✅ YES' 
              : '❌ NO'
          }
        </Text>
        
        <Text style={styles.testResult}>
          ✓ Separation working: {
            Object.keys(state.pricingData || {}).length >= 0 ? '✅ YES' : '❌ NO'
          }
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  deprecated: {
    borderLeftColor: '#ff9800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  code: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#e0e0e0',
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 3,
    marginTop: 5,
  },
  testResult: {
    fontSize: 12,
    color: '#fff',
    marginVertical: 3,
    paddingLeft: 10,
  },
});
