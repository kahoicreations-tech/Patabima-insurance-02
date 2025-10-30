import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ScanCompleteStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  onGenerateQuotation,
  onStartOver,
  scanResults = null,
  quotationData = null,
  isGeneratingQuotation = false
}) => {

  const handleGenerateQuotation = () => {
    if (onGenerateQuotation) {
      onGenerateQuotation();
    }
  };

  const handleStartOver = () => {
    Alert.alert(
      'Start Over',
      'Are you sure you want to start over? All entered information will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Over', 
          style: 'destructive',
          onPress: () => onStartOver && onStartOver()
        }
      ]
    );
  };

  const renderSummarySection = (title, items) => (
    <View style={styles.summarySection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.summaryCard}>
        {items.map((item, index) => (
          <View key={index} style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text style={styles.summaryValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const getPolicyDetailsItems = () => {
    const items = [];
    
    if (formData.vehicleRegistrationMethod) {
      items.push({
        label: 'Registration Method',
        value: formData.vehicleRegistrationMethod === 'registered' ? 'Registered Vehicle' : 'Chassis Number'
      });
    }
    
    if (formData.registrationNumber) {
      items.push({
        label: 'Registration Number',
        value: formData.registrationNumber
      });
    }
    
    if (formData.hasFinancialInterest !== undefined) {
      items.push({
        label: 'Financial Interest',
        value: formData.hasFinancialInterest ? `Yes - ${formData.financierName}` : 'No'
      });
    }
    
    if (formData.insuranceStartDate) {
      items.push({
        label: 'Cover Start Date',
        value: formData.insuranceStartDate.toLocaleDateString()
      });
    }
    
    if (formData.selectedInsurer) {
      items.push({
        label: 'Insurance Provider',
        value: formData.selectedInsurer.name
      });
    }
    
    return items;
  };

  const getClientDetailsItems = () => {
    const items = [];
    
    if (formData.fullName) {
      items.push({
        label: 'Full Name',
        value: formData.fullName
      });
    }
    
    if (formData.nationalId) {
      items.push({
        label: 'National ID',
        value: formData.nationalId
      });
    }
    
    if (formData.phoneNumber) {
      items.push({
        label: 'Phone Number',
        value: formData.phoneNumber
      });
    }
    
    if (formData.email) {
      items.push({
        label: 'Email',
        value: formData.email
      });
    }
    
    if (formData.licenseNumber) {
      items.push({
        label: 'License Number',
        value: formData.licenseNumber
      });
    }
    
    if (formData.vehicleValue) {
      items.push({
        label: 'Vehicle Value',
        value: `KES ${parseInt(formData.vehicleValue).toLocaleString()}`
      });
    }
    
    if (formData.vehicleUsage) {
      items.push({
        label: 'Vehicle Usage',
        value: formData.vehicleUsage === 'private' ? 'Private Use' : 'Commercial Use'
      });
    }
    
    return items;
  };

  const getDocumentStatusItems = () => {
    const items = [];
    
    if (formData.nationalIdDocument) {
      items.push({
        label: 'National ID',
        value: formData.nationalIdDocument.status === 'uploaded' ? '✓ Uploaded' : '○ Missing'
      });
    }
    
    if (formData.kraDocument) {
      items.push({
        label: 'KRA PIN',
        value: formData.kraDocument.status === 'uploaded' ? '✓ Uploaded' : '○ Missing'
      });
    }
    
    if (formData.logbookDocument) {
      items.push({
        label: 'Logbook',
        value: formData.logbookDocument.status === 'uploaded' ? '✓ Uploaded' : '○ Missing'
      });
    }
    
    return items;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Review & Generate Quotation</Text>
          <Text style={styles.headerSubtitle}>Please review your information before generating the quotation</Text>
        </View>
      )}

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Ionicons name="checkmark-circle" size={32} color="#10B981" />
        </View>
        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>Information Complete</Text>
          <Text style={styles.statusSubtitle}>
            All required information has been collected and documents uploaded successfully.
          </Text>
        </View>
      </View>

      {/* Summary Sections */}
      {getPolicyDetailsItems().length > 0 && 
        renderSummarySection('Policy Details', getPolicyDetailsItems())
      }
      
      {getClientDetailsItems().length > 0 && 
        renderSummarySection('Personal Information', getClientDetailsItems())
      }
      
      {getDocumentStatusItems().length > 0 && 
        renderSummarySection('Document Status', getDocumentStatusItems())
      }

      {/* Scan Results */}
      {scanResults && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Scan Results</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Documents Processed</Text>
              <Text style={styles.summaryValue}>{scanResults.documentsProcessed || 0}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Scan Quality</Text>
              <Text style={styles.summaryValue}>{scanResults.quality || 'Good'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Processing Time</Text>
              <Text style={styles.summaryValue}>{scanResults.processingTime || 'N/A'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quotation Data */}
      {quotationData && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Quotation Preview</Text>
          <View style={styles.quotationCard}>
            <View style={styles.quotationHeader}>
              <Text style={styles.quotationTitle}>TOR Insurance Quote</Text>
              <Text style={styles.quotationNumber}>#{quotationData.quoteNumber}</Text>
            </View>
            
            <View style={styles.quotationDetails}>
              <View style={styles.quotationItem}>
                <Text style={styles.quotationLabel}>Premium Amount</Text>
                <Text style={styles.quotationAmount}>
                  KES {quotationData.premiumAmount?.toLocaleString() || '0'}
                </Text>
              </View>
              
              <View style={styles.quotationItem}>
                <Text style={styles.quotationLabel}>Coverage Period</Text>
                <Text style={styles.quotationValue}>
                  {quotationData.coveragePeriod || '12 months'}
                </Text>
              </View>
              
              <View style={styles.quotationItem}>
                <Text style={styles.quotationLabel}>Policy Type</Text>
                <Text style={styles.quotationValue}>
                  Third Party Own Risk (TOR)
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleStartOver}
        >
          <Ionicons name="refresh-outline" size={20} color="#6B7280" />
          <Text style={styles.secondaryButtonText}>Start Over</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, isGeneratingQuotation && styles.primaryButtonDisabled]}
          onPress={handleGenerateQuotation}
          disabled={isGeneratingQuotation}
        >
          {isGeneratingQuotation ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Generate Quotation</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Additional Information */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Next Steps</Text>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Ionicons name="ellipse" size={6} color="#6B7280" />
            <Text style={styles.infoText}>Review and approve the generated quotation</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="ellipse" size={6} color="#6B7280" />
            <Text style={styles.infoText}>Complete payment to activate your policy</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="ellipse" size={6} color="#6B7280" />
            <Text style={styles.infoText}>Receive your policy certificate via email</Text>
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  statusIcon: {
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
  },
  quotationCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  quotationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
  },
  quotationNumber: {
    fontSize: 14,
    color: '#B91C1C',
    fontWeight: '500',
  },
  quotationDetails: {
    gap: 12,
  },
  quotationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotationLabel: {
    fontSize: 14,
    color: '#B91C1C',
  },
  quotationAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  quotationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D5222B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
});

export default ScanCompleteStep;