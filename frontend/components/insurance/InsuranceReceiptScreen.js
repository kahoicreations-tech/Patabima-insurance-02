/**
 * Insurance Receipt Screen
 * 
 * Displays payment receipt after successful form submission
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';

export const InsuranceReceiptScreen = ({ navigation, route }) => {
  const { formData = {}, config = {} } = route.params || {};

  const handleDone = () => {
    // Navigate back to main dashboard
    navigation.navigate('Dashboard');
  };

  const handleDownloadReceipt = () => {
    Alert.alert('Download', 'Receipt download functionality will be implemented here');
  };

  const handleEmailReceipt = () => {
    Alert.alert('Email', 'Email receipt functionality will be implemented here');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✅ Payment Successful</Text>
          <Text style={styles.headerSubtitle}>Your insurance policy is being processed</Text>
        </View>

        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
            <Text style={styles.transactionRef}>
              Ref: {formData.transaction_reference || 'N/A'}
            </Text>
          </View>

          {/* Policy Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policy Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Policy Type:</Text>
              <Text style={styles.value}>{formData.policy_type_display || 'TOR Insurance'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Vehicle Reg:</Text>
              <Text style={styles.value}>{formData.vehicle_registration || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Vehicle:</Text>
              <Text style={styles.value}>
                {formData.vehicle_make} {formData.vehicle_model || ''}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Cover Date:</Text>
              <Text style={styles.value}>{formData.cover_start_date || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Insurance Provider:</Text>
              <Text style={styles.value}>{formData.insurance_provider || 'N/A'}</Text>
            </View>
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Breakdown</Text>
            {formData.premium_breakdown && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Base Premium:</Text>
                  <Text style={styles.value}>
                    KSh {formData.premium_breakdown.basePremium?.toLocaleString() || '0'}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Training Levy:</Text>
                  <Text style={styles.value}>
                    KSh {formData.premium_breakdown.trainingLevy?.toLocaleString() || '0'}
                  </Text>
                </View>
                {formData.premium_breakdown.pcfLevy !== undefined && (
                  <View style={styles.row}>
                    <Text style={styles.label}>PCF Levy:</Text>
                    <Text style={styles.value}>
                      KSh {Number(formData.premium_breakdown.pcfLevy).toLocaleString() || '0'}
                    </Text>
                  </View>
                )}
                <View style={styles.row}>
                  <Text style={styles.label}>Stamp Duty:</Text>
                  <Text style={styles.value}>
                    KSh {formData.premium_breakdown.stampDuty?.toLocaleString() || '0'}
                  </Text>
                </View>
                <View style={[styles.row, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Paid:</Text>
                  <Text style={styles.totalValue}>
                    KSh {formData.total_amount_payable?.toLocaleString() || '0'}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Payment Method:</Text>
              <Text style={styles.value}>{formData.payment_provider || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone Number:</Text>
              <Text style={styles.value}>{formData.payment_phone || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date & Time:</Text>
              <Text style={styles.value}>{new Date().toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleDownloadReceipt}>
            <Text style={styles.secondaryButtonText}>📄 Download PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleEmailReceipt}>
            <Text style={styles.secondaryButtonText}>📧 Email Receipt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomButton}>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  receiptCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  receiptHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#D5222B',
    paddingBottom: 15,
    marginBottom: 20,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  transactionRef: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D5222B',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#D5222B',
    marginTop: 10,
    paddingTop: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D5222B',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 0.45,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomButton: {
    padding: 20,
    paddingBottom: 30,
  },
  doneButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InsuranceReceiptScreen;