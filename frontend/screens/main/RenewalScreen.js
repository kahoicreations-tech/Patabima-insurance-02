import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../constants';
import { SafeScreen, EnhancedCard, StatusBadge, CompactCurvedHeader } from '../../components';
import djangoAPI from '../../services/DjangoAPIService';

export default function RenewalScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [policyDetails, setPolicyDetails] = useState(route.params?.policy || null);
  const [renewalEligibility, setRenewalEligibility] = useState(null);
  const [updatedPremium, setUpdatedPremium] = useState(null);
  const [loading, setLoading] = useState(false);
  const [renewalData, setRenewalData] = useState({
    clientDetails: {},
    vehicleDetails: {},
    productDetails: {},
    underwriterDetails: null,
    premiumBreakdown: {},
    paymentDetails: {},
    coverStartDate: new Date().toISOString().split('T')[0]
  });
  
  // Check renewal eligibility when component mounts
  useEffect(() => {
    if (policyDetails?.policyNo) {
      checkRenewalEligibility();
    } else {
      Alert.alert('Error', 'No policy information provided', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [policyDetails]);

  const checkRenewalEligibility = async () => {
    if (!policyDetails?.policyNo) return;
    
    try {
      setLoading(true);
      await djangoAPI.initialize();
      
      const eligibility = await djangoAPI.checkRenewalEligibility(policyDetails.policyNo);
      setRenewalEligibility(eligibility);
      
      if (!eligibility.eligible) {
        Alert.alert(
          'Renewal Not Available',
          eligibility.reason || 'This policy is not eligible for renewal at this time.',
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        // Initialize renewal data with existing policy details
        setRenewalData(prev => ({
          ...prev,
          clientDetails: policyDetails.client_details || {},
          vehicleDetails: policyDetails.vehicle_details || {},
          productDetails: policyDetails.product_details || {},
          underwriterDetails: policyDetails.underwriter_details || null,
          premiumBreakdown: policyDetails.premium_breakdown || {}
        }));
      }
    } catch (error) {
      console.error('Failed to check renewal eligibility:', error);
      Alert.alert('Error', 'Failed to check renewal eligibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - complete renewal
      handleCompleteRenewal();
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };
  
  const handleCompleteRenewal = async () => {
    if (!policyDetails?.policyNo) {
      Alert.alert('Error', 'Policy information missing');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare renewal data
      const renewalPayload = {
        ...renewalData,
        coverStartDate: renewalData.coverStartDate
      };
      
      await djangoAPI.initialize();
      const result = await djangoAPI.renewMotorPolicy(policyDetails.policyNo, renewalPayload);
      
      if (result.success) {
        Alert.alert(
          'Renewal Successful',
          `Policy ${policyDetails.policyNo} has been renewed successfully.\n\nNew Policy Number: ${result.renewedPolicyNumber}`,
          [
            {
              text: 'View Policy',
              onPress: () => {
                // Navigate to policy details screen with new policy number
                navigation.navigate('Home');
              }
            },
            {
              text: 'Back to Home',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Renewal failed');
      }
    } catch (error) {
      console.error('Renewal failed:', error);
      Alert.alert(
        'Renewal Failed',
        error.message || 'Failed to renew policy. Please try again.',
        [
          { text: 'Retry', onPress: () => handleCompleteRenewal() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };
  
  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3].map(step => (
          <View key={step} style={styles.stepRow}>
            <View style={[
              styles.stepCircle,
              currentStep === step && styles.activeStepCircle,
              currentStep > step && styles.completedStepCircle
            ]}>
              {currentStep > step ? (
                <Text style={styles.stepCheckmark}>✓</Text>
              ) : (
                <Text style={[
                  styles.stepNumber,
                  currentStep === step && styles.activeStepNumber
                ]}>{step}</Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              currentStep === step && styles.activeStepLabel
            ]}>
              {step === 1 ? 'Policy Details' : 
               step === 2 ? 'Premium & Coverage' :
               'Payment'}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  const renderPolicyDetails = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Policy Renewal Details</Text>
        <Text style={styles.stepDescription}>
          Review your policy details and renewal eligibility
        </Text>
        
        {/* Renewal Eligibility Status */}
        {renewalEligibility && (
          <EnhancedCard style={styles.eligibilityCard}>
            <View style={styles.eligibilityHeader}>
              <Text style={styles.eligibilityTitle}>Renewal Status</Text>
              <StatusBadge 
                status={renewalEligibility.eligible ? 'Eligible' : 'Not Eligible'} 
                size="small" 
              />
            </View>
            
            {renewalEligibility.eligible ? (
              <View style={styles.eligibilityDetails}>
                <Text style={styles.eligibilityText}>
                  ✅ This policy is eligible for renewal
                </Text>
                <Text style={styles.eligibilitySubtext}>
                  Renewal Type: {renewalEligibility.renewalType?.toUpperCase() || 'STANDARD'}
                </Text>
                {renewalEligibility.daysUntilExpiry !== undefined && (
                  <Text style={styles.eligibilitySubtext}>
                    {renewalEligibility.daysUntilExpiry >= 0 
                      ? `Expires in ${renewalEligibility.daysUntilExpiry} days`
                      : `Expired ${Math.abs(renewalEligibility.daysUntilExpiry)} days ago`
                    }
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.eligibilityError}>
                ❌ {renewalEligibility.reason || 'Not eligible for renewal'}
              </Text>
            )}
          </EnhancedCard>
        )}
        
        <EnhancedCard style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <Text style={styles.policyHeaderText}>Current Policy Information</Text>
            <StatusBadge status={policyDetails.status || 'Active'} size="small" />
          </View>
          
          <View style={styles.policyDetail}>
            <Text style={styles.policyDetailLabel}>Policy Number</Text>
            <Text style={styles.policyDetailValue}>{policyDetails.policyNo}</Text>
          </View>
          
          <View style={styles.policyDetail}>
            <Text style={styles.policyDetailLabel}>Vehicle Registration</Text>
            <Text style={styles.policyDetailValue}>{policyDetails.vehicleReg}</Text>
          </View>
          
          {policyDetails.vehicleMake && policyDetails.vehicleModel && (
            <View style={styles.policyDetail}>
              <Text style={styles.policyDetailLabel}>Vehicle</Text>
              <Text style={styles.policyDetailValue}>
                {policyDetails.vehicleMake} {policyDetails.vehicleModel}
              </Text>
            </View>
          )}
          
          <View style={styles.policyDetail}>
            <Text style={styles.policyDetailLabel}>Current Expiry Date</Text>
            <Text style={styles.policyDetailValue}>
              {new Date(policyDetails.dueDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.policyDetail}>
            <Text style={styles.policyDetailLabel}>Coverage Type</Text>
            <Text style={styles.policyDetailValue}>{policyDetails.coverType || 'Comprehensive'}</Text>
          </View>
        </EnhancedCard>
        
        {/* New Coverage Period */}
        <EnhancedCard style={styles.renewalCard}>
          <Text style={styles.renewalCardTitle}>Renewal Coverage Period</Text>
          
          <View style={styles.policyDetail}>
            <Text style={styles.policyDetailLabel}>New Coverage Start Date</Text>
            <Text style={styles.policyDetailValue}>
              {new Date(renewalData.coverStartDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.policyDetail}>
            <Text style={styles.policyDetailLabel}>New Coverage End Date</Text>
            <Text style={styles.policyDetailValue}>
              {new Date(new Date(renewalData.coverStartDate).getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </Text>
          </View>
        </EnhancedCard>
      </View>
    );
  };
  
  const renderPremiumDetails = () => {
    if (!premium) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating premium...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Premium & Coverage</Text>
        <Text style={styles.stepDescription}>
          Review your premium and coverage details
        </Text>
        
        <EnhancedCard style={styles.premiumCard}>
          <Text style={styles.premiumHeaderText}>Premium Breakdown</Text>
          
          <View style={styles.premiumDetail}>
            <Text style={styles.premiumDetailLabel}>Basic Premium</Text>
            <Text style={styles.premiumDetailValue}>KES {premium.basicPremium.toLocaleString()}</Text>
          </View>
          
          <View style={styles.premiumDetail}>
            <Text style={styles.premiumDetailLabel}>Levies</Text>
            <Text style={styles.premiumDetailValue}>KES {premium.levies.toLocaleString()}</Text>
          </View>
          
          <View style={styles.premiumDetail}>
            <Text style={styles.premiumDetailLabel}>Stamp Duty</Text>
            <Text style={styles.premiumDetailValue}>KES {premium.stampDuty.toLocaleString()}</Text>
          </View>
          
          <View style={styles.premiumDetail}>
            <Text style={styles.premiumDetailLabel}>Additional Coverage</Text>
            <Text style={styles.premiumDetailValue}>KES {premium.extras.toLocaleString()}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalPremiumContainer}>
            <Text style={styles.totalPremiumLabel}>Total Premium</Text>
            <Text style={styles.totalPremiumValue}>KES {premium.totalPremium.toLocaleString()}</Text>
          </View>
        </EnhancedCard>
        
        <EnhancedCard style={styles.coverageCard}>
          <Text style={styles.coverageHeaderText}>Coverage Details</Text>
          
          <View style={styles.coverageItem}>
            <Text style={styles.coverageTitle}>Comprehensive Coverage</Text>
            <Text style={styles.coverageDescription}>
              Includes damage to your vehicle, third-party liability, fire, and theft protection.
            </Text>
          </View>
          
          <View style={styles.coverageItem}>
            <Text style={styles.coverageTitle}>Third-Party Liability</Text>
            <Text style={styles.coverageDescription}>
              Covers damages or injuries to others caused by your vehicle.
            </Text>
          </View>
          
          <View style={styles.coverageItem}>
            <Text style={styles.coverageTitle}>Additional Benefits</Text>
            <Text style={styles.coverageDescription}>
              Includes windscreen coverage, towing services, and emergency roadside assistance.
            </Text>
          </View>
        </EnhancedCard>
      </View>
    );
  };
  
  const renderPayment = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Payment</Text>
        <Text style={styles.stepDescription}>
          Choose your payment method to complete renewal
        </Text>
        
        <EnhancedCard style={styles.paymentSummaryCard}>
          <Text style={styles.paymentHeaderText}>Payment Summary</Text>
          
          <View style={styles.paymentDetail}>
            <Text style={styles.paymentDetailLabel}>Policy Number</Text>
            <Text style={styles.paymentDetailValue}>{policyDetails.policyNo}</Text>
          </View>
          
          <View style={styles.paymentDetail}>
            <Text style={styles.paymentDetailLabel}>Vehicle</Text>
            <Text style={styles.paymentDetailValue}>{policyDetails.vehicleReg}</Text>
          </View>
          
          <View style={styles.paymentDetail}>
            <Text style={styles.paymentDetailLabel}>Coverage Period</Text>
            <Text style={styles.paymentDetailValue}>1 Year</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalPaymentContainer}>
            <Text style={styles.totalPaymentLabel}>Total Amount</Text>
            <Text style={styles.totalPaymentValue}>KES {premium.totalPremium.toLocaleString()}</Text>
          </View>
        </EnhancedCard>
        
        <Text style={styles.paymentMethodsTitle}>Payment Method</Text>
        
        <TouchableOpacity 
          style={styles.paymentMethodCard}
          onPress={handleCompleteRenewal}
        >
          <View style={styles.paymentMethodIcon}>
            <Text style={styles.paymentMethodIconText}>💰</Text>
          </View>
          <View style={styles.paymentMethodDetails}>
            <Text style={styles.paymentMethodName}>M-PESA</Text>
            <Text style={styles.paymentMethodDescription}>Pay via M-PESA mobile money</Text>
          </View>
          <Text style={styles.paymentMethodArrow}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderCurrentStep = () => {
    switch(currentStep) {
      case 1:
        return renderPolicyDetails();
      case 2:
        return renderPremiumDetails();
      case 3:
        return renderPayment();
      default:
        return renderPolicyDetails();
    }
  };
  
  if (!policyDetails) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <SafeScreen>
      <StatusBar style="light" />
      
      <CompactCurvedHeader 
        title="Policy Renewal"
        subtitle={policyDetails.policyNo}
        showBackButton
        onBackPress={handlePreviousStep}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: insets.bottom + 100 }
        ]}
      >
        <View style={styles.headerSpacing} />
        
        {renderStepIndicator()}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {currentStep === 3 ? 'Processing payment...' : 'Loading...'}
            </Text>
          </View>
        ) : (
          renderCurrentStep()
        )}
      </ScrollView>
      
      {!loading && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handlePreviousStep}
          >
            <Text style={styles.backButtonText}>
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleNextStep}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 3 ? 'Complete Renewal' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  stepRow: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  activeStepCircle: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  completedStepCircle: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepNumber: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  activeStepNumber: {
    color: Colors.white,
  },
  stepCheckmark: {
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeStepLabel: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  policyCard: {
    marginBottom: Spacing.md,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  policyHeaderText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  policyDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  policyDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  policyDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  premiumCard: {
    marginBottom: Spacing.md,
  },
  premiumHeaderText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  premiumDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  premiumDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  premiumDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  totalPremiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPremiumLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  totalPremiumValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  coverageCard: {
    marginBottom: Spacing.md,
  },
  coverageHeaderText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  coverageItem: {
    marginBottom: Spacing.md,
  },
  coverageTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  coverageDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  paymentSummaryCard: {
    marginBottom: Spacing.md,
  },
  paymentHeaderText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  paymentDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  paymentDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  paymentDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  totalPaymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPaymentLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  totalPaymentValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  paymentMethodsTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  paymentMethodCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  paymentMethodIconText: {
    fontSize: 20,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  paymentMethodDescription: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  paymentMethodArrow: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
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
  backButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  backButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  // New styles for renewal integration
  eligibilityCard: {
    marginBottom: Spacing.md,
  },
  eligibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  eligibilityTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  eligibilityDetails: {
    gap: Spacing.xs,
  },
  eligibilityText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.success,
  },
  eligibilitySubtext: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  eligibilityError: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
  },
  renewalCard: {
    marginTop: Spacing.md,
  },
  renewalCardTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
});
