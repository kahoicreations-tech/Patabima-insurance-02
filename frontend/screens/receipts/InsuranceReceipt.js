/**
 * Insurance Receipt Screen
 * 
 * Displays insurance purchase receipt
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const InsuranceReceipt = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  const { config, formData, submissionResponse } = route.params || {};

  const handleDownloadReceipt = () => {
    Alert.alert('Receipt Download', 'Receipt download functionality will be implemented');
  };

  const handleShareReceipt = () => {
    Alert.alert('Share Receipt', 'Receipt sharing functionality will be implemented');
  };

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'KES 0';
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.headerTitle}>Payment Successful!</Text>
          <Text style={styles.headerSubtitle}>Your insurance has been purchased</Text>
        </View>

        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
            <Text style={styles.receiptId}>
              {submissionResponse?.quotationId || 'N/A'}
            </Text>
          </View>

          {/* Policy Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policy Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Policy Type:</Text>
              <Text style={styles.detailValue}>
                {formData?.policy_type_display || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Insurance Type:</Text>
              <Text style={styles.detailValue}>
                {formData?.insurance_type_display || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle Registration:</Text>
              <Text style={styles.detailValue}>
                {formData?.vehicle_registration || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle:</Text>
              <Text style={styles.detailValue}>
                {formData?.vehicle_make} {formData?.vehicle_model}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Insurance Provider:</Text>
              <Text style={styles.detailValue}>
                {formData?.insurance_provider || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cover Period:</Text>
              <Text style={styles.detailValue}>
                {formatDate(formData?.cover_start_date)} - {formatDate(formData?.cover_end_date)}
              </Text>
            </View>
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method:</Text>
              <Text style={styles.detailValue}>
                {formData?.payment_provider || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Phone:</Text>
              <Text style={styles.detailValue}>
                {formData?.payment_phone || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Reference:</Text>
              <Text style={styles.detailValue}>
                {formData?.transaction_reference || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Date:</Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Time:</Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleTimeString()}
              </Text>
            </View>
          </View>

          {/* Amount Breakdown */}
          {formData?.premium_breakdown && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount Breakdown</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Base Premium:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(formData.premium_breakdown.basePremium)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Training Levy:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(formData.premium_breakdown.trainingLevy)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stamp Duty:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(formData.premium_breakdown.stampDuty)}
                </Text>
              </View>

              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(formData.total_amount_payable)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleDownloadReceipt}>
            <Text style={styles.secondaryButtonText}>Download Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleShareReceipt}>
            <Text style={styles.secondaryButtonText}>Share Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleBackToHome}>
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successIconText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  receiptHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 15,
    marginBottom: 20,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  receiptId: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#D5222B',
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D5222B',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5222B',
  },
  secondaryButtonText: {
    color: '#D5222B',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InsuranceReceipt;