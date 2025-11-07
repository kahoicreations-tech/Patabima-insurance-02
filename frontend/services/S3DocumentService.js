import * as FileSystem from 'expo-file-system';
import djangoAPI from './DjangoAPIService';

/**
 * S3 Document Upload Service
 * Handles uploading documents to S3 via backend presigned URLs
 */
class S3DocumentService {
  constructor() {
    this.uploadQueue = new Map(); // Track ongoing uploads
  }

  /**
   * Upload a document to S3
   * @param {Object} file - File object with uri, name, type, size
   * @param {Object} metadata - Additional metadata (docType, quoteId, etc.)
   * @param {Function} onProgress - Progress callback (phase, percent)
   * @returns {Promise<Object>} - Upload result with S3 URL and document ID
   */
  async uploadDocument(file, metadata = {}, onProgress = null) {
    try {
      const { uri, name, type, size } = file;
      const { docType, quoteId, userId } = metadata;

      console.log('[S3DocumentService] Starting upload:', { name, type, size, docType });
      
      // Phase 1: Request presigned URL from backend
      onProgress?.('preparing', 10);

      // Try multiple candidates to match backend routing variants
      // Backend expects: filename, fileType, docType
      const presignBody = JSON.stringify({
        filename: name,
        fileType: type,
        docType: docType,
      });

      const presignCandidates = [
        '/api/v1/public_app/docs/presign',
        '/api/v1/public_app/docs/presign/',
        '/api/v1/docs/presign',
        '/api/v1/docs/presign/',
        '/api/insurance/docs/presign',
        '/api/insurance/docs/presign/',
      ];

      let presignedResponse = null;
      try {
        presignedResponse = await djangoAPI.tryEndpoints(presignCandidates, {
          method: 'POST',
          body: presignBody,
          _traceKey: 'documents_presign',
        });
      } catch (e) {
        // Fallback: older upload endpoint (non-presigned). Return meaningful error to caller.
        console.warn('[S3DocumentService] Presign endpoints unavailable:', e?.message || e);
        throw new Error('Document upload service not available (presign endpoint missing). Please contact support.');
      }

      // Accept both plain and nested response shapes
      // New docs API returns: uploadUrl, objectKey, supportsExtraction
      const uploadUrl = presignedResponse?.uploadUrl || presignedResponse?.data?.uploadUrl;
      const objectKey = presignedResponse?.objectKey || presignedResponse?.data?.objectKey;
      const supportsExtraction = (
        presignedResponse?.supportsExtraction !== undefined
          ? presignedResponse.supportsExtraction
          : presignedResponse?.data?.supportsExtraction
      );

      if (!uploadUrl || !objectKey) {
        // If server sent an error field, surface it; otherwise generic
        const errMsg = presignedResponse?.error || presignedResponse?.detail || 'Failed to get presigned URL';
        throw new Error(errMsg);
      }

      console.log('[S3DocumentService] Presigned URL obtained:', { objectKey, supportsExtraction });

      // Phase 2: Read file as base64
      onProgress?.('uploading', 20);

      // Phase 3: Upload to S3 using presigned URL
      onProgress?.('uploading', 40);

      // Use Expo FileSystem.uploadAsync to avoid base64/Blob issues in React Native
      // Upload as raw binary content with PUT
      const uploadResult = await FileSystem.uploadAsync(
        uploadUrl,
        uri,
        {
          httpMethod: 'PUT',
          headers: {
            'Content-Type': type || 'application/octet-stream',
          },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        }
      );

      const status = Number(uploadResult?.status) || 0;
      if (status < 200 || status >= 300) {
        throw new Error(`S3 upload failed: ${status}`);
      }

      console.log('[S3DocumentService] S3 upload successful');
      onProgress?.('processing', 70);

      // Phase 4: Submit extraction for extractable docs (logbook). Non-extractable returns uploaded status.
      const submitBody = JSON.stringify({ objectKey, docType });
      const submitCandidates = [
        '/api/v1/public_app/docs/submit',
        '/api/v1/public_app/docs/submit/',
        '/api/v1/docs/submit',
        '/api/v1/docs/submit/',
        '/api/insurance/docs/submit',
        '/api/insurance/docs/submit/',
      ];

      let submitResponse = null;
      try {
        submitResponse = await djangoAPI.tryEndpoints(submitCandidates, {
          method: 'POST',
          body: submitBody,
          _traceKey: 'documents_submit',
        });
      } catch (e) {
        // If submit endpoint not available, still consider upload successful for storage-only flow
        console.warn('[S3DocumentService] Submit endpoint error (continuing as upload-only):', e?.message || e);
        submitResponse = { status: 'uploaded', supportsExtraction: false };
      }

      onProgress?.('finishing', 95);

      console.log('[S3DocumentService] Upload completed successfully');

      return {
        success: true,
        document_id: submitResponse?.jobId || objectKey,
        s3_key: objectKey,
        s3_url: null, // Not provided by upload presign; can be fetched later via signed URL if needed
        file_name: name,
        file_type: type,
        file_size: size,
        doc_type: docType,
        supports_extraction: !!submitResponse?.supportsExtraction,
        status: submitResponse?.status || 'uploaded',
        job_id: submitResponse?.jobId || null,
      };
    } catch (error) {
      console.error('[S3DocumentService] Upload failed:', error);
      onProgress?.('error', 0);
      
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  /**
   * Delete a document from S3
   */
  async deleteDocument(documentId) {
    try {
      const deleteCandidates = [
        `/api/v1/public_app/documents/${documentId}/`,
        `/api/v1/public_app/documents/${documentId}`,
        `/api/v1/documents/${documentId}/`,
        `/api/v1/documents/${documentId}`,
        `/api/insurance/documents/${documentId}/`,
      ];

      const response = await djangoAPI.tryEndpoints(deleteCandidates, { method: 'DELETE', _traceKey: 'documents_delete' });

      return {
        success: response.success,
        message: response.message || 'Document deleted successfully',
      };
    } catch (error) {
      console.error('[S3DocumentService] Delete failed:', error);
      return {
        success: false,
        error: error.message || 'Delete failed',
      };
    }
  }

  /**
   * Get document metadata and signed URL for viewing
   */
  async getDocumentUrl(documentId) {
    try {
      const urlCandidates = [
        `/api/v1/public_app/documents/${documentId}/url`,
        `/api/v1/public_app/documents/${documentId}/url/`,
        `/api/v1/documents/${documentId}/url`,
        `/api/v1/documents/${documentId}/url/`,
        `/api/insurance/documents/${documentId}/url/`,
      ];

      const response = await djangoAPI.tryEndpoints(urlCandidates, { method: 'GET', _traceKey: 'documents_url' });

      if (!response || !response.success) {
        throw new Error('Failed to get document URL');
      }

      return {
        success: true,
        url: response.data.signed_url,
        expiry: response.data.expiry_time,
      };
    } catch (error) {
      console.error('[S3DocumentService] Get URL failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export default new S3DocumentService();
