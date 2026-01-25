import React from 'react';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';
import UnderwriterSelectionStep from '../Comprehensive/UnderwriterSelectionStep';

export default function UnderwritersStepWrapper() {
  const { state, actions } = useMotorInsurance();
  
  // Prepare vehicle data from context
  const vehicleData = {
    ...state.vehicleDetails,
    ...state.pricingInputs,
    // Ensure sum_insured is available
    sum_insured: state.vehicleDetails?.sum_insured || state.pricingInputs?.sum_insured,
    registration_number: state.vehicleDetails?.registrationNumber || state.vehicleDetails?.registration_number,
    cover_start_date: state.vehicleDetails?.cover_start_date,
    make: state.vehicleDetails?.make,
    model: state.vehicleDetails?.model,
    year_of_manufacture: state.vehicleDetails?.year,
  };
  
  const handleUnderwriterSelect = (underwriter) => {
    console.log('[UnderwritersStepWrapper] Underwriter selected:', underwriter?.name);
    // Update context with selected underwriter
    actions.setSelectedUnderwriter?.(underwriter);
    // Also update vehicle details for compatibility
    actions.updateVehicleDetails?.({
      underwriter: underwriter?.name || underwriter?.underwriter_name,
      selectedUnderwriter: underwriter,
    });
  };
  
  return (
    <UnderwriterSelectionStep 
      vehicleData={vehicleData}
      selectedProduct={state.selectedSubcategory}
      selectedUnderwriter={state.selectedUnderwriter}
      onUnderwriterSelect={handleUnderwriterSelect}
    />
  );
}
