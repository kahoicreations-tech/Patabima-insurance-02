/**
 * DocumentUploadStep - Reusable component for document upload
 * Used across all private motor insurance quotation flows
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Typography, Spacing } from '../../../../../constants';

const DocumentUploadStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  requiredDocuments = ['logbook', 'nationalId'],
  optionalDocuments = ['kraPin'],
  showQuotationSummary = true,
  selectedInsurer = null,
  customDocuments = [],
  insuranceType = 'Motor Insurance'
}) => {
  const updateFormData = (updates) => {
    onUpdateFormData(updates);
  };

  // Handle document picking
  const handleDocumentPick = async (documentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const document = result.assets[0];
        updateFormData({
          documents: {
            ...formData.documents,
            [documentType]: document,
          },
        });
        Alert.alert('Success', `${getDocumentDisplayName(documentType)} uploaded successfully`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  // Get display name for document type
  const getDocumentDisplayName = (documentType) => {
    const displayNames = {
      logbook: 'Vehicle Logbook',
      nationalId: 'National ID Copy',
      kraPin: 'KRA PIN Certificate',
      drivingLicense: 'Driving License',
      valuationReport: 'Valuation Report',
      inspectionCertificate: 'Inspection Certificate',
      ...customDocuments.reduce((acc, doc) => ({ ...acc, [doc.key]: doc.displayName }), {})
    };
    return displayNames[documentType] || documentType;
  };

  // Get document icon
  const getDocumentIcon = (documentType, isUploaded) => {
    if (isUploaded) return 'document-text';
    
    const icons = {
      logbook: 'car-outline',
      nationalId: 'card-outline',
      kraPin: 'receipt-outline',
      drivingLicense: 'card-outline',
      valuationReport: 'calculator-outline',
      inspectionCertificate: 'shield-checkmark-outline',
    };
    return icons[documentType] || 'cloud-upload-outline';
  };

  // Format number with commas
  const formatNumber = (value) => {
    if (!value) return '0';
    return Math.round(value).toLocaleString();
  };

  // Get all document types to display
  const allDocuments = [
    ...requiredDocuments.map(doc => ({ key: doc, required: true })),
    ...optionalDocuments.map(doc => ({ key: doc, required: false })),
    ...customDocuments
  ];

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          <Text style={styles.stepTitle}>Upload Documents</Text>
          <Text style={styles.stepSubtitle}>Required documents for {insuranceType}</Text>
        </>
      )}

      {/* Document Upload Cards */}
      {allDocuments.map(({ key, required, displayName }) => {
        const docDisplayName = displayName || getDocumentDisplayName(key);
        const isUploaded = formData.documents?.[key];
        
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.documentUpload,
              isUploaded && styles.documentUploadSuccess,
              required && !isUploaded && styles.documentUploadRequired
            ]}
            onPress={() => handleDocumentPick(key)}
            activeOpacity={0.7}
          >
            <View style={styles.documentContent}>
              <View style={[
                styles.documentIconContainer,
                isUploaded && styles.documentIconSuccess
              ]}>
                <Ionicons
                  name={getDocumentIcon(key, isUploaded)}
                  size={24}
                  color={isUploaded ? Colors.success : Colors.primary}
                />
              </View>
              
              <View style={styles.documentInfo}>
                <Text style={[
                  styles.documentUploadText,
                  isUploaded && styles.documentUploadSuccessText
                ]}>
                  {isUploaded 
                    ? `${docDisplayName}: ${formData.documents[key].name}`
                    : `Upload ${docDisplayName} ${required ? '*' : '(Optional)'}`
                  }
                </Text>
                
                {isUploaded && (
                  <Text style={styles.documentSize}>
                    Size: {(formData.documents[key].size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                )}
              </View>
              
              <View style={styles.documentAction}>
                {isUploaded ? (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                ) : (
                  <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Document Guidelines */}
      <View style={styles.guidelinesContainer}>
        <Text style={styles.guidelinesTitle}>Document Guidelines:</Text>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Clear, legible photos or scanned copies</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>File formats: PDF, JPG, PNG</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Maximum file size: 10MB per document</Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>Ensure all text is readable</Text>
        </View>
      </View>

      {/* Quotation Summary */}
      {showQuotationSummary && formData.selectedQuote && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Quotation Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vehicle:</Text>
              <Text style={styles.summaryValue}>
                {formData.vehicleMake} {formData.vehicleModel} ({formData.vehicleYear})
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Registration:</Text>
              <Text style={styles.summaryValue}>{formData.registrationNumber}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Insured Value:</Text>
              <Text style={styles.summaryValue}>
                KSh {formatNumber(formData.vehicleValue?.replace(/[^0-9.]/g, '') || '0')}
              </Text>
            </View>
            
            {selectedInsurer && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Insurer:</Text>
                <Text style={styles.summaryValue}>{selectedInsurer.name}</Text>
              </View>
            )}
            
            <View style={styles.summaryDivider} />
            
            {formData.selectedQuote.basePremium && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Base Premium:</Text>
                <Text style={styles.summaryValue}>
                  KSh {formatNumber(formData.selectedQuote.basePremium)}
                </Text>
              </View>
            )}
            
            {formData.selectedQuote.policyholdersFund && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Policyholders Fund:</Text>
                <Text style={styles.summaryValue}>
                  KSh {formatNumber(formData.selectedQuote.policyholdersFund)}
                </Text>
              </View>
            )}
            
            {formData.selectedQuote.trainingLevy && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Training Levy:</Text>
                <Text style={styles.summaryValue}>
                  KSh {formatNumber(formData.selectedQuote.trainingLevy)}
                </Text>
              </View>
            )}
            
            {formData.selectedQuote.stampDuty && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Stamp Duty:</Text>
                <Text style={styles.summaryValue}>
                  KSh {formatNumber(formData.selectedQuote.stampDuty)}
                </Text>
              </View>
            )}
            
            <View style={[styles.summaryRow, styles.totalSummaryRow]}>
              <Text style={styles.totalSummaryLabel}>Total Premium:</Text>
              <Text style={styles.totalSummaryValue}>
                KSh {formatNumber(formData.selectedQuote.totalPremium)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Poppins_700Bold',
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: 'Poppins_400Regular',
  },
  documentUpload: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
  },
  documentUploadSuccess: {
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}08`,
    borderStyle: 'solid',
  },
  documentUploadRequired: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}05`,
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  documentIconSuccess: {
    backgroundColor: `${Colors.success}20`,
  },
  documentInfo: {
    flex: 1,
  },
  documentUploadText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  documentUploadSuccessText: {
    color: Colors.success,
  },
  documentSize: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: 'Poppins_400Regular',
  },
  documentAction: {
    marginLeft: Spacing.sm,
  },
  guidelinesContainer: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  guidelinesTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Poppins_500Medium',
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  guidelineText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  summaryContainer: {
    marginTop: Spacing.md,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: 'Poppins_700Bold',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
    fontFamily: 'Poppins_500Medium',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalSummaryRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalSummaryLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    fontFamily: 'Poppins_700Bold',
  },
  totalSummaryValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    flex: 2,
    textAlign: 'right',
    fontFamily: 'Poppins_700Bold',
  },
});

export default DocumentUploadStep;
