/**
 * Professional Indemnity Insurance Quotation Screen
 * Coverage for professional liability claims arising from errors, omissions, or negligence
 * Single-step simplified form following PataBima design patterns
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, UI, SEMANTIC, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../../theme';
import { Heading4, Body1, Body2, Subtitle2, ButtonText } from '../../../components/typography/Text';

// Enable LayoutAnimation on Android (only if not using New Architecture)
if (
  Platform.OS === 'android' && 
  UIManager.setLayoutAnimationEnabledExperimental &&
  typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import api from '../../../services/DjangoAPIService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfessionalIndemnityQuotationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  // Business Information
  const [businessName, setBusinessName] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [businessType, setBusinessType] = useState(null);
  const [showBusinessTypeList, setShowBusinessTypeList] = useState(false);
  const [principalContactName, setPrincipalContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  
  // Professional Details
  const [profession, setProfession] = useState(null); // object {id, name, riskMultiplier}
  const [showProfessionList, setShowProfessionList] = useState(false);
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [numberOfEmployees, setNumberOfEmployees] = useState('');
  const [annualTurnover, setAnnualTurnover] = useState('');
  const [professionalQualifications, setProfessionalQualifications] = useState('');
  const [professionalBodies, setProfessionalBodies] = useState(''); // e.g., ICPAK, LSK, etc.
  
  // Coverage Selection
  const [indemnityLimit, setIndemnityLimit] = useState(null); // object {id, name, amount, basePremium}
  const [showIndemnityLimitList, setShowIndemnityLimitList] = useState(false);
  const [excessAmount, setExcessAmount] = useState(null);
  const [showExcessList, setShowExcessList] = useState(false);
  const [territoryOfCoverage, setTerritoryOfCoverage] = useState(null);
  const [showTerritoryList, setShowTerritoryList] = useState(false);
  const [includeCyberLiability, setIncludeCyberLiability] = useState(false);
  const [includeEmploymentPractices, setIncludeEmploymentPractices] = useState(false);
  const [includeDirectorsOfficers, setIncludeDirectorsOfficers] = useState(false);
  
  // Underwriters
  const [underwriters, setUnderwriters] = useState([]);
  const [underwritersLoading, setUnderwritersLoading] = useState(false);
  const [underwritersError, setUnderwritersError] = useState(null);
  const [preferredUnderwriters, setPreferredUnderwriters] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);

  // Business Type Options
  const businessTypeOptions = [
    { id: 'sole_proprietorship', name: 'Sole Proprietorship' },
    { id: 'partnership', name: 'Partnership' },
    { id: 'limited_company', name: 'Limited Company' },
    { id: 'public_company', name: 'Public Company' },
    { id: 'llp', name: 'Limited Liability Partnership (LLP)' }
  ];

  // Profession Options (with risk multipliers for premium calculation)
  const professionOptions = [
    { id: 'accountant', name: 'Accountant/Auditor', riskMultiplier: 1.2 },
    { id: 'lawyer', name: 'Lawyer/Advocate', riskMultiplier: 1.8 },
    { id: 'doctor', name: 'Medical Doctor', riskMultiplier: 2.5 },
    { id: 'dentist', name: 'Dentist', riskMultiplier: 2.2 },
    { id: 'architect', name: 'Architect', riskMultiplier: 1.5 },
    { id: 'engineer', name: 'Engineer', riskMultiplier: 1.4 },
    { id: 'surveyor', name: 'Quantity Surveyor', riskMultiplier: 1.3 },
    { id: 'consultant', name: 'Management Consultant', riskMultiplier: 1.3 },
    { id: 'it_professional', name: 'IT Professional/Software Developer', riskMultiplier: 1.6 },
    { id: 'financial_advisor', name: 'Financial Advisor', riskMultiplier: 2.0 },
    { id: 'insurance_broker', name: 'Insurance Broker', riskMultiplier: 1.7 },
    { id: 'real_estate_agent', name: 'Real Estate Agent', riskMultiplier: 1.4 },
    { id: 'other', name: 'Other Professional', riskMultiplier: 1.0 }
  ];

  // Indemnity Limit Options
  const indemnityLimitOptions = [
    { id: '1million', name: 'KES 1 Million', amount: 1000000, basePremium: 25000 },
    { id: '5million', name: 'KES 5 Million', amount: 5000000, basePremium: 75000 },
    { id: '10million', name: 'KES 10 Million', amount: 10000000, basePremium: 120000 },
    { id: '25million', name: 'KES 25 Million', amount: 25000000, basePremium: 250000 },
    { id: '50million', name: 'KES 50 Million', amount: 50000000, basePremium: 450000 },
    { id: '100million', name: 'KES 100 Million', amount: 100000000, basePremium: 800000 }
  ];

  // Excess Amount Options (voluntary deductible)
  const excessOptions = [
    { id: 'none', name: 'No Excess', multiplier: 1.0 },
    { id: '50k', name: 'KES 50,000', amount: 50000, multiplier: 0.95 },
    { id: '100k', name: 'KES 100,000', amount: 100000, multiplier: 0.90 },
    { id: '250k', name: 'KES 250,000', amount: 250000, multiplier: 0.85 },
    { id: '500k', name: 'KES 500,000', amount: 500000, multiplier: 0.80 }
  ];

  // Territory of Coverage Options
  const territoryOptions = [
    { id: 'kenya', name: 'Kenya Only' },
    { id: 'east_africa', name: 'East Africa (Kenya, Uganda, Tanzania)' },
    { id: 'africa', name: 'Africa' },
    { id: 'worldwide_ex_usa', name: 'Worldwide Excluding USA/Canada' },
    { id: 'worldwide', name: 'Worldwide Including USA/Canada' }
  ];

  // Fetch underwriters
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setUnderwritersLoading(true);
      setUnderwritersError(null);
      try {
        const providers = await api.getUnderwriters();
        if (cancelled) return;
        const normalized = Array.isArray(providers) ? providers : (providers?.underwriters || []);
        const mapped = normalized.map((p, idx) => ({
          id: p.code || p.id || `uw_${idx}`,
          name: p.name || p.company || p.company_name || `Underwriter ${idx + 1}`
        }));
        setUnderwriters(mapped);
      } catch (e) {
        if (!cancelled) setUnderwritersError(e.message || 'Failed to load underwriters');
      } finally {
        if (!cancelled) setUnderwritersLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Load draft
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('professional_indemnity_draft');
        if (raw) {
          const d = JSON.parse(raw);
          setBusinessName(d.businessName || '');
          setBusinessRegistrationNumber(d.businessRegistrationNumber || '');
          setBusinessType(d.businessType || null);
          setPrincipalContactName(d.principalContactName || '');
          setPhoneNumber(d.phoneNumber || '');
          setEmailAddress(d.emailAddress || '');
          setPhysicalAddress(d.physicalAddress || '');
          setProfession(d.profession || null);
          setYearsInBusiness(d.yearsInBusiness || '');
          setNumberOfEmployees(d.numberOfEmployees || '');
          setAnnualTurnover(d.annualTurnover || '');
          setProfessionalQualifications(d.professionalQualifications || '');
          setProfessionalBodies(d.professionalBodies || '');
          setIndemnityLimit(d.indemnityLimit || null);
          setExcessAmount(d.excessAmount || null);
          setTerritoryOfCoverage(d.territoryOfCoverage || null);
          setIncludeCyberLiability(d.includeCyberLiability || false);
          setIncludeEmploymentPractices(d.includeEmploymentPractices || false);
          setIncludeDirectorsOfficers(d.includeDirectorsOfficers || false);
          setPreferredUnderwriters(d.preferredUnderwriters || []);
        }
      } catch (e) {
        console.warn('Load draft failed', e.message);
      }
    })();
  }, []);

  const toggleUnderwriter = (id) => {
    setPreferredUnderwriters(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const persistDraft = async () => {
    const draft = {
      businessName, businessRegistrationNumber, businessType,
      principalContactName, phoneNumber, emailAddress, physicalAddress,
      profession, yearsInBusiness, numberOfEmployees, annualTurnover,
      professionalQualifications, professionalBodies,
      indemnityLimit, excessAmount, territoryOfCoverage,
      includeCyberLiability, includeEmploymentPractices, includeDirectorsOfficers,
      preferredUnderwriters
    };
    try {
      await AsyncStorage.setItem('professional_indemnity_draft', JSON.stringify(draft));
      Alert.alert('Saved', 'Draft stored locally.');
    } catch (e) {
      Alert.alert('Save Failed', e.message);
    }
  };

  const validationErrors = () => {
    const errs = [];
    if (!businessName.trim()) errs.push('Business Name required');
    if (!businessRegistrationNumber.trim()) errs.push('Business Registration Number required');
    if (!businessType) errs.push('Business Type required');
    if (!principalContactName.trim()) errs.push('Principal Contact Name required');
    if (!phoneNumber.trim()) errs.push('Phone Number required');
    if (!emailAddress.trim()) errs.push('Email Address required');
    if (!profession) errs.push('Profession required');
    if (!yearsInBusiness.trim()) errs.push('Years in Business required');
    if (!numberOfEmployees.trim()) errs.push('Number of Employees required');
    if (!annualTurnover.trim()) errs.push('Annual Turnover required');
    if (!indemnityLimit) errs.push('Indemnity Limit required');
    if (!excessAmount) errs.push('Excess Amount required');
    if (!territoryOfCoverage) errs.push('Territory of Coverage required');
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
      const payload = {
        business_name: businessName.trim(),
        business_registration_number: businessRegistrationNumber.trim(),
        business_type: businessType?.name,
        principal_contact_name: principalContactName.trim(),
        phone_number: phoneNumber.trim(),
        email_address: emailAddress.trim(),
        physical_address: physicalAddress.trim(),
        profession: profession?.name,
        profession_multiplier: profession?.riskMultiplier,
        years_in_business: Number(yearsInBusiness),
        number_of_employees: Number(numberOfEmployees),
        annual_turnover: Number(annualTurnover),
        professional_qualifications: professionalQualifications.trim(),
        professional_bodies: professionalBodies.trim(),
        indemnity_limit: indemnityLimit?.amount,
        indemnity_limit_base_premium: indemnityLimit?.basePremium,
        excess_amount: excessAmount?.amount || 0,
        excess_multiplier: excessAmount?.multiplier,
        territory_of_coverage: territoryOfCoverage?.name,
        include_cyber_liability: includeCyberLiability,
        include_employment_practices: includeEmploymentPractices,
        include_directors_officers: includeDirectorsOfficers,
        preferred_underwriters: preferredUnderwriters,
      };
      console.log('[Professional Indemnity] Submitting manual quote', payload);
      const res = await api.submitManualQuote('PROFESSIONAL_INDEMNITY', payload);
      console.log('[Professional Indemnity] Submit response:', res);
      if (res?.reference) {
        Alert.alert(
          'Quote Submitted Successfully',
          `Quote Reference: ${res.reference}\n\nYour Professional Indemnity insurance quote has been submitted. You will receive pricing within 2 hours.`,
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
                      message: 'Professional Indemnity quote submitted successfully'
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
      }
    } catch (e) {
      console.error('[Professional Indemnity] Submit error:', e);
      Alert.alert('Error', e.message || 'Failed to submit quote');
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
        <Heading4 style={styles.headerTitle}>Professional Indemnity Insurance</Heading4>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionSpacer} />

        {/* Section 1: Business Information */}
        <View style={styles.stepHeader}>
          <View style={styles.stepCircle}><Body1 style={styles.stepCircleText}>1</Body1></View>
          <Subtitle2 style={styles.stepTitle}>Business Information</Subtitle2>
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Business Name</Subtitle2>
          <TextInput
            placeholder="Legal business name"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Business Registration Number</Subtitle2>
          <TextInput
            placeholder="Company registration number"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={businessRegistrationNumber}
            onChangeText={setBusinessRegistrationNumber}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Business Type</Subtitle2>
          <TouchableOpacity
            onPress={() => setShowBusinessTypeList(s => !s)}
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          >
            <Body1 style={{ color: businessType ? UI.textPrimary : UI.textSecondary }}>
              {businessType ? businessType.name : 'Select business type'}
            </Body1>
            <Ionicons name={showBusinessTypeList ? 'chevron-up' : 'chevron-down'} size={18} color={UI.textSecondary} />
          </TouchableOpacity>
          {showBusinessTypeList && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {businessTypeOptions.map(opt => {
                  const active = businessType?.id === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { setBusinessType(opt); setShowBusinessTypeList(false); }}
                      style={[styles.dropdownRow, active && styles.dropdownRowActive]}
                    >
                      <Body1 style={[styles.dropdownRowText, active && styles.dropdownRowTextActive]}>
                        {opt.name}
                      </Body1>
                      {active && <Ionicons name="checkmark-circle" size={18} color={BRAND.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Principal Contact Name</Subtitle2>
          <TextInput
            placeholder="Full name of principal contact"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={principalContactName}
            onChangeText={setPrincipalContactName}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Phone Number</Subtitle2>
          <TextInput
            placeholder="e.g., +254712345678"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Email Address</Subtitle2>
          <TextInput
            placeholder="business@example.com"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={emailAddress}
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Physical Address</Subtitle2>
          <TextInput
            placeholder="Business physical address"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={physicalAddress}
            onChangeText={setPhysicalAddress}
            multiline
          />
        </View>

        {/* Section 2: Professional Details */}
        <View style={styles.stepHeader}>
          <View style={styles.stepCircle}><Body1 style={styles.stepCircleText}>2</Body1></View>
          <Subtitle2 style={styles.stepTitle}>Professional Details</Subtitle2>
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Profession</Subtitle2>
          <TouchableOpacity
            onPress={() => setShowProfessionList(s => !s)}
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          >
            <Body1 style={{ color: profession ? UI.textPrimary : UI.textSecondary }}>
              {profession ? profession.name : 'Select profession'}
            </Body1>
            <Ionicons name={showProfessionList ? 'chevron-up' : 'chevron-down'} size={18} color={UI.textSecondary} />
          </TouchableOpacity>
          {showProfessionList && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                {professionOptions.map(opt => {
                  const active = profession?.id === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { setProfession(opt); setShowProfessionList(false); }}
                      style={[styles.dropdownRow, active && styles.dropdownRowActive]}
                    >
                      <Body1 style={[styles.dropdownRowText, active && styles.dropdownRowTextActive]}>
                        {opt.name}
                      </Body1>
                      {active && <Ionicons name="checkmark-circle" size={18} color={BRAND.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Years in Business</Subtitle2>
          <TextInput
            placeholder="Number of years in operation"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={yearsInBusiness}
            onChangeText={setYearsInBusiness}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Number of Employees</Subtitle2>
          <TextInput
            placeholder="Total number of employees"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={numberOfEmployees}
            onChangeText={setNumberOfEmployees}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Annual Turnover (KES)</Subtitle2>
          <TextInput
            placeholder="Annual business turnover"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={annualTurnover}
            onChangeText={setAnnualTurnover}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Professional Qualifications</Subtitle2>
          <Body2 style={styles.helper}>Relevant degrees, certifications, licenses</Body2>
          <TextInput
            placeholder="e.g., CPA, LLB, MBChB, etc."
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={professionalQualifications}
            onChangeText={setProfessionalQualifications}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Professional Bodies/Associations</Subtitle2>
          <Body2 style={styles.helper}>Membership in professional organizations</Body2>
          <TextInput
            placeholder="e.g., ICPAK, LSK, IEK, etc."
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={professionalBodies}
            onChangeText={setProfessionalBodies}
          />
        </View>

        {/* Section 3: Coverage Selection */}
        <View style={styles.stepHeader}>
          <View style={styles.stepCircle}><Body1 style={styles.stepCircleText}>3</Body1></View>
          <Subtitle2 style={styles.stepTitle}>Coverage Selection</Subtitle2>
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Indemnity Limit</Subtitle2>
          <Body2 style={styles.helper}>Maximum liability coverage per claim</Body2>
          <TouchableOpacity
            onPress={() => setShowIndemnityLimitList(s => !s)}
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          >
            <Body1 style={{ color: indemnityLimit ? UI.textPrimary : UI.textSecondary }}>
              {indemnityLimit ? indemnityLimit.name : 'Select indemnity limit'}
            </Body1>
            <Ionicons name={showIndemnityLimitList ? 'chevron-up' : 'chevron-down'} size={18} color={UI.textSecondary} />
          </TouchableOpacity>
          {showIndemnityLimitList && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                {indemnityLimitOptions.map(opt => {
                  const active = indemnityLimit?.id === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { setIndemnityLimit(opt); setShowIndemnityLimitList(false); }}
                      style={[styles.dropdownRow, active && styles.dropdownRowActive]}
                    >
                      <Body1 style={[styles.dropdownRowText, active && styles.dropdownRowTextActive]}>
                        {opt.name}
                      </Body1>
                      {active && <Ionicons name="checkmark-circle" size={18} color={BRAND.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Excess Amount (Deductible)</Subtitle2>
          <Body2 style={styles.helper}>Voluntary deductible to reduce premium</Body2>
          <TouchableOpacity
            onPress={() => setShowExcessList(s => !s)}
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          >
            <Body1 style={{ color: excessAmount ? UI.textPrimary : UI.textSecondary }}>
              {excessAmount ? excessAmount.name : 'Select excess amount'}
            </Body1>
            <Ionicons name={showExcessList ? 'chevron-up' : 'chevron-down'} size={18} color={UI.textSecondary} />
          </TouchableOpacity>
          {showExcessList && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {excessOptions.map(opt => {
                  const active = excessAmount?.id === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { setExcessAmount(opt); setShowExcessList(false); }}
                      style={[styles.dropdownRow, active && styles.dropdownRowActive]}
                    >
                      <Body1 style={[styles.dropdownRowText, active && styles.dropdownRowTextActive]}>
                        {opt.name}
                      </Body1>
                      {active && <Ionicons name="checkmark-circle" size={18} color={BRAND.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Territory of Coverage</Subtitle2>
          <Body2 style={styles.helper}>Geographic scope of coverage</Body2>
          <TouchableOpacity
            onPress={() => setShowTerritoryList(s => !s)}
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          >
            <Body1 style={{ color: territoryOfCoverage ? UI.textPrimary : UI.textSecondary }}>
              {territoryOfCoverage ? territoryOfCoverage.name : 'Select territory'}
            </Body1>
            <Ionicons name={showTerritoryList ? 'chevron-up' : 'chevron-down'} size={18} color={UI.textSecondary} />
          </TouchableOpacity>
          {showTerritoryList && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {territoryOptions.map(opt => {
                  const active = territoryOfCoverage?.id === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { setTerritoryOfCoverage(opt); setShowTerritoryList(false); }}
                      style={[styles.dropdownRow, active && styles.dropdownRowActive]}
                    >
                      <Body1 style={[styles.dropdownRowText, active && styles.dropdownRowTextActive]}>
                        {opt.name}
                      </Body1>
                      {active && <Ionicons name="checkmark-circle" size={18} color={BRAND.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Additional Coverage Extensions (Optional)</Subtitle2>
          <Body2 style={styles.helper}>Select additional coverages to include</Body2>

          <TouchableOpacity
            onPress={() => setIncludeCyberLiability(!includeCyberLiability)}
            style={styles.checkboxRow}
          >
            <Ionicons
              name={includeCyberLiability ? 'checkbox' : 'square-outline'}
              size={24}
              color={includeCyberLiability ? BRAND.primary : UI.textSecondary}
            />
            <Body1 style={styles.checkboxLabel}>Cyber Liability Extension</Body1>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIncludeEmploymentPractices(!includeEmploymentPractices)}
            style={styles.checkboxRow}
          >
            <Ionicons
              name={includeEmploymentPractices ? 'checkbox' : 'square-outline'}
              size={24}
              color={includeEmploymentPractices ? BRAND.primary : UI.textSecondary}
            />
            <Body1 style={styles.checkboxLabel}>Employment Practices Liability</Body1>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIncludeDirectorsOfficers(!includeDirectorsOfficers)}
            style={styles.checkboxRow}
          >
            <Ionicons
              name={includeDirectorsOfficers ? 'checkbox' : 'square-outline'}
              size={24}
              color={includeDirectorsOfficers ? BRAND.primary : UI.textSecondary}
            />
            <Body1 style={styles.checkboxLabel}>Directors & Officers Liability</Body1>
          </TouchableOpacity>
        </View>

        {/* Preferred Underwriters */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Preferred Underwriters</Subtitle2>
          {underwritersLoading && <Body2 style={styles.loadingText}>Loading underwriters...</Body2>}
          {underwritersError && !underwritersLoading && (
            <Body2 style={styles.errorText}>{underwritersError}</Body2>
          )}
          {!underwritersLoading && !underwritersError && (
            <View style={styles.underwriterChips}>
              {underwriters.map(u => (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => toggleUnderwriter(u.id)}
                  style={[styles.chip, preferredUnderwriters.includes(u.id) && styles.chipSelected]}
                >
                  <Body2 style={[styles.chipText, preferredUnderwriters.includes(u.id) && styles.chipTextSelected]}>
                    {u.name}
                  </Body2>
                </TouchableOpacity>
              ))}
              {underwriters.length === 0 && (
                <Body2 style={styles.loadingText}>No underwriters available</Body2>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Bar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          disabled={!canSubmit || submitting}
          onPress={handleSubmit}
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
        >
          <ButtonText style={styles.submitText}>
            {submitting ? 'Submitting...' : 'Request Quote'}
          </ButtonText>
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
  sectionSpacer: { height: SPACING.sm },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, marginTop: SPACING.xl },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  stepCircleText: { color: '#fff', fontWeight: '600' },
  stepTitle: { color: BRAND.primary },
  fieldBlock: { marginBottom: SPACING.xl },
  label: { marginBottom: SPACING.sm },
  helper: { color: UI.textSecondary, marginBottom: SPACING.sm },
  input: {
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: UI.backgroundGray,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.input,
    color: UI.textPrimary
  },
  dropdown: {
    marginTop: SPACING.md,
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: SPACING.sm,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm
  },
  dropdownRowActive: { backgroundColor: BRAND.primaryLight },
  dropdownRowText: { color: UI.textPrimary, flex: 1 },
  dropdownRowTextActive: { fontWeight: '600', color: BRAND.primary },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  checkboxLabel: { marginLeft: SPACING.md, flex: 1 },
  underwriterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm
  },
  chipSelected: { backgroundColor: BRAND.primary },
  chipText: { color: UI.textSecondary },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  loadingText: { color: UI.textSecondary },
  errorText: { color: SEMANTIC.error },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb'
  },
  submitBtn: {
    backgroundColor: BRAND.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center'
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '600' }
});
