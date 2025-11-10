import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import DynamicVehicleForm from '../VehicleDetails/DynamicVehicleForm';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';
import djangoAPI from '@services/DjangoAPIService';
import { debounce } from '@utils/index';

export default function PolicyDetailsStep({ onDMVICCheckRef }) {
  const { state, actions } = useMotorInsurance();
  
  // Local state for DMVIC check
  const [dmvicLoading, setDMVICLoading] = useState(false);
  const [dmvicError, setDMVICError] = useState(null);
  
  // Use ref to hold latest callback without causing re-renders
  const updateRef = useRef(actions.updateVehicleDetails);
  updateRef.current = actions.updateVehicleDetails;
  
  // Keep an initial snapshot of vehicle details stable while typing to avoid child re-mounts
  const initialDataRef = useRef(state.vehicleDetails);
  // Refresh the snapshot only when the selected product changes (new flow context)
  useEffect(() => {
    initialDataRef.current = state.vehicleDetails;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedSubcategory?.id, state.selectedSubcategory?.subcategory_code]);
  
  // Stable callback that won't cause re-renders
  const handleDataChange = useCallback((data) => {
    updateRef.current(data);
  }, []);

  // Ensure underwriter selection persists as a full object in context
  const handleUnderwriterSelection = useCallback((underwriter) => {
    if (!underwriter) return;
    console.log('[PolicyDetailsStep] Underwriter selected:', underwriter?.name || underwriter?.underwriter_name);
    // Persist full object for downstream steps (Payment, Submission)
    actions.setSelectedUnderwriter?.(underwriter);
    // Also dual-write into vehicleDetails to keep legacy readers working
    const uwName = underwriter?.name || underwriter?.underwriter_name || underwriter?.company_name || underwriter?.company;
    actions.updateVehicleDetails?.({
      underwriter: uwName,
      selectedUnderwriter: underwriter,
    });
  }, [actions]);

  // Process DMVIC result (Phase 1.1)
  const processDMVICResult = useCallback((result) => {
    // AUTO-FILL VEHICLE DATA FROM DMVIC (regardless of existing cover)
    if (result && result.success && result.vehicle) {
      const vehicle = result.vehicle;
      const autoFilledData = {};
      
      // Auto-fill make and model if available
      if (vehicle.make && vehicle.make !== 'NA') {
        autoFilledData.make = vehicle.make;
      }
      if (vehicle.model && vehicle.model !== 'NA') {
        autoFilledData.model = vehicle.model;
      }
      
      // Auto-fill engine number
      if (vehicle.engine_number) {
        autoFilledData.engineNumber = vehicle.engine_number;
      }
      
      // Auto-fill chassis number
      if (vehicle.chassis_number) {
        autoFilledData.chassisNumber = vehicle.chassis_number;
      }
      
      // Auto-fill year of manufacture
      if (vehicle.year_of_manufacture) {
        // Convert to full year if 2-digit (e.g., 93 -> 1993)
        let year = parseInt(vehicle.year_of_manufacture);
        if (year < 100) {
          year = year < 50 ? 2000 + year : 1900 + year;
        }
        autoFilledData.year = year.toString();
      }
      
      // Auto-fill color if available
      if (vehicle.color) {
        autoFilledData.color = vehicle.color;
      }
      
      // Update vehicle details with auto-filled data
      if (Object.keys(autoFilledData).length > 0) {
        actions.updateVehicleDetails(autoFilledData);
        const make = autoFilledData.make || 'N/A';
        const model = autoFilledData.model || 'N/A';
        const year = autoFilledData.year || 'N/A';
        console.log('[DMVIC] ✅ Auto-filled:', `${make} ${model} (${year})`);
      }
    }
    
    // Check for existing cover at the top level of the response
    // Backend returns: { success: true, vehicle: {...}, has_existing_cover: true, existing_cover_expiry: "date" }
    if (result && result.success && result.has_existing_cover) {
      console.log('[DMVIC] ✅ Existing cover detected');
      
      const vehicle = result.vehicle || {};
      const currentPolicy = vehicle.current_policy || {};
      const expiryDateStr = result.existing_cover_expiry || currentPolicy.cover_end_date || null;
      const registrationNumber = vehicle.registration_number || 'N/A';
      
      // Calculate minimum date (expiry + 1 day)
      let minDate = null;
      if (expiryDateStr) {
        try {
          let expiryDate;
          if (expiryDateStr.includes('/')) {
            const [day, month, year] = expiryDateStr.split('/');
            expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            // Handle ISO date format (YYYY-MM-DD or full ISO string)
            expiryDate = new Date(expiryDateStr);
          }
          
          minDate = new Date(expiryDate);
          minDate.setDate(minDate.getDate() + 1);
        } catch (error) {
          console.error('[DMVIC] Error parsing date:', error);
        }
      }

      // Structure matching VehicleVerificationScreen expectations
      const coverData = {
        hasExistingCover: true,
        expiryDate: expiryDateStr,
        policy: {
          vehicle_registration: registrationNumber,
          policy_number: currentPolicy.policy_number || 'N/A',
          insurer: currentPolicy.member_company || 'Unknown Insurer',
          cover_type: currentPolicy.certificate_type || 'Unknown',
          expiry_date: expiryDateStr,
          certificate_number: currentPolicy.policy_number || 'N/A',
        },
      };
      
      actions.setExistingCoverData(coverData);
      
      if (minDate) {
        const minDateISO = minDate.toISOString();
        actions.setMinCoverStartDate(minDateISO);
      }
      
      actions.setShowVerificationScreen(true);
      console.log('[DMVIC] ✅ Verification screen enabled');
    } else {
      // No existing cover
      actions.setExistingCoverData({ hasExistingCover: false });
      actions.setShowVerificationScreen(false);
      actions.setMinCoverStartDate(null);
    }
  }, [actions]);

  // Perform DMVIC check with caching (Phase 1.1)
  const performDMVICCheck = useCallback(async (regNumber, coverDate) => {
    // Short-circuit if we already have a positive detection for this reg in state
    const currentReg = (state.vehicleDetails?.registrationNumber || state.vehicleDetails?.registration_number || '').toUpperCase().trim();
    if (currentReg && currentReg === (regNumber || '').toUpperCase().trim()) {
      if (state.existingCoverData?.hasExistingCover && state.minCoverStartDate) {
        return;
      }
      if (state.showVerificationScreen) {
        return;
      }
    }
    if (!regNumber || regNumber.length < 6) {
      return; // Skip check if registration is too short
    }

    try {
      setDMVICLoading(true);
      setDMVICError(null);

      // Check cache first
      const cachedResult = actions.getCachedDMVICResult?.(regNumber);
      if (cachedResult) {
        console.log('[DMVIC] Using cached result for:', regNumber);
        processDMVICResult(cachedResult);
        setDMVICLoading(false);
        return;
      }

      // Make API call
      console.log('[DMVIC] Checking vehicle:', regNumber);
      
      const payload = {
        registration_number: regNumber.trim().toUpperCase(),
        proposed_cover_start_date: coverDate || new Date().toISOString().split('T')[0],
      };
      
      const response = await djangoAPI.makeRequest('/api/insurance/dmvic/search-vehicle/', {
        method: 'POST',
        body: JSON.stringify(payload),
        _suppressErrorLog: true,
      });

      console.log('[DMVIC] ✅ Response received for:', regNumber);

      // Cache the result
      if (actions.cacheDMVICResult) {
        actions.cacheDMVICResult(regNumber, response);
      }

      // Process result
      processDMVICResult(response);
    } catch (error) {
      console.warn('[DMVIC] Check failed (non-blocking):', error?.message || error);
      
      const errorMsg = 'DMVIC verification unavailable right now. You can proceed anyway.';
      setDMVICError(errorMsg);
      
      // Don't block user flow on error
      actions.setExistingCoverData({ hasExistingCover: false });
      actions.setShowVerificationScreen(false);
    } finally {
      setDMVICLoading(false);
    }
  }, [actions, processDMVICResult, state.vehicleDetails, state.existingCoverData, state.minCoverStartDate, state.showVerificationScreen]);

  // Store performDMVICCheck in a ref to avoid dependency issues
  // Keep stable reference for external access
  const performDMVICCheckRef = useRef(performDMVICCheck);
  performDMVICCheckRef.current = performDMVICCheck;

  // Expose to parent container via callback ref
  useEffect(() => {
    if (onDMVICCheckRef) {
      onDMVICCheckRef(performDMVICCheckRef);
    }
  }, [onDMVICCheckRef]);

  // ✅ REMOVED: Mount check for DMVIC - now triggered by Next button in MotorInsuranceContainer
  // ✅ REMOVED: Debounced registration/date change handlers - DMVIC only runs on Next button
  // This prevents repeated logging and unnecessary processing while user types

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <DynamicVehicleForm 
            selectedProduct={state.selectedSubcategory}
            productType={state.productType}
            initialData={initialDataRef.current}
            onDataChange={handleDataChange}
            onUnderwriterSelection={handleUnderwriterSelection}
            minCoverStartDate={state.minCoverStartDate}
            dmvicLoading={dmvicLoading}
            dmvicError={dmvicError}
            existingCoverData={state.existingCoverData}
          />
          {/* Modal removed - rendered by MotorInsuranceContainer.js instead */}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
});
