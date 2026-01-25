import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DjangoAPIService from '../../services/DjangoAPIService';
import { Colors, Spacing, Typography } from '../../constants';
import { SafeScreen, EnhancedCard, CompactCurvedHeader } from '../../components';

const METHODS = {
  STK: 'STK',
  PAYBILL: 'PAYBILL',
  MANUAL: 'MANUAL',
};

export default function ExtensionPaymentScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();

  const {
    policyId,
    policyNumber,
    balanceAmount = 0,
    lateFeePercentage = 0,
    totalAmount,
    vehicleReg,
    productName,
    extensionDays,
    coverEndDate,
    financialInterest,
  } = route.params || {};

  const months = useMemo(() => {
    const m = Math.ceil(Number(extensionDays || 0) / 30);
    return Math.max(1, Number.isFinite(m) ? m : 1);
  }, [extensionDays]);

  const lateFee = useMemo(() => {
    const b = Number(balanceAmount || 0);
    const pct = Number(lateFeePercentage || 0);
    return b * (pct / 100);
  }, [balanceAmount, lateFeePercentage]);

  const amountDue = useMemo(() => {
    const t = Number(totalAmount);
    if (Number.isFinite(t) && t > 0) return t;
    const b = Number(balanceAmount || 0);
    const v = b + Number(lateFee || 0);
    return Math.round(v * 100) / 100;
  }, [balanceAmount, lateFee, totalAmount]);

  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(METHODS.STK);
  const [phone, setPhone] = useState('');
  const [transactionCode, setTransactionCode] = useState('');

  const canSubmit = useMemo(() => {
    if (!policyNumber) return false;
    if (!amountDue || amountDue <= 0) return false;
    if (selectedMethod === METHODS.STK) return phone.trim().length > 0;
    return transactionCode.trim().length > 0;
  }, [amountDue, phone, policyNumber, selectedMethod, transactionCode]);

  const handleConfirmPayment = async () => {
    if (!policyNumber) {
      Alert.alert('Missing policy', 'Policy number was not provided.');
      return;
    }
    if (!amountDue || amountDue <= 0) {
      Alert.alert('Invalid amount', 'Unable to process payment for this extension.');
      return;
    }

    if (selectedMethod === METHODS.STK && !phone.trim()) {
      Alert.alert('Phone required', 'Enter the M-PESA phone number to receive the STK prompt.');
      return;
    }

    if (selectedMethod !== METHODS.STK && !transactionCode.trim()) {
      Alert.alert('Reference required', 'Enter the M-PESA transaction code/reference to verify.');
      return;
    }

    setSubmitting(true);
    try {
      const paymentMethod =
        selectedMethod === METHODS.STK
          ? 'MPESA_STK'
          : selectedMethod === METHODS.PAYBILL
            ? 'MPESA_PAYBILL'
            : 'MANUAL';

      const transactionId =
        selectedMethod === METHODS.STK
          ? `SIM-STK-${Date.now()}`
          : transactionCode.trim();

      const extensionResponse = await DjangoAPIService.extendMotorPolicy(policyNumber, {
        policy_id: policyId,
        months,
        financial_interest: financialInterest,
        paymentDetails: {
          method: paymentMethod,
          amount: amountDue,
          phone: selectedMethod === METHODS.STK ? phone.trim() : undefined,
          transaction_id: transactionId,
          transactionId,
          status: 'CONFIRMED',
          timestamp: new Date().toISOString(),
        },
      });

      if (extensionResponse?.success) {
        const newExpiry = extensionResponse?.newExpiryDate || extensionResponse?.new_expiry_date;
        const message = newExpiry
          ? `Policy ${policyNumber} extended until ${new Date(newExpiry).toLocaleDateString()}.`
          : `Policy ${policyNumber} has been extended.`;

        Alert.alert('Payment Successful', message, [
          {
            text: 'Go to Upcoming',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Upcoming', params: { refresh: true } }),
          },
        ]);
        return;
      }

      const err = extensionResponse?.error || extensionResponse?.message || 'Failed to extend policy';
      Alert.alert('Extension Failed', err);
    } catch (e) {
      const payload = e?.payload;
      const message = payload?.user_message || payload?.message || payload?.error || e?.message || 'Payment failed';
      Alert.alert('Payment Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeScreen>
      <StatusBar style="light" />
      <CompactCurvedHeader
        title={`Extend Policy - ${vehicleReg || 'Policy'}`}
        subtitle=""
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={[styles.body, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.stepHeader}>
          <View style={styles.stepLine} />
          <View style={styles.stepCircle}>
            <Text style={styles.stepCircleText}>2</Text>
          </View>
          <View style={styles.stepLine} />
        </View>
        <Text style={styles.stepLabel}>Payment</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <EnhancedCard style={styles.card}>
            <Text style={styles.cardTitle}>Policy Details</Text>
            <View style={styles.row}><Text style={styles.label}>Policy Number</Text><Text style={styles.value}>{policyNumber || '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Vehicle Registration</Text><Text style={styles.value}>{vehicleReg || '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Product</Text><Text style={styles.value}>{productName || '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Duration</Text><Text style={styles.value}>{months} month(s)</Text></View>
            {coverEndDate ? (
              <View style={styles.row}><Text style={styles.label}>Previous Expiry</Text><Text style={styles.value}>{new Date(coverEndDate).toLocaleDateString()}</Text></View>
            ) : null}
          </EnhancedCard>

          <EnhancedCard style={styles.card}>
            <Text style={styles.cardTitle}>Amount Due</Text>
            <View style={styles.row}><Text style={styles.label}>Balance</Text><Text style={styles.value}>KES {Number(balanceAmount || 0).toLocaleString()}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Late Fee</Text><Text style={styles.value}>KES {Number(lateFee || 0).toLocaleString()}</Text></View>
            <View style={styles.divider} />
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Pay Now</Text><Text style={styles.totalValue}>KES {Number(amountDue || 0).toLocaleString()}</Text></View>
          </EnhancedCard>

          <EnhancedCard style={styles.card}>
            <Text style={styles.cardTitle}>Payment Method</Text>

            <TouchableOpacity
              style={[styles.methodOption, selectedMethod === METHODS.STK && styles.methodSelected]}
              onPress={() => setSelectedMethod(METHODS.STK)}
              activeOpacity={0.8}
            >
              <View style={styles.methodLeft}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} />
                <View style={styles.methodTextWrap}>
                  <Text style={styles.methodTitle}>Mpesa STK Push</Text>
                  <Text style={styles.methodDesc}>Initiate STK push to customer</Text>
                </View>
              </View>
              {selectedMethod === METHODS.STK ? <Ionicons name="checkmark-circle" size={20} color={Colors.primary} /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodOption, selectedMethod === METHODS.PAYBILL && styles.methodSelected]}
              onPress={() => setSelectedMethod(METHODS.PAYBILL)}
              activeOpacity={0.8}
            >
              <View style={styles.methodLeft}>
                <Ionicons name="cash-outline" size={20} color={Colors.primary} />
                <View style={styles.methodTextWrap}>
                  <Text style={styles.methodTitle}>Mpesa Paybill</Text>
                  <Text style={styles.methodDesc}>Paybill Number: 4114079 • Account: {vehicleReg || 'Vehicle Registration'}</Text>
                </View>
              </View>
              {selectedMethod === METHODS.PAYBILL ? <Ionicons name="checkmark-circle" size={20} color={Colors.primary} /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodOption, selectedMethod === METHODS.MANUAL && styles.methodSelected]}
              onPress={() => setSelectedMethod(METHODS.MANUAL)}
              activeOpacity={0.8}
            >
              <View style={styles.methodLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                <View style={styles.methodTextWrap}>
                  <Text style={styles.methodTitle}>Manual Payment Verification</Text>
                  <Text style={styles.methodDesc}>Submit for manual verification</Text>
                </View>
              </View>
              {selectedMethod === METHODS.MANUAL ? <Ionicons name="checkmark-circle" size={20} color={Colors.primary} /> : null}
            </TouchableOpacity>

            {selectedMethod === METHODS.STK ? (
              <View style={styles.methodForm}>
                <Text style={styles.inputLabel}>Customer Phone Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 0712345678"
                  keyboardType="phone-pad"
                  style={styles.input}
                  editable={!submitting}
                />
              </View>
            ) : (
              <View style={styles.methodForm}>
                <Text style={styles.inputLabel}>Transaction Code</Text>
                <TextInput
                  value={transactionCode}
                  onChangeText={setTransactionCode}
                  placeholder="e.g. QWE12RTY"
                  autoCapitalize="characters"
                  style={styles.input}
                  editable={!submitting}
                />
              </View>
            )}
          </EnhancedCard>
        </ScrollView>

        <TouchableOpacity
          style={[styles.cta, (!canSubmit || submitting) && styles.ctaDisabled]}
          disabled={!canSubmit || submitting}
          activeOpacity={0.85}
          onPress={handleConfirmPayment}
        >
          {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.ctaText}>Confirm Payment</Text>}
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.divider,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.sm,
  },
  stepCircleText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semiBold,
  },
  stepLabel: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    maxWidth: '55%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
  },
  totalValue: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: Colors.background,
  },
  methodSelected: {
    borderColor: Colors.primary,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  methodTextWrap: {
    flex: 1,
  },
  methodTitle: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  methodDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  methodForm: {
    marginTop: Spacing.sm,
  },
  inputLabel: {
    color: Colors.textSecondary,
    marginBottom: 6,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    fontFamily: Typography.fontFamily.regular,
  },
  cta: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
  },
});


