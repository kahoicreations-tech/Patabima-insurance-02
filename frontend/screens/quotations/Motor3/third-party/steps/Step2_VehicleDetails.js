/**
 * Step 2: Vehicle Details (Policy Details)
 * Uses TPVehicleForm component
 * Matches Motor 2 Policy Details screen design
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Modal, Pressable, ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import TPVehicleForm from '../components/TPVehicleForm';
import { useThirdParty } from '../../contexts/ThirdPartyContext';
import { useMotor3 } from '../../contexts/Motor3Context';
import StepNavigation from './StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';
import djangoAPI from '../../../../../services/DjangoAPIService';
import VehicleVerificationDrawer from '../components/VehicleVerificationDrawer';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, UI } from '../../../../../theme';

function parseFlexibleDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  // Handle ISO date-only (YYYY-MM-DD) as LOCAL date to avoid UTC timezone shifts.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string' && value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isStartDateCompliant({ expiryStr, coverStart }) {
  if (!expiryStr || !coverStart) return true;
  const expiry = parseFlexibleDate(expiryStr);
  const selected = parseFlexibleDate(coverStart);
  if (!expiry || !selected) return true;
  const min = new Date(expiry);
  min.setDate(min.getDate() + 1);
  return selected >= min;
}

// Motor2-matching step labels
const STEP_LABELS = ['Vehicle Type', 'Coverage', 'Vehicle', 'Underwriter', 'Client', 'Documents', 'Review', 'Payment'];

const Step2_VehicleDetails = ({ onNext, onBack, currentStep, totalSteps }) => {
  const { formData, setUnderwriters, lockDMVICData, unlockDMVICData, updateField, clearError } = useThirdParty();
  const {
    selectedSubcategory,
    dmvicSearchResult,
    dmvicAcknowledged,
    setDMVICSearchResult,
    acknowledgeDMVIC,
    resetDMVICAcknowledgement,
  } = useMotor3();
  const [checkingDMVIC, setCheckingDMVIC] = useState(false);

  // Prevent DMVIC async results from showing alerts after leaving this step
  const isAliveRef = useRef(true);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    isAliveRef.current = true;
    return () => {
      isAliveRef.current = false;
    };
  }, []);

  const [showVerificationDrawer, setShowVerificationDrawer] = useState(false);

  console.log('[Step2_VehicleDetails] ========================================');
  console.log('[Step2_VehicleDetails] Component rendering');
  console.log('[Step2_VehicleDetails] Selected subcategory:', selectedSubcategory);
  console.log('[Step2_VehicleDetails] Subcategory code:', selectedSubcategory?.subcategory_code);
  console.log('[Step2_VehicleDetails] Current step:', currentStep, '/', totalSteps);
  console.log('[Step2_VehicleDetails] ========================================');

  const handleUnderwritersLoaded = useCallback((underwriters) => {
    console.log('[Step2_VehicleDetails] Underwriters loaded:', underwriters?.length);
    setUnderwriters(underwriters);
  }, [setUnderwriters]);

  const collision = useMemo(() => {
    const resp = dmvicSearchResult?.response;
    const vehicle = resp?.vehicle;
    const currentPolicy = vehicle?.current_policy;

    // Check BOTH: vehicle-level AND root-level fields for active cover detection
    // Backend returns: has_existing_cover (root) AND vehicle.has_active_cover (nested)
    const hasActiveCoverFlag = !!(vehicle?.has_active_cover || resp?.has_existing_cover);

    // Get expiry from EITHER current_policy.cover_end_date OR root-level existing_cover_expiry.
    // Treat an expiry date as authoritative even if the flags are false.
    const expiryStr = currentPolicy?.cover_end_date || resp?.existing_cover_expiry || null;
    
    console.log('[Collision Check] has_active_cover:', vehicle?.has_active_cover);
    console.log('[Collision Check] has_existing_cover:', resp?.has_existing_cover);
    console.log('[Collision Check] cover_end_date:', currentPolicy?.cover_end_date);
    console.log('[Collision Check] existing_cover_expiry:', resp?.existing_cover_expiry);
    console.log('[Collision Check] Resolved hasActiveCoverFlag:', hasActiveCoverFlag);
    console.log('[Collision Check] Resolved expiryStr:', expiryStr);
    
    if (!expiryStr || !formData.cover_start_date) {
      return { hasActiveCover: hasActiveCoverFlag, isCollision: false };
    }

    const expiry = parseFlexibleDate(expiryStr);
    
    if (!expiry) {
      console.log('[Collision Check] Failed to parse expiry date:', expiryStr);
      return { hasActiveCover: true, isCollision: false };
    }

    const min = new Date(expiry);
    min.setDate(min.getDate() + 1);

    const selectedDate = parseFlexibleDate(formData.cover_start_date);
    if (!selectedDate) {
      console.log('[Collision Check] Failed to parse selected date:', formData.cover_start_date);
      return { hasActiveCover: true, isCollision: false };
    }

    const isCollision = selectedDate < min;

    console.log('[Collision Check] Expiry parsed:', expiry);
    console.log('[Collision Check] Min valid date:', min);
    console.log('[Collision Check] Selected date:', selectedDate);
    console.log('[Collision Check] isCollision:', isCollision);

    // Use local date components to avoid timezone issues with toISOString()
    const minYear = min.getFullYear();
    const minMonth = String(min.getMonth() + 1).padStart(2, '0');
    const minDay = String(min.getDate()).padStart(2, '0');
    const minISO = `${minYear}-${minMonth}-${minDay}`;

    return {
      hasActiveCover: true,
      minISO,
      isCollision,
    };
  }, [dmvicSearchResult, formData.cover_start_date]);

  const handleNext = useCallback(async () => {
    Keyboard.dismiss();

    const requestId = ++requestSeqRef.current;

    // Validation
    if (!formData.registrationNumber) {
      alert('Please enter vehicle registration number');
      return;
    }
    if (!formData.identificationType) {
      alert('Please select identification type');
      return;
    }
    if (!formData.cover_start_date) {
      alert('Please select cover start date');
      return;
    }
    if (!formData.financialInterest) {
      alert('Please select financial interest');
      return;
    }

    // DMVIC check (registration only; backend currently validates registration_number)
    if (formData.identificationType === 'Vehicle Registration') {
      try {
        setCheckingDMVIC(true);
        const registration = (formData.registrationNumber || '').trim().toUpperCase();
        const payload = {
          registration_number: registration,
          proposed_cover_start_date: formData.cover_start_date || undefined,
        };

        const resp = await djangoAPI.makeRequest('/api/insurance/dmvic/search-vehicle/', {
          method: 'POST',
          body: JSON.stringify(payload),
          _suppressErrorLog: true,
          timeoutMs: 60000, // 60 seconds for DMVIC external API call (backend timeout is 30s + buffer)
        });

        // If user already left this step, do not show alerts / update UI.
        if (!isAliveRef.current || requestId !== requestSeqRef.current) {
          return;
        }

        setDMVICSearchResult({
          request: payload,
          response: resp,
          checkedAt: new Date().toISOString(),
        });

        console.log('[Step2_VehicleDetails] DMVIC Response:', JSON.stringify(resp, null, 2));
        console.log('[Step2_VehicleDetails] Vehicle has_active_cover:', resp?.vehicle?.has_active_cover);
        console.log('[Step2_VehicleDetails] Root has_existing_cover:', resp?.has_existing_cover);
        console.log('[Step2_VehicleDetails] Current policy:', resp?.vehicle?.current_policy);
        console.log('[Step2_VehicleDetails] Cover end date:', resp?.vehicle?.current_policy?.cover_end_date);
        console.log('[Step2_VehicleDetails] Root existing_cover_expiry:', resp?.existing_cover_expiry);
        console.log('[Step2_VehicleDetails] Selected cover start date:', formData.cover_start_date);

        const vehicle = resp?.vehicle;
        if (resp?.success && vehicle) {
          // Normalize 2-digit year to 4-digit year
          const normalizeYear = (year) => {
            if (!year) return year;
            const yearStr = String(year);
            if (yearStr.length === 4) return yearStr;
            if (yearStr.length === 2) {
              const yearNum = parseInt(yearStr, 10);
              const currentYear = new Date().getFullYear();
              const currentCentury = Math.floor(currentYear / 100) * 100;
              const currentYearLast2 = currentYear % 100;
              // If year > current year's last 2 digits, assume previous century
              if (yearNum > currentYearLast2) {
                return String(currentCentury - 100 + yearNum);
              }
              return String(currentCentury + yearNum);
            }
            return yearStr;
          };

          // Lock fields where available (non-blocking if some are missing)
          lockDMVICData({
            make: vehicle.make,
            model: vehicle.model,
            year: normalizeYear(vehicle.year_of_manufacture),
            color: vehicle.color,
            logbook_number: vehicle.logbook_number,
            engine_number: vehicle.engine_number,
            chassis_number: vehicle.chassis_number,
            registration_number: registration,
          });
          
          // Block progression if selected date overlaps existing cover.
          // Treat the resolved expiry date as authoritative even if cover flags are false.
          const expiryStr =
            vehicle?.current_policy?.cover_end_date ||
            vehicle?.current_policy?.expiry_date ||
            vehicle?.current_policy?.CoverEndDate ||
            resp?.existing_cover_expiry ||
            resp?.existingCoverExpiry ||
            resp?.ExistingCoverExpiry;

          // Show the DMVIC drawer whenever we have any cover context (active cover flag, expiry, or history),
          // unless the user already acknowledged it. This matches the intended UX: user must see/acknowledge
          // the DMVIC finding, and only gets blocked if the selected date overlaps.
          const historyList =
            (Array.isArray(vehicle?.policy_history) && vehicle.policy_history) ||
            (Array.isArray(resp?.policy_history) && resp.policy_history) ||
            (Array.isArray(resp?.policyHistory) && resp.policyHistory) ||
            [];

          const hasAnyHistory = Array.isArray(historyList) && historyList.length > 0;

          const hasCoverFlags = !!(
            vehicle?.has_active_cover ||
            resp?.has_existing_cover ||
            resp?.hasExistingCover ||
            resp?.HasExistingCover
          );
          const hasAnyCoverContext = hasCoverFlags || !!expiryStr || hasAnyHistory;

          // If DMVIC returned vehicle details but did not provide policy history / expiry / flags,
          // we cannot verify the cover start date. This should not hard-block the agent.
          if (!hasAnyCoverContext) {
            if (!isAliveRef.current || requestId !== requestSeqRef.current) {
              return;
            }
            setDMVICSearchResult({
              request: payload,
              response: resp,
              checkedAt: new Date().toISOString(),
              warning: true,
              errorMessage: 'Policy history / existing cover expiry not available from DMVIC.',
            });

            setCheckingDMVIC(false);
            const selectedDate = formData.cover_start_date || '';
            Alert.alert(
              'Cover Date Not Verified',
              `DMVIC returned vehicle details, but did not return policy history / existing cover expiry.\n\nSelected start date: ${selectedDate || '—'}\n\nYou can retry, or continue unverified if you are sure the date is correct.`,
              [
                {
                  text: 'Retry DMVIC',
                  style: 'default',
                  onPress: () => {
                    setTimeout(() => {
                      handleNext();
                    }, 0);
                  },
                },
                {
                  text: 'Continue (Unverified)',
                  style: 'destructive',
                  onPress: () => {
                    acknowledgeDMVIC?.();
                    onNext?.();
                  },
                },
              ]
            );
            return;
          }

          console.log('[handleNext] expiryStr resolved:', expiryStr);
          
          if (expiryStr) {
            const expiry = parseFlexibleDate(expiryStr);
            const selected = parseFlexibleDate(formData.cover_start_date);
            console.log('[handleNext] Expiry parsed:', expiry);
            console.log('[handleNext] Selected parsed:', selected);

            if (expiry && selected) {
              const min = new Date(expiry);
              min.setDate(min.getDate() + 1);
              console.log('[handleNext] Min valid date:', min);
              console.log('[handleNext] Is collision:', selected < min);

              if (selected < min) {
                // DON'T auto-adjust date here - show drawer with collision error
                setCheckingDMVIC(false); // Clear loading state before showing drawer
                setShowVerificationDrawer(true);
                return; // Do not proceed to next screen
              }
            }
          }

          // No collision, but we still want the user to see/acknowledge the DMVIC context once.
          if (hasAnyCoverContext && !dmvicAcknowledged) {
            setCheckingDMVIC(false);
            setShowVerificationDrawer(true);
            return;
          }

          // No conflict - allow progression
          setCheckingDMVIC(false);
          onNext();
          return;
        } else {
          unlockDMVICData();
        }
      } catch (e) {
        if (!isAliveRef.current || requestId !== requestSeqRef.current) {
          return;
        }
        // Blocking: this step exists to validate cover start date against existing cover.
        // If DMVIC cannot be reached, do not proceed to avoid double insurance.
        const payloadError = e?.payload?.error;
        let errorMsg = payloadError || e?.message || 'Unable to verify with DMVIC at this time.';
        if (typeof errorMsg === 'string') {
          // DjangoAPIService prefixes errors with "HTTP <code>:"; strip for user-facing alerts
          errorMsg = errorMsg.replace(/^HTTP\s+\d+\s*:\s*/i, '');
        }
        
        setDMVICSearchResult({
          request: {
            registration_number: (formData.registrationNumber || '').trim().toUpperCase(),
            proposed_cover_start_date: formData.cover_start_date || undefined,
          },
          response: null,
          checkedAt: new Date().toISOString(),
          warning: true,
          errorMessage: errorMsg,
        });
        unlockDMVICData();

        setCheckingDMVIC(false); // Clear loading state
        
        // Check if error is about vehicle not found in DMVIC
        if (errorMsg.includes('not found in DMVIC database') || errorMsg.includes('not available in the system')) {
          Alert.alert(
            'Vehicle Not Found',
            errorMsg,
            [
              { text: 'Re-enter Registration', style: 'cancel' },
              {
                text: 'Continue Anyway',
                onPress: () => {
                  // Allow user to proceed without DMVIC data (manual entry mode)
                  acknowledgeDMVIC?.();
                  onNext?.();
                },
                style: 'default'
              }
            ]
          );
        } else {
          // Generic DMVIC error
          const selectedDate = formData.cover_start_date || '';
          Alert.alert(
            'DMVIC Check Required',
            `We could not fetch the vehicle's policy history / existing cover expiry from DMVIC, so we cannot verify the cover start date.\n\nSelected start date: ${selectedDate || '—'}\n\nYou can retry, or continue unverified if you are sure the date is correct. If you continue, the cover status and cover dates will be treated as NOT VERIFIED.`,
            [
              {
                text: 'Retry DMVIC',
                style: 'default',
                onPress: () => {
                  // Re-run the same verification flow.
                  // Note: handleNext is async; this schedules a fresh attempt.
                  setTimeout(() => {
                    handleNext();
                  }, 0);
                },
              },
              {
                text: 'Continue (Unverified)',
                style: 'destructive',
                onPress: () => {
                  // Allow progression, but keep DMVIC result flagged as warning.
                  acknowledgeDMVIC?.();
                  onNext?.();
                },
              },
            ]
          );
        }
        return;
      }
    }

    // Only reach here if identificationType is NOT 'Vehicle Registration' (e.g., Chassis Number)
    // For chassis-based verification, allow progression (DMVIC check not applicable)
    onNext();
  }, [acknowledgeDMVIC, collision, dmvicAcknowledged, dmvicSearchResult, formData, lockDMVICData, onNext, setDMVICSearchResult, unlockDMVICData, updateField, clearError]);

  return (
    <View style={styles.container}>
      {/* Stepper Progress - Motor2 Style (Top of screen) */}
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />

      {/* DMVIC Loading Overlay (Lottie) */}
      {checkingDMVIC && (
        <View style={styles.dmvicOverlay} pointerEvents="auto">
          <View style={styles.dmvicOverlayCard}>
            <LottieView
              source={require('../../../../../assets/animations/motor-insurance.json')}
              autoPlay
              loop
              style={styles.dmvicLottie}
            />
            <Text style={styles.dmvicOverlayTitle}>Fetching vehicle data…</Text>
            <Text style={styles.dmvicOverlaySubtitle}>Checking DMVIC registry</Text>
            <ActivityIndicator
              style={{ marginTop: SPACING.lg }}
              size="large"
              color={UI?.PRIMARY || '#e53935'}
            />
          </View>
        </View>
      )}

      {/* Debug: Log modal visibility */}
      {console.log('[Step2] Modal visible:', showVerificationDrawer)}

      <Modal
        visible={showVerificationDrawer}
        animationType="slide"
        transparent
        onRequestClose={() => {
          // Allow Android back to close the drawer (user still can't proceed until compliant/acknowledged).
          console.log('[Step2] Modal onRequestClose called');
          setShowVerificationDrawer(false);
        }}
        onShow={() => console.log('[Step2] Modal onShow called')}
      >
        <Pressable style={styles.backdrop} onPress={() => { /* block backdrop dismiss */ }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.drawerContainer}>
            <VehicleVerificationDrawer
              dmvicSearchResult={dmvicSearchResult}
              selectedCoverStartDate={formData.cover_start_date}
              onSetCoverStartDate={(iso) => {
                updateField?.('cover_start_date', iso);
                clearError?.('cover_start_date');
                // Reset acknowledgement so Step3 will re-check collision
                resetDMVICAcknowledgement?.();
              }}
              onContinue={(overrideISO) => {
                if (!isAliveRef.current) return;
                const resp = dmvicSearchResult?.response;
                const vehicle = resp?.vehicle;
                const expiryStr =
                  vehicle?.current_policy?.cover_end_date ||
                  vehicle?.current_policy?.expiry_date ||
                  vehicle?.current_policy?.CoverEndDate ||
                  resp?.existing_cover_expiry ||
                  resp?.existingCoverExpiry ||
                  resp?.ExistingCoverExpiry ||
                  null;

                const startDate = overrideISO || formData.cover_start_date;
                const compliant = isStartDateCompliant({ expiryStr, coverStart: startDate });

                // STRICT: Do not allow continuing when date overlaps.
                if (!compliant) {
                  if (!isAliveRef.current) return;
                  const selected = startDate;
                  const expiry = expiryStr;
                  const minISO = (() => {
                    const exp = parseFlexibleDate(expiry);
                    if (!exp) return null;
                    const min = new Date(exp);
                    min.setDate(min.getDate() + 1);
                    const y = min.getFullYear();
                    const m = String(min.getMonth() + 1).padStart(2, '0');
                    const d = String(min.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                  })();

                  Alert.alert(
                    'Invalid Date',
                    `The cover start date overlaps with existing insurance.\n\nSelected start date: ${selected || '—'}\nExisting cover expiry: ${expiry || '—'}\nEarliest allowed start date: ${minISO || '—'}\n\nPlease adjust the date first.`,
                    [{ text: 'OK' }]
                  );
                  return;
                }

                // Date is valid - acknowledge, close, and continue.
                acknowledgeDMVIC?.();
                setShowVerificationDrawer(false);
                onNext?.();
              }}
              onGoBack={() => {
                // Close drawer and let user adjust the date on the form
                setShowVerificationDrawer(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView style={styles.formScrollView}>
        <TPVehicleForm
          subcategoryCode={selectedSubcategory?.subcategory_code}
          onUnderwritersLoaded={handleUnderwritersLoaded}
        />
      </ScrollView>

      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onBack={onBack}
        disableNext={checkingDMVIC}
        nextLabel={checkingDMVIC ? 'Checking…' : 'Next'}
      />
    </View>
  );
};

export default Step2_VehicleDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formScrollView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xxl,
    maxHeight: '85%',
  },

  dmvicOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  dmvicOverlayCard: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI.border,
  },
  dmvicLottie: {
    width: 140,
    height: 140,
    marginBottom: SPACING.md,
  },
  dmvicOverlayTitle: {
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.semibold,
    color: UI.textPrimary,
    textAlign: 'center',
  },
  dmvicOverlaySubtitle: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.regular,
    color: UI.textSecondary,
    textAlign: 'center',
  },
});
  