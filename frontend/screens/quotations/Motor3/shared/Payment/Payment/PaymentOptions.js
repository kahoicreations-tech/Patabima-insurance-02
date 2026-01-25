import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentOptions({ value, onChange, clientPhone }) {
  return (
    <View style={styles.card}>
      {/* Removed inner heading to avoid double headings with parent section title */}
      <View style={styles.methods}>
        <TouchableOpacity 
          style={[styles.method, value === 'MPESA' && styles.selected]}
          onPress={() => {
            console.log('[PaymentOptions] M-PESA selected');
            onChange?.('MPESA');
          }}
        >
          <Ionicons name="phone-portrait" size={32} color={value === 'MPESA' ? '#22c55e' : '#94a3b8'} />
          <Text style={[styles.methodText, value === 'MPESA' && styles.selectedText]}>M-PESA</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.method, value === 'DPO' && styles.selected]}
          onPress={() => {
            console.log('[PaymentOptions] DPO selected');
            onChange?.('DPO');
          }}
        >
          <Ionicons name="card" size={32} color={value === 'DPO' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.methodText, value === 'DPO' && styles.selectedText]}>Card Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.method, value === 'MANUAL' && styles.selected]}
          onPress={() => {
            console.log('[PaymentOptions] MANUAL selected');
            onChange?.('MANUAL');
          }}
        >
          <Ionicons name="cash" size={32} color={value === 'MANUAL' ? '#f59e0b' : '#94a3b8'} />
          <Text style={[styles.methodText, value === 'MANUAL' && styles.selectedText]}>Manual</Text>
        </TouchableOpacity>
      </View>
      
      {/* M-PESA Information Section */}
      {value === 'MPESA' && (
        <View style={styles.mpesaInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✓</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>STK Push Payment</Text>
              <Text style={styles.infoText}>You'll receive a prompt on your phone</Text>
            </View>
          </View>
          
          {clientPhone && (
            <View style={styles.phoneDisplay}>
              <Text style={styles.phoneLabel}>Payment will be sent to:</Text>
              <Text style={styles.phoneNumber}>{clientPhone}</Text>
            </View>
          )}
          
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>📲 What to expect:</Text>
            <Text style={styles.instructionStep}>1. Tap "Next" to continue</Text>
            <Text style={styles.instructionStep}>2. Enter your M-PESA PIN when prompted</Text>
            <Text style={styles.instructionStep}>3. Wait for confirmation</Text>
          </View>
        </View>
      )}
      
      {/* DPO Information Section */}
      {value === 'DPO' && (
        <View style={styles.dpoInfo}>
          <Text style={styles.comingSoonText}>💳 Card Payment Coming Soon</Text>
          <Text style={styles.comingSoonSubtext}>We're working on adding card payment support</Text>
        </View>
      )}

      {/* Manual Payment Info Section */}
      {value === 'MANUAL' && (
        <View style={styles.manualInfo}>
          <Text style={styles.manualTitle}>Manual Payment</Text>
          <Text style={styles.manualText}>Record payment manually (cash/bank). A reference will be required.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e9ecef' },
  text: { color: '#495057', marginBottom: 8 },
  methods: { flexDirection: 'row', gap: 10 },
  method: { 
    flex: 1, 
    borderWidth: 2, 
    borderColor: '#e2e8f0', 
    paddingVertical: 20, 
    borderRadius: 12, 
    alignItems: 'center', 
    backgroundColor: '#fff',
    gap: 8,
  },
  selected: { 
    borderColor: '#22c55e', 
    backgroundColor: '#f0fdf4',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  methodText: { 
    color: '#64748b', 
    fontWeight: '600', 
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  selectedText: {
    color: '#166534',
  },
  
  // M-PESA Info Section
  mpesaInfo: {
    marginTop: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#22c55e',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
  },
  phoneDisplay: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  phoneLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c4a6e',
    fontFamily: 'Poppins-SemiBold',
  },
  instructionsBox: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  instructionStep: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
    paddingLeft: 4,
  },
  
  // DPO Info Section
  dpoInfo: {
    marginTop: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  comingSoonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  comingSoonSubtext: {
    fontSize: 13,
    color: '#78350f',
  },
  // Manual Payment Info Section
  manualInfo: {
    marginTop: 16,
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  manualTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 6,
  },
  manualText: {
    fontSize: 13,
    color: '#78350f',
  },
});
