import React from 'react';
import PolicySubmission from '../Submission/PolicySubmission';
import { useMotorInsurance } from '../../../../../contexts/MotorInsuranceContext';

export default function SubmissionStep() {
  const { state } = useMotorInsurance();
  
  // Compose all data from context to pass to PolicySubmission
  const policyData = {
    clientDetails: state.clientDetails || {},
    vehicleDetails: state.vehicleDetails || {},
    productDetails: {
      category: state.selectedCategory?.category_code || state.selectedCategory?.name || '',
      subcategory: state.selectedSubcategory?.subcategory_code || state.selectedSubcategory?.code || '',
      coverageType: state.selectedSubcategory?.coverage_type || state.selectedSubcategory?.type || '',
    },
    underwriterDetails: state.selectedUnderwriter || {},
    premiumBreakdown: {
      totalAmount: state.selectedUnderwriter?.total_premium || state.calculatedPremium || 0,
      basePremium: state.selectedUnderwriter?.breakdown?.base_premium || state.selectedUnderwriter?.base_premium || 0,
      trainingLevy: state.selectedUnderwriter?.breakdown?.training_levy || state.selectedUnderwriter?.breakdown?.itl || 0,
      pcfLevy: state.selectedUnderwriter?.breakdown?.pcf_levy || state.selectedUnderwriter?.breakdown?.pcf || 0,
      stampDuty: state.selectedUnderwriter?.breakdown?.stamp_duty || 40,
    },
    paymentDetails: state.paymentDetails || {},
    documents: state.uploadedDocuments || [],
  };
  
  return <PolicySubmission policyData={policyData} />;
}

