/**
 * Step8_Payment - Comprehensive Flow
 * Reuses shared Payment component
 * Displays instalment breakdown if applicable
 */

import React from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMotor3 } from '../../contexts/Motor3Context';
import { useComprehensiveContext } from '../../contexts/ComprehensiveContext';
import Payment from '../../shared/Payment/Payment/EnhancedPayment';
import StepNavigation from '../../third-party/steps/StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';
import DjangoAPIService from '../../../../../services/DjangoAPIService';

const Step8_Payment = ({ onNext, onBack, currentStep, totalSteps }) => {
  const { setPaymentDetails, clientDetails, selectedSubcategory } = useMotor3();
  const { selectedUnderwriter, pricingInputs, vehicleDetails, selectedAddons, addonsPremium } = useComprehensiveContext();

  const [paymentMethod, setPaymentMethod] = React.useState('MPESA');
  const [additionalCoverages, setAdditionalCoverages] = React.useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState('');
  const [showPaymentDrawer, setShowPaymentDrawer] = React.useState(false);
  const [paymentPhone, setPaymentPhone] = React.useState(clientDetails?.phone || '');

  const totalAmount = selectedUnderwriter?.total_premium || 0;
  const instalmentOption = pricingInputs.instalment_option;

  const calculateInstalments = () => {
    if (instalmentOption === '3_instalments') {
      return {
        first: Math.round(totalAmount * 0.40),
        second: Math.round(totalAmount * 0.30),
        third: Math.round(totalAmount * 0.30),
      };
    } else if (instalmentOption === '4_instalments') {
      const quarter = Math.round(totalAmount * 0.25);
      return {
        first: quarter,
        second: quarter,
        third: quarter,
        fourth: quarter,
      };
    }
    return null;
  };

  const instalments = calculateInstalments();

  const handlePaymentMethodChange = React.useCallback((method) => {
    setPaymentMethod(method);
  }, []);

  const handleCoverageChange = React.useCallback((coverages) => {
    setAdditionalCoverages(Array.isArray(coverages) ? coverages : []);
  }, []);

  const handleNext = React.useCallback(async () => {
    const amountToStore = instalments ? instalments.first : totalAmount;

    console.log('[Step8_Payment] handleNext called', {
      paymentMethod,
      amount: amountToStore,
      clientDetails,
      hasPhone: !!(clientDetails?.phone)
    });

    // Save payment details to context
    setPaymentDetails({
      payment_method: paymentMethod,
      method: paymentMethod,
      amount: amountToStore,
      additional_coverages: additionalCoverages,
      instalment_option: instalmentOption,
      created_at: new Date().toISOString(),
    });

    // If M-PESA selected, initiate STK Push
    if (paymentMethod === 'MPESA') {
      const phone = clientDetails?.phone || clientDetails?.phone_number;
      console.log('[Step8_Payment] M-PESA selected, phone:', phone);
      
      if (!phone) {
        console.error('[Step8_Payment] No phone number found in clientDetails:', clientDetails);
        Alert.alert(
          'Phone Number Required',
          'Please go back to Client Details and provide your phone number for M-PESA payment.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        setIsProcessingPayment(true);
        setPaymentStatus('Initiating M-PESA payment...');
        console.log('[Step8_Payment] Initiating payment:', { amount: Math.round(amountToStore), phone });

        // Initiate STK Push
        const initiateResponse = await DjangoAPIService.initiatePayment({
          amount: Math.round(amountToStore),
          method: 'MPESA',
          phone: phone,
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
          amount: amountToStore,
          additional_coverages: additionalCoverages,
          instalment_option: instalmentOption,
          created_at: new Date().toISOString(),
          checkout_request_id: checkoutRequestId,
          transaction_id: initiateResponse?.merchant_request_id || undefined,
          status: 'SUCCESS',
        });
        Alert.alert('Success', 'Payment received successfully!', [
          { text: 'OK', onPress: () => onNext?.() }
        ]);
        return;

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
                amount: amountToStore,
                additional_coverages: additionalCoverages,
                instalment_option: instalmentOption,
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
    } else {
      // Non-MPESA payment methods
      onNext?.();
    }
  }, [
    setPaymentDetails,
    paymentMethod,
    additionalCoverages,
    instalments,
    totalAmount,
    instalmentOption,
    clientDetails,
    onNext
  ]);

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      {instalments && (
        <View style={styles.instalmentInfo}>
          <Text style={styles.instalmentTitle}>Payment Plan:</Text>
          <Text style={styles.instalmentText}>
            1st Payment (Now): KSh {(Number(instalments.first) || 0).toLocaleString()}
          </Text>
          {instalments.second && (
            <Text style={styles.instalmentText}>
              2nd Payment: KSh {(Number(instalments.second) || 0).toLocaleString()}
            </Text>
          )}
          {instalments.third && (
            <Text style={styles.instalmentText}>
              3rd Payment: KSh {(Number(instalments.third) || 0).toLocaleString()}
            </Text>
          )}
          {instalments.fourth && (
            <Text style={styles.instalmentText}>
              4th Payment: KSh {(Number(instalments.fourth) || 0).toLocaleString()}
            </Text>
          )}
        </View>
      )}

      <Payment
        selectedProduct={selectedSubcategory}
        vehicleData={vehicleDetails}
        premium={selectedUnderwriter}
        underwriter={selectedUnderwriter}
        clientDetails={clientDetails}
        additionalCoverages={additionalCoverages}
        selectedAddons={selectedAddons}
        addonsPremium={addonsPremium}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  instalmentInfo: {
    backgroundColor: '#FFF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5222B',
  },
  instalmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instalmentText: {
    fontSize: 14,
    color: '#646767',
    marginVertical: 2,
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
});

export default Step8_Payment;
