import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DjangoAPIService from '../../../../../services/DjangoAPIService';
import StoragePurge from '../../../../../services/StoragePurge';
import { useMotorInsurance } from '../../../../../contexts/MotorInsuranceContext';
import { useNavigation } from '@react-navigation/native';
import DoubleInsuranceWarningModal from '../../../../../components/modals/DoubleInsuranceWarningModal';

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

/**
 * Sanitize string to remove null bytes (\u0000) that cause PostgreSQL errors
 * OCR/Textract extraction may insert null bytes which PostgreSQL cannot store
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  // Remove all null bytes from the string
  return value.replace(/\u0000/g, '');
}

/**
 * Recursively sanitize all string values in an object to remove null bytes
 * This prevents PostgreSQL errors: "unsupported Unicode escape sequence \u0000"
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Map document keys from frontend to backend document types
 */
function mapDocTypeToBackend(key) {
  const mapping = {
    'logbook': 'logbook',
    'id_copy': 'national_id',
    'kra_pin': 'kra_pin',
    'valuation': 'valuation_report',
    'business_permit': 'business_permit',
  };
  return mapping[key] || 'generic';
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

  // Generate quote ID if not provided
  const quoteId = safe.quoteId || safe.quote_id || `QUOTE-${Date.now()}`;

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
    quoteId,
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
      // Identification type (REQUIRED for validation)
      ...(vehicle.identificationType || vehicle.identification_type ? { identificationType: vehicle.identificationType || vehicle.identification_type } : {}),
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
      // CRITICAL FIX: Payment logic based on actual transaction ID
      // - If we have a real transaction ID (from M-PESA, etc.), status is CONFIRMED
      // - If no transaction ID, this is a PENDING policy (user hasn't paid yet)
      // - Generate placeholder transaction ID ONLY for tracking purposes
      transactionId: payment.transactionId || payment.transaction_id || `QUOTE-${Date.now()}`,
      transaction_id: payment.transaction_id || payment.transactionId || `QUOTE-${Date.now()}`,
      
      // Set method and status based on whether we have a real transaction ID
      // Real transaction IDs from M-PESA start with specific prefixes
      method: payment.method || (() => {
        const txnId = payment.transactionId || payment.transaction_id || '';
        // Check if it's a real M-PESA/payment gateway transaction ID
        const isRealPayment = txnId && !txnId.startsWith('TXN-') && !txnId.startsWith('QUOTE-');
        return isRealPayment ? 'MPESA' : 'PENDING';
      })(),
      
      status: payment.status || (() => {
        const txnId = payment.transactionId || payment.transaction_id || '';
        // Check if it's a real payment transaction ID
        const isRealPayment = txnId && !txnId.startsWith('TXN-') && !txnId.startsWith('QUOTE-');
        return isRealPayment ? 'CONFIRMED' : 'PENDING';
      })(),
      
      amount: Number(payment.amount ?? premium.totalAmount ?? premium.total_amount ?? 0),
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
  
  // Double-insurance modal state
  const [showDoubleInsuranceModal, setShowDoubleInsuranceModal] = useState(false);
  const [dmvicPolicy, setDmvicPolicy] = useState(null);
  const [allowProceed, setAllowProceed] = useState(false);
  
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
        
        // Check if guard is stale (older than 2 minutes = failed submission)
        const guardTimestamp = parseInt(existingGuard);
        const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
        
        if (guardTimestamp < twoMinutesAgo) {
          console.log('[PolicySubmission] Guard is stale, clearing and allowing retry');
          await AsyncStorage.removeItem(guardKey);
          // Continue with submission
        } else {
          console.log('[PolicySubmission] Recent guard found, blocking duplicate submission');
          return; // Early exit to prevent double policy creation
        }
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
        const ctxVehicle = ctx.vehicleDetails || {};
        const ctxInputs = ctx.pricingInputs || {};
        const ctxClient = ctxInputs.clientDetails || ctx.clientDetails || {};
        const ctxPremium = ctx.calculatedPremium || ctx.premium || ctx.selectedUnderwriter || {};
        const ctxProduct = ctx.selectedSubcategory || ctx.productType || {};
        const ctxUnderwriter = ctx.selectedUnderwriter || {};
        
        // Client fallbacks
        composed.clientDetails = composed.clientDetails || {};
        if (!composed.clientDetails.fullName && !composed.clientDetails.full_name) {
          const first = composed.clientDetails.firstName || composed.clientDetails.first_name || 
                       ctxClient.first_name || ctxClient.firstName || '';
          const last = composed.clientDetails.lastName || composed.clientDetails.last_name || 
                      ctxClient.last_name || ctxClient.lastName || '';
          const combined = `${first} ${last}`.trim();
          const existing = ctxClient.fullName || ctxClient.full_name || ctxClient.name;
          composed.clientDetails.fullName = combined || existing || '';
        }
        if (!composed.clientDetails.phone) {
          composed.clientDetails.phone = ctxClient.phone || ctxClient.phone_number || 
                                        ctxClient.phoneNumber || '';
        }
        if (!composed.clientDetails.email) {
          composed.clientDetails.email = ctxClient.email || '';
        }
        if (!composed.clientDetails.kraPin && ctxClient.kra_pin) {
          composed.clientDetails.kraPin = ctxClient.kra_pin;
        }
        if (!composed.clientDetails.idNumber && ctxClient.id_number) {
          composed.clientDetails.idNumber = ctxClient.id_number;
        }
        
        // Vehicle fallbacks
        composed.vehicleDetails = composed.vehicleDetails || {};
        if (!composed.vehicleDetails.registration) {
          composed.vehicleDetails.registration = ctxVehicle.registrationNumber || 
                                                 ctxVehicle.registration_number ||
                                                 ctxVehicle.vehicle_registration ||
                                                 ctxVehicle.registration ||
                                                 ctxClient.vehicle_registration || '';
        }
        if (!composed.vehicleDetails.make) {
          composed.vehicleDetails.make = ctxVehicle.make || ctxClient.vehicle_make || '';
        }
        if (!composed.vehicleDetails.model) {
          composed.vehicleDetails.model = ctxVehicle.model || ctxClient.vehicle_model || '';
        }
        if (!composed.vehicleDetails.year) {
          composed.vehicleDetails.year = ctxVehicle.year || ctxVehicle.vehicle_year || new Date().getFullYear();
        }
        if (!composed.vehicleDetails.chassisNumber && ctxVehicle.chassisNumber) {
          composed.vehicleDetails.chassisNumber = ctxVehicle.chassisNumber;
        }
        if (!composed.vehicleDetails.engineNumber && ctxVehicle.engineNumber) {
          composed.vehicleDetails.engineNumber = ctxVehicle.engineNumber;
        }
        if (!composed.vehicleDetails.coverStartDate) {
          composed.vehicleDetails.coverStartDate = ctxVehicle.cover_start_date || 
                                                   ctxVehicle.coverStartDate || 
                                                   new Date().toISOString().split('T')[0];
        }
        
        // Product fallbacks
        composed.productDetails = composed.productDetails || {};
        if (!composed.productDetails.category) {
          composed.productDetails.category = ctxProduct.category || 
                                            ctx.selectedCategory?.category_code ||
                                            ctx.selectedCategory?.name ||
                                            (ctxProduct.subcategory_code ? ctxProduct.subcategory_code.split('_')[0] : '') ||
                                            '';
        }
        if (!composed.productDetails.subcategory) {
          composed.productDetails.subcategory = ctxProduct.subcategory_code || 
                                               ctxProduct.code ||
                                               ctxProduct.name || '';
        }
        if (!composed.productDetails.coverageType) {
          composed.productDetails.coverageType = ctxProduct.coverage_type || 
                                                ctxProduct.type || '';
        }
        
        // Premium fallbacks
        composed.premiumBreakdown = composed.premiumBreakdown || {};
        if (!composed.premiumBreakdown.totalAmount && !composed.premiumBreakdown.total_amount) {
          composed.premiumBreakdown.totalAmount = ctxPremium.total_premium || 
                                                  ctxPremium.totalPremium ||
                                                  ctxUnderwriter.total_premium ||
                                                  0;
        }
        if (!composed.premiumBreakdown.basePremium && !composed.premiumBreakdown.base_premium) {
          composed.premiumBreakdown.basePremium = ctxPremium.base_premium || 
                                                 ctxUnderwriter.breakdown?.base_premium ||
                                                 0;
        }
        if (!composed.premiumBreakdown.trainingLevy) {
          composed.premiumBreakdown.trainingLevy = ctxPremium.training_levy ||
                                                   ctxUnderwriter.breakdown?.training_levy ||
                                                   0;
        }
        if (!composed.premiumBreakdown.pcfLevy) {
          composed.premiumBreakdown.pcfLevy = ctxPremium.pcf_levy ||
                                              ctxUnderwriter.breakdown?.pcf_levy ||
                                              0;
        }
        if (!composed.premiumBreakdown.stampDuty) {
          composed.premiumBreakdown.stampDuty = ctxPremium.stamp_duty ||
                                               ctxUnderwriter.breakdown?.stamp_duty ||
                                               40;
        }
        
        // Underwriter fallbacks - pull from selectedUnderwriter in context
        if (!composed.underwriterDetails || !composed.underwriterDetails.name) {
          composed.underwriterDetails = {
            name: ctxUnderwriter.name || ctxUnderwriter.underwriter_name || 
                  ctxUnderwriter.company || // Add 'company' field as fallback
                  ctxVehicle.selectedUnderwriter?.name ||
                  ctxVehicle.underwriter || '',
            code: ctxUnderwriter.code || ctxUnderwriter.underwriter_code || 
                  ctxUnderwriter.company_code || '',
            id: ctxUnderwriter.id || ctxUnderwriter.underwriter_id || '',
          };
          
          // Also store in vehicleDetails for backend compatibility
          if (!composed.vehicleDetails.underwriter && composed.underwriterDetails.name) {
            composed.vehicleDetails.underwriter = composed.underwriterDetails.name;
          }
          if (!composed.vehicleDetails.selectedUnderwriter && ctxUnderwriter.name) {
            composed.vehicleDetails.selectedUnderwriter = ctxUnderwriter;
          }
        }

        // Documents fallbacks - convert uploaded documents to array format expected by backend
        if (!composed.documents || composed.documents.length === 0) {
          const ctxUploadedDocs = ctx.uploadedDocuments || {};
          composed.documents = Object.entries(ctxUploadedDocs).map(([key, doc]) => ({
            type: doc.type || mapDocTypeToBackend(key),
            document_type: mapDocTypeToBackend(key),
            name: doc.name || key,
            s3_key: doc.s3_key,
            s3_url: doc.s3_url,
            document_id: doc.document_id,
            uploaded_at: doc.uploadedAt || doc.uploaded_at || new Date().toISOString(),
            status: doc.status || 'uploaded',
          }));
        }
      } catch (e) {
        // Non-fatal; proceed to normalization where more fallbacks apply
        console.warn('[PolicySubmission] Context enrichment warning:', e?.message || e);
      }

      const policyData = normalizePolicyData(composed);

      // CRITICAL: Sanitize all string values to remove null bytes (\u0000)
      // OCR/Textract extraction may insert null bytes which PostgreSQL cannot store
      const sanitizedPolicyData = sanitizeObject(policyData);

      console.log('\n' + '='.repeat(80));
      console.log('PolicySubmission - Composed Data BEFORE Normalization:');
      console.log(JSON.stringify(composed, null, 2));
      console.log('='.repeat(80));
      console.log('PolicySubmission - Normalized Payload BEING SENT:');
      console.log(JSON.stringify(sanitizedPolicyData, null, 2));
      console.log('='.repeat(80));
      console.log('🔍 TRANSACTION ID CHECK:');
      console.log('  - transactionId:', sanitizedPolicyData.paymentDetails?.transactionId);
      console.log('  - transaction_id:', sanitizedPolicyData.paymentDetails?.transaction_id);
      console.log('  - status:', sanitizedPolicyData.paymentDetails?.status);
      console.log('='.repeat(80) + '\n');

      // NOTE: Comprehensive validation is NOT needed here because:
      // 1. The wizard validates each step BEFORE allowing progression (MotorInsuranceContainer.js lines 101-267)
      // 2. Users CANNOT proceed to submission without completing all required fields
      // 3. The backend performs final validation with MotorPolicySubmissionSerializer
      // 4. Running validation here causes false negatives due to field name normalization mismatches
      console.log('[PolicySubmission] ℹ️ Skipping redundant validation - wizard already enforced all requirements');

      // ========================================
      // CRITICAL: Validate extendible configuration
      // ========================================
      const extendibleValidation = validateExtendibleConfig(
        sanitizedPolicyData.productDetails,
        sanitizedPolicyData.premiumBreakdown
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
      if (!sanitizedPolicyData?.clientDetails?.fullName) missing.push('clientDetails.fullName');
      if (!sanitizedPolicyData?.clientDetails?.phone) missing.push('clientDetails.phone');
      if (!sanitizedPolicyData?.vehicleDetails?.registration) missing.push('vehicleDetails.registration');
      if (!sanitizedPolicyData?.productDetails?.category) missing.push('productDetails.category');
      if (!sanitizedPolicyData?.productDetails?.subcategory) missing.push('productDetails.subcategory');
      
      // Check premium from premiumBreakdown
      const premiumAmount = sanitizedPolicyData?.premiumBreakdown?.totalAmount || 
                           sanitizedPolicyData?.premiumBreakdown?.total_amount || 0;
      if (!premiumAmount || premiumAmount <= 0) {
        missing.push('premiumBreakdown.totalAmount (must be > 0)');
      }
      
      // Check underwriter name from underwriterDetails or fallback to vehicleDetails
      const underwriterName = sanitizedPolicyData?.underwriterDetails?.name || 
                             sanitizedPolicyData?.vehicleDetails?.underwriter ||
                             sanitizedPolicyData?.vehicleDetails?.selectedUnderwriter?.name;
      if (!underwriterName) {
        missing.push('underwriterDetails.name');
      }

      if (missing.length) {
        const msg = `Missing required fields:\n- ${missing.join('\n- ')}`;
        console.warn('[PolicySubmission] Preflight validation failed:', msg);
        console.warn('[PolicySubmission] Policy data dump:', JSON.stringify(sanitizedPolicyData, null, 2));
        
        // Clear guard to allow retry after fixing data
        await AsyncStorage.removeItem('policy_submission_guard');
        
        // Show user-friendly error
        Alert.alert(
          'Incomplete Policy Data',
          'Cannot submit policy. Please go back and ensure all required information is filled:\n\n' + 
          missing.map(f => `• ${f.split('.').pop()}`).join('\n'),
          [
            {
              text: 'Go Back',
              onPress: () => {
                if (onSubmissionError) {
                  onSubmissionError(new Error(msg));
                } else {
                  navigation.goBack();
                }
              }
            }
          ]
        );
        
        throw new Error(msg);
      }

      // ========================================
      // CRITICAL: DMVIC Double-Insurance Check (ALWAYS ENFORCED)
      // DMVIC is the regulatory authority - their decision is FINAL
      // ========================================
      setProgress('Checking for existing coverage...');
      setStep(2);
      const registration = sanitizedPolicyData?.vehicleDetails?.registration;
      const coverStartDate = sanitizedPolicyData?.vehicleDetails?.coverStartDate;
      const coverEndDate = sanitizedPolicyData?.vehicleDetails?.coverEndDate;

      if (registration) {
        try {
          console.log('[PolicySubmission] Checking DMVIC double-insurance:', registration);
          const djangoAPI = DjangoAPIService;
          await djangoAPI.initialize();
          
          const doubleInsuranceResult = await djangoAPI.validateDoubleInsurance(
            registration,
            coverStartDate,
            coverEndDate
          );

          console.log('[PolicySubmission] DMVIC double-insurance result:', doubleInsuranceResult);

          // If active cover found, BLOCK submission (DMVIC authority is final)
          if (doubleInsuranceResult?.has_active_cover && doubleInsuranceResult?.dmvic_policy) {
            console.log('[PolicySubmission] ❌ DMVIC blocked: Active cover detected');
            
            const dmvicPol = doubleInsuranceResult.dmvic_policy;
            const dmvicInfo = `Policy: ${dmvicPol.policy_number || 'Unknown'}\n` +
                            `Underwriter: ${dmvicPol.member_company || 'Unknown'}\n` +
                            `Cover Type: ${dmvicPol.certificate_type || 'Unknown'}\n` +
                            `Expiry: ${dmvicPol.cover_end_date || 'Unknown'}`;
            
            // Clear guard
            await AsyncStorage.removeItem('policy_submission_guard');
            
            // Show BLOCKING alert
            Alert.alert(
              '⚠️ DMVIC Insurance Active',
              `CANNOT CREATE NEW POLICY\n\nDMVIC database confirms this vehicle has active insurance:\n\n${dmvicInfo}\n\n` +
              `Kenyan law prohibits duplicate motor insurance. The existing policy must expire or be cancelled before a new one can be issued.`,
              [
                {
                  text: 'Contact Support',
                  onPress: () => {
                    Alert.alert(
                      'Support Contact',
                      'For policy cancellation or transfer:\n\nPhone: 0700 123 456\nEmail: support@patabima.com',
                      [{ text: 'OK' }]
                    );
                  }
                },
                {
                  text: 'Go Back',
                  style: 'cancel',
                  onPress: () => {
                    if (onSubmissionError) {
                      onSubmissionError(new Error('DMVIC blocked: Active coverage exists'));
                    } else {
                      navigation.goBack();
                    }
                  }
                }
              ],
              { cancelable: false }
            );
            return; // BLOCK submission
          } else {
            console.log('[PolicySubmission] ✅ DMVIC check passed: No active cover found');
          }
        } catch (error) {
          // Log but don't block - network errors shouldn't prevent policy creation
          console.warn('[PolicySubmission] ⚠️ DMVIC check failed (network error - non-blocking):', error.message);
          console.warn('[PolicySubmission] Continuing with policy creation...');
        }
      } else {
        console.warn('[PolicySubmission] ⚠️ No registration number - skipping DMVIC check');
      }

      // Step 3: Create policy using the proper API service method
      setStep(3);
      setProgress('Creating policy...');
      const djangoAPI = DjangoAPIService;
      await djangoAPI.initialize(); // Ensure service is initialized
      
      // Add allowProceed flag to policy data if user chose to proceed anyway
      if (allowProceed) {
        sanitizedPolicyData.allowProceed = true;
      }
      
      let response;
      try {
        response = await djangoAPI.createMotorPolicy(sanitizedPolicyData);
        console.log('[PolicySubmission] ✅ Policy created:', response);
      } catch (apiError) {
        console.error('[PolicySubmission] ❌ API Error:', apiError);
        // Handle HTTP 409 Conflict - Duplicate Policy
        if (apiError.status === 409 || apiError.statusCode === 409) {
          const errorData = apiError.payload || apiError.response?.data || {};
          
          // Check if it's a duplicate policy error
          if (errorData.error?.includes('Duplicate policy') || errorData.existing_policies) {
            console.warn('[PolicySubmission] ❌ DUPLICATE POLICY BLOCKED:', errorData);
            
            const existingPolicies = errorData.existing_policies || [];
            const policyList = existingPolicies.map(p => 
              `• ${p.policy_number}\n  ${p.product} - ${p.underwriter}\n  Coverage: ${p.cover_start} to ${p.cover_end}\n  Status: ${p.status}`
            ).join('\n\n');
            
            // Clear guard to allow going back
            await AsyncStorage.removeItem('policy_submission_guard');
            
            // Show BLOCKING alert - NO option to proceed
            Alert.alert(
              '⚠️ Duplicate Policy Blocked',
              `CANNOT CREATE NEW POLICY\n\nAn active policy already exists for this vehicle:\n\n${policyList}\n\n` +
              `DMVIC regulations prohibit multiple active policies for the same vehicle. ` +
              `To create a new policy, please cancel or wait for the existing policy to expire.`,
              [
                {
                  text: 'Go Back',
                  style: 'default',
                  onPress: () => {
                    if (onSubmissionError) {
                      onSubmissionError(new Error('Duplicate policy blocked by DMVIC regulations'));
                    } else {
                      navigation.goBack();
                    }
                  }
                },
                {
                  text: 'View Policies',
                  style: 'default',
                  onPress: () => {
                    // Navigate to Quotations tab to view all policies
                    navigation.navigate('MainTabs', { screen: 'Quotations' });
                  }
                }
              ],
              { cancelable: false }
            );
            return; // BLOCK submission completely
          }
          
          // Check if it's a DMVIC double-insurance error
          if (errorData.error?.includes('DMVIC') || errorData.dmvic_policy) {
            console.warn('[PolicySubmission] ❌ DMVIC DOUBLE-INSURANCE BLOCKED:', errorData);
            
            const dmvicPol = errorData.dmvic_policy || {};
            const dmvicInfo = `Policy: ${dmvicPol.policy_number || 'Unknown'}\n` +
                            `Underwriter: ${dmvicPol.underwriter || 'Unknown'}\n` +
                            `Cover Type: ${dmvicPol.cover_type || 'Unknown'}\n` +
                            `Expiry: ${dmvicPol.expiry_date || 'Unknown'}`;
            
            // Clear guard
            await AsyncStorage.removeItem('policy_submission_guard');
            
            // Show BLOCKING alert for DMVIC conflict
            Alert.alert(
              '⚠️ DMVIC Insurance Conflict',
              `CANNOT CREATE NEW POLICY\n\nDMVIC database shows this vehicle already has active insurance coverage:\n\n${dmvicInfo}\n\n` +
              `Creating duplicate coverage violates Kenyan insurance regulations and DMVIC rules. ` +
              `The existing policy must be cancelled before a new one can be issued.`,
              [
                {
                  text: 'Contact Support',
                  onPress: () => {
                    // Navigate to support or show contact info
                    Alert.alert(
                      'Support Contact',
                      'Please contact our support team:\n\nPhone: 0700 123 456\nEmail: support@patabima.com',
                      [{ text: 'OK' }]
                    );
                  }
                },
                {
                  text: 'Go Back',
                  style: 'cancel',
                  onPress: () => {
                    if (onSubmissionError) {
                      onSubmissionError(new Error('DMVIC double-insurance blocked'));
                    } else {
                      navigation.goBack();
                    }
                  }
                }
              ],
              { cancelable: false }
            );
            return; // BLOCK submission completely
          }
        }
        
        // Re-throw other errors
        throw apiError;
      }
      
      if (!response || (!response.success && !response.policyNumber && !response.policy_number)) {
        throw new Error(response?.message || 'Policy creation failed - no response from server');
      }

      // Step 4: Finalize
      setStep(4);
      setProgress('Policy created successfully!');
      
      await new Promise(resolve => setTimeout(resolve, 800));

      // Complete submission
      const result = {
        policyNumber: response.policyNumber || response.policy_number || `POL-${Date.now()}`,
        policyId: response.policyId || response.policy_id || response.id,
        pdfUrl: response.pdfUrl || response.pdf_url || null,
        message: response.message || 'Policy created successfully',
        dmvicCertificate: response.dmvic_certificate || response.certificate || null
      };

      console.log('✅ Policy created successfully!');
      console.log('Policy Number:', result.policyNumber);
      console.log('Policy ID:', result.policyId);
      console.log('DMVIC Certificate:', result.dmvicCertificate);

      // Alert user if DMVIC certificate issuance is pending
      if (result.dmvicCertificate?.status === 'PENDING') {
        setTimeout(() => {
          Alert.alert(
            '⚠️ Certificate Pending',
            `Your policy ${result.policyNumber} has been created successfully!\n\n` +
            `However, DMVIC certificate issuance is pending:\n` +
            `${result.dmvicCertificate.error || 'Certificate will be issued shortly.'}\n\n` +
            `${result.dmvicCertificate.action_required || 'The certificate will be available within 24 hours.'}`,
            [{ text: 'OK', style: 'default' }]
          );
        }, 1500);
      }

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

      {/* DMVIC Double-Insurance BLOCKED Modal - Informational Only */}
      <DoubleInsuranceWarningModal
        visible={showDoubleInsuranceModal}
        dmvicPolicy={dmvicPolicy}
        onClose={() => {
          console.log('[PolicySubmission] ❌ DMVIC double-insurance - submission blocked');
          setShowDoubleInsuranceModal(false);
          // Remove guard and navigate back
          AsyncStorage.removeItem('policy_submission_guard').catch(console.warn);
          if (onSubmissionError) {
            onSubmissionError(new Error('DMVIC blocked: Active insurance coverage detected'));
          } else {
            navigation.goBack();
          }
        }}
        // NO onProceed - DMVIC authority is final, cannot bypass
      />
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
