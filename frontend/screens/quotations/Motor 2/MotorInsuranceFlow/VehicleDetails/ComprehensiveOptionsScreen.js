import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import motorPricingService from '../../../../../services/MotorInsurancePricingService';

export default function ComprehensiveOptionsScreen({ 
  formData, 
  onUpdate, 
  onNavigateToScreen 
}) {
  const [loading, setLoading] = useState(false);
  const [minPremium, setMinPremium] = useState(null); // number | null
  const [minRange, setMinRange] = useState(null); // { low, high } | null
  const [error, setError] = useState(null);
  
  const category = useMemo(() => (formData?.category || formData?.category_code || formData?.categoryKey || '').toString().toUpperCase(), [formData]);
  const coverType = 'COMPREHENSIVE';
  
  useEffect(() => {
    // Fetch a lightweight comparison to discover underwriter minimum premiums
    // Only when we have the essentials
    if (!category) return;
    if (!formData?.sum_insured) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const inputs = {
          category,
          subcategory_code: formData?.subcategory_code || formData?.code,
          cover_type: coverType,
          // Vehicle basics
          registrationNumber: formData?.registrationNumber || formData?.registration,
          cover_start_date: formData?.cover_start_date,
          vehicle_year: formData?.year || formData?.vehicle_year,
          vehicle_make: formData?.make || formData?.vehicle_make,
          vehicle_model: formData?.model || formData?.vehicle_model,
          // Pricing fields
          sum_insured: formData?.sum_insured,
          tonnage: formData?.tonnage,
          passengers: formData?.passengerCapacity || formData?.passenger_count,
        };

        const comparisons = await motorPricingService.compareUnderwritersByCoverType(category, coverType, inputs, { _suppressErrorLog: true });
        if (cancelled) return;

        // Derive effective base per underwriter (respect backend minimums)
        const pricingKey = `${category}_${coverType}`;
        const bases = comparisons.map((uw) => {
          const raw = uw._raw || {};
          const rawResult = raw.result || raw;
          const backendBase = Number(uw.breakdown?.base ?? 0);
          const backendBasePremium = Number(uw.breakdown?.base_premium ?? uw.base_premium ?? 0);
          const pricingNode = rawResult?.features?.pricing?.[pricingKey]
            || rawResult?.features?.pricing
            || uw.features?.pricing?.[pricingKey]
            || uw.features?.pricing
            || {};
          const pricingBasePremium = Number(pricingNode?.base_premium ?? 0);
          const minCandidates = [
            rawResult?.minimum_premium,
            rawResult?.min_premium,
            rawResult?.features?.minimum_premium,
            rawResult?.features?.min_premium,
            rawResult?.features?.pricing?.[pricingKey]?.minimum_premium,
            rawResult?.features?.pricing?.[pricingKey]?.minimum_base_premium,
            rawResult?.features?.pricing?.minimum_premium,
            rawResult?.features?.pricing?.minimum_base_premium,
            uw.features?.minimum_premium,
            uw.features?.min_premium,
            uw.features?.pricing?.[pricingKey]?.minimum_premium,
            uw.features?.pricing?.[pricingKey]?.minimum_base_premium,
          ].map(Number).filter(v => isFinite(v) && v > 0);
          const minBasePremium = minCandidates.length ? Math.max(...minCandidates) : 0;
          let effectiveBase = Math.max(0, backendBase, backendBasePremium, pricingBasePremium);
          if (minBasePremium > 0 && effectiveBase < minBasePremium) effectiveBase = minBasePremium;
          return { effectiveBase, minBasePremium };
        });

        if (!bases.length) {
          setMinPremium(null);
          setMinRange(null);
        } else {
          const lows = bases.map(b => b.minBasePremium || b.effectiveBase).filter(n => isFinite(n) && n > 0);
          const highs = bases.map(b => b.effectiveBase).filter(n => isFinite(n) && n > 0);
          const low = lows.length ? Math.min(...lows) : Math.min(...highs);
          const high = Math.max(...highs);
          setMinPremium(high); // Show the enforced minimum you should expect at least
          setMinRange(low !== high ? { low, high } : null);
        }
      } catch (e) {
        if (cancelled) return;
        setError(null); // stay silent on this screen if compare fails
        setMinPremium(null);
        setMinRange(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [category, formData?.sum_insured, formData?.year, formData?.make, formData?.model, formData?.tonnage, formData?.passengerCapacity]);
  
  const handleOpenComprehensiveWizard = () => {
    // Navigate to comprehensive-specific wizard/screen
    if (onNavigateToScreen) {
      onNavigateToScreen('ComprehensiveWizard');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comprehensive Coverage Options</Text>
      {loading && (
        <View style={styles.minRow}>
          <ActivityIndicator size="small" color="#D5222B" />
          <Text style={styles.minText}>Checking minimum premium…</Text>
        </View>
      )}
      {!loading && minPremium != null && (
        <View style={styles.minPanel}>
          <Text style={styles.minTitle}>Minimum premium</Text>
          <Text style={styles.minValue}>KSh {formatCurrency(minPremium)}</Text>
          {minRange && (
            <Text style={styles.minHint}>
              Varies by underwriter{': '}KSh {formatCurrency(minRange.low)} – {formatCurrency(minRange.high)}
            </Text>
          )}
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.wizardButton}
        onPress={handleOpenComprehensiveWizard}
      >
        <Text style={styles.buttonText}>Open Comprehensive Configuration</Text>
      </TouchableOpacity>
      
      {/* Add more comprehensive-specific UI elements */}
    </View>
  );
}

function formatCurrency(n) {
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  } catch {
    return String(n);
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
  },
  minRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  minText: {
    color: '#666',
    fontSize: 12,
  },
  minPanel: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F7D5D7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  minTitle: {
    color: '#B22222',
    fontWeight: '600',
    marginBottom: 4,
  },
  minValue: {
    color: '#B22222',
    fontSize: 18,
    fontWeight: '700',
  },
  minHint: {
    marginTop: 4,
    color: '#7f8c8d',
    fontSize: 12,
  },
  wizardButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});