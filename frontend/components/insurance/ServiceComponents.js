/**
 * Service Components for DMVIC, Textract, and Pricing Integrations
 * 
 * Renders specialized UI components for service results and interactions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ServiceComponents = ({ 
  type, 
  fieldId, 
  config, 
  formData, 
  dmvicResults, 
  textractResults, 
  livePrice, 
  processingStatus,
  onFieldChange,
  onFileUpload 
}) => {
  
  const renderComponent = () => {
    switch (type) {
      case 'DMVICPolicyCheck':
        return <DMVICPolicyCheck {...arguments[0]} />;
      case 'VerificationStatus':
        return <VerificationStatus {...arguments[0]} />;
      case 'VerifiedDetails':
        return <VerifiedDetails {...arguments[0]} />;
      case 'DateAdjustment':
        return <DateAdjustment {...arguments[0]} />;
      case 'LivePremiumDisplay':
        return <LivePremiumDisplay {...arguments[0]} />;
      case 'PremiumBreakdown':
        return <PremiumBreakdown {...arguments[0]} />;
      case 'TextractProcessingStatus':
        return <TextractProcessingStatus {...arguments[0]} />;
      case 'ExtractedDataVerification':
        return <ExtractedDataVerification {...arguments[0]} />;
      case 'ValidationResults':
        return <ValidationResults {...arguments[0]} />;
      case 'DataComparison':
        return <DataComparison {...arguments[0]} />;
      case 'ManualOverride':
        return <ManualOverride {...arguments[0]} />;
      default:
        return <Text>Component not found: {type}</Text>;
    }
  };

  return renderComponent();
};

// DMVIC Policy Check Component
const DMVICPolicyCheck = ({ formData, dmvicResults, processingStatus = {} }) => {
  const status = processingStatus?.dmvic;
  const vehicleReg = formData?.vehicle_registration;
  
  if (!vehicleReg) {
    return (
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Enter vehicle registration number to check for existing policies
        </Text>
      </View>
    );
  }
  
  if (status === 'checking') {
    return (
      <View style={styles.statusCard}>
        <ActivityIndicator size="small" color="#D5222B" />
        <Text style={styles.statusText}>Checking DMVIC database...</Text>
      </View>
    );
  }
  
  if (status === 'completed' && dmvicResults.policyCheck) {
    const { hasExisting, policy } = dmvicResults.policyCheck;
    
    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Icon 
            name={hasExisting ? "warning" : "check-circle"} 
            size={24} 
            color={hasExisting ? "#FF9800" : "#4CAF50"} 
          />
          <Text style={styles.resultTitle}>
            {hasExisting ? "Existing Policy Found" : "No Existing Policy"}
          </Text>
        </View>
        
        {hasExisting && policy && (
          <View style={styles.policyDetails}>
            <Text style={styles.policyText}>Insurer: {policy.insurer}</Text>
            <Text style={styles.policyText}>Policy No: {policy.policyNumber}</Text>
            <Text style={styles.policyText}>Expires: {policy.expiryDate}</Text>
            <Text style={styles.warningText}>
              Consider starting your policy after the expiry date to avoid overlap.
            </Text>
          </View>
        )}
      </View>
    );
  }
  
  if (status === 'error') {
    return (
      <View style={styles.errorCard}>
        <Icon name="error" size={24} color="#F44336" />
        <Text style={styles.errorText}>Failed to check DMVIC database</Text>
      </View>
    );
  }
  
  return null;
};

// Live Premium Display Component
const LivePremiumDisplay = ({ livePrice, processingStatus = {} }) => {
  const status = processingStatus?.pricing;
  
  if (status === 'calculating') {
    return (
      <View style={styles.pricingCard}>
        <ActivityIndicator size="small" color="#D5222B" />
        <Text style={styles.pricingText}>Calculating premium...</Text>
      </View>
    );
  }
  
  if (livePrice) {
    return (
      <View style={styles.premiumCard}>
        <View style={styles.premiumHeader}>
          <Text style={styles.premiumLabel}>Live Premium</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {livePrice.confidence}% confidence
            </Text>
          </View>
        </View>
        
        <Text style={styles.premiumAmount}>
          KSh {livePrice.totalPremium.toLocaleString()}
        </Text>
        
        <View style={styles.premiumBreakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Premium:</Text>
            <Text style={styles.breakdownValue}>
              KSh {livePrice.basePremium.toLocaleString()}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Taxes & Fees:</Text>
            <Text style={styles.breakdownValue}>
              KSh {livePrice.taxes.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoText}>
        Premium will be calculated as you enter vehicle details
      </Text>
    </View>
  );
};

// Premium Breakdown Component
const PremiumBreakdown = ({ livePrice }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!livePrice) return null;
  
  return (
    <View style={styles.breakdownCard}>
      <TouchableOpacity 
        style={styles.breakdownHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.breakdownTitle}>Premium Breakdown</Text>
        <Icon 
          name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color="#646767" 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.detailedBreakdown}>
          {livePrice.breakdown.map((item, index) => (
            <View key={index} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{item.label}:</Text>
              <Text style={styles.breakdownValue}>
                KSh {item.amount.toLocaleString()}
              </Text>
            </View>
          ))}
          
          <View style={styles.breakdownDivider} />
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownTotalLabel}>Total Premium:</Text>
            <Text style={styles.breakdownTotalValue}>
              KSh {livePrice.totalPremium.toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Textract Processing Status Component
const TextractProcessingStatus = ({ textractResults, processingStatus = {} }) => {
  const logbookStatus = processingStatus?.textract?.logbook;
  const nationalIdStatus = processingStatus?.textract?.nationalId;
  const kraPinStatus = processingStatus?.textract?.kraPin;
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return <ActivityIndicator size="small" color="#D5222B" />;
      case 'completed': return <Icon name="check-circle" size={20} color="#4CAF50" />;
      case 'error': return <Icon name="error" size={20} color="#F44336" />;
      default: return <Icon name="radio-button-unchecked" size={20} color="#CCCCCC" />;
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'processing': return 'Processing...';
      case 'completed': return 'Completed';
      case 'error': return 'Failed';
      default: return 'Pending';
    }
  };
  
  return (
    <View style={styles.processingCard}>
      <Text style={styles.processingTitle}>Document Processing Status</Text>
      
      <View style={styles.statusList}>
        <View style={styles.statusItem}>
          {getStatusIcon(logbookStatus)}
          <Text style={styles.statusLabel}>Vehicle Logbook</Text>
          <Text style={styles.statusValue}>{getStatusText(logbookStatus)}</Text>
        </View>
        
        <View style={styles.statusItem}>
          {getStatusIcon(nationalIdStatus)}
          <Text style={styles.statusLabel}>National ID</Text>
          <Text style={styles.statusValue}>{getStatusText(nationalIdStatus)}</Text>
        </View>
        
        <View style={styles.statusItem}>
          {getStatusIcon(kraPinStatus)}
          <Text style={styles.statusLabel}>KRA PIN Certificate</Text>
          <Text style={styles.statusValue}>{getStatusText(kraPinStatus)}</Text>
        </View>
      </View>
    </View>
  );
};

// Extracted Data Verification Component
const ExtractedDataVerification = ({ textractResults = {}, onFieldChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedExtraction, setSelectedExtraction] = useState(null);
  
  const extractions = Object.entries(textractResults || {});
  
  if (extractions.length === 0) {
    return (
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Upload documents to see extracted data
        </Text>
      </View>
    );
  }
  
  const viewExtraction = (type, data) => {
    setSelectedExtraction({ type, data });
    setShowModal(true);
  };
  
  return (
    <View style={styles.extractionCard}>
      <Text style={styles.extractionTitle}>Extracted Data</Text>
      
      {extractions.map(([type, result]) => {
        const extractResult = result.extractResult;
        const validationResult = result.validationResult;
        
        return (
          <View key={type} style={styles.extractionItem}>
            <View style={styles.extractionHeader}>
              <Text style={styles.extractionType}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {extractResult.confidence}% confidence
                </Text>
              </View>
            </View>
            
            <View style={styles.extractionPreview}>
              {Object.entries(extractResult.data).slice(0, 3).map(([key, value]) => (
                <Text key={key} style={styles.previewText}>
                  {key}: {value}
                </Text>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => viewExtraction(type, result)}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        );
      })}
      
      {/* Detailed View Modal */}
      <Modal visible={showModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedExtraction?.type} - Extracted Data
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Icon name="close" size={24} color="#646767" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedExtraction && (
              <View>
                <Text style={styles.sectionTitle}>Extracted Information</Text>
                {Object.entries(selectedExtraction.data.extractResult.data).map(([key, value]) => (
                  <View key={key} style={styles.dataRow}>
                    <Text style={styles.dataLabel}>{key}:</Text>
                    <Text style={styles.dataValue}>{value}</Text>
                  </View>
                ))}
                
                <Text style={styles.sectionTitle}>Validation Status</Text>
                <View style={styles.validationStatus}>
                  <Icon 
                    name={selectedExtraction.data.validationResult.valid ? "check-circle" : "error"} 
                    size={24} 
                    color={selectedExtraction.data.validationResult.valid ? "#4CAF50" : "#F44336"} 
                  />
                  <Text style={styles.validationText}>
                    {selectedExtraction.data.validationResult.valid ? "Validation Passed" : "Validation Failed"}
                  </Text>
                </View>
                
                {selectedExtraction.data.validationResult.issues?.map((issue, index) => (
                  <Text key={index} style={styles.issueText}>{issue}</Text>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// Validation Results Component
const ValidationResults = ({ textractResults = {}, formData = {} }) => {
  const allValidations = Object.values(textractResults || {})
    .map(result => result?.validationResult)
    .filter(Boolean);
  
  if (allValidations.length === 0) return null;
  
  const totalValidations = allValidations.length;
  const passedValidations = allValidations.filter(v => v?.valid).length;
  const overallScore = Math.round((passedValidations / totalValidations) * 100);
  
  return (
    <View style={styles.validationCard}>
      <View style={styles.validationHeader}>
        <Text style={styles.validationTitle}>Validation Results</Text>
        <View style={[styles.scoreBadge, { backgroundColor: overallScore >= 80 ? "#4CAF50" : "#FF9800" }]}>
          <Text style={styles.scoreText}>{overallScore}%</Text>
        </View>
      </View>
      
      <Text style={styles.validationSummary}>
        {passedValidations} of {totalValidations} validations passed
      </Text>
      
      {allValidations.map((validation, index) => (
        <View key={index} style={styles.validationItem}>
          <Icon 
            name={validation.valid ? "check-circle" : "error"} 
            size={20} 
            color={validation.valid ? "#4CAF50" : "#F44336"} 
          />
          <View style={styles.validationContent}>
            <Text style={styles.validationLabel}>
              Document {index + 1} - {validation.valid ? "Valid" : "Issues Found"}
            </Text>
            {validation.issues?.map((issue, issueIndex) => (
              <Text key={issueIndex} style={styles.issueText}>{issue}</Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

// Data Comparison Component
const DataComparison = ({ textractResults = {}, formData = {} }) => {
  if (!textractResults || Object.keys(textractResults).length === 0) return null;
  
  // Extract owner names for comparison
  const extractedNames = Object.values(textractResults)
    .map(result => result?.extractResult?.data?.owner_name || result?.extractResult?.data?.name)
    .filter(Boolean);
    
  const inputName = formData?.owner_name;
  
  if (!inputName || extractedNames.length === 0) return null;
  
  // Simple name comparison (would use more sophisticated matching in real implementation)
  const matches = extractedNames.map(name => ({
    extractedName: name,
    similarity: name.toLowerCase() === inputName.toLowerCase() ? 100 : 
                name.toLowerCase().includes(inputName.toLowerCase()) ? 75 : 0
  }));
  
  return (
    <View style={styles.comparisonCard}>
      <Text style={styles.comparisonTitle}>Data Comparison</Text>
      
      <View style={styles.comparisonItem}>
        <Text style={styles.comparisonLabel}>Input Name:</Text>
        <Text style={styles.comparisonValue}>{inputName}</Text>
      </View>
      
      {matches.map((match, index) => (
        <View key={index} style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Extracted Name {index + 1}:</Text>
          <Text style={styles.comparisonValue}>{match.extractedName}</Text>
          <View style={[
            styles.similarityBadge, 
            { backgroundColor: match.similarity >= 90 ? "#4CAF50" : match.similarity >= 70 ? "#FF9800" : "#F44336" }
          ]}>
            <Text style={styles.similarityText}>{match.similarity}% match</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Verification Status Component
const VerificationStatus = ({ dmvicResults, processingStatus = {} }) => {
  const status = processingStatus?.dmvic;
  
  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>DMVIC Verification Status</Text>
      {status === 'completed' && dmvicResults?.vehicleDetails?.success ? (
        <View style={styles.successStatus}>
          <Icon name="verified" size={24} color="#4CAF50" />
          <Text style={styles.successText}>Vehicle details verified successfully</Text>
        </View>
      ) : (
        <View style={styles.pendingStatus}>
          <ActivityIndicator size="small" color="#D5222B" />
          <Text style={styles.pendingText}>Verification in progress...</Text>
        </View>
      )}
    </View>
  );
};

// Verified Details Component
const VerifiedDetails = ({ dmvicResults = {} }) => {
  const vehicleDetails = dmvicResults?.vehicleDetails?.data;
  
  if (!vehicleDetails) return null;
  
  return (
    <View style={styles.detailsCard}>
      <Text style={styles.detailsTitle}>Verified Vehicle Details</Text>
      <View style={styles.detailsContent}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Make:</Text>
          <Text style={styles.detailValue}>{vehicleDetails.make}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Model:</Text>
          <Text style={styles.detailValue}>{vehicleDetails.model}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Year:</Text>
          <Text style={styles.detailValue}>{vehicleDetails.year}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Owner:</Text>
          <Text style={styles.detailValue}>{vehicleDetails.ownerName}</Text>
        </View>
      </View>
    </View>
  );
};

// Date Adjustment Component
const DateAdjustment = ({ formData = {}, dmvicResults = {}, onFieldChange }) => {
  const suggestedDate = formData?.suggested_cover_start_date;
  const existingPolicy = dmvicResults?.policyCheck?.policy;
  
  if (!suggestedDate || !existingPolicy) return null;
  
  return (
    <View style={styles.dateCard}>
      <Text style={styles.dateTitle}>Cover Start Date Options</Text>
      <Text style={styles.dateDescription}>
        We found an existing policy that expires on {existingPolicy.expiryDate}.
        Choose your preferred start date:
      </Text>
      
      <TouchableOpacity 
        style={styles.dateOption}
        onPress={() => onFieldChange('cover_start_date', suggestedDate)}
      >
        <Icon name="radio-button-checked" size={20} color="#D5222B" />
        <View style={styles.dateOptionContent}>
          <Text style={styles.dateOptionTitle}>Recommended: {suggestedDate}</Text>
          <Text style={styles.dateOptionDescription}>Start immediately after current policy expires</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.dateOption}
        onPress={() => onFieldChange('cover_start_date', new Date().toISOString().split('T')[0])}
      >
        <Icon name="radio-button-unchecked" size={20} color="#646767" />
        <View style={styles.dateOptionContent}>
          <Text style={styles.dateOptionTitle}>Today: {new Date().toISOString().split('T')[0]}</Text>
          <Text style={styles.dateOptionDescription}>Start immediately (may overlap with existing policy)</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Manual Override Component
const ManualOverride = ({ textractResults = {}, onFieldChange }) => {
  const [showOverride, setShowOverride] = useState(false);
  
  if (!textractResults || Object.keys(textractResults).length === 0) return null;
  
  return (
    <View style={styles.overrideCard}>
      <TouchableOpacity 
        style={styles.overrideHeader}
        onPress={() => setShowOverride(!showOverride)}
      >
        <Text style={styles.overrideTitle}>Manual Corrections</Text>
        <Icon 
          name={showOverride ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color="#646767" 
        />
      </TouchableOpacity>
      
      {showOverride && (
        <View style={styles.overrideContent}>
          <Text style={styles.overrideDescription}>
            If any extracted information is incorrect, you can manually correct it below:
          </Text>
          
          {/* This would render editable fields for manual correction */}
          <TouchableOpacity style={styles.overrideButton}>
            <Text style={styles.overrideButtonText}>Enable Manual Entry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base card styles
  infoCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6C757D'
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    flexDirection: 'row',
    alignItems: 'center'
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  errorCard: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  // Text styles
  infoText: {
    color: '#6C757D',
    fontSize: 14
  },
  statusText: {
    marginLeft: 12,
    color: '#333333',
    fontSize: 14
  },
  errorText: {
    marginLeft: 12,
    color: '#F44336',
    fontSize: 14
  },
  
  // Result styles
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  resultTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333'
  },
  policyDetails: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 6
  },
  policyText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 8
  },
  
  // Premium styles
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8
  },
  pricingText: {
    marginLeft: 12,
    color: '#333333'
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D5222B'
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  premiumLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333'
  },
  premiumAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D5222B',
    marginBottom: 16
  },
  premiumBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 12
  },
  
  // Breakdown styles
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333'
  },
  detailedBreakdown: {
    padding: 16,
    paddingTop: 0
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#646767'
  },
  breakdownValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500'
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 12
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333'
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D5222B'
  },
  
  // Badge styles
  confidenceBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  confidenceText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600'
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  scoreText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  similarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8
  },
  similarityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  
  // Processing styles
  processingCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16
  },
  statusList: {
    gap: 12
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333333'
  },
  statusValue: {
    fontSize: 14,
    color: '#646767'
  },
  
  // Extraction styles
  extractionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  extractionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16
  },
  extractionItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA'
  },
  extractionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  extractionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333'
  },
  extractionPreview: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12
  },
  previewText: {
    fontSize: 12,
    color: '#646767',
    marginBottom: 2
  },
  viewButton: {
    backgroundColor: '#D5222B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333'
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
    marginBottom: 12
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  dataLabel: {
    fontSize: 14,
    color: '#646767',
    width: 120
  },
  dataValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1
  },
  
  // Validation styles
  validationCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  validationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333'
  },
  validationSummary: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 16
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  validationContent: {
    marginLeft: 12,
    flex: 1
  },
  validationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4
  },
  issueText: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 2
  },
  validationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  validationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333'
  },
  
  // Comparison styles
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA'
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#646767',
    width: 120
  },
  comparisonValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
    marginRight: 8
  },
  
  // Details styles
  detailsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16
  },
  detailsContent: {
    gap: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#646767'
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500'
  },
  
  // Date styles
  dateCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8
  },
  dateDescription: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 16
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6
  },
  dateOptionContent: {
    marginLeft: 12,
    flex: 1
  },
  dateOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2
  },
  dateOptionDescription: {
    fontSize: 12,
    color: '#646767'
  },
  
  // Override styles
  overrideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  overrideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  overrideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333'
  },
  overrideContent: {
    padding: 16,
    paddingTop: 0
  },
  overrideDescription: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 16
  },
  overrideButton: {
    backgroundColor: '#6C757D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  overrideButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  
  // Success/pending status styles
  successStatus: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  successText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500'
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pendingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#646767'
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12
  }
});

export default ServiceComponents;