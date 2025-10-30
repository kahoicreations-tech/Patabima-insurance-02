import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Image,
  Platform,
  Dimensions,
  FlatList,
  Modal,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants';
import { SafeScreen, EnhancedCard, StatusBadge, CompactCurvedHeader } from '../../components';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import DjangoAPIService from '../../services/DjangoAPIService';
import { useAppData } from '../../contexts/AppDataContext';

const { width } = Dimensions.get('window');

export default function ClaimsSubmissionScreen({ navigation, route }) {
  // Get motor policies from context (same as UpcomingScreen)
  const { motorPolicies, fetchMotorPolicies } = useAppData();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Policy Information
    policyNumber: '',
    policyType: '',
    policyHolderName: '',
    
    // Step 2: Incident Details
    incidentDate: '',
    incidentTime: '',
    incidentLocation: '',
    incidentDescription: '',
    
    // Step 3: Claim Details
    claimType: '',
    claimAmount: '',
    claimDescription: '',
    
    // Step 4: Supporting Documents
    documents: [],
    
    // Step 5: Declaration
    declarationAccepted: false,
    contactPreference: 'phone',
    additionalComments: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showClaimTypeModal, setShowClaimTypeModal] = useState(false);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [headerHeight, setHeaderHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const totalSteps = 5;

  // Filter ACTIVE policies from context for claims dropdown
  const activePolicies = useCallback(() => {
    const active = (motorPolicies || []).filter(p => 
      (p.status || '').toUpperCase() === 'ACTIVE'
    );
    
    console.log(`[ClaimsSubmission] Total motor policies: ${motorPolicies?.length || 0}`);
    console.log(`[ClaimsSubmission] ACTIVE policies: ${active.length}`);
    
    // Map to dropdown UI shape with ENHANCED details
    return active.map((p, idx) => {
      const vehicle = p.vehicle_details || {};
      const client = p.client_details || {};
      const product = p.product_details || {};
      const premium = p.premium_breakdown || {};
      
      // Debug: Log the structure to help diagnose missing holder name
      if (idx === 0) {
        console.log('[ClaimsSubmission] Sample policy structure:', {
          policy_number: p.policy_number,
          client_details: p.client_details,
          holder_name: p.holder_name,
          client_name: p.client_name,
          owner_name: p.owner_name,
          product_details_client: product.client_name,
        });
      }
      
      // Calculate days until expiry for urgency indicator
      const expiryDate = p.cover_end_date || p.expiry_date;
      let daysUntilExpiry = null;
      if (expiryDate) {
        const expiry = new Date(expiryDate);
        const today = new Date();
        daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      }
      
      // Derive a robust holder name from multiple possible shapes
      const holderName = [
        client.fullName,
        client.full_name,
        client.name,
        (client.first_name && client.last_name) ? `${client.first_name} ${client.last_name}` : null,
        client.owner_name,
        p.holder_name,
        p.client_name,
        p.owner_name,
        product.client_name,
      ].find(Boolean) || '—';

      return {
        id: p.id || idx,
        policyNumber: p.policy_number || p.policyNumber || '—',
        type: p.product || product.name || 'Motor Vehicle',
        coverType: product.coverageType || product.coverage_type || '—',
        subcategory: product.subcategory || '—',
        holderName,
        holderPhone: client.phone || client.phone_number || client.mobile || p.phone || '—',
        holderEmail: client.email || client.email_address || p.email || '—',
        vehicleReg: vehicle.registration || vehicle.registration_number || vehicle.reg_number || p.vehicle_reg || '—',
        vehicleMake: vehicle.make || vehicle.vehicle_make || '—',
        vehicleModel: vehicle.model || vehicle.vehicle_model || '—',
        vehicleYear: vehicle.year || vehicle.manufacture_year || '—',
        status: p.status,
        expiryDate: expiryDate,
        coverStartDate: p.cover_start_date,
        daysUntilExpiry: daysUntilExpiry,
        premiumAmount: premium.totalAmount || premium.total_amount || 0,
        underwriter: p.underwriter_details?.name || p.underwriter_details?.company_name || 'N/A',
        isExtendible: p.isExtendible || p.is_extendible || false,
      };
    });
  }, [motorPolicies]);

  // Fetch policies on mount
  useEffect(() => {
    console.log('[ClaimsSubmission] Component mounted, fetching motor policies...');
    fetchMotorPolicies();
  }, [fetchMotorPolicies]);

  const claimTypes = [
    {
      id: 1,
      type: 'Motor Vehicle',
      categories: [
        'Accident/Collision',
        'Theft',
        'Vandalism',
        'Fire/Explosion',
        'Natural Disaster',
        'Windscreen Damage',
        'Third Party Claims'
      ]
    },
    {
      id: 2,
      type: 'Medical',
      categories: [
        'Hospitalization',
        'Outpatient Treatment',
        'Emergency Care',
        'Prescription Medication',
        'Specialist Consultation',
        'Diagnostic Tests',
        'Maternity Care'
      ]
    },
    {
      id: 3,
      type: 'WIBA',
      categories: [
        'Work-related Injury',
        'Occupational Disease',
        'Permanent Disability',
        'Temporary Disability',
        'Death Benefit',
        'Medical Expenses',
        'Loss of Earnings'
      ]
    }
  ];

  const documentTypes = [
    'Police Report',
    'Medical Report',
    'Repair Estimate',
    'Photos of Damage',
    'Witness Statement',
    'Insurance Certificate',
    'Driving License',
    'Vehicle Registration',
    'Other Documents'
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.policyNumber) newErrors.policyNumber = 'Policy number is required';
        if (!formData.policyType) newErrors.policyType = 'Policy type is required';
        if (!formData.policyHolderName) newErrors.policyHolderName = 'Policy holder name is required';
        break;
      
      case 2:
        if (!formData.incidentDate) newErrors.incidentDate = 'Incident date is required';
        if (!formData.incidentTime) newErrors.incidentTime = 'Incident time is required';
        if (!formData.incidentLocation) newErrors.incidentLocation = 'Incident location is required';
        if (!formData.incidentDescription) newErrors.incidentDescription = 'Incident description is required';
        break;
      
      case 3:
        if (!formData.claimType) newErrors.claimType = 'Claim type is required';
        if (!formData.claimAmount) newErrors.claimAmount = 'Claim amount is required';
        if (!formData.claimDescription) newErrors.claimDescription = 'Claim description is required';
        break;
      
      case 4:
        if (formData.documents.length === 0) newErrors.documents = 'At least one document is required';
        break;
      
      case 5:
        if (!formData.declarationAccepted) newErrors.declarationAccepted = 'Declaration must be accepted';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatTime = (dateObj) => {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  };

  const openDatePicker = () => {
    const existing = formData.incidentDate;
    const base = existing && existing.includes('/')
      ? (() => {
          const [dd, mm, yyyy] = existing.split('/');
          const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        })()
      : new Date();
    setPickerDate(base);
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    const existing = formData.incidentTime;
    const now = new Date();
    if (existing && existing.includes(':')) {
      const [hh, mm] = existing.split(':');
      now.setHours(Number(hh) || 0);
      now.setMinutes(Number(mm) || 0);
    }
    setPickerDate(now);
    setShowTimePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event?.type === 'dismissed') return;
    const d = selectedDate || pickerDate;
    updateFormData('incidentDate', formatDate(d));
  };

  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event?.type === 'dismissed') return;
    const t = selectedTime || pickerDate;
    updateFormData('incidentTime', formatTime(t));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Build ISO datetime from separate inputs
      const [dd, mm, yyyy] = (formData.incidentDate || '').split('/');
      const [hh, min] = (formData.incidentTime || '00:00').split(':');
      const dt = new Date(Number(yyyy)||new Date().getFullYear(), (Number(mm)||1)-1, Number(dd)||1, Number(hh)||0, Number(min)||0, 0, 0);

      const payload = {
        policy_number: formData.policyNumber,
        product: 'MOTOR',
        loss_date: dt.toISOString(),
        loss_location: formData.incidentLocation,
        loss_description: formData.incidentDescription,
        documents: formData.documents.map(d => ({
          doc_type: d.doc_type || d.type,
          s3_key: d.s3_key || d.key,
          file_name: d.file_name || d.name,
          file_size: d.file_size || 0,
          content_type: d.content_type || 'application/octet-stream',
        })),
      };

      const api = new DjangoAPIService();
      await api.initialize?.();
      const resp = await api.submitClaim(payload);
      if (resp?.success || resp?.claim) {
        Alert.alert('Claim Submitted Successfully', 'Your claim has been submitted and will be reviewed shortly.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (error) {
      console.log('Submit claim error:', error?.message || error);
      Alert.alert('Error', 'Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: null
      }));
    }
  };

  const selectPolicy = (policy) => {
    updateFormData('policyNumber', policy.policyNumber);
    updateFormData('policyType', policy.type);
    updateFormData('policyHolderName', policy.holderName);
    setShowPolicyModal(false);
  };

  const selectClaimType = (claimType) => {
    updateFormData('claimType', claimType);
    setShowClaimTypeModal(false);
  };

  const addDocument = async (docType) => {
    try {
      // Dismiss keyboard before opening picker for better UX
      try { Keyboard.dismiss(); } catch {}
      
      const res = await DocumentPicker.getDocumentAsync({ 
        copyToCacheDirectory: true, 
        multiple: false, 
        type: '*/*' 
      });
      
      if (res.canceled) return;
      
      const file = res.assets?.[0] || res;
      const fileName = file.name || `document_${Date.now()}`;
      const contentType = file.mimeType || 'application/octet-stream';
      const fileSize = file.size || 0;
      const uri = file.uri;

      console.log('[ClaimsSubmission] Uploading document:', { 
        fileName, 
        contentType, 
        fileSize, 
        uri: uri.substring(0, 50) + '...' 
      });

      // Get presigned URL from backend
      const api = new DjangoAPIService();
      await api.initialize?.();
      
      console.log('[ClaimsSubmission] Requesting presign for:', { fileName, contentType, docType });
      
      let presign;
      try {
        presign = await api.presignClaimDocument({ fileName, contentType, docType });
        console.log('[ClaimsSubmission] Presign response:', JSON.stringify(presign, null, 2));
      } catch (presignError) {
        console.error('[ClaimsSubmission] Presign request failed:', {
          message: presignError?.message,
          status: presignError?.status,
          response: presignError?.response,
          stack: presignError?.stack?.substring(0, 300)
        });
        throw new Error(`Failed to get upload URL from server: ${presignError?.message || 'Unknown error'}`);
      }

      // Normalize common presign response shapes
      const uploadUrl = presign?.url || presign?.uploadURL || presign?.uploadUrl || presign?.upload_url || presign?.signedUrl || presign?.signed_url;
      const formFields = presign?.fields || presign?.form || presign?.formData || presign?.form_fields;
      const objectKey = presign?.key || formFields?.key || presign?.objectKey || presign?.object_key;
      const isMock = presign?.mock === true;

      if (!uploadUrl) {
        console.error('[ClaimsSubmission] No upload URL in presign response:', presign);
        throw new Error('Presign response missing upload URL');
      }

      console.log('[ClaimsSubmission] Upload URL:', uploadUrl.substring(0, 100) + '...');
      console.log('[ClaimsSubmission] Form fields:', formFields ? Object.keys(formFields) : 'none');
      console.log('[ClaimsSubmission] Is mock mode:', isMock);

      // Upload file using React Native fetch with FormData
      let uploadSuccess = false;
      
      // If mock mode, skip actual upload
      if (isMock) {
        console.log('[ClaimsSubmission] MOCK MODE: Skipping actual upload');
        uploadSuccess = true;
      } else if (formFields && Object.keys(formFields).length > 0) {
        // S3 presigned POST with form fields
        console.log('[ClaimsSubmission] Using multipart POST upload...');
        const formData = new FormData();
        
        // Append all S3 policy fields first (order matters for S3)
        Object.entries(formFields).forEach(([key, value]) => {
          console.log(`[ClaimsSubmission] Appending field "${key}":`, String(value).substring(0, 50));
          formData.append(key, String(value));
        });
        
        // Append file last (MUST be last for S3 presigned POST)
        formData.append('file', {
          uri: uri,
          name: fileName,
          type: contentType
        });

        const uploadResp = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json, text/plain, */*',
          }
        });
        
        const status = uploadResp.status;
        console.log('[ClaimsSubmission] POST upload status:', status);
        
        if (status >= 200 && status < 300) {
          uploadSuccess = true;
        } else {
          const errorText = await uploadResp.text().catch(() => '');
          console.error('[ClaimsSubmission] POST upload failed:', {
            status,
            error: errorText.substring(0, 500)
          });
          throw new Error(`Upload failed with status ${status}: ${errorText.substring(0, 200)}`);
        }
      } else {
        // Signed PUT URL (binary content) using FileSystem.uploadAsync to avoid Blob constructor issues
        console.log('[ClaimsSubmission] Using PUT upload via FileSystem.uploadAsync...');
        
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
          httpMethod: 'PUT',
          headers: { 'Content-Type': contentType },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });
        
        const status = uploadResult?.status || 0;
        console.log('[ClaimsSubmission] PUT upload status:', status);
        
        if (status >= 200 && status < 300) {
          uploadSuccess = true;
        } else {
          const errorText = uploadResult?.body || '';
          console.error('[ClaimsSubmission] PUT upload failed:', {
            status,
            error: String(errorText).substring(0, 500)
          });
          throw new Error(`Upload failed with status ${status}: ${String(errorText).substring(0, 200)}`);
        }
      }

      if (!uploadSuccess) {
        throw new Error('Upload did not complete successfully');
      }

      console.log('[ClaimsSubmission] Upload successful! Creating document record...');

      // Add document to form state
      const newDoc = {
        id: Date.now(),
        doc_type: docType,
        s3_key: objectKey || fileName,
        file_name: fileName,
        file_size: fileSize,
        content_type: contentType,
      };
      
      console.log('[ClaimsSubmission] Adding document to form:', newDoc);
      updateFormData('documents', [...formData.documents, newDoc]);
      
      Alert.alert('Success', 'Document uploaded successfully!');
      
    } catch (e) {
      console.error('[ClaimsSubmission] Document upload error:', {
        message: e?.message,
        stack: e?.stack?.substring(0, 500)
      });
      Alert.alert(
        'Upload Error', 
        `Could not upload document: ${e?.message || 'Unknown error'}. Please check console for details.`
      );
    }
  };

  const removeDocument = (docId) => {
    updateFormData('documents', formData.documents.filter(doc => doc.id !== docId));
  };

  const renderPolicyModal = () => (
    <Modal
      visible={showPolicyModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowPolicyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Policy</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowPolicyModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
          >
            {isLoadingPolicies ? (
              <Text style={{ padding: 12, color: Colors.textSecondary }}>Loading policies...</Text>
            ) : activePolicies().length === 0 ? (
              <View style={{ padding: 12 }}>
                <Text style={{ color: Colors.textSecondary, marginBottom: 8 }}>
                  No ACTIVE policies found.
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                  Create a Third Party policy in Motor 2 to submit claims.
                </Text>
              </View>
            ) : (
              activePolicies().map((policy) => {
                // Calculate urgency badge color based on days until expiry
                const isExpiringSoon = policy.daysUntilExpiry !== null && policy.daysUntilExpiry <= 30;
                const isUrgent = policy.daysUntilExpiry !== null && policy.daysUntilExpiry <= 7;
                
                return (
                  <TouchableOpacity 
                    key={policy.id}
                    style={[
                      styles.policyOption,
                      isUrgent && { borderLeftWidth: 3, borderLeftColor: Colors.error }
                    ]}
                    onPress={() => selectPolicy(policy)}
                  >
                    {/* Header with Policy Number and Status */}
                    <View style={styles.policyOptionHeader}>
                      <Text style={styles.policyOptionNumber}>{policy.policyNumber}</Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <StatusBadge status={policy.status} size="small" />
                        {isExpiringSoon && (
                          <View style={[styles.expiryBadge, isUrgent && styles.expiryBadgeUrgent]}>
                            <Text style={styles.expiryBadgeText}>
                              {isUrgent ? '⚠️ Expiring Soon' : '📅 Renewal Due'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    {/* Cover Type */}
                    <Text style={styles.policyOptionType}>
                      {policy.type} {policy.coverType && `(${policy.coverType})`}
                    </Text>
                    
                    {/* Vehicle Details */}
                    <View style={styles.policyDetailRow}>
                      <Ionicons name="car-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.policyDetailLabel}>Vehicle:</Text>
                      <Text style={styles.policyDetailValue}>
                        {policy.vehicleReg} • {policy.vehicleMake} {policy.vehicleModel} ({policy.vehicleYear})
                      </Text>
                    </View>
                    
                    {/* Policy Holder */}
                    <View style={styles.policyDetailRow}>
                      <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.policyDetailLabel}>Holder:</Text>
                      <Text style={styles.policyDetailValue}>{policy.holderName}</Text>
                    </View>
                    
                    {/* Contact Info */}
                    {policy.holderPhone && policy.holderPhone !== '—' && (
                      <View style={styles.policyDetailRow}>
                        <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.policyDetailLabel}>Phone:</Text>
                        <Text style={styles.policyDetailValue}>{policy.holderPhone}</Text>
                      </View>
                    )}
                    
                    {/* Coverage Period */}
                    <View style={styles.policyDetailRow}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.policyDetailLabel}>Coverage:</Text>
                      <Text style={[
                        styles.policyDetailValue,
                        isExpiringSoon && { color: isUrgent ? Colors.error : Colors.warning }
                      ]}>
                        {policy.coverStartDate && new Date(policy.coverStartDate).toLocaleDateString()} → {' '}
                        {policy.expiryDate && new Date(policy.expiryDate).toLocaleDateString()}
                        {policy.daysUntilExpiry !== null && ` (${policy.daysUntilExpiry} days left)`}
                      </Text>
                    </View>
                    
                    {/* Premium & Underwriter */}
                    <View style={styles.policyDetailRow}>
                      <Ionicons name="cash-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.policyDetailLabel}>Premium:</Text>
                      <Text style={styles.policyDetailValue}>
                        KES {Number(policy.premiumAmount || 0).toLocaleString()} • {policy.underwriter}
                      </Text>
                    </View>
                    
                    {/* Extendible Badge */}
                    {policy.isExtendible && (
                      <View style={styles.extendibleBadge}>
                        <Ionicons name="flash-outline" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.extendibleBadgeText}>Extendible Payment Plan</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            step <= currentStep && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepNumber,
              step <= currentStep && styles.stepNumberActive
            ]}>
              {step < currentStep ? '✓' : step}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            step <= currentStep && styles.stepLabelActive
          ]}>
            {step === 1 && 'Policy'}
            {step === 2 && 'Incident'}
            {step === 3 && 'Claim'}
            {step === 4 && 'Documents'}
            {step === 5 && 'Review'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Policy Information</Text>
      <Text style={styles.stepDescription}>Select your policy and verify details</Text>
      
      <TouchableOpacity 
        style={styles.policySelector}
        onPress={() => setShowPolicyModal(true)}
      >
        <Text style={styles.policySelectorLabel}>Select Policy</Text>
        <Text style={styles.policySelectorValue}>
          {formData.policyNumber || 'Tap to select policy'}
        </Text>
        <Text style={styles.policySelectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.policyNumber && <Text style={styles.errorText}>{errors.policyNumber}</Text>}
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Policy Type</Text>
        <TextInput
          style={[styles.input, errors.policyType && styles.inputError]}
          value={formData.policyType}
          editable={false}
          placeholder="Will be filled automatically"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          blurOnSubmit={false}
        />
        {errors.policyType && <Text style={styles.errorText}>{errors.policyType}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Policy Holder Name</Text>
        <TextInput
          style={[styles.input, errors.policyHolderName && styles.inputError]}
          value={formData.policyHolderName}
          editable={false}
          placeholder="Will be filled automatically"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.policyHolderName && <Text style={styles.errorText}>{errors.policyHolderName}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Incident Details</Text>
      <Text style={styles.stepDescription}>When and where did the incident occur?</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Date of Incident *</Text>
        <TouchableOpacity onPress={openDatePicker} activeOpacity={0.8}>
          <View style={[styles.input, styles.inputWithIcon, errors.incidentDate && styles.inputError]}> 
            <Text style={formData.incidentDate ? styles.inputValue : styles.placeholderText}>
              {formData.incidentDate || 'DD/MM/YYYY'}
            </Text>
            <Text style={styles.suffixIcon}>📅</Text>
          </View>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
        {errors.incidentDate && <Text style={styles.errorText}>{errors.incidentDate}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Time of Incident *</Text>
        <TouchableOpacity onPress={openTimePicker} activeOpacity={0.8}>
          <View style={[styles.input, styles.inputWithIcon, errors.incidentTime && styles.inputError]}>
            <Text style={formData.incidentTime ? styles.inputValue : styles.placeholderText}>
              {formData.incidentTime || 'HH:MM'}
            </Text>
            <Text style={styles.suffixIcon}>⏰</Text>
          </View>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={pickerDate}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}
        {errors.incidentTime && <Text style={styles.errorText}>{errors.incidentTime}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Location of Incident *</Text>
        <TextInput
          style={[styles.input, errors.incidentLocation && styles.inputError]}
          value={formData.incidentLocation}
          onChangeText={(text) => updateFormData('incidentLocation', text)}
          placeholder="Address or location details"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          blurOnSubmit={false}
        />
        {errors.incidentLocation && <Text style={styles.errorText}>{errors.incidentLocation}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Description of Incident *</Text>
        <TextInput
          style={[styles.textArea, errors.incidentDescription && styles.inputError]}
          value={formData.incidentDescription}
          onChangeText={(text) => updateFormData('incidentDescription', text)}
          placeholder="Describe what happened in detail..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
          blurOnSubmit={false}
        />
        {errors.incidentDescription && <Text style={styles.errorText}>{errors.incidentDescription}</Text>}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Claim Details</Text>
      <Text style={styles.stepDescription}>What type of claim are you making?</Text>
      
      <TouchableOpacity 
        style={styles.claimTypeSelector}
        onPress={() => setShowClaimTypeModal(true)}
      >
        <Text style={styles.claimTypeSelectorLabel}>Claim Type</Text>
        <Text style={styles.claimTypeSelectorValue}>
          {formData.claimType || 'Select claim type'}
        </Text>
        <Text style={styles.claimTypeSelectorIcon}>▼</Text>
      </TouchableOpacity>
      {errors.claimType && <Text style={styles.errorText}>{errors.claimType}</Text>}
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Estimated Claim Amount (KES) *</Text>
        <TextInput
          style={[styles.input, errors.claimAmount && styles.inputError]}
          value={formData.claimAmount}
          onChangeText={(text) => {
            // Allow only digits
            const cleaned = text.replace(/[^0-9]/g, '');
            updateFormData('claimAmount', cleaned);
          }}
          placeholder="0.00"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="number-pad"
          returnKeyType="next"
          blurOnSubmit={false}
        />
        {errors.claimAmount && <Text style={styles.errorText}>{errors.claimAmount}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Detailed Description *</Text>
        <TextInput
          style={[styles.textArea, errors.claimDescription && styles.inputError]}
          value={formData.claimDescription}
          onChangeText={(text) => updateFormData('claimDescription', text)}
          placeholder="Provide detailed description of the claim..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
          blurOnSubmit={false}
        />
        {errors.claimDescription && <Text style={styles.errorText}>{errors.claimDescription}</Text>}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Supporting Documents</Text>
      <Text style={styles.stepDescription}>Upload documents to support your claim</Text>
      
      <View style={styles.documentsContainer}>
        <Text style={styles.documentsLabel}>Add Documents</Text>
        
        <View style={styles.documentTypeGrid}>
          {documentTypes.map((docType) => (
            <TouchableOpacity
              key={docType}
              style={styles.documentTypeButton}
              onPress={() => addDocument(docType)}
            >
              <Text style={styles.documentTypeText}>{docType}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {formData.documents.length > 0 && (
          <View style={styles.uploadedDocuments}>
            <Text style={styles.uploadedDocumentsTitle}>Uploaded Documents</Text>
            {formData.documents.map((doc) => (
              <View key={doc.id} style={styles.documentItem}>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.file_name || doc.name || doc.doc_type}</Text>
                  <Text style={styles.documentSize}>{doc.file_size ? `${(doc.file_size/1024/1024).toFixed(2)} MB` : ''}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeDocumentButton}
                  onPress={() => removeDocument(doc.id)}
                >
                  <Text style={styles.removeDocumentText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
        {errors.documents && <Text style={styles.errorText}>{errors.documents}</Text>}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>Please review your claim details before submitting</Text>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Policy Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Policy Number:</Text>
          <Text style={styles.reviewValue}>{formData.policyNumber}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Policy Type:</Text>
          <Text style={styles.reviewValue}>{formData.policyType}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Policy Holder:</Text>
          <Text style={styles.reviewValue}>{formData.policyHolderName}</Text>
        </View>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Incident Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Date:</Text>
          <Text style={styles.reviewValue}>{formData.incidentDate}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Time:</Text>
          <Text style={styles.reviewValue}>{formData.incidentTime}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Location:</Text>
          <Text style={styles.reviewValue}>{formData.incidentLocation}</Text>
        </View>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Claim Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Claim Type:</Text>
          <Text style={styles.reviewValue}>{formData.claimType}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Amount:</Text>
          <Text style={styles.reviewValue}>KES {formData.claimAmount}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Documents:</Text>
          <Text style={styles.reviewValue}>{formData.documents.length} files</Text>
        </View>
      </View>
      
      <View style={styles.contactPreference}>
        <Text style={styles.contactLabel}>Preferred Contact Method</Text>
        <View style={styles.contactOptions}>
          <TouchableOpacity
            style={[
              styles.contactOption,
              formData.contactPreference === 'phone' && styles.contactOptionActive
            ]}
            onPress={() => updateFormData('contactPreference', 'phone')}
          >
            <Text style={[
              styles.contactOptionText,
              formData.contactPreference === 'phone' && styles.contactOptionTextActive
            ]}>Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.contactOption,
              formData.contactPreference === 'email' && styles.contactOptionActive
            ]}
            onPress={() => updateFormData('contactPreference', 'email')}
          >
            <Text style={[
              styles.contactOptionText,
              formData.contactPreference === 'email' && styles.contactOptionTextActive
            ]}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Additional Comments (Optional)</Text>
        <TextInput
          style={styles.textArea}
          value={formData.additionalComments}
          onChangeText={(text) => updateFormData('additionalComments', text)}
          placeholder="Any additional information..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
          blurOnSubmit={false}
        />
      </View>
      
      <TouchableOpacity
        style={styles.declarationContainer}
        onPress={() => updateFormData('declarationAccepted', !formData.declarationAccepted)}
      >
        <View style={[
          styles.checkbox,
          formData.declarationAccepted && styles.checkboxChecked
        ]}>
          {formData.declarationAccepted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.declarationText}>
          I declare that the information provided is true and correct to the best of my knowledge.
        </Text>
      </TouchableOpacity>
      {errors.declarationAccepted && <Text style={styles.errorText}>{errors.declarationAccepted}</Text>}
    </View>
  );

  

  const renderClaimTypeModal = () => (
    <Modal
      visible={showClaimTypeModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowClaimTypeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Claim Type</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowClaimTypeModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalBody}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
          >
            {claimTypes
              .filter(type => type.type === formData.policyType)
              .map(type => 
                type.categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.claimTypeOption}
                    onPress={() => selectClaimType(category)}
                  >
                    <Text style={styles.claimTypeOptionText}>{category}</Text>
                  </TouchableOpacity>
                ))
              )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <SafeScreen>
      <StatusBar style="light" />
      
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height || 0)}>
        <CompactCurvedHeader 
          title="Submit Claim"
          subtitle="File a new insurance claim"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
      </View>
      
      <View style={styles.container}>
        {renderProgressBar()}
        {renderStepIndicator()}
        
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + headerHeight}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            {...(Platform.OS === 'ios' ? { automaticallyAdjustKeyboardInsets: true, contentInsetAdjustmentBehavior: 'always' } : {})}
          >
            <View>
              <EnhancedCard style={styles.stepCard}>
                {renderCurrentStep()}
              </EnhancedCard>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.footerButton, styles.backButton]}
            onPress={() => currentStep === 1 ? navigation.goBack() : handlePrevious()}
          >
            <Text style={styles.backButtonText}>
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.footerButton, styles.nextButton]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            <Text style={styles.nextButtonText}>
              {isSubmitting ? 'Submitting...' : 
               currentStep === totalSteps ? 'Submit Claim' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {renderPolicyModal()}
      {renderClaimTypeModal()}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  
  // Progress Bar
  progressContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundCard,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundCard,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.success,
  },
  stepNumber: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  stepNumberActive: {
    color: Colors.backgroundCard,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  
  // Step Content
  stepCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  
  // Form Elements
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundCard,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  inputValue: {
    color: Colors.textPrimary,
  },
  suffixIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundCard,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  
  // Policy Selector
  policySelector: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundCard,
    marginBottom: Spacing.md,
  },
  policySelectorLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  policySelectorValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  policySelectorIcon: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm + 20,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  
  // Claim Type Selector
  claimTypeSelector: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundCard,
    marginBottom: Spacing.md,
  },
  claimTypeSelectorLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  claimTypeSelectorValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  claimTypeSelectorIcon: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm + 20,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  
  // Documents
  documentsContainer: {
    marginBottom: Spacing.md,
  },
  documentsLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  documentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  documentTypeButton: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    margin: Spacing.xs / 2,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  documentTypeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  uploadedDocuments: {
    marginTop: Spacing.md,
  },
  uploadedDocumentsTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  documentSize: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  removeDocumentButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeDocumentText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.backgroundCard,
  },
  
  // Review Section
  reviewSection: {
    marginBottom: Spacing.lg,
  },
  reviewSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  reviewLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  reviewValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  
  // Contact Preference
  contactPreference: {
    marginBottom: Spacing.md,
  },
  contactLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  contactOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  contactOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
  },
  contactOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  contactOptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  contactOptionTextActive: {
    color: Colors.primary,
  },
  
  // Declaration
  declarationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.backgroundCard,
  },
  declarationText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: Colors.backgroundSecondary,
    marginRight: Spacing.sm,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.backgroundCard,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  modalBody: {
    padding: Spacing.md,
  },
  
  // Policy Options
  policyOption: {
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  policyOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  policyOptionNumber: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  policyOptionType: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  policyDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
    gap: 4,
  },
  policyDetailLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    minWidth: 80,
  },
  policyDetailValue: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  expiryBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiryBadgeUrgent: {
    backgroundColor: Colors.error + '20',
  },
  expiryBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.warning,
  },
  extendibleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  extendibleBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  
  // Deprecated styles (kept for backwards compatibility)
  policyOptionHolder: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  policyOptionVehicle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  policyOptionExpiry: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  
  // Claim Type Options
  claimTypeOption: {
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: Spacing.sm,
  },
  claimTypeOptionText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
});
