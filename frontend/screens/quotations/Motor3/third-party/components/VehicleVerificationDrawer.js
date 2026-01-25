import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function parseExpiryToMinStartDateISO(expiryDateStr) {
  if (!expiryDateStr) return null;
  
  // Handle both ISO (2026-01-15) and DD/MM/YYYY formats
  let expiry;
  if (typeof expiryDateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expiryDateStr)) {
    const [year, month, day] = expiryDateStr.split('-');
    expiry = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  } else
  if (typeof expiryDateStr === 'string' && expiryDateStr.includes('/')) {
    const [day, month, year] = expiryDateStr.split('/');
    expiry = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  } else {
    expiry = new Date(expiryDateStr);
  }
  
  if (Number.isNaN(expiry.getTime())) return null;
  expiry.setDate(expiry.getDate() + 1);
  
  // Use local date components instead of toISOString() to avoid timezone issues
  const year = expiry.getFullYear();
  const month = String(expiry.getMonth() + 1).padStart(2, '0');
  const day = String(expiry.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseFlexibleDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  // Handle ISO date-only (YYYY-MM-DD) as LOCAL date to avoid UTC timezone shifts.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string' && value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateGB(dateStr) {
  try {
    if (!dateStr) return 'N/A';
    
    // Handle both ISO and DD/MM/YYYY formats
    let d;
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    } else
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    } else {
      d = new Date(dateStr);
    }
    
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB');
  } catch {
    return String(dateStr);
  }
}

