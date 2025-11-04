import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Vehicle Verification Screen
 * Displays DMVIC check results showing existing cover information
 * Matches CategorySelectionStep.js drawer design with handle, header, and bottom actions
 */
const VehicleVerificationScreen = ({ 
  existingCoverData, 
  onAdjustStartDate, 
  onSubmitDebitNote 
}) => {
  console.log('🎨 [VehicleVerificationScreen] Rendering with data:', existingCoverData);
  
  if (!existingCoverData) {
    console.log('❌ [VehicleVerificationScreen] No existing cover data, returning null');
    return null; // Auto-skip if no existing cover
  }

  const policy = existingCoverData.policy || {};
  console.log('📋 [VehicleVerificationScreen] Policy data:', policy);

  return (
    <View style={styles.container}>
      {/* Drawer Handle */}
      <View style={styles.drawerHandle} />
      
      {/* Icon Circle - Moved to top */}
      <View style={styles.resultContainer}>
        <View style={[styles.resultIconCircle, styles.warningCircle]}>
          <Ionicons name="shield-checkmark" size={40} color="#ff9800" />
        </View>
      </View>

      {/* Header */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Vehicle Has Existing Cover</Text>
        <Text style={styles.drawerSubtitle}>
          Please adjust the start date to begin after the existing cover expires
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.drawerContent} 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Policy Details Card */}
        <View style={styles.policyDetailsCard}>
          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Vehicle Registration</Text>
            <Text style={styles.policyDetailValue}>
              {policy.vehicle_registration || 'N/A'}
            </Text>
          </View>

          <View style={[styles.policyDetailRow, styles.noBorder]}>
            <Text style={styles.policyDetailLabel}>Active Certificate Number</Text>
            <Text style={styles.policyDetailValue}>
              {policy.certificate_number || policy.policy_number || 'N/A'}
            </Text>
          </View>

          <View style={[styles.policyDetailRow, styles.noBorder]}>
            <Text style={styles.policyDetailLabel}>Issued By</Text>
            <Text style={styles.policyDetailValue}>
              {policy.insurer || 'N/A'}
            </Text>
          </View>

          <View style={[styles.policyDetailRow, styles.noBorder]}>
            <Text style={styles.policyDetailLabel}>Expiry Date</Text>
            <Text style={styles.policyDetailValue}>
              {policy.expiry_date || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color="#2196F3" style={{ marginTop: 2 }} />
          <Text style={styles.infoBoxText}>
            The new policy start date will be automatically adjusted to begin one day after the existing cover expires.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View style={styles.drawerActions}>
        <TouchableOpacity 
          style={[styles.drawerButton, styles.drawerButtonSecondary]}
          onPress={onAdjustStartDate}
          activeOpacity={0.8}
        >
          <Text style={styles.drawerButtonSecondaryText}>Adjust Start Date</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.drawerButton, styles.drawerButtonPrimary]}
          onPress={onSubmitDebitNote}
          activeOpacity={0.8}
        >
          <Text style={styles.drawerButtonPrimaryText}>Submit Debit Note</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Drawer Handle
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },

  // Drawer Header
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  drawerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Scrollable Content
  drawerContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Result Container (Icon Circle)
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

  // Policy Details Card
  policyDetailsCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  policyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  policyDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  policyDetailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
    gap: 10,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
    fontWeight: '400',
  },

  // Action Buttons - Fixed at bottom
  drawerActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  drawerButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  drawerButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  drawerButtonPrimary: {
    backgroundColor: '#D5222B',
  },
  drawerButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default VehicleVerificationScreen;
