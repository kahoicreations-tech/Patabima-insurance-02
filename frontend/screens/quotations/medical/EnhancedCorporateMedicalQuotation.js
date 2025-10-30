/**
 * Corporate Medical Insurance Quotation Screen
 * 2-Step Process: Policy Details → Client Details
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, UI, SEMANTIC, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../../theme';
import { Heading4, Body1, Body2, Subtitle2, Caption, ButtonText } from '../../../components/typography/Text';

// Enable LayoutAnimation on Android (only if not using New Architecture)
if (
  Platform.OS === 'android' && 
  UIManager.setLayoutAnimationEnabledExperimental &&
  typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
// Removed Enhanced* inputs to keep input visuals consistent with non-motor style
import api from '../../../services/DjangoAPIService';

const EnhancedCorporateMedicalQuotation = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    // Policy Details
    numberOfBeneficiaries: '',
    inpatientLimit: '',
    outpatientLimit: '',
    dentalLimit: '',
    opticalLimit: '',
    maternityLimit: '',
    preferredUnderwriters: [],
    // Client Details
    companyName: '',
    companyRegistrationNumber: '',
    contactPerson: '',
    phoneNumber: '',
    emailAddress: '',
    physicalAddress: '',
    declaration: false
  });

  const [quoteMeta, setQuoteMeta] = useState({ 
    quote_number: null, 
    product: null, 
    status: null
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // prevent duplicate final submission

  const coverLimitOptions = [
    { id: '500k', name: 'KES 500,000', value: 500000 },
    { id: '1m', name: 'KES 1,000,000', value: 1000000 },
    { id: '2m', name: 'KES 2,000,000', value: 2000000 },
    { id: '3m', name: 'KES 3,000,000', value: 3000000 },
    { id: '5m', name: 'KES 5,000,000', value: 5000000 },
    { id: '10m', name: 'KES 10,000,000', value: 10000000 }
  ];

  // Dynamically fetched underwriters
  const [underwriters, setUnderwriters] = useState([]);
  const [underwritersLoading, setUnderwritersLoading] = useState(false);
  const [underwritersError, setUnderwritersError] = useState(null);

  // Removed early quote creation - defer until final submission

  // Fetch underwriters on mount
  useEffect(() => {
    let cancelled = false;
    const fetchUnderwriters = async () => {
      setUnderwritersLoading(true);
      setUnderwritersError(null);
      try {
        const providers = await api.getUnderwriters();
        if (!cancelled) {
          const normalized = Array.isArray(providers) ? providers : (providers?.underwriters || []);
            const mapped = normalized.map((p, idx) => ({
              id: p.code || p.underwriter_code || p.id || `uw_${idx}`,
              name: p.name || p.company || p.company_name || p.underwriter_name || `Underwriter ${idx + 1}`,
            }));
          setUnderwriters(mapped);
        }
      } catch (e) {
        if (!cancelled) setUnderwritersError(e.message || 'Failed to load underwriters');
      } finally {
        if (!cancelled) setUnderwritersLoading(false);
      }
    };
    fetchUnderwriters();
    return () => { cancelled = true; };
  }, []);

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Validate policy details (step 1) for corporate
  const validateStepOne = useCallback(() => {
    const errors = {};
    if (!formData.numberOfBeneficiaries) errors.numberOfBeneficiaries = 'Enter beneficiaries count';
    if (formData.numberOfBeneficiaries && (isNaN(Number(formData.numberOfBeneficiaries)) || Number(formData.numberOfBeneficiaries) <= 0)) errors.numberOfBeneficiaries = 'Beneficiaries must be > 0';
    if (!formData.inpatientLimit) errors.inpatientLimit = 'Select inpatient limit';
    if (formData.outpatientLimit && (isNaN(Number(formData.outpatientLimit)) || Number(formData.outpatientLimit) <= 0)) errors.outpatientLimit = 'Outpatient limit invalid';
    if (formData.dentalLimit && (isNaN(Number(formData.dentalLimit)) || Number(formData.dentalLimit) <= 0)) errors.dentalLimit = 'Dental limit invalid';
    if (formData.opticalLimit && (isNaN(Number(formData.opticalLimit)) || Number(formData.opticalLimit) <= 0)) errors.opticalLimit = 'Optical limit invalid';
    if (formData.maternityLimit && (isNaN(Number(formData.maternityLimit)) || Number(formData.maternityLimit) <= 0)) errors.maternityLimit = 'Maternity limit invalid';
    return { valid: Object.keys(errors).length === 0, errors };
  }, [formData]);

  const isFormValid = useCallback(() => {
    const step1 = validateStepOne();
    if (!step1.valid) return false;
    if (!formData.companyName || !formData.companyRegistrationNumber || !formData.contactPerson || !formData.phoneNumber) return false;
    if (!formData.declaration) return false;
    return true;
  }, [formData, validateStepOne]);

  const handleFinalSubmit = async () => {
    if (!formData.declaration) {
      Alert.alert('Declaration Required', 'Please accept the declaration');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setLoading(true);
    try {
      // Corporate medical: persist via ManualQuote like individual flow
      const manualResult = await api.createMedicalQuote(formData);
      const reference = manualResult.reference;
      setQuoteMeta({ quote_number: reference, product: null, status: manualResult.status });
      const goToQuotations = () => {
        const params = { forceRefresh: true, focusId: reference, justSubmitted: true, message: 'Corporate medical quote saved' };
        // Prefer navigating to nested tab via root stack
        try {
          navigation.navigate('MainTabs', { screen: 'Quotations', params });
          return;
        } catch (e) {}
        // Fallback: try parent navigator (if already inside tabs)
        const parent = navigation.getParent ? navigation.getParent() : null;
        if (parent) {
          try {
            parent.navigate('Quotations', params);
            return;
          } catch (e) {}
        }
        // Last resort
        try { navigation.navigate('Quotations', params); return; } catch (e) {}
        navigation.goBack();
      };
      Alert.alert('Quote Requested', 'Your corporate medical request has been submitted. An admin will review and share pricing shortly.', [
        { text: 'OK', onPress: goToQuotations }
      ]);
    } catch (error) {
      console.error('Final submit error (corporate):', error);
      Alert.alert('Error', error.message || 'Failed to submit');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const renderPolicyDetails = () => (
    <View style={styles.stepContainer}>
      <View style={styles.inputContainer}>
  <Subtitle2 style={styles.label}>Number of Beneficiaries</Subtitle2>
        <TextInput 
          value={formData.numberOfBeneficiaries} 
          onChangeText={(text) => updateFormData('numberOfBeneficiaries', text.replace(/\D/g, ''))} 
          placeholder="Enter number of beneficiaries" 
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="next"
          maxLength={4}
          style={styles.input} 
        />
      </View>
      
      <View style={styles.inputContainer}>
  <Subtitle2 style={styles.label}>Inpatient Limit</Subtitle2>
        <View style={styles.selectContainer}>
          {coverLimitOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.selectOption, formData.inpatientLimit === option.id && styles.selectedSelectOption]}
              onPress={() => updateFormData('inpatientLimit', option.id)}
            >
              <Body2 style={[styles.selectOptionText, formData.inpatientLimit === option.id && styles.selectedSelectOptionText]}>
                {option.name}
              </Body2>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.inputContainer}>
  <Subtitle2 style={styles.label}>Outpatient Limit</Subtitle2>
        <TextInput 
          value={formData.outpatientLimit} 
          onChangeText={(text) => updateFormData('outpatientLimit', text.replace(/\D/g, ''))} 
          placeholder="Enter outpatient limit" 
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="next"
          style={styles.input} 
        />
      </View>
      
      <View style={styles.inputContainer}>
  <Subtitle2 style={styles.label}>Dental Limit</Subtitle2>
        <TextInput 
          value={formData.dentalLimit} 
          onChangeText={(text) => updateFormData('dentalLimit', text.replace(/\D/g, ''))} 
          placeholder="Enter dental limit" 
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="next"
          style={styles.input} 
        />
      </View>
      
      <View style={styles.inputContainer}>
  <Subtitle2 style={styles.label}>Optical Limit</Subtitle2>
        <TextInput 
          value={formData.opticalLimit} 
          onChangeText={(text) => updateFormData('opticalLimit', text.replace(/\D/g, ''))} 
          placeholder="Enter optical limit" 
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="next"
          style={styles.input} 
        />
      </View>
      
      <View style={styles.inputContainer}>
  <Subtitle2 style={styles.label}>Maternity Limit</Subtitle2>
        <TextInput 
          value={formData.maternityLimit} 
          onChangeText={(text) => updateFormData('maternityLimit', text.replace(/\D/g, ''))} 
          placeholder="Enter maternity limit" 
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="next"
          style={styles.input} 
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Subtitle2 style={styles.label}>Preferred Underwriters</Subtitle2>
        {underwritersLoading && (
          <Body2 style={styles.loadingText}>Loading underwriters...</Body2>
        )}
        {underwritersError && !underwritersLoading && (
          <Caption style={styles.errorText}>{underwritersError}</Caption>
        )}
        {!underwritersLoading && !underwritersError && (
          <View style={styles.selectContainer}>
            {underwriters.map((uw) => (
              <TouchableOpacity
                key={uw.id}
                style={[styles.selectOption, formData.preferredUnderwriters?.includes(uw.id) && styles.selectedSelectOption]}
                onPress={() => {
                  const current = formData.preferredUnderwriters || [];
                  const updated = current.includes(uw.id) ? current.filter(id => id !== uw.id) : [...current, uw.id];
                  updateFormData('preferredUnderwriters', updated);
                }}
              >
                <Body2 style={[styles.selectOptionText, formData.preferredUnderwriters?.includes(uw.id) && styles.selectedSelectOptionText]}>
                  {uw.name}
                </Body2>
              </TouchableOpacity>
            ))}
            {underwriters.length === 0 && (
              <Caption style={styles.loadingText}>No underwriters available</Caption>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderClientDetails = () => (
    <View style={styles.stepContainer}>
      <View style={styles.inputContainer}>
        <Subtitle2 style={styles.label}>Company Name</Subtitle2>
        <TextInput
          value={formData.companyName}
          onChangeText={(text) => updateFormData('companyName', text)}
          placeholder="Enter company name"
          placeholderTextColor={UI.textSecondary}
          style={styles.input}
        />
      </View>
      <View style={styles.inputContainer}>
        <Subtitle2 style={styles.label}>Company Registration Number</Subtitle2>
        <TextInput
          value={formData.companyRegistrationNumber}
          onChangeText={(text) => updateFormData('companyRegistrationNumber', text)}
          placeholder="Enter registration number"
          placeholderTextColor={UI.textSecondary}
          style={styles.input}
        />
      </View>
      <View style={styles.inputContainer}>
        <Subtitle2 style={styles.label}>Contact Person</Subtitle2>
        <TextInput
          value={formData.contactPerson}
          onChangeText={(text) => updateFormData('contactPerson', text)}
          placeholder="Enter contact person name"
          placeholderTextColor={UI.textSecondary}
          style={styles.input}
        />
      </View>
      <View style={styles.inputContainer}>
        <Subtitle2 style={styles.label}>Phone Number</Subtitle2>
        <TextInput
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData('phoneNumber', text.replace(/\D/g, ''))}
          placeholder="Enter phone number"
          placeholderTextColor={UI.textSecondary}
          keyboardType="phone-pad"
          inputMode="tel"
          maxLength={12}
          returnKeyType="next"
          textContentType="telephoneNumber"
          style={styles.input}
        />
      </View>
      <View style={styles.inputContainer}>
        <Subtitle2 style={styles.label}>Email Address</Subtitle2>
        <TextInput
          value={formData.emailAddress}
          onChangeText={(text) => updateFormData('emailAddress', text)}
          placeholder="Enter email address"
          placeholderTextColor={UI.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          textContentType="emailAddress"
          autoCorrect={false}
          style={styles.input}
        />
      </View>
      <View style={styles.inputContainer}>
        <Subtitle2 style={styles.label}>Physical Address</Subtitle2>
        <TextInput
          value={formData.physicalAddress}
          onChangeText={(text) => updateFormData('physicalAddress', text)}
          placeholder="Enter company address"
          placeholderTextColor={UI.textSecondary}
          style={styles.input}
        />
      </View>
      <TouchableOpacity 
        style={styles.declarationContainer} 
        onPress={() => updateFormData('declaration', !formData.declaration)}
      >
        <View style={[styles.checkbox, formData.declaration && styles.checkboxSelected]}>
          {formData.declaration && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Caption style={styles.declarationText}>I confirm that all information is accurate</Caption>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Heading4 style={styles.headerTitle}>Corporate Medical Insurance</Heading4>
        <View style={styles.headerBackBtn} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        {renderPolicyDetails()}
        {renderClientDetails()}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.submitBtn, (!isFormValid() || loading || submitting) && styles.submitBtnDisabled]}
          onPress={handleFinalSubmit}
          disabled={!isFormValid() || loading || submitting}
        >
          <ButtonText style={styles.submitText}>{submitting ? 'Submitting...' : 'Request Quote'}</ButtonText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D5222B',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerBackBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  stepContainer: {
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#000',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: UI.backgroundGray,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.input,
    color: UI.textPrimary,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedSelectOption: {
    backgroundColor: '#D5222B',
    borderColor: '#D5222B',
  },
  selectOptionText: {
    color: '#333',
  },
  selectedSelectOptionText: {
    color: '#fff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#D5222B',
    borderColor: '#D5222B',
  },
  declarationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#D5222B',
  },
  declarationText: {
    flex: 1,
    color: '#856404',
    marginLeft: 10,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitBtn: {
    backgroundColor: '#D5222B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff' },
});

export default EnhancedCorporateMedicalQuotation;
