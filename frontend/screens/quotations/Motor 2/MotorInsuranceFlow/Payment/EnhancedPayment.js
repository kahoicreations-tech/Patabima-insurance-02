import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import PaymentSummary from './PaymentSummary';
import PaymentOptions from './PaymentOptions';

export default function EnhancedPayment({
  selectedProduct,
  vehicleData,
  premium,
  underwriter,
  clientDetails,
  additionalCoverages,
  selectedAddons,
  addonsPremium,
  addonsBreakdown,
  paymentMethod,
  onPaymentMethodChange,
  onCoverageChange,
  values,
  onValuesChange,
}) {
  const [showDetails, setShowDetails] = useState(true);
  const allowedMethods = ['MPESA', 'DPO'];
  const effectivePaymentMethod = allowedMethods.includes(paymentMethod) ? paymentMethod : 'MPESA';
  
  // Detect extendible products
  const isExtendible = selectedProduct?.subcategory_code?.includes('EXT') || selectedProduct?.is_extendible;
  const extendibleConfig = values?.extendible_config || premium?.extendible_config || underwriter?.extendible_config;
  
  // Debug log for extendible config
  if (isExtendible) {
    console.log('[EnhancedPayment] Extendible product detected:', {
      subcategory: selectedProduct?.subcategory_code,
      has_config: !!extendibleConfig,
      config_source: values?.extendible_config ? 'values' : premium?.extendible_config ? 'premium' : underwriter?.extendible_config ? 'underwriter' : 'none',
      initial_amount: extendibleConfig?.initial_amount,
      balance_amount: extendibleConfig?.balance_amount,
      total_annual_premium: extendibleConfig?.total_annual_premium
    });
  }
  
  // Calculate amount to pay (always initial amount for extendible)
  const calculateAmountToPay = () => {
    if (!isExtendible || !extendibleConfig) {
      return premium?.total_premium || premium?.totalAmount || 0;
    }
    
    // Always use initial amount for extendible products
    return extendibleConfig.initial_amount || 0;
  };
  
  const amountToPay = calculateAmountToPay();
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Extendible Payment Information Banner */}
      {isExtendible && extendibleConfig && (
        <View style={styles.extendibleBanner}>
          <Text style={styles.bannerIcon}>📅</Text>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Installment Payment Plan</Text>
            <Text style={styles.bannerText}>
              Initial payment covers {extendibleConfig.initial_period_days || 30} days. Balance payment of KSh {extendibleConfig.balance_amount?.toLocaleString()} due within {extendibleConfig.extension_deadline_days || 30} days.
            </Text>
          </View>
        </View>
      )}
      
      {/* Payment Options Section - moved up so it's visible without scrolling */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <Text style={styles.sectionSubtitle}>
          Choose your preferred payment method to complete the purchase
        </Text>
  <PaymentOptions value={effectivePaymentMethod} onChange={onPaymentMethodChange} />
      </View>

      {/* Compact Policy Summary with toggle */}
      <View style={styles.section}>
        <PaymentSummary
          selectedProduct={selectedProduct}
          vehicleData={vehicleData}
          premium={premium}
          additionalCoverages={additionalCoverages}
          underwriter={underwriter}
          clientDetails={clientDetails}
          selectedAddons={selectedAddons}
          addonsPremium={addonsPremium}
          addonsBreakdown={addonsBreakdown}
          compact={!showDetails}
        />
        <Text
          onPress={() => setShowDetails((s) => !s)}
          style={{ color: '#1864ab', fontWeight: '600', marginTop: 4 }}
        >
          {showDetails ? 'Hide details' : 'View full details'}
        </Text>
      </View>

      {/* Underwriter-Specific Add-ons Section */}
      {underwriter?.available_addons && underwriter.available_addons.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Coverage</Text>
          <Text style={styles.sectionSubtitle}>
            Optional coverage from {underwriter.name || underwriter.underwriter_name || 'selected underwriter'}
          </Text>
          <View style={styles.addonsContainer}>
            {underwriter.available_addons.map((addon, index) => (
              <TouchableOpacity
                key={addon.id || index}
                style={[
                  styles.addonOption,
                  additionalCoverages?.some(c => c.id === addon.id || c.name === addon.name) && styles.selectedAddon
                ]}
                onPress={() => {
                  const isSelected = additionalCoverages?.some(c => c.id === addon.id || c.name === addon.name);
                  const newSelection = isSelected
                    ? additionalCoverages.filter(c => c.id !== addon.id && c.name !== addon.name)
                    : [...(additionalCoverages || []), addon];
                  onCoverageChange?.(newSelection);
                }}
              >
                <View style={styles.addonHeader}>
                  <Text style={[
                    styles.addonName,
                    additionalCoverages?.some(c => c.id === addon.id || c.name === addon.name) && styles.selectedAddonText
                  ]}>
                    {addon.name || addon.title}
                  </Text>
                  <Text style={[
                    styles.addonPrice,
                    additionalCoverages?.some(c => c.id === addon.id || c.name === addon.name) && styles.selectedAddonText
                  ]}>
                    KSh {(addon.premium || addon.price || 0).toLocaleString()}
                  </Text>
                </View>
                {addon.description && (
                  <Text style={styles.addonDescription}>
                    {addon.description}
                  </Text>
                )}
                {additionalCoverages?.some(c => c.id === addon.id || c.name === addon.name) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Balance Payment Reminder for Installments */}
      {isExtendible && extendibleConfig && (
        <View style={[styles.section, styles.reminderCard]}>
          <View style={styles.reminderHeader}>
            <Text style={styles.reminderIcon}>⏰</Text>
            <Text style={styles.reminderTitle}>Balance Payment Reminder</Text>
          </View>
          <View style={styles.reminderContent}>
            <View style={styles.reminderRow}>
              <Text style={styles.reminderLabel}>Initial Coverage Period:</Text>
              <Text style={styles.reminderValue}>
                {extendibleConfig.initial_period_days || 30} days
              </Text>
            </View>
            <View style={styles.reminderRow}>
              <Text style={styles.reminderLabel}>Balance Amount Due:</Text>
              <Text style={styles.reminderValueHighlight}>
                KSh {extendibleConfig.balance_amount?.toLocaleString() || '0'}
              </Text>
            </View>
            <View style={styles.reminderRow}>
              <Text style={styles.reminderLabel}>Payment Deadline:</Text>
              <Text style={styles.reminderValue}>
                Within {extendibleConfig.extension_deadline_days || 30} days from today
              </Text>
            </View>
            <View style={styles.reminderRow}>
              <Text style={styles.reminderLabel}>Grace Period:</Text>
              <Text style={styles.reminderValue}>
                +{extendibleConfig.grace_period_days || 7} days after deadline
              </Text>
            </View>
            <View style={styles.reminderNote}>
              <Text style={styles.noteIcon}>ℹ️</Text>
              <Text style={styles.noteText}>
                You'll receive a reminder notification before the balance payment deadline. 
                Late payments may incur additional fees (5-15% based on delay).
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Payment Instructions */}
      <View style={[styles.section, styles.instructionsCard]}>
        <Text style={styles.instructionsTitle}>Next Steps</Text>
        <Text style={styles.instructionsText}>
          1. Review your policy summary above{'\n'}
          2. Add any additional coverage if needed{'\n'}
          3. Select your payment method{'\n'}
          4. Click 'Next' to proceed to payment
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  section: { 
    paddingHorizontal: 16, 
    marginBottom: 12 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#2c3e50', 
    marginBottom: 6 
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 10,
    lineHeight: 18
  },
  
  // Extendible Payment Banner
  extendibleBanner: {
    flexDirection: 'row',
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b3d9ff',
    gap: 12,
  },
  bannerIcon: {
    fontSize: 24,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1864ab',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  
  // Balance Payment Reminder
  reminderCard: {
    backgroundColor: '#fff4e6',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ffd8a8',
    marginBottom: 16,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  reminderIcon: {
    fontSize: 20,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e67700',
  },
  reminderContent: {
    gap: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderLabel: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  reminderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  reminderValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e67700',
  },
  reminderNote: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  noteIcon: {
    fontSize: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#495057',
    lineHeight: 18,
  },
  
  instructionsCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1864ab',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  
  // Underwriter Add-ons Styles
  addonsContainer: {
    gap: 12,
  },
  addonOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  selectedAddon: {
    borderColor: '#D5222B',
    backgroundColor: '#fff5f5',
  },
  addonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  addonPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
  },
  selectedAddonText: {
    color: '#D5222B',
  },
  addonDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginTop: 4,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 18,
    color: '#D5222B',
    fontWeight: 'bold',
  },
  
  // Payment Plan Selection Styles
  paymentPlanOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedPlanOption: {
    borderColor: '#D5222B',
    backgroundColor: '#fff5f5',
  },
  planOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  planRadioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D5222B',
  },
  planOptionContent: {
    flex: 1,
  },
  planOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  selectedPlanText: {
    color: '#D5222B',
  },
  planOptionAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#28a745',
    marginBottom: 4,
  },
  planOptionSubtext: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 8,
  },
  installmentBreakdown: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  installmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  installmentLabel: {
    fontSize: 13,
    color: '#6c757d',
    flex: 1,
  },
  installmentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
  },
});
