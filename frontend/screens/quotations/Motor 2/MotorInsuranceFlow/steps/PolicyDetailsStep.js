import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import DynamicVehicleForm from '../VehicleDetails/DynamicVehicleForm';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';
import djangoAPI from '@services/DjangoAPIService';
import { debounce } from '@utils/index';

export default function PolicyDetailsStep() {
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

  // Process DMVIC result (Phase 1.1)
  const processDMVICResult = useCallback((result) => {
    console.log('[DMVIC PolicyDetails] Processing result:', JSON.stringify(result, null, 2));
    
    // Check for existing cover at the top level of the response
    // Backend returns: { success: true, vehicle: {...}, has_existing_cover: true, existing_cover_expiry: "date" }
    if (result && result.success && result.has_existing_cover) {
      console.log('[DMVIC PolicyDetails] Existing cover detected');
      
      const vehicle = result.vehicle || {};
      const expiryDateStr = result.existing_cover_expiry || vehicle.cover_end_date || vehicle.cover_to || null;
      const registrationNumber = vehicle.registration_number || vehicle.vehicle_registration || 'N/A';
      
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
          
          console.log('[DMVIC PolicyDetails] Existing cover expires:', expiryDateStr);
          console.log('[DMVIC PolicyDetails] Minimum date calculated:', minDate.toISOString());
        } catch (error) {
          console.error('[DMVIC PolicyDetails] Error parsing date:', error);
        }
      }

      // Structure matching VehicleVerificationScreen expectations
      actions.setExistingCoverData({
        hasExistingCover: true,
        expiryDate: expiryDateStr,
        policy: {
          vehicle_registration: registrationNumber,
          policy_number: vehicle.policy_number || 'N/A',
          insurer: vehicle.member_company || vehicle.insurer || 'Unknown Insurer',
          cover_type: vehicle.class_of_insurance || vehicle.cover_type || 'Unknown',
          expiry_date: expiryDateStr,
          certificate_number: vehicle.certificate_type || vehicle.policy_number || 'N/A',
        },
      });
      
      if (minDate) {
        actions.setMinCoverStartDate(minDate.toISOString());
      }
      
      actions.setShowVerificationScreen(true);
      console.log('[DMVIC PolicyDetails] Existing cover found, showing verification screen');
    } else {
      // No existing cover
      console.log('[DMVIC PolicyDetails] No existing cover found');
      actions.setExistingCoverData({ hasExistingCover: false });
      actions.setShowVerificationScreen(false);
      actions.setMinCoverStartDate(null);
    }
  }, [actions]);

  // Perform DMVIC check with caching (Phase 1.1)
  const performDMVICCheck = useCallback(async (regNumber, coverDate) => {
    if (!regNumber || regNumber.length < 6) {
      console.log('[DMVIC PolicyDetails] Registration too short, skipping check:', regNumber);
      return; // Skip check if registration is too short
    }

    try {
      console.log('[DMVIC PolicyDetails] Starting check for:', regNumber, 'Cover date:', coverDate);
      setDMVICLoading(true);
      setDMVICError(null);

      // Check cache first
      const cachedResult = actions.getCachedDMVICResult?.(regNumber);
      if (cachedResult) {
        console.log('[DMVIC PolicyDetails] Using cached result for:', regNumber);
        processDMVICResult(cachedResult);
        setDMVICLoading(false);
        return;
      }

      // Make API call
      console.log('[DMVIC PolicyDetails] Fetching fresh data for:', regNumber);
      
      const payload = {
        registration_number: regNumber.trim().toUpperCase(),
        proposed_cover_start_date: coverDate || new Date().toISOString().split('T')[0],
      };
      
      console.log('[DMVIC PolicyDetails] Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await djangoAPI.makeRequest('/api/insurance/dmvic/search-vehicle/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('[DMVIC PolicyDetails] API Response:', JSON.stringify(response, null, 2));

      // Cache the result
      if (actions.cacheDMVICResult) {
        actions.cacheDMVICResult(regNumber, response);
      }

      // Process result
      processDMVICResult(response);
    } catch (error) {
      console.error('[DMVIC PolicyDetails] Check failed:', error);
      console.error('[DMVIC PolicyDetails] Error message:', error.message);
      console.error('[DMVIC PolicyDetails] Error stack:', error.stack);
      
      const errorMsg = error.message || 'Failed to verify vehicle. You can proceed anyway.';
      setDMVICError(errorMsg);
      
      // Don't block user flow on error
      actions.setExistingCoverData({ hasExistingCover: false });
      actions.setShowVerificationScreen(false);
    } finally {
      setDMVICLoading(false);
    }
  }, [actions, processDMVICResult]);

  // Debounced handlers (Phase 1.1)
  const debouncedDMVICCheck = useRef(
    debounce((regNumber, coverDate) => {
      performDMVICCheck(regNumber, coverDate);
    }, 500)
  ).current;

  const handleRegistrationChange = useCallback((regNumber) => {
    console.log('[DMVIC PolicyDetails] Registration changed:', regNumber, 'Length:', regNumber?.length);
    
    if (!regNumber || regNumber.length < 6) {
      console.log('[DMVIC PolicyDetails] Registration too short, not triggering check');
      return;
    }
    
    const coverDate = state.vehicleDetails.cover_start_date || state.vehicleDetails.coverStartDate || new Date().toISOString().split('T')[0];
    console.log('[DMVIC PolicyDetails] Cover date:', coverDate);
    console.log('[DMVIC PolicyDetails] Triggering debounced DMVIC check...');
    
    debouncedDMVICCheck(regNumber, coverDate);
  }, [state.vehicleDetails.cover_start_date, state.vehicleDetails.coverStartDate, debouncedDMVICCheck]);

  const handleCoverDateChange = useCallback((coverDate) => {
    console.log('[DMVIC PolicyDetails] Cover date changed:', coverDate);
    const regNumber = state.vehicleDetails.registration_number || state.vehicleDetails.registrationNumber || state.vehicleDetails.Registration_Number;
    console.log('[DMVIC PolicyDetails] Registration number:', regNumber);
    if (regNumber && regNumber.length >= 6) {
      debouncedDMVICCheck(regNumber, coverDate);
    }
  }, [state.vehicleDetails.registration_number, state.vehicleDetails.registrationNumber, state.vehicleDetails.Registration_Number, debouncedDMVICCheck]);

  // Handlers removed - now in MotorInsuranceContainer.js

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
            onRegistrationChange={handleRegistrationChange}
            onCoverDateChange={handleCoverDateChange}
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
