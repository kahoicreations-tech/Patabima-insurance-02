import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

/**
 * DoubleInsuranceWarningModal
 * 
 * Displays when DMVIC validation detects active insurance cover for the vehicle.
 * Shows existing policy details and asks user to confirm proceeding.
 */
export default function DoubleInsuranceWarningModal({ visible, onClose, onProceed, dmvicPolicy }) {
  if (!dmvicPolicy) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.title}>Active Insurance Detected</Text>
            </View>

            {/* Warning Message */}
            <Text style={styles.message}>
              DMVIC records show this vehicle already has active motor insurance coverage:
            </Text>

            {/* Existing Policy Details */}
            <View style={styles.policyCard}>
              <View style={styles.policyRow}>
                <Text style={styles.label}>Policy Number:</Text>
                <Text style={styles.value}>{dmvicPolicy.policy_number || 'N/A'}</Text>
              </View>

              <View style={styles.policyRow}>
                <Text style={styles.label}>Underwriter:</Text>
                <Text style={styles.value}>{dmvicPolicy.underwriter || 'N/A'}</Text>
              </View>

              <View style={styles.policyRow}>
                <Text style={styles.label}>Cover Type:</Text>
                <Text style={styles.value}>{dmvicPolicy.cover_type || 'N/A'}</Text>
              </View>

              <View style={styles.policyRow}>
                <Text style={styles.label}>Expiry Date:</Text>
                <Text style={[styles.value, styles.expiryDate]}>
                  {dmvicPolicy.expiry_date || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Legal Warning */}
            <View style={styles.legalWarning}>
              <Text style={styles.legalText}>
                Creating duplicate insurance for the same vehicle may constitute double-insurance, 
                which can affect claim processing and policy validity.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel & Review</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.proceedButton]} 
                onPress={onProceed}
              >
                <Text style={styles.proceedButtonText}>Proceed Anyway</Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              By proceeding, you acknowledge this warning and accept responsibility 
              for any double-insurance implications.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 450,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#D5222B',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  policyCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#646767',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  expiryDate: {
    color: '#D5222B',
  },
  legalWarning: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: 12,
    marginBottom: 24,
    borderRadius: 4,
  },
  legalText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 19,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  proceedButton: {
    backgroundColor: '#D5222B',
  },
  proceedButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
