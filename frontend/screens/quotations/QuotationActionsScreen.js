import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Share, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../constants';
import djangoAPI from '../../services/DjangoAPIService';

export default function QuotationActionsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const quote = route?.params?.quote || null;

  const createdAtLabel = useMemo(() => {
    const raw = quote?.createdAt || quote?.created_at || null;
    const date = raw ? new Date(raw) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  }, [quote?.createdAt, quote?.created_at]);

  const shareFallbackText = useMemo(() => {
    const reg = (quote?.vehicleDetails?.registrationNumber || '').toUpperCase();
    const policyType = quote?.coverageDetails?.type || quote?.productName || 'Quotation';
    const amount = quote?.calculatedPremium?.totalPremium;

    const lines = [
      'PataBima Quotation',
      reg ? `Vehicle: ${reg}` : null,
      policyType ? `Type: ${policyType}` : null,
      typeof amount === 'number' ? `Amount: ${amount}` : null,
    ].filter(Boolean);

    return lines.join('\n');
  }, [quote]);

  const ensurePolicyPdfAvailable = () => {
    const policyNumber = quote?.policyNumber;
    if (!policyNumber) {
      throw new Error('No policy number found for this quotation');
    }
    return policyNumber;
  };

  const formatCurrency = (amount) => {
    if (amount == null || Number.isNaN(Number(amount))) return '—';
    try {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(amount));
    } catch {
      return `Ksh ${Number(amount).toLocaleString()}`;
    }
  };

  const isApplied = !!quote?.isApplied;
  const registration = (quote?.vehicleDetails?.registrationNumber || '').toUpperCase();
  const policyType = quote?.coverageDetails?.type || quote?.productName || '—';
  const provider = quote?.underwriterName || '—';
  const totalPremium = quote?.calculatedPremium?.totalPremium;

  const handlePrimary = () => {
    // Insurance-logic: only allow apply/payment when not applied
    if (isApplied) {
      setDetailsOpen(true);
      return;
    }

    try {
      if (quote?.isMotor) {
        navigation.navigate('Motor2Flow', {
          startAtPayment: true,
          resumeDraft: true,
          draftQuoteId: quote.id,
          policyNumber: quote.policyNumber,
          draftData: {
            quoteId: quote.id,
            policyNumber: quote.policyNumber,
            vehicleDetails: quote.vehicleDetails,
            clientInfo: quote.clientInfo,
            coverageDetails: quote.coverageDetails,
            premiumBreakdown: quote.calculatedPremium,
            underwriterName: quote.underwriterName,
            totalPremium: quote.calculatedPremium?.totalPremium || 0,
          },
        });
        return;
      }

      if (quote?.isMedical) {
        navigation.navigate('EnhancedIndividualMedicalQuotation', {
          startAtPayment: true,
          resumeDraft: true,
          quoteNumber: quote.originalQuoteNumber || quote.id,
          draftData: quote.manualQuoteData || {},
          premiumAmount: quote.calculatedPremium?.totalPremium || 0,
        });
        return;
      }

      // Generic fallback
      navigation.navigate('QuotationFlow', {
        category: quote?.category,
        startAtPayment: true,
        resumeDraft: true,
        draftQuoteId: quote?.id,
        draftData: quote,
        premiumAmount: quote?.calculatedPremium?.totalPremium || 0,
      });
    } catch (e) {
      Alert.alert('Apply Policy', e?.message || 'Unable to proceed');
    }
  };

  const handleDownload = async () => {
    try {
      setBusy('download');
      const policyNumber = ensurePolicyPdfAvailable();
      await djangoAPI.downloadAndShareMotorPolicyDocument(policyNumber, 'policy', {
        dialogTitle: 'Download Quote',
        timeoutMs: 60000,
      });
    } catch (e) {
      Alert.alert('Download', e?.message || 'Unable to download this quote');
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadDocument = async (docType, title) => {
    try {
      setBusy(docType);
      const policyNumber = ensurePolicyPdfAvailable();

      // DMVIC certificate is only relevant for motor policies.
      if (!quote?.isMotor && docType === 'dmvic') {
        Alert.alert('DMVIC Certificate', 'This document is only available for Motor policies.');
        return;
      }

      await djangoAPI.downloadAndShareMotorPolicyDocument(policyNumber, docType, {
        dialogTitle: title,
        timeoutMs: 60000,
      });
    } catch (e) {
      Alert.alert(title, e?.message || 'Document not available');
    } finally {
      setBusy(null);
    }
  };

  const handleView = async () => {
    setDetailsOpen(true);
  };

  const handleShare = async () => {
    try {
      setBusy('share');
      const policyNumber = quote?.policyNumber;
      if (policyNumber) {
        await djangoAPI.downloadAndShareMotorPolicyDocument(policyNumber, 'policy', {
          dialogTitle: 'Share Quote',
          timeoutMs: 60000,
        });
        return;
      }
      await Share.share({ message: shareFallbackText });
    } catch (e) {
      Alert.alert('Share', e?.message || 'Unable to share this quote');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundCard} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="rocket-outline" size={28} color={Colors.primary} />
          </View>

          <Text style={styles.title}>
            Quote
            {'\n'}Generated
            {'\n'}Successfully!
          </Text>
          {!!createdAtLabel && <Text style={styles.subtitle}>{createdAtLabel}</Text>}

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle} numberOfLines={1}>
                {registration || policyType}
              </Text>
              <View style={[styles.statusPill, isApplied ? styles.statusPillApplied : styles.statusPillUnapplied]}>
                <Text style={[styles.statusPillText, isApplied ? styles.statusPillTextApplied : styles.statusPillTextUnapplied]}>
                  {isApplied ? 'Applied' : 'Unapplied'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Policy Type</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{policyType}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Insurance Provider</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{provider}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Premium</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalPremium)} (gross)</Text>
            </View>
          </View>

          {!isApplied && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handlePrimary}
              disabled={busy != null}
            >
              <Text style={styles.primaryBtnText}>Apply Policy</Text>
            </TouchableOpacity>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDownload}
              disabled={busy != null}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons name="cloud-download-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Download Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleView}
              disabled={busy != null}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons name="eye-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>View Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleShare}
              disabled={busy != null}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons name="share-social-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Share Quote</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Quotations' })}
              disabled={busy != null}
            >
              <Text style={styles.backBtnText}>Go back to Quotations</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exitBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
              disabled={busy != null}
            >
              <Text style={styles.exitBtnText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={detailsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsOpen(false)}
      >
        <Pressable style={styles.drawerOverlay} onPress={() => setDetailsOpen(false)} />
        <View style={[styles.drawer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Quotation Details</Text>
            <TouchableOpacity onPress={() => setDetailsOpen(false)} style={styles.drawerCloseBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.drawerContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{isApplied ? 'Applied' : 'Unapplied'}</Text>
            </View>

            {!!quote?.policyNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Policy Number</Text>
                <Text style={styles.detailValue}>{quote.policyNumber}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Policy Type</Text>
              <Text style={styles.detailValue}>{policyType}</Text>
            </View>

            {!!registration && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle Registration</Text>
                <Text style={styles.detailValue}>{registration}</Text>
              </View>
            )}

            {!!quote?.vehicleDetails?.make && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailValue}>
                  {quote.vehicleDetails.make} {quote.vehicleDetails.model || ''}{quote.vehicleDetails.year ? ` (${quote.vehicleDetails.year})` : ''}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Insurance Provider</Text>
              <Text style={styles.detailValue}>{provider}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Premium</Text>
              <Text style={styles.detailValue}>{formatCurrency(totalPremium)} (gross)</Text>
            </View>

            {!!quote?.clientInfo?.name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Client</Text>
                <Text style={styles.detailValue}>{quote.clientInfo.name}</Text>
              </View>
            )}

            {!!quote?.clientInfo?.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{quote.clientInfo.phone}</Text>
              </View>
            )}

            {!!quote?.coverStart && !!quote?.coverEnd && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cover Period</Text>
                <Text style={styles.detailValue}>
                  {new Date(quote.coverStart).toLocaleDateString()} - {new Date(quote.coverEnd).toLocaleDateString()}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date Created</Text>
              <Text style={styles.detailValue}>{createdAtLabel || '—'}</Text>
            </View>

            {!!quote?.policyNumber && (
              <>
                <View style={styles.drawerSectionHeader}>
                  <Text style={styles.drawerSectionTitle}>Documents</Text>
                </View>

                <View style={styles.docRow}>
                  <TouchableOpacity
                    style={styles.docButton}
                    onPress={() => handleDownloadDocument('policy', 'Policy PDF')}
                    disabled={busy != null}
                  >
                    <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                    <Text style={styles.docButtonText}>Policy PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.docButton}
                    onPress={() => handleDownloadDocument('receipt', 'Payment Receipt')}
                    disabled={busy != null}
                  >
                    <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
                    <Text style={styles.docButtonText}>Receipt</Text>
                  </TouchableOpacity>
                </View>

                {quote?.isMotor && (
                  <TouchableOpacity
                    style={[styles.docButton, styles.docButtonFull]}
                    onPress={() => handleDownloadDocument('dmvic', 'DMVIC Insurance Certificate')}
                    disabled={busy != null}
                  >
                    <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
                    <Text style={styles.docButtonText}>DMVIC Insurance Certificate</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Simple, backend-aware note */}
            {!quote?.policyNumber && (
              <View style={styles.noteBox}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                <Text style={styles.noteText}>
                  PDF is available after the policy is applied.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  card: {
    marginTop: Spacing.xxl,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  heroIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  bottomRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
  },
  exitBtn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtnText: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
  },

  summaryCard: {
    width: '100%',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: Colors.backgroundCard,
  },
  statusPillApplied: {
    borderColor: Colors.success,
  },
  statusPillUnapplied: {
    borderColor: Colors.primary,
  },
  statusPillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
  statusPillTextApplied: {
    color: Colors.success,
  },
  statusPillTextUnapplied: {
    color: Colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: 6,
  },
  summaryLabel: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  primaryBtn: {
    width: '100%',
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
  },

  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    maxHeight: '75%',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  drawerCloseBtn: {
    padding: 8,
  },
  drawerContent: {
    paddingVertical: Spacing.md,
  },
  drawerSectionHeader: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  drawerSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  noteBox: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },

  docRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  docButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundCard,
  },
  docButtonFull: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  docButtonText: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
  },
});
