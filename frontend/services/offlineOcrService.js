// Minimal offline OCR stub to unblock bundling
// TODO: Integrate real OCR pipeline if required

export async function processDocumentOffline(imageData, docType) {
  return {
    success: false,
    error: 'Offline OCR is not available. Please upload the document for server-side processing.',
    data: null,
  };
}

export function validateOfflineData(extractedData, formData, docType) {
  return [
    {
      field: 'document',
      message: 'Offline OCR validation is not available. Use server-side document processing.',
    },
  ];
}
