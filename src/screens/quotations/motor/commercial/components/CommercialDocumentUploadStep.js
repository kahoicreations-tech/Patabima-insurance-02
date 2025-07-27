/**
 * Commercial Document Upload Step Component
 * Handles document requirements for commercial vehicle insurance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const CommercialDocumentUploadStep = ({ 
  formData, 
  onUpdateFormData,
  coverageType = 'third_party' 
}) => {
  const [uploadedDocuments, setUploadedDocuments] = useState(formData.uploadedDocuments || {});

  // Required documents for commercial vehicle insurance
  const REQUIRED_DOCUMENTS = [
    {
      id: 'business_registration',
      name: 'Business Registration Certificate',
      description: 'Certificate of incorporation or business registration',
      required: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      id: 'kra_pin_certificate',
      name: 'KRA PIN Certificate',
      description: 'Valid KRA PIN certificate for the business',
      required: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      id: 'logbook',
      name: 'Vehicle Logbook',
      description: 'Original vehicle logbook or certified copy',
      required: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      id: 'driving_license',
      name: 'Driving License',
      description: 'Valid driving license of primary driver',
      required: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      id: 'id_copy',
      name: 'ID Copy',
      description: 'National ID copy of business owner/contact person',
      required: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      id: 'vehicle_inspection',
      name: 'Vehicle Inspection Report',
      description: 'Recent vehicle inspection certificate',
      required: coverageType === 'comprehensive',
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      id: 'valuation_report',
      name: 'Vehicle Valuation Report',
      description: 'Professional valuation for high-value vehicles',
      required: false,
      formats: ['PDF'],
      maxSize: '5MB'
    },
    {
      id: 'operating_license',
      name: 'Operating License',
      description: 'Commercial vehicle operating license (if applicable)',
      required: false,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    }
  ];

  const handleDocumentUpload = (documentId) => {
    // Simulate document upload
    Alert.alert(
      'Document Upload',
      `Upload ${REQUIRED_DOCUMENTS.find(doc => doc.id === documentId)?.name}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Upload',
          onPress: () => {
            const newUploadedDocuments = {
              ...uploadedDocuments,
              [documentId]: {
                uploaded: true,
                filename: `document_${documentId}.pdf`,
                uploadDate: new Date().toISOString()
              }
            };
            setUploadedDocuments(newUploadedDocuments);
            onUpdateFormData({ uploadedDocuments: newUploadedDocuments });
          }
        }
      ]
    );
  };

  const handleDocumentRemove = (documentId) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newUploadedDocuments = { ...uploadedDocuments };
            delete newUploadedDocuments[documentId];
            setUploadedDocuments(newUploadedDocuments);
            onUpdateFormData({ uploadedDocuments: newUploadedDocuments });
          }
        }
      ]
    );
  };

  const getUploadProgress = () => {
    const requiredDocs = REQUIRED_DOCUMENTS.filter(doc => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter(doc => uploadedDocuments[doc.id]?.uploaded);
    return {
      uploaded: uploadedRequiredDocs.length,
      total: requiredDocs.length,
      percentage: (uploadedRequiredDocs.length / requiredDocs.length) * 100
    };
  };

  const progress = getUploadProgress();

  const renderDocumentItem = (document) => {
    const isUploaded = uploadedDocuments[document.id]?.uploaded;
    
    return (
      <View key={document.id} style={styles.documentItem}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>{document.name}</Text>
            <Text style={styles.documentDescription}>{document.description}</Text>
            <View style={styles.documentMeta}>
              <Text style={styles.metaText}>
                Formats: {document.formats.join(', ')} • Max size: {document.maxSize}
              </Text>
              {document.required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.documentActions}>
          {isUploaded ? (
            <View style={styles.uploadedContainer}>
              <View style={styles.uploadedInfo}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <View style={styles.uploadedDetails}>
                  <Text style={styles.uploadedText}>Uploaded</Text>
                  <Text style={styles.uploadedFilename}>
                    {uploadedDocuments[document.id].filename}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleDocumentRemove(document.id)}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleDocumentUpload(document.id)}
            >
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Required Documents</Text>
        <Text style={styles.stepDescription}>
          Upload the required documents for your commercial vehicle insurance application.
        </Text>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Upload Progress</Text>
            <Text style={styles.progressText}>
              {progress.uploaded} of {progress.total} required documents
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${progress.percentage}%` }]} 
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Commercial Insurance Requirements</Text>
            <Text style={styles.infoText}>
              Commercial vehicle insurance requires additional business documentation to verify legitimacy and assess risk.
            </Text>
          </View>
        </View>

        <View style={styles.documentsContainer}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {REQUIRED_DOCUMENTS.filter(doc => doc.required).map(renderDocumentItem)}
          
          <Text style={styles.sectionTitle}>Optional Documents</Text>
          {REQUIRED_DOCUMENTS.filter(doc => !doc.required).map(renderDocumentItem)}
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>📋 Important Notes</Text>
          <View style={styles.noteItem}>
            <Text style={styles.noteText}>• All documents must be clear and legible</Text>
          </View>
          <View style={styles.noteItem}>
            <Text style={styles.noteText}>• Business registration must be current and valid</Text>
          </View>
          <View style={styles.noteItem}>
            <Text style={styles.noteText}>• Vehicle inspection may be required for comprehensive coverage</Text>
          </View>
          <View style={styles.noteItem}>
            <Text style={styles.noteText}>• Processing may take 2-3 business days after document submission</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    padding: Spacing.md,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.gray,
    marginBottom: Spacing.lg,
  },
  progressCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.gray,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.white,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  documentsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.dark,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  documentItem: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  documentHeader: {
    marginBottom: Spacing.sm,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  documentDescription: {
    ...Typography.caption,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    ...Typography.caption,
    color: Colors.gray,
    fontSize: 10,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: Spacing.sm,
  },
  requiredText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  documentActions: {
    alignItems: 'flex-end',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  uploadButtonText: {
    ...Typography.body,
    color: Colors.white,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  uploadedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploadedDetails: {
    marginLeft: Spacing.sm,
  },
  uploadedText: {
    ...Typography.body,
    color: Colors.success,
    fontWeight: '600',
  },
  uploadedFilename: {
    ...Typography.caption,
    color: Colors.gray,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  notesCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  notesTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  noteItem: {
    marginBottom: Spacing.xs,
  },
  noteText: {
    ...Typography.caption,
    color: Colors.gray,
  },
});

export default CommercialDocumentUploadStep;
