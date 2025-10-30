// Minimal offline OCR stub to unblock bundling
// TODO: Integrate real OCR pipeline if required

export async function processDocumentOffline(imageData, docType) {
  // Simulate processing and return mocked fields based on docType
  return {
    success: true,
    data: {
      docType,
      extractedText: '[stubbed OCR result]',
    },
  };
}

export function validateOfflineData(extractedData, formData, docType) {
  // Return empty mismatches for now
  return [];
}
