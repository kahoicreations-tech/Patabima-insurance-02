import React from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

const PremiumCalculationDisplay = ({ 
  loading, 
  error, 
  result, 
  pricingResult, 
  isCalculating = false, 
  selectedProduct, 
  vehicleData, 
  pricingInputs 
}) => {
  // Support both old and new prop formats
  const actualResult = result || pricingResult;
  const actualLoading = loading || isCalculating;

  if (actualLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#D5222B" size="large" />
        <Text style={styles.loadingText}>Calculating premium...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Calculation failed: {error}</Text>
      </View>
    );
  }

  if (!actualResult && !actualLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Premium calculation will appear here once you complete the vehicle details and pricing options.
        </Text>
      </View>
    );
  }

  if (!actualResult) return null;

  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

  // Legacy format support
  const base = Number(actualResult.base_premium || actualResult.basePremium || actualResult.premium || 0);
  const m = actualResult.mandatory_levies || actualResult.levies || {};
  const itl = Number(m.insurance_training_levy || m.itl || 0);
  const pcf = Number(m.pcf_levy || m.pcf || 0);
  const stamp = Number(m.stamp_duty ?? m.stampDuty ?? 40);
  const additionalCovers = Number(actualResult.additionalCovers || 0);
  const total = Number(actualResult.total_premium || actualResult.totalPremium || base + itl + pcf + stamp + additionalCovers);

  const getBreakdownItems = () => {
    const items = [];

    // Base premium
    if (base > 0) {
      items.push({
        label: 'Base Premium',
        amount: base,
        description: 'Core insurance coverage premium'
      });
    }

    // Additional covers
    if (additionalCovers > 0) {
      items.push({
        label: 'Additional Covers',
        amount: additionalCovers,
        description: 'Optional coverage additions'
      });
    }

    // Mandatory levies
    if (itl > 0) {
      items.push({
        label: 'Insurance Training Levy (ITL)',
        amount: itl,
        description: '0.25% of premium',
        isLevy: true
      });
    }

    if (pcf > 0) {
      items.push({
        label: 'Policyholders Compensation Fund (PCF)',
        amount: pcf,
        description: '0.25% of premium',  
        isLevy: true
      });
    }

    if (stamp > 0) {
      items.push({
        label: 'Stamp Duty',
        amount: stamp,
        description: 'Fixed KSh 40 per policy',
        isLevy: true
      });
    }

    return items;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Premium Calculation</Text>
        {selectedProduct && (
          <Text style={styles.subtitle}>
            {selectedProduct.name} - {selectedProduct.category}
          </Text>
        )}
      </View>

      {/* Vehicle Summary */}
      {vehicleData && (
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Vehicle Details</Text>
          <Row k="Registration" v={vehicleData.registration || 'N/A'} />
          <Row k="Make/Model" v={`${vehicleData.make || 'N/A'} ${vehicleData.model || ''}`} />
          {vehicleData.year && <Row k="Year" v={vehicleData.year} />}
          {vehicleData.sum_insured && <Row k="Sum Insured" v={formatCurrency(vehicleData.sum_insured)} />}
        </View>
      )}

      {/* Premium Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.cardTitle}>Premium Breakdown</Text>
        
        {getBreakdownItems().map((item, index) => (
          <View key={index} style={[
            styles.breakdownRow,
            item.isLevy && styles.levyRow
          ]}>
            <View style={styles.breakdownInfo}>
              <Text style={[
                styles.breakdownLabel,
                item.isLevy && styles.levyLabel
              ]}>
                {item.label}
              </Text>
              {item.description && (
                <Text style={styles.breakdownDescription}>
                  {item.description}
                </Text>
              )}
            </View>
            <Text style={[
              styles.breakdownAmount,
              item.isLevy && styles.levyAmount
            ]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Premium</Text>
          <Text style={styles.totalAmount}>
            {formatCurrency(total)}
          </Text>
        </View>

        {/* Payment period info */}
        {pricingInputs?.coveragePeriod && (
          <View style={styles.periodInfo}>
            <Text style={styles.periodText}>
              Coverage Period: {pricingInputs.coveragePeriod}
            </Text>
            {pricingInputs.coveragePeriod !== '12 months' && (
              <Text style={styles.periodNote}>
                Annual equivalent: {formatCurrency((total / parseInt(pricingInputs.coveragePeriod)) * 12)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Legacy Simple Display */}
      {!selectedProduct && !vehicleData && (
        <View style={styles.legacyCard}>
          <Text style={styles.legacyTitle}>Premium</Text>
          <Row k="Base premium" v={base} />
          <Row k="ITL (0.25%)" v={itl} />
          <Row k="PCF (0.25%)" v={pcf} />
          <Row k="Stamp duty" v={stamp} />
          <View style={styles.sep} />
          <Row k="Total" v={total} bold />
        </View>
      )}
    </ScrollView>
  );
};

function Row({ k, v, bold }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.k, bold && styles.bold]}>{k}</Text>
      <Text style={[styles.v, bold && styles.bold]}>KSh {Number(v).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#646767',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  loadingText: {
    fontSize: 16,
    color: '#646767',
    textAlign: 'center',
    marginTop: 12,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5c6cb',
    backgroundColor: '#f8d7da',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#646767',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  breakdownCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  legacyCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#e9ecef',
    margin: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  legacyTitle: { 
    fontWeight: '700', 
    color: '#2c3e50', 
    marginBottom: 8,
    fontSize: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  levyRow: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  breakdownInfo: {
    flex: 1,
    marginRight: 16,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  levyLabel: {
    color: '#646767',
    fontSize: 13,
  },
  breakdownDescription: {
    fontSize: 12,
    color: '#646767',
    fontStyle: 'italic',
    marginTop: 2,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  levyAmount: {
    color: '#646767',
    fontSize: 13,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#D5222B',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D5222B',
  },
  periodInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e7f5ff',
    borderRadius: 8,
  },
  periodText: {
    fontSize: 13,
    color: '#1864ab',
    fontWeight: '600',
  },
  periodNote: {
    fontSize: 12,
    color: '#1864ab',
    marginTop: 4,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 6 
  },
  k: { 
    color: '#495057' 
  },
  v: { 
    color: '#2c3e50' 
  },
  sep: { 
    height: 1, 
    backgroundColor: '#f1f3f5', 
    marginVertical: 8 
  },
  bold: { 
    fontWeight: '700' 
  },
});

export default PremiumCalculationDisplay;
