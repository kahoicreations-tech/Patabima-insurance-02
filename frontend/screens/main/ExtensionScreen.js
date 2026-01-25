import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../constants';
import { SafeScreen, EnhancedCard, CompactCurvedHeader } from '../../components';
import ControlledRadioGroup from '../../components/forms/ControlledRadioGroup';
import ControlledSelect from '../../components/forms/ControlledSelect';

export default function ExtensionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const policyDetails = route.params?.policy || null;

  const vehicleReg = policyDetails?.vehicleReg || policyDetails?.vehicle_reg || policyDetails?.vehicle_registration;
  const policyNumber = policyDetails?.policyNo || policyDetails?.policy_number;
  const coverEnd = policyDetails?.cover_end || policyDetails?.dueDate || policyDetails?.expires_at;

  const defaultCoverStart = useMemo(() => {
    try {
      if (!coverEnd) return '';
      const d = new Date(coverEnd);
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString();
    } catch (e) {
      return '';
    }
  }, [coverEnd]);

  const [financialInterest, setFinancialInterest] = useState('No');
  const [durationMonths, setDurationMonths] = useState(1);

  const durationOptions = useMemo(() => ([
    { label: '1 Month', value: 1 },
    { label: '3 Months', value: 3 },
    { label: '6 Months', value: 6 },
    { label: '12 Months', value: 12 },
  ]), []);

  const handleNext = () => {
    if (!policyNumber) return;
    navigation.navigate('ExtensionPayment', {
      policyId: policyDetails?.id,
      policyNumber,
      vehicleReg,
      productName: policyDetails?.productName || policyDetails?.product_name || policyDetails?.coverType,
      extensionDays: durationMonths * 30,
      balanceAmount: Number(policyDetails?.balanceAmount || policyDetails?.balance_amount || 0),
      totalAmount: Math.round(Number(policyDetails?.balanceAmount || policyDetails?.balance_amount || 0)),
      lateFeePercentage: Number(policyDetails?.lateFeePercentage || policyDetails?.late_fee_percentage || 0),
      coverEndDate: coverEnd,
      financialInterest,
    });
  };

  if (!policyDetails) {
    return (
      <SafeScreen>
        <StatusBar style="light" />
        <CompactCurvedHeader title="Extend Policy" subtitle="" showBackButton onBackPress={() => navigation.goBack()} />
      </SafeScreen>
    );
  }
  
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
          <View style={styles.stepCircle}>
            <Text style={styles.stepCircleText}>1</Text>
          </View>
          <Text style={styles.stepLabel}>Policy Holder</Text>
          <View style={styles.stepLine} />
        </View>

        <EnhancedCard style={styles.card}>
          <Text style={styles.cardTitle}>Policy Details</Text>

          <ControlledRadioGroup
            label="Financial Interest"
            options={['Yes', 'No']}
            value={financialInterest}
            onChange={setFinancialInterest}
          />

          <Text style={styles.fieldLabel}>Cover Start Date</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyText}>{defaultCoverStart || '—'}</Text>
          </View>

          <ControlledSelect
            label="Duration"
            value={durationMonths}
            onSelect={setDurationMonths}
            options={durationOptions}
            placeholder="Select duration"
          />
        </EnhancedCard>

        <TouchableOpacity
          style={[styles.nextCta, { marginBottom: 0 }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextCtaText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  stepCircleText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 14,
  },
  stepLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.success,
    marginLeft: Spacing.sm,
    borderRadius: 2,
    opacity: 0.25,
  },

  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  fieldLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  readonlyField: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  readonlyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },

  nextCta: {
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  nextCtaText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  policyCard: {
    marginBottom: Spacing.md,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  policyHeaderText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  policyDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  policyDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  policyDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  periodOption: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedPeriodOption: {
    backgroundColor: Colors.warning + '20',
    borderColor: Colors.warning,
  },
  periodText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  selectedPeriodText: {
    color: Colors.warning,
    fontFamily: Typography.fontFamily.semiBold,
  },
  reasonContainer: {
    marginBottom: Spacing.md,
  },
  reasonOption: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedReasonOption: {
    backgroundColor: Colors.warning + '20',
    borderColor: Colors.warning,
  },
  reasonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  selectedReasonText: {
    color: Colors.warning,
    fontFamily: Typography.fontFamily.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  extensionSummaryCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.warning + '08',
    borderColor: Colors.warning + '40',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: Colors.warning,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  extensionSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  extensionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  extensionIconText: {
    fontSize: 24,
  },
  extensionHeaderInfo: {
    flex: 1,
  },
  extensionSummaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  extensionSummarySubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateItemContainer: {
    flex: 1,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  dateIconText: {
    fontSize: 16,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  dateValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  dateArrow: {
    paddingHorizontal: Spacing.md,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.warning,
    fontFamily: Typography.fontFamily.bold,
  },
  periodInfoContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  periodInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  periodInfoIconText: {
    fontSize: 16,
  },
  periodInfoDetails: {
    flex: 1,
  },
  periodInfoLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  periodInfoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.warning,
  },
  reasonInfoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  premiumCard: {
    marginBottom: Spacing.md,
  },
  premiumHeaderText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  premiumDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  premiumDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  premiumDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  totalPremiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPremiumLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  totalPremiumValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.warning,
  },
  warningCard: {
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning + '30',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  paymentSummaryCard: {
    marginBottom: Spacing.md,
  },
  paymentHeaderText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  paymentDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  paymentDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  paymentDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  totalPaymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPaymentLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  totalPaymentValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.warning,
  },
  paymentMethodsTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  paymentMethodCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  paymentMethodIconText: {
    fontSize: 20,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  paymentMethodDescription: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  paymentMethodArrow: {
    fontSize: Typography.fontSize.md,
    color: Colors.warning,
    fontFamily: Typography.fontFamily.semiBold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    padding: Spacing.md,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  backButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.warning,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  disabledButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  disabledButtonText: {
    color: Colors.textSecondary,
  },
});