export default function VehicleVerificationDrawer({
  dmvicSearchResult,
  selectedCoverStartDate,
  onSetCoverStartDate,
  onContinue,
  onGoBack,
}) {
  console.log('[VehicleVerificationDrawer] RENDERING with props:', {
    hasDmvicResult: !!dmvicSearchResult,
    hasResponse: !!dmvicSearchResult?.response,
    selectedCoverStartDate,
  });
  
  const summary = useMemo(() => {
    const resp = dmvicSearchResult?.response;
    const vehicle = resp?.vehicle;
    const currentPolicy = vehicle?.current_policy;

    const policyHistory = Array.isArray(vehicle?.policy_history) ? vehicle.policy_history : [];

    // Check BOTH: vehicle.has_active_cover AND root-level has_existing_cover.
    // Also treat an expiry date as authoritative even if flags are false.
    const hasActiveCoverFlag = !!(vehicle?.has_active_cover || resp?.has_existing_cover);
    const registration = dmvicSearchResult?.request?.registration_number || vehicle?.registration_number || null;

    // If no currentPolicy (common when cover is expired), take the most recent policy from history
    const lastPolicy = policyHistory.length
      ? [...policyHistory].sort((a, b) => String(b?.CoverEndDate || '').localeCompare(String(a?.CoverEndDate || '')))[0]
      : null;

    const displayPolicy = currentPolicy || (lastPolicy ? {
      policy_number: lastPolicy?.PolicyNumber,
      certificate_type: lastPolicy?.TypeOfCover,
      cover_start_date: lastPolicy?.CoverStartDate,
      cover_end_date: lastPolicy?.CoverEndDate,
      member_company: lastPolicy?.MemberCompany,
    } : null);

    // Get expiry from EITHER current_policy OR root-level existing_cover_expiry OR history-derived
    const expiryDateStr =
      displayPolicy?.cover_end_date ||
      displayPolicy?.expiry_date ||
      resp?.existing_cover_expiry ||
      null;

    const hasExpiry = !!expiryDateStr;
    const hasActiveCover = hasActiveCoverFlag || hasExpiry;
    const minStartISO = hasActiveCover ? parseExpiryToMinStartDateISO(expiryDateStr) : null;

    const selected = parseFlexibleDate(selectedCoverStartDate);
    const minStart = parseFlexibleDate(minStartISO);
    
    console.log('[Drawer] DEBUG - selectedCoverStartDate input:', selectedCoverStartDate);
    console.log('[Drawer] DEBUG - selected parsed:', selected, selected?.toISOString?.());
    console.log('[Drawer] DEBUG - minStartISO input:', minStartISO);
    console.log('[Drawer] DEBUG - minStart parsed:', minStart, minStart?.toISOString?.());
    console.log('[Drawer] DEBUG - selected >= minStart:', selected && minStart ? selected >= minStart : 'N/A');
    console.log('[Drawer] DEBUG - selected.getTime():', selected?.getTime?.());
    console.log('[Drawer] DEBUG - minStart.getTime():', minStart?.getTime?.());
    
    const isDateValid = hasActiveCover
      ? Boolean(minStartISO && selected && minStart && selected >= minStart)
      : true;

    const hasAnyHistory = policyHistory.length > 0;
    const policyStatus = hasActiveCover ? 'ACTIVE' : (hasAnyHistory ? 'EXPIRED' : 'UNKNOWN');
    
    console.log('[Drawer] hasActiveCover:', hasActiveCover);
    console.log('[Drawer] expiryDateStr:', expiryDateStr);
    console.log('[Drawer] minStartISO:', minStartISO);
    console.log('[Drawer] isDateValid:', isDateValid);

    return {
      hasActiveCover,
      hasAnyHistory,
      policyStatus,
      registration,
      currentPolicy: displayPolicy,
      expiryDateStr,
      minStartISO,
      isDateValid,
    };
  }, [dmvicSearchResult, selectedCoverStartDate]);

  const policy = summary.currentPolicy || {};

  const handleAdjustDate = () => {
    if (!summary.minStartISO) {
      Alert.alert('Date Adjustment', 'Unable to calculate the minimum start date. Please adjust manually.');
      return;
    }

    // Set the date to minimum valid date - drawer will re-render and show "valid" state
    // UX: auto-continue once we set the compliant date.
    onSetCoverStartDate?.(summary.minStartISO);
    onContinue?.(summary.minStartISO);
  };

  return (
    <View style={styles.container}>
      <View style={styles.drawerHandle} />

      <View style={styles.resultContainer}>
        <View style={[styles.resultIconCircle, styles.warningCircle]}>
          <Ionicons name="shield-checkmark" size={40} color="#ff9800" />
        </View>
      </View>

      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>
          {summary.policyStatus === 'ACTIVE' ? 'Existing Cover Detected' : 'Previous Cover Found'}
        </Text>
        <Text style={styles.drawerSubtitle}>
          {summary.policyStatus === 'ACTIVE'
            ? 'DMVIC records show this vehicle has active insurance coverage'
            : 'DMVIC records show this vehicle had previous insurance coverage'}
        </Text>
      </View>

      <ScrollView
        style={styles.drawerContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoBox, styles.regulatoryNotice]}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#2196F3" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBoxTextBold}>DMVIC Regulation</Text>
            <Text style={styles.infoBoxText}>
              Insurance policies cannot overlap. The new cover must start after the existing policy expires, as per IRA regulations.
            </Text>
          </View>
        </View>

        <View style={styles.policyDetailsCard}>
          <Text style={styles.cardTitle}>Current Policy Details</Text>

          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Vehicle Registration</Text>
            <Text style={styles.policyDetailValue}>{summary.registration || 'N/A'}</Text>
          </View>

          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Policy Status</Text>
            <Text style={styles.policyDetailValue}>{summary.policyStatus}</Text>
          </View>

          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Certificate Number</Text>
            <Text style={styles.policyDetailValue}>{policy.policy_number || policy.certificate_number || 'N/A'}</Text>
          </View>

          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Current Insurer</Text>
            <Text style={styles.policyDetailValue}>{policy.member_company || policy.insurer || 'N/A'}</Text>
          </View>

          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Cover Type</Text>
            <Text style={styles.policyDetailValue}>{policy.certificate_type || policy.cover_type || 'N/A'}</Text>
          </View>

          <View style={[styles.policyDetailRow, styles.noBorder]}>
            <Text style={styles.policyDetailLabel}>Cover Expires</Text>
            <Text style={[styles.policyDetailValue, styles.highlightedDate]}>
              {formatDateGB(summary.expiryDateStr)}
            </Text>
          </View>
        </View>

        {summary.isDateValid ? (
          <View style={[styles.infoBox, styles.successBox]}>
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={{ marginTop: 2 }} />
            <Text style={styles.infoBoxText}>
              Your selected cover start date ({formatDateGB(selectedCoverStartDate)}) is valid. Click "Continue" to proceed.
            </Text>
          </View>
        ) : (
          <View style={[styles.infoBox, styles.errorBox]}>
            <Ionicons name="close-circle" size={18} color="#D5222B" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoBoxTextBold, { color: '#D5222B' }]}>Date Conflict Detected</Text>
              <Text style={styles.infoBoxText}>
                Your selected date ({formatDateGB(selectedCoverStartDate)}) overlaps with the existing policy that expires on {formatDateGB(summary.expiryDateStr)}.
              </Text>
              <Text style={[styles.infoBoxText, { marginTop: 6, fontWeight: '600' }]}>
                The earliest valid start date is: {formatDateGB(summary.minStartISO)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.drawerActions}>
        {summary.isDateValid ? (
          <TouchableOpacity
            style={[styles.drawerButton, styles.drawerButtonPrimary, { flex: 1 }]}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.drawerButtonPrimaryText}>
              {summary.policyStatus === 'ACTIVE' ? 'Continue with Current Date' : 'Acknowledge & Continue'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.drawerButton, styles.drawerButtonOutline]}
              onPress={onGoBack}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color="#374151" style={{ marginRight: 6 }} />
              <Text style={styles.drawerButtonOutlineText}>Go Back & Adjust</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.drawerButton, styles.drawerButtonPrimary]}
              onPress={handleAdjustDate}
              activeOpacity={0.8}
            >
              <Text style={styles.drawerButtonPrimaryText}>Set to {formatDateGB(summary.minStartISO)}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    maxHeight: '100%',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resultIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningCircle: {
    backgroundColor: '#FFF3E0',
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  drawerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  drawerContent: {
    flexGrow: 0,
    flexShrink: 1,
    backgroundColor: '#FFFFFF',
    maxHeight: 280,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  regulatoryNotice: {
    backgroundColor: '#E6F4FF',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#D5222B',
  },
  infoBoxTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  policyDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  policyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  policyDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  policyDetailValue: {
    fontSize: 13,
    color: '#111827',
    fontFamily: 'Poppins-SemiBold',
  },
  highlightedDate: {
    color: '#D5222B',
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  drawerButton: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerButtonOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  drawerButtonOutlineText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  drawerButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  drawerButtonSecondaryText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
  },
  drawerButtonPrimary: {
    backgroundColor: '#D5222B',
  },
  drawerButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
  },
});
