import React, { useCallback } from 'react';
import DocumentsUpload from '../DocumentsUpload/DocumentsUpload';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';

export default function DocumentsStep({ onExtractedData }) {
  const { state, actions } = useMotorInsurance();
  const selectedProduct = state?.selectedSubcategory || state?.productType || {};
  const vehicleData = state?.vehicleDetails || {};
  const uploadedDocuments = state?.uploadedDocuments || {};

  // Handle document uploads - save to context
  const handleDocumentsChange = useCallback((documents) => {
    console.log('[DocumentsStep] Documents updated:', Object.keys(documents));
    actions.updateUploadedDocuments(documents);
  }, [actions]);

  return (
    <DocumentsUpload 
      selectedProduct={selectedProduct}
      vehicleData={vehicleData}
      initialDocuments={uploadedDocuments}
      onDocumentsChange={handleDocumentsChange}
      onExtractedData={onExtractedData}
    />
  );
}
