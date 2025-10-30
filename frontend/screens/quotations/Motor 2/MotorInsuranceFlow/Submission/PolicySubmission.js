import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DjangoAPIService from '../../../../../services/DjangoAPIService';
import StoragePurge from '../../../../../services/StoragePurge';
import { useMotorInsurance } from '../../../../../contexts/MotorInsuranceContext';
import { useNavigation } from '@react-navigation/native';

/**
 * Validates extendible configuration for extendible products
 * @param {Object} product - Product details
 * @param {Object} premium - Premium breakdown
 * @returns {Object} - Validation result with isValid and config
 */
function validateExtendibleConfig(product, premium) {
  const isExtendible = 
    product?.is_extendible || 
    product?.subcategory?.toUpperCase().includes('EXT') ||
    product?.subcategoryCode?.toUpperCase().includes('EXT') ||
    product?.name?.toUpperCase().includes('EXTENDIBLE');

  console.log('[PolicySubmission] Extendible validation:', {
    isExtendible,
    productSubcategory: product?.subcategory,
    productCode: product?.subcategoryCode,
    hasExtendibleConfig: !!premium?.extendible_config
  });

  if (!isExtendible) {
    return { isValid: true, config: null, isExtendible: false };
  }

  // Product is extendible - MUST have extendible_config
  const config = premium?.extendible_config;
  
  if (!config) {
    console.error('[PolicySubmission] ❌ CRITICAL: Extendible product missing extendible_config!');
    console.error('[PolicySubmission] Product:', product);
    console.error('[PolicySubmission] Premium:', premium);
    return {
      isValid: false,
      config: null,
      isExtendible: true,
      error: 'Extendible product is missing payment configuration. Please go back and ensure the product has extendible payment terms configured.'
    };
  }

  // Validate required fields in extendible_config
  const requiredFields = [
    'initial_period_days',
    'extension_deadline_days',
    'initial_amount',
    'balance_amount',
    'total_annual_premium'
  ];

  const missingFields = requiredFields.filter(field => {
    const value = config[field];
    return value === undefined || value === null || (typeof value === 'number' && isNaN(value));
  });

  if (missingFields.length > 0) {
    console.error('[PolicySubmission] ❌ CRITICAL: Extendible config missing required fields:', missingFields);
    console.error('[PolicySubmission] Config:', config);
    return {
      isValid: false,
      config,
      isExtendible: true,
      error: `Extendible configuration is incomplete. Missing: ${missingFields.join(', ')}. Please go back and recalculate the premium.`
    };
  }

  // Validate amounts are positive numbers
  if (config.initial_amount <= 0 || config.balance_amount <= 0 || config.total_annual_premium <= 0) {
    console.error('[PolicySubmission] ❌ CRITICAL: Extendible amounts must be positive:', {
      initial_amount: config.initial_amount,
      balance_amount: config.balance_amount,
      total_annual_premium: config.total_annual_premium
    });
    return {
      isValid: false,
      config,
      isExtendible: true,
      error: 'Extendible payment amounts are invalid. Please go back and recalculate the premium.'
    };
  }

  // Validate timeline makes sense
  if (config.initial_period_days <= 0 || config.extension_deadline_days <= 0) {
    console.error('[PolicySubmission] ❌ CRITICAL: Extendible timeline must be positive:', {
      initial_period_days: config.initial_period_days,
      extension_deadline_days: config.extension_deadline_days
    });
    return {
      isValid: false,
      config,
      isExtendible: true,
      error: 'Extendible payment timeline is invalid. Please contact support.'
    };
  }

  console.log('[PolicySubmission] ✅ Extendible config validation passed:', config);
  return { isValid: true, config, isExtendible: true };
}

