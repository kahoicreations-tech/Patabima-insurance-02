/**
 * TOR Document Upload Component
 * 
 * Specialized document upload component for TOR (Third Party Only Risk) insurance
 * Handles document validation, OCR processing, and upload management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Image,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants';
// Legacy shared/data removed; using minimal placeholders
const TOR_REQUIRED_DOCUMENTS = [];
const TOR_DOCUMENT_STATUS = {};
const TOR_VALIDATION_MESSAGES = {};

const TORDocumentUpload = ({ 
  documents = [], 
  updateDocuments, 
  errors,
  formData = {},
  onDocumentProcessed
}) => {
  const [showDocumentTypeModal, setShowDocumentTypeModal] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState({});
  const [processingDocuments, setProcessingDocuments] = useState({});

  // Calculate upload progress
  const getUploadProgress = () => {
    const requiredDocs = TOR_REQUIRED_DOCUMENTS.filter(doc => doc.required);
    const uploadedRequired = requiredDocs.filter(req => 
      documents.some(doc => doc.type === req.id && doc.status === TOR_DOCUMENT_STATUS.COMPLETED)
    );
    
    return {
      uploaded: uploadedRequired.length,
      total: requiredDocs.length,
      percentage: (uploadedRequired.length / requiredDocs.length) * 100,
      isComplete: uploadedRequired.length === requiredDocs.length
    };
  };

  const progress = getUploadProgress();

  // Validate document based on TOR requirements
  const validateDocument = (docType, extractedData) => {
    const docConfig = TOR_REQUIRED_DOCUMENTS.find(doc => doc.id === docType.id);
    if (!docConfig || !docConfig.validationRules) return { isValid: true, errors: [] };

    const errors = [];
    const rules = docConfig.validationRules;

    // Check pattern validations
    Object.keys(rules).forEach(field => {
      if (field === 'mustMatch') return; // Handle separately
      
      const rule = rules[field];
      const value = extractedData[field];

      if (rule instanceof RegExp && value && !rule.test(value)) {
        errors.push(`Invalid ${field} format in document`);
      } else if (rule === 'future' && value) {
        const date = new Date(value);
        if (date <= new Date()) {
          errors.push(`${field} must be a future date`);
        }
      } else if (rule === 'recent' && value) {
        const date = new Date(value);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (date < sixMonthsAgo) {
          errors.push(`${field} must be from within the last 6 months`);
        }
      }
    });

    // Check mustMatch rules against form data
    if (rules.mustMatch) {
      rules.mustMatch.forEach(formField => {
        const docValue = extractedData[Object.keys(extractedData)[0]];
        const formValue = formData[formField];
        if (docValue && formValue && docValue !== formValue) {
          errors.push(`Document data does not match form ${formField}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Process document with OCR
  const processDocumentWithOCR = async (imageUri, docType) => {
    setProcessingDocuments(prev => ({ ...prev, [docType.id]: true }));

    try {
      // Simulate OCR processing (replace with actual OCR service)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
      
      // Mock OCR results based on document type
      let mockExtractedData = {};
      
      switch (docType.id) {
        case 'national_id':
          mockExtractedData = {
            fullName: formData.ownerName || 'JOHN KAMAU MWANGI',
            idNumber: formData.ownerIdNumber || '12345678',
            dateOfBirth: '1985-06-15'
          };
          break;
        case 'driving_license':
          mockExtractedData = {
            fullName: formData.ownerName || 'JOHN KAMAU MWANGI',
            licenseNumber: 'DL12345ABC',
            expiryDate: '2026-12-31'
          };
          break;
        case 'logbook':
          mockExtractedData = {
            registrationNumber: formData.vehicleRegistrationNumber || 'KCA123A',
            makeModel: formData.makeModel || 'TOYOTA COROLLA',
            yearOfManufacture: formData.yearOfManufacture || '2020',
            engineCapacity: formData.vehicleEngineCapacity || '1500',
            chassisNumber: 'JT123456789'
          };
          break;
        case 'kra_pin':
          mockExtractedData = {
            fullName: formData.ownerName || 'JOHN KAMAU MWANGI',
            pinNumber: 'A123456789K'
          };
          break;
      }

      // Validate extracted data
      const validation = validateDocument(docType, mockExtractedData);
      
      return {
        success: true,
        data: mockExtractedData,
        confidence: 0.85 + Math.random() * 0.15, // 85-100%
        validation
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    } finally {
      setProcessingDocuments(prev => {
        const updated = { ...prev };
        delete updated[docType.id];
        return updated;
      });
    }
  };

  // Handle document upload
  const uploadDocument = async (docType, method = 'camera') => {
    try {
      setUploadingDocuments(prev => ({ ...prev, [docType.id]: true }));

      let result;
      
      if (method === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to capture documents.');
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: false
        });
      } else if (method === 'gallery') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: false
        });
      } else if (method === 'file') {
        result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true
        });
      }

      if (!result.canceled && (result.assets?.[0] || result.uri)) {
        const asset = result.assets?.[0] || result;
        
        // Validate file size
        const maxSize = parseFloat(docType.maxSize) * 1024 * 1024; // Convert MB to bytes
        if (asset.size && asset.size > maxSize) {
          Alert.alert('File Too Large', `File size must be less than ${docType.maxSize}`);
          return;
        }

        // Create document object
        const newDocument = {
          id: `${docType.id}_${Date.now()}`,
          type: docType.id,
          name: docType.name,
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.size || 0,
          status: TOR_DOCUMENT_STATUS.PROCESSING,
          uploadedAt: new Date().toISOString(),
          extractedData: null,
          validation: null
        };

        // Add document to list
        const updatedDocuments = [...documents.filter(doc => doc.type !== docType.id), newDocument];
        updateDocuments(updatedDocuments);

        // Process with OCR if it's an image and scannable
        if (docType.scannable && asset.mimeType?.startsWith('image/')) {
          const ocrResult = await processDocumentWithOCR(asset.uri, docType);
          
          if (ocrResult.success) {
            newDocument.extractedData = ocrResult.data;
            newDocument.validation = ocrResult.validation;
            newDocument.confidence = ocrResult.confidence;
            newDocument.status = ocrResult.validation.isValid ? 
              TOR_DOCUMENT_STATUS.COMPLETED : 
              TOR_DOCUMENT_STATUS.VALIDATION_ERROR;

            // Notify parent component
            if (onDocumentProcessed) {
              onDocumentProcessed(docType.id, ocrResult.data);
            }

            if (!ocrResult.validation.isValid) {
              Alert.alert(
                'Validation Issues',
                `Document uploaded but has validation issues:\n\n${ocrResult.validation.errors.join('\n')}`,
                [
                  { text: 'Fix Later', style: 'cancel' },
                  { text: 'Re-upload', onPress: () => uploadDocument(docType, method) }
                ]
              );
            } else {
              Alert.alert(
                'Success! 🎉',
                `${docType.name} uploaded and processed successfully.\nConfidence: ${Math.round(ocrResult.confidence * 100)}%`
              );
            }
          } else {
            newDocument.status = TOR_DOCUMENT_STATUS.COMPLETED;
            Alert.alert(
              'Uploaded Successfully',
              `${docType.name} uploaded. OCR processing failed, but document is saved for manual review.`
            );
          }
        } else {
          newDocument.status = TOR_DOCUMENT_STATUS.COMPLETED;
          Alert.alert('Success', `${docType.name} uploaded successfully.`);
        }

        // Update final document state
        const finalDocuments = [...documents.filter(doc => doc.type !== docType.id), newDocument];
        updateDocuments(finalDocuments);
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Upload Failed', `Failed to upload ${docType.name}. Please try again.`);
    } finally {
      setUploadingDocuments(prev => {
        const updated = { ...prev };
        delete updated[docType.id];
        return updated;
      });
      setShowDocumentTypeModal(false);
    }
  };

  // Show upload options
  const showUploadOptions = (docType) => {
    Alert.alert(
      `Upload ${docType.name}`,
      'How would you like to upload this document?',
      [
        {
          text: 'Take Photo',
          onPress: () => uploadDocument(docType, 'camera')
        },
        {
          text: 'Choose from Gallery',
          onPress: () => uploadDocument(docType, 'gallery')
        },
        {
          text: 'Select File',
          onPress: () => uploadDocument(docType, 'file')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Remove document
  const removeDocument = (docId) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedDocuments = documents.filter(doc => doc.id !== docId);
            updateDocuments(updatedDocuments);
          }
        }
      ]
    );
  };

  // Get document status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case TOR_DOCUMENT_STATUS.UPLOADING:
        return <ActivityIndicator size="small" color={Colors.primary} />;
      case TOR_DOCUMENT_STATUS.PROCESSING:
        return <ActivityIndicator size="small" color={Colors.warning} />;
      case TOR_DOCUMENT_STATUS.COMPLETED:
        return <Ionicons name="checkmark-circle" size={20} color={Colors.success} />;
      case TOR_DOCUMENT_STATUS.FAILED:
        return <Ionicons name="close-circle" size={20} color={Colors.error} />;
      case TOR_DOCUMENT_STATUS.VALIDATION_ERROR:
        return <Ionicons name="warning" size={20} color={Colors.warning} />;
      default:
        return <Ionicons name="document" size={20} color={Colors.gray} />;
    }
  };

  // Render document item
  const renderDocumentItem = (docType) => {
    const uploadedDoc = documents.find(doc => doc.type === docType.id);
    const isUploading = uploadingDocuments[docType.id];
    const isProcessing = processingDocuments[docType.id];

    return (
      <View key={docType.id} style={styles.documentItem}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentIcon}>{docType.icon}</Text>
            <View style={styles.documentDetails}>
              <Text style={styles.documentName}>{docType.name}</Text>
              <Text style={styles.documentDescription}>{docType.description}</Text>
              <Text style={styles.documentMeta}>
                Max: {docType.maxSize} • Formats: {docType.formats.join(', ').toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.documentActions}>
            {uploadedDoc ? getStatusIcon(uploadedDoc.status) : null}
            {docType.required && (
              <Text style={styles.requiredBadge}>Required</Text>
            )}
          </View>
        </View>

        {uploadedDoc && uploadedDoc.validation && !uploadedDoc.validation.isValid && (
          <View style={styles.validationErrors}>
            <Text style={styles.validationTitle}>⚠️ Validation Issues:</Text>
            {uploadedDoc.validation.errors.map((error, index) => (
              <Text key={index} style={styles.validationError}>• {error}</Text>
            ))}
          </View>
        )}

        <View style={styles.documentButtonContainer}>
          {uploadedDoc ? (
            <View style={styles.uploadedActions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => Alert.alert('View Document', 'Document viewer would open here')}
              >
                <Ionicons name="eye" size={16} color={Colors.primary} />
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.replaceButton}
                onPress={() => showUploadOptions(docType)}
                disabled={isUploading || isProcessing}
              >
                <Ionicons name="refresh" size={16} color={Colors.warning} />
                <Text style={styles.replaceButtonText}>Replace</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeDocument(uploadedDoc.id)}
                disabled={isUploading || isProcessing}
              >
                <Ionicons name="trash" size={16} color={Colors.error} />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.uploadButton,
                isUploading && styles.uploadingButton
              ]}
              onPress={() => showUploadOptions(docType)}
              disabled={isUploading || isProcessing}
            >
              {isUploading || isProcessing ? (
                <>
                  <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 8 }} />
                  <Text style={styles.uploadButtonText}>
                    {isUploading ? 'Uploading...' : 'Processing...'}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={16} color={Colors.white} />
                  <Text style={styles.uploadButtonText}>Upload {docType.name}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TOR Insurance Documents</Text>
      <Text style={styles.subtitle}>
        Upload required documents for your TOR (Third Party Only Risk) insurance application
      </Text>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Upload Progress</Text>
          <Text style={[
            styles.progressText,
            progress.isComplete ? { color: Colors.success } : { color: Colors.error }
          ]}>
            {progress.uploaded}/{progress.total} Required Documents
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            {
              width: `${progress.percentage}%`,
              backgroundColor: progress.isComplete ? Colors.success : Colors.primary
            }
          ]} />
        </View>
        
        {progress.isComplete && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.completedText}>All required documents uploaded!</Text>
          </View>
        )}
      </View>

      {/* Required Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Required Documents</Text>
        {TOR_REQUIRED_DOCUMENTS.filter(doc => doc.required).map(renderDocumentItem)}
      </View>

      {/* Optional Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📎 Optional Documents</Text>
        <Text style={styles.sectionSubtitle}>
          These documents may help speed up your application process
        </Text>
        {TOR_REQUIRED_DOCUMENTS.filter(doc => !doc.required).map(renderDocumentItem)}
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>💡 Tips for Best Results</Text>
        <Text style={styles.helpText}>• Ensure documents are clear and well-lit</Text>
        <Text style={styles.helpText}>• Capture all corners of the document</Text>
        <Text style={styles.helpText}>• Avoid shadows and glare</Text>
        <Text style={styles.helpText}>• Use original documents when possible</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: Typography.size.large,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: Typography.size.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.large,
    lineHeight: 22,
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.large,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  progressTitle: {
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
  },
  progressText: {
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray + '30',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.small,
    padding: Spacing.small,
    backgroundColor: Colors.success + '20',
    borderRadius: 8,
  },
  completedText: {
    marginLeft: Spacing.small,
    fontSize: Typography.size.small,
    color: Colors.success,
    fontWeight: Typography.weight.medium,
  },
  section: {
    marginBottom: Spacing.large,
  },
  sectionTitle: {
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  sectionSubtitle: {
    fontSize: Typography.size.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.medium,
  },
  documentItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    elevation: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.small,
  },
  documentInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: Spacing.small,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  documentDescription: {
    fontSize: Typography.size.small,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: Typography.size.tiny,
    color: Colors.gray,
  },
  documentActions: {
    alignItems: 'flex-end',
  },
  requiredBadge: {
    fontSize: Typography.size.tiny,
    color: Colors.error,
    fontWeight: Typography.weight.medium,
    marginTop: 4,
  },
  validationErrors: {
    backgroundColor: Colors.warning + '20',
    borderRadius: 8,
    padding: Spacing.small,
    marginBottom: Spacing.small,
  },
  validationTitle: {
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
    color: Colors.warning,
    marginBottom: 4,
  },
  validationError: {
    fontSize: Typography.size.small,
    color: Colors.warning,
    lineHeight: 18,
  },
  documentButtonContainer: {
    marginTop: Spacing.small,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingButton: {
    backgroundColor: Colors.gray,
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
    marginLeft: 8,
  },
  uploadedActions: {
    flexDirection: 'row',
    gap: Spacing.small,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    borderRadius: 6,
    padding: Spacing.small,
    flex: 1,
    justifyContent: 'center',
  },
  viewButtonText: {
    color: Colors.primary,
    fontSize: Typography.size.small,
    marginLeft: 4,
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    borderRadius: 6,
    padding: Spacing.small,
    flex: 1,
    justifyContent: 'center',
  },
  replaceButtonText: {
    color: Colors.warning,
    fontSize: Typography.size.small,
    marginLeft: 4,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    borderRadius: 6,
    padding: Spacing.small,
    flex: 1,
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.error,
    fontSize: Typography.size.small,
    marginLeft: 4,
  },
  helpSection: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.large,
  },
  helpTitle: {
    fontSize: Typography.size.medium,
    fontWeight: Typography.weight.semiBold,
    color: Colors.primary,
    marginBottom: Spacing.small,
  },
  helpText: {
    fontSize: Typography.size.small,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default TORDocumentUpload;
