/**
 * Domestic Package Insurance Quotation Screen
 * Comprehensive home insurance with property, contents, and liability coverage
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
import { Heading4, Body1, Body2, Subtitle2 } from '../../../components/typography/Text';
import api from '../../../services/DjangoAPIService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable LayoutAnimation on Android (only if not using New Architecture)
if (
  Platform.OS === 'android' && 
  UIManager.setLayoutAnimationEnabledExperimental &&
  typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DomesticPackageQuotationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  // Property Owner Details
  const [ownerName, setOwnerName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  
  // Property Details
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyType, setPropertyType] = useState(null); // object {id, name, riskMultiplier}
  const [showPropertyTypeList, setShowPropertyTypeList] = useState(false);
  const [buildingMaterial, setBuildingMaterial] = useState(null); // object {id, name, multiplier}
  const [showBuildingMaterialList, setShowBuildingMaterialList] = useState(false);
  const [occupancyType, setOccupancyType] = useState(null);
  const [showOccupancyList, setShowOccupancyList] = useState(false);
  const [yearBuilt, setYearBuilt] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState('');
  const [hasSecuritySystem, setHasSecuritySystem] = useState(false);
  
  // Coverage Details
  const [buildingValue, setBuildingValue] = useState('');
  const [contentsValue, setContentsValue] = useState('');
  const [includePersonalAccident, setIncludePersonalAccident] = useState(false);
  const [includePublicLiability, setIncludePublicLiability] = useState(false);
  const [includeAllRisks, setIncludeAllRisks] = useState(false);
  const [includeLossOfRent, setIncludeLossOfRent] = useState(false);
  
  // Underwriters
  const [underwriters, setUnderwriters] = useState([]);
  const [underwritersLoading, setUnderwritersLoading] = useState(false);
  const [underwritersError, setUnderwritersError] = useState(null);
  const [preferredUnderwriters, setPreferredUnderwriters] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);

  // Property Type Options
  const propertyTypeOptions = [
    { id: 'apartment', name: 'Apartment/Flat', riskMultiplier: 1.0 },
    { id: 'detached_house', name: 'Detached House', riskMultiplier: 1.2 },
    { id: 'semi_detached', name: 'Semi-Detached House', riskMultiplier: 1.1 },
    { id: 'townhouse', name: 'Townhouse', riskMultiplier: 1.05 },
    { id: 'bungalow', name: 'Bungalow', riskMultiplier: 1.15 },
    { id: 'villa', name: 'Villa', riskMultiplier: 1.3 },
    { id: 'maisonette', name: 'Maisonette', riskMultiplier: 1.1 }
  ];

  // Building Material Options
  const buildingMaterialOptions = [
    { id: 'concrete_stone', name: 'Concrete/Stone', multiplier: 1.0 },
    { id: 'brick', name: 'Brick', multiplier: 1.05 },
    { id: 'wood_frame', name: 'Wood Frame', multiplier: 1.35 },
    { id: 'steel_frame', name: 'Steel Frame', multiplier: 0.95 },
    { id: 'mixed_materials', name: 'Mixed Materials', multiplier: 1.15 }
  ];

  // Occupancy Type Options
  const occupancyTypeOptions = [
    { id: 'owner_occupied', name: 'Owner Occupied' },
    { id: 'tenant_occupied', name: 'Tenant Occupied' },
    { id: 'vacant', name: 'Vacant' },
    { id: 'seasonal', name: 'Seasonal Use' },
    { id: 'business_use', name: 'Mixed Residential/Business' }
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
        const raw = await AsyncStorage.getItem('domestic_package_draft');
        if (raw) {
          const d = JSON.parse(raw);
          setOwnerName(d.ownerName || '');
          setIdNumber(d.idNumber || '');
          setPhoneNumber(d.phoneNumber || '');
          setEmailAddress(d.emailAddress || '');
          setPropertyAddress(d.propertyAddress || '');
          setPropertyType(d.propertyType || null);
          setBuildingMaterial(d.buildingMaterial || null);
          setOccupancyType(d.occupancyType || null);
          setYearBuilt(d.yearBuilt || '');
          setNumberOfRooms(d.numberOfRooms || '');
          setHasSecuritySystem(d.hasSecuritySystem || false);
          setBuildingValue(d.buildingValue || '');
          setContentsValue(d.contentsValue || '');
          setIncludePersonalAccident(d.includePersonalAccident || false);
          setIncludePublicLiability(d.includePublicLiability || false);
          setIncludeAllRisks(d.includeAllRisks || false);
          setIncludeLossOfRent(d.includeLossOfRent || false);
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
      ownerName, idNumber, phoneNumber, emailAddress,
      propertyAddress, propertyType, buildingMaterial, occupancyType,
      yearBuilt, numberOfRooms, hasSecuritySystem,
      buildingValue, contentsValue,
      includePersonalAccident, includePublicLiability, includeAllRisks, includeLossOfRent,
      preferredUnderwriters
    };
    try {
      await AsyncStorage.setItem('domestic_package_draft', JSON.stringify(draft));
      Alert.alert('Saved', 'Draft stored locally.');
    } catch (e) {
      Alert.alert('Save Failed', e.message);
    }
  };

  const validationErrors = () => {
    const errs = [];
    if (!ownerName.trim()) errs.push('Owner Name required');
    if (!idNumber.trim()) errs.push('ID Number required');
    if (!phoneNumber.trim()) errs.push('Phone Number required');
    if (!emailAddress.trim()) errs.push('Email Address required');
    if (!propertyAddress.trim()) errs.push('Property Address required');
    if (!propertyType) errs.push('Property Type required');
    if (!buildingMaterial) errs.push('Building Material required');
    if (!occupancyType) errs.push('Occupancy Type required');
    if (!yearBuilt.trim()) errs.push('Year Built required');
    if (!buildingValue.trim() && !contentsValue.trim()) errs.push('At least Building Value or Contents Value required');
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
        owner_name: ownerName.trim(),
        id_number: idNumber.trim(),
        phone_number: phoneNumber.trim(),
        email_address: emailAddress.trim(),
        property_address: propertyAddress.trim(),
        property_type: propertyType?.name,
        property_type_multiplier: propertyType?.riskMultiplier,
        building_material: buildingMaterial?.name,
        building_material_multiplier: buildingMaterial?.multiplier,
        occupancy_type: occupancyType?.name,
        year_built: Number(yearBuilt),
        number_of_rooms: numberOfRooms ? Number(numberOfRooms) : null,
        has_security_system: hasSecuritySystem,
        building_value: buildingValue ? Number(buildingValue) : null,
        contents_value: contentsValue ? Number(contentsValue) : null,
        include_personal_accident: includePersonalAccident,
        include_public_liability: includePublicLiability,
        include_all_risks: includeAllRisks,
        include_loss_of_rent: includeLossOfRent,
        preferred_underwriters: preferredUnderwriters,
      };
      console.log('[Domestic Package] Submitting manual quote', payload);
      const res = await api.submitManualQuote('DOMESTIC_PACKAGE', payload);
      console.log('[Domestic Package] Submit response:', res);
      if (res?.reference) {
        Alert.alert(
          'Quote Submitted Successfully',
          `Quote Reference: ${res.reference}\n\nYour Domestic Package insurance quote has been submitted. You will receive pricing within 2 hours.`,
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
                      message: 'Domestic Package quote submitted successfully'
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
      console.error('[Domestic Package] Submit error:', e);
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
        <Heading4 style={styles.headerTitle}>Domestic Package Insurance</Heading4>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionSpacer} />

        {/* Section 1: Property Owner Details */}
        <View style={styles.stepHeader}>
          <View style={styles.stepCircle}><Body1 style={styles.stepCircleText}>1</Body1></View>
          <Subtitle2 style={styles.stepTitle}>Property Owner Details</Subtitle2>
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Owner Name</Subtitle2>
          <TextInput
            placeholder="Full name of property owner"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={ownerName}
            onChangeText={setOwnerName}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>ID/Passport Number</Subtitle2>
          <TextInput
            placeholder="Owner's ID or passport number"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={idNumber}
            onChangeText={setIdNumber}
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
            placeholder="owner@example.com"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={emailAddress}
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Section 2: Property Details */}
        <View style={styles.stepHeader}>
          <View style={styles.stepCircle}><Body1 style={styles.stepCircleText}>2</Body1></View>
          <Subtitle2 style={styles.stepTitle}>Property Details</Subtitle2>
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Property Address</Subtitle2>
          <TextInput
            placeholder="Full property address including city"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={propertyAddress}
            onChangeText={setPropertyAddress}
            multiline
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Property Type</Subtitle2>
          <TouchableOpacity
            onPress={() => setShowPropertyTypeList(s => !s)}
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          >
            <Body1 style={{ color: propertyType ? UI.textPrimary : UI.textSecondary }}>
              {propertyType ? propertyType.name : 'Select property type'}
            </Body1>
            <Ionicons name={showPropertyTypeList ? 'chevron-up' : 'chevron-down'} size={18} color={UI.textSecondary} />
          </TouchableOpacity>
          {showPropertyTypeList && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {propertyTypeOptions.map(opt => {
                  const active = propertyType?.id === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { setPropertyType(opt); setShowPropertyTypeList(false); }}
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
          <Subtitle2 style={styles.label}>Building Material</Subtitle2>
          <TouchableOpacity
            onPress={() => setShowBuildingMaterialList(s => !s)}
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          >
            <Body1 style={{ color: buildingMaterial ? UI.textPrimary : UI.textSecondary }}>
              {buildingMaterial ? buildingMaterial.name : 'Select building material'}
            </Body1>
            <Ionicons name={showBuildingMaterialList ? 'chevron-up' : 'chevron-down'} size={18} color={UI.textSecondary} />
          </TouchableOpacity>
          {showBuildingMaterialList && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {buildingMaterialOptions.map(opt => {
                  const active = buildingMaterial?.id === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { setBuildingMaterial(opt); setShowBuildingMaterialList(false); }}
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
          <Subtitle2 style={styles.label}>Occupancy Type</Subtitle2>
          <TouchableOpacity
            onPress={() => setShowOccupancyList(s => !s)}
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          >
            <Body1 style={{ color: occupancyType ? UI.textPrimary : UI.textSecondary }}>
              {occupancyType ? occupancyType.name : 'Select occupancy type'}
            </Body1>
            <Ionicons name={showOccupancyList ? 'chevron-up' : 'chevron-down'} size={18} color={UI.textSecondary} />
          </TouchableOpacity>
          {showOccupancyList && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {occupancyTypeOptions.map(opt => {
                  const active = occupancyType?.id === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { setOccupancyType(opt); setShowOccupancyList(false); }}
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
          <Subtitle2 style={styles.label}>Year Built</Subtitle2>
          <TextInput
            placeholder="e.g., 2015"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={yearBuilt}
            onChangeText={setYearBuilt}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Number of Rooms (Optional)</Subtitle2>
          <TextInput
            placeholder="Total number of rooms"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={numberOfRooms}
            onChangeText={setNumberOfRooms}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldBlock}>
          <TouchableOpacity
            onPress={() => setHasSecuritySystem(!hasSecuritySystem)}
            style={styles.checkboxRow}
          >
            <Ionicons
              name={hasSecuritySystem ? 'checkbox' : 'square-outline'}
              size={24}
              color={hasSecuritySystem ? BRAND.primary : UI.textSecondary}
            />
            <Body1 style={styles.checkboxLabel}>Property has security system/alarm</Body1>
          </TouchableOpacity>
        </View>

        {/* Section 3: Coverage Details */}
        <View style={styles.stepHeader}>
          <View style={styles.stepCircle}><Body1 style={styles.stepCircleText}>3</Body1></View>
          <Subtitle2 style={styles.stepTitle}>Coverage Details</Subtitle2>
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Building Value (KES)</Subtitle2>
          <Body2 style={styles.helper}>Estimated rebuild cost of the building structure</Body2>
          <TextInput
            placeholder="e.g., 5000000"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={buildingValue}
            onChangeText={setBuildingValue}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Contents Value (KES)</Subtitle2>
          <Body2 style={styles.helper}>Total value of household contents and belongings</Body2>
          <TextInput
            placeholder="e.g., 1000000"
            placeholderTextColor={UI.textSecondary}
            style={styles.input}
            value={contentsValue}
            onChangeText={setContentsValue}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Additional Coverage (Optional)</Subtitle2>
          <Body2 style={styles.helper}>Select additional coverages to include</Body2>

          <TouchableOpacity
            onPress={() => setIncludePersonalAccident(!includePersonalAccident)}
            style={styles.checkboxRow}
          >
            <Ionicons
              name={includePersonalAccident ? 'checkbox' : 'square-outline'}
              size={24}
              color={includePersonalAccident ? BRAND.primary : UI.textSecondary}
            />
            <Body1 style={styles.checkboxLabel}>Personal Accident Cover</Body1>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIncludePublicLiability(!includePublicLiability)}
            style={styles.checkboxRow}
          >
            <Ionicons
              name={includePublicLiability ? 'checkbox' : 'square-outline'}
              size={24}
              color={includePublicLiability ? BRAND.primary : UI.textSecondary}
            />
            <Body1 style={styles.checkboxLabel}>Public Liability Cover</Body1>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIncludeAllRisks(!includeAllRisks)}
            style={styles.checkboxRow}
          >
            <Ionicons
              name={includeAllRisks ? 'checkbox' : 'square-outline'}
              size={24}
              color={includeAllRisks ? BRAND.primary : UI.textSecondary}
            />
            <Body1 style={styles.checkboxLabel}>All Risks Cover (Valuables)</Body1>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIncludeLossOfRent(!includeLossOfRent)}
            style={styles.checkboxRow}
          >
            <Ionicons
              name={includeLossOfRent ? 'checkbox' : 'square-outline'}
              size={24}
              color={includeLossOfRent ? BRAND.primary : UI.textSecondary}
            />
            <Body1 style={styles.checkboxLabel}>Loss of Rent Cover</Body1>
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
                  <Body2
                    style={[styles.chipText, preferredUnderwriters.includes(u.id) && styles.chipTextSelected]}
                  >
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
          <Subtitle2 style={styles.submitText}>
            {submitting ? 'Submitting...' : 'Request Quote'}
          </Subtitle2>
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
    paddingTop: SPACING.lg + 4, // Extra padding from top
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
