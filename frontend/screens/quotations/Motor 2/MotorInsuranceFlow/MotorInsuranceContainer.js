import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import djangoAPI from '@services/DjangoAPIService';

import CategorySelectionStep from './steps/CategorySelectionStep';
import VehicleDetailsStep from './steps/VehicleDetailsStep';
import PaymentProcessingStep from './steps/PaymentProcessingStep';

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

  // IMPORTANT: Clear caches on mount to prevent data bleeding between policies
  useEffect(() => {
    const clearCaches = async () => {
      try {
        // Clear DjangoAPIService field requirements cache
        if (djangoAPI.clearMotor2Cache) {
          djangoAPI.clearMotor2Cache();
        }
        
        // Clear all Motor2-related AsyncStorage caches
        const motor2CacheKeys = [
          'motor_insurance_flow_state',
          'cache_underwriters',
          'cache_last_premium',
          'policy_submission_guard',
        ];
        
        await Promise.all(
          motor2CacheKeys.map(key => AsyncStorage.removeItem(key).catch(() => {}))
        );
        
        // Also clear any subcategory caches (these use dynamic keys)
        const allKeys = await AsyncStorage.getAllKeys();
        const subcategoryCacheKeys = allKeys.filter(key => 
          key.startsWith('motor_subcategories_') || 
          key.startsWith('cache_underwriters_') ||
          key.startsWith('cache_pricing_')
        );
        await Promise.all(
          subcategoryCacheKeys.map(key => AsyncStorage.removeItem(key).catch(() => {}))
        );
        
        console.log('🧹 [MotorInsuranceContainer] All Motor2 caches cleared - fresh start');
      } catch (e) {
        console.warn('[MotorInsuranceContainer] Failed to clear caches:', e);
      }
    };
    
    clearCaches();
  }, []); // Run once on mount

  // Determine flow based on selected subcategory (Third Party vs Comprehensive)
  const steps = useMemo(() => {
    const sel = state.selectedSubcategory;
    const rawType = sel?.coverage_type ?? sel?.type ?? '';
    const norm = typeof rawType === 'string' ? rawType.toUpperCase().trim() : '';
    const isComprehensive = norm === 'COMPREHENSIVE' || norm === 'COMP' || norm.includes('COMPREHENSIVE');

    if (isComprehensive) {
      return ['Category', 'Subcategory', 'Vehicle Details', 'Underwriters', 'Add-ons', 'Client Details', 'Submission'];
    }
    return ['Category', 'Subcategory', 'Vehicle Details', 'Documents', 'Client Details', 'Payment', 'Submission'];
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
      case 'Vehicle Details': {
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

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }, [steps.length]);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
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
    switch (stepName) {
      case 'Category':
      case 'Subcategory':
        return <CategorySelectionStep stepName={stepName} onNext={goNext} />;
      case 'Vehicle Details':
        return <VehicleDetailsStep />;
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
});