function normalizePolicyData(data) {
  const safe = data || {};
  const client = safe.clientDetails || safe.client_details || {};
  const vehicle = safe.vehicleDetails || safe.vehicle_details || {};
  const product = safe.productDetails || safe.product_details || {};
  const premium = safe.premiumBreakdown || safe.premium_breakdown || {};
  const payment = safe.paymentDetails || safe.payment_details || {};
  const docs = Array.isArray(safe.documents)
    ? safe.documents
    : (Array.isArray(safe.documents?.files) ? safe.documents.files : []);

  // Derive client full name robustly
  const fullName = client.fullName
    || client.full_name
    || client.owner_name
    || `${client.firstName || client.first_name || ''} ${client.lastName || client.last_name || ''}`.trim();

  // Derive category when not explicitly provided (e.g., PRIVATE_THIRD_PARTY_EXT -> PRIVATE)
  const derivedCategoryFromSub = (() => {
    const sub = product.subcategory || product.name || product.subcategory_name || '';
    if (typeof sub === 'string' && sub.includes('_')) {
      return sub.split('_')[0].toUpperCase();
    }
    return '';
  })();

  const category = product.category
    || product.category_name
    || product.categoryCode
    || product.category_code
    || derivedCategoryFromSub
    || '';

  return {
    quoteId: safe.quoteId || safe.quote_id || null,
    clientDetails: {
      fullName,
      email: client.email || client.owner_email || client.email_address || '',
      phone: client.phone || client.phoneNumber || client.phone_number || client.owner_phone || client.msisdn || '',
      ...(client.firstName || client.first_name ? { firstName: client.firstName || client.first_name } : {}),
      ...(client.lastName || client.last_name ? { lastName: client.lastName || client.last_name } : {}),
      ...(client.kraPin || client.kra_pin ? { kraPin: client.kraPin || client.kra_pin } : {}),
      ...(client.idNumber || client.id_number ? { idNumber: client.idNumber || client.id_number } : {}),
    },
    vehicleDetails: {
      // Core identity
      registration: vehicle.registration
        || vehicle.vehicle_registration
        || vehicle.registration_number
        || vehicle.registrationNumber
        || vehicle.reg_no
        || vehicle.regno
        || vehicle.vehicle_reg_no
        || '',
      make: vehicle.make || vehicle.vehicle_make || '',
      model: vehicle.model || vehicle.vehicle_model || '',
      year: Number(vehicle.year || vehicle.vehicle_year || new Date().getFullYear()),
      // Additional identifiers
      ...(vehicle.chassisNumber || vehicle.chassis_number ? { chassisNumber: vehicle.chassisNumber || vehicle.chassis_number } : {}),
      ...(vehicle.engineNumber || vehicle.engine_number ? { engineNumber: vehicle.engineNumber || vehicle.engine_number } : {}),
      // Coverage period
      ...(vehicle.coverStartDate || vehicle.cover_start_date ? { coverStartDate: vehicle.coverStartDate || vehicle.cover_start_date } : { coverStartDate: new Date().toISOString().split('T')[0] }),
      ...(vehicle.coverEndDate || vehicle.cover_end_date ? { coverEndDate: vehicle.coverEndDate || vehicle.cover_end_date } : {}),
      // Product-specific numeric fields
      ...(vehicle.sumInsured != null || vehicle.sum_insured != null
        ? { sumInsured: Number(String(vehicle.sumInsured ?? vehicle.sum_insured).replace?.(/[_,\s]/g, '') || (vehicle.sumInsured ?? vehicle.sum_insured)) }
        : {}),
      ...(vehicle.tonnage != null ? { tonnage: Number(vehicle.tonnage) } : {}),
      ...(vehicle.passengerCapacity != null || vehicle.passenger_capacity != null
        ? { passengerCapacity: Number(vehicle.passengerCapacity ?? vehicle.passenger_capacity) }
        : {}),
      ...(vehicle.engineCapacity != null || vehicle.engine_capacity != null
        ? { engineCapacity: Number(vehicle.engineCapacity ?? vehicle.engine_capacity) }
        : {}),
      // Misc
      ...(vehicle.value ? { value: vehicle.value } : {}),
      ...(vehicle.vehicle_usage ? { vehicle_usage: vehicle.vehicle_usage } : {}),
      ...(vehicle.vehicle_color ? { vehicle_color: vehicle.vehicle_color } : {}),
      ...(vehicle.seating_capacity != null ? { seating_capacity: Number(vehicle.seating_capacity) } : {}),
    },
    productDetails: {
      category,
      subcategory: product.subcategory || product.name || '',
      coverageType: product.coverageType || product.coverage_type || '',
      ...(product.name ? { name: product.name } : {}),
    },
    premiumBreakdown: {
      totalAmount: premium.totalAmount ?? premium.total_amount ?? premium.total_premium ?? 0,
      basePremium: premium.basePremium ?? premium.base_premium ?? 0,
      trainingLevy: premium.trainingLevy ?? premium.training_levy ?? 0,
      pcfLevy: premium.pcfLevy ?? premium.pcf_levy ?? 0,
      stampDuty: premium.stampDuty ?? premium.stamp_duty ?? 40,
      // Include extendible_config if product is extendible (Third Party Extendible, etc.)
      ...(premium.extendible_config ? { extendible_config: premium.extendible_config } : {}),
    },
    paymentDetails: {
      method: payment.method || 'PENDING',
      amount: Number(payment.amount ?? premium.totalAmount ?? premium.total_amount ?? 0),
      status: payment.status || 'CONFIRMED',
      transactionId: payment.transactionId || payment.transaction_id || `TXN-${Date.now()}`,
      transaction_id: payment.transaction_id || payment.transactionId || `TXN-${Date.now()}`, // Backend expects snake_case
    },
    underwriterDetails: safe.underwriterDetails || safe.underwriter_details || null,
    addons: Array.isArray(safe.addons) ? safe.addons : [],
    documents: docs,
  };
}

