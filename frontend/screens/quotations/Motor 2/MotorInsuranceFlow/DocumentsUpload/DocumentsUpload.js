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
import S3DocumentService from '../../../../../services/S3DocumentService';

/**
 * DocumentsUpload Component
 * Handles document collection and upload for motor insurance using S3
 * Step 5 in the motor insurance flow (Documents step)
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
    // All document types available for upload
    // Only logbook will be auto-extracted with Textract
    return [
      {
        key: 'logbook',
        title: 'Vehicle Logbook',
        description: 'Original vehicle registration certificate (Auto-extraction enabled)',
        required: true,
        type: 'document'
      },
      {
        key: 'id_copy',
        title: 'National ID',
        description: 'National ID card (front and back)',
        required: true,
        type: 'document'
      },
      {
        key: 'kra_pin',
        title: 'KRA PIN Certificate',
        description: 'KRA PIN certificate document',
        required: true,
        type: 'document'
      }
    ];
  };

  const handleDocumentPick = async (documentKey) => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📤 DOCUMENT UPLOAD INITIATED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Document Key:', documentKey);
    console.log('Expected Type:', mapDocType(documentKey));
    console.log('───────────────────────────────────────────────────────');
    
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

        // ✅ Upload to S3
        try {
          const docType = mapDocType(documentKey);
          
          console.log(`📤 Uploading ${documentKey} to S3...`);
          
          const uploadResult = await S3DocumentService.uploadDocument(
            { 
              name: document.name, 
              uri: document.uri, 
              type: document.mimeType, 
              size: document.size 
            },
            { 
              docType, 
              quoteId: vehicleData?.quotationId || selectedProduct?.quotationId,
            },
            (phase, percent) => {
              setPhase(documentKey, phase, percent || 0);
              if (!progressTimers.current[documentKey]) {
                startProgress(documentKey, percent || 0, phase);
              }
            }
          );

          if (uploadResult.success) {
            console.log(`✅ ${documentKey} uploaded successfully to S3`);
            
            // Update document state with S3 info
            const updatedDocuments = {
              ...newDocuments,
              [documentKey]: {
                ...newDocuments[documentKey],
                s3_key: uploadResult.s3_key,
                s3_url: uploadResult.s3_url,
                document_id: uploadResult.document_id,
                status: 'uploaded',
                uploadedAt: new Date().toISOString(),
              }
            };
            
            setDocuments(updatedDocuments);
            onDocumentsChange?.(updatedDocuments);
            
            Alert.alert(
              '✅ Upload Successful',
              `${document.name} has been uploaded to secure storage.\n\nDocument ID: ${uploadResult.document_id}`,
              [{ text: 'OK' }]
            );
            
            stopProgress(documentKey, 100);
          } else {
            throw new Error(uploadResult.error || 'Upload failed');
          }
        } catch (uploadError) {
          console.error('❌ S3 upload failed:', uploadError);
          
          Alert.alert(
            'Upload Error',
            `Failed to upload ${document.name}.\n\nError: ${uploadError.message}\n\nThe document has been saved locally. You can try again later.`,
            [{ text: 'OK' }]
          );
          
          stopProgress(documentKey, 0);
        }
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
            Upload all required documents. Only the Vehicle Logbook will be auto-extracted. Other documents are stored for verification purposes.
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