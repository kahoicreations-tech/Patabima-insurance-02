import React, { useMemo } from 'react';
import EnhancedClientForm from '../ClientDetails/EnhancedClientForm';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';

export default function ClientDetailsStep() {
  const { state, actions } = useMotorInsurance();

  const extractedData = useMemo(() => {
    // Merge all extracted fields into a flat object for convenience
    const all = state.extractedDocuments?.all || {};
    return all;
  }, [state.extractedDocuments?.all]);

  const values = state.pricingInputs?.clientDetails || {};
  const selectedProduct = state.selectedSubcategory || state.productType || {};
  const vehicleData = state.vehicleDetails || {};

  return (
    <EnhancedClientForm
      selectedProduct={selectedProduct}
      vehicleData={vehicleData}
      extractedData={extractedData}
      values={values}
      onChange={(clientDetails) => {
        actions.updatePricingInputs({ clientDetails });
      }}
      onValidationChange={(validationResult) => {
        // Optionally keep validation status in context if needed later
        // actions.setClientValidation?.(validationResult)
        return validationResult;
      }}
    />
  );
}