export default function PolicySubmission({
  policyData: policyDataProp,
  quoteId,
  clientDetails,
  vehicleDetails,
  productDetails,
  underwriterDetails,
  premiumBreakdown,
  paymentDetails,
  documents,
  onSubmissionComplete,
  onSubmissionError
}) {
  const [progress, setProgress] = useState('Preparing policy data...');
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  // Get motor insurance context to reset flow after submission
  const { state: motorState, actions: motorActions } = useMotorInsurance();
  const navigation = useNavigation();

  useEffect(() => {
    submitPolicy();
  }, []);

  const submitPolicy = async () => {
    try {
      // Local duplicate-submission guard: prevent accidental double tap / re-entry
      const guardKey = 'policy_submission_guard';
      const existingGuard = await AsyncStorage.getItem(guardKey);
      if (existingGuard) {
        console.log('[PolicySubmission] Duplicate submission blocked by guard');
        return; // Early exit to prevent double policy creation
      }
      await AsyncStorage.setItem(guardKey, String(Date.now()));

      // IMPORTANT: Do not purge or reset flow before successful submission.
      // Early purge caused the UI to jump back to step 1 during submission.
      // We now only purge/reset after a confirmed success.

      // Step 1: Validate data
      setStep(1);
      setProgress('Validating policy data...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Submit to backend
      setStep(2);
      setProgress('Creating policy...');

      // Prefer composed policyData from parent; else, compose from individual props
      const composed = policyDataProp ?? {
        quoteId,
        clientDetails,
        vehicleDetails,
        productDetails,
        underwriterDetails,
        premiumBreakdown,
        paymentDetails,
        documents,
      };

      // Enrich with context fallbacks for critical required fields BEFORE normalization
      // This prevents backend 400s by ensuring we have the minimum required payload
      try {
        const ctx = motorState || {};
        const ctxInputs = ctx.pricingInputs || {};
        // Client fallbacks
        composed.clientDetails = composed.clientDetails || {};
        if (!composed.clientDetails.fullName && !composed.clientDetails.full_name) {
          const first = composed.clientDetails.firstName || composed.clientDetails.first_name || ctxInputs.first_name || ctxInputs.clientDetails?.first_name || '';
          const last = composed.clientDetails.lastName || composed.clientDetails.last_name || ctxInputs.last_name || ctxInputs.clientDetails?.last_name || '';
          const combined = `${first} ${last}`.trim();
          if (combined) composed.clientDetails.fullName = combined;
        }
        if (!composed.clientDetails.phone) {
          composed.clientDetails.phone = ctxInputs.phone
            || ctxInputs.phone_number
            || ctxInputs.clientDetails?.phone
            || ctxInputs.clientDetails?.phone_number
            || '';
        }
        // Vehicle fallbacks
        composed.vehicleDetails = composed.vehicleDetails || {};
        if (!composed.vehicleDetails.registration) {
          composed.vehicleDetails.registration = ctxInputs.registration
            || ctxInputs.vehicle_registration
            || ctxInputs.registration_number
            || ctxInputs.registrationNumber
            || ctxInputs.vehicleDetails?.registration
            || '';
        }
        // Product fallbacks
        composed.productDetails = composed.productDetails || {};
        if (!composed.productDetails.category) {
          composed.productDetails.category = ctx.selectedCategory?.name
            || ctx.selectedCategory?.category_name
            || (composed.productDetails.subcategory ? String(composed.productDetails.subcategory).split('_')[0].toUpperCase() : '')
            || '';
        }
      } catch (e) {
        // Non-fatal; proceed to normalization where more fallbacks apply
        console.warn('[PolicySubmission] Context enrichment warning:', e?.message || e);
      }

      const policyData = normalizePolicyData(composed);

      console.log('\n' + '='.repeat(80));
      console.log('PolicySubmission - Composed Data BEFORE Normalization:');
      console.log(JSON.stringify(composed, null, 2));
      console.log('='.repeat(80));
      console.log('PolicySubmission - Normalized Payload BEING SENT:');
      console.log(JSON.stringify(policyData, null, 2));
      console.log('='.repeat(80));
      console.log('🔍 TRANSACTION ID CHECK:');
      console.log('  - transactionId:', policyData.paymentDetails?.transactionId);
      console.log('  - transaction_id:', policyData.paymentDetails?.transaction_id);
      console.log('  - status:', policyData.paymentDetails?.status);
      console.log('='.repeat(80) + '\n');

      // ========================================
      // CRITICAL: Validate extendible configuration
      // ========================================
      const extendibleValidation = validateExtendibleConfig(
        policyData.productDetails,
        policyData.premiumBreakdown
      );

      if (!extendibleValidation.isValid) {
        console.error('[PolicySubmission] ❌ EXTENDIBLE VALIDATION FAILED');
        console.error('[PolicySubmission] Error:', extendibleValidation.error);
        
        // Show user-friendly error
        Alert.alert(
          'Configuration Error',
          extendibleValidation.error,
          [
            {
              text: 'Go Back',
              onPress: () => {
                // Remove submission guard to allow retry
                AsyncStorage.removeItem('policy_submission_guard').catch(console.warn);
                navigation.goBack();
              },
              style: 'cancel'
            }
          ]
        );
        
        throw new Error(extendibleValidation.error);
      }

      if (extendibleValidation.isExtendible && extendibleValidation.config) {
        console.log('[PolicySubmission] ✅ Extendible product validated successfully');
        console.log('[PolicySubmission] Extendible Config:', extendibleValidation.config);
      }

      // Final preflight validation for required fields to avoid backend 400s
      const missing = [];
      if (!policyData?.clientDetails?.fullName) missing.push('clientDetails.fullName');
      if (!policyData?.clientDetails?.phone) missing.push('clientDetails.phone');
      if (!policyData?.vehicleDetails?.registration) missing.push('vehicleDetails.registration');
      if (!policyData?.productDetails?.category) missing.push('productDetails.category');

      if (missing.length) {
        const msg = `Missing required fields:\n- ${missing.join('\n- ')}`;
        console.warn('[PolicySubmission] Preflight validation failed:', msg);
        throw new Error(msg);
      }

      // Create policy using the proper API service method
      const djangoAPI = DjangoAPIService;
      await djangoAPI.initialize(); // Ensure service is initialized
      
  const response = await djangoAPI.createMotorPolicy(policyData);

      if (!response.success && !response.policyNumber) {
        throw new Error(response.message || 'Policy creation failed');
      }

      // Step 3: Generate documents
      setStep(3);
      setProgress('Generating policy document...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 4: Finalize
      setStep(4);
      setProgress('Policy created successfully!');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Complete submission
      const result = {
        policyNumber: response.policyNumber || `POL-${Date.now()}`,
        policyId: response.policyId || response.id,
        pdfUrl: response.pdfUrl || null,
        message: response.message || 'Policy created successfully'
      };

      console.log('✅ Policy created successfully!');
      console.log('Policy Number:', result.policyNumber);
      console.log('Policy ID:', result.policyId);

      // Prefer parent handler, else navigate directly to success screen
      if (typeof onSubmissionComplete === 'function') {
        console.log('[PolicySubmission] Calling onSubmissionComplete callback');
        onSubmissionComplete(result);
        console.log('[PolicySubmission] onSubmissionComplete callback returned');
      } else {
        console.log('[PolicySubmission] No onSubmissionComplete callback, navigating directly');
        try {
          navigation.navigate('PolicySuccess', result);
          console.log('[PolicySubmission] Direct navigation to PolicySuccess completed');
        } catch (e) {
          // If navigation isn't available for some reason, still call callback if provided
          console.error('[PolicySubmission] navigation to PolicySuccess failed:', e?.message || e);
        }
      }

      // Targeted purge to clear drafts and motor flow state after success
      console.log('[PolicySubmission] Running post-success storage purge...');
      try {
        const reg = policyData?.vehicleDetails?.registration || policyData?.vehicle_details?.registration;
        await StoragePurge.purgeAfterPolicySubmission({ vehicleRegistration: reg });
        console.log('[PolicySubmission] Storage purge completed successfully');
      } catch (e) {
        console.warn('[PolicySubmission] Post-success purge failed:', e?.message || e);
      }

      console.log('[PolicySubmission] All post-submission tasks completed');

    } catch (error) {
      console.error('Policy submission error:', error);

      // Surface helpful backend validation messages across various shapes
      const payload = error?.payload || error?.response?.data || null;
      const detailsObj = payload?.details || payload?.errors || error?.details || null;
      const detailMsg = detailsObj
        ? Object.entries(detailsObj).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):String(v)}`).join('\n')
        : (typeof payload === 'string' ? payload : (payload?.message || null));

      Alert.alert(
        'Submission Failed',
        detailMsg || error.message || 'Failed to create policy. Please try again.',
        [
          { text: 'Retry', onPress: () => submitPolicy() },
          { text: 'Cancel', style: 'cancel', onPress: () => onSubmissionError?.(error) }
        ]
      );
    } finally {
      // Always release the local guard
      try { await AsyncStorage.removeItem('policy_submission_guard'); } catch {}
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentCard}>
        <ActivityIndicator size="large" color="#D5222B" />
        
        <Text style={styles.progressText}>{progress}</Text>
        
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsText}>
            Step {step} of {totalSteps}
          </Text>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(step / totalSteps) * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <Text style={styles.pleaseWait}>Please wait while we process your policy...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 20,
    textAlign: 'center',
  },
  stepsContainer: {
    marginTop: 20,
    width: '100%',
  },
  stepsText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D5222B',
    borderRadius: 4,
  },
  pleaseWait: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 15,
    textAlign: 'center',
  },
});
