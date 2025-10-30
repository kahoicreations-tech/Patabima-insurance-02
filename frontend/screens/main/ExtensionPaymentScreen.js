import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DjangoAPIService from '../../services/DjangoAPIService';

export default function ExtensionPaymentScreen({ route, navigation }) {
  const { 
    policyId, 
    policyNumber, 
    balanceAmount, 
    lateFeePercentage = 0, 
    totalAmount,
    vehicleReg,
    productName,
    extensionDays,
    coverEndDate
  } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  
  const lateFee = balanceAmount * (lateFeePercentage / 100);
  const finalAmount = totalAmount || (balanceAmount + lateFee);
  
  const handlePayment = async () => {
    setLoading(true);
    
    try {
      console.log('[ExtensionPayment] Initiating payment for policy:', policyNumber);
      console.log('[ExtensionPayment] Payment method:', paymentMethod);
      console.log('[ExtensionPayment] Amount:', finalAmount);
      
      // Call backend API to extend policy and process payment
      const extensionResponse = await DjangoAPIService.extendMotorPolicy(policyNumber, {
        months: Math.ceil(extensionDays / 30) || 11,
        paymentDetails: {
          method: paymentMethod,
          amount: finalAmount,
          transactionId: `SIM-${Date.now()}`, // Simulated transaction ID
          status: 'CONFIRMED',
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('[ExtensionPayment] Extension response:', extensionResponse);
      
      if (extensionResponse.success) {
        // Show success message
        Alert.alert(
          'Extension Payment Successful',
          `Policy ${policyNumber} has been extended!\n\n` +
          `Payment Method: ${paymentMethod.toUpperCase()}\n` +
          `Amount Paid: KSh ${finalAmount.toLocaleString()}\n` +
          `New Expiry: ${extensionResponse.newExpiryDate || 'Updated'}\n\n` +
          `Note: Payment simulated. Real gateway integration pending.`,
          [
            {
              text: 'Back to Home',
              onPress: () => navigation.navigate('MainTabs', { 
                screen: 'Home',
                params: { refresh: true }
              })
            }
          ]
        );
      } else {
        Alert.alert(
          'Extension Failed', 
          extensionResponse.error || extensionResponse.message || 'Unable to process extension payment'
        );
      }
    } catch (error) {
      console.error('[ExtensionPayment] Error:', error);
      Alert.alert(
        'Payment Error', 
        error.message || 'An error occurred during payment processing. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Extend Policy Coverage</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Policy Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Policy Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Policy Number</Text>
            <Text style={styles.detailValue}>{policyNumber || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>{vehicleReg || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product</Text>
            <Text style={styles.detailValue}>{productName || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Extension Period</Text>
            <Text style={styles.detailValue}>{extensionDays || 335} days</Text>
          </View>
        </View>
        
        {/* Payment Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Breakdown</Text>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Balance Amount</Text>
            <Text style={styles.breakdownValue}>
              KSh {(balanceAmount || 0).toLocaleString()}
            </Text>
          </View>
          
          {lateFeePercentage > 0 && (
            <>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  Late Payment Fee ({lateFeePercentage}%)
                </Text>
                <Text style={[styles.breakdownValue, styles.errorText]}>
                  + KSh {lateFee.toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.lateFeNote}>
                <Text style={styles.noteIcon}>ℹ️</Text>
                <Text style={styles.noteText}>
                  Late payment fees are applied based on days past deadline
                </Text>
              </View>
            </>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>
              KSh {finalAmount.toLocaleString()}
            </Text>
          </View>
        </View>
        
        {/* Payment Method Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          
          <TouchableOpacity 
            style={[
              styles.methodOption,
              paymentMethod === 'mpesa' && styles.selectedMethod
            ]}
            onPress={() => setPaymentMethod('mpesa')}
            activeOpacity={0.7}
          >
            <View style={styles.methodIconContainer}>
              <Ionicons name="phone-portrait-outline" size={24} color="#25D366" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>M-PESA</Text>
              <Text style={styles.methodDesc}>Pay via M-PESA STK Push</Text>
            </View>
            {paymentMethod === 'mpesa' && (
              <Ionicons name="checkmark-circle" size={24} color="#D5222B" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.methodOption,
              paymentMethod === 'dpo' && styles.selectedMethod
            ]}
            onPress={() => setPaymentMethod('dpo')}
            activeOpacity={0.7}
          >
            <View style={styles.methodIconContainer}>
              <Ionicons name="card-outline" size={24} color="#0066cc" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>DPO Pay</Text>
              <Text style={styles.methodDesc}>Card payment via DPO</Text>
            </View>
            {paymentMethod === 'dpo' && (
              <Ionicons name="checkmark-circle" size={24} color="#D5222B" />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Action Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>
              Pay KSh {finalAmount.toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D5222B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  errorText: {
    color: '#dc3545',
  },
  lateFeNote: {
    flexDirection: 'row',
    backgroundColor: '#fff4e6',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
    gap: 8,
  },
  noteIcon: {
    fontSize: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D5222B',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  selectedMethod: {
    borderColor: '#D5222B',
    backgroundColor: '#fff5f5',
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  methodDesc: {
    fontSize: 13,
    color: '#6c757d',
  },
  payButton: {
    backgroundColor: '#D5222B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#D5222B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: '#ced4da',
    shadowOpacity: 0,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});
