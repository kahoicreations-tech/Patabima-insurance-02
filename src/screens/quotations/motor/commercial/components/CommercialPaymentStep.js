/**
 * Commercial Payment Step Component
 * Handles payment and final summary for commercial vehicle insurance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const CommercialPaymentStep = ({ 
  formData, 
  onUpdateFormData,
  onSubmit,
  onBack,
  paymentState,
  setPaymentState,
  premium = 0,
  coverageType = 'third_party',
  coverageLevel = null 
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(formData.paymentMethod || '');
  const [paymentSchedule, setPaymentSchedule] = useState(formData.paymentSchedule || 'annual');

  // Payment methods for commercial insurance
  const PAYMENT_METHODS = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      description: 'Pay instantly via M-Pesa mobile money',
      icon: 'phone-portrait',
      fees: 0,
      processingTime: 'Instant'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer or EFT',
      icon: 'card',
      fees: 0,
      processingTime: '1-2 business days'
    },
    {
      id: 'cheque',
      name: 'Company Cheque',
      description: 'Business cheque payment',
      icon: 'document-text',
      fees: 0,
      processingTime: '3-5 business days'
    },
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Visa, MasterCard payment',
      icon: 'card-outline',
      fees: Math.round(premium * 0.025), // 2.5% processing fee
      processingTime: 'Instant'
    }
  ];

  // Payment schedule options
  const PAYMENT_SCHEDULES = [
    {
      id: 'annual',
      name: 'Annual Payment',
      discount: 0,
      description: 'Pay full premium upfront'
    },
    {
      id: 'semi_annual',
      name: 'Semi-Annual',
      discount: -0.03, // 3% increase for installments
      description: 'Pay in 2 installments'
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      discount: -0.05, // 5% increase for installments
      description: 'Pay in 4 installments'
    }
  ];

  const calculateAdjustedPremium = () => {
    const schedule = PAYMENT_SCHEDULES.find(s => s.id === paymentSchedule);
    const scheduleAdjustment = schedule ? schedule.discount : 0;
    const adjustedPremium = premium * (1 + scheduleAdjustment);
    
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod);
    const processingFees = selectedMethod ? selectedMethod.fees : 0;
    
    return adjustedPremium + processingFees;
  };

  const getInstallmentAmount = () => {
    const adjustedPremium = calculateAdjustedPremium();
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod);
    const processingFees = selectedMethod ? selectedMethod.fees : 0;
    const premiumWithoutFees = adjustedPremium - processingFees;
    
    switch (paymentSchedule) {
      case 'semi_annual':
        return premiumWithoutFees / 2;
      case 'quarterly':
        return premiumWithoutFees / 4;
      default:
        return adjustedPremium;
    }
  };

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
    onUpdateFormData({ paymentMethod: methodId });
  };

  const handlePaymentScheduleSelect = (scheduleId) => {
    setPaymentSchedule(scheduleId);
    onUpdateFormData({ paymentSchedule: scheduleId });
  };

  const renderPaymentMethod = (method) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethodCard,
        selectedPaymentMethod === method.id && styles.paymentMethodCardSelected
      ]}
      onPress={() => handlePaymentMethodSelect(method.id)}
    >
      <View style={styles.paymentMethodHeader}>
        <View style={styles.paymentMethodInfo}>
          <View style={styles.paymentMethodTitle}>
            <Ionicons name={method.icon} size={20} color={Colors.primary} />
            <Text style={styles.paymentMethodName}>{method.name}</Text>
          </View>
          <Text style={styles.paymentMethodDescription}>{method.description}</Text>
          <Text style={styles.paymentMethodMeta}>
            Processing: {method.processingTime}
            {method.fees > 0 && ` • Fees: KSh ${method.fees.toLocaleString()}`}
          </Text>
        </View>
        <View style={[
          styles.radioButton,
          selectedPaymentMethod === method.id && styles.radioButtonSelected
        ]}>
          {selectedPaymentMethod === method.id && (
            <View style={styles.radioButtonInner} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPaymentSchedule = (schedule) => {
    const adjustedPremium = premium * (1 + schedule.discount);
    
    return (
      <TouchableOpacity
        key={schedule.id}
        style={[
          styles.scheduleCard,
          paymentSchedule === schedule.id && styles.scheduleCardSelected
        ]}
        onPress={() => handlePaymentScheduleSelect(schedule.id)}
      >
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleName}>{schedule.name}</Text>
            <Text style={styles.scheduleDescription}>{schedule.description}</Text>
            {schedule.discount !== 0 && (
              <Text style={[
                styles.scheduleDiscount,
                schedule.discount > 0 ? styles.discountPositive : styles.discountNegative
              ]}>
                {schedule.discount > 0 ? '-' : '+'}{Math.abs(schedule.discount * 100)}% 
                {schedule.discount > 0 ? ' discount' : ' for installments'}
              </Text>
            )}
          </View>
          <View style={styles.schedulePricing}>
            <Text style={styles.scheduleTotal}>KSh {adjustedPremium.toLocaleString()}</Text>
            {schedule.id !== 'annual' && (
              <Text style={styles.scheduleInstallment}>
                KSh {(adjustedPremium / (schedule.id === 'semi_annual' ? 2 : 4)).toLocaleString()} per payment
              </Text>
            )}
          </View>
          <View style={[
            styles.radioButton,
            paymentSchedule === schedule.id && styles.radioButtonSelected
          ]}>
            {paymentSchedule === schedule.id && (
              <View style={styles.radioButtonInner} />
            )}
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
          Review your quotation details and select your payment preferences.
        </Text>

        {/* Quotation Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Commercial Vehicle Insurance Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Business:</Text>
            <Text style={styles.summaryValue}>{formData.businessName}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle:</Text>
            <Text style={styles.summaryValue}>
              {formData.vehicleMake} {formData.vehicleModel} ({formData.vehicleYear})
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Category:</Text>
            <Text style={styles.summaryValue}>{formData.commercialSubCategory}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Coverage:</Text>
            <Text style={styles.summaryValue}>
              {coverageType === 'comprehensive' ? 'Comprehensive' : 'Third Party'}
              {coverageLevel && ` - ${coverageLevel.name}`}
            </Text>
          </View>
          
          {formData.vehicleValue && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vehicle Value:</Text>
              <Text style={styles.summaryValue}>KSh {parseInt(formData.vehicleValue).toLocaleString()}</Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Base Premium:</Text>
            <Text style={styles.totalValue}>KSh {premium.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Schedule</Text>
          {PAYMENT_SCHEDULES.map(renderPaymentSchedule)}
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map(renderPaymentMethod)}
        </View>

        {/* Insurance Start Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Policy Details</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Insurance Start Date *</Text>
            <TextInput
              style={styles.input}
              value={formData.insuranceStartDate || ''}
              onChangeText={(value) => onUpdateFormData({ insuranceStartDate: value })}
              placeholder="DD/MM/YYYY"
            />
          </View>
        </View>

        {/* Final Total */}
        {selectedPaymentMethod && (
          <View style={styles.finalTotalCard}>
            <Text style={styles.finalTotalTitle}>Payment Summary</Text>
            
            <View style={styles.totalBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Base Premium:</Text>
                <Text style={styles.breakdownValue}>KSh {premium.toLocaleString()}</Text>
              </View>
              
              {paymentSchedule !== 'annual' && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Installment Fee:</Text>
                  <Text style={styles.breakdownValue}>
                    +KSh {(calculateAdjustedPremium() - premium - (PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.fees || 0)).toLocaleString()}
                  </Text>
                </View>
              )}
              
              {PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.fees > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Processing Fees:</Text>
                  <Text style={styles.breakdownValue}>
                    +KSh {PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.fees.toLocaleString()}
                  </Text>
                </View>
              )}
              
              <View style={[styles.breakdownRow, styles.totalBreakdownRow]}>
                <Text style={styles.finalTotalLabel}>Total Amount:</Text>
                <Text style={styles.finalTotalValue}>KSh {calculateAdjustedPremium().toLocaleString()}</Text>
              </View>
              
              {paymentSchedule !== 'annual' && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.installmentLabel}>Per Payment:</Text>
                  <Text style={styles.installmentValue}>KSh {getInstallmentAmount().toLocaleString()}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.gray} />
          <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.button, 
            styles.submitButton,
            (!selectedPaymentMethod) && styles.submitButtonDisabled
          ]} 
          onPress={selectedPaymentMethod ? onSubmit : null}
          disabled={!selectedPaymentMethod}
        >
          <Text style={[styles.buttonText, styles.submitButtonText]}>Submit Quote</Text>
          <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
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
    ...Typography.h2,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.gray,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.h4,
    color: Colors.dark,
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
    color: Colors.gray,
  },
  summaryValue: {
    ...Typography.body,
    color: Colors.dark,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    ...Typography.h4,
    color: Colors.dark,
  },
  totalValue: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  scheduleCard: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  scheduleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  scheduleDescription: {
    ...Typography.caption,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  scheduleDiscount: {
    ...Typography.caption,
    fontWeight: '600',
  },
  discountPositive: {
    color: Colors.success,
  },
  discountNegative: {
    color: Colors.warning,
  },
  schedulePricing: {
    alignItems: 'flex-end',
    marginRight: Spacing.md,
  },
  scheduleTotal: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  scheduleInstallment: {
    ...Typography.caption,
    color: Colors.gray,
  },
  paymentMethodCard: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  paymentMethodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  paymentMethodName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginLeft: Spacing.sm,
  },
  paymentMethodDescription: {
    ...Typography.caption,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  paymentMethodMeta: {
    ...Typography.caption,
    color: Colors.gray,
    fontSize: 10,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    backgroundColor: Colors.white,
  },
  finalTotalCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  finalTotalTitle: {
    ...Typography.h4,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  totalBreakdown: {
    marginTop: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    ...Typography.body,
    color: Colors.primary,
  },
  breakdownValue: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  totalBreakdownRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.primary,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  finalTotalLabel: {
    ...Typography.h4,
    color: Colors.primary,
  },
  finalTotalValue: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  installmentLabel: {
    ...Typography.body,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  installmentValue: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    minWidth: 120,
  },
  backButton: {
    backgroundColor: Colors.lightGray,
    borderWidth: 1,
    borderColor: Colors.gray,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
    marginHorizontal: Spacing.xs,
  },
  backButtonText: {
    color: Colors.gray,
  },
  submitButtonText: {
    color: Colors.white,
  },
});

export default CommercialPaymentStep;
