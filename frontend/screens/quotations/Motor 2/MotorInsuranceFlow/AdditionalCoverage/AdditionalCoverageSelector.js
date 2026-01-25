import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import StableTextInput from '../../../../../components/common/StableTextInput';
import { DEFAULT_ADD_ONS, normalizeAddOns } from '../../../../../constants/additionalCoverage';
import djangoAPI from '../../../../../services/DjangoAPIService';

const AdditionalCoverageSelector = ({ 
  values, 
  onChange, 
  selectedProduct, 
  onCoverageChange, 
  initialSelection = [] 
}) => {
  const [selectedCoverages, setSelectedCoverages] = useState(initialSelection);
  const [availableCoverages, setAvailableCoverages] = useState(DEFAULT_ADD_ONS);
  const [loading, setLoading] = useState(false);
  
  const update = (k, v) => onChange?.({ ...values, [k]: v });

  // Enhanced coverage options based on product type
  // Dynamically fetch add-ons per subcategory; fallback to constants
  useEffect(() => {
    const fetchAddOns = async () => {
      const sub = selectedProduct?.subcategory_code || selectedProduct?.code;
      if (!sub) {
        setAvailableCoverages(DEFAULT_ADD_ONS);
        return;
      }
      try {
        setLoading(true);
        const res = await djangoAPI.makeRequest(`/api/motor2/products/${encodeURIComponent(sub)}/addons/`, {
          method: 'GET',
        });
        const list = Array.isArray(res?.addons) ? res.addons : Array.isArray(res) ? res : [];
        const normalized = normalizeAddOns(list);
        setAvailableCoverages(normalized.length ? normalized : DEFAULT_ADD_ONS);
      } catch (e) {
        setAvailableCoverages(DEFAULT_ADD_ONS);
      } finally {
        setLoading(false);
      }
    };
    fetchAddOns();
  }, [selectedProduct?.subcategory_code, selectedProduct?.code]);

  const getLegacyCoverages = () => [
    { key: 'excess_protector', label: 'Excess Protector', type: 'switch' },
    { key: 'pvt', label: 'PVT (Political Violence & Terrorism)', type: 'switch' },
    { key: 'windscreen', label: 'Windscreen (KES)', type: 'amount' },
    { key: 'accessories', label: 'Radio/Accessories (KES)', type: 'amount' },
    { key: 'loss_of_use', label: 'Loss of Use', type: 'switch' }
  ];

  const handleCoverageToggle = (coverage) => {
    const isSelected = selectedCoverages.some(sc => sc.id === coverage.id);
    let newSelection;

    if (isSelected) {
      newSelection = selectedCoverages.filter(sc => sc.id !== coverage.id);
    } else {
      newSelection = [...selectedCoverages, coverage];
    }

    setSelectedCoverages(newSelection);
    
    if (onCoverageChange) {
      onCoverageChange(newSelection);
    }
  };

  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

  const renderEnhancedCoverage = (coverage) => {
    const isSelected = selectedCoverages.some(sc => sc.id === coverage.id);

    if (coverage.type === 'switch') {
      return (
        <TouchableOpacity
          key={coverage.id}
          style={[styles.coverageCard, isSelected && styles.selectedCard]}
          onPress={() => handleCoverageToggle(coverage)}
        >
          <View style={styles.coverageHeader}>
            <View style={styles.coverageInfo}>
              <Text style={styles.coverageName}>{coverage.name}</Text>
              {coverage.recommended && (
                <Text style={styles.recommendedTag}>Recommended</Text>
              )}
            </View>
            <Switch
              value={isSelected}
              onValueChange={() => handleCoverageToggle(coverage)}
              trackColor={{ false: '#767577', true: '#D5222B' }}
              thumbColor={isSelected ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.coverageDescription}>{coverage.description}</Text>
          {typeof coverage.premium === 'number' && (
            <Text style={styles.premiumText}>
              Additional Premium: {formatCurrency(coverage.premium)}
            </Text>
          )}
        </TouchableOpacity>
      );
    } else if (coverage.type === 'amount') {
      return (
        <View key={coverage.id} style={styles.amountCard}>
          <Text style={styles.amountLabel}>{coverage.name}</Text>
          <Text style={styles.amountDescription}>{coverage.description}</Text>
          <StableTextInput
            style={styles.amountInput}
            keyboardType="numeric"
            value={String(values?.[coverage.id] || '')}
            onChangeText={(v) => update(coverage.id, v)}
            placeholder={coverage.placeholder || ''}
            debounceMs={300}
          />
        </View>
      );
    }
  };

  const renderLegacyCoverage = (coverage) => {
    if (coverage.type === 'switch') {
      return (
        <Row 
          key={coverage.key}
          label={coverage.label} 
          right={
            <Switch 
              value={!!values?.[coverage.key]} 
              onValueChange={(v) => update(coverage.key, v)}
              trackColor={{ false: '#767577', true: '#D5222B' }}
              thumbColor={values?.[coverage.key] ? '#fff' : '#f4f3f4'}
            />
          } 
        />
      );
    } else if (coverage.type === 'amount') {
      return (
        <View key={coverage.key}>
          <Text style={styles.label}>{coverage.label}</Text>
          <StableTextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={String(values?.[coverage.key] || '')} 
            onChangeText={(v) => update(coverage.key, v)} 
            debounceMs={300}
          />
        </View>
      );
    }
  };

  // Enhanced mode when product is available
  if (selectedProduct || onCoverageChange) {
    const coverages = availableCoverages;
    const totalAdditionalPremium = selectedCoverages.reduce((total, coverage) => total + (coverage.premium || 0), 0);

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Additional Coverage</Text>
          <Text style={styles.subtitle}>
            Enhance your policy with optional coverage
          </Text>
        </View>

        {loading && (
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ color: '#646767' }}>Loading available add-ons...</Text>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Selected Coverage</Text>
          <Text style={styles.summaryText}>
            {selectedCoverages.length} additional coverage(s) selected
          </Text>
          {totalAdditionalPremium > 0 && (
            <Text style={styles.summaryAmount}>
              Additional Premium: {formatCurrency(totalAdditionalPremium)}
            </Text>
          )}
        </View>

        <View style={styles.coveragesContainer}>
          {coverages.map(renderEnhancedCoverage)}
        </View>
      </ScrollView>
    );
  }

  // Legacy mode for backward compatibility
  const legacyCoverages = getLegacyCoverages();
  
  return (
    <View style={styles.legacyContainer}>
      {legacyCoverages.map(renderLegacyCoverage)}
    </View>
  );
};

function Row({ label, right }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  legacyContainer: {
    gap: 12,
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D5222B',
  },
  coveragesContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 20,
  },
  coverageCard: {
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
  selectedCard: {
    borderColor: '#D5222B',
    borderWidth: 2,
    backgroundColor: '#fff8f8',
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coverageInfo: {
    flex: 1,
    marginRight: 12,
  },
  coverageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  recommendedTag: {
    fontSize: 10,
    color: '#28a745',
    backgroundColor: '#d4edda',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  coverageDescription: {
    fontSize: 12,
    color: '#646767',
    lineHeight: 16,
    marginBottom: 8,
  },
  premiumText: {
    fontSize: 12,
    color: '#D5222B',
    fontWeight: '600',
  },
  amountCard: {
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
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  amountDescription: {
    fontSize: 12,
    color: '#646767',
    marginBottom: 12,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#2c3e50',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: { 
    fontWeight: '600', 
    color: '#495057',
    fontSize: 14,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ced4da', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#2c3e50',
    marginTop: 4,
  },
});

export default AdditionalCoverageSelector;
