/**
 * Step 7: Payment
 * Uses shared Payment component from Motor2
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMotor3 } from '../../contexts/Motor3Context';
import { useThirdParty } from '../../contexts/ThirdPartyContext';
import EnhancedPayment from '../../shared/Payment/Payment/EnhancedPayment';
import StepNavigation from './StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';
import DjangoAPIService from '../../../../../services/DjangoAPIService';

const Step7_Payment = ({ onNext, onBack, currentStep, totalSteps }) => {
  const { setPaymentDetails, clientDetails, selectedSubcategory } = useMotor3();
  const thirdParty = useThirdParty();
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState(clientDetails?.phone || '');
  const [manualReference, setManualReference] = useState('');

  const selectedProduct = useMemo(
    () => thirdParty.selectedProduct || selectedSubcategory || null,
    [thirdParty.selectedProduct, selectedSubcategory]
  );

  const vehicleData = useMemo(
    () => ({
      registrationNumber: thirdParty.registrationNumber,
      registration: thirdParty.registrationNumber,
      identificationType: thirdParty.identificationType,
      chasisNumber: thirdParty.chasisNumber,
      cover_start_date: thirdParty.cover_start_date,
      financialInterest: thirdParty.financialInterest,
      make: thirdParty.make,
      model: thirdParty.model,
      year: thirdParty.year,
      color: thirdParty.color,
      logbookNumber: thirdParty.logbookNumber,
      engineNumber: thirdParty.engineNumber,
    }),
    [
      thirdParty.registrationNumber,
      thirdParty.identificationType,
      thirdParty.chasisNumber,
      thirdParty.cover_start_date,
      thirdParty.financialInterest,
      thirdParty.make,
      thirdParty.model,
      thirdParty.year,
      thirdParty.color,
      thirdParty.logbookNumber,
      thirdParty.engineNumber,
    ]
  );

  const resolvedUnderwriter = thirdParty.selectedUnderwriter || null;

  const displayPremium = useMemo(() => {
    const uw = resolvedUnderwriter;
    if (!uw || typeof uw !== 'object') return null;

    const bd = uw.premium_breakdown || uw.breakdown || {};
    const base = Number(bd.base_premium ?? bd.base ?? uw.base_premium ?? uw.basicPremium ?? 0);
    const itl = Number(bd.training_levy ?? bd.itl ?? uw.training_levy ?? (base * 0.0025));
    const pcf = Number(bd.pcf_levy ?? bd.pcf ?? uw.pcf_levy ?? (base * 0.0025));
    const stamp = Number(bd.stamp_duty ?? uw.stamp_duty ?? 40);
    const total = Number(uw.total_premium ?? uw.totalPremium ?? bd.total_premium ?? (base + itl + pcf + stamp));

    return {
      base_premium: base,
      training_levy: itl,
      pcf_levy: pcf,
      stamp_duty: stamp,
      total_premium: total,
      totalPremium: total,
      breakdown: { base_premium: base, training_levy: itl, pcf_levy: pcf, stamp_duty: stamp },
      underwriter_name: uw?.name || uw?.underwriter_name || uw?.company_name,
      underwriter_code: uw?.code || uw?.company_code || uw?.underwriter_code,
    };
  }, [resolvedUnderwriter]);

  const [paymentMethod, setPaymentMethod] = useState('MPESA');
  const [additionalCoverages, setAdditionalCoverages] = useState([]);

  const handlePaymentMethodChange = useCallback((method) => {
    setPaymentMethod(method);
  }, []);

  const handleCoverageChange = useCallback((coverages) => {
    setAdditionalCoverages(Array.isArray(coverages) ? coverages : []);
  }, []);

  const handleNext = useCallback(async () => {
    const amount = displayPremium?.total_premium ?? resolvedUnderwriter?.total_premium ?? 0;
    
    console.log('[Step7_Payment] handleNext called', {
      paymentMethod,
      amount,
      clientDetails,
      hasPhone: !!(clientDetails?.phone)
    });
    
    // Save payment details to context
    setPaymentDetails({
      payment_method: paymentMethod,
      method: paymentMethod,
      amount,
      additional_coverages: additionalCoverages,
      created_at: new Date().toISOString(),
    });

    // If M-PESA selected, show payment drawer
    if (paymentMethod === 'MPESA') {
      setPaymentPhone(clientDetails?.phone || '');
      setShowPaymentDrawer(true);
    } else if (paymentMethod === 'DPO') {
      Alert.alert('Coming Soon', 'Card payment will be available soon!');
    } else {
      onNext?.();
    }
  }, [
    setPaymentDetails, 
    paymentMethod, 
    displayPremium, 
    resolvedUnderwriter, 
    additionalCoverages, 
    clientDetails,
    onNext
  ]);

  const processPayment = useCallback(async () => {
    const amount = displayPremium?.total_premium ?? resolvedUnderwriter?.total_premium ?? 0;
    
    if (paymentMethod === 'MPESA') {
      if (!paymentPhone || paymentPhone.trim() === '') {
        Alert.alert('Phone Required', 'Please enter your M-PESA phone number');
        return;
      }
      // Validate phone format (basic)
      const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
      if (!phoneRegex.test(paymentPhone.replace(/\s/g, ''))) {
        Alert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
        return;
      }
    }

    setShowPaymentDrawer(false);
    
    try {
      setIsProcessingPayment(true);
      setPaymentStatus('Initiating M-PESA payment...');
      console.log('[Step7_Payment] Initiating payment:', { amount: Math.round(amount), phone: paymentPhone });

      if (paymentMethod === 'MPESA') {
        // Initiate STK Push
        const initiateResponse = await DjangoAPIService.initiatePayment({
          amount: Math.round(amount),
          method: 'MPESA',
          phone: paymentPhone,
        });

        if (!initiateResponse || !initiateResponse.checkout_request_id) {
          throw new Error('Failed to initiate payment');
        }

        const checkoutRequestId = initiateResponse.checkout_request_id;
        setPaymentStatus('M-PESA prompt sent to your phone. Please enter PIN...');

        // Sandbox: auto-success immediately after STK push
        setPaymentStatus('Payment successful!');
        setIsProcessingPayment(false);
        setPaymentDetails({
          payment_method: 'MPESA',
          method: 'MPESA',
          amount,
          additional_coverages: additionalCoverages,
          created_at: new Date().toISOString(),
          checkout_request_id: checkoutRequestId,
          transaction_id: initiateResponse?.merchant_request_id || undefined,
          status: 'SUCCESS',
        });
        Alert.alert('Success', 'Payment received successfully!', [
          { text: 'OK', onPress: () => onNext?.() }
        ]);
        return;
      }

      if (paymentMethod === 'MANUAL') {
        // Record manual payment and proceed
        setPaymentStatus('Manual payment recorded');
        setIsProcessingPayment(false);
        setPaymentDetails({
          payment_method: 'MANUAL',
          method: 'MANUAL',
          amount,
          additional_coverages: additionalCoverages,
          created_at: new Date().toISOString(),
          manual_reference: manualReference,
          status: 'SUCCESS',
        });
        Alert.alert('Success', 'Manual payment confirmed.', [
          { text: 'OK', onPress: () => onNext?.() }
        ]);
        return;
      }

      // Poll payment status with 20s timeout total
      const POLL_INTERVAL_MS = 2000; // 2s
      const TIMEOUT_MS = 20000; // 20s total
      const deadline = Date.now() + TIMEOUT_MS;
      let attempts = 0;

      const pollPaymentStatus = async () => {
        attempts++;
        
        try {
          const statusResponse = await DjangoAPIService.getPaymentStatus(checkoutRequestId);
          
          if (statusResponse.status === 'SUCCESS' || statusResponse.status === 'COMPLETED') {
            setPaymentStatus('Payment successful!');
            setIsProcessingPayment(false);
            
            // Save transaction details
            setPaymentDetails({
              payment_method: 'MPESA',
              method: 'MPESA',
              amount,
              additional_coverages: additionalCoverages,
              created_at: new Date().toISOString(),
              checkout_request_id: checkoutRequestId,
              transaction_id: statusResponse.transaction_id,
              status: 'SUCCESS',
            });

            Alert.alert('Success', 'Payment received successfully!', [
              { text: 'OK', onPress: () => onNext?.() }
            ]);
            return;
          } 
          
          if (statusResponse.status === 'FAILED' || statusResponse.status === 'CANCELLED') {
            throw new Error(statusResponse.message || 'Payment failed');
          }
          
          // Still pending, continue polling until deadline
          if (Date.now() < deadline) {
            setTimeout(pollPaymentStatus, POLL_INTERVAL_MS);
          } else {
            // Timeout - still pending after ~20 seconds
            setIsProcessingPayment(false);
            Alert.alert(
              'Payment Timeout',
              'Payment is still processing. We will notify you once completed.',
              [{ text: 'OK', onPress: () => onNext?.() }]
            );
          }
        } catch (pollError) {
          if (Date.now() < deadline) {
            // Retry on error
            setTimeout(pollPaymentStatus, POLL_INTERVAL_MS);
          } else {
            // Stop polling and surface graceful timeout
            setIsProcessingPayment(false);
            Alert.alert(
              'Payment Timeout',
              'Payment is still processing. We will notify you once completed.',
              [{ text: 'OK', onPress: () => onNext?.() }]
            );
          }
        }
      };

      // Start polling
      setTimeout(pollPaymentStatus, POLL_INTERVAL_MS);

    } catch (error) {
      setIsProcessingPayment(false);
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to process payment. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [displayPremium, resolvedUnderwriter, paymentPhone, additionalCoverages, setPaymentDetails, onNext]);

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      
      <EnhancedPayment
        selectedProduct={selectedProduct}
        vehicleData={vehicleData}
        premium={displayPremium}
        underwriter={resolvedUnderwriter}
        clientDetails={clientDetails}
        additionalCoverages={additionalCoverages}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        onCoverageChange={handleCoverageChange}
      />
      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={handleNext}
        nextDisabled={isProcessingPayment}
      />
      
      {/* Payment Processing Overlay */}
      {isProcessingPayment && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size="large" color="#D5222B" />
            <Text style={styles.overlayText}>{paymentStatus}</Text>
          </View>
        </View>
      )}
      
      {/* Payment Confirmation Drawer */}
      <Modal
        visible={showPaymentDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentDrawer(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Drawer Header */}
              <View style={styles.drawerHeader}>
                <View style={styles.drawerHandle} />
                <Text style={styles.drawerTitle}>Complete Payment</Text>
                <TouchableOpacity 
                  onPress={() => setShowPaymentDrawer(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#646767" />
                </TouchableOpacity>
              </View>

              {/* Payment Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Payment Summary</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Policy Type:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedProduct?.name || 'PRIVATE TOR'}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Underwriter:</Text>
                  <Text style={styles.summaryValue}>
                    {resolvedUnderwriter?.name || resolvedUnderwriter?.underwriter_name || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Vehicle:</Text>
                  <Text style={styles.summaryValue}>
                    {vehicleData?.registrationNumber || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.summaryDivider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Base Premium:</Text>
                  <Text style={styles.summaryValue}>
                    KSh {(displayPremium?.base_premium || 0).toLocaleString()}
                  </Text>
                </View>
                
                {/* IRA Levy removed to create space */}
                
                {/* Training Levy removed to create space */}
                
                {/* Stamp Duty removed to create space */}
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalValue}>
                    KSh {(displayPremium?.total_premium || resolvedUnderwriter?.total_premium || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Payment Details Input (conditional) */}
              {paymentMethod === 'MPESA' && (
                <View style={styles.phoneSection}>
                  <Text style={styles.phoneLabel}>M-PESA Phone Number</Text>
                  <Text style={styles.phoneHint}>Enter the number that will receive the STK Push prompt</Text>
                  <View style={styles.phoneInputContainer}>
                    <Ionicons name="call" size={20} color="#22c55e" style={styles.phoneIcon} />
                    <TextInput
                      style={styles.phoneInput}
                      value={paymentPhone}
                      onChangeText={setPaymentPhone}
                      placeholder="e.g., 0712345678"
                      keyboardType="phone-pad"
                      maxLength={13}
                      autoFocus={!paymentPhone}
                    />
                  </View>
                </View>
              )}

              {paymentMethod === 'MANUAL' && (
                <View style={styles.phoneSection}>
                  <Text style={styles.phoneLabel}>Manual Payment Reference</Text>
                  <Text style={styles.phoneHint}>Add any reference or note (optional)</Text>
                  <View style={styles.phoneInputContainer}>
                    <Ionicons name="create" size={20} color="#f59e0b" style={styles.phoneIcon} />
                    <TextInput
                      style={styles.phoneInput}
                      value={manualReference}
                      onChangeText={setManualReference}
                      placeholder="e.g., Cash at branch, Bank slip #123"
                      keyboardType="default"
                      maxLength={64}
                    />
                  </View>
                </View>
              )}

              {/* Instructions */}
              <View style={styles.instructionsCard}>
                <Ionicons name="information-circle" size={20} color="#0c4a6e" />
                <Text style={styles.instructionsTitle}>What happens next:</Text>
                <Text style={styles.instructionText}>• STK push sent to your phone</Text>
                <Text style={styles.instructionText}>• Enter your M-PESA PIN</Text>
                <Text style={styles.instructionText}>• Wait for confirmation</Text>
              </View>

              {/* Confirm Button */}
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={processPayment}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>
                  {paymentMethod === 'MANUAL' ? 'Confirm Manual Payment' : 'Confirm & Pay'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Step7_Payment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 250,
  },
  overlayText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#646767',
    textAlign: 'center',
  },
  // Payment Drawer Styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    color: '#1a1a1a',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 8,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#646767',
    fontFamily: 'Poppins-Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Poppins-SemiBold',
  },
  summaryLabelSmall: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Poppins-Regular',
  },
  summaryValueSmall: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'Poppins-Regular',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#D5222B',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Poppins-Bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D5222B',
    fontFamily: 'Poppins-Bold',
  },
  phoneSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  phoneLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  phoneHint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#22c55e',
    paddingHorizontal: 12,
  },
  phoneIcon: {
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    paddingVertical: 14,
    color: '#1a1a1a',
  },
  instructionsCard: {
    backgroundColor: '#e7f3ff',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginTop: 4,
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  instructionText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  confirmButton: {
    backgroundColor: '#22c55e',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    marginLeft: 8,
  },
});
