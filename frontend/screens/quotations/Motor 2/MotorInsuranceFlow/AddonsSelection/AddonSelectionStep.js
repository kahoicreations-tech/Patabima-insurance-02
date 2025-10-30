import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddonCalculationService from '../../../../../services/AddonCalculationService';
import djangoAPI from '../../../../../services/DjangoAPIService';

const AddonSelectionStep = ({
  selectedProduct,
  vehicleData,
  underwriter,
  selectedAddons = [],
  onAddonsChange,
  onNext,
  onBack = null, // Made optional, back navigation removed
}) => {
  const insets = useSafeAreaInsets();
  const [localSelectedAddons, setLocalSelectedAddons] = useState(selectedAddons);
  const [addonCalculations, setAddonCalculations] = useState({});
  const [availableAddons, setAvailableAddons] = useState([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [addonsError, setAddonsError] = useState(null);
  const [removedOnSwitch, setRemovedOnSwitch] = useState(0);
  const [noUnderwriterAddons, setNoUnderwriterAddons] = useState(false);

  // Dismiss keyboard when component mounts
  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  const isComprehensive = useMemo(() => {
    const raw = selectedProduct?.coverage_type || selectedProduct?.type;
    const norm = typeof raw === 'string' ? raw.toUpperCase() : '';
    return norm === 'COMPREHENSIVE' || norm === 'COMP' || norm.includes('COMPREHENSIVE');
  }, [selectedProduct?.coverage_type, selectedProduct?.type]);

  // Normalize backend item to our addon config shape
  const normalizeBackendAddon = (item = {}, uwCodeUpper) => {
    const name = (item.name || item.title || '').toString();
    const key = name.toLowerCase();
    const inferId = () => {
      if (key.includes('excess')) return 'excess_protector';
      if (key.includes('terror') || key.includes('pvt') || key.includes('political')) return 'political_violence_terrorism';
      if (key.includes('loss of use') || key.includes('loss-of-use')) return 'loss_of_use';
      if (key.includes('windscreen')) return 'windscreen_cover';
      if (key.includes('radio') || key.includes('stereo') || key.includes('cassette')) return 'radio_cover';
      if (key.includes('accessor')) return 'accessories_cover';
      return (item.id || name || 'addon').toString().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    };
    const id = item.id || inferId();
    const pricing_type = (item.pricing_type || item.rate_type || 'PERCENTAGE').toUpperCase();
    const category = (item.category || 'other').toLowerCase();
    const calculation_base = item.calculation_base || (
      id === 'windscreen_cover' ? 'windscreen_value' :
      id === 'radio_cover' ? 'radio_cassette_value' :
      id === 'accessories_cover' ? 'vehicle_accessories_value' :
      'sum_insured'
    );
    // Base rate/minimum from flat fields
    let base_rate_raw = item.base_rate ?? item.rate ?? item.rate_percent;
    let minimum_premium_raw = item.minimum_premium ?? item.min_premium;

    // If backend provided per-underwriter maps, prefer those
    const rateMaps = item.rates || item.underwriter_rates || item.overrides?.rates;
    const minMaps = item.minimums || item.minimum_premiums || item.overrides?.minimums;
    if (uwCodeUpper && rateMaps && typeof rateMaps === 'object') {
      // Case-insensitive lookup on keys
      const matchKey = Object.keys(rateMaps).find(k => k.toUpperCase() === uwCodeUpper);
      if (matchKey) base_rate_raw = rateMaps[matchKey]?.base_rate ?? rateMaps[matchKey]?.rate ?? rateMaps[matchKey];
    }
    if (uwCodeUpper && minMaps && typeof minMaps === 'object') {
      const matchKey = Object.keys(minMaps).find(k => k.toUpperCase() === uwCodeUpper);
      if (matchKey) minimum_premium_raw = minMaps[matchKey]?.minimum_premium ?? minMaps[matchKey];
    }

    // Normalize numbers
    let base_rate = Number(base_rate_raw ?? 0);
    // If pricing is percentage and backend sent whole percent (e.g., 10), convert to 0.10
    if (pricing_type === 'PERCENTAGE' && base_rate > 1) base_rate = base_rate / 100;
    const minimum_premium = Number(minimum_premium_raw ?? 0);
    return {
      id,
      name: name || id,
      description: item.description || '',
      pricing_type,
      base_rate,
      minimum_premium,
      maximum_limit: item.maximum_limit ? Number(item.maximum_limit) : undefined,
      calculation_base,
      conditional: Boolean(item.conditional) || ['windscreen_value','radio_cassette_value','vehicle_accessories_value'].includes(calculation_base),
      applicable_to: Array.isArray(item.applicable_to) ? item.applicable_to : ['COMPREHENSIVE'],
      category,
    };
  };

  // Load add-ons from backend and merge with defaults
  useEffect(() => {
    const fetchAddons = async () => {
      if (!isComprehensive) {
        setAvailableAddons([]);
        return;
      }
  setAddonsLoading(true);
      setAddonsError(null);
  setNoUnderwriterAddons(false);
      try {
        const base = AddonCalculationService.getStandardAddons();

        // Compose backend query params using product and selected underwriter
        const category = selectedProduct?.category_code || selectedProduct?.category;
  const coverTypeRaw = selectedProduct?.type || selectedProduct?.coverage_type;
        const cover_type = typeof coverTypeRaw === 'string' ? coverTypeRaw.toUpperCase() : undefined;
  const subcategory_code = selectedProduct?.subcategory_code || selectedProduct?.code;
        const underwriter_code = underwriter?.code || underwriter?.underwriter_code || underwriter?.id;

        // Fetch from the new dedicated endpoint first
        let backendItems = [];
        try {
          const resAddons = await djangoAPI.getAddons({ category, cover_type, subcategory_code, underwriter_code });
          try {
            console.log('[AddonSelectionStep] fetched add-ons', {
              params: { category, cover_type, underwriter_code },
              count: Array.isArray(resAddons) ? resAddons.length : null,
              data: resAddons,
            });
          } catch {}
          if (Array.isArray(resAddons)) backendItems = resAddons;
        } catch (_) {
          // Silent: we'll attempt legacy probe next
        }

        // If backend explicitly returns an empty list for this underwriter,
        // treat it as "no add-ons available" and do NOT fall back to defaults.
        if (Array.isArray(backendItems) && backendItems.length === 0) {
          try { console.log('[AddonSelectionStep] no add-ons provided by underwriter; skipping defaults'); } catch {}
          setAvailableAddons([]);
          setNoUnderwriterAddons(true);
          return;
        }

        // Do not probe legacy cover_options here; getAddons already handles fallback on hard failure.

  const overrides = Array.isArray(backendItems) ? backendItems.map(it => normalizeBackendAddon(it, (underwriter_code || '').toUpperCase())) : [];

        // Merge backend-provided definitions over defaults
        const byId = new Map(base.map(a => [a.id, { ...a }]));
        overrides.forEach(ov => {
          const existing = byId.get(ov.id);
          byId.set(ov.id, { ...(existing || {}), ...ov });
        });

        const merged = Array.from(byId.values()).filter(a => a.applicable_to?.includes('COMPREHENSIVE'));
        try {
          const overrideIds = new Set(overrides.map(o => o.id));
          console.log('[AddonSelectionStep] merged add-ons', {
            underwriter_code,
            total: merged.length,
            items: merged.map(a => ({
              id: a.id,
              name: a.name,
              source: overrideIds.has(a.id) ? 'backend' : 'default',
              base_rate: a.base_rate,
              minimum_premium: a.minimum_premium,
              calculation_base: a.calculation_base,
            })),
          });
        } catch {}
        const applicable = merged.filter(a => {
          if (!a.conditional) return true;
          const baseVal = Number(
            vehicleData?.[a.calculation_base] ??
            (a.calculation_base === 'vehicle_accessories_value' ? vehicleData?.other_accessories_value : undefined) ??
            0
          );
          const threshold = Number(a.minimum_value_threshold || 30000);
          return baseVal > threshold;
        });
        setNoUnderwriterAddons(false);
        try {
          console.log('[AddonSelectionStep] applicable add-ons', {
            count: applicable.length,
            ids: applicable.map(a => a.id),
          });
        } catch {}
        setAvailableAddons(applicable);
      } catch (e) {
        // Silent fallback to static applicable addons
        try {
          const fallback = AddonCalculationService.getApplicableAddons('COMPREHENSIVE', vehicleData);
          setAvailableAddons(fallback);
        } catch (_) {
          setAvailableAddons([]);
          setAddonsError('Unable to load add-ons');
        }
      } finally {
        setAddonsLoading(false);
      }
    };
    fetchAddons();
  }, [
    isComprehensive,
    vehicleData?.windscreen_value,
    vehicleData?.radio_cassette_value,
    vehicleData?.sum_insured,
    selectedProduct?.category_code,
    selectedProduct?.category,
    selectedProduct?.type,
    selectedProduct?.coverage_type,
    underwriter?.code,
    underwriter?.underwriter_code,
  ]);

  // Reconcile selections when the available add-ons list changes (e.g., after switching underwriter)
  useEffect(() => {
    if (!Array.isArray(availableAddons)) return;
    const allowedIds = new Set(availableAddons.map(a => a.id));
    const filtered = localSelectedAddons.filter(a => allowedIds.has(a.id));
    if (filtered.length !== localSelectedAddons.length) {
      setRemovedOnSwitch(localSelectedAddons.length - filtered.length);
      setLocalSelectedAddons(filtered);
      onAddonsChange?.(filtered);
    } else {
      setRemovedOnSwitch(0);
    }
  }, [availableAddons]);

  // Calculate add-on premiums when selections or data changes
  useEffect(() => {
    if (!vehicleData || availableAddons.length === 0) return;

    const calculations = {};
    availableAddons.forEach((addon) => {
      calculations[addon.id] = AddonCalculationService.calculateAddonPremium(
        addon,
        vehicleData,
        underwriter || null
      );
    });
    setAddonCalculations(calculations);
  }, [availableAddons, vehicleData, underwriter]);

  // Calculate total for selected add-ons
  const totalCalculation = useMemo(() => {
    if (localSelectedAddons.length === 0) {
      return { total: 0, breakdown: [] };
    }

    return AddonCalculationService.calculateTotalAddonsPremium(
      localSelectedAddons,
      vehicleData,
      underwriter
    );
  }, [localSelectedAddons, vehicleData, underwriter]);

  // Handle add-on selection toggle
  const handleAddonToggle = (addon, isSelected) => {
    let newSelection;
    
    if (isSelected) {
      newSelection = [...localSelectedAddons, addon];
    } else {
      newSelection = localSelectedAddons.filter(selected => selected.id !== addon.id);
    }
    
    setLocalSelectedAddons(newSelection);
    onAddonsChange?.(newSelection);
  };

  // Check if an add-on is selected
  const isAddonSelected = (addonId) => {
    return localSelectedAddons.some(addon => addon.id === addonId);
  };

  // Footer navigation controls are handled by parent screen; no in-step nav here

  // Validate vehicle data for add-ons
  const validation = useMemo(() => {
    return AddonCalculationService.validateVehicleDataForAddons(vehicleData);
  }, [vehicleData]);

  // Group add-ons by category
  const addonsByCategory = useMemo(() => {
    const grouped = {};
    availableAddons.forEach(addon => {
      const category = addon.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(addon);
    });
    return grouped;
  }, [availableAddons]);

  const getCategoryTitle = (category) => {
    const titles = {
      protection: '🛡️ Protection Coverage',
      parts: '🔧 Parts Coverage',
      compensation: '💰 Compensation Benefits',
      other: '📋 Other Add-ons'
    };
    return titles[category] || '📋 Additional Coverage';
  };

  if (!selectedProduct || !isComprehensive) {
    return (
      <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.centerContainer}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoTitle}>Add-ons Not Available</Text>
          <Text style={styles.infoText}>
            Add-on coverage is only available for comprehensive motor insurance policies.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (addonsLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.centerContainer}>
          <Text style={styles.infoTitle}>Loading add-ons…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (addonsError) {
    return (
      <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to load add-ons</Text>
          <Text style={styles.errorText}>{addonsError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!validation.isValid) {
    return (
      <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Missing Vehicle Information</Text>
          <Text style={styles.errorText}>
            Please complete the vehicle details form before selecting add-ons.
          </Text>
          {validation.errors.map((error, index) => (
            <Text key={index} style={styles.errorItem}>• {error.message || String(error)}</Text>
          ))}
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Calculate base premium from underwriter
  const basePremium = underwriter?.premium || underwriter?.breakdown?.base || underwriter?.total_premium || 0;

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Validation Warnings */}
        {validation.warnings.length > 0 && (
          <View style={styles.warningsContainer}>
            <Text style={styles.warningsTitle}>⚠️ Coverage Notes</Text>
            {validation.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningItem}>• {warning}</Text>
            ))}
          </View>
        )}

        {/* No add-ons available for selected underwriter */}
        {!addonsLoading && !addonsError && noUnderwriterAddons && (
          <View style={styles.centerContainer}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoTitle}>No Add-ons Available</Text>
            <Text style={styles.infoText}>
              {underwriter?.name || underwriter?.code || 'Selected underwriter'} does not offer any add-ons for this cover type.
              You can proceed without additional coverage.
            </Text>
          </View>
        )}

        {/* Premium Summary with Base + Add-ons */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>
            {underwriter?.name || underwriter?.code || 'Selected Insurer'}
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Premium</Text>
            <Text style={styles.summaryAmount}>
              {AddonCalculationService.formatCurrency(basePremium)}
            </Text>
          </View>
          {localSelectedAddons.length > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {localSelectedAddons.length} Add-on(s)
                </Text>
                <Text style={styles.summaryAmount}>
                  {AddonCalculationService.formatCurrency(totalCalculation.total)}
                </Text>
              </View>
              {removedOnSwitch > 0 && (
                <Text style={[styles.summaryLabel, { marginTop: 6, fontSize: 12 }]}>
                  {removedOnSwitch} add-on(s) were removed due to underwriter change
                </Text>
              )}
            </>
          )}
        </View>

        {/* Optional Add-ons - Simple Format */}
        <View style={styles.addonsSection}>
          <Text style={styles.addonsSectionTitle}>Optional Add-ons</Text>
          
          {availableAddons.map((addon) => {
            const calculation = addonCalculations[addon.id];
            const isSelected = isAddonSelected(addon.id);
            const isApplicable = calculation?.is_applicable || false;
            
            return (
              <TouchableOpacity
                key={addon.id}
                style={[
                  styles.addonItem,
                  !isApplicable && styles.disabledAddonItem
                ]}
                onPress={() => isApplicable && handleAddonToggle(addon, !isSelected)}
                disabled={!isApplicable}
                activeOpacity={0.7}
              >
                <View style={styles.addonCheckbox}>
                  {isSelected && <View style={styles.addonCheckboxInner} />}
                </View>
                <View style={styles.addonContent}>
                  <Text style={[
                    styles.addonItemName,
                    !isApplicable && styles.disabledText
                  ]}>
                    {addon.name}
                  </Text>
                  {calculation && isApplicable && (
                    <Text style={styles.addonItemPrice}>
                      KES {calculation.calculated_premium.toLocaleString()}
                    </Text>
                  )}
                  {!isApplicable && (
                    <Text style={styles.notAvailableText}>Not available</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TOTAL Summary - Base Premium + Add-ons */}
        <View style={styles.subtotalContainer}>
          <Text style={styles.subtotalLabel}>TOTAL:</Text>
          <Text style={styles.subtotalAmount}>
            KES {(basePremium + totalCalculation.total).toLocaleString()}
          </Text>
        </View>
      </ScrollView>

      {/* Footer navigation handled by parent screen */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  infoIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#646767',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D5222B',
    fontFamily: 'Poppins',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#646767',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  errorItem: {
    fontSize: 14,
    color: '#D5222B',
    fontFamily: 'Poppins',
    marginBottom: 4,
    textAlign: 'center',
  },
  warningsContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  warningItem: {
    fontSize: 14,
    color: '#856404',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#646767',
    fontFamily: 'Poppins',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D5222B',
    fontFamily: 'Poppins',
  },
  addonsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  addonsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins',
    marginBottom: 16,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledAddonItem: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  addonCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D5D5D5',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addonCheckboxInner: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#D5222B',
  },
  addonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addonItemName: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Poppins',
    flex: 1,
  },
  addonItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins',
  },
  disabledText: {
    color: '#999999',
  },
  notAvailableText: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subtotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Poppins',
  },
  subtotalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Poppins',
  },
  // No in-step navigation styles; footer controls live in parent
});

export default AddonSelectionStep;