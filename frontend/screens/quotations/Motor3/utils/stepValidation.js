/**
 * Motor3 Step Validation - Comprehensive validation logic for Third Party flow
 * Based on Motor2's validation patterns with Kenyan-specific rules
 */

/**
 * Validate Category Selection step
 */
export const validateCategoryStep = (state) => {
  const ok = !!state.selectedCategory;
  return {
    canProceed: ok,
    validationMessage: ok ? '' : 'Select a vehicle category to continue',
  };
};

/**
 * Validate Subcategory Selection step
 */
export const validateSubcategoryStep = (state) => {
  const ok = !!state.selectedSubcategory;
  return {
    canProceed: ok,
    validationMessage: ok ? '' : 'Select a cover type to continue',
  };
};

/**
 * Validate Vehicle Details step
 */
export const validateVehicleDetailsStep = (formData, selectedSubcategory) => {
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  
  const registration = str(
    formData.registrationNumber || 
    formData.registration_number || 
    formData.Registration_Number
  );
  
  const identificationType = str(
    formData.identificationType || 
    formData.Vehicle_Identification_Type
  );
  
  const coverStart = str(
    formData.cover_start_date || 
    formData.coverStartDate || 
    formData.Cover_Start_Date
  );
  
  const pricingModel = selectedSubcategory?.pricing_model || 'FIXED';
  const needsTonnage = pricingModel === 'TONNAGE' || String(pricingModel).includes('TONNAGE');
  const needsCapacity = pricingModel === 'PASSENGER' || String(pricingModel).includes('PASSENGER');
  const needsEngineCC = pricingModel === 'ENGINE_CC' || String(pricingModel).includes('ENGINE_CC');

  const tonnage = formData.tonnage;
  const capacity = formData.capacity;
  const engineCC = formData.engine_cc;
  
  const hasReg = !!registration;
  const hasIdType = !!identificationType;
  const hasCover = !!coverStart;
  
  const hasTonnage = !needsTonnage || !!tonnage;
  const hasCapacity = !needsCapacity || !!capacity;
  const hasEngineCC = !needsEngineCC || !!engineCC;

  const ok = hasReg && hasIdType && hasCover && hasTonnage && hasCapacity && hasEngineCC;
  
  let msg = '';
  if (!ok) {
    if (!hasReg) msg = 'Enter vehicle registration number';
    else if (!hasIdType) msg = 'Select identification type (Registration or Chassis)';
    else if (!hasCover) msg = 'Select cover start date';
    else if (!hasTonnage) msg = 'Select vehicle tonnage to continue';
    else if (!hasCapacity) msg = 'Enter passenger capacity to continue';
    else if (!hasEngineCC) msg = 'Enter engine capacity (cc) to continue';
  }
  
  return { canProceed: ok, validationMessage: msg };
};

/**
 * Validate Underwriter Selection step
 */
export const validateUnderwriterStep = (selectedUnderwriter) => {
  const ok = !!selectedUnderwriter;
  return {
    canProceed: ok,
    validationMessage: ok ? '' : 'Select an underwriter to continue',
  };
};

/**
 * Validate Client Details step with Kenyan-specific validation
 */
export const validateClientDetailsStep = (clientDetails) => {
  // Current Motor3 Client Details screens are source-selection placeholders.
  // Do not block the flow here; actual client validation happens at submission.
  return { canProceed: true, validationMessage: '' };
};

/**
 * Validate Document Upload step
 */
export const validateDocumentUploadStep = (uploadedDocuments) => {
  // Documents are optional for quote creation in current Motor3 flow.
  // Avoid blocking navigation because upload integration is not wired.
  return { canProceed: true, validationMessage: '' };
};

/**
 * Validate Review step
 */
export const validateReviewStep = (state) => {
  // Review step just confirms data, always can proceed
  return { canProceed: true, validationMessage: '' };
};

/**
 * Validate Payment step
 */
export const validatePaymentStep = (selectedUnderwriter) => {
  const premiumTotal = 
    selectedUnderwriter?.total_premium || 
    selectedUnderwriter?.totalPremium || 
    0;
  
  const ok = premiumTotal > 0;
  return {
    canProceed: ok,
    validationMessage: ok ? '' : 'Premium not calculated yet',
  };
};

/**
 * Validate Submission step
 */
export const validateSubmissionStep = () => {
  // Submission step always can proceed (actual submission is done via button)
  return { canProceed: true, validationMessage: '' };
};

/**
 * Main validator that routes to step-specific validation
 */
export const validateStep = (stepNumber, motor3State, thirdPartyState) => {
  switch (stepNumber) {
    case 1: // Category Selection
      return validateCategoryStep(motor3State);
    
    case 2: // Subcategory Selection
      return validateSubcategoryStep(motor3State);
    
    case 3: // Vehicle Details
      return validateVehicleDetailsStep(
        thirdPartyState.formData,
        motor3State.selectedSubcategory
      );
    
    case 4: // Underwriter Selection
      return validateUnderwriterStep(thirdPartyState.selectedUnderwriter);
    
    case 5: // Client Details
      return validateClientDetailsStep(motor3State.clientDetails);
    
    case 6: // Document Upload
      return validateDocumentUploadStep(motor3State.uploadedDocuments);
    
    case 7: // Review
      return validateReviewStep(motor3State);
    
    case 8: // Payment
      return validatePaymentStep(thirdPartyState.selectedUnderwriter);
    
    case 9: // Submission
      return validateSubmissionStep();
    
    default:
      return { canProceed: true, validationMessage: '' };
  }
};
