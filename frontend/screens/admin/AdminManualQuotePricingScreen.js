/**
 * Admin Manual Quote Pricing Screen
 * Allows admin staff to manually price medical and other manual quotes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, Typography } from '../../constants';
import { Heading4, Heading6, Body1, Body2, Caption } from '../../components/typography/Text';
import { SafeScreen, EnhancedCard, ActionButton } from '../../components';
import api from '../../services/DjangoAPIService';

export default function AdminManualQuotePricingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { quoteReference } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState(null);

  // Pricing fields
  const [computedPremium, setComputedPremium] = useState('');
  const [basePremium, setBasePremium] = useState('');
  const [trainingLevy, setTrainingLevy] = useState('');
  const [pcfLevy, setPcfLevy] = useState('');
  const [stampDuty, setStampDuty] = useState('40');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('COMPLETED');

  useEffect(() => {
    loadQuote();
  }, [quoteReference]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const data = await api.getManualQuoteDetail(quoteReference);
      setQuote(data);

      // Prefill if already priced
      if (data.computed_premium) {
        setComputedPremium(data.computed_premium.toString());
      }
      if (data.levies_breakdown) {
        setBasePremium(data.levies_breakdown.base_premium?.toString() || '');
        setTrainingLevy(data.levies_breakdown.training_levy?.toString() || '');
        setPcfLevy(data.levies_breakdown.pcf_levy?.toString() || '');
        setStampDuty(data.levies_breakdown.stamp_duty?.toString() || '40');
      }
      if (data.admin_notes) {
        setAdminNotes(data.admin_notes);
      }
      if (data.status) {
        setSelectedStatus(data.status);
      }
    } catch (error) {
      console.error('Error loading quote:', error);
      Alert.alert('Error', 'Failed to load quote details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const calculateLevies = (premium) => {
    const base = parseFloat(premium) || 0;
    const itl = base * 0.0025; // 0.25%
    const pcf = base * 0.0025; // 0.25%
    const stamp = 40; // Fixed KES 40
    
    setBasePremium(base.toFixed(2));
    setTrainingLevy(itl.toFixed(2));
    setPcfLevy(pcf.toFixed(2));
    setStampDuty(stamp.toFixed(2));
    
    const total = base + itl + pcf + stamp;
    setComputedPremium(total.toFixed(2));
  };

  const handlePremiumChange = (value) => {
    setBasePremium(value);
    if (value) {
      calculateLevies(value);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!computedPremium || parseFloat(computedPremium) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid premium amount');
      return;
    }

    try {
      setSaving(true);

      const leviesBreakdown = {
        base_premium: parseFloat(basePremium) || 0,
        training_levy: parseFloat(trainingLevy) || 0,
        pcf_levy: parseFloat(pcfLevy) || 0,
        stamp_duty: parseFloat(stampDuty) || 40,
        total_premium: parseFloat(computedPremium) || 0,
        currency: 'KES',
      };

      await api.updateManualQuotePricing(quoteReference, {
        status: selectedStatus,
        computed_premium: computedPremium,
        levies_breakdown: leviesBreakdown,
        admin_notes: adminNotes,
      });

      Alert.alert(
        'Success',
        'Quote pricing updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving pricing:', error);
      Alert.alert('Error', error.message || 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Caption style={styles.loadingText}>Loading quote...</Caption>
        </View>
      </SafeScreen>
    );
  }

  if (!quote) {
    return (
      <SafeScreen>
        <View style={styles.errorContainer}>
          <Heading6>Quote not found</Heading6>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Body1>← Back</Body1>
          </TouchableOpacity>
          <Heading4>Price Manual Quote</Heading4>
        </View>

        {/* Quote Details Card */}
        <EnhancedCard style={styles.card}>
          <Heading6 style={styles.cardTitle}>Quote Details</Heading6>
          
          <View style={styles.detailRow}>
            <Caption style={styles.detailLabel}>Reference:</Caption>
            <Body2 style={styles.detailValue}>{quote.reference}</Body2>
          </View>
          
          <View style={styles.detailRow}>
            <Caption style={styles.detailLabel}>Type:</Caption>
            <Body2 style={styles.detailValue}>{quote.line_key}</Body2>
          </View>
          
          <View style={styles.detailRow}>
            <Caption style={styles.detailLabel}>Agent:</Caption>
            <Body2 style={styles.detailValue}>{quote.agent_code || 'N/A'}</Body2>
          </View>
          
          <View style={styles.detailRow}>
            <Caption style={styles.detailLabel}>Created:</Caption>
            <Body2 style={styles.detailValue}>
              {new Date(quote.created_at).toLocaleDateString()}
            </Body2>
          </View>

          <View style={styles.detailRow}>
            <Caption style={styles.detailLabel}>Current Status:</Caption>
            <Body2 style={[styles.detailValue, styles.statusValue]}>{quote.status}</Body2>
          </View>
        </EnhancedCard>

        {/* Client Details Card */}
        {quote.payload && (
          <EnhancedCard style={styles.card}>
            <Heading6 style={styles.cardTitle}>Client Information</Heading6>
            
            {quote.payload.fullName && (
              <View style={styles.detailRow}>
                <Caption style={styles.detailLabel}>Name:</Caption>
                <Body2 style={styles.detailValue}>{quote.payload.fullName}</Body2>
              </View>
            )}
            
            {quote.payload.idNumber && (
              <View style={styles.detailRow}>
                <Caption style={styles.detailLabel}>ID Number:</Caption>
                <Body2 style={styles.detailValue}>{quote.payload.idNumber}</Body2>
              </View>
            )}
            
            {quote.payload.phoneNumber && (
              <View style={styles.detailRow}>
                <Caption style={styles.detailLabel}>Phone:</Caption>
                <Body2 style={styles.detailValue}>{quote.payload.phoneNumber}</Body2>
              </View>
            )}
            
            {quote.line_key === 'MEDICAL' && (
              <>
                <View style={styles.divider} />
                <Caption style={styles.sectionTitle}>Medical Coverage</Caption>
                
                {quote.payload.inpatientLimit && (
                  <View style={styles.detailRow}>
                    <Caption style={styles.detailLabel}>Inpatient Limit:</Caption>
                    <Body2 style={styles.detailValue}>{quote.payload.inpatientLimit}</Body2>
                  </View>
                )}
                
                {quote.payload.age && (
                  <View style={styles.detailRow}>
                    <Caption style={styles.detailLabel}>Age:</Caption>
                    <Body2 style={styles.detailValue}>{quote.payload.age}</Body2>
                  </View>
                )}
                
                {quote.payload.spouseAge && (
                  <View style={styles.detailRow}>
                    <Caption style={styles.detailLabel}>Spouse Age:</Caption>
                    <Body2 style={styles.detailValue}>{quote.payload.spouseAge}</Body2>
                  </View>
                )}
                
                {quote.payload.numberOfChildren && (
                  <View style={styles.detailRow}>
                    <Caption style={styles.detailLabel}>Children:</Caption>
                    <Body2 style={styles.detailValue}>{quote.payload.numberOfChildren}</Body2>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Caption style={styles.detailLabel}>Outpatient:</Caption>
                  <Body2 style={styles.detailValue}>
                    {quote.payload.outpatientCover ? 'Yes' : 'No'}
                  </Body2>
                </View>
                
                <View style={styles.detailRow}>
                  <Caption style={styles.detailLabel}>Maternity:</Caption>
                  <Body2 style={styles.detailValue}>
                    {quote.payload.maternityCover ? 'Yes' : 'No'}
                  </Body2>
                </View>
              </>
            )}
          </EnhancedCard>
        )}

        {/* Pricing Calculator Card */}
        <EnhancedCard style={styles.card}>
          <Heading6 style={styles.cardTitle}>💰 Pricing Calculator</Heading6>
          <Caption style={styles.helperText}>
            Enter base premium, levies will be calculated automatically
          </Caption>

          <View style={styles.inputContainer}>
            <Body2 style={styles.inputLabel}>Base Premium (KES)</Body2>
            <TextInput
              style={styles.input}
              placeholder="e.g., 125000"
              keyboardType="decimal-pad"
              value={basePremium}
              onChangeText={handlePremiumChange}
            />
          </View>

          <View style={styles.divider} />
          <Caption style={styles.sectionTitle}>Calculated Levies (Automatic)</Caption>

          <View style={styles.inputContainer}>
            <Body2 style={styles.inputLabel}>Training Levy (0.25%)</Body2>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={trainingLevy}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Body2 style={styles.inputLabel}>PCF Levy (0.25%)</Body2>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={pcfLevy}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Body2 style={styles.inputLabel}>Stamp Duty (Fixed)</Body2>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={stampDuty}
              editable={false}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.totalContainer}>
            <Heading6>Total Premium:</Heading6>
            <Heading4 style={styles.totalAmount}>
              KES {parseFloat(computedPremium || 0).toLocaleString()}
            </Heading4>
          </View>
        </EnhancedCard>

        {/* Status Selection */}
        <EnhancedCard style={styles.card}>
          <Heading6 style={styles.cardTitle}>Quote Status</Heading6>
          
          <View style={styles.statusOptions}>
            {['IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedStatus === status && styles.statusOptionActive,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Body2
                  style={[
                    styles.statusOptionText,
                    selectedStatus === status && styles.statusOptionTextActive,
                  ]}
                >
                  {status.replace(/_/g, ' ')}
                </Body2>
              </TouchableOpacity>
            ))}
          </View>
        </EnhancedCard>

        {/* Admin Notes */}
        <EnhancedCard style={styles.card}>
          <Heading6 style={styles.cardTitle}>Admin Notes</Heading6>
          <Caption style={styles.helperText}>
            Internal notes (visible only to staff)
          </Caption>
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any notes about this quote..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={adminNotes}
            onChangeText={setAdminNotes}
          />
        </EnhancedCard>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <ActionButton
            title={saving ? 'Saving...' : 'Save Pricing'}
            variant="primary"
            onPress={handleSave}
            disabled={saving || !computedPremium}
            style={styles.saveButton}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.md,
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
    fontFamily: Typography.fontFamily.medium,
  },
  statusValue: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  helperText: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputReadOnly: {
    backgroundColor: Colors.backgroundDisabled,
    color: Colors.textSecondary,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
  },
  totalContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  totalAmount: {
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusOption: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusOptionText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.semiBold,
  },
  actionContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  saveButton: {
    width: '100%',
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});
