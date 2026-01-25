/**
 * Step 8: Submission
 * Final submission to backend and success display
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThirdParty } from '../../contexts/ThirdPartyContext';
import { useMotor3 } from '../../contexts/Motor3Context';
import DjangoAPIService from '../../../../../services/DjangoAPIService';

const SUBMISSION_PHASES = {
  IDLE: 'IDLE',
  CREATING: 'CREATING',
  ACTIVATING: 'ACTIVATING',
  DONE: 'DONE',
  ERROR: 'ERROR',
};

const Step8_Submission = ({ goToStep }) => {
  const navigation = useNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [policyNumber, setPolicyNumber] = useState(null);
  const [quotationId, setQuotationId] = useState(null);
  const [bellStatus, setBellStatus] = useState('');
  const [documents, setDocuments] = useState(null);
  const [phase, setPhase] = useState(SUBMISSION_PHASES.IDLE);
  const [downloadingDoc, setDownloadingDoc] = useState(null);

  const { formData, selectedUnderwriter } = useThirdParty();
  const { clientDetails, uploadedDocuments, paymentDetails, selectedSubcategory, setSubmissionResult } = useMotor3();

  const submitQuote = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    setBellStatus('Saving quotation...');
    setDocuments(null);
    setPhase(SUBMISSION_PHASES.CREATING);

    try {
      const api = DjangoAPIService.getInstance();

      const underwriter = selectedUnderwriter || {};
      const bd = underwriter?.premium_breakdown || underwriter?.breakdown || {};
      const extendibleConfig = underwriter?.extendible_config || underwriter?.extendibleConfig || null;
      const isExtendible = Boolean(
        (selectedSubcategory?.subcategory_code && String(selectedSubcategory.subcategory_code).toUpperCase().includes('EXT')) ||
        extendibleConfig
      );
      const base = Number(bd.base_premium ?? bd.base ?? underwriter.base_premium ?? 0);
      const itl = Number(bd.training_levy ?? bd.itl ?? (base * 0.0025));
      const pcf = Number(bd.pcf_levy ?? bd.pcf ?? (base * 0.0025));
      const stamp = Number(bd.stamp_duty ?? 40);
      const total = Number(underwriter.total_premium ?? bd.total_premium ?? (base + itl + pcf + stamp));

      // Transform clientDetails from snake_case context to camelCase backend schema
      const transformedClientDetails = {
        fullName: `${clientDetails?.first_name || ''} ${clientDetails?.last_name || ''}`.trim() || clientDetails?.fullName || 'N/A',
        phone: clientDetails?.phone || '',
        email: clientDetails?.email || '',
        idNumber: clientDetails?.id_number || clientDetails?.idNumber || '',
        kraPin: clientDetails?.kra_pin || clientDetails?.kraPin || '',
        address: clientDetails?.address || '',
      };

      const vehicleDetails = {
        ...formData,
        registration: formData?.registration || formData?.registrationNumber,
        make: formData?.make,
        model: formData?.model,
        year: formData?.year,
        coverStartDate: formData?.coverStartDate || formData?.cover_start_date,
      };

      const productDetails = {
        category: selectedSubcategory?.category || selectedSubcategory?.category_code,
        subcategory: selectedSubcategory?.subcategory_code,
        coverageType: 'THIRD_PARTY',
      };

      const createPayload = {
        quoteId: null,
        clientDetails: transformedClientDetails,
        vehicleDetails,
        productDetails,
        underwriterDetails: {
          name: underwriter?.name || underwriter?.underwriter_name,
          code: underwriter?.code || underwriter?.underwriter_code,
        },
        premiumBreakdown: {
          base_premium: base,
          training_levy: itl,
          pcf_levy: pcf,
          stamp_duty: stamp,
          total_amount: total,
          ...(isExtendible && extendibleConfig ? { extendible_config: extendibleConfig } : {}),
        },
        paymentDetails: {
          ...(paymentDetails || {}),
          method: paymentDetails?.method || paymentDetails?.payment_method || 'MPESA',
          // For extendible products we only collect the initial installment here.
          amount: paymentDetails?.amount ?? (isExtendible && extendibleConfig ? extendibleConfig.initial_amount : total),
          status: paymentDetails?.status || 'SUCCESS',
          transaction_id: paymentDetails?.transaction_id || paymentDetails?.transactionId,
        },
        documents: uploadedDocuments || [],
      };

      if (isExtendible && !extendibleConfig) {
        console.warn('[Step8_Submission] Extendible product detected but extendible_config missing from underwriter');
      }

      // Option 1: Persist Motor3 quotation first
      const quotationRes = await api.makeRequest('/api/motor3/quotations/third-party/', {
        method: 'POST',
        body: JSON.stringify(createPayload),
      });

      const quotationId = quotationRes?.quotation?.id;
      if (!quotationId) {
        throw new Error('Quotation creation failed (missing quotation id)');
      }
      setQuotationId(quotationId);

      setBellStatus('Converting quotation to policy...');
      setPhase(SUBMISSION_PHASES.ACTIVATING);

      const converted = await api.makeRequest(`/api/motor3/quotations/${quotationId}/convert/`, {
        method: 'POST',
        timeoutMs: 120000,
        body: JSON.stringify({
          paymentDetails: createPayload.paymentDetails,
        }),
      });

      const convertedPolicyNumber = converted?.policyNumber;
      if (!convertedPolicyNumber) {
        throw new Error('Conversion failed (missing policyNumber)');
      }

      setPolicyNumber(convertedPolicyNumber);
      setDocuments(converted?.documents || converted?.activated?.documents || null);
      setBellStatus('Certificate & documents ready');
      setSubmissionResult({ quotation: quotationRes, converted });
      setSuccess(true);
      setPhase(SUBMISSION_PHASES.DONE);
    } catch (err) {
      console.error('[Step8_Submission] Error:', err);
      const payload = err?.payload;
      setError(
        payload?.user_message ||
          payload?.message ||
          payload?.error ||
          err.message ||
          'Failed to submit quote'
      );
      setPhase(SUBMISSION_PHASES.ERROR);
    } finally {
      setSubmitting(false);
    }
  }, [formData, selectedUnderwriter, clientDetails, uploadedDocuments, paymentDetails, selectedSubcategory, setSubmissionResult]);

  const progressItems = useMemo(() => {
    const createdDone = phase === SUBMISSION_PHASES.ACTIVATING || phase === SUBMISSION_PHASES.DONE;
    const activatingActive = phase === SUBMISSION_PHASES.ACTIVATING;
    const activatingDone = phase === SUBMISSION_PHASES.DONE;
    const doneActive = phase === SUBMISSION_PHASES.DONE;
    return [
      {
        key: 'create',
        label: 'Create policy',
        done: createdDone,
        active: phase === SUBMISSION_PHASES.CREATING,
      },
      {
        key: 'activate',
        label: 'Activate policy + issue certificate',
        done: activatingDone,
        active: activatingActive,
      },
      {
        key: 'docs',
        label: 'Prepare documents',
        done: doneActive,
        active: false,
      },
    ];
  }, [phase]);

  const showBottomHint = submitting && phase === SUBMISSION_PHASES.ACTIVATING;

  const downloadAndOpenPdf = useCallback(
    async (docType) => {
      const api = DjangoAPIService.getInstance();

      const titleByType = {
        quote: 'Quotation PDF',
        policy: 'Policy PDF',
        receipt: 'Receipt PDF',
        dmvic: 'DMVIC Certificate',
      };

      setDownloadingDoc(docType);
      setBellStatus(`Downloading ${titleByType[docType]}...`);

      try {
        let result = null;
        if (docType === 'quote') {
          if (!quotationId) {
            Alert.alert('Error', 'Quotation id not available');
            return;
          }
          result = await api.downloadAndShareMotor3QuotationPdf(quotationId, {
            timeoutMs: 60000,
            dialogTitle: titleByType[docType],
          });
        } else {
          if (!policyNumber) {
            Alert.alert('Error', 'Policy number not available');
            return;
          }
          result = await api.downloadAndShareMotorPolicyDocument(policyNumber, docType, {
            timeoutMs: 60000,
            dialogTitle: titleByType[docType],
          });
        }

        if (!result?.shared) {
          Alert.alert('Downloaded', `${titleByType[docType]} saved as ${result?.filename || 'document.pdf'}`);
        }
      } catch (e) {
        const payload = e?.payload;
        const message = payload?.user_message || payload?.message || payload?.error || e?.message || 'Download failed';
        Alert.alert('Download failed', message);
      } finally {
        setDownloadingDoc(null);
        setBellStatus('Certificate & documents ready');
      }
    },
    [policyNumber]
  );

  // Auto-submit on mount
  useEffect(() => {
    submitQuote();
  }, [submitQuote]);

  if (submitting) {
    return (
      <View style={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Submitting</Text>
          {!!bellStatus && <Text style={styles.bannerText}>{bellStatus}</Text>}
        </View>

        <View style={styles.content}>
          <ActivityIndicator size="large" color="#D5222B" />
          <Text style={styles.loadingText}>Please wait…</Text>
          <Text style={styles.loadingSubtext}>
            This can take up to 2 minutes depending on certificate issuance.
          </Text>

          <View style={styles.progressCard}>
            {progressItems.map((item) => (
              <View key={item.key} style={styles.progressRow}>
                <Text
                  style={[
                    styles.progressIcon,
                    item.done ? styles.progressIconDone : item.active ? styles.progressIconActive : null,
                  ]}
                >
                  {item.done ? '✓' : item.active ? '•' : '○'}
                </Text>
                <Text
                  style={[
                    styles.progressText,
                    item.done ? styles.progressTextDone : item.active ? styles.progressTextActive : null,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {showBottomHint && (
          <View style={styles.snackbar}>
            <Text style={styles.snackbarText}>
              Generating certificate… keep the app open.
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerTitle}>Submission Failed</Text>
          {!!bellStatus && <Text style={styles.bannerText}>Last step: {bellStatus}</Text>}
        </View>

        <View style={styles.content}>
          <View style={styles.messageCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>

          <TouchableOpacity style={styles.retryButton} onPress={submitQuote}>
            <Text style={styles.retryButtonText}>Retry Submission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => goToStep(6)}>
            <Text style={styles.backButtonText}>Back to Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (success) {
    // Check for DMVIC certificate preview URL from new Intermediary Integration
    const hasPreviewUrl = !!documents?.dmvicCertificatePreviewUrl;
    const hasCertificatePdf = !!documents?.dmvicCertificatePdfUrl;

    return (
      <View style={styles.container}>
        <View style={[styles.banner, styles.bannerSuccess]}>
          <Text style={styles.bannerTitle}>Policy Activated</Text>
          <View style={styles.bannerRow}>
            {!!policyNumber && <Text style={styles.bannerText}>Policy #{policyNumber}</Text>}
          </View>
          {!!bellStatus && <Text style={styles.bannerText}>{bellStatus}</Text>}
        </View>

        <View style={styles.content}>
          <Text style={styles.successMessage}>Your cover is active and documents are ready.</Text>

          {!!quotationId && (
            <TouchableOpacity
              style={[styles.linkButton, downloadingDoc ? styles.linkButtonDisabled : null]}
              disabled={!!downloadingDoc}
              onPress={() => downloadAndOpenPdf('quote')}
            >
              <Text style={styles.linkButtonText}>Open Quote PDF</Text>
            </TouchableOpacity>
          )}

          {!!documents?.policyPdfUrl && (
            <TouchableOpacity
              style={[styles.linkButton, downloadingDoc ? styles.linkButtonDisabled : null]}
              disabled={!!downloadingDoc}
              onPress={() => downloadAndOpenPdf('policy')}
            >
              <Text style={styles.linkButtonText}>Open Policy PDF</Text>
            </TouchableOpacity>
          )}
          {!!documents?.receiptUrl && (
            <TouchableOpacity
              style={[styles.linkButton, downloadingDoc ? styles.linkButtonDisabled : null]}
              disabled={!!downloadingDoc}
              onPress={() => downloadAndOpenPdf('receipt')}
            >
              <Text style={styles.linkButtonText}>Open Receipt</Text>
            </TouchableOpacity>
          )}
          
          {/* DMVIC Certificate Preview (Intermediary Integration) */}
          {hasPreviewUrl && (
            <TouchableOpacity
              style={[styles.linkButton, styles.linkButtonPreview, downloadingDoc ? styles.linkButtonDisabled : null]}
              disabled={!!downloadingDoc}
              onPress={() => {
                if (documents.dmvicCertificatePreviewUrl) {
                  // Open preview URL directly in browser (Azure Blob URL)
                  const { Linking } = require('react-native');
                  Linking.openURL(documents.dmvicCertificatePreviewUrl).catch(err => {
                    Alert.alert('Error', 'Unable to open certificate preview');
                  });
                }
              }}
            >
              <Text style={styles.linkButtonText}>🔍 View DMVIC Certificate Preview</Text>
            </TouchableOpacity>
          )}
          
          {/* DMVIC Certificate PDF (if issued) */}
          {hasCertificatePdf && (
            <TouchableOpacity
              style={[styles.linkButton, downloadingDoc ? styles.linkButtonDisabled : null]}
              disabled={!!downloadingDoc}
              onPress={() => downloadAndOpenPdf('dmvic')}
            >
              <Text style={styles.linkButtonText}>Open DMVIC Certificate</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.secondaryButton, downloadingDoc ? styles.linkButtonDisabled : null]}
            disabled={!!downloadingDoc}
            onPress={() => {
              try {
                navigation.navigate('MainTabs', {
                  screen: 'Quotations',
                  params: {
                    forceRefresh: true,
                    justSubmitted: true,
                    focusId: quotationId || undefined,
                    message: 'Motor policy activated',
                  },
                });
              } catch {
                // Fallback (older nav structure)
                try { navigation.navigate('Quotations', { forceRefresh: true }); } catch {}
              }
            }}
          >
            <Text style={styles.secondaryButtonText}>Go to Quotations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, downloadingDoc ? styles.linkButtonDisabled : null]}
            disabled={!!downloadingDoc}
            onPress={() => {
              try {
                navigation.navigate('MainTabs', { screen: 'Home' });
              } catch {
                try { navigation.navigate('Home'); } catch {}
              }
            }}
          >
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, downloadingDoc ? styles.linkButtonDisabled : null]}
            disabled={!!downloadingDoc}
            onPress={() => {
              try {
                navigation.navigate('MainTabs', { screen: 'Upcoming' });
              } catch {
                try { navigation.navigate('Upcoming'); } catch {}
              }
            }}
          >
            <Text style={styles.secondaryButtonText}>View Upcoming</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

export default Step8_Submission;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  banner: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bannerSuccess: {},
  bannerError: {},
  bannerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#111',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#646767',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#646767',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressIcon: {
    width: 24,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#646767',
    marginRight: 10,
  },
  progressIconActive: {
    color: '#D5222B',
  },
  progressIconDone: {
    color: '#1a7f37',
  },
  progressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#646767',
  },
  progressTextActive: {
    fontFamily: 'Poppins-SemiBold',
    color: '#111',
  },
  progressTextDone: {
    color: '#111',
  },
  messageCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#D5222B',
  },
  linkButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5222B',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#D5222B',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#D5222B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
  },
  linkButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
  },
  linkButtonPreview: {
    backgroundColor: '#4CAF50', // Green for preview
  },
  snackbar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDEDED',
  },
  snackbarText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#646767',
    textAlign: 'center',
  },
});
