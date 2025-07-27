/**
 * TukTukDocumentUploadStep - Document upload for TukTuk insurance
 * Handles required documents specific to three-wheeler vehicles
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const TukTukDocumentUploadStep = ({
  formData,
  onUpdateFormData,
  errors = {},
  showHeader = true,
}) => {
  const [uploadingDocument, setUploadingDocument] = useState(null);

  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  const requiredDocuments = [
    {
      id: 'logbook',
      name: 'Vehicle Logbook',
      description: 'Official vehicle registration document',
      isRequired: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      id: 'license',
      name: 'Driving License',
      description: 'Valid driving license for three-wheeler',
      isRequired: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '2MB'
    },
    {
      id: 'id_copy',
      name: 'National ID/Passport',
      description: 'Government issued identification',
      isRequired: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '2MB'
    },
    {
      id: 'inspection',
      name: 'Vehicle Inspection Certificate',
      description: 'Valid inspection certificate from authorized garage',
      isRequired: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '3MB'
    },
    {
      id: 'route_license',
      name: 'Route License/PSV Badge',
      description: 'Required for commercial passenger transport',
      isRequired: formData.vehicleUsage === 'passenger',
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '2MB'
    },
    {
      id: 'medical_cert',
      name: 'Medical Certificate',
      description: 'Driver medical fitness certificate',
      isRequired: false,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '2MB'
    }
  ];

  const handleDocumentUpload = async (documentType) => {
    setUploadingDocument(documentType.id);
    
    try {
      // Simulate document upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const uploadedDoc = {
        id: documentType.id,
        name: documentType.name,
        type: 'application/pdf',
        size: 1024000,
        uri: `file://documents/${documentType.id}.pdf`,
        uploadedAt: new Date().toISOString()
      };

      const currentDocs = formData.uploadedDocuments || [];
      const updatedDocs = [...currentDocs.filter(doc => doc.id !== documentType.id), uploadedDoc];
      
      updateFormData({ uploadedDocuments: updatedDocs });
      
      Alert.alert('Success', `${documentType.name} uploaded successfully!`);
    } catch (error) {
      Alert.alert('Upload Failed', 'Please try again or contact support.');
    } finally {
      setUploadingDocument(null);
    }
  };

  const handleDocumentRemove = (documentId) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const currentDocs = formData.uploadedDocuments || [];
            const updatedDocs = currentDocs.filter(doc => doc.id !== documentId);
            updateFormData({ uploadedDocuments: updatedDocs });
          }
        }
      ]
    );
  };

  const isDocumentUploaded = (documentId) => {
    return (formData.uploadedDocuments || []).some(doc => doc.id === documentId);
  };

  const getUploadedDocument = (documentId) => {
    return (formData.uploadedDocuments || []).find(doc => doc.id === documentId);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ScrollView style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Document Upload</Text>
          <Text style={styles.subtitle}>
            Upload required documents for your TukTuk insurance
          </Text>
        </View>
      )}

      <View style={styles.documentsSection}>
        {requiredDocuments.map((doc) => (
          <View key={doc.id} style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>
                  {doc.name}
                  {doc.isRequired && <Text style={styles.required}> *</Text>}
                </Text>
                <Text style={styles.documentDescription}>{doc.description}</Text>
                <Text style={styles.documentDetails}>
                  Formats: {doc.formats.join(', ')} • Max size: {doc.maxSize}
                </Text>
              </View>
              
              <View style={styles.documentStatus}>
                {isDocumentUploaded(doc.id) ? (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                ) : doc.isRequired ? (
                  <Ionicons name="alert-circle" size={24} color={Colors.warning} />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color={Colors.border} />
                )}
              </View>
            </View>

            {isDocumentUploaded(doc.id) ? (
              <View style={styles.uploadedDocument}>
                <View style={styles.uploadedInfo}>
                  <Ionicons name="document" size={20} color={Colors.success} />
                  <View style={styles.uploadedDetails}>
                    <Text style={styles.uploadedName}>{getUploadedDocument(doc.id)?.name}</Text>
                    <Text style={styles.uploadedSize}>
                      {formatFileSize(getUploadedDocument(doc.id)?.size || 0)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleDocumentRemove(doc.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  uploadingDocument === doc.id && styles.uploadingButton
                ]}
                onPress={() => handleDocumentUpload(doc)}
                disabled={uploadingDocument === doc.id}
              >
                <Ionicons 
                  name={uploadingDocument === doc.id ? "cloud-upload" : "cloud-upload-outline"} 
                  size={24} 
                  color={uploadingDocument === doc.id ? Colors.textLight : Colors.primary} 
                />
                <Text style={[
                  styles.uploadButtonText,
                  uploadingDocument === doc.id && styles.uploadingText
                ]}>
                  {uploadingDocument === doc.id ? 'Uploading...' : 'Upload Document'}
                </Text>
              </TouchableOpacity>
            )}

            {errors[doc.id] && (
              <Text style={styles.errorText}>{errors[doc.id]}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.noteCard}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <View style={styles.noteContent}>
          <Text style={styles.noteTitle}>Important Notes:</Text>
          <Text style={styles.noteText}>
            • All documents must be clear and legible{'\n'}
            • Ensure documents are current and valid{'\n'}
            • Route license required for passenger transport TukTuks{'\n'}
            • Medical certificate recommended for commercial drivers
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.large,
  },
  header: {
    marginBottom: Spacing.large,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.bold,
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: Typography.regular,
    lineHeight: 24,
  },
  documentsSection: {
    gap: Spacing.medium,
    marginBottom: Spacing.large,
  },
  documentCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.medium,
    backgroundColor: Colors.white,
  },
  documentHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.medium,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
    marginBottom: 4,
  },
  required: {
    color: Colors.error,
  },
  documentDescription: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Typography.regular,
    marginBottom: 4,
  },
  documentDetails: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Typography.regular,
  },
  documentStatus: {
    marginLeft: Spacing.medium,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: Spacing.large,
    gap: Spacing.small,
  },
  uploadingButton: {
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
  },
  uploadButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: Typography.semiBold,
  },
  uploadingText: {
    color: Colors.textLight,
  },
  uploadedDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.successLight,
    padding: Spacing.medium,
    borderRadius: 8,
  },
  uploadedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploadedDetails: {
    marginLeft: Spacing.small,
    flex: 1,
  },
  uploadedName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
  },
  uploadedSize: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Typography.regular,
  },
  removeButton: {
    padding: Spacing.small,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: Colors.infoLight,
    padding: Spacing.medium,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  noteContent: {
    marginLeft: Spacing.small,
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.semiBold,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: Typography.regular,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontFamily: Typography.regular,
    marginTop: Spacing.small,
  },
});

export default TukTukDocumentUploadStep;
