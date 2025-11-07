import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
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

  // Phase 1.3: Removed local DMVIC state - now managed in MotorInsuranceContext
  // - verificationStatus (removed - inline indicators in Step 3 instead)
  // - existingCoverData (removed - now state.existingCoverData)
  // - showVerificationScreen (removed - now state.showVerificationScreen)

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
  const client = (state.pricingInputs?.clientDetails) || state.clientDetails || state.clientInfo || {};

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
        // Validate that required documents are uploaded
        const uploadedDocs = state.uploadedDocuments || {};
        const requiredDocs = ['logbook', 'id_copy', 'kra_pin'];
        const missingDocs = requiredDocs.filter(doc => !uploadedDocs[doc]);
        
        const allUploaded = missingDocs.length === 0;
        let msg = '';
        if (!allUploaded) {
          msg = `Please upload: ${missingDocs.map(d => {
            switch(d) {
              case 'logbook': return 'Vehicle Logbook';
              case 'id_copy': return 'National ID';
              case 'kra_pin': return 'KRA PIN Certificate';
              default: return d;
            }
          }).join(', ')}`;
        }
        return { canProceed: allUploaded, validationMessage: msg };
      }
      case 'Client Details': {
        const fullName = str(client.fullName || client.name);
        const phone = str(client.phone || client.phoneNumber || client.msisdn);
        const email = str(client.email);
        const kraPin = str(client.kra_pin || client.kraPin);
        const idNumber = str(client.id_number || client.idNumber);
        
        // Basic presence validation
        if (!fullName) {
          return { canProceed: false, validationMessage: 'Enter client full name' };
        }
        if (!phone) {
          return { canProceed: false, validationMessage: 'Enter client phone number' };
        }
        if (!email) {
          return { canProceed: false, validationMessage: 'Enter client email address' };
        }
        
        // Phone number validation (Kenyan format: 07XXXXXXXX or 01XXXXXXXX or +2547XXXXXXXX)
        const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
        if (!phoneRegex.test(phone.replace(/[\s\-]/g, ''))) {
          return { canProceed: false, validationMessage: 'Enter valid Kenyan phone number (e.g., 0712345678)' };
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return { canProceed: false, validationMessage: 'Enter valid email address' };
        }
        
        // KRA PIN validation (format: A000000000X)
        if (kraPin) {
          const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/;
          if (!kraPinRegex.test(kraPin.replace(/[\s\-]/g, ''))) {
            return { canProceed: false, validationMessage: 'Enter valid KRA PIN (e.g., A000000000X)' };
          }
        }
        
        // ID Number validation (8 digits minimum)
        if (idNumber && idNumber.length < 7) {
          return { canProceed: false, validationMessage: 'Enter valid ID number (minimum 7 digits)' };
        }
        
        return { canProceed: true, validationMessage: '' };
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

  // ✅ NEW: Reference to hold validation function from PolicyDetailsStep
  const policyDetailsValidatorRef = useRef(null);
  
  const goNext = useCallback(async () => {
    const currentStepName = steps[currentStep];

    // ✅ NEW: If on Policy Details step, trigger DMVIC validation before proceeding
    if (currentStepName === 'Policy Details' && policyDetailsValidatorRef.current) {
      console.log('[MotorContainer] Triggering Policy Details validation before navigation');
      try {
        const validationResult = await policyDetailsValidatorRef.current();
        console.log('[MotorContainer] 🔍 Validation result:', JSON.stringify(validationResult, null, 2));
        
        if (!validationResult.valid) {
          console.log('[MotorContainer] 🔍 Validation failed. Reason:', validationResult.reason);
          
          // If this is a date-collision case, store the warning but ALLOW navigation to KYC
          if (validationResult.reason === 'DATE_COLLISION' || validationResult.reason === 'EXISTING_COVER') {
            console.log('[MotorContainer] ⚠️ Date collision detected - storing for KYC step');
            if (validationResult.minDate) {
              actions.setMinCoverStartDate(validationResult.minDate);
              console.log('[MotorContainer] Set minCoverStartDate:', validationResult.minDate);
            }
            // Don't block navigation - modal will show in KYC step
            // Just proceed to next step
            console.log('[MotorContainer] ✅ Allowing navigation to KYC despite collision');
          } else {
            // Other validation errors - block navigation
            Alert.alert('Validation Error', validationResult.message || 'Please complete the form correctly.', [{ text: 'OK' }]);
            return;
          }
        } else {
          console.log('[MotorContainer] Policy Details validation passed');
        }
      } catch (error) {
        console.error('[MotorContainer] Validation error:', error);
        Alert.alert('Error', 'Failed to validate vehicle details. Please try again.', [{ text: 'OK' }]);
        return;
      }
    }

    // Phase 1.3: REMOVED - Don't block navigation here anymore
    // The modal will show automatically in KYC step if there's a collision
    /*
    const selectedCoverDateStr = state.vehicleDetails?.cover_start_date || state.vehicleDetails?.coverStartDate;
    const minCoverStartDateStr = state.minCoverStartDate;
    const isCollision = Boolean(
      minCoverStartDateStr && selectedCoverDateStr && new Date(selectedCoverDateStr) < new Date(minCoverStartDateStr)
    );

    if (state.showVerificationScreen || isCollision) {
      console.error('[MotorContainer] 🚫 Navigation blocked - existing cover must be resolved first');
      actions.setShowVerificationScreen(true);
      Alert.alert(...);
      return;
    }
    */

    // Additional check for Policy Details step specifically
    if (currentStepName === 'Policy Details') {
      const registrationNumber = 
        state.vehicleDetails?.registrationNumber || 
        state.vehicleDetails?.registration_number || 
        state.vehicleDetails?.Registration_Number;
      
      const coverStartDate = 
        state.vehicleDetails?.cover_start_date || 
        state.vehicleDetails?.coverStartDate;
      
      // If there's a minCoverStartDate constraint, ensure coverStartDate is after it
      if (state.minCoverStartDate && coverStartDate) {
        const minDate = new Date(state.minCoverStartDate);
        const selectedDate = new Date(coverStartDate);
        
        if (selectedDate < minDate) {
          console.error('[MotorContainer] 🚫 Selected cover start date is before minimum allowed date');
          Alert.alert(
            '❌ Invalid Cover Start Date',
            `The selected cover start date (${selectedDate.toLocaleDateString()}) is before the minimum allowed date (${minDate.toLocaleDateString()}).\n\nExisting cover expires on ${new Date(minDate.getTime() - 24*60*60*1000).toLocaleDateString()}. Please select a start date on or after ${minDate.toLocaleDateString()}.`,
            [{ text: 'OK' }]
          );
          return;
        }
      }
    }

    console.log('[MotorContainer] ✅ Navigation allowed to next step');
    // Proceed to next step
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }, [steps, currentStep, state.showVerificationScreen, state.existingCoverData, state.minCoverStartDate, state.vehicleDetails, actions]);

  const goBack = useCallback(() => {
    // Phase 1.3: If context shows verification screen, use context state
    if (state.showVerificationScreen) {
      actions.setShowVerificationScreen(false);
      return;
    }
    
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, [state.showVerificationScreen, actions]);

  // Phase 1.3: Handler for "Adjust Start Date" - now uses context state
  const handleAdjustStartDate = useCallback(() => {
    console.log('📅 [DMVIC] User chose to adjust start date');
    
    // Close verification screen
    actions.setShowVerificationScreen(false);
    
    // ✅ NEW: If on KYC step, go back to Policy Details to adjust date
    // If already on Policy Details, stay there
    const currentStepName = steps[currentStep];
    if (currentStepName === 'KYC') {
      console.log('[DMVIC] Navigating back to Policy Details from KYC to adjust date');
      const policyDetailsIndex = steps.indexOf('Policy Details');
      if (policyDetailsIndex >= 0) {
        setCurrentStep(policyDetailsIndex);
      }
    } else {
      console.log('[DMVIC] Already on Policy Details, modal closed for date adjustment');
    }
    
    // Note: minDate calculation now handled in PolicyDetailsStep.processDMVICResult
  }, [actions, steps, currentStep]);

  // Phase 1.3: Handler for "Submit Debit Note" - now uses context state
  const handleSubmitDebitNote = useCallback(() => {
    console.log('📝 [DMVIC] User chose to submit debit note');
    
    // Close verification screen
    actions.setShowVerificationScreen(false);
    
    // TODO: Navigate to debit note submission screen when built
    // For now, show alert
    Alert.alert(
      'Debit Note Submission',
      'This feature will allow you to request cancellation of the existing policy. Coming soon!',
      [{ text: 'OK' }]
    );
    
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
        return <PolicyDetailsStep onValidateBeforeNext={(validator) => { policyDetailsValidatorRef.current = validator; }} />;
      case 'KYC':
        return <KYCStep />;
      case 'Underwriters':
        return <UnderwriterSelectionStep />;
      case 'Add-ons':
        return <AddonSelectionStep />;
      case 'Documents':
        return <DocumentsStep onExtractedData={handleDocumentExtracted} />;
      case 'Client Details':
        return <ClientDetailsStep />;
      case 'Payment':
        return <PaymentProcessingStep />;
      case 'Submission':
      default:
        return <SubmissionStep />;
    }
  };

  // Normalize helper for comparing strings like reg/chassis
  const normalize = (v) => (v || '').toString().toUpperCase().replace(/\s+/g, '').trim();

  // Handle extracted data from documents and compare with DMVIC/vehicle details
  const handleDocumentExtracted = useCallback((documentKey, fields) => {
    try {
      // ✅ Guard: fields must be a valid object
      if (!fields || typeof fields !== 'object') {
        console.log('[MotorInsuranceContainer] No fields extracted for:', documentKey);
        return;
      }

      // Persist extracted fields in context, both under key and merged 'all'
      const prevAll = state.extractedDocuments?.all || {};
      actions.updateExtractedDocuments({
        [documentKey]: fields,
        all: { ...prevAll, ...fields },
      });

      // If logbook, compare critical identifiers with current DMVIC/vehicle details
      if (documentKey === 'logbook') {
        const dv = state.vehicleDetails || {};
        const mismatches = [];
        if (fields.registration_number && dv.registrationNumber && normalize(fields.registration_number) !== normalize(dv.registrationNumber)) {
          mismatches.push('Registration Number');
        }
        if (fields.chassis_number && (dv.chassisNumber || dv.chassis_number) && normalize(fields.chassis_number) !== normalize(dv.chassisNumber || dv.chassis_number)) {
          mismatches.push('Chassis Number');
        }

        if (mismatches.length) {
          Alert.alert(
            'Data Mismatch Detected',
            `Logbook vs DMVIC ${mismatches.join(' & ')} differ. Which source should we use?`,
            [
              {
                text: 'Use DMVIC',
                style: 'cancel',
              },
              {
                text: 'Use Logbook Data',
                style: 'default',
                onPress: () => {
                  const patch = {};
                  if (fields.registration_number) patch.registrationNumber = fields.registration_number.toUpperCase();
                  if (fields.chassis_number) patch.chassisNumber = fields.chassis_number.toUpperCase();
                  if (fields.engine_number) patch.engineNumber = fields.engine_number.toUpperCase();
                  if (fields.make) patch.make = fields.make;
                  if (fields.model) patch.model = fields.model;
                  actions.updateVehicleDetails(patch);
                },
              },
            ]
          );
        }
      }
    } catch (e) {
      console.warn('[MotorInsuranceContainer] handleDocumentExtracted error:', e?.message || e);
    }
  }, [state.extractedDocuments?.all, state.vehicleDetails]);

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

      {/* Phase 1.3: Simplified Modal - No loading drawer, only VehicleVerificationScreen */}
      {/* Modal now only renders when existing cover found (inline loader in Step 3 instead) */}
      <Modal
        visible={state.showVerificationScreen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          actions.setShowVerificationScreen(false);
        }}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            actions.setShowVerificationScreen(false);
          }}
        >
          {/* Bottom sheet - stop propagation to prevent backdrop dismiss */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawerContainer}>
              {state.existingCoverData ? (
                <VehicleVerificationScreen
                  existingCoverData={state.existingCoverData}
                  onAdjustStartDate={handleAdjustStartDate}
                  onSubmitDebitNote={handleSubmitDebitNote}
                />
              ) : (
                <View style={{padding: 20, backgroundColor: '#FFFFFF'}}>
                  <Text style={{color: '#666', fontSize: 14, textAlign: 'center'}}>
                    No existing cover data available
                  </Text>
                </View>
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
