import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import djangoAPI from '@services/DjangoAPIService';
import { Colors } from '@constants/Colors';
import { Typography } from '@constants/Typography';

import CategorySelectionStep from './steps/CategorySelectionStep';
import PolicyDetailsStep from './steps/PolicyDetailsStep';
import KYCStep from './steps/KYCStep';
import PaymentProcessingStep from './steps/PaymentProcessingStep';
import VehicleVerificationScreen from './VehicleVerification/VehicleVerificationScreen';

// Keep existing advanced steps available to preserve full flow
import UnderwriterSelectionStep from './steps/UnderwriterSelectionStep';
import AddonSelectionStep from './AddonsSelection/AddonSelectionStep';
import DocumentsStep from './steps/DocumentsStep';
import ClientDetailsStep from './steps/ClientDetailsStep';
import SubmissionStep from './steps/SubmissionStep';

export default function MotorInsuranceContainer({ route, navigation }) {
  // Basic error boundary to keep flow resilient during refactor
  class StepErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(err) { console.error('[MotorInsuranceContainer] Step render error:', err); }
    render() { return this.state.hasError ? <View style={{ padding: 16 }} /> : this.props.children; }
  }

  const insets = useSafeAreaInsets();
  const { state, actions } = useMotorInsurance();

  // Local step state (we keep it local to the container for now)
  const [currentStep, setCurrentStep] = useState(0);

  // DMVIC Verification State
  const [verificationStatus, setVerificationStatus] = useState(null); // null | 'checking' | 'found' | 'not_found'
  const [existingCoverData, setExistingCoverData] = useState(null); // DMVIC response data
  const [showVerificationScreen, setShowVerificationScreen] = useState(false); // Controls verification screen display

  // Mount effect placeholder (original cache clearing runs elsewhere in file)
  useEffect(() => {}, []);

  // Determine flow based on selected subcategory (Third Party vs Comprehensive)
  const steps = useMemo(() => {
    const sel = state.selectedSubcategory;
    const rawType = sel?.coverage_type ?? sel?.type ?? '';
    const norm = typeof rawType === 'string' ? rawType.toUpperCase().trim() : '';
    const isComprehensive = norm === 'COMPREHENSIVE' || norm === 'COMP' || norm.includes('COMPREHENSIVE');

    if (isComprehensive) {
      return ['Category', 'Subcategory', 'Policy Details', 'Underwriters', 'Add-ons', 'Client Details', 'Submission'];
    }
    // Third Party flow: Policy Details → KYC (DMVIC drawer appears here) → Documents → Client Details
    return ['Category', 'Subcategory', 'Policy Details', 'KYC', 'Documents', 'Client Details', 'Payment', 'Submission'];
  }, [state.selectedSubcategory?.coverage_type, state.selectedSubcategory?.type]);

  // Validation per step + helpful message
  const { canProceed, validationMessage } = useMemo(() => {
    const step = steps[currentStep] || '';

    // Helpers
    const vehicle = state.vehicleDetails || {};
    const pricingInputs = state.pricingInputs || {};
    const pick = (...vals) => vals.find(v => typeof v === 'string' ? v?.trim() : v);
    const str = (v) => (typeof v === 'string' ? v.trim() : '');

    // Common fields pulled from either source
    const registration = pick(
      vehicle.registrationNumber,
      pricingInputs.registrationNumber,
      vehicle.Registration_Number,
      pricingInputs.Registration_Number,
      vehicle.registration_number,
      pricingInputs.registration_number,
      vehicle.registration
    );
    const identificationType = pick(
      vehicle.identificationType,
      pricingInputs.identificationType,
      vehicle.Vehicle_Identification_Type,
      pricingInputs.Vehicle_Identification_Type
    );
    const coverStart = pick(
      vehicle.cover_start_date,
      pricingInputs.cover_start_date,
      vehicle.Cover_Start_Date,
      pricingInputs.Cover_Start_Date,
      vehicle.coverStartDate
    );

    // Determine coverage path
    const rawType = state.selectedSubcategory?.coverage_type ?? state.selectedSubcategory?.type ?? '';
    const norm = typeof rawType === 'string' ? rawType.toUpperCase().trim() : '';
    const isComprehensive = norm.includes('COMP');

    // Underwriter and client data
    const selectedUnderwriter = state.selectedUnderwriter;
    const client = state.clientDetails || state.clientInfo || {};

    // Premium sources
    const premiumTotal = (
      (state.premium?.total) ||
      (state.premium_breakdown?.total) ||
      (state.premiumBreakdown?.total) ||
      (selectedUnderwriter?.total_premium) ||
      0
    );

    switch (step) {
      case 'Category': {
        const ok = !!state.selectedCategory;
        return { canProceed: ok, validationMessage: ok ? '' : 'Select a vehicle category to continue' };
      }
      case 'Subcategory': {
        const ok = !!state.selectedSubcategory;
        return { canProceed: ok, validationMessage: ok ? '' : 'Select a cover type to continue' };
      }
      case 'Policy Details': {
        const hasReg = !!str(registration);
        const hasIdType = !!str(identificationType);
        const hasCover = !!str(coverStart);
        const ok = hasReg && hasIdType && hasCover;
        let msg = '';
        if (!ok) {
          if (!hasReg) msg = 'Enter vehicle registration';
          else if (!hasIdType) msg = 'Select identification type';
          else if (!hasCover) msg = 'Select cover start date';
        }
        return { canProceed: ok, validationMessage: msg };
      }
      case 'KYC': {
        // KYC step just displays data, no validation needed
        // DMVIC drawer will appear here if existing cover found
        return { canProceed: true, validationMessage: '' };
      }
      case 'Underwriters': {
        // Required for comprehensive path
        const ok = isComprehensive ? !!selectedUnderwriter : true;
        return { canProceed: ok, validationMessage: ok ? '' : 'Select an underwriter to continue' };
      }
      case 'Documents': {
        // Keep permissive for now; documents step handles its own checks
        return { canProceed: true, validationMessage: '' };
      }
      case 'Client Details': {
        const fullName = str(client.fullName || client.name);
        const phone = str(client.phone || client.phoneNumber || client.msisdn);
        const ok = !!fullName && !!phone;
        let msg = '';
        if (!ok) {
          if (!fullName) msg = 'Enter client full name';
          else if (!phone) msg = 'Enter client phone number';
        }
        return { canProceed: ok, validationMessage: msg };
      }
      case 'Payment': {
        const ok = premiumTotal > 0;
        return { canProceed: ok, validationMessage: ok ? '' : 'Premium not calculated yet' };
      }
      case 'Submission':
      default:
        return { canProceed: true, validationMessage: '' };
    }
  }, [steps, currentStep, state]);

  const goNext = useCallback(async () => {
    const currentStepName = steps[currentStep];

    // Simply proceed to next step - DMVIC check will happen when entering KYC step
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }, [steps, currentStep]);

  const goBack = useCallback(() => {
    // If on verification screen, go back to Policy Details
    if (showVerificationScreen) {
      setShowVerificationScreen(false);
      setVerificationStatus(null);
      setExistingCoverData(null);
      return;
    }
    
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, [showVerificationScreen]);

  // DMVIC Check: Trigger when entering KYC step
  useEffect(() => {
    const currentStepName = steps[currentStep];
    
    console.log('🔍 [DMVIC] Step changed:', { currentStepName, currentStep, verificationStatus });
    
    // Reset verification status when leaving KYC step
    if (currentStepName !== 'KYC' && verificationStatus !== null) {
      console.log('🔄 [DMVIC] Leaving KYC step - resetting verification status');
      setVerificationStatus(null);
      setExistingCoverData(null);
      setShowVerificationScreen(false);
      return;
    }
    
    if (currentStepName === 'KYC' && verificationStatus === null) {
      console.log('✅ [DMVIC] Triggering check on KYC step entry');
      const performDMVICCheck = async () => {
        try {
          setVerificationStatus('checking');

          // Extract vehicle data from state
          const vehicleData = state.vehicleDetails || state.pricingInputs || {};
          const registrationNumber = vehicleData.registrationNumber || vehicleData.registration;

          if (registrationNumber && registrationNumber.trim()) {
            // Call DMVIC search-vehicle endpoint (same as "Check Vehicle" button)
            const response = await djangoAPI.makeRequest('/api/insurance/dmvic/search-vehicle/', {
              method: 'POST',
              body: JSON.stringify({
                registration_number: registrationNumber.trim().toUpperCase()
              })
            });
            
            console.log('✅ [DMVIC UAT] Response:', JSON.stringify(response, null, 2));

            // Check if existing cover found (based on DMVIC response structure)
            if (response && response.success && response.vehicle) {
              const vehicle = response.vehicle;
              const hasActiveCover = vehicle.has_active_cover || false;
              const currentPolicy = vehicle.current_policy;

              if (hasActiveCover && currentPolicy) {
                // Vehicle has active cover - show verification screen
                console.log('⚠️ [DMVIC] Existing cover found:', currentPolicy);
                
                // Transform DMVIC response to expected format
                const policyData = {
                  exists: true,
                  policy: {
                    policy_number: currentPolicy.policy_number || 'N/A',
                    vehicle_registration: registrationNumber.toUpperCase(),
                    insurer: currentPolicy.member_company || 'Unknown Insurer',
                    cover_type: currentPolicy.class_of_insurance || 'Unknown',
                    start_date: currentPolicy.cover_start_date || currentPolicy.cover_from || null,
                    expiry_date: currentPolicy.cover_end_date || currentPolicy.cover_to || null,
                    certificate_number: currentPolicy.certificate_type || currentPolicy.policy_number || 'N/A',
                    premium: currentPolicy.premium || null
                  }
                };

                setVerificationStatus('found');
                setExistingCoverData(policyData);
                
                console.log('📊 [DMVIC] Policy data set:', JSON.stringify(policyData, null, 2));
                
                // Auto-open drawer after short delay
                setTimeout(() => {
                  setShowVerificationScreen(true);
                  console.log('📋 [DMVIC] Auto-opening verification drawer on KYC step');
                  console.log('📋 [DMVIC] existingCoverData:', JSON.stringify(policyData, null, 2));
                }, 300);
              } else {
                // No active cover or policy found
                console.log('✓ [DMVIC] No active cover - proceeding');
                setVerificationStatus('not_found');
                setExistingCoverData(null);
              }
            } else {
              // DMVIC returned no vehicle or unsuccessful response
              console.log('✓ [DMVIC] No existing cover - proceeding');
              setVerificationStatus('not_found');
              setExistingCoverData(null);
            }
          } else {
            console.log('ℹ️ [DMVIC] No registration number - skipping check');
            setVerificationStatus('not_found');
            setExistingCoverData(null);
          }
        } catch (error) {
          // Silently handle errors - don't block user flow
          console.warn('⚠️ [DMVIC] Check failed (continuing anyway):', error.message);
          setVerificationStatus('not_found');
          setExistingCoverData(null);
        }
      };

      performDMVICCheck();
    }
  }, [currentStep, steps, verificationStatus, state.vehicleDetails, state.pricingInputs]);

  // Auto-open verification drawer after transitioning to KYC step (REMOVED - now handled in DMVIC check)
  // useEffect(() => {
  //   const nextStepName = steps[currentStep];
  //   const previousStepName = steps[currentStep - 1];
  //   
  //   if (previousStepName === 'Policy Details' && 
  //       verificationStatus === 'found' && 
  //       existingCoverData && 
  //       !showVerificationScreen) {
  //     const timer = setTimeout(() => {
  //       setShowVerificationScreen(true);
  //       console.log('📋 [DMVIC] Auto-opening verification drawer on step:', nextStepName);
  //     }, 300);
  //     
  //     return () => clearTimeout(timer);
  //   }
  // }, [currentStep, steps, verificationStatus, existingCoverData, showVerificationScreen]);

  // Handler for "Adjust Start Date" button on verification screen
  const handleAdjustStartDate = useCallback(() => {
    console.log('📅 [DMVIC] User chose to adjust start date');
    
    // Close verification screen
    setShowVerificationScreen(false);
    
    // Calculate minimum date (existing cover expiry + 1 day)
    if (existingCoverData?.policy?.expiry_date) {
      try {
        const expiryDateStr = existingCoverData.policy.expiry_date;
        
        // Parse DD/MM/YYYY format
        let expiryDate;
        if (expiryDateStr.includes('/')) {
          const [day, month, year] = expiryDateStr.split('/');
          expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          expiryDate = new Date(expiryDateStr);
        }
        
        const minDate = new Date(expiryDate);
        minDate.setDate(minDate.getDate() + 1);
        
        // Store min date in state for date picker validation
        console.log('ℹ️ [DMVIC] Existing cover expiry:', expiryDateStr);
        console.log('ℹ️ [DMVIC] Minimum start date:', minDate.toISOString().split('T')[0]);
        
        // TODO: Pass minDate to PolicyDetailsStep via context or state
      } catch (error) {
        console.error('❌ [DMVIC] Error parsing date:', error);
      }
    }
    
    // Navigate back to Policy Details step
    const policyDetailsIndex = steps.indexOf('Policy Details');
    if (policyDetailsIndex >= 0) {
      setCurrentStep(policyDetailsIndex);
    }
    
    // Clear verification state
    setVerificationStatus(null);
    setExistingCoverData(null);
  }, [existingCoverData, steps]);

  // Handler for "Submit Debit Note" button on verification screen
  const handleSubmitDebitNote = useCallback(() => {
    console.log('📝 [DMVIC] User chose to submit debit note');
    
    // Close verification screen
    setShowVerificationScreen(false);
    
    // Clear verification state
    setVerificationStatus(null);
    setExistingCoverData(null);
    
    // TODO: Navigate to debit note submission screen when built
    // For now, show alert
    if (typeof alert !== 'undefined') {
      alert('Debit Note Submission', 'This feature will allow you to request cancellation of the existing policy. Coming soon!');
    }
    
    // Could also proceed to next step or return to vehicle details
    // For now, let's stay on current step
  }, []);

  const stepName = steps[currentStep] || '';
  const isFirstStep = currentStep === 0;

  // Optional: support direct payment deep-link
  useEffect(() => {
    const startAtPayment = route?.params?.startAtPayment;
    if (startAtPayment) {
      const idx = steps.indexOf('Payment');
      if (idx >= 0) setCurrentStep(idx);
    }
  }, [route?.params?.startAtPayment, steps]);

  const renderStep = () => {
    const stepName = steps[currentStep];

    // Normal step rendering - no loading overlay blocking the screen
    switch (stepName) {
      case 'Category':
      case 'Subcategory':
        return <CategorySelectionStep stepName={stepName} onNext={goNext} />;
      case 'Policy Details':
        return <PolicyDetailsStep />;
      case 'KYC':
        return <KYCStep />;
      case 'Underwriters':
        return <UnderwriterSelectionStep />;
      case 'Add-ons':
        return <AddonSelectionStep />;
      case 'Documents':
        return <DocumentsStep />;
      case 'Client Details':
        return <ClientDetailsStep />;
      case 'Payment':
        return <PaymentProcessingStep />;
      case 'Submission':
      default:
        return <SubmissionStep />;
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#D5222B" />
      
      {/* Red Header Bar - Same as other insurance screens */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Motor Vehicle Insurance</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Progress Indicator Below Header */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressRow}>
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const label = step === 'Category' ? 'Vehicle Type' : step;
            return (
              <View key={`${step}-${idx}`} style={isActive ? styles.activeStep : styles.dotSmall}>
                <Text style={isActive ? styles.activeIndex : styles.dotIndex}>{idx + 1}</Text>
                {isActive && <Text style={styles.activeLabel}>{label}</Text>}
              </View>
            );
          })}
        </View>
      </View>

      {/* Step Content - Scrollable */}
      <StepErrorBoundary>
        <View style={styles.content}>{renderStep()}</View>
      </StepErrorBoundary>

      {/* Navigation Footer at Bottom */}
      <View style={[styles.navigationFooter, { paddingBottom: insets.bottom + 8 }]}>
        {/* Validation Message */}
        {!!validationMessage && (
          <Text style={styles.validationText}>{validationMessage}</Text>
        )}
        
        {/* Back and Next Buttons */}
        <View style={styles.navButtonRow}>
          {!isFirstStep ? (
            <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.75}>
              <Ionicons name="chevron-back" size={20} color="#495057" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 90 }} />
          )}

          {!isFirstStep && (
            <TouchableOpacity
              style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
              onPress={goNext}
              disabled={!canProceed}
              activeOpacity={0.75}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Verification Drawer Modal - Shows on top of KYC step */}
      <Modal
        visible={showVerificationScreen || verificationStatus === 'checking'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (verificationStatus !== 'checking') {
            setShowVerificationScreen(false);
            setVerificationStatus(null);
            setExistingCoverData(null);
          }
        }}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (verificationStatus !== 'checking') {
              setShowVerificationScreen(false);
              setVerificationStatus(null);
              setExistingCoverData(null);
            }
          }}
        >
          {/* Bottom sheet - stop propagation to prevent backdrop dismiss */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[
              styles.drawerContainer,
              verificationStatus === 'checking' && styles.drawerContainerSmall
            ]}>
              {verificationStatus === 'checking' ? (
                <>
                  <View style={styles.drawerHandle} />
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#D5222B" />
                    <Text style={styles.loadingTitle}>Checking for existing cover...</Text>
                    <Text style={styles.loadingSubtitle}>Please wait</Text>
                  </View>
                </>
              ) : showVerificationScreen && existingCoverData ? (
                (() => {
                  console.log('🎨 [Modal] Rendering VehicleVerificationScreen with:', {
                    showVerificationScreen,
                    existingCoverData,
                    verificationStatus
                  });
                  return (
                    <VehicleVerificationScreen
                      existingCoverData={existingCoverData}
                      onAdjustStartDate={handleAdjustStartDate}
                      onSubmitDebitNote={handleSubmitDebitNote}
                    />
                  );
                })()
              ) : (
                (() => {
                  console.log('❌ [Modal] Not rendering VehicleVerificationScreen:', {
                    showVerificationScreen,
                    existingCoverData,
                    verificationStatus
                  });
                  return <View style={{padding: 20, backgroundColor: '#FFFFFF'}}>
                    <Text style={{color: '#000000', fontSize: 16}}>Debug: No content</Text>
                  </View>;
                })()
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  
  // Red Header Bar - Same as other insurance screens
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D5222B',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  
  // Progress Indicator
  progressWrapper: { 
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
  },
  dotSmall: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#E5E7EB', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  dotIndex: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  activeStep: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#D5222B',
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16 
  },
  activeIndex: { color: '#fff', fontWeight: '700', fontSize: 12 },
  activeLabel: { color: '#fff', fontWeight: '600', fontSize: 13 },
  
  // Content
  content: { 
    flex: 1, 
    paddingHorizontal: 12, 
    paddingTop: 8,
    paddingBottom: 8,
  },
  
  // Navigation Footer
  navigationFooter: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  validationText: { 
    color: '#DC2626', 
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  navButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  backButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', 
    borderWidth: 1, 
    borderColor: '#ced4da', 
    paddingVertical: 10, 
    paddingHorizontal: 16,
    borderRadius: 8, 
    minWidth: 90,
    gap: 4,
  },
  backButtonText: { 
    color: '#495057', 
    fontWeight: '600',
    fontSize: 14,
  },
  nextButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D5222B', 
    paddingVertical: 12, 
    paddingHorizontal: 20,
    borderRadius: 8, 
    flex: 1,
    maxWidth: 200,
    gap: 4,
  },
  nextButtonDisabled: { backgroundColor: '#ced4da' },
  nextButtonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 14,
  },
  
  // DMVIC Loading Overlay
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  
  // DMVIC Verification Drawer Styles (matches CategorySelectionStep design)
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '75%',
    maxHeight: '98%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  drawerContainerSmall: {
    minHeight: '30%',
    maxHeight: '35%',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  
  // Loading Drawer (when checking)
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  loadingTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#1F2937',
    marginTop: 8,
  },
  loadingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
