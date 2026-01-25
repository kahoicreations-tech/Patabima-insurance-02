/**
 * useTPUnderwriters - Third Party Underwriter Comparison Hook
 * Auto-loads underwriters immediately (FIXED pricing doesn't need vehicle details)
 * Eliminates Motor2 mistake: No dependency on form state for FIXED pricing
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import motorPricingService from '../../../../../services/MotorInsurancePricingService';

export const useTPUnderwriters = (subcategoryCode, inputs, options = {}) => {
  const [underwriters, setUnderwriters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Prevent duplicate fetches
  const fetchingRef = useRef(false);
  const lastRequestKeyRef = useRef(null);

  const enabled = options.enabled !== false;

  const requestKey = useMemo(() => {
    const i = inputs || {};
    return JSON.stringify({
      subcategoryCode,
      cover_start_date: i.cover_start_date,
      tonnage: i.tonnage,
      capacity: i.capacity,
      engine_cc: i.engine_cc,
    });
  }, [subcategoryCode, inputs]);

  const loadUnderwriters = useCallback(async () => {
    if (!enabled || !subcategoryCode || fetchingRef.current) return;
    if (!inputs || !inputs.cover_start_date) return;

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await motorPricingService.compareUnderwritersBySubcategory(
        subcategoryCode,
        inputs
      );

      // Sort by price (lowest first)
      const sorted = result.sort((a, b) => a.total_premium - b.total_premium);
      
      setUnderwriters(sorted);
    } catch (err) {
      console.error('[useTPUnderwriters] Error loading underwriters:', err);
      setError(err.message || 'Failed to load underwriters');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [enabled, subcategoryCode, inputs]);

  // Load (or reload) when request inputs change and we're enabled.
  useEffect(() => {
    if (!enabled) return;
    if (!subcategoryCode) return;
    if (!inputs || !inputs.cover_start_date) return;

    if (lastRequestKeyRef.current === requestKey) return;
    lastRequestKeyRef.current = requestKey;
    loadUnderwriters();
  }, [enabled, subcategoryCode, inputs, requestKey, loadUnderwriters]);

  return {
    underwriters,
    loading,
    error,
    reload: loadUnderwriters,
  };
};
