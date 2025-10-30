import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants';

/**
 * QuoteSubmissionSuccess - Reusable success confirmation screen
 * Shows reference number, manual pricing workflow explanation, and next steps
 * 
 * @param {Object} route.params
 * @param {string} route.params.reference - Quote reference number (e.g., MNL-MEDICAL-abc123)
 * @param {string} route.params.lineKey - Insurance line key (e.g., 'MEDICAL', 'WIBA', 'TRAVEL')
 * @param {string} route.params.productName - Display name (e.g., 'Individual Medical Insurance')
 * @param {string} route.params.estimatedResponseTime - Optional custom timeline (default: '24-48 hours')
 */
export default function QuoteSubmissionSuccess({ route }) {
  const { reference, lineKey, productName, estimatedResponseTime } = route.params || {};
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const timeline = estimatedResponseTime || '24-48 hours';
  const productDisplay = productName || `${lineKey || 'Insurance'} Quote`;

  const nextSteps = [
    { icon: 'eye', text: 'Admin will review your inputs and requirements' },
    { icon: 'calculator', text: `Pricing will be set within ${timeline}` },
    { icon: 'notifications', text: 'You will be notified when quote is ready' },
    { icon: 'checkmark-circle', text: 'Check Quotations tab for updates and payment' },
  ];

  const handleTrackQuote = () => {
    // Navigate to Quotations tab with forceRefresh
    navigation.navigate('MainTabs', {
      screen: 'Quotations',
      params: {
        forceRefresh: true,
        highlightReference: reference,
      },
    });
  };

  const handleCreateAnother = () => {
    // Navigate back to form
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={64} color={Colors.white} />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Quote Request Submitted!</Text>
        <Text style={styles.subtitle}>
          Your {productDisplay} quote request has been successfully submitted.
        </Text>

        {/* Reference Number Card */}
        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Reference Number</Text>
          <View style={styles.referenceBadge}>
            <Ionicons name="document-text" size={20} color={Colors.primary} />
            <Text style={styles.referenceNumber}>{reference || 'N/A'}</Text>
          </View>
          <Text style={styles.referenceHint}>
            Use this reference to track your quote
          </Text>
        </View>

        {/* Manual Pricing Explanation */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
            <Text style={styles.infoTitle}>How Pricing Works</Text>
          </View>
          <Text style={styles.infoText}>
            Our admin team will review your requirements and contact underwriters to get the best pricing for your coverage. 
            This ensures you receive competitive and accurate quotes tailored to your needs.
          </Text>
        </View>

        {/* Next Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What Happens Next?</Text>
          {nextSteps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepIconCircle}>
                <Ionicons name={step.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Timeline Indicator */}
        <View style={styles.timelineCard}>
          <Ionicons name="time" size={20} color={Colors.darkGray} />
          <Text style={styles.timelineText}>
            Expected response time: <Text style={styles.timelineBold}>{timeline}</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleTrackQuote}
          activeOpacity={0.8}
        >
          <Ionicons name="list" size={20} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Track Quote</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleCreateAnother}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Create Another Quote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl * 2,
    marginBottom: Spacing.lg,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success || '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.darkGray,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  referenceCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  referenceLabel: {
    ...Typography.caption,
    color: Colors.darkGray,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  referenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray || '#f5f5f5',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  referenceNumber: {
    ...Typography.h3,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  referenceHint: {
    ...Typography.caption,
    color: Colors.mediumGray,
    marginTop: Spacing.xs,
  },
  infoCard: {
    backgroundColor: Colors.lightBlue || '#E3F2FD',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    ...Typography.h4,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  infoText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
  stepsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepsTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightGray || '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightYellow || '#FFF9E6',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  timelineText: {
    ...Typography.body,
    color: Colors.darkGray,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  timelineBold: {
    fontWeight: '700',
    color: Colors.text,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray || '#e0e0e0',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.white,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.primary,
    fontWeight: '600',
  },
});
