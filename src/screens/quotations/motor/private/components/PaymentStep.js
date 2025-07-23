/**
 * PaymentStep - Reusable component for M-Pesa payment processing
 * Used across all private motor insurance quotation flows
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const PaymentStep = ({
  formData,
  onUpdateFormData,
  paymentState,
  onInitiatePayment,
  onRetryPayment,
  showHeader = true,
  serviceFee = 50,
  insuranceType = 'Motor Insurance'
}) => {
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  // Format number with commas
  const formatNumber = (value) => {
    if (!value) return '0';
    return Math.round(value).toLocaleString();
  };

  // Handle phone number input
  const handlePhoneNumberChange = (text) => {
    // Remove any non-numeric characters and limit to 9 digits
    const cleanText = text.replace(/[^0-9]/g, '').substring(0, 9);
    updateFormData({ mpesaPhoneNumber: cleanText });
  };

  // Calculate total amount
  const premiumAmount = formData.selectedQuote?.totalPremium || 0;
  const totalAmount = premiumAmount + serviceFee;

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Complete Payment</Text>
          <Text style={styles.stepSubtitle}>Secure payment for your {insuranceType}</Text>
        </>
      )}

      {/* Payment Summary */}
      <View style={styles.paymentSummaryCard}>
        <View style={styles.paymentSummaryHeader}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
          <Text style={styles.paymentSummaryTitle}>Payment Summary</Text>
        </View>
        
        <View style={styles.paymentDetailsRow}>
          <Text style={styles.paymentLabel}>Premium Amount:</Text>
          <Text style={styles.paymentValue}>KSh {formatNumber(premiumAmount)}</Text>
        </View>
        
        <View style={styles.paymentDetailsRow}>
          <Text style={styles.paymentLabel}>Service Fee:</Text>
          <Text style={styles.paymentValue}>KSh {formatNumber(serviceFee)}</Text>
        </View>
        
        <View style={[styles.paymentDetailsRow, styles.totalPaymentRow]}>
          <Text style={styles.totalPaymentLabel}>Total Amount:</Text>
          <Text style={styles.totalPaymentValue}>KSh {formatNumber(totalAmount)}</Text>
        </View>
      </View>

      {/* M-Pesa Payment Form */}
      <View style={styles.paymentFormCard}>
        <View style={styles.mpesaHeader}>
          <View style={styles.mpesaLogo}>
            <Ionicons name="phone-portrait" size={24} color="#00A651" />
            <Text style={styles.mpesaLogoText}>M-PESA</Text>
          </View>
          <Text style={styles.mpesaDescription}>Pay securely with M-Pesa</Text>
        </View>

        {!paymentState?.paymentInitiated ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+254</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="7XXXXXXXX"
                  value={formData.mpesaPhoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  keyboardType="numeric"
                  maxLength={9}
                />
                </View>
                {formData.mpesaPhoneNumber && formData.mpesaPhoneNumber.length !== 9 && (
                  <Text style={styles.validationError}>Please enter a valid 9-digit phone number</Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.payButton,
                  (!formData.mpesaPhoneNumber || formData.mpesaPhoneNumber.length !== 9) && styles.disabledButton
                ]}
                onPress={onInitiatePayment}
                disabled={!formData.mpesaPhoneNumber || formData.mpesaPhoneNumber.length !== 9}
              >
                <Ionicons name="card" size={20} color="white" />
                <Text style={styles.payButtonText}>
                  Pay KSh {formatNumber(totalAmount)}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.paymentStatusContainer}>
              {paymentState.isProcessing && !paymentState.paymentCompleted && (
                <>
                  <View style={styles.processingHeader}>
                    <Ionicons name="time" size={24} color={Colors.primary} />
                    <Text style={styles.processingTitle}>Payment Processing</Text>
                  </View>
                  
                  <Text style={styles.processingMessage}>
                    A payment request has been sent to +254{formData.mpesaPhoneNumber}
                  </Text>
                  
                  {paymentState.countdown > 0 && (
                    <Text style={styles.countdownText}>
                      Complete payment within: {paymentState.countdown}s
                    </Text>
                  )}
                  
                  <View style={styles.processingSteps}>
                    <Text style={styles.stepInstruction}>1. Check your phone for M-Pesa prompt</Text>
                    <Text style={styles.stepInstruction}>2. Enter your M-Pesa PIN</Text>
                    <Text style={styles.stepInstruction}>3. Confirm the payment</Text>
                  </View>
                  
                  <View style={styles.loadingIndicator}>
                    <Ionicons name="refresh" size={24} color={Colors.primary} />
                    <Text style={styles.loadingText}>Waiting for payment confirmation...</Text>
                  </View>
                </>
              )}

              {paymentState.paymentCompleted && (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
                  <Text style={styles.successTitle}>Payment Successful!</Text>
                  <Text style={styles.successMessage}>
                    Transaction ID: {formData.transactionId}
                  </Text>
                  <Text style={styles.successSubMessage}>
                    Your {insuranceType} policy is now active
                  </Text>
                </View>
              )}

              {paymentState.paymentError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="close-circle" size={48} color={Colors.error} />
                  <Text style={styles.errorTitle}>Payment Failed</Text>
                  <Text style={styles.errorMessage}>{paymentState.paymentError}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRetryPayment}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
        <Text style={styles.securityText}>Your payment is secured with 256-bit encryption</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_700Bold',
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: 'Poppins_400Regular',
  },
  paymentSummaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  paymentSummaryTitle: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  paymentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  paymentLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  paymentValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  totalPaymentRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalPaymentLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  totalPaymentValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  paymentMethodsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: 'Poppins_500Medium',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  disabledPaymentMethod: {
    opacity: 0.5,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  paymentMethodDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  disabledText: {
    color: Colors.textMuted,
  },
  comingSoonText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    fontFamily: 'Poppins_400Regular',
  },
  paymentFormCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mpesaHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mpesaLogo: {
    backgroundColor: '#00A651',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  mpesaLogoText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: 'Poppins_700Bold',
  },
  mpesaDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_500Medium',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  countryCode: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    fontFamily: 'Poppins_500Medium',
  },
  phoneInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  validationError: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontFamily: 'Poppins_400Regular',
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },
  payButtonText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: 'white',
    fontFamily: 'Poppins_700Bold',
  },
  paymentStatusContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  processingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  processingTitle: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  processingMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: 'Poppins_400Regular',
  },
  countdownText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.lg,
    fontFamily: 'Poppins_700Bold',
  },
  processingSteps: {
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  stepInstruction: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_700Bold',
  },
  successMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
  },
  successSubMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_700Bold',
  },
  errorMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontFamily: 'Poppins_400Regular',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: 'Poppins_500Medium',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.success}15`,
    padding: Spacing.sm,
    borderRadius: 8,
  },
  securityText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontFamily: 'Poppins_400Regular',
  },
});

export default PaymentStep;
