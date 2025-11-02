import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import motorPricingService from '../../../../../services/MotorInsurancePricingService';

export default function UnderwriterSelectionStep({ 
  vehicleData, 
  selectedProduct, 
  selectedUnderwriter, 
  onUnderwriterSelect 
}) {
  const [underwriters, setUnderwriters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Day 12: Sorting and filtering state
  const [sortBy, setSortBy] = useState('price_asc'); // price_asc, price_desc, name_asc, name_desc
  const [displayMode, setDisplayMode] = useState('GROSS'); // NET or GROSS - could come from backend per underwriter

  useEffect(() => {
    if (vehicleData && selectedProduct) {
      loadUnderwriterPricing();
    }
  }, [vehicleData, selectedProduct]);

  const loadUnderwriterPricing = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build request using selected product and form data
      const category = selectedProduct?.category_code || selectedProduct?.category;
      const coverTypeRaw = selectedProduct?.type || selectedProduct?.coverage_type;
      const coverType = String(coverTypeRaw || '').toUpperCase();

      // Extract sum_insured with multiple fallback field names
      const sumInsuredValue = 
        vehicleData?.sum_insured || 
        vehicleData?.sumInsured || 
        vehicleData?.vehicle_value || 
        vehicleData?.vehicle_valuation ||
        0;

      console.log('🔍 UnderwriterSelectionStep - vehicleData received:', vehicleData);
      console.log('💰 Sum Insured extracted:', sumInsuredValue);

      // Validate critical fields for comprehensive pricing
      if (!sumInsuredValue || sumInsuredValue === 0) {
        const errorMsg = 'Sum Insured is required for comprehensive insurance pricing. Please enter the vehicle value.';
        console.error('❌ Validation Error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const inputs = {
        // Minimum fields used by backend for discovery/pricing
        category: category,
        subcategory_code: selectedProduct?.subcategory_code || selectedProduct?.code,
        cover_type: coverType,

        // Vehicle and policy basics
        registrationNumber: vehicleData?.registration_number || vehicleData?.registration || vehicleData?.registrationNumber,
        cover_start_date: vehicleData?.policy_start_date || vehicleData?.cover_start_date,
        vehicle_year: vehicleData?.year_of_manufacture || vehicleData?.year,
        vehicle_make: vehicleData?.make,
        vehicle_model: vehicleData?.model,
        
        // CRITICAL: Pricing-relevant fields - ensure sum_insured is always included
        sum_insured: Number(sumInsuredValue),
        
        // Additional coverage values
        windscreen_value: vehicleData?.windscreen_value,
        radio_cassette_value: vehicleData?.radio_cassette_value,
        vehicle_accessories_value: vehicleData?.vehicle_accessories_value,
        
        // Commercial/PSV specific
        tonnage: vehicleData?.tonnage,
        passengers: vehicleData?.passengerCapacity || vehicleData?.passenger_count,
      };

      console.log('📤 Sending to backend - API Payload:', JSON.stringify(inputs, null, 2));

      // Use the working compare endpoint via service
      const comparisons = await motorPricingService.compareUnderwritersByCoverType(category, coverType, inputs);

      // Map to UI card shape
      const underwriterList = comparisons.map((uw, idx) => {
        // Preserve raw features (may include addon_rates/minimum_premiums)
        const rawFeatures = uw.features;
        // Derive displayable benefits list when features isn't an array
        const displayFeatures = Array.isArray(rawFeatures)
          ? rawFeatures
          : (Array.isArray(rawFeatures?.benefits) ? rawFeatures.benefits : []);

        // Determine base premium and base rate
  const backendBase = Number(uw.breakdown?.base ?? 0);
  const backendBasePremium = Number(uw.breakdown?.base_premium ?? uw.base_premium ?? 0);
        const sumInsured = Number(vehicleData?.sum_insured || 0);

        // Try to extract an explicit base rate from backend structures
        const raw = uw._raw || {};
        const rawResult = raw.result || raw;
        const pricingKey = `${String(category || '').toUpperCase()}_${String(coverType || '').toUpperCase()}`;
        const pricingNode = rawResult?.features?.pricing?.[pricingKey]
          || rawResult?.features?.pricing
          || uw.features?.pricing?.[pricingKey]
          || uw.features?.pricing
          || {};
  const pricingBasePremium = Number(pricingNode?.base_premium ?? 0);
        // Detect a minimum base premium from various possible fields in backend payloads
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
  let rateCandidate = pricingNode.base_rate ?? pricingNode.rate_percent ?? pricingNode.rate ?? uw.breakdown?.base_rate ?? uw.base_rate;
        let rateDecimal = Number(rateCandidate);
        if (isFinite(rateDecimal) && rateDecimal > 1) {
          // Treat values >1 as percentages and convert to decimal
          rateDecimal = rateDecimal / 100;
        }
        if (!isFinite(rateDecimal) || rateDecimal <= 0) {
          // Fallback to implied rate from available base and sum insured
          const impliedBase = backendBasePremium || backendBase;
          rateDecimal = sumInsured > 0 && impliedBase > 0 ? Number(impliedBase) / sumInsured : undefined;
        }
        const baseRatePercent = isFinite(rateDecimal) && rateDecimal > 0 ? (rateDecimal * 100) : undefined;

        // Enforce minimum premium rule: prefer the highest available base value
        let effectiveBase = Math.max(
          0,
          backendBase,
          backendBasePremium,
          pricingBasePremium
        );
        if (minBasePremium > 0 && effectiveBase < minBasePremium) {
          effectiveBase = minBasePremium;
        }
        // Determine what backend originally reported (prefer explicit base, otherwise base_premium)
        const originalBaseCandidate = backendBase > 0 ? backendBase : (backendBasePremium > 0 ? backendBasePremium : 0);
        const minimumApplied = originalBaseCandidate > 0 && effectiveBase > originalBaseCandidate;
        // Recalculate levies & total from effective base (authoritative)
        const itl = Math.round(effectiveBase * 0.0025);
        const pcf = Math.round(effectiveBase * 0.0025);
        const stamp = Number(uw.breakdown?.stamp_duty ?? 40);
        const effectiveTotal = Number(effectiveBase + itl + pcf + stamp);
        return {
        id: uw.id || uw.underwriter_id || `uw_${idx}`,
        name: uw.name || uw.underwriter_name,
        code: uw.underwriter_code,
        basicPremium: effectiveBase,
        originalBase: originalBaseCandidate || undefined,
        totalPremium: effectiveTotal,
        levies: {
          itl,
          pcf,
          stampDuty: stamp,
        },
        discount: uw.discount || 0,
        // Keep raw features for downstream calculations (e.g., addon_rates)
        features: rawFeatures,
        // Use displayFeatures for UI benefits list
        displayFeatures,
        // Base rate percent used to compute base premium (from backend or implied)
        baseRatePercent,
        rating: typeof uw.rating === 'number' ? uw.rating : undefined,
        processingTime: uw.processing_time,
        claimSettlement: uw.claim_settlement,
        customerSupport: uw.customer_support,
        // Keep the normalized pricing data for later steps
        premium: uw.premium || uw.total_premium || uw.totalPremium || 0,
        breakdown: { ...(uw.breakdown || {}), base: effectiveBase, training_levy: itl, pcf_levy: pcf, stamp_duty: stamp },
        total_premium: effectiveTotal,
        minimumApplied,
        // Preserve extendible config from backend for EXT products
        ...(uw.extendible_config && { extendible_config: uw.extendible_config }),
        ...(uw.is_extendible !== undefined && { is_extendible: uw.is_extendible }),
        ...(uw.payment_plan && { payment_plan: uw.payment_plan }),
        };
      });

      console.log('📊 Processed underwriter list with extendible configs:', 
        underwriterList.map(u => ({
          name: u.name,
          is_extendible: u.is_extendible,
          has_config: !!u.extendible_config,
          initial_amount: u.extendible_config?.initial_amount
        }))
      );

      setUnderwriters(underwriterList);
      // Reconcile selection to keep summary and list in sync
      try {
        if (selectedUnderwriter && selectedUnderwriter.code) {
          const updated = underwriterList.find(u => u.code === selectedUnderwriter.code) || underwriterList.find(u => u.id === selectedUnderwriter.id);
          if (updated && (updated.totalPremium !== selectedUnderwriter.totalPremium || updated.basicPremium !== selectedUnderwriter.basicPremium)) {
            onUnderwriterSelect && onUnderwriterSelect(updated);
          }
        }
      } catch {}
    } catch (err) {
      console.error('❌ Error loading underwriter pricing:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        vehicleData,
        selectedProduct
      });
      
      // Enhanced error message based on error type
      let errorMessage = 'Failed to load underwriter pricing. ';
      
      if (err.message && err.message.includes('Sum Insured')) {
        errorMessage = err.message;
      } else if (err.message && err.message.includes('sum_insured')) {
        errorMessage = 'Please enter the Sum Insured (vehicle value) to get pricing from underwriters.';
      } else if (err.message && err.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
        errorMessage = 'Request timed out. The server is taking longer than expected. Please try again.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please check your inputs and try again.';
      }
      
      console.error('❌ UnderwriterSelectionStep Error:', errorMessage);
      console.error('Full error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Day 12: Sort underwriters based on selected criteria
  const sortedUnderwriters = React.useMemo(() => {
    if (!underwriters || underwriters.length === 0) return [];
    
    const sorted = [...underwriters];
    
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.totalPremium - b.totalPremium);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.totalPremium - a.totalPremium);
        break;
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [underwriters, sortBy]);
  
  // Find minimum price for "Save KSh X" badge
  const minimumPrice = React.useMemo(() => {
    if (!underwriters || underwriters.length === 0) return null;
    return Math.min(...underwriters.map(u => u.totalPremium));
  }, [underwriters]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderRating = (rating) => {
    if (typeof rating !== 'number') return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`star-${i}`} name="star" size={14} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half-star" name="star-half" size={14} color="#FFD700" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#DDD" />
      );
    }

    return (
      <View style={styles.ratingContainer}>
        <View style={styles.stars}>{stars}</View>
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const renderUnderwriterCard = (underwriter, index) => {
    const isSelected = selectedUnderwriter?.id === underwriter.id;
    const savings = underwriter.discount > 0 ? (underwriter.basicPremium * underwriter.discount / 100) : 0;
    const isLowestPrice = underwriter.totalPremium === minimumPrice;
    const priceDifference = minimumPrice ? underwriter.totalPremium - minimumPrice : 0;
    const isFirstResult = index === 0;

    return (
      <TouchableOpacity
        key={underwriter.id}
        style={[
          styles.underwriterCard,
          isSelected && styles.selectedCard
        ]}
        onPress={() => onUnderwriterSelect(underwriter)}
      >
        {/* Header with name and selection indicator */}
        <View style={styles.cardHeader}>
          <View style={styles.underwriterInfo}>
            <View style={styles.underwriterNameRow}>
              <Text style={styles.underwriterName}>{underwriter.name}</Text>
              {/* Day 12: NET/GROSS badge */}
              <View style={[styles.displayModeBadge, displayMode === 'NET' ? styles.netBadge : styles.grossBadge]}>
                <Text style={styles.displayModeText}>{underwriter.display_mode || displayMode || 'GROSS'}</Text>
              </View>
            </View>
            {renderRating(underwriter.rating)}
            {/* Day 12: Recommended and Savings badges */}
            <View style={styles.badgesRow}>
              {isFirstResult && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>✓ Recommended</Text>
                </View>
              )}
              {isLowestPrice && (
                <View style={styles.lowestPriceBadge}>
                  <Text style={styles.lowestPriceText}>💰 Lowest Price</Text>
                </View>
              )}
              {!isLowestPrice && priceDifference > 0 && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save {formatCurrency(priceDifference)} with lowest option</Text>
                </View>
              )}
            </View>
          </View>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color="#D5222B" />
            </View>
          )}
        </View>

        {/* Premium Information */}
        <View style={styles.premiumSection}>
          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Basic Premium</Text>
            <Text style={styles.premiumAmount}>{formatCurrency(underwriter.basicPremium)}</Text>
          </View>
          {underwriter.minimumApplied && (
            <View style={styles.minNoteRow}>
              <Text style={styles.minNoteText}>
                Minimum premium applied
                {underwriter.originalBase && underwriter.originalBase < underwriter.basicPremium
                  ? ` (raised from ${formatCurrency(underwriter.originalBase)})`
                  : ''}
              </Text>
            </View>
          )}
          {typeof underwriter.baseRatePercent === 'number' && (
            <View style={styles.premiumRow}>
              <Text style={styles.subLabel}>Base Rate</Text>
              <Text style={styles.subValue}>{underwriter.baseRatePercent.toFixed(2)}%</Text>
            </View>
          )}
          
          {underwriter.discount > 0 && (
            <View style={styles.premiumRow}>
              <Text style={styles.discountLabel}>Discount ({underwriter.discount}%)</Text>
              <Text style={styles.discountAmount}>-{formatCurrency(savings)}</Text>
            </View>
          )}

          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Levies & Taxes</Text>
            <Text style={styles.premiumAmount}>
              {formatCurrency((underwriter.levies?.itl || 0) + (underwriter.levies?.pcf || 0) + (underwriter.levies?.stampDuty || 0))}
            </Text>
          </View>

          <View style={styles.divider} />
          
          <View style={[styles.premiumRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Premium</Text>
            <Text style={styles.totalAmount}>{formatCurrency(underwriter.totalPremium)}</Text>
          </View>
        </View>

        {/* Features */}
        {Array.isArray(underwriter.displayFeatures) && underwriter.displayFeatures.length > 0 && (
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Key Benefits</Text>
            {underwriter.displayFeatures.slice(0, 3).map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Service Information */}
        {(underwriter.processingTime || underwriter.claimSettlement || underwriter.customerSupport) && (
          <View style={styles.serviceSection}>
            {underwriter.processingTime && (
              <View style={styles.serviceRow}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.serviceText}>Processing: {underwriter.processingTime}</Text>
              </View>
            )}
            {underwriter.claimSettlement && (
              <View style={styles.serviceRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#666" />
                <Text style={styles.serviceText}>Claims: {underwriter.claimSettlement}</Text>
              </View>
            )}
            {underwriter.customerSupport && (
              <View style={styles.serviceRow}>
                <Ionicons name="headset-outline" size={16} color="#666" />
                <Text style={styles.serviceText}>Support: {underwriter.customerSupport}</Text>
              </View>
            )}
          </View>
        )}

        {/* Recommended Badge */}
        {typeof underwriter.discount === 'number' && underwriter.discount > 0 && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>BEST VALUE</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D5222B" />
        <Text style={styles.loadingText}>Loading underwriter quotes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#D5222B" />
        <Text style={styles.errorTitle}>Unable to Load Quotes</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        
        {/* Show helpful tips based on error type */}
        {error.includes('Sum Insured') && (
          <View style={styles.errorTipBox}>
            <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
            <Text style={styles.errorTipText}>
              Please go back and enter the Sum Insured (vehicle market value) to get accurate quotes.
            </Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.retryButton} onPress={loadUnderwriterPricing}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        
        {/* Debug information for development */}
        {__DEV__ && (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>
              Vehicle Data: {JSON.stringify(vehicleData, null, 2)}
            </Text>
            <Text style={styles.debugText}>
              Selected Product: {JSON.stringify(selectedProduct, null, 2)}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Temporary: Premium calculation description (to be removed later) */}
      <View style={styles.calcInfoBox}>
        <Text style={styles.calcInfoTitle}>How this premium is calculated</Text>
        <Text style={styles.calcInfoText}>
          Base Premium = Sum Insured × Underwriter Rate. Mandatory levies are then added: Insurance Training Levy (0.25%) + Policyholders Compensation Fund (0.25%) + Stamp Duty (KSh 40). Some underwriters also enforce a minimum premium; if the percentage result is below the minimum, the minimum applies.
        </Text>
      </View>

      <ScrollView style={styles.underwritersList} showsVerticalScrollIndicator={false}>
        {sortedUnderwriters.map((uw, idx) => renderUnderwriterCard(uw, idx))}
      </ScrollView>

      {selectedUnderwriter && (
        <View style={styles.selectionSummary}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>Selected: {selectedUnderwriter.name}</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(selectedUnderwriter.totalPremium)}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  // Temporary calculation info box
  calcInfoBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  calcInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
    fontFamily: 'Poppins-SemiBold',
  },
  calcInfoText: {
    fontSize: 12,
    color: '#646767',
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
    paddingHorizontal: 16,
  },
  errorTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    maxWidth: '100%',
  },
  errorTipText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D5222B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
  debugBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    width: '100%',
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Courier',
    lineHeight: 14,
  },
  underwritersList: {
    flex: 1,
  },
  underwriterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#D5222B',
    backgroundColor: '#fff5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  underwriterInfo: {
    flex: 1,
  },
  underwriterName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  premiumSection: {
    marginBottom: 16,
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  premiumLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  premiumAmount: {
    fontSize: 14,
    color: '#2c3e50',
    fontFamily: 'Poppins-Medium',
  },
  discountLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Poppins-Regular',
  },
  discountAmount: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Poppins-Medium',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'Poppins-SemiBold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D5222B',
    fontFamily: 'Poppins-Bold',
  },
  featuresSection: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  serviceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'Poppins-SemiBold',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D5222B',
    fontFamily: 'Poppins-Bold',
  },
  // Day 12: New styles for sorting, badges, and NET/GROSS display
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#646767',
    marginRight: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  sortButtonActive: {
    backgroundColor: '#D5222B',
    borderColor: '#D5222B',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#646767',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  underwriterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  displayModeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  netBadge: {
    backgroundColor: '#e3f2fd',
  },
  grossBadge: {
    backgroundColor: '#f3e5f5',
  },
  displayModeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#495057',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  lowestPriceBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowestPriceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2e7d32',
  },
  savingsBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ef6c00',
  },
});