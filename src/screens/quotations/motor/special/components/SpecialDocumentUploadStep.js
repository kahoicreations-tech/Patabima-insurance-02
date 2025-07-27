import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SpecialDocumentUploadStep = ({ 
  formData, 
  onDataChange, 
  onNext, 
  onPrevious,
  currentStep,
  totalSteps 
}) => {
  const [uploadedDocuments, setUploadedDocuments] = useState(formData?.uploadedDocuments || {});

  const documentRequirements = [
    {
      id: 'national_id',
      title: 'National ID/Passport',
      description: 'Valid government-issued identification',
      required: true,
      category: 'identity',
      icon: 'person-circle'
    },
    {
      id: 'operator_license',
      title: 'Equipment Operator License',
      description: 'Valid operator license for specialized equipment',
      required: true,
      category: 'licensing',
      icon: 'card'
    },
    {
      id: 'equipment_registration',
      title: 'Equipment Registration Certificate',
      description: 'Equipment registration or import documents',
      required: true,
      category: 'equipment',
      icon: 'document-text'
    },
    {
      id: 'inspection_certificate',
      title: 'Equipment Inspection Certificate',
      description: 'Current safety inspection certificate',
      required: true,
      category: 'safety',
      icon: 'shield-checkmark'
    },
    {
      id: 'purchase_invoice',
      title: 'Purchase Invoice/Receipt',
      description: 'Proof of purchase or valuation document',
      required: true,
      category: 'valuation',
      icon: 'receipt'
    },
    {
      id: 'business_permit',
      title: 'Business License/Permit',
      description: 'Valid business operating license (if commercial)',
      required: false,
      category: 'business',
      icon: 'business',
      conditional: true,
      condition: 'Commercial use'
    },
    {
      id: 'tax_compliance',
      title: 'Tax Compliance Certificate',
      description: 'KRA tax compliance certificate',
      required: false,
      category: 'business',
      icon: 'calculator',
      conditional: true,
      condition: 'Commercial use'
    },
    {
      id: 'environmental_clearance',
      title: 'Environmental Impact Assessment',
      description: 'NEMA environmental clearance (if applicable)',
      required: false,
      category: 'environmental',
      icon: 'leaf',
      conditional: true,
      condition: 'Mining/Heavy construction'
    },
    {
      id: 'safety_training',
      title: 'Safety Training Certificates',
      description: 'Operator safety training certifications',
      required: false,
      category: 'safety',
      icon: 'school'
    },
    {
      id: 'maintenance_records',
      title: 'Maintenance Records',
      description: 'Recent maintenance and service records',
      required: false,
      category: 'maintenance',
      icon: 'build'
    },
    {
      id: 'site_permit',
      title: 'Site Operating Permit',
      description: 'Permit to operate at specific locations',
      required: false,
      category: 'operational',
      icon: 'location',
      conditional: true,
      condition: 'Fixed site operations'
    },
    {
      id: 'insurance_history',
      title: 'Previous Insurance History',
      description: 'Previous insurance certificates and claims history',
      required: false,
      category: 'insurance',
      icon: 'document-attach'
    }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      identity: '#2196F3',
      licensing: '#FF9800',
      equipment: '#4CAF50',
      safety: '#F44336',
      valuation: '#9C27B0',
      business: '#795548',
      environmental: '#8BC34A',
      maintenance: '#607D8B',
      operational: '#E91E63',
      insurance: '#00BCD4'
    };
    return colors[category] || '#666';
  };

  const simulateFileUpload = (documentId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          fileName: `${documentId}_${Date.now()}.pdf`,
          uploadTime: new Date().toISOString(),
          size: Math.floor(Math.random() * 2000000) + 500000 // 0.5MB to 2.5MB
        });
      }, 1500);
    });
  };

  const handleDocumentUpload = async (document) => {
    try {
      Alert.alert(
        'Document Upload',
        `Uploading ${document.title}...`,
        [{ text: 'OK' }]
      );

      const result = await simulateFileUpload(document.id);
      
      if (result.success) {
        const updatedDocuments = {
          ...uploadedDocuments,
          [document.id]: {
            ...result,
            title: document.title,
            category: document.category
          }
        };
        
        setUploadedDocuments(updatedDocuments);
        
        const updatedData = {
          ...formData,
          uploadedDocuments: updatedDocuments
        };
        
        onDataChange(updatedData);
        
        Alert.alert(
          'Upload Successful',
          `${document.title} has been uploaded successfully.`
        );
      }
    } catch (error) {
      Alert.alert(
        'Upload Failed',
        `Failed to upload ${document.title}. Please try again.`
      );
    }
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
            const updatedDocuments = { ...uploadedDocuments };
            delete updatedDocuments[documentId];
            setUploadedDocuments(updatedDocuments);
            
            const updatedData = {
              ...formData,
              uploadedDocuments: updatedDocuments
            };
            
            onDataChange(updatedData);
          }
        }
      ]
    );
  };

  const validateDocuments = () => {
    const requiredDocuments = documentRequirements.filter(doc => doc.required);
    const missingRequired = requiredDocuments.filter(doc => !uploadedDocuments[doc.id]);
    
    if (missingRequired.length > 0) {
      Alert.alert(
        'Missing Required Documents',
        `Please upload the following required documents:\n\n${missingRequired.map(doc => `• ${doc.title}`).join('\n')}`
      );
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateDocuments()) {
      onNext();
    }
  };

  const getUploadProgress = () => {
    const totalRequired = documentRequirements.filter(doc => doc.required).length;
    const uploadedRequired = documentRequirements.filter(doc => 
      doc.required && uploadedDocuments[doc.id]
    ).length;
    
    return {
      uploaded: uploadedRequired,
      total: totalRequired,
      percentage: Math.round((uploadedRequired / totalRequired) * 100)
    };
  };

  const progress = getUploadProgress();

  const renderDocumentCard = (document) => {
    const isUploaded = uploadedDocuments[document.id];
    const categoryColor = getCategoryColor(document.category);

    return (
      <View key={document.id} style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <View style={[styles.documentIcon, { backgroundColor: categoryColor + '15' }]}>
              <Ionicons name={document.icon} size={24} color={categoryColor} />
            </View>
            <View style={styles.documentDetails}>
              <Text style={styles.documentTitle}>
                {document.title}
                {document.required && <Text style={styles.requiredAsterisk}> *</Text>}
              </Text>
              <Text style={styles.documentDescription}>{document.description}</Text>
              {document.conditional && (
                <Text style={styles.conditionalText}>Required for: {document.condition}</Text>
              )}
            </View>
          </View>
          <View style={styles.documentActions}>
            {isUploaded ? (
              <View style={styles.uploadedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleDocumentRemove(document.id)}
                >
                  <Ionicons name="trash" size={20} color="#FF5722" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, { borderColor: categoryColor }]}
                onPress={() => handleDocumentUpload(document)}
              >
                <Ionicons name="cloud-upload" size={20} color={categoryColor} />
                <Text style={[styles.uploadButtonText, { color: categoryColor }]}>Upload</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isUploaded && (
          <View style={styles.uploadedInfo}>
            <View style={styles.uploadedDetails}>
              <Text style={styles.fileName}>{isUploaded.fileName}</Text>
              <Text style={styles.uploadTime}>
                Uploaded: {new Date(isUploaded.uploadTime).toLocaleString()}
              </Text>
              <Text style={styles.fileSize}>
                Size: {(isUploaded.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const groupedDocuments = documentRequirements.reduce((groups, doc) => {
    const category = doc.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(doc);
    return groups;
  }, {});

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.stepIndicator}>Step {currentStep} of {totalSteps}</Text>
        <Text style={styles.title}>Document Upload</Text>
        <Text style={styles.subtitle}>
          Upload required documents for your special equipment insurance
        </Text>
      </View>

      <View style={styles.content}>
        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Upload Progress</Text>
              <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress.percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {progress.uploaded} of {progress.total} required documents uploaded
            </Text>
          </View>
        </View>

        {/* Upload Instructions */}
        <View style={styles.instructionsSection}>
          <View style={styles.instructionsCard}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <View style={styles.instructionsContent}>
              <Text style={styles.instructionsTitle}>Upload Guidelines</Text>
              <Text style={styles.instructionsText}>
                • Upload clear, legible copies of all documents{'\n'}
                • Accepted formats: PDF, JPG, PNG{'\n'}
                • Maximum file size: 5MB per document{'\n'}
                • Documents marked with * are required
              </Text>
            </View>
          </View>
        </View>

        {/* Document Categories */}
        {Object.entries(groupedDocuments).map(([category, documents]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: getCategoryColor(category) }]}>
              {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')} Documents
            </Text>
            {documents.map(renderDocumentCard)}
          </View>
        ))}

        {/* Upload Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Upload Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{Object.keys(uploadedDocuments).length}</Text>
                <Text style={styles.statLabel}>Total Uploaded</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{progress.uploaded}</Text>
                <Text style={styles.statLabel}>Required Uploaded</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{progress.total - progress.uploaded}</Text>
                <Text style={styles.statLabel}>Still Required</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrevious}>
          <Ionicons name="arrow-back" size={20} color="#646767" />
          <Text style={styles.secondaryButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Complete</Text>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  content: {
    padding: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  instructionsSection: {
    marginBottom: 20,
  },
  instructionsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsContent: {
    marginLeft: 10,
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 5,
  },
  instructionsText: {
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 10,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requiredAsterisk: {
    color: '#F44336',
  },
  documentDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  conditionalText: {
    fontSize: 11,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  documentActions: {
    alignItems: 'flex-end',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  uploadedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  uploadedInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  uploadedDetails: {
    gap: 2,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  uploadTime: {
    fontSize: 11,
    color: '#666',
  },
  fileSize: {
    fontSize: 11,
    color: '#666',
  },
  summarySection: {
    marginTop: 10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  primaryButton: {
    backgroundColor: '#D5222B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 0.45,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 0.45,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#646767',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SpecialDocumentUploadStep;
