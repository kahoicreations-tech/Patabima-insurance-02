/**
 * Step 6: Review & Confirm
 * Display all entered data for final review
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThirdParty } from '../../contexts/ThirdPartyContext';
import { useMotor3 } from '../../contexts/Motor3Context';
import { StableTextInput } from '../../components';
import StepNavigation from './StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';
import { moderateScale } from '../../utils/responsive';

const DetailRow = ({ label, value, valueNumberOfLines = 1 }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={valueNumberOfLines}>{value}</Text>
  </View>
);

const Step6_Review = ({ onNext, onBack, goToStep, currentStep, totalSteps }) => {
  const { formData, selectedUnderwriter, updateFormData } = useThirdParty();
  const { clientDetails, updateClientDetails, dmvicSearchResult, uploadedDocuments } = useMotor3();

  // Check for logbook registration mismatch warning
  const registrationWarning = useMemo(() => {
    const logbook = uploadedDocuments?.find(doc => doc?.id === 'logbook');
    return logbook?.extraction?.registrationWarning || null;
  }, [uploadedDocuments]);

  // Helper to convert 2-digit year to 4-digit year
  const normalizeYear = useCallback((year) => {
    if (!year) return '';
    const yearStr = String(year);
    
    // Already 4 digits
    if (yearStr.length === 4) return yearStr;
    
    // Convert 2-digit year to 4-digit
    if (yearStr.length === 2) {
      const yearNum = parseInt(yearStr, 10);
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const currentYearLast2 = currentYear % 100;
      
      // If year > current year's last 2 digits, assume previous century
      // e.g., if current year is 2025 and input is 93, assume 1993
      if (yearNum > currentYearLast2) {
        return String(currentCentury - 100 + yearNum);
      }
      // Otherwise assume current century
      return String(currentCentury + yearNum);
    }
    
    return yearStr;
  }, []);

  // Extract DMVIC vehicle data
  const dmvicVehicle = useMemo(() => {
    const response = dmvicSearchResult?.response;
    const vehicle = response?.vehicle || response;

    return {
      // IMPORTANT: Prefer user-entered values during Review edits.
      registration: formData?.registrationNumber || vehicle?.registration_number || vehicle?.registration || '',
      chassis: formData?.chasisNumber || vehicle?.chassis_number || vehicle?.chassis || '',
      make: formData?.make || vehicle?.make || '',
      model: formData?.model || vehicle?.model || '',
      year: normalizeYear(formData?.year || vehicle?.year_of_manufacture || vehicle?.year),
    };
  }, [dmvicSearchResult, formData, normalizeYear]);

  const normalizePlate = useCallback((v) => {
    if (!v) return '';
    return String(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }, []);

  const normalizePlateForCompare = useCallback((v) => {
    const p = normalizePlate(v);
    if (!p) return '';
    const m = p.match(/^(K[A-Z]{2,3})([A-Z0-9]{3})([A-Z])$/);
    if (!m) return p;
    const prefix = m[1];
    const digitsLike = m[2].replace(/O/g, '0').replace(/I/g, '1');
    const suffix = m[3];
    return `${prefix}${digitsLike}${suffix}`;
  }, [normalizePlate]);

  const fieldMismatchErrors = useMemo(() => {
    const map = {};

    const add = (key, message) => {
      if (!key || !message) return;
      const msg = String(message).trim();
      if (!msg) return;
      const existing = map[key];
      if (!existing) {
        map[key] = msg;
        return;
      }
      if (existing.includes(msg)) return;
      map[key] = `${existing}\n${msg}`;
    };

    const logbook = uploadedDocuments?.find((doc) => doc?.id === 'logbook');
    const logbookReg =
      logbook?.extraction?.fieldAudit?.registration_number?.value ||
      logbook?.extraction?.registrationWarning?.logbookShows ||
      registrationWarning?.logbookShows ||
      '';
    const userReg = formData?.registrationNumber || '';
    const regMatchesNow =
      !!normalizePlateForCompare(logbookReg) &&
      normalizePlateForCompare(logbookReg) === normalizePlateForCompare(userReg);

    // Registration warning (logbook extraction vs entered)
    if (!regMatchesNow && registrationWarning?.message) {
      add('registrationNumber', registrationWarning.message);
    }

    const conflicts = [];
    (uploadedDocuments || []).forEach((d) => {
      const list = d?.extraction?.reconciliation?.conflicts;
      if (Array.isArray(list)) conflicts.push(...list);
    });

    conflicts.forEach((c) => {
      const code = c?.code;
      const message = c?.message || 'Mismatch detected.';

      if (code === 'REGISTRATION_MISMATCH' && !regMatchesNow) add('registrationNumber', message);
      if (code === 'DMVIC_MAKE_MISMATCH') add('make', message);
      if (code === 'DMVIC_MODEL_MISMATCH') add('model', message);
      if (code === 'DMVIC_YEAR_MISMATCH') add('year', message);
      if (code === 'DMVIC_CHASSIS_MISMATCH') add('chasisNumber', message);
      if (code === 'OWNER_NAME_MISMATCH') {
        add('first_name', message);
        add('last_name', message);
      }
    });

    return map;
  }, [formData?.registrationNumber, normalizePlateForCompare, registrationWarning, uploadedDocuments]);

  const handleNext = useCallback(() => {
    // Validate required client fields
    const requiredFields = ['first_name', 'last_name', 'id_number', 'phone', 'email'];
    const missing = requiredFields.filter(field => !clientDetails?.[field]?.trim());
    
    if (missing.length > 0) {
      const fieldLabels = {
        first_name: 'First Name',
        last_name: 'Last Name',
        id_number: 'ID Number',
        phone: 'Phone Number',
        email: 'Email Address',
      };
      const missingLabels = missing.map(f => fieldLabels[f]).join(', ');
      alert(`Please fill in required fields: ${missingLabels}`);
      return;
    }

    // Validate required vehicle fields
    if (!formData?.registrationNumber?.trim()) {
      alert('Vehicle registration is required');
      return;
    }

    onNext();
  }, [onNext, clientDetails, formData]);

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StableTextInput
              label="First Name"
              value={clientDetails?.first_name || ''}
              onChangeText={(t) => updateClientDetails({ first_name: t })}
              placeholder="First name"
              keyboardType="default"
              autoCapitalize="words"
              required
              error={fieldMismatchErrors.first_name || null}
            />
            <StableTextInput
              label="Last Name"
              value={clientDetails?.last_name || ''}
              onChangeText={(t) => updateClientDetails({ last_name: t })}
              placeholder="Last name"
              keyboardType="default"
              autoCapitalize="words"
              required
              error={fieldMismatchErrors.last_name || null}
            />
            <StableTextInput
              label="KRA PIN"
              value={clientDetails?.kra_pin || ''}
              onChangeText={(t) => updateClientDetails({ kra_pin: t.toUpperCase() })}
              placeholder="e.g., A000000000X"
              keyboardType="default"
              autoCapitalize="characters"
            />
            <StableTextInput
              label="ID Number"
              value={clientDetails?.id_number || ''}
              onChangeText={(t) => updateClientDetails({ id_number: t })}
              placeholder="National ID number"
              keyboardType="numeric"
              required
            />
            <StableTextInput
              label="Phone Number"
              value={clientDetails?.phone || ''}
              onChangeText={(t) => updateClientDetails({ phone: t })}
              placeholder="e.g., 0712345678"
              keyboardType="phone-pad"
              required
            />
            <StableTextInput
              label="Email Address"
              value={clientDetails?.email || ''}
              onChangeText={(t) => updateClientDetails({ email: t })}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />
            <StableTextInput
              label="Physical Address"
              value={clientDetails?.address || ''}
              onChangeText={(t) => updateClientDetails({ address: t })}
              placeholder="City, County"
              keyboardType="default"
              autoCapitalize="words"
            />
            
            <View style={styles.divider} />

            <View style={styles.regLabelRow}>
              <Text style={styles.regLabelText}>
                Vehicle Registration<Text style={styles.required}> *</Text>
              </Text>
              {registrationWarning && (
                <View
                  style={[
                    styles.regBadge,
                    registrationWarning.type === 'mismatch' ? styles.regBadgeMismatch : styles.regBadgeMissing,
                  ]}
                >
                  <Ionicons name="warning" size={moderateScale(14)} color="#E65100" />
                  <Text style={styles.regBadgeText}>
                    {registrationWarning.type === 'mismatch' ? 'Mismatch' : 'Not Found'}
                  </Text>
                </View>
              )}
            </View>
            
            <StableTextInput
              label={null}
              value={dmvicVehicle.registration}
              onChangeText={(t) => updateFormData({ registrationNumber: t.toUpperCase() })}
              placeholder="e.g., KDA 123A"
              keyboardType="default"
              autoCapitalize="characters"
              required={false}
              error={fieldMismatchErrors.registrationNumber || null}
            />
            <StableTextInput
              label="Chassis Number"
              value={dmvicVehicle.chassis}
              onChangeText={(t) => updateFormData({ chasisNumber: t.toUpperCase() })}
              placeholder="Chassis number"
              keyboardType="default"
              autoCapitalize="characters"
              error={fieldMismatchErrors.chasisNumber || null}
            />
            <StableTextInput
              label="Vehicle Make"
              value={dmvicVehicle.make}
              onChangeText={(t) => updateFormData({ make: t })}
              placeholder="e.g., Toyota"
              keyboardType="default"
              autoCapitalize="words"
              error={fieldMismatchErrors.make || null}
            />
            <StableTextInput
              label="Vehicle Model"
              value={dmvicVehicle.model}
              onChangeText={(t) => updateFormData({ model: t })}
              placeholder="e.g., Corolla"
              keyboardType="default"
              autoCapitalize="words"
              error={fieldMismatchErrors.model || null}
            />
            <StableTextInput
              label="Vehicle Year"
              value={dmvicVehicle.year}
              onChangeText={(t) => updateFormData({ year: t })}
              placeholder="e.g., 2020"
              keyboardType="number-pad"
              autoCapitalize="none"
              error={fieldMismatchErrors.year || null}
            />

        <View style={styles.confirmSection}>
          <Text style={styles.confirmText}>
            By proceeding, you confirm that all information provided is accurate and complete.
          </Text>
        </View>
      </ScrollView>

      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onBack={onBack}
        nextLabel="Proceed to Payment"
      />
    </View>
  );
};

export default Step6_Review;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: moderateScale(16),
  },
  regLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(4),
  },
  regLabelText: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins-SemiBold',
    color: '#495057',
  },
  required: {
    color: '#D5222B',
  },
  regBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(999),
    borderWidth: 1,
  },
  regBadgeMismatch: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  regBadgeMissing: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  regBadgeText: {
    marginLeft: moderateScale(6),
    fontSize: moderateScale(11),
    fontFamily: 'Poppins-SemiBold',
    color: '#E65100',
  },
  confirmSection: {
    backgroundColor: '#FFF5F5',
    padding: moderateScale(16),
    marginTop: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#D5222B',
  },
  confirmText: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins-Regular',
    color: '#333',
    lineHeight: moderateScale(20),
  },
});
