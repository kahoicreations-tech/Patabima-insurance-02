import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getProductLabel } from '../../../../../constants/insuranceCatalog';

const formatCurrency = (amount) => `KSh ${(Number(amount) || 0).toLocaleString()}`;

export default function PaymentSummary({ selectedProduct, vehicleData, premium, additionalCoverages, underwriter, clientDetails, selectedAddons, addonsPremium, addonsBreakdown, compact = false }) {

  // Debug: Check what data we're receiving
  console.log('PaymentSummary Props:', {
    selectedProduct,
    vehicleData,
    premium,
    underwriter,
    clientDetails,
    additionalCoverages
  });
  console.log('Client Details Keys:', Object.keys(clientDetails || {}));
  console.log('Vehicle Data Keys:', Object.keys(vehicleData || {}));

  // Build a normalized view of vehicle data for uniform display
  const normalizedVehicle = useMemo(() => {
    const toUpper = (s) => (s ?? '').toString().toUpperCase().replace(/\s+/g, ' ').trim();
    const pick = (...keys) => {
      for (let k of keys) {
        // Prefer values from vehicleData, but allow fallback to clientDetails
        const v = (vehicleData && vehicleData[k] !== undefined ? vehicleData[k] : clientDetails?.[k]);
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
      }
      return undefined;
    };
    const rawReg = pick('registration', 'registrationNumber', 'vehicle_registration', 'reg_number', 'Vehicle_Registration');
    const rawMake = pick('vehicle_make', 'make');
    const rawModel = pick('vehicle_model', 'model');
    const rawYear = pick('year', 'vehicle_year');
    const rawCoverStart = pick('cover_start_date', 'coverStartDate');

    const formatISO = (d) => {
      if (!d) return undefined;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return undefined;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      registration: toUpper(rawReg || ''),
      make: toUpper(rawMake || ''),
      model: toUpper(rawModel || ''),
      year: rawYear ? Number(rawYear) : undefined,
      coverStart: formatISO(rawCoverStart),
      // Preserve raw for any additional category-specific rows below
      raw: { ...(vehicleData || {}), ...(clientDetails || {}) },
    };
  }, [vehicleData, clientDetails]);

  // If underwriter is selected, use their exact calculated values
  // Detect extendible support and config
  const isExtendible = Boolean(
    (selectedProduct?.subcategory_code && String(selectedProduct.subcategory_code).includes('EXT')) ||
    selectedProduct?.is_extendible ||
    underwriter?.is_extendible ||
    premium?.is_extendible ||
    underwriter?.extendible_config || premium?.extendible_config
  );
  const extendibleConfig = underwriter?.extendible_config || premium?.extendible_config || null;

  if (underwriter) {
    // Prefer backend breakdown keys first
    const bd = underwriter.breakdown || {};
    const base = Number(bd.base_premium ?? bd.base ?? underwriter.base_premium ?? 0);
    const itl = Number(bd.training_levy ?? underwriter.training_levy ?? (base * 0.0025));
    const pcf = Number(bd.pcf_levy ?? underwriter.pcf_levy ?? (base * 0.0025));
    const stamp = Number(bd.stamp_duty ?? underwriter.stamp_duty ?? 40);
    const total = Number(underwriter.total_premium ?? underwriter.totalPremium ?? (base + itl + pcf + stamp));
    
    // Calculate add-ons from both selected add-ons and underwriter-specific add-ons
    const contextAddons = Number(addonsPremium) || 0;
    const underwriterAddons = Array.isArray(additionalCoverages) ? 
      additionalCoverages.reduce((s, c) => s + (c.premium || c.price || 0), 0) : 0;
    const addOns = contextAddons + underwriterAddons;
    const grand = Number(total) + Number(addOns);

    var breakdown = { base, training_levy: itl, pcf_levy: pcf, stamp_duty: stamp };
    var finalValues = { base, itl, pcf, stamp, total, addOns, grand };
  } else {
    // Fallback to premium prop calculations if no underwriter selected
    const breakdown = premium?.breakdown || {};
  const base = Number(premium?.base_premium ?? breakdown.base_premium ?? breakdown.base ?? premium?.basicPremium ?? 0);
  const itl = Number(breakdown.training_levy ?? premium?.training_levy ?? Math.round(base * 0.0025));
  const pcf = Number(breakdown.pcf_levy ?? premium?.pcf_levy ?? Math.round(base * 0.0025));
  const stamp = Number(breakdown.stamp_duty ?? premium?.stamp_duty ?? 40);
  const total = Number(premium?.totalPremium ?? premium?.premium ?? (base + itl + pcf + stamp));
    
    // Calculate add-ons from both context and fallback scenarios
    const contextAddons = Number(addonsPremium) || 0;
    const underwriterAddons = Array.isArray(additionalCoverages) ? 
      additionalCoverages.reduce((s, c) => s + (c.premium || c.price || 0), 0) : 0;
    const addOns = contextAddons + underwriterAddons;
    const grand = Number(total) + Number(addOns);

    var finalValues = { base, itl, pcf, stamp, total, addOns, grand };
  }

  // Compute what user pays now for extendible
  let totalNow = finalValues.grand;
  if (isExtendible && extendibleConfig) {
    // Always use initial amount for extendible products (installments only)
    totalNow = Number(extendibleConfig.initial_amount || 0);
  }

  if (compact) {
    return (
      <View style={styles.section}>
        <View style={styles.card}>
          <Text style={styles.policyTitle}>Policy Summary</Text>
          <View style={styles.totalSection}>
            <Text style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total Amount Payable{isExtendible ? ' (Initial)' : ''}:</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalNow)}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Vehicle Details */}
      <View style={styles.card}>
        <Text style={styles.title}>Vehicle Details</Text>
        <Text style={styles.row}>Registration: {normalizedVehicle.registration || 'NOT PROVIDED'}</Text>
        <Text style={styles.row}>Make & Model: {normalizedVehicle.make || 'N/A'}{normalizedVehicle.model ? ` ${normalizedVehicle.model}` : ''}</Text>
        {normalizedVehicle.year ? (<Text style={styles.row}>Year: {normalizedVehicle.year}</Text>) : null}
        <Text style={styles.row}>Coverage Start: {normalizedVehicle.coverStart || 'Not set'}</Text>
        
        {/* Category-specific details */}
        {normalizedVehicle.raw?.tonnage && (
          <Text style={styles.row}>Tonnage: {normalizedVehicle.raw.tonnage}</Text>
        )}
        {normalizedVehicle.raw?.passengerCapacity && (
          <Text style={styles.row}>Passenger Capacity: {normalizedVehicle.raw.passengerCapacity}</Text>
        )}
        {normalizedVehicle.raw?.engineCapacity && (
          <Text style={styles.row}>Engine Capacity: {normalizedVehicle.raw.engineCapacity} CC</Text>
        )}
        
        {!!normalizedVehicle.raw?.sum_insured && (
          <Text style={styles.row}>Sum Insured: {formatCurrency(normalizedVehicle.raw.sum_insured)}</Text>
        )}
        
        {/* Comprehensive coverage add-on values */}
        {!!normalizedVehicle.raw?.windscreen_value && (
          <Text style={styles.row}>Windscreen Value: {formatCurrency(normalizedVehicle.raw.windscreen_value)}</Text>
        )}
        {!!normalizedVehicle.raw?.radio_cassette_value && (
          <Text style={styles.row}>Radio/Cassette Value: {formatCurrency(normalizedVehicle.raw.radio_cassette_value)}</Text>
        )}
        {!!normalizedVehicle.raw?.vehicle_accessories_value && (
          <Text style={styles.row}>Accessories Value: {formatCurrency(normalizedVehicle.raw.vehicle_accessories_value)}</Text>
        )}
      </View>

      {/* Policy Summary - Brief Format */}
      <View style={styles.card}>
        <Text style={styles.policyTitle}>Policy Summary</Text>
        
        <Text style={styles.policyLine}>
          <Text style={styles.label}>Insurance type:</Text>
          <Text style={styles.value}>
            {(() => {
              const subcategory = selectedProduct?.subcategory_code || selectedProduct?.subcategory || selectedProduct?.code;
              if (subcategory) {
                return getProductLabel(subcategory) || subcategory.replace(/_/g, ' ');
              }
              return `${selectedProduct?.category || ''} ${selectedProduct?.name || selectedProduct?.coverage_type || ''}`.trim() || 'Not specified';
            })()}
          </Text>
        </Text>

        <Text style={styles.policyLine}>
          <Text style={styles.label}>Insurer:</Text>
          <Text style={styles.value}>
            {underwriter?.name || 
             underwriter?.underwriter_name || 
             underwriter?.company_name ||
             underwriter?.company ||
             premium?.underwriter_name ||
             premium?.underwriter ||
             vehicleData?.selectedUnderwriter ||
             'Not selected'}
          </Text>
        </Text>

        <Text style={styles.policyLine}>
          <Text style={styles.label}>Cover period:</Text>
          <Text style={styles.value}>
            {(() => {
              const startRaw = vehicleData?.cover_start_date || normalizedVehicle.coverStart;
              if (!startRaw) return 'Not set';
              const start = new Date(startRaw);
              if (Number.isNaN(start.getTime())) return 'Not set';
              const end = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
              const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
              return `${fmt(start)} - ${fmt(end)}`;
            })()}
          </Text>
        </Text>

        <Text style={styles.policyLine}>
          <Text style={styles.label}>Premium:</Text>
          <Text style={styles.value}>{formatCurrency(finalValues.base)}</Text>
        </Text>

        <Text style={styles.policyLine}>
          <Text style={styles.label}>IRA Levy:</Text>
          <Text style={styles.value}>
            0.25% × {formatCurrency(finalValues.base)} = {formatCurrency(finalValues.pcf)}
          </Text>
        </Text>

        <Text style={styles.policyLine}>
          <Text style={styles.label}>Training Levy:</Text>
          <Text style={styles.value}>
            0.25% × {formatCurrency(finalValues.base)} = {formatCurrency(finalValues.itl)}
          </Text>
        </Text>

        <Text style={styles.policyLine}>
          <Text style={styles.label}>Policy Stamp Duty:</Text>
          <Text style={styles.value}>{formatCurrency(finalValues.stamp)}</Text>
        </Text>

        {/* Extendible Pricing Details */}
        {isExtendible && extendibleConfig && (
          <>
            <View style={styles.extendibleDivider} />
            <Text style={styles.subtitle}>Extendible Pricing</Text>
            <Text style={styles.policyLine}>
              <Text style={styles.label}>Initial Payment:</Text>
              <Text style={styles.value}>{formatCurrency(extendibleConfig.initial_amount)}</Text>
            </Text>
            <Text style={styles.policyLine}>
              <Text style={styles.label}>Balance Amount:</Text>
              <Text style={styles.value}>{formatCurrency(extendibleConfig.balance_amount)}</Text>
            </Text>
            <Text style={styles.policyLine}>
              <Text style={styles.label}>Total Annual Premium:</Text>
              <Text style={styles.value}>{formatCurrency(extendibleConfig.total_annual_premium)}</Text>
            </Text>
            <Text style={styles.policyLine}>
              <Text style={styles.label}>Payment Deadline:</Text>
              <Text style={styles.value}>Within {extendibleConfig.extension_deadline_days || 30} days</Text>
            </Text>
            <Text style={styles.policyLine}>
              <Text style={styles.label}>Grace Period:</Text>
              <Text style={styles.value}>+{extendibleConfig.grace_period_days || 7} days</Text>
            </Text>
          </>
        )}

        {/* Selected Add-ons from Add-on Selection Step */}
        {addonsBreakdown && addonsBreakdown.length > 0 && (
          <>
            {addonsBreakdown
              .filter(addon => addon.is_applicable)
              .map((addon, index) => (
                <Text key={addon.addon_id || index} style={styles.policyLine}>
                  <Text style={styles.label}>{addon.addon_name}:</Text>
                  <Text style={styles.value}>{formatCurrency(addon.calculated_premium)}</Text>
                </Text>
              ))
            }
          </>
        )}

        {/* Underwriter-Specific Add-ons */}
        {additionalCoverages && additionalCoverages.length > 0 && (
          additionalCoverages.map((coverage, index) => (
            <Text key={coverage.id || index} style={styles.policyLine}>
              <Text style={styles.label}>{coverage.name || coverage.title}:</Text>
              <Text style={styles.value}>{formatCurrency(coverage.premium || coverage.price || 0)}</Text>
            </Text>
          ))
        )}

        <View style={styles.totalSection}>
          <Text style={styles.totalLine}>
            <Text style={styles.totalLabel}>
              Total Amount Payable{isExtendible ? ' (Initial)' : ''}:
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(totalNow)}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 12 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: '#e9ecef',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  
  // Main title and section styles
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10,
  },
  row: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    marginTop: 4,
  },
  
  // Policy Summary Styles (Brief Format)
  policyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10,
  },
  policyLine: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 6,
    lineHeight: 20,
  },
  label: {
    fontWeight: '600',
    color: '#495057',
  },
  value: {
    fontWeight: '400',
    color: '#2c3e50',
  },
  
  // Total Section
  totalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#D5222B',
  },
  totalLine: {
    fontSize: 16,
    lineHeight: 24,
  },
  totalLabel: {
    fontWeight: '700',
    color: '#2c3e50',
  },
  totalValue: {
    fontWeight: '700',
    color: '#D5222B',
    fontSize: 16,
  },
  extendibleDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 10,
  },
});
