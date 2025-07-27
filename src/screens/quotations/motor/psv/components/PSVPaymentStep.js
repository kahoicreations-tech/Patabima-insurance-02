/**
 * PSV Payment Step Component
 * Handles payment confirmation for PSV insurance quotation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const PAYMENT_METHODS = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Pay via M-Pesa mobile money',
    icon: 'phone-portrait',
    processingTime: 'Instant',
    fees: '1.5%'
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    description: 'Pay via Airtel Money',
    icon: 'phone-portrait',
    processingTime: 'Instant',
    fees: '1.5%'
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    description: 'Direct bank transfer',
    icon: 'card',
    processingTime: '24 hours',
    fees: 'Free'
  },
  {
    id: 'visa',
    name: 'Visa/Mastercard',
    description: 'Pay with debit/credit card',
    icon: 'card-outline',
    processingTime: 'Instant',
    fees: '2.5%'
  }
];

const PSVPaymentStep = ({ 
  formData, 
  onUpdateFormData, 
  premium = 15000,
  onSubmit,
  isSubmitting = false 
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(formData.paymentMethod || null);
  const [errors, setErrors] = useState({});

  const calculateTotal = () => {
    const paymentMethod = PAYMENT_METHODS.find(method => method.id === selectedPaymentMethod);
    let fees = 0;
    
    if (paymentMethod) {
      if (paymentMethod.fees.includes('%')) {
        const percentage = parseFloat(paymentMethod.fees.replace('%', ''));
        fees = (premium * percentage) / 100;
      }
    }
    
    return premium + fees;
  };

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
    onUpdateFormData({ paymentMethod: methodId });
    
    // Clear error if exists
    if (errors.paymentMethod) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.paymentMethod;
        return updated;
      });
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedPaymentMethod) {
      setErrors({ paymentMethod: 'Please select a payment method' });
      return;
    }

    const paymentMethod = PAYMENT_METHODS.find(method => method.id === selectedPaymentMethod);
    
    Alert.alert(
      'Confirm Payment',
      `Proceed with payment of KES ${calculateTotal().toLocaleString()} via ${paymentMethod.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Proceed',
          onPress: () => {
            if (onSubmit) {
              onSubmit();
            }
          }
        }
      ]
    );
  };

  const renderPaymentMethod = (method) => {
    const isSelected = selectedPaymentMethod === method.id;
    
    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentCard,
          isSelected && styles.selectedPayment
        ]}
        onPress={() => handlePaymentMethodSelect(method.id)}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Ionicons 
              name={method.icon} 
              size={24} 
              color={isSelected ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[styles.paymentName, isSelected && styles.selectedPaymentText]}>
              {method.name}
            </Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          )}
        </View>
        
        <Text style={styles.paymentDescription}>{method.description}</Text>
        
        <View style={styles.paymentDetails}>
          <View style={styles.paymentDetailRow}>
            <Text style={styles.detailLabel}>Processing Time:</Text>
            <Text style={styles.detailValue}>{method.processingTime}</Text>
          </View>
          <View style={styles.paymentDetailRow}>
            <Text style={styles.detailLabel}>Fees:</Text>
            <Text style={styles.detailValue}>{method.fees}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Payment & Summary</Text>
        <Text style={styles.stepDescription}>
          Review your quotation details and proceed with payment.
        </Text>

        {/* Quotation Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Quotation Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>PSV Type:</Text>
            <Text style={styles.summaryValue}>{formData.psvType}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle:</Text>
            <Text style={styles.summaryValue}>
              {formData.vehicleMake} {formData.vehicleModel}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Registration:</Text>
            <Text style={styles.summaryValue}>{formData.registrationNumber}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Coverage:</Text>
            <Text style={styles.summaryValue}>Third Party Liability</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Insurer:</Text>
            <Text style={styles.summaryValue}>
              {PAYMENT_METHODS.find(i => i.id === formData.selectedInsurer)?.name || 'Selected Insurer'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Premium:</Text>
            <Text style={styles.summaryValue}>KES {premium.toLocaleString()}</Text>
          </View>
          
          {selectedPaymentMethod && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Processing Fees:</Text>
                <Text style={styles.summaryValue}>
                  KES {(calculateTotal() - premium).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>KES {calculateTotal().toLocaleString()}</Text>
              </View>
            </>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
          <View style={styles.paymentMethodsContainer}>
            {PAYMENT_METHODS.map(renderPaymentMethod)}
          </View>
          
          {errors.paymentMethod && (
            <Text style={styles.errorText}>{errors.paymentMethod}</Text>
          )}
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <View style={styles.termsRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.termsText}>
              I agree to the terms and conditions of the insurance policy
            </Text>
          </View>
          <View style={styles.termsRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.termsText}>
              I confirm that all information provided is accurate and complete
            </Text>
          </View>
        </View>

        {/* Proceed Button */}
        <TouchableOpacity
          style={[
            styles.proceedButton,
            (!selectedPaymentMethod || isSubmitting) && styles.disabledButton
          ]}
          onPress={handleProceedToPayment}
          disabled={!selectedPaymentMethod || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Text style={styles.proceedButtonText}>
                Proceed to Payment
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    padding: Spacing.md,
  },
  stepTitle: {
    ...Typography.heading2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  totalLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 16,
  },
  totalValue: {
    ...Typography.bodyBold,
    color: Colors.primary,
    fontSize: 18,
  },
  paymentSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  paymentMethodsContainer: {
    gap: Spacing.md,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedPayment: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  selectedPaymentText: {
    color: Colors.primary,
  },
  paymentDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  paymentDetails: {
    gap: 4,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.caption,
    color: Colors.text,
  },
  termsContainer: {
    backgroundColor: Colors.lightGreen,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
  },
  proceedButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: Colors.lightGray,
  },
  proceedButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
});

export default PSVPaymentStep;
