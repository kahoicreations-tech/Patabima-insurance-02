/**
 * Individual Medical Insurance Quotation Screen
 * 2-Step Process: Policy Details → Client Details
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants';
import { BRAND, UI, SEMANTIC, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../../theme';
import { Heading4, Heading6, Body1, Body2, Caption, Text as PBText, ButtonText, Subtitle2 } from '../../../components/typography/Text';
import { SkeletonCard } from '../../../components';
// Removed Enhanced* form components for client details to ensure consistent sizing with policy inputs
// import { ... } from '../../../components/EnhancedFormComponents';
import api from '../../../services/DjangoAPIService';

// Enable LayoutAnimation on Android (only if not using New Architecture)
if (
  Platform.OS === 'android' && 
  UIManager.setLayoutAnimationEnabledExperimental &&
  typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EnhancedIndividualMedicalQuotation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const editingQuoteNumber = route?.params?.quoteNumber || null;

  const [formData, setFormData] = useState({
    inpatientLimit: '',
    outpatientCover: false,
    maternityCover: false,
    age: '',
    spouseAge: '',
    numberOfChildren: '',
    preferredUnderwriters: [],
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    emailAddress: '',
    declaration: false
  });

  const [quoteMeta, setQuoteMeta] = useState({ 
    quote_number: null, 
    product: null, 
    status: null
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // guard against duplicate final submission
  const [fieldErrors, setFieldErrors] = useState({}); // inline validation errors
  const [submitError, setSubmitError] = useState(null); // submission error with retry UI

  // Form completion tracking
  const getFormCompletion = useCallback(() => {
    const requiredFields = [
      'inpatientLimit',
      'age',
      'preferredUnderwriters',
      'fullName',
      'idNumber',
      'phoneNumber',
      'declaration'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field];
      if (field === 'preferredUnderwriters') {
        return Array.isArray(value) && value.length > 0;
      }
      if (field === 'declaration') {
        return value === true;
      }
      return value && String(value).trim() !== '';
    });
    
    return {
      total: requiredFields.length,
      filled: filledFields.length,
      percentage: Math.round((filledFields.length / requiredFields.length) * 100)
    };
  }, [formData]);

  const coverLimitOptions = [
    { id: '500k', name: 'KES 500,000', value: 500000 },
    { id: '1m', name: 'KES 1,000,000', value: 1000000 },
    { id: '2m', name: 'KES 2,000,000', value: 2000000 },
    { id: '3m', name: 'KES 3,000,000', value: 3000000 },
    { id: '5m', name: 'KES 5,000,000', value: 5000000 },
    { id: '10m', name: 'KES 10,000,000', value: 10000000 }
  ];

  // Underwriters fetched dynamically
  const [underwriters, setUnderwriters] = useState([]);
  const [underwritersLoading, setUnderwritersLoading] = useState(false);
  const [underwritersError, setUnderwritersError] = useState(null);

  // Removed early quote creation - will defer until final submit

  // Fetch available underwriters (generic list) on mount & load existing quote if editing
  useEffect(() => {
    let cancelled = false;
    const fetchUnderwriters = async () => {
      setUnderwritersLoading(true);
      setUnderwritersError(null);
      try {
        const providers = await api.getUnderwriters();
        if (!cancelled) {
          const normalized = Array.isArray(providers) ? providers : (providers?.underwriters || []);
          // Normalize shape to { id, name }
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

    // If editing, fetch quote detail & prefill form
    const loadExisting = async () => {
      if (!editingQuoteNumber) return;
      try {
        let detail;
        let isManualQuote = false;
        
        // Try to load as ManualQuote first (new system)
        try {
          detail = await api.getMedicalQuote(editingQuoteNumber);
          isManualQuote = true;
        } catch (err) {
          // If not found as ManualQuote, try generic quote system (legacy)
          detail = await api.getGenericQuote(editingQuoteNumber);
          isManualQuote = false;
        }
        
        if (isManualQuote) {
          // ManualQuote structure: { reference, line_key, payload, status, etc. }
          const formDataRaw = detail?.payload || {};
          setFormData(prev => ({
            ...prev,
            ...['inpatientLimit','outpatientCover','maternityCover','age','spouseAge','numberOfChildren','preferredUnderwriters','fullName','idNumber','phoneNumber','emailAddress','declaration']
              .reduce((acc,k)=>{ if (formDataRaw[k] !== undefined) acc[k]=formDataRaw[k]; return acc; }, {})
          }));
          setQuoteMeta({ quote_number: editingQuoteNumber, product: null, status: detail?.status || null });
        } else {
          // Legacy generic quote structure
          const formDataRaw = detail?.form_data || detail?.formData || detail?.inputs || {};
          setFormData(prev => ({
            ...prev,
            ...['inpatientLimit','outpatientCover','maternityCover','age','spouseAge','numberOfChildren','preferredUnderwriters','fullName','idNumber','phoneNumber','emailAddress','declaration']
              .reduce((acc,k)=>{ if (formDataRaw[k] !== undefined) acc[k]=formDataRaw[k]; return acc; }, {})
          }));
          setQuoteMeta({ quote_number: editingQuoteNumber, product: null, status: detail?.status || null });
        }
      } catch (e) {
        console.warn('[MedicalEdit] Failed to load existing quote', e?.message);
      }
    };
    loadExisting();
    return () => { cancelled = true; };
  }, [editingQuoteNumber]);

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    
    // Real-time validation for specific fields
    setTimeout(() => validateField(field, value), 300);
  }, [fieldErrors]);

  // Validate individual field
  const validateField = useCallback((field, value) => {
    let error = null;
    
    switch (field) {
      case 'age':
        if (!value || value.trim() === '') {
          error = 'Age is required';
        } else if (isNaN(Number(value)) || Number(value) <= 0) {
          error = 'Enter a valid age';
        } else if (Number(value) < 18) {
          error = 'Must be 18 or older';
        } else if (Number(value) > 100) {
          error = 'Please enter a valid age';
        }
        break;
        
      case 'spouseAge':
        if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
          error = 'Spouse age invalid';
        } else if (value && Number(value) < 18) {
          error = 'Spouse must be 18 or older';
        }
        break;
        
      case 'numberOfChildren':
        if (value && (isNaN(Number(value)) || Number(value) < 0)) {
          error = 'Invalid number of children';
        } else if (value && Number(value) > 20) {
          error = 'Please contact us for large families';
        }
        break;
        
      case 'fullName':
        if (!value || value.trim() === '') {
          error = 'Full name is required';
        } else if (value.trim().length < 3) {
          error = 'Name too short';
        }
        break;
        
      case 'idNumber':
        if (!value || value.trim() === '') {
          error = 'ID number is required';
        } else if (value.trim().length < 5) {
          error = 'ID number too short';
        }
        break;
        
      case 'phoneNumber':
        if (!value || value.trim() === '') {
          error = 'Phone number is required';
        } else if (value.length < 9) {
          error = 'Phone number too short';
        }
        break;
        
      case 'emailAddress':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format';
        }
        break;
        
      case 'inpatientLimit':
        if (!value) {
          error = 'Select an inpatient limit';
        }
        break;
        
      case 'preferredUnderwriters':
        if (!value || (Array.isArray(value) && value.length === 0)) {
          error = 'Select at least one underwriter';
        }
        break;
    }
    
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
    
    return !error;
  }, []);

  // Validate policy details (step 1)
  const validateStepOne = useCallback(() => {
    const errors = {};
    if (!formData.inpatientLimit) errors.inpatientLimit = 'Select an inpatient limit';
    if (!formData.age) errors.age = 'Age is required';
    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) <= 0)) errors.age = 'Enter a valid age';
    if (formData.spouseAge && (isNaN(Number(formData.spouseAge)) || Number(formData.spouseAge) <= 0)) errors.spouseAge = 'Spouse age invalid';
    if (formData.numberOfChildren && (isNaN(Number(formData.numberOfChildren)) || Number(formData.numberOfChildren) < 0)) errors.numberOfChildren = 'Children count invalid';
    return { valid: Object.keys(errors).length === 0, errors };
  }, [formData]);

  const nextStep = async () => {
    if (currentStep < totalSteps) {
      if (currentStep === 1) {
        const { valid, errors } = validateStepOne();
        if (!valid) {
          // Simple summarised alert for now; can be enhanced to inline errors
          const msg = Object.values(errors).join('\n');
          Alert.alert('Missing / Invalid Fields', msg);
          return;
        }
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleFinalSubmit = async () => {
    if (!formData.declaration) {
      Alert.alert('Declaration Required', 'Please accept the declaration');
      return;
    }
    if (submitting) return; // duplicate tap guard
    
    setSubmitError(null); // Clear previous errors
    setSubmitting(true);
    setLoading(true);
    
    try {
      let result;
      if (editingQuoteNumber) {
        // For editing - check if it's already a ManualQuote by trying to fetch it
        try {
          result = await api.getMedicalQuote(editingQuoteNumber);
          // If successful, it's a manual quote - update would need different logic
          Alert.alert('Edit Not Supported', 'Manual quotes cannot be edited after submission. Please create a new quote.');
          return;
        } catch (err) {
          // If error, might be a legacy quote - fall back to old system
          let quoteNumberToUse = editingQuoteNumber;
          await api.updateGenericQuoteInputs(quoteNumberToUse, formData);
          const goToQuotations = () => {
            const params = { forceRefresh: true, focusId: quoteNumberToUse, justSubmitted: true, message: 'Medical quote updated' };
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
          Alert.alert('Updated', 'Medical quote updated.', [
            { text: 'OK', onPress: goToQuotations }
          ]);
          return;
        }
      } else {
        // Create new ManualQuote
        result = await api.createMedicalQuote(formData);
      }
      
      const reference = result.reference;
      
      // Navigate to Quotations tab with success message
      Alert.alert(
        'Quote Submitted Successfully',
        `Quote Reference: ${reference}\n\nYour medical insurance quote has been submitted. You will receive pricing within 2 hours.`,
        [
          {
            text: 'View Quotes',
            onPress: () => {
              try {
                navigation.navigate('MainTabs', { 
                  screen: 'Quotations',
                  params: { 
                    forceRefresh: true, 
                    focusId: reference,
                    justSubmitted: true,
                    message: 'Medical quote submitted successfully'
                  }
                });
              } catch (e) {
                // Fallback navigation
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
      
    } catch (error) {
      console.error('Final submit error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit quote. Please try again.';
      setSubmitError(errorMessage);
      // Don't show Alert - error will be displayed in UI with retry button
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const renderPolicyDetails = () => (
    <View style={styles.stepContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Inpatient Limit <Text style={styles.required}>*</Text>
        </Text>
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
        {fieldErrors.inpatientLimit && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{fieldErrors.inpatientLimit}</Caption>
          </View>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Additional Benefits</Text>
        <TouchableOpacity style={styles.checkboxRow} onPress={() => updateFormData('outpatientCover', !formData.outpatientCover)}>
          <View style={[styles.checkbox, formData.outpatientCover && styles.checkboxSelected]}>
            {formData.outpatientCover && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Body2 style={styles.checkboxLabel}>Outpatient Cover</Body2>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkboxRow} onPress={() => updateFormData('maternityCover', !formData.maternityCover)}>
          <View style={[styles.checkbox, formData.maternityCover && styles.checkboxSelected]}>
            {formData.maternityCover && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Body2 style={styles.checkboxLabel}>Maternity Cover</Body2>
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Principal Member Age <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          value={formData.age}
          onChangeText={(text) => updateFormData('age', text.replace(/\D/g, ''))}
          placeholder="Enter age"
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="next"
          maxLength={3}
          style={[styles.input, fieldErrors.age && styles.inputError]}
        />
        {fieldErrors.age && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{fieldErrors.age}</Caption>
          </View>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Spouse Age</Text>
        <TextInput
          value={formData.spouseAge}
          onChangeText={(text) => updateFormData('spouseAge', text.replace(/\D/g, ''))}
          placeholder="Enter spouse age"
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="next"
          maxLength={3}
          style={[styles.input, fieldErrors.spouseAge && styles.inputError]}
        />
        {fieldErrors.spouseAge && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{fieldErrors.spouseAge}</Caption>
          </View>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Number of Children</Text>
        <TextInput
          value={formData.numberOfChildren}
          onChangeText={(text) => updateFormData('numberOfChildren', text.replace(/\D/g, ''))}
          placeholder="Enter number of children"
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="next"
          maxLength={2}
          style={[styles.input, fieldErrors.numberOfChildren && styles.inputError]}
        />
        {fieldErrors.numberOfChildren && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{fieldErrors.numberOfChildren}</Caption>
          </View>
        )}
      </View>      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Preferred Underwriters <Text style={styles.required}>*</Text>
        </Text>
        {underwritersLoading && (
          <View>
            <SkeletonCard height={48} borderRadius={20} style={{ marginBottom: 8 }} />
            <SkeletonCard height={48} borderRadius={20} style={{ marginBottom: 8 }} />
            <SkeletonCard height={48} borderRadius={20} />
          </View>
        )}
        {underwritersError && !underwritersLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{underwritersError}</Caption>
          </View>
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
        {fieldErrors.preferredUnderwriters && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{fieldErrors.preferredUnderwriters}</Caption>
          </View>
        )}
      </View>
    </View>
  );

  const renderClientDetails = () => (
    <View style={styles.stepContainer}>
      {/* Full Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Full Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          value={formData.fullName}
          onChangeText={(text) => updateFormData('fullName', text)}
          placeholder="Enter full name"
          style={[styles.input, fieldErrors.fullName && styles.inputError]}
          autoCapitalize="words"
          returnKeyType="next"
          textContentType="name"
        />
        {fieldErrors.fullName && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{fieldErrors.fullName}</Caption>
          </View>
        )}
      </View>

      {/* ID Number */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          ID Number <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          value={formData.idNumber}
          onChangeText={(text) => updateFormData('idNumber', text.replace(/\D/g, ''))}
          placeholder="Enter ID number"
          style={[styles.input, fieldErrors.idNumber && styles.inputError]}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={12}
          returnKeyType="next"
          textContentType="none"
        />
        {fieldErrors.idNumber && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{fieldErrors.idNumber}</Caption>
          </View>
        )}
      </View>

      {/* Phone Number */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Phone Number <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData('phoneNumber', text.replace(/\D/g, ''))}
          placeholder="Enter phone number"
          style={[styles.input, fieldErrors.phoneNumber && styles.inputError]}
          keyboardType="phone-pad"
          inputMode="tel"
          maxLength={12}
          returnKeyType="next"
          textContentType="telephoneNumber"
        />
        {fieldErrors.phoneNumber && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{fieldErrors.phoneNumber}</Caption>
          </View>
        )}
      </View>

      {/* Email Address */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          value={formData.emailAddress}
          onChangeText={(text) => updateFormData('emailAddress', text)}
          placeholder="Enter email address"
          style={[styles.input, fieldErrors.emailAddress && styles.inputError]}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="done"
          textContentType="emailAddress"
          autoCorrect={false}
        />
        {fieldErrors.emailAddress && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error || '#dc3545'} />
            <Caption style={styles.errorText}>{fieldErrors.emailAddress}</Caption>
          </View>
        )}
      </View>

      {/* Declaration */}
      <TouchableOpacity style={styles.declarationContainer} onPress={() => updateFormData('declaration', !formData.declaration)}>
        <View style={[styles.checkbox, formData.declaration && styles.checkboxSelected]}>
          {formData.declaration && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Caption style={styles.declarationText}>I confirm that all information is accurate</Caption>
      </TouchableOpacity>
    </View>
  );

  const isValid = () => {
    const hasInpatient = !!formData.inpatientLimit;
    const hasAge = !!formData.age && !isNaN(Number(formData.age)) && Number(formData.age) > 0;
    const hasClient = !!formData.fullName && !!formData.idNumber && !!formData.phoneNumber && !!formData.emailAddress;
    return hasInpatient && hasAge && hasClient && !!formData.declaration;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />
      {/* Red Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Heading4 style={styles.headerTitle}>Individual Medical Insurance</Heading4>
        <View style={{ width: 40 }} />
      </View>

      {/* Form Completion Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Caption style={styles.progressLabel}>Form Completion</Caption>
          <Caption style={styles.progressValue}>
            {getFormCompletion().filled}/{getFormCompletion().total} Required Fields
          </Caption>
        </View>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${getFormCompletion().percentage}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        {renderPolicyDetails()}
        {renderClientDetails()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        {submitError && (
          <View style={styles.submitErrorContainer}>
            <View style={styles.submitErrorHeader}>
              <Ionicons name="alert-circle" size={20} color={Colors.error || '#dc3545'} />
              <Body2 style={styles.submitErrorText}>{submitError}</Body2>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleFinalSubmit}
              disabled={submitting}
            >
              <Ionicons name="refresh" size={16} color={Colors.primary} />
              <ButtonText style={styles.retryButtonText}>Retry Submission</ButtonText>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity
          disabled={!isValid() || loading || submitting}
          onPress={handleFinalSubmit}
          style={[styles.submitBtn, (!isValid() || loading || submitting) && styles.submitBtnDisabled]}
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
    color: '#fff', // use Heading4 default sizing/weight
    flex: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  progressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    color: UI.textSecondary,
    fontWeight: '500',
  },
  progressValue: {
    color: BRAND.primary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND.primary,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  stepContainer: { paddingTop: 20 },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16, // unified vertical spacing
  },
  label: {
    color: '#000',
    marginBottom: 8,
  },
  required: {
    color: '#D5222B',
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkboxLabel: {
    color: '#333',
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
  submitErrorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error || '#dc3545',
  },
  submitErrorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  submitErrorText: {
    flex: 1,
    color: '#b00020',
    marginLeft: SPACING.sm,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: SPACING.xs,
  },
  retryButtonText: {
    color: Colors.primary,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#D5222B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff' },
  pricingCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#D5222B',
  },
  pricingTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  pricingAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D5222B',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: Colors.error || '#dc3545',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  errorText: {
    color: Colors.error || '#dc3545',
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.caption,
  },
});

export default EnhancedIndividualMedicalQuotation;
