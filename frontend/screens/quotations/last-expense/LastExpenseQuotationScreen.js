import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, UI, SEMANTIC, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../../theme';
import { Heading4, Body1, Body2, Subtitle2, ButtonText } from '../../../components/typography/Text';
import api from '../../../services/DjangoAPIService';

// Enable LayoutAnimation on Android (only if not using New Architecture)
if (
  Platform.OS === 'android' && 
  UIManager.setLayoutAnimationEnabledExperimental &&
  typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Final minimal Last Expense quotation screen (3 inputs only)
export default function LastExpenseQuotationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  // Coverage Details
  const [age, setAge] = useState('');
  const [coverLimit, setCoverLimit] = useState(null); // cover limit id
  const [numberOfDependents, setNumberOfDependents] = useState('');
  
  // Client Details
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  
  // Insurance Preferences
  const [preferredUnderwriters, setPreferredUnderwriters] = useState([]); // array of ids
  
  const [underwriters, setUnderwriters] = useState([]);
  const [underwritersLoading, setUnderwritersLoading] = useState(false);
  const [underwritersError, setUnderwritersError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Static cover limit options (can later be driven from backend)
  const coverLimitOptions = [
    { id: '50k', name: 'KES 50,000', value: 50000 },
    { id: '100k', name: 'KES 100,000', value: 100000 },
    { id: '200k', name: 'KES 200,000', value: 200000 },
    { id: '300k', name: 'KES 300,000', value: 300000 },
    { id: '500k', name: 'KES 500,000', value: 500000 },
  ];

  // Fetch underwriters once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setUnderwritersLoading(true);
      setUnderwritersError(null);
      try {
        const providers = await api.getUnderwriters();
        if (cancelled) return;
        const normalized = Array.isArray(providers) ? providers : (providers?.underwriters || []);
        const mapped = normalized.map((p, idx) => ({
          id: p.code || p.underwriter_code || p.id || `uw_${idx}`,
            name: p.name || p.company || p.company_name || p.underwriter_name || `Underwriter ${idx + 1}`,
        }));
        setUnderwriters(mapped);
      } catch (e) {
        if (!cancelled) setUnderwritersError(e.message || 'Failed to load underwriters');
      } finally {
        if (!cancelled) setUnderwritersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleUnderwriter = (id) => {
    setPreferredUnderwriters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const validationErrors = () => {
    const errs = [];
    if (!age.trim()) errs.push('Client Age required');
    if (age && (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 85)) errs.push('Age must be between 18 and 85');
    if (!coverLimit) errs.push('Cover Limit required');
    if (!numberOfDependents.trim()) errs.push('Number of Dependents required');
    if (numberOfDependents && (isNaN(Number(numberOfDependents)) || Number(numberOfDependents) < 0)) errs.push('Enter valid number of dependents');
    if (!fullName.trim()) errs.push('Full Name required');
    if (!idNumber.trim()) errs.push('ID/Passport Number required');
    if (!phoneNumber.trim()) errs.push('Phone Number required');
    if (phoneNumber && phoneNumber.replace(/\D/g, '').length < 9) errs.push('Phone number must be at least 9 digits');
    if (emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) errs.push('Invalid email format');
    if (preferredUnderwriters.length === 0) errs.push('Select at least one underwriter');
    return errs;
  };
  const canSubmit = validationErrors().length === 0;

  const handleSubmit = async () => {
    const errs = validationErrors();
    if (errs.length) {
      Alert.alert('Missing / Invalid', errs.join('\n'));
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const selected = coverLimitOptions.find(o => o.id === coverLimit);
      const formData = {
        // Coverage Details
        age: Number(age),
        cover_limit_id: coverLimit,
        cover_limit_value: selected?.value,
        number_of_dependents: Number(numberOfDependents),
        
        // Client Details
        full_name: fullName.trim(),
        id_number: idNumber.trim(),
        phone_number: phoneNumber.trim(),
        email_address: emailAddress.trim() || null,
        
        // Preferences
        preferredUnderwriters,
      };
      console.log('[LastExpense] Submitting manual quote', formData);
      const res = await api.submitManualQuote('LAST_EXPENSE', formData);
      console.log('[LastExpense] Submit response:', res);
      if (res?.reference) {
        Alert.alert(
          'Quote Submitted Successfully',
          `Quote Reference: ${res.reference}\n\nYour Last Expense insurance quote has been submitted. You will receive pricing within 2 hours.`,
          [
            {
              text: 'View Quotes',
              onPress: () => {
                try {
                  navigation.navigate('MainTabs', { 
                    screen: 'Quotations',
                    params: { 
                      forceRefresh: true, 
                      focusId: res.reference,
                      justSubmitted: true,
                      message: 'Last Expense quote submitted successfully'
                    }
                  });
                } catch (e) {
                  const parent = navigation.getParent ? navigation.getParent() : null;
                  if (parent) {
                    try {
                      parent.navigate('Quotations', { forceRefresh: true });
                      return;
                    } catch (e2) {}
                  }
                  try { 
                    navigation.navigate('Quotations', { forceRefresh: true }); 
                  } catch (e3) {
                    navigation.goBack();
                  }
                }
              }
            }
          ]
        );
        // Clear form
        setAge('');
        setCoverLimit(null);
        setNumberOfDependents('');
        setFullName('');
        setIdNumber('');
        setPhoneNumber('');
        setEmailAddress('');
        setPreferredUnderwriters([]);
      } else {
        Alert.alert('Error', 'Unexpected response from server');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />
      
      {/* Red Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Heading4 style={styles.headerTitle}>Last Expense Insurance</Heading4>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>

        {/* Section: Coverage Details */}
        <View style={styles.sectionHeader}>
          <Subtitle2 style={styles.sectionTitle}>Coverage Details</Subtitle2>
        </View>

        {/* Age */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Client Age *</Subtitle2>
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="Enter age (18-85)"
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor={UI.textSecondary}
          />
        </View>

  {/* Cover Limit */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Cover Limit *</Subtitle2>
          <View style={styles.optionsWrap}>
            {coverLimitOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setCoverLimit(opt.id)}
                style={[styles.optionChip, coverLimit === opt.id && styles.optionChipActive]}
              >
                <Body1 style={[styles.optionChipText, coverLimit === opt.id && styles.optionChipTextActive]}>{opt.name}</Body1>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Number of Dependents */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Number of Dependents *</Subtitle2>
          <TextInput
            value={numberOfDependents}
            onChangeText={setNumberOfDependents}
            placeholder="Enter number of dependents"
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor={UI.textSecondary}
          />
          <Body2 style={styles.helperText}>Number of people covered under this policy</Body2>
        </View>

        {/* Section: Client Information */}
        <View style={styles.sectionHeader}>
          <Subtitle2 style={styles.sectionTitle}>Client Information</Subtitle2>
        </View>

        {/* Full Name */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Full Name *</Subtitle2>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name as per ID"
            style={styles.input}
            placeholderTextColor={UI.textSecondary}
            autoCapitalize="words"
          />
        </View>

        {/* ID/Passport Number */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>ID/Passport Number *</Subtitle2>
          <TextInput
            value={idNumber}
            onChangeText={setIdNumber}
            placeholder="Enter ID or passport number"
            style={styles.input}
            placeholderTextColor={UI.textSecondary}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Phone Number *</Subtitle2>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="e.g., 0712345678"
            keyboardType="phone-pad"
            style={styles.input}
            placeholderTextColor={UI.textSecondary}
          />
        </View>

        {/* Email Address */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Email Address (Optional)</Subtitle2>
          <TextInput
            value={emailAddress}
            onChangeText={setEmailAddress}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            placeholderTextColor={UI.textSecondary}
          />
        </View>

        {/* Section: Insurance Preferences */}
        <View style={styles.sectionHeader}>
          <Subtitle2 style={styles.sectionTitle}>Insurance Preferences</Subtitle2>
        </View>

        {/* Preferred Underwriters */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Preferred Underwriters *</Subtitle2>
          {underwritersLoading && <Body2 style={styles.loadingText}>Loading underwriters...</Body2>}
          {underwritersError && !underwritersLoading && <Body2 style={styles.errorText}>{underwritersError}</Body2>}
          {!underwritersLoading && !underwritersError && (
            <View style={styles.underwriterChips}>
              {underwriters.map(u => (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => toggleUnderwriter(u.id)}
                  style={[styles.uwChip, preferredUnderwriters.includes(u.id) && styles.uwChipActive]}
                >
                  <Body2 style={[styles.uwChipText, preferredUnderwriters.includes(u.id) && styles.uwChipTextActive]}>{u.name}</Body2>
                </TouchableOpacity>
              ))}
              {underwriters.length === 0 && <Body2 style={styles.loadingText}>No underwriters available</Body2>}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          disabled={!canSubmit || submitting}
          onPress={handleSubmit}
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
        >
          <ButtonText style={styles.submitText}>{submitting ? 'Submitting...' : 'Request Quote'}</ButtonText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  scroll: { padding: SPACING.lg },
  sectionHeader: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: UI.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.h4,
    fontWeight: '600',
    color: BRAND.primary,
  },
  fieldBlock: { marginBottom: SPACING.xxl },
  label: { marginBottom: SPACING.sm },
  helperText: {
    marginTop: SPACING.xs,
    color: UI.textSecondary,
    fontSize: FONT_SIZES.caption,
  },
  input: {
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: UI.backgroundGray,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.input,
    color: UI.textPrimary,
  },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionChip: {
    backgroundColor: UI.backgroundLight,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: UI.border,
  },
  optionChipActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  optionChipText: { color: UI.textSecondary },
  optionChipTextActive: { color: '#fff', fontWeight: '600' },
  underwriterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  uwChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: UI.backgroundLight,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  uwChipActive: { backgroundColor: BRAND.primary },
  uwChipText: { color: UI.textSecondary },
  uwChipTextActive: { color: '#fff', fontWeight: '600' },
  loadingText: { color: UI.textSecondary },
  errorText: { color: SEMANTIC.error },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
    backgroundColor: UI.surface,
    borderTopWidth: 1,
    borderColor: UI.border,
  },
  submitBtn: {
    backgroundColor: BRAND.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '600' },
});
