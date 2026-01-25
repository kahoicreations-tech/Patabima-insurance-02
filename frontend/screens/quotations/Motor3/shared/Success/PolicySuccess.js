import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Alert, ActivityIndicator, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMotorInsurance } from '../../../../../contexts/MotorInsuranceContext';
import DjangoAPIService from '../../../../../services/DjangoAPIService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDmvicErrorMessage, formatDmvicErrorForLogging, parseDmvicError, getDmvicErrorStyle } from '../../../../../utils/dmvicErrorHandler';

export default function PolicySuccess({ route }) {
  const navigation = useNavigation();
  const { actions } = useMotorInsurance();
  const { policyNumber, policyId, pdfUrl, message, dmvicCertificate, warning, testModeWarning } = route?.params || {};
  
  // State for certificate download
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [certificateDownloaded, setCertificateDownloaded] = useState(false);

  // Extract preview URL and status from dmvicCertificate
  const previewUrl = dmvicCertificate?.previewUrl || dmvicCertificate?.dmvicCertificatePreviewUrl;
  const dmvicStatus = dmvicCertificate?.dmvicStatus || dmvicCertificate?.status;
  const isTestMode = testModeWarning?.isTestMode || dmvicStatus?.includes('TEST_MODE');

  // Clean up flow state when user navigates away from success screen
  // This handles back button, hardware back, or any other navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (actions?.resetFlow) {
        actions.resetFlow();
        console.log('✅ Motor 2 cache cleared when leaving success screen');
      }
    });

    return unsubscribe;
  }, [navigation, actions]);

  // Show warning toast if backend provided one (e.g., certificate pending)
  useEffect(() => {
    if (warning && warning.message && warning.showToast) {
      Alert.alert(
        warning.type === 'CERTIFICATE_PENDING' ? '⚠️ Certificate Pending' : '⚠️ Notice',
        warning.message,
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [warning]);

  // Show TEST MODE warning if in test environment
  useEffect(() => {
    if (testModeWarning && testModeWarning.showToast) {
      setTimeout(() => {
        Alert.alert(
          '⚠️ TEST ENVIRONMENT',
          testModeWarning.message + '\n\n' + 
          (testModeWarning.dmvicError ? `DMVIC Error: ${testModeWarning.dmvicError}\n\n` : '') +
          testModeWarning.productionBehavior,
          [{ text: 'I Understand', style: 'default' }]
        );
      }, 1000);
    }
  }, [testModeWarning]);

  // Clear cache when user navigates away to ensure fresh start for next policy
  // Do NOT clear on mount - let user see success screen first
  const resetFlowAndNavigate = (navigationAction) => {
    // Reset will be handled by beforeRemove listener
    // Just execute the navigation action
    navigationAction();
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Your motor insurance policy has been created successfully!\n\nPolicy Number: ${policyNumber}\n\nThank you for choosing PataBima.`;
      
      await Share.share({
        message: shareMessage,
        title: 'Motor Insurance Policy',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleViewPolicies = () => {
    // Navigate to Quotations tab to view all quotes/policies
    resetFlowAndNavigate(() => {
      navigation.navigate('MainTabs', { 
        screen: 'Quotations' 
      });
    });
  };

  const handleNewQuote = () => {
    // Navigate to Motor2Flow to create a new quote
    resetFlowAndNavigate(() => {
      navigation.navigate('Motor2Flow');
    });
  };

  const handleBackToHome = () => {
    // Navigate to Home tab in MainTabs
    resetFlowAndNavigate(() => {
      navigation.navigate('MainTabs', { 
        screen: 'Home' 
      });
    });
  };

  const handleRetryCertificate = async () => {
    if (!policyId) {
      Alert.alert('Error', 'Policy information not available');
      return;
    }

    Alert.alert(
      'Retry Certificate Issuance',
      'This will request DMVIC to issue the certificate for this policy. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: async () => {
            try {
              const djangoAPI = DjangoAPIService;
              await djangoAPI.initialize();

              const response = await djangoAPI.makeRequest(
                '/api/insurance/dmvic/issue-certificate/',
                {
                  method: 'POST',
                  body: JSON.stringify({ policy_id: policyId })
                }
              );

              if (response.success) {
                Alert.alert(
                  '✅ Success',
                  `Certificate issued successfully!\n\nCertificate No: ${response.certificate_number}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Refresh the screen
                        navigation.replace('PolicySuccess', {
                          policyNumber,
                          policyId,
                          pdfUrl,
                          message,
                          dmvicCertificate: {
                            certificateNumber: response.certificate_number,
                            transactionNo: response.transaction_no,
                            certificateType: response.certificate_type,
                            status: 'ACTIVE'
                          }
                        });
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Failed', response.message || 'Certificate issuance failed');
              }
            } catch (error) {
              Alert.alert(
                'Error',
                error.message || 'Failed to retry certificate issuance. Please contact support.'
              );
            }
          }
        }
      ]
    );
  };

  const handleDownloadCertificate = async () => {
    if (!policyId && !dmvicCertificate?.certificateNumber) {
      Alert.alert('Error', 'Certificate information not available');
      return;
    }

    setDownloadingCertificate(true);

    try {
      console.log('[PolicySuccess] Downloading DMVIC certificate...');
      const djangoAPI = DjangoAPIService;
      await djangoAPI.initialize();

      // Call get-certificate-pdf endpoint
      const response = await djangoAPI.makeRequest(
        djangoAPI.API_CONFIG.ENDPOINTS.DMVIC.GET_CERTIFICATE_PDF,
        {
          method: 'POST',
          body: JSON.stringify({
            policy_id: policyId,
            certificate_number: dmvicCertificate?.certificateNumber
          })
        }
      );

      if (response.success && response.pdf_data) {
        // Save PDF to device
        const filename = response.filename || `DMVIC_${dmvicCertificate?.certificateNumber}.pdf`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        // Decode base64 and write to file
        await FileSystem.writeAsStringAsync(fileUri, response.pdf_data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log('[PolicySuccess] Certificate saved to:', fileUri);
        setCertificateDownloaded(true);

        // Share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'DMVIC Certificate',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert(
            'Certificate Downloaded',
            `Certificate saved successfully to ${filename}`,
            [{ text: 'OK' }]
          );
        }
      } else if (response.pdf_url) {
        // If only URL is available, open in browser
        const canOpen = await Linking.canOpenURL(response.pdf_url);
        if (canOpen) {
          await Linking.openURL(response.pdf_url);
        } else {
          Alert.alert('Error', 'Unable to open certificate URL');
        }
      } else {
        throw new Error(response.user_message || 'Certificate download failed');
      }
    } catch (error) {
      console.error('[PolicySuccess] Certificate download failed:', error);
      
      // Show user-friendly error message
      const errorMessage = error.user_message || error.message || 'Unable to download certificate at this time';
      const actionRequired = error.action_required || 'Please try again later or contact support';
      
      Alert.alert(
        'Certificate Download Failed',
        `${errorMessage}\n\n${actionRequired}`,
        [
          { text: 'Retry', onPress: handleDownloadCertificate },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setDownloadingCertificate(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.successCard}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Policy Created Successfully!</Text>
        
        {/* TEST MODE Banner - Show prominently at top */}
        {isTestMode && (
          <View style={styles.testModeBanner}>
            <Text style={styles.testModeIcon}>🧪</Text>
            <Text style={styles.testModeTitle}>TEST ENVIRONMENT</Text>
            <Text style={styles.testModeText}>
              This policy was created in a test environment. In production, an official DMVIC certificate is required.
            </Text>
          </View>
        )}
        
        {/* Policy Number */}
        <View style={styles.policyNumberContainer}>
          <Text style={styles.policyNumberLabel}>Policy Number</Text>
          <Text style={styles.policyNumber}>{policyNumber || 'N/A'}</Text>
        </View>

        {/* DMVIC Certificate Section */}
        {dmvicCertificate && (
          <View style={styles.certificateContainer}>
            <View style={styles.certificateHeader}>
              <Text style={styles.certificateIcon}>
                {dmvicStatus === 'ISSUED' || dmvicCertificate.status === 'ACTIVE' ? '🏆' : 
                 dmvicStatus === 'PREVIEW_GENERATED' ? '🔍' :
                 dmvicStatus === 'PENDING' || dmvicCertificate.status === 'PENDING' ? '⏳' : 
                 dmvicStatus === 'NO_INVENTORY' ? '📦' : '⚠️'}
              </Text>
              <Text style={styles.certificateTitle}>DMVIC Certificate</Text>
            </View>
            
            {/* DMVIC Source Note */}
            <View style={styles.dmvicSourceNote}>
              <Text style={styles.dmvicSourceText}>
                Official certificate from Department of Motor Vehicle Insurance Control
              </Text>
            </View>
            
            {/* Preview Available - Show Preview Button */}
            {dmvicStatus === 'PREVIEW_GENERATED' && previewUrl && !dmvicCertificate.certificateNumber && (
              <>
                <View style={styles.previewAvailableInfo}>
                  <Text style={styles.previewAvailableTitle}>✅ Certificate Preview Ready</Text>
                  <Text style={styles.previewAvailableText}>
                    Your DMVIC certificate preview has been generated successfully. You can view it now while we process the final certificate issuance.
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.previewButton}
                  onPress={() => {
                    const { Linking } = require('react-native');
                    Linking.openURL(previewUrl).catch(err => {
                      Alert.alert('Error', 'Unable to open certificate preview. The link may have expired.');
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.previewButtonText}>🔍 View Certificate Preview</Text>
                </TouchableOpacity>
                
                {dmvicCertificate.certificateType && (
                  <View style={styles.certificateDetails}>
                    <View style={styles.certificateRow}>
                      <Text style={styles.certificateLabel}>Certificate Type:</Text>
                      <Text style={styles.certificateValue}>Type {dmvicCertificate.certificateType}</Text>
                    </View>
                    <View style={styles.certificateRow}>
                      <Text style={styles.certificateLabel}>Status:</Text>
                      <Text style={[styles.certificateValue, styles.previewStatus]}>Preview Generated</Text>
                    </View>
                  </View>
                )}
              </>
            )}
            
            {/* Certificate Issued - Show Full Details */}
            {(dmvicStatus === 'ISSUED' || dmvicCertificate.status === 'ACTIVE') && dmvicCertificate.certificateNumber ? (
              <>
                <View style={styles.certificateDetails}>
                  <View style={styles.certificateRow}>
                    <Text style={styles.certificateLabel}>Certificate No:</Text>
                    <Text style={styles.certificateValue}>{dmvicCertificate.certificateNumber}</Text>
                  </View>
                  
                  {dmvicCertificate.certificateType && (
                    <View style={styles.certificateRow}>
                      <Text style={styles.certificateLabel}>Type:</Text>
                      <Text style={styles.certificateValue}>Type {dmvicCertificate.certificateType}</Text>
                    </View>
                  )}
                  
                  {dmvicCertificate.transactionNo && (
                    <View style={styles.certificateRow}>
                      <Text style={styles.certificateLabel}>Transaction:</Text>
                      <Text style={styles.certificateValue}>{dmvicCertificate.transactionNo}</Text>
                    </View>
                  )}
                  
                  {dmvicCertificate.status && (
                    <View style={styles.certificateRow}>
                      <Text style={styles.certificateLabel}>Status:</Text>
                      <Text style={[styles.certificateValue, styles.activeStatus]}>
                        {dmvicCertificate.status}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Download DMVIC Certificate Button */}
                <TouchableOpacity 
                  style={[
                    styles.downloadCertificateButton,
                    (downloadingCertificate || certificateDownloaded) && styles.downloadCertificateButtonDisabled
                  ]}
                  onPress={handleDownloadCertificate}
                  disabled={downloadingCertificate || certificateDownloaded}
                  activeOpacity={0.8}
                >
                  {downloadingCertificate ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.downloadCertificateButtonText}>Downloading from DMVIC...</Text>
                    </>
                  ) : certificateDownloaded ? (
                    <Text style={styles.downloadCertificateButtonText}>✓ Downloaded</Text>
                  ) : (
                    <Text style={styles.downloadCertificateButtonText}>📥 Download DMVIC Certificate</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : dmvicStatus === 'NO_INVENTORY' ? (
              <View style={styles.pendingCertificateInfo}>
                <Text style={styles.pendingIcon}>📦</Text>
                <Text style={styles.noInventoryTitle}>DMVIC Inventory Pending</Text>
                <Text style={styles.noInventoryText}>
                  Your policy is active, but DMVIC certificate issuance requires sticker inventory allocation.
                </Text>
                <View style={styles.uatErrorInfoBox}>
                  <Text style={styles.uatErrorInfoTitle}>📋 What this means:</Text>
                  <Text style={styles.uatErrorInfoText}>
                    • Your policy is valid and active{'\n'}
                    • Certificate preview is available above{'\n'}
                    • Final certificate pending DMVIC inventory{'\n'}
                    • No action required from you
                  </Text>
                </View>
                {previewUrl && (
                  <TouchableOpacity 
                    style={styles.previewButton}
                    onPress={() => {
                      const { Linking } = require('react-native');
                      Linking.openURL(previewUrl).catch(err => {
                        Alert.alert('Error', 'Unable to open certificate preview');
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.previewButtonText}>🔍 View Preview Instead</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.pendingCertificateInfo}>
                <Text style={styles.pendingIcon}>
                  {dmvicCertificate.status === 'UAT_ERROR' || dmvicCertificate.error ? '⚠️' : '⏳'}
                </Text>
                
                {/* Check for UAT/System issues */}
                {dmvicCertificate.status === 'UAT_ERROR' || 
                 (dmvicCertificate.error && dmvicCertificate.error.includes('UAT')) ? (
                  <>
                    <Text style={styles.uatErrorTitle}>DMVIC UAT Environment Issue</Text>
                    <Text style={styles.uatErrorText}>
                      {dmvicCertificate.error || 
                       'The DMVIC UAT testing environment is currently unavailable. This is expected in test mode.'}
                    </Text>
                    <View style={styles.uatErrorInfoBox}>
                      <Text style={styles.uatErrorInfoTitle}>📋 What this means:</Text>
                      <Text style={styles.uatErrorInfoText}>
                        • Your policy is valid and active{'\n'}
                        • Certificate will be issued in production{'\n'}
                        • This only affects test/UAT environment{'\n'}
                        • No action required from you
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.pendingText}>
                      {dmvicCertificate.error || 'DMVIC certificate issuance is in progress.'}
                    </Text>
                    {dmvicCertificate.action_required && (
                      <Text style={styles.pendingAction}>{dmvicCertificate.action_required}</Text>
                    )}
                    <Text style={styles.pendingNote}>
                      Your policy is active. The DMVIC certificate will be available shortly.
                    </Text>
                  </>
                )}
                
                {/* Retry Certificate Button */}
                <TouchableOpacity 
                  style={styles.retryCertificateButton}
                  onPress={handleRetryCertificate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryCertificateButtonText}>🔄 Retry DMVIC Certificate</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Your motor insurance policy has been created and is now active.
          </Text>
          <Text style={styles.infoText}>
            You can view your policy details in the Policies section.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Share Policy */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>📤 Share Policy</Text>
          </TouchableOpacity>

          {/* View Policies */}
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleViewPolicies}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>📋 View All Policies</Text>
          </TouchableOpacity>

          {/* New Quote */}
          <TouchableOpacity 
            style={styles.tertiaryButton} 
            onPress={handleNewQuote}
            activeOpacity={0.8}
          >
            <Text style={styles.tertiaryButtonText}>➕ Create New Quote</Text>
          </TouchableOpacity>

          {/* Back to Home */}
          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={handleBackToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.linkButtonText}>🏠 Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          Thank you for choosing PataBima for your insurance needs.
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
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#d4edda',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 40,
    color: '#28a745',
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  certificateContainer: {
    backgroundColor: '#F0F8F5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#28A745',
  },
  certificateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  certificateIcon: {
    fontSize: 22,
    marginRight: 6,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28A745',
    fontFamily: 'Poppins-Bold',
  },
  dmvicSourceNote: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#28A745',
  },
  dmvicSourceText: {
    fontSize: 11,
    color: '#2E7D32',
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    lineHeight: 15,
  },
  certificateDetails: {
    marginBottom: 12,
  },
  certificateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  certificateLabel: {
    fontSize: 12,
    color: '#646767',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  certificateValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
  },
  activeStatus: {
    color: '#28A745',
  },
  downloadCertificateButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadCertificateButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  downloadCertificateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
  },
  pendingCertificateCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  pendingIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  pendingText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: 'Poppins-Regular',
  },
  pendingAction: {
    fontSize: 11,
    color: '#856404',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Poppins-Italic',
  },
  actionsContainer: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#D5222B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#D5222B',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D5222B',
  },
  secondaryButtonText: {
    color: '#D5222B',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  tertiaryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6c757d',
  },
  tertiaryButtonText: {
    color: '#6c757d',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  footerNote: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  pendingCertificateInfo: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  pendingNote: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    fontFamily: 'Poppins-Italic',
  },
  retryCertificateButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  retryCertificateButtonText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  // UAT Error Styles
  uatErrorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  uatErrorText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
  },
  uatErrorInfoBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  uatErrorInfoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 6,
    fontFamily: 'Poppins-Bold',
  },
  uatErrorInfoText: {
    fontSize: 11,
    color: '#856404',
    lineHeight: 17,
    fontFamily: 'Poppins-Regular',
  },
  // Preview Styles
  previewAvailableInfo: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  previewAvailableTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  previewAvailableText: {
    fontSize: 12,
    color: '#1B5E20',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  previewButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  previewStatus: {
    color: '#4CAF50',
  },
  noInventoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  noInventoryText: {
    fontSize: 12,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
  },
  
  // Test Mode Banner Styles
  testModeBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#FF9800',
    borderStyle: 'dashed',
  },
  testModeIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  testModeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
  },
  testModeText: {
    fontSize: 13,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
});
