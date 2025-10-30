import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../constants';
import { SafeScreen, EnhancedCard, StatusBadge, CompactCurvedHeader } from '../../components';

export default function ClaimDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [claim] = useState(route.params?.claim || null);
  
  // If no claim was passed, go back to previous screen
  if (!claim) {
    navigation.goBack();
    return null;
  }
  
  // Get status color based on claim status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return Colors.warning;
      case 'Processing': return Colors.info;
      case 'Approved': return Colors.success;
      case 'Processed': return Colors.success;
      case 'Rejected': return Colors.error;
      default: return Colors.textSecondary;
    }
  };
  
  const handleContactSupport = () => {
    // Implement contact support functionality
    Alert.alert(
      'Contact Support',
      'Support feature will be available soon. For immediate assistance, please call our support hotline at +254 700 000 000.',
      [{ text: 'OK' }]
    );
  };
  
  const handleTrackClaim = () => {
    // Implement claim tracking functionality
    Alert.alert(
      'Track Claim',
      'Claim tracking feature will be available soon. You can view the current status in the timeline below.',
      [{ text: 'OK' }]
    );
  };
  
  const handleAddDocument = () => {
    Alert.alert(
      'Add Document',
      'Document upload feature will be available soon. You can email additional documents to claims@patabima.com.',
      [{ text: 'OK' }]
    );
  };
  
  const handleViewDocument = (documentName) => {
    Alert.alert(
      'View Document',
      `Opening ${documentName}...`,
      [{ text: 'OK' }]
    );
  };
  
  return (
    <SafeScreen>
      <StatusBar style="light" />
      
      <CompactCurvedHeader 
        title={`Claim ${claim.id || claim.claimNo || ''}`}
        subtitle={claim.product || claim.category}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSpacing} />
        
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[styles.statusContainer, { backgroundColor: getStatusColor(claim.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(claim.status) }]}>
              {claim.status}
            </Text>
          </View>
          
          <View style={styles.statusDetailContainer}>
            <Text style={styles.statusDetailLabel}>Submitted</Text>
            <Text style={styles.statusDetailValue}>
              {new Date(claim.date_created || claim.submissionDate || claim.loss_date).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.statusDetailContainer}>
            <Text style={styles.statusDetailLabel}>Claim Amount</Text>
            <Text style={styles.statusDetailValue}>{claim.amount}</Text>
          </View>
        </View>
        
        {/* Claim Details Card */}
        <EnhancedCard style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Claim Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Claim Number</Text>
            <Text style={styles.detailValue}>{claim.id || claim.claimNo}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Policy Number</Text>
            <Text style={styles.detailValue}>{claim.policy_number || claim.policyNo}</Text>
          </View>
          
          {claim.vehicleReg && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{claim.vehicleReg}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{claim.product || claim.category}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{claim.loss_description || claim.description || 'No description provided'}</Text>
        </EnhancedCard>
        
        {/* Documents Card */}
        <EnhancedCard style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Submitted Documents</Text>
          
          {claim.documents && claim.documents.length > 0 ? (
            claim.documents.map((doc, index) => (
              <View key={index} style={styles.documentItem}>
                <View style={styles.documentIconContainer}>
                  <Text style={styles.documentIcon}>📄</Text>
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.file_name || doc}</Text>
                  <Text style={styles.documentStatus}>Verified</Text>
                </View>
                <TouchableOpacity 
                  style={styles.documentViewButton}
                  onPress={() => handleViewDocument(doc.file_name || 'Document')}
                >
                  <Text style={styles.documentViewText}>View</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.noDocumentsContainer}>
              <Text style={styles.noDocumentsText}>No documents submitted</Text>
            </View>
          )}
          
          {claim.status === 'Pending' && (
            <TouchableOpacity 
              style={styles.addDocumentButton}
              onPress={handleAddDocument}
            >
              <Text style={styles.addDocumentButtonText}>Add Document</Text>
            </TouchableOpacity>
          )}
        </EnhancedCard>
        
        {/* Timeline Card */}
        <EnhancedCard style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Claim Timeline</Text>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelinePoint}>
              <View style={[styles.timelineDot, { backgroundColor: Colors.success }]} />
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>{new Date(claim.submissionDate).toLocaleDateString()}</Text>
              <Text style={styles.timelineTitle}>Claim Submitted</Text>
              <Text style={styles.timelineDescription}>Your claim has been successfully submitted.</Text>
            </View>
          </View>
          
          {claim.status !== 'Pending' && (
            <View style={styles.timelineItem}>
              <View style={styles.timelinePoint}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.info }]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{new Date(new Date(claim.submissionDate).getTime() + 86400000 * 2).toLocaleDateString()}</Text>
                <Text style={styles.timelineTitle}>Claim Processing</Text>
                <Text style={styles.timelineDescription}>Your claim is being reviewed by our team.</Text>
              </View>
            </View>
          )}
          
          {(claim.status === 'Approved' || claim.status === 'Processed') && (
            <View style={styles.timelineItem}>
              <View style={styles.timelinePoint}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.success }]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{new Date(new Date(claim.submissionDate).getTime() + 86400000 * 5).toLocaleDateString()}</Text>
                <Text style={styles.timelineTitle}>Claim Approved</Text>
                <Text style={styles.timelineDescription}>Your claim has been approved for payment.</Text>
              </View>
            </View>
          )}
          
          {claim.status === 'Processed' && (
            <View style={styles.timelineItem}>
              <View style={styles.timelinePoint}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.success }]} />
                <View style={[styles.timelineLine, { backgroundColor: 'transparent' }]} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{new Date(new Date(claim.submissionDate).getTime() + 86400000 * 7).toLocaleDateString()}</Text>
                <Text style={styles.timelineTitle}>Payment Processed</Text>
                <Text style={styles.timelineDescription}>Payment has been processed to your account.</Text>
              </View>
            </View>
          )}
          
          {claim.status === 'Rejected' && (
            <View style={styles.timelineItem}>
              <View style={styles.timelinePoint}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.error }]} />
                <View style={[styles.timelineLine, { backgroundColor: 'transparent' }]} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{new Date(new Date(claim.submissionDate).getTime() + 86400000 * 5).toLocaleDateString()}</Text>
                <Text style={styles.timelineTitle}>Claim Rejected</Text>
                <Text style={styles.timelineDescription}>Your claim has been rejected. Please contact support for more information.</Text>
              </View>
            </View>
          )}
        </EnhancedCard>
      </ScrollView>
      
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.supportButton}
          onPress={handleContactSupport}
        >
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
        
        {claim.status !== 'Processed' && claim.status !== 'Rejected' && (
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={handleTrackClaim}
          >
            <Text style={styles.trackButtonText}>Track Claim</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  headerSpacing: {
    height: Spacing.lg,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  statusText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
  },
  statusDetailContainer: {
    alignItems: 'center',
  },
  statusDetailLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  statusDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  detailCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  descriptionLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.md,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  documentIcon: {
    fontSize: 20,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  documentStatus: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.success,
  },
  documentViewButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  documentViewText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  addDocumentButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  addDocumentButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  timelinePoint: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 2,
    alignSelf: 'center',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.sm,
  },
  timelineDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  timelineTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  timelineDescription: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    padding: Spacing.md,
  },
  supportButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  supportButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  trackButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  trackButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  noDocumentsContainer: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  noDocumentsText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
