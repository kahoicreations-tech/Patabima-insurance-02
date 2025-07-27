/**
 * PSV Document Upload Step Component
 * Handles document upload for PSV insurance quotation
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

const REQUIRED_DOCUMENTS = [
  {
    id: 'logbook',
    name: 'Vehicle Logbook',
    description: 'Original vehicle logbook or certified copy',
    required: true,
    icon: 'document-text'
  },
  {
    id: 'nationalId',
    name: 'National ID',
    description: 'Copy of owner\'s national ID',
    required: true,
    icon: 'card'
  },
  {
    id: 'psvLicense',
    name: 'PSV License',
    description: 'Valid PSV license from NTSA',
    required: true,
    icon: 'shield-checkmark'
  },
  {
    id: 'routeLicense',
    name: 'Route License',
    description: 'Route license for designated route',
    required: true,
    icon: 'map'
  },
  {
    id: 'kraPin',
    name: 'KRA PIN Certificate',
    description: 'KRA PIN certificate (for business owners)',
    required: false,
    icon: 'receipt'
  },
  {
    id: 'goodConductCert',
    name: 'Good Conduct Certificate',
    description: 'Certificate of good conduct for driver',
    required: false,
    icon: 'ribbon'
  }
];

const PSVDocumentUploadStep = ({ formData, onUpdateFormData }) => {
  const [uploadedDocs, setUploadedDocs] = useState(formData.documents || {});
  const [errors, setErrors] = useState({});

  const handleDocumentUpload = (docId) => {
    // Simulate document upload
    Alert.alert(
      'Document Upload',
      `Upload ${REQUIRED_DOCUMENTS.find(doc => doc.id === docId)?.name}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Upload',
          onPress: () => {
            const updatedDocs = {
              ...uploadedDocs,
              [docId]: {
                name: `${docId}_document.pdf`,
                size: '2.5 MB',
                uploadDate: new Date().toISOString()
              }
            };
            setUploadedDocs(updatedDocs);
            onUpdateFormData({ documents: updatedDocs });
            
            // Clear error if exists
            if (errors[docId]) {
              setErrors(prev => {
                const updated = { ...prev };
                delete updated[docId];
                return updated;
              });
            }
          }
        }
      ]
    );
  };

  const handleDocumentRemove = (docId) => {
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
            const updatedDocs = { ...uploadedDocs };
            delete updatedDocs[docId];
            setUploadedDocs(updatedDocs);
            onUpdateFormData({ documents: updatedDocs });
          }
        }
      ]
    );
  };

  const renderDocumentCard = (doc) => {
    const isUploaded = uploadedDocs[doc.id];
    const hasError = errors[doc.id];

    return (
      <View key={doc.id} style={[styles.documentCard, hasError && styles.errorCard]}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <View style={styles.documentTitleRow}>
              <Ionicons 
                name={doc.icon} 
                size={20} 
                color={isUploaded ? Colors.success : Colors.textSecondary} 
              />
              <Text style={styles.documentName}>{doc.name}</Text>
              {doc.required && <Text style={styles.requiredBadge}>Required</Text>}
            </View>
            <Text style={styles.documentDescription}>{doc.description}</Text>
          </View>
        </View>

        <View style={styles.documentActions}>
          {isUploaded ? (
            <View style={styles.uploadedContainer}>
              <View style={styles.uploadedInfo}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.uploadedText}>Uploaded</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleDocumentRemove(doc.id)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleDocumentUpload(doc.id)}
            >
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {hasError && (
          <Text style={styles.errorText}>{errors[doc.id]}</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Document Upload</Text>
        <Text style={styles.stepDescription}>
          Please upload the required documents for your PSV insurance application.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Document Requirements</Text>
            <Text style={styles.infoText}>
              • All documents should be clear and legible{'\n'}
              • PDF, JPG, or PNG formats accepted{'\n'}
              • Maximum file size: 5MB per document{'\n'}
              • Documents must be valid and current
            </Text>
          </View>
        </View>

        <View style={styles.documentsContainer}>
          {REQUIRED_DOCUMENTS.map(renderDocumentCard)}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Upload Summary</Text>
          <Text style={styles.summaryText}>
            {Object.keys(uploadedDocs).length} of {REQUIRED_DOCUMENTS.filter(doc => doc.required).length} required documents uploaded
          </Text>
          {Object.keys(uploadedDocs).length >= REQUIRED_DOCUMENTS.filter(doc => doc.required).length && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.successText}>All required documents uploaded!</Text>
            </View>
          )}
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
    ...Typography.heading2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.lightBlue,
    padding: Spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  infoContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  infoTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  documentsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  documentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorCard: {
    borderColor: Colors.error,
  },
  documentHeader: {
    marginBottom: Spacing.sm,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: 8,
  },
  documentName: {
    ...Typography.bodyBold,
    color: Colors.text,
    flex: 1,
  },
  requiredBadge: {
    ...Typography.caption,
    color: Colors.error,
    backgroundColor: Colors.lightRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
  },
  documentDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  documentActions: {
    alignItems: 'flex-end',
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
    gap: 6,
  },
  uploadedText: {
    ...Typography.bodyBold,
    color: Colors.success,
  },
  removeButton: {
    padding: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    gap: 6,
  },
  uploadButtonText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  summaryContainer: {
    backgroundColor: Colors.lightGray,
    padding: Spacing.md,
    borderRadius: 8,
  },
  summaryTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  successText: {
    ...Typography.bodyBold,
    color: Colors.success,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});

export default PSVDocumentUploadStep;
