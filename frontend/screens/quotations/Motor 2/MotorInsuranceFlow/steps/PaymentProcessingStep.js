import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import EnhancedPayment from '../Payment/EnhancedPayment';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';

export default function PaymentProcessingStep() {
  const { state, actions } = useMotorInsurance();

  // Derive inputs for payment summary from context
  const selectedProduct = useMemo(() => state.selectedSubcategory || state.productType || null, [state.selectedSubcategory, state.productType]);
  const vehicleData = state.vehicleDetails || {};
  const premiumRaw = state.calculatedPremium || state.premium || null;
  const underwriterSelectedRaw = state.selectedUnderwriter || null;
  const clientDetails = state.pricingInputs?.clientDetails || state.clientDetails || {};
  const selectedAddons = state.selectedAddons || [];
  const addonsPremium = state.addonsPremium || 0;
  const addonsBreakdown = state.addonsBreakdown || [];

  // Local UI state for payment step
  const [paymentMethod, setPaymentMethod] = useState('MPESA');
  const [additionalCoverages, setAdditionalCoverages] = useState([]);

  const handlePaymentMethodChange = useCallback((method) => {
    setPaymentMethod(method);
  }, []);

  const handleCoverageChange = useCallback((coverages) => {
    setAdditionalCoverages(Array.isArray(coverages) ? coverages : []);
  }, []);

  // Resolve an underwriter to display (selected → premium → comparison[0])
  const resolvedUnderwriter = useMemo(() => {
    // If we already have a full object keep it
    if (underwriterSelectedRaw && typeof underwriterSelectedRaw === 'object') return underwriterSelectedRaw;

    // If it's a string, try to match against pricingComparison
    if (typeof underwriterSelectedRaw === 'string') {
      const match = (state.pricingComparison || []).find(c => {
        const n = c.name || c.underwriter_name || c.company_name || '';
        return n && n.toLowerCase() === underwriterSelectedRaw.toLowerCase();
      });
      if (match) return match;
    }

    // Consider vehicle details names
    const vehName = vehicleData?.selectedUnderwriter || vehicleData?.underwriter;
    if (vehName && typeof vehName === 'string') {
      const matchVeh = (state.pricingComparison || []).find(c => {
        const n = c.name || c.underwriter_name || c.company_name || '';
        return n && n.toLowerCase() === vehName.toLowerCase();
      });
      if (matchVeh) return matchVeh;
      return { name: vehName, underwriter_name: vehName, company_name: vehName };
    }

    // Derive from premiumRaw if it carries identifiers
    if (premiumRaw) {
      const name = premiumRaw.underwriter_name || premiumRaw.underwriter;
      const code = premiumRaw.underwriter_code || premiumRaw.underwriterId;
      if (name || code) {
        return {
          name: name,
          underwriter_name: name,
          company_name: name,
          code,
          base_premium: premiumRaw.base_premium,
          total_premium: premiumRaw.total_premium || premiumRaw.totalPremium,
          breakdown: premiumRaw.breakdown,
        };
      }
    }

    // Fallback to first comparison
    const fromComparison = Array.isArray(state.pricingComparison) && state.pricingComparison.length
      ? state.pricingComparison[0]
      : null;
    return fromComparison || null;
  }, [underwriterSelectedRaw, premiumRaw, state.pricingComparison, vehicleData]);

  // Build a display premium if we only have an underwriter line item
  const displayPremium = useMemo(() => {
    // If we have a calculated premium object already, use it directly
    if (premiumRaw && typeof premiumRaw === 'object') return premiumRaw;

    const uw = resolvedUnderwriter;
    if (!uw || typeof uw !== 'object') return null;

    const bd = uw.premium_breakdown || uw.breakdown || {};
    const base = Number(
      bd.base_premium ?? bd.base ?? uw.base_premium ?? uw.basicPremium ?? 0
    );
    const itl = Number(
      bd.training_levy ?? bd.itl ?? uw.training_levy ?? (base * 0.0025)
    );
    const pcf = Number(
      bd.pcf_levy ?? bd.pcf ?? uw.pcf_levy ?? (base * 0.0025)
    );
    const stamp = Number(
      bd.stamp_duty ?? uw.stamp_duty ?? 40
    );
    const total = Number(
      uw.total_premium ?? uw.totalPremium ?? bd.total_premium ?? (base + itl + pcf + stamp)
    );

    return {
      base_premium: base,
      training_levy: itl,
      pcf_levy: pcf,
      stamp_duty: stamp,
      total_premium: total,
      totalPremium: total,
      breakdown: { base_premium: base, training_levy: itl, pcf_levy: pcf, stamp_duty: stamp },
      underwriter_name: uw?.name || uw?.underwriter_name || uw?.company_name,
      underwriter_code: uw?.code || uw?.company_code || uw?.underwriter_code,
    };
  }, [premiumRaw, resolvedUnderwriter]);

  return (
    <View style={styles.container}>
      <EnhancedPayment
        selectedProduct={selectedProduct}
        vehicleData={vehicleData}
        premium={displayPremium}
        underwriter={resolvedUnderwriter}
        clientDetails={clientDetails}
        additionalCoverages={additionalCoverages}
        selectedAddons={selectedAddons}
        addonsPremium={addonsPremium}
        addonsBreakdown={addonsBreakdown}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        onCoverageChange={handleCoverageChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 0,
    alignItems: 'stretch',
  },
});
