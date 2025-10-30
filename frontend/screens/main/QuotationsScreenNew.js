import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, TextInput, Alert, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../constants';
import { QuoteStorageService, PricingService, PDFService, PaymentService } from '../../shared/services';
import { SafeScreen, EnhancedCard, StatusBadge, ActionButton, SkeletonCard, CompactCurvedHeader } from '../../components';
import djangoAPI from '../../services/DjangoAPIService';
import { getCategoryLabel, getProductLabel } from '../../constants/insuranceCatalog';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppData } from '../../contexts/AppDataContext';

export default function QuotationsScreenNew({ route }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedQuote, setExpandedQuote] = useState(null);
  const [toast, setToast] = useState(null);
  const [isRefreshingRemote, setIsRefreshingRemote] = useState(false); // kept internal to throttle fetch; no UI banner
  const [prefilledFromStorage, setPrefilledFromStorage] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const abortRef = useRef(null);
  const deletedRef = useRef(new Set()); // in-memory cache of tombstones
  const DELETED_KEY = 'quotation_deleted_tombstones_v1';
  const { legacyQuotes, manualQuotes, motorPolicies, fetchLegacyQuotes, fetchManualQuotes, fetchMotorPolicies } = useAppData();

  const filters = ['All', 'Draft', 'Active', 'Paid', 'Motor', 'Medical', 'WIBA', 'Last Expense', 'Travel', 'Personal Accident'];

  // Derived list: apply active filter + search + default sort (newest first)
  const filteredQuotes = useMemo(() => {
    let list = Array.isArray(quotes) ? quotes.slice() : [];

    // Filter by active filter (category or status)
    if (activeFilter && activeFilter !== 'All') {
      const f = String(activeFilter).toLowerCase();
      if (['motor','medical','wiba','last expense','travel','personal accident'].includes(f)) {
        list = list.filter((q) => {
          if (f === 'motor') return q?.isMotor || q?.category === 'MOTOR';
          if (f === 'medical') return q?.isMedical || q?.category === 'MEDICAL';
          if (f === 'wiba') return q?.category === 'WIBA';
          if (f === 'travel') return q?.category === 'TRAVEL';
          if (f === 'last expense') return q?.category === 'LAST_EXPENSE';
          if (f === 'personal accident') return q?.category === 'PERSONAL_ACCIDENT';
          return true;
        });
      } else {
        // Status based
        list = list.filter((q) => q?.status === f);
      }
    }

    // Search filter
    const s = (searchQuery || '').trim().toLowerCase();
    if (s) {
      list = list.filter((item) => {
        return (
          String(item?.id || '').toLowerCase().includes(s) ||
          String(item?.policyNumber || '').toLowerCase().includes(s) ||
          String(item?.productName || '').toLowerCase().includes(s) ||
          String(item?.clientInfo?.name || '').toLowerCase().includes(s) ||
          String(item?.vehicleDetails?.registrationNumber || '').toLowerCase().includes(s)
        );
      });
    }

    // Sort newest first by createdAt
    list.sort((a, b) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return db - da;
    });

    return list;
  }, [quotes, activeFilter, searchQuery]);

  // Helper: map backend status to UI filters
  const mapStatus = (status) => {
    if (!status) return 'draft';
    const s = String(status).toUpperCase();
    
    // Map various backend statuses to UI filter categories
    if (s === 'ISSUED' || s === 'ACTIVE') return 'active';
    if (s === 'PAID' || s === 'SUCCESS' || s === 'CONFIRMED') return 'paid';
    if (s === 'SUBMITTED' || s === 'APPLIED') return 'paid'; // Treat submitted as paid
    if (s === 'DRAFT' || s === 'PENDING' || s === 'PENDING_PAYMENT') return 'draft';
    
    // Handle underscore variations
    if (s.includes('PENDING')) return 'draft';
    if (s.includes('PAID') || s.includes('SUCCESS')) return 'paid';
    if (s.includes('ACTIVE') || s.includes('ISSUED')) return 'active';
    
    return s.toLowerCase();
  };

  // Helper: map backend quote into UI structure used by this screen
  const mapBackendQuoteToUI = (q) => {
    const pick = (...keys) => keys.find(v => v !== undefined && v !== null && v !== '');
    // Robust numeric parser: handles strings like "4,563", "Ksh 4,563.50", etc.
    const num = (v) => {
      if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
      if (typeof v === 'string') {
        const cleaned = v.replace(/[,\s]/g, '').replace(/[^0-9.\-]/g, '');
        const parsed = parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };
    const from = (obj, paths) => {
      for (const p of paths) {
        try {
          const val = p.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
          if (val !== undefined && val !== null && val !== '') return val;
        } catch {}
      }
      return undefined;
    };

    const id = pick(
      q?.id, q?.quotation_id, q?.quote_id, q?.uuid, q?.reference, q?.ref, q?._id, q?.code,
      q?.policy_number // Motor 2 policy number
    ) || Math.floor(Math.random() * 1e6);

    const createdAt = pick(
      q?.date_created, q?.created_at, q?.created, q?.createdDate, q?.submitted_at,
      from(q, ['policy.created_at', 'meta.created_at'])
    ) || new Date().toISOString();

    const productNameRaw = pick(
      q?.product_name, q?.product_config_name, q?.product, q?.product_display_name,
      from(q, ['product.name', 'product_config.name', 'productDetails.name'])
    );

    // Precompute raw line & product names early to safely use later
    const rawLineName = (q?.line_name || q?.line || q?.product_line || q?.product_line_name || q?.lineKey || q?.line_key || '')
      .toString()
      .toLowerCase();
    const rawProductNameForCover = (q?.product_name || q?.product || q?.product_config_name || '').toString();

    // Form-data driven hints and pre-classification for medical
    const formDataRaw = q?.form_data || q?.formData || q?.inputs || {};
    const formDataMedicalHint = ['inpatientLimit','inpatient_limit','maternityCover','outpatientCover','numberOfChildren']
      .some(k => Object.prototype.hasOwnProperty.call(formDataRaw, k));
    const preIsMedical = rawLineName.includes('medical') ||
      rawProductNameForCover.toLowerCase().includes('medical') ||
      (q?.line_key || '').toString().toLowerCase().includes('medical') ||
      formDataMedicalHint;

    const make = pick(
      q?.vehicle_make, q?.make,
      from(q, ['motor_details.vehicle_make', 'vehicle.make', 'policy.vehicle_make',
              'vehicle_details.make'])
    ) || '—';
    const model = pick(
      q?.vehicle_model, q?.model,
      from(q, ['motor_details.vehicle_model', 'vehicle.model', 'policy.vehicle_model',
              'vehicle_details.model'])
    ) || '—';
    const year = pick(
      q?.vehicle_year,
      q?.year_of_manufacture,
      from(q, ['motor_details.vehicle_year', 'vehicle.year', 'policy.vehicle_year',
              'vehicle_details.year'])
    );
    const reg = pick(
      q?.vehicle_registration, q?.registration, q?.reg_no, q?.registration_number,
      from(q, ['motor_details.vehicle_registration', 'vehicle.registration', 'vehicle.reg_no',
              'vehicle_details.registration'])
    ) || '—';
    const engine = pick(
      q?.engine_number,
      from(q, ['motor_details.engine_number', 'vehicle.engine_number',
              'vehicle_details.engineNumber'])
    ) || '—';
    const chassis = pick(
      q?.chassis_number,
      from(q, ['motor_details.chassis_number', 'vehicle.chassis_number',
              'vehicle_details.chassisNumber'])
    ) || '—';

    // Cover metadata (type and dates)
    // Check for subcategory first (from Motor 2 policies), then fallback to other fields
    const coverTypeRaw = pick(
      q?.subcategory, // Motor 2 policies return this field
      q?.coverType,   // Also from serializer
      q?.cover_type, q?.cover, q?.coverage_type, q?.coverage, q?.type,
      from(q, ['product_details.subcategory', 'policy.cover_type', 'policy.coverage_type'])
    );
    
    // Check if extendible payment plan
    const paymentPlan = pick(
      from(q, ['product_details.payment_plan', 'product_details.paymentPlan']),
      q?.payment_plan,
      q?.paymentPlan
    );
    const isExtendibleProduct = paymentPlan === 'EXTENDIBLE' || 
      q?.isExtendible || 
      from(q, ['product_details.is_extendible']);
    
    // Format cover type for display
    let coverType = (coverTypeRaw || productNameRaw || 'Standard').toString();
    
    // Use product label formatter if available
    const formattedCoverType = getProductLabel(coverType) || coverType.replace(/_/g, ' ');
    
    // Add "(Extendible)" suffix if it's an extendible product
    coverType = isExtendibleProduct ? `${formattedCoverType} (Extendible)` : formattedCoverType;

    const rawCoverStart = pick(
      q?.cover_start_date, q?.cover_start, q?.start_date, q?.policy_start, q?.coverStartDate,
      from(q, ['policy.start_date', 'policy.cover_start', 'policy.cover_start_date',
              'vehicle_details.cover_start_date', 'vehicle_details.coverStartDate',
              'product_details.cover_start_date'])
    );
    const rawCoverEnd = pick(
      q?.cover_end_date, q?.cover_end, q?.end_date, q?.policy_end, q?.coverEndDate,
      from(q, ['policy.end_date', 'policy.cover_end', 'policy.cover_end_date',
              'vehicle_details.cover_end_date', 'vehicle_details.coverEndDate',
              'product_details.cover_end_date'])
    );
    const toISOorNull = (v) => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };
    const coverStart = toISOorNull(rawCoverStart) || createdAt;
    const coverEnd = toISOorNull(rawCoverEnd) || (() => {
      const d = new Date(coverStart);
      if (isNaN(d.getTime())) return null;
      d.setMonth(d.getMonth() + 12);
      return d.toISOString();
    })();

    // Pricing (initial values from backend if present)
    let basic = num(pick(
      q?.base_premium, q?.premium_amount, 
      from(q, ['premium.basic', 'pricing.basic', 'calculated_premium.basic',
              'premium_breakdown.base_premium', 'premium_breakdown.basicPremium',
              'mandatory_levies.base_premium', 'breakdown.base', 'premium_breakdown.base',
              'result.premium'])
    ));
    
    // Training Levy (ITL - 0.25%)
    let itl = num(pick(
      q?.training_levy, 
      from(q, ['premium.training_levy', 'pricing.trainingLevy',
              'premium_breakdown.training_levy', 'premium_breakdown.trainingLevy',
              'premium_breakdown.insurance_training_levy', 'premium_breakdown.itl_levy',
              'mandatory_levies.insurance_training_levy'])
    ));
    
    // PCF Levy (0.25%)
    let pcf = num(pick(
      q?.pcf_levy, q?.phcf,
      from(q, ['premium.pcf_levy', 'pricing.pcf',
              'premium_breakdown.pcf_levy', 'premium_breakdown.pcfLevy',
              'mandatory_levies.pcf_levy'])
    ));
    
    // Stamp Duty (fixed 40)
    let stamp = num(pick(
      q?.stamp_duty, 
      from(q, ['premium.stamp_duty', 'pricing.stampDuty',
              'premium_breakdown.stamp_duty', 'premium_breakdown.stampDuty',
              'mandatory_levies.stamp_duty'])
    ));
    
    let vat = num(pick(q?.vat, from(q, ['premium.vat', 'pricing.vat', 'premium_breakdown.vat'])));
    
    // Total levies
    let totalLevies = itl + pcf + stamp + vat;
    
    // Total premium
    let total = num(pick(
      q?.total_premium, q?.premium_total, 
      from(q, ['pricing.total', 'calculated_premium.total',
              'premium_breakdown.total_amount', 'premium_breakdown.totalAmount',
              'premium_breakdown.total_premium'])
    )) || (basic + totalLevies);

    // If basic premium missing but we have a valid total, derive basic from total - levies
    if ((!basic || basic <= 0) && Number.isFinite(total) && total > 0) {
      const derivedBase = total - (itl + pcf + stamp + vat);
      if (derivedBase > 0) basic = Math.round(derivedBase * 100) / 100;
    }

    // FIX: Calculate levies if we have basic premium but levies are zero
    if (basic > 0) {
      if (itl === 0) {
        itl = Math.round(basic * 0.0025 * 100) / 100; // 0.25% ITL
      }
      if (pcf === 0) {
        pcf = Math.round(basic * 0.0025 * 100) / 100; // 0.25% PCF
      }
      if (stamp === 0) {
        stamp = 40; // Fixed KES 40
      }
      // Recalculate total if it was zero but we now have levies
      if (total === 0) {
        totalLevies = itl + pcf + stamp + vat;
        total = basic + totalLevies;
      }
    }

    // Fallback: compute on client using backend's formula when pricing missing
    const computeFallbackPremium = () => {
      const currentYear = new Date().getFullYear();
      const y = parseInt(year, 10);
      if (!y || y < 1950 || y > currentYear + 1) return null;
      let base = 3000;
      const age = currentYear - y;
      if (age > 10) base += 500; else if (age > 5) base += 200;
      const isComprehensive = String(coverTypeRaw).toUpperCase().includes('COMPREHENSIVE');
      if (isComprehensive) base = base * 1.5;
      const itlLevy = Math.round(base * 0.0025 * 100) / 100; // ITL 0.25%
      const pcfLevy = Math.round(base * 0.0025 * 100) / 100; // PCF 0.25%
      const sd = 40;
      const tx = itlLevy + pcfLevy + sd;
      const tt = base + tx;
      return { base, itl: itlLevy, pcf: pcfLevy, sd, tx, tt };
    };

    if ((basic === 0 && total === 0) || (!Number.isFinite(total) || total <= 0)) {
      const fb = computeFallbackPremium();
      if (fb) {
        basic = fb.base;
        itl = fb.itl;
        pcf = fb.pcf;
        stamp = fb.sd;
        vat = 0;
        totalLevies = fb.tx;
        total = fb.tt;
      }
    }

    const clientName = pick(
      q?.owner_name, q?.client_name,
      from(q, ['motor_details.owner_name', 'client.name', 'insured.name', 'customer.name',
              'client_details.fullName', 'client_details.firstName'])
    ) || '—';
    const clientPhone = pick(
      q?.owner_phone,
      from(q, ['motor_details.owner_phone', 'client.phone', 'insured.phone', 'customer.phone',
              'client_details.phone'])
    ) || '—';
    const clientEmail = pick(
      q?.owner_email,
      from(q, ['motor_details.owner_email', 'client.email', 'insured.email', 'customer.email',
              'client_details.email'])
    ) || '—';

    // Extract underwriter name (handle Motor 2 format)
    const underwriterName = pick(
      q?.selected_underwriter,
      q?.underwriter_name,
      from(q, ['underwriter.name', 'pricing.underwriterName',
              'underwriter_details.name', 'underwriterDetails.name',
              'underwriterDetails.company'])
    ) || '';

    // Add policy number if available (Motor 2)
    const policyNumber = pick(q?.policy_number, q?.policyNumber) || null;

    // Detect medical quotes (saved manual pricing) by line/product naming
    // Reuse earlier rawLineName; compute rawProductName for detection
  const rawProductName = (q?.product_name || q?.product || q?.product_config_name || '').toString().toLowerCase();
  const isMedical = preIsMedical || rawProductName.includes('medical');
  // Robust Motor detection: include Motor 2 structures (policy_number, category_code) and common category hints
  const motorHints = [
    q?.__source, q?.policy_number, q?.category_code, q?.category, q?.category_name, q?.categoryCode,
    q?.subcategory_code, q?.subcategory, q?.subcategory_name, q?.cover_type
  ].filter(Boolean).map(v => String(v).toLowerCase()).join(' ');
  const motorKeywords = ['motor','vehicle','psv','tuktuk','motorcycle','private','commercial','special'];
  // Only classify as motor if not already medical
  const isMotor = !isMedical && (
    ['motor2'].includes(q?.__source) ||
    !!q?.policy_number ||
    motorKeywords.some(k => rawLineName.includes(k)) ||
    motorKeywords.some(k => motorHints.includes(k))
  );
  const isWiba = rawLineName.includes('wiba');
  const isLastExpense = rawLineName.includes('last') || rawLineName.includes('funeral') || rawLineName.includes('burial');
  const isPersonalAccident = rawLineName.includes('personal accident') ||
    (rawLineName.includes('personal') && rawLineName.includes('accident')) ||
    (String(q?.line_key || '').toUpperCase() === 'PERSONAL_ACCIDENT') ||
    rawProductName.includes('personal accident');
  const isTravel = rawLineName.includes('travel');
  const category = isMotor ? 'MOTOR' : isMedical ? 'MEDICAL' : isWiba ? 'WIBA' : isLastExpense ? 'LAST_EXPENSE' : isPersonalAccident ? 'PERSONAL_ACCIDENT' : isTravel ? 'TRAVEL' : 'OTHER';

    // Determine manual medical processing state.
    // Pending: draft/pending statuses without pricing totals
    // Processed: any non-draft (approved/paid/active) or presence of a non-zero total premium
    let manualMedicalStatus = null;
    if (isMedical) {
      const backendStatus = (q?.status || '').toString().toUpperCase();
      const hasPremium = Number(total) > 0;
      if (['ACTIVE','ISSUED','PAID','APPROVED','SUBMITTED','PROCESSED'].some(s => backendStatus.includes(s)) || hasPremium) {
        manualMedicalStatus = 'processed';
      } else {
        manualMedicalStatus = 'pending';
      }
    }

    // Extract medical summary if present in generic stored form data (only when backend includes it in raw object)
    let medicalSummary = null;
    if (isMedical) {
      const formData = q?.form_data || q?.formData || q?.inputs || q?.client_inputs || {};
      if (Object.keys(formData).length) {
        medicalSummary = {
          inpatientLimit: formData.inpatientLimit || formData.inpatient_limit || null,
          outpatientCover: !!(formData.outpatientCover || formData.outpatient_cover),
          maternityCover: !!(formData.maternityCover || formData.maternity_cover),
          age: formData.age || null,
          spouseAge: formData.spouseAge || formData.spouse_age || null,
          numberOfChildren: formData.numberOfChildren || formData.children_count || null,
        };
      }
    }

    // If medical, force coverType to Medical (productName or fallback)
    if (isMedical) {
      coverType = (productNameRaw || 'Medical').toString().replace(/_/g, ' ');
    }

    // GUID suppression & label normalization
    const looksLikeGuid = (val) => typeof val === 'string' && /^[0-9a-fA-F-]{32,36}$/.test(val);
    let displayProductName = productNameRaw;
    if (!displayProductName || looksLikeGuid(displayProductName)) {
      // Try alternative product code fields
      const possibleCode = pick(q?.product_code, q?.code, q?.productCode);
      if (possibleCode && !looksLikeGuid(possibleCode)) displayProductName = possibleCode;
    }
    // Map via catalog helper
    displayProductName = getProductLabel(displayProductName) || (isMedical ? 'Medical Insurance' : coverType);
    // Final safeguard: if still looks like guid, replace with category label
    if (looksLikeGuid(displayProductName)) {
      displayProductName = getCategoryLabel(isMedical ? 'MEDICAL' : (isMotor ? 'MOTOR' : category));
    }

    return {
      id,
      originalQuoteNumber: q?.quote_number || null,
      policyNumber, // Include policy number for Motor 2 policies
      status: mapStatus(q?.status),
      createdAt,
      category,
      vehicleDetails: {
        make,
        model,
        year: year ? String(year) : 'N/A',
  registrationNumber: (reg || '').toUpperCase(),
        engineNumber: engine,
        chassisNumber: chassis,
      },
      coverageDetails: {
        type: coverType,
        period: '12 months',
        startDate: coverStart,
        endDate: coverEnd,
      },
      calculatedPremium: {
        basicPremium: basic,
        trainingLevy: itl,
        pcfLevy: pcf,
        stampDuty: stamp,
        vat: vat,
        totalLevies: totalLevies,
        totalPremium: total,
        discount: 0,
      },
      underwriterName,
      clientInfo: {
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
      },
      isMedical,
      isMotor,
      showPricing: category === 'MOTOR',
  productName: displayProductName,
      manualMedicalStatus,
      medicalSummary,
    };
  };

  // Map ManualQuote objects to UI format
  const mapManualQuoteToUI = (manualQuote) => {
    const lineKey = manualQuote.line_key;
    const isMedical = lineKey === 'MEDICAL';
    const isTravel = lineKey === 'TRAVEL';
    const isLastExpense = lineKey === 'LAST_EXPENSE';
    const isWiba = lineKey === 'WIBA';
    const isPersonalAccident = lineKey === 'PERSONAL_ACCIDENT';
    
    // Determine category and product name based on line_key
    let category, productName;
    if (isMedical) {
      category = 'MEDICAL';
      productName = 'Medical Insurance';
    } else if (isTravel) {
      category = 'TRAVEL';
      productName = 'Travel Insurance';
    } else if (isLastExpense) {
      category = 'LAST_EXPENSE';
      productName = 'Last Expense Insurance';
    } else if (isWiba) {
      category = 'WIBA';
      productName = 'WIBA Insurance';
    } else if (isPersonalAccident) {
      category = 'PERSONAL_ACCIDENT';
      productName = 'Personal Accident Insurance';
    } else {
      category = 'OTHER';
      productName = 'Insurance';
    }

    return {
      id: `manual-${manualQuote.reference}`,
      originalQuoteNumber: manualQuote.reference,
      status: mapManualQuoteStatus(manualQuote.status),
      createdAt: manualQuote.created_at,
      updatedAt: manualQuote.updated_at,
      isMedical,
      isMotor: false,
      isWiba,
      isLastExpense,
      isTravel,
      isPersonalAccident,
      category,
      productName,
      manualMedicalStatus: mapManualQuoteStatus(manualQuote.status),
      manualQuoteData: manualQuote, // Store full manual quote data
      showPricing: manualQuote.status === 'COMPLETED' && manualQuote.computed_premium,
      calculatedPremium: manualQuote.computed_premium ? {
        totalPremium: parseFloat(manualQuote.computed_premium) || 0,
        basicPremium: parseFloat(manualQuote.computed_premium) || 0,
        trainingLevy: manualQuote.levies_breakdown?.itl ? parseFloat(manualQuote.levies_breakdown.itl) : 0,
        pcfLevy: manualQuote.levies_breakdown?.pcf ? parseFloat(manualQuote.levies_breakdown.pcf) : 0,
        stampDuty: manualQuote.levies_breakdown?.stamp_duty ? parseFloat(manualQuote.levies_breakdown.stamp_duty) : 0,
        totalLevies: Object.values(manualQuote.levies_breakdown || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
      } : null,
      clientInfo: {
        name: manualQuote.payload?.client_name || manualQuote.payload?.fullName || manualQuote.payload?.clientName || 'N/A',
        email: manualQuote.payload?.email || manualQuote.payload?.clientEmail || '',
        phone: manualQuote.payload?.phone || manualQuote.payload?.phoneNumber || '',
      },
      medicalSummary: isMedical && manualQuote.payload ? {
        inpatientLimit: manualQuote.payload.inpatientLimit,
        outpatientCover: manualQuote.payload.outpatientCover,
        maternityCover: manualQuote.payload.maternityCover,
        age: manualQuote.payload.age,
        spouseAge: manualQuote.payload.spouseAge,
        numberOfChildren: manualQuote.payload.numberOfChildren,
      } : null,
      coverageDetails: {
        type: productName,
        period: '12 months'
      },
      __source: 'manual_quote'
    };
  };

  // Map ManualQuote status to display status
  const mapManualQuoteStatus = (status) => {
    const statusMap = {
      'PENDING_ADMIN_REVIEW': 'pending',
      'IN_PROGRESS': 'processing', 
      'COMPLETED': 'completed',
      'REJECTED': 'rejected'
    };
    return statusMap[status] || 'pending';
  };

  // Get status text for manual quotes
  const getManualQuoteStatusText = (quote) => {
    if (quote.manualQuoteData) {
      // This is a ManualQuote
      const status = quote.manualQuoteData.status;
      const statusTexts = {
        'PENDING_ADMIN_REVIEW': 'Pending Admin Review',
        'IN_PROGRESS': 'Admin Processing',
        'COMPLETED': 'Pricing Complete',
        'REJECTED': 'Quote Rejected'
      };
      const referenceText = quote.manualQuoteData.reference ? ` • ${quote.manualQuoteData.reference}` : '';
      return (statusTexts[status] || 'Pending Manual Pricing') + referenceText;
    } else {
      // Legacy medical quote
      return quote.manualMedicalStatus === 'processed' ? 'Processed' : 'Pending Manual Pricing';
    }
  };

  // Get status style for manual quotes
  const getManualQuoteStatusStyle = (quote) => {
    if (quote.manualQuoteData) {
      const status = quote.manualQuoteData.status;
      const statusStyles = {
        'PENDING_ADMIN_REVIEW': styles.statusPending,
        'IN_PROGRESS': styles.statusProcessing,
        'COMPLETED': styles.statusCompleted,
        'REJECTED': styles.statusRejected
      };
      return statusStyles[status] || styles.statusPending;
    }
    return quote.manualMedicalStatus === 'processed' ? styles.statusCompleted : styles.statusPending;
  };

  // Load quotes on component mount (prefill from storage, then refresh from network with timeout)
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        await djangoAPI.initialize();
      } catch {}

      // Load tombstones first
      try {
        const rawDeleted = await AsyncStorage.getItem(DELETED_KEY);
        if (rawDeleted) {
          const arr = JSON.parse(rawDeleted);
            if (Array.isArray(arr)) deletedRef.current = new Set(arr);
        }
      } catch (e) { console.warn('[Quotes] Failed loading deleted tombstones', e?.message); }

      // 1) Fast prefill from local storage (if any)
      try {
        const storedQuotes = await QuoteStorageService.getAllQuotes();
        if (mounted && Array.isArray(storedQuotes) && storedQuotes.length > 0) {
          // Filter out locally deleted ones
          const filtered = storedQuotes.filter(q => !deletedRef.current.has(q.id) && !deletedRef.current.has(q.originalQuoteNumber));
          setQuotes(filtered);
          setPrefilledFromStorage(true);
          setLoading(false); // Stop skeletons early since we have something to show
        }
      } catch {}

      // 2) Refresh from remote with abort/timeout; be silent on error if we already have local data
      await fetchRemoteQuotes({ silentOnError: true });
      if (mounted) setLoading(false);
    };
    run();

    // Cleanup: abort any in-flight request on unmount
    return () => {
      mounted = false;
      try {
        if (abortRef.current) abortRef.current.abort();
      } catch {}
    };
  }, []);

  // React to incoming params for filter/focus (e.g., after submission)
  useEffect(() => {
    if (!route?.params) return;
    const { filter, focusId, justSubmitted, message, forceRefresh } = route.params;
    if (filter) setActiveFilter(filter);
    if (focusId) setExpandedQuote(focusId);
    if (justSubmitted) {
      setToast(message || 'Quotation submitted successfully');
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
    if (forceRefresh) {
      // Trigger remote refetch then clear flag to avoid loops
      fetchRemoteQuotes({ silentOnError: true }).finally(() => {
        try {
          navigation.setParams({ ...route.params, forceRefresh: false });
        } catch {}
      });
    }
  }, [route?.params]);

  // Remote fetch with AbortController and 8s timeout
  const fetchRemoteQuotes = async ({ silentOnError = false } = {}) => {
    // Don't fetch if user is not authenticated
    if (!djangoAPI.isAuthenticated()) {
      console.log('⚠️ Skipping remote fetch - user not authenticated');
      setIsRefreshingRemote(false);
      return;
    }

    setIsRefreshingRemote(true);
    // Abort any previous in-flight request
    try { if (abortRef.current) abortRef.current.abort(); } catch {}
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => {
      try { controller.abort(); } catch {}
    }, 8000);

    try {
      // Centralized fetch via context (caches + TTLs)
      const [legacy, manual, motor] = await Promise.all([
        fetchLegacyQuotes(),
        fetchManualQuotes(),
        fetchMotorPolicies(),
      ]);
      // Map and merge
      let allQuotes = [];
      const legacyMapped = (legacy || []).map(mapBackendQuoteToUI);
      const manualMapped = (manual || []).map(mapManualQuoteToUI);
      const motorMapped = (motor || []).map(mapBackendQuoteToUI);
      allQuotes = [...legacyMapped, ...motorMapped, ...manualMapped];

      // Deduplicate quotes by reference/id
      const seen = new Set();
      allQuotes = allQuotes.filter(q => {
        const key = q.originalQuoteNumber || q.id;
        if (seen.has(key)) {
          console.log('🔄 Skipping duplicate quote:', key);
          return false;
        }
        seen.add(key);
        return true;
      });

      // Update state if we have any quotes
      if (allQuotes.length > 0) {
        // Sort by creation date (newest first)
        allQuotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Exclude tombstoned quotes (by both id and originalQuoteNumber)
        const tombs = deletedRef.current;
        allQuotes = allQuotes.filter(q => !tombs.has(q.id) && !tombs.has(q.originalQuoteNumber));
        
        // Debug: Log status distribution
        const statusCounts = allQuotes.reduce((acc, q) => {
          acc[q.status] = (acc[q.status] || 0) + 1;
          return acc;
        }, {});
        const medicalManualCounts = allQuotes.filter(q => q.isMedical).reduce((acc, q) => {
          if (q.manualQuoteData) {
            // Track ManualQuote by actual status
            const status = q.manualQuoteData.status;
            acc[`manual-${status}`] = (acc[`manual-${status}`] || 0) + 1;
          } else {
            // Track legacy quotes
            const key = q.manualMedicalStatus || 'unknown';
            acc[`legacy-${key}`] = (acc[`legacy-${key}`] || 0) + 1;
          }
          return acc;
        }, {});
        const sourceCounts = allQuotes.reduce((acc, q) => {
          acc[q.__source || 'unknown'] = (acc[q.__source || 'unknown'] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Quotes Status Distribution:', statusCounts);
        if (Object.keys(medicalManualCounts).length) {
          console.log('🩺 Medical Manual Status Distribution:', medicalManualCounts);
        }
        console.log('📌 Source Distribution:', sourceCounts);
        console.log('Total quotes loaded:', allQuotes.length);
        
        setQuotes(allQuotes);
        setPrefilledFromStorage(false);
        
        // If current filter has no items but quotes exist, switch to 'All'
        if (activeFilter !== 'All') {
          const hasInFilter = allQuotes.some(q => q.status === activeFilter.toLowerCase());
          if (!hasInFilter) setActiveFilter('All');
        }
      } else if (!prefilledFromStorage) {
        setQuotes([]);
      }
    } catch (error) {
      const aborted = typeof error?.name === 'string' && error.name === 'AbortError';
      if (!aborted) {
        console.error('Error refreshing quotes:', error);
        if (!silentOnError) Alert.alert('Error', 'Failed to refresh quotes');
      }
    } finally {
      clearTimeout(timer);
      setIsRefreshingRemote(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRemoteQuotes({ silentOnError: false });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    Alert.alert(
      'Delete Quote',
      'Are you sure you want to delete this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const target = quotes.find(q => q.id === quoteId);
              const backendId = target?.originalQuoteNumber; // only available for generic/medical
              // Optimistic remove
              const previous = quotes;
              setQuotes(prev => prev.filter(q => q.id !== quoteId));
              if (backendId) {
                try {
                  await djangoAPI.deleteGenericQuote(backendId);
                } catch (e) {
                  // Rollback on failure
                  setQuotes(previous);
                  Alert.alert('Error', e?.message || 'Failed to delete quote on server');
                  return;
                }
              }
              // Persist tombstone so refresh won't bring it back
              try {
                const tombs = deletedRef.current;
                tombs.add(quoteId);
                if (backendId) tombs.add(backendId);
                await AsyncStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(tombs)));
              } catch (e) { console.warn('[Quotes] Failed persisting tombstone', e?.message); }
              Alert.alert('Success', backendId ? 'Quote deleted' : 'Quote removed locally');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete quote');
            }
          }
        }
      ]
    );
  };

  const handleQuoteSupport = (quote) => {
    Alert.alert(
      'Quote Support',
      `Need help with your quote for ${quote.vehicleDetails?.make} ${quote.vehicleDetails?.model}?\n\nOur support team is ready to assist you with:\n• Quote modifications\n• Coverage questions\n• Payment assistance\n• Policy details\n\nWould you like to contact support?`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Contact Support', onPress: () => {
          Alert.alert('Contact Support', 'Our support team will contact you within 2 hours during business hours.');
        }}
      ]
    );
  };

  const handleEditQuote = (quote) => {
    if (quote.isMedical) {
      // Navigate directly to medical quotation screen in edit mode
      try {
        navigation.navigate('EnhancedIndividualMedicalQuotation', { quoteNumber: quote.originalQuoteNumber || quote.id, edit: true });
      } catch (e) {
        console.warn('Navigation to medical edit failed', e?.message);
        Alert.alert('Navigation Error', 'Unable to open medical quote for editing');
      }
      return;
    }
    // Placeholder for motor or other lines edit support
    Alert.alert('Edit Unavailable', 'Editing is currently only supported for medical quotes.');
  };

  const handleApplyPolicy = (quote) => {
    // Navigate directly to payment since draft has all details
    if (quote.isMotor) {
      // Navigate to Motor 2 payment step with draft data
      navigation.navigate('Motor2Flow', {
        startAtPayment: true,
        resumeDraft: true,
        draftQuoteId: quote.id,
        policyNumber: quote.policyNumber,
        draftData: {
          quoteId: quote.id,
          policyNumber: quote.policyNumber,
          vehicleDetails: quote.vehicleDetails,
          clientInfo: quote.clientInfo,
          coverageDetails: quote.coverageDetails,
          premiumBreakdown: quote.calculatedPremium,
          underwriterName: quote.underwriterName,
          totalPremium: quote.calculatedPremium?.totalPremium || 0,
        }
      });
    } else if (quote.isMedical) {
      // Navigate to Medical payment with draft data
      navigation.navigate('EnhancedIndividualMedicalQuotation', {
        startAtPayment: true,
        resumeDraft: true,
        quoteNumber: quote.originalQuoteNumber || quote.id,
        draftData: quote.manualQuoteData || {},
        premiumAmount: quote.calculatedPremium?.totalPremium || 0,
      });
    } else {
      // Generic insurance - navigate to payment
      Alert.alert(
        'Apply Policy',
        `Continue to payment for ${quote.productName || 'this'} policy?\n\nTotal: ${PricingService.formatCurrency(quote.calculatedPremium?.totalPremium || 0)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed to Payment',
            onPress: () => {
              // Navigate to generic payment flow
              navigation.navigate('QuotationFlow', {
                category: quote.category,
                startAtPayment: true,
                resumeDraft: true,
                draftQuoteId: quote.id,
                draftData: quote,
                premiumAmount: quote.calculatedPremium?.totalPremium || 0,
              });
            }
          }
        ]
      );
    }
  };

  const handleCreateNewQuote = () => {
    Alert.alert(
      'Under Maintenance',
      'Our quotation system is currently under maintenance. We are working to improve your experience and will be back soon!',
      [
        { text: 'OK', style: 'default' },
        { text: 'Get Notified', onPress: () => {
          Alert.alert(
            'Notification Set',
            'You will be notified when the quotation system is available.',
            [{ text: 'OK' }]
          );
        }}
      ]
    );
  };

  const renderQuoteCard = ({ item: quote }) => (
    <EnhancedCard
      style={styles.quoteCard}
      onPress={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
    >
      {/* Top row: ID/Policy on left, status badges on right */}
      <View style={styles.topRow}>
        <Text style={quote.policyNumber ? styles.policyNumber : styles.quoteId}>
          {quote.policyNumber ? `Policy: ${quote.policyNumber}` : `Quote #${quote.id.toString().slice(-6)}`}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={quote.status} />
          {quote.isMedical && (
            <View
              style={[
                styles.medicalDot,
                quote.manualMedicalStatus === 'processed'
                  ? styles.medicalDotProcessed
                  : styles.medicalDotPending,
              ]}
            />
          )}
        </View>
      </View>

      {/* Title block: product/vehicle + secondary line */}
      <View style={styles.titleBlock}>
        {quote.isMedical ? (
          <>
            <Text style={styles.productName}>
              {quote.productName || 'Medical Quote'}
            </Text>
            <Text style={[styles.medicalStatusLine, getManualQuoteStatusStyle(quote)]}>
              {getManualQuoteStatusText(quote)}
            </Text>
          </>
        ) : quote.isMotor ? (
          <>
            <Text style={styles.vehicleInfo}>
              {quote.vehicleDetails?.make} {quote.vehicleDetails?.model}
            </Text>
            {!!(quote.vehicleDetails?.registrationNumber) && (
              <View style={styles.registrationPill}>
                <Text style={styles.registrationPillText}>
                  {(quote.vehicleDetails?.registrationNumber || '').toUpperCase()}
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.productName}>{quote.productName || quote.category}</Text>
        )}
      </View>

      {/* Insurance Provider - Show prominently for Motor quotes */}
      {quote.isMotor && quote.underwriterName && (
        <View style={styles.insuranceProviderRow}>
          <Text style={styles.insuranceProviderLabel}>Insurance Provider:</Text>
          <Text style={styles.insuranceProviderValue}>{quote.underwriterName}</Text>
        </View>
      )}

      {/* Key facts row */}
      <View style={styles.quickInfoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Created</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {new Date(quote.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Cover Period</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {quote.coverStart && quote.coverEnd 
              ? `${new Date(quote.coverStart).toLocaleDateString()} - ${new Date(quote.coverEnd).toLocaleDateString()}`
              : '—'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Type</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {quote.coverageDetails?.type || (quote.isMotor ? (quote.productName || 'Motor') : (quote.productName || '—'))}
          </Text>
        </View>
      </View>
      
      {/* Secondary info row */}
      <View style={styles.quickInfoRow}>
        {quote.isMedical ? (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, getManualQuoteStatusStyle(quote)]} numberOfLines={1}>
              {quote.manualQuoteData
                ? (quote.manualQuoteData.status?.replace(/_/g, ' ') || 'Pending')
                : 'Pending'}
            </Text>
          </View>
        ) : (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Client</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {quote.clientInfo?.name || '—'}
            </Text>
          </View>
        )}
      </View>

      {/* Premium row */}
      <View style={styles.premiumRow}>
        <Text style={styles.premiumLabel}>Total Premium</Text>
        {quote.showPricing ? (
          <Text style={styles.premiumAmount}>
            {PricingService.formatCurrency(quote.calculatedPremium?.totalPremium || 0)}
          </Text>
        ) : (
          <Text style={styles.noPricingPlaceholder}>—</Text>
        )}
      </View>

      {/* Apply Policy button for Draft (when not expanded) */}
      {quote.status === 'draft' && expandedQuote !== quote.id && (
        <TouchableOpacity 
          style={styles.applyPolicyButton}
          onPress={() => handleApplyPolicy(quote)}
        >
          <Text style={styles.applyPolicyButtonText}>Apply Policy →</Text>
        </TouchableOpacity>
      )}

      {expandedQuote === quote.id && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          
          <View style={styles.detailsGrid}>
            {quote.policyNumber && (
              <View style={[styles.detailItem, styles.fullWidth]}>
                <Text style={styles.detailLabel}>Policy Number</Text>
                <Text style={[styles.detailValue, styles.policyNumberValue]}>
                  {quote.policyNumber}
                </Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {new Date(quote.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.detailItem, styles.fullWidth]}>
              <Text style={styles.detailLabel}>Cover Period</Text>
              <Text style={styles.detailValue}>
                {quote.coverStart && quote.coverEnd 
                  ? `${new Date(quote.coverStart).toLocaleDateString()} - ${new Date(quote.coverEnd).toLocaleDateString()}`
                  : '—'}
              </Text>
            </View>
            {quote.isMotor && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Year</Text>
                <Text style={styles.detailValue}>
                  {quote.vehicleDetails?.year || 'N/A'}
                </Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Coverage</Text>
              <Text style={styles.detailValue}>
                {quote.coverageDetails?.type || 'Standard'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Period</Text>
              <Text style={styles.detailValue}>
                {quote.coverageDetails?.period || '12 months'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Client</Text>
              <Text style={styles.detailValue}>
                {quote.clientInfo?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{quote.isMedical ? 'Status' : 'Phone'}</Text>
              <Text style={styles.detailValue}>
                {quote.isMedical ? (quote.manualMedicalStatus === 'processed' ? 'Processed' : 'Pending Manual') : (quote.clientInfo?.phone || 'N/A')}
              </Text>
            </View>
            {quote.isMedical && quote.medicalSummary && (
              <View style={[styles.detailItem, styles.fullWidth]}>
                <Text style={styles.detailLabel}>Medical Summary</Text>
                <Text style={styles.detailValue}>
                  {(quote.medicalSummary.inpatientLimit ? `Inpatient: ${quote.medicalSummary.inpatientLimit}` : '')
                    + (quote.medicalSummary.outpatientCover ? '  • Outpatient' : '')
                    + (quote.medicalSummary.maternityCover ? '  • Maternity' : '')
                    + (quote.medicalSummary.age ? `  • Age: ${quote.medicalSummary.age}` : '')
                  }
                </Text>
              </View>
            )}
            {quote.showPricing && (
              <>
                {quote.underwriterName && (
                  <View style={[styles.detailItem, styles.fullWidth]}>
                    <Text style={styles.detailLabel}>Insurance Provider</Text>
                    <Text style={styles.detailValue}>
                      {quote.underwriterName}
                    </Text>
                  </View>
                )}
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Basic Premium</Text>
                  <Text style={styles.detailValue}>
                    {PricingService.formatCurrency(quote.calculatedPremium?.basicPremium || 0)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Training Levy (ITL)</Text>
                  <Text style={styles.detailValue}>
                    {PricingService.formatCurrency(quote.calculatedPremium?.trainingLevy || 0)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>PCF Levy</Text>
                  <Text style={styles.detailValue}>
                    {PricingService.formatCurrency(quote.calculatedPremium?.pcfLevy || 0)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Stamp Duty</Text>
                  <Text style={styles.detailValue}>
                    {PricingService.formatCurrency(quote.calculatedPremium?.stampDuty || 0)}
                  </Text>
                </View>
                <View style={[styles.detailItem, styles.totalRow]}>
                  <Text style={[styles.detailLabel, styles.totalLabel]}>Total Premium</Text>
                  <Text style={[styles.detailValue, styles.totalValue]}>
                    {PricingService.formatCurrency(quote.calculatedPremium?.totalPremium || 0)}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.actionButtons}>
            {/* Apply Policy button for Draft quotations */}
            {quote.status === 'draft' && (
              <ActionButton
                title="Apply Policy"
                variant="primary"
                size="small"
                onPress={() => handleApplyPolicy(quote)}
                style={styles.actionButtonSmall}
              />
            )}
            {quote.isMedical && quote.manualQuoteData && quote.manualQuoteData.status !== 'COMPLETED' && (
              <ActionButton
                title="💰 Price"
                variant="primary"
                size="small"
                onPress={() => navigation.navigate('AdminManualQuotePricing', { quoteReference: quote.originalQuoteNumber })}
                style={styles.actionButtonSmall}
              />
            )}
            <ActionButton
              title="Support"
              icon="?"
              variant="secondary"
              size="small"
              onPress={() => handleQuoteSupport(quote)}
              style={styles.actionButtonSmall}
            />
            {/* Edit and Delete buttons removed per user request */}
          </View>
        </View>
      )}
    </EnhancedCard>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>□</Text>
      <Text style={styles.emptyTitle}>No quotes found</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'All' 
          ? 'Quotation system is under maintenance'
          : `No ${activeFilter.toLowerCase()} quotes available`
        }
      </Text>
    </View>
  );

  const renderFilterTab = (filter) => {
    const count = (() => {
      if (filter === 'All') return quotes.length;
      const f = filter.toLowerCase();
      if (['motor','medical','wiba','last expense','travel','personal accident'].includes(f)) {
        return quotes.filter(q => {
          if (f === 'last expense') return q.category === 'LAST_EXPENSE';
          if (f === 'personal accident') return q.category === 'PERSONAL_ACCIDENT';
          return q.category === f.toUpperCase();
        }).length;
      }
      // status based
      return quotes.filter(q => q.status === f).length;
    })();
    
    const isEmpty = filter !== 'All' && count === 0;
    
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterTab,
          activeFilter === filter && styles.activeFilterTab,
          isEmpty && styles.emptyFilterTab
        ]}
        onPress={() => {
          console.log(`🔍 Filter clicked: ${filter}`);
          console.log(`   Matching quotes: ${count}`);
          setActiveFilter(filter);
        }}
      >
        <Text style={[
          styles.filterTabText,
          activeFilter === filter && styles.activeFilterTabText,
          isEmpty && styles.emptyFilterText
        ]}>
          {filter}
        </Text>
        {filter !== 'All' && (
          <View style={[
            styles.filterBadge,
            activeFilter === filter && styles.activeFilterBadge,
            isEmpty && styles.emptyFilterBadge
          ]}>
            <Text style={[
              styles.filterBadgeText,
              activeFilter === filter && styles.activeFilterBadgeText,
              isEmpty && styles.emptyFilterBadgeText
            ]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Removed extra banner to avoid duplicate loading indicators while pull-to-refresh shows state */}

      {/* Spacing after curved header */}
      <View style={styles.headerSpacing} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by registration or quote ID..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map(renderFilterTab)}
        </ScrollView>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{quotes.length}</Text>
            <Text style={styles.statLabel}>Total Quotes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {quotes.filter(q => q.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>
              {quotes.filter(q => q.status === 'paid').length}
            </Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>
              {quotes.filter(q => q.status === 'draft').length}
            </Text>
            <Text style={styles.statLabel}>Draft</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeScreen disableTopPadding>
      <StatusBar style="light" />

      {/* Compact Curved Header */}
      <CompactCurvedHeader 
        title="Quotations"
        subtitle="Manage your insurance quotes"
      />

      {/* Root FlatList for quotations list */}
      <FlatList
        data={loading ? [] : filteredQuotes}
        renderItem={renderQuoteCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={loading ? (
          <View>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          renderEmptyState()
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => handleCreateNewQuote()}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  headerSpacing: {
    height: Spacing.lg,
  },
  searchContainer: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.xs,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginLeft: Spacing.xs,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs,
  },
  activeFilterBadgeText: {
    color: '#FFFFFF',
  },
  // Empty filter styles
  emptyFilterTab: {
    opacity: 0.5,
  },
  emptyFilterText: {
    color: Colors.textSecondary,
  },
  emptyFilterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  emptyFilterBadgeText: {
    color: Colors.textSecondary,
  },
  statsContainer: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.xl,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs,
  },
  quoteCard: {
    marginBottom: Spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  gridItemWrapper: {
    flex: 1,
    maxWidth: '48%',
  },
  gridItemLeft: {
    marginRight: Spacing.xs,
  },
  gridItemRight: {
    marginLeft: Spacing.xs,
  },
  quoteCardExpanded: {
    marginBottom: Spacing.lg,
  },
  compactInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  compactInfoText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs,
  },
  compactInfoDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs,
    marginLeft: Spacing.xs,
  },
  skeletonGrid: {
    paddingHorizontal: Spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  titleBlock: {
    marginTop: Spacing.xs,
  },
  quoteInfo: {
    flex: 1,
  },
  quoteId: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  policyNumber: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  vehicleInfo: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.md,
  },
  registrationNumber: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  registrationPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginTop: 2,
  },
  registrationPillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs,
  },
  productName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.md,
  },
  medicalStatusLine: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs,
    marginBottom: Spacing.xs,
  },
  // Status-specific styles for manual quotes
  statusPending: {
    color: '#FF6B35', // Orange for pending
  },
  statusProcessing: {
    color: '#4A90E2', // Blue for in progress
  },
  statusCompleted: {
    color: '#7ED321', // Green for completed
  },
  statusRejected: {
    color: '#D0021B', // Red for rejected
  },
  quoteActions: {
    alignItems: 'flex-end',
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoItem: {
    flex: 1,
    minWidth: 0, // Allow text to truncate
  },
  infoLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontFamily: Typography.fontFamily.medium,
  },
  infoValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medicalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  medicalDotPending: {
    backgroundColor: '#FFB300', // amber for pending manual pricing (distinct from error red)
  },
  medicalDotProcessed: {
    backgroundColor: '#2E7D32', // green when processed/priced
  },
  premiumAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    lineHeight: Typography.lineHeight.lg,
  },
  noPricingPlaceholder: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: Typography.lineHeight.lg,
  },
  premiumRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  applyPolicyButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyPolicyButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#FFFFFF',
    lineHeight: Typography.lineHeight.sm,
  },
  insuranceProviderRow: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insuranceProviderLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  insuranceProviderValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
    flex: 1,
  },
  expandedContent: {
    marginTop: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
  policyNumberValue: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
  },
  detailItem: {
    width: '48%',
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.xs,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  actionButtonSmall: {
    flex: 1,
    minWidth: '30%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.lg,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.md,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  toast: {
    backgroundColor: '#d1e7dd',
    borderColor: '#badbcc',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  toastText: {
    color: '#0f5132',
    fontFamily: Typography.fontFamily.semiBold,
  },
  infoBanner: {
    backgroundColor: '#e7f1ff',
    borderColor: '#bfd6ff',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  infoBannerText: {
    color: '#084298',
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  startMotorButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  startMotorButtonText: {
    color: '#fff',
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  totalLabel: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    fontSize: Typography.fontSize.lg,
  },
});
