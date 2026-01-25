/**
 * useCompUnderwriters - Comprehensive Underwriter Comparison Hook
 * Triggers comparison only after pricing fields filled (BRACKET pricing)
 * Eliminates Motor2 mistake: Smart comparison trigger based on field dependencies
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import motorPricingService from '../../../../../services/MotorInsurancePricingService';
import { arePricingFieldsFilled } from '../../utils/fieldClassification';

export default function useCompUnderwriters(subcategoryCode, inputs, options = {}) {
  const [underwriters, setUnderwriters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchingRef = useRef(false);
  const lastComparisonRef = useRef(null);

  const enabled = options.enabled !== false;

  const requestKey = useMemo(() => {
    const i = inputs || {};
    return JSON.stringify({
      subcategoryCode,
      sum_insured: i.sum_insured,
      year: i.year,
      make: i.make,
      model: i.model,
      cover_start_date: i.cover_start_date,
    });
  }, [subcategoryCode, inputs]);

  const compareUnderwriters = useCallback(async () => {
    if (!enabled || !subcategoryCode || fetchingRef.current) return;
    if (!inputs) return;

    // Check if all pricing fields are filled
    if (!arePricingFieldsFilled(inputs, 'BRACKET')) {
      return;
    }

    // Prevent duplicate fetches for same data
    if (lastComparisonRef.current === requestKey) {
      return;
    }

    fetchingRef.current = true;
    lastComparisonRef.current = requestKey;
    setLoading(true);
    setComparing(true);
    setError(null);

    try {
      const result = await motorPricingService.compareUnderwritersBySubcategory(
        subcategoryCode,
        {
          sum_insured: inputs.sum_insured,
          year: inputs.year,
          make: inputs.make,
          model: inputs.model,
          cover_start_date: inputs.cover_start_date || new Date().toISOString().split('T')[0],
        }
      );

      // Sort by price (lowest first)
      const sorted = result.sort((a, b) => a.total_premium - b.total_premium);
      
      setUnderwriters(sorted);
    } catch (err) {
      console.error('[useCompUnderwriters] Error:', err);
      setError(err.message || 'Failed to load underwriters');
    } finally {
      setLoading(false);
      setComparing(false);
      fetchingRef.current = false;
    }
  }, [enabled, subcategoryCode, inputs, requestKey]);

  useEffect(() => {
    if (!enabled) return;
    if (!subcategoryCode) return;
    if (!inputs) return;

    compareUnderwriters();
  }, [enabled, subcategoryCode, inputs, requestKey, compareUnderwriters]);

  const reset = useCallback(() => {
    setUnderwriters([]);
    setError(null);
    lastComparisonRef.current = null;
  }, []);

  return {
    underwriters,
    loading,
    comparing,
    error,
    compareUnderwriters,
    reset,
  };
}
