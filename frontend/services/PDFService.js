// Minimal PDF service stub to unblock bundling
// TODO: Replace with real PDF generation/sharing implementation

export const PDFService = {
  async sharePDF(data) {
    try {
      console.log('[PDFService] sharePDF called with:', Object.keys(data || {}));
      // Implement using expo-print or expo-sharing if needed later
      return true;
    } catch (e) {
      console.warn('[PDFService] sharePDF failed', e);
      return false;
    }
  },
};
