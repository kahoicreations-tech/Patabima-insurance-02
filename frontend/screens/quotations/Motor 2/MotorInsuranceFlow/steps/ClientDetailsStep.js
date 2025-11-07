import React, { useMemo, useCallback, useRef } from 'react';
import EnhancedClientForm from '../ClientDetails/EnhancedClientForm';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';

export default function ClientDetailsStep() {
  const { state, actions } = useMotorInsurance();

  // ✅ Use ref to avoid re-creating onChange on every render
  const updateRef = useRef(actions.updatePricingInputs);
  updateRef.current = actions.updatePricingInputs;

  const extractedData = useMemo(() => {
    // Merge all extracted fields into a flat object for convenience
    const all = state.extractedDocuments?.all || {};
    return all;
  }, [state.extractedDocuments?.all]);

  const values = state.pricingInputs?.clientDetails || {};
  const selectedProduct = state.selectedSubcategory || state.productType || {};
  const vehicleData = state.vehicleDetails || {};

  // ✅ Stable onChange handler that won't cause re-renders
  const handleChange = useCallback((clientDetails) => {
    // Compute a fullName field expected by the container validator
    const first = (clientDetails.first_name || '').toString().trim();
    const last = (clientDetails.last_name || '').toString().trim();
    const fullName = [first, last].filter(Boolean).join(' ');

    // Mirror into common name field for broader compatibility
    const enriched = {
      ...clientDetails,
      ...(fullName ? { fullName, name: fullName } : {}),
    };

    updateRef.current({ clientDetails: enriched });
    // Keep legacy state in sync for any consumers still reading from state.clientDetails
    actions.updateClientDetails?.(enriched);
  }, [actions]);

  const handleValidationChange = useCallback((validationResult) => {
    // Optionally keep validation status in context if needed later
    // actions.setClientValidation?.(validationResult)
    return validationResult;
  }, []);

  return (
    <EnhancedClientForm
      selectedProduct={selectedProduct}
      vehicleData={vehicleData}
      extractedData={extractedData}
      values={values}
      onChange={handleChange}
      onValidationChange={handleValidationChange}
    />
  );
}
