import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PremiumBreakdownCard({ result, selectedSubcategory, providerPricing, onPaymentPlanChange }) {
  const [open, setOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState('installments'); // Default to installments for extendible

  if (!result) return null;

  const base = Number(result.base_premium || result.premium || 0);
  const m = result.mandatory_levies || {};
  const itl = Number(m.insurance_training_levy || 0);
  const pcf = Number(m.pcf_levy || 0);
  const stamp = Number(m.stamp_duty ?? 40);
  const total = Number(result.total_premium || base + itl + pcf + stamp);

  // Check if this is an extendible product
  const isExtendible = selectedSubcategory?.subcategory_code?.includes('EXT') || selectedSubcategory?.is_extendible;
  const extendibleConfig = providerPricing?.extendible_config;

  // Handle payment plan change
  const handlePaymentPlanChange = (plan) => {
    setPaymentPlan(plan);
    if (onPaymentPlanChange) {
      onPaymentPlanChange(plan);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setOpen(!open)}>
        <Text style={styles.title}>Premium Breakdown {open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ gap: 6 }}>
          {/* Show payment options for extendible products */}
          {isExtendible && extendibleConfig ? (
            <View style={styles.extendiblePricing}>
              <Text style={styles.sectionTitle}>Payment Options</Text>
              
              {/* Option 1: Pay in Full (with 10% discount) */}
              <TouchableOpacity 
                style={[styles.paymentOption, paymentPlan === 'full' && styles.selectedOption]}
                onPress={() => handlePaymentPlanChange('full')}
                activeOpacity={0.7}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionIcon}>💰</Text>
                    <Text style={[styles.optionTitle, paymentPlan === 'full' && styles.optionTitleSelected]}>
                      Pay Full Amount
                    </Text>
                  </View>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>Save 10%</Text>
                  </View>
                </View>
                <Text style={[styles.optionAmount, paymentPlan === 'full' && styles.optionAmountSelected]}>
                  KSh {Math.round(extendibleConfig.total_annual_premium * 0.9).toLocaleString()}
                </Text>
                <Text style={styles.optionDetails}>
                  One-time payment • Full year coverage
                </Text>
              </TouchableOpacity>
              
              {/* Option 2: Pay in Installments (Initial + Balance) */}
              <TouchableOpacity 
                style={[styles.paymentOption, paymentPlan === 'installments' && styles.selectedOption]}
                onPress={() => handlePaymentPlanChange('installments')}
                activeOpacity={0.7}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionIcon}>📅</Text>
                    <Text style={[styles.optionTitle, paymentPlan === 'installments' && styles.optionTitleSelected]}>
                      Pay in Installments
                    </Text>
                  </View>
                </View>
                
                <View style={styles.installmentBreakdown}>
                  <View style={styles.installmentRow}>
                    <Text style={styles.installmentLabel}>Initial Payment (Now)</Text>
                    <Text style={[styles.installmentAmount, paymentPlan === 'installments' && styles.installmentAmountSelected]}>
                      KSh {extendibleConfig.initial_amount?.toLocaleString() || '0'}
                    </Text>
                  </View>
                  <Text style={styles.installmentNote}>
                    Covers first {extendibleConfig.initial_period_days || 30} days
                  </Text>
                  
                  <View style={styles.installmentDivider} />
                  
                  <View style={styles.installmentRow}>
                    <Text style={styles.installmentLabel}>
                      Balance Payment (Within {extendibleConfig.extension_deadline_days || 30} days)
                    </Text>
                    <Text style={styles.installmentAmount}>
                      KSh {extendibleConfig.balance_amount?.toLocaleString() || '0'}
                    </Text>
                  </View>
                  <Text style={styles.installmentNote}>
                    Extends coverage for full year
                  </Text>
                </View>
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Annual Premium:</Text>
                  <Text style={[styles.totalAmount, paymentPlan === 'installments' && styles.totalAmountSelected]}>
                    KSh {extendibleConfig.total_annual_premium?.toLocaleString() || '0'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            /* Regular premium display for non-extendible products */
            <>
              <Row k="Base premium" v={base} />
              <Row k="ITL (0.25%)" v={itl} />
              <Row k="PCF (0.25%)" v={pcf} />
              <Row k="Stamp duty" v={stamp} />
              <View style={styles.sep} />
              <Row k="Total" v={total} bold />
            </>
          )}
        </View>
      )}
    </View>
  );
}

function Row({ k, v, bold }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.k, bold && styles.bold]}>{k}</Text>
      <Text style={[styles.v, bold && styles.bold]}>KES {Number(v).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e9ecef' },
  title: { fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  k: { color: '#495057' },
  v: { color: '#2c3e50' },
  sep: { height: 1, backgroundColor: '#f1f3f5', marginVertical: 8 },
  bold: { fontWeight: '700' },
  
  // Extendible Pricing Styles
  extendiblePricing: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  paymentOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#fff5f5',
    borderColor: '#D5222B',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionIcon: {
    fontSize: 16,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  optionTitleSelected: {
    color: '#D5222B',
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: '#d1f4e0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0a7f42',
  },
  optionAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  optionAmountSelected: {
    color: '#D5222B',
  },
  optionDetails: {
    fontSize: 12,
    color: '#6c757d',
  },
  installmentBreakdown: {
    marginTop: 8,
  },
  installmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  installmentLabel: {
    fontSize: 12,
    color: '#495057',
    flex: 1,
    marginRight: 8,
  },
  installmentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  installmentAmountSelected: {
    color: '#D5222B',
  },
  installmentNote: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  installmentDivider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  totalAmountSelected: {
    color: '#D5222B',
  },
});
