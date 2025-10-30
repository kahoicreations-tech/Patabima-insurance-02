import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Alert as RNAlert } from 'react-native';
import HybridDocumentService from '../../../../../services/HybridDocumentService';
import { detectDocumentType, validateDocumentType, getDocumentTypeName } from '../../../../../utils/documentTypeDetector';

/**
 * DocumentsUpload Component
 * Handles document collection and upload for motor insurance
 * Step 4 in the motor insurance flow (between Pricing & Coverage)
 */
export default function DocumentsUpload({ 
  onDocumentsChange, 
  initialDocuments = {}, 
  vehicleData = {},
  selectedProduct = {},
  onExtractedData // New prop to pass extracted data to parent/sibling screens
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState({});
  const [uploadProgress, setUploadProgress] = useState({}); // { [key]: { percent: number, phase: string } }
  const progressTimers = useRef({});

  const startProgress = (key, initial = 5, phase = 'preparing') => {
    setUploadProgress(prev => ({ ...prev, [key]: { percent: initial, phase } }));
    // Smoothly increment up to 90% while processing
    if (progressTimers.current[key]) clearInterval(progressTimers.current[key]);
    progressTimers.current[key] = setInterval(() => {
      setUploadProgress(prev => {
        const cur = prev[key] || { percent: 0, phase: phase };
        const nextVal = Math.min(90, (cur.percent || 0) + Math.random() * 6 + 2);
        return { ...prev, [key]: { ...cur, percent: nextVal } };
      });
    }, 500);
  };

  const setPhase = (key, phase, minPercent) => {
    setUploadProgress(prev => {
      const cur = prev[key] || { percent: 0, phase };
      const pct = Math.max(cur.percent || 0, minPercent || 0);
      return { ...prev, [key]: { percent: pct, phase } };
    });
  };

  const stopProgress = (key, finalPercent = 100) => {
    if (progressTimers.current[key]) {
      clearInterval(progressTimers.current[key]);
      delete progressTimers.current[key];
    }
    setUploadProgress(prev => ({ ...prev, [key]: { ...(prev[key] || {}), percent: finalPercent, phase: 'done' } }));
    // Optionally clear after a short delay
    setTimeout(() => {
      setUploadProgress(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }, 1200);
  };

  // Required documents based on product type and coverage
  const getRequiredDocuments = () => {
    const baseDocuments = [
      {
        key: 'logbook',
        title: 'Vehicle Logbook',
        description: 'Original vehicle registration certificate',
        required: true,
        type: 'document'
      },
      {
        key: 'id_copy',
        title: 'ID Copy',
        description: 'National ID or Passport copy',
        required: true,
        type: 'document'
      },
      {
        key: 'kra_pin',
        title: 'KRA PIN Certificate',
        description: 'Kenya Revenue Authority PIN certificate',
        // Per product guidance: de-emphasize KRA PIN in extraction priority; keep optional here
        required: false,
        type: 'document'
      }
    ];

    // Add additional documents based on coverage type
    const coverage = selectedProduct?.coverage_type?.toLowerCase();
    if (coverage === 'comprehensive') {
      baseDocuments.push({
        key: 'valuation',
        title: 'Vehicle Valuation Report',
        description: 'Professional vehicle valuation (if sum insured > 1M)',
        required: false,
        type: 'document'
      });
    }

    // Add commercial-specific documents
    const category = selectedProduct?.category?.toLowerCase();
    if (category === 'commercial') {
      baseDocuments.push({
        key: 'business_permit',
        title: 'Business Permit',
        description: 'Valid business permit or license',
        required: true,
        type: 'document'
      });
    }

    return baseDocuments;
  };

  const handleDocumentPick = async (documentKey) => {
    try {
  setUploading(prev => ({ ...prev, [documentKey]: true }));
  startProgress(documentKey, 5, 'preparing');

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const document = result.assets[0];
        const newDocuments = {
          ...documents,
          [documentKey]: {
            name: document.name,
            uri: document.uri,
            type: document.mimeType,
            size: document.size,
            uploadedAt: new Date().toISOString()
          }
        };
        
        setDocuments(newDocuments);
        onDocumentsChange?.(newDocuments);

        // SKIP TEXTRACT PROCESSING FOR NOW - Just mark as uploaded
        console.log('📄 Document uploaded (Textract skipped):', documentKey);
        stopProgress(documentKey, 100);
        setUploading(prev => ({ ...prev, [documentKey]: false }));
        
        RNAlert.alert(
          'Document Uploaded',
          'Document uploaded successfully. You can manually enter details in the next steps.',
          [{ text: 'OK' }]
        );
        return;

        // ORIGINAL CODE (commented out for now):
        /*
        try {
          const docType = mapDocType(documentKey);
          const response = await HybridDocumentService.processDocument(
            { name: document.name, uri: document.uri, type: document.mimeType, size: document.size },
            { 
              docType, 
              quoteId: vehicleData?.quotationId || selectedProduct?.quotationId,
              onProgress: (phase, percent) => {
                setPhase(documentKey, phase, percent || 0);
                // if no timer yet, start one to animate smoothly between updates
                if (!progressTimers.current[documentKey]) startProgress(documentKey, percent || 0, phase);
              }
            }
          );
          if (response?.success) {
            setPhase(documentKey, 'finishing', 95);
            // Persist the result to quotation form on backend (apply endpoint is invoked inside service if quoteId present)
            const result = response.result;
            
            // ===== DOCUMENT TYPE VALIDATION =====
            const expectedType = mapDocType(documentKey);
            
            // Enhanced detection: check backend response first, then field-based detection
            let detectedType = 'unknown';
            
            // 1. Check if backend explicitly provided document type
            if (result.documentType || result.document_type || result.docType) {
              const backendType = (result.documentType || result.document_type || result.docType).toLowerCase();
              console.log('📋 Backend identified document type:', backendType);
              detectedType = backendType.replace(/_/g, '').replace(/-/g, '');
              
              // Normalize backend type to our expected types
              if (detectedType.includes('kra') || detectedType.includes('pin')) {
                detectedType = 'kra_pin';
              } else if (detectedType.includes('logbook') || detectedType.includes('vehicle')) {
                detectedType = 'logbook';
              } else if (detectedType.includes('national') || detectedType.includes('id')) {
                detectedType = 'national_id';
              } else if (detectedType.includes('valuation')) {
                detectedType = 'valuation_report';
              } else if (detectedType.includes('permit') || detectedType.includes('business')) {
                detectedType = 'business_permit';
              }
            }
            
            // 2. If backend didn't provide type, use field-based detection
            if (detectedType === 'unknown') {
              detectedType = detectDocumentType(result);
            }
            
            const validation = validateDocumentType(expectedType, detectedType);
            
            // Debug logging - Full extraction details
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔍 DOCUMENT VALIDATION RESULTS');
            console.log('═══════════════════════════════════════════════════════');
            console.log('📁 Document Key:', documentKey);
            console.log('🎯 Expected Type:', expectedType, '→', getDocumentTypeName(expectedType));
            console.log('🔎 Detected Type:', detectedType, '→', getDocumentTypeName(detectedType));
            console.log('✅ Validation Status:', validation.valid ? '✅ VERIFIED' : validation.warning ? '⚠️ WARNING' : '❌ MISMATCH');
            console.log('💬 Message:', validation.message);
            console.log('───────────────────────────────────────────────────────');
            console.log('📊 EXTRACTED FIELDS:');
            if (result?.fields && Object.keys(result.fields).length > 0) {
              Object.entries(result.fields).forEach(([key, value]) => {
                console.log(`  • ${key}:`, value);
              });
            } else {
              console.log('  (No canonical fields extracted)');
            }
            console.log('───────────────────────────────────────────────────────');
            console.log('📋 RAW FIELDS:');
            if (result?.rawFields && Object.keys(result.rawFields).length > 0) {
              Object.entries(result.rawFields).forEach(([key, value]) => {
                console.log(`  • ${key}:`, value);
              });
            } else {
              console.log('  (No raw fields available)');
            }
            console.log('───────────────────────────────────────────────────────');
            console.log('🔧 DIAGNOSTICS:');
            if (result?.diagnostics) {
              console.log('  Backend guessed type:', result.diagnostics.guessedType || 'N/A');
              console.log('  Type match:', result.diagnostics.typeMatch);
              console.log('  Clarity:', result.diagnostics.clarity);
              console.log('  Avg confidence:', result.diagnostics.avgWordConfidence);
            } else {
              console.log('  (No diagnostics available)');
            }
            console.log('───────────────────────────────────────────────────────');
            console.log('📦 BACKEND TYPE INFO:');
            console.log('  documentType:', result.documentType);
            console.log('  document_type:', result.document_type);
            console.log('  docType:', result.docType);
            console.log('═══════════════════════════════════════════════════════');
            
            // Store validation state with document
            const validationStatus = validation.valid ? 'verified' : (validation.warning ? 'warning' : 'mismatch');
            
            const next = {
              ...newDocuments,
              [documentKey]: {
                ...newDocuments[documentKey],
                jobId: response.jobId,
                status: 'processed',
                result: result || null,
                detectedType,
                validationStatus,
                validationMessage: validation.message
              }
            };
            setDocuments(next);
            onDocumentsChange?.(next);
            
            // Pass extracted canonical fields to parent for auto-fill
            const canonicalFields = result?.fields || {};
            if (Object.keys(canonicalFields).length > 0 && onExtractedData) {
              onExtractedData(documentKey, canonicalFields);
            }
            
            // Show validation alert with extracted fields
            try {
              const fields = result?.fields || {};
              const pairs = Object.entries(fields)
                .slice(0, 6)
                .map(([k, v]) => `${k}: ${String(v)}`);
              
              if (!validation.valid) {
                // Document mismatch or unknown - show warning
                if (validation.warning) {
                  // Unknown type - soft warning, allow continuation
                  RNAlert.alert(
                    '⚠️ Document Type Unknown',
                    validation.message + '\n\n' + (pairs.length > 0 ? 'Extracted fields:\n' + pairs.join('\n') : ''),
                    [
                      { text: 'Re-upload', onPress: () => handleRemoveDocument(documentKey), style: 'cancel' },
                      { text: 'Continue Anyway', style: 'default' }
                    ]
                  );
                } else {
                  // Type mismatch - HARD REJECTION, auto-remove
                  RNAlert.alert(
                    '❌ Wrong Document Uploaded',
                    validation.message + '\n\nThe document will be automatically removed. Please upload the correct document.',
                    [
                      { 
                        text: 'OK', 
                        onPress: () => handleRemoveDocument(documentKey), 
                        style: 'default' 
                      }
                    ],
                    { cancelable: false }
                  );
                  // Auto-remove after a short delay to allow user to see the message
                  setTimeout(() => handleRemoveDocument(documentKey), 2000);
                }
              } else {
                // Valid document - show success with fields
                const message = pairs.length > 0 
                  ? `✓ ${validation.message}\n\nExtracted:\n${pairs.join('\n')}\n\nData will auto-fill in client details.`
                  : `✓ ${validation.message}\n\nExtraction completed.`;
                RNAlert.alert('Document Verified', message);
              }
            } catch {}
            stopProgress(documentKey, 100);
          } else if (response?.disabled) {
            // Feature flag disabled; keep local state only
            stopProgress(documentKey, 0);
          } else {
            // Extraction failed or timed out - allow manual entry
            const errorMsg = response?.error || 'Failed to process document';
            RNAlert.alert(
              'Extraction Failed', 
              `${errorMsg}\n\nDocument uploaded successfully. You can manually enter the details in the next step.`,
              [{ text: 'OK' }]
            );
            stopProgress(documentKey, 0);
          }
        } catch (procErr) {
          console.log('Document processing failed:', procErr);
          // Document uploaded but extraction failed - allow manual entry
          RNAlert.alert(
            'Extraction Error',
            'Document uploaded but extraction failed. You can manually enter the details in the next step.',
            [{ text: 'OK' }]
          );
          stopProgress(documentKey, 0);
        }
        */ // END OF COMMENTED TEXTRACT CODE
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    } finally {
  setUploading(prev => ({ ...prev, [documentKey]: false }));
    }
  };

  const mapDocType = (key) => {
    switch (key) {
      case 'logbook': return 'logbook';
      case 'id_copy': return 'national_id';
      case 'kra_pin': return 'kra_pin';
      case 'valuation': return 'valuation_report';
      case 'business_permit': return 'business_permit';
      default: return 'generic';
    }
  };

  const handleRemoveDocument = (documentKey) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newDocuments = { ...documents };
            delete newDocuments[documentKey];
            setDocuments(newDocuments);
            onDocumentsChange?.(newDocuments);
          }
        }
      ]
    );
  };

  const renderDocumentItem = (doc) => {
    const isUploaded = documents[doc.key];
    const isUploading = uploading[doc.key];
    const progress = uploadProgress[doc.key];

    return (
      <View key={doc.key} style={styles.documentItem}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>
              {doc.title}
              {doc.required && <Text style={styles.required}> *</Text>}
            </Text>
            <Text style={styles.documentDescription}>{doc.description}</Text>
          </View>
          <View style={[
            styles.statusIndicator,
            isUploaded ? styles.statusUploaded : styles.statusPending
          ]}>
            <Text style={[
              styles.statusText,
              isUploaded ? styles.statusTextUploaded : styles.statusTextPending
            ]}>
              {isUploaded ? 'Uploaded' : 'Required'}
            </Text>
          </View>
        </View>

        {isUploading && progress ? (
          <View style={styles.progressWrap}>
            <Text style={styles.progressPhase}>{progress.phase === 'preparing' ? 'Preparing…' : progress.phase === 'uploading' ? 'Uploading…' : progress.phase === 'processing' ? 'Processing…' : 'Finishing…'}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressThumb, { width: `${Math.max(5, Math.min(100, Math.round(progress.percent)))}%` }]} />
            </View>
          </View>
        ) : isUploaded ? (
          <View style={styles.uploadedDocument}>
            <View style={styles.documentDetails}>
              <Text style={styles.fileName}>{isUploaded.name}</Text>
              <Text style={styles.fileInfo}>
                {isUploaded.size ? `${Math.round(isUploaded.size / 1024)}KB` : ''} • 
                {new Date(isUploaded.uploadedAt).toLocaleString()}
              </Text>
              
              {/* NEW: Validation Status Badge */}
              {isUploaded.validationStatus && (
                <View style={[
                  styles.validationBadge,
                  isUploaded.validationStatus === 'verified' && styles.validationVerified,
                  isUploaded.validationStatus === 'warning' && styles.validationWarning,
                  isUploaded.validationStatus === 'mismatch' && styles.validationMismatch
                ]}>
                  <Text style={styles.validationIcon}>
                    {isUploaded.validationStatus === 'verified' ? '✓' : 
                     isUploaded.validationStatus === 'warning' ? '⚠' : '❌'}
                  </Text>
                  <Text style={styles.validationText}>
                    {isUploaded.validationStatus === 'verified' ? 'Document Verified' :
                     isUploaded.validationStatus === 'warning' ? 'Type Unknown' :
                     'Type Mismatch'}
                  </Text>
                  {isUploaded.detectedType && (
                    <Text style={styles.validationDetail}>
                      Detected: {getDocumentTypeName(isUploaded.detectedType)}
                    </Text>
                  )}
                </View>
              )}
              
              {isUploaded?.result?.diagnostics && (
                <View style={[styles.notice, (!isUploaded.result.diagnostics.typeMatch || isUploaded.result.diagnostics.clarity === 'poor') ? styles.noticeWarn : styles.noticeOk]}>
                  <Text style={styles.noticeTitle}>Document check</Text>
                  {!!isUploaded.result.diagnostics.expectedType && (
                    <Text style={styles.noticeText}>Expected: {isUploaded.result.diagnostics.expectedType} • Detected: {isUploaded.result.diagnostics.guessedType || 'unknown'}</Text>
                  )}
                  <Text style={styles.noticeText}>Clarity: {isUploaded.result.diagnostics.clarity}{isUploaded.result.diagnostics.avgWordConfidence ? ` (${isUploaded.result.diagnostics.avgWordConfidence}%)` : ''}</Text>
                  {(!isUploaded.result.diagnostics.typeMatch || isUploaded.result.diagnostics.clarity === 'poor') && (
                    <Text style={styles.noticeHint}>Please recheck: upload a clear {doc.title} image or PDF matching the required document.</Text>
                  )}
                </View>
              )}
              {isUploaded?.result?.fields && (
                <View style={styles.extractedBox}>
                  <Text style={styles.extractedTitle}>Extracted fields</Text>
                  {Object.entries(isUploaded.result.fields).slice(0,8).map(([k,v]) => (
                    <Text key={k} style={styles.extractedItem}>{k} ; {String(v)}</Text>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemoveDocument(doc.key)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadOptions}>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => handleDocumentPick(doc.key)}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Choose Document</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const requiredDocuments = getRequiredDocuments();
  const totalRequired = requiredDocuments.filter(doc => doc.required).length;
  const uploadedRequired = requiredDocuments.filter(doc => doc.required && documents[doc.key]).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {uploadedRequired} of {totalRequired} documents uploaded
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(uploadedRequired / totalRequired) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.helperNote}>
            Upload required documents. If auto-extraction fails, you can manually enter details.{'\n'}
            Required: Logbook and National ID. KRA PIN is optional.
          </Text>
        </View>
      </View>

      <View style={styles.documentsContainer}>
        {requiredDocuments.map(renderDocumentItem)}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          • All documents should be clear and readable{'\n'}
          • Accepted formats: PDF, JPEG, PNG{'\n'}
          • Maximum file size: 5MB per document{'\n'}
          • If extraction times out or fails, manually enter details in the next step
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  helperNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#6c757d',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#646767',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D5222B',
    borderRadius: 2,
  },
  documentsContainer: {
    padding: 20,
  },
  documentItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
    marginRight: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  required: {
    color: '#D5222B',
  },
  documentDescription: {
    fontSize: 13,
    color: '#646767',
    lineHeight: 18,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusUploaded: {
    backgroundColor: '#d4edda',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextUploaded: {
    color: '#155724',
  },
  statusTextPending: {
    color: '#856404',
  },
  uploadedDocument: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  documentDetails: {
    flex: 1,
  },
  extractedBox: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 10,
  },
  notice: {
    marginTop: 10,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
  },
  noticeOk: {
    backgroundColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  noticeWarn: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: '#333',
  },
  noticeHint: {
    fontSize: 12,
    color: '#8c6d1f',
    marginTop: 4,
  },
  extractedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  extractedItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  fileInfo: {
    fontSize: 12,
    color: '#646767',
  },
  validationBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  validationVerified: {
    backgroundColor: '#f6ffed',
    borderColor: '#52c41a',
  },
  validationWarning: {
    backgroundColor: '#fffbe6',
    borderColor: '#faad14',
  },
  validationMismatch: {
    backgroundColor: '#fff2f0',
    borderColor: '#ff4d4f',
  },
  validationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  validationDetail: {
    fontSize: 11,
    color: '#646767',
    fontStyle: 'italic',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#dc3545',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadOptions: {
    alignItems: 'stretch',
  },
  progressWrap: {
    marginTop: 6,
  },
  progressPhase: {
    fontSize: 12,
    color: '#646767',
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressThumb: {
    height: '100%',
    backgroundColor: '#D5222B',
  },
  uploadButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#D5222B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerNote: {
    fontSize: 12,
    color: '#646767',
    lineHeight: 18,
  },
});