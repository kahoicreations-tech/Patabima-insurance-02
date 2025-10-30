import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../../constants/Colors';
import { Typography } from '../../../../../constants/Typography';
import { Spacing } from '../../../../../constants/Spacing';

/**
 * Vehicle Verification Screen
 * Displays DMVIC check results showing existing cover information
 * Matches Figma design with shield icon, policy details, and action buttons
 */
const VehicleVerificationScreen = ({ 
  existingCoverData, 
  onAdjustStartDate, 
  onSubmitDebitNote 
}) => {
  if (!existingCoverData || !existingCoverData.exists) {
    return null; // Auto-skip if no existing cover
  }

  const policy = existingCoverData.policy || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Section - Document Status */}
      <View style={styles.documentStatusSection}>
        <Text style={styles.sectionTitle}>Client Details</Text>
        <Text style={styles.sectionSubtitle}>Client Details as Per</Text>
        
        <View style={styles.documentItem}>
          <Ionicons name="close-circle" size={20} color={Colors.error} />
          <Text style={styles.documentText}>Logbook</Text>
        </View>
        
        <View style={styles.documentItem}>
          <View style={styles.redDot} />
          <Text style={styles.documentText}>KRA PIN Certificate</Text>
        </View>

        <Text style={[styles.sectionTitle, styles.marginTop]}>Vehicle Details as Per</Text>
        
        <View style={styles.documentChip}>
          <Text style={styles.documentChipText}>Logbook</Text>
          <Ionicons name="checkmark-circle" size={20} color={Colors.error} />
        </View>
      </View>

      {/* Main Card - Existing Cover Details */}
      <View style={styles.existingCoverCard}>
        {/* Shield Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={64} color={Colors.text} />
        </View>

        {/* Title */}
        <Text style={styles.cardTitle}>Vehicle Has Existing Cover</Text>

        {/* Info Message */}
        <View style={styles.infoMessageContainer}>
          <Text style={styles.infoMessage}>
            Please adjust the start date of the new policy to begin after the existing cover expires
          </Text>
        </View>

        {/* Policy Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Registration</Text>
            <Text style={styles.detailValue}>
              {policy.vehicle_registration || 'KDN 423IA'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Active Certificate Number</Text>
            <Text style={styles.detailValue}>
              {policy.certificate_number || policy.policy_number || 'CHB432123'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issued By</Text>
            <Text style={styles.detailValue}>
              {policy.insurer || 'CIC'}
            </Text>
          </View>

          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <Text style={styles.detailLabel}>Expiry Date</Text>
            <Text style={styles.detailValue}>
              {policy.expiry_date || '13/04/2026'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.adjustDateButton}
          onPress={onAdjustStartDate}
          activeOpacity={0.7}
        >
          <Text style={styles.adjustDateButtonText}>Adjust Start Date</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.submitDebitNoteButton}
          onPress={onSubmitDebitNote}
          activeOpacity={0.7}
        >
          <Text style={styles.submitDebitNoteButtonText}>Submit Debit Note</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.padding.screen,
  },
  
  // Document Status Section
  documentStatusSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  marginTop: {
    marginTop: Spacing.md,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  documentText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginLeft: Spacing.xs,
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  documentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 9999, // Fully rounded pill
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  documentChipText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginRight: Spacing.xs,
  },

  // Existing Cover Card
  existingCoverCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.padding.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  infoMessageContainer: {
    backgroundColor: Colors.white,
    borderRadius: 9999, // Fully rounded pill shape
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  infoMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Policy Details
  detailsContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.padding.lg,
    marginBottom: Spacing.xl,
    // Add subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },

  // Action Buttons
  adjustDateButton: {
    width: '100%',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Spacing.borderRadius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustDateButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  submitDebitNoteButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDebitNoteButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
});

export default VehicleVerificationScreen;
