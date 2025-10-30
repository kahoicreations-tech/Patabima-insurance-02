/**
 * WIBA (Work Injury Benefits Act) Insurance Quotation Screen
 * Simplified single-step form using screenshot fields and structure similar to EnhancedIndividualMedicalQuotation
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

export default function WIBAQuotationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  // core identifiers
  const [companyName, setCompanyName] = useState('');
  const [departments, setDepartments] = useState([]); // { id, name, employees, annualSalary }
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptDraft, setDeptDraft] = useState({ id: null, name: '', employees: '', annualSalary: '' });
  const [underwriters, setUnderwriters] = useState([]);
  const [underwritersLoading, setUnderwritersLoading] = useState(false);
  const [underwritersError, setUnderwritersError] = useState(null);
  const [preferredUnderwriters, setPreferredUnderwriters] = useState([]); // array of ids
  // Removed employee file for simplified flow
  const [submitting, setSubmitting] = useState(false);
  const [natureOfBusiness, setNatureOfBusiness] = useState('');
  // Removed registration, location, and contact detail fields
  const [numberOfEmployees, setNumberOfEmployees] = useState('');
  const [averageMonthlySalary, setAverageMonthlySalary] = useState('');
  const [industryClassification, setIndustryClassification] = useState(null); // object {name, riskLevel, multiplier}
  const [showIndustryList, setShowIndustryList] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const industryOptions = [
    { id:1, name:'Manufacturing', riskLevel:'High', multiplier:1.5 },
    { id:2, name:'Construction', riskLevel:'Very High', multiplier:2.0 },
    { id:3, name:'Mining', riskLevel:'Very High', multiplier:2.2 },
    { id:4, name:'Agriculture', riskLevel:'Medium', multiplier:1.2 },
    { id:5, name:'Transportation', riskLevel:'High', multiplier:1.6 },
    { id:6, name:'Healthcare', riskLevel:'Medium', multiplier:1.1 },
    { id:7, name:'Education', riskLevel:'Low', multiplier:0.8 },
    { id:8, name:'Finance/Banking', riskLevel:'Low', multiplier:0.7 },
    { id:9, name:'Information Technology', riskLevel:'Low', multiplier:0.6 },
    { id:10, name:'Retail/Trade', riskLevel:'Medium', multiplier:1.0 },
  ];

  // Fetch underwriters similar to medical screen
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setUnderwritersLoading(true); setUnderwritersError(null);
      try {
        const providers = await api.getUnderwriters();
        if (cancelled) return;
        const normalized = Array.isArray(providers) ? providers : (providers?.underwriters || []);
        const mapped = normalized.map((p, idx) => ({ id: p.code || p.id || `uw_${idx}`, name: p.name || p.company || p.company_name || `Underwriter ${idx+1}` }));
        setUnderwriters(mapped);
      } catch (e) {
        if (!cancelled) setUnderwritersError(e.message || 'Failed to load underwriters');
      } finally { if (!cancelled) setUnderwritersLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // load draft
  useEffect(()=>{ (async()=>{ try { const raw = await AsyncStorage.getItem('wiba_draft'); if(raw){ const d = JSON.parse(raw); setCompanyName(d.companyName||''); setNatureOfBusiness(d.natureOfBusiness||''); setNumberOfEmployees(d.numberOfEmployees||''); setAverageMonthlySalary(d.averageMonthlySalary||''); setIndustryClassification(d.industryClassification||null); setDepartments(d.departments||[]); setPreferredUnderwriters(d.preferredUnderwriters||[]); } } catch(e){ console.warn('Load draft failed', e.message);} })(); },[]);

  const resetDeptDraft = () => setDeptDraft({ id: null, name: '', employees: '', annualSalary: '' });

  const openAddDepartment = () => { resetDeptDraft(); setShowDeptForm(true); };
  const editDepartment = (dept) => { setDeptDraft({ ...dept, employees: String(dept.employees), annualSalary: String(dept.annualSalary) }); setShowDeptForm(true); };
  const removeDepartment = (id) => setDepartments(d => d.filter(dep => dep.id !== id));

  const saveDepartment = () => {
    if (!deptDraft.name.trim() || !deptDraft.employees || !deptDraft.annualSalary) {
      Alert.alert('Missing Data', 'Provide department name, employees, and annual salary');
      return;
    }
    const employeesNum = Number(deptDraft.employees);
    const annualSalaryNum = Number(deptDraft.annualSalary);
    if (isNaN(employeesNum) || employeesNum <= 0 || isNaN(annualSalaryNum) || annualSalaryNum <= 0) {
      Alert.alert('Invalid', 'Employees and annual salary must be valid numbers');
      return;
    }
    setDepartments(list => {
      if (deptDraft.id) {
        return list.map(d => d.id === deptDraft.id ? { ...d, name: deptDraft.name.trim(), employees: employeesNum, annualSalary: annualSalaryNum } : d);
      }
      return [...list, { id: Date.now().toString(), name: deptDraft.name.trim(), employees: employeesNum, annualSalary: annualSalaryNum }];
    });
    setShowDeptForm(false); resetDeptDraft();
  };

  const toggleUnderwriter = (id) => {
    setPreferredUnderwriters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const persistDraft = async () => {
  const draft = { companyName, natureOfBusiness, numberOfEmployees, averageMonthlySalary, industryClassification, departments, preferredUnderwriters };
    try { await AsyncStorage.setItem('wiba_draft', JSON.stringify(draft)); Alert.alert('Saved','Draft stored locally.'); } catch(e){ Alert.alert('Save Failed', e.message); }
  };

  // recompute when key values change
  useEffect(()=>{ }, [numberOfEmployees, averageMonthlySalary, industryClassification]);

  // validation gather
  const validationErrors = () => {
    const errs = [];
    if(!companyName.trim()) errs.push('Company Name required');
    if(!natureOfBusiness.trim()) errs.push('Nature of Business required');
  // Removed validation for registration/location/contact details
    if(!numberOfEmployees.trim()) errs.push('Number of Employees required');
    if(!averageMonthlySalary.trim()) errs.push('Average Monthly Salary required');
    if(!industryClassification) errs.push('Industry Classification required');
    if(departments.length === 0) errs.push('At least one department required');
    if(preferredUnderwriters.length === 0) errs.push('Select at least one underwriter');
    return errs;
  };

  const canSubmit = validationErrors().length === 0;

  const handleSubmit = async () => {
    const errs = validationErrors();
    if(errs.length){ Alert.alert('Missing / Invalid', errs.join('\n')); return; }
    if(submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        company_name: companyName.trim(),
        nature_of_business: natureOfBusiness.trim(),
  // Removed extra business/contact fields
        number_of_employees: Number(numberOfEmployees),
        average_monthly_salary: Number(averageMonthlySalary),
        industry: industryClassification?.name,
        industry_multiplier: industryClassification?.multiplier,
        departments: departments.map(d=>({ name:d.name, employees:d.employees, annual_salary:d.annualSalary })),
        preferred_underwriters: preferredUnderwriters,
  // employee_file removed
      };
      console.log('[WIBA] Submitting manual quote', payload);
      const res = await api.submitManualQuote('WIBA', payload);
      console.log('[WIBA] Submit response:', res);
      if (res?.reference) {
        Alert.alert(
          'Quote Submitted Successfully',
          `Quote Reference: ${res.reference}\n\nYour WIBA insurance quote has been submitted. You will receive pricing within 2 hours.`,
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
                      message: 'WIBA quote submitted successfully'
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
    } catch(e){ 
      console.error('[WIBA] Submit error:', e);
      Alert.alert('Error', e.message || 'Failed to submit quote'); 
    } finally { 
      setSubmitting(false);
    } 
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />
      
      {/* Red Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Heading4 style={styles.headerTitle}>WIBA Insurance</Heading4>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
  <View style={styles.sectionSpacer} />

        {/* Step Header / Section Label */}
        <View style={styles.stepHeader}> 
          <View style={styles.stepCircle}><Body1 style={styles.stepCircleText}>1</Body1></View>
          <Subtitle2 style={styles.stepTitle}>Policy Details</Subtitle2>
        </View>

        {/* Company Name */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Company Name</Subtitle2>
            <TextInput placeholder="Enter company name" placeholderTextColor={UI.textSecondary} style={styles.input} value={companyName} onChangeText={setCompanyName} />
        </View>

        {/* Nature of Business */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Nature of Business</Subtitle2>
            <TextInput placeholder="Describe main business activity" placeholderTextColor={UI.textSecondary} style={styles.input} value={natureOfBusiness} onChangeText={setNatureOfBusiness} />
        </View>

        {/* Contact section removed in simplified flow */}

        {/* Workforce & Industry */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Workforce & Industry</Subtitle2>
          <TextInput placeholder="Number of employees" placeholderTextColor={UI.textSecondary} style={styles.input} value={numberOfEmployees} onChangeText={setNumberOfEmployees} keyboardType="number-pad" />
          <TextInput placeholder="Average monthly salary (KES)" placeholderTextColor={UI.textSecondary} style={[styles.input,{marginTop:12}]} value={averageMonthlySalary} onChangeText={setAverageMonthlySalary} keyboardType="number-pad" />
          <TouchableOpacity onPress={()=>setShowIndustryList(s=>!s)} style={[styles.input,{marginTop:12, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}]}>
            <Body1 style={{color: industryClassification? UI.textPrimary: UI.textSecondary}}>{industryClassification? industryClassification.name : 'Select industry classification'}</Body1>
            <Ionicons name={showIndustryList? 'chevron-up' : 'chevron-down'} size={18} color={UI.textSecondary} />
          </TouchableOpacity>
          {showIndustryList && (
            <View style={styles.industryDropdown}>
              <View style={styles.industrySearchRow}>
                <Ionicons name="search" size={16} color={UI.textSecondary} style={{marginRight:6}} />
                <TextInput
                  value={industrySearch}
                  onChangeText={setIndustrySearch}
                  placeholder="Search industry..."
                  placeholderTextColor={UI.textSecondary}
                  style={styles.industrySearchInput}
                  autoCapitalize="none"
                />
                {industrySearch.length>0 && (
                  <TouchableOpacity onPress={()=>setIndustrySearch('')} style={{padding:4}}>
                    <Ionicons name="close-circle" size={16} color={UI.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView style={{maxHeight:240}} nestedScrollEnabled>
                {industryOptions
                  .filter(opt => opt.name.toLowerCase().includes(industrySearch.toLowerCase()) || opt.riskLevel.toLowerCase().includes(industrySearch.toLowerCase()))
                  .map(opt => {
                    const active = industryClassification?.id===opt.id;
                    return (
                      <TouchableOpacity key={opt.id} onPress={()=>{ setIndustryClassification(opt); setShowIndustryList(false); }} style={[styles.industryRow, active && styles.industryRowActive]}>
                        <View style={{flex:1}}>
                          <Body1 style={[styles.industryRowText, active && styles.industryRowTextActive]}>{opt.name}</Body1>
                        </View>
                        <View style={[styles.riskBadge, opt.riskLevel.includes('Very') && styles.riskBadgeVeryHigh, opt.riskLevel==='High' && styles.riskBadgeHigh, opt.riskLevel==='Medium' && styles.riskBadgeMedium, opt.riskLevel==='Low' && styles.riskBadgeLow]}>
                          <Body2 style={styles.riskBadgeText}>{opt.riskLevel}</Body2>
                        </View>
                        {active && <Ionicons name="checkmark-circle" size={18} color={BRAND.primary} style={{marginLeft:8}} />}
                      </TouchableOpacity>
                    );
                  })}
                {industryOptions.filter(opt => opt.name.toLowerCase().includes(industrySearch.toLowerCase()) || opt.riskLevel.toLowerCase().includes(industrySearch.toLowerCase())).length===0 && (
                  <Body2 style={styles.noIndustryResults}>No matches</Body2>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Inline action buttons removed per request */}

        {/* Department Details */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Department Details</Subtitle2>
          <Body2 style={styles.helper}>Add departments with employee count and annual salary</Body2>
          {departments.map(dep => (
            <View key={dep.id} style={styles.departmentRow}>
              <View style={styles.departmentInfo}> 
                <Body1 style={styles.departmentName}>{dep.name}</Body1>
                <Body2 style={styles.departmentMeta}>{dep.employees} employees • KES {dep.annualSalary.toLocaleString()}</Body2>
              </View>
              <View style={styles.deptActions}>
                <TouchableOpacity onPress={() => editDepartment(dep)} style={styles.iconBtn}><Ionicons name="pencil" size={16} color={BRAND.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => removeDepartment(dep.id)} style={styles.iconBtn}><Ionicons name="trash" size={16} color={SEMANTIC.error} /></TouchableOpacity>
              </View>
            </View>
          ))}
          {!showDeptForm && (
            <TouchableOpacity style={styles.addDepartmentBtn} onPress={openAddDepartment}>
              <Body1 style={styles.addDepartmentText}>Add Department</Body1>
            </TouchableOpacity>
          )}
          {showDeptForm && (
            <View style={styles.deptForm}> 
              <TextInput value={deptDraft.name} onChangeText={t=>setDeptDraft(d=>({...d,name:t}))} placeholder="Department name" style={styles.smallInput} placeholderTextColor={UI.textSecondary} />
              <TextInput value={deptDraft.employees} onChangeText={t=>setDeptDraft(d=>({...d,employees:t}))} placeholder="Employees" keyboardType="number-pad" style={styles.smallInput} placeholderTextColor={UI.textSecondary} />
              <TextInput value={deptDraft.annualSalary} onChangeText={t=>setDeptDraft(d=>({...d,annualSalary:t}))} placeholder="Annual Salary" keyboardType="number-pad" style={styles.smallInput} placeholderTextColor={UI.textSecondary} />
              <View style={styles.deptFormActions}> 
                <TouchableOpacity onPress={()=>{ setShowDeptForm(false); resetDeptDraft(); }} style={styles.cancelBtn}><Body2 style={styles.cancelText}>Cancel</Body2></TouchableOpacity>
                <TouchableOpacity onPress={saveDepartment} style={styles.saveDeptBtn}><Body2 style={styles.saveDeptText}>{deptDraft.id ? 'Update' : 'Save'}</Body2></TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Preferred Underwriters */}
        <View style={styles.fieldBlock}>
          <Subtitle2 style={styles.label}>Preferred Underwriters</Subtitle2>
          {underwritersLoading && <Body2 style={styles.loadingText}>Loading underwriters...</Body2>}
          {underwritersError && !underwritersLoading && <Body2 style={styles.errorText}>{underwritersError}</Body2>}
          {!underwritersLoading && !underwritersError && (
            <View style={styles.underwriterChips}>
              {underwriters.map(u => (
                <TouchableOpacity key={u.id} onPress={()=>toggleUnderwriter(u.id)} style={[styles.chip, preferredUnderwriters.includes(u.id) && styles.chipSelected]}>
                  <Body2 style={[styles.chipText, preferredUnderwriters.includes(u.id) && styles.chipTextSelected]}>{u.name}</Body2>
                </TouchableOpacity>
              ))}
              {underwriters.length === 0 && <Body2 style={styles.loadingText}>No underwriters available</Body2>}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Submit Bar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity disabled={!canSubmit || submitting} onPress={handleSubmit} style={[styles.submitBtn, (!canSubmit||submitting) && styles.submitBtnDisabled]}>
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
  scroll: { padding: 16 },
  sectionSpacer: { height: SPACING.sm },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stepCircle: { width:32, height:32, borderRadius:16, backgroundColor: BRAND.primary, alignItems:'center', justifyContent:'center', marginRight:12 },
  stepCircleText: { color:'#fff', fontWeight:'600' },
  stepTitle: { color: BRAND.primary },
  fieldBlock: { marginBottom: 28 },
  label: { marginBottom: 8 },
  input: { borderRadius:BORDER_RADIUS.md, backgroundColor:UI.backgroundGray, paddingHorizontal:SPACING.lg, paddingVertical:SPACING.md, fontSize:FONT_SIZES.input, color: UI.textPrimary },
  helper: { color: UI.textSecondary, marginBottom: SPACING.lg },
  departmentRow: { flexDirection:'row', alignItems:'center', padding:12, backgroundColor:'#fafafa', borderRadius:8, marginBottom:10, borderWidth:1, borderColor:'#e4e6e8' },
  departmentInfo: { flex:1 },
  departmentName: { fontWeight:'600' },
  departmentMeta: { marginTop:2, color: UI.textSecondary },
  deptActions: { flexDirection:'row', marginLeft:8 },
  iconBtn: { padding:6 },
  addDepartmentBtn: { borderWidth:1, borderColor:BRAND.primary, borderRadius:BORDER_RADIUS.md, paddingVertical:SPACING.md, alignItems:'center', justifyContent:'center', marginTop:4 },
  addDepartmentText: { color:BRAND.primary, fontWeight:'600' },
  deptForm: { backgroundColor:BRAND.primaryLight, borderWidth:1, borderColor:BRAND.primary, padding:SPACING.md, borderRadius:BORDER_RADIUS.md, marginTop:SPACING.md },
  smallInput: { backgroundColor:'#fff', borderWidth:1, borderColor:'#d1d5db', borderRadius:6, paddingHorizontal:10, paddingVertical:10, marginBottom:10, fontSize:14 },
  deptFormActions: { flexDirection:'row', justifyContent:'flex-end', marginTop:4 },
  cancelBtn: { paddingVertical:8, paddingHorizontal:12, marginRight:8 },
  cancelText: { color: UI.textSecondary },
  saveDeptBtn: { backgroundColor:BRAND.primary, paddingVertical:SPACING.sm, paddingHorizontal:SPACING.lg, borderRadius:BORDER_RADIUS.md },
  saveDeptText: { color:'#fff', fontWeight:'600' },
  inlineLabelRow: { flexDirection:'row', alignItems:'center' },
  inlineIconCircle: { width:36, height:36, borderRadius:18, backgroundColor:BRAND.primary, alignItems:'center', justifyContent:'center', marginRight:SPACING.md },
  selectFileBtn: { marginLeft:'auto', borderWidth:1, borderColor:BRAND.primary, paddingVertical:SPACING.sm, paddingHorizontal:SPACING.lg, borderRadius:BORDER_RADIUS.md },
  selectFileText: { color:BRAND.primary, fontWeight:'600' },
  fileMeta: { marginTop:SPACING.sm, color: UI.textSecondary },
  underwriterChips: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip: { paddingVertical:8, paddingHorizontal:14, backgroundColor:'#f3f4f6', borderRadius:20, marginRight:8, marginBottom:8 },
  chipSelected: { backgroundColor:BRAND.primary },
  chipText: { color: UI.textSecondary },
  chipTextSelected: { color:'#fff', fontWeight:'600' },
  loadingText: { color: UI.textSecondary },
  errorText: { color: SEMANTIC.error },
  footer: { position:'absolute', left:0, right:0, bottom:0, padding:16, backgroundColor:'#fff', borderTopWidth:1, borderColor:'#e5e7eb' },
  submitBtn: { backgroundColor:BRAND.primary, paddingVertical:SPACING.lg, borderRadius:BORDER_RADIUS.lg, alignItems:'center' },
  submitBtnDisabled: { opacity:0.5 },
  submitText: { color:'#fff', fontWeight:'600' },
  // Industry dropdown enhancements
  industryDropdown: { marginTop:12, backgroundColor:'#fff', borderRadius:10, borderWidth:1, borderColor:'#e0e0e0', padding:10, shadowColor:'#000', shadowOpacity:0.08, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:2 },
  industrySearchRow: { flexDirection:'row', alignItems:'center', backgroundColor:'#f5f5f5', borderRadius:6, paddingHorizontal:10, paddingVertical:6, marginBottom:10 },
  industrySearchInput: { flex:1, paddingVertical:SPACING.xs, fontSize:FONT_SIZES.input, color: UI.textPrimary },
  industryRow: { flexDirection:'row', alignItems:'center', paddingVertical:10, paddingHorizontal:6, borderRadius:6 },
  industryRowActive: { backgroundColor: BRAND.primaryLight },
  industryRowText: { color: UI.textPrimary },
  industryRowTextActive: { fontWeight:'600', color: BRAND.primary },
  riskBadge: { paddingVertical:2, paddingHorizontal:8, borderRadius:12, backgroundColor:'#ddd', marginLeft:8 },
  riskBadgeHigh: { backgroundColor:'#fbbf24' },
  riskBadgeVeryHigh: { backgroundColor:'#f87171' },
  riskBadgeMedium: { backgroundColor:'#a3e635' },
  riskBadgeLow: { backgroundColor:'#60a5fa' },
  riskBadgeText: { color:'#222', fontSize:10 },
  noIndustryResults: { textAlign:'center', color: UI.textSecondary, paddingVertical:SPACING.md },
});
