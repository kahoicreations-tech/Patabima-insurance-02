import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';

/**
 * Vehicle Verification Screen
 * Displays DMVIC check results showing existing cover information
 * Phase 3.1: Enhanced with auto-date adjustment and context integration
 */
const VehicleVerificationScreen = ({ 
  existingCoverData, 
  onAdjustStartDate, 
  onSubmitDebitNote 
}) => {
  const { actions } = useMotorInsurance();
  
  console.log('🎨 [VehicleVerificationScreen] Rendering with data:', existingCoverData);
  
  // Phase 3.1: Enhanced handler with auto-date adjustment
  const handleAdjustDate = () => {
    console.log('📅 [VehicleVerificationScreen] Adjust date clicked');
    
    if (!existingCoverData?.expiryDate && !existingCoverData?.policy?.expiry_date) {
      console.warn('⚠️ [VehicleVerificationScreen] No expiry date found');
      onAdjustStartDate?.();
      return;
    }
    
    try {
      // Get expiry date from either structure
      const expiryDateStr = existingCoverData.expiryDate || existingCoverData.policy?.expiry_date;
      
      // Parse date (handles DD/MM/YYYY, YYYY-MM-DD, ISO formats)
      let expiryDate;
      if (expiryDateStr.includes('/')) {
        // DD/MM/YYYY format
        const [day, month, year] = expiryDateStr.split('/');
        expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (expiryDateStr.includes('-')) {
        // YYYY-MM-DD or ISO format
        expiryDate = new Date(expiryDateStr);
      } else {
        expiryDate = new Date(expiryDateStr);
      }
      
      // Calculate minimum date (expiry + 1 day)
      const minDate = new Date(expiryDate);
      minDate.setDate(minDate.getDate() + 1);
      
      const minDateISO = minDate.toISOString().split('T')[0];
      
      console.log('ℹ️ [VehicleVerificationScreen] Existing cover expires:', expiryDateStr);
      console.log('ℹ️ [VehicleVerificationScreen] Setting minimum date to:', minDateISO);
      
      // Update context with minimum date constraint
      actions.setMinCoverStartDate(minDateISO);
      
      // Update vehicle details with new cover start date
      actions.updateVehicleDetails({
        cover_start_date: minDateISO,
        coverStartDate: minDateISO,
      });
      
      // Show confirmation
      Alert.alert(
        'Cover Start Date Updated',
        `The policy start date has been adjusted to ${minDate.toLocaleDateString('en-GB')} (one day after existing cover expires).`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('✅ [VehicleVerificationScreen] Date adjustment confirmed');
              onAdjustStartDate?.();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ [VehicleVerificationScreen] Error parsing date:', error);
      Alert.alert(
        'Date Parse Error',
        'Unable to parse the existing cover expiry date. Please set the start date manually.',
        [
          {
            text: 'OK',
            onPress: () => onAdjustStartDate?.()
          }
        ]
      );
    }
  };
  
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
        <Text style={styles.drawerTitle}>Existing Cover Detected</Text>
        <Text style={styles.drawerSubtitle}>
          DMVIC records show this vehicle has active insurance coverage
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.drawerContent} 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Regulatory Notice */}
        <View style={[styles.infoBox, styles.regulatoryNotice]}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#2196F3" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBoxTextBold}>DMVIC Regulation</Text>
            <Text style={styles.infoBoxText}>
              Insurance policies cannot overlap. The new cover must start after the existing policy expires, as per IRA regulations.
            </Text>
          </View>
        </View>

        {/* Policy Details Card */}
        <View style={styles.policyDetailsCard}>
          <Text style={styles.cardTitle}>Current Policy Details</Text>
          
          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Vehicle Registration</Text>
            <Text style={styles.policyDetailValue}>
              {policy.vehicle_registration || 'N/A'}
            </Text>
          </View>

          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Certificate Number</Text>
            <Text style={styles.policyDetailValue}>
              {policy.certificate_number || policy.policy_number || 'N/A'}
            </Text>
          </View>

          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Current Insurer</Text>
            <Text style={styles.policyDetailValue}>
              {policy.insurer || 'N/A'}
            </Text>
          </View>

          <View style={styles.policyDetailRow}>
            <Text style={styles.policyDetailLabel}>Cover Type</Text>
            <Text style={styles.policyDetailValue}>
              {policy.cover_type || 'N/A'}
            </Text>
          </View>

          <View style={[styles.policyDetailRow, styles.noBorder]}>
            <Text style={styles.policyDetailLabel}>Cover Expires</Text>
            <Text style={[styles.policyDetailValue, styles.highlightedDate]}>
              {policy.expiry_date || existingCoverData.expiryDate || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color="#4CAF50" style={{ marginTop: 2 }} />
          <Text style={styles.infoBoxText}>
            Click "Adjust Start Date" to automatically update the new policy to begin the day after existing cover expires.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View style={styles.drawerActions}>
        <TouchableOpacity 
          style={[styles.drawerButton, styles.drawerButtonSecondary]}
          onPress={handleAdjustDate}
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: 0.3,
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
  highlightedDate: {
    color: '#D5222B',
    fontWeight: '700',
    fontSize: 15,
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
  regulatoryNotice: {
    backgroundColor: '#E0F2FE',
    borderLeftColor: '#0284C7',
    marginBottom: 16,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
    fontWeight: '400',
  },
  infoBoxTextBold: {
    fontSize: 13,
    color: '#0C4A6E',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
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
