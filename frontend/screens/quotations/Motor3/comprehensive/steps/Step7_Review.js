/**
 * Step7_Review - Comprehensive Flow
 * Complete review screen with edit links to previous steps
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMotor3 } from '../../contexts/Motor3Context';
import { useComprehensiveContext } from '../../contexts/ComprehensiveContext';
import StepNavigation from '../../third-party/steps/StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';

const DetailRow = ({ label, value, valueNumberOfLines = 1 }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={valueNumberOfLines}>{value}</Text>
  </View>
);

const DetailInputRow = ({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <TextInput
      style={styles.detailInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      blurOnSubmit={false}
    />
  </View>
);

const Step7_Review = ({ onNext, onBack, goToStep, currentStep, totalSteps }) => {
  const { selectedCategory, selectedSubcategory, clientDetails, updateClientDetails } = useMotor3();
  const { vehicleDetails, pricingInputs, selectedUnderwriter } = useComprehensiveContext();

  const categoryLabel = useMemo(() => {
    return selectedCategory?.name || selectedCategory?.code || 'N/A';
  }, [selectedCategory]);

  const productLabel = useMemo(() => {
    return (
      selectedSubcategory?.name ||
      selectedSubcategory?.subcategory_name ||
      selectedSubcategory?.subcategory_code ||
      'N/A'
    );
  }, [selectedSubcategory]);

  const underwriterName = useMemo(() => {
    return (
      selectedUnderwriter?.underwriter_name ||
      selectedUnderwriter?.name ||
      selectedUnderwriter?.underwriter ||
      'N/A'
    );
  }, [selectedUnderwriter]);

  const formatCurrency = (amount) => {
    return `KSh ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={48} color="#28a745" />
            <Text style={styles.headerTitle}>Ready to Proceed</Text>
            <Text style={styles.headerSubtitle}>Review policy details</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance Product</Text>
            <DetailRow label="Category:" value={categoryLabel} />
            <DetailRow label="Product:" value={productLabel} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <DetailRow label="Reg:" value={vehicleDetails?.registrationNumber || vehicleDetails?.registration || 'N/A'} />
            <DetailRow label="Make:" value={(vehicleDetails?.make || 'N/A') + (vehicleDetails?.model ? ` ${vehicleDetails.model}` : '')} valueNumberOfLines={1} />
            <DetailRow label="Year:" value={vehicleDetails?.year || 'N/A'} />
            <DetailRow label="Cover Start:" value={vehicleDetails?.cover_start_date || 'N/A'} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Details</Text>
            <DetailRow label="Sum Insured:" value={formatCurrency(pricingInputs?.sum_insured)} />
            {pricingInputs?.windscreen_value ? (
              <DetailRow label="Windscreen:" value={formatCurrency(pricingInputs.windscreen_value)} />
            ) : null}
            {pricingInputs?.radio_cassette_value ? (
              <DetailRow label="Radio/Cassette:" value={formatCurrency(pricingInputs.radio_cassette_value)} />
            ) : null}
            {Array.isArray(pricingInputs?.add_ons) && pricingInputs.add_ons.length > 0 ? (
              <DetailRow label="Add-ons:" value={pricingInputs.add_ons.join(', ')} valueNumberOfLines={2} />
            ) : null}
            <DetailRow label="Payment Plan:" value={pricingInputs?.instalment_option || 'Full Payment'} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Underwriter</Text>
            <DetailRow label="Underwriter:" value={underwriterName} valueNumberOfLines={1} />
            <DetailRow label="Total Premium:" value={formatCurrency(selectedUnderwriter?.total_premium)} />
          </View>

          <View style={[styles.section, styles.sectionNoBorder]}>
            <Text style={styles.sectionTitle}>Client Details</Text>
            <DetailInputRow
              label="ID:"
              value={clientDetails?.id_number || ''}
              onChangeText={(t) => updateClientDetails({ id_number: t })}
              placeholder="e.g., 12345678"
              keyboardType="number-pad"
              autoCapitalize="none"
            />
            <DetailInputRow
              label="Phone:"
              value={clientDetails?.phone || clientDetails?.phone_number || ''}
              onChangeText={(t) => updateClientDetails({ phone: t })}
              placeholder="e.g., 0712345678"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <DetailInputRow
              label="Email:"
              value={clientDetails?.email || ''}
              onChangeText={(t) => updateClientDetails({ email: t })}
              placeholder="e.g., client@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmText}>
              Please review all details carefully before proceeding to payment.
            </Text>
          </View>
        </View>
      </ScrollView>

      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={onNext}
        nextLabel="Proceed to Payment"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 6,
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  section: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionNoBorder: {
    borderBottomWidth: 0,
    marginBottom: 6,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D5222B',
    marginBottom: 6,
    fontFamily: 'Poppins-SemiBold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#6c757d',
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  detailValue: {
    fontSize: 11,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
    fontFamily: 'Poppins-Medium',
  },
  detailInput: {
    flex: 1.5,
    height: 34,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: '#2c3e50',
    backgroundColor: '#FFF',
    textAlign: 'right',
  },
  confirmSection: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5222B',
  },
  confirmText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default Step7_Review;
