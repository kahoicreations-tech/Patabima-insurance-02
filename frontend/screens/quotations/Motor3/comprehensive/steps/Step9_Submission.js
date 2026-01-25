/**
 * Step9_Submission - Comprehensive Flow
 * Auto-submits quote on mount, shows loading/error/success states
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMotor3 } from '../../contexts/Motor3Context';
import { useComprehensiveContext } from '../../contexts/ComprehensiveContext';
import DjangoAPIService from '../../../../../services/DjangoAPIService';

const SUBMISSION_PHASES = {
  IDLE: 'IDLE',
  CREATING: 'CREATING',
  ACTIVATING: 'ACTIVATING',
  DONE: 'DONE',
  ERROR: 'ERROR',
};

const Step9_Submission = ({ goToStep }) => {
  const navigation = useNavigation();
  const { 
    selectedCategory, 
    selectedSubcategory, 
    clientDetails, 
    documents,
    paymentDetails,
    setSubmissionResult 
  } = useMotor3();
  
  const { 
    vehicleDetails, 
    pricingInputs, 
    selectedUnderwriter 
  } = useComprehensiveContext();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [bellStatus, setBellStatus] = useState('');
  const [documentsOut, setDocumentsOut] = useState(null);
  const [phase, setPhase] = useState(SUBMISSION_PHASES.IDLE);
  const [downloadingDoc, setDownloadingDoc] = useState(null);
  const [quotationId, setQuotationId] = useState(null);

  useEffect(() => {
    submitQuote();
  }, []);

  const submitQuote = async () => {
    setSubmitting(true);
    setError(null);
    setBellStatus('Saving quotation...');
    setDocumentsOut(null);
    setPhase(SUBMISSION_PHASES.CREATING);

    try {
      const api = DjangoAPIService.getInstance();

      const uw = selectedUnderwriter || {};
      const bd = uw?.breakdown || {};
      const base = Number(uw?.base_premium ?? bd?.base_premium ?? 0);
      const itl = Number(bd?.training_levy ?? bd?.itl ?? (base * 0.0025));
      const pcf = Number(bd?.pcf_levy ?? bd?.pcf ?? (base * 0.0025));
      const stamp = Number(bd?.stamp_duty ?? 40);
      const total = Number(uw?.total_premium ?? bd?.total_premium ?? (base + itl + pcf + stamp));

      // Transform clientDetails from snake_case context to camelCase backend schema
      const transformedClientDetails = {
        fullName: `${clientDetails?.first_name || ''} ${clientDetails?.last_name || ''}`.trim() || clientDetails?.fullName || 'N/A',
        phone: clientDetails?.phone || '',
        email: clientDetails?.email || '',
        idNumber: clientDetails?.id_number || clientDetails?.idNumber || '',
        kraPin: clientDetails?.kra_pin || clientDetails?.kraPin || '',
        address: clientDetails?.address || '',
      };

      const createPayload = {
        quoteId: null,
        clientDetails: transformedClientDetails,
        vehicleDetails: {
          registration: vehicleDetails?.registrationNumber,
          make: vehicleDetails?.make,
          model: vehicleDetails?.model,
          year: vehicleDetails?.year,
          color: vehicleDetails?.color,
          bodyType: vehicleDetails?.bodyType,
          engineNumber: vehicleDetails?.engineNumber,
          chasisNumber: vehicleDetails?.chasisNumber,
          logbookNumber: vehicleDetails?.logbookNumber,
          coverStartDate: vehicleDetails?.cover_start_date,
          sumInsured: pricingInputs?.sum_insured,
        },
        productDetails: {
          category: selectedCategory?.code,
          subcategory: selectedSubcategory?.subcategory_code,
          coverageType: 'COMPREHENSIVE',
        },
        underwriterDetails: {
          name: uw?.name || uw?.underwriter_name,
          code: uw?.underwriter_code || uw?.code,
        },
        premiumBreakdown: {
          base_premium: base,
          training_levy: itl,
          pcf_levy: pcf,
          stamp_duty: stamp,
          total_amount: total,
        },
        paymentDetails: {
          ...(paymentDetails || {}),
          method: paymentDetails?.method || paymentDetails?.payment_method || 'MPESA',
          amount: paymentDetails?.amount ?? total,
          status: paymentDetails?.status || 'SUCCESS',
          transaction_id: paymentDetails?.transaction_id || paymentDetails?.transactionId,
        },
        documents: documents || [],
      };

      // Option 1: Persist Motor3 quotation first
      const quotationRes = await api.makeRequest('/api/motor3/quotations/comprehensive/', {
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

      setDocumentsOut(converted?.documents || converted?.activated?.documents || null);
      setBellStatus('Certificate & documents ready');
      setSuccess({ policyNumber: convertedPolicyNumber, quotation: quotationRes, converted });
      setSubmissionResult({ quotation: quotationRes, converted });
      setPhase(SUBMISSION_PHASES.DONE);
      
    } catch (err) {
      console.error('[Step9] Submission error:', err);
      setError(err.message || 'Failed to submit quote');
      setPhase(SUBMISSION_PHASES.ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadAndOpenPdf = async (docType) => {
    const policyNumber = success?.policyNumber;
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
  };

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
            <Text style={styles.snackbarText}>Generating certificate… keep the app open.</Text>
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
            <Text style={styles.errorText}>{error}</Text>
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
    return (
      <View style={styles.container}>
        <View style={[styles.banner, styles.bannerSuccess]}>
          <Text style={styles.bannerTitle}>Policy Activated</Text>
          <View style={styles.bannerRow}>
            {!!success.policyNumber && <Text style={styles.bannerText}>Policy #{success.policyNumber}</Text>}
          </View>
          {!!bellStatus && <Text style={styles.bannerText}>{bellStatus}</Text>}
        </View>

        <View style={styles.content}>
          <Text style={styles.successText}>Your cover is active and documents are available.</Text>

          {!!quotationId && (
            <TouchableOpacity
              style={[styles.linkButton, downloadingDoc ? styles.linkButtonDisabled : null]}
              disabled={!!downloadingDoc}
              onPress={() => downloadAndOpenPdf('quote')}
            >
              <Text style={styles.linkButtonText}>Open Quote PDF</Text>
            </TouchableOpacity>
          )}

          {!!documentsOut?.policyPdfUrl && (
            <TouchableOpacity
              style={[styles.linkButton, downloadingDoc ? styles.linkButtonDisabled : null]}
              disabled={!!downloadingDoc}
              onPress={() => downloadAndOpenPdf('policy')}
            >
              <Text style={styles.linkButtonText}>Open Policy PDF</Text>
            </TouchableOpacity>
          )}
          {!!documentsOut?.receiptUrl && (
            <TouchableOpacity
              style={[styles.linkButton, downloadingDoc ? styles.linkButtonDisabled : null]}
              disabled={!!downloadingDoc}
              onPress={() => downloadAndOpenPdf('receipt')}
            >
              <Text style={styles.linkButtonText}>Open Receipt</Text>
            </TouchableOpacity>
          )}
          {!!documentsOut?.dmvicCertificatePdfUrl && (
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
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    color: '#646767',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#646767',
  },
  loadingSubtext: {
    fontSize: 13,
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
    fontWeight: '700',
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
    color: '#646767',
  },
  progressTextActive: {
    fontWeight: '700',
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
    fontSize: 48,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#646767',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: '#646767',
    fontSize: 16,
  },
  successIcon: {
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5222B',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#D5222B',
    fontSize: 16,
    fontWeight: '600',
  },
    fontSize: 64,
    color: '#4CAF50',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#646767',
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
    fontWeight: '700',
    color: '#FFF',
  },
  linkButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  linkButtonDisabled: {
    opacity: 0.6,
  },
  linkButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#646767',
    textAlign: 'center',
  },
});

export default Step9_Submission;
