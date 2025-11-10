import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Alert, ActivityIndicator, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMotorInsurance } from '../../../../../contexts/MotorInsuranceContext';
import DjangoAPIService from '../../../../../services/DjangoAPIService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PolicySuccess({ route }) {
  const navigation = useNavigation();
  const { actions } = useMotorInsurance();
  const { policyNumber, policyId, pdfUrl, message, dmvicCertificate } = route?.params || {};
  
  // State for certificate download
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [certificateDownloaded, setCertificateDownloaded] = useState(false);

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
                {dmvicCertificate.status === 'ACTIVE' ? '🏆' : 
                 dmvicCertificate.status === 'PENDING' ? '⏳' : '⚠️'}
              </Text>
              <Text style={styles.certificateTitle}>DMVIC Certificate</Text>
            </View>
            
            {dmvicCertificate.status === 'ACTIVE' && dmvicCertificate.certificateNumber ? (
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

                {/* Download Certificate Button */}
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
                      <Text style={styles.downloadCertificateButtonText}>Downloading...</Text>
                    </>
                  ) : certificateDownloaded ? (
                    <Text style={styles.downloadCertificateButtonText}>✓ Downloaded</Text>
                  ) : (
                    <Text style={styles.downloadCertificateButtonText}>📥 Download Certificate</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.pendingCertificateInfo}>
                <Text style={styles.pendingIcon}>⏳</Text>
                <Text style={styles.pendingText}>
                  {dmvicCertificate.error || 'DMVIC certificate issuance is in progress.'}
                </Text>
                {dmvicCertificate.action_required && (
                  <Text style={styles.pendingAction}>{dmvicCertificate.action_required}</Text>
                )}
                <Text style={styles.pendingNote}>
                  Your policy is active. The certificate will be available shortly.
                </Text>
                
                {/* Retry Certificate Button */}
                <TouchableOpacity 
                  style={styles.retryCertificateButton}
                  onPress={handleRetryCertificate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryCertificateButtonText}>🔄 Retry Certificate Issuance</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d4edda',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 48,
    color: '#28a745',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  policyNumberContainer: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#D5222B',
  },
  policyNumberLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  policyNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D5222B',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  certificateContainer: {
    backgroundColor: '#F0F8F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#28A745',
  },
  certificateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  certificateIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28A745',
  },
  certificateDetails: {
    marginBottom: 16,
  },
  certificateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  certificateLabel: {
    fontSize: 14,
    color: '#646767',
    fontWeight: '600',
  },
  certificateValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
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
    opacity: 0.6,
  },
  downloadCertificateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pendingCertificateCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  pendingIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  pendingAction: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#D5222B',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#D5222B',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D5222B',
  },
  secondaryButtonText: {
    color: '#D5222B',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6c757d',
  },
  tertiaryButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  footerNote: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  pendingCertificateInfo: {
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  pendingIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  pendingAction: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
  pendingNote: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  retryCertificateButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  retryCertificateButtonText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
  },
});
