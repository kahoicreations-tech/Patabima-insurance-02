import React from 'react';
import DocumentsUpload from '../DocumentsUpload/DocumentsUpload';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';

export default function DocumentsStep({ onExtractedData }) {
  const { state } = useMotorInsurance();
  const selectedProduct = state?.selectedSubcategory || state?.productType || {};
  const vehicleData = state?.vehicleDetails || {};

  return (
    <DocumentsUpload 
      selectedProduct={selectedProduct}
      vehicleData={vehicleData}
      onExtractedData={onExtractedData}
    />
  );
}
